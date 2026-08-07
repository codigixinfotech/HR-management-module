import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSafetyAuditDto } from './dto/safety-audit.dto';

@Injectable()
export class SafetyAuditsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.safetyAudit.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { auditDate: 'desc' },
    });
  }

  create(dto: CreateSafetyAuditDto) {
    return this.prisma.safetyAudit.create({
      data: { ...dto, auditDate: new Date(dto.auditDate) },
    });
  }
}
