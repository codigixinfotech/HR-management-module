import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePpeItemDto, IssuePpeDto, UpdatePpeItemDto } from './dto/ppe.dto';
export declare class PpeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
        updatedAt: Date;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
        updatedAt: Date;
    }>;
    create(dto: CreatePpeItemDto): import(".prisma/client").Prisma.Prisma__PpeItemClient<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdatePpeItemDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    issue(id: string, dto: IssuePpeDto): Promise<{
        id: string;
        ppeItemId: string;
        employeeId: string;
        quantity: number;
        issuedAt: Date;
    }>;
    listIssuances(ppeItemId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        ppeItem: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        ppeItemId: string;
        employeeId: string;
        quantity: number;
        issuedAt: Date;
    })[]>;
}
