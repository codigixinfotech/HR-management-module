import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string, branchId?: string) {
    if (!companyId) return [];
    return this.prisma.department.findMany({
      where: {
        companyId,
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
      include: { parentDepartment: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parentDepartment: { select: { id: true, name: true } },
        childDepartments: true,
      },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A department with this code already exists for this company',
      );
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findById(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}
