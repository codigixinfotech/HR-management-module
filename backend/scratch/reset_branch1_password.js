const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'branch1@gmail.com';
  const newPassword = 'Branch@1';

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      isActive: true,
      mustResetPassword: false,
    },
  });

  console.log('Password reset successful!');
  console.log('  User ID:', updated.id);
  console.log('  Email:', updated.email);
  console.log('  isActive:', updated.isActive);
  console.log('  mustResetPassword:', updated.mustResetPassword);
  console.log('');
  console.log('You can now login with:');
  console.log('  Email:', email);
  console.log('  Password:', newPassword);
}

main().catch(console.error).finally(() => prisma.$disconnect());
