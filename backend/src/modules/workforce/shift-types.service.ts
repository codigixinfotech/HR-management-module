import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';

@Injectable()
export class ShiftTypesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.shiftType.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const shiftType = await this.prisma.shiftType.findUnique({ where: { id } });
    if (!shiftType) throw new NotFoundException('Shift type not found');
    return shiftType;
  }

  async create(dto: CreateShiftTypeDto) {
    const existing = await this.prisma.shiftType.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A shift type with this code already exists for this company',
      );
    return this.prisma.shiftType.create({ data: dto });
  }

  async update(id: string, dto: UpdateShiftTypeDto) {
    await this.findById(id);
    return this.prisma.shiftType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.shiftType.delete({ where: { id } });
    return { success: true };
  }
}
