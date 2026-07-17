import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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

  private async fetchOrgSettings(): Promise<{
    org_name: string;
    prepared_by: string;
    prepared_title: string;
    prepared_signature: string | null;
    approved_by: string;
    approved_title: string;
    approved_signature: string | null;
  }> {
    const row = await this.prisma.financeSetting.findUnique({ where: { key: 'default' }, select: { config: true } });
    const cfg: any = (row?.config && typeof row.config === 'object' && !Array.isArray(row.config)) ? row.config : {};
    const [prepared_signature, approved_signature] = await Promise.all([
      this.resolveSignatureDataUri(cfg?.prepared_by?.signature_file_id),
      this.resolveSignatureDataUri(cfg?.approved_by?.signature_file_id),
    ]);
    return {
      org_name: cfg?.org_name ?? cfg?.organization_name ?? 'The Organisation',
      prepared_by: cfg?.prepared_by?.name ?? '',
      prepared_title: cfg?.prepared_by?.title ?? 'Accountant',
      prepared_signature,
      approved_by: cfg?.approved_by?.name ?? '',
      approved_title: cfg?.approved_by?.title ?? 'Executive Director',
      approved_signature,
    };
  }

  private async resolveSignatureDataUri(fileId: unknown): Promise<string | null> {
    if (typeof fileId !== 'string' || !fileId) return null;
    const asset = await this.prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!asset) return null;
    const storagePath = asset.storagePath || asset.publicUrl || '';
    if (!storagePath) return null;
    const candidates = [
      storagePath,
      resolve(process.cwd(), storagePath),
      resolve(process.cwd(), '..', storagePath),
      resolve(process.cwd(), 'uploads', storagePath),
    ];
    let buf: Buffer | null = null;
    for (const candidate of candidates) {
      if (candidate && existsSync(candidate)) {
        try {
          buf = await readFile(candidate);
          break;
        } catch {
          // continue
        }
      }
    }
    if (!buf) return null;
    const ext = (asset.fileName ?? '').split('.').pop()?.toLowerCase() ?? 'png';
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  }

  private getPdfLogoDataUri(): string | null {
    try {
      const logoPath = process.env.PDF_LOGO_PATH || 'public/branding/logo.png';
      if (require('fs').existsSync(logoPath)) {
        const fileBuffer = require('fs').readFileSync(logoPath);
        const ext = require('path').extname(logoPath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : null;
        if (mime) {
          return `data:${mime};base64,${fileBuffer.toString('base64')}`;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private pdfDocStyle(): string {
    return `
      @page { size: A4; margin: 10mm; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; }
      .card { border: 1px solid #000; border-radius: 6px; margin-bottom: 14px; }
      .rowpad { padding: 12px; border-bottom: 1px solid #000; }
      .rowpad:last-child { border-bottom: 0; }
      .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
      .doc-title { font-size: 18px; font-weight: 700; text-align: right; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; }
      .doc-subtitle { font-size: 11px; color: #475569; text-align: right; margin-top: 4px; }
      .ref-badge { display: inline-block; background: #000; color: #fff; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; letter-spacing: 1px; }
      .two-col { display: table; width: 100%; }
      .two-col > div { display: table-cell; width: 50%; vertical-align: top; padding: 12px; }
      .two-col > div:first-child { border-right: 1px solid #000; }
      .detail-list div { margin-bottom: 5px; }
      .muted { color: #475569; font-size: 11px; }
      .section-title { font-weight: 700; margin-bottom: 6px; font-size: 12px; }
      .tbl { width: 100%; border-collapse: collapse; }
      .tbl th, .tbl td { border: 1px solid #000; padding: 7px; text-align: left; }
      .tbl th { background: #f3f4f6; }
      .amount-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 6px; padding: 10px 14px; margin: 16px 0; text-align: center; }
      .amount-box .label { font-size: 10px; text-transform: uppercase; color: #15803d; font-weight: 600; }
      .amount-box .value { font-size: 22px; font-weight: 700; color: #15803d; }
      .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 10px; }
      .sig-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; margin-bottom: 4px; margin-top: 8px; }
      .sig-line { border-bottom: 1.5px solid #111; height: 36px; margin-bottom: 4px; }
      .sig-name { font-size: 12px; font-weight: 600; }
      .footer-note { font-size: 10px; color: #475569; text-align: center; margin-top: 20px; }
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
      const existingPVDeductions = await tx.financePVDeduction.findMany({
        where: { paymentVoucherId: pvId },
        select: { requestDeductionId: true },
      });
      const linkedRequestDeductionIds = existingPVDeductions
        .map((row) => row.requestDeductionId)
        .filter((value): value is string => Boolean(value));

      // Remove any previously applied deductions for this PV
      await tx.financePVDeduction.deleteMany({ where: { paymentVoucherId: pvId } });
      await tx.financeVendorWHTAccrual.deleteMany({ where: { paymentVoucherId: pvId } });
      if (linkedRequestDeductionIds.length > 0) {
        await tx.financeRequestDeduction.deleteMany({ where: { id: { in: linkedRequestDeductionIds } } });
      }

      const createdDeductions = [] as Array<{ id: string; deductionTypeId: string; grossAmount: Prisma.Decimal; deductionAmount: Prisma.Decimal; requestDeductionId: string | null }>;
      for (const line of dto.deductions) {
        const requestDeduction = pv.requestId
          ? await tx.financeRequestDeduction.create({
              data: {
                requestId: pv.requestId,
                deductionTypeId: line.deduction_type_id,
                amount: line.deduction_amount,
                rate: line.rate,
                grossAmount: line.gross_amount,
                status: 'pending',
                createdBy: toBigInt(userId),
                updatedAt: now,
              },
            })
          : null;

        const deduction = await tx.financePVDeduction.create({
          data: {
            paymentVoucherId: pvId,
            deductionTypeId: line.deduction_type_id,
            requestDeductionId: requestDeduction?.id ?? null,
            rate: line.rate,
            grossAmount: line.gross_amount,
            deductionAmount: line.deduction_amount,
            createdBy: toBigInt(userId),
            updatedAt: now,
          },
        });
        createdDeductions.push(deduction);
      }

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
    const rows = await this.prisma.financePVDeduction.findMany({
      where: { paymentVoucherId: pvId },
      include: { deductionType: true, requestDeduction: true },
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
    if (query.id) where.id = query.id;
    if (query.status) where.status = query.status;
    if (query.deduction_type_id) where.deductionTypeId = query.deduction_type_id;
    if (query.request_id) where.requestId = toBigInt(query.request_id);
    if (query.remittance_ref) where.remittanceRef = query.remittance_ref;
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

  async updatePendingDeduction(id: string, dto: {
    deduction_type_id?: string;
    gross_amount?: number;
    amount?: number;
    rate?: number;
    notes?: string;
  }) {
    const existing = await this.prisma.financeRequestDeduction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Deduction not found');
    if (existing.status !== 'pending') throw new BadRequestException('Only pending deductions can be edited');

    if (dto.deduction_type_id) {
      const dt = await this.prisma.financeDeductionType.findUnique({ where: { id: dto.deduction_type_id } });
      if (!dt) throw new BadRequestException('Invalid deduction_type_id');
    }

    if (dto.gross_amount !== undefined && dto.gross_amount <= 0) {
      throw new BadRequestException('gross_amount must be positive');
    }
    if (dto.amount !== undefined && dto.amount <= 0) {
      throw new BadRequestException('amount must be positive');
    }

    const data: Record<string, any> = {};
    if (dto.deduction_type_id !== undefined) data.deductionTypeId = dto.deduction_type_id;
    if (dto.gross_amount !== undefined) data.grossAmount = dto.gross_amount;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.rate !== undefined) data.rate = dto.rate;
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    return this.prisma.financeRequestDeduction.update({ where: { id }, data });
  }

  async updateRemittanceRecord(id: string, dto: {
    remittance_ref?: string;
    remitted_at?: string;
    paid_from_account_id?: string;
    evidence_file_id?: string;
    notes?: string;
  }) {
    const existing = await this.prisma.financeRequestDeduction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Deduction not found');
    if (existing.status !== 'remitted') throw new BadRequestException('Only remitted deductions can be edited');

    const data: Record<string, any> = {};
    if (dto.remittance_ref !== undefined) data.remittanceRef = dto.remittance_ref || null;
    if (dto.remitted_at !== undefined) data.remittedAt = new Date(dto.remitted_at);
    if (dto.paid_from_account_id !== undefined) data.paidFromAccountId = dto.paid_from_account_id || null;
    if (dto.evidence_file_id !== undefined) data.evidenceFileId = dto.evidence_file_id || null;
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    return this.prisma.financeRequestDeduction.update({ where: { id }, data });
  }

  // ── TRM Slip PDF ──────────────────────────────────────────────────────────

  async listRemittedDeductionsForRequest(requestId: string) {
    return this.prisma.financeRequestDeduction.findMany({
      where: { requestId: toBigInt(requestId), status: 'remitted' },
      select: { id: true, remittanceNumber: true },
      orderBy: { remittedAt: 'asc' },
    });
  }

  async generateTrmSlipPdf(id: string) {
    const { buffer, fileName } = await this.buildTrmSlipPdf(id);
    return { file_name: fileName, mime_type: 'application/pdf', content_base64: buffer.toString('base64') };
  }

  async buildTrmSlipPdf(id: string): Promise<{ buffer: Buffer; fileName: string }> {
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

    const logoDataUri = this.getPdfLogoDataUri();

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>${this.pdfDocStyle()}</style>
</head>
<body>
  <div class="card">
    <div class="rowpad">
      <div class="header-row">
        <div>${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" style="height:42px;" />` : `<strong>${this.esc(org.org_name)}</strong>`}</div>
        <div>
          <div class="doc-title">Tax Remittance Slip</div>
          <div class="doc-subtitle" style="text-align:right; margin-top:4px;">
            <span class="ref-badge">${this.esc(d.remittanceNumber ?? '—')}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="two-col">
      <div>
        <h3 style="margin:0 0 8px;">Remittance Details</h3>
        <div class="detail-list">
          <div><strong>Remittance Date:</strong> ${this.fmtDate(d.remittedAt)}</div>
          <div><strong>Reference Number:</strong> ${this.esc(d.remittanceNumber ?? '—')}</div>
          <div><strong>Payment Reference:</strong> ${this.esc(d.remittanceRef ?? '—')}</div>
          <div><strong>Paid From:</strong> ${d.paidFromAccount ? `${this.esc(d.paidFromAccount.name)}${d.paidFromAccount.bankName ? ` — ${this.esc(d.paidFromAccount.bankName)}` : ''}` : '—'}</div>
        </div>
      </div>
      <div>
        <h3 style="margin:0 0 8px;">Source Transaction</h3>
        <div class="detail-list">
          <div><strong>Request Number:</strong> ${this.esc(requestNumber)}</div>
          <div><strong>Created By:</strong> ${this.esc(creatorName)}</div>
          <div><strong>Deduction Created:</strong> ${this.fmtDate(d.createdAt)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="rowpad">
      <h3 style="margin:0 0 8px;">Deduction Detail</h3>
      <table class="tbl">
        <thead>
          <tr>
            <th>Deduction Type</th>
            <th>Rate</th>
            <th>Gross Invoice Amount</th>
            <th>Amount Withheld</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${this.esc(d.deductionType.name)} (${this.esc(d.deductionType.code)})</td>
            <td>${(Number(d.rate) * 100).toFixed(1)}%</td>
            <td>${this.fmtMoney(d.grossAmount)}</td>
            <td><strong>${this.fmtMoney(d.amount)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="amount-box">
    <div class="label">Total Remitted</div>
    <div class="value">${this.fmtMoney(d.amount)}</div>
  </div>

  ${d.notes ? `
  <div class="card">
    <div class="rowpad">
      <h3 style="margin:0 0 6px;">Notes</h3>
      <p style="margin:0; line-height:1.6;">${this.esc(d.notes)}</p>
    </div>
  </div>` : ''}

  <div class="card">
    <div class="rowpad">
      <strong>Signatures</strong>
      <div class="sig-grid" style="margin-top:10px;">
        <div>
          <div class="sig-label">Prepared By</div>
          ${org.prepared_signature ? `<img src="${org.prepared_signature}" alt="Signature" style="height:36px; display:block; margin-bottom:4px;" />` : '<div class="sig-line"></div>'}
          <div class="sig-name">${org.prepared_by ? this.esc(org.prepared_by) : '____________________'}</div>
          <div class="muted">${this.esc(org.prepared_title)}</div>
        </div>
        <div>
          <div class="sig-label">Date</div>
          <div class="sig-line"></div>
          <div class="sig-name">${this.fmtDate(d.remittedAt)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-note">
    This document was generated on ${this.fmtDate(new Date())}. TRM Reference: ${this.esc(d.remittanceNumber ?? '—')}
  </div>
</body>
</html>`;

    const buffer = await this.pdfService.renderPdfFromHtml(html, [
      'TAX REMITTANCE SLIP',
      `Reference: ${d.remittanceNumber ?? '—'}`,
      `Amount: ${this.fmtMoney(d.amount)}`,
      `Remitted: ${this.fmtDate(d.remittedAt)}`,
    ]);
    const fileName = `TRM-${(d.remittanceNumber ?? id).replace(/\//g, '-')}.pdf`;
    return { buffer, fileName };
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
        requestDeduction: {
          select: { remittanceNumber: true, remittedAt: true, remittanceRef: true },
        },
      },
    });
    if (!pvd) throw new NotFoundException('PV deduction not found');

    let certificateNumber = pvd.certificateNumber;
    if (!certificateNumber) {
      const year = new Date().getFullYear();
      const startsWith = `WHT/${year}/`;
      const count = await this.prisma.financePVDeduction.count({
        where: { certificateNumber: { startsWith } },
      });
      certificateNumber = `WHT/${year}/${String(count + 1).padStart(3, '0')}`;
      await this.prisma.financePVDeduction.update({
        where: { id: pvd.id },
        data: { certificateNumber },
      });
    }

    const pv = pvd.paymentVoucher;
    const request = pv.request;
    const requestNumber = (request?.data as any)?.request_number ?? String(pv.requestId);
    const org = await this.fetchOrgSettings();

    const trmRecord = pvd.requestDeduction?.remittedAt ? pvd.requestDeduction : null;

    const vendorName = pv.contact?.name ?? (request?.creator ? `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() : '—');
    const vendorEmail = pv.contact?.email ?? request?.creator?.email ?? '';

    const pvDate = this.fmtDate(pv.disbursedAt);
    const certDate = trmRecord?.remittedAt ? this.fmtDate(trmRecord.remittedAt) : this.fmtDate(new Date());

    const logoDataUri = this.getPdfLogoDataUri();

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>${this.pdfDocStyle()}</style>
</head>
<body>
  <div class="card">
    <div class="rowpad">
      <div class="header-row">
        <div>${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" style="height:42px;" />` : `<strong>${this.esc(org.org_name)}</strong>`}</div>
        <div>
          <div class="doc-title">Withholding Tax Certificate</div>
          <div class="doc-subtitle" style="text-align:right; margin-top:4px;">
            <span class="ref-badge">${this.esc(certificateNumber)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="rowpad" style="background:#fafafa; font-size:11px; color:#475569; line-height:1.6;">
      This certificate confirms that ${this.esc(org.org_name)} has withheld and remitted
      <strong>${this.esc(pvd.deductionType.name)}</strong> on payment made to the party named below, in accordance with applicable tax regulations.
    </div>

    <div class="two-col">
      <div>
        <h3 style="margin:0 0 8px;">Vendor / Payee</h3>
        <div class="detail-list">
          <div><strong>Name:</strong> <strong>${this.esc(vendorName)}</strong></div>
          ${vendorEmail ? `<div><strong>Email:</strong> ${this.esc(vendorEmail)}</div>` : ''}
          ${pv.contact?.phone ? `<div><strong>Phone:</strong> ${this.esc(pv.contact.phone)}</div>` : ''}
        </div>
      </div>
      <div>
        <h3 style="margin:0 0 8px;">Payment Details</h3>
        <div class="detail-list">
          <div><strong>Certificate No:</strong> ${this.esc(certificateNumber)}</div>
          <div><strong>Request Number:</strong> ${this.esc(requestNumber)}</div>
          <div><strong>Payment Voucher:</strong> ${this.esc(pv.voucherNumber)}</div>
          <div><strong>Payment Date:</strong> ${pvDate}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="rowpad">
      <h3 style="margin:0 0 8px;">Tax Deduction</h3>
      <table class="tbl">
        <thead>
          <tr>
            <th>Deduction Type</th>
            <th>Rate</th>
            <th>Gross Invoice Amount</th>
            <th>Amount Withheld</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${this.esc(pvd.deductionType.name)} (${this.esc(pvd.deductionType.code)})</td>
            <td>${(Number(pvd.rate) * 100).toFixed(1)}%</td>
            <td>${this.fmtMoney(pvd.grossAmount)}</td>
            <td><strong>${this.fmtMoney(pvd.deductionAmount)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="amount-box">
    <div class="label">Tax Withheld &amp; Remitted</div>
    <div class="value">${this.fmtMoney(pvd.deductionAmount)}</div>
  </div>

  <div class="card">
    <div class="rowpad">
      <h3 style="margin:0 0 8px;">Remittance Confirmation</h3>
      ${trmRecord ? `
      <table class="tbl">
        <thead>
          <tr>
            <th>TRM Reference</th>
            <th>Remittance Reference</th>
            <th>Remitted On</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${this.esc(trmRecord.remittanceNumber ?? '—')}</strong></td>
            <td>${this.esc(trmRecord.remittanceRef ?? '—')}</td>
            <td>${this.fmtDate(trmRecord.remittedAt)}</td>
          </tr>
        </tbody>
      </table>
      ` : '<p style="color:#b45309; font-size:11px; margin:0;">Note: Remittance to tax authority is pending.</p>'}
    </div>
  </div>

  <div class="card">
    <div class="rowpad">
      <strong>Signatures</strong>
      <div class="sig-grid" style="margin-top:10px;">
        <div>
          <div class="sig-label">Prepared By</div>
          ${org.prepared_signature ? `<img src="${org.prepared_signature}" alt="Signature" style="height:36px; display:block; margin-bottom:4px;" />` : '<div class="sig-line"></div>'}
          <div class="sig-name">${org.prepared_by ? this.esc(org.prepared_by) : '____________________'}</div>
          <div class="muted">${this.esc(org.prepared_title)}</div>
          <div class="muted">Date: ${certDate}</div>
        </div>
        <div>
          <div class="sig-label">Authorised Signatory</div>
          ${org.approved_signature ? `<img src="${org.approved_signature}" alt="Signature" style="height:36px; display:block; margin-bottom:4px;" />` : '<div class="sig-line"></div>'}
          <div class="sig-name">${org.approved_by ? this.esc(org.approved_by) : '____________________'}</div>
          <div class="muted">${this.esc(org.approved_title)}</div>
          <div class="muted">Date: _______________</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-note">
    This certificate is issued for tax credit purposes. Certificate No: ${this.esc(certificateNumber)}${trmRecord?.remittanceNumber ? ` — TRM Ref: ${this.esc(trmRecord.remittanceNumber)}` : ''} — ${this.fmtDate(new Date())}
  </div>
</body>
</html>`;

    const buffer = await this.pdfService.renderPdfFromHtml(html, [
      'WITHHOLDING TAX CERTIFICATE',
      `Certificate No: ${certificateNumber}`,
      `Payment Voucher: ${pv.voucherNumber}`,
      `Vendor: ${vendorName}`,
      `Amount Withheld: ${this.fmtMoney(pvd.deductionAmount)}`,
    ]);
    const fileName = `WHT-Certificate-${certificateNumber.replace(/\//g, '-')}.pdf`;
    return { file_name: fileName, mime_type: 'application/pdf', content_base64: buffer.toString('base64') };
  }
}
