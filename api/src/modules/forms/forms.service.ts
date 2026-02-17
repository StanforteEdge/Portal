import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.form.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFormById(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: { fields: true }
    });

    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async validateRequestTypePayload(requestTypeId: string, data: Record<string, unknown>) {
    const requestType = await this.prisma.requestType.findUnique({
      where: { id: requestTypeId },
      select: { id: true, storageType: true, formId: true, isActive: true }
    });

    if (!requestType || !requestType.isActive) {
      throw new BadRequestException('Invalid request type');
    }

    if ((requestType.storageType ?? 'form') !== 'form') return;
    if (!requestType.formId) {
      throw new BadRequestException('Form-backed request type is missing form binding');
    }

    const form = await this.prisma.form.findUnique({
      where: { id: requestType.formId },
      include: { fields: true }
    });

    if (!form || !form.isActive) {
      throw new BadRequestException('Assigned form is inactive or missing');
    }

    const requiredFields = form.fields.filter((field) => field.isRequired);
    const missing = requiredFields
      .filter((field) => {
        const value = data[field.fieldKey];
        if (value === undefined || value === null) return true;
        if (typeof value === 'string' && value.trim().length === 0) return true;
        return false;
      })
      .map((field) => field.fieldKey);

    if (missing.length > 0) {
      throw new BadRequestException(`Missing required form fields: ${missing.join(', ')}`);
    }
  }
}
