"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelExpenseService = void 0;
const common_1 = require("@nestjs/common");
let TravelExpenseService = class TravelExpenseService {
    getStatus() {
        return {
            module: 'Travel & Expense',
            status: 'scaffolded',
            message: 'This module is scaffolded per the EHCM roadmap and is planned for a later implementation phase. Endpoints, data model and workflow are not yet implemented.',
        };
    }
};
exports.TravelExpenseService = TravelExpenseService;
exports.TravelExpenseService = TravelExpenseService = __decorate([
    (0, common_1.Injectable)()
], TravelExpenseService);
//# sourceMappingURL=travel-expense.service.js.map