import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { paginatedResponse } from '../../common/helpers/paginated-response';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { SubmitRequestDto } from './dto/submit-request.dto';
import { ActionRequestDto } from './dto/action-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { RetireRequestDto } from './dto/retire-request.dto';
import { CreateManualRequestDto } from './dto/create-manual-request.dto';
import { DownloadRequestDto } from './dto/download-request.dto';
import { toBigInt } from '../../common/utils/ids';
import { WorkflowService } from '../workflow/workflow.service';
import { normalizeWorkflowStepApprover } from '../workflow/workflow-approvers';
import { FormsService } from '../forms/forms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GroupUserRole, Prisma } from '@prisma/client';
import { PdfService } from '../../common/pdf/pdf.service';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { MailService } from '../../common/mail/mail.service';

const MANUAL_REQUEST_ID_MIN = BigInt(1);
const MANUAL_REQUEST_ID_MAX = BigInt(3000);
const STAFF_REQUEST_ID_MIN = BigInt(3001);
const STAFF_REQUEST_SEQUENCE_START = BigInt(3050);

type RequestNotificationAudience = 'requester' | 'approver';

type RequestNotificationSummary = {
  requestNumber: string;
  requestTypeName: string;
  requesterName: string;
  requesterEmail: string | null;
  primaryMetricLabel: string;
  primaryMetricValue: string;
};

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
    private readonly formsService: FormsService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly pdfService: PdfService
  ) {}

  async listGroups() {
    const rows = await this.prisma.requestGroup.findMany({ where: { isActive: true } });
    return paginatedResponse(rows, { page: 1, per_page: rows.length, total: rows.length });
  }

  async createGroup(dto: CreateGroupDto) {
    if (!dto.code) throw new BadRequestException('code is required');
    return this.prisma.requestGroup.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description
      }
    });
  }

  async updateGroup(id: string, dto: UpdateGroupDto) {
    return this.prisma.requestGroup.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description
      }
    });
  }

  async deleteGroup(id: string) {
    await this.prisma.requestGroup.delete({ where: { id } });
    return { success: true };
  }

  async listTypes(groupId?: string, includeInactive?: boolean) {
    const rows = await this.prisma.requestType.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        ...(includeInactive ? {} : { isActive: true })
      }
    });
    return paginatedResponse(rows, { page: 1, per_page: rows.length, total: rows.length });
  }

  async getType(id: string) {
    const type = await this.prisma.requestType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Request type not found');
    return type;
  }

  async createType(dto: CreateTypeDto, actorId?: string) {
    await this.assertRequestTypeGroupAccess(dto.group_id, actorId);
    const group = await this.prisma.requestGroup.findUnique({
      where: { id: dto.group_id },
      select: { code: true, name: true }
    });
    const requiresCooApproval = this.requestTypeRequiresCooApproval({
      groupCode: group?.code ?? null,
      groupName: group?.name ?? null,
      name: dto.name,
      codePrefix: dto.code_prefix,
      categoryKey: dto.category_key,
      formSchema: dto.form_schema
    });

    const approvalFlowJson = requiresCooApproval
      ? this.ensureApproverInApprovalFlow(dto.approval_flow_json, 'coo')
      : dto.approval_flow_json;

    return this.prisma.requestType.create({
      data: {
        groupId: dto.group_id,
        name: dto.name,
        codePrefix: dto.code_prefix,
        categoryKey: dto.category_key,
        formSchema: dto.form_schema as Prisma.InputJsonValue | undefined,
        description: dto.description,
        storageType: dto.storage_type ?? 'json',
        formId: dto.form_id,
        approvalFlowJson: approvalFlowJson as Prisma.InputJsonValue | undefined,
        approvalLimit: dto.approval_limit,
        isActive: dto.is_active ?? true
      }
    });
  }

  async updateType(id: string, dto: UpdateTypeDto, actorId?: string) {
    const existing = await this.prisma.requestType.findUnique({
      where: { id },
      select: {
        groupId: true,
        name: true,
        codePrefix: true,
        categoryKey: true,
        formSchema: true,
        approvalFlowJson: true
      }
    });
    if (!existing) throw new NotFoundException('Request type not found');
    await this.assertRequestTypeGroupAccess(existing.groupId, actorId);

    const group = await this.prisma.requestGroup.findUnique({
      where: { id: existing.groupId },
      select: { code: true, name: true }
    });

    const mergedName = dto.name ?? existing.name;
    const mergedCodePrefix = dto.code_prefix ?? existing.codePrefix;
    const mergedCategoryKey = dto.category_key ?? existing.categoryKey ?? undefined;
    const mergedFormSchema = dto.form_schema ?? (existing.formSchema as Record<string, unknown> | undefined);
    const mergedApprovalFlow = dto.approval_flow_json ?? (existing.approvalFlowJson as Record<string, unknown> | undefined);
    const requiresCooApproval = this.requestTypeRequiresCooApproval({
      groupCode: group?.code ?? null,
      groupName: group?.name ?? null,
      name: mergedName,
      codePrefix: mergedCodePrefix,
      categoryKey: mergedCategoryKey,
      formSchema: mergedFormSchema
    });

    const normalizedApprovalFlow = requiresCooApproval
      ? this.ensureApproverInApprovalFlow(mergedApprovalFlow, 'coo')
      : dto.approval_flow_json;

    return this.prisma.requestType.update({
      where: { id },
      data: {
        name: dto.name,
        codePrefix: dto.code_prefix,
        categoryKey: dto.category_key,
        formSchema:
          dto.form_schema !== undefined
            ? (dto.form_schema as Prisma.InputJsonValue)
            : undefined,
        description: dto.description,
        storageType: dto.storage_type,
        formId: dto.form_id,
        approvalFlowJson:
          normalizedApprovalFlow !== undefined
            ? (normalizedApprovalFlow as Prisma.InputJsonValue)
            : undefined,
        approvalLimit: dto.approval_limit,
        isActive: dto.is_active
      }
    });
  }

  async deleteType(id: string, actorId?: string) {
    const existing = await this.prisma.requestType.findUnique({
      where: { id },
      select: { id: true, groupId: true }
    });
    if (!existing) throw new NotFoundException('Request type not found');
    await this.assertRequestTypeGroupAccess(existing.groupId, actorId);

    const usageCount = await this.prisma.requestInstance.count({
      where: { requestTypeId: existing.id }
    });
    if (usageCount > 0) {
      throw new BadRequestException('Cannot delete request type with existing requests. Set it inactive instead.');
    }

    await this.prisma.requestType.delete({ where: { id: existing.id } });
    return { success: true };
  }

  private async assertRequestTypeGroupAccess(groupId: string, actorId?: string) {
    if (!actorId) return;
    const actorRoles = await this.getActorRoleSlugs(actorId);
    const isAdmin = actorRoles.has('admin');
    if (isAdmin) return;

    const group = await this.prisma.requestGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, code: true }
    });
    if (!group) throw new BadRequestException('Invalid request group');

    const marker = `${String(group.code || '').toLowerCase()} ${String(group.name || '').toLowerCase()}`;
    const isFinanceGroup = /(^|[\s_-])(fin|finance|financial)([\s_-]|$)/.test(marker);
    const isHrGroup = /(^|[\s_-])(hr|leave|human\s*resources)([\s_-]|$)/.test(marker);
    const hasFinanceRole = actorRoles.has('accountant') || actorRoles.has('finance_manager');
    const hasHrRole = actorRoles.has('hr');

    if (isFinanceGroup && !hasFinanceRole) {
      throw new BadRequestException('Only finance admins can manage finance request types');
    }
    if (isHrGroup && !hasHrRole) {
      throw new BadRequestException('Only HR admins can manage HR request types');
    }
  }

  private requestTypeRequiresCooApproval(input: {
    groupCode?: string | null;
    groupName?: string | null;
    name?: string | null;
    codePrefix?: string | null;
    categoryKey?: string | null;
    formSchema?: Record<string, unknown> | null;
  }) {
    const marker = `${String(input.groupCode ?? '').toLowerCase()} ${String(input.groupName ?? '').toLowerCase()}`;
    const isFinanceOrHrGroup = /(^|[\s_-])(fin|finance|financial|hr|human\s*resources|people)([\s_-]|$)/.test(marker);
    if (!isFinanceOrHrGroup) return false;

    const text = [
      String(input.name ?? '').toLowerCase(),
      String(input.codePrefix ?? '').toLowerCase(),
      String(input.categoryKey ?? '').toLowerCase(),
      String(input.formSchema?.workflow_kind ?? '').toLowerCase(),
      String(input.formSchema?.request_kind ?? '').toLowerCase()
    ].join(' ');

    const isSalary = /(salary|payroll|wages|compensation|pay_run|payrun)/.test(text);
    const isTransfer = /(transfer|treasury|cash_move|internal_transfer|fund_move|xfer|trf)/.test(text);
    return isSalary || isTransfer;
  }

  private ensureApproverInApprovalFlow(
    approvalFlowJson: Record<string, unknown> | null | undefined,
    requiredRoleSlug: string
  ) {
    const base =
      approvalFlowJson && typeof approvalFlowJson === 'object' && !Array.isArray(approvalFlowJson)
        ? { ...(approvalFlowJson as Record<string, unknown>) }
        : {};

    const rawSteps = Array.isArray(base.steps) ? base.steps : [];
    const normalizedSteps = rawSteps
      .filter((step) => step && typeof step === 'object' && !Array.isArray(step))
      .map((step) => ({ ...(step as Record<string, unknown>) }));

    const targetApprover =
      requiredRoleSlug.toLowerCase() === 'coo'
        ? { approverType: 'office', approverId: 'coo' }
        : normalizeWorkflowStepApprover({ role: requiredRoleSlug });

    const hasRequiredRole = normalizedSteps.some((step) => {
      const approver = normalizeWorkflowStepApprover(step);
      return approver.approverType === targetApprover.approverType && approver.approverId === targetApprover.approverId;
    });
    if (!hasRequiredRole) {
      if (targetApprover.approverType === 'office' || targetApprover.approverType === 'permission' || targetApprover.approverType === 'relation') {
        normalizedSteps.push({
          approver: {
            type: targetApprover.approverType,
            value: targetApprover.approverId,
          },
        });
      } else {
        normalizedSteps.push({ role: requiredRoleSlug });
      }
    }

    return {
      ...base,
      steps: normalizedSteps
    };
  }

  private async getActorRoleSlugs(actorId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { profileId: toBigInt(actorId) },
      select: { role: { select: { slug: true } } }
    });
    return new Set(roles.map((item) => String(item.role.slug || '').toLowerCase()));
  }

  private normalizeItemFileIds(item: { file_id?: string | null; file_ids?: string[] | null }) {
    return Array.from(
      new Set([item.file_id ?? null, ...(item.file_ids ?? [])].filter((id): id is string => Boolean(id)))
    );
  }

  private normalizeVoucherEvidenceFileIds(voucher: { evidence_file_id?: string | null; evidence_file_ids?: string[] | null }) {
    return Array.from(
      new Set([voucher.evidence_file_id ?? null, ...(voucher.evidence_file_ids ?? [])].filter((id): id is string => Boolean(id)))
    );
  }

  async createRequest(userId: string, dto: CreateRequestDto) {
    const requestType = await this.prisma.requestType.findUnique({ where: { id: dto.request_type_id } });
    if (!requestType || !requestType.isActive) throw new BadRequestException('Invalid request type');
    await this.formsService.validateRequestTypePayload(requestType.id, dto.data);
    this.validateLeaveRequestPayload(
      {
        name: requestType.name,
        categoryKey: requestType.categoryKey,
        formSchema: requestType.formSchema
      },
      dto.data
    );

    const createdBy = toBigInt(userId);

    if (dto.items) {
      const invalid = dto.items.find((item) => item.amount <= 0 || (item.quantity ?? 1) <= 0);
      if (invalid) throw new BadRequestException('Invalid item amount or quantity');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await this.ensureStaffRequestSequenceFloor(tx);

      const computedTotal = dto.items && dto.items.length
        ? dto.items.reduce((sum, item) => sum + (item.amount * (item.quantity ?? 1)), 0)
        : dto.total_amount;

      const fileIds = dto.items
        ? Array.from(new Set(dto.items.flatMap((item) => this.normalizeItemFileIds(item))))
        : [];
      if (fileIds.length > 0) {
        await this.ensureFileAssetsExist(tx, fileIds);
      }

      const request = await tx.requestInstance.create({
        data: {
          requestTypeId: requestType.id,
          groupId: requestType.groupId,
          createdBy,
          teamId: dto.team_id ? toBigInt(dto.team_id) : null,
          status: 'draft',
          data: dto.data as Prisma.InputJsonValue,
          totalAmount: computedTotal ?? dto.total_amount,
          currency: dto.currency || 'NGN'
        }
      });
      if (request.id < STAFF_REQUEST_ID_MIN) {
        throw new BadRequestException(
          `Automatic request ids must start from ${STAFF_REQUEST_ID_MIN.toString()}. Set request sequence before creating staff requests.`
        );
      }

      if (dto.items && dto.items.length > 0) {
        for (const item of dto.items) {
          const fileIds = this.normalizeItemFileIds(item);
          const createdItem = await tx.requestItem.create({
            data: {
              requestId: request.id,
              fileId: fileIds[0] ?? null,
              description: item.description,
              amount: item.amount,
              quantity: item.quantity ?? 1,
              categoryId: item.category_id ?? null,
              subcategoryId: item.subcategory_id ?? null,
              dueDate: item.due_date ? new Date(item.due_date) : null,
              notes: item.notes ?? null
            }
          });
          if (fileIds.length > 0) {
            await tx.requestItemFile.createMany({
              data: fileIds.map((fileId, index) => ({
                requestItemId: createdItem.id,
                fileId,
                sortOrder: index
              }))
            });
          }
        }
      }

      return request;
    });

    return this.getRequest(created.id.toString(), userId);
  }

  async createManualEntry(userId: string, dto: CreateManualRequestDto) {
    const requestType = await this.prisma.requestType.findUnique({ where: { id: dto.request_type_id } });
    if (!requestType || !requestType.isActive) throw new BadRequestException('Invalid request type');

    const staff = await this.prisma.profile.findUnique({
      where: { id: toBigInt(dto.staff_id) },
      select: { id: true, email: true, username: true, firstName: true, lastName: true }
    });
    if (!staff) throw new BadRequestException('Invalid staff_id');

    if (dto.team_id) {
      const team = await this.prisma.group.findUnique({ where: { id: toBigInt(dto.team_id) }, select: { id: true } });
      if (!team) throw new BadRequestException('Invalid team_id');
    }
    if (dto.organization_id) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: toBigInt(dto.organization_id) },
        select: { id: true }
      });
      if (!organization) throw new BadRequestException('Invalid organization_id');
    }

    const itemFileIds = (dto.items ?? []).flatMap((i) => this.normalizeItemFileIds(i));
    const voucherEvidenceIds = (dto.disbursements ?? []).flatMap((x) => this.normalizeVoucherEvidenceFileIds(x));
    const retirementIds = (dto.disbursements ?? [])
      .flatMap((x) => x.retirement_file_ids ?? [])
      .filter((x): x is string => Boolean(x));
    const allFileIds = Array.from(new Set([...itemFileIds, ...voucherEvidenceIds, ...retirementIds]));
    if (allFileIds.length) await this.ensureFileAssetsExist(this.prisma, allFileIds);
    const paidFromAccountIds = Array.from(
      new Set(
        (dto.disbursements ?? [])
          .map((x) => x.paid_from_account_id)
          .filter((x): x is string => Boolean(x))
      )
    );
    if (paidFromAccountIds.length > 0) {
      const count = await this.prisma.financeAccount.count({
        where: { id: { in: paidFromAccountIds }, isActive: true }
      });
      if (count !== paidFromAccountIds.length) throw new BadRequestException('Invalid paid_from_account_id');
    }
    const itemsTotal = (dto.items ?? []).reduce(
      (sum, item) => sum + Number(item.amount) * Number(item.quantity ?? 1),
      0
    );
    const totalAmount = dto.total_amount ?? itemsTotal;
    const createdAt = dto.created_at ? new Date(dto.created_at) : new Date();
    if (Number.isNaN(createdAt.getTime())) throw new BadRequestException('Invalid created_at');

    const explicitRequestId = dto.request_id ? toBigInt(dto.request_id) : null;
    if (explicitRequestId) {
      this.assertManualRequestIdRange(explicitRequestId);
      const taken = await this.prisma.requestInstance.findUnique({ where: { id: explicitRequestId }, select: { id: true } });
      if (taken) throw new BadRequestException(`request_id ${dto.request_id} already exists`);
    }

    const baseData: Record<string, unknown> = {
      ...(dto.data ?? {}),
      manual_import: true,
      manual_approvals: (dto.approvals ?? []).map((row) => ({
        role: row.role,
        name: row.name ?? null,
        date: row.date ?? null,
        done: row.done ?? true
      })),
      imported_at: new Date().toISOString(),
      imported_by: userId
    };
    const status = (dto.status ?? 'completed') as any;
    const created = await this.prisma.$transaction(async (tx) => {
      const request = await tx.requestInstance.create({
        data: {
          ...(explicitRequestId ? { id: explicitRequestId } : {}),
          requestTypeId: requestType.id,
          groupId: requestType.groupId,
          createdBy: staff.id,
          teamId: dto.team_id ? toBigInt(dto.team_id) : null,
          organizationId: dto.organization_id ? toBigInt(dto.organization_id) : null,
          status,
          data: baseData as Prisma.InputJsonValue,
          totalAmount,
          currency: dto.currency || 'NGN',
          createdAt,
          updatedAt: createdAt
        }
      });

      if (dto.items?.length) {
        for (const item of dto.items) {
          const fileIds = this.normalizeItemFileIds(item);
          const createdItem = await tx.requestItem.create({
            data: {
              requestId: request.id,
              description: item.description,
              amount: item.amount,
              quantity: item.quantity ?? 1,
              notes: item.notes ?? null,
              fileId: fileIds[0] ?? null
            }
          });
          if (fileIds.length > 0) {
            await tx.requestItemFile.createMany({
              data: fileIds.map((fileId, index) => ({
                requestItemId: createdItem.id,
                fileId,
                sortOrder: index
              }))
            });
          }
        }
      }

      if (dto.disbursements?.length) {
        for (const row of dto.disbursements) {
          const amount = Number(row.amount);
          const retiredAmount = Number(row.retired_amount ?? 0);
          const disbursedAt = row.disbursed_at ? new Date(row.disbursed_at) : createdAt;
          if (Number.isNaN(disbursedAt.getTime())) throw new BadRequestException('Invalid disbursement date');
          const evidenceFileIds = this.normalizeVoucherEvidenceFileIds(row);
          const createdVoucher = await tx.financePaymentVoucher.create({
            data: {
              requestId: request.id,
              voucherNumber: row.voucher_number,
              amount,
              retiredAmount,
              retirementStatus: row.retirement_status ?? (retiredAmount > 0 ? (retiredAmount >= amount ? 'retired' : 'partial') : 'not_retired'),
              method: row.method ?? null,
              transactionRef: row.transaction_ref ?? null,
              note: row.note ?? null,
              paidFromAccountId: row.paid_from_account_id ?? null,
              evidenceFileId: evidenceFileIds[0] ?? null,
              disbursedAt,
              retiredAt: retiredAmount > 0 ? disbursedAt : null,
              verifiedAt: row.retirement_status === 'verified' ? disbursedAt : null,
              metadata: {
                retirement_file_ids: row.retirement_file_ids ?? []
              } as Prisma.InputJsonValue
            }
          });
          if (evidenceFileIds.length > 0) {
            await tx.financePaymentVoucherFile.createMany({
              data: evidenceFileIds.map((fileId, index) => ({
                voucherId: createdVoucher.id,
                fileId,
                fileKind: 'evidence',
                sortOrder: index
              }))
            });
          }
        }
      }

      if (explicitRequestId) {
        await this.ensureStaffRequestSequenceFloor(tx);
      }

      return request;
    });

    return this.getRequest(created.id.toString(), userId);
  }

  async updateManualEntry(id: string, userId: string, dto: CreateManualRequestDto) {
    const existing = await this.getRequestOrThrow(id);
    const existingData =
      existing.data && typeof existing.data === 'object' && !Array.isArray(existing.data)
        ? (existing.data as Record<string, unknown>)
        : {};
    if (!existingData.manual_import) {
      throw new BadRequestException('Only manual-import requests can be updated from manual entry');
    }

    const requestType = await this.prisma.requestType.findUnique({ where: { id: dto.request_type_id } });
    if (!requestType || !requestType.isActive) throw new BadRequestException('Invalid request type');

    const staff = await this.prisma.profile.findUnique({
      where: { id: toBigInt(dto.staff_id) },
      select: { id: true }
    });
    if (!staff) throw new BadRequestException('Invalid staff_id');

    if (dto.team_id) {
      const team = await this.prisma.group.findUnique({ where: { id: toBigInt(dto.team_id) }, select: { id: true } });
      if (!team) throw new BadRequestException('Invalid team_id');
    }
    if (dto.organization_id) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: toBigInt(dto.organization_id) },
        select: { id: true }
      });
      if (!organization) throw new BadRequestException('Invalid organization_id');
    }

    const itemFileIds = (dto.items ?? []).flatMap((i) => this.normalizeItemFileIds(i));
    const voucherEvidenceIds = (dto.disbursements ?? []).flatMap((x) => this.normalizeVoucherEvidenceFileIds(x));
    const retirementIds = (dto.disbursements ?? [])
      .flatMap((x) => x.retirement_file_ids ?? [])
      .filter((x): x is string => Boolean(x));
    const allFileIds = Array.from(new Set([...itemFileIds, ...voucherEvidenceIds, ...retirementIds]));
    if (allFileIds.length) await this.ensureFileAssetsExist(this.prisma, allFileIds);
    const paidFromAccountIds = Array.from(
      new Set(
        (dto.disbursements ?? [])
          .map((x) => x.paid_from_account_id)
          .filter((x): x is string => Boolean(x))
      )
    );
    if (paidFromAccountIds.length > 0) {
      const count = await this.prisma.financeAccount.count({
        where: { id: { in: paidFromAccountIds }, isActive: true }
      });
      if (count !== paidFromAccountIds.length) throw new BadRequestException('Invalid paid_from_account_id');
    }
    const itemsTotal = (dto.items ?? []).reduce(
      (sum, item) => sum + Number(item.amount) * Number(item.quantity ?? 1),
      0
    );
    const totalAmount = dto.total_amount ?? itemsTotal;
    const createdAt = dto.created_at ? new Date(dto.created_at) : existing.createdAt;
    if (Number.isNaN(createdAt.getTime())) throw new BadRequestException('Invalid created_at');
    const desiredRequestId = dto.request_id ? toBigInt(dto.request_id) : existing.id;
    this.assertManualRequestIdRange(desiredRequestId);
    const isRequestIdChanged = desiredRequestId !== existing.id;
    if (isRequestIdChanged) {
      const taken = await this.prisma.requestInstance.findUnique({
        where: { id: desiredRequestId },
        select: { id: true }
      });
      if (taken) throw new BadRequestException(`request_id ${dto.request_id} already exists`);
    }

    const baseData: Record<string, unknown> = {
      ...(dto.data ?? {}),
      manual_import: true,
      manual_approvals: (dto.approvals ?? []).map((row) => ({
        role: row.role,
        name: row.name ?? null,
        date: row.date ?? null,
        done: row.done ?? true
      })),
      imported_at: new Date().toISOString(),
      imported_by: userId
    };
    const status = (dto.status ?? existing.status) as any;
    await this.prisma.$transaction(async (tx) => {
      if (isRequestIdChanged) {
        await tx.requestInstance.create({
          data: {
            id: desiredRequestId,
            requestTypeId: requestType.id,
            groupId: requestType.groupId,
            createdBy: staff.id,
            teamId: dto.team_id ? toBigInt(dto.team_id) : null,
            organizationId: dto.organization_id ? toBigInt(dto.organization_id) : null,
            workflowInstanceId: null,
            status,
            data: baseData as Prisma.InputJsonValue,
            totalAmount,
            currency: dto.currency || existing.currency || 'NGN',
            createdAt,
            updatedAt: new Date()
          }
        });
      } else {
        await tx.requestInstance.update({
          where: { id: existing.id },
          data: {
            requestTypeId: requestType.id,
            groupId: requestType.groupId,
            createdBy: staff.id,
            teamId: dto.team_id ? toBigInt(dto.team_id) : null,
            organizationId: dto.organization_id ? toBigInt(dto.organization_id) : null,
            status,
            data: baseData as Prisma.InputJsonValue,
            totalAmount,
            currency: dto.currency || existing.currency || 'NGN',
            createdAt,
            updatedAt: new Date()
          }
        });
      }

      await tx.requestItem.deleteMany({ where: { requestId: existing.id } });
      if (dto.items?.length) {
        for (const item of dto.items) {
          const fileIds = this.normalizeItemFileIds(item);
          const createdItem = await tx.requestItem.create({
            data: {
              requestId: desiredRequestId,
              description: item.description,
              amount: item.amount,
              quantity: item.quantity ?? 1,
              notes: item.notes ?? null,
              fileId: fileIds[0] ?? null
            }
          });
          if (fileIds.length > 0) {
            await tx.requestItemFile.createMany({
              data: fileIds.map((fileId, index) => ({
                requestItemId: createdItem.id,
                fileId,
                sortOrder: index
              }))
            });
          }
        }
      }

      await tx.financePaymentVoucher.deleteMany({ where: { requestId: existing.id } });
      if (dto.disbursements?.length) {
        for (const row of dto.disbursements) {
          const amount = Number(row.amount);
          const retiredAmount = Number(row.retired_amount ?? 0);
          const disbursedAt = row.disbursed_at ? new Date(row.disbursed_at) : createdAt;
          if (Number.isNaN(disbursedAt.getTime())) throw new BadRequestException('Invalid disbursement date');
          const evidenceFileIds = this.normalizeVoucherEvidenceFileIds(row);
          const createdVoucher = await tx.financePaymentVoucher.create({
            data: {
              requestId: desiredRequestId,
              voucherNumber: row.voucher_number,
              amount,
              retiredAmount,
              retirementStatus: row.retirement_status ?? (retiredAmount > 0 ? (retiredAmount >= amount ? 'retired' : 'partial') : 'not_retired'),
              method: row.method ?? null,
              transactionRef: row.transaction_ref ?? null,
              note: row.note ?? null,
              paidFromAccountId: row.paid_from_account_id ?? null,
              evidenceFileId: evidenceFileIds[0] ?? null,
              disbursedAt,
              retiredAt: retiredAmount > 0 ? disbursedAt : null,
              verifiedAt: row.retirement_status === 'verified' ? disbursedAt : null,
              metadata: {
                retirement_file_ids: row.retirement_file_ids ?? []
              } as Prisma.InputJsonValue
            }
          });
          if (evidenceFileIds.length > 0) {
            await tx.financePaymentVoucherFile.createMany({
              data: evidenceFileIds.map((fileId, index) => ({
                voucherId: createdVoucher.id,
                fileId,
                fileKind: 'evidence',
                sortOrder: index
              }))
            });
          }
        }
      }

      if (isRequestIdChanged) {
        await tx.requestInstance.delete({ where: { id: existing.id } });
        await this.ensureStaffRequestSequenceFloor(tx);
      }
    });

    return this.getRequest(desiredRequestId.toString(), userId);
  }

  async deleteManualEntry(id: string, userId: string) {
    const existing = await this.getRequestOrThrow(id);
    const existingData =
      existing.data && typeof existing.data === 'object' && !Array.isArray(existing.data)
        ? (existing.data as Record<string, unknown>)
        : {};
    if (!existingData.manual_import) {
      throw new BadRequestException('Only manual-import requests can be deleted from manual entry');
    }

    await this.prisma.requestInstance.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async checkManualRequestNumber(requestId?: string, requestTypeId?: string, excludeId?: string) {
    const raw = String(requestId || '').trim();
    if (!raw) {
      return { exists: false };
    }
    if (!/^\d+$/.test(raw)) {
      return { exists: false };
    }

    const where: Prisma.RequestInstanceWhereInput = {
      ...(requestTypeId ? { requestTypeId } : {}),
      ...(excludeId ? { id: { not: toBigInt(excludeId) } } : {}),
      id: toBigInt(raw)
    };

    const found = await this.prisma.requestInstance.findFirst({
      where,
      select: { id: true }
    });
    return { exists: Boolean(found), request_id: found?.id?.toString() ?? null };
  }

  async checkManualVoucherNumber(voucherNumber?: string, excludeRequestId?: string) {
    const raw = String(voucherNumber || '').trim();
    if (!raw) {
      return { exists: false };
    }
    if (!/^\d+$/.test(raw)) {
      return { exists: false };
    }

    const found = await this.prisma.financePaymentVoucher.findFirst({
      where: {
        voucherNumber: raw,
        ...(excludeRequestId ? { requestId: { not: toBigInt(excludeRequestId) } } : {})
      },
      select: {
        id: true,
        requestId: true,
        voucherNumber: true
      }
    });

    return {
      exists: Boolean(found),
      voucher_number: found?.voucherNumber ?? null,
      request_id: found?.requestId?.toString() ?? null
    };
  }

  async submitRequest(id: string, userId: string, dto: SubmitRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can submit request');
    }
    if (!['draft', 'returned'].includes(request.status)) {
      throw new BadRequestException('Request is not editable for submission');
    }

    const submitAction = request.status === 'returned' ? 'resubmit' : 'submit';
    const updated = await this.transitionRequestStatus(request, 'sent', userId, {
      action: submitAction,
      comment: dto.comment
    });

    const workflowStart = await this.workflowService.startForRequest({
      requestId: request.id,
      requestTypeId: request.requestTypeId,
      initiatedBy: userId,
      amount: request.totalAmount ? Number(request.totalAmount) : undefined
    });

    // If workflow exists, request is now in generic approval stage.
    if (workflowStart.instanceId) {
      const nextStatus = workflowStart.workflowStatus === 'approved' ? 'cleared' : 'approval';
      await this.prisma.requestInstance.update({
        where: { id: request.id },
        data: {
          status: nextStatus as any,
          data: this.withStateEvent(request.data, {
            from: 'sent',
            to: nextStatus,
            action: workflowStart.workflowStatus === 'approved' ? 'workflow_auto_approved' : 'workflow_start',
            by: userId
          })
        }
      });
    }

    try {
      const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
      const submissionMessage =
        request.status === 'returned'
          ? `Request #${request.id.toString()} resubmitted for approval.`
          : `Request #${request.id.toString()} submitted for approval.`;
      const requesterNotificationChannels = await this.buildRequestNotificationChannels({
        requestId: request.id,
        audience: 'requester',
        message: submissionMessage,
        comment: dto.comment
      });
      await this.notificationsService.create({
        userId,
        type: 'action',
        title: request.status === 'returned' ? 'Request resubmitted' : 'Request submitted',
        message: submissionMessage,
        ...requesterNotificationChannels,
        data: { requestId: request.id.toString(), comment: dto.comment },
        notifiableType: 'request',
        notifiableId: request.id,
        emailSubject:
          request.status === 'returned'
            ? `Request resubmitted (${formattedRequestNumber})`
            : `Request submitted (${formattedRequestNumber})`,
        emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
      });

      if (workflowStart.instanceId && workflowStart.workflowStatus !== 'approved') {
        await this.notifyCurrentApprovers(
          request.id,
          `Request ${formattedRequestNumber} has been sent to you for approval.`,
          `Request pending approval (${formattedRequestNumber})`,
          userId,
          dto.comment
        );
      }
    } catch (error) {
      // Do not fail request submission because notification/email delivery failed.
      console.error('submitRequest notification failed', error);
    }

    return this.getRequest(updated.id.toString(), userId);
  }

  async approveRequest(id: string, userId: string, dto: ActionRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (!['sent', 'approval'].includes(request.status)) {
      if (['cleared', 'disbursed', 'confirmed', 'retired', 'completed'].includes(request.status)) {
        return this.getRequest(request.id.toString(), userId);
      }
      throw new BadRequestException('Request is not pending approval');
    }

    if (request.workflowInstanceId) {
      let stepResult: { status: string; completed: boolean; currentStepId?: string };
      try {
        stepResult = await this.workflowService.processDecision({
          instanceId: request.workflowInstanceId,
          action: 'approve',
          performedBy: userId,
          comment: dto.comment
        });
      } catch (error) {
        if (!this.isWorkflowInactiveError(error)) {
          throw error;
        }

        const currentInstance = await this.prisma.workflowInstance.findUnique({
          where: { id: request.workflowInstanceId },
          select: { status: true }
        });

        if (currentInstance?.status === 'rejected' || currentInstance?.status === 'cancelled') {
          throw new BadRequestException('Workflow is already closed and cannot be approved');
        }

        stepResult = { status: 'approved', completed: true };
      }

      if (stepResult.status === 'pending') {
        await this.prisma.requestInstance.update({
          where: { id: request.id },
          data: { status: 'approval' }
        });
        const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
        await this.notifyCurrentApprovers(
          request.id,
          `Request ${formattedRequestNumber} has been sent to you for approval.`,
          `Request pending approval (${formattedRequestNumber})`,
          userId
        );
        return this.getRequest(request.id.toString(), userId);
      }
    }

    await this.ensureLeaveBalanceForApproval(request.id);

    const updated = await this.transitionRequestStatus(request, 'cleared', userId, {
      action: 'approve',
      comment: dto.comment
    });

    await this.applyLeaveDebitIfNeeded(request.id, userId);

    try {
      const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
      const approvalMessage = `Request #${request.id.toString()} has been approved.`;
      const requesterNotificationChannels = await this.buildRequestNotificationChannels({
        requestId: request.id,
        audience: 'requester',
        message: approvalMessage,
        comment: dto.comment
      });
      await this.notificationsService.create({
        userId: request.createdBy,
        type: 'success',
        title: 'Request approved',
        message: approvalMessage,
        ...requesterNotificationChannels,
        data: { requestId: request.id.toString(), comment: dto.comment },
        notifiableType: 'request',
        notifiableId: request.id,
        emailSubject: `Request approved (${formattedRequestNumber})`,
        emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
      });
    } catch (error) {
      console.error('approveRequest notification failed', error);
    }

    return this.getRequest(updated.id.toString(), userId);
  }

  async rejectRequest(id: string, userId: string, dto: ActionRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (!['sent', 'approval'].includes(request.status)) {
      if (['rejected', 'cancelled'].includes(request.status)) {
        return this.getRequest(request.id.toString(), userId);
      }
      throw new BadRequestException('Request is not pending approval');
    }

    if (request.workflowInstanceId) {
      try {
        await this.workflowService.processDecision({
          instanceId: request.workflowInstanceId,
          action: 'reject',
          performedBy: userId,
          comment: dto.comment
        });
      } catch (error) {
        if (!this.isWorkflowInactiveError(error)) {
          throw error;
        }

        const currentInstance = await this.prisma.workflowInstance.findUnique({
          where: { id: request.workflowInstanceId },
          select: { status: true }
        });

        if (currentInstance?.status === 'approved') {
          throw new BadRequestException('Workflow is already approved and cannot be rejected');
        }
      }
    }

    const updated = await this.transitionRequestStatus(request, 'rejected', userId, {
      action: 'reject',
      comment: dto.comment
    });

    await this.revertLeaveDebitIfNeeded(request.id, userId, 'rejected');

    try {
      const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
      const rejectionMessage = `Request #${request.id.toString()} has been rejected.`;
      const requesterNotificationChannels = await this.buildRequestNotificationChannels({
        requestId: request.id,
        audience: 'requester',
        message: rejectionMessage,
        comment: dto.comment
      });
      await this.notificationsService.create({
        userId: request.createdBy,
        type: 'warning',
        title: 'Request rejected',
        message: rejectionMessage,
        ...requesterNotificationChannels,
        data: { requestId: request.id.toString(), comment: dto.comment },
        notifiableType: 'request',
        notifiableId: request.id,
        emailSubject: `Request rejected (${formattedRequestNumber})`,
        emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
      });
    } catch (error) {
      console.error('rejectRequest notification failed', error);
    }

    return this.getRequest(updated.id.toString(), userId);
  }

  async returnRequest(id: string, userId: string, dto: ActionRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (!['sent', 'approval'].includes(request.status)) {
      if (['returned', 'draft'].includes(request.status)) {
        return this.getRequest(request.id.toString(), userId);
      }
      throw new BadRequestException('Request is not pending approval');
    }
    const reason = String(dto.comment ?? '').trim();
    if (!reason) {
      throw new BadRequestException('Return comment is required');
    }

    try {
      if (request.workflowInstanceId) {
        try {
          await this.workflowService.cancelWorkflow(
            request.workflowInstanceId,
            userId,
            `Returned for edit: ${reason}`,
          );
        } catch (error) {
          const message = String((error as Error)?.message ?? '').toLowerCase();
          const alreadyClosed = message.includes('workflow is already closed');
          if (!this.isWorkflowInactiveError(error) && !alreadyClosed) {
            throw error;
          }

          const currentInstance = await this.prisma.workflowInstance.findUnique({
            where: { id: request.workflowInstanceId },
            select: { status: true }
          });

          if (currentInstance?.status === 'approved') {
            throw new BadRequestException('Workflow is already approved and cannot be returned for edit');
          }
        }
      }

      const updated = await this.prisma.requestInstance.update({
        where: { id: request.id },
        data: {
          status: 'returned',
          workflowInstanceId: null,
          data: this.withStateEvent(request.data, {
            from: request.status,
            to: 'returned',
            by: userId,
            action: 'return',
            comment: reason
          })
        }
      });

      try {
        const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
        const returnedMessage = `Request #${request.id.toString()} was returned for correction and resubmission.`;
        const requesterNotificationChannels = await this.buildRequestNotificationChannels({
          requestId: request.id,
          audience: 'requester',
          message: returnedMessage,
          comment: reason
        });
        await this.notificationsService.create({
          userId: request.createdBy,
          type: 'warning',
          title: 'Request returned for edit',
          message: returnedMessage,
          ...requesterNotificationChannels,
          data: { requestId: request.id.toString(), comment: reason },
          notifiableType: 'request',
          notifiableId: request.id,
          emailSubject: `Request returned for edit (${formattedRequestNumber})`,
          emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
        });
      } catch (error) {
        console.error('returnRequest notification failed', error);
      }

      return this.getRequest(updated.id.toString(), userId);
    } catch (error) {
      console.error('returnRequest failed after transition attempt', {
        requestId: request.id.toString(),
        actorId: userId,
        error,
      });

      const current = await this.prisma.requestInstance.findUnique({
        where: { id: request.id },
        include: this.getRequestInclude()
      });

      if (current?.status === 'returned') {
        const serialized = this.serializeRequest(current);
        serialized.approvals = { done: [], pending: [] };
        return serialized;
      }

      throw error;
    }
  }

  async listRequests(filters: Record<string, any>, userId: string) {
    const where: any = {};

    if (filters.id) where.id = toBigInt(filters.id);
    if (filters.group_id) where.groupId = filters.group_id;
    if (filters.type_id || filters.request_type_id) where.requestTypeId = filters.type_id || filters.request_type_id;
    if (filters.status) where.status = filters.status;
    if (filters.created_by) where.createdBy = toBigInt(filters.created_by);
    if (filters.request_number) {
      const raw = String(filters.request_number).trim();
      if (/^\d+$/.test(raw)) where.id = toBigInt(raw);
    }

    // If no view-all permission, restrict to current user (handled by PermissionsGuard upstream)
    if (filters.only_mine === 'true') {
      where.createdBy = toBigInt(userId);
    }

    const data = await this.prisma.requestInstance.findMany({
      where,
      include: this.getRequestInclude()
    });
    const items = data.map((item) => this.serializeRequest(item));
    return paginatedResponse(items, { page: 1, per_page: items.length, total: items.length });
  }

  async getRequest(id: string, _userId: string): Promise<RequestResponseDto> {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) },
      include: this.getRequestInclude()
    });
    if (!request) throw new NotFoundException('Request not found');
    const serialized = this.serializeRequest(request);
    if (request.workflowInstanceId) {
      serialized.approvals = await this.getApprovalSummary(request.workflowInstanceId);
    } else {
      serialized.approvals = { done: [], pending: [] };
    }
    return serialized;
  }

  async updateRequest(id: string, userId: string, dto: UpdateRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can update request');
    }
    if (!['draft', 'returned'].includes(request.status)) {
      throw new BadRequestException('Only draft or returned requests can be updated');
    }

    if (dto.items) {
      const invalid = dto.items.find((item) => item.amount <= 0 || (item.quantity ?? 1) <= 0);
      if (invalid) throw new BadRequestException('Invalid item amount or quantity');
    }

    if (dto.data) {
      await this.formsService.validateRequestTypePayload(request.requestTypeId, dto.data);
      const requestType = await this.prisma.requestType.findUnique({
        where: { id: request.requestTypeId },
        select: { name: true, categoryKey: true, formSchema: true }
      });
      this.validateLeaveRequestPayload(
        {
          name: requestType?.name ?? null,
          categoryKey: requestType?.categoryKey ?? null,
          formSchema: requestType?.formSchema ?? null
        },
        dto.data
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const computedTotal = dto.items && dto.items.length
        ? dto.items.reduce((sum, item) => sum + (item.amount * (item.quantity ?? 1)), 0)
        : undefined;

      const fileIds = dto.items
        ? Array.from(new Set(dto.items.flatMap((item) => this.normalizeItemFileIds(item))))
        : [];
      if (fileIds.length > 0) {
        await this.ensureFileAssetsExist(tx, fileIds);
      }

      const updated = await tx.requestInstance.update({
        where: { id: request.id },
        data: {
          data:
            dto.data !== undefined
              ? (dto.data as Prisma.InputJsonValue)
              : request.data ?? Prisma.JsonNull,
          teamId: dto.team_id ? toBigInt(dto.team_id) : request.teamId,
          totalAmount: computedTotal ?? dto.total_amount ?? request.totalAmount,
          currency: dto.currency ?? request.currency
        }
      });

      if (dto.items) {
        await tx.requestItem.deleteMany({ where: { requestId: request.id } });
        if (dto.items.length > 0) {
          for (const item of dto.items) {
            const fileIds = this.normalizeItemFileIds(item);
            const createdItem = await tx.requestItem.create({
              data: {
                requestId: request.id,
                fileId: fileIds[0] ?? null,
                description: item.description,
                amount: item.amount,
                quantity: item.quantity ?? 1,
                categoryId: item.category_id ?? null,
                subcategoryId: item.subcategory_id ?? null,
                dueDate: item.due_date ? new Date(item.due_date) : null,
                notes: item.notes ?? null
              }
            });
            if (fileIds.length > 0) {
              await tx.requestItemFile.createMany({
                data: fileIds.map((fileId, index) => ({
                  requestItemId: createdItem.id,
                  fileId,
                  sortOrder: index
                }))
              });
            }
          }
        }
      }

      return updated;
    });

    return this.getRequest(updated.id.toString(), userId);
  }

  async deleteRequest(id: string, userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can delete request');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('Only draft requests can be deleted');
    }

    await this.prisma.requestInstance.delete({ where: { id: request.id } });
    return { success: true };
  }

  async getApprovals(userId: string, filters: Record<string, any>) {
    const page = Math.max(1, Number(filters.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(filters.per_page) || 20));

    const data = await this.prisma.requestInstance.findMany({
      where: {
        workflowInstanceId: { not: null }
      },
      include: this.getRequestInclude(),
      orderBy: { createdAt: 'desc' }
    });

    const userIdBigInt = toBigInt(userId);
    const instanceIds = data
      .map((item) => item.workflowInstanceId)
      .filter((id): id is string => Boolean(id));
    const myHistory =
      instanceIds.length > 0
        ? await this.prisma.workflowHistory.findMany({
            where: {
              instanceId: { in: instanceIds },
              performedBy: userIdBigInt,
              action: { in: ['approve', 'reject'] }
            },
            orderBy: { createdAt: 'desc' }
          })
        : [];
    const myActionByInstance = new Map<string, 'approve' | 'reject'>();
    for (const row of myHistory) {
      if (!myActionByInstance.has(row.instanceId) && (row.action === 'approve' || row.action === 'reject')) {
        myActionByInstance.set(row.instanceId, row.action);
      }
    }

    const serialized = await Promise.all(data.map((item) => this.serializeRequest(item)));
    const decorated = await Promise.all(
      serialized.map(async (item) => {
        const instanceId = data.find((row) => row.id.toString() === item.id)?.workflowInstanceId ?? null;
        const myAction = instanceId ? myActionByInstance.get(instanceId) : undefined;
        const done = ((item.approvals as any)?.done ?? []) as Array<{ performed_by?: string | null; action?: string }>;
        const acted = done.find((entry) => String(entry.performed_by || '') === String(userId))?.action;
        const pendingForMe = await this.isPendingApprovalForUser(item.id, userId);
        const approvalViewStatus = pendingForMe
          ? 'pending'
          : (myAction || acted) === 'approve'
            ? 'approved'
            : (myAction || acted) === 'reject'
              ? 'rejected'
              : 'none';
        return {
          ...item,
          approval_view_status: approvalViewStatus
        };
      })
    );

    let filtered = decorated.filter((item) => item.approval_view_status !== 'none');
    if (filters.status) {
      const status = String(filters.status).toLowerCase();
      filtered = filtered.filter((item) => String(item.approval_view_status).toLowerCase() === status);
    }

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return paginatedResponse(items, { page, per_page: perPage, total });
  }

  async getMyLeaveBalance(userId: string, query: Record<string, any>) {
    const actorId = toBigInt(userId);
    const year = Number(query.year ?? new Date().getFullYear());
    const leaveTypeKey = query.leave_type_key ? String(query.leave_type_key).trim().toLowerCase() : undefined;

    const where: Prisma.LeaveBalanceLedgerWhereInput = {
      userId: actorId,
      periodYear: year,
      ...(leaveTypeKey ? { leaveTypeKey } : {})
    };

    const [rows, aggregate] = await this.prisma.$transaction([
      this.prisma.leaveBalanceLedger.findMany({
        where,
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.leaveBalanceLedger.groupBy({
        by: ['leaveTypeKey'],
        where,
        orderBy: { leaveTypeKey: 'asc' },
        _sum: { deltaDays: true }
      })
    ]);

    const entitlements = await this.resolveLeaveEntitlements(actorId, year);
    const aggregateByKey = new Map<string, number>();
    for (const entry of aggregate) {
      aggregateByKey.set(entry.leaveTypeKey, Number(entry._sum?.deltaDays ?? 0));
    }

    const summaryKeys = new Set<string>([
      ...Object.keys(entitlements),
      ...Array.from(aggregateByKey.keys())
    ]);
    if (leaveTypeKey) summaryKeys.add(leaveTypeKey);

    const summary = Array.from(summaryKeys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const entitled = Number(entitlements[key] ?? 0);
        const delta = Number(aggregateByKey.get(key) ?? 0);
        return {
          leave_type_key: key,
          entitled_days: entitled,
          ledger_delta_days: delta,
          available_days: entitled + delta
        };
      })
      .filter((item) => (!leaveTypeKey ? true : item.leave_type_key === leaveTypeKey));

    return {
      user_id: actorId.toString(),
      year,
      summary,
      entries: rows.map((row) => ({
        id: row.id,
        leave_type_key: row.leaveTypeKey,
        period_year: row.periodYear,
        delta_days: Number(row.deltaDays),
        entry_type: row.entryType,
        notes: row.notes,
        source_request_id: row.sourceRequestId?.toString() ?? null,
        created_at: row.createdAt
      }))
    };
  }

  async getApprovalHistory(id: string, _userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (!request.workflowInstanceId) return [];
    return this.prisma.workflowHistory.findMany({
      where: { instanceId: request.workflowInstanceId }
    });
  }

  async getActions(id: string, userId: string) {
    const request = await this.getRequestOrThrow(id);
    const isOwner = request.createdBy === toBigInt(userId);

    if (['draft', 'returned'].includes(request.status)) return isOwner ? ['submit'] : [];
    if (['sent', 'approval'].includes(request.status)) {
      const canAct = await this.isPendingApprovalForUser(id, userId);
      return canAct ? ['approve', 'reject', 'return'] : [];
    }
    if (request.status === 'cleared') return ['disburse'];
    if (request.status === 'disbursed') return ['confirm'];
    if (request.status === 'confirmed') return ['retire'];
    if (request.status === 'retired') return ['complete'];
    return [];
  }

  async generatePdf(id: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const signatories = await this.getFinanceSignatories();
    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };
    const paymentVouchers = await this.prisma.financePaymentVoucher.findMany({
      where: { requestId: request.id },
      orderBy: { disbursedAt: 'asc' }
    });
    const requestNumber = this.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id);
    const fileName = `${this.zipSafeName(requestNumber)}.pdf`;

    const pdfBuffer = await this.buildRequestPdfDocument({
      request,
      totalAmount,
      generatedAt,
      signatories,
      approvals,
      paymentVouchers
    });

    await this.recordGeneratedArtifact(request.id, {
      type: 'request_pdf',
      file_name: fileName,
      generated_by: userId,
      generated_at: generatedAt.toISOString()
    });

    return {
      file_name: fileName,
      mime_type: 'application/pdf',
      content_base64: pdfBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString(),
      total_amount: totalAmount
    };
  }

  async generatePaymentVoucher(id: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    if (!['cleared', 'disbursed', 'confirmed', 'retired', 'completed'].includes(request.status)) {
      throw new BadRequestException('Payment voucher can only be generated for cleared/disbursed requests');
    }

    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const voucherCount = await this.prisma.financePaymentVoucher.count({
      where: {
        disbursedAt: {
          gte: new Date(generatedAt.getFullYear(), 0, 1),
          lt: new Date(generatedAt.getFullYear() + 1, 0, 1)
        }
      }
    });
    const voucherNo = `PV/${generatedAt.getFullYear()}/${String(voucherCount + 1).padStart(3, '0')}`;
    const signatories = await this.getFinanceSignatories();
    const fileName = `${this.zipSafeName(voucherNo)}.pdf`;

    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };

    const pdfBuffer = await this.buildPaymentVoucherDocument({
      request,
      voucherNo,
      totalAmount,
      generatedAt,
      approvals,
      signatories
    });

    await this.recordGeneratedArtifact(request.id, {
      type: 'payment_voucher',
      file_name: fileName,
      voucher_no: voucherNo,
      generated_by: userId,
      generated_at: generatedAt.toISOString()
    });

    return {
      voucher_no: voucherNo,
      file_name: fileName,
      mime_type: 'application/pdf',
      content_base64: pdfBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString(),
      total_amount: totalAmount
    };
  }

  async generatePaymentVoucherForVoucher(id: string, voucherId: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    const voucher = await this.prisma.financePaymentVoucher.findFirst({
      where: { requestId: request.id, id: voucherId },
      include: {
        evidenceFile: {
          select: { id: true, fileName: true, publicUrl: true }
        }
      }
    });
    if (!voucher) throw new NotFoundException('Payment voucher not found');

    const generatedAt = new Date();
    const amount = Number(voucher.amount);
    const voucherNo = voucher.voucherNumber;
    const signatories = await this.getFinanceSignatories();
    const fileName = `${this.zipSafeName(voucherNo)}.pdf`;

    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };

    const pdfBuffer = await this.buildPaymentVoucherDocument({
      request,
      voucherNo,
      totalAmount: amount,
      generatedAt,
      approvals,
      voucher: {
        method: voucher.method,
        transactionRef: voucher.transactionRef,
        notes: voucher.note,
        disbursedAt: voucher.disbursedAt
      },
      signatories
    });

    await this.recordGeneratedArtifact(request.id, {
      type: 'payment_voucher',
      file_name: fileName,
      voucher_no: voucherNo,
      generated_by: userId,
      generated_at: generatedAt.toISOString()
    });

    return {
      voucher_no: voucherNo,
      file_name: fileName,
      mime_type: 'application/pdf',
      content_base64: pdfBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString(),
      total_amount: amount
    };
  }

  async downloadByAction(id: string, userId: string, dto: DownloadRequestDto) {
    const action = dto.action ?? 'request_pdf';
    if (action === 'request_pdf') {
      return this.generatePdf(id, userId);
    }
    if (action === 'pv_pdf') {
      if (dto.voucher_id) return this.generatePaymentVoucherForVoucher(id, dto.voucher_id, userId);
      return this.generatePaymentVoucher(id, userId);
    }
    if (action === 'request_with_attachments') {
      return this.generateRequestWithAttachmentsPackage(id, userId);
    }
    if (action === 'pv_with_attachments') {
      if (!dto.voucher_id) throw new BadRequestException('voucher_id is required for pv_with_attachments');
      return this.generateVoucherWithAttachmentsPackage(id, dto.voucher_id, userId);
    }
    if (action === 'full_package') {
      return this.generateFullRequestPackage(id, userId, {
        delivery: dto.delivery ?? 'download',
        email_to: dto.email_to
      });
    }
    if (action === 'full_document') {
      return this.generateFullRequestDocument(id, userId);
    }
    throw new BadRequestException('Invalid download action');
  }

  async generateFullRequestPackage(
    id: string,
    userId: string,
    options?: { delivery?: 'download' | 'email'; email_to?: string }
  ) {
    const request = await this.getRequestForDocument(id);
    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const signatories = await this.getFinanceSignatories();
    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };
    const paymentVouchers = await this.prisma.financePaymentVoucher.findMany({
      where: { requestId: request.id },
      include: {
        evidenceFile: true,
        attachments: {
          where: { fileKind: 'evidence' },
          include: { file: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { disbursedAt: 'asc' }
    });

    const requestPdf = await this.buildRequestPdfDocument({
      request,
      totalAmount,
      generatedAt,
      signatories,
      approvals,
      paymentVouchers
    });

    const zip = new JSZip();
    const requestNumber = this.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id);
    const requestZipName = this.zipSafeName(requestNumber);
    zip.file(`request/${requestZipName}.pdf`, requestPdf);

    const fileIdSet = new Set<string>();
    const addFileByAsset = async (asset: any, targetPath: string) => {
      if (!asset?.id || fileIdSet.has(asset.id)) return;
      fileIdSet.add(asset.id);
      const fileBuffer = await this.readAssetFileBuffer(asset);
      if (fileBuffer) {
        zip.file(targetPath, fileBuffer);
      } else {
        zip.file(`${targetPath}.missing.txt`, `File not found in local storage.\nAsset ID: ${asset.id}\nPath: ${asset.storagePath ?? '-'}`);
      }
    };

    for (const item of request.items) {
      const files = Array.from(
        new Map(
          [
            ...(item.files ?? []).map((attachment: any) => attachment.file).filter(Boolean),
            item.file ?? null
          ]
            .filter(Boolean)
            .map((file: any) => [file.id, file])
        ).values()
      );
      for (const file of files) {
        await addFileByAsset(file, `request/attachments/${file.fileName}`);
      }
    }

    for (const pv of paymentVouchers) {
      const voucherZipName = this.zipSafeName(pv.voucherNumber);
      const evidenceFiles = Array.from(
        new Map(
          [
            ...(pv.attachments ?? []).map((attachment: any) => attachment.file).filter(Boolean),
            pv.evidenceFile ?? null
          ]
            .filter(Boolean)
            .map((file: any) => [file.id, file])
        ).values()
      );
      for (const file of evidenceFiles) {
        await addFileByAsset(file, `vouchers/${voucherZipName}/receipts/${file.fileName}`);
      }
      if (pv.metadata && typeof pv.metadata === 'object' && !Array.isArray(pv.metadata)) {
        const ids = (pv.metadata as Record<string, unknown>).retirement_file_ids;
        if (Array.isArray(ids)) {
          const retirementFiles = await this.prisma.fileAsset.findMany({
            where: { id: { in: ids.filter((x): x is string => typeof x === 'string') } }
          });
          for (const file of retirementFiles) {
            await addFileByAsset(file, `retirements/${voucherZipName}/${file.fileName}`);
          }
        }
      }
    }

    for (const pv of paymentVouchers) {
      const voucherZipName = this.zipSafeName(pv.voucherNumber);
      const pvPdf = await this.buildPaymentVoucherDocument({
        request,
        voucherNo: pv.voucherNumber,
        totalAmount: Number(pv.amount),
        generatedAt,
        approvals,
        voucher: {
          method: pv.method,
          transactionRef: pv.transactionRef,
          notes: pv.note,
          disbursedAt: pv.disbursedAt
        },
        signatories
      });
      zip.file(`vouchers/${voucherZipName}/${voucherZipName}.pdf`, pvPdf);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const fileName = `${requestZipName}-full-package-${this.compactDate(generatedAt)}.zip`;

    if ((options?.delivery ?? 'download') === 'email') {
      const recipient =
        options?.email_to?.trim() ||
        request.creator.email;
      if (!recipient) {
        throw new BadRequestException('No recipient email available for package delivery');
      }
      await this.mailService.send({
        to: recipient,
        subject: `Full Request Package - ${requestNumber}`,
        text: `Attached is the full request package for ${requestNumber}.`,
        threadKey: `request-${request.id.toString()}-full-package`,
        userId,
        notifiableType: 'request',
        notifiableId: request.id,
        attachments: [
          {
            filename: fileName,
            content: zipBuffer,
            contentType: 'application/zip'
          }
        ]
      });

      return {
        success: true,
        delivery: 'email',
        email_to: recipient,
        file_name: fileName,
        request_id: request.id.toString()
      };
    }

    return {
      file_name: fileName,
      mime_type: 'application/zip',
      content_base64: zipBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString()
    };
  }

  async generateRequestWithAttachmentsPackage(id: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const signatories = await this.getFinanceSignatories();
    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };
    const paymentVouchers = await this.prisma.financePaymentVoucher.findMany({
      where: { requestId: request.id },
      orderBy: { disbursedAt: 'asc' }
    });

    const requestPdf = await this.buildRequestPdfDocument({
      request,
      totalAmount,
      generatedAt,
      signatories,
      approvals,
      paymentVouchers
    });

    const requestNumber = this.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id);
    const requestZipName = this.zipSafeName(requestNumber);
    const zip = new JSZip();
    zip.file(`request/${requestZipName}.pdf`, requestPdf);
    for (const item of request.items) {
      const files = Array.from(
        new Map(
          [
            ...(item.files ?? []).map((attachment: any) => attachment.file).filter(Boolean),
            item.file ?? null
          ]
            .filter(Boolean)
            .map((file: any) => [file.id, file])
        ).values()
      );
      for (const file of files) {
        const buffer = await this.readAssetFileBuffer(file);
        if (buffer) {
          zip.file(`request/attachments/${file.fileName}`, buffer);
        }
      }
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return {
      file_name: `${requestZipName}-attachments-${this.compactDate(generatedAt)}.zip`,
      mime_type: 'application/zip',
      content_base64: zipBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString()
    };
  }

  async generateFullRequestDocument(id: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const signatories = await this.getFinanceSignatories();
    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };
    const paymentVouchers = await this.prisma.financePaymentVoucher.findMany({
      where: { requestId: request.id },
      include: {
        evidenceFile: true,
        attachments: {
          where: { fileKind: 'evidence' },
          include: { file: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { disbursedAt: 'asc' }
    });

    const requestPdf = await this.buildRequestPdfDocument({
      request,
      totalAmount,
      generatedAt,
      signatories,
      approvals,
      paymentVouchers
    });

    const mergedPdf = await PDFDocument.create();
    await this.appendPdfBuffer(mergedPdf, requestPdf);

    const skippedFiles: string[] = [];

    for (const item of request.items) {
      const files = Array.from(
        new Map(
          [
            ...(item.files ?? []).map((attachment: any) => attachment.file).filter(Boolean),
            item.file ?? null
          ]
            .filter(Boolean)
            .map((file: any) => [file.id, file])
        ).values()
      );
      for (const file of files) {
        const buffer = await this.readAssetFileBuffer(file);
        await this.appendAssetToPdf(mergedPdf, buffer, file.fileName, file.mimeType, skippedFiles);
      }
    }

    for (const pv of paymentVouchers) {
      const pvPdf = await this.buildPaymentVoucherDocument({
        request,
        voucherNo: pv.voucherNumber,
        totalAmount: Number(pv.amount),
        generatedAt,
        approvals,
        voucher: {
          method: pv.method,
          transactionRef: pv.transactionRef,
          notes: pv.note,
          disbursedAt: pv.disbursedAt
        },
        signatories
      });
      await this.appendPdfBuffer(mergedPdf, pvPdf);

      const evidenceFiles = Array.from(
        new Map(
          [
            ...(pv.attachments ?? []).map((attachment: any) => attachment.file).filter(Boolean),
            pv.evidenceFile ?? null
          ]
            .filter(Boolean)
            .map((file: any) => [file.id, file])
        ).values()
      );
      for (const file of evidenceFiles) {
        const buffer = await this.readAssetFileBuffer(file);
        await this.appendAssetToPdf(mergedPdf, buffer, file.fileName, file.mimeType, skippedFiles);
      }

      if (pv.metadata && typeof pv.metadata === 'object' && !Array.isArray(pv.metadata)) {
        const ids = (pv.metadata as Record<string, unknown>).retirement_file_ids;
        if (Array.isArray(ids)) {
          const retirementFiles = await this.prisma.fileAsset.findMany({
            where: { id: { in: ids.filter((x): x is string => typeof x === 'string') } }
          });
          for (const file of retirementFiles) {
            const buffer = await this.readAssetFileBuffer(file);
            await this.appendAssetToPdf(mergedPdf, buffer, file.fileName, file.mimeType, skippedFiles);
          }
        }
      }
    }

    if (skippedFiles.length > 0) {
      await this.appendTextPage(
        mergedPdf,
        'Attachments not embedded',
        skippedFiles.map((name) => `- ${name}`)
      );
    }

    const requestZipName = this.zipSafeName(
      this.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id)
    );
    const fileName = `${requestZipName}-full-document-${this.compactDate(generatedAt)}.pdf`;
    const pdfBuffer = Buffer.from(await mergedPdf.save());

    await this.recordGeneratedArtifact(request.id, {
      type: 'full_document',
      file_name: fileName,
      generated_by: userId,
      generated_at: generatedAt.toISOString()
    });

    return {
      file_name: fileName,
      mime_type: 'application/pdf',
      content_base64: pdfBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString()
    };
  }

  async generateVoucherWithAttachmentsPackage(id: string, voucherId: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    const voucher = await this.prisma.financePaymentVoucher.findFirst({
      where: { requestId: request.id, id: voucherId },
      include: {
        evidenceFile: true,
        attachments: {
          where: { fileKind: 'evidence' },
          include: { file: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    if (!voucher) throw new NotFoundException('Payment voucher not found');

    const generatedAt = new Date();
    const signatories = await this.getFinanceSignatories();
    const approvals = request.workflowInstanceId
      ? await this.getApprovalSummary(request.workflowInstanceId)
      : { done: [], pending: [] };

    const pvPdf = await this.buildPaymentVoucherDocument({
      request,
      voucherNo: voucher.voucherNumber,
      totalAmount: Number(voucher.amount),
      generatedAt,
      approvals,
      voucher: {
        method: voucher.method,
        transactionRef: voucher.transactionRef,
        notes: voucher.note,
        disbursedAt: voucher.disbursedAt
      },
      signatories
    });

    const zip = new JSZip();
    const voucherZipName = this.zipSafeName(voucher.voucherNumber);
    zip.file(`voucher/${voucherZipName}.pdf`, pvPdf);

    const evidenceFiles = Array.from(
      new Map(
        [
          ...(voucher.attachments ?? []).map((attachment: any) => attachment.file).filter(Boolean),
          voucher.evidenceFile ?? null
        ]
          .filter(Boolean)
          .map((file: any) => [file.id, file])
      ).values()
    );
    for (const file of evidenceFiles) {
      const evidence = await this.readAssetFileBuffer(file);
      if (evidence) {
        zip.file(`voucher/receipts/${file.fileName}`, evidence);
      }
    }

    const retirementIds: string[] =
      voucher.metadata && typeof voucher.metadata === 'object' && !Array.isArray(voucher.metadata)
        ? (((voucher.metadata as Record<string, unknown>).retirement_file_ids as unknown[]) ?? [])
            .filter((x): x is string => typeof x === 'string')
        : [];
    if (retirementIds.length) {
      const files = await this.prisma.fileAsset.findMany({ where: { id: { in: retirementIds } } });
      for (const file of files) {
        const buffer = await this.readAssetFileBuffer(file);
        if (buffer) {
          zip.file(`retirements/${file.fileName}`, buffer);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return {
      file_name: `${voucherZipName}-full-${this.compactDate(generatedAt)}.zip`,
      mime_type: 'application/zip',
      content_base64: zipBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString(),
      voucher_id: voucher.id
    };
  }

  async confirmDisbursement(id: string, userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can confirm disbursement');
    }
    if (request.status !== 'disbursed') {
      throw new BadRequestException('Request is not disbursed');
    }

    const updated = await this.transitionRequestStatus(request, 'confirmed', userId, {
      action: 'confirm_disbursement'
    });

    const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
    const confirmationMessage = `Request #${request.id.toString()} was confirmed by requester.`;
    const requesterNotificationChannels = await this.buildRequestNotificationChannels({
      requestId: request.id,
      audience: 'requester',
      message: confirmationMessage
    });
    await this.notificationsService.create({
      userId,
      type: 'success',
      title: 'Disbursement confirmed',
      message: confirmationMessage,
      ...requesterNotificationChannels,
      data: { requestId: request.id.toString() },
      notifiableType: 'request',
      notifiableId: request.id,
      emailSubject: `Disbursement confirmed (${formattedRequestNumber})`,
      emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
    });

    return this.getRequest(updated.id.toString(), userId);
  }

  async confirmPaymentVoucher(id: string, voucherId: string, userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can confirm disbursement');
    }
    const voucher = await this.prisma.financePaymentVoucher.findFirst({
      where: { requestId: request.id, id: voucherId }
    });
    if (!voucher) throw new NotFoundException('Payment voucher not found');

    const metadata =
      voucher.metadata && typeof voucher.metadata === 'object' && !Array.isArray(voucher.metadata)
        ? ({ ...(voucher.metadata as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    await this.prisma.financePaymentVoucher.update({
      where: { id: voucher.id },
      data: {
        metadata: {
          ...metadata,
          confirmed_by: userId,
          confirmed_at: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
    await this.logWorkflowEvent(request.workflowInstanceId, 'pv_confirmed', userId, {
      request_id: request.id.toString(),
      voucher_id: voucher.id,
      voucher_number: voucher.voucherNumber
    });

    const disbursedTotal = await this.prisma.financePaymentVoucher.aggregate({
      where: { requestId: request.id },
      _sum: { amount: true }
    });
    const requestTotal = Number(request.totalAmount ?? 0);
    const totalDisbursed = Number(disbursedTotal._sum.amount ?? 0);
    const shouldMoveToConfirmed = requestTotal > 0 ? totalDisbursed >= requestTotal : totalDisbursed > 0;

    if (request.status === 'disbursed' && shouldMoveToConfirmed) {
      await this.transitionRequestStatus(request, 'confirmed', userId, {
        action: 'confirm_disbursement'
      });
    }

    const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
    const voucherConfirmationMessage = `Voucher ${voucher.voucherNumber} confirmed.`;
    const requesterNotificationChannels = await this.buildRequestNotificationChannels({
      requestId: request.id,
      audience: 'requester',
      message: voucherConfirmationMessage
    });
    await this.notificationsService.create({
      userId,
      type: 'success',
      title: 'Disbursement confirmed',
      message: voucherConfirmationMessage,
      ...requesterNotificationChannels,
      data: { requestId: request.id.toString(), voucher_id: voucher.id },
      notifiableType: 'request',
      notifiableId: request.id,
      emailSubject: `Disbursement confirmed (${formattedRequestNumber})`,
      emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
    });

    return this.getRequest(request.id.toString(), userId);
  }

  async retire(id: string, userId: string, dto: RetireRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can retire request');
    }
    if (!['confirmed', 'disbursed'].includes(request.status)) {
      throw new BadRequestException('Request cannot be retired in current status');
    }

    if (dto.retirement_file_ids?.length) {
      await this.ensureFileAssetsExist(this.prisma, dto.retirement_file_ids);
    }

    const retirementResult = await this.applyRetirementToPaymentVouchers(request.id, dto);
    const shouldMarkRetired = retirementResult.outstanding_after <= 0;
    const nextStatus = shouldMarkRetired ? 'retired' : request.status;
    const retirementAction = shouldMarkRetired ? 'retire' : 'retire_partial';

    const updated = await this.prisma.requestInstance.update({
      where: { id: request.id },
      data: {
        status: nextStatus as any,
        data: this.withRetirementData(
          this.withStateEvent(request.data, {
            from: request.status,
            to: nextStatus,
            action: retirementAction,
            by: userId,
            comment: dto.notes
          }),
          dto
        )
      }
    });
    for (const touched of retirementResult.touched_vouchers) {
      await this.logWorkflowEvent(request.workflowInstanceId, 'pv_retired', userId, {
        request_id: request.id.toString(),
        voucher_id: touched.id,
        voucher_number: touched.voucher_number,
        retired_amount: touched.allocated
      });
    }
    const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
    const retirementMessage = `Retirement submitted for request #${request.id.toString()}.`;
    const requesterNotificationChannels = await this.buildRequestNotificationChannels({
      requestId: request.id,
      audience: 'requester',
      message: retirementMessage,
      comment: dto.notes
    });
    await this.notificationsService.create({
      userId,
      type: 'info',
      title: 'Retirement submitted',
      message: retirementMessage,
      ...requesterNotificationChannels,
      data: {
        requestId: request.id.toString(),
        voucher_id: dto.voucher_id ?? null,
        retired_amount: dto.retired_amount ?? null,
        outstanding_after: retirementResult.outstanding_after
      },
      notifiableType: 'request',
      notifiableId: request.id,
      emailSubject: `Retirement submitted (${formattedRequestNumber})`,
      emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
    });

    return this.getRequest(updated.id.toString(), userId);
  }

  async verifyRetirement(id: string, _userId: string) {
    const request = await this.getRequestOrThrow(id);
    const vouchers = await this.prisma.financePaymentVoucher.findMany({
      where: { requestId: request.id },
      orderBy: { disbursedAt: 'asc' }
    });
    if (vouchers.length === 0) {
      throw new BadRequestException('No payment vouchers found for this request');
    }

    const requestTotal = Number(request.totalAmount ?? 0);
    const totalDisbursed = vouchers.reduce((sum, voucher) => sum + Number(voucher.amount), 0);
    if (requestTotal > 0 && totalDisbursed < requestTotal) {
      throw new BadRequestException('Cannot complete request until total disbursement equals request total');
    }

    const retirementOutstanding = vouchers.reduce(
      (sum, voucher) => sum + Math.max(0, Number(voucher.amount) - Number(voucher.retiredAmount)),
      0
    );
    if (retirementOutstanding > 0) {
      throw new BadRequestException('Cannot complete request until all payment vouchers are fully retired');
    }

    const vouchersToVerify = vouchers.filter((voucher) => voucher.retirementStatus === 'retired');
    if (vouchersToVerify.length > 0) {
      await this.prisma.financePaymentVoucher.updateMany({
        where: { id: { in: vouchersToVerify.map((voucher) => voucher.id) } },
        data: {
          retirementStatus: 'verified',
          verifiedAt: new Date()
        }
      });
    }

    const hasUnverified = vouchers.some(
      (voucher) => !['verified'].includes(voucher.retirementStatus) && voucher.retirementStatus !== 'retired'
    );
    if (hasUnverified) {
      throw new BadRequestException('Cannot complete request until all payment vouchers are verified');
    }

    const updated = await this.transitionRequestStatus(request, 'completed', _userId, {
      action: 'complete'
    });

    for (const voucher of vouchersToVerify) {
      await this.logWorkflowEvent(request.workflowInstanceId, 'pv_verified', _userId, {
        request_id: request.id.toString(),
        voucher_id: voucher.id,
        voucher_number: voucher.voucherNumber
      });
      const formattedRequestNumber = await this.getFormattedRequestNumber(request.id);
      const verificationMessage = `Voucher ${voucher.voucherNumber} retirement has been verified.`;
      const requesterNotificationChannels = await this.buildRequestNotificationChannels({
        requestId: request.id,
        audience: 'requester',
        message: verificationMessage
      });
      await this.notificationsService.create({
        userId: request.createdBy,
        type: 'success',
        title: 'Retirement verified',
        message: verificationMessage,
        ...requesterNotificationChannels,
        data: { requestId: request.id.toString(), voucher_id: voucher.id, voucher_number: voucher.voucherNumber },
        notifiableType: 'request',
        notifiableId: request.id,
        emailSubject: `Retirement verified (${formattedRequestNumber})`,
        emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
      });
    }

    return this.getRequest(updated.id.toString(), _userId);
  }

  private async getRequestOrThrow(id: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) }
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  private validateLeaveRequestPayload(
    requestType: { name?: string | null; categoryKey?: string | null; formSchema?: unknown } | null,
    data: unknown
  ) {
    if (!this.isLeaveRequestType(requestType?.name ?? null, requestType?.categoryKey ?? null, requestType?.formSchema)) {
      return;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException('Leave request data is required');
    }

    const payload = data as Record<string, unknown>;
    const schema =
      requestType?.formSchema && typeof requestType.formSchema === 'object' && !Array.isArray(requestType.formSchema)
        ? (requestType.formSchema as Record<string, unknown>)
        : {};
    const reason = String(payload.leave_reason ?? payload.reason_for_leave ?? payload.purpose ?? '').trim();
    const handoverUserId = String(payload.handover_user_id ?? '').trim();
    const handoverNotes = String(payload.handover_notes ?? '').trim();
    const startDateValue = String(payload.start_date ?? '').trim();
    const endDateValue = String(payload.end_date ?? '').trim();
    const minNoticeDays = Number(schema.min_notice_days ?? 0);
    const maxDaysPerRequest = Number(schema.max_days_per_request ?? 0);
    const allowHalfDay = Boolean(schema.allow_half_day ?? false);
    const daysRequestedRaw = Number(payload.days_requested ?? payload.days ?? 0);
    const daysRequested = Number.isFinite(daysRequestedRaw) && daysRequestedRaw > 0
      ? daysRequestedRaw
      : this.computeLeaveDays(startDateValue, endDateValue);

    if (!reason) throw new BadRequestException('Leave reason is required');
    if (!startDateValue || !endDateValue) throw new BadRequestException('Leave start and end dates are required');
    if (daysRequested <= 0) throw new BadRequestException('Leave days requested must be greater than zero');
    if (!allowHalfDay && !Number.isInteger(daysRequested)) {
      throw new BadRequestException('Half-day leave is not allowed for this leave type');
    }
    if (Number.isFinite(maxDaysPerRequest) && maxDaysPerRequest > 0 && daysRequested > maxDaysPerRequest) {
      throw new BadRequestException(`This leave type allows maximum ${maxDaysPerRequest} day(s) per request`);
    }
    if (Number.isFinite(minNoticeDays) && minNoticeDays > 0) {
      const startDate = new Date(startDateValue);
      if (!Number.isNaN(startDate.getTime())) {
        startDate.setHours(0, 0, 0, 0);
        const threshold = new Date();
        threshold.setHours(0, 0, 0, 0);
        threshold.setDate(threshold.getDate() + minNoticeDays);
        if (startDate < threshold) {
          throw new BadRequestException(`Leave must be requested at least ${minNoticeDays} day(s) in advance`);
        }
      }
    }
    if (!handoverUserId) throw new BadRequestException('Handover colleague is required');
    if (!handoverNotes) throw new BadRequestException('Handover notes are required');
  }

  private async applyLeaveDebitIfNeeded(requestId: bigint, actorId: string) {
    const leave = await this.getLeaveRequestMeta(requestId);
    if (!leave) return;

    const existingDebit = await this.prisma.leaveBalanceLedger.findFirst({
      where: {
        sourceRequestId: requestId,
        entryType: 'request_debit'
      }
    });
    if (existingDebit) return;

    await this.ensureLeaveBalanceForApproval(requestId);

    await this.prisma.leaveBalanceLedger.create({
      data: {
        userId: leave.user_id,
        leaveTypeKey: leave.leave_type_key,
        periodYear: leave.period_year,
        deltaDays: -leave.days_requested,
        entryType: 'request_debit',
        sourceRequestId: requestId,
        notes: `Leave approved for request ${requestId.toString()}`,
        createdBy: toBigInt(actorId),
        metadata: {
          request_id: requestId.toString(),
          leave_type_key: leave.leave_type_key
        } as Prisma.InputJsonValue
      }
    });
  }

  private async ensureLeaveBalanceForApproval(requestId: bigint) {
    const leave = await this.getLeaveRequestMeta(requestId);
    if (!leave) return;

    const existingDebit = await this.prisma.leaveBalanceLedger.findFirst({
      where: {
        sourceRequestId: requestId,
        entryType: 'request_debit'
      }
    });
    if (existingDebit) return;

    const entitlements = await this.resolveLeaveEntitlements(leave.user_id, leave.period_year);
    const entitledDays = Number(entitlements[leave.leave_type_key] ?? 0);

    const aggregate = await this.prisma.leaveBalanceLedger.aggregate({
      where: {
        userId: leave.user_id,
        leaveTypeKey: leave.leave_type_key,
        periodYear: leave.period_year
      },
      _sum: { deltaDays: true }
    });
    const ledgerDelta = Number(aggregate._sum.deltaDays ?? 0);
    const availableDays = entitledDays + ledgerDelta;
    if (availableDays < leave.days_requested) {
      throw new BadRequestException(
        `Insufficient leave balance for ${leave.leave_type_key}. Available ${availableDays}, requested ${leave.days_requested}`
      );
    }
  }

  private async revertLeaveDebitIfNeeded(requestId: bigint, actorId: string, reason: string) {
    const debit = await this.prisma.leaveBalanceLedger.findFirst({
      where: {
        sourceRequestId: requestId,
        entryType: 'request_debit'
      }
    });
    if (!debit) return;

    const existingReversal = await this.prisma.leaveBalanceLedger.findFirst({
      where: {
        sourceRequestId: requestId,
        entryType: 'reversal'
      }
    });
    if (existingReversal) return;

    await this.prisma.leaveBalanceLedger.create({
      data: {
        userId: debit.userId,
        leaveTypeKey: debit.leaveTypeKey,
        periodYear: debit.periodYear,
        deltaDays: Math.abs(Number(debit.deltaDays)),
        entryType: 'reversal',
        sourceRequestId: requestId,
        notes: `Leave debit reversed: ${reason}`,
        createdBy: toBigInt(actorId),
        metadata: {
          request_id: requestId.toString(),
          reason
        } as Prisma.InputJsonValue
      }
    });
  }

  private async getLeaveRequestMeta(requestId: bigint): Promise<{
    user_id: bigint;
    leave_type_key: string;
    days_requested: number;
    period_year: number;
  } | null> {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      include: {
        requestType: { select: { name: true, categoryKey: true, formSchema: true } }
      }
    });
    if (!request) return null;
    if (
      !this.isLeaveRequestType(
        request.requestType?.name ?? null,
        request.requestType?.categoryKey ?? null,
        request.requestType?.formSchema ?? null
      )
    ) {
      return null;
    }

    const data =
      request.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? (request.data as Record<string, unknown>)
        : {};
    const leaveTypeRaw = this.resolveLeaveTypeKey(
      data,
      request.requestType?.name ?? null,
      request.requestType?.formSchema ?? null
    );

    let daysRequested = Number(data.days_requested ?? data.days ?? 0);
    if (!Number.isFinite(daysRequested) || daysRequested <= 0) {
      const start = data.start_date ? new Date(String(data.start_date)) : null;
      const end = data.end_date ? new Date(String(data.end_date)) : null;
      if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
        const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        daysRequested = diff + 1;
      }
    }
    if (!Number.isFinite(daysRequested) || daysRequested <= 0) return null;

    const startDate = data.start_date ? new Date(String(data.start_date)) : request.createdAt;
    const year = startDate.getFullYear();

    return {
      user_id: request.createdBy,
      leave_type_key: leaveTypeRaw,
      days_requested: Number(daysRequested.toFixed(2)),
      period_year: year
    };
  }

  private computeLeaveDays(startDateValue: string, endDateValue: string) {
    const start = startDateValue ? new Date(startDateValue) : null;
    const end = endDateValue ? new Date(endDateValue) : null;
    if (!start || !end) return 0;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end < start) return 0;
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }

  private async resolveLeaveEntitlements(userId?: bigint, year = new Date().getFullYear()) {
    const { entitlements, carryoverCaps } = await this.getDefaultLeaveRulesFromRequestTypes();
    const now = new Date();
    const context = userId ? await this.resolvePolicyContextForUser(userId) : null;

    const rows = await this.prisma.policy.findMany({
      where: {
        module: 'leave',
        policyKey: { in: ['leave_entitlements', 'entitlement'] },
        NOT: { scopeType: 'global' },
        isActive: true,
        OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }]
      },
      orderBy: [{ scopeType: 'asc' }, { priority: 'asc' }, { createdAt: 'asc' }]
    });

    const matched = rows
      .filter((row) => {
        if (!context) return row.scopeType === 'global';
        return this.policyScopeMatches(row.scopeType, row.scopeId, context);
      })
      .sort((a, b) => {
        const rankDelta = this.policyScopeRank(a.scopeType) - this.policyScopeRank(b.scopeType);
        if (rankDelta !== 0) return rankDelta;
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    for (const row of matched) {
      const cfg =
        row.configJson && typeof row.configJson === 'object' && !Array.isArray(row.configJson)
          ? (row.configJson as Record<string, unknown>)
          : {};
      for (const [key, value] of Object.entries(cfg)) {
        const n = Number(value ?? 0);
        if (!Number.isFinite(n) || n < 0) continue;
        entitlements[String(key).toLowerCase()] = n;
      }
    }

    if (userId && Number.isFinite(year) && year > 2000) {
      const previousYear = year - 1;
      const previousDeltaRows = await this.prisma.leaveBalanceLedger.groupBy({
        by: ['leaveTypeKey'],
        where: {
          userId,
          periodYear: previousYear
        },
        _sum: {
          deltaDays: true
        }
      });
      const previousDeltaByKey = new Map(
        previousDeltaRows.map((row) => [row.leaveTypeKey, Number(row._sum?.deltaDays ?? 0)])
      );
      const baseEntitlements = { ...entitlements };

      for (const [key, capRaw] of Object.entries(carryoverCaps)) {
        const cap = Number(capRaw ?? 0);
        if (!Number.isFinite(cap) || cap <= 0) continue;
        const previousAvailable = Number(baseEntitlements[key] ?? 0) + Number(previousDeltaByKey.get(key) ?? 0);
        const carry = Math.min(cap, Math.max(previousAvailable, 0));
        entitlements[key] = Number(entitlements[key] ?? 0) + carry;
      }
    }

    return entitlements;
  }

  private isLeaveRequestType(name: string | null, categoryKey: string | null, formSchema: unknown) {
    const normalizedName = String(name ?? '').toLowerCase();
    const normalizedCategory = String(categoryKey ?? '').toLowerCase();
    const schema =
      formSchema && typeof formSchema === 'object' && !Array.isArray(formSchema)
        ? (formSchema as Record<string, unknown>)
        : {};
    const schemaLeaveTypeKey = String(schema.leave_type_key ?? '').trim().toLowerCase();
    return (
      normalizedCategory.includes('leave') ||
      normalizedName.includes('leave') ||
      schemaLeaveTypeKey.length > 0
    );
  }

  private resolveLeaveTypeKey(data: Record<string, unknown>, requestTypeName: string | null, formSchema: unknown) {
    const schema =
      formSchema && typeof formSchema === 'object' && !Array.isArray(formSchema)
        ? (formSchema as Record<string, unknown>)
        : {};
    const fromPayload = String(data.leave_type_key ?? data.leave_type ?? '').trim().toLowerCase();
    if (fromPayload) return fromPayload;
    const fromSchema = String(schema.leave_type_key ?? '').trim().toLowerCase();
    if (fromSchema) return fromSchema;
    const fromName = String(requestTypeName ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return fromName || 'annual_leave';
  }

  private async getDefaultLeaveRulesFromRequestTypes() {
    const types = await this.prisma.requestType.findMany({
      where: { isActive: true },
      select: {
        name: true,
        categoryKey: true,
        formSchema: true
      }
    });

    const defaults: Record<string, number> = {};
    const carryoverCaps: Record<string, number> = {};
    for (const type of types) {
      if (!this.isLeaveRequestType(type.name, type.categoryKey, type.formSchema)) continue;
      const schema =
        type.formSchema && typeof type.formSchema === 'object' && !Array.isArray(type.formSchema)
          ? (type.formSchema as Record<string, unknown>)
          : {};
      const key = this.resolveLeaveTypeKey({}, type.name, schema);
      if (!key) continue;
      const entitled = Number(schema.entitled_days_per_year ?? 0);
      defaults[key] = Number.isFinite(entitled) && entitled > 0 ? entitled : 0;
      const carryover = Number(schema.max_carryover_days ?? 0);
      carryoverCaps[key] = Number.isFinite(carryover) && carryover > 0 ? carryover : 0;
    }

    return {
      entitlements: defaults,
      carryoverCaps
    };
  }

  private async resolvePolicyContextForUser(userId: bigint) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: {
        employeeProfile: { select: { primaryOrganizationId: true, primaryTeamId: true, employmentType: true } }
      }
    });

    return {
      user_id: userId.toString(),
      organization_id: profile?.employeeProfile?.primaryOrganizationId?.toString(),
      team_id: profile?.employeeProfile?.primaryTeamId?.toString(),
      staff_type: profile?.employeeProfile?.employmentType ?? undefined
    };
  }

  private policyScopeMatches(
    scopeType: string,
    scopeId: string | null,
    context: { organization_id?: string; team_id?: string; staff_type?: string; user_id?: string }
  ) {
    if (scopeType === 'global') return true;
    if (!scopeId) return false;
    if (scopeType === 'organization') return context.organization_id === scopeId;
    if (scopeType === 'team') return context.team_id === scopeId;
    if (scopeType === 'staff_type') return context.staff_type === scopeId;
    if (scopeType === 'user') return context.user_id === scopeId;
    return false;
  }

  private policyScopeRank(scopeType: string) {
    if (scopeType === 'global') return 0;
    if (scopeType === 'organization') return 1;
    if (scopeType === 'team') return 2;
    if (scopeType === 'staff_type') return 3;
    if (scopeType === 'user') return 4;
    return 99;
  }

  private async getRequestForDocument(id: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) },
      include: this.getRequestInclude()
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  private resolveTotalAmount(request: {
    totalAmount: Prisma.Decimal | null;
    items: Array<{ amount: Prisma.Decimal; quantity: number }>;
  }): number {
    if (request.totalAmount !== null) {
      return Number(request.totalAmount);
    }
    return request.items.reduce((sum, item) => sum + Number(item.amount) * item.quantity, 0);
  }

  private compactDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  private zipSafeName(value: string): string {
    return String(value || '')
      .replace(/[\\/]+/g, '-')
      .replace(/[\u0000-\u001f\u007f]+/g, '')
      .trim();
  }

  private formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  private formatDate(value: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  private formatDateTime(value: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private toTitle(input: string): string {
    return input
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  private paymentMethodLabel(method: string | null): string {
    if (!method) return '-';
    return this.toTitle(method);
  }

  private getPdfLogoDataUri(): string | null {
    const explicit = process.env.PDF_LOGO_PATH;
    const candidates = [
      explicit,
      resolve(process.cwd(), 'public/branding/logo.png'),
      resolve(process.cwd(), '../PWA/public/logo/logo.png'),
      resolve(process.cwd(), 'public/logo/logo.png')
    ].filter((v): v is string => Boolean(v));

    for (const path of candidates) {
      if (!existsSync(path)) continue;
      try {
        const ext = extname(path).toLowerCase();
        const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const data = readFileSync(path);
        return `data:${mime};base64,${data.toString('base64')}`;
      } catch {
        continue;
      }
    }
    return null;
  }

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async resolveNameFromReference(value: unknown, kind: 'team' | 'organization' | 'taxonomy_term'): Promise<string> {
    if (value === undefined || value === null || value === '') return '-';
    const raw = String(value);
    try {
      if (kind === 'team' && /^\d+$/.test(raw)) {
        const team = await this.prisma.group.findUnique({ where: { id: toBigInt(raw) }, select: { name: true } });
        return team?.name ?? raw;
      }
      if (kind === 'organization' && /^\d+$/.test(raw)) {
        const org = await this.prisma.organization.findUnique({ where: { id: toBigInt(raw) }, select: { name: true } });
        return org?.name ?? raw;
      }
      if (kind === 'taxonomy_term' && this.looksLikeUuid(raw)) {
        const term = await this.prisma.taxonomyTerm.findUnique({ where: { id: raw }, select: { label: true } });
        return term?.label ?? raw;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  private async readAssetFileBuffer(asset: {
    storagePath?: string | null;
    publicUrl?: string | null;
    fileName?: string | null;
  }): Promise<Buffer | null> {
    const storagePath = asset.storagePath || asset.publicUrl || '';
    if (!storagePath) return null;

    const candidates = [
      storagePath,
      resolve(process.cwd(), storagePath),
      resolve(process.cwd(), '..', storagePath),
      resolve(process.cwd(), 'uploads', storagePath)
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      if (existsSync(candidate)) {
        try {
          return await readFile(candidate);
        } catch {
          // ignore and continue
        }
      }
    }

    if (/^https?:\/\//i.test(storagePath)) {
      try {
        const res = await fetch(storagePath);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch {
        // ignore fetch failure
      }
    }
    return null;
  }

  private async appendPdfBuffer(target: PDFDocument, pdfBuffer: Buffer) {
    const source = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = await target.copyPages(source, source.getPageIndices());
    for (const page of pages) target.addPage(page);
  }

  private async appendAssetToPdf(
    target: PDFDocument,
    fileBuffer: Buffer | null,
    fileName: string,
    mimeType: string | null | undefined,
    skippedFiles: string[]
  ) {
    if (!fileBuffer) {
      skippedFiles.push(`${fileName} (missing file)`);
      return;
    }

    const mime = String(mimeType || '').toLowerCase();
    const extension = extname(fileName).toLowerCase();

    if (mime === 'application/pdf' || extension === '.pdf') {
      await this.appendPdfBuffer(target, fileBuffer);
      return;
    }

    if (mime === 'image/png' || extension === '.png') {
      const image = await target.embedPng(fileBuffer);
      await this.appendImagePage(target, image, fileName);
      return;
    }

    if (mime === 'image/jpeg' || mime === 'image/jpg' || extension === '.jpg' || extension === '.jpeg') {
      const image = await target.embedJpg(fileBuffer);
      await this.appendImagePage(target, image, fileName);
      return;
    }

    skippedFiles.push(fileName);
  }

  private async appendImagePage(
    target: PDFDocument,
    image: { width: number; height: number; scale: (factor: number) => { width: number; height: number }; },
    label: string
  ) {
    const page = target.addPage([595.28, 841.89]);
    const margin = 36;
    const headerSpace = 32;
    const availableWidth = page.getWidth() - margin * 2;
    const availableHeight = page.getHeight() - margin * 2 - headerSpace;
    const ratio = Math.min(availableWidth / image.width, availableHeight / image.height, 1);
    const dims = image.scale(ratio);
    page.drawImage(image as any, {
      x: (page.getWidth() - dims.width) / 2,
      y: margin,
      width: dims.width,
      height: dims.height
    });
    const font = await target.embedFont(StandardFonts.Helvetica);
    page.drawText(label, {
      x: margin,
      y: page.getHeight() - margin + 4,
      size: 10,
      font
    });
  }

  private async appendTextPage(target: PDFDocument, title: string, lines: string[]) {
    const page = target.addPage([595.28, 841.89]);
    const font = await target.embedFont(StandardFonts.Helvetica);
    const bold = await target.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, {
      x: 40,
      y: 800,
      size: 16,
      font: bold
    });
    let y = 772;
    for (const line of lines) {
      page.drawText(line, {
        x: 40,
        y,
        size: 11,
        font
      });
      y -= 16;
      if (y < 50) break;
    }
  }

  private amountToWords(amount: number): string {
    const units = [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const toWords = (n: number): string => {
      if (n < 20) return units[n];
      if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${units[n % 10]}` : ''}`;
      if (n < 1000) return `${units[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${toWords(n % 100)}` : ''}`;
      if (n < 1000000) return `${toWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${toWords(n % 1000)}` : ''}`;
      if (n < 1000000000) return `${toWords(Math.floor(n / 1000000))} Million${n % 1000000 ? ` ${toWords(n % 1000000)}` : ''}`;
      return `${toWords(Math.floor(n / 1000000000))} Billion${n % 1000000000 ? ` ${toWords(n % 1000000000)}` : ''}`;
    };

    const whole = Math.floor(amount);
    return `${toWords(Math.max(0, whole))} Naira Only`;
  }


  private renderApprovalRoleRow(input: {
    roleLabel: string;
    actorName: string | null;
    dateText: string;
    done: boolean;
  }): string {
    const displayName = input.actorName ? this.escapeHtml(input.actorName) : 'Pending';
    return `<div class="approval-row">
      <div class="approval-left">
        <div class="approval-title">${this.escapeHtml(input.roleLabel)}</div>
        <div class="approval-name">${displayName}</div>
      </div>
      <div class="approval-right">
        ${input.done ? `<div class="sig">${displayName}</div>` : `<div class="sig-line"></div>`}
        <div class="muted">${this.escapeHtml(input.dateText)}</div>
      </div>
    </div>`;
  }

  private renderVoucherPageHtml(input: {
    voucherNo: string;
    dateText: string;
    payee: string;
    contact: string;
    itemsHtml: string;
    totalMoney: string;
    purpose: string;
    amountWords: string;
    method: string | null;
    details: string;
    preparedBy: string;
    preparedDate: string;
    cooBy: string;
    cooDate: string;
    cooDone: boolean;
    edBy: string;
    edDate: string;
    edDone: boolean;
    remarks?: string | null;
    pageBreak?: boolean;
    logoDataUri?: string | null;
  }): string {
    const { method } = input;
    return `<div class="${input.pageBreak ? 'page-break' : ''}">
      <div class="box">
        ${input.logoDataUri ? `<div style="text-align:center; margin-bottom:8px;"><img src="${input.logoDataUri}" alt="Logo" style="height:42px;" /></div>` : ''}
        <div class="title">PAYMENT VOUCHER</div>
        <div class="row two">
          <div><strong>Voucher No:</strong> ${this.escapeHtml(input.voucherNo)}</div>
          <div><strong>Date:</strong> ${this.escapeHtml(input.dateText)}</div>
        </div>
        <div class="row"><div><strong>Payee Name:</strong></div><div class="line">${this.escapeHtml(input.payee)}</div></div>
        <div class="row"><div><strong>Address / Contact:</strong></div><div class="line">${this.escapeHtml(input.contact)}</div></div>
        <div class="row">
          <strong>Payment Items</strong>
          <table class="tbl">
            <thead><tr><th style="width:56px;">S/N</th><th>Description / Item</th><th style="width:160px;">Amount</th></tr></thead>
            <tbody>${input.itemsHtml}<tr class="total"><td colspan="2">Total</td><td>${this.escapeHtml(input.totalMoney)}</td></tr></tbody>
          </table>
        </div>
        <div class="row"><strong>Description / Purpose of Payment:</strong><div class="line">${this.escapeHtml(input.purpose)}</div></div>
        <div class="row two">
          <div><strong>Amount:</strong> ${this.escapeHtml(input.totalMoney)}</div>
          <div><strong>Amount in Words:</strong> ${this.escapeHtml(input.amountWords)}</div>
        </div>
        <div class="row"><strong>Payment Method:</strong><div style="margin-top:4px;">
          ${method === 'cash' ? '☑' : '☐'} Cash &nbsp;&nbsp;
          ${method === 'bank_transfer' || method === 'transfer' ? '☑' : '☐'} Transfer &nbsp;&nbsp;
          ${method === 'cheque' ? '☑' : '☐'} Cheque
        </div></div>
        <div class="row"><strong>If Transfer / Cheque, Details:</strong><div class="line">${this.escapeHtml(input.details)}</div></div>
        <div class="approvals">
          <strong>Approvals:</strong>
          <div class="approval"><div><strong>Prepared By (Accountant):</strong> ${this.escapeHtml(input.preparedBy)}</div><div class="muted">${this.escapeHtml(input.preparedDate)}</div></div>
          <div class="approval"><div><strong>[${input.cooDone ? '✓' : ' '}] Approved By (COO):</strong> ${this.escapeHtml(input.cooBy)}</div><div class="muted">${this.escapeHtml(input.cooDate)}</div></div>
          <div class="approval"><div><strong>[${input.edDone ? '✓' : ' '}] Approved By (ED):</strong> ${this.escapeHtml(input.edBy)}</div><div class="muted">${this.escapeHtml(input.edDate)}</div></div>
          ${input.remarks ? `<div class="row"><strong>Remarks:</strong><div>${this.escapeHtml(input.remarks)}</div></div>` : ''}
        </div>
      </div>
    </div>`;
  }

  private buildSimplePdfFromLines(lines: string[]): Buffer {
    const sanitized = lines.map((line) =>
      String(line).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    );
    const stream = [
      'BT',
      '/F1 11 Tf',
      '50 790 Td',
      '14 TL',
      ...sanitized.map((line, index) => (index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)),
      'ET'
    ].join('\n');

    const header = '%PDF-1.4\n';
    const objects: string[] = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
      `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
    ];

    const xref: number[] = [0];
    let body = '';
    for (const obj of objects) {
      xref.push(header.length + body.length);
      body += obj;
    }

    const xrefStart = header.length + body.length;
    const xrefLines = ['xref', `0 ${xref.length}`, '0000000000 65535 f '];
    for (let i = 1; i < xref.length; i += 1) {
      xrefLines.push(`${String(xref[i]).padStart(10, '0')} 00000 n `);
    }

    const trailer = [
      'trailer',
      `<< /Size ${xref.length} /Root 1 0 R >>`,
      'startxref',
      String(xrefStart),
      '%%EOF'
    ].join('\n');

    return Buffer.from(`${header}${body}${xrefLines.join('\n')}\n${trailer}\n`, 'utf8');
  }

  private async buildRequestPdfDocument(input: {
    request: {
      id: bigint;
      status: string;
      currency: string;
      createdAt: Date;
      data: Prisma.JsonValue | null;
      requestType: { name: string; codePrefix: string };
      group: { name: string };
      creator: {
        username: string | null;
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
      items: Array<{
        description: string;
        amount: Prisma.Decimal;
        quantity: number;
      }>;
    };
    totalAmount: number;
    generatedAt: Date;
    signatories: {
      prepared_by: { name: string; title: string };
      reviewed_by: { name: string; title: string };
      approved_by: { name: string; title: string };
    };
    approvals: {
      done: Array<{ action: string; step: string; performed_by_name?: string | null; at: Date | string }>;
      pending: Array<{ step: string; approver_type: string; approver_id: string | null }>;
    };
    paymentVouchers: Array<{
      voucherNumber: string;
      amount: Prisma.Decimal;
      retiredAmount: Prisma.Decimal;
      retirementStatus: string;
      method: string | null;
      transactionRef: string | null;
      disbursedAt: Date;
      retiredAt: Date | null;
      verifiedAt: Date | null;
    }>;
  }): Promise<Buffer> {
    const { request, totalAmount, generatedAt, signatories, approvals, paymentVouchers } = input;
    const currency = request.currency || 'NGN';
    const logoDataUri = this.getPdfLogoDataUri();
    const data =
      request.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? (request.data as Record<string, unknown>)
        : {};
    const requesterName =
      `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() ||
      request.creator.username ||
      request.creator.email;
    const requestNumber = this.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id);

    const disbursedTotal = paymentVouchers.reduce((sum, pv) => sum + Number(pv.amount), 0);
    const retiredTotal = paymentVouchers.reduce((sum, pv) => sum + Number(pv.retiredAmount), 0);
    const unreleased = Math.max(0, totalAmount - disbursedTotal);
    const unspent = Math.max(0, disbursedTotal - retiredTotal);
    const netVariance = totalAmount - retiredTotal;

    const teamName = await this.resolveNameFromReference(
      data.team_name ?? data.team ?? data.team_id ?? (request as any).teamId ?? null,
      'team'
    );
    const organizationName = await this.resolveNameFromReference(
      data.organization_name ?? data.organization ?? data.organization_id ?? (request as any).organizationId ?? null,
      'organization'
    );
    const projectName = await this.resolveNameFromReference(
      data.project_name ?? data.project_id ?? '-',
      'taxonomy_term'
    );
    const categoryName = await this.resolveNameFromReference(
      data.category_name ?? data.category ?? data.category_id ?? '-',
      'taxonomy_term'
    );

    const findStep = (matcher: RegExp) => approvals.done.find((row) => matcher.test(row.step));
    const teamLeadStepMatcher = /team[\s_-]*lead/i;
    const accountantStepMatcher = /\b(accountant|finance)\b/i;
    const cooStepMatcher = /\bcoo\b/i;
    const edStepMatcher = /\bed\b|executive director/i;
    const manualApprovals = Array.isArray(data.manual_approvals)
      ? (data.manual_approvals as Array<Record<string, unknown>>)
      : [];
    const manualFor = (matcher: RegExp) =>
      manualApprovals.find((row) => matcher.test(String(row.role ?? '')));
    const roleRows: string[] = [];
    const teamLead = findStep(teamLeadStepMatcher);
    const manualTeamLead = manualFor(teamLeadStepMatcher);
    roleRows.push(
      this.renderApprovalRoleRow({
        roleLabel: 'Team Lead',
        actorName: teamLead?.performed_by_name ?? (typeof manualTeamLead?.name === 'string' ? manualTeamLead.name : null),
        dateText: teamLead
          ? this.formatDate(teamLead.at)
          : (typeof manualTeamLead?.date === 'string' ? this.formatDate(manualTeamLead.date) : 'Pending'),
        done: Boolean(teamLead) || Boolean(manualTeamLead?.done)
      })
    );
    const accountant = findStep(accountantStepMatcher);
    const manualAccountant = manualFor(accountantStepMatcher);
    roleRows.push(
      this.renderApprovalRoleRow({
        roleLabel: 'Accountant',
        actorName: accountant?.performed_by_name ?? (typeof manualAccountant?.name === 'string' ? manualAccountant.name : null),
        dateText: accountant
          ? this.formatDate(accountant.at)
          : (typeof manualAccountant?.date === 'string' ? this.formatDate(manualAccountant.date) : 'Pending'),
        done: Boolean(accountant) || Boolean(manualAccountant?.done)
      })
    );
    const coo = findStep(cooStepMatcher);
    const manualCoo = manualFor(cooStepMatcher);
    roleRows.push(
      this.renderApprovalRoleRow({
        roleLabel: 'COO',
        actorName: coo?.performed_by_name ?? (typeof manualCoo?.name === 'string' ? manualCoo.name : null),
        dateText: coo
          ? this.formatDate(coo.at)
          : (typeof manualCoo?.date === 'string' ? this.formatDate(manualCoo.date) : 'Pending'),
        done: Boolean(coo) || Boolean(manualCoo?.done)
      })
    );
    const ed = findStep(edStepMatcher);
    const edRequired =
      approvals.done.some((row) => edStepMatcher.test(row.step)) ||
      approvals.pending.some((row) => edStepMatcher.test(row.step)) ||
      manualApprovals.some((row) => edStepMatcher.test(String(row.role ?? '')));
    if (edRequired) {
      const manualEd = manualFor(edStepMatcher);
      roleRows.push(
        this.renderApprovalRoleRow({
          roleLabel: 'ED',
          actorName: ed?.performed_by_name ?? (typeof manualEd?.name === 'string' ? manualEd.name : null),
          dateText: ed
            ? this.formatDate(ed.at)
            : (typeof manualEd?.date === 'string' ? this.formatDate(manualEd.date) : 'Pending'),
          done: Boolean(ed) || Boolean(manualEd?.done)
        })
      );
    }

    const voucherPagesHtml = paymentVouchers
      .map((pv) => {
        const pvTotal = this.formatMoney(Number(pv.amount), currency);
        const itemRows = request.items.length
          ? request.items
              .map((item, index) => {
                const amount = Number(item.amount) * item.quantity;
                return `<tr><td>${index + 1}</td><td>${this.escapeHtml(item.description)}</td><td>${this.formatMoney(amount, currency)}</td></tr>`;
              })
              .join('')
          : `<tr><td>1</td><td>${this.escapeHtml(request.requestType.name)} Request</td><td>${pvTotal}</td></tr>`;

        return this.renderVoucherPageHtml({
          pageBreak: true,
          logoDataUri,
          voucherNo: pv.voucherNumber,
          dateText: this.formatDate(pv.disbursedAt),
          payee: requesterName,
          contact: request.creator.email,
          itemsHtml: itemRows,
          totalMoney: pvTotal,
          purpose: String(data.purpose ?? request.requestType.name),
          amountWords: this.amountToWords(Number(pv.amount)),
          method: pv.method,
          details: pv.transactionRef ?? '-',
          preparedBy: signatories.prepared_by.name || '________________',
          preparedDate: this.formatDate(generatedAt),
          cooBy: signatories.reviewed_by.name || '________________',
          cooDate: coo ? this.formatDate(coo.at) : 'Pending',
          cooDone: Boolean(coo),
          edBy: signatories.approved_by.name || '________________',
          edDate: edRequired ? (ed ? this.formatDate(ed.at) : 'Pending') : 'N/A',
          edDone: Boolean(ed)
        });
      })
      .join('');

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; }
    .card { border: 1px solid #000; border-radius: 6px; margin-bottom: 14px; }
    .rowpad { padding: 12px; border-bottom: 1px solid #000; }
    .rowpad:last-child { border-bottom: 0; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .amount-big { font-size: 28px; font-weight: 700; line-height: 1.1; }
    .request-no { font-size: 26px; font-weight: 700; text-align: right; }
    .status { font-size: 13px; text-align: right; margin-top: 6px; }
    .two-col { display: table; width: 100%; }
    .two-col > div { display: table-cell; width: 50%; vertical-align: top; padding: 12px; }
    .two-col > div:first-child { border-right: 1px solid #000; }
    .detail-list div { margin-bottom: 5px; }
    .tbl { width: 100%; border-collapse: collapse; }
    .tbl th, .tbl td { border: 1px solid #000; padding: 7px; text-align: left; }
    .tbl th { background: #f3f4f6; }
    .tbl .total-row td { font-weight: 700; background: #f8fafc; }
    .approval-row { display:flex; justify-content:space-between; gap:10px; margin-bottom:10px; border-bottom:1px dashed #cbd5e1; padding-bottom:8px; }
    .approval-title { font-weight:700; }
    .approval-name { margin-top:2px; }
    .approval-right { min-width: 160px; text-align:right; }
    .sig { font-family: "Brush Script MT", cursive; font-size: 24px; line-height: 1; }
    .sig-line { border-bottom:1px solid #111; height: 16px; margin-bottom:3px; }
    .muted { color: #475569; font-size: 11px; }
    .page-break { page-break-before: always; }
    .box { border: 2px solid #000; border-radius: 4px; padding: 14px; }
    .title { text-align: center; font-size: 24px; font-weight: 700; margin: 4px 0 14px; text-decoration: underline; }
    .row { margin: 10px 0; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .line { border-bottom: 1px solid #000; padding: 4px 0; min-height: 20px; }
    .approvals { margin-top: 16px; }
    .approval { border: 1px solid #ddd; border-radius: 5px; padding: 8px; margin-bottom: 8px; }
    .tbl .total td { font-weight: 700; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="rowpad">
      <div class="header-row">
        <div>${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" style="height:42px;" />` : '<strong>Stanforte Edge</strong>'}</div>
        <div>
          <div class="request-no">${this.escapeHtml(requestNumber)}</div>
          <div class="status">${this.escapeHtml(this.toTitle(request.status))}</div>
        </div>
      </div>
    </div>
    <div class="rowpad">
      <div><strong>Amount:</strong></div>
      <div class="amount-big">${this.formatMoney(totalAmount, currency)}</div>
    </div>
    <div class="two-col">
      <div>
        <h3 style="margin:0 0 8px;">Details</h3>
        <div class="detail-list">
          <div><strong>Date:</strong> ${this.formatDate(request.createdAt)}</div>
          <div><strong>Due Date:</strong> ${this.formatDate((data.due_date as string) ?? null)}</div>
          <div><strong>Team:</strong> ${this.escapeHtml(teamName)}</div>
          <div><strong>Organization:</strong> ${this.escapeHtml(organizationName)}</div>
          <div><strong>Project:</strong> ${this.escapeHtml(projectName)}</div>
          <div><strong>Category:</strong> ${this.escapeHtml(categoryName)}</div>
          <div><strong>By:</strong> ${this.escapeHtml(requesterName)}</div>
          <div><strong>Purpose:</strong> ${this.escapeHtml(data.purpose ?? '-')}</div>
        </div>
      </div>
      <div>
        <h3 style="margin:0 0 8px;">Approval Flow</h3>
        ${roleRows.join('')}
      </div>
    </div>
  </div>
  <div class="card"><div class="rowpad"><h3 style="margin:0 0 8px;">Items</h3>
    <table class="tbl">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
      <tbody>
        ${
          request.items.length
            ? request.items
                .map((item) => {
                  const lineTotal = Number(item.amount) * item.quantity;
                  return `<tr><td>${this.escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${this.formatMoney(Number(item.amount), currency)}</td><td>${this.formatMoney(lineTotal, currency)}</td></tr>`;
                })
                .join('')
            : '<tr><td colspan="4" style="text-align:center;">No items</td></tr>'
        }
        <tr class="total-row"><td colspan="3">Total</td><td>${this.formatMoney(totalAmount, currency)}</td></tr>
      </tbody>
    </table>
  </div></div>
  <div class="card"><div class="rowpad"><h3 style="margin:0 0 8px;">Disbursement</h3>
    <table class="tbl">
      <thead><tr><th>Voucher No</th><th>Method</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
      <tbody>
        ${
          paymentVouchers.length
            ? paymentVouchers.map((pv) => `<tr><td>${this.escapeHtml(pv.voucherNumber)}</td><td>${this.escapeHtml(this.paymentMethodLabel(pv.method))}</td><td>${this.formatMoney(Number(pv.amount), currency)}</td><td>${this.formatDate(pv.disbursedAt)}</td><td>${this.escapeHtml(this.toTitle(pv.retirementStatus))}</td></tr>`).join('')
            : '<tr><td colspan="5" style="text-align:center;">No disbursement done yet.</td></tr>'
        }
      </tbody>
    </table>
  </div></div>
  <div class="card"><div class="rowpad"><h3 style="margin:0 0 8px;">Reconciliation</h3>
    <table class="tbl">
      <thead><tr><th>Category</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Items (Budget)</td><td>${this.formatMoney(totalAmount, currency)}</td><td>Requested</td></tr>
        <tr><td>Disbursement (Released)</td><td>${this.formatMoney(disbursedTotal, currency)}</td><td>${disbursedTotal > 0 ? 'Paid' : 'Pending'}</td></tr>
        <tr><td>Retirement (Spent)</td><td>${this.formatMoney(retiredTotal, currency)}</td><td>${retiredTotal > 0 ? 'Accounted' : 'Pending'}</td></tr>
        <tr><td>Unreleased Funds</td><td>${this.formatMoney(unreleased, currency)}</td><td>${unreleased > 0 ? 'Under-disbursed' : 'Fully disbursed'}</td></tr>
        <tr><td>Unspent Funds</td><td>${this.formatMoney(unspent, currency)}</td><td>${unspent > 0 ? 'Unspent' : 'Fully utilized'}</td></tr>
        <tr><td>Net Variance</td><td>${this.formatMoney(netVariance, currency)}</td><td>${netVariance === 0 ? 'Balanced' : netVariance > 0 ? 'Under-spent' : 'Over-spent'}</td></tr>
      </tbody>
    </table>
  </div></div>
  ${voucherPagesHtml}
</body>
</html>`;

    try {
      return await this.pdfService.renderPdfFromHtml(html);
    } catch (error: any) {
      return this.buildSimplePdfFromLines([
        `Request ${requestNumber}`,
        `Status: ${request.status}`,
        `Requester: ${requesterName}`,
        `Total: ${this.formatMoney(totalAmount, currency)}`,
        `Generated: ${this.formatDateTime(generatedAt)}`,
        `PDF renderer fallback active: ${error?.message ? String(error.message).slice(0, 120) : 'renderer error'}`
      ]);
    }
  }

  private async buildPaymentVoucherDocument(input: {
    request: {
      id: bigint;
      status: string;
      currency: string;
      data: Prisma.JsonValue | null;
      requestType: { name: string; codePrefix: string };
      creator: {
        username: string | null;
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
      items: Array<{
        description: string;
        amount: Prisma.Decimal;
        quantity: number;
      }>;
    };
    voucherNo: string;
    totalAmount: number;
    generatedAt: Date;
    approvals: {
      done: Array<{ action: string; step: string; performed_by_name?: string | null; at: Date | string }>;
      pending: Array<{ step: string; approver_type: string; approver_id: string | null }>;
    };
    voucher?: {
      method: string | null;
      transactionRef: string | null;
      notes: string | null;
      disbursedAt: Date;
    };
    signatories: {
      prepared_by: { name: string; title: string };
      reviewed_by: { name: string; title: string };
      approved_by: { name: string; title: string };
    };
  }): Promise<Buffer> {
    const { request, voucherNo, totalAmount, generatedAt, signatories, approvals, voucher } = input;
    const currency = request.currency || 'NGN';
    const logoDataUri = this.getPdfLogoDataUri();
    const payee =
      `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() ||
      request.creator.username ||
      request.creator.email;

    const cooApproved = approvals.done.find((a) => /coo/i.test(a.step));
    const edApproved = approvals.done.find((a) => /\bed\b|executive director/i.test(a.step));
    const method = voucher?.method ?? null;
    const details = voucher?.transactionRef ?? '-';
    const itemRows = request.items.length
      ? request.items
          .map((item, index) => {
            const amount = Number(item.amount) * item.quantity;
            return `<tr><td>${index + 1}</td><td>${this.escapeHtml(item.description)}</td><td>${this.formatMoney(amount, currency)}</td></tr>`;
          })
          .join('')
      : `<tr><td>1</td><td>${this.escapeHtml(request.requestType.name)} Request</td><td>${this.formatMoney(totalAmount, currency)}</td></tr>`;

    const body = this.renderVoucherPageHtml({
      logoDataUri,
      voucherNo,
      dateText: this.formatDate(voucher?.disbursedAt ?? generatedAt),
      payee,
      contact: request.creator.email,
      itemsHtml: itemRows,
      totalMoney: this.formatMoney(totalAmount, currency),
      purpose: String((request.data as any)?.purpose ?? request.requestType.name),
      amountWords: this.amountToWords(totalAmount),
      method,
      details,
      preparedBy: signatories.prepared_by.name || '________________',
      preparedDate: this.formatDate(generatedAt),
      cooBy: signatories.reviewed_by.name || '________________',
      cooDate: cooApproved ? this.formatDate(cooApproved.at) : 'Pending',
      cooDone: Boolean(cooApproved),
      edBy: signatories.approved_by.name || '________________',
      edDate: edApproved ? this.formatDate(edApproved.at) : 'Pending / N/A',
      edDone: Boolean(edApproved),
      remarks: voucher?.notes ?? null
    });

    const html = `<!doctype html><html><head><meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 10mm; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; }
      .box { border: 2px solid #000; border-radius: 4px; padding: 14px; }
      .title { text-align: center; font-size: 24px; font-weight: 700; margin: 4px 0 14px; text-decoration: underline; }
      .row { margin: 10px 0; }
      .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .line { border-bottom: 1px solid #000; padding: 4px 0; min-height: 20px; }
      .tbl { width: 100%; border-collapse: collapse; margin-top: 8px; }
      .tbl th, .tbl td { border: 1px solid #000; padding: 7px; text-align: left; }
      .tbl th { background: #f5f5f5; }
      .tbl .total td { font-weight: 700; background: #f8fafc; }
      .approvals { margin-top: 16px; }
      .approval { border: 1px solid #ddd; border-radius: 5px; padding: 8px; margin-bottom: 8px; }
      .muted { color: #475569; font-size: 11px; }
    </style></head><body>${body}</body></html>`;

    try {
      return await this.pdfService.renderPdfFromHtml(html);
    } catch (error: any) {
      return this.buildSimplePdfFromLines([
        `PAYMENT VOUCHER ${voucherNo}`,
        `Payee: ${payee}`,
        `Amount: ${this.formatMoney(totalAmount, currency)}`,
        `Method: ${this.paymentMethodLabel(method)}`,
        `Generated: ${this.formatDateTime(generatedAt)}`,
        `PDF renderer fallback active: ${error?.message ? String(error.message).slice(0, 120) : 'renderer error'}`
      ]);
    }
  }

  private async recordGeneratedArtifact(
    requestId: bigint,
    artifact: Record<string, string>
  ) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      select: { data: true }
    });

    const base =
      request?.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? ({ ...(request.data as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    const currentArtifacts = Array.isArray(base.generated_artifacts)
      ? (base.generated_artifacts as unknown[])
      : [];

    const updatedData = {
      ...base,
      ...(artifact.voucher_no ? { voucher_number: artifact.voucher_no } : {}),
      generated_artifacts: [...currentArtifacts, artifact]
    };

    await this.prisma.requestInstance.update({
      where: { id: requestId },
      data: { data: updatedData as Prisma.InputJsonValue }
    });
  }

  private getRequestInclude() {
    return {
      items: {
        include: {
          file: true,
          files: {
            include: {
              file: true
            },
            orderBy: { sortOrder: 'asc' as const }
          }
        }
      },
      requestType: true,
      group: true,
      creator: {
        select: { id: true, username: true, email: true, firstName: true, lastName: true }
      },
      organization: true
    };
  }

  private serializeRequest(request: any): RequestResponseDto {
    const createdAt = new Date(request.createdAt);
    const requestNumber = this.getRequestNumber(request.requestType?.codePrefix, request.createdAt.getFullYear(), request.id);
    const voucherNumber = this.extractVoucherNumber(request.data);

    return {
      id: request.id.toString(),
      status: request.status,
      request_type_id: request.requestTypeId,
      group_id: request.groupId,
      organization_id: request.organizationId ? request.organizationId.toString() : null,
      workflow_instance_id: request.workflowInstanceId ?? null,
      created_by: request.createdBy.toString(),
      team_id: request.teamId ? request.teamId.toString() : null,
      currency: request.currency,
      request_number: requestNumber,
      voucher_number: voucherNumber,
      total_amount: request.totalAmount !== null ? Number(request.totalAmount) : null,
      data: request.data,
      created_at: request.createdAt,
      updated_at: request.updatedAt,
      request_type: request.requestType
        ? {
            id: request.requestType.id,
            name: request.requestType.name,
            code_prefix: request.requestType.codePrefix,
            category_key: request.requestType.categoryKey ?? null,
            approval_flow_json: request.requestType.approvalFlowJson ?? null,
            form_schema: request.requestType.formSchema ?? null
          }
        : undefined,
      group: request.group
        ? {
            id: request.group.id,
            name: request.group.name,
            code: request.group.code
          }
        : undefined,
      creator: request.creator
        ? {
            id: request.creator.id.toString(),
            username: request.creator.username,
            email: request.creator.email,
            first_name: request.creator.firstName,
            last_name: request.creator.lastName
          }
        : undefined,
      organization: request.organization
        ? {
            id: request.organization.id.toString(),
            name: request.organization.name,
            code: request.organization.code
          }
        : null,
      items: (request.items ?? []).map((item: any) => {
        const files = Array.from(
          new Map(
            [
              ...(item.files ?? []).map((attachment: any) => attachment.file).filter(Boolean),
              item.file ?? null
            ]
              .filter(Boolean)
              .map((file: any) => [
                file.id,
                {
                  id: file.id,
                  file_name: file.fileName,
                  mime_type: file.mimeType ?? null,
                  public_url: file.publicUrl ?? null,
                  storage_path: file.storagePath ?? null
                }
              ])
          ).values()
        );

        return {
          id: item.id,
          description: item.description,
          amount: Number(item.amount),
          quantity: item.quantity,
          file_id: item.fileId ?? null,
          category_id: item.categoryId ?? null,
          subcategory_id: item.subcategoryId ?? null,
          due_date: item.dueDate ?? null,
          notes: item.notes ?? null,
          file: files[0] ?? null,
          files
        };
      })
    };
  }

  private getRequestNumber(codePrefix: string | undefined, year: number, requestId: bigint): string {
    const rawPrefix = (codePrefix || 'REQ').toUpperCase();
    const prefix = rawPrefix.includes('PC') ? 'PC' : rawPrefix.includes('OP') ? 'OP' : rawPrefix;
    return `${prefix}/${year}/${requestId.toString()}`;
  }

  private async getFormattedRequestNumber(requestId: bigint): Promise<string> {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdAt: true,
        data: true,
        requestType: { select: { codePrefix: true } }
      }
    });
    if (!request) return `REQ/${new Date().getFullYear()}/${requestId.toString()}`;

    return this.getRequestNumber(request.requestType?.codePrefix, request.createdAt.getFullYear(), request.id);
  }

  private getRequestThreadKey(requestNumber: string): string {
    return `request-${requestNumber.replace(/[^a-zA-Z0-9_.-]/g, '-').toLowerCase()}`;
  }

  private getPortalBaseUrl(): string {
    return (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  private getRequestNotificationPath(requestId: bigint, audience: RequestNotificationAudience): string {
    const view = audience === 'approver' ? 'approvals' : 'mine';
    return `/requests/details?id=${requestId.toString()}&view=${view}`;
  }

  private async buildRequestNotificationChannels(input: {
    requestId: bigint;
    audience: RequestNotificationAudience;
    message: string;
    comment?: string | null;
  }) {
    const summary = await this.getRequestNotificationSummary(input.requestId);
    const link = this.getRequestNotificationPath(input.requestId, input.audience);
    const comment = String(input.comment ?? '').trim();
    return {
      link,
      emailPortalUrl: `${this.getPortalBaseUrl()}${link}`,
      emailCtaLabel: input.audience === 'approver' ? 'Review Request' : 'View Request',
      emailHtml: this.buildRequestNotificationEmailHtml({
        summary,
        message: input.message,
        audience: input.audience,
        comment: comment.length > 0 ? comment : undefined
      })
    };
  }

  private async getRequestNotificationSummary(requestId: bigint): Promise<RequestNotificationSummary> {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdAt: true,
        data: true,
        currency: true,
        totalAmount: true,
        items: { select: { amount: true, quantity: true } },
        requestType: { select: { name: true, codePrefix: true, categoryKey: true, formSchema: true } },
        creator: {
          select: { firstName: true, lastName: true, username: true, email: true }
        }
      }
    });

    if (!request) {
      return {
        requestNumber: `REQ/${new Date().getFullYear()}/${requestId.toString()}`,
        requestTypeName: 'Request',
        requesterName: 'Unknown sender',
        requesterEmail: null,
        primaryMetricLabel: 'Amount',
        primaryMetricValue: '-'
      };
    }

    const requestNumber = this.getRequestNumber(
      request.requestType?.codePrefix,
      request.createdAt.getFullYear(),
      request.id
    );
    const requesterName =
      `${String(request.creator?.firstName ?? '').trim()} ${String(request.creator?.lastName ?? '').trim()}`.trim() ||
      request.creator?.username ||
      request.creator?.email ||
      'Unknown sender';
    const payload =
      request.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? (request.data as Record<string, unknown>)
        : {};
    const isLeaveRequest = this.isLeaveRequestType(
      request.requestType?.name ?? null,
      request.requestType?.categoryKey ?? null,
      request.requestType?.formSchema
    );

    let primaryMetricLabel = 'Amount';
    let primaryMetricValue = '-';

    if (isLeaveRequest) {
      const daysRequestedRaw = Number(payload.days_requested ?? payload.days ?? 0);
      const startDateValue = String(payload.start_date ?? '').trim();
      const endDateValue = String(payload.end_date ?? '').trim();
      const daysRequested =
        Number.isFinite(daysRequestedRaw) && daysRequestedRaw > 0
          ? daysRequestedRaw
          : this.computeLeaveDays(startDateValue, endDateValue);

      primaryMetricLabel = 'No. of Days';
      primaryMetricValue = daysRequested > 0 ? `${daysRequested} day${daysRequested === 1 ? '' : 's'}` : '-';
    } else {
      const totalAmount =
        request.totalAmount !== null
          ? Number(request.totalAmount)
          : request.items.reduce((sum, item) => sum + Number(item.amount) * Number(item.quantity ?? 1), 0);
      primaryMetricValue = Number.isFinite(totalAmount) ? this.formatMoney(totalAmount, request.currency || 'NGN') : '-';
    }

    return {
      requestNumber,
      requestTypeName: request.requestType?.name || 'Request',
      requesterName,
      requesterEmail: request.creator?.email ?? null,
      primaryMetricLabel,
      primaryMetricValue
    };
  }

  private buildRequestNotificationEmailHtml(input: {
    summary: RequestNotificationSummary;
    message: string;
    audience: RequestNotificationAudience;
    comment?: string;
  }): string {
    const actionHint =
      input.audience === 'approver'
        ? 'Please review this request and take action.'
        : 'Open this request in the portal to view full details.';
    const detailRows: Array<[string, string]> = [
      ['Request Number', input.summary.requestNumber],
      ['Request Type', input.summary.requestTypeName],
      ['Sender', input.summary.requesterName],
      ['Sender Email', input.summary.requesterEmail ?? '-'],
      [input.summary.primaryMetricLabel, input.summary.primaryMetricValue]
    ];

    return `
      <p style="margin:0 0 12px; color:#111827; line-height:1.7;">${this.escapeHtml(input.message)}</p>
      <p style="margin:0 0 14px; color:#374151; line-height:1.6;">${this.escapeHtml(actionHint)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
        ${detailRows
          .map(
            ([label, value]) =>
              `<tr><td style="width:34%; padding:10px 12px; border-bottom:1px solid #f1f5f9; background:#f8fafc; color:#334155; font-weight:600;">${this.escapeHtml(label)}</td><td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#0f172a;">${this.escapeHtml(value)}</td></tr>`
          )
          .join('')}
      </table>
      ${input.comment ? `<p style="margin:14px 0 0; color:#111827; line-height:1.7;"><strong>Comment:</strong> ${this.escapeHtml(input.comment)}</p>` : ''}
    `;
  }

  private assertManualRequestIdRange(requestId: bigint) {
    if (requestId < MANUAL_REQUEST_ID_MIN || requestId > MANUAL_REQUEST_ID_MAX) {
      throw new BadRequestException(
        `Manual request_id must be between ${MANUAL_REQUEST_ID_MIN.toString()} and ${MANUAL_REQUEST_ID_MAX.toString()}`
      );
    }
  }

  private extractVoucherNumber(data: unknown): string | null {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const voucher = (data as Record<string, unknown>).voucher_number;
    return typeof voucher === 'string' ? voucher : null;
  }

  private async getApprovalSummary(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        currentStep: {
          include: {
            approvers: true
          }
        },
        history: {
          orderBy: { createdAt: 'asc' }
        },
        workflow: {
          include: {
            steps: true
          }
        }
      }
    });

    if (!instance) return { done: [], pending: [] };

    const stepMap = new Map(instance.workflow.steps.map((step) => [step.id, step.name]));
    const performerIds = Array.from(
      new Set(
        instance.history
          .map((entry) => (entry.performedBy ? entry.performedBy.toString() : null))
          .filter((id): id is string => Boolean(id))
      )
    );
    const performers =
      performerIds.length > 0
        ? await this.prisma.profile.findMany({
            where: { id: { in: performerIds.map((id) => toBigInt(id)) } },
            select: { id: true, username: true, email: true, firstName: true, lastName: true }
          })
        : [];
    const performerMap = new Map(
      performers.map((user) => {
        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        return [user.id.toString(), fullName || user.username || user.email];
      })
    );

    const done = instance.history
      .filter((entry) => entry.action === 'approve' || entry.action === 'reject' || entry.action === 'auto_approve')
      .map((entry) => ({
        action: entry.action,
        step: entry.fromStepId ? stepMap.get(entry.fromStepId) ?? 'Unknown step' : 'Unknown step',
        performed_by: entry.performedBy ? entry.performedBy.toString() : null,
        performed_by_name: entry.performedBy ? performerMap.get(entry.performedBy.toString()) ?? null : null,
        comment: entry.comment,
        at: entry.createdAt
      }));

    const pending =
      instance.status === 'pending' && instance.currentStep
        ? instance.currentStep.approvers.map((approver) => ({
            step: instance.currentStep?.name ?? 'Current step',
            approver_type: approver.approverType,
            approver_id: approver.approverId
          }))
        : [];

    return { done, pending };
  }

  private async ensureFileAssetsExist(tx: Prisma.TransactionClient | PrismaService, fileIds: string[]) {
    const count = await tx.fileAsset.count({
      where: { id: { in: fileIds } }
    });
    if (count !== fileIds.length) {
      throw new BadRequestException('One or more request item files are invalid');
    }
  }

  private async getFinanceSignatories() {
    const row = await this.prisma.financeSetting.findUnique({
      where: { key: 'default' },
      select: { config: true }
    });
    const data =
      row?.config && typeof row.config === 'object' && !Array.isArray(row.config)
        ? (row.config as Record<string, any>)
        : {};
    return {
      prepared_by: {
        name: data?.prepared_by?.name ?? '',
        title: data?.prepared_by?.title ?? 'Accountant'
      },
      reviewed_by: {
        name: data?.reviewed_by?.name ?? '',
        title: data?.reviewed_by?.title ?? 'Finance Manager / COO'
      },
      approved_by: {
        name: data?.approved_by?.name ?? '',
        title: data?.approved_by?.title ?? 'Executive Director'
      }
    };
  }

  private async transitionRequestStatus(
    request: { id: bigint; status: string; data: unknown },
    nextStatus: string,
    actorId: string,
    details?: { action?: string; comment?: string }
  ) {
    return this.prisma.requestInstance.update({
      where: { id: request.id },
      data: {
        status: nextStatus as any,
        data: this.withStateEvent(request.data, {
          from: request.status,
          to: nextStatus,
          by: actorId,
          action: details?.action,
          comment: details?.comment
        })
      }
    });
  }

  private withStateEvent(
    data: unknown,
    event: { from: string; to: string; by: string; action?: string; comment?: string }
  ): Prisma.InputJsonValue {
    const base =
      data && typeof data === 'object' && !Array.isArray(data)
        ? ({ ...(data as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    const existing = Array.isArray(base.state_events) ? (base.state_events as unknown[]) : [];
    const stateEvent = {
      from: event.from,
      to: event.to,
      by: event.by,
      action: event.action ?? null,
      comment: event.comment ?? null,
      at: new Date().toISOString()
    };
    return {
      ...base,
      state_events: [...existing, stateEvent]
    } as Prisma.InputJsonValue;
  }

  private withRetirementData(data: Prisma.InputJsonValue, dto: RetireRequestDto): Prisma.InputJsonValue {
    const base =
      data && typeof data === 'object' && !Array.isArray(data)
        ? ({ ...(data as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    return {
      ...base,
      retirement: {
        voucher_id: dto.voucher_id ?? null,
        notes: dto.notes ?? null,
        retired_amount: dto.retired_amount ?? null,
        retirement_file_ids: dto.retirement_file_ids ?? [],
        breakdown: dto.breakdown ?? null,
        submitted_at: new Date().toISOString()
      }
    } as Prisma.InputJsonValue;
  }

  private async applyRetirementToPaymentVouchers(requestId: bigint, dto: RetireRequestDto) {
    const voucherWhere = dto.voucher_id
      ? { requestId, id: dto.voucher_id }
      : { requestId };
    const vouchers = await this.prisma.financePaymentVoucher.findMany({
      where: voucherWhere,
      orderBy: { disbursedAt: 'asc' }
    });
    if (vouchers.length === 0) {
      if (dto.voucher_id) throw new BadRequestException('Selected voucher does not exist on this request');
      return { outstanding_after: 0, touched_vouchers: [] as Array<{ id: string; voucher_number: string; allocated: number }> };
    }

    const totalVoucherBalance = vouchers.reduce(
      (sum, voucher) => sum + Math.max(0, Number(voucher.amount) - Number(voucher.retiredAmount)),
      0
    );
    if (dto.retired_amount !== undefined && dto.retired_amount > totalVoucherBalance) {
      throw new BadRequestException('Retirement amount exceeds selected voucher balance');
    }
    let remaining = dto.retired_amount ?? totalVoucherBalance;
    if (remaining <= 0) {
      const allVouchers = await this.prisma.financePaymentVoucher.findMany({ where: { requestId } });
      const outstanding = allVouchers.reduce(
        (sum, voucher) => sum + Math.max(0, Number(voucher.amount) - Number(voucher.retiredAmount)),
        0
      );
      return { outstanding_after: outstanding, touched_vouchers: [] as Array<{ id: string; voucher_number: string; allocated: number }> };
    }
    const touched: Array<{ id: string; voucher_number: string; allocated: number }> = [];

    for (const voucher of vouchers) {
      if (remaining <= 0) break;
      const currentRetired = Number(voucher.retiredAmount);
      const voucherAmount = Number(voucher.amount);
      const voucherBalance = Math.max(0, voucherAmount - currentRetired);
      if (voucherBalance <= 0) continue;

      const allocate = Math.min(voucherBalance, remaining);
      const nextRetired = currentRetired + allocate;
      const nextStatus =
        nextRetired >= voucherAmount ? 'retired' : nextRetired > 0 ? 'partial' : 'not_retired';

      await this.prisma.financePaymentVoucher.update({
        where: { id: voucher.id },
        data: {
          retiredAmount: nextRetired,
          retirementStatus: nextStatus,
          retiredAt: new Date(),
          metadata: {
            ...(voucher.metadata && typeof voucher.metadata === 'object' && !Array.isArray(voucher.metadata)
              ? (voucher.metadata as Record<string, unknown>)
              : {}),
            retirement_notes: dto.notes ?? null,
            retirement_file_ids: dto.retirement_file_ids ?? []
          } as Prisma.InputJsonValue
        }
      });
      touched.push({ id: voucher.id, voucher_number: voucher.voucherNumber, allocated: allocate });

      remaining -= allocate;
    }

    const allVouchers = await this.prisma.financePaymentVoucher.findMany({ where: { requestId } });
    const outstanding = allVouchers.reduce(
      (sum, voucher) => sum + Math.max(0, Number(voucher.amount) - Number(voucher.retiredAmount)),
      0
    );
    return { outstanding_after: outstanding, touched_vouchers: touched };
  }

  private async isPendingApprovalForUser(requestId: string, userId: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(requestId) },
      select: { workflowInstanceId: true, teamId: true, status: true }
    });
    if (!request?.workflowInstanceId || !['sent', 'approval'].includes(request.status)) return false;

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: request.workflowInstanceId },
      include: { currentStep: { include: { approvers: true } } }
    });
    if (!instance || instance.status !== 'pending' || !instance.currentStep) return false;

    for (const approver of instance.currentStep.approvers) {
      if (await this.userMatchesCurrentApprover({ approverType: approver.approverType, approverId: approver.approverId }, request.teamId, userId)) return true;
    }

    return false;
  }

  private isWorkflowInactiveError(error: unknown) {
    const message = String((error as Error)?.message ?? '').toLowerCase();
    return message.includes('workflow instance is not active') || message.includes('workflow instance not found');
  }

  private async listCurrentApproverUserIds(requestId: bigint): Promise<string[]> {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      select: { teamId: true, workflowInstanceId: true }
    });
    if (!request?.workflowInstanceId) return [];
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: request.workflowInstanceId },
      include: { currentStep: { include: { approvers: true } } }
    });
    if (!instance?.currentStep || instance.status !== 'pending') return [];

    const userIds = new Set<string>();
    for (const approver of instance.currentStep.approvers) {
      const currentIds = await this.listUsersForCurrentApprover(
        { approverType: approver.approverType, approverId: approver.approverId },
        request.teamId,
      );
      for (const id of currentIds) userIds.add(id);
    }

    return Array.from(userIds);
  }

  private async userMatchesCurrentApprover(
    approver: { approverType: string; approverId: string | null },
    teamId: bigint | null,
    userId: string,
  ) {
    const approverType = String(approver.approverType || '').trim().toLowerCase();
    const approverId = String(approver.approverId || '').trim().toLowerCase();
    if (!approverId) return false;

    if (
      (approverType === 'relation' && approverId === 'requester_team_lead') ||
      (approverType === 'role' && approverId === 'team_lead')
    ) {
      if (!teamId) return false;
      return (
        (await this.prisma.groupUser.count({
          where: {
            groupId: teamId,
            userId: toBigInt(userId),
            role: GroupUserRole.moderator,
          },
        })) > 0
      );
    }

    if (
      (approverType === 'relation' && approverId === 'requester_team_lead_or_manager') ||
      (approverType === 'role' && (approverId === 'team_lead_or_manager' || approverId === 'manager'))
    ) {
      if (teamId) {
        const leadOrManager = await this.prisma.groupUser.count({
          where: {
            groupId: teamId,
            userId: toBigInt(userId),
            role: { in: [GroupUserRole.moderator, GroupUserRole.admin] },
          },
        });
        if (leadOrManager > 0) return true;
      }

      return (
        (await this.prisma.userRole.count({
          where: {
            profileId: toBigInt(userId),
            role: { slug: 'manager' },
          },
        })) > 0
      );
    }

    if (approverType === 'office' || approverType === 'role') {
      const roleSlugs =
        approverType === 'role' && approverId === 'accountant'
          ? ['accountant', 'finance_manager']
          : [approverId];
      const hasRole = await this.prisma.userRole.count({
        where: {
          profileId: toBigInt(userId),
          role: { slug: { in: roleSlugs } },
        },
      });
      if (hasRole > 0) return true;
    }

    if (
      approverType === 'permission' ||
      (approverType === 'role' && (approverId.includes('.') || approverId === 'accountant' || approverId === 'hr'))
    ) {
      const permissionSlug =
        approverType === 'permission'
          ? approverId
          : approverId === 'accountant'
            ? 'finance.approve'
            : approverId === 'hr'
              ? 'hr.approve'
              : approverId;

      const hasPermission = await this.prisma.rolePermission.count({
        where: {
          permission: { slug: permissionSlug },
          role: {
            users: {
              some: { profileId: toBigInt(userId) },
            },
          },
        },
      });
      if (hasPermission > 0) return true;

      const isAdmin = await this.prisma.userRole.count({
        where: {
          profileId: toBigInt(userId),
          role: { slug: { in: ['administrator', 'admin'] } },
        },
      });
      if (isAdmin > 0) return true;
    }

    return false;
  }

  private async listUsersForCurrentApprover(
    approver: { approverType: string; approverId: string | null },
    teamId: bigint | null,
  ): Promise<string[]> {
    const approverType = String(approver.approverType || '').trim().toLowerCase();
    const approverId = String(approver.approverId || '').trim().toLowerCase();
    if (!approverId) return [];

    if (
      (approverType === 'relation' && approverId === 'requester_team_lead') ||
      (approverType === 'role' && approverId === 'team_lead')
    ) {
      if (!teamId) return [];
      const rows = await this.prisma.groupUser.findMany({
        where: { groupId: teamId, role: GroupUserRole.moderator },
        select: { userId: true },
      });
      return rows.map((row) => row.userId.toString());
    }

    if (
      (approverType === 'relation' && approverId === 'requester_team_lead_or_manager') ||
      (approverType === 'role' && (approverId === 'team_lead_or_manager' || approverId === 'manager'))
    ) {
      const ids = new Set<string>();
      if (teamId) {
        const rows = await this.prisma.groupUser.findMany({
          where: { groupId: teamId, role: { in: [GroupUserRole.moderator, GroupUserRole.admin] } },
          select: { userId: true },
        });
        for (const row of rows) ids.add(row.userId.toString());
      }

      const managers = await this.prisma.userRole.findMany({
        where: { role: { slug: 'manager' } },
        select: { profileId: true },
      });
      for (const row of managers) ids.add(row.profileId.toString());
      return Array.from(ids);
    }

    const ids = new Set<string>();

    if (approverType === 'office' || approverType === 'role') {
      const roleSlugs =
        approverType === 'role' && approverId === 'accountant'
          ? ['accountant', 'finance_manager']
          : [approverId];
      const directRoleUsers = await this.prisma.userRole.findMany({
        where: { role: { slug: { in: roleSlugs } } },
        select: { profileId: true },
      });
      for (const row of directRoleUsers) ids.add(row.profileId.toString());
    }

    if (
      approverType === 'permission' ||
      (approverType === 'role' && (approverId.includes('.') || approverId === 'accountant' || approverId === 'hr'))
    ) {
      const permissionSlug =
        approverType === 'permission'
          ? approverId
          : approverId === 'accountant'
            ? 'finance.approve'
            : approverId === 'hr'
              ? 'hr.approve'
              : approverId;
      const permissionUsers = await this.prisma.userRole.findMany({
        where: {
          OR: [
            { role: { slug: { in: ['administrator', 'admin'] } } },
            {
              role: {
                permissions: {
                  some: { permission: { slug: permissionSlug } },
                },
              },
            },
          ],
        },
        select: { profileId: true },
      });
      for (const row of permissionUsers) ids.add(row.profileId.toString());
    }

    return Array.from(ids);
  }

  private async notifyCurrentApprovers(
    requestId: bigint,
    message: string,
    emailSubject: string,
    excludedUserId?: string,
    comment?: string
  ) {
    const recipients = await this.listCurrentApproverUserIds(requestId);
    if (!recipients.length) return;
    const formattedRequestNumber = await this.getFormattedRequestNumber(requestId);
    const approverNotificationChannels = await this.buildRequestNotificationChannels({
      requestId,
      audience: 'approver',
      message,
      comment
    });
    for (const targetUserId of recipients) {
      if (excludedUserId && targetUserId === excludedUserId) continue;
      await this.notificationsService.create({
        userId: targetUserId,
        type: 'action',
        title: 'Request awaiting approval',
        message,
        ...approverNotificationChannels,
        data: { requestId: requestId.toString() },
        notifiableType: 'request',
        notifiableId: requestId,
        emailSubject,
        emailThreadKey: this.getRequestThreadKey(formattedRequestNumber)
      });
    }
  }

  private async logWorkflowEvent(
    instanceId: string | null | undefined,
    action: string,
    performedBy: string,
    data?: Record<string, unknown>
  ) {
    if (!instanceId) return;
    await this.prisma.workflowHistory.create({
      data: {
        instanceId,
        action,
        performedBy: toBigInt(performedBy),
        data: (data ?? {}) as Prisma.InputJsonValue
      }
    });
  }

  private async ensureStaffRequestSequenceFloor(db: Prisma.TransactionClient | PrismaService) {
    const floor = (STAFF_REQUEST_SEQUENCE_START - BigInt(1)).toString();
    await db.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('sta_request_instances','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM sta_request_instances), ${floor}), true)`
    );
  }
}
