import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AttachFileDto } from './dto/attach-file.dto';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: any = {
      valueFileUrl: { not: null }
    };

    if (query.form_id) {
      where.submission = { formId: String(query.form_id) };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.formSubmissionData.findMany({
        where,
        include: {
          field: true,
          submission: {
            select: {
              id: true,
              formId: true,
              submissionNumber: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.formSubmissionData.count({ where })
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

  async attach(dto: AttachFileDto) {
    const [submission, field] = await this.prisma.$transaction([
      this.prisma.formSubmission.findUnique({ where: { id: dto.submission_id } }),
      this.prisma.formField.findUnique({ where: { id: dto.field_id } })
    ]);

    if (!submission) throw new NotFoundException('Submission not found');
    if (!field) throw new NotFoundException('Field not found');
    if (submission.formId !== field.formId) {
      throw new BadRequestException('Field does not belong to the submission form');
    }

    const row = await this.prisma.formSubmissionData.upsert({
      where: {
        unique_submission_field: {
          submissionId: dto.submission_id,
          fieldId: dto.field_id
        }
      },
      update: {
        valueFileUrl: dto.file_url,
        fieldKey: field.fieldKey
      },
      create: {
        submissionId: dto.submission_id,
        fieldId: dto.field_id,
        fieldKey: field.fieldKey,
        valueFileUrl: dto.file_url
      }
    });

    return row;
  }
}
