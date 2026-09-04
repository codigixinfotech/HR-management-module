import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to extract employee ID from request user
  private getEmployeeId(user: any): string | null {
    if (!user) return null;
    return user.employee?.id || user.employeeId || user.id || null;
  }

  // Helper to check if user is HR or Admin
  private isHrOrAdmin(user: any): boolean {
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    if (user.primaryRole && (user.primaryRole.toUpperCase().includes('ADMIN') || user.primaryRole.toUpperCase().includes('HR'))) {
      return true;
    }
    if (user.role && ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'HR'].includes(String(user.role).toUpperCase())) {
      return true;
    }
    if (Array.isArray(user.roles)) {
      return user.roles.some((r: any) => {
        const roleName = String(r.role?.name || r.name || r).toUpperCase();
        return roleName.includes('ADMIN') || roleName.includes('HR') || ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'HR'].includes(roleName);
      });
    }
    return false;
  }

  // ==========================================
  // PART 7 — COURSE CATALOG
  // ==========================================

  async getCatalogCourses() {
    return await this.prisma.lmsCourseCatalog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCatalogCourse(data: {
    code?: string;
    title: string;
    provider?: string;
    instructor?: string;
    category?: string;
    durationHours?: number;
    pricePerSeat?: number;
    rating?: number;
    difficulty?: string;
    language?: string;
    certificateIncluded?: boolean;
    assessmentIncluded?: boolean;
    description?: string;
    modulesJson?: any;
  }) {
    if (!data.title) throw new BadRequestException('Course title is required');
    const code = data.code || `CRS-CAT-${Date.now().toString().slice(-5)}`;

    return await this.prisma.lmsCourseCatalog.create({
      data: {
        code,
        title: data.title,
        provider: data.provider || 'Enterprise Academy',
        instructor: data.instructor || 'Lead Instructor',
        category: data.category || 'Professional Skills',
        durationHours: Number(data.durationHours) || 10,
        pricePerSeat: Number(data.pricePerSeat) || 2500,
        rating: Number(data.rating) || 4.8,
        difficulty: data.difficulty || 'Intermediate',
        language: data.language || 'English',
        certificateIncluded: data.certificateIncluded ?? true,
        assessmentIncluded: data.assessmentIncluded ?? true,
        description: data.description || `${data.title} curriculum.`,
        modulesJson: data.modulesJson || null,
      },
    });
  }

  async deleteCatalogCourse(id: string) {
    const course = await this.prisma.lmsCourseCatalog.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!course) throw new NotFoundException(`Catalog course ${id} not found.`);

    await this.prisma.lmsCourseCatalog.delete({
      where: { id: course.id },
    });
    return { success: true, message: `Course ${course.title} deleted successfully.` };
  }

  // ==========================================
  // PART 1, 2, 8 — COMPANY COURSES & PURCHASING
  // ==========================================

  async getCompanyCourses(user?: any) {
    const courses = await this.prisma.companyCourse.findMany({
      include: {
        enrollments: {
          select: {
            id: true,
            employeeId: true,
            employeeName: true,
            department: true,
            progress: true,
            status: true,
            assignedDate: true,
            certificateIssued: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isHr = this.isHrOrAdmin(user);

    return courses.map((cc) => {
      const activeCount = cc.enrollments.length;
      const assignedSeats = activeCount;
      const availableSeats = Math.max(0, cc.purchasedSeats - assignedSeats);

      // PART 2 SECURITY: Mask password in general list
      return {
        ...cc,
        assignedSeats,
        availableSeats,
        accessPassword: isHr && cc.accessPassword ? '••••••••' : undefined,
      };
    });
  }

  async addCompanyCourse(data: {
    title: string;
    courseCode?: string;
    provider?: string;
    category?: string;
    seatsPurchased: number;
    pricePerSeat?: number;
    billingEntity?: string;
    costCenter?: string;
    courseUrl?: string;
    accessInstructions?: string;
    subscriptionType?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    accessUsername?: string;
    accessPassword?: string;
    externalReference?: string;
  }) {
    if (!data.title) throw new BadRequestException('Course title is required');
    const seats = Number(data.seatsPurchased);
    if (!seats || seats <= 0) throw new BadRequestException('A positive number of seats is required.');
    const price = Number(data.pricePerSeat) || 0;

    return await this.prisma.$transaction(async (tx) => {
      const timestamp = Date.now().toString().slice(-4);
      const courseId = `COMP-${Date.now()}`;
      const courseCode = data.courseCode || `CRS-${data.category?.substring(0, 3).toUpperCase() || 'GEN'}-${timestamp}`;

      const companyCourse = await tx.companyCourse.create({
        data: {
          courseId,
          courseCode,
          title: data.title,
          provider: data.provider || 'Enterprise Course Partner',
          category: data.category || 'Professional Skills',
          purchasedSeats: seats,
          assignedSeats: 0,
          availableSeats: seats,
          status: 'ACTIVE',
          courseUrl: data.courseUrl || null,
          accessInstructions: data.accessInstructions || null,
          subscriptionType: data.subscriptionType || 'Company Sponsored',
          subscriptionStartDate: data.subscriptionStartDate ? new Date(data.subscriptionStartDate) : new Date(),
          subscriptionEndDate: data.subscriptionEndDate ? new Date(data.subscriptionEndDate) : null,
          accessUsername: data.accessUsername || null,
          accessPassword: data.accessPassword || null,
          externalReference: data.externalReference || null,
        },
      });

      const subtotal = seats * price;
      const gst = subtotal * 0.18;
      const totalAmount = subtotal + gst;
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      await tx.lmsPurchaseHistory.create({
        data: {
          orderId,
          courseId,
          courseCode,
          courseTitle: data.title,
          provider: data.provider || 'Enterprise Course Partner',
          seatsPurchased: seats,
          pricePerSeat: price,
          subtotal,
          gst,
          totalAmount,
          billingEntity: data.billingEntity || 'EHCM Enterprise Corp',
          costCenter: data.costCenter || 'HR-L&D',
          status: 'PAID',
        },
      });

      return companyCourse;
    });
  }

  async deleteCompanyCourse(id: string) {
    const course = await this.prisma.companyCourse.findFirst({
      where: { OR: [{ id }, { courseId: id }] },
    });
    if (!course) throw new NotFoundException(`Company course ${id} not found.`);

    await this.prisma.companyCourse.delete({
      where: { id: course.id },
    });
    return { success: true, message: `Company course ${course.title} deleted successfully.` };
  }

  // ==========================================
  // PART 3 — TRANSACTIONAL SEAT ENROLLMENT
  // ==========================================

  async enrollEmployees(
    courseId: string,
    body: { employeeIds: string[]; notifyPortal?: boolean; notifyEmail?: boolean }
  ) {
    const { employeeIds, notifyPortal = true, notifyEmail = false } = body;
    if (!employeeIds || employeeIds.length === 0) {
      throw new BadRequestException('Please select at least one employee to enroll.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch & validate company course
      const companyCourse = await tx.companyCourse.findFirst({
        where: { OR: [{ courseId }, { id: courseId }] },
        include: { enrollments: true },
      });

      if (!companyCourse) {
        throw new NotFoundException(`Company course ${courseId} not found.`);
      }

      // 2. Exact seat math from MySQL records
      const currentAssigned = companyCourse.enrollments.length;
      const currentAvailable = Math.max(0, companyCourse.purchasedSeats - currentAssigned);

      // 3. Deduplicate against existing enrollments
      const existingEmpIds = new Set(companyCourse.enrollments.map((e) => e.employeeId));
      const newToEnroll = employeeIds.filter((id) => !existingEmpIds.has(id));

      if (newToEnroll.length === 0) {
        throw new BadRequestException('All selected employees are already enrolled in this course.');
      }

      if (newToEnroll.length > currentAvailable) {
        throw new BadRequestException(
          `Insufficient seats. Selected: ${newToEnroll.length}, Available: ${currentAvailable}.`
        );
      }

      // 4. Create enrollment records & notifications
      const createdEnrollments: any[] = [];
      for (const empId of newToEnroll) {
        const emp = await tx.employee.findFirst({
          where: { OR: [{ id: empId }, { employeeCode: empId }] },
          include: { department: true },
        });

        const employeeName = emp
          ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeCode || `Employee (${empId})`
          : `Employee (${empId})`;
        const department = emp?.department?.name || 'Operations';
        const actualEmpId = emp?.id || empId;

        const enrollment = await tx.courseEnrollment.create({
          data: {
            companyCourseId: companyCourse.id,
            employeeId: actualEmpId,
            employeeName,
            department,
            courseId: companyCourse.courseId,
            courseCode: companyCourse.courseCode,
            courseTitle: companyCourse.title,
            progress: 0,
            status: 'Not Started',
          },
        });
        createdEnrollments.push(enrollment);

        // Persistent notification
        if (notifyPortal) {
          await tx.lmsNotification.create({
            data: {
              employeeId: actualEmpId,
              title: 'New Training Assigned',
              message: `You have been assigned to ${companyCourse.title} by HR. Start your modules in My Learning Hub.`,
              type: 'TRAINING',
              actionUrl: '/learning/employee-learning',
              referenceId: companyCourse.courseId,
            },
          });
        }

        // Email dispatch record
        if (notifyEmail) {
          await tx.lmsEmailDispatch.create({
            data: {
              recipient: emp?.workEmail || emp?.personalEmail || `${actualEmpId}@company.local`,
              subject: `Course Assigned: ${companyCourse.title}`,
              template: 'TRAINING_ASSIGNMENT',
              referenceId: companyCourse.courseId,
              status: 'SIMULATED',
              sentAt: new Date(),
            },
          });
        }
      }

      // 5. Update seat counts
      const newAssignedCount = currentAssigned + newToEnroll.length;
      const newAvailableCount = Math.max(0, companyCourse.purchasedSeats - newAssignedCount);

      await tx.companyCourse.update({
        where: { id: companyCourse.id },
        data: {
          assignedSeats: newAssignedCount,
          availableSeats: newAvailableCount,
        },
      });

      return {
        success: true,
        enrolledCount: newToEnroll.length,
        purchasedSeats: companyCourse.purchasedSeats,
        assignedSeats: newAssignedCount,
        availableSeats: newAvailableCount,
        createdEnrollments,
      };
    });
  }

  async purchaseAdditionalSeats(
    courseId: string,
    body: { additionalSeats: number; pricePerSeat?: number; billingEntity?: string; costCenter?: string }
  ) {
    const additional = Number(body.additionalSeats);
    if (!additional || additional <= 0) {
      throw new BadRequestException('A positive number of additional seats is required.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const course = await tx.companyCourse.findFirst({
        where: { OR: [{ courseId }, { id: courseId }] },
        include: { enrollments: true },
      });
      if (!course) throw new NotFoundException(`Company course ${courseId} not found.`);

      const newPurchased = course.purchasedSeats + additional;
      const activeCount = course.enrollments.length;
      const newAvailable = Math.max(0, newPurchased - activeCount);

      const updated = await tx.companyCourse.update({
        where: { id: course.id },
        data: {
          purchasedSeats: newPurchased,
          assignedSeats: activeCount,
          availableSeats: newAvailable,
        },
      });

      const price = Number(body.pricePerSeat) || 2000;
      const subtotal = additional * price;
      const gst = subtotal * 0.18;
      const totalAmount = subtotal + gst;

      await tx.lmsPurchaseHistory.create({
        data: {
          orderId: `ORD-${Date.now().toString().slice(-6)}`,
          courseId: course.courseId,
          courseCode: course.courseCode,
          courseTitle: course.title,
          provider: course.provider,
          seatsPurchased: additional,
          pricePerSeat: price,
          subtotal,
          gst,
          totalAmount,
          billingEntity: body.billingEntity || 'EHCM Enterprise Corp',
          costCenter: body.costCenter || 'HR-L&D',
          status: 'PAID',
        },
      });

      return updated;
    });
  }

  async getEnrollments() {
    return await this.prisma.courseEnrollment.findMany({
      include: {
        companyCourse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async releaseSeat(enrollmentId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const enr = await tx.courseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { companyCourse: true },
      });
      if (!enr) throw new NotFoundException('Enrollment not found.');

      await tx.courseEnrollment.delete({ where: { id: enrollmentId } });

      if (enr.companyCourse) {
        const remainingEnrollments = await tx.courseEnrollment.count({
          where: { companyCourseId: enr.companyCourse.id },
        });
        await tx.companyCourse.update({
          where: { id: enr.companyCourse.id },
          data: {
            assignedSeats: remainingEnrollments,
            availableSeats: Math.max(0, enr.companyCourse.purchasedSeats - remainingEnrollments),
          },
        });
      }

      return { success: true, message: 'Seat released and enrollment removed.' };
    });
  }

  async deleteEnrollment(id: string) {
    return await this.releaseSeat(id);
  }

  // ==========================================
  // PART 9 & 10 — EMPLOYEE LEARNING HUB & PROGRESS
  // ==========================================

  async getMyLearning(user?: any) {
    const empId = this.getEmployeeId(user);
    if (!empId) {
      return []; // Clean empty state when unauthenticated or unlinked
    }

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        OR: [{ employeeId: empId }, { employeeId: user?.employee?.employeeCode || 'NONE' }],
      },
      include: {
        companyCourse: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decorate with course access details for the enrolled employee
    return enrollments.map((enr) => {
      const cc = enr.companyCourse;
      return {
        ...enr,
        courseAccess: cc
          ? {
              provider: cc.provider,
              courseUrl: cc.courseUrl || 'https://learning.ehcm.local',
              subscriptionType: cc.subscriptionType || 'Company Sponsored',
              subscriptionEndDate: cc.subscriptionEndDate,
              accessInstructions: cc.accessInstructions || 'Log in using your corporate credentials.',
              accessUsername: cc.accessUsername || user?.email || enr.employeeName,
              // Only expose decrypted access password to the enrolled employee for their own course
              accessPassword: cc.accessPassword || undefined,
            }
          : null,
      };
    });
  }

  async startEnrollment(id: string, user?: any) {
    const enr = await this.prisma.courseEnrollment.findUnique({ where: { id } });
    if (!enr) throw new NotFoundException('Enrollment not found.');

    const empId = this.getEmployeeId(user);
    if (!this.isHrOrAdmin(user) && empId && enr.employeeId !== empId) {
      throw new ForbiddenException('You can only start your own courses.');
    }

    return await this.prisma.courseEnrollment.update({
      where: { id },
      data: {
        status: 'In Progress',
        startedAt: enr.startedAt || new Date(),
      },
    });
  }

  async updateEnrollmentProgress(
    id: string,
    body: {
      progress: number;
      moduleProgress?: any;
      status?: string;
      assessmentScore?: number;
      assessmentPassed?: boolean;
    },
    user?: any
  ) {
    const enr = await this.prisma.courseEnrollment.findUnique({ where: { id } });
    if (!enr) throw new NotFoundException('Enrollment not found.');

    const empId = this.getEmployeeId(user);
    if (!this.isHrOrAdmin(user) && empId && enr.employeeId !== empId) {
      throw new ForbiddenException('You can only update your own enrollments.');
    }

    const newProgress = Math.min(100, Math.max(0, body.progress ?? enr.progress));
    const passed = body.assessmentPassed ?? enr.assessmentPassed ?? (body.assessmentScore ? body.assessmentScore >= 80 : false);
    
    // Course is completed ONLY if progress is 100% and assessment is not failed
    const isNowCompleted = newProgress === 100 && (enr.assessmentPassed !== false);
    const newStatus = isNowCompleted ? 'Completed' : newProgress > 0 ? 'In Progress' : enr.status;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.courseEnrollment.update({
        where: { id },
        data: {
          progress: newProgress,
          moduleProgress: body.moduleProgress ?? enr.moduleProgress,
          status: newStatus,
          assessmentScore: body.assessmentScore ?? enr.assessmentScore,
          assessmentPassed: passed,
          completedAt: isNowCompleted ? (enr.completedAt || new Date()) : enr.completedAt,
          certificateIssued: isNowCompleted || enr.certificateIssued,
        },
      });

      // Automatically generate Certificate upon 100% completion
      if (isNowCompleted) {
        const existingCert = await tx.lmsCertificate.findFirst({
          where: { employeeId: enr.employeeId, courseId: enr.courseId },
        });

        if (!existingCert) {
          const certNumber = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          const verificationCode = `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          await tx.lmsCertificate.create({
            data: {
              certificateNumber: certNumber,
              employeeId: enr.employeeId,
              employeeName: enr.employeeName || 'Employee',
              department: enr.department || 'Operations',
              courseId: enr.courseId,
              courseTitle: enr.courseTitle,
              verificationCode,
              status: 'ACTIVE',
            },
          });
        }

        // Automatically update employee skill progression in Skill Matrix
        const existingSkill = await tx.lmsSkill.findFirst({
          where: { name: { contains: enr.courseTitle.split(' ')[0] } },
        });

        if (existingSkill) {
          await tx.lmsEmployeeSkill.upsert({
            where: {
              skillId_employeeId: {
                skillId: existingSkill.id,
                employeeId: enr.employeeId,
              },
            },
            create: {
              skillId: existingSkill.id,
              employeeId: enr.employeeId,
              employeeName: enr.employeeName,
              department: enr.department,
              skillLevel: 'Advanced',
              sourceCourse: enr.courseTitle,
            },
            update: {
              skillLevel: 'Expert',
              sourceCourse: enr.courseTitle,
              lastUpdated: new Date(),
            },
          });
        }
      }

      return updated;
    });
  }

  // ==========================================
  // PART 11 — ASSESSMENT ENGINE
  // ==========================================

  async getCourseAssessment(courseId: string) {
    const assessment = await this.prisma.lmsAssessment.findUnique({
      where: { courseId },
    });
    if (!assessment) return null;

    // Mask correct options from the client!
    const questions = Array.isArray(assessment.questionsJson) ? assessment.questionsJson : [];
    const sanitizedQuestions = questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      points: q.points || 1,
    }));

    return {
      id: assessment.id,
      courseId: assessment.courseId,
      title: assessment.title,
      passingScore: assessment.passingScore,
      questions: sanitizedQuestions,
    };
  }

  async saveCourseAssessment(data: {
    courseId: string;
    title: string;
    passingScore?: number;
    questions: Array<{ id: string; question: string; options: string[]; correctOptionIndex: number; points?: number }>;
  }) {
    return await this.prisma.lmsAssessment.upsert({
      where: { courseId: data.courseId },
      create: {
        courseId: data.courseId,
        title: data.title,
        passingScore: data.passingScore || 80,
        questionsJson: data.questions,
      },
      update: {
        title: data.title,
        passingScore: data.passingScore || 80,
        questionsJson: data.questions,
      },
    });
  }

  async submitAssessmentAttempt(
    assessmentId: string,
    body: { answers: Record<string, number>; enrollmentId?: string },
    user?: any
  ) {
    const assessment = await this.prisma.lmsAssessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found.');

    const empId = this.getEmployeeId(user);
    if (!empId) throw new BadRequestException('Authenticated employee identity required.');

    const questions: any[] = Array.isArray(assessment.questionsJson) ? assessment.questionsJson : [];
    if (questions.length === 0) throw new BadRequestException('Assessment has no questions configured.');

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const q of questions) {
      const qWeight = q.points || 1;
      totalPoints += qWeight;
      const submittedAnswer = body.answers[q.id];
      if (submittedAnswer !== undefined && submittedAnswer === q.correctOptionIndex) {
        earnedPoints += qWeight;
      }
    }

    const scorePercentage = Math.round((earnedPoints / (totalPoints || 1)) * 100);
    const passed = scorePercentage >= assessment.passingScore;

    const attempt = await this.prisma.lmsAssessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        employeeId: empId,
        employeeName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || empId,
        score: scorePercentage,
        passed,
        answersJson: body.answers,
      },
    });

    // If linked to enrollment, update enrollment assessment score & pass status
    if (body.enrollmentId) {
      await this.updateEnrollmentProgress(
        body.enrollmentId,
        {
          progress: passed ? 100 : undefined as any,
          assessmentScore: scorePercentage,
          assessmentPassed: passed,
        },
        user
      );
    }

    return {
      attemptId: attempt.id,
      score: scorePercentage,
      passed,
      passingScore: assessment.passingScore,
      earnedPoints,
      totalPoints,
    };
  }

  // ==========================================
  // PART 12 — CERTIFICATES
  // ==========================================

  async getCertificates() {
    return await this.prisma.lmsCertificate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyCertificates(user?: any) {
    const empId = this.getEmployeeId(user);
    if (!empId) return [];

    return await this.prisma.lmsCertificate.findMany({
      where: {
        OR: [{ employeeId: empId }, { employeeId: user?.employee?.employeeCode || 'NONE' }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCertificate(data: {
    employeeId: string;
    employeeName?: string;
    department?: string;
    courseId: string;
    courseTitle: string;
    expiryDate?: string;
  }) {
    const certNumber = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationCode = `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return await this.prisma.lmsCertificate.create({
      data: {
        certificateNumber: certNumber,
        employeeId: data.employeeId,
        employeeName: data.employeeName || 'Employee',
        department: data.department || 'Operations',
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        verificationCode,
        status: 'ACTIVE',
      },
    });
  }

  async deleteCertificate(id: string) {
    const cert = await this.prisma.lmsCertificate.findFirst({
      where: { OR: [{ id }, { certificateNumber: id }] },
    });
    if (!cert) throw new NotFoundException('Certificate not found.');

    await this.prisma.lmsCertificate.delete({ where: { id: cert.id } });
    return { success: true, message: 'Certificate revoked and deleted.' };
  }

  // ==========================================
  // PART 13 — SKILL MATRIX & COMPETENCIES
  // ==========================================

  async getSkills() {
    return await this.prisma.lmsSkill.findMany({
      include: {
        employeeSkills: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSkill(data: { name: string; category?: string; description?: string }) {
    if (!data.name) throw new BadRequestException('Skill name is required.');
    return await this.prisma.lmsSkill.create({
      data: {
        name: data.name,
        category: data.category || 'Technical',
        description: data.description || '',
      },
    });
  }

  async updateSkill(id: string, data: Partial<{ name: string; category: string; description: string }>) {
    return await this.prisma.lmsSkill.update({
      where: { id },
      data,
    });
  }

  async deleteSkill(id: string) {
    return await this.prisma.lmsSkill.delete({ where: { id } });
  }

  async getEmployeeSkills(user?: any) {
    const isHr = this.isHrOrAdmin(user);
    const empId = this.getEmployeeId(user);

    if (isHr) {
      return await this.prisma.lmsEmployeeSkill.findMany({
        include: { skill: true, employee: true },
        orderBy: { lastUpdated: 'desc' },
      });
    }

    if (!empId) return [];

    return await this.prisma.lmsEmployeeSkill.findMany({
      where: { employeeId: empId },
      include: { skill: true },
      orderBy: { lastUpdated: 'desc' },
    });
  }

  // ==========================================
  // PART 4, 5, 6 — EMPLOYEE REIMBURSEMENTS
  // ==========================================

  async submitReimbursement(
    data: {
      courseId?: string;
      courseTitle: string;
      provider: string;
      courseUrl?: string;
      purchaseDate?: string;
      purchaseAmount: number;
      currency?: string;
      invoiceNumber?: string;
      invoiceFileUrl?: string;
      certificateFileUrl?: string;
      certificateNumber?: string;
      certificateIssueDate?: string;
      requestedAmount?: number;
    },
    user: any
  ) {
    const empId = this.getEmployeeId(user);
    if (!empId) throw new BadRequestException('Authenticated employee required to submit reimbursement.');

    const amount = Number(data.purchaseAmount);
    if (!amount || amount <= 0) throw new BadRequestException('Valid purchase amount is required.');

    return await this.prisma.lmsLearningReimbursement.create({
      data: {
        employeeId: empId,
        courseId: data.courseId || `EXT-${Date.now()}`,
        courseTitle: data.courseTitle,
        provider: data.provider,
        courseUrl: data.courseUrl || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        purchaseAmount: amount,
        currency: data.currency || 'INR',
        invoiceNumber: data.invoiceNumber || null,
        invoiceFileUrl: data.invoiceFileUrl || null,
        certificateFileUrl: data.certificateFileUrl || null,
        certificateNumber: data.certificateNumber || null,
        certificateIssueDate: data.certificateIssueDate ? new Date(data.certificateIssueDate) : null,
        requestedAmount: Number(data.requestedAmount) || amount,
        status: 'SUBMITTED',
      },
    });
  }

  async getReimbursements(user?: any) {
    const isHr = this.isHrOrAdmin(user);
    const empId = this.getEmployeeId(user);

    if (isHr) {
      return await this.prisma.lmsLearningReimbursement.findMany({
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!empId) return [];

    return await this.prisma.lmsLearningReimbursement.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyReimbursements(user: any) {
    const empId = this.getEmployeeId(user);
    if (!empId) return [];

    return await this.prisma.lmsLearningReimbursement.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReimbursement(id: string, body: { approvedAmount?: number }, user: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR / Finance can approve reimbursements.');
    }

    const r = await this.prisma.lmsLearningReimbursement.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reimbursement record not found.');

    const empId = this.getEmployeeId(user);
    if (empId && r.employeeId === empId) {
      throw new BadRequestException('Employees cannot approve their own reimbursement request.');
    }

    const approvedAmount = Number(body.approvedAmount) || r.requestedAmount;

    return await this.prisma.lmsLearningReimbursement.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAmount,
        reviewedBy: user.email || user.name || 'HR Admin',
        reviewedAt: new Date(),
      },
    });
  }

  async rejectReimbursement(id: string, body: { rejectionReason: string }, user: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR can reject reimbursements.');
    }

    return await this.prisma.lmsLearningReimbursement.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: body.rejectionReason || 'Documentation did not meet criteria.',
        reviewedBy: user.email || user.name || 'HR Admin',
        reviewedAt: new Date(),
      },
    });
  }

  async markReimbursementPaymentPending(id: string, user: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR / Finance can update payment status.');
    }

    return await this.prisma.lmsLearningReimbursement.update({
      where: { id },
      data: { status: 'PAYMENT_PENDING' },
    });
  }

  async markReimbursementPaid(
    id: string,
    body: { paidAmount?: number; paymentReference?: string },
    user: any
  ) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR / Finance can finalize payments.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const r = await tx.lmsLearningReimbursement.findUnique({
        where: { id },
        include: { employee: true },
      });
      if (!r) throw new NotFoundException('Reimbursement record not found.');

      const paidAmount = Number(body.paidAmount) || r.approvedAmount || r.requestedAmount;

      const updated = await tx.lmsLearningReimbursement.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAmount,
          paidDate: new Date(),
          paymentReference: body.paymentReference || `TXN-${Date.now()}`,
        },
      });

      // Auto-issue digital certificate record if certificate was verified
      if (r.certificateNumber) {
        await tx.lmsCertificate.upsert({
          where: { certificateNumber: r.certificateNumber },
          create: {
            certificateNumber: r.certificateNumber,
            employeeId: r.employeeId,
            employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.trim() : 'Employee',
            department: r.employee?.departmentId || 'Operations',
            courseId: r.courseId,
            courseTitle: r.courseTitle,
            verificationCode: `VER-EXT-${Date.now().toString().slice(-6)}`,
            status: 'ACTIVE',
            certificateUrl: r.certificateFileUrl || null,
          },
          update: {
            status: 'ACTIVE',
            certificateUrl: r.certificateFileUrl || undefined,
          },
        });
      }

      return updated;
    });
  }

  // ==========================================
  // PART 16 — TRAINING PROGRAMS
  // ==========================================

  async getPrograms() {
    return await this.prisma.trainingProgram.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProgram(data: {
    programCode?: string;
    title: string;
    category?: string;
    department?: string;
    deliveryMode?: string;
    durationHours?: number;
    trainerName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    maxParticipants?: number;
    status?: string;
    budget?: number;
    description?: string;
    attendeeIds?: any;
  }) {
    if (!data.title) throw new BadRequestException('Program title is required.');
    const code = data.programCode || `PRG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    return await this.prisma.trainingProgram.create({
      data: {
        programCode: code,
        title: data.title,
        category: data.category || 'General',
        department: data.department || 'All Departments',
        deliveryMode: data.deliveryMode || 'Online Self-Paced',
        durationHours: Number(data.durationHours) || 10,
        trainerName: data.trainerName || 'Lead Trainer',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || 'Virtual Campus',
        maxParticipants: Number(data.maxParticipants) || 30,
        status: data.status || 'PUBLISHED',
        budget: Number(data.budget) || 0,
        description: data.description || `${data.title} training program.`,
        attendeeIds: data.attendeeIds || null,
      },
    });
  }

  async updateProgram(id: string, data: any) {
    return await this.prisma.trainingProgram.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteProgram(id: string) {
    return await this.prisma.trainingProgram.delete({ where: { id } });
  }

  // ==========================================
  // PART 14 & 15 — NOTIFICATIONS & EMAIL
  // ==========================================

  async getNotifications(user: any) {
    const empId = this.getEmployeeId(user);
    if (!empId) return [];

    return await this.prisma.lmsNotification.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(id: string) {
    return await this.prisma.lmsNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllNotificationsRead(user: any) {
    const empId = this.getEmployeeId(user);
    if (!empId) return { count: 0 };

    return await this.prisma.lmsNotification.updateMany({
      where: { employeeId: empId, isRead: false },
      data: { isRead: true },
    });
  }

  async getEmailDispatches() {
    return await this.prisma.lmsEmailDispatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ==========================================
  // COURSE REQUESTS
  // ==========================================

  async getCourseRequests(user?: any) {
    const isHr = this.isHrOrAdmin(user);
    const empId = this.getEmployeeId(user);

    const requests = await this.prisma.lmsCourseRequest.findMany({
      where: isHr ? {} : empId ? { employeeId: empId } : {},
      orderBy: { createdAt: 'desc' },
    });

    const employeeIds = [...new Set(requests.map((r) => r.employeeId).filter(Boolean))];
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        department: { select: { name: true } },
      },
    });
    const empMap = new Map(employees.map((e) => [e.id, e]));

    return requests.map((r) => {
      const emp = empMap.get(r.employeeId);
      const fullName = emp
        ? `${emp.firstName} ${emp.lastName}`.trim()
        : r.employeeName;
      return {
        ...r,
        employeeName: fullName,
        requestedCourseTitle: r.courseTitle,
        requestedPrice: r.pricePerSeat,
        employee: emp
          ? {
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              employeeCode: emp.employeeCode,
              department: emp.department?.name || r.department,
            }
          : {
              id: r.employeeId,
              firstName: fullName.split(' ')[0] || fullName,
              lastName: fullName.split(' ').slice(1).join(' ') || '',
              employeeCode: r.employeeId,
              department: r.department,
            },
      };
    });
  }

  async getMyCourseRequests(user?: any) {
    const empId = this.getEmployeeId(user);
    if (!empId) return [];

    const requests = await this.prisma.lmsCourseRequest.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      ...r,
      requestedCourseTitle: r.courseTitle,
      requestedPrice: r.pricePerSeat,
    }));
  }

  async approveCourseRequest(id: string, body: { approvedSeatType?: string }, user?: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR or Admin can approve course requests.');
    }
    const req = await this.prisma.lmsCourseRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Course request not found.');

    const updated = await this.prisma.lmsCourseRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedSeatType: body.approvedSeatType || 'Existing Seat',
      },
    });

    // Create notification for the employee
    try {
      await this.prisma.lmsNotification.create({
        data: {
          employeeId: req.employeeId,
          type: 'COURSE_REQUEST',
          title: 'Course Request Approved',
          message: `Your course request for "${req.courseTitle}" has been approved!`,
          referenceId: req.id,
        },
      });
    } catch (e) {}

    return updated;
  }

  async approveAndPurchaseCourseRequest(id: string, body: any, user?: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR or Admin can approve and purchase course requests.');
    }

    const req = await this.prisma.lmsCourseRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Course request not found.');
    if (req.status?.toLowerCase() === 'approved') {
      throw new BadRequestException('This course request has already been approved.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Resolve employee
      const emp = await tx.employee.findFirst({
        where: { OR: [{ id: req.employeeId }, { employeeCode: req.employeeId }] },
        include: { department: true },
      });

      const empId = emp ? emp.id : req.employeeId;
      const empName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : req.employeeName;
      const deptName = emp?.department?.name || req.department || 'Operations';

      // 2. Prepare Company Course details
      const timestamp = Date.now().toString().slice(-4);
      const courseId = body.courseId || req.courseId || `COMP-${Date.now()}`;
      const courseCode = body.courseCode || `CRS-${(body.category || 'GEN').substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${timestamp}`;
      const title = body.title || req.courseTitle;
      const provider = body.provider || req.provider || 'Enterprise Course Partner';
      const category = body.category || 'Professional Skills';
      const seats = Number(body.seatsPurchased) || 1;
      const pricePerSeat = Number(body.pricePerSeat) || req.pricePerSeat || 2500;
      const courseUrl = body.courseUrl || req.courseUrl || (req as any).url || null;

      // 3. Create Company Course
      const companyCourse = await tx.companyCourse.create({
        data: {
          courseId,
          courseCode,
          title,
          provider,
          category,
          purchasedSeats: seats,
          assignedSeats: 1, // 1 seat allocated to requesting employee
          availableSeats: Math.max(0, seats - 1),
          status: 'ACTIVE',
          courseUrl,
          subscriptionType: body.subscriptionType || 'Company Sponsored',
          subscriptionStartDate: body.startDate ? new Date(body.startDate) : new Date(),
          subscriptionEndDate: body.expiryDate ? new Date(body.expiryDate) : null,
          accessInstructions: body.accessInstructions || 'Access granted through company sponsorship. Login via provider portal.',
        },
      });

      // 4. Create Purchase History record
      const subtotal = seats * pricePerSeat;
      const gst = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + gst;
      const orderId = body.orderId || `LMS-PO-${new Date().getFullYear()}-${timestamp}`;

      await tx.lmsPurchaseHistory.create({
        data: {
          orderId,
          courseId,
          courseCode,
          courseTitle: title,
          provider,
          seatsPurchased: seats,
          pricePerSeat,
          subtotal,
          gst,
          totalAmount,
          billingEntity: body.billingEntity || 'EHCM Enterprise Corp',
          costCenter: body.costCenter || 'HR-L&D',
          status: 'PAID',
        },
      });

      // 5. Create Course Enrollment for requesting employee
      const enrollment = await tx.courseEnrollment.create({
        data: {
          companyCourseId: companyCourse.id,
          employeeId: empId,
          employeeName: empName,
          department: deptName,
          courseId,
          courseCode,
          courseTitle: title,
          status: 'Not Started',
          progress: 0,
          assignedDate: new Date(),
        },
      });

      // 6. Update Course Request status
      const updatedRequest = await tx.lmsCourseRequest.update({
        where: { id },
        data: {
          status: 'Approved',
          approvedSeatType: 'New Purchase',
        },
      });

      // 7. Create Employee Notification
      try {
        await tx.lmsNotification.create({
          data: {
            employeeId: empId,
            type: 'COURSE_ENROLLMENT',
            title: 'New Training Assigned',
            message: `Your request for "${title}" has been approved and the course is now available in your Learning Hub.`,
            referenceId: enrollment.id,
          },
        });
      } catch (e) {}

      return {
        success: true,
        companyCourse,
        enrollment,
        request: updatedRequest,
      };
    });
  }

  async approveExistingSeatCourseRequest(id: string, body?: { companyCourseId?: string }, user?: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR or Admin can approve course requests.');
    }

    const req = await this.prisma.lmsCourseRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Course request not found.');
    if (req.status?.toLowerCase() === 'approved') {
      throw new BadRequestException('This course request has already been approved.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Find matching company course with availableSeats > 0
      let companyCourse: any = null;
      if (body?.companyCourseId) {
        companyCourse = await tx.companyCourse.findFirst({
          where: { OR: [{ id: body.companyCourseId }, { courseId: body.companyCourseId }] },
        });
      }
      if (!companyCourse) {
        companyCourse = await tx.companyCourse.findFirst({
          where: {
            OR: [
              { courseId: req.courseId },
              { title: req.courseTitle },
            ],
            availableSeats: { gt: 0 },
          },
        });
      }

      if (!companyCourse || companyCourse.availableSeats <= 0) {
        throw new BadRequestException('No available seats remaining in existing course library.');
      }

      // Resolve employee
      const emp = await tx.employee.findFirst({
        where: { OR: [{ id: req.employeeId }, { employeeCode: req.employeeId }] },
        include: { department: true },
      });
      const empId = emp ? emp.id : req.employeeId;
      const empName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : req.employeeName;
      const deptName = emp?.department?.name || req.department || 'Operations';

      // Check if already enrolled
      const existingEnrollment = await tx.courseEnrollment.findFirst({
        where: { companyCourseId: companyCourse.id, employeeId: empId },
      });
      if (existingEnrollment) {
        throw new BadRequestException('Employee is already enrolled in this company course.');
      }

      // Create enrollment
      const enrollment = await tx.courseEnrollment.create({
        data: {
          companyCourseId: companyCourse.id,
          employeeId: empId,
          employeeName: empName,
          department: deptName,
          courseId: companyCourse.courseId,
          courseCode: companyCourse.courseCode,
          courseTitle: companyCourse.title,
          status: 'Not Started',
          progress: 0,
          assignedDate: new Date(),
        },
      });

      // Update seats count
      await tx.companyCourse.update({
        where: { id: companyCourse.id },
        data: {
          assignedSeats: companyCourse.assignedSeats + 1,
          availableSeats: Math.max(0, companyCourse.availableSeats - 1),
        },
      });

      // Update request status
      const updatedRequest = await tx.lmsCourseRequest.update({
        where: { id },
        data: {
          status: 'Approved',
          approvedSeatType: 'Existing Seat',
        },
      });

      // Create Notification
      try {
        await tx.lmsNotification.create({
          data: {
            employeeId: empId,
            type: 'COURSE_ENROLLMENT',
            title: 'New Training Assigned',
            message: `Your request for "${companyCourse.title}" has been approved using an existing company seat.`,
            referenceId: enrollment.id,
          },
        });
      } catch (e) {}

      return {
        success: true,
        companyCourse,
        enrollment,
        request: updatedRequest,
      };
    });
  }

  async rejectCourseRequest(id: string, body: { rejectionReason: string }, user?: any) {
    if (!this.isHrOrAdmin(user)) {
      throw new ForbiddenException('Only HR or Admin can reject course requests.');
    }
    if (!body.rejectionReason?.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }
    const req = await this.prisma.lmsCourseRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Course request not found.');

    const updated = await this.prisma.lmsCourseRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        rejectionReason: body.rejectionReason.trim(),
      },
    });

    // Create notification for the employee
    try {
      await this.prisma.lmsNotification.create({
        data: {
          employeeId: req.employeeId,
          type: 'COURSE_REQUEST',
          title: 'Course Request Rejected',
          message: `Your course request for "${req.courseTitle}" was not approved. Reason: ${body.rejectionReason.trim()}`,
          referenceId: req.id,
        },
      });
    } catch (e) {}

    return updated;
  }

  async submitCourseRequest(data: any, user: any) {
    const empId = this.getEmployeeId(user);
    const emp = user?.employee;
    const employeeName = emp
      ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
      : user?.name || 'Employee';
    const department = emp?.department?.name || 'Operations';

    return await this.prisma.lmsCourseRequest.create({
      data: {
        employeeId: empId || data.employeeId || 'EMP-UNKNOWN',
        employeeName: employeeName || data.employeeName,
        department: department || data.department || 'Operations',
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        provider: data.provider || 'Enterprise Academy',
        pricePerSeat: Number(data.pricePerSeat) || 2500,
        reason: data.reason,
        businessBenefit: data.businessBenefit,
        priority: data.priority || 'Medium',
        courseUrl: data.courseUrl || data.url || null,
        status: 'Pending',
      },
    });
  }

  async updateCourseRequest(id: string, body: any) {
    return await this.prisma.lmsCourseRequest.update({
      where: { id },
      data: body,
    });
  }

  async deleteCourseRequest(id: string) {
    return await this.prisma.lmsCourseRequest.delete({ where: { id } });
  }

  async getPurchaseHistory() {
    return await this.prisma.lmsPurchaseHistory.findMany({
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async deletePurchaseHistory(id: string) {
    return await this.prisma.lmsPurchaseHistory.delete({ where: { id } });
  }

  // ==========================================
  // PART 17 — REPORTS & REAL DATABASE CSV EXPORTS
  // ==========================================

  async getReportsSummary() {
    const [
      totalCatalog,
      companyCourses,
      enrollments,
      certificates,
      reimbursements,
    ] = await Promise.all([
      this.prisma.lmsCourseCatalog.count(),
      this.prisma.companyCourse.findMany(),
      this.prisma.courseEnrollment.findMany(),
      this.prisma.lmsCertificate.findMany(),
      this.prisma.lmsLearningReimbursement.findMany(),
    ]);

    const purchasedSeats = companyCourses.reduce((sum, c) => sum + c.purchasedSeats, 0);
    const assignedSeats = enrollments.length;
    const availableSeats = Math.max(0, purchasedSeats - assignedSeats);
    const seatUtilization = purchasedSeats > 0 ? Math.round((assignedSeats / purchasedSeats) * 100) : 0;

    const completedLearners = enrollments.filter((e) => e.status === 'Completed' || e.progress === 100).length;
    const activeLearners = enrollments.filter((e) => e.status === 'In Progress' || (e.progress > 0 && e.progress < 100)).length;
    const completionRate = enrollments.length > 0 ? Math.round((completedLearners / enrollments.length) * 100) : 0;

    const totalReimbursementPaid = reimbursements
      .filter((r) => r.status === 'PAID')
      .reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    // Department completion aggregation
    const deptMap: Record<string, { total: number; completed: number }> = {};
    for (const enr of enrollments) {
      const dept = enr.department || 'General';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, completed: 0 };
      deptMap[dept].total += 1;
      if (enr.status === 'Completed' || enr.progress === 100) {
        deptMap[dept].completed += 1;
      }
    }

    const departmentBreakdown = Object.entries(deptMap).map(([department, data]) => ({
      department,
      enrolledCount: data.total,
      completedCount: data.completed,
      completionRate: Math.round((data.completed / data.total) * 100),
    }));

    return {
      totalCatalogCourses: totalCatalog,
      totalCompanyCourses: companyCourses.length,
      purchasedSeats,
      assignedSeats,
      availableSeats,
      seatUtilization,
      totalEnrollments: enrollments.length,
      activeLearners,
      completedLearners,
      completionRate,
      certificatesIssued: certificates.length,
      reimbursementsCount: reimbursements.length,
      totalReimbursementPaid,
      departmentBreakdown,
      trainingHoursDelivered: completedLearners * 12,
    };
  }

  async exportCompletionsCsv(): Promise<string> {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Enrollment ID',
      'Employee ID',
      'Employee Name',
      'Department',
      'Course Code',
      'Course Title',
      'Progress (%)',
      'Status',
      'Assessment Score',
      'Assigned Date',
      'Completed Date',
    ];

    const rows = enrollments.map((e) => [
      e.id,
      e.employeeId,
      `"${(e.employeeName || '').replace(/"/g, '""')}"`,
      `"${(e.department || '').replace(/"/g, '""')}"`,
      e.courseCode,
      `"${(e.courseTitle || '').replace(/"/g, '""')}"`,
      e.progress,
      e.status,
      e.assessmentScore ?? 'N/A',
      e.assignedDate ? e.assignedDate.toISOString().split('T')[0] : '',
      e.completedAt ? e.completedAt.toISOString().split('T')[0] : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportCertificatesCsv(): Promise<string> {
    const certs = await this.prisma.lmsCertificate.findMany({
      orderBy: { issueDate: 'desc' },
    });

    const headers = [
      'Certificate Number',
      'Employee ID',
      'Employee Name',
      'Department',
      'Course Title',
      'Verification Code',
      'Issue Date',
      'Status',
    ];

    const rows = certs.map((c) => [
      c.certificateNumber,
      c.employeeId,
      `"${(c.employeeName || '').replace(/"/g, '""')}"`,
      `"${(c.department || '').replace(/"/g, '""')}"`,
      `"${(c.courseTitle || '').replace(/"/g, '""')}"`,
      c.verificationCode,
      c.issueDate.toISOString().split('T')[0],
      c.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportReimbursementsCsv(): Promise<string> {
    const records = await this.prisma.lmsLearningReimbursement.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Reimbursement ID',
      'Employee ID',
      'Employee Name',
      'Course Title',
      'Provider',
      'Purchase Amount',
      'Approved Amount',
      'Paid Amount',
      'Status',
      'Payment Reference',
      'Created Date',
      'Paid Date',
    ];

    const rows = records.map((r) => [
      r.id,
      r.employeeId,
      `"${(r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '').replace(/"/g, '""')}"`,
      `"${r.courseTitle.replace(/"/g, '""')}"`,
      `"${r.provider.replace(/"/g, '""')}"`,
      r.purchaseAmount,
      r.approvedAmount ?? 'N/A',
      r.paidAmount ?? 'N/A',
      r.status,
      r.paymentReference || 'N/A',
      r.createdAt.toISOString().split('T')[0],
      r.paidDate ? r.paidDate.toISOString().split('T')[0] : 'N/A',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
