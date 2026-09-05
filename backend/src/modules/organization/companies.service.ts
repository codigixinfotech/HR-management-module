import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.company.findMany({
      where: companyId ? { OR: [{ id: companyId }, { parentCompanyId: companyId }] } : undefined,
      include: { parentCompany: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(dto: CreateCompanyDto) {
    let code = dto.code;
    const existing = await this.prisma.company.findUnique({
      where: { code },
    });
    if (existing) {
      const allCompanies = await this.prisma.company.findMany({ select: { code: true } });
      const existingCodes = new Set(allCompanies.map((c) => c.code));
      let count = allCompanies.length + 1;
      let newCode = `COMP-${String(count).padStart(2, '0')}`;
      while (existingCodes.has(newCode)) {
        count++;
        newCode = `COMP-${String(count).padStart(2, '0')}`;
      }
      code = newCode;
    }
    return this.prisma.company.create({ data: { ...dto, code } });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findById(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);

    // Prevent deletion if employees are assigned to this company
    const employeeCount = await this.prisma.employee.count({
      where: { companyId: id },
    });
    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete corporate entity because ${employeeCount} employee(s) are assigned to it. Please reassign or remove employees first.`
      );
    }

    try {
      // Disconnect parent company references
      await this.prisma.company.updateMany({
        where: { parentCompanyId: id },
        data: { parentCompanyId: null },
      });

      // Delete associated branches & physical locations
      await this.prisma.location.deleteMany({
        where: { branch: { companyId: id } },
      });
      await this.prisma.branch.deleteMany({
        where: { companyId: id },
      });

      // Delete associated departments & designations
      await this.prisma.department.deleteMany({
        where: { companyId: id },
      });
      await this.prisma.designation.deleteMany({
        where: { companyId: id },
      });

      // Delete associated cost centers, pay grades, and hr policies
      await this.prisma.costCenter.deleteMany({
        where: { companyId: id },
      });
      await this.prisma.payGrade.deleteMany({
        where: { companyId: id },
      });
      await this.prisma.hrPolicy.deleteMany({
        where: { companyId: id },
      });

      await this.prisma.company.delete({
        where: { id },
      });

      return { success: true };
    } catch (err: any) {
      throw new BadRequestException(
        err?.message ?? 'Failed to delete corporate entity due to associated record constraints.'
      );
    }
  }
}
