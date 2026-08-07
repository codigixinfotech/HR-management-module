import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
export declare class HolidaysController {
    private readonly holidaysService;
    constructor(holidaysService: HolidaysService);
    list(companyId?: string, year?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        date: Date;
        type: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        date: Date;
        type: string;
    }>;
    create(dto: CreateHolidayDto): import("@prisma/client").Prisma.Prisma__HolidayClient<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        date: Date;
        type: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateHolidayDto): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        date: Date;
        type: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
