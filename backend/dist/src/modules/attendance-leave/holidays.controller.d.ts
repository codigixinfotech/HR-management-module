import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
export declare class HolidaysController {
    private readonly holidaysService;
    constructor(holidaysService: HolidaysService);
    list(companyId?: string, year?: string): import(".prisma/client").Prisma.PrismaPromise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }[]>;
    findOne(id: string): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }>;
    create(dto: CreateHolidayDto): import(".prisma/client").Prisma.Prisma__HolidayClient<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateHolidayDto): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        date: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
