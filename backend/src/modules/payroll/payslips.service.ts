import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PayslipsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    employee: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        dateOfJoining: true,
        panNumber: true,
        uanNumber: true,
        pfMemberId: true,
        esicNumber: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            pan: true,
            registeredAddress: true,
            city: true,
            state: true,
            pincode: true,
            email: true,
            phone: true,
          },
        },
      },
    },
    payrollRun: {
      select: {
        id: true,
        month: true,
        year: true,
        status: true,
        processedAt: true,
        approvedAt: true,
        paidAt: true,
      },
    },
    components: true,
  };

  list(payrollRunId?: string, employeeId?: string, branchId?: string, companyId?: string) {
    return this.prisma.payslip.findMany({
      where: {
        ...(payrollRunId ? { payrollRunId } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(branchId ? { employee: { branchId } } : {}),
        ...(companyId ? { employee: { companyId } } : {}),
      },
      include: this.listInclude,
      orderBy: { createdAt: 'desc' },
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

