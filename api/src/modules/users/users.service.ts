import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { randomToken, sha256 } from '../../common/utils/crypto';
import { MailService } from '../../common/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  async getMyProfile(profileId: string) {
    const user = await this.prisma.profile.findUnique({
      where: { id: toBigInt(profileId) },
      include: {
        organizations: {
          include: { organization: true }
        }
      }
    });

    if (!user) throw new NotFoundException('Profile not found');
    return this.serializeProfile(user);
  }

  async updateMyProfile(profileId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { id: toBigInt(profileId) }
    });
    if (!existing) throw new NotFoundException('Profile not found');

    const updated = await this.prisma.profile.update({
      where: { id: existing.id },
      data: {
        firstName: dto.first_name ?? existing.firstName,
        lastName: dto.last_name ?? existing.lastName,
        dateOfBirth: dto.date_of_birth ? new Date(dto.date_of_birth) : existing.dateOfBirth,
        gender: dto.gender ?? existing.gender,
        phone: dto.phone ?? existing.phone,
        address: dto.address ?? existing.address,
        nationality: dto.nationality ?? existing.nationality,
        state: dto.state ?? existing.state,
        lga: dto.lga ?? existing.lga,
        maritalStatus: dto.marital_status ?? existing.maritalStatus,
        avatar: dto.avatar ?? existing.avatar,
        bio: dto.bio ?? existing.bio,
        occupation: dto.occupation ?? existing.occupation,
        email: dto.email ? dto.email.trim().toLowerCase() : existing.email
      },
      include: {
        organizations: {
          include: { organization: true }
        }
      }
    });
    return this.serializeProfile(updated);
  }

  async listUsers(filters: Record<string, any>) {
    const page = Number(filters.page ?? 1);
    const perPage = Number(filters.per_page ?? 15);
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
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

  async createUser(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.profile.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already exists');

    const usernameExists = await this.prisma.profile.findUnique({
      where: { username: dto.username }
    });
    if (usernameExists) throw new BadRequestException('Username already exists');

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;
    const roleSlugs = Array.from(new Set(dto.roles?.map((r) => r.trim()).filter(Boolean) ?? []));

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.profile.create({
        data: {
          username: dto.username,
          email,
          passwordHash,
          type: dto.type ?? 'staff',
          status: 'active',
          firstName: dto.first_name,
          lastName: dto.last_name
        }
      });

      if (roleSlugs.length > 0) {
        const roles = await tx.role.findMany({
          where: { slug: { in: roleSlugs }, isActive: true },
          select: { id: true, slug: true }
        });
        if (roles.length !== roleSlugs.length) {
          const found = new Set(roles.map((r) => r.slug));
          const missing = roleSlugs.filter((slug) => !found.has(slug));
          throw new BadRequestException(`Unknown role(s): ${missing.join(', ')}`);
        }

        await tx.userRole.createMany({
          data: roles.map((role, index) => ({
            profileId: user.id,
            roleId: role.id,
            organizationId: null,
            isPrimaryRole: index === 0
          })),
          skipDuplicates: true
        });
      }

      return user;
    });
  }

  async getUserRoles(userId: string) {
    const profileId = toBigInt(userId);
    const user = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, email: true, username: true }
    });
    if (!user) throw new NotFoundException('User not found');

    const userRoles = await this.prisma.userRole.findMany({
      where: { profileId },
      include: { role: true },
      orderBy: [{ isPrimaryRole: 'desc' }, { assignedAt: 'asc' }]
    });

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username
      },
      roles: userRoles.map((row) => ({
        id: row.role.id.toString(),
        slug: row.role.slug,
        name: row.role.name,
        is_primary: row.isPrimaryRole
      }))
    };
  }

  async setUserRoles(userId: string, dto: AssignUserRolesDto) {
    const profileId = toBigInt(userId);
    const user = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, email: true, username: true }
    });
    if (!user) throw new NotFoundException('User not found');

    const roleSlugs = Array.from(new Set(dto.roles.map((r) => r.trim()).filter(Boolean)));
    if (roleSlugs.length === 0) {
      throw new BadRequestException('At least one role is required');
    }

    const roles = await this.prisma.role.findMany({
      where: { slug: { in: roleSlugs }, isActive: true },
      select: { id: true, slug: true, name: true }
    });

    if (roles.length !== roleSlugs.length) {
      const found = new Set(roles.map((r) => r.slug));
      const missing = roleSlugs.filter((slug) => !found.has(slug));
      throw new BadRequestException(`Unknown role(s): ${missing.join(', ')}`);
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { profileId } }),
      this.prisma.userRole.createMany({
        data: roles.map((role, index) => ({
          profileId,
          roleId: role.id,
          organizationId: null,
          isPrimaryRole: index === 0
        })),
        skipDuplicates: true
      })
    ]);

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username
      },
      roles: roles.map((role, index) => ({
        id: role.id.toString(),
        slug: role.slug,
        name: role.name,
        is_primary: index === 0
      }))
    };
  }

  async inviteUser(userId: string, dto: InviteUserDto) {
    const profileId = toBigInt(userId);
    const user = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    if (!user) throw new NotFoundException('User not found');

    const inviteToken = randomToken(32);
    const tokenHash = sha256(inviteToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.prisma.$transaction([
      this.prisma.token.deleteMany({
        where: { profileId: user.id, type: 'invite' }
      }),
      this.prisma.token.create({
        data: {
          id: randomToken(24),
          profileId: user.id,
          type: 'invite',
          tokenHash,
          expiresAt
        }
      }),
      this.prisma.profile.update({
        where: { id: user.id },
        data: { status: 'invited' }
      })
    ]);

    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
    const displayName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

    await this.mailService.send({
      to: user.email,
      subject: 'You are invited to StanforteEdge Portal',
      text: `${displayName},\n\nYou have been invited to StanforteEdge Portal. Set up your password here:\n${inviteLink}\n\n${dto.message ?? ''}`.trim(),
      html: `<p>Hello ${displayName},</p><p>You have been invited to StanforteEdge Portal. Set up your password here:</p><p><a href="${inviteLink}">${inviteLink}</a></p>${dto.message ? `<p>${dto.message}</p>` : ''}`,
      threadKey: `invite-${user.id.toString()}`,
      userId: user.id
    });

    return {
      success: true,
      expires_at: expiresAt.toISOString()
    };
  }

  private serializeProfile(user: any): ProfileResponseDto {
    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      type: user.type,
      status: user.status,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
      primary_organization_id: user.primaryOrganizationId ? user.primaryOrganizationId.toString() : null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      organizations: (user.organizations ?? []).map((item: any) => ({
        id: item.organization.id.toString(),
        name: item.organization.name,
        code: item.organization.code,
        is_primary: item.isPrimary
      }))
    };
  }
}
