const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'ppurvesh503@gmail.com' }
  });
  console.log('User found:', user ? {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    mustResetPassword: user.mustResetPassword,
    hasHash: !!user.passwordHash
  } : null);

  if (user) {
    console.log('Testing Patil@123:', await bcrypt.compare('Patil@123', user.passwordHash));
    console.log('Testing Patil@1234:', await bcrypt.compare('Patil@1234', user.passwordHash));
    console.log('Testing admin@123:', await bcrypt.compare('Admin@123', user.passwordHash));
  }

  // Also test branch1@gmail.com with Branch@1
  const b1 = await prisma.user.findUnique({
    where: { email: 'branch1@gmail.com' }
  });
  console.log('branch1 Branch@1:', await bcrypt.compare('Branch@1', b1.passwordHash));
}

test().finally(() => prisma.$disconnect());
