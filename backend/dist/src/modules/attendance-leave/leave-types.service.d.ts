import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';
export declare class LeaveTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }[]>;
    findById(id: string): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    create(dto: CreateLeaveTypeDto): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    update(id: string, dto: UpdateLeaveTypeDto): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
