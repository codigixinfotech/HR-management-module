"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EhsModule = void 0;
const common_1 = require("@nestjs/common");
const incidents_controller_1 = require("./incidents.controller");
const incidents_service_1 = require("./incidents.service");
const ppe_controller_1 = require("./ppe.controller");
const ppe_service_1 = require("./ppe.service");
const safety_audits_controller_1 = require("./safety-audits.controller");
const safety_audits_service_1 = require("./safety-audits.service");
let EhsModule = class EhsModule {
};
exports.EhsModule = EhsModule;
exports.EhsModule = EhsModule = __decorate([
    (0, common_1.Module)({
        controllers: [incidents_controller_1.IncidentsController, ppe_controller_1.PpeController, safety_audits_controller_1.SafetyAuditsController],
        providers: [incidents_service_1.IncidentsService, ppe_service_1.PpeService, safety_audits_service_1.SafetyAuditsService],
        exports: [incidents_service_1.IncidentsService, ppe_service_1.PpeService, safety_audits_service_1.SafetyAuditsService],
    })
], EhsModule);
//# sourceMappingURL=ehs.module.js.map