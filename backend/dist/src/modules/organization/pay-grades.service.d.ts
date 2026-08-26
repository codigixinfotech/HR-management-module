import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePayGradeDto, UpdatePayGradeDto } from './dto/pay-grade.dto';
export declare class PayGradesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): Promise<({
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        description: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        effectiveFrom: Date;
        jobFamily: string | null;
        currency: string;
        businessUnit: string | null;
        level: string;
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
        companyId: string;
        departmentId: string | null;
        description: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        effectiveFrom: Date;
        jobFamily: string | null;
        currency: string;
        businessUnit: string | null;
        level: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
    create(dto: CreatePayGradeDto): Promise<{
        companyId: string;
        departmentId: string | null;
        description: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        effectiveFrom: Date;
        jobFamily: string | null;
        currency: string;
        businessUnit: string | null;
        level: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
    update(id: string, dto: UpdatePayGradeDto): Promise<{
        companyId: string;
        departmentId: string | null;
        description: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        effectiveFrom: Date;
        jobFamily: string | null;
        currency: string;
        businessUnit: string | null;
        level: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
    remove(id: string): Promise<{
        companyId: string;
        departmentId: string | null;
        description: string | null;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        effectiveFrom: Date;
        jobFamily: string | null;
        currency: string;
        businessUnit: string | null;
        level: string;
        gradeCode: string;
        gradeName: string;
        category: string;
    }>;
}
