import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSalaryComponentDto,
  UpdateSalaryComponentDto,
} from './dto/salary-component.dto';

@Injectable()
export class SalaryComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.salaryComponent.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const component = await this.prisma.salaryComponent.findUnique({
      where: { id },
    });
    if (!component) throw new NotFoundException('Salary component not found');
    return component;
  }

  async create(dto: CreateSalaryComponentDto) {
    const existing = await this.prisma.salaryComponent.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A salary component with this code already exists for this company',
      );
    return this.prisma.salaryComponent.create({ data: dto });
  }

  async update(id: string, dto: UpdateSalaryComponentDto) {
    await this.findById(id);
    return this.prisma.salaryComponent.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.salaryComponent.delete({ where: { id } });
    return { success: true };
  }
}
