import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { DisburseRequestDto } from './dto/disburse-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateFinanceSettingsDto } from './dto/update-finance-settings.dto';
import { Prisma } from '@prisma/client';

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
        voucherNumber,
        amount: disburseAmount,
        method: dto.method ?? null,
        transactionRef: dto.transaction_ref ?? null,
        note: dto.note ?? null,
        evidenceFileId: dto.evidence_file_id ?? null,
        disbursedAt: now
      }
    });
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
      emailThreadKey: `request-${request.id.toString()}-pv-${voucherNumber}`
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
}
