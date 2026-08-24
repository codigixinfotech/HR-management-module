const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const name = process.env.DB_NAME;

// Test 1: Raw constructed URL (C0digix$309)
const rawUrl = `mysql://${user}:${password}@${host}:${port}/${name}`;
console.log('Testing Raw URL:', rawUrl);

async function testConnection(url) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });
  try {
    await prisma.$connect();
    console.log('SUCCESS connecting with:', url);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.error('FAILED connecting with:', url, 'Error:', err.message);
    return false;
  }
}

async function run() {
  const ok1 = await testConnection(rawUrl);
  if (!ok1) {
    // Test 2: URL encoded password (C0digix%24309)
    const encodedUrl = `mysql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
    console.log('Testing Encoded URL:', encodedUrl);
    await testConnection(encodedUrl);
  }
}

run();
