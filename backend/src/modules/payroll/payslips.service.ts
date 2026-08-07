import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PayslipsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    employee: {
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    },
    components: true,
  };

  list(payrollRunId?: string, employeeId?: string) {
    return this.prisma.payslip.findMany({
      where: {
        ...(payrollRunId ? { payrollRunId } : {}),
        ...(employeeId ? { employeeId } : {}),
      },
      include: this.listInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }
}
