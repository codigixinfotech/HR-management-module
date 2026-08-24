"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            const payGrades = await this.prisma.payGrade.findMany();
            for (const pg of payGrades) {
                await this.prisma.$executeRawUnsafe(`UPDATE employees SET grade = ?, level = ? WHERE grade = ? OR level = ?`, pg.gradeCode, pg.level, pg.id, pg.id);
                await this.prisma.$executeRawUnsafe(`UPDATE employee_position_histories SET grade = ?, level = ? WHERE grade = ? OR level = ?`, pg.gradeCode, pg.level, pg.id, pg.id);
                await this.prisma.$executeRawUnsafe(`UPDATE employee_position_histories SET prevGrade = ? WHERE prevGrade = ?`, pg.gradeCode, pg.id);
            }
        }
        catch (e) {
            console.error('Failed auto-repair of Grade IDs in DB:', e);
        }
    }
    listInclude = {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        reportingManager: { select: { id: true, firstName: true, lastName: true } },
        documents: true,
    };
    fullInclude = {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        reportingManager: { select: { id: true, firstName: true, lastName: true } },
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
    };
    async findMe(currentUser) {
        if (!currentUser) {
            throw new common_1.NotFoundException('Current session employee not found');
        }
        const searchConditions = [];
        if (currentUser.employee?.id)
            searchConditions.push({ id: currentUser.employee.id });
        if (currentUser.userId)
            searchConditions.push({ userId: currentUser.userId });
        if (currentUser.email)
            searchConditions.push({ workEmail: currentUser.email });
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
            throw new common_1.NotFoundException('No employee record found for current user');
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
    async list(query, companyId) {
        const { skip, take, page, pageSize } = (0, pagination_dto_1.buildPagination)(query);
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
    parseDates(dto) {
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
            }
            else if (parsed[field] === '') {
                parsed[field] = null;
            }
        }
        return parsed;
    }
    isUserHrOrAdmin(user) {
        if (!user)
            return true;
        if (user.permissions?.includes('*'))
            return true;
        const isRoleAdmin = user.roles?.some((r) => {
            const u = r.toUpperCase();
            return u.includes('ADMIN') || u.includes('HR');
        });
        const isPrimaryAdmin = user.primaryRole?.toUpperCase().includes('ADMIN') ||
            user.primaryRole?.toUpperCase().includes('HR');
        return Boolean(isRoleAdmin || isPrimaryAdmin);
    }
    async resolveEmployeeId(id, currentUser) {
        const isHrOrAdmin = currentUser ? this.isUserHrOrAdmin(currentUser) : true;
        if (id === 'me' || (currentUser && !isHrOrAdmin)) {
            if (currentUser?.employee?.id)
                return currentUser.employee.id;
            const emp = await this.findMe(currentUser);
            if (emp)
                return emp.id;
        }
        return id;
    }
    async findById(id, currentUser) {
        if (id === 'me') {
            return this.findMe(currentUser);
        }
        let employee = null;
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
            throw new common_1.NotFoundException(`Employee record not found for query '${id}'`);
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
    async createLoginAccount(id, dto) {
        const employee = await this.prisma.employee.findFirst({
            where: { OR: [{ id }, { employeeCode: id }] },
            include: { user: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee record '${id}' not found`);
        }
        const workEmail = (dto.email ||
            employee.workEmail ||
            `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@ehcm.local`).trim();
        const tempPassword = dto.password || `Rowan#2026!Temp`;
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
            }
            else {
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
        }
        else {
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
    async sanitizeForeignKeys(data) {
        if (data.reportingManagerId) {
            const valid = await this.prisma.employee.findUnique({
                where: { id: data.reportingManagerId },
                select: { id: true },
            });
            if (!valid)
                data.reportingManagerId = null;
        }
        if (data.branchId) {
            const valid = await this.prisma.branch.findUnique({
                where: { id: data.branchId },
                select: { id: true },
            });
            if (!valid)
                data.branchId = null;
        }
        if (data.departmentId) {
            const valid = await this.prisma.department.findUnique({
                where: { id: data.departmentId },
                select: { id: true },
            });
            if (!valid)
                data.departmentId = null;
        }
        if (data.designationId) {
            const valid = await this.prisma.designation.findUnique({
                where: { id: data.designationId },
                select: { id: true },
            });
            if (!valid)
                data.designationId = null;
        }
    }
    async create(dto) {
        const existing = await this.prisma.employee.findFirst({
            where: { companyId: dto.companyId, employeeCode: dto.employeeCode },
        });
        if (existing)
            throw new common_1.ConflictException('An employee with this code already exists for this company');
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
        }
        catch (e) {
            console.error('Failed to create initial timeline/position event:', e);
        }
        return employee;
    }
    async update(id, dto) {
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
    async remove(id) {
        await this.findById(id);
        await this.prisma.employee.delete({ where: { id } });
        return { success: true };
    }
    async addDocument(employeeId, docType, fileName, filePath) {
        await this.findById(employeeId);
        return this.prisma.employeeDocument.create({
            data: { employeeId, docType, fileName, filePath },
        });
    }
    async listDocuments(employeeId) {
        await this.findById(employeeId);
        return this.prisma.employeeDocument.findMany({
            where: { employeeId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async removeDocument(employeeId, documentId) {
        const doc = await this.prisma.employeeDocument.findFirst({
            where: { id: documentId, employeeId },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        await this.prisma.employeeDocument.delete({ where: { id: documentId } });
        return { success: true };
    }
    async enrollInCourse(employeeId, dto) {
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
        }
        catch (e) {
            console.error('Failed to create timeline event:', e);
        }
        return enrollment;
    }
    async addKpi(employeeId, dto) {
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
    async addHrNote(employeeId, dto) {
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
    async createSkill(dto) {
        const id = 'skl_' + Math.random().toString(36).substring(2, 11);
        const certRequiredVal = dto.certRequired ? 1 : 0;
        await this.prisma.$executeRawUnsafe('INSERT INTO skill_competencies (id, name, category, certRequired, benchmarkScore, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', id, dto.name, dto.category, certRequiredVal, dto.benchmarkScore);
        const results = await this.prisma.$queryRawUnsafe('SELECT * FROM skill_competencies WHERE id = ?', id);
        return results[0];
    }
    async removeSkill(id) {
        await this.prisma.$executeRawUnsafe('DELETE FROM skill_competencies WHERE id = ?', id);
        return { success: true };
    }
    async getPositionHistory(employeeId) {
        let history = await this.prisma.$queryRawUnsafe('SELECT * FROM employee_position_histories WHERE employeeId = ? ORDER BY effectiveDate DESC, createdAt DESC', employeeId);
        const payGrades = await this.prisma.payGrade.findMany();
        const pgMap = new Map();
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
                await this.prisma.$executeRawUnsafe(`INSERT INTO employee_position_histories (
            id, employeeId, transferId, effectiveDate, movementType,
            departmentId, departmentName, designationId, designationTitle, grade, level, branchId, branchName,
            approvedBy, approvedDate, reason, remarks, status, createdAt, updatedAt
          ) VALUES (?, ?, NULL, ?, 'JOINING', ?, ?, ?, ?, ?, ?, ?, ?, 'HR System', NOW(), 'Initial Joining Position', 'Employee Master record', 'CURRENT', NOW(), NOW())`, histId, emp.id, emp.dateOfJoining ?? new Date(), emp.departmentId ?? null, emp.department?.name ?? null, emp.designationId ?? null, emp.designation?.title ?? null, resolvedEmpGrade ?? null, resolvedEmpLevel ?? null, emp.branchId ?? null, emp.branch?.name ?? null);
                history = await this.prisma.$queryRawUnsafe('SELECT * FROM employee_position_histories WHERE employeeId = ? ORDER BY effectiveDate DESC, createdAt DESC', employeeId);
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
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map