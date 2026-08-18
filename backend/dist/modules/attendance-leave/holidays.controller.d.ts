import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
export declare class HolidaysController {
    private readonly holidaysService;
    constructor(holidaysService: HolidaysService);
    list(companyId?: string, year?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        isActive: boolean;
        type: string;
        date: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        isActive: boolean;
        type: string;
        date: Date;
    }>;
    create(dto: CreateHolidayDto): import(".prisma/client").Prisma.Prisma__HolidayClient<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        isActive: boolean;
        type: string;
        date: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateHolidayDto): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        isActive: boolean;
        type: string;
        date: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
