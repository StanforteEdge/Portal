import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(includeInactive = false) {
    const [roles, permissions, usersWithRoles] = await this.prisma.$transaction([
      this.prisma.role.count({ where: includeInactive ? {} : { isActive: true } }),
      this.prisma.permission.count(),
      this.prisma.userRole.groupBy({ by: ['profileId'], orderBy: { profileId: 'asc' } })
    ]);

    return {
      roles,
      permissions,
      assigned_users: usersWithRoles.length
    };
  }

  async listRoles(includeInactive = false) {
    const roles = await this.prisma.role.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        permissions: { include: { permission: true } },
        users: {
          include: {
            profile: { select: { id: true, email: true, username: true } },
            organization: { select: { id: true, name: true, code: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return roles.map((role) => ({
      id: role.id.toString(),
      name: role.name,
      slug: role.slug,
      description: role.description,
      is_active: role.isActive,
      created_at: role.createdAt,
      updated_at: role.updatedAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id.toString(),
        name: rp.permission.name,
        slug: rp.permission.slug,
        module: rp.permission.module
      })),
      users: role.users.map((userRole) => ({
        profile_id: userRole.profile.id.toString(),
        email: userRole.profile.email,
        username: userRole.profile.username,
        organization: userRole.organization
          ? {
              id: userRole.organization.id.toString(),
              name: userRole.organization.name,
              code: userRole.organization.code
            }
          : null,
        is_primary_role: userRole.isPrimaryRole
      }))
    }));
  }

  async createRole(dto: CreateRoleDto) {
    const slug = this.normalizeSlug(dto.slug ?? dto.name);
    await this.ensureRoleSlugAvailable(slug);

    const permissionIds = this.parseIds(dto.permission_ids ?? [], 'permission id');
    if (permissionIds.length > 0) {
      await this.ensurePermissionsExist(permissionIds);
    }

    const now = new Date();
    const role = await this.prisma.role.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description,
        isActive: dto.is_active ?? true,
        createdAt: now,
        updatedAt: now
      }
    });

    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true
      });
    }

    return this.getRoleById(role.id);
  }

  async updateRole(roleId: string, dto: UpdateRoleDto) {
    const id = this.parseId(roleId, 'role id');
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Role not found');

    const slug = dto.slug ? this.normalizeSlug(dto.slug) : undefined;
    if (slug && slug !== existing.slug) {
      await this.ensureRoleSlugAvailable(slug);
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date()
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (slug !== undefined) data.slug = slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.isActive = dto.is_active;

    await this.prisma.role.update({ where: { id }, data });

    if (dto.permission_ids) {
      const permissionIds = this.parseIds(dto.permission_ids, 'permission id');
      await this.ensurePermissionsExist(permissionIds);

      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          skipDuplicates: true
        })
      ]);
    }

    return this.getRoleById(id);
  }

  async deleteRole(roleId: string) {
    const id = this.parseId(roleId, 'role id');
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    const assignments = await this.prisma.userRole.count({ where: { roleId: id } });
    if (assignments > 0) {
      throw new BadRequestException('Cannot delete role with active user assignments');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.role.delete({ where: { id } })
    ]);

    return { success: true };
  }

  async setRolePermissions(roleId: string, dto: SetRolePermissionsDto) {
    const id = this.parseId(roleId, 'role id');
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    const permissionIds = this.parseIds(dto.permission_ids, 'permission id');
    await this.ensurePermissionsExist(permissionIds);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        skipDuplicates: true
      }),
      this.prisma.role.update({ where: { id }, data: { updatedAt: new Date() } })
    ]);

    return this.getRoleById(id);
  }

  async listPermissions(filters: { module?: string; search?: string }) {
    const where: {
      module?: string;
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { slug: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (filters.module) where.module = filters.module;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const permissions = await this.prisma.permission.findMany({
      where,
      include: {
        roles: {
          include: { role: true }
        }
      },
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });

    return permissions.map((permission) => ({
      id: permission.id.toString(),
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      module: permission.module,
      created_at: permission.createdAt,
      updated_at: permission.updatedAt,
      roles: permission.roles.map((rolePermission) => ({
        id: rolePermission.role.id.toString(),
        name: rolePermission.role.name,
        slug: rolePermission.role.slug
      }))
    }));
  }

  async createPermission(dto: CreatePermissionDto) {
    const slug = this.normalizeSlug(dto.slug ?? dto.name);
    const existing = await this.prisma.permission.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Permission slug already exists');

    const now = new Date();
    const permission = await this.prisma.permission.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description,
        module: dto.module,
        createdAt: now,
        updatedAt: now
      }
    });

    return {
      id: permission.id.toString(),
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      module: permission.module,
      created_at: permission.createdAt,
      updated_at: permission.updatedAt
    };
  }

  async getUserRoles(profileId: string) {
    const id = this.parseId(profileId, 'profile id');

    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            },
            organization: true
          }
        }
      }
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return {
      profile: {
        id: profile.id.toString(),
        email: profile.email,
        username: profile.username,
        first_name: profile.firstName,
        last_name: profile.lastName
      },
      roles: profile.roles.map((userRole: {
        role: {
          id: bigint;
          name: string;
          slug: string;
          permissions: Array<{ permission: { id: bigint; slug: string; name: string } }>;
        };
        organization: { id: bigint; name: string; code: string } | null;
        isPrimaryRole: boolean;
      }) => ({
        role_id: userRole.role.id.toString(),
        name: userRole.role.name,
        slug: userRole.role.slug,
        organization: userRole.organization
          ? {
              id: userRole.organization.id.toString(),
              name: userRole.organization.name,
              code: userRole.organization.code
            }
          : null,
        is_primary_role: userRole.isPrimaryRole,
        permissions: userRole.role.permissions.map((permission: { permission: { id: bigint; slug: string; name: string } }) => ({
          id: permission.permission.id.toString(),
          slug: permission.permission.slug,
          name: permission.permission.name
        }))
      }))
    };
  }

  async assignUserRoles(profileId: string, dto: AssignUserRolesDto) {
    const id = this.parseId(profileId, 'profile id');
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    const roleIds = Array.from(new Set(this.parseIds(dto.role_ids, 'role id')));
    if (roleIds.length === 0) {
      throw new BadRequestException('At least one role must be provided');
    }

    const organizationId = dto.organization_id ? this.parseId(dto.organization_id, 'organization id') : null;
    if (organizationId) {
      const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) throw new NotFoundException('Organization not found');
    }

    await this.ensureRolesExist(roleIds);

    let primaryRoleId: bigint | null = null;
    if (dto.primary_role_id) {
      primaryRoleId = this.parseId(dto.primary_role_id, 'primary role id');
      if (!roleIds.some((roleId) => roleId === primaryRoleId)) {
        throw new BadRequestException('Primary role must be included in role_ids');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const scope = organizationId === null ? { organizationId: null } : { organizationId };

      if (dto.replace_existing) {
        await tx.userRole.deleteMany({
          where: {
            profileId: id,
            ...scope
          }
        });
      }

      if (primaryRoleId) {
        await tx.userRole.updateMany({
          where: {
            profileId: id,
            ...scope,
            isPrimaryRole: true
          },
          data: { isPrimaryRole: false }
        });
      }

      for (const roleId of roleIds) {
        const existing = await tx.userRole.findFirst({
          where: {
            profileId: id,
            roleId,
            ...scope
          }
        });

        if (existing) {
          if (primaryRoleId && existing.roleId === primaryRoleId && !existing.isPrimaryRole) {
            await tx.userRole.update({
              where: { id: existing.id },
              data: { isPrimaryRole: true }
            });
          }
          continue;
        }

        await tx.userRole.create({
          data: {
            profileId: id,
            roleId,
            organizationId,
            isPrimaryRole: primaryRoleId ? roleId === primaryRoleId : false
          }
        });
      }
    });

    return this.getUserRoles(profileId);
  }

  private async getRoleById(id: bigint) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });

    if (!role) throw new NotFoundException('Role not found');

    return {
      id: role.id.toString(),
      name: role.name,
      slug: role.slug,
      description: role.description,
      is_active: role.isActive,
      created_at: role.createdAt,
      updated_at: role.updatedAt,
      permissions: role.permissions.map((permission) => ({
        id: permission.permission.id.toString(),
        name: permission.permission.name,
        slug: permission.permission.slug,
        module: permission.permission.module
      }))
    };
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private parseIds(values: string[], label: string): bigint[] {
    return values.map((value) => this.parseId(value, label));
  }

  private normalizeSlug(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (!slug) throw new BadRequestException('Slug is required');
    return slug;
  }

  private async ensureRoleSlugAvailable(slug: string) {
    const existing = await this.prisma.role.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Role slug already exists');
  }

  private async ensurePermissionsExist(permissionIds: bigint[]) {
    if (permissionIds.length === 0) return;

    const found = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true }
    });

    if (found.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions were not found');
    }
  }

  private async ensureRolesExist(roleIds: bigint[]) {
    const found = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true }
    });

    if (found.length !== roleIds.length) {
      throw new NotFoundException('One or more roles were not found');
    }
  }
}
