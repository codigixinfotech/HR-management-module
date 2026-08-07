import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateShiftAssignmentDto,
  UpdateShiftAssignmentDto,
} from './dto/shift-assignment.dto';

@Injectable()
export class ShiftAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    employee: {
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    },
    shiftType: {
      select: { id: true, name: true, startTime: true, endTime: true },
    },
  };

  list(employeeId?: string, shiftTypeId?: string) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(shiftTypeId ? { shiftTypeId } : {}),
      },
      include: this.listInclude,
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findById(id: string) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!assignment) throw new NotFoundException('Shift assignment not found');
    return assignment;
  }

  create(dto: CreateShiftAssignmentDto) {
    return this.prisma.shiftAssignment.create({
      data: {
        ...dto,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
      include: this.listInclude,
    });
  }

  async update(id: string, dto: UpdateShiftAssignmentDto) {
    await this.findById(id);
    return this.prisma.shiftAssignment.update({
      where: { id },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
      include: this.listInclude,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.shiftAssignment.delete({ where: { id } });
    return { success: true };
  }
}
