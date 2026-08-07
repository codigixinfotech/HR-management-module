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

  async list(query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = buildPagination(query);
    const where = query.search ? { email: { contains: query.search } } : {};

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
        roles: dto.roleIds
          ? { create: dto.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: this.listInclude,
    });

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
