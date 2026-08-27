"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importStar(require("express"));
const fs_1 = require("fs");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const uploadsDir = (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'backend', 'uploads'))
        ? (0, path_1.join)(process.cwd(), 'backend', 'uploads')
        : (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'uploads'))
            ? (0, path_1.join)(process.cwd(), 'uploads')
            : (0, path_1.join)(__dirname, '..', 'uploads');
    app.use('/uploads', express_1.default.static(uploadsDir));
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        frameguard: false,
    }));
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const corsEnv = config.get('CORS_ORIGIN');
            const configuredOrigins = corsEnv ? corsEnv.split(',').map((s) => s.trim()) : [];
            if (configuredOrigins.includes(origin) ||
                /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }
            return callback(null, true);
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('EHCM API')
        .setDescription('Enterprise Human Capital Management platform API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = config.get('PORT') || Number(process.env.PORT) || 3001;
    await app.listen(port, '0.0.0.0');
    const dbUser = process.env.DB_USER;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `=========================================================`);
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `  ✅ DATABASE CONNECTED: MySQL (${dbName}) on port ${dbPort} as ${dbUser}`);
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `  🚀 EHCM backend listening on http://0.0.0.0:${port}/api`);
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', `=========================================================`);
}
bootstrap();
//# sourceMappingURL=main.js.map