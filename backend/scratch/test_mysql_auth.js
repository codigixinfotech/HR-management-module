const { PrismaClient } = require('@prisma/client');

async function testCreds(user, pass, db) {
  const url = `mysql://${user}:${encodeURIComponent(pass)}@localhost:3306/${db}`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    console.log(`[SUCCESS] Credentials work: user=${user}, pass=${pass}, db=${db}`);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.log(`[FAIL] user=${user}, pass=${pass}, db=${db} -> ${err.message.split('\n')[0]}`);
    return false;
  }
}

async function run() {
  const users = ['root', 'hrm_user'];
  const passes = ['backend', 'root', 'C0digix$309', '', 'password', 'admin', '123456'];
  const dbs = ['hrm_db', 'ehcm', 'mysql'];

  for (const u of users) {
    for (const p of passes) {
      for (const d of dbs) {
        if (await testCreds(u, p, d)) {
          return;
        }
      }
    }
  }
  console.log('Finished testing all combinations.');
}

run();
