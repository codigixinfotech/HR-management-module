import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
export declare class OnboardingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForEmployee(employeeId: string): Promise<{
        title: string;
        description: string | null;
        dueDate: Date | null;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        completedAt: Date | null;
        employeeId: string;
        ownerType: string;
    }[]>;
    createTask(employeeId: string, dto: CreateOnboardingTaskDto): Promise<{
        title: string;
        description: string | null;
        dueDate: Date | null;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        completedAt: Date | null;
        employeeId: string;
        ownerType: string;
    }>;
    updateStatus(taskId: string, status: ApprovalStatus): Promise<{
        title: string;
        description: string | null;
        dueDate: Date | null;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        completedAt: Date | null;
        employeeId: string;
        ownerType: string;
    }>;
}
