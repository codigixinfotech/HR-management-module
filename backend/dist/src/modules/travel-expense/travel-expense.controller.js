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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelExpenseController = void 0;
const common_1 = require("@nestjs/common");
const travel_expense_service_1 = require("./travel-expense.service");
const travel_booking_dto_1 = require("./dto/travel-booking.dto");
let TravelExpenseController = class TravelExpenseController {
    travelExpenseService;
    constructor(travelExpenseService) {
        this.travelExpenseService = travelExpenseService;
    }
    getDashboardStats(companyId) {
        return this.travelExpenseService.getDashboardStats(companyId);
    }
    listBookings(companyId, search, status, travelType, departmentId, employeeId, startDate, endDate) {
        return this.travelExpenseService.listBookings({
            companyId,
            search,
            status,
            travelType,
            departmentId,
            employeeId,
            startDate,
            endDate,
        });
    }
    getBooking(id) {
        return this.travelExpenseService.getBooking(id);
    }
    createBooking(dto, req) {
        const actorName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Employee' : 'Employee';
        return this.travelExpenseService.createBooking(dto, actorName);
    }
    updateBooking(id, dto, req) {
        const actorName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Employee' : 'Employee';
        return this.travelExpenseService.updateBooking(id, dto, actorName);
    }
    updateStatus(id, dto, req) {
        const userId = req.user?.id;
        const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Manager / Admin' : 'Manager / Admin';
        return this.travelExpenseService.updateStatus(id, {
            ...dto,
            userId: dto.userId || userId,
            userName: dto.userName || userName,
        });
    }
    createExpenseClaimFromBooking(id, dto) {
        return this.travelExpenseService.createExpenseClaimFromBooking(id, dto);
    }
    listClaims(companyId) {
        return this.travelExpenseService.listClaims(companyId);
    }
    createClaimDirect(dto) {
        return this.travelExpenseService.createClaimDirect(dto);
    }
    updateClaimStatus(id, body) {
        return this.travelExpenseService.updateClaimStatus(id, body);
    }
};
exports.TravelExpenseController = TravelExpenseController;
__decorate([
    (0, common_1.Get)('dashboard-stats'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('travelType')),
    __param(4, (0, common_1.Query)('departmentId')),
    __param(5, (0, common_1.Query)('employeeId')),
    __param(6, (0, common_1.Query)('startDate')),
    __param(7, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "listBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Post)('bookings'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [travel_booking_dto_1.CreateTravelBookingDto, Object]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Patch)('bookings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Post)('bookings/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, travel_booking_dto_1.UpdateTravelStatusDto, Object]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('bookings/:id/create-expense-claim'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "createExpenseClaimFromBooking", null);
__decorate([
    (0, common_1.Get)('claims'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "listClaims", null);
__decorate([
    (0, common_1.Post)('claims'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [travel_booking_dto_1.CreateExpenseClaimDto]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "createClaimDirect", null);
__decorate([
    (0, common_1.Post)('claims/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TravelExpenseController.prototype, "updateClaimStatus", null);
exports.TravelExpenseController = TravelExpenseController = __decorate([
    (0, common_1.Controller)('travel-expense'),
    __metadata("design:paramtypes", [travel_expense_service_1.TravelExpenseService])
], TravelExpenseController);
//# sourceMappingURL=travel-expense.controller.js.map