require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { contains: 'ppurvesh' } },
    });
    console.log('User found:', user?.email, user?.id);

    const jwtSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'secret';

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

    // Now make request with this token
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/workforce/machines?companyId=cmtwjbe5900zoj7op4c3xxxb5&branchId=HEAD_OFFICE',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', data);
      });
    });

    req.on('error', e => console.error(e));
    req.end();

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
