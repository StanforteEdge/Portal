import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { Prisma } from '@prisma/client';

type NotificationInput = {
  userId: string | bigint;
  type?: string;
  title: string;
  message: string;
  link?: string;
  data?: Prisma.InputJsonValue;
  sentVia?: string[];
  notifiableType?: string;
  notifiableId?: string | number | bigint;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: toBigInt(input.userId),
        type: input.type ?? 'info',
        title: input.title,
        message: input.message,
        link: input.link,
        data: input.data,
        sentVia: input.sentVia ?? ['in-app'],
        notifiableType: input.notifiableType,
        notifiableId: input.notifiableId !== undefined ? toBigInt(input.notifiableId) : undefined
      }
    });
  }

  async listForUser(userId: string, status?: 'read' | 'unread') {
    return this.prisma.notification.findMany({
      where: {
        userId: toBigInt(userId),
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: toBigInt(notificationId),
        userId: toBigInt(userId),
        status: 'unread'
      },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId: toBigInt(userId),
        status: 'unread'
      },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });
  }

  async getOneForUser(userId: string, notificationId: string) {
    return this.prisma.notification.findFirst({
      where: {
        id: toBigInt(notificationId),
        userId: toBigInt(userId)
      }
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId: toBigInt(userId),
        status: 'unread'
      }
    });
  }
}
