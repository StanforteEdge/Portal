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

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const profile = await this.prisma.profile.findUnique({ where: { email } });
    if (!profile || profile.status !== 'active') throw new UnauthorizedException('Invalid credentials');
    if (!profile.passwordHash) throw new UnauthorizedException('Password not set');

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
        roles: authContext.roles,
        permissions: authContext.permissions
      },
      ...tokens
    };
  }

  async status(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id: toBigInt(userId) } });
    if (!profile) throw new NotFoundException('User not found');
    const authContext = await this.buildAuthContext(profile.id);
    return {
      id: profile.id.toString(),
      email: profile.email,
      username: profile.username,
      status: profile.status,
      roles: authContext.roles,
      permissions: authContext.permissions
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

    // TODO: send resetToken via email
    void resetToken;
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

  async validateJwtPayload(payload: any) {
    const profileId = payload?.sub ? toBigInt(payload.sub) : null;
    if (!profileId) return null;

    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || profile.status !== 'active') return null;

    const permissions = payload.permissions ?? (await this.getUserPermissions(profileId));
    const roles = payload.roles ?? (await this.getUserRoles(profileId));

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
