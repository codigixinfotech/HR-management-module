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
exports.HrPoliciesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const path_1 = require("path");
const fs_1 = require("fs");
const hr_policies_service_1 = require("./hr-policies.service");
const hr_policy_dto_1 = require("./dto/hr-policy.dto");
const multer_config_1 = require("./multer.config");
let HrPoliciesController = class HrPoliciesController {
    service;
    constructor(service) {
        this.service = service;
    }
    getKpis(companyId) {
        return this.service.getKpis(companyId);
    }
    findAll(search, category, status, companyId) {
        return this.service.findAll(search, category, status, companyId);
    }
    uploadFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('Policy document file is required');
        }
        const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const ext = file.originalname.split('.').pop()?.toUpperCase() || 'PDF';
        const fileSizeStr = `${fileSizeMb} MB ${ext}`;
        const documentUrl = `/api/organization/hr-policies/download/${file.filename}`;
        return {
            documentUrl,
            fileSize: fileSizeStr,
            filename: file.filename,
            originalName: file.originalname,
        };
    }
    downloadFile(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'hr-policies', filename);
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new common_1.NotFoundException('Policy document file not found');
        }
        return res.sendFile(filePath);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    createVersion(id, dto) {
        return this.service.createVersion(id, dto);
    }
    sendReminder(id) {
        return this.service.sendReminder(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.HrPoliciesController = HrPoliciesController;
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "getKpis", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: multer_config_1.policyDocumentStorage,
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, callback) => {
            if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
                return callback(new common_1.BadRequestException('Only PDF, DOC, and DOCX files are allowed'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('download/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_policy_dto_1.CreateHrPolicyDto]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_policy_dto_1.UpdateHrPolicyDto]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/version'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hr_policy_dto_1.CreatePolicyVersionDto]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "createVersion", null);
__decorate([
    (0, common_1.Post)(':id/send-reminder'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "sendReminder", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrPoliciesController.prototype, "remove", null);
exports.HrPoliciesController = HrPoliciesController = __decorate([
    (0, common_1.Controller)('organization/hr-policies'),
    __metadata("design:paramtypes", [hr_policies_service_1.HrPoliciesService])
], HrPoliciesController);
//# sourceMappingURL=hr-policies.controller.js.map