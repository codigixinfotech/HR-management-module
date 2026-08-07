import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateJobOpeningDto,
  UpdateJobOpeningDto,
} from './dto/job-opening.dto';

@Injectable()
export class JobOpeningsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.jobOpening.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const opening = await this.prisma.jobOpening.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        candidates: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!opening) throw new NotFoundException('Job opening not found');
    return opening;
  }

  create(dto: CreateJobOpeningDto) {
    return this.prisma.jobOpening.create({ data: dto });
  }

  async update(id: string, dto: UpdateJobOpeningDto) {
    await this.findById(id);
    return this.prisma.jobOpening.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.jobOpening.delete({ where: { id } });
    return { success: true };
  }
}
