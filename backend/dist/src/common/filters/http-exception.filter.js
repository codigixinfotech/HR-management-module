"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = class HttpExceptionFilter {
    logger = new common_1.Logger('ExceptionFilter');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let body = { message: 'Internal server error' };
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            body = exception.getResponse();
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                status = common_1.HttpStatus.CONFLICT;
                const target = exception.meta?.target || [];
                const fieldName = Array.isArray(target) && target.length > 0 ? target.join(', ') : 'field';
                body = { message: `A record with this ${fieldName} already exists.` };
            }
            else if (exception.code === 'P2025') {
                status = common_1.HttpStatus.NOT_FOUND;
                body = { message: 'Record not found.' };
            }
            else if (exception.code === 'P2003') {
                status = common_1.HttpStatus.BAD_REQUEST;
                body = { message: 'Invalid reference ID provided.' };
            }
            else {
                status = common_1.HttpStatus.BAD_REQUEST;
                body = { message: exception.message };
            }
        }
        else if (exception instanceof Error) {
            body = { message: exception.message };
        }
        if (status >= 500) {
            this.logger.error(exception instanceof Error ? exception.stack : exception);
        }
        response
            .status(status)
            .json(typeof body === 'string'
            ? { statusCode: status, message: body }
            : { statusCode: status, ...body });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map