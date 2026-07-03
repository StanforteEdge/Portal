# Document Generator Service

**Date:** 2026-07-03
**Status:** Approved for implementation

## Problem

Document generation logic is scattered across `RequestsService` (4000+ lines) with no consistent structure:

- The same 5-line setup block (`getRequestForDocument`, `getFinanceSignatories`, `getApprovalSummary`, etc.) is duplicated in every `generate*` method (7 times).
- Payment voucher DB queries are duplicated 4 times with inconsistent `include` clauses — missing `deductions` in 3 of 4 paths caused incorrect PDF calculations.
- `recordGeneratedArtifact` is called in some methods but not others.
- ZIP assembly and PDF merging logic are duplicated inline with no shared abstraction.
- The standard API response shape (`file_name`, `mime_type`, `content_base64`, `generated_at`, `request_id`) is manually constructed everywhere.
- `FinanceService.generateSalesInvoicePdf` is completely disconnected — different PDF approach, no artifact recording, no shared infrastructure.
- Adding a new document type means copying boilerplate, making the same mistakes.

## Goal

A generic document generation infrastructure where:
- The **engine** owns shared mechanics: render, zip, merge, wrap response, record artifact, fallback PDF.
- Each **document type** lives in its own file, owns its data fetch and rendering logic, and plugs into the engine via a common interface.
- Adding a new document = create one file, register one action. The engine never changes.

## Architecture

### Engine — `DocumentGeneratorService`

Location: `api/src/common/documents/document-generator.service.ts`

Registered as a shared NestJS service, importable by any module.

Responsibilities:
- `generate(document, ids, userId)` — orchestrates the full pipeline: fetchContext → render → wrapResponse → recordArtifact
- `renderPdfFromHtml(html)` — wraps `PdfService`, includes the fallback on render failure
- `buildSimplePdfFallback(lines)` — single shared fallback, not duplicated per document
- `buildZipPackage(entries)` — assembles a ZIP from named buffer entries
- `buildMergedPdf(buffers)` — merges multiple PDF buffers into one
- `wrapResponse(output, requestId, userId, generatedAt)` — returns standard `DocumentResponse`
- `recordArtifact(requestId, artifactType, fileName, userId, generatedAt)` — always called, never optional

### Document Interface

```typescript
interface Document<TContext> {
  fetchContext(ids: DocumentIds): Promise<TContext>;
  render(ctx: TContext): Promise<DocumentOutput>;
}

type DocumentIds = {
  requestId?: string;
  voucherId?: string;
  invoiceId?: string;
};

type DocumentOutput = {
  buffer: Buffer;
  mimeType: 'application/pdf' | 'application/zip';
  fileName: string;
  artifactType: string;
};

type DocumentResponse = {
  file_name: string;
  mime_type: string;
  content_base64: string;
  generated_at: string;
  request_id?: string;
};
```

### Document Files — Requests Module

Location: `api/src/modules/requests/documents/`

| File | Action | Output |
|------|--------|--------|
| `request-pdf.document.ts` | `request_pdf` | PDF |
| `payment-voucher.document.ts` | `pv_pdf` | PDF |
| `certificate-of-honor.document.ts` | `certificate_of_honor_pdf` | PDF |
| `request-with-attachments.document.ts` | `request_with_attachments` | ZIP |
| `full-package.document.ts` | `full_package` | ZIP |
| `full-document.document.ts` | `full_document` | Merged PDF |
| `pv-with-attachments.document.ts` | `pv_with_attachments` | ZIP |

Each file:
- Declares its own context type
- Fetches exactly the data it needs in `fetchContext` (no more, no less)
- Builds HTML and calls the engine's `renderPdfFromHtml` / `buildZipPackage` / `buildMergedPdf` in `render`
- Never calls the DB in `render`

### PV Data Fetch — Canonical Include

Every document that needs payment vouchers defines its PV fetch with the full canonical include. This is documented as the required standard:

```typescript
include: {
  deductions: { include: { deductionType: true } },
  evidenceFile: true,
  attachments: {
    where: { fileKind: 'evidence' },
    include: { file: true },
    orderBy: { sortOrder: 'asc' }
  }
}
```

Documents that don't package files (e.g. `request-pdf`) may omit `evidenceFile` and `attachments` since they don't use them. `deductions` is always included.

### Routing — `downloadByAction`

`RequestsService.downloadByAction` becomes a thin router:

```typescript
async downloadByAction(id, userId, dto) {
  const document = this.resolveDocument(dto.action, dto);
  return this.documentGenerator.generate(document, { requestId: id, voucherId: dto.voucher_id }, userId);
}
```

`resolveDocument` maps action strings to document instances. Unknown actions throw `BadRequestException`.

### Document Files — Finance Module

Location: `api/src/modules/finance/documents/`

Out of scope for this cycle. `FinanceService.generateSalesInvoicePdf` stays in place. It migrates in a follow-up once the engine is proven stable.

## What Changes in `RequestsService`

- All `generate*` methods removed (7 methods)
- All `build*Document` private methods removed (2 methods)
- `buildSimplePdfFromLines`, `appendPdfBuffer`, `appendTextPage`, `appendAssetToPdf` removed (moved to engine or document files)
- `downloadByAction` reduced to a router (~10 lines)
- `getRequestForDocument`, `getFinanceSignatories`, `getApprovalSummary`, `resolveTotalAmount`, `recordGeneratedArtifact`, `getRequestNumber`, `zipSafeName`, formatting helpers — move to `DocumentGeneratorService` or a shared `DocumentHelpers` utility

## What Does NOT Change

- All request lifecycle methods (create, submit, approve, retire, complete, disburse)
- All query/list methods
- The controller — same endpoints, same DTOs
- Existing document output format — responses are identical to current

## Defining a New Document Type

1. Create `api/src/modules/<domain>/documents/<name>.document.ts`
2. Implement `Document<TContext>`
3. Register the action in `resolveDocument`
4. Done — no engine changes

## Non-Goals

- Role-based document variants (future, add a new document file when needed)
- Finance sales invoice migration (follow-up)
- Frontend changes (none required)
