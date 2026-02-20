import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, EmploymentStatus, GroupUserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomToken } from '../../common/utils/crypto';
import { toBigInt } from '../../common/utils/ids';
import { generateUniqueUsername, makeUsernameSeed } from '../../common/utils/username';
import { SetPrimaryOrganizationDto } from './dto/set-primary-organization.dto';
import { EmployeeActionDto, UpsertEmployeeDto } from './dto/upsert-employee.dto';
import {
  AssignEmployeeOrganizationDto,
  AssignEmployeeTeamDto,
  AssignOnboardingFormDto,
  UpdateOnboardingFormAssignmentDto
} from './dto/manage-employee-links.dto';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [total, active, inactive, onboardingPending] = await this.prisma.$transaction([
      this.prisma.profile.count({ where: { type: { in: ['staff', 'employee'] } } }),
      this.prisma.employeeProfile.count({ where: { employmentStatus: 'active' } }),
      this.prisma.employeeProfile.count({ where: { employmentStatus: { in: ['draft', 'suspended', 'exited'] } } }),
      this.prisma.onboardingProgress.count({
        where: {
          status: {
            in: ['invited', 'accepted', 'profile_pending', 'forms_pending', 'hr_review']
          }
        }
      })
    ]);

    return { total, active, inactive, onboarding_pending: onboardingPending };
  }

  async listEmployees(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: Prisma.ProfileWhereInput = {
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
    if (query.employment_status) {
      where.employeeProfile = {
        is: {
          employmentStatus: String(query.employment_status) as EmploymentStatus
        }
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        include: this.employeeInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.profile.count({ where })
    ]);

    return {
      data: data.map((item) => this.serializeEmployee(item)),
      meta: {
        page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage))
      }
    };
  }

  async createEmployee(dto: UpsertEmployeeDto) {
    return this.prisma.$transaction(async (tx) => {
      let profileId: bigint;

      if (dto.user_id) {
        profileId = this.parseId(dto.user_id, 'user id');
        const existing = await tx.profile.findUnique({ where: { id: profileId } });
        if (!existing) throw new NotFoundException('User not found');
      } else {
        if (!dto.email || !dto.first_name || !dto.last_name) {
          throw new BadRequestException('email, first_name and last_name are required for new employee');
        }

        const email = dto.email.trim().toLowerCase();
        const requestedUsername = dto.username?.trim();
        const username = requestedUsername
          ? requestedUsername
          : await generateUniqueUsername(
              makeUsernameSeed(dto.first_name, dto.last_name, email.split('@')[0]),
              async (candidate) => Boolean(await tx.profile.findFirst({ where: { username: candidate } }))
            );
        const [emailExists, usernameExists] = await Promise.all([
          tx.profile.findUnique({ where: { email } }),
          requestedUsername ? tx.profile.findFirst({ where: { username } }) : Promise.resolve(null)
        ]);

        if (emailExists) throw new BadRequestException('Email already exists');
        if (usernameExists) throw new BadRequestException('Username already exists');

        const tempPassword = randomToken(10);
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const created = await tx.profile.create({
          data: {
            username,
            email,
            passwordHash,
            type: 'staff',
            status: 'invited',
            firstName: dto.first_name,
            lastName: dto.last_name,
            phone: dto.phone
          }
        });
        profileId = created.id;
      }

      await this.upsertEmployeeProfileTx(tx, profileId, dto, null);
      return this.getEmployee(profileId.toString());
    });
  }

  async getEmployee(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: this.parseId(id, 'employee id') },
      include: this.employeeInclude()
    });

    if (!profile || !['staff', 'employee'].includes(profile.type)) {
      throw new NotFoundException('Employee not found');
    }

    return this.serializeEmployee(profile);
  }

  async updateEmployee(id: string, dto: UpsertEmployeeDto) {
    const profileId = this.parseId(id, 'employee id');
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || !['staff', 'employee'].includes(profile.type)) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          firstName: dto.first_name ?? profile.firstName,
          lastName: dto.last_name ?? profile.lastName,
          phone: dto.phone ?? profile.phone,
          email: dto.email ? dto.email.trim().toLowerCase() : profile.email,
          username: dto.username?.trim() ? dto.username.trim() : profile.username
        }
      });

      await this.upsertEmployeeProfileTx(tx, profileId, dto, profileId);
      return this.getEmployee(profileId.toString());
    });
  }

  async runEmployeeAction(id: string, dto: EmployeeActionDto) {
    const profileId = this.parseId(id, 'employee id');
    const existing = await this.prisma.employeeProfile.findUnique({ where: { userId: profileId } });
    if (!existing) throw new NotFoundException('Employee profile not found');

    const nextStatus: EmploymentStatus =
      dto.action === 'activate' ? 'active' : dto.action === 'suspend' ? 'suspended' : 'exited';

    await this.prisma.employeeProfile.update({
      where: { userId: profileId },
      data: {
        employmentStatus: nextStatus,
        exitDate: dto.action === 'exit' ? new Date(dto.effective_date ?? Date.now()) : null
      }
    });

    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        status: nextStatus === 'active' ? 'active' : nextStatus === 'suspended' ? 'inactive' : 'inactive'
      }
    });

    return this.getEmployee(profileId.toString());
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

      await tx.employeeProfile.upsert({
        where: { userId: profileId },
        update: { primaryOrganizationId: organizationId },
        create: { userId: profileId, primaryOrganizationId: organizationId }
      });
    });

    return this.getEmployee(id);
  }

  async addOrganizationMembership(id: string, dto: AssignEmployeeOrganizationDto) {
    const profileId = this.parseId(id, 'employee id');
    const organizationId = this.parseId(dto.organization_id, 'organization id');

    const [profile, organization] = await this.prisma.$transaction([
      this.prisma.profile.findUnique({ where: { id: profileId } }),
      this.prisma.organization.findUnique({ where: { id: organizationId } })
    ]);
    if (!profile || !['staff', 'employee'].includes(profile.type)) throw new NotFoundException('Employee not found');
    if (!organization) throw new NotFoundException('Organization not found');

    await this.prisma.profileOrganization.upsert({
      where: {
        profile_org_unique: {
          profileId,
          organizationId
        }
      },
      update: {
        isPrimary: Boolean(dto.is_primary)
      },
      create: {
        profileId,
        organizationId,
        isPrimary: Boolean(dto.is_primary),
        createdAt: new Date()
      }
    });

    if (dto.is_primary) {
      await this.prisma.$transaction([
        this.prisma.profileOrganization.updateMany({
          where: { profileId, organizationId: { not: organizationId }, isPrimary: true },
          data: { isPrimary: false }
        }),
        this.prisma.profile.update({
          where: { id: profileId },
          data: { primaryOrganizationId: organizationId }
        }),
        this.prisma.employeeProfile.upsert({
          where: { userId: profileId },
          update: { primaryOrganizationId: organizationId },
          create: { userId: profileId, primaryOrganizationId: organizationId }
        })
      ]);
    }

    return this.getEmployee(id);
  }

  async removeOrganizationMembership(id: string, organizationIdParam: string) {
    const profileId = this.parseId(id, 'employee id');
    const organizationId = this.parseId(organizationIdParam, 'organization id');

    const membership = await this.prisma.profileOrganization.findFirst({
      where: { profileId, organizationId }
    });
    if (!membership) throw new NotFoundException('Organization membership not found');

    await this.prisma.profileOrganization.delete({ where: { id: membership.id } });

    const primary = await this.prisma.profileOrganization.findFirst({
      where: { profileId, isPrimary: true }
    });

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { primaryOrganizationId: primary?.organizationId ?? null }
    });
    await this.prisma.employeeProfile.upsert({
      where: { userId: profileId },
      update: { primaryOrganizationId: primary?.organizationId ?? null },
      create: { userId: profileId, primaryOrganizationId: primary?.organizationId ?? null }
    });

    return this.getEmployee(id);
  }

  async addTeamMembership(id: string, dto: AssignEmployeeTeamDto) {
    const profileId = this.parseId(id, 'employee id');
    const teamId = this.parseId(dto.team_id, 'team id');

    const [profile, team] = await this.prisma.$transaction([
      this.prisma.profile.findUnique({ where: { id: profileId } }),
      this.prisma.group.findUnique({ where: { id: teamId } })
    ]);
    if (!profile || !['staff', 'employee'].includes(profile.type)) throw new NotFoundException('Employee not found');
    if (!team) throw new NotFoundException('Team not found');

    const role: GroupUserRole =
      dto.role === 'lead'
        ? GroupUserRole.moderator
        : dto.role === 'manager'
          ? GroupUserRole.admin
          : GroupUserRole.member;
    await this.prisma.groupUser.upsert({
      where: {
        unique_group_user: {
          groupId: teamId,
          userId: profileId
        }
      },
      update: {
        role
      },
      create: {
        groupId: teamId,
        userId: profileId,
        role
      }
    });

    await this.prisma.employeeProfile.upsert({
      where: { userId: profileId },
      update: { primaryTeamId: teamId },
      create: { userId: profileId, primaryTeamId: teamId }
    });

    return this.getEmployee(id);
  }

  async removeTeamMembership(id: string, teamIdParam: string) {
    const profileId = this.parseId(id, 'employee id');
    const teamId = this.parseId(teamIdParam, 'team id');

    await this.prisma.groupUser.delete({
      where: {
        unique_group_user: {
          groupId: teamId,
          userId: profileId
        }
      }
    });

    const fallbackTeam = await this.prisma.groupUser.findFirst({
      where: { userId: profileId },
      orderBy: { joinedAt: 'asc' }
    });

    await this.prisma.employeeProfile.upsert({
      where: { userId: profileId },
      update: { primaryTeamId: fallbackTeam?.groupId ?? null },
      create: { userId: profileId, primaryTeamId: fallbackTeam?.groupId ?? null }
    });

    return this.getEmployee(id);
  }

  async listOnboardingFormAssignments(query: Record<string, any>) {
    const where: Prisma.FormAssignmentWhereInput = {};
    if (query.form_id) where.formId = String(query.form_id);
    if (query.profile_id) where.assignedToProfileId = this.parseId(String(query.profile_id), 'profile id');
    if (query.role_slug) where.assignedToRole = String(query.role_slug);

    const assignments = await this.prisma.formAssignment.findMany({
      where,
      include: {
        form: { select: { id: true, name: true, module: true, isActive: true } }
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
    });

    return assignments.map((row) => ({
      id: row.id,
      form_id: row.formId,
      form_name: row.form.name,
      module: row.form.module,
      assigned_to_role: row.assignedToRole,
      assigned_to_profile_id: row.assignedToProfileId ? row.assignedToProfileId.toString() : null,
      due_date: row.dueDate,
      created_at: row.createdAt
    }));
  }

  async assignOnboardingForm(dto: AssignOnboardingFormDto) {
    if (!dto.profile_id && !dto.role_slug) {
      throw new BadRequestException('Either profile_id or role_slug is required');
    }
    const form = await this.prisma.form.findUnique({ where: { id: dto.form_id } });
    if (!form || !form.isActive) throw new NotFoundException('Form not found');

    const assignedToProfileId = dto.profile_id ? this.parseId(dto.profile_id, 'profile id') : null;
    if (assignedToProfileId) {
      const user = await this.prisma.profile.findUnique({ where: { id: assignedToProfileId } });
      if (!user) throw new NotFoundException('Profile not found');
    }

    return this.prisma.formAssignment.create({
      data: {
        formId: dto.form_id,
        assignedToRole: dto.role_slug ?? null,
        assignedToProfileId,
        dueDate: dto.due_date ? new Date(dto.due_date) : null
      }
    });
  }

  async deleteOnboardingFormAssignment(id: string) {
    const existing = await this.prisma.formAssignment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Form assignment not found');
    await this.prisma.formAssignment.delete({ where: { id } });
    return { success: true };
  }

  async updateOnboardingFormAssignment(id: string, dto: UpdateOnboardingFormAssignmentDto) {
    const existing = await this.prisma.formAssignment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Form assignment not found');

    let assignedToProfileId: bigint | null | undefined;
    if (dto.profile_id !== undefined) {
      assignedToProfileId = dto.profile_id ? this.parseId(dto.profile_id, 'profile id') : null;
      if (assignedToProfileId) {
        const user = await this.prisma.profile.findUnique({ where: { id: assignedToProfileId } });
        if (!user) throw new NotFoundException('Profile not found');
      }
    }

    const formId = dto.form_id ?? existing.formId;
    if (dto.form_id) {
      const form = await this.prisma.form.findUnique({ where: { id: dto.form_id } });
      if (!form || !form.isActive) throw new NotFoundException('Form not found');
    }

    const assignedToRole = dto.role_slug !== undefined ? dto.role_slug || null : existing.assignedToRole;
    const resolvedProfileId =
      assignedToProfileId !== undefined ? assignedToProfileId : existing.assignedToProfileId;

    if (!assignedToRole && !resolvedProfileId) {
      throw new BadRequestException('Either profile_id or role_slug is required');
    }

    return this.prisma.formAssignment.update({
      where: { id },
      data: {
        formId,
        assignedToRole,
        assignedToProfileId: resolvedProfileId,
        dueDate: dto.due_date !== undefined ? (dto.due_date ? new Date(dto.due_date) : null) : undefined
      }
    });
  }

  private async upsertEmployeeProfileTx(
    tx: Prisma.TransactionClient,
    profileId: bigint,
    dto: UpsertEmployeeDto,
    actorId: bigint | null
  ) {
    const managerUserId = dto.manager_user_id ? this.parseId(dto.manager_user_id, 'manager user id') : undefined;
    const primaryTeamId = dto.primary_team_id ? this.parseId(dto.primary_team_id, 'primary team id') : undefined;
    const primaryOrganizationId = dto.primary_organization_id
      ? this.parseId(dto.primary_organization_id, 'primary organization id')
      : undefined;

    await tx.employeeProfile.upsert({
      where: { userId: profileId },
      update: {
        employeeCode: dto.employee_code,
        jobTitle: dto.job_title,
        jobDescription: dto.job_description,
        managerUserId,
        employmentType: dto.employment_type,
        employmentStatus: dto.employment_status,
        workMode: dto.work_mode,
        hireDate: dto.hire_date ? new Date(dto.hire_date) : undefined,
        confirmationDate: dto.confirmation_date ? new Date(dto.confirmation_date) : undefined,
        exitDate: dto.exit_date ? new Date(dto.exit_date) : undefined,
        primaryTeamId,
        primaryOrganizationId,
        updatedBy: actorId ?? undefined
      },
      create: {
        userId: profileId,
        employeeCode: dto.employee_code,
        jobTitle: dto.job_title,
        jobDescription: dto.job_description,
        managerUserId,
        employmentType: dto.employment_type,
        employmentStatus: dto.employment_status ?? 'draft',
        workMode: dto.work_mode,
        hireDate: dto.hire_date ? new Date(dto.hire_date) : undefined,
        confirmationDate: dto.confirmation_date ? new Date(dto.confirmation_date) : undefined,
        exitDate: dto.exit_date ? new Date(dto.exit_date) : undefined,
        primaryTeamId,
        primaryOrganizationId,
        createdBy: actorId ?? undefined,
        updatedBy: actorId ?? undefined
      }
    });

    if (dto.metadata && Object.keys(dto.metadata).length > 0) {
      const normalizedMetadata: Record<string, unknown> = { ...dto.metadata };
      if (Array.isArray(normalizedMetadata.assigned_emails)) {
        normalizedMetadata.assigned_emails = normalizedMetadata.assigned_emails
          .map((item) => String(item || '').trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      }
      await Promise.all(
        Object.entries(normalizedMetadata).map(([key, value]) =>
          tx.employeeMeta.upsert({
            where: {
              employee_meta_unique: {
                userId: profileId,
                metaKey: key
              }
            },
            update: {
              metaValue: value as Prisma.InputJsonValue
            },
            create: {
              userId: profileId,
              metaKey: key,
              metaValue: value as Prisma.InputJsonValue
            }
          })
        )
      );
    }

    if (dto.roles && dto.roles.length > 0) {
      const roleSlugs = Array.from(new Set(dto.roles));
      const roles = await tx.role.findMany({
        where: {
          slug: { in: roleSlugs },
          isActive: true
        },
        select: { id: true, slug: true }
      });

      if (roles.length !== roleSlugs.length) {
        const found = new Set(roles.map((item) => item.slug));
        const missing = roleSlugs.filter((slug) => !found.has(slug));
        throw new BadRequestException(`Unknown role(s): ${missing.join(', ')}`);
      }

      await tx.userRole.deleteMany({ where: { profileId } });
      await tx.userRole.createMany({
        data: roles.map((role, index) => ({
          profileId,
          roleId: role.id,
          organizationId: null,
          isPrimaryRole: index === 0
        })),
        skipDuplicates: true
      });
    }
  }

  private employeeInclude() {
    return {
      primaryOrganization: true,
      organizations: {
        include: { organization: true }
      },
      roles: { include: { role: true, organization: true } },
      groups: {
        include: {
          group: true
        }
      },
      employeeProfile: {
        include: {
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
          primaryOrganization: { select: { id: true, name: true, code: true } },
          primaryTeam: { select: { id: true, name: true, type: true } }
        }
      },
      employeeMeta: true,
      onboardingProgress: true
    } as const;
  }

  private serializeEmployee(profile: any) {
    const groupMemberships = (profile.groups ?? []).map((entry: any) => ({
      id: entry.group.id.toString(),
      name: entry.group.name,
      type: entry.group.type,
      role: entry.role
    }));

    return {
      id: profile.id.toString(),
      username: profile.username,
      email: profile.email,
      status: profile.status,
      type: profile.type,
      first_name: profile.firstName,
      last_name: profile.lastName,
      phone: profile.phone,
      organizations: (profile.organizations ?? []).map((entry: any) => ({
        id: entry.organization.id.toString(),
        name: entry.organization.name,
        code: entry.organization.code,
        is_primary: entry.isPrimary
      })),
      roles: (profile.roles ?? []).map((entry: any) => ({
        id: entry.role.id.toString(),
        slug: entry.role.slug,
        name: entry.role.name,
        is_primary: entry.isPrimaryRole
      })),
      teams: groupMemberships.filter((entry: any) => String(entry.type).toLowerCase() === 'team'),
      projects: groupMemberships.filter((entry: any) => String(entry.type).toLowerCase() === 'project'),
      employee_profile: profile.employeeProfile
        ? {
            ...profile.employeeProfile,
            userId: profile.employeeProfile.userId.toString(),
            managerUserId: profile.employeeProfile.managerUserId
              ? profile.employeeProfile.managerUserId.toString()
              : null,
            primaryTeamId: profile.employeeProfile.primaryTeamId
              ? profile.employeeProfile.primaryTeamId.toString()
              : null,
            primaryOrganizationId: profile.employeeProfile.primaryOrganizationId
              ? profile.employeeProfile.primaryOrganizationId.toString()
              : null,
            meta: (profile.employeeMeta ?? []).reduce(
              (acc: Record<string, unknown>, entry: any) => {
                acc[entry.metaKey] = entry.metaValue;
                return acc;
              },
              {}
            )
          }
        : null,
      onboarding_progress: profile.onboardingProgress ?? null,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt
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
