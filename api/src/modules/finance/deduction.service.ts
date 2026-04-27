import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { UpsertDeductionTypeDto } from './dto/upsert-deduction-type.dto';
import { ApplyPVDeductionsDto } from './dto/apply-pv-deductions.dto';
import { CreateWHTRemittanceDto } from './dto/create-wht-remittance.dto';

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

    return this.prisma.financeDeductionType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { glAccount: { select: { id: true, name: true, code: true } } },
    });
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
    return this.prisma.financePVDeduction.findMany({
      where: { paymentVoucherId: pvId },
      include: { deductionType: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Vendor WHT Accruals ──────────────────────────────────────────────────

  async listVendorAccruals(vendorId: string, query: Record<string, any>) {
    const where: any = { vendorId };
    if (query.period_year) where.periodYear = Number(query.period_year);
    if (query.period_month) where.periodMonth = Number(query.period_month);
    if (query.unremitted === 'true') where.remittanceId = null;
    if (query.deduction_type_id) where.deductionTypeId = String(query.deduction_type_id);

    return this.prisma.financeVendorWHTAccrual.findMany({
      where,
      include: {
        deductionType: true,
        paymentVoucher: { select: { id: true, voucherNumber: true, createdAt: true } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
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

    return this.prisma.financeWHTRemittance.findMany({
      where,
      include: {
        deductionType: true,
        paidFromAccount: { select: { id: true, name: true } },
        accruals: { include: { contact: { select: { id: true, name: true } } } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
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
}
