import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupUserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const where: Prisma.GroupWhereInput = { type: 'project' };
    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization id');
    if (query.active_only === 'true') where.isActive = true;
    if (query.search) {
      where.OR = [
        { name: { contains: String(query.search), mode: 'insensitive' } },
        { description: { contains: String(query.search), mode: 'insensitive' } }
      ];
    }
    if (query.owner_user_id) {
      const ownerId = this.parseId(String(query.owner_user_id), 'owner user id');
      where.members = {
        some: { userId: ownerId, role: GroupUserRole.admin }
      };
    }

    const rows = await this.prisma.group.findMany({
      where,
      include: {
        organization: true,
        members: {
          include: {
            user: { select: { id: true, email: true, username: true, firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((row) => this.serializeProject(row));
  }

  async get(id: string) {
    const project = await this.prisma.group.findUnique({
      where: { id: this.parseId(id, 'project id') },
      include: {
        organization: true,
        members: {
          include: {
            user: { select: { id: true, email: true, username: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!project || project.type !== 'project') throw new NotFoundException('Project not found');
    return this.serializeProject(project);
  }

  async create(createdBy: string, dto: CreateProjectDto) {
    const createdById = this.parseId(createdBy, 'creator id');
    const organizationId = dto.organization_id
      ? this.parseId(dto.organization_id, 'organization id')
      : null;

    if (organizationId) {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw new NotFoundException('Organization not found');
    }

    const ownerId = dto.owner_user_id ? this.parseId(dto.owner_user_id, 'owner user id') : createdById;
    const project = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: 'project',
        createdBy: createdById,
        updatedBy: createdById,
        organizationId,
        metadata: {
          ...(dto.metadata ?? {}),
          ...(dto.project_code ? { project_code: dto.project_code } : {}),
          ...(dto.start_date ? { start_date: dto.start_date } : {}),
          ...(dto.end_date ? { end_date: dto.end_date } : {}),
          governance_status: dto.governance_status ?? 'planned',
          owner_user_id: ownerId.toString()
        } as Prisma.InputJsonValue,
        isActive: true
      }
    });

    await this.prisma.groupUser.create({
      data: {
        groupId: project.id,
        userId: ownerId,
        role: GroupUserRole.admin,
        addedBy: createdById
      }
    });

    if (ownerId !== createdById) {
      await this.prisma.groupUser.upsert({
        where: {
          unique_group_user: {
            groupId: project.id,
            userId: createdById
          }
        },
        update: { role: GroupUserRole.admin, addedBy: createdById },
        create: {
          groupId: project.id,
          userId: createdById,
          role: GroupUserRole.admin,
          addedBy: createdById
        }
      });
    }

    return this.get(project.id.toString());
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const projectId = this.parseId(id, 'project id');
    await this.ensureProjectAccess(projectId, this.parseId(userId, 'user id'));

    const existing = await this.prisma.group.findUnique({ where: { id: projectId } });
    if (!existing || existing.type !== 'project') throw new NotFoundException('Project not found');

    const mergedMetadata = this.mergeGovernanceMetadata(existing.metadata, dto);
    const updateData: {
      name: string;
      description: string | null;
      isActive: boolean;
      updatedBy: bigint;
      metadata?: Prisma.InputJsonValue;
    } = {
      name: dto.name ?? existing.name,
      description: dto.description ?? existing.description,
      isActive: dto.is_active ?? existing.isActive,
      updatedBy: this.parseId(userId, 'user id')
    };

    updateData.metadata = mergedMetadata as Prisma.InputJsonValue;

    await this.prisma.group.update({
      where: { id: projectId },
      data: updateData
    });

    return this.get(id);
  }

  async archive(id: string, userId: string) {
    const projectId = this.parseId(id, 'project id');
    const actorId = this.parseId(userId, 'user id');
    await this.ensureProjectAccess(projectId, actorId);
    const project = await this.prisma.group.findUnique({ where: { id: projectId } });
    if (!project || project.type !== 'project') throw new NotFoundException('Project not found');

    const usage = await this.getProjectUsage(id);
    if (usage.open_requests > 0) {
      throw new BadRequestException('Cannot archive project with open requests');
    }

    const current = this.normalizeMetadata(project.metadata);
    await this.prisma.group.update({
      where: { id: projectId },
      data: {
        isActive: false,
        updatedBy: actorId,
        metadata: {
          ...current,
          governance_status: 'archived',
          archived_at: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
    return this.get(id);
  }

  async unarchive(id: string, userId: string) {
    const projectId = this.parseId(id, 'project id');
    const actorId = this.parseId(userId, 'user id');
    await this.ensureProjectAccess(projectId, actorId);
    const project = await this.prisma.group.findUnique({ where: { id: projectId } });
    if (!project || project.type !== 'project') throw new NotFoundException('Project not found');
    const current = this.normalizeMetadata(project.metadata);
    await this.prisma.group.update({
      where: { id: projectId },
      data: {
        isActive: true,
        updatedBy: actorId,
        metadata: {
          ...current,
          governance_status: current.governance_status === 'archived' ? 'active' : current.governance_status
        } as Prisma.InputJsonValue
      }
    });
    return this.get(id);
  }

  async governance(id: string) {
    const project = await this.get(id);
    const usage = await this.getProjectUsage(id);
    return {
      project,
      usage
    };
  }

  async addMember(id: string, actorId: string, dto: AddProjectMemberDto) {
    const projectId = this.parseId(id, 'project id');
    const actor = this.parseId(actorId, 'user id');
    await this.ensureProjectAccess(projectId, actor);

    const userId = this.parseId(dto.user_id, 'user id');
    const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new NotFoundException('User not found');

    const role = (dto.role ?? 'member') as GroupUserRole;

    await this.prisma.groupUser.upsert({
      where: {
        unique_group_user: {
          groupId: projectId,
          userId
        }
      },
      update: { role, addedBy: actor },
      create: {
        groupId: projectId,
        userId,
        role,
        addedBy: actor
      }
    });

    return this.get(id);
  }

  async removeMember(id: string, actorId: string, userId: string) {
    const projectId = this.parseId(id, 'project id');
    const actor = this.parseId(actorId, 'user id');
    await this.ensureProjectAccess(projectId, actor);

    await this.prisma.groupUser.delete({
      where: {
        unique_group_user: {
          groupId: projectId,
          userId: this.parseId(userId, 'user id')
        }
      }
    });

    return this.get(id);
  }

  private async ensureProjectAccess(projectId: bigint, actorId: bigint) {
    const membership = await this.prisma.groupUser.findFirst({
      where: {
        groupId: projectId,
        userId: actorId,
        role: { in: [GroupUserRole.admin, GroupUserRole.moderator] }
      }
    });

    if (!membership) {
      throw new BadRequestException('Only project admins/moderators can perform this action');
    }
  }

  private normalizeMetadata(metadata: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return { ...(metadata as Record<string, unknown>) };
    }
    return {};
  }

  private mergeGovernanceMetadata(metadata: Prisma.JsonValue | null | undefined, dto: UpdateProjectDto) {
    const current = this.normalizeMetadata(metadata);
    const next = { ...current, ...(dto.metadata ?? {}) } as Record<string, unknown>;
    if (dto.project_code !== undefined) next.project_code = dto.project_code;
    if (dto.start_date !== undefined) next.start_date = dto.start_date;
    if (dto.end_date !== undefined) next.end_date = dto.end_date;
    if (dto.governance_status !== undefined) next.governance_status = dto.governance_status;
    if (dto.owner_user_id !== undefined) next.owner_user_id = dto.owner_user_id;
    return next;
  }

  private serializeProject(project: any) {
    const metadata = this.normalizeMetadata(project.metadata);
    return {
      ...project,
      governance: {
        project_code: metadata.project_code ?? null,
        owner_user_id: metadata.owner_user_id ?? null,
        start_date: metadata.start_date ?? null,
        end_date: metadata.end_date ?? null,
        governance_status: metadata.governance_status ?? (project.isActive ? 'active' : 'archived')
      }
    };
  }

  private async getProjectUsage(id: string) {
    const projectId = this.parseId(id, 'project id');
    const project = await this.prisma.group.findUnique({ where: { id: projectId }, select: { id: true, name: true } });
    if (!project) throw new NotFoundException('Project not found');

    const requests = await this.prisma.requestInstance.findMany({
      where: { data: { not: Prisma.DbNull } },
      select: { id: true, status: true, data: true }
    });

    let total = 0;
    let open = 0;
    for (const row of requests) {
      if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data)) continue;
      const data = row.data as Record<string, unknown>;
      const projectIdInData = String(data.project_id ?? '');
      const projectNameInData = String(data.project ?? '');
      const matched = projectIdInData === id || projectNameInData.toLowerCase() === String(project.name).toLowerCase();
      if (!matched) continue;
      total += 1;
      if (!['completed', 'rejected', 'cancelled'].includes(String(row.status))) open += 1;
    }

    return {
      request_references: total,
      open_requests: open
    };
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
