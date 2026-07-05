import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../../common/mail/mail.service';
import { toBigInt } from '../../common/utils/ids';
import { CreatePrDto } from './dto/create-pr.dto';
import { CreatePoDto } from './dto/create-po.dto';
import { CreateGrnDto } from './dto/create-grn.dto';
import { ConfirmGrnDto } from './dto/confirm-grn.dto';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  private async nextNumber(prefix: 'PR' | 'PO' | 'GRN'): Promise<string> {
    const year = new Date().getFullYear();
    const modelMap = { PR: 'procurementRequisition', PO: 'procurementOrder', GRN: 'procurementGRN' } as const;
    const count = await (this.prisma[modelMap[prefix]] as any).count();
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createPr(userId: string, dto: CreatePrDto) {
    const number = await this.nextNumber('PR');
    const estimatedTotal = dto.items.reduce((sum, i) => sum + i.qty * i.estimatedUnitCost, 0);
    return this.prisma.procurementRequisition.create({
      data: {
        requisitionNumber: number,
        title: dto.title,
        category: dto.category,
        paymentPattern: dto.paymentPattern,
        items: dto.items as any,
        estimatedTotal,
        justification: dto.justification,
        budgetLineId: dto.budgetLineId,
        teamId: dto.teamId ? toBigInt(dto.teamId) : null,
        requestedBy: toBigInt(userId),
        status: 'draft',
      },
    });
  }

  async submitPr(id: string, userId: string) {
    const pr = await this.prisma.procurementRequisition.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Requisition not found');
    if (pr.status !== 'draft') throw new BadRequestException('Only draft requisitions can be submitted');

    const approvalFlowJson = { steps: [{ approverType: 'hod' }, { approverType: 'procurement_officer' }] };
    const { instanceId } = await this.workflowService.startForEntity({
      entityId: id,
      entityType: 'procurement_requisition',
      approvalFlowJson,
      initiatedBy: userId,
      amount: Number(pr.estimatedTotal),
      name: `${pr.requisitionNumber} Approval`,
    });

    return this.prisma.procurementRequisition.update({
      where: { id },
      data: { status: 'submitted', workflowInstanceId: instanceId },
    });
  }

  async approvePr(id: string, userId: string, comment?: string) {
    const pr = await this.prisma.procurementRequisition.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Requisition not found');
    return this.prisma.procurementRequisition.update({
      where: { id },
      data: { status: 'approved' },
    });
  }

  async rejectPr(id: string, userId: string, comment?: string) {
    const pr = await this.prisma.procurementRequisition.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Requisition not found');
    return this.prisma.procurementRequisition.update({
      where: { id },
      data: { status: 'rejected' },
    });
  }

  async listPrs(userId: string, role: string) {
    const where = role === 'procurement_officer' || role === 'admin' ? {} : { requestedBy: toBigInt(userId) };
    return this.prisma.procurementRequisition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { requester: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getPr(id: string) {
    const pr = await this.prisma.procurementRequisition.findUnique({
      where: { id },
      include: { requester: { select: { id: true, firstName: true, lastName: true } }, purchaseOrders: true },
    });
    if (!pr) throw new NotFoundException('Requisition not found');
    return pr;
  }

  async createPo(userId: string, dto: CreatePoDto) {
    const pr = await this.prisma.procurementRequisition.findUnique({ where: { id: dto.requisitionId } });
    if (!pr) throw new NotFoundException('Requisition not found');
    if (pr.status !== 'approved') throw new BadRequestException('Requisition must be approved before creating a PO');

    const number = await this.nextNumber('PO');
    const totalAmount = dto.items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

    const po = await this.prisma.procurementOrder.create({
      data: {
        poNumber: number,
        requisitionId: dto.requisitionId,
        vendorId: dto.vendorId,
        preparedBy: toBigInt(userId),
        items: dto.items as any,
        totalAmount,
        paymentPattern: dto.paymentPattern,
        milestones: dto.milestones as any ?? null,
        paymentTerms: dto.paymentTerms,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        deliveryAddress: dto.deliveryAddress,
        status: 'draft',
      },
    });

    const { instanceId } = await this.workflowService.startForEntity({
      entityId: po.id,
      entityType: 'procurement_order',
      approvalFlowJson: dto.approvalFlowJson,
      initiatedBy: userId,
      amount: totalAmount,
      name: `${number} Approval`,
    });

    return this.prisma.procurementOrder.update({
      where: { id: po.id },
      data: { status: 'pending_approval', workflowInstanceId: instanceId },
    });
  }

  async approvePo(id: string, userId: string, comment?: string) {
    const po = await this.prisma.procurementOrder.findUnique({
      where: { id },
      include: { vendor: { include: { contactPersons: true } }, requisition: true },
    });
    if (!po) throw new NotFoundException('Order not found');

    const updated = await this.prisma.procurementOrder.update({
      where: { id },
      data: { status: 'approved' },
    });

    const primaryContact = po.vendor.contactPersons.find(p => p.isPrimary) ?? po.vendor.contactPersons[0];
    const vendorEmail = primaryContact?.email ?? po.vendor.email;
    if (vendorEmail) {
      await this.mailService.send({
        to: vendorEmail,
        subject: `Purchase Order ${po.poNumber} from Stanforte Edge`,
        text: `Dear ${primaryContact?.firstName ?? po.vendor.name},\n\nPlease find attached Purchase Order ${po.poNumber}.\n\nView and acknowledge at: ${process.env.APP_URL}/vendor-portal`,
      });
    }

    await this.prisma.procurementRequisition.update({
      where: { id: po.requisitionId },
      data: { status: 'converted_to_po' },
    });

    return updated;
  }

  async rejectPo(id: string, userId: string, comment?: string) {
    const po = await this.prisma.procurementOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Order not found');
    return this.prisma.procurementOrder.update({ where: { id }, data: { status: 'cancelled' } });
  }

  async listPos(userId: string) {
    return this.prisma.procurementOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, name: true } },
        requisition: { select: { id: true, requisitionNumber: true, title: true } },
      },
    });
  }

  async getPo(id: string) {
    const po = await this.prisma.procurementOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        requisition: true,
        preparer: { select: { id: true, firstName: true, lastName: true } },
        grns: true,
      },
    });
    if (!po) throw new NotFoundException('Order not found');
    return po;
  }

  async createGrn(userId: string, dto: CreateGrnDto) {
    const po = await this.prisma.procurementOrder.findUnique({ where: { id: dto.poId } });
    if (!po) throw new NotFoundException('Order not found');
    if (!['approved', 'sent', 'acknowledged'].includes(po.status)) {
      throw new BadRequestException('GRN can only be raised for approved/sent/acknowledged orders');
    }

    const number = await this.nextNumber('GRN');
    return this.prisma.procurementGRN.create({
      data: {
        grnNumber: number,
        poId: dto.poId,
        raisedBy: toBigInt(userId),
        receivedDate: new Date(dto.receivedDate),
        items: dto.items as any,
        overallCondition: dto.overallCondition,
        notes: dto.notes,
        status: 'pending',
      },
    });
  }

  async confirmGrn(id: string, userId: string, dto: ConfirmGrnDto) {
    const grn = await this.prisma.procurementGRN.findUnique({ where: { id }, include: { po: true } });
    if (!grn) throw new NotFoundException('GRN not found');

    const updatedGrn = await this.prisma.procurementGRN.update({
      where: { id },
      data: {
        status: dto.status,
        confirmedByOfficer: true,
        confirmedAt: new Date(),
        confirmedBy: toBigInt(userId),
      },
    });

    if (dto.status === 'confirmed') {
      await this.prisma.procurementOrder.update({
        where: { id: grn.poId },
        data: { status: 'received' },
      });

      // Find all users with finance.approve permission or accountant role
      const financeUsers = await this.prisma.userRole.findMany({
        where: {
          OR: [
            { role: { slug: { in: ['administrator', 'admin', 'finance_manager', 'accountant'] } } },
            {
              role: {
                permissions: {
                  some: { permission: { slug: { in: ['finance.approve', 'finance.manage'] } } },
                },
              },
            },
          ],
        },
        select: { profileId: true },
      });

      const uniqueUserIds = Array.from(new Set(financeUsers.map((u) => u.profileId.toString())));
      for (const fUserId of uniqueUserIds) {
        await this.notificationsService.create({
          userId: fUserId,
          type: 'procurement_ready_for_payment',
          title: `PO ${grn.po.poNumber} ready for payment`,
          message: `GRN confirmed. Raise a Payment Voucher for ${grn.po.poNumber}.`,
          data: { poId: grn.poId, grnId: id },
        });
      }
    }

    return updatedGrn;
  }
}
