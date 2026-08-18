import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Sanika@123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'motesanika@gmail.com' },
    update: { passwordHash: hash },
    create: {
      email: 'motesanika@gmail.com',
      passwordHash: hash,
    },
  });
  console.log('Sanika Mote account credentials set:');
  console.log('Email: motesanika@gmail.com');
  console.log('Password: Sanika@123');
}

main().finally(() => prisma.$disconnect());
