import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';
export declare class ShiftTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    create(dto: CreateShiftTypeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        code: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        isNightShift: boolean;
    }>;
    update(id: string, dto: UpdateShiftTypeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
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
