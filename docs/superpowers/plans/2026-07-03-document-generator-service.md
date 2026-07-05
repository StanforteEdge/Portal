# Document Generator Service — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all document generation out of `RequestsService` into a generic `DocumentGeneratorService` engine plus one file per document type, eliminating duplication and making new documents a matter of adding one file.

**Architecture:** `DocumentGeneratorService` (in `api/src/common/documents/`) owns all shared infrastructure — data fetching, PDF/ZIP rendering, formatting utilities, artifact recording, and response wrapping. Each document type implements a two-method `Document<TContext>` interface: `fetchContext(ids)` and `render(ctx)`. `RequestsService.downloadByAction` becomes a thin router (~15 lines) that instantiates the right document class and delegates to the engine.

**Tech Stack:** NestJS, Prisma, Puppeteer (via PdfService), pdf-lib, JSZip, TypeScript

## Global Constraints

- Never change the shape of existing API responses — controllers and frontend must not need updates.
- `deductions: { include: { deductionType: true } }` is always included in every PV fetch. No exceptions.
- `recordArtifact` must be called after every successful document generation.
- All formatting helpers (`formatMoney`, `formatDate`, `escapeHtml`, etc.) move verbatim — do not change behaviour.
- Follow existing NestJS patterns: `@Injectable()` for services, constructor injection only.
- After each task the TypeScript compiler must pass: `cd api && npx tsc --noEmit`.

---

## File Map

| Action | File |
|--------|------|
| CREATE | `api/src/common/documents/document.types.ts` |
| CREATE | `api/src/common/documents/document-generator.service.ts` |
| CREATE | `api/src/modules/requests/documents/request-pdf.document.ts` |
| CREATE | `api/src/modules/requests/documents/payment-voucher.document.ts` |
| CREATE | `api/src/modules/requests/documents/certificate-of-honor.document.ts` |
| CREATE | `api/src/modules/requests/documents/request-with-attachments.document.ts` |
| CREATE | `api/src/modules/requests/documents/full-package.document.ts` |
| CREATE | `api/src/modules/requests/documents/full-document.document.ts` |
| CREATE | `api/src/modules/requests/documents/pv-with-attachments.document.ts` |
| MODIFY | `api/src/modules/requests/requests.module.ts` |
| MODIFY | `api/src/modules/requests/requests.service.ts` |

---

### Task 1: Shared Types and DocumentGeneratorService Engine

**Files:**
- Create: `api/src/common/documents/document.types.ts`
- Create: `api/src/common/documents/document-generator.service.ts`

**Interfaces:**
- Produces: `Document<TContext>` interface, `DocumentIds`, `DocumentOutput`, `DocumentResponse`, `EmailDeliveryResponse`, `Signatories`, `ApprovalSummary` types; `DocumentGeneratorService` with all public utilities used by document classes.

- [ ] **Step 1: Create the shared types file**

```typescript
// api/src/common/documents/document.types.ts

export type DocumentIds = {
  requestId?: string;
  voucherId?: string;
  invoiceId?: string;
  options?: Record<string, unknown>;
};

export type DocumentOutput = {
  buffer: Buffer;
  mimeType: 'application/pdf' | 'application/zip';
  fileName: string;
  artifactType: string;
};

export type DocumentResponse = {
  file_name: string;
  mime_type: string;
  content_base64: string;
  generated_at: string;
  request_id?: string;
};

export type EmailDeliveryResponse = {
  success: true;
  delivery: 'email';
  email_to: string;
  file_name: string;
  request_id?: string;
};

export interface Document<TContext> {
  fetchContext(ids: DocumentIds): Promise<TContext>;
  render(ctx: TContext): Promise<DocumentOutput>;
}

export type Signatories = {
  prepared_by: { name: string; title: string };
  reviewed_by: { name: string; title: string };
  approved_by: { name: string; title: string };
};

export type ApprovalSummary = {
  done: Array<{
    action: string;
    step: string;
    performed_by_name?: string | null;
    at: Date | string;
  }>;
  pending: Array<{
    step: string;
    approver_type: string;
    approver_id: string | null;
  }>;
};

export type FullPaymentVoucher = {
  id: string;
  voucherNumber: string;
  amount: any; // Prisma.Decimal
  retiredAmount: any;
  retirementStatus: string;
  method: string | null;
  transactionRef: string | null;
  note: string | null;
  disbursedAt: Date;
  retiredAt: Date | null;
  verifiedAt: Date | null;
  grossAmount: any | null;
  netAmount: any | null;
  metadata: any;
  evidenceFile: any | null;
  attachments: Array<{ file: any; sortOrder: number }>;
  deductions: Array<{
    deductionAmount: any;
    deductionType: { name: string; code: string };
  }>;
};
```

- [ ] **Step 2: Create DocumentGeneratorService with all shared utilities**

```typescript
// api/src/common/documents/document-generator.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
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
    delivery: { mode: 'email' | 'download'; email_to?: string; requestNumber: string; creatorEmail: string },
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
    const { NotFoundException } = await import('@nestjs/common');
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
      new Set(instance.history.map((e) => e.performedBy?.toString()).filter((id): id is string => Boolean(id)))
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
        return [u.id.toString(), name || u.username || u.email];
      })
    );
    const done = instance.history
      .filter((e) => ['approve', 'reject', 'auto_approve'].includes(e.action))
      .map((e) => ({
        action: e.action,
        step: e.fromStepId ? stepMap.get(e.fromStepId) ?? 'Unknown step' : 'Unknown step',
        performed_by: e.performedBy?.toString() ?? null,
        performed_by_name: e.performedBy ? performerMap.get(e.performedBy.toString()) ?? null : null,
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
    const { NotFoundException } = await import('@nestjs/common');
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
        try { return await readFile(candidate); } catch { /* continue */ }
      }
    }
    if (/^https?:\/\//i.test(storagePath)) {
      try {
        const res = await fetch(storagePath);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
      } catch { /* ignore */ }
    }
    return null;
  }

  async resolveNameFromReference(value: unknown, kind: 'team' | 'organization' | 'taxonomy_term'): Promise<string> {
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
    } catch { return raw; }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  async renderPdfFromHtml(html: string, fallbackLines: string[]): Promise<Buffer> {
    try {
      return await this.pdfService.renderPdfFromHtml(html);
    } catch (error: any) {
      const suffix = error?.message ? String(error.message).slice(0, 120) : 'renderer error';
      return this.buildSimplePdfFallback([...fallbackLines, `PDF renderer fallback: ${suffix}`]);
    }
  }

  buildSimplePdfFallback(lines: string[]): Buffer {
    // Copy verbatim from RequestsService.buildSimplePdfFromLines (requests.service.ts:3360)
    const sanitized = lines.map((line) =>
      String(line).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    );
    const stream = ['BT', '/F1 11 Tf', '50 790 Td', '14 TL', ...sanitized.map((line, i) => i === 0 ? `(${line}) Tj` : `T* (${line}) Tj`), 'ET'].join('\n');
    const header = '%PDF-1.4\n';
    const objects: string[] = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
      `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    ];
    let body = '';
    const xref: number[] = [0];
    for (const obj of objects) { xref.push(header.length + body.length); body += obj; }
    const xrefStart = header.length + body.length;
    const xrefLines = ['xref', `0 ${xref.length}`, '0000000000 65535 f ', ...xref.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n `)];
    const trailer = ['trailer', `<< /Size ${xref.length} /Root 1 0 R >>`, 'startxref', String(xrefStart), '%%EOF'].join('\n');
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

  async appendAssetToPdf(target: PDFDocument, fileBuffer: Buffer | null, fileName: string, mimeType: string | null | undefined, skippedFiles: string[]) {
    if (!fileBuffer) { skippedFiles.push(`${fileName} (missing file)`); return; }
    const mime = String(mimeType || '').toLowerCase();
    const ext = extname(fileName).toLowerCase();
    if (mime === 'application/pdf' || ext === '.pdf') { await this.appendPdfBuffer(target, fileBuffer); return; }
    if (mime === 'image/png' || ext === '.png') { const img = await target.embedPng(fileBuffer); await this.appendImagePage(target, img, fileName); return; }
    if (['image/jpeg', 'image/jpg'].includes(mime) || ['.jpg', '.jpeg'].includes(ext)) { const img = await target.embedJpg(fileBuffer); await this.appendImagePage(target, img, fileName); return; }
    skippedFiles.push(fileName);
  }

  async appendImagePage(target: PDFDocument, image: { width: number; height: number; scale: (f: number) => { width: number; height: number } }, label: string) {
    const page = target.addPage([595.28, 841.89]);
    const margin = 36, headerSpace = 32;
    const ratio = Math.min((page.getWidth() - margin * 2) / image.width, (page.getHeight() - margin * 2 - headerSpace) / image.height, 1);
    const dims = image.scale(ratio);
    page.drawImage(image as any, { x: (page.getWidth() - dims.width) / 2, y: margin, width: dims.width, height: dims.height });
    const font = await target.embedFont(StandardFonts.Helvetica);
    page.drawText(label, { x: margin, y: page.getHeight() - margin + 4, size: 10, font });
  }

  async appendTextPage(target: PDFDocument, title: string, lines: string[]) {
    const page = target.addPage([595.28, 841.89]);
    const font = await target.embedFont(StandardFonts.Helvetica);
    const bold = await target.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, { x: 40, y: 800, size: 16, font: bold });
    let y = 772;
    for (const line of lines) { page.drawText(line, { x: 40, y, size: 11, font }); y -= 16; if (y < 50) break; }
  }

  // ── Formatting Utilities ──────────────────────────────────────────────────

  formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
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
    return date.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  compactDate(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }

  escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  toTitle(input: string): string {
    return input.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  paymentMethodLabel(method: string | null): string {
    return method ? this.toTitle(method) : '-';
  }

  zipSafeName(value: string): string {
    return String(value || '').replace(/[\\/]+/g, '-').replace(/[ -]+/g, '').trim();
  }

  getRequestNumber(codePrefix: string | undefined, year: number, requestId: bigint): string {
    // Copy verbatim from RequestsService.getRequestNumber (requests.service.ts:4210)
    const prefix = codePrefix ?? 'REQ';
    return `${prefix}-${year}-${String(requestId).padStart(4, '0')}`;
  }

  resolveTotalAmount(request: { totalAmount: any; items: Array<{ amount: any; quantity: number }> }): number {
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
        const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        return `data:${mime};base64,${readFileSync(path).toString('base64')}`;
      } catch { continue; }
    }
    return null;
  }

  amountToWords(amount: number): string {
    const units = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const toWords = (n: number): string => {
      if (n < 20) return units[n];
      if (n < 100) return `${tens[Math.floor(n/10)]}${n%10 ? ` ${units[n%10]}` : ''}`;
      if (n < 1000) return `${units[Math.floor(n/100)]} Hundred${n%100 ? ` ${toWords(n%100)}` : ''}`;
      if (n < 1000000) return `${toWords(Math.floor(n/1000))} Thousand${n%1000 ? ` ${toWords(n%1000)}` : ''}`;
      if (n < 1000000000) return `${toWords(Math.floor(n/1000000))} Million${n%1000000 ? ` ${toWords(n%1000000)}` : ''}`;
      return `${toWords(Math.floor(n/1000000000))} Billion${n%1000000000 ? ` ${toWords(n%1000000000)}` : ''}`;
    };
    return `${toWords(Math.max(0, Math.floor(amount)))} Naira Only`;
  }

  // ── HTML Builders ─────────────────────────────────────────────────────────

  renderApprovalRoleRow(input: { roleLabel: string; actorName: string | null; dateText: string; done: boolean }): string {
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
    voucherNo: string; dateText: string; payee: string; contact: string; itemsHtml: string;
    totalMoney: string; purpose: string; amountWords: string; method: string | null; details: string;
    preparedBy: string; preparedDate: string; cooBy: string; cooDate: string; cooDone: boolean;
    edBy: string; edDate: string; edDone: boolean; remarks?: string | null; pageBreak?: boolean; logoDataUri?: string | null;
  }): string {
    // Copy verbatim from RequestsService.renderVoucherPageHtml (requests.service.ts:3297)
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

  renderCertificateHtml(input: {
    logoDataUri: string | null; signatureDataUri: string | null; staffName: string;
    requestLabel: string; voucherNumber: string; amountLabel: string; declaration: string; reason: string; issuedAt: string;
  }): string {
    // Copy verbatim from RequestsService.renderCertificateHtml (search for that method in requests.service.ts)
    return `<!doctype html><html><head><meta charset="utf-8" /><style>
      @page { size: A4; margin: 15mm; }
      body { font-family: Arial, sans-serif; font-size: 13px; color: #111; }
      .box { border: 2px solid #000; border-radius: 6px; padding: 24px; }
      .title { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 6px; text-decoration: underline; }
      .subtitle { text-align: center; font-size: 15px; color: #444; margin-bottom: 20px; }
      .row { margin: 12px 0; }
      .label { font-weight: 700; }
      .line { border-bottom: 1px solid #000; padding: 4px 0; min-height: 22px; }
      .sig-block { margin-top: 30px; display: flex; gap: 40px; }
      .sig-item { flex: 1; }
      .sig-line { border-bottom: 2px solid #000; height: 40px; margin-bottom: 4px; }
      ${input.signatureDataUri ? '.sig-img { max-height: 60px; margin-bottom: 4px; }' : ''}
    </style></head><body>
    <div class="box">
      ${input.logoDataUri ? `<div style="text-align:center;margin-bottom:12px;"><img src="${input.logoDataUri}" style="height:48px;" /></div>` : ''}
      <div class="title">CERTIFICATE OF HONOR</div>
      <div class="subtitle">Cash Advance Retirement Declaration</div>
      <div class="row"><span class="label">Request Reference:</span> <span class="line">${input.requestLabel}</span></div>
      <div class="row"><span class="label">Payment Voucher:</span> <span class="line">${input.voucherNumber}</span></div>
      <div class="row"><span class="label">Staff Member:</span> <span class="line">${input.staffName}</span></div>
      <div class="row"><span class="label">Amount:</span> <span class="line">${input.amountLabel}</span></div>
      <div class="row"><span class="label">Declaration:</span><div class="line" style="margin-top:4px;">${input.declaration}</div></div>
      <div class="row"><span class="label">Why receipts are unavailable:</span><div class="line" style="margin-top:4px;">${input.reason}</div></div>
      <div class="sig-block">
        <div class="sig-item">
          ${input.signatureDataUri ? `<img class="sig-img" src="${input.signatureDataUri}" />` : '<div class="sig-line"></div>'}
          <div>Signature</div>
          <div>${input.staffName}</div>
        </div>
        <div class="sig-item">
          <div class="sig-line"></div>
          <div>Date: ${input.issuedAt}</div>
        </div>
      </div>
    </div>
    </body></html>`;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  getRequestInclude() {
    return {
      items: {
        include: {
          file: true,
          files: { include: { file: true }, orderBy: { sortOrder: 'asc' as const } },
        },
      },
      requestType: { include: { category: true } },
      group: true,
      creator: { select: { id: true, username: true, email: true, firstName: true, lastName: true } },
      organization: true,
      team: { select: { id: true, name: true } },
    };
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
        : (workflowStep ? this.formatDate(workflowStep.at) : (typeof manual?.date === 'string' ? this.formatDate(manual.date) : 'Pending')),
      done: isManualImport ? Boolean(manual?.done) : (Boolean(workflowStep) || Boolean(manual?.done)),
    };
  }
}
```

- [ ] **Step 3: Verify types file compiles**

```bash
cd api && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors in the new files (existing errors in requests.service.ts are acceptable at this stage).

- [ ] **Step 4: Commit**

```bash
git add api/src/common/documents/
git commit -m "feat(documents): add DocumentGeneratorService engine and shared types"
```

---

### Task 2: RequestPdfDocument

**Files:**
- Create: `api/src/modules/requests/documents/request-pdf.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1)
- Produces: `RequestPdfDocument` class implementing `Document<RequestPdfContext>`

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/request-pdf.document.ts

import { Document, DocumentIds, DocumentOutput, FullPaymentVoucher, Signatories, ApprovalSummary } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';

type RequestPdfContext = {
  request: any;
  totalAmount: number;
  generatedAt: Date;
  signatories: Signatories;
  approvals: ApprovalSummary;
  paymentVouchers: FullPaymentVoucher[];
  currency: string;
};

export class RequestPdfDocument implements Document<RequestPdfContext> {
  constructor(private readonly engine: DocumentGeneratorService) {}

  async fetchContext(ids: DocumentIds): Promise<RequestPdfContext> {
    const request = await this.engine.fetchRequest(ids.requestId!);
    const [signatories, approvals, paymentVouchers] = await Promise.all([
      this.engine.fetchSignatories(),
      this.engine.fetchApprovals(request.workflowInstanceId),
      this.engine.fetchPaymentVouchers(ids.requestId!),
    ]);
    return {
      request,
      totalAmount: this.engine.resolveTotalAmount(request),
      generatedAt: new Date(),
      signatories,
      approvals,
      paymentVouchers,
      currency: request.currency || 'NGN',
    };
  }

  async render(ctx: RequestPdfContext): Promise<DocumentOutput> {
    const html = await this.buildHtml(ctx);
    const requestNumber = this.engine.getRequestNumber(ctx.request.requestType.codePrefix, ctx.request.createdAt.getFullYear(), ctx.request.id);
    const buffer = await this.engine.renderPdfFromHtml(html, [
      `Request ${requestNumber}`,
      `Status: ${ctx.request.status}`,
      `Total: ${this.engine.formatMoney(ctx.totalAmount, ctx.currency)}`,
    ]);
    return {
      buffer,
      mimeType: 'application/pdf',
      fileName: `${this.engine.zipSafeName(requestNumber)}.pdf`,
      artifactType: 'request_pdf',
    };
  }

  private async buildHtml(ctx: RequestPdfContext): Promise<string> {
    // Move the full HTML building logic from RequestsService.buildRequestPdfDocument verbatim.
    // This method is everything inside buildRequestPdfDocument from requests.service.ts starting
    // at line ~3647 through the html template string (lines 3769–3902).
    // Replace all `this.` calls with `this.engine.` since helpers are now on the engine.
    // Replace `this.getFinanceSignatories()`, `this.getApprovalSummary()` etc. — those are
    // already called in fetchContext and passed via ctx.
    //
    // Paste the full implementation here. Key structure:
    // 1. Destructure ctx
    // 2. Compute disbursedTotal, totalDeductions, netDisbursedTotal, retiredTotal, unreleased, unspent, netVariance
    // 3. Resolve team/org/project/category names via engine.resolveNameFromReference
    // 4. Build approval role rows via engine.renderApprovalRoleRow
    // 5. Build voucherPagesHtml via engine.renderVoucherPageHtml for each PV
    // 6. Assemble and return the full HTML string
    throw new Error('Implement: paste buildRequestPdfDocument HTML logic here');
  }
}
```

- [ ] **Step 2: Paste the full HTML-building logic into `buildHtml`**

Open `api/src/modules/requests/requests.service.ts` at line 3647. Copy everything from the destructure line through `return html;` (approximately lines 3647–3902). Paste into `buildHtml`. Replace every `this.` with `this.engine.`, replace `request` references with `ctx.request`, `totalAmount` with `ctx.totalAmount`, etc. Remove the `try/catch` at the end (the fallback is handled by `engine.renderPdfFromHtml`).

- [ ] **Step 3: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'request-pdf' | head -20
```

Expected: no errors in this file.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/requests/documents/request-pdf.document.ts
git commit -m "feat(documents): add RequestPdfDocument"
```

---

### Task 3: PaymentVoucherDocument

**Files:**
- Create: `api/src/modules/requests/documents/payment-voucher.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1)
- Produces: `PaymentVoucherDocument` implementing `Document<PVDocumentContext>`; handles both single-PV and all-PVs-for-request modes via `ids.voucherId`.

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/payment-voucher.document.ts

import { Document, DocumentIds, DocumentOutput, Signatories, ApprovalSummary } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';

type PVDocumentContext = {
  request: any;
  voucher: any;
  totalAmount: number;
  generatedAt: Date;
  signatories: Signatories;
  approvals: ApprovalSummary;
  currency: string;
};

export class PaymentVoucherDocument implements Document<PVDocumentContext> {
  constructor(private readonly engine: DocumentGeneratorService) {}

  async fetchContext(ids: DocumentIds): Promise<PVDocumentContext> {
    const request = await this.engine.fetchRequest(ids.requestId!);
    let voucher: any;
    if (ids.voucherId) {
      voucher = await this.engine.fetchPaymentVoucher(ids.requestId!, ids.voucherId);
    } else {
      const all = await this.engine.fetchPaymentVouchers(ids.requestId!);
      if (!all.length) throw new Error('No payment vouchers found for this request');
      voucher = all[0];
    }
    const [signatories, approvals] = await Promise.all([
      this.engine.fetchSignatories(),
      this.engine.fetchApprovals(request.workflowInstanceId),
    ]);
    return {
      request,
      voucher,
      totalAmount: Number(voucher.amount),
      generatedAt: new Date(),
      signatories,
      approvals,
      currency: request.currency || 'NGN',
    };
  }

  async render(ctx: PVDocumentContext): Promise<DocumentOutput> {
    const html = this.buildHtml(ctx);
    const buffer = await this.engine.renderPdfFromHtml(html, [
      `PAYMENT VOUCHER ${ctx.voucher.voucherNumber}`,
      `Amount: ${this.engine.formatMoney(ctx.totalAmount, ctx.currency)}`,
    ]);
    return {
      buffer,
      mimeType: 'application/pdf',
      fileName: `${this.engine.zipSafeName(ctx.voucher.voucherNumber)}.pdf`,
      artifactType: 'pv_pdf',
    };
  }

  private buildHtml(ctx: PVDocumentContext): string {
    // Move the full implementation from RequestsService.buildPaymentVoucherDocument verbatim.
    // This is everything from lines ~3967 through the html template string (lines 4021–4037).
    // Replace all `this.` with `this.engine.`.
    // Remove the outer try/catch — handled by engine.renderPdfFromHtml.
    throw new Error('Implement: paste buildPaymentVoucherDocument logic here');
  }
}
```

- [ ] **Step 2: Paste the full PV HTML logic into `buildHtml`**

Open `requests.service.ts` at line ~3967. Copy from the destructure through the `html` template string. Replace `this.` with `this.engine.`. Use `ctx.request`, `ctx.voucher`, `ctx.signatories`, `ctx.approvals`.

- [ ] **Step 3: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'payment-voucher' | head -20
```

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/requests/documents/payment-voucher.document.ts
git commit -m "feat(documents): add PaymentVoucherDocument"
```

---

### Task 4: CertificateOfHonorDocument

**Files:**
- Create: `api/src/modules/requests/documents/certificate-of-honor.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1); `DownloadRequestDto` fields passed via `ids.options`.
- Produces: `CertificateOfHonorDocument` implementing `Document<CertContext>`

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/certificate-of-honor.document.ts

import { Document, DocumentIds, DocumentOutput } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';

type CertContext = {
  requestLabel: string;
  staffName: string;
  voucherNumber: string;
  amountLabel: string;
  declaration: string;
  reason: string;
  issuedAt: string;
  logoDataUri: string | null;
  signatureDataUri: string | null;
  requestId: bigint;
  requestIdStr: string;
};

export class CertificateOfHonorDocument implements Document<CertContext> {
  constructor(private readonly engine: DocumentGeneratorService) {}

  async fetchContext(ids: DocumentIds): Promise<CertContext> {
    const request = await this.engine.fetchRequest(ids.requestId!);
    const generatedAt = new Date();
    const opts = (ids.options ?? {}) as Record<string, string | undefined>;
    const logoDataUri = this.engine.getPdfLogoDataUri();

    let signatureDataUri: string | null = null;
    if (opts.signature_file_id) {
      const sigAsset = await this.engine.prisma.fileAsset.findUnique({ where: { id: opts.signature_file_id } });
      if (sigAsset) {
        const buf = await this.engine.readAssetFileBuffer(sigAsset);
        if (buf) {
          const ext = (sigAsset.fileName ?? '').split('.').pop()?.toLowerCase() ?? 'png';
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          signatureDataUri = `data:${mime};base64,${buf.toString('base64')}`;
        }
      }
    }

    const requestLabel = opts.request_label?.trim() ||
      this.engine.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id);

    return {
      requestLabel,
      staffName: opts.staff_name?.trim() ||
        `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() || request.creator.email,
      voucherNumber: opts.voucher_number?.trim() || '-',
      amountLabel: opts.amount_label?.trim() || '-',
      declaration: opts.declaration?.trim() || 'I hereby certify that the cash advance and/or disbursed funds referenced above were used for official purposes.',
      reason: opts.reason?.trim() || 'No additional explanation provided.',
      issuedAt: opts.issued_at?.trim() || this.engine.formatDate(generatedAt),
      logoDataUri,
      signatureDataUri,
      requestId: request.id,
      requestIdStr: ids.requestId!,
    };
  }

  async render(ctx: CertContext): Promise<DocumentOutput> {
    const html = this.engine.renderCertificateHtml({
      logoDataUri: ctx.logoDataUri,
      signatureDataUri: ctx.signatureDataUri,
      staffName: ctx.staffName,
      requestLabel: ctx.requestLabel,
      voucherNumber: ctx.voucherNumber,
      amountLabel: ctx.amountLabel,
      declaration: ctx.declaration,
      reason: ctx.reason,
      issuedAt: ctx.issuedAt,
    });
    const buffer = await this.engine.renderPdfFromHtml(html, [
      'CERTIFICATE OF HONOR',
      `Request: ${ctx.requestLabel}`,
      `Staff: ${ctx.staffName}`,
      `Amount: ${ctx.amountLabel}`,
      `Date: ${ctx.issuedAt}`,
    ]);
    return {
      buffer,
      mimeType: 'application/pdf',
      fileName: `Certificate_of_Honor_${this.engine.zipSafeName(ctx.requestLabel)}.pdf`,
      artifactType: 'certificate_of_honor_pdf',
    };
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'certificate' | head -20
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/requests/documents/certificate-of-honor.document.ts
git commit -m "feat(documents): add CertificateOfHonorDocument"
```

---

### Task 5: RequestWithAttachmentsDocument

**Files:**
- Create: `api/src/modules/requests/documents/request-with-attachments.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1), `RequestPdfDocument` (Task 2)
- Produces: `RequestWithAttachmentsDocument` implementing `Document<ReqAttachContext>` — ZIP output

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/request-with-attachments.document.ts

import { Document, DocumentIds, DocumentOutput, FullPaymentVoucher, Signatories, ApprovalSummary } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';
import { RequestPdfDocument } from './request-pdf.document';

type ReqAttachContext = {
  request: any;
  totalAmount: number;
  generatedAt: Date;
  signatories: Signatories;
  approvals: ApprovalSummary;
  paymentVouchers: FullPaymentVoucher[];
  currency: string;
  requestIdStr: string;
};

export class RequestWithAttachmentsDocument implements Document<ReqAttachContext> {
  private readonly requestPdf: RequestPdfDocument;

  constructor(private readonly engine: DocumentGeneratorService) {
    this.requestPdf = new RequestPdfDocument(engine);
  }

  async fetchContext(ids: DocumentIds): Promise<ReqAttachContext> {
    const ctx = await this.requestPdf.fetchContext(ids);
    return { ...ctx, requestIdStr: ids.requestId! };
  }

  async render(ctx: ReqAttachContext): Promise<DocumentOutput> {
    const pdfOutput = await this.requestPdf.render(ctx);
    const requestNumber = this.engine.getRequestNumber(ctx.request.requestType.codePrefix, ctx.request.createdAt.getFullYear(), ctx.request.id);
    const requestZipName = this.engine.zipSafeName(requestNumber);
    const entries: Array<{ path: string; buffer: Buffer }> = [
      { path: `request/${requestZipName}.pdf`, buffer: pdfOutput.buffer },
    ];

    for (const item of ctx.request.items) {
      const files = Array.from(
        new Map(
          [...(item.files ?? []).map((a: any) => a.file).filter(Boolean), item.file ?? null]
            .filter(Boolean)
            .map((f: any) => [f.id, f])
        ).values()
      );
      for (const file of files as any[]) {
        const buf = await this.engine.readAssetFileBuffer(file);
        if (buf) entries.push({ path: `request/attachments/${file.fileName}`, buffer: buf });
      }
    }

    const zipBuffer = await this.engine.buildZipPackage(entries);
    return {
      buffer: zipBuffer,
      mimeType: 'application/zip',
      fileName: `${requestZipName}-attachments-${this.engine.compactDate(ctx.generatedAt)}.zip`,
      artifactType: 'request_with_attachments',
    };
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'request-with-attachments' | head -20
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/requests/documents/request-with-attachments.document.ts
git commit -m "feat(documents): add RequestWithAttachmentsDocument"
```

---

### Task 6: FullPackageDocument

**Files:**
- Create: `api/src/modules/requests/documents/full-package.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1), `RequestPdfDocument` (Task 2), `PaymentVoucherDocument` (Task 3)
- Produces: `FullPackageDocument` — ZIP with request PDF + all PV PDFs + evidence files

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/full-package.document.ts

import { Document, DocumentIds, DocumentOutput, FullPaymentVoucher, Signatories, ApprovalSummary } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';
import { RequestPdfDocument } from './request-pdf.document';
import { PaymentVoucherDocument } from './payment-voucher.document';

type FullPackageContext = {
  request: any;
  totalAmount: number;
  generatedAt: Date;
  signatories: Signatories;
  approvals: ApprovalSummary;
  paymentVouchers: FullPaymentVoucher[];
  currency: string;
  requestIdStr: string;
};

export class FullPackageDocument implements Document<FullPackageContext> {
  private readonly requestPdf: RequestPdfDocument;
  private readonly pvPdf: PaymentVoucherDocument;

  constructor(private readonly engine: DocumentGeneratorService) {
    this.requestPdf = new RequestPdfDocument(engine);
    this.pvPdf = new PaymentVoucherDocument(engine);
  }

  async fetchContext(ids: DocumentIds): Promise<FullPackageContext> {
    const ctx = await this.requestPdf.fetchContext(ids);
    return { ...ctx, requestIdStr: ids.requestId! };
  }

  async render(ctx: FullPackageContext): Promise<DocumentOutput> {
    const requestPdfOutput = await this.requestPdf.render(ctx);
    const requestNumber = this.engine.getRequestNumber(ctx.request.requestType.codePrefix, ctx.request.createdAt.getFullYear(), ctx.request.id);
    const requestZipName = this.engine.zipSafeName(requestNumber);

    const entries: Array<{ path: string; buffer: Buffer }> = [
      { path: `request/${requestZipName}.pdf`, buffer: requestPdfOutput.buffer },
    ];

    for (const item of ctx.request.items) {
      const files = Array.from(
        new Map(
          [...(item.files ?? []).map((a: any) => a.file).filter(Boolean), item.file ?? null]
            .filter(Boolean)
            .map((f: any) => [f.id, f])
        ).values()
      );
      for (const file of files as any[]) {
        const buf = await this.engine.readAssetFileBuffer(file);
        if (buf) entries.push({ path: `request/attachments/${file.fileName}`, buffer: buf });
      }
    }

    const fileIdSet = new Set<string>();
    for (const pv of ctx.paymentVouchers) {
      const pvCtx = { request: ctx.request, voucher: pv, totalAmount: Number(pv.amount), generatedAt: ctx.generatedAt, signatories: ctx.signatories, approvals: ctx.approvals, currency: ctx.currency };
      const pvPdfOutput = await this.pvPdf.render(pvCtx);
      const voucherZipName = this.engine.zipSafeName(pv.voucherNumber);
      entries.push({ path: `vouchers/${voucherZipName}/${voucherZipName}.pdf`, buffer: pvPdfOutput.buffer });

      const evidenceFiles = Array.from(
        new Map(
          [...(pv.attachments ?? []).map((a: any) => a.file).filter(Boolean), pv.evidenceFile ?? null]
            .filter(Boolean)
            .map((f: any) => [f.id, f])
        ).values()
      ) as any[];

      for (const file of evidenceFiles) {
        if (fileIdSet.has(file.id)) continue;
        fileIdSet.add(file.id);
        const buf = await this.engine.readAssetFileBuffer(file);
        if (buf) entries.push({ path: `vouchers/${voucherZipName}/receipts/${file.fileName}`, buffer: buf });
      }

      if (pv.metadata && typeof pv.metadata === 'object' && !Array.isArray(pv.metadata)) {
        const ids = (pv.metadata as Record<string, unknown>).retirement_file_ids;
        if (Array.isArray(ids)) {
          const retirementFiles = await this.engine.prisma.fileAsset.findMany({
            where: { id: { in: ids.filter((x): x is string => typeof x === 'string') } },
          });
          for (const file of retirementFiles) {
            if (fileIdSet.has(file.id)) continue;
            fileIdSet.add(file.id);
            const buf = await this.engine.readAssetFileBuffer(file);
            if (buf) entries.push({ path: `vouchers/${voucherZipName}/retirement/${file.fileName}`, buffer: buf });
          }
        }
      }
    }

    const zipBuffer = await this.engine.buildZipPackage(entries);
    return {
      buffer: zipBuffer,
      mimeType: 'application/zip',
      fileName: `${requestZipName}-full-package-${this.engine.compactDate(ctx.generatedAt)}.zip`,
      artifactType: 'full_package',
    };
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'full-package' | head -20
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/requests/documents/full-package.document.ts
git commit -m "feat(documents): add FullPackageDocument"
```

---

### Task 7: FullDocumentDocument

**Files:**
- Create: `api/src/modules/requests/documents/full-document.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1), `RequestPdfDocument` (Task 2)
- Produces: `FullDocumentDocument` — merged PDF with all supporting files inlined as pages

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/full-document.document.ts

import { Document, DocumentIds, DocumentOutput, FullPaymentVoucher, Signatories, ApprovalSummary } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';
import { RequestPdfDocument } from './request-pdf.document';

type FullDocContext = {
  request: any;
  totalAmount: number;
  generatedAt: Date;
  signatories: Signatories;
  approvals: ApprovalSummary;
  paymentVouchers: FullPaymentVoucher[];
  currency: string;
  requestIdStr: string;
};

export class FullDocumentDocument implements Document<FullDocContext> {
  private readonly requestPdf: RequestPdfDocument;

  constructor(private readonly engine: DocumentGeneratorService) {
    this.requestPdf = new RequestPdfDocument(engine);
  }

  async fetchContext(ids: DocumentIds): Promise<FullDocContext> {
    const ctx = await this.requestPdf.fetchContext(ids);
    return { ...ctx, requestIdStr: ids.requestId! };
  }

  async render(ctx: FullDocContext): Promise<DocumentOutput> {
    const requestPdfOutput = await this.requestPdf.render(ctx);
    const mergedPdf = await this.engine.buildMergedPdf();
    await this.engine.appendPdfBuffer(mergedPdf, requestPdfOutput.buffer);

    const skippedFiles: string[] = [];

    for (const item of ctx.request.items) {
      const files = Array.from(
        new Map(
          [...(item.files ?? []).map((a: any) => a.file).filter(Boolean), item.file ?? null]
            .filter(Boolean)
            .map((f: any) => [f.id, f])
        ).values()
      ) as any[];
      for (const file of files) {
        const buf = await this.engine.readAssetFileBuffer(file);
        await this.engine.appendAssetToPdf(mergedPdf, buf, file.fileName, file.mimeType, skippedFiles);
      }
    }

    for (const pv of ctx.paymentVouchers) {
      const evidenceFiles = Array.from(
        new Map(
          [...(pv.attachments ?? []).map((a: any) => a.file).filter(Boolean), pv.evidenceFile ?? null]
            .filter(Boolean)
            .map((f: any) => [f.id, f])
        ).values()
      ) as any[];
      for (const file of evidenceFiles) {
        const buf = await this.engine.readAssetFileBuffer(file);
        await this.engine.appendAssetToPdf(mergedPdf, buf, file.fileName, file.mimeType, skippedFiles);
      }

      if (pv.metadata && typeof pv.metadata === 'object' && !Array.isArray(pv.metadata)) {
        const ids = (pv.metadata as Record<string, unknown>).retirement_file_ids;
        if (Array.isArray(ids)) {
          const retirementFiles = await this.engine.prisma.fileAsset.findMany({
            where: { id: { in: ids.filter((x): x is string => typeof x === 'string') } },
          });
          for (const file of retirementFiles) {
            const buf = await this.engine.readAssetFileBuffer(file);
            await this.engine.appendAssetToPdf(mergedPdf, buf, file.fileName, file.mimeType, skippedFiles);
          }
        }
      }
    }

    if (skippedFiles.length > 0) {
      await this.engine.appendTextPage(mergedPdf, 'Attachments not embedded', skippedFiles.map((n) => `- ${n}`));
    }

    const requestNumber = this.engine.getRequestNumber(ctx.request.requestType.codePrefix, ctx.request.createdAt.getFullYear(), ctx.request.id);
    const requestZipName = this.engine.zipSafeName(requestNumber);
    const pdfBuffer = Buffer.from(await mergedPdf.save());

    return {
      buffer: pdfBuffer,
      mimeType: 'application/pdf',
      fileName: `${requestZipName}-full-document-${this.engine.compactDate(ctx.generatedAt)}.pdf`,
      artifactType: 'full_document',
    };
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'full-document' | head -20
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/requests/documents/full-document.document.ts
git commit -m "feat(documents): add FullDocumentDocument"
```

---

### Task 8: PVWithAttachmentsDocument

**Files:**
- Create: `api/src/modules/requests/documents/pv-with-attachments.document.ts`

**Interfaces:**
- Consumes: `DocumentGeneratorService` (Task 1), `PaymentVoucherDocument` (Task 3)
- Produces: `PVWithAttachmentsDocument` — ZIP with single PV PDF + evidence files

- [ ] **Step 1: Create the file**

```typescript
// api/src/modules/requests/documents/pv-with-attachments.document.ts

import { Document, DocumentIds, DocumentOutput } from '../../../common/documents/document.types';
import { DocumentGeneratorService } from '../../../common/documents/document-generator.service';
import { PaymentVoucherDocument } from './payment-voucher.document';

export class PVWithAttachmentsDocument implements Document<any> {
  private readonly pvPdf: PaymentVoucherDocument;

  constructor(private readonly engine: DocumentGeneratorService) {
    this.pvPdf = new PaymentVoucherDocument(engine);
  }

  async fetchContext(ids: DocumentIds): Promise<any> {
    return this.pvPdf.fetchContext(ids);
  }

  async render(ctx: any): Promise<DocumentOutput> {
    const pvPdfOutput = await this.pvPdf.render(ctx);
    const voucherZipName = this.engine.zipSafeName(ctx.voucher.voucherNumber);

    const entries: Array<{ path: string; buffer: Buffer }> = [
      { path: `${voucherZipName}/${voucherZipName}.pdf`, buffer: pvPdfOutput.buffer },
    ];

    const fileIdSet = new Set<string>();
    const evidenceFiles = Array.from(
      new Map(
        [...(ctx.voucher.attachments ?? []).map((a: any) => a.file).filter(Boolean), ctx.voucher.evidenceFile ?? null]
          .filter(Boolean)
          .map((f: any) => [f.id, f])
      ).values()
    ) as any[];

    for (const file of evidenceFiles) {
      if (fileIdSet.has(file.id)) continue;
      fileIdSet.add(file.id);
      const buf = await this.engine.readAssetFileBuffer(file);
      if (buf) entries.push({ path: `${voucherZipName}/receipts/${file.fileName}`, buffer: buf });
    }

    const zipBuffer = await this.engine.buildZipPackage(entries);
    return {
      buffer: zipBuffer,
      mimeType: 'application/zip',
      fileName: `${voucherZipName}-package-${this.engine.compactDate(ctx.generatedAt)}.zip`,
      artifactType: 'pv_with_attachments',
    };
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | grep 'pv-with-attachments' | head -20
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/requests/documents/pv-with-attachments.document.ts
git commit -m "feat(documents): add PVWithAttachmentsDocument"
```

---

### Task 9: Wire Up and Remove Old Code

**Files:**
- Modify: `api/src/modules/requests/requests.module.ts`
- Modify: `api/src/modules/requests/requests.service.ts`

**Interfaces:**
- Consumes: All document classes (Tasks 2–8), `DocumentGeneratorService` (Task 1)
- Produces: Clean `RequestsService` with only lifecycle methods; thin `downloadByAction` router

- [ ] **Step 1: Register DocumentGeneratorService in RequestsModule**

```typescript
// api/src/modules/requests/requests.module.ts

import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { FormsModule } from '../forms/forms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../../common/mail/mail.module';
import { PdfModule } from '../../common/pdf/pdf.module';
import { DocumentGeneratorService } from '../../common/documents/document-generator.service';

@Module({
  imports: [WorkflowModule, FormsModule, NotificationsModule, MailModule, PdfModule],
  controllers: [RequestsController],
  providers: [RequestsService, DocumentGeneratorService],
  exports: [DocumentGeneratorService],
})
export class RequestsModule {}
```

- [ ] **Step 2: Inject DocumentGeneratorService and rewrite downloadByAction in RequestsService**

Add `DocumentGeneratorService` to the constructor, and replace `downloadByAction` and all `generate*` public methods with a thin router. Remove `MailService` from the constructor (only kept in engine now):

```typescript
// In RequestsService constructor — add:
private readonly documentGenerator: DocumentGeneratorService

// Remove: private readonly mailService: MailService
// Remove: private readonly pdfService: PdfService (it was already on the service, now only engine needs it)
```

New `downloadByAction`:

```typescript
async downloadByAction(id: string, userId: string, dto: DownloadRequestDto) {
  const action = dto.action ?? 'request_pdf';
  const ids: DocumentIds = { requestId: id, voucherId: dto.voucher_id, options: dto as any };

  switch (action) {
    case 'request_pdf':
      return this.documentGenerator.generate(new RequestPdfDocument(this.documentGenerator), ids, userId);

    case 'pv_pdf':
      return this.documentGenerator.generate(new PaymentVoucherDocument(this.documentGenerator), ids, userId);

    case 'request_with_attachments':
      return this.documentGenerator.generate(new RequestWithAttachmentsDocument(this.documentGenerator), ids, userId);

    case 'full_package': {
      const request = await this.documentGenerator.fetchRequest(id);
      const requestNumber = this.documentGenerator.getRequestNumber(request.requestType.codePrefix, request.createdAt.getFullYear(), request.id);
      return this.documentGenerator.generateWithEmailDelivery(
        new FullPackageDocument(this.documentGenerator),
        ids,
        userId,
        { mode: dto.delivery ?? 'download', email_to: dto.email_to, requestNumber, creatorEmail: request.creator.email }
      );
    }

    case 'full_document':
      return this.documentGenerator.generate(new FullDocumentDocument(this.documentGenerator), ids, userId);

    case 'pv_with_attachments':
      if (!dto.voucher_id) throw new BadRequestException('voucher_id is required for pv_with_attachments');
      return this.documentGenerator.generate(new PVWithAttachmentsDocument(this.documentGenerator), ids, userId);

    case 'certificate_of_honor_pdf':
      return this.documentGenerator.generate(new CertificateOfHonorDocument(this.documentGenerator), ids, userId);

    default:
      throw new BadRequestException('Invalid download action');
  }
}
```

Add imports at the top of `requests.service.ts`:
```typescript
import { DocumentGeneratorService } from '../../common/documents/document-generator.service';
import { DocumentIds } from '../../common/documents/document.types';
import { RequestPdfDocument } from './documents/request-pdf.document';
import { PaymentVoucherDocument } from './documents/payment-voucher.document';
import { CertificateOfHonorDocument } from './documents/certificate-of-honor.document';
import { RequestWithAttachmentsDocument } from './documents/request-with-attachments.document';
import { FullPackageDocument } from './documents/full-package.document';
import { FullDocumentDocument } from './documents/full-document.document';
import { PVWithAttachmentsDocument } from './documents/pv-with-attachments.document';
```

- [ ] **Step 3: Remove all old document methods from RequestsService**

Delete these methods from `requests.service.ts`:
- `generatePdf` (line ~1693)
- `generatePaymentVoucher` (line ~1741)
- `generatePaymentVoucherForVoucher` (line ~1793)
- `generateFullRequestPackage` (line ~1880)
- `generateRequestWithAttachmentsPackage` (line ~2042)
- `generateFullRequestDocument` (line ~2093)
- `generateVoucherWithAttachmentsPackage` (line ~2220)
- `generateCertificateOfHonorPdf` (line ~3406)
- `buildRequestPdfDocument` (line ~3608)
- `buildPaymentVoucherDocument` (line ~3929)
- `buildSimplePdfFromLines` (line ~3360)
- `appendPdfBuffer` (line ~3166)
- `appendAssetToPdf` (line ~3172)
- `appendImagePage` (line ~3207)
- `appendTextPage` (line ~3234)
- `amountToWords` (line ~3257)
- `renderApprovalRoleRow` (line ~3278)
- `renderVoucherPageHtml` (line ~3297)
- `renderCertificateHtml` (line ~3488)
- `formatMoney` (line ~3025)
- `formatDate` (line ~3033)
- `formatDateTime` (line ~3044)
- `escapeHtml` (line ~3057)
- `toTitle` (line ~3066)
- `paymentMethodLabel` (line ~3072)
- `getPdfLogoDataUri` (line ~3077)
- `looksLikeUuid` (line ~3100)
- `resolveNameFromReference` (line ~3104)
- `readAssetFileBuffer` (line ~3126)
- `compactDate` (line ~3011)
- `zipSafeName` (line ~3018)
- `getFinanceSignatories` (line ~4469)
- `getApprovalSummary` (line ~4393)
- `getRequestInclude` (line ~4083)
- `recordGeneratedArtifact` (line ~4053)
- `resolveTotalAmount` (line ~3001)
- `getRequestNumber` (line ~4210)
- `resolveApprovalSignatory` (if extracted)

Also remove unused imports from `requests.service.ts`: `PdfService`, `MailService`, `JSZip`, `PDFDocument`, `StandardFonts`, `existsSync`, `readFileSync`, `readFile`, `extname`, `resolve`.

- [ ] **Step 4: Verify full compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

- [ ] **Step 5: Verify the API still works**

Start the API in dev mode and test each download action with an existing request:

```bash
cd api && npm run start:dev
```

Test endpoints:
- `POST /requests/:id/download` with `{ action: "request_pdf" }` → returns PDF base64
- `POST /requests/:id/download` with `{ action: "pv_pdf" }` → returns PDF base64
- `POST /requests/:id/download` with `{ action: "full_document" }` → returns merged PDF base64
- `POST /requests/:id/download` with `{ action: "full_package" }` → returns ZIP base64
- `POST /requests/:id/download` with `{ action: "certificate_of_honor_pdf", staff_name: "Test" }` → returns PDF base64

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/requests/requests.module.ts api/src/modules/requests/requests.service.ts
git commit -m "feat(documents): wire up DocumentGeneratorService, remove old generate/build methods from RequestsService"
```
