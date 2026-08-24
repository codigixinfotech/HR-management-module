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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(config) {
        const rawUrl = config.get('DATABASE_URL') || process.env.DATABASE_URL;
        let dbUrl = rawUrl;
        if (dbUrl && dbUrl.includes('${')) {
            const host = process.env.DB_HOST || config.get('DB_HOST') || 'localhost';
            const port = process.env.DB_PORT || config.get('DB_PORT') || '3306';
            const user = process.env.DB_USER || config.get('DB_USER') || 'root';
            const password = process.env.DB_PASSWORD || config.get('DB_PASSWORD') || '';
            const name = process.env.DB_NAME || config.get('DB_NAME') || 'hrm_db';
            dbUrl = `mysql://${user}:${password}@${host}:${port}/${name}`;
        }
        if (dbUrl && !dbUrl.includes('connection_limit')) {
            dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=30&pool_timeout=30';
        }
        super(dbUrl
            ? {
                datasources: {
                    db: {
                        url: dbUrl,
                    },
                },
            }
            : undefined);
    }
    async onModuleInit() {
        await this.$connect();
        console.log('\x1b[1m\x1b[32m%s\x1b[0m', '=========================================================');
        console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  ✅ DATABASE CONNECTED SUCCESSFULLY TO MYSQL (hrm_db)  ');
        console.log('\x1b[1m\x1b[32m%s\x1b[0m', '=========================================================');
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map