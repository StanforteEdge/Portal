import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AttachFileDto } from './dto/attach-file.dto';
import { Prisma } from '@prisma/client';
import { toBigInt } from '../../common/utils/ids';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));

    const where: Prisma.FileAssetWhereInput = {};

    if (query.organization_id) {
      where.organizationId = toBigInt(String(query.organization_id));
    }
    if (query.uploaded_by) {
      where.uploadedBy = toBigInt(String(query.uploaded_by));
    }
    if (query.request_item_id) {
      where.requestItems = {
        some: { id: String(query.request_item_id) }
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.fileAsset.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      this.prisma.fileAsset.count({ where })
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

  async attach(userId: string, dto: AttachFileDto) {
    if (!dto.storage_path && !dto.file_url) {
      throw new BadRequestException('storage_path or file_url is required');
    }

    if (dto.organization_id) {
      const org = await this.prisma.organization.findUnique({
        where: { id: toBigInt(dto.organization_id) },
        select: { id: true }
      });
      if (!org) throw new NotFoundException('Organization not found');
    }

    return this.prisma.fileAsset.create({
      data: {
        storageDisk: dto.storage_disk ?? 'local',
        storagePath: dto.storage_path || dto.file_url!,
        fileName: dto.file_name,
        mimeType: dto.mime_type ?? null,
        fileSize: dto.file_size !== undefined ? BigInt(dto.file_size) : null,
        publicUrl: dto.file_url ?? null,
        organizationId: dto.organization_id ? toBigInt(dto.organization_id) : null,
        uploadedBy: userId ? toBigInt(userId) : null,
        metadata: (dto.metadata ?? null) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
      }
    });
  }
}
