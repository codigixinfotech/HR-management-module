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
exports.OffersController = void 0;
const common_1 = require("@nestjs/common");
const offer_email_service_1 = require("./offer-email.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let OffersController = class OffersController {
    offerEmailService;
    constructor(offerEmailService) {
        this.offerEmailService = offerEmailService;
    }
    async sendOfferEmail(dto) {
        return this.offerEmailService.sendOfferEmail(dto);
    }
    async testSmtpConnection(email) {
        return this.offerEmailService.testSmtpConnection(email);
    }
    async getAuditLogs(offerId) {
        return this.offerEmailService.getAuditLogs(offerId);
    }
};
exports.OffersController = OffersController;
__decorate([
    (0, common_1.Post)('send-email'),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "sendOfferEmail", null);
__decorate([
    (0, common_1.Post)('test-smtp'),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "testSmtpConnection", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Query)('offerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "getAuditLogs", null);
exports.OffersController = OffersController = __decorate([
    (0, common_1.Controller)('recruitment/offers'),
    __metadata("design:paramtypes", [offer_email_service_1.OfferEmailService])
], OffersController);
//# sourceMappingURL=offers.controller.js.map