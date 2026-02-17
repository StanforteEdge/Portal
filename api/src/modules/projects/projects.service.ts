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

    return this.prisma.group.findMany({
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
    return project;
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

    const project = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: 'project',
        createdBy: createdById,
        updatedBy: createdById,
        organizationId,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
        isActive: true
      }
    });

    await this.prisma.groupUser.create({
      data: {
        groupId: project.id,
        userId: createdById,
        role: GroupUserRole.admin,
        addedBy: createdById
      }
    });

    return this.get(project.id.toString());
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const projectId = this.parseId(id, 'project id');
    await this.ensureProjectAccess(projectId, this.parseId(userId, 'user id'));

    const existing = await this.prisma.group.findUnique({ where: { id: projectId } });
    if (!existing || existing.type !== 'project') throw new NotFoundException('Project not found');

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

    if (dto.metadata !== undefined) {
      updateData.metadata = dto.metadata as Prisma.InputJsonValue;
    }

    await this.prisma.group.update({
      where: { id: projectId },
      data: updateData
    });

    return this.get(id);
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

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
