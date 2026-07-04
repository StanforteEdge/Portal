import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { MailService } from '../mail/mail.service';
import { toBigInt } from '../utils/ids';
import {
  Document,
  DocumentIds,
  DocumentOutput,
  ThreadEntry,
  RequestThread,
  DocumentResponse,
  EmailDeliveryResponse,
  Signatories,
  ApprovalSummary,
  FullPaymentVoucher,
} from './document.types';

@Injectable()
export class DocumentGeneratorService {
  constructor(
    readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
  ) {}

  // ── Orchestration ─────────────────────────────────────────────────────────

  async generate(
    document: Document<any>,
    ids: DocumentIds,
    userId: string,
  ): Promise<DocumentResponse> {
    const generatedAt = new Date();
    const ctx = await document.fetchContext(ids);
    const output = await document.render(ctx);
    if (ids.requestId) {
      await this.recordArtifact(toBigInt(ids.requestId), {
        type: output.artifactType,
        file_name: output.fileName,
        generated_by: userId,
        generated_at: generatedAt.toISOString(),
      });
    }
    return this.wrapResponse(output, ids.requestId, generatedAt);
  }

  async generateWithEmailDelivery(
    document: Document<any>,
    ids: DocumentIds,
    userId: string,
    delivery: {
      mode: 'email' | 'download';
      email_to?: string;
      requestNumber: string;
      creatorEmail: string;
    },
  ): Promise<DocumentResponse | EmailDeliveryResponse> {
    const generatedAt = new Date();
    const ctx = await document.fetchContext(ids);
    const output = await document.render(ctx);
    if (ids.requestId) {
      await this.recordArtifact(toBigInt(ids.requestId), {
        type: output.artifactType,
        file_name: output.fileName,
        generated_by: userId,
        generated_at: generatedAt.toISOString(),
      });
    }
    if (delivery.mode === 'email') {
      const recipient = delivery.email_to?.trim() || delivery.creatorEmail;
      if (!recipient) throw new BadRequestException('No recipient email available for package delivery');
      await this.mailService.send({
        to: recipient,
        subject: `Full Request Package - ${delivery.requestNumber}`,
        text: `Attached is the full request package for ${delivery.requestNumber}.`,
        threadKey: `request-${ids.requestId}-full-package`,
        userId,
        notifiableType: 'request',
        notifiableId: ids.requestId ? toBigInt(ids.requestId) : undefined,
        attachments: [{ filename: output.fileName, content: output.buffer, contentType: output.mimeType }],
      });
      return {
        success: true,
        delivery: 'email',
        email_to: recipient,
        file_name: output.fileName,
        request_id: ids.requestId,
      };
    }
    return this.wrapResponse(output, ids.requestId, generatedAt);
  }

  wrapResponse(output: DocumentOutput, requestId: string | undefined, generatedAt: Date): DocumentResponse {
    return {
      file_name: output.fileName,
      mime_type: output.mimeType,
      content_base64: output.buffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      ...(requestId ? { request_id: requestId } : {}),
    };
  }

  // ── Data Fetchers ─────────────────────────────────────────────────────────

  async fetchRequest(id: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) },
      include: this.getRequestInclude(),
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async fetchSignatories(): Promise<Signatories> {
    const row = await this.prisma.financeSetting.findUnique({
      where: { key: 'default' },
      select: { config: true },
    });
    const data =
      row?.config && typeof row.config === 'object' && !Array.isArray(row.config)
        ? (row.config as Record<string, any>)
        : {};
    return {
      prepared_by: { name: data?.prepared_by?.name ?? '', title: data?.prepared_by?.title ?? 'Accountant' },
      reviewed_by: { name: data?.reviewed_by?.name ?? '', title: data?.reviewed_by?.title ?? 'Finance Manager / COO' },
      approved_by: { name: data?.approved_by?.name ?? '', title: data?.approved_by?.title ?? 'Executive Director' },
    };
  }

  async fetchApprovals(workflowInstanceId: string | null | undefined): Promise<ApprovalSummary> {
    if (!workflowInstanceId) return { done: [], pending: [] };
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: workflowInstanceId },
      include: {
        currentStep: { include: { approvers: true } },
        history: { orderBy: { createdAt: 'asc' } },
        workflow: { include: { steps: true } },
      },
    });
    if (!instance) return { done: [], pending: [] };
    const stepMap = new Map(instance.workflow.steps.map((s) => [s.id, s.name]));
    const performerIds = Array.from(
      new Set(
        instance.history
          .map((e) => (e.performedBy ? e.performedBy.toString() : null))
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const performers = performerIds.length
      ? await this.prisma.profile.findMany({
          where: { id: { in: performerIds.map((id) => toBigInt(id)) } },
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        })
      : [];
    const performerMap = new Map(
      performers.map((u) => {
        const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
        return [u.id.toString(), { name: name || u.username || u.email, email: u.email ?? null }];
      }),
    );
    const done = instance.history
      .filter((e) => ['approve', 'reject', 'auto_approve'].includes(e.action))
      .map((e) => ({
        action: e.action,
        step: e.fromStepId ? stepMap.get(e.fromStepId) ?? 'Unknown step' : 'Unknown step',
        performed_by: e.performedBy ? e.performedBy.toString() : null,
        performed_by_name: e.performedBy ? (performerMap.get(e.performedBy.toString())?.name ?? null) : null,
        performed_by_email: e.performedBy ? (performerMap.get(e.performedBy.toString())?.email ?? null) : null,
        comment: e.comment,
        at: e.createdAt,
      }));
    const pending =
      instance.status === 'pending' && instance.currentStep
        ? instance.currentStep.approvers.map((a) => ({
            step: instance.currentStep?.name ?? 'Current step',
            approver_type: a.approverType,
            approver_id: a.approverId,
          }))
        : [];
    return { done, pending };
  }

  async fetchPaymentVouchers(requestId: string): Promise<FullPaymentVoucher[]> {
    return this.prisma.financePaymentVoucher.findMany({
      where: { requestId: toBigInt(requestId) },
      include: {
        deductions: { include: { deductionType: true } },
        evidenceFile: true,
        attachments: {
          where: { fileKind: 'evidence' },
          include: { file: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { disbursedAt: 'asc' },
    }) as any;
  }

  async fetchPaymentVoucher(requestId: string, voucherId: string): Promise<FullPaymentVoucher> {
    const pv = await this.prisma.financePaymentVoucher.findFirst({
      where: { requestId: toBigInt(requestId), id: voucherId },
      include: {
        deductions: { include: { deductionType: true } },
        evidenceFile: true,
        attachments: {
          where: { fileKind: 'evidence' },
          include: { file: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!pv) throw new NotFoundException('Payment voucher not found');
    return pv as any;
  }

  async recordArtifact(requestId: bigint, artifact: Record<string, string>) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      select: { data: true },
    });
    const base =
      request?.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? ({ ...(request.data as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    const currentArtifacts = Array.isArray(base.generated_artifacts) ? (base.generated_artifacts as unknown[]) : [];
    await this.prisma.requestInstance.update({
      where: { id: requestId },
      data: {
        data: {
          ...base,
          ...(artifact.voucher_no ? { voucher_number: artifact.voucher_no } : {}),
          generated_artifacts: [...currentArtifacts, artifact],
        } as Prisma.InputJsonValue,
      },
    });
  }

  async readAssetFileBuffer(asset: {
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
      resolve(process.cwd(), 'uploads', storagePath),
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (existsSync(candidate)) {
        try {
          return await readFile(candidate);
        } catch {
          // continue
        }
      }
    }
    if (/^https?:\/\//i.test(storagePath)) {
      try {
        const res = await fetch(storagePath);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
      } catch {
        // ignore
      }
    }
    return null;
  }

  async resolveNameFromReference(
    value: unknown,
    kind: 'team' | 'organization' | 'taxonomy_term',
  ): Promise<string> {
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

  // ── PDF / ZIP Rendering ───────────────────────────────────────────────────

  async renderPdfFromHtml(html: string, fallbackLines: string[]): Promise<Buffer> {
    try {
      return await this.pdfService.renderPdfFromHtml(html);
    } catch (error: any) {
      const suffix = error?.message ? String(error.message).slice(0, 120) : 'renderer error';
      return this.buildSimplePdfFallback([...fallbackLines, `PDF renderer fallback: ${suffix}`]);
    }
  }

  buildSimplePdfFallback(lines: string[]): Buffer {
    const sanitized = lines.map((line) =>
      String(line).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'),
    );
    const stream = [
      'BT',
      '/F1 11 Tf',
      '50 790 Td',
      '14 TL',
      ...sanitized.map((line, index) => (index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)),
      'ET',
    ].join('\n');
    const header = '%PDF-1.4\n';
    const objects: string[] = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
      `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
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
      '%%EOF',
    ].join('\n');
    return Buffer.from(`${header}${body}${xrefLines.join('\n')}\n${trailer}\n`, 'utf8');
  }

  async buildZipPackage(entries: Array<{ path: string; buffer: Buffer }>): Promise<Buffer> {
    const zip = new JSZip();
    for (const entry of entries) zip.file(entry.path, entry.buffer);
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  async buildMergedPdf(): Promise<PDFDocument> {
    return PDFDocument.create();
  }

  async appendPdfBuffer(target: PDFDocument, pdfBuffer: Buffer) {
    const source = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = await target.copyPages(source, source.getPageIndices());
    for (const page of pages) target.addPage(page);
  }

  async appendAssetToPdf(
    target: PDFDocument,
    fileBuffer: Buffer | null,
    fileName: string,
    mimeType: string | null | undefined,
    skippedFiles: string[],
  ) {
    if (!fileBuffer) {
      skippedFiles.push(`${fileName} (missing file)`);
      return;
    }
    const mime = String(mimeType || '').toLowerCase();
    const ext = extname(fileName).toLowerCase();
    if (mime === 'application/pdf' || ext === '.pdf') {
      await this.appendPdfBuffer(target, fileBuffer);
      return;
    }
    if (mime === 'image/png' || ext === '.png') {
      const image = await target.embedPng(fileBuffer);
      await this.appendImagePage(target, image, fileName);
      return;
    }
    if (['image/jpeg', 'image/jpg'].includes(mime) || ['.jpg', '.jpeg'].includes(ext)) {
      const image = await target.embedJpg(fileBuffer);
      await this.appendImagePage(target, image, fileName);
      return;
    }
    skippedFiles.push(fileName);
  }

  async appendImagePage(
    target: PDFDocument,
    image: { width: number; height: number; scale: (f: number) => { width: number; height: number } },
    label: string,
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
      height: dims.height,
    });
    const font = await target.embedFont(StandardFonts.Helvetica);
    page.drawText(label, { x: margin, y: page.getHeight() - margin + 4, size: 10, font });
  }

  async appendTextPage(target: PDFDocument, title: string, lines: string[]) {
    const page = target.addPage([595.28, 841.89]);
    const font = await target.embedFont(StandardFonts.Helvetica);
    const bold = await target.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, { x: 40, y: 800, size: 16, font: bold });
    let y = 772;
    for (const line of lines) {
      page.drawText(line, { x: 40, y, size: 11, font });
      y -= 16;
      if (y < 50) break;
    }
  }

  // ── Formatting Utilities ──────────────────────────────────────────────────

  formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(value: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  formatDateTime(value: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  compactDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  toTitle(input: string): string {
    return input.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  paymentMethodLabel(method: string | null): string {
    return method ? this.toTitle(method) : '-';
  }

  zipSafeName(value: string): string {
    return String(value || '')
      .replace(/[\\/]+/g, '-')
      .replace(/[ -]+/g, '')
      .trim();
  }

  getRequestNumber(codePrefix: string | undefined, year: number, requestId: bigint): string {
    const rawPrefix = (codePrefix || 'REQ').toUpperCase();
    const prefix = rawPrefix.includes('PC') ? 'PC' : rawPrefix.includes('OP') ? 'OP' : rawPrefix;
    return `${prefix}/${year}/${requestId.toString()}`;
  }

  resolveTotalAmount(request: {
    totalAmount: any;
    items: Array<{ amount: any; quantity: number }>;
  }): number {
    if (request.totalAmount !== null) return Number(request.totalAmount);
    return request.items.reduce((sum, item) => sum + Number(item.amount) * item.quantity, 0);
  }

  getPdfLogoDataUri(): string | null {
    const candidates = [
      process.env.PDF_LOGO_PATH,
      resolve(process.cwd(), 'public/branding/logo.png'),
      resolve(process.cwd(), '../PWA/public/logo/logo.png'),
      resolve(process.cwd(), 'public/logo/logo.png'),
    ].filter((v): v is string => Boolean(v));
    for (const path of candidates) {
      if (!existsSync(path)) continue;
      try {
        const ext = extname(path).toLowerCase();
        const mime =
          ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const data = readFileSync(path);
        return `data:${mime};base64,${data.toString('base64')}`;
      } catch {
        continue;
      }
    }
    return null;
  }

  amountToWords(amount: number): string {
    const units = [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
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
    return `${toWords(Math.max(0, Math.floor(amount)))} Naira Only`;
  }

  // ── HTML Builders ─────────────────────────────────────────────────────────

  renderApprovalRoleRow(input: {
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

  renderVoucherPageHtml(input: {
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
    approvalsThread?: Array<{
      step: string;
      action: string;
      performed_by_name?: string | null;
      performed_by_email?: string | null;
      comment?: string | null;
      at: Date | string;
    }>;
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
          ${input.cooDone ? `<div class="approval"><div><strong>[✓] Approved By (COO):</strong> ${this.escapeHtml(input.cooBy)}</div><div class="muted">${this.escapeHtml(input.cooDate)}</div></div>` : ''}
          ${input.edDone ? `<div class="approval"><div><strong>[✓] Approved By (ED):</strong> ${this.escapeHtml(input.edBy)}</div><div class="muted">${this.escapeHtml(input.edDate)}</div></div>` : ''}
          ${input.remarks ? `<div class="row"><strong>Remarks:</strong><div>${this.escapeHtml(input.remarks)}</div></div>` : ''}
          ${input.approvalsThread && input.approvalsThread.length > 0 ? `
          <div style="margin-top:12px;"><strong>Approval Thread:</strong></div>
          ${input.approvalsThread.map((entry) => {
            const actor = [
              entry.performed_by_name ? this.escapeHtml(entry.performed_by_name) : null,
              entry.performed_by_email ? `&lt;${this.escapeHtml(entry.performed_by_email)}&gt;` : null,
            ].filter(Boolean).join(' ');
            const actionLabel = entry.action === 'reject' ? 'Rejected' : entry.action === 'auto_approve' ? 'Auto-approved' : 'Approved';
            const commentText = entry.comment ? this.escapeHtml(entry.comment) : actionLabel;
            return `<div class="approval"><div><strong>${this.escapeHtml(entry.step)}</strong>${actor ? ` — ${actor}` : ''}</div><div class="muted">${this.escapeHtml(this.formatDateTime(entry.at))}</div><div style="margin-top:4px;">✓ ${commentText}</div></div>`;
          }).join('')}` : ''}
        </div>
      </div>
    </div>`;
  }

  renderCertificateHtml(input: {
    logoDataUri: string | null;
    signatureDataUri: string | null;
    staffName: string;
    requestLabel: string;
    voucherNumber: string;
    amountLabel: string;
    declaration: string;
    reason: string;
    issuedAt: string;
  }): string {
    const sigBlock = input.signatureDataUri
      ? `<img src="${input.signatureDataUri}" alt="Signature" style="height:52px; display:block; margin-bottom:4px;" />`
      : `<div style="border-bottom:1.5px solid #111; width:220px; height:36px; margin-bottom:4px;"></div>`;

    return `<!doctype html>
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
    .doc-title { font-size: 20px; font-weight: 700; text-align: right; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; }
    .doc-subtitle { font-size: 11px; color: #475569; text-align: right; margin-top: 4px; }
    .two-col { display: table; width: 100%; }
    .two-col > div { display: table-cell; width: 50%; vertical-align: top; padding: 12px; }
    .two-col > div:first-child { border-right: 1px solid #000; }
    .detail-list div { margin-bottom: 5px; }
    .muted { color: #475569; font-size: 11px; }
    .section-title { font-weight: 700; margin-bottom: 6px; }
    .text-block { background: #f9fafb; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 12px; line-height: 1.7; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 10px; }
    .sig-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; margin-bottom: 4px; margin-top: 8px; }
    .sig-line { border-bottom: 1.5px solid #111; height: 36px; margin-bottom: 4px; }
    .sig-name { font-size: 12px; font-weight: 600; }
    .footer-note { font-size: 10px; color: #475569; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="rowpad">
      <div class="header-row">
        <div>${input.logoDataUri ? `<img src="${input.logoDataUri}" alt="Logo" style="height:42px;" />` : '<strong>Stanforte Edge</strong>'}</div>
        <div>
          <div class="doc-title">Certificate of Honor</div>
          <div class="doc-subtitle">Cash Advance Retirement Declaration</div>
        </div>
      </div>
    </div>
    <div class="two-col">
      <div>
        <div class="detail-list">
          <div><strong>Staff Member:</strong> ${this.escapeHtml(input.staffName)}</div>
          <div><strong>Request:</strong> ${this.escapeHtml(input.requestLabel)}</div>
          <div><strong>Payment Voucher:</strong> ${this.escapeHtml(input.voucherNumber)}</div>
        </div>
      </div>
      <div>
        <div class="detail-list">
          <div><strong>Amount:</strong> ${this.escapeHtml(input.amountLabel)}</div>
          <div><strong>Date Issued:</strong> ${this.escapeHtml(input.issuedAt)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="rowpad">
      <div class="section-title">Declaration</div>
      <div class="text-block">${this.escapeHtml(input.declaration)}</div>
    </div>
    <div class="rowpad">
      <div class="section-title">Why Receipts Are Unavailable</div>
      <div class="text-block">${this.escapeHtml(input.reason)}</div>
    </div>
    <div class="rowpad">
      <div class="text-block muted">
        I accept full responsibility for the accuracy of this declaration and understand it forms
        part of the retirement record for this request.
      </div>
    </div>
  </div>

  <div class="card">
    <div class="rowpad">
      <strong>Signatures</strong>
      <div class="sig-grid">
        <div>
          <div class="sig-label">Signed by (Staff)</div>
          ${sigBlock}
          <div class="sig-label">Name</div>
          <div class="sig-name">${this.escapeHtml(input.staffName)}</div>
          <div class="sig-label">Date</div>
          <div class="sig-name">${this.escapeHtml(input.issuedAt)}</div>
        </div>
        <div>
          <div class="sig-label">Witnessed / Verified by</div>
          <div class="sig-line"></div>
          <div class="sig-label">Name / Title</div>
          <div class="sig-name" style="border-bottom:1px solid #ddd; min-height:18px;"></div>
          <div class="sig-label">Date</div>
          <div class="sig-name" style="border-bottom:1px solid #ddd; min-height:18px;"></div>
        </div>
      </div>
    </div>
    <div class="rowpad">
      <div class="footer-note">
        This Certificate of Honor was generated as part of the retirement process for the above-referenced
        request. It is an official document and must be retained with the supporting retirement files.
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  resolveApprovalSignatory(params: {
    isManualImport: boolean;
    workflowStep: { performed_by_name?: string | null; at: Date | string } | undefined;
    manual: Record<string, unknown> | undefined;
  }): { actorName: string | null; dateText: string; done: boolean } {
    const { isManualImport, workflowStep, manual } = params;
    return {
      actorName: isManualImport
        ? (typeof manual?.name === 'string' && manual.name ? manual.name : null)
        : (workflowStep?.performed_by_name ?? (typeof manual?.name === 'string' ? manual.name : null)),
      dateText: isManualImport
        ? (typeof manual?.date === 'string' ? this.formatDate(manual.date) : 'Pending')
        : (workflowStep
            ? this.formatDate(workflowStep.at)
            : typeof manual?.date === 'string'
              ? this.formatDate(manual.date)
              : 'Pending'),
      done: isManualImport
        ? Boolean(manual?.done)
        : Boolean(workflowStep) || Boolean(manual?.done),
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  // ── Request Thread ────────────────────────────────────────────────────────

  async fetchThread(requestId: string): Promise<RequestThread> {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(requestId) },
      include: {
        creator: { select: { id: true, username: true, email: true, firstName: true, lastName: true } },
        requestType: { select: { name: true, codePrefix: true } },
        items: {
          include: {
            file: true,
            files: { include: { file: true }, orderBy: { sortOrder: 'asc' as const } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException('Request not found');

    const data = (request.data ?? {}) as Record<string, unknown>;
    const creatorName =
      `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() ||
      request.creator.username ||
      request.creator.email;
    const purpose = typeof data.purpose === 'string' && data.purpose ? data.purpose : null;

    const fileMap = new Map<string, { name: string; id: string }>();
    for (const item of request.items) {
      const addFile = (f: any) => {
        if (f?.id && f?.fileName) fileMap.set(f.id, { name: f.fileName, id: f.id });
      };
      addFile(item.file);
      (item.files ?? []).forEach((a: any) => addFile(a.file));
    }

    // Collect any file IDs referenced in data.items[] that aren't already in fileMap
    const dataItems = Array.isArray(data.items) ? (data.items as any[]) : [];
    const missingFileIds = new Set<string>();
    for (const di of dataItems) {
      const ids: string[] = [];
      if (di?.file_id && typeof di.file_id === 'string') ids.push(di.file_id);
      if (Array.isArray(di?.file_ids)) ids.push(...di.file_ids.map((f: any) => (typeof f === 'string' ? f : f?.id)).filter(Boolean));
      for (const fid of ids) {
        if (!fileMap.has(fid)) missingFileIds.add(fid);
      }
    }
    if (missingFileIds.size > 0) {
      const extra = await this.prisma.fileAsset.findMany({
        where: { id: { in: Array.from(missingFileIds) } },
        select: { id: true, fileName: true },
      });
      for (const f of extra) {
        if (f.fileName) fileMap.set(f.id, { id: f.id, name: f.fileName });
      }
    }

    const attachments = Array.from(fileMap.values());

    const customComment = typeof data.submission_comment === 'string' && data.submission_comment.trim()
      ? data.submission_comment.trim()
      : null;
    const autoComment = purpose
      ? `Please make payment for the listed items. ${purpose}.`
      : 'Please make payment for the listed items.';
    const baseComment = customComment ?? autoComment;
    const filesSuffix = attachments.length > 0
      ? `Supporting documents attached: ${attachments.map((a) => a.name).join(', ')}.`
      : null;
    const submissionComment = filesSuffix
      ? `${baseComment} ${filesSuffix}`
      : baseComment;

    const thread: ThreadEntry[] = [
      {
        type: 'submission',
        actor_name: creatorName,
        actor_email: request.creator.email,
        role_label: 'Requester',
        comment: submissionComment,
        at: request.createdAt,
        attachments,
      },
    ];

    // For manual imports: build thread from data.manual_approvals
    if (!request.workflowInstanceId) {
      const manualApprovals = Array.isArray(data.manual_approvals) ? (data.manual_approvals as any[]) : [];
      const roleOrder = ['team_lead', 'accountant', 'coo', 'ed'];
      const roleLabelMap: Record<string, string> = {
        team_lead: 'Team Lead',
        accountant: 'Accountant',
        coo: 'COO',
        ed: 'Executive Director',
      };
      const sorted = [...manualApprovals].sort(
        (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role),
      );
      for (const ap of sorted) {
        if (!ap?.name && !ap?.date) continue;
        thread.push({
          type: 'approval',
          actor_name: ap.name ?? null,
          actor_email: null,
          role_label: roleLabelMap[ap.role] ?? String(ap.role),
          comment: ap.comment ?? null,
          at: ap.date ? new Date(ap.date) : request.createdAt,
        });
      }
      return thread;
    }

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: request.workflowInstanceId },
      include: {
        history: { orderBy: { createdAt: 'asc' } },
        workflow: { include: { steps: true } },
      },
    });
    if (!instance) return thread;

    const stepMap = new Map(instance.workflow.steps.map((s) => [s.id, s.name]));
    const performerIds = [
      ...new Set(
        instance.history.map((e) => e.performedBy?.toString()).filter((id): id is string => Boolean(id)),
      ),
    ];
    const performers = performerIds.length
      ? await this.prisma.profile.findMany({
          where: { id: { in: performerIds.map((id) => toBigInt(id)) } },
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        })
      : [];
    const performerMap = new Map(
      performers.map((u) => {
        const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
        return [u.id.toString(), { name: name || u.username || u.email, email: u.email }];
      }),
    );

    const relevantActions = new Set(['approve', 'reject', 'auto_approve', 'return']);
    for (const entry of instance.history) {
      if (!relevantActions.has(entry.action)) continue;
      const performer = entry.performedBy ? performerMap.get(entry.performedBy.toString()) : null;
      const step = entry.fromStepId ? stepMap.get(entry.fromStepId) ?? null : null;
      const entryType: ThreadEntry['type'] =
        entry.action === 'approve' || entry.action === 'auto_approve'
          ? 'approval'
          : entry.action === 'reject'
            ? 'rejection'
            : 'return';
      thread.push({
        type: entryType,
        actor_name: performer?.name ?? 'System',
        actor_email: performer?.email ?? null,
        role_label: step ?? (entry.action === 'auto_approve' ? 'System' : 'Approver'),
        comment: entry.comment ?? null,
        at: entry.createdAt,
      });
    }

    return thread;
  }

  renderThreadHtml(entries: ThreadEntry[]): string {
    const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
      submission: { label: 'Submitted', color: '#2563eb', icon: '●' },
      approval: { label: 'Approved', color: '#16a34a', icon: '✓' },
      clearance: { label: 'Cleared', color: '#0891b2', icon: '✓' },
      rejection: { label: 'Rejected', color: '#dc2626', icon: '✗' },
      return: { label: 'Returned', color: '#d97706', icon: '↩' },
      auto_approval: { label: 'Auto-approved', color: '#7c3aed', icon: '✓' },
    };

    const isFinanceRole = (label: string) => {
      const l = label.toLowerCase();
      return l.includes('accountant') || l.includes('finance') || l.includes('cleared');
    };

    const rows = entries
      .map((entry, idx) => {
        const effectiveType = entry.type === 'approval' && isFinanceRole(entry.role_label) ? 'clearance' : entry.type;
        const cfg = typeConfig[effectiveType] ?? typeConfig.approval;
        const nameAndEmail = entry.actor_email
          ? `${this.escapeHtml(entry.actor_name)} &lt;${this.escapeHtml(entry.actor_email)}&gt;`
          : this.escapeHtml(entry.actor_name);
        const attachmentList =
          entry.attachments && entry.attachments.length > 0
            ? `<div style="margin-top:6px; font-size:11px; color:#475569;"><strong>Attached:</strong> ${entry.attachments.map((a) => this.escapeHtml(a.name)).join(', ')}</div>`
            : '';
        const commentBlock = entry.comment
          ? `<div style="font-size:12px; color:#111; line-height:1.7; margin-top:6px; white-space:pre-wrap;">${this.escapeHtml(entry.comment)}</div>`
          : '';
        return `<div style="border-left:3px solid ${cfg.color}; padding:10px 14px; margin-bottom:10px; background:${idx === 0 ? '#f8fafc' : '#fff'}; border-radius:0 6px 6px 0; border-top:1px solid #f1f5f9; border-right:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px; margin-bottom:5px;">
            <div>
              <span style="font-weight:700; font-size:12px;">${this.escapeHtml(entry.role_label)}</span>
              <span style="color:#475569; font-size:11px; margin-left:8px;">${nameAndEmail}</span>
            </div>
            <div style="font-size:10px; color:#94a3b8;">${this.formatDateTime(entry.at)}</div>
          </div>
          <span style="display:inline-block; background:${cfg.color}; color:#fff; font-size:10px; font-weight:600; padding:2px 8px; border-radius:9999px; margin-bottom:4px;">${cfg.icon} ${cfg.label}</span>
          ${commentBlock}${attachmentList}
        </div>`;
      })
      .join('');

    return `<div>${rows}</div>`;
  }

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  getRequestInclude() {
    return {
      items: {
        include: {
          file: true,
          files: {
            include: { file: true },
            orderBy: { sortOrder: 'asc' as const },
          },
        },
      },
      requestType: { include: { category: true } },
      group: true,
      creator: {
        select: { id: true, username: true, email: true, firstName: true, lastName: true },
      },
      organization: true,
      team: { select: { id: true, name: true } },
    };
  }
}
