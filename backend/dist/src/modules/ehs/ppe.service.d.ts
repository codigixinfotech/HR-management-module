import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePpeItemDto, IssuePpeDto, UpdatePpeItemDto } from './dto/ppe.dto';
export declare class PpeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
    }[]>;
    findById(id: string): Promise<{
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
    }>;
    create(dto: CreatePpeItemDto): import(".prisma/client").Prisma.Prisma__PpeItemClient<{
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdatePpeItemDto): Promise<{
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    issue(id: string, dto: IssuePpeDto): Promise<{
        id: string;
        employeeId: string;
        ppeItemId: string;
        quantity: number;
        issuedAt: Date;
    }>;
    listIssuances(ppeItemId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        ppeItem: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string;
        ppeItemId: string;
        quantity: number;
        issuedAt: Date;
    })[]>;
}
