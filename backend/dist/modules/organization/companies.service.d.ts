import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
export declare class CompaniesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        legalName: string | null;
        country: string;
        currency: string;
        timezone: string;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        legalName: string | null;
        country: string;
        currency: string;
        timezone: string;
    }>;
    create(dto: CreateCompanyDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        legalName: string | null;
        country: string;
        currency: string;
        timezone: string;
    }>;
    update(id: string, dto: UpdateCompanyDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        legalName: string | null;
        country: string;
        currency: string;
        timezone: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
