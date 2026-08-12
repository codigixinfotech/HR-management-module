import { PrismaService } from '../../common/prisma/prisma.service';
export declare class TransfersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): Promise<any[]>;
    findById(id: string): Promise<any>;
    create(dto: {
        employeeId: string;
        movementType: string;
        newDepartmentId?: string;
        newDesignationId?: string;
        newGradeId?: string;
        newBranchId?: string;
        newReportingManagerId?: string;
        effectiveDate: string;
        reason: string;
        remarks?: string;
    }): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    approve(id: string, body: {
        comments?: string;
        approvedBy?: string;
    }): Promise<any>;
    reject(id: string, body: {
        reason: string;
        comments?: string;
        approvedBy?: string;
    }): Promise<any>;
    cancel(id: string): Promise<any>;
    makeEffective(id: string): Promise<any>;
}
