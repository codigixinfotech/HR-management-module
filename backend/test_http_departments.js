const bcrypt = require('./node_modules/bcrypt');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.update({
    where: { email: 'ppurvesh503@gmail.com' },
    data: { passwordHash: hash }
  });

  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ppurvesh503@gmail.com', password: 'Admin@123' })
  });
  const data = await loginRes.json();
  if (!data.accessToken) {
    console.log('Login failed:', data);
    return;
  }

  const token = data.accessToken;
  const companyId = 'cmtwjbe5900zoj7op4c3xxxb5';
  const branchId = 'cmty65x5g007ej79dy9yj87mu';

  console.log('1. GET departments without branchId:');
  const res1 = await fetch(`http://localhost:3001/api/organization/departments?companyId=${companyId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const depts1 = await res1.json();
  console.log('Returned without branchId:', depts1.map ? depts1.map(d => ({ id: d.id, name: d.name, branchId: d.branchId, branch: d.branch })) : depts1);

  console.log('2. GET departments WITH branchId=' + branchId + ':');
  const res2 = await fetch(`http://localhost:3001/api/organization/departments?companyId=${companyId}&branchId=${branchId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const depts2 = await res2.json();
  console.log('Returned WITH branchId:', depts2.map ? depts2.map(d => ({ id: d.id, name: d.name, branchId: d.branchId, branch: d.branch })) : depts2);
}

main().catch(console.error).finally(() => prisma.$disconnect());
