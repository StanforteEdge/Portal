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
    comment?: string | null;
    at: Date | string;
  }>;
  pending: Array<{
    step: string;
    approver_type: string;
    approver_id: string | null;
  }>;
};

export type ThreadEntryType = 'submission' | 'approval' | 'rejection' | 'return' | 'auto_approval';

export type ThreadEntry = {
  type: ThreadEntryType;
  actor_name: string;
  actor_email: string | null;
  role_label: string;
  comment: string | null;
  at: Date;
  attachments?: Array<{ name: string; id: string }>;
};

export type RequestThread = ThreadEntry[];

export type FullPaymentVoucher = {
  id: string;
  voucherNumber: string;
  amount: any;
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
