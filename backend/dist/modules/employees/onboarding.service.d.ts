import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
export declare class OnboardingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForEmployee(employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        employeeId: string;
        ownerType: string;
        dueDate: Date | null;
        completedAt: Date | null;
    }[]>;
    createTask(employeeId: string, dto: CreateOnboardingTaskDto): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        employeeId: string;
        ownerType: string;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
    updateStatus(taskId: string, status: ApprovalStatus): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        employeeId: string;
        ownerType: string;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
}
