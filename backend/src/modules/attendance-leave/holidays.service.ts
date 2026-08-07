import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string, year?: number) {
    return this.prisma.holiday.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(year
          ? {
              date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async findById(id: string) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    if (!holiday) throw new NotFoundException('Holiday not found');
    return holiday;
  }

  create(dto: CreateHolidayDto) {
    return this.prisma.holiday.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  async update(id: string, dto: UpdateHolidayDto) {
    await this.findById(id);
    return this.prisma.holiday.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.holiday.delete({ where: { id } });
    return { success: true };
  }
}
