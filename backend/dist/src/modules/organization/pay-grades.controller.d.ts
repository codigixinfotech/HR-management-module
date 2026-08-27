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
        createdAt: Date;
        category: string;
        updatedAt: Date;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        currency: string;
        isActive: boolean;
        effectiveFrom: Date;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
    })[]>;
    findOne(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        currency: string;
        isActive: boolean;
        effectiveFrom: Date;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
    }>;
    create(dto: CreatePayGradeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        currency: string;
        isActive: boolean;
        effectiveFrom: Date;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
    }>;
    update(id: string, dto: UpdatePayGradeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        currency: string;
        isActive: boolean;
        effectiveFrom: Date;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        currency: string;
        isActive: boolean;
        effectiveFrom: Date;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        gradeCode: string;
        gradeName: string;
    }>;
}
