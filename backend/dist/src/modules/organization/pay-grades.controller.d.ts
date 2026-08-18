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
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
