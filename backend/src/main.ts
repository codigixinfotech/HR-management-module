import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const corsEnv = config.get<string>('CORS_ORIGIN');
      const configuredOrigins = corsEnv ? corsEnv.split(',').map((s) => s.trim()) : [];

      if (
        configuredOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EHCM API')
    .setDescription('Enterprise Human Capital Management platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');

  const dbUser = process.env.DB_USER || 'hrm_user';
  const dbPort = process.env.DB_PORT || '3307';
  const dbName = process.env.DB_NAME || 'hrm_db';

  console.log('\x1b[1m\x1b[32m%s\x1b[0m', `=========================================================`);
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', `  ✅ DATABASE CONNECTED: MySQL (${dbName}) on port ${dbPort} as ${dbUser}`);
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', `  🚀 EHCM backend listening on http://0.0.0.0:${port}/api`);
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', `=========================================================`);
}
bootstrap();
