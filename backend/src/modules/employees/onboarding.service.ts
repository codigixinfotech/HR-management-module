import { Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async listForEmployee(employeeId: string) {
    return this.prisma.employeeOnboardingTask.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTask(employeeId: string, dto: CreateOnboardingTaskDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.employeeOnboardingTask.create({
      data: {
        employeeId,
        title: dto.title,
        description: dto.description,
        ownerType: dto.ownerType,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateStatus(taskId: string, status: ApprovalStatus) {
    const task = await this.prisma.employeeOnboardingTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Onboarding task not found');

    return this.prisma.employeeOnboardingTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
      },
    });
  }
}
