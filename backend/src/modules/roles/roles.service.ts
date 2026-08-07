import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = { permissions: { include: { permission: true } } };

  list() {
    return this.prisma.role.findMany({
      include: this.include,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: this.include,
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { name: dto.name, companyId: dto.companyId ?? null },
    });
    if (existing)
      throw new ConflictException(
        'A role with this name already exists for this scope',
      );

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        companyId: dto.companyId,
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: this.include,
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findById(id);
    if (role.isSystem)
      throw new BadRequestException('System roles cannot be modified');

    if (dto.permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: this.include,
    });
  }

  async remove(id: string) {
    const role = await this.findById(id);
    if (role.isSystem)
      throw new BadRequestException('System roles cannot be deleted');
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }
}
