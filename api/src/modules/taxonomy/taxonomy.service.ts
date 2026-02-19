import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { SyncTaxonomyTermsDto } from './dto/sync-taxonomy-terms.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { UpdateFieldOptionsDto } from './dto/update-field-options.dto';

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const includeInactive = query.include_inactive === 'true';

    const [requestGroups, requestTypes, formFields] = await this.prisma.$transaction([
      this.prisma.requestGroup.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' }
      }),
      this.prisma.requestType.findMany({
        where: {
          ...(includeInactive ? {} : { isActive: true }),
          ...(query.group_id ? { groupId: String(query.group_id) } : {})
        },
        orderBy: { name: 'asc' }
      }),
      this.prisma.formField.findMany({
        where: {
          fieldType: { in: ['select', 'radio', 'checkbox', 'multiselect'] }
        },
        include: { form: { select: { id: true, name: true } } },
        orderBy: [{ form: { name: 'asc' } }, { displayOrder: 'asc' }]
      })
    ]);

    return {
      request_groups: requestGroups,
      request_types: requestTypes,
      form_field_taxonomies: formFields.map((field) => ({
        id: field.id,
        form_id: field.form.id,
        form_name: field.form.name,
        field_key: field.fieldKey,
        field_label: field.fieldLabel,
        field_type: field.fieldType,
        options: this.normalizeOptions(field.fieldOptions)
      }))
    };
  }

  async listTaxonomies(query: Record<string, any>) {
    const includeInactive = query.include_inactive === 'true';
    const moduleFilter = query.module ? String(query.module) : undefined;

    return this.prisma.taxonomy.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(moduleFilter ? { module: moduleFilter } : {})
      },
      include: {
        terms: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }]
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createTaxonomy(dto: CreateTaxonomyDto) {
    const key = dto.key.trim().toLowerCase().replace(/\s+/g, '_');
    return this.prisma.taxonomy.create({
      data: {
        key,
        name: dto.name.trim(),
        description: dto.description,
        module: dto.module,
        isActive: dto.is_active ?? true
      },
      include: { terms: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } }
    });
  }

  async updateTaxonomy(id: string, dto: UpdateTaxonomyDto) {
    const existing = await this.prisma.taxonomy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Taxonomy not found');

    return this.prisma.taxonomy.update({
      where: { id },
      data: {
        key: dto.key ? dto.key.trim().toLowerCase().replace(/\s+/g, '_') : undefined,
        name: dto.name?.trim(),
        description: dto.description,
        module: dto.module,
        isActive: dto.is_active
      },
      include: { terms: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } }
    });
  }

  async syncTerms(taxonomyId: string, dto: SyncTaxonomyTermsDto) {
    const taxonomy = await this.prisma.taxonomy.findUnique({ where: { id: taxonomyId } });
    if (!taxonomy) throw new NotFoundException('Taxonomy not found');

    const terms = dto.terms
      .map((term) => term.trim())
      .filter((term, index, all) => term.length > 0 && all.indexOf(term) === index);

    await this.prisma.$transaction(async (tx) => {
      await tx.taxonomyTerm.deleteMany({ where: { taxonomyId } });
      if (terms.length > 0) {
        await tx.taxonomyTerm.createMany({
          data: terms.map((term, index) => ({
            taxonomyId,
            value: term.toLowerCase().replace(/\s+/g, '_'),
            label: term,
            sortOrder: index,
            isActive: true
          }))
        });
      }
    });

    return this.prisma.taxonomy.findUnique({
      where: { id: taxonomyId },
      include: { terms: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } }
    });
  }

  async updateFieldOptions(fieldId: string, dto: UpdateFieldOptionsDto) {
    const field = await this.prisma.formField.findUnique({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Form field not found');

    if (!['select', 'radio', 'checkbox', 'multiselect'].includes(field.fieldType)) {
      throw new BadRequestException('Field does not support options taxonomy');
    }

    const options = dto.options
      .map((option) => option.trim())
      .filter((option, index, arr) => option.length > 0 && arr.indexOf(option) === index);

    const updated = await this.prisma.formField.update({
      where: { id: fieldId },
      data: {
        fieldOptions: options as Prisma.InputJsonValue
      },
      include: {
        form: { select: { id: true, name: true } }
      }
    });

    return {
      id: updated.id,
      form_id: updated.form.id,
      form_name: updated.form.name,
      field_key: updated.fieldKey,
      field_label: updated.fieldLabel,
      field_type: updated.fieldType,
      options
    };
  }

  private normalizeOptions(fieldOptions: Prisma.JsonValue | null): string[] {
    if (Array.isArray(fieldOptions)) {
      return fieldOptions.filter((value): value is string => typeof value === 'string');
    }

    if (fieldOptions && typeof fieldOptions === 'object') {
      const values = (fieldOptions as Record<string, unknown>).options;
      if (Array.isArray(values)) {
        return values.filter((value): value is string => typeof value === 'string');
      }
    }

    return [];
  }
}
