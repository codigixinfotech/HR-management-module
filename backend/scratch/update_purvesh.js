const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function updatePassword() {
  const newHash = await bcrypt.hash('Patil@123', 12);
  
  // Update ppurvesh503@gmail.com
  const u1 = await prisma.user.updateMany({
    where: {
      email: { in: ['ppurvesh503@gmail.com', 'ppurvesh503@gmail.comm'] }
    },
    data: {
      passwordHash: newHash,
      isActive: true,
      mustResetPassword: false,
    }
  });
  console.log('Updated ppurvesh users count:', u1.count);

  // Check branch1@gmail.com
  const b1 = await prisma.user.findUnique({
    where: { email: 'branch1@gmail.com' }
  });
  const b1Valid = b1 ? await bcrypt.compare('Branch@1', b1.passwordHash) : false;
  console.log('branch1@gmail.com with Branch@1 valid:', b1Valid);

  // Test both with HTTP request
  for (const acc of [
    { email: 'ppurvesh503@gmail.com', pass: 'Patil@123' },
    { email: 'branch1@gmail.com', pass: 'Branch@1' },
    { email: 'admin@ehcm.local', pass: 'Admin@123' },
  ]) {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.pass }),
    });
    const data = await res.json();
    console.log(`Login ${acc.email} with "${acc.pass}":`, res.status, res.ok ? 'SUCCESS' : data);
  }
}

updatePassword().finally(() => prisma.$disconnect());
