import { PpeService } from './ppe.service';
import { CreatePpeItemDto, IssuePpeDto, UpdatePpeItemDto } from './dto/ppe.dto';
export declare class PpeController {
    private readonly ppeService;
    constructor(ppeService: PpeService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        category: string;
        stockQuantity: number;
    }[]>;
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
    create(dto: CreatePpeItemDto): import(".prisma/client").Prisma.Prisma__PpeItemClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        category: string;
        stockQuantity: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdatePpeItemDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
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
}
