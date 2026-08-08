import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
export declare class HolidaysService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string, year?: number): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }>;
    create(dto: CreateHolidayDto): import("@prisma/client").Prisma.Prisma__HolidayClient<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateHolidayDto): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
