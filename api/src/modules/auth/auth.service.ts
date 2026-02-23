import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { sha256, randomToken } from '../../common/utils/crypto';
import { toBigInt } from '../../common/utils/ids';
import { AuthStatusResponseDto, LoginResponseDto } from './dto/auth-response.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { MailService } from '../../common/mail/mail.service';

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailService: MailService
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const organizationCode = dto.organization?.trim();
    const profile = await this.prisma.profile.findUnique({ where: { email } });
    if (!profile || profile.status !== 'active') throw new UnauthorizedException('Invalid credentials');
    if (!profile.passwordHash) throw new UnauthorizedException('Password not set');

    const organization = await this.resolveLoginOrganization(profile.id, profile.primaryOrganizationId, email, organizationCode);
    if (!organization) throw new UnauthorizedException('Invalid organization for this account');

    const primaryOrgId = profile.primaryOrganizationId;
    if (primaryOrgId) {
      const primaryOrg = await this.prisma.organization.findUnique({
        where: { id: primaryOrgId },
        select: { metadata: true }
      });
      const domains = this.extractAllowedLoginDomains(primaryOrg?.metadata);
      if (domains.length > 0) {
        const domain = email.split('@')[1]?.toLowerCase() ?? '';
        if (!domains.includes(domain)) {
          throw new UnauthorizedException('Primary login email must match organization domain policy');
        }
      }
    }

    const ok = await bcrypt.compare(dto.password, profile.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const authContext = await this.buildAuthContext(profile.id);
    const tokens = await this.issueTokens(profile.id, authContext.permissions, authContext.roles);

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { lastLogin: new Date() }
    });

    return {
      user: {
        id: profile.id.toString(),
        email: profile.email,
        username: profile.username,
        organization: {
          id: organization.id.toString(),
          name: organization.name,
          code: organization.code
        },
        roles: authContext.roles,
        permissions: authContext.permissions
      },
      ...tokens
    };
  }

  private extractAllowedLoginDomains(metadata: unknown): string[] {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
    const value = (metadata as Record<string, unknown>).login_email_domains;
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => String(entry || '').trim().toLowerCase())
      .filter(Boolean);
  }

  private async resolveLoginOrganization(
    profileId: bigint,
    primaryOrganizationId: bigint | null,
    email: string,
    organizationCode?: string
  ): Promise<{ id: bigint; name: string; code: string; metadata: unknown } | null> {
    if (organizationCode) {
      const org = await this.prisma.organization.findFirst({
        where: { code: { equals: organizationCode, mode: 'insensitive' } },
        select: { id: true, name: true, code: true, metadata: true }
      });
      if (!org) return null;
      const membership = await this.prisma.profileOrganization.findFirst({
        where: { profileId, organizationId: org.id },
        select: { id: true }
      });
      if (!membership && primaryOrganizationId !== org.id) return null;
      return org;
    }

    const domain = email.split('@')[1]?.toLowerCase() ?? '';

    if (primaryOrganizationId) {
      const primary = await this.prisma.organization.findUnique({
        where: { id: primaryOrganizationId },
        select: { id: true, name: true, code: true, metadata: true }
      });
      if (primary) {
        const domains = this.extractAllowedLoginDomains(primary.metadata);
        if (domains.length === 0 || domains.includes(domain)) return primary;
      }
    }

    const memberships = await this.prisma.profileOrganization.findMany({
      where: { profileId },
      select: {
        organization: { select: { id: true, name: true, code: true, metadata: true } }
      }
    });
    const candidates = memberships
      .map((entry) => entry.organization)
      .filter((org) => {
        const domains = this.extractAllowedLoginDomains(org.metadata);
        return domains.length === 0 || domains.includes(domain);
      });

    if (candidates.length === 1) return candidates[0];
    return null;
  }

  async status(userId: string): Promise<AuthStatusResponseDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: toBigInt(userId) },
      include: { onboardingProgress: true }
    });
    if (!profile) throw new NotFoundException('User not found');
    const authContext = await this.buildAuthContext(profile.id);
    return {
      id: profile.id.toString(),
      email: profile.email,
      username: profile.username,
      status: profile.status,
      roles: authContext.roles,
      permissions: authContext.permissions,
      onboarding_status: profile.onboardingProgress?.status
    };
  }

  async logout(userId: string) {
    await this.prisma.token.deleteMany({ where: { profileId: toBigInt(userId), type: 'refresh' } });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.confirm_password && dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    const profile = await this.prisma.profile.findUnique({ where: { id: toBigInt(userId) } });
    if (!profile || !profile.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.current_password, profile.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const newHash = await bcrypt.hash(dto.new_password, 12);
    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { passwordHash: newHash }
    });

    await this.prisma.token.deleteMany({ where: { profileId: profile.id } });

    return { success: true };
  }

  async refresh(dto: RefreshDto) {
    const tokenHash = sha256(dto.refresh_token);
    const tokenRow = await this.prisma.token.findFirst({
      where: { tokenHash, type: 'refresh' }
    });

    if (!tokenRow) throw new UnauthorizedException('Invalid refresh token');
    if (tokenRow.expiresAt.getTime() < Date.now()) {
      await this.prisma.token.delete({ where: { id: tokenRow.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const authContext = await this.buildAuthContext(tokenRow.profileId);

    // Rotate refresh token
    await this.prisma.token.delete({ where: { id: tokenRow.id } });
    const tokens = await this.issueTokens(tokenRow.profileId, authContext.permissions, authContext.roles);

    return tokens;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const profile = await this.prisma.profile.findUnique({ where: { email } });
    if (!profile) return { success: true };

    const resetToken = randomToken(32);
    const tokenHash = sha256(resetToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.$transaction([
      this.prisma.token.deleteMany({
        where: { profileId: profile.id, type: 'reset' }
      }),
      this.prisma.token.create({
        data: {
          id: randomToken(24),
          profileId: profile.id,
          type: 'reset',
          tokenHash,
          expiresAt
        }
      })
    ]);

    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.mailService.send({
      to: profile.email,
      subject: 'Reset your StanforteEdge password',
      text: `Use this link to reset your password: ${resetLink}`,
      html: `<p>Use this link to reset your password:</p><p><a href=\"${resetLink}\">${resetLink}</a></p>`,
      threadKey: `auth-reset-${profile.id.toString()}`,
      userId: profile.id
    });
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = sha256(dto.token);
    const tokenRow = await this.prisma.token.findFirst({
      where: { tokenHash, type: 'reset' }
    });

    if (!tokenRow) throw new UnauthorizedException('Invalid reset token');
    if (tokenRow.expiresAt.getTime() < Date.now()) {
      await this.prisma.token.delete({ where: { id: tokenRow.id } });
      throw new UnauthorizedException('Reset token expired');
    }

    const newHash = await bcrypt.hash(dto.new_password, 12);

    await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { id: tokenRow.profileId },
        data: { passwordHash: newHash }
      }),
      this.prisma.token.deleteMany({ where: { profileId: tokenRow.profileId } })
    ]);

    return { success: true };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    if (dto.confirm_password && dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = sha256(dto.token);
    const tokenRow = await this.prisma.token.findFirst({
      where: { tokenHash, type: 'invite' }
    });

    if (!tokenRow) throw new UnauthorizedException('Invalid invite token');
    if (tokenRow.expiresAt.getTime() < Date.now()) {
      await this.prisma.token.delete({ where: { id: tokenRow.id } });
      throw new UnauthorizedException('Invite token expired');
    }

    const passwordHash = await bcrypt.hash(dto.new_password, 12);
    await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { id: tokenRow.profileId },
        data: { passwordHash, status: 'active' }
      }),
      this.prisma.onboardingProgress.upsert({
        where: { userId: tokenRow.profileId },
        update: { status: 'accepted', currentStep: 'profile' },
        create: { userId: tokenRow.profileId, status: 'accepted', currentStep: 'profile' }
      }),
      this.prisma.token.deleteMany({
        where: {
          profileId: tokenRow.profileId,
          type: { in: ['invite'] }
        }
      })
    ]);

    return { success: true };
  }

  async validateJwtPayload(payload: any) {
    const profileId = payload?.sub ? toBigInt(payload.sub) : null;
    if (!profileId) return null;

    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || profile.status !== 'active') return null;

    // Always resolve fresh roles/permissions from DB so RBAC changes apply immediately
    // without forcing users to re-login and re-issue tokens.
    const roles = await this.getUserRoles(profileId);
    const permissions = await this.getUserPermissions(profileId, roles);

    return {
      id: profile.id.toString(),
      email: profile.email,
      username: profile.username,
      permissions,
      roles
    };
  }

  private async issueTokens(profileId: bigint, permissions: string[], roles: string[]) {
    const accessPayload = {
      sub: profileId.toString(),
      permissions,
      roles
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: process.env.JWT_SECRET || 'change-me',
      expiresIn: ACCESS_EXPIRES_IN
    });

    const refreshToken = randomToken(48);
    const tokenHash = sha256(refreshToken);
    const expiresAt = this.parseExpiresIn(REFRESH_EXPIRES_IN);

    await this.prisma.token.create({
      data: {
        id: randomToken(24),
        profileId,
        type: 'refresh',
        tokenHash,
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_EXPIRES_IN
    };
  }

  private parseExpiresIn(expires: string): Date {
    const match = expires.match(/(\d+)([smhd])/);
    if (!match) return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const value = Number(match[1]);
    const unit = match[2];
    const ms =
      unit === 's'
        ? value * 1000
        : unit === 'm'
        ? value * 1000 * 60
        : unit === 'h'
        ? value * 1000 * 60 * 60
        : value * 1000 * 60 * 60 * 24;
    return new Date(Date.now() + ms);
  }

  private async buildAuthContext(profileId: bigint) {
    const roles = await this.getUserRoles(profileId);
    const permissions = await this.getUserPermissions(profileId, roles);
    return { roles, permissions };
  }

  private async getUserRoles(profileId: bigint): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { profileId },
      include: { role: true }
    });
    return roles.map((r) => r.role.slug);
  }

  private async getUserPermissions(profileId: bigint, roles?: string[]): Promise<string[]> {
    const roleSlugs = roles ?? (await this.getUserRoles(profileId));
    if (roleSlugs.includes('administrator') || roleSlugs.includes('admin')) return ['*'];

    const roleIds = await this.prisma.role.findMany({
      where: { slug: { in: roleSlugs } },
      select: { id: true }
    });

    if (roleIds.length === 0) return [];

    const perms = await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds.map((r) => r.id) } },
      include: { permission: true }
    });

    const slugs = perms.map((p) => p.permission.slug);
    return Array.from(new Set(slugs));
  }
}
