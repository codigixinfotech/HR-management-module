import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';

const INITIAL_HOLIDAYS_MOCK = [
  {
    id: 'h1',
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday for all company employees.',
    isActive: true,
  },
  {
    id: 'h2',
    name: 'Ambedkar Jayanti',
    date: '2026-04-14',
    type: 'Regional',
    category: 'Regional',
    scope: 'Region/State-specific',
    applicableLocations: ['Maharashtra State'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Dr. B. R. Ambedkar.',
    isActive: true,
  },
  {
    id: 'h3',
    name: 'Maharashtra Day',
    date: '2026-05-01',
    type: 'Regional',
    category: 'Regional',
    scope: 'Branch-specific',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Statehood day celebrating Maharashtra state formation.',
    isActive: true,
  },
  {
    id: 'h4',
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday celebrating Indian Independence.',
    isActive: true,
  },
  {
    id: 'h5',
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Mahatma Gandhi.',
    isActive: true,
  },
  {
    id: 'h6',
    name: 'Dussehra (Vijayadashami)',
    date: '2026-10-20',
    type: 'Restricted / Optional',
    category: 'Festival',
    scope: 'Branch-specific',
    applicableLocations: ['Pune Manufacturing Plant'],
    isPaid: true,
    isOptional: true,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Restricted festival holiday selectable by employees.',
    isActive: true,
  },
  {
    id: 'h7',
    name: 'Diwali (Laxmi Pujan)',
    date: '2026-11-08',
    type: 'Mandatory',
    category: 'Festival',
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Major national festival of lights.',
    isActive: true,
  },
  {
    id: 'h8',
    name: 'Christmas Day',
    date: '2026-12-25',
    type: 'Mandatory',
    category: 'Festival',
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Annual festival celebrating Christmas across all branches.',
    isActive: true,
  },
];

@Injectable()
export class HolidaysService {
  private inMemoryHolidays = [...INITIAL_HOLIDAYS_MOCK];

  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string, year?: number) {
    if ((this.prisma as any).holiday) {
      try {
        return await (this.prisma as any).holiday.findMany({
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
      } catch (e) {
        // Fallback to in-memory store
      }
    }
    return this.inMemoryHolidays;
  }

  async findById(id: string) {
    if ((this.prisma as any).holiday) {
      try {
        const holiday = await (this.prisma as any).holiday.findUnique({ where: { id } });
        if (holiday) return holiday;
      } catch (e) {}
    }
    const holiday = this.inMemoryHolidays.find(h => h.id === id);
    if (!holiday) throw new NotFoundException('Holiday not found');
    return holiday;
  }

  async create(dto: CreateHolidayDto) {
    if ((this.prisma as any).holiday) {
      try {
        return await (this.prisma as any).holiday.create({
          data: { ...dto, date: new Date(dto.date) },
        });
      } catch (e) {}
    }
    const newHoliday: any = {
      id: `h_${Date.now()}`,
      ...dto,
      date: dto.date,
      type: dto.type || 'Mandatory',
      category: dto.category || 'National',
      scope: dto.scope || 'Company-wide',
      applicableLocations: dto.applicableLocations || ['Company-wide'],
      isPaid: dto.isPaid ?? true,
      isOptional: dto.isOptional ?? false,
      attendanceOverride: dto.attendanceOverride ?? true,
      payrollImpact: dto.payrollImpact || 'Paid Holiday',
      description: dto.description || '',
      isActive: dto.isActive ?? true,
    };
    this.inMemoryHolidays.push(newHoliday);
    return newHoliday;
  }

  async update(id: string, dto: UpdateHolidayDto) {
    if ((this.prisma as any).holiday) {
      try {
        return await (this.prisma as any).holiday.update({
          where: { id },
          data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
        });
      } catch (e) {}
    }
    const idx = this.inMemoryHolidays.findIndex(h => h.id === id);
    if (idx === -1) throw new NotFoundException('Holiday not found');
    this.inMemoryHolidays[idx] = { ...this.inMemoryHolidays[idx], ...dto };
    return this.inMemoryHolidays[idx];
  }

  async remove(id: string) {
    if ((this.prisma as any).holiday) {
      try {
        await (this.prisma as any).holiday.delete({ where: { id } });
        return { success: true };
      } catch (e) {}
    }
    this.inMemoryHolidays = this.inMemoryHolidays.filter(h => h.id !== id);
    return { success: true };
  }
}
