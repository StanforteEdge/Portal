import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { SetPrimaryOrganizationDto } from './dto/set-primary-organization.dto';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [total, active, inactive] = await this.prisma.$transaction([
      this.prisma.profile.count({ where: { type: { in: ['staff', 'employee'] } } }),
      this.prisma.profile.count({ where: { type: { in: ['staff', 'employee'] }, status: 'active' } }),
      this.prisma.profile.count({ where: { type: { in: ['staff', 'employee'] }, status: { not: 'active' } } })
    ]);

    return { total, active, inactive };
  }

  async listEmployees(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: any = {
      type: { in: ['staff', 'employee'] }
    };

    if (query.search) {
      where.OR = [
        { username: { contains: String(query.search), mode: 'insensitive' } },
        { email: { contains: String(query.search), mode: 'insensitive' } },
        { firstName: { contains: String(query.search), mode: 'insensitive' } },
        { lastName: { contains: String(query.search), mode: 'insensitive' } }
      ];
    }

    if (query.status) where.status = String(query.status);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        include: {
          primaryOrganization: true,
          roles: { include: { role: true, organization: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.profile.count({ where })
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

  async getEmployee(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: this.parseId(id, 'employee id') },
      include: {
        primaryOrganization: true,
        organizations: { include: { organization: true } },
        roles: { include: { role: true, organization: true } }
      }
    });

    if (!profile || !['staff', 'employee'].includes(profile.type)) {
      throw new NotFoundException('Employee not found');
    }

    return profile;
  }

  async setPrimaryOrganization(id: string, dto: SetPrimaryOrganizationDto) {
    const profileId = this.parseId(id, 'employee id');
    const organizationId = this.parseId(dto.organization_id, 'organization id');

    const [profile, organization] = await this.prisma.$transaction([
      this.prisma.profile.findUnique({ where: { id: profileId } }),
      this.prisma.organization.findUnique({ where: { id: organizationId } })
    ]);

    if (!profile || !['staff', 'employee'].includes(profile.type)) {
      throw new NotFoundException('Employee not found');
    }
    if (!organization) throw new NotFoundException('Organization not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.profileOrganization.updateMany({
        where: { profileId, isPrimary: true },
        data: { isPrimary: false }
      });

      const existing = await tx.profileOrganization.findFirst({
        where: { profileId, organizationId }
      });

      if (existing) {
        await tx.profileOrganization.update({
          where: { id: existing.id },
          data: { isPrimary: true }
        });
      } else {
        await tx.profileOrganization.create({
          data: {
            profileId,
            organizationId,
            isPrimary: true,
            createdAt: new Date()
          }
        });
      }

      await tx.profile.update({
        where: { id: profileId },
        data: { primaryOrganizationId: organizationId }
      });
    });

    return this.getEmployee(id);
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
