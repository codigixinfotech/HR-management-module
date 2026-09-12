const bcrypt = require('./node_modules/bcrypt');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.update({
    where: { email: 'branch1@gmail.com' },
    data: { passwordHash: hash }
  });
  console.log('Password set to Admin@123');

  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'branch1@gmail.com', password: 'Admin@123' })
  });
  const data = await loginRes.json();
  console.log('Login token present:', Boolean(data.accessToken));

  const meRes = await fetch('http://localhost:3001/api/auth/me', {
    headers: { Authorization: 'Bearer ' + data.accessToken }
  });
  const me = await meRes.json();
  console.log('Me:', {
    userId: me.userId,
    email: me.email,
    companyId: me.companyId,
    branchId: me.branchId,
    roles: me.roles,
    primaryRole: me.primaryRole,
    permissions: me.permissions
  });

  const compRes = await fetch('http://localhost:3001/api/organization/companies', {
    headers: { Authorization: 'Bearer ' + data.accessToken }
  });
  const comps = await compRes.json();
  console.log('GET /organization/companies returned:', comps.map(c => ({ id: c.id, code: c.code, name: c.name })));

  const branchRes = await fetch('http://localhost:3001/api/organization/branches', {
    headers: { Authorization: 'Bearer ' + data.accessToken }
  });
  const branches = await branchRes.json();
  console.log('GET /organization/branches returned:', branches.map(b => ({ id: b.id, code: b.code, name: b.name, companyId: b.companyId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
