import { ShiftTypesService } from './shift-types.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';
export declare class ShiftTypesController {
    private readonly shiftTypesService;
    constructor(shiftTypesService: ShiftTypesService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    create(dto: CreateShiftTypeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    update(id: string, dto: UpdateShiftTypeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
