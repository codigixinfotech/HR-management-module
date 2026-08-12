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
    documents: true,
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

  private parseDates(dto: any) {
    const dateFields = [
      'dateOfBirth',
      'dateOfJoining',
      'confirmationDate',
      'familyDob',
      'prevStartDate',
      'prevEndDate',
      'kycVerificationDate',
      'pfEsicJoiningDate',
      'salaryEffectiveFrom',
    ];
    const parsed = { ...dto };
    for (const field of dateFields) {
      if (parsed[field] !== undefined && parsed[field] !== null && parsed[field] !== '') {
        parsed[field] = new Date(parsed[field]);
      } else if (parsed[field] === '') {
        parsed[field] = null;
      }
    }
    return parsed;
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        ...this.listInclude,
        documents: true,
        onboardingTasks: { orderBy: { createdAt: 'asc' } },
        courseEnrollments: { orderBy: { enrollmentDate: 'desc' } },
        kpis: { orderBy: { createdAt: 'desc' } },
        hrNotes: { orderBy: { createdDate: 'desc' } },
        timelineEvents: { orderBy: { date: 'asc' } },
        currentAssets: true,
        salaryComponents: {
          include: {
            salaryComponent: true,
          },
        },
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

    const parsedData = this.parseDates(dto);

    const employee = await this.prisma.employee.create({
      data: parsedData,
      include: this.listInclude,
    });

    try {
      await this.prisma.careerTimelineEvent.create({
        data: {
          employeeId: employee.id,
          date: employee.dateOfJoining ?? new Date(),
          eventTitle: 'Joined Company Entity',
          details: `Joined as ${employee.employmentType || 'PERMANENT'} employee.`,
          eventType: 'JOINED',
        },
      });
    } catch (e) {
      console.error('Failed to create initial timeline event:', e);
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findById(id);
    const parsedData = this.parseDates(dto);
    return this.prisma.employee.update({
      where: { id },
      data: parsedData,
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

  async enrollInCourse(
    employeeId: string,
    dto: { courseName: string; courseType: string; status?: string; certification?: string },
  ) {
    await this.findById(employeeId);
    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        employeeId,
        courseName: dto.courseName,
        courseType: dto.courseType,
        status: dto.status ?? 'In Progress',
        certification: dto.certification ?? null,
      },
    });

    try {
      await this.prisma.careerTimelineEvent.create({
        data: {
          employeeId,
          eventTitle: 'Enrolled in Upskilling Course',
          details: `Enrolled in "${dto.courseName}" (${dto.courseType}).`,
          eventType: 'TRAINING',
        },
      });
    } catch (e) {
      console.error('Failed to create timeline event:', e);
    }

    return enrollment;
  }

  async addKpi(
    employeeId: string,
    dto: { kpi: string; category: string; target: string; weightage: number; reviewPeriod: string; performanceRating?: number; managerFeedback?: string },
  ) {
    await this.findById(employeeId);
    return this.prisma.employeeKpi.create({
      data: {
        employeeId,
        kpi: dto.kpi,
        category: dto.category,
        target: dto.target,
        weightage: dto.weightage,
        reviewPeriod: dto.reviewPeriod,
        performanceRating: dto.performanceRating ?? null,
        managerFeedback: dto.managerFeedback ?? null,
      },
    });
  }

  async addHrNote(
    employeeId: string,
    dto: { note: string; noteType: string; createdBy: string },
  ) {
    await this.findById(employeeId);
    return this.prisma.employeeHrNote.create({
      data: {
        employeeId,
        note: dto.note,
        noteType: dto.noteType,
        createdBy: dto.createdBy,
      },
    });
  }

  async listSkills() {
    return this.prisma.$queryRawUnsafe('SELECT * FROM skill_competencies ORDER BY createdAt DESC');
  }

  async createSkill(dto: { name: string; category: string; certRequired: boolean; benchmarkScore: string }) {
    const id = 'skl_' + Math.random().toString(36).substring(2, 11);
    const certRequiredVal = dto.certRequired ? 1 : 0;
    await this.prisma.$executeRawUnsafe(
      'INSERT INTO skill_competencies (id, name, category, certRequired, benchmarkScore, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      id,
      dto.name,
      dto.category,
      certRequiredVal,
      dto.benchmarkScore,
    );
    const results: any[] = await this.prisma.$queryRawUnsafe('SELECT * FROM skill_competencies WHERE id = ?', id);
    return results[0];
  }

  async removeSkill(id: string) {
    await this.prisma.$executeRawUnsafe('DELETE FROM skill_competencies WHERE id = ?', id);
    return { success: true };
  }
}
