import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { DisburseRequestDto } from './dto/disburse-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateFinanceSettingsDto } from './dto/update-finance-settings.dto';
import { Prisma } from '@prisma/client';
import { UpsertFinanceAccountDto } from './dto/upsert-finance-account.dto';
import { CreateFinanceIncomeDto } from './dto/create-finance-income.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpsertFinanceAssetDto } from './dto/upsert-finance-asset.dto';
import { CreateFinanceAssetVerificationDto } from './dto/create-finance-asset-verification.dto';
import { CreateFinanceAssetDisposalDto } from './dto/create-finance-asset-disposal.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async summary(query: Record<string, any>) {
    const where: any = {
      status: {
        in: ['cleared', 'disbursed', 'confirmed', 'retired', 'completed']
      }
    };

    if (query.currency) where.currency = String(query.currency).toUpperCase();

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(String(query.from));
      if (query.to) where.createdAt.lte = new Date(String(query.to));
    }

    const [count, aggregates, byStatus] = await this.prisma.$transaction([
      this.prisma.requestInstance.count({ where }),
      this.prisma.requestInstance.aggregate({
        where,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      }),
      this.prisma.requestInstance.groupBy({
        by: ['status'],
        where,
        _sum: { totalAmount: true },
        _count: { _all: true },
        orderBy: { status: 'asc' }
      })
    ]);

    return {
      total_requests: count,
      total_amount: aggregates._sum.totalAmount,
      average_amount: aggregates._avg.totalAmount,
      by_status: byStatus.map((item) => ({
        status: item.status,
        count: (item as any)._count?._all ?? 0,
        total_amount: item._sum?.totalAmount ?? null
      }))
    };
  }

  async getSettings() {
    const row = await this.prisma.financeSetting.findUnique({
      where: { key: 'default' }
    });
    return this.normalizeSettings(row?.config);
  }

  async updateSettings(dto: UpdateFinanceSettingsDto, userId?: string) {
    const current = await this.getSettings();
    const next = {
      prepared_by: { ...current.prepared_by, ...(dto.prepared_by ?? {}) },
      reviewed_by: { ...current.reviewed_by, ...(dto.reviewed_by ?? {}) },
      approved_by: { ...current.approved_by, ...(dto.approved_by ?? {}) },
      meta: { ...current.meta, ...(dto.meta ?? {}) }
    };

    await this.prisma.financeSetting.upsert({
      where: { key: 'default' },
      update: {
        config: next as Prisma.InputJsonValue,
        updatedBy: userId ? toBigInt(userId) : null
      },
      create: {
        key: 'default',
        config: next as Prisma.InputJsonValue,
        updatedBy: userId ? toBigInt(userId) : null
      }
    });

    return next;
  }

  async listRequests(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: any = {
      status: {
        in: ['approval', 'cleared', 'disbursed', 'confirmed', 'retired', 'completed']
      }
    };

    if (query.status) where.status = String(query.status);
    if (query.currency) where.currency = String(query.currency).toUpperCase();

    const [rows] = await this.prisma.$transaction([
      this.prisma.requestInstance.findMany({
        where,
        include: {
          requestType: true,
          group: true,
          creator: { select: { id: true, email: true, username: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const pendingFinanceRoleSlugs = new Set(['accountant', 'finance_manager']);
    const approvalInstanceIds = rows
      .filter((row) => row.status === 'approval' && row.workflowInstanceId)
      .map((row) => row.workflowInstanceId as string);

    const financeApprovalInstanceIds = new Set<string>();
    if (approvalInstanceIds.length > 0) {
      const instances = await this.prisma.workflowInstance.findMany({
        where: { id: { in: approvalInstanceIds } },
        include: {
          currentStep: {
            include: {
              approvers: true
            }
          }
        }
      });

      for (const instance of instances) {
        const hasFinanceApprover = (instance.currentStep?.approvers ?? []).some(
          (approver) =>
            approver.approverType === 'role' &&
            pendingFinanceRoleSlugs.has(String(approver.approverId || '').trim().toLowerCase())
        );
        const progressedPastFirstStep = (instance.currentStep?.order ?? 1) > 1;
        if (hasFinanceApprover || progressedPastFirstStep) financeApprovalInstanceIds.add(instance.id);
      }
    }

    const filtered = rows.filter((row) => {
      if (row.status !== 'approval') return true;
      if (!row.workflowInstanceId) return false;
      return financeApprovalInstanceIds.has(row.workflowInstanceId);
    });

    const total = filtered.length;
    const pageData = filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage);

    return {
      data: pageData,
      meta: {
        page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage))
      }
    };
  }

  async disburseRequest(requestId: string, dto: DisburseRequestDto, actorId?: string) {
    const id = this.parseId(requestId, 'request id');
    const request = await this.prisma.requestInstance.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    if (!['cleared', 'disbursed'].includes(request.status)) {
      throw new BadRequestException('Request is not in a disbursable state');
    }

    const now = new Date();
    const requestTotal = request.totalAmount !== null ? Number(request.totalAmount) : 0;
    const disbursedAggregate = await this.prisma.financePaymentVoucher.aggregate({
      where: { requestId: id },
      _sum: { amount: true }
    });
    const alreadyDisbursed = Number(disbursedAggregate._sum.amount ?? 0);
    const balanceBefore = Math.max(0, requestTotal - alreadyDisbursed);
    const disburseAmount = dto.amount ?? balanceBefore;
    if (!disburseAmount || disburseAmount <= 0) {
      throw new BadRequestException('Disbursement amount must be greater than zero');
    }
    if (disburseAmount > balanceBefore) {
      throw new BadRequestException('Disbursement amount cannot exceed request balance');
    }
    if (dto.evidence_file_id) {
      const fileExists = await this.prisma.fileAsset.count({ where: { id: dto.evidence_file_id } });
      if (!fileExists) throw new BadRequestException('Invalid disbursement evidence file');
    }
    const activeAccountCount = await this.prisma.financeAccount.count({ where: { isActive: true } });
    if (activeAccountCount > 0 && !dto.paid_from_account_id) {
      throw new BadRequestException('paid_from_account_id is required when finance accounts are configured');
    }
    let paidFromAccount: { id: string; currency: string; isActive: boolean } | null = null;
    if (dto.paid_from_account_id) {
      paidFromAccount = await this.prisma.financeAccount.findUnique({
        where: { id: dto.paid_from_account_id },
        select: { id: true, currency: true, isActive: true }
      });
      if (!paidFromAccount || !paidFromAccount.isActive) {
        throw new BadRequestException('Invalid paid_from_account_id');
      }
    }
    const existingData =
      request.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? ({ ...(request.data as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    const stateEvents = Array.isArray(existingData.state_events) ? (existingData.state_events as unknown[]) : [];
    const disbursementEvents = Array.isArray(existingData.disbursement_events)
      ? (existingData.disbursement_events as unknown[])
      : [];
    const voucherNumber =
      await this.nextVoucherNumber(id, now.getFullYear());

    const disbursementPayload = {
      note: dto.note ?? null,
      method: dto.method ?? null,
      transaction_ref: dto.transaction_ref ?? null,
      amount: disburseAmount,
      evidence_file_id: dto.evidence_file_id ?? null,
      disbursed_at: now.toISOString()
    };

    await this.prisma.financePaymentVoucher.create({
      data: {
        requestId: id,
        paidFromAccountId: dto.paid_from_account_id ?? null,
        voucherNumber,
        amount: disburseAmount,
        method: dto.method ?? null,
        transactionRef: dto.transaction_ref ?? null,
        note: dto.note ?? null,
        evidenceFileId: dto.evidence_file_id ?? null,
        disbursedAt: now
      }
    });
    if (paidFromAccount) {
      await this.prisma.financeLedgerEntry.create({
        data: {
          accountId: paidFromAccount.id,
          direction: 'out',
          amount: disburseAmount,
          currency: request.currency || paidFromAccount.currency || 'NGN',
          entryDate: now,
          description: `Disbursement ${voucherNumber} for request ${request.id.toString()}`,
          sourceType: 'finance_payment_voucher',
          sourceId: voucherNumber,
          createdBy: actorId ? toBigInt(actorId) : null,
          metadata: {
            request_id: request.id.toString(),
            voucher_number: voucherNumber
          } as Prisma.InputJsonValue
        }
      });
    }
    if (request.workflowInstanceId) {
      await this.prisma.workflowHistory.create({
        data: {
          instanceId: request.workflowInstanceId,
          action: 'pv_disbursed',
          performedBy: actorId ? toBigInt(actorId) : null,
          data: {
            request_id: request.id.toString(),
            voucher_number: voucherNumber,
            amount: disburseAmount,
            method: dto.method ?? null,
            transaction_ref: dto.transaction_ref ?? null
          } as Prisma.InputJsonValue
        }
      });
    }

    const updated = await this.prisma.requestInstance.update({
      where: { id },
      data: {
        status: 'disbursed',
        data: {
          ...existingData,
          voucher_number: voucherNumber,
          disbursement: disbursementPayload,
          disbursement_events: [...disbursementEvents, disbursementPayload],
          state_events: [
            ...stateEvents,
            {
              from: request.status,
              to: 'disbursed',
              action: 'disburse',
              by: 'finance',
              comment: dto.note ?? null,
              at: now.toISOString()
            }
          ]
        } as any
      }
    });

    await this.notificationsService.create({
      userId: request.createdBy,
      type: 'success',
      title: 'Request disbursed',
      message: `Your request #${request.id.toString()} has been disbursed.`,
      data: {
        requestId: request.id.toString(),
        note: dto.note,
        voucher_number: voucherNumber,
        transaction_ref: dto.transaction_ref
      },
      notifiableType: 'request',
      notifiableId: request.id,
      emailSubject: `Request disbursed (${await this.getFormattedRequestNumber(request.id)})`,
      emailThreadKey: this.getRequestThreadKey(await this.getFormattedRequestNumber(request.id))
    });

    return updated;
  }

  async listPaymentVouchers(requestId: string) {
    const id = this.parseId(requestId, 'request id');
    const request = await this.prisma.requestInstance.findUnique({
      where: { id },
      select: { totalAmount: true }
    });
    if (!request) throw new NotFoundException('Request not found');

    const vouchers = await this.prisma.financePaymentVoucher.findMany({
      where: { requestId: id },
      include: {
        evidenceFile: {
          select: { id: true, fileName: true, mimeType: true, publicUrl: true }
        },
        paidFromAccount: {
          select: { id: true, name: true, code: true, accountType: true }
        },
      },
      orderBy: { disbursedAt: 'asc' }
    });

    const retirementFileIds = Array.from(
      new Set(
        vouchers.flatMap((voucher) => {
          const metadata =
            voucher.metadata && typeof voucher.metadata === 'object' && !Array.isArray(voucher.metadata)
              ? (voucher.metadata as Record<string, unknown>)
              : {};
          const ids = Array.isArray(metadata.retirement_file_ids) ? metadata.retirement_file_ids : [];
          return ids.map((id) => String(id));
        })
      )
    );
    const retirementFiles =
      retirementFileIds.length > 0
        ? await this.prisma.fileAsset.findMany({
            where: { id: { in: retirementFileIds } },
            select: { id: true, fileName: true, mimeType: true, publicUrl: true }
          })
        : [];
    const retirementFileMap = new Map(retirementFiles.map((file) => [file.id, file]));

    const requestTotal = Number(request.totalAmount ?? 0);
    let cumulativeDisbursed = 0;
    return vouchers.map((voucher) => {
      const amount = Number(voucher.amount);
      const retiredAmount = Number(voucher.retiredAmount);
      cumulativeDisbursed += amount;
      const requestBalance = Math.max(0, requestTotal - cumulativeDisbursed);
      const voucherBalance = Math.max(0, amount - retiredAmount);
      return {
        id: voucher.id,
        voucher_number: voucher.voucherNumber,
        amount,
        retired_amount: retiredAmount,
        voucher_balance: voucherBalance,
        request_balance: requestBalance,
        retirement_status: voucher.retirementStatus,
        method: voucher.method,
        transaction_ref: voucher.transactionRef,
        note: voucher.note,
        disbursed_at: voucher.disbursedAt,
        retired_at: voucher.retiredAt,
        verified_at: voucher.verifiedAt,
        evidence_file: voucher.evidenceFile
          ? {
              id: voucher.evidenceFile.id,
              file_name: voucher.evidenceFile.fileName,
              mime_type: voucher.evidenceFile.mimeType,
              public_url: voucher.evidenceFile.publicUrl
            }
          : null,
        paid_from_account: voucher.paidFromAccount
          ? {
              id: voucher.paidFromAccount.id,
              name: voucher.paidFromAccount.name,
              code: voucher.paidFromAccount.code,
              account_type: voucher.paidFromAccount.accountType
            }
          : null,
        retirement_files: (() => {
          const metadata =
            voucher.metadata && typeof voucher.metadata === 'object' && !Array.isArray(voucher.metadata)
              ? (voucher.metadata as Record<string, unknown>)
              : {};
          const ids = Array.isArray(metadata.retirement_file_ids) ? metadata.retirement_file_ids : [];
          return ids
            .map((id) => retirementFileMap.get(String(id)))
            .filter((file): file is NonNullable<typeof file> => Boolean(file))
            .map((file) => ({
              id: file.id,
              file_name: file.fileName,
              mime_type: file.mimeType,
              public_url: file.publicUrl
            }));
        })()
      };
    });
  }

  async listAllPaymentVouchers(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));
    const where: Prisma.FinancePaymentVoucherWhereInput = {};

    if (query.request_id) where.requestId = this.parseId(String(query.request_id), 'request id');
    if (query.voucher_number) where.voucherNumber = { contains: String(query.voucher_number), mode: 'insensitive' };
    if (query.retirement_status) where.retirementStatus = String(query.retirement_status);
    if (query.method) where.method = String(query.method);
    if (query.paid_from_account_id) where.paidFromAccountId = String(query.paid_from_account_id);
    if (query.from || query.to) {
      where.disbursedAt = {};
      if (query.from) where.disbursedAt.gte = new Date(String(query.from));
      if (query.to) where.disbursedAt.lte = new Date(String(query.to));
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.financePaymentVoucher.count({ where }),
      this.prisma.financePaymentVoucher.findMany({
        where,
        include: {
          request: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              createdAt: true,
              requestType: { select: { name: true, codePrefix: true } },
              creator: { select: { firstName: true, lastName: true, username: true, email: true } },
            }
          },
          paidFromAccount: {
            select: { id: true, name: true, code: true, accountType: true }
          },
          evidenceFile: {
            select: { id: true, fileName: true, mimeType: true, publicUrl: true }
          }
        },
        orderBy: [{ disbursedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage
      })
    ]);

    const data = rows.map((row) => {
      const creatorName =
        `${row.request.creator.firstName ?? ''} ${row.request.creator.lastName ?? ''}`.trim() ||
        row.request.creator.username ||
        row.request.creator.email ||
        '-';
      const requestNumber = `${(row.request.requestType?.codePrefix || 'REQ').toUpperCase()}/${row.request.createdAt.getFullYear()}/${row.request.id.toString()}`;
      const amount = Number(row.amount);
      const retiredAmount = Number(row.retiredAmount);
      return {
        id: row.id,
        request_id: row.request.id.toString(),
        request_number: requestNumber,
        request_status: row.request.status,
        request_type: row.request.requestType?.name ?? '-',
        request_creator_name: creatorName,
        request_total_amount: Number(row.request.totalAmount ?? 0),
        voucher_number: row.voucherNumber,
        amount,
        retired_amount: retiredAmount,
        voucher_balance: Math.max(0, amount - retiredAmount),
        retirement_status: row.retirementStatus,
        method: row.method,
        transaction_ref: row.transactionRef,
        note: row.note,
        disbursed_at: row.disbursedAt,
        retired_at: row.retiredAt,
        verified_at: row.verifiedAt,
        paid_from_account: row.paidFromAccount
          ? {
              id: row.paidFromAccount.id,
              name: row.paidFromAccount.name,
              code: row.paidFromAccount.code,
              account_type: row.paidFromAccount.accountType
            }
          : null,
        evidence_file: row.evidenceFile
          ? {
              id: row.evidenceFile.id,
              file_name: row.evidenceFile.fileName,
              mime_type: row.evidenceFile.mimeType,
              public_url: row.evidenceFile.publicUrl
            }
          : null
      };
    });

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

  async listAccounts(query: Record<string, any>) {
    const where: Prisma.FinanceAccountWhereInput = {
      ...(query.is_active !== undefined ? { isActive: String(query.is_active) !== 'false' } : {}),
      ...(query.organization_id ? { organizationId: toBigInt(String(query.organization_id)) } : {})
    };

    const rows = await this.prisma.financeAccount.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
    });
    const movementByAccount = await this.getLedgerMovementByAccount(rows.map((row) => row.id));

    return rows.map((row) => ({
      id: row.id,
      organization_id: row.organizationId?.toString() ?? null,
      name: row.name,
      code: row.code,
      account_type: row.accountType,
      bank_name: row.bankName,
      account_name: row.accountName,
      account_number: row.accountNumber,
      branch_name: row.branchName,
      currency: row.currency,
      opening_balance: Number(row.openingBalance),
      current_balance: Number(row.openingBalance) + (movementByAccount.get(row.id) ?? 0),
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    }));
  }

  async getAccount(id: string) {
    const row = await this.prisma.financeAccount.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Account not found');
    const movementByAccount = await this.getLedgerMovementByAccount([row.id]);
    return {
      id: row.id,
      organization_id: row.organizationId?.toString() ?? null,
      name: row.name,
      code: row.code,
      account_type: row.accountType,
      bank_name: row.bankName,
      account_name: row.accountName,
      account_number: row.accountNumber,
      branch_name: row.branchName,
      currency: row.currency,
      opening_balance: Number(row.openingBalance),
      current_balance: Number(row.openingBalance) + (movementByAccount.get(row.id) ?? 0),
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private async getLedgerMovementByAccount(accountIds: string[]) {
    if (!accountIds.length) return new Map<string, number>();

    const groups = await this.prisma.financeLedgerEntry.groupBy({
      by: ['accountId', 'direction'],
      where: { accountId: { in: accountIds } },
      _sum: { amount: true }
    });

    const movementByAccount = new Map<string, number>();
    for (const accountId of accountIds) {
      movementByAccount.set(accountId, 0);
    }

    for (const group of groups) {
      const amount = Number(group._sum.amount ?? 0);
      if (group.direction === 'in') {
        movementByAccount.set(group.accountId, (movementByAccount.get(group.accountId) ?? 0) + amount);
      } else if (group.direction === 'out') {
        movementByAccount.set(group.accountId, (movementByAccount.get(group.accountId) ?? 0) - amount);
      }
    }

    return movementByAccount;
  }

  async createAccount(dto: UpsertFinanceAccountDto, actorId?: string) {
    const row = await this.prisma.financeAccount.create({
      data: {
        name: dto.name.trim(),
        code: dto.code?.trim() || null,
        accountType: dto.account_type ?? 'bank',
        bankName: dto.bank_name?.trim() || null,
        accountName: dto.account_name?.trim() || null,
        accountNumber: dto.account_number?.trim() || null,
        branchName: dto.branch_name?.trim() || null,
        currency: (dto.currency ?? 'NGN').toUpperCase(),
        openingBalance: dto.opening_balance ?? 0,
        isActive: dto.is_active ?? true,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        createdBy: actorId ? toBigInt(actorId) : null
      }
    });

    if (Number(row.openingBalance) !== 0) {
      await this.prisma.financeLedgerEntry.create({
        data: {
          accountId: row.id,
          direction: Number(row.openingBalance) >= 0 ? 'in' : 'out',
          amount: Math.abs(Number(row.openingBalance)),
          currency: row.currency,
          entryDate: new Date(),
          description: 'Opening balance',
          sourceType: 'opening_balance',
          sourceId: row.id,
          createdBy: actorId ? toBigInt(actorId) : null
        }
      });
    }

    return {
      id: row.id,
      organization_id: row.organizationId?.toString() ?? null,
      name: row.name,
      code: row.code,
      account_type: row.accountType,
      bank_name: row.bankName,
      account_name: row.accountName,
      account_number: row.accountNumber,
      branch_name: row.branchName,
      currency: row.currency,
      opening_balance: Number(row.openingBalance),
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  async updateAccount(id: string, dto: UpsertFinanceAccountDto) {
    const existing = await this.prisma.financeAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Account not found');

    const row = await this.prisma.financeAccount.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        code: dto.code?.trim() || null,
        accountType: dto.account_type ?? existing.accountType,
        bankName: dto.bank_name?.trim() || existing.bankName,
        accountName: dto.account_name?.trim() || existing.accountName,
        accountNumber: dto.account_number?.trim() || existing.accountNumber,
        branchName: dto.branch_name?.trim() || existing.branchName,
        currency: (dto.currency ?? existing.currency).toUpperCase(),
        openingBalance: dto.opening_balance ?? existing.openingBalance,
        isActive: dto.is_active ?? existing.isActive,
        metadata: ((dto.metadata ?? existing.metadata ?? {}) as Prisma.InputJsonValue)
      }
    });

    return {
      id: row.id,
      organization_id: row.organizationId?.toString() ?? null,
      name: row.name,
      code: row.code,
      account_type: row.accountType,
      bank_name: row.bankName,
      account_name: row.accountName,
      account_number: row.accountNumber,
      branch_name: row.branchName,
      currency: row.currency,
      opening_balance: Number(row.openingBalance),
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  async createIncome(dto: CreateFinanceIncomeDto, actorId?: string) {
    const account = await this.prisma.financeAccount.findUnique({
      where: { id: dto.account_id },
      select: { id: true, currency: true, isActive: true }
    });
    if (!account || !account.isActive) throw new BadRequestException('Invalid account_id');
    if (dto.file_id) {
      const fileExists = await this.prisma.fileAsset.count({ where: { id: dto.file_id } });
      if (!fileExists) throw new BadRequestException('Invalid file_id');
    }

    const now = dto.received_at ? new Date(dto.received_at) : new Date();
    if (Number.isNaN(now.getTime())) throw new BadRequestException('Invalid received_at');
    const currency = (dto.currency ?? account.currency ?? 'NGN').toUpperCase();

    const income = await this.prisma.financeIncomeEntry.create({
      data: {
        accountId: account.id,
        amount: dto.amount,
        currency,
        receivedAt: now,
        reference: dto.reference?.trim() || null,
        payer: dto.payer?.trim() || null,
        notes: dto.notes?.trim() || null,
        fileId: dto.file_id ?? null,
        createdBy: actorId ? toBigInt(actorId) : null
      }
    });

    await this.prisma.financeLedgerEntry.create({
      data: {
        accountId: account.id,
        direction: 'in',
        amount: dto.amount,
        currency,
        entryDate: now,
        description: dto.notes?.trim() || 'Income entry',
        sourceType: 'finance_income',
        sourceId: income.id,
        createdBy: actorId ? toBigInt(actorId) : null,
        metadata: {
          reference: dto.reference ?? null,
          payer: dto.payer ?? null
        } as Prisma.InputJsonValue
      }
    });

    return {
      id: income.id,
      account_id: income.accountId,
      amount: Number(income.amount),
      currency: income.currency,
      received_at: income.receivedAt,
      reference: income.reference,
      payer: income.payer,
      notes: income.notes,
      file_id: income.fileId,
      created_at: income.createdAt
    };
  }

  async listIncome(query: Record<string, any>) {
    const where: Prisma.FinanceIncomeEntryWhereInput = {
      ...(query.account_id ? { accountId: String(query.account_id) } : {}),
      ...(query.from || query.to
        ? {
            receivedAt: {
              ...(query.from ? { gte: new Date(String(query.from)) } : {}),
              ...(query.to ? { lte: new Date(String(query.to)) } : {})
            }
          }
        : {})
    };
    const rows = await this.prisma.financeIncomeEntry.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, code: true } },
        file: { select: { id: true, fileName: true, publicUrl: true } }
      },
      orderBy: { receivedAt: 'desc' },
      take: Math.min(500, Math.max(1, Number(query.limit ?? 100)))
    });
    return rows.map((row) => ({
      id: row.id,
      account_id: row.accountId,
      account_name: row.account.name,
      account_code: row.account.code,
      amount: Number(row.amount),
      currency: row.currency,
      received_at: row.receivedAt,
      reference: row.reference,
      payer: row.payer,
      notes: row.notes,
      file: row.file
        ? { id: row.file.id, file_name: row.file.fileName, public_url: row.file.publicUrl }
        : null,
      created_at: row.createdAt
    }));
  }

  async createTransfer(dto: CreateTransferDto, actorId?: string) {
    if (dto.from_account_id === dto.to_account_id) {
      throw new BadRequestException('from_account_id and to_account_id must be different');
    }
    const [fromAccount, toAccount] = await this.prisma.$transaction([
      this.prisma.financeAccount.findUnique({
        where: { id: dto.from_account_id },
        select: { id: true, name: true, isActive: true, currency: true }
      }),
      this.prisma.financeAccount.findUnique({
        where: { id: dto.to_account_id },
        select: { id: true, name: true, isActive: true, currency: true }
      })
    ]);
    if (!fromAccount || !fromAccount.isActive) throw new BadRequestException('Invalid from_account_id');
    if (!toAccount || !toAccount.isActive) throw new BadRequestException('Invalid to_account_id');
    const amount = Number(dto.amount || 0);
    if (amount <= 0) throw new BadRequestException('Transfer amount must be greater than zero');

    const transferAt = dto.transfer_at ? new Date(dto.transfer_at) : new Date();
    if (Number.isNaN(transferAt.getTime())) throw new BadRequestException('Invalid transfer_at');
    const currency = (dto.currency ?? fromAccount.currency ?? toAccount.currency ?? 'NGN').toUpperCase();
    const sourceId = `transfer:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const description = dto.note?.trim() || `Transfer ${currency} ${amount} from ${fromAccount.name} to ${toAccount.name}`;

    await this.prisma.$transaction([
      this.prisma.financeLedgerEntry.create({
        data: {
          accountId: fromAccount.id,
          direction: 'out',
          amount,
          currency,
          entryDate: transferAt,
          description,
          sourceType: 'finance_transfer',
          sourceId,
          createdBy: actorId ? toBigInt(actorId) : null,
          metadata: {
            reference: dto.reference ?? null,
            counterpart_account_id: toAccount.id
          } as Prisma.InputJsonValue
        }
      }),
      this.prisma.financeLedgerEntry.create({
        data: {
          accountId: toAccount.id,
          direction: 'in',
          amount,
          currency,
          entryDate: transferAt,
          description,
          sourceType: 'finance_transfer',
          sourceId,
          createdBy: actorId ? toBigInt(actorId) : null,
          metadata: {
            reference: dto.reference ?? null,
            counterpart_account_id: fromAccount.id
          } as Prisma.InputJsonValue
        }
      })
    ]);

    return {
      success: true,
      source_id: sourceId,
      from_account_id: fromAccount.id,
      to_account_id: toAccount.id,
      amount,
      currency,
      transferred_at: transferAt
    };
  }

  async listLedger(query: Record<string, any>) {
    const where: Prisma.FinanceLedgerEntryWhereInput = {
      ...(query.account_id ? { accountId: String(query.account_id) } : {}),
      ...(query.direction ? { direction: String(query.direction) } : {}),
      ...(query.source_type ? { sourceType: String(query.source_type) } : {}),
      ...(query.from || query.to
        ? {
            entryDate: {
              ...(query.from ? { gte: new Date(String(query.from)) } : {}),
              ...(query.to ? { lte: new Date(String(query.to)) } : {})
            }
          }
        : {})
    };
    const rows = await this.prisma.financeLedgerEntry.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, code: true, accountType: true } }
      },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(500, Math.max(1, Number(query.limit ?? 100)))
    });
    return rows.map((row) => ({
      id: row.id,
      account_id: row.accountId,
      account_name: row.account.name,
      account_code: row.account.code,
      account_type: row.account.accountType,
      direction: row.direction,
      amount: Number(row.amount),
      currency: row.currency,
      entry_date: row.entryDate,
      description: row.description,
      source_type: row.sourceType,
      source_id: row.sourceId,
      created_at: row.createdAt
    }));
  }

  async listAssets(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));
    const where: Prisma.FinanceAssetWhereInput = {};

    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');
    if (query.team_id) where.teamId = this.parseId(String(query.team_id), 'team_id');
    if (query.assigned_to_user_id) where.assignedToUserId = this.parseId(String(query.assigned_to_user_id), 'assigned_to_user_id');
    if (query.category) where.category = String(query.category);
    if (query.status) where.status = String(query.status);
    if (query.condition) where.condition = String(query.condition);
    if (query.asset_id) where.assetId = { contains: String(query.asset_id), mode: 'insensitive' };
    if (query.q) {
      const term = String(query.q);
      where.OR = [
        { assetId: { contains: term, mode: 'insensitive' } },
        { assetDescription: { contains: term, mode: 'insensitive' } },
        { serialTagNo: { contains: term, mode: 'insensitive' } },
        { supplier: { contains: term, mode: 'insensitive' } },
        { locationProject: { contains: term, mode: 'insensitive' } }
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.financeAsset.findMany({
        where,
        include: this.getAssetInclude(),
        orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.financeAsset.count({ where })
    ]);

    return {
      data: rows.map((row) => this.serializeAsset(row)),
      meta: {
        page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage))
      }
    };
  }

  async listAssetDisposals(query: Record<string, any>) {
    const where: Prisma.FinanceAssetDisposalWhereInput = {};
    if (query.from || query.to) {
      where.disposalDate = {
        ...(query.from ? { gte: new Date(String(query.from)) } : {}),
        ...(query.to ? { lte: new Date(String(query.to)) } : {})
      };
    }

    const rows = await this.prisma.financeAssetDisposal.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetId: true,
            assetDescription: true,
            category: true,
            purchaseCost: true
          }
        },
        approvedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: [{ disposalDate: 'desc' }, { createdAt: 'desc' }]
    });

    return rows.map((row) => ({
      id: row.id,
      asset_id: row.asset.assetId,
      asset_record_id: row.assetRecordId,
      asset_description: row.asset.assetDescription,
      category: row.asset.category,
      original_cost: Number(row.asset.purchaseCost),
      book_value_at_disposal: Number(row.bookValueAtDisposal),
      disposal_date: row.disposalDate,
      disposal_method: row.disposalMethod,
      proceeds: Number(row.proceeds),
      gain_loss: Number(row.gainLoss),
      donor_asset: row.donorAsset,
      approved_by: this.serializeSimpleProfile(row.approvedByUser),
      created_by: this.serializeSimpleProfile(row.createdByUser),
      notes: row.notes
    }));
  }

  async getAsset(id: string) {
    const asset = await this.prisma.financeAsset.findUnique({
      where: { id },
      include: this.getAssetInclude()
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return this.serializeAsset(asset);
  }

  async createAsset(dto: UpsertFinanceAssetDto, actorId?: string) {
    this.validateAssetPayload(dto);

    const assetId = dto.asset_id?.trim() || (await this.generateNextAssetId());
    const purchaseDate = new Date(dto.purchase_date);
    if (Number.isNaN(purchaseDate.getTime())) throw new BadRequestException('Invalid purchase_date');

    const created = await this.prisma.financeAsset.create({
      data: {
        assetId,
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        teamId: dto.team_id ? this.parseId(dto.team_id, 'team_id') : null,
        assetDescription: dto.asset_description.trim(),
        category: dto.category.trim(),
        serialTagNo: dto.serial_tag_no?.trim() || null,
        locationProject: dto.location_project?.trim() || null,
        assignedToUserId: dto.assigned_to_user_id ? this.parseId(dto.assigned_to_user_id, 'assigned_to_user_id') : null,
        purchaseDate,
        supplier: dto.supplier?.trim() || null,
        purchaseCost: dto.purchase_cost,
        usefulLifeYears: Math.trunc(dto.useful_life_years),
        salvageValue: dto.salvage_value ?? 0,
        condition: (dto.condition ?? 'good').trim(),
        status: (dto.status ?? 'active').trim(),
        notes: dto.notes?.trim() || null,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: this.getAssetInclude()
    }).catch((error) => {
      this.handleAssetConstraintErrors(error, assetId);
      throw error;
    });

    return this.serializeAsset(created);
  }

  async updateAsset(id: string, dto: UpsertFinanceAssetDto, actorId?: string) {
    const existing = await this.prisma.financeAsset.findUnique({
      where: { id },
      include: { disposal: true }
    });
    if (!existing) throw new NotFoundException('Asset not found');
    if (existing.disposal) {
      throw new BadRequestException('Disposed assets cannot be updated');
    }

    this.validateAssetPayload(dto);
    const purchaseDate = new Date(dto.purchase_date);
    if (Number.isNaN(purchaseDate.getTime())) throw new BadRequestException('Invalid purchase_date');
    const assetId = dto.asset_id?.trim() || existing.assetId;

    const updated = await this.prisma.financeAsset.update({
      where: { id },
      data: {
        assetId,
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        teamId: dto.team_id ? this.parseId(dto.team_id, 'team_id') : null,
        assetDescription: dto.asset_description.trim(),
        category: dto.category.trim(),
        serialTagNo: dto.serial_tag_no?.trim() || null,
        locationProject: dto.location_project?.trim() || null,
        assignedToUserId: dto.assigned_to_user_id ? this.parseId(dto.assigned_to_user_id, 'assigned_to_user_id') : null,
        purchaseDate,
        supplier: dto.supplier?.trim() || null,
        purchaseCost: dto.purchase_cost,
        usefulLifeYears: Math.trunc(dto.useful_life_years),
        salvageValue: dto.salvage_value ?? 0,
        condition: (dto.condition ?? existing.condition).trim(),
        status: (dto.status ?? existing.status).trim(),
        notes: dto.notes?.trim() || null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: this.getAssetInclude()
    }).catch((error) => {
      this.handleAssetConstraintErrors(error, assetId);
      throw error;
    });

    return this.serializeAsset(updated);
  }

  async verifyAsset(id: string, dto: CreateFinanceAssetVerificationDto, actorId?: string) {
    if (!actorId) throw new BadRequestException('Actor is required');
    const asset = await this.prisma.financeAsset.findUnique({
      where: { id },
      select: { id: true, disposal: true }
    });
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.disposal) throw new BadRequestException('Disposed asset cannot be verified');

    const verifiedAt = new Date(dto.verified_at);
    if (Number.isNaN(verifiedAt.getTime())) throw new BadRequestException('Invalid verified_at');

    await this.prisma.$transaction(async (tx) => {
      await tx.financeAssetVerification.create({
        data: {
          assetRecordId: id,
          verifiedAt,
          condition: dto.condition.trim(),
          locationProject: dto.location_project?.trim() || null,
          assignedToUserId: dto.assigned_to_user_id ? this.parseId(dto.assigned_to_user_id, 'assigned_to_user_id') : null,
          verifiedBy: toBigInt(actorId),
          notes: dto.notes?.trim() || null
        }
      });

      await tx.financeAsset.update({
        where: { id },
        data: {
          condition: dto.condition.trim(),
          locationProject: dto.location_project?.trim() || undefined,
          assignedToUserId: dto.assigned_to_user_id ? this.parseId(dto.assigned_to_user_id, 'assigned_to_user_id') : undefined,
          lastVerifiedDate: verifiedAt,
          lastVerifiedBy: toBigInt(actorId),
          updatedBy: toBigInt(actorId)
        }
      });
    });

    return this.getAsset(id);
  }

  async disposeAsset(id: string, dto: CreateFinanceAssetDisposalDto, actorId?: string) {
    const asset = await this.prisma.financeAsset.findUnique({
      where: { id },
      include: { disposal: true }
    });
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.disposal) throw new BadRequestException('Asset has already been disposed');

    const disposalDate = new Date(dto.disposal_date);
    if (Number.isNaN(disposalDate.getTime())) throw new BadRequestException('Invalid disposal_date');
    const metrics = this.computeAssetMetrics({
      purchaseDate: asset.purchaseDate,
      purchaseCost: Number(asset.purchaseCost),
      usefulLifeYears: asset.usefulLifeYears,
      salvageValue: Number(asset.salvageValue),
      asOfDate: disposalDate
    });
    const proceeds = Number(dto.proceeds ?? 0);
    const gainLoss = proceeds - metrics.netBookValue;

    await this.prisma.$transaction(async (tx) => {
      await tx.financeAssetDisposal.create({
        data: {
          assetRecordId: asset.id,
          disposalDate,
          disposalMethod: dto.disposal_method.trim(),
          proceeds,
          bookValueAtDisposal: metrics.netBookValue,
          gainLoss,
          approvedBy: dto.approved_by ? this.parseId(dto.approved_by, 'approved_by') : null,
          donorAsset: dto.donor_asset ?? false,
          notes: dto.notes?.trim() || null,
          createdBy: actorId ? toBigInt(actorId) : null
        }
      });

      await tx.financeAsset.update({
        where: { id: asset.id },
        data: {
          status: 'disposed',
          updatedBy: actorId ? toBigInt(actorId) : null
        }
      });
    });

    return this.getAsset(id);
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private async nextVoucherNumber(requestId: bigint, year: number) {
    const count = await this.prisma.financePaymentVoucher.count({
      where: { requestId }
    });
    return `PV/${year}/${requestId.toString()}/${String(count + 1).padStart(3, '0')}`;
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

    const data =
      request.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? (request.data as Record<string, unknown>)
        : {};
    const manual = typeof data.manual_request_number === 'string' ? data.manual_request_number.trim() : '';
    if (manual) return manual;
    const codePrefix = (request.requestType?.codePrefix || 'REQ').toUpperCase();
    return `${codePrefix}/${request.createdAt.getFullYear()}/${request.id.toString()}`;
  }

  private getRequestThreadKey(requestNumber: string): string {
    return `request-${requestNumber.replace(/[^a-zA-Z0-9_.-]/g, '-').toLowerCase()}`;
  }

  private normalizeSettings(data: unknown) {
    const base =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, any>)
        : {};
    return {
      prepared_by: {
        name: base?.prepared_by?.name ?? '',
        title: base?.prepared_by?.title ?? 'Accountant'
      },
      reviewed_by: {
        name: base?.reviewed_by?.name ?? '',
        title: base?.reviewed_by?.title ?? 'Finance Manager / COO'
      },
      approved_by: {
        name: base?.approved_by?.name ?? '',
        title: base?.approved_by?.title ?? 'Executive Director'
      },
      meta: base?.meta ?? {}
    };
  }

  private getAssetInclude() {
    return {
      organization: { select: { id: true, name: true, code: true } },
      team: { select: { id: true, name: true, type: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      createdByProfile: { select: { id: true, firstName: true, lastName: true, email: true } },
      updatedByProfile: { select: { id: true, firstName: true, lastName: true, email: true } },
      verifications: {
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          verifiedByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
        },
        orderBy: [{ verifiedAt: 'desc' }, { createdAt: 'desc' }]
      },
      disposal: {
        include: {
          approvedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      }
    } satisfies Prisma.FinanceAssetInclude;
  }

  private serializeAsset(asset: Prisma.FinanceAssetGetPayload<{ include: ReturnType<FinanceService['getAssetInclude']> }>) {
    const asOfDate = asset.disposal?.disposalDate ?? new Date();
    const metrics = this.computeAssetMetrics({
      purchaseDate: asset.purchaseDate,
      purchaseCost: Number(asset.purchaseCost),
      usefulLifeYears: asset.usefulLifeYears,
      salvageValue: Number(asset.salvageValue),
      asOfDate
    });

    return {
      id: asset.id,
      asset_id: asset.assetId,
      organization: asset.organization
        ? { id: asset.organization.id.toString(), name: asset.organization.name, code: asset.organization.code }
        : null,
      team: asset.team ? { id: asset.team.id.toString(), name: asset.team.name, type: asset.team.type } : null,
      asset_description: asset.assetDescription,
      category: asset.category,
      serial_tag_no: asset.serialTagNo,
      location_project: asset.locationProject,
      assigned_to: this.serializeSimpleProfile(asset.assignedTo),
      purchase_date: asset.purchaseDate,
      supplier: asset.supplier,
      purchase_cost: Number(asset.purchaseCost),
      useful_life_years: asset.usefulLifeYears,
      salvage_value: Number(asset.salvageValue),
      depreciation_rate: metrics.depreciationRate,
      depreciation_per_annum: metrics.annualDepreciation,
      accumulated_depreciation: metrics.accumulatedDepreciation,
      net_book_value: metrics.netBookValue,
      condition: asset.condition,
      status: asset.status,
      last_verified_date: asset.lastVerifiedDate,
      last_verified_by: this.serializeSimpleProfile(asset.verifiedBy),
      notes: asset.notes,
      created_by: this.serializeSimpleProfile(asset.createdByProfile),
      updated_by: this.serializeSimpleProfile(asset.updatedByProfile),
      created_at: asset.createdAt,
      updated_at: asset.updatedAt,
      verifications: asset.verifications.map((row) => ({
        id: row.id,
        verified_at: row.verifiedAt,
        condition: row.condition,
        location_project: row.locationProject,
        assigned_to: this.serializeSimpleProfile(row.assignedTo),
        verified_by: this.serializeSimpleProfile(row.verifiedByUser),
        notes: row.notes,
        created_at: row.createdAt
      })),
      disposal: asset.disposal
        ? {
            id: asset.disposal.id,
            disposal_date: asset.disposal.disposalDate,
            disposal_method: asset.disposal.disposalMethod,
            proceeds: Number(asset.disposal.proceeds),
            book_value_at_disposal: Number(asset.disposal.bookValueAtDisposal),
            gain_loss: Number(asset.disposal.gainLoss),
            donor_asset: asset.disposal.donorAsset,
            approved_by: this.serializeSimpleProfile(asset.disposal.approvedByUser),
            created_by: this.serializeSimpleProfile(asset.disposal.createdByUser),
            notes: asset.disposal.notes,
            created_at: asset.disposal.createdAt
          }
        : null
    };
  }

  private serializeSimpleProfile(
    profile:
      | { id: bigint; firstName: string | null; lastName: string | null; email: string }
      | null
      | undefined
  ) {
    if (!profile) return null;
    return {
      id: profile.id.toString(),
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      name: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email
    };
  }

  private validateAssetPayload(dto: UpsertFinanceAssetDto) {
    if (dto.purchase_cost < 50000) {
      throw new BadRequestException('purchase_cost must be at least 50000 to qualify for the asset register');
    }
    if (dto.useful_life_years <= 1) {
      throw new BadRequestException('useful_life_years must be greater than 1');
    }
  }

  private computeAssetMetrics(input: {
    purchaseDate: Date;
    purchaseCost: number;
    usefulLifeYears: number;
    salvageValue: number;
    asOfDate: Date;
  }) {
    const depreciableBase = Math.max(0, input.purchaseCost - input.salvageValue);
    const depreciationRate = input.usefulLifeYears > 0 ? 1 / input.usefulLifeYears : 0;
    const annualDepreciation = input.usefulLifeYears > 0 ? depreciableBase / input.usefulLifeYears : 0;
    const elapsedYears = Math.max(
      0,
      Math.min(input.usefulLifeYears, this.fullYearsBetween(input.purchaseDate, input.asOfDate))
    );
    const accumulatedDepreciation = Math.min(depreciableBase, annualDepreciation * elapsedYears);
    const netBookValue = Math.max(input.salvageValue, input.purchaseCost - accumulatedDepreciation);
    return {
      depreciationRate,
      annualDepreciation,
      accumulatedDepreciation,
      netBookValue
    };
  }

  private fullYearsBetween(start: Date, end: Date) {
    let years = end.getFullYear() - start.getFullYear();
    const endMonth = end.getMonth();
    const startMonth = start.getMonth();
    if (endMonth < startMonth || (endMonth === startMonth && end.getDate() < start.getDate())) {
      years -= 1;
    }
    return Math.max(0, years);
  }

  private async generateNextAssetId() {
    const count = await this.prisma.financeAsset.count();
    let candidateNumber = count + 1;
    while (candidateNumber < 1000000) {
      const candidate = `SEA-${String(candidateNumber).padStart(3, '0')}`;
      const exists = await this.prisma.financeAsset.findUnique({
        where: { assetId: candidate },
        select: { id: true }
      });
      if (!exists) return candidate;
      candidateNumber += 1;
    }
    throw new BadRequestException('Unable to generate asset_id');
  }

  private handleAssetConstraintErrors(error: unknown, assetId: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(`asset_id "${assetId}" already exists`);
    }
  }
}
