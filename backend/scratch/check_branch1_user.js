const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'branch1@gmail.com' },
    include: {
      roles: { include: { role: true } },
      branch: true,
      company: true,
    }
  });
  
  if (!user) {
    console.log('User NOT FOUND in database for branch1@gmail.com');
    
    // List all branch users
    const branchUsers = await prisma.user.findMany({
      where: { branchId: { not: null } },
      include: { roles: { include: { role: true } }, branch: true },
    });
    console.log('All branch-linked users:', JSON.stringify(branchUsers.map(u => ({
      email: u.email,
      isActive: u.isActive,
      mustResetPassword: u.mustResetPassword,
      branchId: u.branchId,
      branchName: u.branch?.name,
      roles: u.roles.map(r => r.role.name),
    })), null, 2));
    return;
  }

  console.log('User found:');
  console.log('  email:', user.email);
  console.log('  isActive:', user.isActive);
  console.log('  mustResetPassword:', user.mustResetPassword);
  console.log('  branchId:', user.branchId);
  console.log('  companyId:', user.companyId);
  console.log('  branch:', user.branch?.name);
  console.log('  roles:', user.roles.map(r => r.role.name));
  
  // Test password
  const testPassword = 'Branch@1';
  const valid = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('  Password "Branch@1" valid:', valid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
