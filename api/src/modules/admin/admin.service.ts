import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { generateUniqueUsername, makeUsernameSeed } from '../../common/utils/username';
import { paginatedResponse } from '../../common/helpers/paginated-response';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(filters: Record<string, any>) {
    const page = Math.max(1, Number(filters.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(filters.per_page ?? 20)));
    const skip = (page - 1) * perPage;

    const where: {
      type?: string;
      status?: string;
      OR?: Array<
        | { username: { contains: string; mode: 'insensitive' } }
        | { email: { contains: string; mode: 'insensitive' } }
        | { firstName: { contains: string; mode: 'insensitive' } }
        | { lastName: { contains: string; mode: 'insensitive' } }
      >;
    } = {};

    if (filters.type) where.type = String(filters.type);
    if (filters.status) where.status = String(filters.status);
    if (filters.search) {
      const search = String(filters.search);
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        include: {
          roles: {
            include: {
              role: { select: { id: true, name: true, slug: true } },
              organization: { select: { id: true, name: true, code: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage
      }),
      this.prisma.profile.count({ where })
    ]);

    return paginatedResponse(users.map((user) => this.serializeUser(user)), { page, per_page: perPage, total });
  }

  async getUser(profileId: string) {
    const id = this.parseId(profileId, 'profile id');
    const user = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        organizations: { include: { organization: true } },
        roles: {
          include: {
            role: true,
            organization: true
          }
        }
      }
    });

    if (!user) throw new NotFoundException('Profile not found');
    return this.serializeUser(user);
  }

  async createUser(dto: CreateAdminUserDto) {
    const email = dto.email.trim().toLowerCase();
    const requestedUsername = dto.username?.trim();
    const username = requestedUsername
      ? requestedUsername
      : await generateUniqueUsername(
          makeUsernameSeed(dto.first_name, dto.last_name, email.split('@')[0]),
          async (candidate) =>
            Boolean(await this.prisma.profile.findFirst({ where: { username: candidate } }))
        );

    const checks = [this.prisma.profile.findUnique({ where: { email } })] as const;
    const emailExists = await checks[0];
    const usernameExists = requestedUsername
      ? await this.prisma.profile.findFirst({ where: { username } })
      : null;

    if (emailExists) throw new BadRequestException('Email already exists');
    if (usernameExists) throw new BadRequestException('Username already exists');

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;
    const userType = dto.type ?? 'staff';
    const orgInput = dto.primary_organization_id ?? dto.organization_id;
    let primaryOrganizationId: bigint | null = null;
    if (orgInput !== undefined) {
      const trimmed = String(orgInput).trim();
      if (trimmed) {
        try {
          primaryOrganizationId = toBigInt(trimmed);
        } catch {
          throw new BadRequestException('Invalid primary organization id');
        }
      }
    }
    if (['staff', 'employee'].includes(userType) && !primaryOrganizationId) {
      throw new BadRequestException('Primary organization is required for staff');
    }
    if (primaryOrganizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: primaryOrganizationId },
        select: { id: true }
      });
      if (!organization) throw new BadRequestException('Organization not found');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.profile.create({
        data: {
          username,
          email,
          passwordHash,
          firstName: dto.first_name,
          lastName: dto.last_name,
          type: userType,
          status: dto.status ?? 'active',
          primaryOrganizationId
        }
      });

      if (primaryOrganizationId) {
        await tx.profileOrganization.upsert({
          where: {
            profile_org_unique: {
              profileId: created.id,
              organizationId: primaryOrganizationId
            }
          },
          update: { isPrimary: true },
          create: {
            profileId: created.id,
            organizationId: primaryOrganizationId,
            isPrimary: true,
            createdAt: new Date()
          }
        });
      }

      return tx.profile.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          organizations: { include: { organization: true } },
          roles: {
            include: {
              role: true,
              organization: true
            }
          }
        }
      });
    });

    return this.serializeUser(user);
  }

  async updateUser(profileId: string, dto: UpdateAdminUserDto) {
    const id = this.parseId(profileId, 'profile id');
    const existing = await this.prisma.profile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Profile not found');

    const data: {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      type?: string;
      status?: string;
      primaryOrganizationId?: bigint | null;
      passwordHash?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (dto.username && dto.username !== existing.username) {
      const usernameExists = await this.prisma.profile.findUnique({ where: { username: dto.username } });
      if (usernameExists) throw new BadRequestException('Username already exists');
      data.username = dto.username;
    }

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      if (email !== existing.email) {
        const emailExists = await this.prisma.profile.findUnique({ where: { email } });
        if (emailExists) throw new BadRequestException('Email already exists');
      }
      data.email = email;
    }

    if (dto.first_name !== undefined) data.firstName = dto.first_name;
    if (dto.last_name !== undefined) data.lastName = dto.last_name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

    const orgInput = dto.primary_organization_id ?? dto.organization_id;
    let nextPrimaryOrganizationId = existing.primaryOrganizationId;
    if (orgInput !== undefined) {
      const trimmed = String(orgInput).trim();
      if (!trimmed) {
        nextPrimaryOrganizationId = null;
      } else {
        try {
          nextPrimaryOrganizationId = toBigInt(trimmed);
        } catch {
          throw new BadRequestException('Invalid primary organization id');
        }
      }
      data.primaryOrganizationId = nextPrimaryOrganizationId;
    }

    const nextType = dto.type ?? existing.type;
    if (['staff', 'employee'].includes(nextType) && !nextPrimaryOrganizationId) {
      throw new BadRequestException('Primary organization is required for staff');
    }

    if (nextPrimaryOrganizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: nextPrimaryOrganizationId },
        select: { id: true }
      });
      if (!organization) throw new BadRequestException('Organization not found');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.profile.update({
        where: { id },
        data
      });

      if (orgInput !== undefined) {
        await tx.profileOrganization.updateMany({
          where: { profileId: id },
          data: { isPrimary: false }
        });
        if (nextPrimaryOrganizationId) {
          await tx.profileOrganization.upsert({
            where: {
              profile_org_unique: {
                profileId: id,
                organizationId: nextPrimaryOrganizationId
              }
            },
            update: { isPrimary: true },
            create: {
              profileId: id,
              organizationId: nextPrimaryOrganizationId,
              isPrimary: true,
              createdAt: new Date()
            }
          });
        }
      }

      return tx.profile.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
          organizations: { include: { organization: true } },
          roles: {
            include: {
              role: true,
              organization: true
            }
          }
        }
      });
    });

    return this.serializeUser(user);
  }

  async updateStatus(profileId: string, dto: UpdateUserStatusDto) {
    const id = this.parseId(profileId, 'profile id');
    const existing = await this.prisma.profile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Profile not found');

    const user = await this.prisma.profile.update({
      where: { id },
      data: {
        status: dto.status,
        updatedAt: new Date()
      },
      include: {
        roles: {
          include: {
            role: true,
            organization: true
          }
        }
      }
    });

    return this.serializeUser(user);
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private serializeUser(user: any) {
    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      type: user.type,
      status: user.status,
      phone: user.phone,
      avatar: user.avatar,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      primary_organization_id: user.primaryOrganizationId ? user.primaryOrganizationId.toString() : null,
      roles: (user.roles ?? []).map((userRole: any) => ({
        id: userRole.role.id.toString(),
        name: userRole.role.name,
        slug: userRole.role.slug,
        is_primary_role: userRole.isPrimaryRole,
        organization: userRole.organization
          ? {
              id: userRole.organization.id.toString(),
              name: userRole.organization.name,
              code: userRole.organization.code
            }
          : null
      })),
      organizations: (user.organizations ?? []).map((membership: any) => ({
        id: membership.organization.id.toString(),
        name: membership.organization.name,
        code: membership.organization.code,
        type: membership.organization.organizationType,
        is_active: membership.organization.isActive
      }))
    };
  }

  async createBulkUsers(users: CreateAdminUserDto[]) {
    let successCount = 0;
    let failedCount = 0;
    const results: { identifier: string; status: "success" | "failed"; error?: string }[] = [];

    for (const userDto of users) {
      const identifier = userDto.email || `${userDto.first_name || ''} ${userDto.last_name || ''}`.trim() || 'Unknown';
      try {
        await this.createUser(userDto);
        successCount++;
        results.push({ identifier, status: "success" });
      } catch (err: any) {
        failedCount++;
        results.push({
          identifier,
          status: "failed",
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return {
      successCount,
      failedCount,
      results
    };
  }
}
