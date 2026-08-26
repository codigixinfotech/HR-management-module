import { ShiftTypesService } from './shift-types.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';
export declare class ShiftTypesController {
    private readonly shiftTypesService;
    constructor(shiftTypesService: ShiftTypesService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }[]>;
    findOne(id: string): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    create(dto: CreateShiftTypeDto): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    update(id: string, dto: UpdateShiftTypeDto): Promise<{
        companyId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
