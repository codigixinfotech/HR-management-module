import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSafetyIncidentDto, UpdateSafetyIncidentStatusDto } from './dto/safety-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    reportedBy: { select: { id: true, firstName: true, lastName: true } },
  };

  list(companyId?: string) {
    return this.prisma.safetyIncident.findMany({
      where: companyId ? { companyId } : undefined,
      include: this.listInclude,
      orderBy: { occurredAt: 'desc' },
    });
  }

  async findById(id: string) {
    const incident = await this.prisma.safetyIncident.findUnique({ where: { id }, include: this.listInclude });
    if (!incident) throw new NotFoundException('Safety incident not found');
    return incident;
  }

  create(dto: CreateSafetyIncidentDto) {
    return this.prisma.safetyIncident.create({
      data: { ...dto, occurredAt: new Date(dto.occurredAt) },
      include: this.listInclude,
    });
  }

  async updateStatus(id: string, dto: UpdateSafetyIncidentStatusDto) {
    await this.findById(id);
    return this.prisma.safetyIncident.update({
      where: { id },
      data: dto,
      include: this.listInclude,
    });
  }
}
