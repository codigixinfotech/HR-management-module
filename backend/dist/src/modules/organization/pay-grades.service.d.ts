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
        id: string;
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
        companyId: string;
        departmentId: string | null;
        businessUnit: string | null;
        level: string;
        createdAt: Date;
        updatedAt: Date;
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
