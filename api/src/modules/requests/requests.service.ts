import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { SubmitRequestDto } from './dto/submit-request.dto';
import { ActionRequestDto } from './dto/action-request.dto';
import { toBigInt } from '../../common/utils/ids';
import { WorkflowService } from '../workflow/workflow.service';
import { FormsService } from '../forms/forms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
    private readonly formsService: FormsService,
    private readonly notificationsService: NotificationsService
  ) {}

  async listGroups() {
    return this.prisma.requestGroup.findMany({ where: { isActive: true } });
  }

  async createGroup(dto: CreateGroupDto) {
    if (!dto.code) throw new BadRequestException('code is required');
    return this.prisma.requestGroup.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description
      }
    });
  }

  async updateGroup(id: string, dto: UpdateGroupDto) {
    return this.prisma.requestGroup.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description
      }
    });
  }

  async deleteGroup(id: string) {
    await this.prisma.requestGroup.delete({ where: { id } });
    return { success: true };
  }

  async listTypes(groupId?: string, includeInactive?: boolean) {
    return this.prisma.requestType.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        ...(includeInactive ? {} : { isActive: true })
      }
    });
  }

  async getType(id: string) {
    const type = await this.prisma.requestType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Request type not found');
    return type;
  }

  async createType(dto: CreateTypeDto) {
    return this.prisma.requestType.create({
      data: {
        groupId: dto.group_id,
        name: dto.name,
        codePrefix: dto.code_prefix,
        description: dto.description,
        storageType: dto.storage_type ?? 'form',
        formId: dto.form_id,
        isActive: dto.is_active ?? true
      }
    });
  }

  async updateType(id: string, dto: UpdateTypeDto) {
    return this.prisma.requestType.update({
      where: { id },
      data: {
        name: dto.name,
        codePrefix: dto.code_prefix,
        description: dto.description,
        storageType: dto.storage_type,
        formId: dto.form_id,
        isActive: dto.is_active
      }
    });
  }

  async deleteType(id: string) {
    await this.prisma.requestType.delete({ where: { id } });
    return { success: true };
  }

  async createRequest(userId: string, dto: CreateRequestDto) {
    const requestType = await this.prisma.requestType.findUnique({ where: { id: dto.request_type_id } });
    if (!requestType || !requestType.isActive) throw new BadRequestException('Invalid request type');
    await this.formsService.validateRequestTypePayload(requestType.id, dto.data);

    const createdBy = toBigInt(userId);

    if (dto.items) {
      const invalid = dto.items.find((item) => item.amount <= 0 || (item.quantity ?? 1) <= 0);
      if (invalid) throw new BadRequestException('Invalid item amount or quantity');
    }

    return this.prisma.$transaction(async (tx) => {
      const computedTotal = dto.items && dto.items.length
        ? dto.items.reduce((sum, item) => sum + (item.amount * (item.quantity ?? 1)), 0)
        : dto.total_amount;

      const request = await tx.requestInstance.create({
        data: {
          requestTypeId: requestType.id,
          groupId: requestType.groupId,
          createdBy,
          teamId: dto.team_id ? toBigInt(dto.team_id) : null,
          status: 'draft',
          data: dto.data as Prisma.InputJsonValue,
          totalAmount: computedTotal ?? dto.total_amount,
          currency: dto.currency || 'NGN'
        }
      });

      if (dto.items && dto.items.length > 0) {
        await tx.requestItem.createMany({
          data: dto.items.map((item) => ({
            requestId: request.id,
            description: item.description,
            amount: item.amount,
            quantity: item.quantity ?? 1,
            categoryId: item.category_id ?? null,
            subcategoryId: item.subcategory_id ?? null,
            dueDate: item.due_date ? new Date(item.due_date) : null,
            notes: item.notes ?? null
          }))
        });
      }

      return request;
    });
  }

  async submitRequest(id: string, userId: string, dto: SubmitRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can submit request');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('Request is not in draft state');
    }

    const updated = await this.prisma.requestInstance.update({
      where: { id: request.id },
      data: { status: 'pending_approval' }
    });

    await this.workflowService.startForRequest({
      requestId: request.id,
      requestTypeId: request.requestTypeId,
      initiatedBy: userId,
      amount: request.totalAmount ? Number(request.totalAmount) : undefined
    });

    await this.notificationsService.create({
      userId,
      type: 'action',
      title: 'Request submitted',
      message: `Request #${request.id.toString()} submitted for approval.`,
      data: { requestId: request.id.toString(), comment: dto.comment },
      notifiableType: 'request',
      notifiableId: request.id
    });

    return updated;
  }

  async approveRequest(id: string, userId: string, dto: ActionRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.status !== 'pending_approval') {
      throw new BadRequestException('Request is not pending approval');
    }

    if (request.workflowInstanceId) {
      const stepResult = await this.workflowService.processDecision({
        instanceId: request.workflowInstanceId,
        action: 'approve',
        performedBy: userId,
        comment: dto.comment
      });

      if (stepResult.status === 'pending') {
        return this.prisma.requestInstance.findUnique({ where: { id: request.id } });
      }
    }

    const updated = await this.prisma.requestInstance.update({
      where: { id: request.id },
      data: { status: 'approved' }
    });

    await this.notificationsService.create({
      userId: request.createdBy,
      type: 'success',
      title: 'Request approved',
      message: `Request #${request.id.toString()} has been approved.`,
      data: { requestId: request.id.toString(), comment: dto.comment },
      notifiableType: 'request',
      notifiableId: request.id
    });

    return updated;
  }

  async rejectRequest(id: string, userId: string, dto: ActionRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.status !== 'pending_approval') {
      throw new BadRequestException('Request is not pending approval');
    }

    if (request.workflowInstanceId) {
      await this.workflowService.processDecision({
        instanceId: request.workflowInstanceId,
        action: 'reject',
        performedBy: userId,
        comment: dto.comment
      });
    }

    const updated = await this.prisma.requestInstance.update({
      where: { id: request.id },
      data: { status: 'rejected' }
    });

    await this.notificationsService.create({
      userId: request.createdBy,
      type: 'warning',
      title: 'Request rejected',
      message: `Request #${request.id.toString()} has been rejected.`,
      data: { requestId: request.id.toString(), comment: dto.comment },
      notifiableType: 'request',
      notifiableId: request.id
    });

    return updated;
  }

  async listRequests(filters: Record<string, any>, userId: string) {
    const where: any = {};

    if (filters.group_id) where.groupId = filters.group_id;
    if (filters.type_id || filters.request_type_id) where.requestTypeId = filters.type_id || filters.request_type_id;
    if (filters.status) where.status = filters.status;
    if (filters.created_by) where.createdBy = toBigInt(filters.created_by);

    // If no view-all permission, restrict to current user (handled by PermissionsGuard upstream)
    if (filters.only_mine === 'true') {
      where.createdBy = toBigInt(userId);
    }

    return this.prisma.requestInstance.findMany({
      where,
      include: { items: true }
    });
  }

  async getRequest(id: string, _userId: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) },
      include: {
        items: true,
        requestType: true,
        group: true,
        creator: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true }
        },
        organization: true
      }
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async updateRequest(id: string, userId: string, dto: UpdateRequestDto) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can update request');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('Only draft requests can be updated');
    }

    if (dto.items) {
      const invalid = dto.items.find((item) => item.amount <= 0 || (item.quantity ?? 1) <= 0);
      if (invalid) throw new BadRequestException('Invalid item amount or quantity');
    }

    if (dto.data) {
      await this.formsService.validateRequestTypePayload(request.requestTypeId, dto.data);
    }

    return this.prisma.$transaction(async (tx) => {
      const computedTotal = dto.items && dto.items.length
        ? dto.items.reduce((sum, item) => sum + (item.amount * (item.quantity ?? 1)), 0)
        : undefined;

      const updated = await tx.requestInstance.update({
        where: { id: request.id },
        data: {
          data:
            dto.data !== undefined
              ? (dto.data as Prisma.InputJsonValue)
              : request.data ?? Prisma.JsonNull,
          teamId: dto.team_id ? toBigInt(dto.team_id) : request.teamId,
          totalAmount: computedTotal ?? dto.total_amount ?? request.totalAmount,
          currency: dto.currency ?? request.currency
        }
      });

      if (dto.items) {
        await tx.requestItem.deleteMany({ where: { requestId: request.id } });
        if (dto.items.length > 0) {
          await tx.requestItem.createMany({
            data: dto.items.map((item) => ({
              requestId: request.id,
              description: item.description,
              amount: item.amount,
              quantity: item.quantity ?? 1,
              categoryId: item.category_id ?? null,
              subcategoryId: item.subcategory_id ?? null,
              dueDate: item.due_date ? new Date(item.due_date) : null,
              notes: item.notes ?? null
            }))
          });
        }
      }

      return updated;
    });
  }

  async deleteRequest(id: string, userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can delete request');
    }
    if (request.status !== 'draft') {
      throw new BadRequestException('Only draft requests can be deleted');
    }

    await this.prisma.requestInstance.delete({ where: { id: request.id } });
    return { success: true };
  }

  async getPendingApprovals(_userId: string, _filters: Record<string, any>) {
    return this.prisma.requestInstance.findMany({
      where: { status: 'pending_approval' },
      include: { items: true }
    });
  }

  async getApprovalHistory(id: string, _userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (!request.workflowInstanceId) return [];
    return this.prisma.workflowHistory.findMany({
      where: { instanceId: request.workflowInstanceId }
    });
  }

  async getActions(id: string, _userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.workflowInstanceId) {
      return this.workflowService.getAvailableActions(request.workflowInstanceId);
    }
    if (request.status === 'draft') return ['submit'];
    if (request.status === 'pending_approval') return ['approve', 'reject'];
    return [];
  }

  async generatePdf(id: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const fileName = `request-${request.id.toString()}-${this.compactDate(generatedAt)}.pdf`;

    const pdfBuffer = this.buildRequestPdfDocument({
      request,
      totalAmount,
      generatedAt
    });

    await this.recordGeneratedArtifact(request.id, {
      type: 'request_pdf',
      file_name: fileName,
      generated_by: userId,
      generated_at: generatedAt.toISOString()
    });

    return {
      file_name: fileName,
      mime_type: 'application/pdf',
      content_base64: pdfBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString(),
      total_amount: totalAmount
    };
  }

  async generatePaymentVoucher(id: string, userId: string) {
    const request = await this.getRequestForDocument(id);
    if (!['approved', 'payment_processing', 'disbursed', 'partially_disbursed', 'pending_retirement', 'retired'].includes(request.status)) {
      throw new BadRequestException('Payment voucher can only be generated for approved/disbursed requests');
    }

    const generatedAt = new Date();
    const totalAmount = this.resolveTotalAmount(request);
    const voucherNo = `PV-${request.id.toString()}-${this.compactDate(generatedAt)}`;
    const fileName = `${voucherNo}.pdf`;

    const pdfBuffer = this.buildPaymentVoucherDocument({
      request,
      voucherNo,
      totalAmount,
      generatedAt
    });

    await this.recordGeneratedArtifact(request.id, {
      type: 'payment_voucher',
      file_name: fileName,
      voucher_no: voucherNo,
      generated_by: userId,
      generated_at: generatedAt.toISOString()
    });

    return {
      voucher_no: voucherNo,
      file_name: fileName,
      mime_type: 'application/pdf',
      content_base64: pdfBuffer.toString('base64'),
      generated_at: generatedAt.toISOString(),
      request_id: request.id.toString(),
      total_amount: totalAmount
    };
  }

  async retire(id: string, userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.createdBy !== toBigInt(userId)) {
      throw new BadRequestException('Only owner can retire request');
    }
    if (!['approved', 'disbursed', 'partially_disbursed'].includes(request.status)) {
      throw new BadRequestException('Request cannot be retired in current status');
    }

    return this.prisma.requestInstance.update({
      where: { id: request.id },
      data: { status: 'pending_retirement' }
    });
  }

  async verifyRetirement(id: string, _userId: string) {
    const request = await this.getRequestOrThrow(id);
    if (request.status !== 'pending_retirement') {
      throw new BadRequestException('Request is not pending retirement');
    }

    return this.prisma.requestInstance.update({
      where: { id: request.id },
      data: { status: 'retired' }
    });
  }

  private async getRequestOrThrow(id: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) }
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  private async getRequestForDocument(id: string) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: toBigInt(id) },
      include: {
        items: true,
        requestType: true,
        group: true,
        creator: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true }
        },
        organization: true
      }
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  private resolveTotalAmount(request: {
    totalAmount: Prisma.Decimal | null;
    items: Array<{ amount: Prisma.Decimal; quantity: number }>;
  }): number {
    if (request.totalAmount !== null) {
      return Number(request.totalAmount);
    }
    return request.items.reduce((sum, item) => sum + Number(item.amount) * item.quantity, 0);
  }

  private compactDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  private formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  private buildRequestPdfDocument(input: {
    request: {
      id: bigint;
      status: string;
      currency: string;
      requestType: { name: string };
      group: { name: string };
      creator: {
        username: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
      items: Array<{
        description: string;
        amount: Prisma.Decimal;
        quantity: number;
      }>;
    };
    totalAmount: number;
    generatedAt: Date;
  }): Buffer {
    const { request, totalAmount, generatedAt } = input;
    const currency = request.currency || 'NGN';
    const requesterName =
      `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() ||
      request.creator.username ||
      request.creator.email;

    const lines: string[] = [
      'Request Summary',
      '',
      `Request ID: ${request.id.toString()}`,
      `Type: ${request.requestType.name}`,
      `Group: ${request.group.name}`,
      `Status: ${request.status}`,
      `Requester: ${requesterName}`,
      `Generated: ${generatedAt.toISOString()}`,
      '',
      'Items'
    ];

    request.items.forEach((item, index) => {
      const itemTotal = Number(item.amount) * item.quantity;
      lines.push(
        `${index + 1}. ${item.description}`,
        `   Qty: ${item.quantity}  Unit: ${this.formatMoney(Number(item.amount), currency)}  Total: ${this.formatMoney(itemTotal, currency)}`
      );
    });

    lines.push('', `Grand Total: ${this.formatMoney(totalAmount, currency)}`);
    return this.buildPdfFromLines(lines);
  }

  private buildPaymentVoucherDocument(input: {
    request: {
      id: bigint;
      status: string;
      currency: string;
      requestType: { name: string };
      creator: {
        username: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
    voucherNo: string;
    totalAmount: number;
    generatedAt: Date;
  }): Buffer {
    const { request, voucherNo, totalAmount, generatedAt } = input;
    const currency = request.currency || 'NGN';
    const payee =
      `${request.creator.firstName ?? ''} ${request.creator.lastName ?? ''}`.trim() ||
      request.creator.username ||
      request.creator.email;

    const lines = [
      'Payment Voucher',
      '',
      `Voucher No: ${voucherNo}`,
      `Request ID: ${request.id.toString()}`,
      `Request Type: ${request.requestType.name}`,
      `Payee: ${payee}`,
      `Amount: ${this.formatMoney(totalAmount, currency)}`,
      `Status: ${request.status}`,
      `Generated: ${generatedAt.toISOString()}`
    ];

    return this.buildPdfFromLines(lines);
  }

  private buildPdfFromLines(lines: string[]): Buffer {
    const sanitized = lines.map((line) => line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
    const stream = [
      'BT',
      '/F1 11 Tf',
      '50 780 Td',
      '14 TL',
      ...sanitized.map((line, index) => (index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)),
      'ET'
    ].join('\n');

    const objects: string[] = [];
    const xref: number[] = [0];
    let body = '';

    const addObject = (content: string) => {
      xref.push(body.length);
      body += `${xref.length - 1} 0 obj\n${content}\nendobj\n`;
    };

    addObject('<< /Type /Catalog /Pages 2 0 R >>');
    addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);

    const header = '%PDF-1.4\n';
    const xrefStart = header.length + body.length;
    const xrefLines = [`xref`, `0 ${xref.length}`, '0000000000 65535 f '];
    for (let i = 1; i < xref.length; i += 1) {
      xrefLines.push(`${String(header.length + xref[i]).padStart(10, '0')} 00000 n `);
    }

    const trailer = [
      'trailer',
      `<< /Size ${xref.length} /Root 1 0 R >>`,
      'startxref',
      String(xrefStart),
      '%%EOF'
    ].join('\n');

    return Buffer.from(`${header}${body}${xrefLines.join('\n')}\n${trailer}\n`, 'utf8');
  }

  private async recordGeneratedArtifact(
    requestId: bigint,
    artifact: Record<string, string>
  ) {
    const request = await this.prisma.requestInstance.findUnique({
      where: { id: requestId },
      select: { data: true }
    });

    const base =
      request?.data && typeof request.data === 'object' && !Array.isArray(request.data)
        ? ({ ...(request.data as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    const currentArtifacts = Array.isArray(base.generated_artifacts)
      ? (base.generated_artifacts as unknown[])
      : [];

    const updatedData = {
      ...base,
      generated_artifacts: [...currentArtifacts, artifact]
    };

    await this.prisma.requestInstance.update({
      where: { id: requestId },
      data: { data: updatedData as Prisma.InputJsonValue }
    });
  }
}
