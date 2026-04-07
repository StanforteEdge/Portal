import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { UpsertFinanceChartAccountDto } from './dto/upsert-finance-chart-account.dto';
import { UpsertFinanceReportingPeriodDto } from './dto/upsert-finance-reporting-period.dto';
import { UpsertFinanceCustomerDto } from './dto/upsert-finance-customer.dto';
import { UpsertFinanceVendorDto } from './dto/upsert-finance-vendor.dto';
import { CreateFinanceSalesInvoiceDto } from './dto/create-finance-sales-invoice.dto';
import { CreateFinanceBillDto } from './dto/create-finance-bill.dto';
import { CreateFinanceReceiptDto } from './dto/create-finance-receipt.dto';
import { CreateFinanceVendorPaymentDto } from './dto/create-finance-vendor-payment.dto';
import { UpsertFinanceReportNoteDto } from './dto/upsert-finance-report-note.dto';
import { UpdatePaymentVoucherDto } from './dto/update-payment-voucher.dto';
import { MailService } from '../../common/mail/mail.service';
import { PDFDocument, StandardFonts } from 'pdf-lib';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService
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
    const pendingFinancePermissionSlugs = new Set(['finance.approve']);
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
            (
              (approver.approverType === 'role' &&
                pendingFinanceRoleSlugs.has(String(approver.approverId || '').trim().toLowerCase())) ||
              (approver.approverType === 'permission' &&
                pendingFinancePermissionSlugs.has(String(approver.approverId || '').trim().toLowerCase()))
            )
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
    const evidenceFileIds = Array.from(
      new Set([dto.evidence_file_id ?? null, ...(dto.evidence_file_ids ?? [])].filter((id): id is string => Boolean(id)))
    );
    if (evidenceFileIds.length > 0) {
      const fileExists = await this.prisma.fileAsset.count({ where: { id: { in: evidenceFileIds } } });
      if (fileExists !== evidenceFileIds.length) throw new BadRequestException('Invalid disbursement evidence file');
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
    const requestFundId = typeof existingData.fund_id === 'string' ? existingData.fund_id : null;
    const requestGrantId = typeof existingData.grant_id === 'string' ? existingData.grant_id : null;
    const { fund, grant } = await this.validateFundGrant(requestFundId, requestGrantId);
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
      evidence_file_id: evidenceFileIds[0] ?? null,
      evidence_file_ids: evidenceFileIds,
      disbursed_at: now.toISOString()
    };

    const voucher = await this.prisma.financePaymentVoucher.create({
      data: {
        requestId: id,
        paidFromAccountId: dto.paid_from_account_id ?? null,
        fundId: fund?.id ?? null,
        grantId: grant?.id ?? null,
        voucherNumber,
        amount: disburseAmount,
        method: dto.method ?? null,
        transactionRef: dto.transaction_ref ?? null,
        note: dto.note ?? null,
        evidenceFileId: evidenceFileIds[0] ?? null,
        disbursedAt: now
      }
    });
    if (evidenceFileIds.length > 0) {
      await this.prisma.financePaymentVoucherFile.createMany({
        data: evidenceFileIds.map((fileId, index) => ({
          voucherId: voucher.id,
          fileId,
          fileKind: 'evidence',
          sortOrder: index
        }))
      });
    }
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
          sourceId: voucher.id,
          createdBy: actorId ? toBigInt(actorId) : null,
          metadata: {
            request_id: request.id.toString(),
            voucher_number: voucherNumber
          } as Prisma.InputJsonValue
        }
      });
    }

    await this.postPaymentVoucherJournal(voucher, request.organizationId, request.teamId, actorId);
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
        attachments: {
          where: { fileKind: 'evidence' },
          include: {
            file: {
              select: { id: true, fileName: true, mimeType: true, publicUrl: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        paidFromAccount: {
          select: { id: true, name: true, code: true, accountType: true }
        },
        corrections: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            proposer: {
              select: { id: true, firstName: true, lastName: true, username: true, email: true }
            }
          }
        }
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
      const evidenceFiles = Array.from(
        new Map(
          [
            ...(voucher.attachments ?? []).map((attachment) => attachment.file).filter(Boolean),
            voucher.evidenceFile ?? null
          ]
            .filter((file): file is NonNullable<typeof voucher.evidenceFile> => Boolean(file))
            .map((file) => [
              file.id,
              {
                id: file.id,
                file_name: file.fileName,
                mime_type: file.mimeType,
                public_url: file.publicUrl
              }
            ])
        ).values()
      );
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
        evidence_file: evidenceFiles[0] ?? null,
        evidence_files: evidenceFiles,
        paid_from_account: voucher.paidFromAccount
          ? {
              id: voucher.paidFromAccount.id,
              name: voucher.paidFromAccount.name,
              code: voucher.paidFromAccount.code,
              account_type: voucher.paidFromAccount.accountType
            }
          : null,
        pending_correction: this.serializeVoucherCorrection(voucher.corrections?.[0] ?? null),
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

  async updatePaymentVoucher(
    requestId: string,
    voucherId: string,
    dto: UpdatePaymentVoucherDto,
    actorId?: string,
    actorPermissions: string[] = []
  ) {
    const id = this.parseId(requestId, 'request id');
    const voucher = await this.prisma.financePaymentVoucher.findFirst({
      where: { id: voucherId, requestId: id },
      include: {
        request: {
          select: {
            id: true,
            status: true,
            organizationId: true,
            teamId: true,
            workflowInstanceId: true,
          }
        },
      },
    });
    if (!voucher) throw new NotFoundException('Payment voucher not found');
    const permissionSet = new Set((actorPermissions ?? []).map((permission) => String(permission).toLowerCase()));
    const canCorrectCompleted = permissionSet.has('*') || permissionSet.has('finance.correct_completed');
    const prepared = await this.preparePaymentVoucherUpdate(voucher, dto);

    if (voucher.request.status === 'completed' && !canCorrectCompleted) {
      const correction = await this.submitPaymentVoucherCorrection(voucher, prepared, dto.correction_reason, actorId);
      const updated = await this.listPaymentVouchers(requestId);
      const matched = updated.find((row) => row.id === voucherId);
      if (!matched) throw new NotFoundException('Payment voucher not found after correction request');
      return {
        mode: 'pending_approval' as const,
        voucher: matched,
        correction: this.serializeVoucherCorrection(correction)
      };
    }

    await this.applyPaymentVoucherUpdate(voucher, prepared, actorId);
    const updated = await this.listPaymentVouchers(requestId);
    const matched = updated.find((row) => row.id === voucherId);
    if (!matched) throw new NotFoundException('Payment voucher not found after update');
    return {
      mode: 'updated' as const,
      voucher: matched
    };
  }

  async approvePaymentVoucherCorrection(requestId: string, voucherId: string, correctionId: string, actorId?: string) {
    const id = this.parseId(requestId, 'request id');
    const correction = await this.prisma.financePaymentVoucherCorrection.findFirst({
      where: { id: correctionId, voucherId, requestId: id, status: 'pending' },
      include: {
        voucher: {
          include: {
            request: {
              select: {
                id: true,
                status: true,
                organizationId: true,
                teamId: true,
                workflowInstanceId: true,
              }
            }
          }
        }
      }
    });
    if (!correction) throw new NotFoundException('Pending payment voucher correction not found');

    const proposed = this.correctionSnapshotToDto(correction.proposedSnapshot);
    const prepared = await this.preparePaymentVoucherUpdate(correction.voucher, proposed);
    await this.applyPaymentVoucherUpdate(correction.voucher, prepared, actorId);

    await this.prisma.financePaymentVoucherCorrection.update({
      where: { id: correction.id },
      data: {
        status: 'approved',
        reviewedBy: actorId ? toBigInt(actorId) : null,
        reviewedAt: new Date(),
      }
    });

    await this.notificationsService.create({
      userId: correction.proposedBy,
      type: 'finance',
      title: 'Payment voucher correction approved',
      message: `Your correction for voucher ${correction.voucher.voucherNumber} has been approved.`,
      link: `/app/finance/requests/request/${requestId}?voucher_id=${voucherId}`,
      data: { voucher_id: voucherId, correction_id: correction.id, status: 'approved' } as Prisma.InputJsonValue
    }).catch(() => undefined);

    const updated = await this.listPaymentVouchers(requestId);
    return {
      mode: 'approved' as const,
      voucher: updated.find((row) => row.id === voucherId) ?? null,
      correction_id: correction.id
    };
  }

  async rejectPaymentVoucherCorrection(requestId: string, voucherId: string, correctionId: string, actorId?: string, comment?: string) {
    const id = this.parseId(requestId, 'request id');
    const correction = await this.prisma.financePaymentVoucherCorrection.findFirst({
      where: { id: correctionId, voucherId, requestId: id, status: 'pending' },
      include: { voucher: true }
    });
    if (!correction) throw new NotFoundException('Pending payment voucher correction not found');

    await this.prisma.financePaymentVoucherCorrection.update({
      where: { id: correction.id },
      data: {
        status: 'rejected',
        reviewedBy: actorId ? toBigInt(actorId) : null,
        reviewedAt: new Date(),
        reviewComment: comment?.trim() || null
      }
    });

    await this.notificationsService.create({
      userId: correction.proposedBy,
      type: 'warning',
      title: 'Payment voucher correction rejected',
      message: comment?.trim()
        ? `Your correction for voucher ${correction.voucher.voucherNumber} was rejected: ${comment.trim()}`
        : `Your correction for voucher ${correction.voucher.voucherNumber} was rejected.`,
      link: `/app/finance/requests/request/${requestId}?voucher_id=${voucherId}`,
      data: { voucher_id: voucherId, correction_id: correction.id, status: 'rejected' } as Prisma.InputJsonValue
    }).catch(() => undefined);

    const updated = await this.listPaymentVouchers(requestId);
    return {
      mode: 'rejected' as const,
      voucher: updated.find((row) => row.id === voucherId) ?? null,
      correction_id: correction.id
    };
  }

  private serializeVoucherCorrection(
    correction:
      | (Prisma.FinancePaymentVoucherCorrectionGetPayload<{ include: { proposer: { select: { id: true; firstName: true; lastName: true; username: true; email: true } } } }>)
      | null
  ) {
    if (!correction) return null;
    const proposed = correction.proposedSnapshot && typeof correction.proposedSnapshot === 'object' && !Array.isArray(correction.proposedSnapshot)
      ? (correction.proposedSnapshot as Record<string, unknown>)
      : {};
    const proposerName =
      `${String(correction.proposer?.firstName ?? '').trim()} ${String(correction.proposer?.lastName ?? '').trim()}`.trim() ||
      correction.proposer?.username ||
      correction.proposer?.email ||
      '-';
    return {
      id: correction.id,
      status: correction.status,
      reason: correction.reason,
      created_at: correction.createdAt,
      proposed_by: {
        id: correction.proposer?.id?.toString?.() ?? String(correction.proposedBy),
        name: proposerName,
        email: correction.proposer?.email ?? null
      },
      proposed_snapshot: {
        amount: typeof proposed.amount === 'number' ? proposed.amount : Number(proposed.amount ?? 0),
        paid_from_account_id: typeof proposed.paid_from_account_id === 'string' ? proposed.paid_from_account_id : null,
        disbursed_at: typeof proposed.disbursed_at === 'string' ? proposed.disbursed_at : null,
        method: typeof proposed.method === 'string' ? proposed.method : null,
        transaction_ref: typeof proposed.transaction_ref === 'string' ? proposed.transaction_ref : null,
        note: typeof proposed.note === 'string' ? proposed.note : null,
        evidence_file_ids: Array.isArray(proposed.evidence_file_ids) ? proposed.evidence_file_ids.map((value) => String(value)) : []
      }
    };
  }

  private correctionSnapshotToDto(snapshot: Prisma.JsonValue): UpdatePaymentVoucherDto {
    const record = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
      ? (snapshot as Record<string, unknown>)
      : {};
    return {
      amount: Number(record.amount ?? 0),
      paid_from_account_id: typeof record.paid_from_account_id === 'string' ? record.paid_from_account_id : undefined,
      disbursed_at: typeof record.disbursed_at === 'string' ? record.disbursed_at : undefined,
      method: typeof record.method === 'string' ? record.method : undefined,
      transaction_ref: typeof record.transaction_ref === 'string' ? record.transaction_ref : undefined,
      note: typeof record.note === 'string' ? record.note : undefined,
      evidence_file_id: Array.isArray(record.evidence_file_ids) && record.evidence_file_ids.length > 0 ? String(record.evidence_file_ids[0]) : undefined,
      evidence_file_ids: Array.isArray(record.evidence_file_ids) ? record.evidence_file_ids.map((value) => String(value)) : [],
    };
  }

  private async preparePaymentVoucherUpdate(
    voucher: Prisma.FinancePaymentVoucherGetPayload<{
      include: {
        request: {
          select: {
            id: true;
            status: true;
            organizationId: true;
            teamId: true;
            workflowInstanceId: true;
          }
        }
      }
    }>,
    dto: UpdatePaymentVoucherDto
  ) {
    const evidenceFileIds = Array.from(
      new Set([dto.evidence_file_id ?? null, ...(dto.evidence_file_ids ?? [])].filter((fileId): fileId is string => Boolean(fileId)))
    );
    if (evidenceFileIds.length > 0) {
      const fileExists = await this.prisma.fileAsset.count({ where: { id: { in: evidenceFileIds } } });
      if (fileExists !== evidenceFileIds.length) {
        throw new BadRequestException('Invalid payment voucher evidence file');
      }
    }

    const nextAmount = dto.amount ?? Number(voucher.amount);
    if (Number.isNaN(nextAmount) || nextAmount <= 0) {
      throw new BadRequestException('Payment voucher amount must be greater than zero');
    }
    const retiredAmount = Number(voucher.retiredAmount ?? 0);
    if (nextAmount < retiredAmount) {
      throw new BadRequestException('Payment voucher amount cannot be less than the retired amount');
    }

    let disbursedAt = voucher.disbursedAt;
    if (dto.disbursed_at) {
      disbursedAt = new Date(dto.disbursed_at);
      if (Number.isNaN(disbursedAt.getTime())) throw new BadRequestException('Invalid disbursed_at date');
    }

    let paidFromAccountId = dto.paid_from_account_id ?? voucher.paidFromAccountId;
    let paidFromAccount: { id: string; currency: string; isActive: boolean } | null = null;
    if (paidFromAccountId) {
      paidFromAccount = await this.prisma.financeAccount.findUnique({
        where: { id: paidFromAccountId },
        select: { id: true, currency: true, isActive: true }
      });
      if (!paidFromAccount || !paidFromAccount.isActive) throw new BadRequestException('Invalid paid_from_account_id');
    } else {
      paidFromAccountId = null;
    }

    const nextNote = dto.note ?? voucher.note;
    const nextMethod = dto.method ?? voucher.method;
    const nextTransactionRef = dto.transaction_ref ?? voucher.transactionRef;
    const changeSummary: Record<string, { from: string | number | null; to: string | number | null }> = {};
    if (Number(voucher.amount) !== nextAmount) changeSummary.amount = { from: Number(voucher.amount), to: nextAmount };
    if ((voucher.paidFromAccountId ?? null) !== (paidFromAccountId ?? null)) {
      changeSummary.paid_from_account_id = { from: voucher.paidFromAccountId ?? null, to: paidFromAccountId ?? null };
    }
    if (voucher.disbursedAt.toISOString() !== disbursedAt.toISOString()) {
      changeSummary.disbursed_at = { from: voucher.disbursedAt.toISOString(), to: disbursedAt.toISOString() };
    }
    if ((voucher.method ?? null) !== (nextMethod ?? null)) changeSummary.method = { from: voucher.method ?? null, to: nextMethod ?? null };
    if ((voucher.transactionRef ?? null) !== (nextTransactionRef ?? null)) {
      changeSummary.transaction_ref = { from: voucher.transactionRef ?? null, to: nextTransactionRef ?? null };
    }
    if ((voucher.note ?? null) !== (nextNote ?? null)) changeSummary.note = { from: voucher.note ?? null, to: nextNote ?? null };

    return {
      evidenceFileIds,
      nextAmount,
      disbursedAt,
      paidFromAccountId,
      paidFromAccount,
      nextNote,
      nextMethod,
      nextTransactionRef,
      changeSummary,
      currentSnapshot: {
        amount: Number(voucher.amount),
        paid_from_account_id: voucher.paidFromAccountId ?? null,
        disbursed_at: voucher.disbursedAt.toISOString(),
        method: voucher.method ?? null,
        transaction_ref: voucher.transactionRef ?? null,
        note: voucher.note ?? null,
        evidence_file_ids: voucher.evidenceFileId ? [voucher.evidenceFileId] : []
      } as Prisma.InputJsonValue,
      proposedSnapshot: {
        amount: nextAmount,
        paid_from_account_id: paidFromAccountId ?? null,
        disbursed_at: disbursedAt.toISOString(),
        method: nextMethod ?? null,
        transaction_ref: nextTransactionRef ?? null,
        note: nextNote ?? null,
        evidence_file_ids: evidenceFileIds
      } as Prisma.InputJsonValue
    };
  }

  private async applyPaymentVoucherUpdate(
    voucher: Prisma.FinancePaymentVoucherGetPayload<{
      include: {
        request: {
          select: {
            id: true;
            status: true;
            organizationId: true;
            teamId: true;
            workflowInstanceId: true;
          }
        }
      }
    }>,
    prepared: Awaited<ReturnType<FinanceService['preparePaymentVoucherUpdate']>>,
    actorId?: string
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.financePaymentVoucher.update({
        where: { id: voucher.id },
        data: {
          note: prepared.nextNote,
          method: prepared.nextMethod,
          transactionRef: prepared.nextTransactionRef,
          evidenceFileId: prepared.evidenceFileIds[0] ?? null,
          amount: prepared.nextAmount,
          paidFromAccountId: prepared.paidFromAccountId,
          disbursedAt: prepared.disbursedAt,
        },
      });

      await tx.financePaymentVoucherFile.deleteMany({
        where: { voucherId: voucher.id, fileKind: 'evidence' },
      });

      if (prepared.evidenceFileIds.length > 0) {
        await tx.financePaymentVoucherFile.createMany({
          data: prepared.evidenceFileIds.map((fileId, index) => ({
            voucherId: voucher.id,
            fileId,
            fileKind: 'evidence',
            sortOrder: index,
          })),
        });
      }

      await tx.financePaymentVoucherCorrection.updateMany({
        where: { voucherId: voucher.id, status: 'pending' },
        data: { status: 'superseded', reviewedBy: actorId ? toBigInt(actorId) : null, reviewedAt: new Date() }
      });

      await tx.financeLedgerEntry.deleteMany({
        where: { sourceType: 'finance_payment_voucher', sourceId: voucher.id },
      });

      if (prepared.paidFromAccountId && prepared.paidFromAccount) {
        await tx.financeLedgerEntry.create({
          data: {
            accountId: prepared.paidFromAccountId,
            direction: 'out',
            amount: prepared.nextAmount,
            currency: prepared.paidFromAccount.currency || 'NGN',
            entryDate: prepared.disbursedAt,
            description: `Disbursement ${voucher.voucherNumber} for request ${voucher.request.id.toString()}`,
            sourceType: 'finance_payment_voucher',
            sourceId: voucher.id,
            createdBy: actorId ? toBigInt(actorId) : null,
            metadata: {
              request_id: voucher.request.id.toString(),
              voucher_number: voucher.voucherNumber
            } as Prisma.InputJsonValue
          }
        });
      }

      await tx.financeJournalEntry.deleteMany({
        where: { sourceType: 'finance_payment_voucher', sourceId: voucher.id },
      });

      if (prepared.paidFromAccountId) {
        const refreshedVoucher = await tx.financePaymentVoucher.findUnique({ where: { id: voucher.id } });
        if (!refreshedVoucher) throw new NotFoundException('Payment voucher not found after update');
        const period = await this.ensureReportingPeriod(prepared.disbursedAt, actorId);
        const bankAccount = await this.ensureFinanceAccountChartAccount(prepared.paidFromAccountId, actorId);
        const advanceAccount = await this.getRequiredChartAccount('1200');
        await this.createJournalEntryTx(tx, {
          entryDate: prepared.disbursedAt,
          periodId: period.id,
          sourceType: 'finance_payment_voucher',
          sourceId: voucher.id,
          memo: `Payment voucher ${voucher.voucherNumber}`,
          currency: 'NGN',
          postedBy: actorId,
          lines: [
            {
              chartAccountId: advanceAccount.id,
              organizationId: voucher.request.organizationId ?? null,
              teamId: voucher.request.teamId ?? null,
              fundId: refreshedVoucher.fundId,
              grantId: refreshedVoucher.grantId,
              debit: prepared.nextAmount,
              credit: 0,
              description: `Advance for ${voucher.voucherNumber}`
            },
            {
              chartAccountId: bankAccount.id,
              organizationId: voucher.request.organizationId ?? null,
              teamId: voucher.request.teamId ?? null,
              fundId: refreshedVoucher.fundId,
              grantId: refreshedVoucher.grantId,
              debit: 0,
              credit: prepared.nextAmount,
              description: `Bank settlement ${voucher.voucherNumber}`
            }
          ]
        });
      }
    });

    if (voucher.request.workflowInstanceId) {
      await this.prisma.workflowHistory.create({
        data: {
          instanceId: voucher.request.workflowInstanceId,
          action: 'pv_corrected',
          performedBy: actorId ? toBigInt(actorId) : null,
          data: {
            request_id: voucher.request.id.toString(),
            voucher_id: voucher.id,
            voucher_number: voucher.voucherNumber,
            changes: prepared.changeSummary
          } as Prisma.InputJsonValue
        }
      });
    }
  }

  private async submitPaymentVoucherCorrection(
    voucher: Prisma.FinancePaymentVoucherGetPayload<{
      include: {
        request: {
          select: {
            id: true;
            status: true;
            organizationId: true;
            teamId: true;
            workflowInstanceId: true;
          }
        }
      }
    }>,
    prepared: Awaited<ReturnType<FinanceService['preparePaymentVoucherUpdate']>>,
    reason?: string,
    actorId?: string
  ) {
    if (!actorId) throw new ForbiddenException('Authenticated user required');

    const existingPending = await this.prisma.financePaymentVoucherCorrection.findFirst({
      where: { voucherId: voucher.id, status: 'pending' },
      include: {
        proposer: {
          select: { id: true, firstName: true, lastName: true, username: true, email: true }
        }
      }
    });

    const correction = existingPending
      ? await this.prisma.financePaymentVoucherCorrection.update({
          where: { id: existingPending.id },
          data: {
            reason: reason?.trim() || null,
            currentSnapshot: prepared.currentSnapshot,
            proposedSnapshot: prepared.proposedSnapshot,
            proposedBy: toBigInt(actorId),
            reviewedBy: null,
            reviewedAt: null,
            reviewComment: null,
          },
          include: {
            proposer: {
              select: { id: true, firstName: true, lastName: true, username: true, email: true }
            }
          }
        })
      : await this.prisma.financePaymentVoucherCorrection.create({
          data: {
            voucherId: voucher.id,
            requestId: voucher.request.id,
            status: 'pending',
            reason: reason?.trim() || null,
            currentSnapshot: prepared.currentSnapshot,
            proposedSnapshot: prepared.proposedSnapshot,
            proposedBy: toBigInt(actorId),
          },
          include: {
            proposer: {
              select: { id: true, firstName: true, lastName: true, username: true, email: true }
            }
          }
        });

    const approvers = await this.prisma.userRole.findMany({
      where: {
        role: {
          OR: [
            { slug: { in: ['administrator', 'admin'] } },
            { permissions: { some: { permission: { slug: 'finance.correct_completed' } } } }
          ]
        }
      },
      select: { profileId: true },
      distinct: ['profileId']
    });

    await Promise.all(
      approvers
        .filter((row) => row.profileId.toString() !== String(actorId))
        .map((row) =>
          this.notificationsService.create({
            userId: row.profileId,
            type: 'finance',
            title: 'Payment voucher correction awaiting approval',
            message: `Voucher ${voucher.voucherNumber} has a correction request awaiting approval.`,
            link: `/app/finance/requests/request/${voucher.request.id.toString()}?voucher_id=${voucher.id}`,
            data: {
              voucher_id: voucher.id,
              correction_id: correction.id,
              request_id: voucher.request.id.toString(),
              status: 'pending'
            } as Prisma.InputJsonValue
          }).catch(() => undefined)
        )
    );

    if (voucher.request.workflowInstanceId) {
      await this.prisma.workflowHistory.create({
        data: {
          instanceId: voucher.request.workflowInstanceId,
          action: 'pv_correction_requested',
          performedBy: toBigInt(actorId),
          data: {
            request_id: voucher.request.id.toString(),
            voucher_id: voucher.id,
            voucher_number: voucher.voucherNumber,
            correction_id: correction.id,
            changes: prepared.changeSummary,
            reason: reason?.trim() || null
          } as Prisma.InputJsonValue
        }
      });
    }

    return correction;
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
          },
          attachments: {
            where: { fileKind: 'evidence' },
            include: {
              file: {
                select: { id: true, fileName: true, mimeType: true, publicUrl: true }
              }
            },
            orderBy: { sortOrder: 'asc' }
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
      const evidenceFiles = Array.from(
        new Map(
          [
            ...(row.attachments ?? []).map((attachment) => attachment.file).filter(Boolean),
            row.evidenceFile ?? null
          ]
            .filter((file): file is NonNullable<typeof row.evidenceFile> => Boolean(file))
            .map((file) => [
              file.id,
              {
                id: file.id,
                file_name: file.fileName,
                mime_type: file.mimeType,
                public_url: file.publicUrl
              }
            ])
        ).values()
      );
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
        evidence_file: evidenceFiles[0] ?? null,
        evidence_files: evidenceFiles
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

    await this.ensureFinanceAccountChartAccount(row.id, actorId);
    if (Number(row.openingBalance) !== 0) {
      const period = await this.ensureReportingPeriod(new Date(), actorId);
      const chartAccount = await this.ensureFinanceAccountChartAccount(row.id, actorId);
      const openingEquity = await this.getRequiredChartAccount('3100');
      const openingAmount = Math.abs(Number(row.openingBalance));
      await this.createJournalEntry({
        entryDate: new Date(),
        periodId: period.id,
        sourceType: 'finance_account_opening',
        sourceId: row.id,
        memo: `Opening balance for ${row.name}`,
        currency: row.currency,
        postedBy: actorId,
        lines:
          Number(row.openingBalance) >= 0
            ? [
                { chartAccountId: chartAccount.id, debit: openingAmount, credit: 0, description: 'Opening balance' },
                { chartAccountId: openingEquity.id, debit: 0, credit: openingAmount, description: 'Opening balance equity' }
              ]
            : [
                { chartAccountId: openingEquity.id, debit: openingAmount, credit: 0, description: 'Opening balance equity' },
                { chartAccountId: chartAccount.id, debit: 0, credit: openingAmount, description: 'Opening balance' }
              ]
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
    const { fund, grant } = await this.validateFundGrant(dto.fund_id, dto.grant_id);

    const income = await this.prisma.financeIncomeEntry.create({
      data: {
        accountId: account.id,
        revenueAccountId: dto.revenue_account_id ?? null,
        fundId: fund?.id ?? null,
        grantId: grant?.id ?? null,
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

    await this.postIncomeJournal(income, actorId);
    if (grant?.id) {
      await this.prisma.financeGrant.update({
        where: { id: grant.id },
        data: {
          recognizedAmount: { increment: dto.amount },
          deferredAmount: { decrement: dto.amount }
        }
      }).catch(() => null);
    }

    return {
      id: income.id,
      account_id: income.accountId,
      amount: Number(income.amount),
      currency: income.currency,
      received_at: income.receivedAt,
      reference: income.reference,
      payer: income.payer,
      fund_id: income.fundId,
      grant_id: income.grantId,
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
    const { fund, grant } = await this.validateFundGrant(dto.fund_id, dto.grant_id);
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
            counterpart_account_id: toAccount.id,
            fund_id: fund?.id ?? null,
            grant_id: grant?.id ?? null
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
            counterpart_account_id: fromAccount.id,
            fund_id: fund?.id ?? null,
            grant_id: grant?.id ?? null
          } as Prisma.InputJsonValue
        }
      })
    ]);

    const period = await this.ensureReportingPeriod(transferAt, actorId);
    const fromChart = await this.ensureFinanceAccountChartAccount(fromAccount.id, actorId);
    const toChart = await this.ensureFinanceAccountChartAccount(toAccount.id, actorId);
    await this.createJournalEntry({
      entryDate: transferAt,
      periodId: period.id,
      sourceType: 'finance_transfer',
      sourceId,
      memo: description,
      currency,
      postedBy: actorId,
      lines: [
        {
          chartAccountId: toChart.id,
          fundId: fund?.id,
          grantId: grant?.id,
          debit: amount,
          credit: 0,
          description: `Transfer to ${toAccount.name}`
        },
        {
          chartAccountId: fromChart.id,
          fundId: fund?.id,
          grantId: grant?.id,
          debit: 0,
          credit: amount,
          description: `Transfer from ${fromAccount.name}`
        }
      ]
    });

    return {
      success: true,
      source_id: sourceId,
      from_account_id: fromAccount.id,
      to_account_id: toAccount.id,
      fund_id: fund?.id ?? null,
      grant_id: grant?.id ?? null,
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

  async listChartAccounts(query: Record<string, any>) {
    await this.ensureDefaultChartAccounts();
    const where: Prisma.FinanceChartAccountWhereInput = {};
    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');
    if (query.type) where.type = String(query.type).toLowerCase();
    if (query.category) where.category = String(query.category).toLowerCase();
    if (query.is_active !== undefined) where.isActive = String(query.is_active) !== 'false';
    if (query.q) {
      const term = String(query.q);
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } }
      ];
    }

    const rows = await this.prisma.financeChartAccount.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, code: true } },
        financeAccount: { select: { id: true, name: true, code: true, accountType: true } }
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }]
    });

    return rows.map((row) => this.serializeChartAccount(row));
  }

  async getChartAccount(id: string) {
    await this.ensureDefaultChartAccounts();
    const row = await this.prisma.financeChartAccount.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        financeAccount: { select: { id: true, name: true, code: true, accountType: true } }
      }
    });
    if (!row) throw new NotFoundException('Chart account not found');
    return this.serializeChartAccount(row);
  }

  async createChartAccount(dto: UpsertFinanceChartAccountDto, actorId?: string) {
    const row = await this.prisma.financeChartAccount.create({
      data: {
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        financeAccountId: dto.finance_account_id ?? null,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        type: dto.type.trim().toLowerCase(),
        category: dto.category.trim().toLowerCase(),
        normalBalance: dto.normal_balance.trim().toLowerCase(),
        isControlAccount: dto.is_control_account ?? false,
        isActive: dto.is_active ?? true,
        metadata: (dto.metadata ?? null) as Prisma.InputJsonValue,
        createdBy: actorId ? toBigInt(actorId) : null
      },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        financeAccount: { select: { id: true, name: true, code: true, accountType: true } }
      }
    });
    return this.serializeChartAccount(row);
  }

  async updateChartAccount(id: string, dto: UpsertFinanceChartAccountDto) {
    const existing = await this.prisma.financeChartAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Chart account not found');
    const row = await this.prisma.financeChartAccount.update({
      where: { id },
      data: {
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        financeAccountId: dto.finance_account_id ?? null,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        type: dto.type.trim().toLowerCase(),
        category: dto.category.trim().toLowerCase(),
        normalBalance: dto.normal_balance.trim().toLowerCase(),
        isControlAccount: dto.is_control_account ?? existing.isControlAccount,
        isActive: dto.is_active ?? existing.isActive,
        metadata: (dto.metadata ?? existing.metadata ?? null) as Prisma.InputJsonValue
      },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        financeAccount: { select: { id: true, name: true, code: true, accountType: true } }
      }
    });
    return this.serializeChartAccount(row);
  }

  async listReportingPeriods(query: Record<string, any>) {
    const where: Prisma.FinanceReportingPeriodWhereInput = {};
    if (query.year) where.year = Number(query.year);
    if (query.quarter) where.quarter = Number(query.quarter);
    if (query.status) where.status = String(query.status).toLowerCase();
    const rows = await this.prisma.financeReportingPeriod.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    return rows.map((row) => this.serializeReportingPeriod(row));
  }

  async createReportingPeriod(dto: UpsertFinanceReportingPeriodDto, actorId?: string) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid reporting period dates');
    }
    const month = Number(dto.month);
    const year = Number(dto.year);
    const quarter = Math.ceil(month / 3);
    const existing = await this.prisma.financeReportingPeriod.findFirst({ where: { year, month } });
    const row = existing
      ? await this.prisma.financeReportingPeriod.update({
          where: { id: existing.id },
          data: {
            label: dto.label?.trim() || this.buildPeriodLabel(year, month),
            startDate,
            endDate,
            quarter,
            status: dto.status?.trim().toLowerCase() || 'open',
            notes: dto.notes?.trim() || null
          }
        })
      : await this.prisma.financeReportingPeriod.create({
          data: {
            year,
            month,
            quarter,
            label: dto.label?.trim() || this.buildPeriodLabel(year, month),
            startDate,
            endDate,
            status: dto.status?.trim().toLowerCase() || 'open',
            notes: dto.notes?.trim() || null,
            createdBy: actorId ? toBigInt(actorId) : null
          }
        });
    return this.serializeReportingPeriod(row);
  }

  async updateReportingPeriod(id: string, dto: UpsertFinanceReportingPeriodDto) {
    const existing = await this.prisma.financeReportingPeriod.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reporting period not found');
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    const month = Number(dto.month);
    const year = Number(dto.year);
    const row = await this.prisma.financeReportingPeriod.update({
      where: { id },
      data: {
        year,
        month,
        quarter: Math.ceil(month / 3),
        label: dto.label?.trim() || this.buildPeriodLabel(year, month),
        startDate,
        endDate,
        status: dto.status?.trim().toLowerCase() || existing.status,
        notes: dto.notes?.trim() || null
      }
    });
    return this.serializeReportingPeriod(row);
  }

  async closeReportingPeriod(id: string) {
    const row = await this.prisma.financeReportingPeriod.update({
      where: { id },
      data: { status: 'closed' }
    });
    return this.serializeReportingPeriod(row);
  }

  async reopenReportingPeriod(id: string) {
    const row = await this.prisma.financeReportingPeriod.update({
      where: { id },
      data: { status: 'open' }
    });
    return this.serializeReportingPeriod(row);
  }

  async listCustomers(query: Record<string, any>) {
    const where: Prisma.FinanceCustomerWhereInput = {};
    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');
    if (query.is_active !== undefined) where.isActive = String(query.is_active) !== 'false';
    if (query.q) {
      const term = String(query.q);
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } }
      ];
    }
    const rows = await this.prisma.financeCustomer.findMany({
      where,
      include: { organization: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' }
    });
    return rows.map((row) => this.serializeCustomer(row));
  }

  async createCustomer(dto: UpsertFinanceCustomerDto, actorId?: string) {
    const row = await this.prisma.financeCustomer.create({
      data: {
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        taxNumber: dto.tax_number?.trim() || null,
        isActive: dto.is_active ?? true,
        metadata: (dto.metadata ?? null) as Prisma.InputJsonValue,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { organization: { select: { id: true, name: true, code: true } } }
    });
    return this.serializeCustomer(row);
  }

  async updateCustomer(id: string, dto: UpsertFinanceCustomerDto, actorId?: string) {
    const existing = await this.prisma.financeCustomer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');
    const row = await this.prisma.financeCustomer.update({
      where: { id },
      data: {
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        taxNumber: dto.tax_number?.trim() || null,
        isActive: dto.is_active ?? existing.isActive,
        metadata: (dto.metadata ?? existing.metadata ?? null) as Prisma.InputJsonValue,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { organization: { select: { id: true, name: true, code: true } } }
    });
    return this.serializeCustomer(row);
  }

  async listVendors(query: Record<string, any>) {
    const where: Prisma.FinanceVendorWhereInput = {};
    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');
    if (query.is_active !== undefined) where.isActive = String(query.is_active) !== 'false';
    if (query.q) {
      const term = String(query.q);
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } }
      ];
    }
    const rows = await this.prisma.financeVendor.findMany({
      where,
      include: { organization: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' }
    });
    return rows.map((row) => this.serializeVendor(row));
  }

  async createVendor(dto: UpsertFinanceVendorDto, actorId?: string) {
    const row = await this.prisma.financeVendor.create({
      data: {
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        taxNumber: dto.tax_number?.trim() || null,
        isActive: dto.is_active ?? true,
        metadata: (dto.metadata ?? null) as Prisma.InputJsonValue,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { organization: { select: { id: true, name: true, code: true } } }
    });
    return this.serializeVendor(row);
  }

  async updateVendor(id: string, dto: UpsertFinanceVendorDto, actorId?: string) {
    const existing = await this.prisma.financeVendor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Vendor not found');
    const row = await this.prisma.financeVendor.update({
      where: { id },
      data: {
        organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        taxNumber: dto.tax_number?.trim() || null,
        isActive: dto.is_active ?? existing.isActive,
        metadata: (dto.metadata ?? existing.metadata ?? null) as Prisma.InputJsonValue,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { organization: { select: { id: true, name: true, code: true } } }
    });
    return this.serializeVendor(row);
  }

  async listDonors(query: Record<string, any>) {
    const rows = await this.prisma.financeDonor.findMany({
      where: {
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.is_active !== undefined ? { isActive: String(query.is_active) !== 'false' } : {})
      },
      orderBy: [{ name: 'asc' }]
    });
    return rows.map((row) => this.serializeDonor(row));
  }

  async createDonor(dto: any, actorId?: string) {
    const row = await this.prisma.financeDonor.create({
      data: {
        organizationId: null,
        name: dto.name.trim(),
        donorType: dto.donor_type?.trim() || 'grantor',
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        isActive: dto.is_active ?? true,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      }
    });
    return this.serializeDonor(row);
  }

  async updateDonor(id: string, dto: any, actorId?: string) {
    const existing = await this.prisma.financeDonor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Donor not found');
    const row = await this.prisma.financeDonor.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        donorType: dto.donor_type?.trim() || existing.donorType,
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        isActive: dto.is_active ?? existing.isActive,
        updatedBy: actorId ? toBigInt(actorId) : null
      }
    });
    return this.serializeDonor(row);
  }

  async listFunds(query: Record<string, any>) {
    const rows = await this.prisma.financeFund.findMany({
      where: {
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.project_id ? { projectId: this.parseId(String(query.project_id), 'project_id') } : {}),
        ...(query.restriction_type ? { restrictionType: String(query.restriction_type) } : {}),
        ...(query.is_active !== undefined ? { isActive: String(query.is_active) !== 'false' } : {})
      },
      include: { donor: true, grants: { select: { id: true, code: true, name: true, status: true } } },
      orderBy: [{ code: 'asc' }]
    });
    return rows.map((row) => this.serializeFund(row));
  }

  async createFund(dto: any, actorId?: string) {
    const donor = dto.donor_id ? await this.prisma.financeDonor.findUnique({ where: { id: dto.donor_id } }) : null;
    const projectId = dto.project_id ? await this.ensureProjectExists(String(dto.project_id), 'project_id') : null;
    if (dto.donor_id && !donor) throw new BadRequestException('Invalid donor_id');
    const row = await this.prisma.financeFund.create({
      data: {
        organizationId: null,
        projectId,
        donorId: donor?.id ?? null,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        fundType: dto.fund_type?.trim() || 'operating',
        restrictionType: dto.restriction_type?.trim() || 'unrestricted',
        purpose: dto.purpose?.trim() || null,
        isActive: dto.is_active ?? true,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { donor: true, grants: { select: { id: true, code: true, name: true, status: true } } }
    });
    return this.serializeFund(row);
  }

  async updateFund(id: string, dto: any, actorId?: string) {
    const existing = await this.prisma.financeFund.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fund not found');
    const donor = dto.donor_id ? await this.prisma.financeDonor.findUnique({ where: { id: dto.donor_id } }) : null;
    const projectId = dto.project_id ? await this.ensureProjectExists(String(dto.project_id), 'project_id') : null;
    if (dto.donor_id && !donor) throw new BadRequestException('Invalid donor_id');
    const row = await this.prisma.financeFund.update({
      where: { id },
      data: {
        projectId: dto.project_id !== undefined ? projectId : existing.projectId,
        donorId: dto.donor_id !== undefined ? donor?.id ?? null : existing.donorId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        fundType: dto.fund_type?.trim() || existing.fundType,
        restrictionType: dto.restriction_type?.trim() || existing.restrictionType,
        purpose: dto.purpose?.trim() || null,
        isActive: dto.is_active ?? existing.isActive,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { donor: true, grants: { select: { id: true, code: true, name: true, status: true } } }
    });
    return this.serializeFund(row);
  }

  async listGrants(query: Record<string, any>) {
    const rows = await this.prisma.financeGrant.findMany({
      where: {
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.project_id ? { projectId: this.parseId(String(query.project_id), 'project_id') } : {}),
        ...(query.status ? { status: String(query.status) } : {})
      },
      include: { donor: true, fund: true },
      orderBy: [{ code: 'asc' }]
    });
    return rows.map((row) => this.serializeGrant(row));
  }

  async createGrant(dto: any, actorId?: string) {
    const donor = dto.donor_id ? await this.prisma.financeDonor.findUnique({ where: { id: dto.donor_id } }) : null;
    const fund = dto.fund_id ? await this.prisma.financeFund.findUnique({ where: { id: dto.fund_id } }) : null;
    const projectId = dto.project_id ? await this.ensureProjectExists(String(dto.project_id), 'project_id') : null;
    if (dto.donor_id && !donor) throw new BadRequestException('Invalid donor_id');
    if (dto.fund_id && !fund) throw new BadRequestException('Invalid fund_id');
    const row = await this.prisma.financeGrant.create({
      data: {
        organizationId: null,
        projectId,
        donorId: donor?.id ?? null,
        fundId: fund?.id ?? null,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        restrictionType: dto.restriction_type?.trim() || 'restricted',
        startDate: dto.start_date ? new Date(dto.start_date) : null,
        endDate: dto.end_date ? new Date(dto.end_date) : null,
        committedAmount: Number(dto.committed_amount ?? 0),
        recognizedAmount: Number(dto.recognized_amount ?? 0),
        deferredAmount: Number(dto.deferred_amount ?? dto.committed_amount ?? 0),
        status: dto.status?.trim() || 'active',
        purpose: dto.purpose?.trim() || null,
        notes: dto.notes?.trim() || null,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { donor: true, fund: true }
    });
    return this.serializeGrant(row);
  }

  async updateGrant(id: string, dto: any, actorId?: string) {
    const existing = await this.prisma.financeGrant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Grant not found');
    const donor = dto.donor_id ? await this.prisma.financeDonor.findUnique({ where: { id: dto.donor_id } }) : null;
    const fund = dto.fund_id ? await this.prisma.financeFund.findUnique({ where: { id: dto.fund_id } }) : null;
    const projectId = dto.project_id ? await this.ensureProjectExists(String(dto.project_id), 'project_id') : null;
    if (dto.donor_id && !donor) throw new BadRequestException('Invalid donor_id');
    if (dto.fund_id && !fund) throw new BadRequestException('Invalid fund_id');
    const row = await this.prisma.financeGrant.update({
      where: { id },
      data: {
        projectId: dto.project_id !== undefined ? projectId : existing.projectId,
        donorId: dto.donor_id !== undefined ? donor?.id ?? null : existing.donorId,
        fundId: dto.fund_id !== undefined ? fund?.id ?? null : existing.fundId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        restrictionType: dto.restriction_type?.trim() || existing.restrictionType,
        startDate: dto.start_date ? new Date(dto.start_date) : existing.startDate,
        endDate: dto.end_date ? new Date(dto.end_date) : existing.endDate,
        committedAmount: dto.committed_amount !== undefined ? Number(dto.committed_amount) : Number(existing.committedAmount),
        recognizedAmount: dto.recognized_amount !== undefined ? Number(dto.recognized_amount) : Number(existing.recognizedAmount),
        deferredAmount: dto.deferred_amount !== undefined ? Number(dto.deferred_amount) : Number(existing.deferredAmount),
        status: dto.status?.trim() || existing.status,
        purpose: dto.purpose?.trim() || null,
        notes: dto.notes?.trim() || null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { donor: true, fund: true }
    });
    return this.serializeGrant(row);
  }

  async listBudgets(query: Record<string, any>) {
    const rows = await this.prisma.financeBudget.findMany({
      where: {
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.team_id ? { teamId: this.parseId(String(query.team_id), 'team_id') } : {}),
        ...(query.project_id ? { projectId: this.parseId(String(query.project_id), 'project_id') } : {}),
        ...(query.fund_id ? { fundId: String(query.fund_id) } : {}),
        ...(query.grant_id ? { grantId: String(query.grant_id) } : {}),
        ...(query.scope_type ? { scopeType: String(query.scope_type) } : {}),
        ...(query.period_type ? { periodType: String(query.period_type) } : {}),
        ...(query.fiscal_year ? { fiscalYear: Number(query.fiscal_year) } : {}),
        ...(query.quarter ? { quarter: Number(query.quarter) } : {}),
        ...(query.month ? { month: Number(query.month) } : {}),
        ...(query.status ? { status: String(query.status) } : {}),
        ...(query.budget_type ? { budgetType: String(query.budget_type) } : {})
      },
      include: {
        fund: true,
        grant: true,
        assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }]
    });
    return rows.map((row) => this.serializeBudget(row));
  }

  async getBudget(id: string) {
    const row = await this.prisma.financeBudget.findUnique({
      where: { id },
      include: {
        fund: true,
        grant: true,
        assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }
      }
    });
    if (!row) throw new NotFoundException('Budget not found');
    return this.serializeBudget(row);
  }

  async exportBudget(id: string, format = 'csv') {
    const normalizedFormat = String(format || 'csv').trim().toLowerCase();
    if (!['csv'].includes(normalizedFormat)) {
      throw new BadRequestException('Unsupported export format');
    }

    const budget = await this.getBudget(id);
    const rows = this.buildBudgetExportRows(budget);
    if (!rows.length) {
      throw new BadRequestException('Budget export has no rows');
    }
    const csv = this.toCsv(rows);
    return {
      file_name: `${String(budget.name || 'budget').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'budget'}.${normalizedFormat}`,
      mime_type: 'text/csv; charset=utf-8',
      content_base64: Buffer.from(`\uFEFF${csv}`, 'utf8').toString('base64'),
    };
  }

  async createBudget(dto: any, actorId?: string) {
    return this.upsertBudget(null, dto, actorId);
  }

  async updateBudget(id: string, dto: any, actorId?: string) {
    return this.upsertBudget(id, dto, actorId);
  }

  async approveBudget(id: string, actorId?: string) {
    const row = await this.prisma.financeBudget.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: actorId ? toBigInt(actorId) : null,
        approvedAt: new Date(),
        updatedBy: actorId ? toBigInt(actorId) : null,
      },
      include: {
        fund: true,
        grant: true,
        assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    return this.serializeBudget(row);
  }

  async reopenBudget(id: string, actorId?: string) {
    const row = await this.prisma.financeBudget.update({
      where: { id },
      data: {
        status: 'draft',
        approvedBy: null,
        approvedAt: null,
        updatedBy: actorId ? toBigInt(actorId) : null,
      },
      include: {
        fund: true,
        grant: true,
        assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    return this.serializeBudget(row);
  }

  async recalculateBudget(id: string) {
    const budget = await this.prisma.financeBudget.findUnique({
      where: { id },
      include: {
        fund: true,
        grant: true,
        assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    const { expenseTotal, incomeTotal } = await this.computeBudgetActuals(budget);
    const lineUpdates = budget.lines.map((line) => {
      const planned = Number(line.totalAmount ?? line.amount ?? 0);
      const actual = line.section === 'income' ? incomeTotal : expenseTotal;
      const variance = actual - planned;
      return this.prisma.financeBudgetLine.update({
        where: { id: line.id },
        data: {
          totalAmount: planned,
          actualTotalAmount: actual,
          varianceAmount: variance,
        },
      });
    });
    await this.prisma.$transaction([
      ...lineUpdates,
      this.prisma.financeBudget.update({
        where: { id: budget.id },
        data: { totalBudget: budget.lines.reduce((sum, line) => sum + Number(line.totalAmount ?? line.amount ?? 0), 0) },
      }),
    ]);
    return this.getBudget(id);
  }

  private async upsertBudget(id: string | null, dto: any, actorId?: string) {
    const scopeType = String(dto.scope_type || dto.budget_type || 'project').trim();
    const budgetType = String(dto.budget_type || scopeType || 'project').trim();
    const periodType = String(dto.period_type || 'annual').trim();
    const fiscalYear = dto.fiscal_year !== undefined && dto.fiscal_year !== null ? Number(dto.fiscal_year) : null;
    const quarter = dto.quarter !== undefined && dto.quarter !== null && dto.quarter !== '' ? Number(dto.quarter) : null;
    const month = dto.month !== undefined && dto.month !== null && dto.month !== '' ? Number(dto.month) : null;
    const { startDate, endDate } = this.resolveBudgetDates(dto.start_date, dto.end_date, periodType, fiscalYear, quarter, month);
    const fund = dto.fund_id ? await this.prisma.financeFund.findUnique({ where: { id: dto.fund_id } }) : null;
    const grant = dto.grant_id ? await this.prisma.financeGrant.findUnique({ where: { id: dto.grant_id } }) : null;
    const projectId = dto.project_id ? await this.ensureProjectExists(String(dto.project_id), 'project_id') : null;
    if (dto.fund_id && !fund) throw new BadRequestException('Invalid fund_id');
    if (dto.grant_id && !grant) throw new BadRequestException('Invalid grant_id');
    this.validateScope(scopeType, dto);
    await this.validateBudgetDimensionCompatibility({ projectId, fund, grant });
    const lines = Array.isArray(dto.lines) ? dto.lines : [];
    const assumptions = Array.isArray(dto.assumptions) ? dto.assumptions : [];
    const portfolio = Array.isArray(dto.portfolio) ? dto.portfolio : [];
    if (portfolio.length) {
      await Promise.all(portfolio.map((entry: any) => this.ensureProjectExists(String(entry.project_id), 'portfolio project_id')));
    }
    if (!lines.length) throw new BadRequestException('At least one budget line is required');
    const totalBudget = lines.reduce((sum: number, line: any) => sum + this.resolveLineTotal(line), 0);
    if (totalBudget <= 0) throw new BadRequestException('Budget total must be greater than zero');
    if (!['organization', 'team', 'project', 'fund', 'grant'].includes(budgetType)) {
      throw new BadRequestException('budget_type must be organization, team, project, fund, or grant');
    }
    if (budgetType === 'project' && !dto.project_id) {
      throw new BadRequestException('project_id is required for project budgets');
    }
    if (budgetType === 'fund' && !dto.fund_id) {
      throw new BadRequestException('fund_id is required for fund budgets');
    }
    if (budgetType === 'grant' && !dto.grant_id) {
      throw new BadRequestException('grant_id is required for grant budgets');
    }

    if (id) {
      const existing = await this.prisma.financeBudget.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Budget not found');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const budget = id
        ? await tx.financeBudget.update({
            where: { id },
            data: {
              organizationId: dto.organization_id ? this.parseId(String(dto.organization_id), 'organization_id') : null,
              teamId: dto.team_id ? this.parseId(String(dto.team_id), 'team_id') : null,
              projectId,
              fundId: fund?.id ?? null,
              grantId: grant?.id ?? null,
              parentBudgetId: dto.parent_budget_id || null,
              name: String(dto.name || '').trim(),
              scopeType,
              budgetType,
              periodType,
              fiscalYear,
              quarter,
              month,
              currency: String(dto.currency || 'NGN').toUpperCase(),
              exchangeRate: dto.exchange_rate !== undefined && dto.exchange_rate !== null ? Number(dto.exchange_rate) : null,
              startDate,
              endDate,
              status: String(dto.status || 'draft').trim(),
              totalBudget,
              notes: dto.notes?.trim() || null,
              updatedBy: actorId ? toBigInt(actorId) : null,
            }
          })
        : await tx.financeBudget.create({
            data: {
              organizationId: dto.organization_id ? this.parseId(String(dto.organization_id), 'organization_id') : null,
              teamId: dto.team_id ? this.parseId(String(dto.team_id), 'team_id') : null,
              projectId,
              fundId: fund?.id ?? null,
              grantId: grant?.id ?? null,
              parentBudgetId: dto.parent_budget_id || null,
              name: String(dto.name || '').trim(),
              scopeType,
              budgetType,
              periodType,
              fiscalYear,
              quarter,
              month,
              currency: String(dto.currency || 'NGN').toUpperCase(),
              exchangeRate: dto.exchange_rate !== undefined && dto.exchange_rate !== null ? Number(dto.exchange_rate) : null,
              startDate,
              endDate,
              status: String(dto.status || 'draft').trim(),
              totalBudget,
              notes: dto.notes?.trim() || null,
              createdBy: actorId ? toBigInt(actorId) : null,
              updatedBy: actorId ? toBigInt(actorId) : null,
            }
          });

      await tx.financeBudgetLine.deleteMany({ where: { budgetId: budget.id } });
      await tx.financeBudgetAssumption.deleteMany({ where: { budgetId: budget.id } });
      await tx.financeBudgetPortfolio.deleteMany({ where: { budgetId: budget.id } });
      if (lines.length) {
        await tx.financeBudgetLine.createMany({
          data: lines.map((line: any, index: number) => ({
            budgetId: budget.id,
            chartAccountId: line.chart_account_id || null,
            projectId: line.project_id ? this.parseId(String(line.project_id), 'line project_id') : null,
            fundId: line.fund_id || null,
            grantId: line.grant_id || null,
            section: String(line.section || 'expenditure').trim(),
            groupName: line.group_name ? String(line.group_name).trim() : null,
            lineLabel: String(line.line_name || line.line_label || '').trim(),
            amount: this.resolveLineTotal(line),
            period1Amount: line.period_1_amount !== undefined && line.period_1_amount !== null ? Number(line.period_1_amount) : null,
            period2Amount: line.period_2_amount !== undefined && line.period_2_amount !== null ? Number(line.period_2_amount) : null,
            period3Amount: line.period_3_amount !== undefined && line.period_3_amount !== null ? Number(line.period_3_amount) : null,
            period4Amount: line.period_4_amount !== undefined && line.period_4_amount !== null ? Number(line.period_4_amount) : null,
            totalAmount: this.resolveLineTotal(line),
            notes: line.notes ? String(line.notes).trim() : null,
            sortOrder: Number(line.sort_order ?? index),
          }))
        });
      }
      if (assumptions.length) {
        await tx.financeBudgetAssumption.createMany({
          data: assumptions.map((entry: any, index: number) => ({
            budgetId: budget.id,
            section: entry.section ? String(entry.section).trim() : null,
            label: String(entry.label || '').trim(),
            value: String(entry.value || '').trim(),
            notes: entry.notes ? String(entry.notes).trim() : null,
            sortOrder: Number(entry.sort_order ?? index),
          })),
        });
      }
      if (portfolio.length) {
        await tx.financeBudgetPortfolio.createMany({
          data: portfolio.map((entry: any, index: number) => ({
            budgetId: budget.id,
            projectId: this.parseId(String(entry.project_id), 'portfolio project_id'),
            fundId: entry.fund_id || null,
            grantId: entry.grant_id || null,
            funderName: entry.funder_name ? String(entry.funder_name).trim() : null,
            status: entry.status ? String(entry.status).trim() : null,
            period1Amount: entry.period_1_amount !== undefined && entry.period_1_amount !== null ? Number(entry.period_1_amount) : null,
            period2Amount: entry.period_2_amount !== undefined && entry.period_2_amount !== null ? Number(entry.period_2_amount) : null,
            period3Amount: entry.period_3_amount !== undefined && entry.period_3_amount !== null ? Number(entry.period_3_amount) : null,
            period4Amount: entry.period_4_amount !== undefined && entry.period_4_amount !== null ? Number(entry.period_4_amount) : null,
            periodTotal: this.resolvePortfolioTotal(entry),
            totalBudget: entry.total_budget !== undefined && entry.total_budget !== null ? Number(entry.total_budget) : this.resolvePortfolioTotal(entry),
            notes: entry.notes ? String(entry.notes).trim() : null,
            sortOrder: Number(entry.sort_order ?? index),
          })),
        });
      }
      return tx.financeBudget.findUnique({
        where: { id: budget.id },
        include: {
          fund: true,
          grant: true,
          assumptions: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
          portfolio: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
          lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }
        }
      });
    });

    if (!row) throw new NotFoundException('Budget not found');
    return this.serializeBudget(row);
  }

  async listSalesInvoices(query: Record<string, any>) {
    const where: Prisma.FinanceSalesInvoiceWhereInput = {};
    if (query.customer_id) where.customerId = String(query.customer_id);
    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');
    if (query.team_id) where.teamId = this.parseId(String(query.team_id), 'team_id');
    if (query.from || query.to) {
      where.invoiceDate = {
        ...(query.from ? { gte: new Date(String(query.from)) } : {}),
        ...(query.to ? { lte: new Date(String(query.to)) } : {})
      };
    }
    const rows = await this.prisma.financeSalesInvoice.findMany({
      where,
      include: {
        customer: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true,
        lines: { include: { chartAccount: true } },
        receipts: true,
        allocations: {
          include: {
            receipt: {
              include: {
                account: { select: { id: true, name: true, code: true, accountType: true } }
              }
            }
          }
        }
      },
      orderBy: [{ invoiceDate: 'desc' }, { createdAt: 'desc' }]
    });
    const items = rows.map((row) => this.serializeSalesInvoice(row));
    if (query.status) {
      const wanted = String(query.status).toLowerCase();
      return items.filter((row) => String(row.status).toLowerCase() === wanted);
    }
    return items;
  }

  async getSalesInvoice(id: string) {
    const row = await this.prisma.financeSalesInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true,
        lines: { include: { chartAccount: true } },
        receipts: true,
        allocations: {
          include: {
            receipt: {
              include: {
                account: { select: { id: true, name: true, code: true, accountType: true } }
              }
            }
          }
        }
      }
    });
    if (!row) throw new NotFoundException('Sales invoice not found');
    return this.serializeSalesInvoice(row);
  }

  async createSalesInvoice(dto: CreateFinanceSalesInvoiceDto, actorId?: string) {
    await this.ensureDefaultChartAccounts();
    if (!dto.lines?.length) throw new BadRequestException('At least one invoice line is required');
    const invoiceDate = new Date(dto.invoice_date);
    if (Number.isNaN(invoiceDate.getTime())) throw new BadRequestException('Invalid invoice_date');
    const dueDate = dto.due_date ? new Date(dto.due_date) : null;
    const customer = await this.prisma.financeCustomer.findUnique({ where: { id: dto.customer_id } });
    if (!customer) throw new BadRequestException('Invalid customer_id');
    const lineInputs = await Promise.all(
      dto.lines.map(async (line) => {
        const chartAccount = await this.prisma.financeChartAccount.findUnique({ where: { id: line.chart_account_id } });
        if (!chartAccount || chartAccount.type !== 'income') {
          throw new BadRequestException('Invoice lines must use income chart accounts');
        }
        const quantity = Number(line.quantity ?? 1);
        const unitPrice = Number(line.unit_price ?? 0);
        const lineTotal = quantity * unitPrice;
        return {
          chartAccountId: chartAccount.id,
          description: line.description.trim(),
          quantity,
          unitPrice,
          lineTotal,
          chartAccount
        };
      })
    );
    const subtotal = lineInputs.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = Number(dto.tax_amount ?? 0);
    const totalAmount = subtotal + taxAmount;
    const currency = (dto.currency ?? 'NGN').toUpperCase();
    const invoiceNumber = dto.invoice_number?.trim() || (await this.nextDocumentSequenceValue('INV', invoiceDate, 'sales_invoice'));
    const period = await this.ensureReportingPeriod(invoiceDate, actorId);
    const arAccount = await this.getRequiredChartAccount('1100');
    const { fund, grant } = await this.validateFundGrant(dto.fund_id, dto.grant_id);
    const desiredStatus = (dto.status ?? 'draft').toLowerCase();

    const created = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.financeSalesInvoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
          teamId: dto.team_id ? this.parseId(dto.team_id, 'team_id') : null,
          fundId: fund?.id ?? null,
          grantId: grant?.id ?? null,
          invoiceDate,
          dueDate,
          status: desiredStatus === 'sent' ? 'sent' : 'draft',
          sentAt: desiredStatus === 'sent' ? new Date() : null,
          currency,
          subtotal,
          taxAmount,
          totalAmount,
          notes: dto.notes?.trim() || null,
          createdBy: actorId ? toBigInt(actorId) : null,
          updatedBy: actorId ? toBigInt(actorId) : null,
          lines: {
            create: lineInputs.map((line) => ({
              chartAccountId: line.chartAccountId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal
            }))
          }
        },
        include: {
          customer: true,
          organization: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true, type: true } },
          fund: true,
          grant: true,
          lines: { include: { chartAccount: true } },
          receipts: true,
          allocations: {
            include: {
              receipt: {
                include: {
                  account: { select: { id: true, name: true, code: true, accountType: true } }
                }
              }
            }
          }
        }
      });

      if (desiredStatus === 'sent') {
        const revenueByAccount = new Map<string, number>();
        for (const line of lineInputs) {
          revenueByAccount.set(line.chartAccountId, (revenueByAccount.get(line.chartAccountId) ?? 0) + line.lineTotal);
        }
        await this.createJournalEntryTx(tx, {
          entryDate: invoiceDate,
          periodId: period.id,
          sourceType: 'finance_sales_invoice',
          sourceId: invoice.id,
          memo: `Sales invoice ${invoice.invoiceNumber}`,
          currency,
          postedBy: actorId,
          lines: [
            {
              chartAccountId: arAccount.id,
              organizationId: invoice.organizationId,
              teamId: invoice.teamId,
              fundId: invoice.fundId,
              grantId: invoice.grantId,
              debit: totalAmount,
              credit: 0,
              description: `Receivable for ${invoice.invoiceNumber}`
            },
            ...Array.from(revenueByAccount.entries()).map(([chartAccountId, amount]) => ({
              chartAccountId,
              organizationId: invoice.organizationId,
              teamId: invoice.teamId,
              fundId: invoice.fundId,
              grantId: invoice.grantId,
              debit: 0,
              credit: amount,
              description: `Revenue for ${invoice.invoiceNumber}`
            }))
          ]
        });
      }
      return invoice;
    });

    return this.serializeSalesInvoice(created);
  }

  async listBills(query: Record<string, any>) {
    const where: Prisma.FinanceBillHeaderWhereInput = {};
    if (query.vendor_id) where.vendorId = String(query.vendor_id);
    if (query.organization_id) where.organizationId = this.parseId(String(query.organization_id), 'organization_id');
    if (query.team_id) where.teamId = this.parseId(String(query.team_id), 'team_id');
    if (query.status) where.status = String(query.status).toLowerCase();
    if (query.from || query.to) {
      where.billDate = {
        ...(query.from ? { gte: new Date(String(query.from)) } : {}),
        ...(query.to ? { lte: new Date(String(query.to)) } : {})
      };
    }
    const rows = await this.prisma.financeBillHeader.findMany({
      where,
      include: {
        vendor: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true,
        lines: { include: { chartAccount: true } },
        payments: true
      },
      orderBy: [{ billDate: 'desc' }, { createdAt: 'desc' }]
    });
    return rows.map((row) => this.serializeBill(row));
  }

  async getBill(id: string) {
    const row = await this.prisma.financeBillHeader.findUnique({
      where: { id },
      include: {
        vendor: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true,
        lines: { include: { chartAccount: true } },
        payments: true
      }
    });
    if (!row) throw new NotFoundException('Bill not found');
    return this.serializeBill(row);
  }

  async createBill(dto: CreateFinanceBillDto, actorId?: string) {
    await this.ensureDefaultChartAccounts();
    if (!dto.lines?.length) throw new BadRequestException('At least one bill line is required');
    const billDate = new Date(dto.bill_date);
    if (Number.isNaN(billDate.getTime())) throw new BadRequestException('Invalid bill_date');
    const dueDate = dto.due_date ? new Date(dto.due_date) : null;
    const vendor = await this.prisma.financeVendor.findUnique({ where: { id: dto.vendor_id } });
    if (!vendor) throw new BadRequestException('Invalid vendor_id');
    const lineInputs = await Promise.all(
      dto.lines.map(async (line) => {
        const chartAccount = await this.prisma.financeChartAccount.findUnique({ where: { id: line.chart_account_id } });
        if (!chartAccount || !['expense', 'asset'].includes(chartAccount.type)) {
          throw new BadRequestException('Bill lines must use expense or asset chart accounts');
        }
        const quantity = Number(line.quantity ?? 1);
        const unitPrice = Number(line.unit_price ?? 0);
        const lineTotal = quantity * unitPrice;
        return {
          chartAccountId: chartAccount.id,
          description: line.description.trim(),
          quantity,
          unitPrice,
          lineTotal,
          chartAccount
        };
      })
    );
    const subtotal = lineInputs.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = Number(dto.tax_amount ?? 0);
    const totalAmount = subtotal + taxAmount;
    const currency = (dto.currency ?? 'NGN').toUpperCase();
    const billNumber = dto.bill_number?.trim() || (await this.nextDocumentSequenceValue('BILL', billDate, 'bill'));
    const period = await this.ensureReportingPeriod(billDate, actorId);
    const apAccount = await this.getRequiredChartAccount('2100');
    const { fund, grant } = await this.validateFundGrant(dto.fund_id, dto.grant_id);

    const created = await this.prisma.$transaction(async (tx) => {
      const bill = await tx.financeBillHeader.create({
        data: {
          billNumber,
          vendorId: vendor.id,
          organizationId: dto.organization_id ? this.parseId(dto.organization_id, 'organization_id') : null,
          teamId: dto.team_id ? this.parseId(dto.team_id, 'team_id') : null,
          fundId: fund?.id ?? null,
          grantId: grant?.id ?? null,
          billDate,
          dueDate,
          status: 'posted',
          currency,
          subtotal,
          taxAmount,
          totalAmount,
          notes: dto.notes?.trim() || null,
          createdBy: actorId ? toBigInt(actorId) : null,
          updatedBy: actorId ? toBigInt(actorId) : null,
          lines: {
            create: lineInputs.map((line) => ({
              chartAccountId: line.chartAccountId,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal
            }))
          }
        },
        include: {
          vendor: true,
          organization: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true, type: true } },
          fund: true,
          grant: true,
          lines: { include: { chartAccount: true } },
          payments: true
        }
      });

      await this.createJournalEntryTx(tx, {
        entryDate: billDate,
        periodId: period.id,
        sourceType: 'finance_bill',
        sourceId: bill.id,
        memo: `Vendor bill ${bill.billNumber}`,
        currency,
        postedBy: actorId,
        lines: [
          ...lineInputs.map((line) => ({
            chartAccountId: line.chartAccountId,
            organizationId: bill.organizationId,
            teamId: bill.teamId,
            fundId: bill.fundId,
            grantId: bill.grantId,
            debit: line.lineTotal,
            credit: 0,
            description: `Expense for ${bill.billNumber}`
          })),
          {
            chartAccountId: apAccount.id,
            organizationId: bill.organizationId,
            teamId: bill.teamId,
            fundId: bill.fundId,
            grantId: bill.grantId,
            debit: 0,
            credit: totalAmount,
            description: `Payable for ${bill.billNumber}`
          }
        ]
      });
      return bill;
    });

    return this.serializeBill(created);
  }

  async createReceipt(dto: CreateFinanceReceiptDto, actorId?: string) {
    await this.ensureDefaultChartAccounts();
    const account = await this.prisma.financeAccount.findUnique({ where: { id: dto.account_id } });
    if (!account || !account.isActive) throw new BadRequestException('Invalid account_id');
    const requestedAllocationIds = Array.from(
      new Set([
        ...(dto.allocations ?? []).map((allocation) => allocation.sales_invoice_id),
        dto.sales_invoice_id ?? null
      ].filter((id): id is string => Boolean(id)))
    );
    if (requestedAllocationIds.length === 0) {
      throw new BadRequestException('At least one invoice allocation is required');
    }
    const salesInvoices = await this.prisma.financeSalesInvoice.findMany({
      where: { id: { in: requestedAllocationIds } },
      include: { allocations: true, fund: true, grant: true }
    });
    if (salesInvoices.length !== requestedAllocationIds.length) {
      throw new BadRequestException('Invalid sales_invoice_id');
    }
    const invoiceMap = new Map(salesInvoices.map((invoice) => [invoice.id, invoice]));
    const allocationsInput = dto.allocations?.length
      ? dto.allocations.map((allocation) => ({
          salesInvoiceId: allocation.sales_invoice_id,
          amount: Number(allocation.amount ?? 0)
        }))
      : dto.sales_invoice_id
        ? [{ salesInvoiceId: dto.sales_invoice_id, amount: Number(dto.amount ?? 0) }]
        : [];
    const amount = Number(dto.amount ?? 0);
    if (amount <= 0) throw new BadRequestException('Receipt amount must be greater than zero');
    const receivedAt = dto.received_at ? new Date(dto.received_at) : new Date();
    const firstInvoice = invoiceMap.get(allocationsInput[0]?.salesInvoiceId || '') ?? null;
    const currency = (dto.currency ?? firstInvoice?.currency ?? account.currency ?? 'NGN').toUpperCase();
    const allocationsTotal = allocationsInput.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    if (Math.abs(allocationsTotal - amount) > 0.001) {
      throw new BadRequestException('Receipt amount must equal the total allocated amount');
    }
    const customerId = dto.customer_id ?? firstInvoice?.customerId ?? null;
    for (const allocation of allocationsInput) {
      if (allocation.amount <= 0) throw new BadRequestException('Allocated amounts must be greater than zero');
      const invoice = invoiceMap.get(allocation.salesInvoiceId);
      if (!invoice) throw new BadRequestException('Invalid sales_invoice_id');
      const allocated = invoice.allocations.reduce((sum, row) => sum + Number(row.amount), 0);
      const outstanding = Number(invoice.totalAmount) - allocated;
      if (allocation.amount - outstanding > 0.001) {
        throw new BadRequestException(`Receipt allocation cannot exceed invoice outstanding balance for ${invoice.invoiceNumber}`);
      }
      if (!['sent', 'part_paid', 'overdue', 'posted'].includes(String(invoice.status).toLowerCase())) {
        throw new BadRequestException(`Invoice ${invoice.invoiceNumber} is not ready for receipt posting`);
      }
    }
    const period = await this.ensureReportingPeriod(receivedAt, actorId);
    const receiptNumber = dto.receipt_number?.trim() || (await this.nextDocumentSequenceValue('RCPT', receivedAt, 'receipt'));
    const arAccount = await this.getRequiredChartAccount('1100');
    const bankAccount = await this.ensureFinanceAccountChartAccount(account.id, actorId);

    const receipt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.financeReceipt.create({
        data: {
          receiptNumber,
          customerId,
          salesInvoiceId: firstInvoice?.id ?? null,
          accountId: account.id,
          amount,
          currency,
          receivedAt,
          reference: dto.reference?.trim() || null,
          notes: dto.notes?.trim() || null,
          createdBy: actorId ? toBigInt(actorId) : null
        }
      });

      if (allocationsInput.length > 0) {
        await tx.financeReceiptAllocation.createMany({
          data: allocationsInput.map((allocation) => ({
            receiptId: created.id,
            salesInvoiceId: allocation.salesInvoiceId,
            amount: allocation.amount
          }))
        });
      }

      await this.createJournalEntryTx(tx, {
        entryDate: receivedAt,
        periodId: period.id,
        sourceType: 'finance_receipt',
        sourceId: created.id,
        memo: `Receipt ${receiptNumber}`,
        currency,
        postedBy: actorId,
        lines: [
          {
            chartAccountId: bankAccount.id,
            fundId: firstInvoice?.fundId ?? null,
            grantId: firstInvoice?.grantId ?? null,
            debit: amount,
            credit: 0,
            description: `Receipt into ${account.name}`
          },
          {
            chartAccountId: arAccount.id,
            fundId: firstInvoice?.fundId ?? null,
            grantId: firstInvoice?.grantId ?? null,
            debit: 0,
            credit: amount,
            description: firstInvoice ? `AR settlement for ${firstInvoice.invoiceNumber}` : 'Receivable settlement'
          }
        ]
      });

      await tx.financeLedgerEntry.create({
        data: {
          accountId: account.id,
          direction: 'in',
          amount,
          currency,
          entryDate: receivedAt,
          description: `Customer receipt ${receiptNumber}`,
          sourceType: 'finance_receipt',
          sourceId: created.id,
          createdBy: actorId ? toBigInt(actorId) : null,
          metadata: {
            customer_id: customerId,
            sales_invoice_id: firstInvoice?.id ?? null,
            allocation_invoice_ids: allocationsInput.map((row) => row.salesInvoiceId),
            reference: dto.reference ?? null
          } as Prisma.InputJsonValue
        }
      });

      for (const allocation of allocationsInput) {
        await this.refreshInvoiceStatusTx(tx, allocation.salesInvoiceId);
      }

      return created;
    });

    return receipt;
  }

  async createVendorPayment(dto: CreateFinanceVendorPaymentDto, actorId?: string) {
    await this.ensureDefaultChartAccounts();
    const account = await this.prisma.financeAccount.findUnique({ where: { id: dto.account_id } });
    if (!account || !account.isActive) throw new BadRequestException('Invalid account_id');
    const bill = dto.bill_id
      ? await this.prisma.financeBillHeader.findUnique({ where: { id: dto.bill_id }, include: { payments: true, fund: true, grant: true } })
      : null;
    if (dto.bill_id && !bill) throw new BadRequestException('Invalid bill_id');
    const vendorId = dto.vendor_id ?? bill?.vendorId ?? null;
    const amount = Number(dto.amount ?? 0);
    if (amount <= 0) throw new BadRequestException('Payment amount must be greater than zero');
    const paidAt = dto.paid_at ? new Date(dto.paid_at) : new Date();
    const currency = (dto.currency ?? bill?.currency ?? account.currency ?? 'NGN').toUpperCase();
    if (bill) {
      const paid = bill.payments.reduce((sum, row) => sum + Number(row.amount), 0);
      const outstanding = Number(bill.totalAmount) - paid;
      if (amount > outstanding) throw new BadRequestException('Payment amount cannot exceed bill outstanding balance');
    }
    const period = await this.ensureReportingPeriod(paidAt, actorId);
    const paymentNumber = dto.payment_number?.trim() || (await this.nextDocumentSequenceValue('PAY', paidAt, 'vendor_payment'));
    const apAccount = await this.getRequiredChartAccount('2100');
    const bankAccount = await this.ensureFinanceAccountChartAccount(account.id, actorId);

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.financeVendorPayment.create({
        data: {
          paymentNumber,
          vendorId,
          billId: bill?.id ?? null,
          accountId: account.id,
          amount,
          currency,
          paidAt,
          reference: dto.reference?.trim() || null,
          notes: dto.notes?.trim() || null,
          createdBy: actorId ? toBigInt(actorId) : null
        }
      });

      await this.createJournalEntryTx(tx, {
        entryDate: paidAt,
        periodId: period.id,
        sourceType: 'finance_vendor_payment',
        sourceId: created.id,
        memo: `Vendor payment ${paymentNumber}`,
        currency,
        postedBy: actorId,
        lines: [
          {
            chartAccountId: apAccount.id,
            fundId: bill?.fundId ?? null,
            grantId: bill?.grantId ?? null,
            debit: amount,
            credit: 0,
            description: bill ? `AP settlement for ${bill.billNumber}` : 'Payable settlement'
          },
          {
            chartAccountId: bankAccount.id,
            fundId: bill?.fundId ?? null,
            grantId: bill?.grantId ?? null,
            debit: 0,
            credit: amount,
            description: `Payment from ${account.name}`
          }
        ]
      });

      await tx.financeLedgerEntry.create({
        data: {
          accountId: account.id,
          direction: 'out',
          amount,
          currency,
          entryDate: paidAt,
          description: `Vendor payment ${paymentNumber}`,
          sourceType: 'finance_vendor_payment',
          sourceId: created.id,
          createdBy: actorId ? toBigInt(actorId) : null,
          metadata: {
            vendor_id: vendorId,
            bill_id: bill?.id ?? null,
            reference: dto.reference ?? null
          } as Prisma.InputJsonValue
        }
      });

      return created;
    });

    return payment;
  }

  async sendSalesInvoice(id: string, actorId?: string) {
    const existing = await this.prisma.financeSalesInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true,
        lines: { include: { chartAccount: true } },
        receipts: true,
        allocations: { include: { receipt: { include: { account: true } } } }
      }
    });
    if (!existing) throw new NotFoundException('Sales invoice not found');
    if (String(existing.status).toLowerCase() === 'void') {
      throw new BadRequestException('Voided invoice cannot be sent');
    }
    const journalExists = await this.prisma.financeJournalEntry.findFirst({
      where: { sourceType: 'finance_sales_invoice', sourceId: existing.id },
      select: { id: true }
    });
    const dueDate = existing.dueDate ?? existing.invoiceDate;
    const paidAmount = existing.allocations.length
      ? existing.allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)
      : existing.receipts.reduce((sum, row) => sum + Number(row.amount), 0);
    const effectiveStatus = this.resolveInvoiceStatus(existing.status, Number(existing.totalAmount), paidAmount, dueDate, existing.voidedAt);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (!journalExists) {
        const period = await this.ensureReportingPeriod(existing.invoiceDate, actorId);
        const arAccount = await this.getRequiredChartAccount('1100');
        const revenueByAccount = new Map<string, number>();
        for (const line of existing.lines) {
          revenueByAccount.set(line.chartAccountId, (revenueByAccount.get(line.chartAccountId) ?? 0) + Number(line.lineTotal));
        }
        await this.createJournalEntryTx(tx, {
          entryDate: existing.invoiceDate,
          periodId: period.id,
          sourceType: 'finance_sales_invoice',
          sourceId: existing.id,
          memo: `Sales invoice ${existing.invoiceNumber}`,
          currency: existing.currency,
          postedBy: actorId,
          lines: [
            {
              chartAccountId: arAccount.id,
              organizationId: existing.organizationId,
              teamId: existing.teamId,
              fundId: existing.fundId,
              grantId: existing.grantId,
              debit: Number(existing.totalAmount),
              credit: 0,
              description: `Receivable for ${existing.invoiceNumber}`
            },
            ...Array.from(revenueByAccount.entries()).map(([chartAccountId, amount]) => ({
              chartAccountId,
              organizationId: existing.organizationId,
              teamId: existing.teamId,
              fundId: existing.fundId,
              grantId: existing.grantId,
              debit: 0,
              credit: amount,
              description: `Revenue for ${existing.invoiceNumber}`
            }))
          ]
        });
      }
      return tx.financeSalesInvoice.update({
        where: { id: existing.id },
        data: {
          status: effectiveStatus === 'paid' ? 'paid' : effectiveStatus === 'part_paid' ? 'part_paid' : 'sent',
          sentAt: existing.sentAt ?? new Date(),
          updatedBy: actorId ? toBigInt(actorId) : existing.updatedBy
        },
        include: {
          customer: true,
          organization: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true, type: true } },
          fund: true,
          grant: true,
          lines: { include: { chartAccount: true } },
          receipts: true,
          allocations: { include: { receipt: { include: { account: true } } } }
        }
      });
    });

    await this.sendInvoiceMail(existing.id, existing.invoiceNumber, actorId, 'Invoice', `Please find attached invoice ${existing.invoiceNumber}.`);

    return this.serializeSalesInvoice(updated);
  }

  async remindSalesInvoice(id: string, actorId?: string) {
    const existing = await this.prisma.financeSalesInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        allocations: true,
        receipts: true
      }
    });
    if (!existing) throw new NotFoundException('Sales invoice not found');
    const status = this.resolveInvoiceStatus(
      existing.status,
      Number(existing.totalAmount),
      existing.allocations.length
        ? existing.allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)
        : existing.receipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0),
      existing.dueDate ?? existing.invoiceDate,
      existing.voidedAt
    );
    if (status === 'draft') {
      throw new BadRequestException('Draft invoice cannot be reminded. Send it first.');
    }
    if (status === 'void') {
      throw new BadRequestException('Voided invoice cannot be reminded.');
    }

    await this.sendInvoiceMail(
      existing.id,
      existing.invoiceNumber,
      actorId,
      `Reminder: Invoice ${existing.invoiceNumber}`,
      `This is a reminder for invoice ${existing.invoiceNumber}.`
    );

    return { success: true, id: existing.id, invoice_number: existing.invoiceNumber };
  }

  async voidSalesInvoice(id: string, actorId?: string) {
    const existing = await this.prisma.financeSalesInvoice.findUnique({
      where: { id },
      include: {
        lines: true,
        receipts: true,
        allocations: true
      }
    });
    if (!existing) throw new NotFoundException('Sales invoice not found');
    const paidAmount = existing.allocations.length
      ? existing.allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)
      : existing.receipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    if (paidAmount > 0) {
      throw new BadRequestException('Paid or part-paid invoice cannot be voided');
    }
    const journal = await this.prisma.financeJournalEntry.findFirst({
      where: { sourceType: 'finance_sales_invoice', sourceId: existing.id },
      include: { lines: true }
    });
    const updated = await this.prisma.$transaction(async (tx) => {
      if (journal) {
        const period = await this.ensureReportingPeriod(new Date(), actorId);
        await this.createJournalEntryTx(tx, {
          entryDate: new Date(),
          periodId: period.id,
          sourceType: 'finance_sales_invoice_void',
          sourceId: existing.id,
          memo: `Void invoice ${existing.invoiceNumber}`,
          currency: existing.currency,
          postedBy: actorId,
          lines: journal.lines.map((line) => ({
            chartAccountId: line.chartAccountId,
            organizationId: line.organizationId,
            teamId: line.teamId,
            fundId: line.fundId,
            grantId: line.grantId,
            debit: Number(line.credit),
            credit: Number(line.debit),
            description: `Reversal of ${existing.invoiceNumber}`
          }))
        });
      }
      return tx.financeSalesInvoice.update({
        where: { id: existing.id },
        data: {
          status: 'void',
          voidedAt: new Date(),
          updatedBy: actorId ? toBigInt(actorId) : existing.updatedBy
        },
        include: {
          customer: true,
          organization: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true, type: true } },
          fund: true,
          grant: true,
          lines: { include: { chartAccount: true } },
          receipts: true,
          allocations: { include: { receipt: { include: { account: true } } } }
        }
      });
    });
    return this.serializeSalesInvoice(updated);
  }

  async customerStatement(customerId: string, query: Record<string, any>) {
    const customer = await this.prisma.financeCustomer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const from = query.from ? new Date(String(query.from)) : null;
    const to = query.to ? new Date(String(query.to)) : null;
    const invoices = await this.prisma.financeSalesInvoice.findMany({
      where: {
        customerId,
        ...(from || to
          ? {
              invoiceDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            }
          : {})
      },
      include: {
        allocations: {
          include: {
            receipt: {
              include: {
                account: { select: { id: true, name: true, code: true } }
              }
            }
          }
        }
      },
      orderBy: [{ invoiceDate: 'asc' }, { createdAt: 'asc' }]
    });

    const rows: Array<{ date: Date; type: string; document_number: string; description: string; debit: number; credit: number }> = [];
    for (const invoice of invoices) {
      rows.push({
        date: invoice.invoiceDate,
        type: 'invoice',
        document_number: invoice.invoiceNumber,
        description: invoice.notes || 'Sales invoice',
        debit: Number(invoice.totalAmount),
        credit: 0
      });
      for (const allocation of invoice.allocations) {
        rows.push({
          date: allocation.receipt.receivedAt,
          type: 'receipt',
          document_number: allocation.receipt.receiptNumber,
          description: allocation.receipt.reference || allocation.receipt.notes || 'Receipt allocation',
          debit: 0,
          credit: Number(allocation.amount)
        });
      }
    }
    rows.sort((a, b) => a.date.getTime() - b.date.getTime() || a.document_number.localeCompare(b.document_number));
    let running = 0;
    const items = rows.map((row) => {
      running += row.debit - row.credit;
      return {
        ...row,
        date: row.date,
        balance: running
      };
    });
    return {
      customer: { id: customer.id, name: customer.name, email: customer.email },
      from,
      to,
      opening_balance: 0,
      closing_balance: running,
      items
    };
  }

  async listReportNotes(query: Record<string, any>) {
    const where: Prisma.FinanceReportNoteWhereInput = {};
    if (query.period_id) where.periodId = String(query.period_id);
    if (query.report_key) where.reportKey = String(query.report_key);
    const rows = await this.prisma.financeReportNote.findMany({
      where,
      include: { period: true },
      orderBy: [{ reportKey: 'asc' }, { severity: 'desc' }, { createdAt: 'asc' }]
    });
    return rows.map((row) => this.serializeReportNote(row));
  }

  async budgetVsActual(query: Record<string, any>) {
    if (!query.budget_id) throw new BadRequestException('budget_id is required');
    const budget = await this.prisma.financeBudget.findUnique({
      where: { id: String(query.budget_id) },
      include: {
        fund: true,
        grant: true,
        assumptions: true,
        portfolio: true,
        lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }
      }
    });
    if (!budget) throw new NotFoundException('Budget not found');

    const { expenseTotal, incomeTotal } = await this.computeBudgetActuals(budget);
    const totalBudget = Number(budget.totalBudget || 0);
    const actualAmount = budget.budgetType === 'project' ? expenseTotal : expenseTotal;
    const lines = budget.lines.map((line) => ({
      id: line.id,
      section: line.section,
      group_name: line.groupName,
      line_label: line.lineLabel,
      planned_amount: Number(line.totalAmount ?? line.amount ?? 0),
      revised_amount: line.revisedTotalAmount != null ? Number(line.revisedTotalAmount) : null,
      actual_amount: line.actualTotalAmount != null ? Number(line.actualTotalAmount) : null,
      variance_amount: line.varianceAmount != null ? Number(line.varianceAmount) : null,
      sort_order: line.sortOrder,
    }));
    const sectionBudgetTotals = lines.reduce(
      (acc, line) => {
        const key = line.section === 'income' ? 'income' : 'expenditure';
        acc[key] += line.planned_amount;
        return acc;
      },
      { income: 0, expenditure: 0 }
    );
    const sections = {
      income: {
        planned: sectionBudgetTotals.income,
        actual: incomeTotal,
        variance: sectionBudgetTotals.income - incomeTotal,
      },
      expenditure: {
        planned: sectionBudgetTotals.expenditure,
        actual: expenseTotal,
        variance: sectionBudgetTotals.expenditure - expenseTotal,
      },
    };
    return {
      budget: this.serializeBudget(budget),
      lines,
      sections,
      actuals: {
        total_budget: totalBudget,
        total_actual: actualAmount,
        total_income: incomeTotal,
        total_expense: expenseTotal,
        variance: totalBudget - actualAmount,
        utilization_pct: totalBudget > 0 ? (actualAmount / totalBudget) * 100 : 0,
      }
    };
  }

  async grantUtilization(query: Record<string, any>) {
    const rows = await this.prisma.financeGrant.findMany({
      where: {
        ...(query.grant_id ? { id: String(query.grant_id) } : {}),
        ...(query.fund_id ? { fundId: String(query.fund_id) } : {}),
        ...(query.status ? { status: String(query.status) } : {})
      },
      include: { donor: true, fund: true },
      orderBy: [{ code: 'asc' }]
    });

    const items = await Promise.all(
      rows.map(async (grant) => {
        const [incomeRows, voucherRows] = await Promise.all([
          this.prisma.financeIncomeEntry.findMany({
            where: {
              grantId: grant.id,
              ...(query.from || query.to
                ? {
                    receivedAt: {
                      ...(query.from ? { gte: new Date(String(query.from)) } : {}),
                      ...(query.to ? { lte: new Date(String(query.to)) } : {})
                    }
                  }
                : {})
            }
          }),
          this.prisma.financePaymentVoucher.findMany({
            where: {
              grantId: grant.id,
              ...(query.from || query.to
                ? {
                    disbursedAt: {
                      ...(query.from ? { gte: new Date(String(query.from)) } : {}),
                      ...(query.to ? { lte: new Date(String(query.to)) } : {})
                    }
                  }
                : {})
            }
          })
        ]);
        const cashReceived = incomeRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
        const expenseUtilized = voucherRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
        return {
          grant: this.serializeGrant(grant),
          cash_received: cashReceived,
          expense_utilized: expenseUtilized,
          committed_amount: Number(grant.committedAmount || 0),
          recognized_amount: Number(grant.recognizedAmount || 0),
          deferred_amount: Number(grant.deferredAmount || 0),
          remaining_budget: Number(grant.committedAmount || 0) - expenseUtilized,
          cash_balance: cashReceived - expenseUtilized,
        };
      })
    );

    return {
      summary: {
        committed_amount: items.reduce((sum, row) => sum + row.committed_amount, 0),
        cash_received: items.reduce((sum, row) => sum + row.cash_received, 0),
        expense_utilized: items.reduce((sum, row) => sum + row.expense_utilized, 0),
        remaining_budget: items.reduce((sum, row) => sum + row.remaining_budget, 0),
      },
      items
    };
  }

  async upsertReportNote(dto: UpsertFinanceReportNoteDto, actorId?: string) {
    const row = await this.prisma.financeReportNote.create({
      data: {
        periodId: dto.period_id,
        reportKey: dto.report_key.trim(),
        kind: dto.kind?.trim().toLowerCase() || 'manual',
        severity: dto.severity?.trim().toLowerCase() || 'info',
        title: dto.title.trim(),
        body: dto.body.trim(),
        sourceRule: dto.source_rule?.trim() || null,
        isOverridden: dto.is_overridden ?? false,
        createdBy: actorId ? toBigInt(actorId) : null,
        updatedBy: actorId ? toBigInt(actorId) : null
      },
      include: { period: true }
    });
    return this.serializeReportNote(row);
  }

  async executiveSummary(query: Record<string, any>) {
    const context = await this.buildReportContext(query);
    const income = this.summarizeIncomeLines(context.lines);
    const expenses = this.summarizeExpenseLines(context.lines);
    const fundActivity = this.summarizeFundActivity(context.lines);
    const balances = await this.balances(query, context);
    const receivables = await this.receivables(query, context);
    const payables = await this.payables(query, context);
    const notes = await this.buildReportNotes('executive-summary', context, {
      totalIncome: income.total,
      totalExpense: expenses.total,
      netProfit: income.total - expenses.total,
      bankBalance: balances.bank_and_reserve_balances.total_bank,
      receivablesTotal: receivables.summary.total_outstanding,
      payablesTotal: payables.summary.total_outstanding,
      advanceBalance: balances.balance_sheet.advances,
      deferredGrantIncome: balances.balance_sheet.deferred_grant_income,
      unrestrictedNetAssets: balances.balance_sheet.unrestricted_net_assets,
      restrictedNetAssets: balances.balance_sheet.restricted_net_assets
    });
    return {
      period: context.period,
      executive_summary: {
        total_support_and_revenue: income.total,
        total_expense: expenses.total,
        surplus_deficit: income.total - expenses.total,
        total_income: income.total,
        net_profit_loss: income.total - expenses.total,
        grant_income: Number(income.category_totals.grant_income ?? 0),
        donation_income: Number(income.category_totals.donation_income ?? 0),
        service_income: Number(income.category_totals.service_income ?? 0),
        bank_balance: balances.bank_and_reserve_balances.total_bank,
        reserve_balance: balances.bank_and_reserve_balances.total_reserve,
        receivables: receivables.summary.total_outstanding,
        payables: payables.summary.total_outstanding,
        advances: balances.balance_sheet.advances,
        unrestricted_net_assets: balances.balance_sheet.unrestricted_net_assets,
        restricted_net_assets: balances.balance_sheet.restricted_net_assets,
        deferred_grant_income: balances.balance_sheet.deferred_grant_income
      },
      fund_activity: fundActivity,
      notes,
      comparison: context.comparisonPeriod
    };
  }

  async incomeSummary(query: Record<string, any>, contextInput?: Awaited<ReturnType<FinanceService['buildReportContext']>>) {
    const context = contextInput ?? (await this.buildReportContext(query));
    const summary = this.summarizeIncomeLines(context.lines);
    const notes = await this.buildReportNotes('income-summary', context, { totalIncome: summary.total });
    return {
      period: context.period,
      total_income: summary.total,
      breakdown: summary.breakdown,
      category_totals: summary.category_totals,
      restriction_totals: summary.restriction_totals,
      notes
    };
  }

  async expenseSummary(query: Record<string, any>, contextInput?: Awaited<ReturnType<FinanceService['buildReportContext']>>) {
    const context = contextInput ?? (await this.buildReportContext(query));
    const summary = this.summarizeExpenseLines(context.lines);
    const notes = await this.buildReportNotes('expense-summary', context, { totalExpense: summary.total, breakdown: summary.breakdown });
    return {
      period: context.period,
      total_expense: summary.total,
      breakdown: summary.breakdown,
      category_totals: summary.category_totals,
      restriction_totals: summary.restriction_totals,
      notes
    };
  }

  async profitLoss(query: Record<string, any>, contextInput?: Awaited<ReturnType<FinanceService['buildReportContext']>>) {
    const context = contextInput ?? (await this.buildReportContext(query));
    const income = this.summarizeIncomeLines(context.lines);
    const expenses = this.summarizeExpenseLines(context.lines);
    const fundActivity = this.summarizeFundActivity(context.lines);
    const notes = await this.buildReportNotes('profit-loss', context, { totalIncome: income.total, totalExpense: expenses.total, netProfit: income.total - expenses.total });
    return {
      period: context.period,
      statement_of_activities: {
        total_support_and_revenue: income.total,
        total_expense: expenses.total,
        surplus_deficit: income.total - expenses.total,
        support_and_revenue_by_category: income.category_totals,
        expenses_by_category: expenses.category_totals,
        support_and_revenue_by_restriction: income.restriction_totals,
        expenses_by_restriction: expenses.restriction_totals
      },
      income_total: income.total,
      expense_total: expenses.total,
      net_profit_loss: income.total - expenses.total,
      income_breakdown: income.breakdown,
      expense_breakdown: expenses.breakdown,
      fund_activity: fundActivity,
      notes
    };
  }

  async balances(query: Record<string, any>, contextInput?: Awaited<ReturnType<FinanceService['buildReportContext']>>) {
    const context = contextInput ?? (await this.buildReportContext(query));
    const lineBalances = this.computeChartBalances(context.lines);
    const bankReserveAccounts = await this.prisma.financeChartAccount.findMany({
      where: { category: { in: ['bank', 'cash', 'wallet', 'reserve'] } },
      include: { financeAccount: { select: { id: true, name: true, code: true, accountType: true } } },
      orderBy: { code: 'asc' }
    });
    const bankBalances = bankReserveAccounts.map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
      category: account.category,
      linked_finance_account: account.financeAccount
        ? {
            id: account.financeAccount.id,
            name: account.financeAccount.name,
            code: account.financeAccount.code,
            account_type: account.financeAccount.accountType
          }
        : null,
      balance: Number(lineBalances.get(account.id) ?? 0)
    }));
    const totalBank = bankBalances.filter((row) => row.category !== 'reserve').reduce((sum, row) => sum + row.balance, 0);
    const totalReserve = bankBalances.filter((row) => row.category === 'reserve').reduce((sum, row) => sum + row.balance, 0);
    const ar = await this.getControlBalance('1100', lineBalances);
    const ap = await this.getControlBalance('2100', lineBalances);
    const advances = await this.getControlBalance('1200', lineBalances);
    const fixedAssets = await this.getFixedAssetBalance(lineBalances);
    const unrestrictedNetAssets = await this.getControlBalance('3000', lineBalances);
    const restrictedNetAssets = await this.getControlBalance('3010', lineBalances);
    const deferredGrantIncome = await this.getControlBalance('2200', lineBalances);
    const notes = await this.buildReportNotes('balances', context, {
      bankBalance: totalBank,
      reserveBalance: totalReserve,
      receivablesTotal: ar,
      payablesTotal: ap,
      advanceBalance: advances,
      deferredGrantIncome,
      unrestrictedNetAssets,
      restrictedNetAssets
    });
    return {
      period: context.period,
      bank_and_reserve_balances: {
        total_bank: totalBank,
        total_reserve: totalReserve,
        accounts: bankBalances
      },
      balance_sheet: {
        accounts_receivable: ar,
        accounts_payable: ap,
        advances,
        fixed_assets: fixedAssets,
        retained_earnings: unrestrictedNetAssets,
        unrestricted_net_assets: unrestrictedNetAssets,
        restricted_net_assets: restrictedNetAssets,
        deferred_grant_income: deferredGrantIncome
      },
      notes
    };
  }

  async receivables(query: Record<string, any>, contextInput?: Awaited<ReturnType<FinanceService['buildReportContext']>>) {
    const context = contextInput ?? (await this.buildReportContext(query));
    const rows = await this.prisma.financeSalesInvoice.findMany({
      where: {
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.team_id ? { teamId: this.parseId(String(query.team_id), 'team_id') } : {})
      },
      include: {
        customer: true,
        receipts: true,
        allocations: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true
      },
      orderBy: [{ dueDate: 'asc' }, { invoiceDate: 'desc' }]
    });
    const today = context.period?.end_date ? new Date(context.period.end_date) : new Date();
    const items = rows.map((row) => this.serializeSalesInvoiceReceivable(row, today)).filter((row) => row.outstanding_amount > 0);
    const summary = this.computeAgingSummary(items);
    const notes = await this.buildReportNotes('receivables', context, { receivablesTotal: summary.total_outstanding, overdueCount: summary.overdue_count });
    return { period: context.period, summary, items, notes };
  }

  async payables(query: Record<string, any>, contextInput?: Awaited<ReturnType<FinanceService['buildReportContext']>>) {
    const context = contextInput ?? (await this.buildReportContext(query));
    const rows = await this.prisma.financeBillHeader.findMany({
      where: {
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.team_id ? { teamId: this.parseId(String(query.team_id), 'team_id') } : {})
      },
      include: {
        vendor: true,
        payments: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true
      },
      orderBy: [{ dueDate: 'asc' }, { billDate: 'desc' }]
    });
    const today = context.period?.end_date ? new Date(context.period.end_date) : new Date();
    const items = rows.map((row) => this.serializeBillPayable(row, today)).filter((row) => row.outstanding_amount > 0);
    const summary = this.computeAgingSummary(items);
    const notes = await this.buildReportNotes('payables', context, { payablesTotal: summary.total_outstanding, overdueCount: summary.overdue_count });
    return { period: context.period, summary, items, notes };
  }

  async backfillAccounting(actorId?: string) {
    await this.ensureDefaultChartAccounts(actorId);
    const created: string[] = [];

    const accounts = await this.prisma.financeAccount.findMany();
    for (const account of accounts) {
      const chart = await this.ensureFinanceAccountChartAccount(account.id, actorId);
      if (Number(account.openingBalance) !== 0) {
        const exists = await this.prisma.financeJournalEntry.findFirst({
          where: { sourceType: 'finance_account_opening', sourceId: account.id }
        });
        if (!exists) {
          const period = await this.ensureReportingPeriod(account.createdAt, actorId);
          const openingEquity = await this.getRequiredChartAccount('3100');
          const amount = Number(account.openingBalance);
          await this.createJournalEntry({
            entryDate: account.createdAt,
            periodId: period.id,
            sourceType: 'finance_account_opening',
            sourceId: account.id,
            memo: `Opening balance for ${account.name}`,
            currency: account.currency,
            postedBy: actorId,
            lines: amount >= 0
              ? [
                  { chartAccountId: chart.id, debit: amount, credit: 0, description: `Opening balance ${account.name}` },
                  { chartAccountId: openingEquity.id, debit: 0, credit: amount, description: 'Opening balance equity' }
                ]
              : [
                  { chartAccountId: openingEquity.id, debit: Math.abs(amount), credit: 0, description: 'Opening balance equity' },
                  { chartAccountId: chart.id, debit: 0, credit: Math.abs(amount), description: `Opening balance ${account.name}` }
                ]
          });
          created.push(`opening:${account.id}`);
        }
      }
    }

    const incomeEntries = await this.prisma.financeIncomeEntry.findMany();
    for (const row of incomeEntries) {
      const exists = await this.prisma.financeJournalEntry.findFirst({ where: { sourceType: 'finance_income', sourceId: row.id } });
      if (!exists) {
        await this.postIncomeJournal(row, actorId);
        created.push(`income:${row.id}`);
      }
    }

    const vouchers = await this.prisma.financePaymentVoucher.findMany({ include: { request: true } });
    for (const row of vouchers) {
      const exists = await this.prisma.financeJournalEntry.findFirst({ where: { sourceType: 'finance_payment_voucher', sourceId: row.id } });
      if (!exists && row.paidFromAccountId) {
        await this.postPaymentVoucherJournal(row, row.request.organizationId, row.request.teamId, actorId);
        created.push(`pv:${row.id}`);
      }
    }

    const transferGroups = await this.prisma.financeLedgerEntry.findMany({
      where: { sourceType: 'finance_transfer' },
      orderBy: { entryDate: 'asc' }
    });
    const groupedTransfers = new Map<string, typeof transferGroups>();
    for (const row of transferGroups) {
      if (!row.sourceId) continue;
      groupedTransfers.set(row.sourceId, [...(groupedTransfers.get(row.sourceId) ?? []), row]);
    }
    for (const [sourceId, rows] of groupedTransfers.entries()) {
      const exists = await this.prisma.financeJournalEntry.findFirst({ where: { sourceType: 'finance_transfer', sourceId } });
      if (exists) continue;
      const fromRow = rows.find((row) => row.direction === 'out');
      const toRow = rows.find((row) => row.direction === 'in');
      if (!fromRow || !toRow) continue;
      const fromChart = await this.ensureFinanceAccountChartAccount(fromRow.accountId, actorId);
      const toChart = await this.ensureFinanceAccountChartAccount(toRow.accountId, actorId);
      const period = await this.ensureReportingPeriod(fromRow.entryDate, actorId);
      await this.createJournalEntry({
        entryDate: fromRow.entryDate,
        periodId: period.id,
        sourceType: 'finance_transfer',
        sourceId,
        memo: fromRow.description || `Transfer ${sourceId}`,
        currency: fromRow.currency,
        postedBy: actorId,
        lines: [
          { chartAccountId: toChart.id, debit: Number(toRow.amount), credit: 0, description: `Transfer in ${sourceId}` },
          { chartAccountId: fromChart.id, debit: 0, credit: Number(fromRow.amount), description: `Transfer out ${sourceId}` }
        ]
      });
      created.push(`transfer:${sourceId}`);
    }

    return { success: true, created_count: created.length, entries: created };
  }


  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private resolveBudgetDates(
    startDateValue: string | undefined,
    endDateValue: string | undefined,
    periodType: string,
    fiscalYear: number | null,
    quarter: number | null,
    month: number | null
  ) {
    if (startDateValue && endDateValue) {
      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);
      if (Number.isNaN(startDate.getTime())) throw new BadRequestException('Invalid start_date');
      if (Number.isNaN(endDate.getTime())) throw new BadRequestException('Invalid end_date');
      if (endDate < startDate) throw new BadRequestException('end_date cannot be before start_date');
      return { startDate, endDate };
    }

    if (!fiscalYear) {
      throw new BadRequestException('fiscal_year is required when start_date/end_date are omitted');
    }

    if (periodType === 'annual') {
      return { startDate: new Date(Date.UTC(fiscalYear, 0, 1)), endDate: new Date(Date.UTC(fiscalYear, 11, 31)) };
    }

    if (periodType === 'quarterly') {
      if (!quarter || quarter < 1 || quarter > 4) throw new BadRequestException('quarter is required for quarterly budgets');
      const startMonth = (quarter - 1) * 3;
      return {
        startDate: new Date(Date.UTC(fiscalYear, startMonth, 1)),
        endDate: new Date(Date.UTC(fiscalYear, startMonth + 3, 0)),
      };
    }

    if (periodType === 'monthly') {
      if (!month || month < 1 || month > 12) throw new BadRequestException('month is required for monthly budgets');
      return {
        startDate: new Date(Date.UTC(fiscalYear, month - 1, 1)),
        endDate: new Date(Date.UTC(fiscalYear, month, 0)),
      };
    }

    throw new BadRequestException('period_type must be annual, quarterly, or monthly');
  }

  private validateScope(scopeType: string, dto: Record<string, any>) {
    if (!['organization', 'team', 'project'].includes(scopeType)) {
      throw new BadRequestException('scope_type must be organization, team, or project');
    }
    if (scopeType === 'organization' && !dto.organization_id) {
      throw new BadRequestException('organization_id is required for organization budgets');
    }
    if (scopeType === 'team' && (!dto.organization_id || !dto.team_id)) {
      throw new BadRequestException('organization_id and team_id are required for team budgets');
    }
    if (scopeType === 'project' && !dto.project_id) {
      throw new BadRequestException('project_id is required for project budgets');
    }
  }

  private resolveLineTotal(line: Record<string, any>) {
    if (line.total_amount !== undefined && line.total_amount !== null && line.total_amount !== '') {
      return Number(line.total_amount || 0);
    }
    const periodValues = ['period_1_amount', 'period_2_amount', 'period_3_amount', 'period_4_amount']
      .map((key) => Number(line[key] ?? 0))
      .filter((value) => Number.isFinite(value));
    if (periodValues.some((value) => value !== 0)) {
      return periodValues.reduce((sum, value) => sum + value, 0);
    }
    return Number(line.amount || 0);
  }

  private resolvePortfolioTotal(entry: Record<string, any>) {
    if (entry.period_total !== undefined && entry.period_total !== null && entry.period_total !== '') {
      return Number(entry.period_total || 0);
    }
    return ['period_1_amount', 'period_2_amount', 'period_3_amount', 'period_4_amount']
      .map((key) => Number(entry[key] ?? 0))
      .reduce((sum, value) => sum + value, 0);
  }

  private async ensureProjectExists(value: string, label: string) {
    const projectId = this.parseId(value, label);
    const project = await this.prisma.group.findUnique({ where: { id: projectId } });
    if (!project || project.type !== 'project') {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return projectId;
  }

  private async validateBudgetDimensionCompatibility({
    projectId,
    fund,
    grant,
  }: {
    projectId: bigint | null;
    fund: Prisma.FinanceFundGetPayload<{}> | null;
    grant: Prisma.FinanceGrantGetPayload<{}> | null;
  }) {
    if (fund && grant && grant.fundId && grant.fundId !== fund.id) {
      throw new BadRequestException('grant_id does not belong to fund_id');
    }
    if (projectId && fund?.projectId && fund.projectId !== projectId) {
      throw new BadRequestException('fund_id does not belong to project_id');
    }
    if (projectId && grant?.projectId && grant.projectId !== projectId) {
      throw new BadRequestException('grant_id does not belong to project_id');
    }
    if (fund?.projectId && grant?.projectId && fund.projectId !== grant.projectId) {
      throw new BadRequestException('fund_id and grant_id do not belong to the same project');
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

  private serializeChartAccount(row: Prisma.FinanceChartAccountGetPayload<{
    include: {
      organization: { select: { id: true; name: true; code: true } };
      financeAccount: { select: { id: true; name: true; code: true; accountType: true } };
    };
  }>) {
    return {
      id: row.id,
      organization: row.organization ? { id: row.organization.id.toString(), name: row.organization.name, code: row.organization.code } : null,
      finance_account: row.financeAccount
        ? {
            id: row.financeAccount.id,
            name: row.financeAccount.name,
            code: row.financeAccount.code,
            account_type: row.financeAccount.accountType
          }
        : null,
      code: row.code,
      name: row.name,
      type: row.type,
      category: row.category,
      normal_balance: row.normalBalance,
      is_control_account: row.isControlAccount,
      is_active: row.isActive,
      metadata: row.metadata,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeReportingPeriod(row: Prisma.FinanceReportingPeriodGetPayload<{}>) {
    return {
      id: row.id,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      label: row.label,
      start_date: row.startDate,
      end_date: row.endDate,
      status: row.status,
      notes: row.notes,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeCustomer(row: Prisma.FinanceCustomerGetPayload<{ include: { organization: { select: { id: true; name: true; code: true } } } }>) {
    return {
      id: row.id,
      organization: row.organization ? { id: row.organization.id.toString(), name: row.organization.name, code: row.organization.code } : null,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      tax_number: row.taxNumber,
      is_active: row.isActive,
      metadata: row.metadata,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeVendor(row: Prisma.FinanceVendorGetPayload<{ include: { organization: { select: { id: true; name: true; code: true } } } }>) {
    return {
      id: row.id,
      organization: row.organization ? { id: row.organization.id.toString(), name: row.organization.name, code: row.organization.code } : null,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      tax_number: row.taxNumber,
      is_active: row.isActive,
      metadata: row.metadata,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeDonor(row: Prisma.FinanceDonorGetPayload<{}>) {
    return {
      id: row.id,
      name: row.name,
      donor_type: row.donorType,
      email: row.email,
      phone: row.phone,
      address: row.address,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeFund(
    row: Prisma.FinanceFundGetPayload<{ include: { donor: true; grants: { select: { id: true; code: true; name: true; status: true } } } }>
  ) {
    return {
      id: row.id,
      project_id: row.projectId ? row.projectId.toString() : null,
      code: row.code,
      name: row.name,
      fund_type: row.fundType,
      restriction_type: row.restrictionType,
      purpose: row.purpose,
      is_active: row.isActive,
      donor: row.donor ? { id: row.donor.id, name: row.donor.name, donor_type: row.donor.donorType } : null,
      grants: row.grants.map((grant) => ({ id: grant.id, code: grant.code, name: grant.name, status: grant.status })),
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeGrant(
    row: Prisma.FinanceGrantGetPayload<{ include: { donor: true; fund: true } }>
  ) {
    return {
      id: row.id,
      project_id: row.projectId ? row.projectId.toString() : null,
      code: row.code,
      name: row.name,
      restriction_type: row.restrictionType,
      start_date: row.startDate,
      end_date: row.endDate,
      committed_amount: Number(row.committedAmount),
      recognized_amount: Number(row.recognizedAmount),
      deferred_amount: Number(row.deferredAmount),
      status: row.status,
      purpose: row.purpose,
      notes: row.notes,
      donor: row.donor ? { id: row.donor.id, name: row.donor.name, donor_type: row.donor.donorType } : null,
      fund: row.fund ? { id: row.fund.id, code: row.fund.code, name: row.fund.name, restriction_type: row.fund.restrictionType } : null,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeBudget(
    row: Prisma.FinanceBudgetGetPayload<{ include: { fund: true; grant: true; lines: true; assumptions: true; portfolio: true } }>
  ) {
    return {
      id: row.id,
      organization_id: row.organizationId ? row.organizationId.toString() : null,
      team_id: row.teamId ? row.teamId.toString() : null,
      project_id: row.projectId ? row.projectId.toString() : null,
      parent_budget_id: row.parentBudgetId,
      fund: row.fund
        ? {
            id: row.fund.id,
            code: row.fund.code,
            name: row.fund.name,
            restriction_type: row.fund.restrictionType,
            project_id: row.fund.projectId ? row.fund.projectId.toString() : null,
          }
        : null,
      grant: row.grant
        ? {
            id: row.grant.id,
            code: row.grant.code,
            name: row.grant.name,
            restriction_type: row.grant.restrictionType,
            status: row.grant.status,
            project_id: row.grant.projectId ? row.grant.projectId.toString() : null,
          }
        : null,
      name: row.name,
      scope_type: row.scopeType,
      budget_type: row.budgetType,
      period_type: row.periodType,
      fiscal_year: row.fiscalYear,
      quarter: row.quarter,
      month: row.month,
      currency: row.currency,
      exchange_rate: row.exchangeRate != null ? Number(row.exchangeRate) : null,
      start_date: row.startDate,
      end_date: row.endDate,
      status: row.status,
      total_budget: Number(row.totalBudget),
      notes: row.notes,
      assumptions: row.assumptions.map((entry) => ({
        id: entry.id,
        section: entry.section,
        label: entry.label,
        value: entry.value,
        notes: entry.notes,
        sort_order: entry.sortOrder,
      })),
      portfolio: row.portfolio.map((entry) => ({
        id: entry.id,
        project_id: entry.projectId.toString(),
        fund_id: entry.fundId,
        grant_id: entry.grantId,
        funder_name: entry.funderName,
        status: entry.status,
        period_1_amount: entry.period1Amount != null ? Number(entry.period1Amount) : null,
        period_2_amount: entry.period2Amount != null ? Number(entry.period2Amount) : null,
        period_3_amount: entry.period3Amount != null ? Number(entry.period3Amount) : null,
        period_4_amount: entry.period4Amount != null ? Number(entry.period4Amount) : null,
        period_total: entry.periodTotal != null ? Number(entry.periodTotal) : null,
        total_budget: entry.totalBudget != null ? Number(entry.totalBudget) : null,
        notes: entry.notes,
        sort_order: entry.sortOrder,
      })),
      lines: row.lines.map((line) => ({
        id: line.id,
        section: line.section,
        group_name: line.groupName,
        line_label: line.lineLabel,
        line_name: line.lineLabel,
        chart_account_id: line.chartAccountId,
        project_id: line.projectId ? line.projectId.toString() : null,
        fund_id: line.fundId,
        grant_id: line.grantId,
        period_1_amount: line.period1Amount != null ? Number(line.period1Amount) : null,
        period_2_amount: line.period2Amount != null ? Number(line.period2Amount) : null,
        period_3_amount: line.period3Amount != null ? Number(line.period3Amount) : null,
        period_4_amount: line.period4Amount != null ? Number(line.period4Amount) : null,
        total_amount: line.totalAmount != null ? Number(line.totalAmount) : Number(line.amount),
        revised_total_amount: line.revisedTotalAmount != null ? Number(line.revisedTotalAmount) : null,
        actual_total_amount: line.actualTotalAmount != null ? Number(line.actualTotalAmount) : null,
        variance_amount: line.varianceAmount != null ? Number(line.varianceAmount) : null,
        amount: Number(line.amount),
        notes: line.notes,
        sort_order: line.sortOrder,
      })),
      approved_by: row.approvedBy ? row.approvedBy.toString() : null,
      approved_at: row.approvedAt,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }

  private async computeBudgetActuals(
    budget: Prisma.FinanceBudgetGetPayload<{ include: { fund: true; grant: true; lines: true; assumptions: true; portfolio: true } }>
  ) {
    const dateRange = {
      gte: budget.startDate,
      lte: budget.endDate,
    };

    if (budget.budgetType === 'project') {
      const vouchers = await this.prisma.financePaymentVoucher.findMany({
        where: {
          disbursedAt: dateRange,
          request: {
            data: {
              path: ['project_id'],
              equals: budget.projectId ? budget.projectId.toString() : '',
            },
          },
        },
        select: { amount: true },
      });
      return {
        incomeTotal: 0,
        expenseTotal: vouchers.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      };
    }

    const fundGrantFilter =
      budget.budgetType === 'grant'
        ? { grantId: budget.grantId ?? undefined }
        : budget.budgetType === 'fund'
          ? { fundId: budget.fundId ?? undefined }
          : {};

    const [incomeRows, voucherRows] = await Promise.all([
      this.prisma.financeIncomeEntry.findMany({
        where: {
          ...fundGrantFilter,
          receivedAt: dateRange,
        },
        select: { amount: true },
      }),
      this.prisma.financePaymentVoucher.findMany({
        where: {
          ...fundGrantFilter,
          disbursedAt: dateRange,
        },
        select: { amount: true },
      }),
    ]);

    return {
      incomeTotal: incomeRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      expenseTotal: voucherRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    };
  }

  private async validateFundGrant(fundId?: string | null, grantId?: string | null) {
    const fund = fundId ? await this.prisma.financeFund.findUnique({ where: { id: fundId } }) : null;
    const grant = grantId ? await this.prisma.financeGrant.findUnique({ where: { id: grantId } }) : null;
    if (fundId && !fund) throw new BadRequestException('Invalid fund_id');
    if (grantId && !grant) throw new BadRequestException('Invalid grant_id');
    await this.validateBudgetDimensionCompatibility({ projectId: null, fund, grant });
    return { fund, grant };
  }

  private serializeSalesInvoice(
    row: Prisma.FinanceSalesInvoiceGetPayload<{
      include: {
        customer: true;
        organization: { select: { id: true; name: true; code: true } };
        team: { select: { id: true; name: true; type: true } };
        fund: true;
        grant: true;
        lines: { include: { chartAccount: true } };
        receipts: true;
        allocations: { include: { receipt: { include: { account: true } } } };
      };
    }>
  ) {
    const paidAmount = row.allocations.length
      ? row.allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)
      : row.receipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    const totalAmount = Number(row.totalAmount);
    const outstandingAmount = Math.max(0, totalAmount - paidAmount);
    const status = this.resolveInvoiceStatus(row.status, totalAmount, paidAmount, row.dueDate ?? row.invoiceDate, row.voidedAt);
    return {
      id: row.id,
      invoice_number: row.invoiceNumber,
      customer: { id: row.customer.id, name: row.customer.name, email: row.customer.email },
      organization: row.organization ? { id: row.organization.id.toString(), name: row.organization.name, code: row.organization.code } : null,
      team: row.team ? { id: row.team.id.toString(), name: row.team.name, type: row.team.type } : null,
      fund: row.fund ? { id: row.fund.id, code: row.fund.code, name: row.fund.name, restriction_type: row.fund.restrictionType } : null,
      grant: row.grant ? { id: row.grant.id, code: row.grant.code, name: row.grant.name, restriction_type: row.grant.restrictionType } : null,
      invoice_date: row.invoiceDate,
      due_date: row.dueDate,
      status,
      sent_at: row.sentAt,
      voided_at: row.voidedAt,
      currency: row.currency,
      subtotal: Number(row.subtotal),
      tax_amount: Number(row.taxAmount),
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      notes: row.notes,
      lines: row.lines.map((line) => ({
        id: line.id,
        chart_account: { id: line.chartAccount.id, code: line.chartAccount.code, name: line.chartAccount.name, type: line.chartAccount.type },
        description: line.description,
        quantity: Number(line.quantity),
        unit_price: Number(line.unitPrice),
        line_total: Number(line.lineTotal)
      })),
      receipts: (row.allocations.length
        ? row.allocations.map((allocation) => ({
            id: allocation.receipt.id,
            receipt_number: allocation.receipt.receiptNumber,
            amount: Number(allocation.receipt.amount),
            allocated_amount: Number(allocation.amount),
            received_at: allocation.receipt.receivedAt,
            reference: allocation.receipt.reference,
            account: {
              id: allocation.receipt.account.id,
              name: allocation.receipt.account.name,
              code: allocation.receipt.account.code
            }
          }))
        : row.receipts.map((receipt) => ({
            id: receipt.id,
            receipt_number: receipt.receiptNumber,
            amount: Number(receipt.amount),
            allocated_amount: Number(receipt.amount),
            received_at: receipt.receivedAt,
            reference: receipt.reference,
            account: null
          }))),
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private resolveInvoiceStatus(
    storedStatus: string,
    totalAmount: number,
    paidAmount: number,
    dueDate: Date,
    voidedAt?: Date | null
  ) {
    if (voidedAt || String(storedStatus).toLowerCase() === 'void') return 'void';
    if (paidAmount >= totalAmount && totalAmount > 0) return 'paid';
    if (paidAmount > 0) return 'part_paid';
    const normalized = String(storedStatus || '').toLowerCase();
    if (normalized === 'draft') return 'draft';
    if (normalized === 'posted') return dueDate.getTime() < Date.now() ? 'overdue' : 'sent';
    if (normalized === 'sent' || normalized === 'overdue') {
      return dueDate.getTime() < Date.now() ? 'overdue' : 'sent';
    }
    return normalized || 'draft';
  }

  private async refreshInvoiceStatusTx(tx: Prisma.TransactionClient, invoiceId: string) {
    const row = await tx.financeSalesInvoice.findUnique({
      where: { id: invoiceId },
      include: { allocations: true, receipts: true }
    });
    if (!row) return null;
    const paidAmount = row.allocations.length
      ? row.allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)
      : row.receipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    const status = this.resolveInvoiceStatus(
      row.status,
      Number(row.totalAmount),
      paidAmount,
      row.dueDate ?? row.invoiceDate,
      row.voidedAt
    );
    return tx.financeSalesInvoice.update({
      where: { id: invoiceId },
      data: { status }
    });
  }

  private serializeBill(
    row: Prisma.FinanceBillHeaderGetPayload<{
      include: {
        vendor: true;
        organization: { select: { id: true; name: true; code: true } };
        team: { select: { id: true; name: true; type: true } };
        fund: true;
        grant: true;
        lines: { include: { chartAccount: true } };
        payments: true;
      };
    }>
  ) {
    const paidAmount = row.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalAmount = Number(row.totalAmount);
    const outstandingAmount = Math.max(0, totalAmount - paidAmount);
    return {
      id: row.id,
      bill_number: row.billNumber,
      vendor: { id: row.vendor.id, name: row.vendor.name, email: row.vendor.email },
      organization: row.organization ? { id: row.organization.id.toString(), name: row.organization.name, code: row.organization.code } : null,
      team: row.team ? { id: row.team.id.toString(), name: row.team.name, type: row.team.type } : null,
      fund: row.fund ? { id: row.fund.id, code: row.fund.code, name: row.fund.name, restriction_type: row.fund.restrictionType } : null,
      grant: row.grant ? { id: row.grant.id, code: row.grant.code, name: row.grant.name, restriction_type: row.grant.restrictionType } : null,
      bill_date: row.billDate,
      due_date: row.dueDate,
      status: row.status,
      currency: row.currency,
      subtotal: Number(row.subtotal),
      tax_amount: Number(row.taxAmount),
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      notes: row.notes,
      lines: row.lines.map((line) => ({
        id: line.id,
        chart_account: { id: line.chartAccount.id, code: line.chartAccount.code, name: line.chartAccount.name, type: line.chartAccount.type },
        description: line.description,
        quantity: Number(line.quantity),
        unit_price: Number(line.unitPrice),
        line_total: Number(line.lineTotal)
      })),
      payments: row.payments.map((payment) => ({
        id: payment.id,
        payment_number: payment.paymentNumber,
        amount: Number(payment.amount),
        paid_at: payment.paidAt,
        reference: payment.reference
      })),
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeReportNote(row: Prisma.FinanceReportNoteGetPayload<{ include: { period: true } }>) {
    return {
      id: row.id,
      period: this.serializeReportingPeriod(row.period),
      report_key: row.reportKey,
      kind: row.kind,
      severity: row.severity,
      title: row.title,
      body: row.body,
      source_rule: row.sourceRule,
      is_overridden: row.isOverridden,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
  }

  private serializeSalesInvoiceReceivable(
    row: Prisma.FinanceSalesInvoiceGetPayload<{
      include: {
        customer: true;
        receipts: true;
        allocations: true;
        organization: { select: { id: true; name: true; code: true } };
        team: { select: { id: true; name: true; type: true } };
        fund: true;
        grant: true;
      };
    }>,
    today: Date
  ) {
    const paidAmount = row.allocations.length
      ? row.allocations.reduce((sum, payment) => sum + Number(payment.amount), 0)
      : row.receipts.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalAmount = Number(row.totalAmount);
    const outstandingAmount = Math.max(0, totalAmount - paidAmount);
    const dueDate = row.dueDate ?? row.invoiceDate;
    const ageDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
    return {
      id: row.id,
      document_number: row.invoiceNumber,
      customer_id: row.customerId,
      party_name: row.customer.name,
      organization: row.organization ? row.organization.name : null,
      team: row.team ? row.team.name : null,
      fund: row.fund ? row.fund.name : null,
      grant: row.grant ? row.grant.name : null,
      issue_date: row.invoiceDate,
      due_date: row.dueDate,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      age_days: ageDays,
      aging_bucket: this.getAgingBucket(ageDays),
      status: this.resolveInvoiceStatus(row.status, totalAmount, paidAmount, dueDate, row.voidedAt),
      currency: row.currency,
      type: 'receivable'
    };
  }

  private serializeBillPayable(
    row: Prisma.FinanceBillHeaderGetPayload<{
      include: {
        vendor: true;
        payments: true;
        organization: { select: { id: true; name: true; code: true } };
        team: { select: { id: true; name: true; type: true } };
        fund: true;
        grant: true;
      };
    }>,
    today: Date
  ) {
    const paidAmount = row.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalAmount = Number(row.totalAmount);
    const outstandingAmount = Math.max(0, totalAmount - paidAmount);
    const dueDate = row.dueDate ?? row.billDate;
    const ageDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
    return {
      id: row.id,
      document_number: row.billNumber,
      party_name: row.vendor.name,
      organization: row.organization ? row.organization.name : null,
      team: row.team ? row.team.name : null,
      fund: row.fund ? row.fund.name : null,
      grant: row.grant ? row.grant.name : null,
      issue_date: row.billDate,
      due_date: row.dueDate,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      age_days: ageDays,
      aging_bucket: this.getAgingBucket(ageDays),
      status: row.status,
      currency: row.currency,
      type: 'payable'
    };
  }

  private computeAgingSummary(items: Array<{ outstanding_amount: number; age_days: number; aging_bucket: string }>) {
    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 } as Record<string, number>;
    for (const item of items) buckets[item.aging_bucket] += item.outstanding_amount;
    return {
      total_outstanding: items.reduce((sum, item) => sum + item.outstanding_amount, 0),
      overdue_count: items.filter((item) => item.age_days > 0).length,
      buckets
    };
  }

  private getAgingBucket(ageDays: number) {
    if (ageDays <= 0) return 'current';
    if (ageDays <= 30) return '1-30';
    if (ageDays <= 60) return '31-60';
    if (ageDays <= 90) return '61-90';
    return '90+';
  }

  private async buildReportContext(query: Record<string, any>) {
    const period = await this.resolvePeriodContext(query);
    const comparisonPeriod = await this.resolveComparisonPeriod(period, query);
    const lines = await this.prisma.financeJournalLine.findMany({
      where: {
        journalEntry: {
          entryDate: {
            gte: new Date(period.start_date),
            lte: new Date(period.end_date)
          }
        },
        ...(query.organization_id ? { organizationId: this.parseId(String(query.organization_id), 'organization_id') } : {}),
        ...(query.team_id ? { teamId: this.parseId(String(query.team_id), 'team_id') } : {}),
        ...(query.fund_id ? { fundId: String(query.fund_id) } : {}),
        ...(query.grant_id ? { grantId: String(query.grant_id) } : {})
      },
      include: {
        chartAccount: true,
        journalEntry: true,
        organization: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, type: true } },
        fund: true,
        grant: true
      },
      orderBy: [{ journalEntry: { entryDate: 'asc' } }, { createdAt: 'asc' }]
    });
    return { period, comparisonPeriod, lines };
  }

  private async resolvePeriodContext(query: Record<string, any>) {
    if (query.period_id) {
      const period = await this.prisma.financeReportingPeriod.findUnique({ where: { id: String(query.period_id) } });
      if (!period) throw new BadRequestException('Invalid period_id');
      return {
        id: period.id,
        label: period.label,
        start_date: period.startDate,
        end_date: period.endDate,
        year: period.year,
        month: period.month,
        quarter: period.quarter,
        status: period.status
      };
    }
    const from = query.from ? new Date(String(query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = query.to ? new Date(String(query.to)) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return {
      id: null,
      label: `${from.toLocaleString('en-US', { month: 'long' })} ${from.getFullYear()}`,
      start_date: from,
      end_date: to,
      year: from.getFullYear(),
      month: from.getMonth() + 1,
      quarter: Math.ceil((from.getMonth() + 1) / 3),
      status: 'open'
    };
  }

  private async resolveComparisonPeriod(
    period: { year: number; month: number },
    query: Record<string, any>
  ) {
    if (!query.comparison_period) return null;
    if (query.comparison_period === 'previous') {
      const ref = new Date(period.year, period.month - 2, 1);
      return {
        year: ref.getFullYear(),
        month: ref.getMonth() + 1,
        quarter: Math.ceil((ref.getMonth() + 1) / 3)
      };
    }
    const periodId = String(query.comparison_period);
    const comparison = await this.prisma.financeReportingPeriod.findUnique({ where: { id: periodId } });
    return comparison
      ? { id: comparison.id, year: comparison.year, month: comparison.month, quarter: comparison.quarter, label: comparison.label }
      : null;
  }

  private summarizeIncomeLines(lines: Array<Prisma.FinanceJournalLineGetPayload<{ include: { chartAccount: true; fund: true; grant: true } }>>) {
    const relevant = lines.filter((line) => line.chartAccount.type === 'income');
    const byAccount = new Map<string, { account_id: string; code: string; name: string; amount: number; category: string }>();
    const categoryTotals = new Map<string, number>();
    const restrictionTotals = new Map<string, number>();
    let total = 0;
    for (const line of relevant) {
      const amount = Number(line.credit) - Number(line.debit);
      total += amount;
      categoryTotals.set(line.chartAccount.category, (categoryTotals.get(line.chartAccount.category) ?? 0) + amount);
      const restrictionKey = line.grant?.restrictionType ?? line.fund?.restrictionType ?? 'unrestricted';
      restrictionTotals.set(restrictionKey, (restrictionTotals.get(restrictionKey) ?? 0) + amount);
      const existing = byAccount.get(line.chartAccountId) ?? {
        account_id: line.chartAccountId,
        code: line.chartAccount.code,
        name: line.chartAccount.name,
        category: line.chartAccount.category,
        amount: 0
      };
      existing.amount += amount;
      byAccount.set(line.chartAccountId, existing);
    }
    return {
      total,
      breakdown: Array.from(byAccount.values()).sort((a, b) => b.amount - a.amount),
      category_totals: Object.fromEntries(categoryTotals),
      restriction_totals: Object.fromEntries(restrictionTotals)
    };
  }

  private summarizeExpenseLines(lines: Array<Prisma.FinanceJournalLineGetPayload<{ include: { chartAccount: true; fund: true; grant: true } }>>) {
    const relevant = lines.filter((line) => line.chartAccount.type === 'expense');
    const byAccount = new Map<string, { account_id: string; code: string; name: string; amount: number; category: string }>();
    const categoryTotals = new Map<string, number>();
    const restrictionTotals = new Map<string, number>();
    let total = 0;
    for (const line of relevant) {
      const amount = Number(line.debit) - Number(line.credit);
      total += amount;
      categoryTotals.set(line.chartAccount.category, (categoryTotals.get(line.chartAccount.category) ?? 0) + amount);
      const restrictionKey = line.grant?.restrictionType ?? line.fund?.restrictionType ?? 'unrestricted';
      restrictionTotals.set(restrictionKey, (restrictionTotals.get(restrictionKey) ?? 0) + amount);
      const existing = byAccount.get(line.chartAccountId) ?? {
        account_id: line.chartAccountId,
        code: line.chartAccount.code,
        name: line.chartAccount.name,
        category: line.chartAccount.category,
        amount: 0
      };
      existing.amount += amount;
      byAccount.set(line.chartAccountId, existing);
    }
    return {
      total,
      breakdown: Array.from(byAccount.values()).sort((a, b) => b.amount - a.amount),
      category_totals: Object.fromEntries(categoryTotals),
      restriction_totals: Object.fromEntries(restrictionTotals)
    };
  }

  private computeChartBalances(
    lines: Array<Prisma.FinanceJournalLineGetPayload<{ include: { chartAccount: true; fund: true; grant: true } }>>
  ) {
    const balances = new Map<string, number>();
    for (const line of lines) {
      const existing = balances.get(line.chartAccountId) ?? 0;
      const signed = line.chartAccount.normalBalance === 'debit'
        ? Number(line.debit) - Number(line.credit)
        : Number(line.credit) - Number(line.debit);
      balances.set(line.chartAccountId, existing + signed);
    }
    return balances;
  }

  private summarizeFundActivity(
    lines: Array<Prisma.FinanceJournalLineGetPayload<{ include: { chartAccount: true; fund: true; grant: true } }>>
  ) {
    const buckets = new Map<string, { fund_id: string; fund_name: string; restriction_type: string; income: number; expense: number; net: number }>();
    for (const line of lines) {
      const fundId = line.fundId ?? line.grant?.fundId ?? null;
      const fundName = line.fund?.name ?? (line.grant?.name ? `${line.grant.name} (No fund)` : 'Unassigned');
      const restrictionType = line.grant?.restrictionType ?? line.fund?.restrictionType ?? 'unrestricted';
      const key = fundId ?? `unassigned:${restrictionType}`;
      const bucket = buckets.get(key) ?? {
        fund_id: fundId ?? key,
        fund_name: fundName,
        restriction_type: restrictionType,
        income: 0,
        expense: 0,
        net: 0
      };
      if (line.chartAccount.type === 'income') {
        const amount = Number(line.credit) - Number(line.debit);
        bucket.income += amount;
        bucket.net += amount;
      } else if (line.chartAccount.type === 'expense') {
        const amount = Number(line.debit) - Number(line.credit);
        bucket.expense += amount;
        bucket.net -= amount;
      }
      buckets.set(key, bucket);
    }
    return Array.from(buckets.values()).sort((a, b) => b.net - a.net);
  }

  private async getControlBalance(code: string, balances: Map<string, number>) {
    const account = await this.prisma.financeChartAccount.findFirst({ where: { code } });
    return account ? Number(balances.get(account.id) ?? 0) : 0;
  }

  private async getFixedAssetBalance(balances: Map<string, number>) {
    const accounts = await this.prisma.financeChartAccount.findMany({ where: { type: 'asset', category: 'fixed_asset' } });
    return accounts.reduce((sum, account) => sum + Number(balances.get(account.id) ?? 0), 0);
  }

  private async buildReportNotes(
    reportKey: string,
    context: Awaited<ReturnType<FinanceService['buildReportContext']>>,
    metrics: Record<string, any>
  ) {
    const saved = context.period.id
      ? await this.prisma.financeReportNote.findMany({ where: { periodId: String(context.period.id), reportKey } })
      : [];
    const generated: Array<{ severity: string; title: string; body: string; source_rule: string }> = [];

    if ((metrics.receivablesTotal ?? 0) > 0 && (metrics.overdueCount ?? 0) > 0) {
      generated.push({
        severity: 'warning',
        title: 'Outstanding receivables require follow-up',
        body: `${metrics.overdueCount} receivable item(s) are overdue with total outstanding of ${Number(metrics.receivablesTotal).toFixed(2)}.`,
        source_rule: 'large_unpaid_receivables'
      });
    }
    if ((metrics.bankBalance ?? 0) < 0) {
      generated.push({
        severity: 'critical',
        title: 'Bank position is negative',
        body: 'Bank and cash balances are below zero for the selected reporting period.',
        source_rule: 'negative_cash_movement'
      });
    }
    if ((metrics.advanceBalance ?? 0) > 0) {
      generated.push({
        severity: 'info',
        title: 'Advance balances remain open',
        body: `Open staff or expense advances total ${Number(metrics.advanceBalance).toFixed(2)} and should be reviewed for retirement.`,
        source_rule: 'unretired_advances'
      });
    }
    if ((metrics.deferredGrantIncome ?? 0) > 0) {
      generated.push({
        severity: 'info',
        title: 'Deferred grant income remains unrecognized',
        body: `Deferred grant income totals ${Number(metrics.deferredGrantIncome).toFixed(2)}. Confirm conditions and utilization before recognition.`,
        source_rule: 'deferred_grant_income'
      });
    }
    if ((metrics.restrictedNetAssets ?? 0) > (metrics.unrestrictedNetAssets ?? 0) * 1.5 && (metrics.restrictedNetAssets ?? 0) > 0) {
      generated.push({
        severity: 'warning',
        title: 'Restricted funds dominate available net assets',
        body: 'Most available net assets are restricted. Review unrestricted cash coverage for operating costs.',
        source_rule: 'restricted_funds_pressure'
      });
    }
    if (Array.isArray(metrics.breakdown) && metrics.breakdown[0] && metrics.totalExpense) {
      const top = metrics.breakdown[0];
      if (top.amount / metrics.totalExpense > 0.45) {
        generated.push({
          severity: 'warning',
          title: 'Expense concentration detected',
          body: `${top.name} accounts for more than 45% of period expense.`,
          source_rule: 'expense_concentration'
        });
      }
    }
    return {
      saved: saved.map((row) => ({
        id: row.id,
        severity: row.severity,
        title: row.title,
        body: row.body,
        source_rule: row.sourceRule,
        kind: row.kind,
        is_overridden: row.isOverridden
      })),
      generated
    };
  }

  private buildPeriodLabel(year: number, month: number) {
    return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  private async ensureReportingPeriod(date: Date, actorId?: string) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const existing = await this.prisma.financeReportingPeriod.findFirst({ where: { year, month } });
    if (existing) return existing;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.prisma.financeReportingPeriod.create({
      data: {
        year,
        month,
        quarter: Math.ceil(month / 3),
        label: this.buildPeriodLabel(year, month),
        startDate,
        endDate,
        status: 'open',
        createdBy: actorId ? toBigInt(actorId) : null
      }
    });
  }

  private async ensureDefaultChartAccounts(actorId?: string) {
    const defaults = [
      { code: '1000', name: 'Cash on Hand', type: 'asset', category: 'cash', normalBalance: 'debit' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'receivable', normalBalance: 'debit', isControlAccount: true },
      { code: '1200', name: 'Staff Advances', type: 'asset', category: 'advance', normalBalance: 'debit', isControlAccount: true },
      { code: '1300', name: 'Fixed Assets', type: 'asset', category: 'fixed_asset', normalBalance: 'debit' },
      { code: '2100', name: 'Accounts Payable', type: 'liability', category: 'payable', normalBalance: 'credit', isControlAccount: true },
      { code: '2200', name: 'Deferred Grant Income', type: 'liability', category: 'deferred_grant_income', normalBalance: 'credit', isControlAccount: true },
      { code: '3000', name: 'Unrestricted Net Assets', type: 'equity', category: 'unrestricted_net_assets', normalBalance: 'credit', isControlAccount: true },
      { code: '3010', name: 'Restricted Net Assets', type: 'equity', category: 'restricted_net_assets', normalBalance: 'credit', isControlAccount: true },
      { code: '3100', name: 'Opening Balance Equity', type: 'equity', category: 'opening_balance', normalBalance: 'credit', isControlAccount: true },
      { code: '4100', name: 'Grant Income', type: 'income', category: 'grant_income', normalBalance: 'credit' },
      { code: '4200', name: 'Donation Income', type: 'income', category: 'donation_income', normalBalance: 'credit' },
      { code: '4300', name: 'Service Income', type: 'income', category: 'service_income', normalBalance: 'credit' },
      { code: '4400', name: 'Other Support and Revenue', type: 'income', category: 'other_income', normalBalance: 'credit' },
      { code: '5000', name: 'Program Expenses', type: 'expense', category: 'program_expense', normalBalance: 'debit' },
      { code: '5100', name: 'Administrative Expenses', type: 'expense', category: 'administrative_expense', normalBalance: 'debit' },
      { code: '5200', name: 'Fundraising Expenses', type: 'expense', category: 'fundraising_expense', normalBalance: 'debit' },
      { code: '5300', name: 'Asset Disposal Gain/Loss', type: 'income', category: 'other_income', normalBalance: 'credit' }
    ];
    for (const account of defaults) {
      const existing = await this.prisma.financeChartAccount.findFirst({
        where: { organizationId: null, code: account.code }
      });
      if (existing) {
        await this.prisma.financeChartAccount.update({
          where: { id: existing.id },
          data: {
            name: account.name,
            type: account.type,
            category: account.category,
            normalBalance: account.normalBalance,
            isControlAccount: account.isControlAccount ?? false,
            isActive: true
          }
        });
      } else {
        await this.prisma.financeChartAccount.create({
          data: {
            organizationId: null,
            code: account.code,
            name: account.name,
            type: account.type,
            category: account.category,
            normalBalance: account.normalBalance,
            isControlAccount: account.isControlAccount ?? false,
            isActive: true,
            createdBy: actorId ? toBigInt(actorId) : null
          }
        });
      }
    }
    const financeAccounts = await this.prisma.financeAccount.findMany({ where: { isActive: true } });
    for (const financeAccount of financeAccounts) {
      await this.ensureFinanceAccountChartAccount(financeAccount.id, actorId);
    }
  }

  private async ensureFinanceAccountChartAccount(accountId: string, actorId?: string) {
    const existing = await this.prisma.financeChartAccount.findFirst({ where: { financeAccountId: accountId } });
    if (existing) return existing;
    const account = await this.prisma.financeAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new BadRequestException('Finance account not found');
    const category = ['bank', 'cash', 'wallet'].includes(account.accountType) ? account.accountType : 'bank';
    const code = await this.nextChartCode(account.accountType === 'cash' ? '101' : account.accountType === 'wallet' ? '102' : '103');
    return this.prisma.financeChartAccount.create({
      data: {
        organizationId: account.organizationId,
        financeAccountId: account.id,
        code,
        name: `${account.name}`,
        type: 'asset',
        category,
        normalBalance: 'debit',
        isActive: true,
        createdBy: actorId ? toBigInt(actorId) : null
      }
    });
  }

  private async nextChartCode(prefix: string) {
    const rows = await this.prisma.financeChartAccount.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } });
    const max = rows.reduce((highest, row) => {
      const numeric = Number(String(row.code).replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
    }, Number(prefix) * 10);
    return String(max + 1);
  }

  private async getRequiredChartAccount(code: string) {
    await this.ensureDefaultChartAccounts();
    const account = await this.prisma.financeChartAccount.findFirst({ where: { code } });
    if (!account) throw new BadRequestException(`Chart account ${code} not configured`);
    return account;
  }

  private async createJournalEntry(input: {
    entryDate: Date;
    periodId: string;
    sourceType: string;
    sourceId: string;
    memo: string;
    currency: string;
    postedBy?: string;
    lines: Array<{ chartAccountId: string; organizationId?: bigint | null; teamId?: bigint | null; fundId?: string | null; grantId?: string | null; debit: number; credit: number; description?: string }>;
  }) {
    return this.prisma.$transaction((tx) => this.createJournalEntryTx(tx, input));
  }

  private async createJournalEntryTx(
    tx: Prisma.TransactionClient,
    input: {
      entryDate: Date;
      periodId: string;
      sourceType: string;
      sourceId: string;
      memo: string;
      currency: string;
      postedBy?: string;
      lines: Array<{ chartAccountId: string; organizationId?: bigint | null; teamId?: bigint | null; fundId?: string | null; grantId?: string | null; debit: number; credit: number; description?: string }>;
    }
  ) {
    const totalDebit = input.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = input.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('Journal entry is not balanced');
    }
    const entryNo = await this.nextSequenceValue('JE', input.entryDate);
    return tx.financeJournalEntry.create({
      data: {
        entryNo,
        entryDate: input.entryDate,
        periodId: input.periodId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        memo: input.memo,
        status: 'posted',
        currency: input.currency,
        totalDebit,
        totalCredit,
        postedBy: input.postedBy ? toBigInt(input.postedBy) : null,
        lines: {
          create: input.lines.map((line) => ({
            chartAccountId: line.chartAccountId,
            organizationId: line.organizationId ?? null,
            teamId: line.teamId ?? null,
            fundId: line.fundId ?? null,
            grantId: line.grantId ?? null,
            debit: line.debit,
            credit: line.credit,
            description: line.description ?? null
          }))
        }
      }
    });
  }

  private async nextSequenceValue(prefix: string, date: Date) {
    const year = date.getFullYear();
    const count = await this.prisma.financeJournalEntry.count({ where: { entryNo: { startsWith: `${prefix}/${year}/` } } }).catch(() => 0);
    return `${prefix}/${year}/${String(count + 1).padStart(4, '0')}`;
  }

  private async nextDocumentSequenceValue(
    prefix: string,
    date: Date,
    kind: 'sales_invoice' | 'bill' | 'receipt' | 'vendor_payment'
  ) {
    const year = date.getFullYear();
    const startsWith = `${prefix}/${year}/`;
    let count = 0;
    if (kind === 'sales_invoice') {
      count = await this.prisma.financeSalesInvoice.count({ where: { invoiceNumber: { startsWith } } });
    } else if (kind === 'bill') {
      count = await this.prisma.financeBillHeader.count({ where: { billNumber: { startsWith } } });
    } else if (kind === 'receipt') {
      count = await this.prisma.financeReceipt.count({ where: { receiptNumber: { startsWith } } });
    } else {
      count = await this.prisma.financeVendorPayment.count({ where: { paymentNumber: { startsWith } } });
    }
    return `${prefix}/${year}/${String(count + 1).padStart(4, '0')}`;
  }

  async generateSalesInvoicePdf(id: string) {
    const invoice = await this.getSalesInvoice(id);
    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([595.28, 841.89]);
    let y = 800;
    const lineGap = 16;
    const write = (text: string, size = 11, isBold = false, x = 40) => {
      if (y < 60) {
        page = pdf.addPage([595.28, 841.89]);
        y = 800;
      }
      page.drawText(text, { x, y, size, font: isBold ? bold : regular });
      y -= lineGap;
    };

    write('INVOICE', 20, true);
    write(`Invoice No: ${invoice.invoice_number}`, 11, true);
    write(`Status: ${String(invoice.status).replaceAll('_', ' ')}`);
    write(`Issue Date: ${this.formatDate(invoice.invoice_date)}`);
    write(`Due Date: ${this.formatDate(invoice.due_date)}`);
    write(`Customer: ${invoice.customer.name}`);
    write(`Email: ${invoice.customer.email || '-'}`);
    if (invoice.organization?.name) write(`Organization: ${invoice.organization.name}`);
    if (invoice.team?.name) write(`Team: ${invoice.team.name}`);
    if (invoice.notes) write(`Notes: ${invoice.notes}`);
    y -= 8;
    write('Lines', 13, true);
    invoice.lines.forEach((line: any, index: number) => {
      write(`${index + 1}. ${line.description}`, 11, false, 48);
      write(`Qty ${line.quantity} x ${this.formatMoney(line.unit_price, invoice.currency)} = ${this.formatMoney(line.line_total, invoice.currency)}`, 10, false, 60);
    });
    y -= 8;
    write(`Subtotal: ${this.formatMoney(invoice.subtotal, invoice.currency)}`, 11, true);
    write(`Tax: ${this.formatMoney(invoice.tax_amount, invoice.currency)}`);
    write(`Total: ${this.formatMoney(invoice.total_amount, invoice.currency)}`, 12, true);
    write(`Paid: ${this.formatMoney(invoice.paid_amount, invoice.currency)}`);
    write(`Balance Due: ${this.formatMoney(invoice.outstanding_amount, invoice.currency)}`, 12, true);

    if (invoice.receipts?.length) {
      y -= 8;
      write('Receipts', 13, true);
      invoice.receipts.forEach((receipt: any) => {
        write(
          `${receipt.receipt_number} • ${this.formatDate(receipt.received_at)} • ${this.formatMoney(receipt.allocated_amount ?? receipt.amount, invoice.currency)}`,
          10,
          false,
          48
        );
      });
    }

    const buffer = Buffer.from(await pdf.save());
    return {
      file_name: `${String(invoice.invoice_number).replace(/[\\/]+/g, '-')}.pdf`,
      mime_type: 'application/pdf',
      content_base64: buffer.toString('base64')
    };
  }

  private async sendInvoiceMail(
    invoiceId: string,
    invoiceNumber: string,
    actorId: string | undefined,
    subject: string,
    text: string
  ) {
    const invoice = await this.prisma.financeSalesInvoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });
    const to = invoice?.customer.email?.trim();
    if (!to) return;
    const pdf = await this.generateSalesInvoicePdf(invoiceId);
    await this.mailService.send({
      to,
      subject,
      text,
      threadKey: `invoice-${invoiceId}`,
      userId: actorId,
      notifiableType: 'finance_sales_invoice',
      notifiableId: invoiceId,
      attachments: [
        {
          filename: pdf.file_name,
          content: Buffer.from(pdf.content_base64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    });
  }

  private formatDate(value?: Date | string | null) {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toISOString().slice(0, 10);
  }

  private formatMoney(value?: number | string | null, currency = 'NGN') {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return `${currency} 0.00`;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private buildBudgetExportRows(budget: any) {
    const rows: Record<string, string | number>[] = [
      {
        record_type: 'budget',
        name: budget.name || '',
        scope_type: budget.scope_type || '',
        budget_type: budget.budget_type || '',
        period_type: budget.period_type || '',
        fiscal_year: budget.fiscal_year ?? '',
        quarter: budget.quarter ?? '',
        month: budget.month ?? '',
        currency: budget.currency || '',
        exchange_rate: budget.exchange_rate ?? '',
        status: budget.status || '',
        organization_id: budget.organization_id || '',
        team_id: budget.team_id || '',
        project_id: budget.project_id || '',
        fund_id: budget.fund?.id || '',
        grant_id: budget.grant?.id || '',
        parent_budget_id: budget.parent_budget_id || '',
        start_date: this.formatDate(budget.start_date),
        end_date: this.formatDate(budget.end_date),
        notes: budget.notes || '',
      },
    ];

    for (const entry of budget.assumptions || []) {
      rows.push({
        record_type: 'assumption',
        section: entry.section || '',
        label: entry.label || '',
        value: entry.value || '',
        notes: entry.notes || '',
      });
    }

    for (const entry of budget.portfolio || []) {
      rows.push({
        record_type: 'portfolio',
        project_id: entry.project_id || '',
        fund_id: entry.fund_id || '',
        grant_id: entry.grant_id || '',
        funder_name: entry.funder_name || '',
        status: entry.status || '',
        period_1_amount: entry.period_1_amount ?? '',
        period_2_amount: entry.period_2_amount ?? '',
        period_3_amount: entry.period_3_amount ?? '',
        period_4_amount: entry.period_4_amount ?? '',
        period_total: entry.period_total ?? '',
        total_budget: entry.total_budget ?? '',
        notes: entry.notes || '',
      });
    }

    for (const line of budget.lines || []) {
      rows.push({
        record_type: 'line',
        section: line.section || '',
        group_name: line.group_name || '',
        line_name: line.line_name || line.line_label || '',
        chart_account_id: line.chart_account_id || '',
        project_id: line.project_id || '',
        fund_id: line.fund_id || '',
        grant_id: line.grant_id || '',
        period_1_amount: line.period_1_amount ?? '',
        period_2_amount: line.period_2_amount ?? '',
        period_3_amount: line.period_3_amount ?? '',
        period_4_amount: line.period_4_amount ?? '',
        total_amount: line.total_amount ?? line.amount ?? '',
        actual_total_amount: line.actual_total_amount ?? '',
        variance_amount: line.variance_amount ?? '',
        notes: line.notes || '',
      });
    }

    return rows;
  }

  private toCsv(rows: Record<string, string | number>[]) {
    const preferredHeaders = [
      'record_type',
      'name',
      'scope_type',
      'budget_type',
      'period_type',
      'fiscal_year',
      'quarter',
      'month',
      'currency',
      'exchange_rate',
      'status',
      'organization_id',
      'team_id',
      'project_id',
      'fund_id',
      'grant_id',
      'parent_budget_id',
      'start_date',
      'end_date',
      'section',
      'group_name',
      'line_name',
      'chart_account_id',
      'label',
      'value',
      'funder_name',
      'period_1_amount',
      'period_2_amount',
      'period_3_amount',
      'period_4_amount',
      'period_total',
      'total_amount',
      'total_budget',
      'actual_total_amount',
      'variance_amount',
      'notes',
    ];

    const seenHeaders = rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>());

    const headers = [
      ...preferredHeaders.filter((header) => seenHeaders.has(header)),
      ...Array.from(seenHeaders).filter((header) => !preferredHeaders.includes(header)).sort(),
    ];

    const escape = (value: unknown) => {
      const text = value == null ? '' : String(value);
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
    ];
    return lines.join('\r\n');
  }

  private async postIncomeJournal(row: Prisma.FinanceIncomeEntryGetPayload<{}>, actorId?: string) {
    const period = await this.ensureReportingPeriod(row.receivedAt, actorId);
    const cashAccount = await this.ensureFinanceAccountChartAccount(row.accountId, actorId);
    const revenueAccount = row.revenueAccountId
      ? await this.prisma.financeChartAccount.findUnique({ where: { id: row.revenueAccountId } })
      : await this.getRequiredChartAccount(row.grantId ? '4100' : '4300');
    if (!revenueAccount) throw new BadRequestException('Revenue chart account not found');
    await this.createJournalEntry({
      entryDate: row.receivedAt,
      periodId: period.id,
      sourceType: 'finance_income',
      sourceId: row.id,
      memo: row.reference || row.notes || 'Income entry',
      currency: row.currency,
      postedBy: actorId,
      lines: [
        { chartAccountId: cashAccount.id, fundId: row.fundId, grantId: row.grantId, debit: Number(row.amount), credit: 0, description: 'Cash receipt' },
        { chartAccountId: revenueAccount.id, fundId: row.fundId, grantId: row.grantId, debit: 0, credit: Number(row.amount), description: 'Income recognition' }
      ]
    });
  }

  private async postPaymentVoucherJournal(
    row: Prisma.FinancePaymentVoucherGetPayload<{}>,
    organizationId?: bigint | null,
    teamId?: bigint | null,
    actorId?: string
  ) {
    if (!row.paidFromAccountId) return null;
    const period = await this.ensureReportingPeriod(row.disbursedAt, actorId);
    const bankAccount = await this.ensureFinanceAccountChartAccount(row.paidFromAccountId, actorId);
    const advanceAccount = await this.getRequiredChartAccount('1200');
    await this.createJournalEntry({
      entryDate: row.disbursedAt,
      periodId: period.id,
      sourceType: 'finance_payment_voucher',
      sourceId: row.id,
      memo: `Payment voucher ${row.voucherNumber}`,
      currency: 'NGN',
      postedBy: actorId,
      lines: [
        { chartAccountId: advanceAccount.id, organizationId, teamId, fundId: row.fundId, grantId: row.grantId, debit: Number(row.amount), credit: 0, description: `Advance for ${row.voucherNumber}` },
        { chartAccountId: bankAccount.id, organizationId, teamId, fundId: row.fundId, grantId: row.grantId, debit: 0, credit: Number(row.amount), description: `Bank settlement ${row.voucherNumber}` }
      ]
    });
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
