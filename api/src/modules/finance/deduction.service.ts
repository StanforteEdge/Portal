import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginatedResponse } from '../../common/helpers/paginated-response';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { UpsertDeductionTypeDto } from './dto/upsert-deduction-type.dto';
import { ApplyPVDeductionsDto } from './dto/apply-pv-deductions.dto';
import { CreateWHTRemittanceDto } from './dto/create-wht-remittance.dto';
import { StatutoryDeductionsQueryDto, RemitStatutoryDeductionsDto } from './dto/statutory-deductions.dto';

@Injectable()
export class DeductionService {
  private readonly logger = new Logger(DeductionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Deduction Types ──────────────────────────────────────────────────────

  async listDeductionTypes(query: Record<string, any>) {
    const where: any = {};
    if (query.organization_id) where.organizationId = toBigInt(query.organization_id);
    if (query.is_active !== undefined) where.isActive = query.is_active === 'true' || query.is_active === true;
    if (query.applies_to) where.appliesTo = String(query.applies_to);

    const rows = await this.prisma.financeDeductionType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { glAccount: { select: { id: true, name: true, code: true } } },
    });
    return paginatedResponse(rows, { page: 1, per_page: rows.length, total: rows.length });
  }

  async upsertDeductionType(
    id: string | undefined,
    dto: UpsertDeductionTypeDto,
    userId: number,
    organizationId?: number,
  ) {
    try {
      const data: any = {
        updatedBy: toBigInt(userId),
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) data.name = dto.name;
      if (dto.code !== undefined) data.code = dto.code;
      if (dto.rate !== undefined) data.rate = dto.rate;
      if (dto.applies_to !== undefined) data.appliesTo = dto.applies_to;
      if (dto.is_active !== undefined) data.isActive = dto.is_active;
      if (dto.gl_account_id !== undefined) data.glAccountId = dto.gl_account_id ?? null;

      if (id) {
        const existing = await this.prisma.financeDeductionType.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Deduction type not found');
        return await this.prisma.financeDeductionType.update({ where: { id }, data });
      }

      if (!dto.name || !dto.code || dto.rate === undefined) {
        throw new BadRequestException('name, code, and rate are required when creating a deduction type');
      }

      return await this.prisma.financeDeductionType.create({
        data: {
          ...data,
          name: dto.name,
          code: dto.code,
          rate: dto.rate,
          appliesTo: dto.applies_to ?? 'vendor',
          isActive: dto.is_active ?? true,
          createdBy: toBigInt(userId),
          organizationId: organizationId ? toBigInt(organizationId) : null,
        },
      });
    } catch (e) {
      this.logger.error(`upsertDeductionType error: ${e instanceof Error ? e.stack : String(e)}`);
      throw e;
    }
  }

  // ── PV Deductions ────────────────────────────────────────────────────────

  async applyPVDeductions(pvId: string, dto: ApplyPVDeductionsDto, userId: number) {
    const pv = await this.prisma.financePaymentVoucher.findUnique({
      where: { id: pvId },
      include: { contact: true },
    });
    if (!pv) throw new NotFoundException('Payment voucher not found');

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Remove any previously applied deductions for this PV
      await tx.financePVDeduction.deleteMany({ where: { paymentVoucherId: pvId } });
      await tx.financeVendorWHTAccrual.deleteMany({ where: { paymentVoucherId: pvId } });

      const createdDeductions = await Promise.all(
        dto.deductions.map((line) =>
          tx.financePVDeduction.create({
            data: {
              paymentVoucherId: pvId,
              deductionTypeId: line.deduction_type_id,
              rate: line.rate,
              grossAmount: line.gross_amount,
              deductionAmount: line.deduction_amount,
              createdBy: toBigInt(userId),
              updatedAt: now,
            },
          }),
        ),
      );

      // Create accruals for contact-linked PVs
      if (pv.contactId) {
        await Promise.all(
          createdDeductions.map((deduction) =>
            tx.financeVendorWHTAccrual.create({
              data: {
                contactId: pv.contactId!,
                paymentVoucherId: pvId,
                pvDeductionId: deduction.id,
                deductionTypeId: deduction.deductionTypeId,
                periodYear: now.getFullYear(),
                periodMonth: now.getMonth() + 1,
                grossAmount: deduction.grossAmount,
                withheldAmount: deduction.deductionAmount,
                organizationId: null,
                updatedAt: now,
              },
            }),
          ),
        );
      }

      // Create FinanceRequestDeduction siblings for request-level deduction tracking
      if (pv.requestId) {
        await Promise.all(
          createdDeductions.map((deduction) =>
            tx.financeRequestDeduction.create({
              data: {
                requestId: pv.requestId!,
                deductionTypeId: deduction.deductionTypeId,
                amount: deduction.deductionAmount,
                rate: deduction.rate,
                grossAmount: deduction.grossAmount,
                status: 'pending',
                createdBy: toBigInt(userId),
                updatedAt: now,
              },
            }),
          ),
        );
      }

      // Update PV net amount
      const totalDeducted = dto.deductions.reduce((sum, d) => sum + d.deduction_amount, 0);
      const grossAmount = dto.deductions[0]?.gross_amount ?? null;
      await tx.financePaymentVoucher.update({
        where: { id: pvId },
        data: {
          grossAmount: grossAmount,
          netAmount: grossAmount !== null ? grossAmount - totalDeducted : null,
        },
      });

      return { deductions: createdDeductions, total_deducted: totalDeducted };
    });
  }

  async listPVDeductions(pvId: string) {
    const rows = await this.prisma.financePVDeduction.findMany({
      where: { paymentVoucherId: pvId },
      include: { deductionType: true },
      orderBy: { createdAt: 'asc' },
    });
    return paginatedResponse(rows, { page: 1, per_page: rows.length, total: rows.length });
  }

  // ── Vendor WHT Accruals ──────────────────────────────────────────────────

  async listVendorAccruals(vendorId: string, query: Record<string, any>) {
    const where: any = { vendorId };
    if (query.period_year) where.periodYear = Number(query.period_year);
    if (query.period_month) where.periodMonth = Number(query.period_month);
    if (query.unremitted === 'true') where.remittanceId = null;
    if (query.deduction_type_id) where.deductionTypeId = String(query.deduction_type_id);

    const rows = await this.prisma.financeVendorWHTAccrual.findMany({
      where,
      include: {
        deductionType: true,
        paymentVoucher: { select: { id: true, voucherNumber: true, createdAt: true } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
    return paginatedResponse(rows, { page: 1, per_page: rows.length, total: rows.length });
  }

  // ── WHT Remittances ──────────────────────────────────────────────────────

  async createWHTRemittance(dto: CreateWHTRemittanceDto, userId: number, organizationId?: number) {
    if (!dto.accrual_ids || dto.accrual_ids.length === 0) {
      throw new BadRequestException('accrual_ids must not be empty');
    }

    const accruals = await this.prisma.financeVendorWHTAccrual.findMany({
      where: { id: { in: dto.accrual_ids } },
    });

    const alreadyRemitted = accruals.filter((a) => a.remittanceId !== null);
    if (alreadyRemitted.length > 0) {
      throw new BadRequestException(
        `${alreadyRemitted.length} accrual(s) have already been remitted`,
      );
    }

    const year = dto.period_year;
    const month = String(dto.period_month).padStart(2, '0');
    const seq = await this.prisma.financeWHTRemittance.count({
      where: { periodYear: dto.period_year, periodMonth: dto.period_month },
    });
    const remittanceNumber = `WHT-${year}-${month}-${String(seq + 1).padStart(3, '0')}`;
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const remittance = await tx.financeWHTRemittance.create({
        data: {
          remittanceNumber,
          deductionTypeId: dto.deduction_type_id,
          periodYear: dto.period_year,
          periodMonth: dto.period_month,
          totalAmount: dto.total_amount,
          paidFromAccountId: dto.paid_from_account_id,
          remittanceDate: new Date(dto.remittance_date),
          reference: dto.reference ?? null,
          receiptFileId: dto.receipt_file_id ?? null,
          notes: dto.notes ?? null,
          status: 'pending',
          organizationId: organizationId ? toBigInt(organizationId) : null,
          createdBy: toBigInt(userId),
          updatedAt: now,
        },
      });

      await tx.financeVendorWHTAccrual.updateMany({
        where: { id: { in: dto.accrual_ids } },
        data: { remittanceId: remittance.id, remittedAt: now, updatedAt: now },
      });

      return remittance;
    });
  }

  async listWHTRemittances(query: Record<string, any>) {
    const where: any = {};
    if (query.period_year) where.periodYear = Number(query.period_year);
    if (query.period_month) where.periodMonth = Number(query.period_month);
    if (query.deduction_type_id) where.deductionTypeId = String(query.deduction_type_id);
    if (query.status) where.status = String(query.status);
    if (query.organization_id) where.organizationId = toBigInt(query.organization_id);

    const rows = await this.prisma.financeWHTRemittance.findMany({
      where,
      include: {
        deductionType: true,
        paidFromAccount: { select: { id: true, name: true } },
        accruals: { include: { contact: { select: { id: true, name: true } } } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
    return paginatedResponse(rows, { page: 1, per_page: rows.length, total: rows.length });
  }

  async getWHTRemittance(id: string) {
    const remittance = await this.prisma.financeWHTRemittance.findUnique({
      where: { id },
      include: {
        deductionType: true,
        paidFromAccount: { select: { id: true, name: true } },
        accruals: {
          include: {
            contact: { select: { id: true, name: true, taxNumber: true } },
            paymentVoucher: { select: { id: true, voucherNumber: true } },
          },
        },
      },
    });
    if (!remittance) throw new NotFoundException('WHT remittance not found');
    return remittance;
  }

  // ── Request-level Statutory Deductions ──────────────────────────────────

  async listRequestDeductions(query: StatutoryDeductionsQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(200, Math.max(1, Number(query.per_page ?? 50)));
    const skip = (page - 1) * perPage;

    const where: Prisma.FinanceRequestDeductionWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.deduction_type_id) where.deductionTypeId = query.deduction_type_id;
    if (query.request_id) where.requestId = toBigInt(query.request_id);
    if (query.search) {
      where.request = { data: { path: ['request_number'], string_contains: query.search } };
    }
    if (query.date_from || query.date_to) {
      where.createdAt = {
        ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
        ...(query.date_to ? { lte: new Date(query.date_to) } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.financeRequestDeduction.findMany({
        where,
        include: {
          deductionType: { select: { id: true, name: true, code: true } },
          request: { select: { id: true, createdAt: true, status: true, data: true } },
          createdByUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.financeRequestDeduction.count({ where }),
    ]);

    return {
      data: {
        items: rows,
        pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
      },
    };
  }

  async batchRemitDeductions(dto: RemitStatutoryDeductionsDto, userId: number) {
    const ids = dto.deduction_ids;
    const now = dto.remitted_at ? new Date(dto.remitted_at) : new Date();

    const existing = await this.prisma.financeRequestDeduction.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });

    if (existing.length !== ids.length) {
      throw new NotFoundException('Some deductions were not found');
    }
    const alreadyRemitted = existing.filter((d) => d.status === 'remitted');
    if (alreadyRemitted.length > 0) {
      throw new BadRequestException(`${alreadyRemitted.length} deduction(s) already remitted`);
    }

    await this.prisma.financeRequestDeduction.updateMany({
      where: { id: { in: ids } },
      data: { status: 'remitted', remittedAt: now, remittanceRef: dto.reference, notes: dto.notes ?? null },
    });

    return { updated: ids.length };
  }
}
