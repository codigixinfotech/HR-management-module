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
exports.LeaveRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const leave_balances_service_1 = require("./leave-balances.service");
const MS_PER_DAY = 24 * 60 * 60 * 1000;
let LeaveRequestsService = class LeaveRequestsService {
    prisma;
    leaveBalancesService;
    constructor(prisma, leaveBalancesService) {
        this.prisma = prisma;
        this.leaveBalancesService = leaveBalancesService;
    }
    listInclude = {
        employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        leaveType: { select: { id: true, name: true, code: true, isPaid: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
    };
    async list(query, employeeId, status) {
        const { skip, take, page, pageSize } = (0, pagination_dto_1.buildPagination)(query);
        const where = {
            ...(employeeId ? { employeeId } : {}),
            ...(status ? { status } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.leaveRequest.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: this.listInclude,
            }),
            this.prisma.leaveRequest.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async findById(id) {
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id },
            include: this.listInclude,
        });
        if (!request)
            throw new common_1.NotFoundException('Leave request not found');
        return request;
    }
    create(dto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
        return this.prisma.leaveRequest.create({
            data: {
                companyId: dto.companyId,
                employeeId: dto.employeeId,
                leaveTypeId: dto.leaveTypeId,
                startDate,
                endDate,
                totalDays,
                reason: dto.reason,
            },
            include: this.listInclude,
        });
    }
    async updateStatus(id, dto) {
        const request = await this.findById(id);
        const wasApproved = request.status === 'APPROVED';
        const willBeApproved = dto.status === 'APPROVED';
        const year = request.startDate.getFullYear();
        const updated = await this.prisma.leaveRequest.update({
            where: { id },
            data: {
                status: dto.status,
                approverId: dto.approverId,
                approverRemarks: dto.approverRemarks,
                decidedAt: new Date(),
            },
            include: this.listInclude,
        });
        if (!wasApproved && willBeApproved) {
            await this.leaveBalancesService.adjustUsed(request.employeeId, request.leaveTypeId, year, request.totalDays);
        }
        else if (wasApproved && !willBeApproved) {
            await this.leaveBalancesService.adjustUsed(request.employeeId, request.leaveTypeId, year, -request.totalDays);
        }
        return updated;
    }
};
exports.LeaveRequestsService = LeaveRequestsService;
exports.LeaveRequestsService = LeaveRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        leave_balances_service_1.LeaveBalancesService])
], LeaveRequestsService);
//# sourceMappingURL=leave-requests.service.js.map