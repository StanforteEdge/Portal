import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { DisburseRequestDto } from './dto/disburse-request.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: Record<string, any>) {
    const where: any = {
      status: {
        in: ['approved', 'payment_processing', 'disbursed', 'partially_disbursed', 'pending_retirement', 'retired']
      }
    };

    if (query.currency) where.currency = String(query.currency).toUpperCase();

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(String(query.from));
      if (query.to) where.createdAt.lte = new Date(String(query.to));
    }

    const [count, aggregates, byStatus] = await this.prisma.$transaction([
      this.prisma.requestInstance.count({ where }),
      this.prisma.requestInstance.aggregate({
        where,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      }),
      this.prisma.requestInstance.groupBy({
        by: ['status'],
        where,
        _sum: { totalAmount: true },
        _count: { _all: true },
        orderBy: { status: 'asc' }
      })
    ]);

    return {
      total_requests: count,
      total_amount: aggregates._sum.totalAmount,
      average_amount: aggregates._avg.totalAmount,
      by_status: byStatus.map((item) => ({
        status: item.status,
        count: (item as any)._count?._all ?? 0,
        total_amount: item._sum?.totalAmount ?? null
      }))
    };
  }

  async listRequests(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: any = {
      status: {
        in: ['approved', 'payment_processing', 'disbursed', 'partially_disbursed', 'pending_retirement', 'retired']
      }
    };

    if (query.status) where.status = String(query.status);
    if (query.currency) where.currency = String(query.currency).toUpperCase();

    const [data, total] = await this.prisma.$transaction([
      this.prisma.requestInstance.findMany({
        where,
        include: {
          requestType: true,
          group: true,
          creator: { select: { id: true, email: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.requestInstance.count({ where })
    ]);

    return {
      data,
      meta: {
        page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage))
      }
    };
  }

  async disburseRequest(requestId: string, _dto: DisburseRequestDto) {
    const id = this.parseId(requestId, 'request id');
    const request = await this.prisma.requestInstance.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    if (!['approved', 'partially_disbursed', 'payment_processing'].includes(request.status)) {
      throw new BadRequestException('Request is not in a disbursable state');
    }

    return this.prisma.requestInstance.update({
      where: { id },
      data: {
        status: 'disbursed'
      }
    });
  }

  private parseId(value: string, label: string): bigint {
    try {
      return toBigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }
}
