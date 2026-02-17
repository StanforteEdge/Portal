import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: Prisma.FormSubmissionWhereInput = {};
    if (query.form_id) where.formId = String(query.form_id);
    if (query.status) where.status = String(query.status);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.formSubmission.findMany({
        where,
        include: {
          form: true,
          data: true,
          history: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.formSubmission.count({ where })
    ]);

    return {
      data,
      meta: {
        page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage))
      }
    };
  }

  async get(id: string) {
    const doc = await this.prisma.formSubmission.findUnique({
      where: { id },
      include: {
        form: true,
        data: { include: { field: true } },
        history: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(dto: CreateDocumentDto, actorId?: string) {
    const submittedBy = this.parseId(dto.submitted_by_profile_id, 'submitted_by_profile_id');

    const [form, profile, fields] = await this.prisma.$transaction([
      this.prisma.form.findUnique({ where: { id: dto.form_id } }),
      this.prisma.profile.findUnique({ where: { id: submittedBy } }),
      this.prisma.formField.findMany({ where: { formId: dto.form_id } })
    ]);

    if (!form) throw new NotFoundException('Form not found');
    if (!profile) throw new NotFoundException('Submitter profile not found');

    const values = dto.values ?? {};
    const requiredFieldKeys = fields.filter((field) => field.isRequired).map((field) => field.fieldKey);
    for (const key of requiredFieldKeys) {
      if (values[key] === undefined || values[key] === null || values[key] === '') {
        throw new BadRequestException(`Missing required field: ${key}`);
      }
    }

    const submissionNumber = `DOC-${Date.now()}`;

    const created = await this.prisma.formSubmission.create({
      data: {
        formId: form.id,
        submissionNumber,
        submittedByProfileId: submittedBy,
        status: 'submitted'
      }
    });

    for (const field of fields) {
      const rawValue = values[field.fieldKey];
      if (rawValue === undefined || rawValue === null) continue;

      const payload = this.mapFieldValue(field.fieldType, rawValue);
      await this.prisma.formSubmissionData.create({
        data: {
          submissionId: created.id,
          fieldId: field.id,
          fieldKey: field.fieldKey,
          ...payload
        }
      });
    }

    await this.prisma.formSubmissionHistory.create({
      data: {
        submissionId: created.id,
        actionType: 'created',
        performedByProfileId: actorId ? this.parseId(actorId, 'actor_id') : null,
        notes: 'Document created'
      }
    });

    return this.get(created.id);
  }

  async updateStatus(id: string, dto: UpdateDocumentStatusDto, actorId?: string) {
    const existing = await this.prisma.formSubmission.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document not found');

    const updated = await this.prisma.formSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolution_notes,
        resolvedAt: ['resolved', 'approved', 'completed'].includes(dto.status) ? new Date() : null
      }
    });

    await this.prisma.formSubmissionHistory.create({
      data: {
        submissionId: id,
        actionType: 'status_change',
        performedByProfileId: actorId ? this.parseId(actorId, 'actor_id') : null,
        oldValue: existing.status,
        newValue: dto.status,
        notes: dto.resolution_notes
      }
    });

    return updated;
  }

  private mapFieldValue(fieldType: string, value: unknown) {
    const normalizedType = fieldType.toLowerCase();

    if (normalizedType === 'number' || normalizedType === 'currency') {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) throw new BadRequestException(`Expected number for field type ${fieldType}`);
      return { valueNumber: numeric };
    }

    if (normalizedType === 'date') {
      const dt = new Date(String(value));
      if (Number.isNaN(dt.getTime())) throw new BadRequestException('Invalid date value');
      return { valueDate: dt };
    }

    if (normalizedType === 'datetime') {
      const dt = new Date(String(value));
      if (Number.isNaN(dt.getTime())) throw new BadRequestException('Invalid datetime value');
      return { valueDatetime: dt };
    }

    if (normalizedType === 'file' || normalizedType === 'attachment') {
      return { valueFileUrl: String(value) };
    }

    return { valueText: String(value) };
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
