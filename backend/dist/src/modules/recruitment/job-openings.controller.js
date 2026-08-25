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
exports.JobOpeningsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const fs_1 = require("fs");
const path_1 = require("path");
const job_openings_service_1 = require("./job-openings.service");
const candidates_service_1 = require("./candidates.service");
const job_opening_dto_1 = require("./dto/job-opening.dto");
const multer_config_1 = require("./multer.config");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let JobOpeningsController = class JobOpeningsController {
    jobOpeningsService;
    candidatesService;
    constructor(jobOpeningsService, candidatesService) {
        this.jobOpeningsService = jobOpeningsService;
        this.candidatesService = candidatesService;
    }
    list(companyId, status) {
        return this.jobOpeningsService.list(companyId, status);
    }
    listPublicJobs(companyId) {
        return this.jobOpeningsService.listPublicJobs(companyId);
    }
    findPublicJob(id) {
        return this.jobOpeningsService.findPublicJob(id);
    }
    uploadResume(file) {
        if (!file) {
            throw new common_1.BadRequestException('Resume document file is required');
        }
        const documentUrl = `/api/recruitment/job-openings/resumes/download/${file.filename}`;
        return {
            documentUrl,
            filename: file.filename,
            originalName: file.originalname,
        };
    }
    downloadResume(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'resumes', filename);
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new common_1.NotFoundException('Resume document file not found');
        }
        return res.sendFile(filePath);
    }
    findOne(id) {
        return this.jobOpeningsService.findById(id);
    }
    create(dto) {
        return this.jobOpeningsService.create(dto);
    }
    publishOpening(id) {
        return this.jobOpeningsService.publishOpening(id);
    }
    update(id, dto) {
        return this.jobOpeningsService.update(id, dto);
    }
    remove(id) {
        return this.jobOpeningsService.remove(id);
    }
    listCandidates(id) {
        return this.candidatesService.listForJobOpening(id);
    }
    addCandidate(id, dto) {
        return this.candidatesService.create({ ...dto, jobOpeningId: id });
    }
};
exports.JobOpeningsController = JobOpeningsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "list", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/list'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "listPublicJobs", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "findPublicJob", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('upload-resume'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: multer_config_1.candidateResumeStorage,
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
], JobOpeningsController.prototype, "uploadResume", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('resumes/download/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "downloadResume", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [job_opening_dto_1.CreateJobOpeningDto]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "publishOpening", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, job_opening_dto_1.UpdateJobOpeningDto]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/candidates'),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "listCandidates", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':id/candidates'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobOpeningsController.prototype, "addCandidate", null);
exports.JobOpeningsController = JobOpeningsController = __decorate([
    (0, common_1.Controller)('recruitment/job-openings'),
    __metadata("design:paramtypes", [job_openings_service_1.JobOpeningsService,
        candidates_service_1.CandidatesService])
], JobOpeningsController);
//# sourceMappingURL=job-openings.controller.js.map