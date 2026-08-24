const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '3307';
const user = process.env.DB_USER || 'hrm_user';
const password = process.env.DB_PASSWORD || 'C0digix$309';
const name = process.env.DB_NAME || 'hrm_db';

const url = `mysql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
console.log('Testing connection to URL:', `mysql://${user}:****@${host}:${port}/${name}`);

async function test() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });
  try {
    await prisma.$connect();
    console.log('Successfully connected to MySQL database on port', port);
    const count = await prisma.user.count().catch(() => 'connected but table user empty or not queried');
    console.log('User count in DB:', count);
    await prisma.$disconnect();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

test();
