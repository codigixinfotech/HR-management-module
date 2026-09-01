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

  list(companyId?: string, search?: string, type?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.salaryComponent.findMany({
      where,
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
        `A salary component with code "${dto.code}" already exists for this company`,
      );
    return this.prisma.salaryComponent.create({ data: dto });
  }

  async update(id: string, dto: UpdateSalaryComponentDto) {
    await this.findById(id);
    return this.prisma.salaryComponent.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);

    // Check if component is referenced by active template items or employee assignment details
    const inTemplate = await this.prisma.salaryStructureTemplateItem.findFirst({
      where: { salaryComponentId: id },
    });
    if (inTemplate) {
      throw new ConflictException(
        'Cannot delete component because it is referenced in active salary structure templates.',
      );
    }

    const inAssignment = await this.prisma.employeeSalaryComponentDetail.findFirst({
      where: { salaryComponentId: id },
    });
    if (inAssignment) {
      throw new ConflictException(
        'Cannot delete component because it is referenced in employee salary structures.',
      );
    }

    await this.prisma.salaryComponent.delete({ where: { id } });
    return { success: true };
  }
}
