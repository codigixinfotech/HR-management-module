import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePpeItemDto, IssuePpeDto, UpdatePpeItemDto } from './dto/ppe.dto';

@Injectable()
export class PpeService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.ppeItem.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.ppeItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('PPE item not found');
    return item;
  }

  create(dto: CreatePpeItemDto) {
    return this.prisma.ppeItem.create({ data: dto });
  }

  async update(id: string, dto: UpdatePpeItemDto) {
    await this.findById(id);
    return this.prisma.ppeItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.ppeItem.delete({ where: { id } });
    return { success: true };
  }

  async issue(id: string, dto: IssuePpeDto) {
    const item = await this.findById(id);
    if (item.stockQuantity < dto.quantity) {
      throw new ConflictException('Not enough stock to issue this quantity');
    }
    const [issuance] = await this.prisma.$transaction([
      this.prisma.ppeIssuance.create({
        data: { ppeItemId: id, employeeId: dto.employeeId, quantity: dto.quantity },
      }),
      this.prisma.ppeItem.update({
        where: { id },
        data: { stockQuantity: { decrement: dto.quantity } },
      }),
    ]);
    return issuance;
  }

  listIssuances(ppeItemId?: string) {
    return this.prisma.ppeIssuance.findMany({
      where: ppeItemId ? { ppeItemId } : undefined,
      include: {
        ppeItem: { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
