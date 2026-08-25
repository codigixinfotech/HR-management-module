import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.branch.findMany({
      where: companyId ? { companyId } : undefined,
      include: { locations: true, employees: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { locations: true, employees: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A branch with this code already exists for this company',
      );
    return this.prisma.branch.create({ data: dto });
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findById(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }

  // Locations CRUD Support
  async listLocations(branchId: string) {
    return this.prisma.location.findMany({
      where: { branchId },
      orderBy: { code: 'asc' },
    });
  }

  async findLocationById(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async createLocation(branchId: string, dto: any) {
    let code = dto.code;
    if (!code) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: { locations: true },
      });
      const existingCodes = new Set((branch?.locations ?? []).map((l) => l.code));
      let count = (branch?.locations?.length ?? 0) + 1;
      code = `${branch?.code || 'BR'}-LOC-${String(count).padStart(2, '0')}`;
      while (existingCodes.has(code)) {
        count++;
        code = `${branch?.code || 'BR'}-LOC-${String(count).padStart(2, '0')}`;
      }
    } else {
      const existing = await this.prisma.location.findFirst({
        where: { branchId, code },
      });
      if (existing) {
        throw new ConflictException(
          'A location with this code already exists for this branch',
        );
      }
    }

    return this.prisma.location.create({
      data: { ...dto, code, branchId },
    });
  }

  async updateLocation(id: string, dto: any) {
    await this.findLocationById(id);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async removeLocation(id: string) {
    await this.findLocationById(id);
    await this.prisma.location.delete({ where: { id } });
    return { success: true };
  }
}
