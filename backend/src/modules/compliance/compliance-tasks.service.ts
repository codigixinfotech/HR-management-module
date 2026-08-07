import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplianceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PaginationQueryDto,
  buildPagination,
} from '../../common/dto/pagination.dto';
import {
  CreateComplianceTaskDto,
  UpdateComplianceTaskStatusDto,
} from './dto/compliance-task.dto';

@Injectable()
export class ComplianceTasksService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    complianceType: {
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        frequency: true,
      },
    },
    filedBy: { select: { id: true, firstName: true, lastName: true } },
  };

  async list(
    query: PaginationQueryDto,
    companyId?: string,
    status?: ComplianceStatus,
  ) {
    const { skip, take, page, pageSize } = buildPagination(query);
    const where = {
      ...(companyId ? { companyId } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.complianceTask.findMany({
        where,
        skip,
        take,
        orderBy: { dueDate: 'asc' },
        include: this.listInclude,
      }),
      this.prisma.complianceTask.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    const task = await this.prisma.complianceTask.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!task) throw new NotFoundException('Compliance task not found');
    return task;
  }

  create(dto: CreateComplianceTaskDto) {
    return this.prisma.complianceTask.create({
      data: { ...dto, dueDate: new Date(dto.dueDate) },
      include: this.listInclude,
    });
  }

  async updateStatus(id: string, dto: UpdateComplianceTaskStatusDto) {
    await this.findById(id);
    return this.prisma.complianceTask.update({
      where: { id },
      data: {
        status: dto.status,
        remarks: dto.remarks,
        filedById: dto.filedById,
        filedDate:
          dto.status === ComplianceStatus.FILED
            ? new Date(dto.filedDate ?? Date.now())
            : dto.filedDate
              ? new Date(dto.filedDate)
              : undefined,
      },
      include: this.listInclude,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.complianceTask.delete({ where: { id } });
    return { success: true };
  }
}
