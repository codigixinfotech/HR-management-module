import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';
export declare class ShiftTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findById(id: string): Promise<{
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
