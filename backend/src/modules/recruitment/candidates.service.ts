import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateStage } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCandidateDto } from './dto/candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  listForJobOpening(jobOpeningId: string) {
    return this.prisma.candidate.findMany({
      where: { jobOpeningId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  create(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({ data: dto });
  }

  async updateStage(id: string, stage: CandidateStage) {
    await this.findById(id);
    return this.prisma.candidate.update({ where: { id }, data: { stage } });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.candidate.delete({ where: { id } });
    return { success: true };
  }
}
