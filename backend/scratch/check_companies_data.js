const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '3307';
const user = process.env.DB_USER || 'hrm_user';
const password = process.env.DB_PASSWORD || 'C0digix$309';
const name = process.env.DB_NAME || 'hrm_db';

const url = `mysql://${user}:${password}@${host}:${port}/${name}`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function check() {
  const companies = await prisma.company.findMany();
  console.log('--- COMPANIES ---');
  console.table(companies.map(c => ({ id: c.id, code: c.code, name: c.name })));

  const employeesCount = await prisma.employee.groupBy({
    by: ['companyId'],
    _count: { id: true },
  });
  console.log('--- EMPLOYEES BY COMPANY ---');
  console.log(employeesCount);

  const departmentsCount = await prisma.department.groupBy({
    by: ['companyId'],
    _count: { id: true },
  });
  console.log('--- DEPARTMENTS BY COMPANY ---');
  console.log(departmentsCount);

  const branchesCount = await prisma.branch.groupBy({
    by: ['companyId'],
    _count: { id: true },
  });
  console.log('--- BRANCHES BY COMPANY ---');
  console.log(branchesCount);

  const costCentersCount = await prisma.costCenter.groupBy({
    by: ['companyId'],
    _count: { id: true },
  });
  console.log('--- COST CENTERS BY COMPANY ---');
  console.log(costCentersCount);

  const payGradesCount = await prisma.payGrade.groupBy({
    by: ['companyId'],
    _count: { id: true },
  });
  console.log('--- PAY GRADES BY COMPANY ---');
  console.log(payGradesCount);

  await prisma.$disconnect();
}

check();
