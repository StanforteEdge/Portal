import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupUserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const groupType = query.group_type ? String(query.group_type) : undefined;
    const where: Prisma.GroupWhereInput = groupType
      ? { type: groupType }
      : { type: { in: ['team', 'department'] } };
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
      orderBy: { name: 'asc' }
    });
  }

  async create(createdBy: string, dto: CreateTeamDto) {
    const createdById = this.parseId(createdBy, 'creator id');
    const organizationId = dto.organization_id ? this.parseId(dto.organization_id, 'organization id') : null;

    if (organizationId) {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw new NotFoundException('Organization not found');
    }

    const team = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.group_type ?? 'team',
        organizationId,
        createdBy: createdById,
        updatedBy: createdById,
        isActive: true
      }
    });

    await this.prisma.groupUser.create({
      data: {
        groupId: team.id,
        userId: createdById,
        role: GroupUserRole.admin,
        addedBy: createdById
      }
    });

    return this.get(team.id.toString());
  }

  async get(id: string) {
    const team = await this.prisma.group.findUnique({
      where: { id: this.parseId(id, 'team id') },
      include: {
        organization: true,
        members: {
          include: {
            user: { select: { id: true, email: true, username: true, firstName: true, lastName: true } }
          }
        }
      }
    });
    if (!team) throw new NotFoundException('Group not found');
    return team;
  }

  async update(id: string, userId: string, dto: UpdateTeamDto) {
    const teamId = this.parseId(id, 'team id');
    const actor = this.parseId(userId, 'user id');

    const existing = await this.prisma.group.findUnique({ where: { id: teamId } });
    if (!existing) throw new NotFoundException('Group not found');

    const organizationId = dto.organization_id ? this.parseId(dto.organization_id, 'organization id') : existing.organizationId;

    await this.prisma.group.update({
      where: { id: teamId },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        type: dto.group_type ?? existing.type,
        organizationId,
        isActive: dto.is_active ?? existing.isActive,
        updatedBy: actor
      }
    });

    return this.get(id);
  }

  async addMember(id: string, actorId: string, dto: AddGroupMemberDto) {
    const groupId = this.parseId(id, 'group id');
    const actor = this.parseId(actorId, 'user id');
    const userId = this.parseId(dto.user_id, 'user id');

    const role = this.mapMemberRole(dto.role);

    await this.prisma.groupUser.upsert({
      where: {
        unique_group_user: {
          groupId,
          userId
        }
      },
      update: { role, addedBy: actor },
      create: {
        groupId,
        userId,
        role,
        addedBy: actor
      }
    });

    return this.get(id);
  }

  async removeMember(id: string, userId: string) {
    const groupId = this.parseId(id, 'group id');
    const memberId = this.parseId(userId, 'user id');

    await this.prisma.groupUser.delete({
      where: {
        unique_group_user: {
          groupId,
          userId: memberId
        }
      }
    });

    return this.get(id);
  }

  private mapMemberRole(role?: 'member' | 'lead' | 'manager'): GroupUserRole {
    if (role === 'lead') return GroupUserRole.moderator;
    if (role === 'manager') return GroupUserRole.admin;
    return GroupUserRole.member;
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
