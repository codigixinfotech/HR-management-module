import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const rawUrl = config.get<string>('DATABASE_URL') || process.env.DATABASE_URL;

    let dbUrl = rawUrl;
    if (dbUrl && dbUrl.includes('${')) {
      const host = process.env.DB_HOST || config.get<string>('DB_HOST') || 'localhost';
      const port = process.env.DB_PORT || config.get<string>('DB_PORT') || '3306';
      const user = process.env.DB_USER || config.get<string>('DB_USER') || 'root';
      const password = process.env.DB_PASSWORD || config.get<string>('DB_PASSWORD') || '';
      const name = process.env.DB_NAME || config.get<string>('DB_NAME') || 'hrm_db';

      dbUrl = `mysql://${user}:${password}@${host}:${port}/${name}`;
    }

    if (dbUrl && !dbUrl.includes('connection_limit')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=30&pool_timeout=30';
    }

    super(
      dbUrl
        ? {
            datasources: {
              db: {
                url: dbUrl,
              },
            },
          }
        : undefined,
    );
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
}
