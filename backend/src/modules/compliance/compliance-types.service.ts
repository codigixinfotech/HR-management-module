import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateComplianceTypeDto,
  UpdateComplianceTypeDto,
} from './dto/compliance-type.dto';

@Injectable()
export class ComplianceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.complianceType.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const complianceType = await this.prisma.complianceType.findUnique({
      where: { id },
    });
    if (!complianceType)
      throw new NotFoundException('Compliance type not found');
    return complianceType;
  }

  async create(dto: CreateComplianceTypeDto) {
    const existing = await this.prisma.complianceType.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A compliance type with this code already exists for this company',
      );
    return this.prisma.complianceType.create({ data: dto });
  }

  async update(id: string, dto: UpdateComplianceTypeDto) {
    await this.findById(id);
    return this.prisma.complianceType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.complianceType.delete({ where: { id } });
    return { success: true };
  }
}
