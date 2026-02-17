import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';

type WorkflowStepConfig = {
  role?: string;
  action?: string;
  min_amount?: number;
  approval_limit?: number;
};

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async startForRequest(params: {
    requestId: bigint;
    requestTypeId: string;
    initiatedBy: string;
    amount?: number | null;
  }) {
    const existing = await this.prisma.requestInstance.findUnique({
      where: { id: params.requestId },
      select: { workflowInstanceId: true, requestType: { select: { name: true, approvalFlowJson: true } } }
    });

    if (!existing) throw new NotFoundException('Request not found');
    if (existing.workflowInstanceId) return { instanceId: existing.workflowInstanceId };

    const steps = this.extractApprovalSteps(existing.requestType.approvalFlowJson, params.amount ?? undefined);
    if (steps.length === 0) {
      return { instanceId: null };
    }

    return this.prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          name: `${existing.requestType.name} Workflow`,
          entityType: 'request',
          isActive: true,
          createdBy: toBigInt(params.initiatedBy),
          updatedBy: toBigInt(params.initiatedBy),
          config: { requestTypeId: params.requestTypeId }
        }
      });

      const workflowSteps = await Promise.all(
        steps.map((step, index) =>
          tx.workflowStep.create({
            data: {
              workflowId: workflow.id,
              name: step.role ? `${step.role} approval` : `Step ${index + 1}`,
              stepType: 'approval',
              order: index + 1,
              isInitial: index === 0,
              isFinal: index === steps.length - 1,
              config: step,
              createdBy: toBigInt(params.initiatedBy),
              updatedBy: toBigInt(params.initiatedBy)
            }
          })
        )
      );

      await Promise.all(
        workflowSteps.map((step, index) =>
          tx.workflowStepApprover.create({
            data: {
              stepId: step.id,
              approverType: 'role',
              approverId: steps[index].role ?? 'requests.approve',
              isRequired: true,
              approvalOrder: 1,
              createdBy: toBigInt(params.initiatedBy),
              updatedBy: toBigInt(params.initiatedBy)
            }
          })
        )
      );

      for (let i = 0; i < workflowSteps.length - 1; i += 1) {
        await tx.workflowTransition.create({
          data: {
            workflowId: workflow.id,
            fromStepId: workflowSteps[i].id,
            toStepId: workflowSteps[i + 1].id,
            name: `step_${i + 1}_approve`,
            action: 'approve',
            createdBy: toBigInt(params.initiatedBy),
            updatedBy: toBigInt(params.initiatedBy)
          }
        });
      }

      const instance = await tx.workflowInstance.create({
        data: {
          workflowId: workflow.id,
          entityType: 'request',
          entityId: params.requestId.toString(),
          currentStepId: workflowSteps[0].id,
          status: 'pending',
          initiatedBy: toBigInt(params.initiatedBy),
          metadata: {
            requestId: params.requestId.toString(),
            requestTypeId: params.requestTypeId
          }
        }
      });

      await tx.workflowHistory.create({
        data: {
          instanceId: instance.id,
          action: 'start',
          performedBy: toBigInt(params.initiatedBy),
          data: { currentStepId: workflowSteps[0].id }
        }
      });

      await tx.requestInstance.update({
        where: { id: params.requestId },
        data: { workflowInstanceId: instance.id }
      });

      return { instanceId: instance.id };
    });
  }

  async processDecision(params: {
    instanceId: string;
    action: 'approve' | 'reject';
    performedBy: string;
    comment?: string;
  }) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: params.instanceId },
      include: { currentStep: true }
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.status !== 'pending') throw new BadRequestException('Workflow instance is not active');

    return this.prisma.$transaction(async (tx) => {
      if (params.action === 'reject') {
        await tx.workflowHistory.create({
          data: {
            instanceId: instance.id,
            action: 'reject',
            performedBy: toBigInt(params.performedBy),
            comment: params.comment,
            fromStepId: instance.currentStepId ?? undefined
          }
        });

        await tx.workflowInstance.update({
          where: { id: instance.id },
          data: {
            status: 'rejected',
            currentStepId: null,
            completedAt: new Date()
          }
        });

        return { status: 'rejected', completed: true };
      }

      if (!instance.currentStep) {
        throw new BadRequestException('Workflow has no active step');
      }

      const nextStep = await tx.workflowStep.findFirst({
        where: {
          workflowId: instance.workflowId,
          order: { gt: instance.currentStep.order }
        },
        orderBy: { order: 'asc' }
      });

      await tx.workflowHistory.create({
        data: {
          instanceId: instance.id,
          action: 'approve',
          performedBy: toBigInt(params.performedBy),
          comment: params.comment,
          fromStepId: instance.currentStep.id,
          toStepId: nextStep?.id
        }
      });

      if (!nextStep) {
        await tx.workflowInstance.update({
          where: { id: instance.id },
          data: {
            status: 'approved',
            currentStepId: null,
            completedAt: new Date()
          }
        });

        return { status: 'approved', completed: true };
      }

      await tx.workflowInstance.update({
        where: { id: instance.id },
        data: { currentStepId: nextStep.id }
      });

      return { status: 'pending', completed: false, currentStepId: nextStep.id };
    });
  }

  async getAvailableActions(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.status !== 'pending') return [];
    return ['approve', 'reject'];
  }

  async getHistory(instanceId: string) {
    return this.prisma.workflowHistory.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getInstance(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            steps: { orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    return instance;
  }

  async cancelWorkflow(instanceId: string, performedBy: string, reason?: string) {
    const instance = await this.prisma.workflowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.status !== 'pending') throw new BadRequestException('Workflow is already closed');

    return this.prisma.$transaction(async (tx) => {
      await tx.workflowHistory.create({
        data: {
          instanceId,
          action: 'cancel',
          performedBy: toBigInt(performedBy),
          comment: reason
        }
      });

      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          currentStepId: null
        }
      });

      return { success: true };
    });
  }

  private extractApprovalSteps(flowJson: unknown, amount?: number): WorkflowStepConfig[] {
    if (!flowJson || typeof flowJson !== 'object') return [];
    const maybeSteps = (flowJson as { steps?: WorkflowStepConfig[] }).steps;
    if (!Array.isArray(maybeSteps)) return [];

    return maybeSteps.filter((step) => {
      if (step.min_amount !== undefined && amount !== undefined && amount < step.min_amount) return false;
      if (step.approval_limit !== undefined && amount !== undefined && amount > step.approval_limit) return false;
      return true;
    });
  }
}
