import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  PaginationQueryDto,
  buildPagination,
} from '../../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    company: { select: { id: true, name: true } },
    branch: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    designation: { select: { id: true, title: true } },
    reportingManager: { select: { id: true, firstName: true, lastName: true } },
  };

  async list(query: PaginationQueryDto, companyId?: string) {
    const { skip, take, page, pageSize } = buildPagination(query);
    const where = {
      ...(companyId ? { companyId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { employeeCode: { contains: query.search } },
              { workEmail: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.listInclude,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        ...this.listInclude,
        documents: true,
        onboardingTasks: { orderBy: { createdAt: 'asc' } },
        directReports: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({
      where: { companyId: dto.companyId, employeeCode: dto.employeeCode },
    });
    if (existing)
      throw new ConflictException(
        'An employee with this code already exists for this company',
      );

    return this.prisma.employee.create({
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        dateOfJoining: dto.dateOfJoining
          ? new Date(dto.dateOfJoining)
          : undefined,
      },
      include: this.listInclude,
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findById(id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        dateOfJoining: dto.dateOfJoining
          ? new Date(dto.dateOfJoining)
          : undefined,
      },
      include: this.listInclude,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }

  async addDocument(
    employeeId: string,
    docType: string,
    fileName: string,
    filePath: string,
  ) {
    await this.findById(employeeId);
    return this.prisma.employeeDocument.create({
      data: { employeeId, docType, fileName, filePath },
    });
  }

  async listDocuments(employeeId: string) {
    await this.findById(employeeId);
    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async removeDocument(employeeId: string, documentId: string) {
    const doc = await this.prisma.employeeDocument.findFirst({
      where: { id: documentId, employeeId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.employeeDocument.delete({ where: { id: documentId } });
    return { success: true };
  }
}
