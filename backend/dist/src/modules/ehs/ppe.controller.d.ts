import { PpeService } from './ppe.service';
import { CreatePpeItemDto, IssuePpeDto, UpdatePpeItemDto } from './dto/ppe.dto';
export declare class PpeController {
    private readonly ppeService;
    constructor(ppeService: PpeService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        stockQuantity: number;
        updatedAt: Date;
    }[]>;
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
}
