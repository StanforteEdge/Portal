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
import { PdfService } from '../../common/pdf/pdf.service';

@Injectable()
export class DeductionService {
  private readonly logger = new Logger(DeductionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  // ── PDF Helpers ───────────────────────────────────────────────────────────

  private fmtMoney(amount: any, currency = 'NGN'): string {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
  }

  private fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private esc(s: string | null | undefined): string {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private async fetchOrgSettings(): Promise<{ org_name: string; prepared_by: string; prepared_title: string }> {
    const row = await this.prisma.financeSetting.findUnique({ where: { key: 'default' }, select: { config: true } });
    const cfg: any = (row?.config && typeof row.config === 'object' && !Array.isArray(row.config)) ? row.config : {};
    return {
      org_name: cfg?.org_name ?? cfg?.organization_name ?? 'The Organisation',
      prepared_by: cfg?.prepared_by?.name ?? '',
      prepared_title: cfg?.prepared_by?.title ?? 'Accountant',
    };
  }

  private pdfDocStyle(): string {
    return `
      @page { size: A4; margin: 14mm; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; }
      h1 { font-size: 18px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
      .subtitle { text-align: center; font-size: 11px; color: #475569; margin: 0 0 16px; }
      .ref-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 14px; font-weight: 700; padding: 4px 14px; border-radius: 4px; letter-spacing: 1px; margin-bottom: 16px; }
      .section { margin-bottom: 16px; }
      .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
      table.fields { width: 100%; border-collapse: collapse; }
      table.fields td { padding: 6px 8px; vertical-align: top; }
      table.fields td:first-child { width: 38%; font-weight: 600; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; }
      table.fields td:last-child { border: 1px solid #e2e8f0; }
      .amount-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 6px; padding: 10px 14px; margin: 16px 0; text-align: center; }
      .amount-box .label { font-size: 10px; text-transform: uppercase; color: #15803d; font-weight: 600; }
      .amount-box .value { font-size: 22px; font-weight: 700; color: #15803d; }
      .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; text-align: center; }
      .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
      .sig-box { border-top: 1px solid #111; padding-top: 6px; font-size: 10px; }
    `;
  }

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
          paidFromAccount: { select: { id: true, name: true, bankName: true, accountNumber: true } },
          evidenceFile: { select: { id: true, fileName: true, publicUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.financeRequestDeduction.count({ where }),
    ]);

    return {
      data: {
        items: rows.map((d: any) => ({
          id: d.id,
          request_id: String(d.requestId),
          request_number: (d.request?.data as any)?.request_number ?? String(d.requestId),
          deduction_type_id: d.deductionTypeId,
          deduction_type_name: d.deductionType?.name ?? '',
          deduction_type_code: d.deductionType?.code ?? '',
          amount: Number(d.amount),
          rate: Number(d.rate),
          gross_amount: Number(d.grossAmount),
          status: d.status,
          remittance_number: d.remittanceNumber ?? null,
          remitted_at: d.remittedAt?.toISOString() ?? null,
          remittance_ref: d.remittanceRef ?? null,
          paid_from_account: d.paidFromAccount ? {
            id: d.paidFromAccount.id,
            name: d.paidFromAccount.name,
            bank_name: d.paidFromAccount.bankName ?? null,
            account_number: d.paidFromAccount.accountNumber ?? null,
          } : null,
          evidence_file: d.evidenceFile ? {
            id: d.evidenceFile.id,
            file_name: d.evidenceFile.fileName,
            public_url: d.evidenceFile.publicUrl ?? null,
          } : null,
          notes: d.notes ?? null,
          created_by_name: d.createdByUser
            ? `${d.createdByUser.firstName || ''} ${d.createdByUser.lastName || ''}`.trim()
            : '',
          created_at: d.createdAt.toISOString(),
        })),
        pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
      },
    };
  }

  async batchRemitDeductions(dto: RemitStatutoryDeductionsDto, userId: number) {
    const ids = dto.deduction_ids;
    const now = dto.remitted_at ? new Date(dto.remitted_at) : new Date();
    const year = now.getFullYear();

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

    // Count existing remittances this year to generate sequential TRM numbers
    const existingCount = await this.prisma.financeRequestDeduction.count({
      where: { remittanceNumber: { not: null }, remittedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    });

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        const remittanceNumber = `TRM/${year}/${String(existingCount + i + 1).padStart(3, '0')}`;
        await tx.financeRequestDeduction.update({
          where: { id: ids[i] },
          data: {
            status: 'remitted',
            remittanceNumber,
            remittedAt: now,
            remittanceRef: dto.reference,
            paidFromAccountId: dto.paid_from_account_id ?? null,
            evidenceFileId: dto.evidence_file_id ?? null,
            notes: dto.notes ?? null,
          },
        });
      }
    });

    return { updated: ids.length };
  }

  // ── TRM Slip PDF ──────────────────────────────────────────────────────────

  async generateTrmSlipPdf(id: string) {
    const d = await this.prisma.financeRequestDeduction.findUnique({
      where: { id },
      include: {
        deductionType: true,
        request: { select: { id: true, status: true, data: true, createdAt: true } },
        createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        paidFromAccount: { select: { id: true, name: true, bankName: true, accountNumber: true } },
        evidenceFile: { select: { id: true, fileName: true, publicUrl: true } },
      },
    });
    if (!d) throw new NotFoundException('Deduction not found');
    if (d.status !== 'remitted') throw new BadRequestException('Deduction has not been remitted yet — no TRM slip available');

    const org = await this.fetchOrgSettings();
    const requestNumber = (d.request?.data as any)?.request_number ?? String(d.requestId);
    const creatorName = d.createdByUser
      ? `${d.createdByUser.firstName ?? ''} ${d.createdByUser.lastName ?? ''}`.trim() || d.createdByUser.email
      : '—';

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>${this.pdfDocStyle()}</style></head><body>
<h1>${this.esc(org.org_name)}</h1>
<p class="subtitle">Tax Remittance Slip</p>
<div style="text-align:center;"><span class="ref-badge">${this.esc(d.remittanceNumber ?? '—')}</span></div>

<div class="section">
  <div class="section-title">Remittance Details</div>
  <table class="fields"><tbody>
    <tr><td>Remittance Date</td><td>${this.fmtDate(d.remittedAt)}</td></tr>
    <tr><td>Remittance Reference</td><td>${this.esc(d.remittanceRef ?? '—')}</td></tr>
    <tr><td>Paid From Account</td><td>${d.paidFromAccount ? `${this.esc(d.paidFromAccount.name)}${d.paidFromAccount.bankName ? ` — ${this.esc(d.paidFromAccount.bankName)}` : ''}${d.paidFromAccount.accountNumber ? ` (${this.esc(d.paidFromAccount.accountNumber)})` : ''}` : '—'}</td></tr>
  </tbody></table>
</div>

<div class="section">
  <div class="section-title">Deduction Detail</div>
  <table class="fields"><tbody>
    <tr><td>Deduction Type</td><td>${this.esc(d.deductionType.name)} (${this.esc(d.deductionType.code)})</td></tr>
    <tr><td>Rate</td><td>${(Number(d.rate) * 100).toFixed(1)}%</td></tr>
    <tr><td>Gross Invoice Amount</td><td>${this.fmtMoney(d.grossAmount)}</td></tr>
    <tr><td>Amount Withheld</td><td><strong>${this.fmtMoney(d.amount)}</strong></td></tr>
  </tbody></table>
</div>

<div class="amount-box">
  <div class="label">Total Remitted</div>
  <div class="value">${this.fmtMoney(d.amount)}</div>
</div>

<div class="section">
  <div class="section-title">Source Transaction</div>
  <table class="fields"><tbody>
    <tr><td>Request Number</td><td>${this.esc(requestNumber)}</td></tr>
    <tr><td>Created By</td><td>${this.esc(creatorName)}</td></tr>
    <tr><td>Deduction Created</td><td>${this.fmtDate(d.createdAt)}</td></tr>
  </tbody></table>
</div>

${d.notes ? `<div class="section"><div class="section-title">Notes</div><p style="margin:0;">${this.esc(d.notes)}</p></div>` : ''}

<div class="sig-row">
  <div class="sig-box">${org.prepared_by ? this.esc(org.prepared_by) : '____________________'}<br/>${this.esc(org.prepared_title)}</div>
  <div class="sig-box">Date: ${this.fmtDate(d.remittedAt)}</div>
</div>
<div class="footer">This document was generated on ${this.fmtDate(new Date())}. TRM Reference: ${this.esc(d.remittanceNumber ?? '—')}</div>
</body></html>`;

    const buffer = await this.pdfService.renderPdfFromHtml(html);
    const fileName = `TRM-${(d.remittanceNumber ?? id).replace(/\//g, '-')}.pdf`;
    return { file_name: fileName, mime_type: 'application/pdf', content_base64: buffer.toString('base64') };
  }

  // ── WHT Certificate PDF ───────────────────────────────────────────────────

  async generateWhtCertificatePdf(pvDeductionId: string) {
    const pvd = await this.prisma.financePVDeduction.findUnique({
      where: { id: pvDeductionId },
      include: {
        deductionType: true,
        paymentVoucher: {
          include: {
            request: { select: { id: true, data: true, createdAt: true, creator: { select: { firstName: true, lastName: true, email: true } } } },
            contact: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!pvd) throw new NotFoundException('PV deduction not found');

    const pv = pvd.paymentVoucher;
    const request = pv.request;
    const requestNumber = (request?.data as any)?.request_number ?? String(pv.requestId);
    const org = await this.fetchOrgSettings();

    // Look up the corresponding FinanceRequestDeduction for TRM number
    const trmRecord = await this.prisma.financeRequestDeduction.findFirst({
      where: { requestId: pv.requestId, deductionTypeId: pvd.deductionTypeId, status: 'remitted' },
      select: { remittanceNumber: true, remittedAt: true, remittanceRef: true },
      orderBy: { remittedAt: 'desc' },
    });

    const vendorName = pv.contact?.name ?? (request?.creator ? `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() : '—');
    const vendorEmail = pv.contact?.email ?? request?.creator?.email ?? '';

    const pvDate = this.fmtDate(pv.disbursedAt);
    const certDate = trmRecord?.remittedAt ? this.fmtDate(trmRecord.remittedAt) : this.fmtDate(new Date());

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>${this.pdfDocStyle()}</style></head><body>
<h1>${this.esc(org.org_name)}</h1>
<p class="subtitle">Withholding Tax Certificate</p>
${trmRecord?.remittanceNumber ? `<div style="text-align:center;"><span class="ref-badge">${this.esc(trmRecord.remittanceNumber)}</span></div>` : ''}

<div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#475569;">
  This certificate confirms that ${this.esc(org.org_name)} has withheld and remitted
  <strong>${this.esc(pvd.deductionType.name)}</strong> on payment made to the party named below, in accordance with applicable tax regulations.
</div>

<div class="section">
  <div class="section-title">Vendor / Payee</div>
  <table class="fields"><tbody>
    <tr><td>Name</td><td><strong>${this.esc(vendorName)}</strong></td></tr>
    ${vendorEmail ? `<tr><td>Email</td><td>${this.esc(vendorEmail)}</td></tr>` : ''}
    ${pv.contact?.phone ? `<tr><td>Phone</td><td>${this.esc(pv.contact.phone)}</td></tr>` : ''}
  </tbody></table>
</div>

<div class="section">
  <div class="section-title">Payment Details</div>
  <table class="fields"><tbody>
    <tr><td>Request Number</td><td>${this.esc(requestNumber)}</td></tr>
    <tr><td>Payment Voucher</td><td>${this.esc(pv.voucherNumber)}</td></tr>
    <tr><td>Payment Date</td><td>${pvDate}</td></tr>
    <tr><td>Gross Invoice Amount</td><td>${this.fmtMoney(pvd.grossAmount)}</td></tr>
    <tr><td>Net Amount Paid</td><td>${this.fmtMoney(pv.amount)}</td></tr>
  </tbody></table>
</div>

<div class="section">
  <div class="section-title">Tax Deduction</div>
  <table class="fields"><tbody>
    <tr><td>Deduction Type</td><td>${this.esc(pvd.deductionType.name)} (${this.esc(pvd.deductionType.code)})</td></tr>
    <tr><td>Rate Applied</td><td>${(Number(pvd.rate) * 100).toFixed(1)}%</td></tr>
    <tr><td>Amount Withheld</td><td><strong>${this.fmtMoney(pvd.deductionAmount)}</strong></td></tr>
  </tbody></table>
</div>

<div class="amount-box">
  <div class="label">Tax Withheld &amp; Remitted</div>
  <div class="value">${this.fmtMoney(pvd.deductionAmount)}</div>
</div>

${trmRecord ? `
<div class="section">
  <div class="section-title">Remittance Confirmation</div>
  <table class="fields"><tbody>
    <tr><td>TRM Reference</td><td><strong>${this.esc(trmRecord.remittanceNumber ?? '—')}</strong></td></tr>
    <tr><td>Remittance Reference</td><td>${this.esc(trmRecord.remittanceRef ?? '—')}</td></tr>
    <tr><td>Remitted On</td><td>${this.fmtDate(trmRecord.remittedAt)}</td></tr>
  </tbody></table>
</div>` : '<p style="color:#b45309;font-size:11px;">Note: Remittance to tax authority is pending.</p>'}

<div class="sig-row">
  <div class="sig-box">${org.prepared_by ? this.esc(org.prepared_by) : '____________________'}<br/>${this.esc(org.prepared_title)}<br/>Date: ${certDate}</div>
  <div class="sig-box">Authorised Signatory<br/>____________________<br/>Date: _______________</div>
</div>
<div class="footer">This certificate is issued for tax credit purposes. ${trmRecord?.remittanceNumber ? `TRM Ref: ${this.esc(trmRecord.remittanceNumber)}` : ''} — ${this.fmtDate(new Date())}</div>
</body></html>`;

    const buffer = await this.pdfService.renderPdfFromHtml(html);
    const fileName = `WHT-Certificate-${pv.voucherNumber.replace(/\//g, '-')}.pdf`;
    return { file_name: fileName, mime_type: 'application/pdf', content_base64: buffer.toString('base64') };
  }
}
