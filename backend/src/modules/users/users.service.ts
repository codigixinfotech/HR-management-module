import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginationQueryDto,
  buildPagination,
} from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    company: { select: { id: true, name: true } },
    roles: { include: { role: { select: { id: true, name: true } } } },
  };

  async list(query: PaginationQueryDto & { companyId?: string }) {
    const { skip, take, page, pageSize } = buildPagination(query);
    const where: any = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.search) where.email = { contains: query.search };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.listInclude,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(({ passwordHash: _passwordHash, ...rest }) => rest),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        companyId: dto.companyId,
        mustResetPassword: dto.mustResetPassword ?? true,
        roles: dto.roleIds
          ? { create: dto.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: this.listInclude,
    });

    if (dto.employeeName || dto.companyId) {
      const nameParts = (dto.employeeName || 'New User').trim().split(' ');
      const firstName = nameParts[0] || 'New';
      const lastName = nameParts.slice(1).join(' ') || 'User';
      const empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      await this.prisma.employee.create({
        data: {
          companyId: dto.companyId || user.companyId || '',
          userId: user.id,
          employeeCode: empCode,
          firstName,
          lastName,
          workEmail: dto.email,
          phone: dto.phone,
          departmentId: dto.departmentId,
          dateOfJoining: new Date(),
          status: 'ACTIVE',
        },
      });
    }

    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    if (dto.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        roles: dto.roleIds
          ? { create: dto.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: this.listInclude,
    });

    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
