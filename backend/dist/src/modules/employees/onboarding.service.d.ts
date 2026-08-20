import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
export declare class OnboardingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForEmployee(employeeId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        title: string;
        description: string | null;
        dueDate: Date | null;
        completedAt: Date | null;
        employeeId: string;
        ownerType: string;
    }[]>;
    createTask(employeeId: string, dto: CreateOnboardingTaskDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        title: string;
        description: string | null;
        dueDate: Date | null;
        completedAt: Date | null;
        employeeId: string;
        ownerType: string;
    }>;
    updateStatus(taskId: string, status: ApprovalStatus): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        title: string;
        description: string | null;
        dueDate: Date | null;
        completedAt: Date | null;
        employeeId: string;
        ownerType: string;
    }>;
}
