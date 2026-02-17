import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(profileId: string) {
    const user = await this.prisma.profile.findUnique({
      where: { id: toBigInt(profileId) },
      include: {
        organizations: {
          include: { organization: true }
        }
      }
    });

    if (!user) throw new NotFoundException('Profile not found');
    return user;
  }

  async updateMyProfile(profileId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { id: toBigInt(profileId) }
    });
    if (!existing) throw new NotFoundException('Profile not found');

    return this.prisma.profile.update({
      where: { id: existing.id },
      data: {
        firstName: dto.first_name ?? existing.firstName,
        lastName: dto.last_name ?? existing.lastName,
        dateOfBirth: dto.date_of_birth ? new Date(dto.date_of_birth) : existing.dateOfBirth,
        gender: dto.gender ?? existing.gender,
        phone: dto.phone ?? existing.phone,
        address: dto.address ?? existing.address,
        nationality: dto.nationality ?? existing.nationality,
        state: dto.state ?? existing.state,
        lga: dto.lga ?? existing.lga,
        maritalStatus: dto.marital_status ?? existing.maritalStatus,
        avatar: dto.avatar ?? existing.avatar,
        bio: dto.bio ?? existing.bio,
        occupation: dto.occupation ?? existing.occupation,
        email: dto.email ? dto.email.trim().toLowerCase() : existing.email
      }
    });
  }

  async listUsers(filters: Record<string, any>) {
    const page = Number(filters.page ?? 1);
    const perPage = Number(filters.per_page ?? 15);
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage
      }),
      this.prisma.profile.count({ where })
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

  async createUser(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.profile.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already exists');

    const usernameExists = await this.prisma.profile.findUnique({
      where: { username: dto.username }
    });
    if (usernameExists) throw new BadRequestException('Username already exists');

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;

    return this.prisma.profile.create({
      data: {
        username: dto.username,
        email,
        passwordHash,
        type: dto.type ?? 'staff',
        status: 'active',
        firstName: dto.first_name,
        lastName: dto.last_name
      }
    });
  }
}
