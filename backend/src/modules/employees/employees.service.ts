import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  PaginationQueryDto,
  buildPagination,
} from '../../common/dto/pagination.dto';

@Injectable()
export class EmployeesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    try {
      const payGrades = await this.prisma.payGrade.findMany();
      for (const pg of payGrades) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE employees SET grade = ?, level = ? WHERE grade = ? OR level = ?`,
          pg.gradeCode,
          pg.level,
          pg.id,
          pg.id,
        );
        await this.prisma.$executeRawUnsafe(
          `UPDATE employee_position_histories SET grade = ?, level = ? WHERE grade = ? OR level = ?`,
          pg.gradeCode,
          pg.level,
          pg.id,
          pg.id,
        );
        await this.prisma.$executeRawUnsafe(
          `UPDATE employee_position_histories SET prevGrade = ? WHERE prevGrade = ?`,
          pg.gradeCode,
          pg.id,
        );
      }
    } catch (e) {
      console.error('Failed auto-repair of Grade IDs in DB:', e);
    }
  }

  private readonly listInclude = {
    company: { select: { id: true, name: true } },
    branch: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    designation: { select: { id: true, title: true } },
    reportingManager: { select: { id: true, firstName: true, lastName: true } },
    documents: true,
  };

  private readonly fullInclude = {
    company: { select: { id: true, name: true } },
    branch: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    designation: { select: { id: true, title: true } },
    reportingManager: { select: { id: true, firstName: true, lastName: true } },
    documents: true,
    onboardingTasks: { orderBy: { createdAt: 'asc' as const } },
    courseEnrollments: { orderBy: { createdAt: 'desc' as const } },
    kpis: { orderBy: { createdAt: 'desc' as const } },
    hrNotes: { orderBy: { createdDate: 'desc' as const } },
    timelineEvents: { orderBy: { date: 'asc' as const } },
    currentAssets: true,
    salaryComponents: {
      include: {
        salaryComponent: true,
      },
    },
    directReports: {
      select: { id: true, firstName: true, lastName: true },
    },
  };

  async findMe(currentUser: any) {
    if (!currentUser) {
      throw new NotFoundException('Current session employee not found');
    }

    const searchConditions: any[] = [];
    if (currentUser.employee?.id) searchConditions.push({ id: currentUser.employee.id });
    if (currentUser.userId) searchConditions.push({ userId: currentUser.userId });
    if (currentUser.email) searchConditions.push({ workEmail: currentUser.email });

    let employee = await this.prisma.employee.findFirst({
      where: searchConditions.length > 0 ? { OR: searchConditions } : {},
      include: this.fullInclude,
    });

    if (!employee && currentUser.email) {
      const emailPrefix = currentUser.email.split('@')[0];
      employee = await this.prisma.employee.findFirst({
        where: {
          OR: [
            { workEmail: { contains: emailPrefix } },
            { status: 'ACTIVE' },
          ],
        },
        include: this.fullInclude,
      });
    }

    if (!employee) {
      throw new NotFoundException('No employee record found for current user');
    }

    let resolvedGrade = employee.grade;
    let resolvedLevel = employee.level;
    if (employee.grade) {
      const pg = await this.prisma.payGrade.findFirst({
        where: { OR: [{ id: employee.grade }, { gradeCode: employee.grade }] },
      });
      if (pg) {
        resolvedGrade = pg.gradeCode;
        resolvedLevel = pg.level;
      }
    }

    const positionHistory = await this.getPositionHistory(employee.id);
    return {
      ...employee,
      grade: resolvedGrade,
      level: resolvedLevel,
      positionHistory,
    };
  }

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
      'faceRegisteredAt',
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

  private isUserHrOrAdmin(user?: any): boolean {
    if (!user) return true;
    if (user.permissions?.includes('*')) return true;
    const isRoleAdmin = user.roles?.some((r: string) => {
      const u = r.toUpperCase();
      return u.includes('ADMIN') || u.includes('HR');
    });
    const isPrimaryAdmin =
      user.primaryRole?.toUpperCase().includes('ADMIN') ||
      user.primaryRole?.toUpperCase().includes('HR');
    return Boolean(isRoleAdmin || isPrimaryAdmin);
  }

  async resolveEmployeeId(id: string, currentUser?: any): Promise<string> {
    const isHrOrAdmin = currentUser ? this.isUserHrOrAdmin(currentUser) : true;
    if (id === 'me' || (currentUser && !isHrOrAdmin)) {
      if (currentUser?.employee?.id) return currentUser.employee.id;
      const emp = await this.findMe(currentUser);
      if (emp) return emp.id;
    }
    return id;
  }

  async findById(id: string, currentUser?: any) {
    if (id === 'me') {
      return this.findMe(currentUser);
    }

    let employee: any = null;
    const isHrOrAdmin = currentUser ? this.isUserHrOrAdmin(currentUser) : true;

    if (currentUser && !isHrOrAdmin) {
      return this.findMe(currentUser);
    }

    employee = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { id },
          { employeeCode: id },
          { userId: id },
        ],
      },
      include: this.fullInclude,
    });

    if (!employee) {
      throw new NotFoundException(`Employee record not found for query '${id}'`);
    }

    let resolvedGrade = employee.grade;
    let resolvedLevel = employee.level;
    if (employee.grade) {
      const pg = await this.prisma.payGrade.findFirst({
        where: { OR: [{ id: employee.grade }, { gradeCode: employee.grade }] },
      });
      if (pg) {
        resolvedGrade = pg.gradeCode;
        resolvedLevel = pg.level;
      }
    }

    const positionHistory = await this.getPositionHistory(employee.id);

    // Auto-sync latest active salary assignment from Payroll module
    let latestSalaryAssignment: any = null;
    try {
      latestSalaryAssignment = await this.prisma.employeeSalaryAssignment.findFirst({
        where: { employeeId: employee.id, status: 'ACTIVE' },
        include: {
          template: true,
          details: { include: { salaryComponent: true } },
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (latestSalaryAssignment) {
        let basic = 0;
        let hra = 0;
        let conveyance = 0;
        let special = 0;
        let others = 0;
        let gross = 0;

        for (const d of (latestSalaryAssignment.details || [])) {
          const code = (d.salaryComponent?.code || '').toUpperCase();
          const type = (d.salaryComponent?.type || d.calculationType || 'EARNING').toUpperCase();
          const amt = Number(d.monthlyAmount) || 0;
          if (type === 'EARNING') {
            gross += amt;
            if (code === 'BASIC') basic = amt;
            else if (code === 'HRA') hra = amt;
            else if (code === 'CONVEYANCE') conveyance = amt;
            else if (code === 'SPECIAL' || code === 'SA') special = amt;
            else others += amt;
          }
        }

        employee.annualCtc = latestSalaryAssignment.annualCtc;
        employee.grossSalary = gross > 0 ? gross : latestSalaryAssignment.monthlyCtc;
        employee.basicSalary = basic > 0 ? basic : Math.round(latestSalaryAssignment.monthlyCtc * 0.5);
        employee.hra = hra > 0 ? hra : Math.round(latestSalaryAssignment.monthlyCtc * 0.25);
        employee.conveyance = conveyance;
        employee.specialAllowance = special;
        employee.otherAllowances = others;
        employee.salaryEffectiveFrom = latestSalaryAssignment.effectiveFrom;
        employee.salaryGrade = latestSalaryAssignment.template?.name || latestSalaryAssignment.template?.code || employee.salaryGrade;
      }
    } catch (err) {
      // Non-blocking fallback
    }

    return {
      ...employee,
      grade: resolvedGrade,
      level: resolvedLevel,
      positionHistory,
      salaryAssignment: latestSalaryAssignment,
    };
  }

  async createLoginAccount(id: string, dto: { email?: string; password?: string }) {
    const employee = await this.prisma.employee.findFirst({
      where: { OR: [{ id }, { employeeCode: id }] },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee record '${id}' not found`);
    }

    const workEmail = (
      dto.email ||
      employee.workEmail ||
      `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@ehcm.local`
    ).trim();

    const tempPassword =
      dto.password || `Rowan#2026!Temp`;

    const passwordHash = await bcrypt.hash(tempPassword, 12);

    let user = employee.user;
    if (!user) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: workEmail },
      });

      if (existingUser) {
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            mustResetPassword: true,
            isActive: true,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            companyId: employee.companyId,
            email: workEmail,
            passwordHash,
            mustResetPassword: true,
            isActive: true,
          },
        });

        let empRole = await this.prisma.role.findFirst({
          where: { name: 'EMPLOYEE' },
        });
        if (!empRole) {
          empRole = await this.prisma.role.create({
            data: {
              name: 'EMPLOYEE',
              description: 'Default Employee Self-Service Role',
              isSystem: true,
              companyId: employee.companyId,
            },
          });
        }

        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: empRole.id,
          },
        });
      }

      await this.prisma.employee.update({
        where: { id: employee.id },
        data: {
          userId: user.id,
          workEmail,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: workEmail,
          passwordHash,
          mustResetPassword: true,
          isActive: true,
        },
      });
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { workEmail },
      });
    }

    return {
      success: true,
      message: `Login account created for ${employee.firstName} ${employee.lastName}`,
      credentials: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode,
        email: workEmail,
        temporaryPassword: tempPassword,
        role: 'Employee',
        mustResetPassword: true,
      },
    };
  }

  private async sanitizeForeignKeys(data: any) {
    if (data.reportingManagerId) {
      const valid = await this.prisma.employee.findUnique({
        where: { id: data.reportingManagerId },
        select: { id: true },
      });
      if (!valid) data.reportingManagerId = null;
    }
    if (data.branchId) {
      const valid = await this.prisma.branch.findUnique({
        where: { id: data.branchId },
        select: { id: true },
      });
      if (!valid) data.branchId = null;
    }
    if (data.departmentId) {
      const valid = await this.prisma.department.findUnique({
        where: { id: data.departmentId },
        select: { id: true },
      });
      if (!valid) data.departmentId = null;
    }
    if (data.designationId) {
      const valid = await this.prisma.designation.findUnique({
        where: { id: data.designationId },
        select: { id: true },
      });
      if (!valid) data.designationId = null;
    }
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
    await this.sanitizeForeignKeys(parsedData);

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
      await this.getPositionHistory(employee.id);
    } catch (e) {
      console.error('Failed to create initial timeline/position event:', e);
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findById(id);
    const parsedData = this.parseDates(dto);
    await this.sanitizeForeignKeys(parsedData);

    if (parsedData.faceTemplate) {
      console.log(`[Face Registration] Saving face biometric template for Employee ID: ${id}`);
      console.log(`[Face Registration] Face Template Length: ${parsedData.faceTemplate.length} chars`);
    }
    const updated = await this.prisma.employee.update({
      where: { id },
      data: parsedData,
      include: this.listInclude,
    });
    if (parsedData.faceTemplate) {
      console.log(`[Face Registration] Database save successful for Employee ID: ${id}`);
    }
    return updated;
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
        courseId: `CRS-${Date.now().toString().slice(-4)}`,
        courseCode: dto.courseType || 'CRS-GEN',
        courseTitle: dto.courseName,
        status: dto.status ?? 'In Progress',
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

  async getPositionHistory(employeeId: string) {
    let history: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT * FROM employee_position_histories WHERE employeeId = ? ORDER BY effectiveDate DESC, createdAt DESC',
      employeeId,
    );

    const payGrades = await this.prisma.payGrade.findMany();
    const pgMap = new Map<string, { gradeCode: string; level: string }>();
    payGrades.forEach((pg) => {
      pgMap.set(pg.id, { gradeCode: pg.gradeCode, level: pg.level });
      pgMap.set(pg.gradeCode, { gradeCode: pg.gradeCode, level: pg.level });
    });

    if (history.length === 0) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { department: true, designation: true, branch: true },
      });
      if (emp) {
        const histId = 'eph_' + Math.random().toString(36).substring(2, 11);
        const resolvedEmpGrade = pgMap.get(emp.grade || '')?.gradeCode ?? emp.grade;
        const resolvedEmpLevel = pgMap.get(emp.grade || '')?.level ?? emp.level;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO employee_position_histories (
            id, employeeId, transferId, effectiveDate, movementType,
            departmentId, departmentName, designationId, designationTitle, grade, level, branchId, branchName,
            approvedBy, approvedDate, reason, remarks, status, createdAt, updatedAt
          ) VALUES (?, ?, NULL, ?, 'JOINING', ?, ?, ?, ?, ?, ?, ?, ?, 'HR System', NOW(), 'Initial Joining Position', 'Employee Master record', 'CURRENT', NOW(), NOW())`,
          histId,
          emp.id,
          emp.dateOfJoining ?? new Date(),
          emp.departmentId ?? null,
          emp.department?.name ?? null,
          emp.designationId ?? null,
          emp.designation?.title ?? null,
          resolvedEmpGrade ?? null,
          resolvedEmpLevel ?? null,
          emp.branchId ?? null,
          emp.branch?.name ?? null,
        );

        history = await this.prisma.$queryRawUnsafe(
          'SELECT * FROM employee_position_histories WHERE employeeId = ? ORDER BY effectiveDate DESC, createdAt DESC',
          employeeId,
        );
      }
    }

    return history.map((hist) => {
      const resolvedGrade = pgMap.get(hist.grade);
      const resolvedPrevGrade = pgMap.get(hist.prevGrade);
      const gradeStr = resolvedGrade ? resolvedGrade.gradeCode : hist.grade;
      let levelStr = resolvedGrade ? resolvedGrade.level : hist.level;
      if (hist.grade === hist.level && resolvedGrade) {
        levelStr = resolvedGrade.level;
      }
      return {
        ...hist,
        grade: gradeStr,
        level: levelStr,
        prevGrade: resolvedPrevGrade ? resolvedPrevGrade.gradeCode : hist.prevGrade,
      };
    });
  }
}
