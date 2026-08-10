import { PayGradesService } from './pay-grades.service';
import { CreatePayGradeDto, UpdatePayGradeDto } from './dto/pay-grade.dto';
export declare class PayGradesController {
    private readonly service;
    constructor(service: PayGradesService);
    list(companyId?: string): Promise<({
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        currency: string;
        businessUnit: string | null;
        effectiveFrom: Date;
        departmentId: string | null;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
    })[]>;
    findOne(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        currency: string;
        businessUnit: string | null;
        effectiveFrom: Date;
        departmentId: string | null;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
    }>;
    create(dto: CreatePayGradeDto): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        currency: string;
        businessUnit: string | null;
        effectiveFrom: Date;
        departmentId: string | null;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
    }>;
    update(id: string, dto: UpdatePayGradeDto): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        currency: string;
        businessUnit: string | null;
        effectiveFrom: Date;
        departmentId: string | null;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        currency: string;
        businessUnit: string | null;
        effectiveFrom: Date;
        departmentId: string | null;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
    }>;
}
