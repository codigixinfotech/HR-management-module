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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    })[]>;
    findOne(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
    create(dto: CreatePayGradeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
    update(id: string, dto: UpdatePayGradeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        description: string | null;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
}
