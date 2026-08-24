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
        departmentId: string | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessUnit: string | null;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    })[]>;
    findOne(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        departmentId: string | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessUnit: string | null;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    create(dto: CreatePayGradeDto): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessUnit: string | null;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    update(id: string, dto: UpdatePayGradeDto): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessUnit: string | null;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        businessUnit: string | null;
        gradeCode: string;
        gradeName: string;
        level: string;
        category: string;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
}
