import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private readonly prisma: PrismaService) { }

  list(companyId?: string, departmentId?: string) {
    if (!companyId) return [];
    return this.prisma.designation.findMany({
      where: {
        companyId,
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        reportingDesignation: { select: { id: true, title: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findById(id: string) {
    const designation = await this.prisma.designation.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        reportingDesignation: { select: { id: true, title: true } },
      },
    });
    if (!designation) throw new NotFoundException('Designation not found');
    return designation;
  }

  async create(dto: CreateDesignationDto) {
    const existing = await this.prisma.designation.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A designation with this code already exists for this company',
      );
    return this.prisma.designation.create({ data: dto });
  }

  async update(id: string, dto: UpdateDesignationDto) {
    await this.findById(id);
    return this.prisma.designation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.designation.delete({ where: { id } });
    return { success: true };
  }
}
