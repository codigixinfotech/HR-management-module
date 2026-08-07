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
exports.AiIntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const ai_intelligence_service_1 = require("./ai-intelligence.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let AiIntelligenceController = class AiIntelligenceController {
    aiIntelligenceService;
    constructor(aiIntelligenceService) {
        this.aiIntelligenceService = aiIntelligenceService;
    }
    getStatus() {
        return this.aiIntelligenceService.getStatus();
    }
};
exports.AiIntelligenceController = AiIntelligenceController;
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.Permissions)('ai_intelligence.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiIntelligenceController.prototype, "getStatus", null);
exports.AiIntelligenceController = AiIntelligenceController = __decorate([
    (0, common_1.Controller)('ai-intelligence'),
    __metadata("design:paramtypes", [ai_intelligence_service_1.AiIntelligenceService])
], AiIntelligenceController);
//# sourceMappingURL=ai-intelligence.controller.js.map