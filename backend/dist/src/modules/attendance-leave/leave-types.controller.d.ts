import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';
export declare class LeaveTypesController {
    private readonly leaveTypesService;
    constructor(leaveTypesService: LeaveTypesService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    create(dto: CreateLeaveTypeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        code: string;
        isActive: boolean;
        isPaid: boolean;
        annualQuota: number;
        carryForward: boolean;
    }>;
    update(id: string, dto: UpdateLeaveTypeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
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
