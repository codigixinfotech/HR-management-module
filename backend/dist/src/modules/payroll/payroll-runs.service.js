"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollRunsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const PF_RATE = 0.12;
const PF_WAGE_CEILING = 15000;
const ESIC_RATE = 0.0075;
const ESIC_WAGE_CEILING = 21000;
const PROFESSIONAL_TAX_THRESHOLD = 15000;
const PROFESSIONAL_TAX_AMOUNT = 200;
let PayrollRunsService = class PayrollRunsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId) {
        return this.prisma.payrollRun.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            include: { _count: { select: { payslips: true } } },
        });
    }
    async findById(id) {
        const run = await this.prisma.payrollRun.findUnique({
            where: { id },
            include: { _count: { select: { payslips: true } } },
        });
        if (!run)
            throw new common_1.NotFoundException('Payroll run not found');
        return run;
    }
    async create(dto) {
        const existing = await this.prisma.payrollRun.findFirst({
            where: { companyId: dto.companyId, month: dto.month, year: dto.year },
        });
        if (existing)
            throw new common_1.ConflictException('A payroll run for this month already exists');
        return this.prisma.payrollRun.create({ data: dto });
    }
    async updateStatus(id, dto) {
        const run = await this.findById(id);
        if (run.status === client_1.PayrollRunStatus.DRAFT) {
            throw new common_1.ConflictException('Run the payroll before changing its status');
        }
        const data = { status: dto.status };
        if (dto.status === client_1.PayrollRunStatus.APPROVED)
            data.approvedAt = new Date();
        if (dto.status === client_1.PayrollRunStatus.PAID)
            data.paidAt = new Date();
        return this.prisma.payrollRun.update({ where: { id }, data });
    }
    async process(id) {
        const run = await this.findById(id);
        if (run.status !== client_1.PayrollRunStatus.DRAFT) {
            throw new common_1.ConflictException('This payroll run has already been processed');
        }
        const employees = await this.prisma.employee.findMany({
            where: { companyId: run.companyId, status: 'ACTIVE' },
            include: { salaryComponents: { include: { salaryComponent: true } } },
        });
        await this.prisma.$transaction(async (tx) => {
            for (const employee of employees) {
                const earnings = employee.salaryComponents.filter((c) => c.salaryComponent.type === client_1.SalaryComponentType.EARNING);
                const deductions = employee.salaryComponents.filter((c) => c.salaryComponent.type === client_1.SalaryComponentType.DEDUCTION);
                const grossEarnings = earnings.reduce((sum, c) => sum + c.monthlyAmount, 0);
                const otherDeductions = deductions
                    .filter((c) => !c.salaryComponent.isStatutory)
                    .reduce((sum, c) => sum + c.monthlyAmount, 0);
                const basic = earnings.find((c) => c.salaryComponent.code === 'BASIC')
                    ?.monthlyAmount ?? 0;
                const pf = Math.min(basic, PF_WAGE_CEILING) * PF_RATE;
                const esic = grossEarnings > 0 && grossEarnings <= ESIC_WAGE_CEILING
                    ? grossEarnings * ESIC_RATE
                    : 0;
                const professionalTax = grossEarnings > PROFESSIONAL_TAX_THRESHOLD
                    ? PROFESSIONAL_TAX_AMOUNT
                    : 0;
                const netPay = grossEarnings - pf - esic - professionalTax - otherDeductions;
                const payslip = await tx.payslip.create({
                    data: {
                        payrollRunId: run.id,
                        employeeId: employee.id,
                        grossEarnings,
                        pf,
                        esic,
                        professionalTax,
                        otherDeductions,
                        netPay,
                    },
                });
                if (employee.salaryComponents.length > 0) {
                    await tx.payslipComponent.createMany({
                        data: employee.salaryComponents.map((c) => ({
                            payslipId: payslip.id,
                            salaryComponentId: c.salaryComponentId,
                            name: c.salaryComponent.name,
                            type: c.salaryComponent.type,
                            amount: c.monthlyAmount,
                        })),
                    });
                }
            }
            await tx.payrollRun.update({
                where: { id: run.id },
                data: { status: client_1.PayrollRunStatus.PROCESSED, processedAt: new Date() },
            });
        });
        return this.findById(id);
    }
};
exports.PayrollRunsService = PayrollRunsService;
exports.PayrollRunsService = PayrollRunsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollRunsService);
//# sourceMappingURL=payroll-runs.service.js.map