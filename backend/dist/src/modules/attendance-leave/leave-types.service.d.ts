import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';
export declare class LeaveTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    create(dto: CreateLeaveTypeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    update(id: string, dto: UpdateLeaveTypeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
