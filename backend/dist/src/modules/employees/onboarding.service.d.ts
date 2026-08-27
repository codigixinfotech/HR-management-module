import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
export declare class OnboardingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForEmployee(employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        description: string | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        ownerType: string;
    }[]>;
    createTask(employeeId: string, dto: CreateOnboardingTaskDto): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        description: string | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        ownerType: string;
    }>;
    updateStatus(taskId: string, status: ApprovalStatus): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        description: string | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        ownerType: string;
    }>;
}
