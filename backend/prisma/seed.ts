import { PrismaClient, CandidateStage } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { HCM_MODULES } from '../src/common/constants/modules';

const prisma = new PrismaClient();

const CRUD_ACTIONS = ['read', 'write'] as const;

async function main() {
  // 1. Permission catalog - one read/write permission per module.
  const permissionCodes = HCM_MODULES.flatMap((mod) =>
    CRUD_ACTIONS.map((action) => ({
      module: mod.key,
      action,
      code: `${mod.key.replace(/-/g, '_')}.${action}`,
      description: `${action === 'read' ? 'View' : 'Manage'} ${mod.label}`,
    })),
  );

  for (const permission of permissionCodes) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }
  console.log(`Seeded ${permissionCodes.length} permissions.`);

  // 2. Demo company.
  const existingCompaniesCount = await prisma.company.count();
  if (existingCompaniesCount > 0) {
    console.log('Database already has company records. Skipping demo company seeding.');
    return;
  }

  const company = await prisma.company.create({
    data: {
      code: 'DEMO',
      name: 'Demo Manufacturing Pvt Ltd',
      legalName: 'Demo Manufacturing Private Limited',
      country: 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log(`Seeded company: ${company.name}`);

  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      code: 'HO',
      name: 'Head Office',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    },
  });

  const department = await prisma.department.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      code: 'HR',
      name: 'Human Resources',
    },
  });

  const designation = await prisma.designation.create({
    data: {
      companyId: company.id,
      departmentId: department.id,
      code: 'HR-MGR',
      title: 'HR Manager',
    },
  });

  // 3. SUPER_ADMIN system role with full access, plus an HR_ADMIN example role.
  // Note: MySQL treats NULL as distinct in composite unique indexes, so a
  // companyId=null role can't be safely upserted via the compound key - use
  // findFirst + create instead.
  let superAdminRole = await prisma.role.findFirst({
    where: { companyId: null, name: 'SUPER_ADMIN' },
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Full system access', isSystem: true },
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const hrAdminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'HR_ADMIN' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'HR_ADMIN',
      description: 'HR administrator for this company',
      permissions: {
        create: allPermissions
          .filter((p) => ['organization', 'employees', 'recruitment', 'dashboard', 'administration'].includes(p.module))
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });
  console.log(`Seeded roles: ${superAdminRole.name}, ${hrAdminRole.name}`);

  // 4. Admin user.
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ehcm.local' },
    update: {},
    create: {
      email: 'admin@ehcm.local',
      passwordHash: adminPasswordHash,
      companyId: null,
      roles: { create: [{ roleId: superAdminRole.id }] },
    },
  });
  console.log(`Seeded admin user: ${adminUser.email} (password: Admin@12345)`);

  // 5. Sample employee linked to the admin user.
  const adminEmployee = await prisma.employee.upsert({
    where: { companyId_employeeCode: { companyId: company.id, employeeCode: 'EMP0001' } },
    update: {},
    create: {
      companyId: company.id,
      branchId: branch.id,
      departmentId: department.id,
      designationId: designation.id,
      userId: adminUser.id,
      employeeCode: 'EMP0001',
      firstName: 'Admin',
      lastName: 'User',
      workEmail: adminUser.email,
      dateOfJoining: new Date(),
      status: 'ACTIVE',
    },
  });

  // 6. Shift types, leave types and holidays for the demo company.
  await prisma.shiftType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'GEN' } },
    update: {},
    create: { companyId: company.id, code: 'GEN', name: 'General Shift', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  });
  await prisma.shiftType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MOR' } },
    update: {},
    create: { companyId: company.id, code: 'MOR', name: 'Morning Shift', startTime: '06:00', endTime: '14:00', breakMinutes: 30 },
  });
  await prisma.shiftType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'NIT' } },
    update: {},
    create: { companyId: company.id, code: 'NIT', name: 'Night Shift', startTime: '22:00', endTime: '06:00', breakMinutes: 30, isNightShift: true },
  });

  await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'CL' } },
    update: {},
    create: { companyId: company.id, code: 'CL', name: 'Casual Leave', annualQuota: 12 },
  });
  await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'SL' } },
    update: {},
    create: { companyId: company.id, code: 'SL', name: 'Sick Leave', annualQuota: 12 },
  });
  await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'EL' } },
    update: {},
    create: { companyId: company.id, code: 'EL', name: 'Earned Leave', annualQuota: 15, carryForward: true },
  });
  await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: 'LOP' } },
    update: {},
    create: { companyId: company.id, code: 'LOP', name: 'Loss of Pay', annualQuota: 0, isPaid: false },
  });

  const currentYear = new Date().getFullYear();
  const holidays = [
    { name: 'Republic Day', date: `${currentYear}-01-26` },
    { name: 'Independence Day', date: `${currentYear}-08-15` },
    { name: 'Gandhi Jayanti', date: `${currentYear}-10-02` },
  ];
  for (const holiday of holidays) {
    const existingHoliday = await prisma.holiday.findFirst({
      where: { companyId: company.id, date: new Date(holiday.date) },
    });
    if (!existingHoliday) {
      await prisma.holiday.create({
        data: { companyId: company.id, name: holiday.name, date: new Date(holiday.date) },
      });
    }
  }
  console.log('Seeded shift types, leave types and holidays.');

  // 7. Salary components and a starter salary structure for the admin employee.
  const salaryComponentDefs = [
    { code: 'BASIC', name: 'Basic', type: 'EARNING' as const, isStatutory: true },
    { code: 'HRA', name: 'House Rent Allowance', type: 'EARNING' as const },
    { code: 'CONVEYANCE', name: 'Conveyance Allowance', type: 'EARNING' as const },
    { code: 'SPECIAL_ALLOWANCE', name: 'Special Allowance', type: 'EARNING' as const },
    { code: 'PF_EMPLOYEE', name: 'Provident Fund (Employee)', type: 'DEDUCTION' as const, isStatutory: true },
  ];
  const salaryComponents: Record<string, { id: string }> = {};
  for (const def of salaryComponentDefs) {
    salaryComponents[def.code] = await prisma.salaryComponent.upsert({
      where: { companyId_code: { companyId: company.id, code: def.code } },
      update: {},
      create: { companyId: company.id, ...def },
    });
  }

  const starterStructure = [
    { code: 'BASIC', amount: 30000 },
    { code: 'HRA', amount: 15000 },
    { code: 'CONVEYANCE', amount: 3000 },
  ];
  for (const entry of starterStructure) {
    await prisma.employeeSalaryComponent.upsert({
      where: {
        employeeId_salaryComponentId: {
          employeeId: adminEmployee.id,
          salaryComponentId: salaryComponents[entry.code].id,
        },
      },
      update: {},
      create: {
        employeeId: adminEmployee.id,
        salaryComponentId: salaryComponents[entry.code].id,
        monthlyAmount: entry.amount,
        effectiveFrom: adminEmployee.dateOfJoining ?? new Date(),
      },
    });
  }
  console.log('Seeded salary components and starter salary structure.');

  // 8. Compliance calendar types.
  const complianceTypeDefs = [
    { code: 'PF_RETURN', name: 'PF Monthly Return', category: 'STATUTORY_RETURN', frequency: 'MONTHLY' as const },
    { code: 'ESIC_RETURN', name: 'ESIC Monthly Return', category: 'STATUTORY_RETURN', frequency: 'MONTHLY' as const },
    { code: 'PT_RETURN', name: 'Professional Tax Return', category: 'STATUTORY_RETURN', frequency: 'MONTHLY' as const },
    { code: 'TDS_RETURN', name: 'TDS Quarterly Return', category: 'STATUTORY_RETURN', frequency: 'QUARTERLY' as const },
    { code: 'POSH_AUDIT', name: 'POSH Committee Audit', category: 'AUDIT', frequency: 'ANNUALLY' as const },
  ];
  for (const def of complianceTypeDefs) {
    await prisma.complianceType.upsert({
      where: { companyId_code: { companyId: company.id, code: def.code } },
      update: {},
      create: { companyId: company.id, ...def },
    });
  }
  console.log('Seeded compliance types.');

  // 9. Sample assets, one allocated to the admin employee.
  const laptop = await prisma.asset.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: 'AST-0001' } },
    update: {},
    create: {
      companyId: company.id,
      assetTag: 'AST-0001',
      name: 'Dell Latitude 5440',
      category: 'Laptop',
      value: 85000,
      status: 'ALLOCATED',
      currentEmployeeId: adminEmployee.id,
    },
  });
  await prisma.assetAllocation.findFirst({ where: { assetId: laptop.id, employeeId: adminEmployee.id } }).then(async (existing) => {
    if (!existing) {
      await prisma.assetAllocation.create({ data: { assetId: laptop.id, employeeId: adminEmployee.id } });
    }
  });
  await prisma.asset.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: 'AST-0002' } },
    update: {},
    create: {
      companyId: company.id,
      assetTag: 'AST-0002',
      name: 'iPhone 14',
      category: 'Mobile Device',
      value: 65000,
      status: 'IN_STOCK',
    },
  });
  console.log('Seeded assets.');

  // 10. PPE items and a sample safety audit.
  const ppeDefs = [
    { name: 'Safety Helmet', category: 'Head Protection', stockQuantity: 50 },
    { name: 'Safety Gloves', category: 'Hand Protection', stockQuantity: 100 },
    { name: 'Safety Shoes', category: 'Foot Protection', stockQuantity: 40 },
  ];
  for (const def of ppeDefs) {
    const existing = await prisma.ppeItem.findFirst({ where: { companyId: company.id, name: def.name } });
    if (!existing) {
      await prisma.ppeItem.create({ data: { companyId: company.id, ...def } });
    }
  }

  const existingAudit = await prisma.safetyAudit.findFirst({ where: { companyId: company.id } });
  if (!existingAudit) {
    await prisma.safetyAudit.create({
      data: {
        companyId: company.id,
        location: branch.name,
        auditDate: new Date(),
        score: 92,
        auditor: 'Internal Safety Committee',
        findings: 'Fire extinguisher tags up to date; one emergency exit sign needs relamping.',
      },
    });
  }
  console.log('Seeded PPE items and a safety audit.');

  // 11. Additional departments, designations and a realistic employee roster so
  // the executive dashboard (headcount distribution, attendance, milestones) has
  // real data to aggregate instead of a single admin record.
  const addDays = (base: Date, days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };
  const today = new Date();

  const additionalDepartmentDefs = [
    { code: 'ENG', name: 'Engineering & Technology' },
    { code: 'OPS', name: 'Operations & Logistics' },
    { code: 'SALES', name: 'Sales & Marketing' },
    { code: 'FIN', name: 'Finance & Accounting' },
    { code: 'PROD', name: 'Product & Design' },
  ];
  const departmentsByCode: Record<string, { id: string }> = { HR: department };
  for (const def of additionalDepartmentDefs) {
    departmentsByCode[def.code] = await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: def.code } },
      update: {},
      create: { companyId: company.id, branchId: branch.id, code: def.code, name: def.name },
    });
  }

  const designationDefs = [
    { code: 'ENG-SDE', title: 'Software Engineer', deptCode: 'ENG' },
    { code: 'OPS-EXEC', title: 'Operations Executive', deptCode: 'OPS' },
    { code: 'SALES-EXEC', title: 'Sales Executive', deptCode: 'SALES' },
    { code: 'FIN-EXEC', title: 'Finance Executive', deptCode: 'FIN' },
    { code: 'PROD-DES', title: 'Product Designer', deptCode: 'PROD' },
  ];
  const designationsByCode: Record<string, { id: string }> = { 'HR-MGR': designation };
  for (const def of designationDefs) {
    designationsByCode[def.code] = await prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: def.code } },
      update: {},
      create: {
        companyId: company.id,
        departmentId: departmentsByCode[def.deptCode].id,
        code: def.code,
        title: def.title,
      },
    });
  }

  const firstNames = ['Sarah', 'David', 'Elena', 'Marcus', 'Priya', 'Rahul', 'Emma', 'James', 'Olivia', 'Liam', 'Sophia', 'Noah', 'Ava', 'Ethan', 'Mia', 'Lucas', 'Isabella', 'Mason', 'Aditi', 'Vikram', 'Neha', 'Arjun', 'Kavya'];
  const lastNames = ['Jenkins', 'Miller', 'Rostova', 'Vance', 'Sharma', 'Verma', 'Watson', 'Cole', 'Bennett', 'Turner', 'Harris', 'Reed', 'Patel', 'Kapoor', 'Nair', 'Singh', 'Gupta', 'Iyer', 'Chopra', 'Malhotra', 'Bose', 'Rao', 'Menon'];

  const roster: { deptCode: string; desigCode: string; count: number }[] = [
    { deptCode: 'ENG', desigCode: 'ENG-SDE', count: 8 },
    { deptCode: 'OPS', desigCode: 'OPS-EXEC', count: 6 },
    { deptCode: 'SALES', desigCode: 'SALES-EXEC', count: 4 },
    { deptCode: 'HR', desigCode: 'HR-MGR', count: 2 },
    { deptCode: 'FIN', desigCode: 'FIN-EXEC', count: 2 },
    { deptCode: 'PROD', desigCode: 'PROD-DES', count: 1 },
  ];

  let empIndex = 2; // EMP0001 is the admin employee seeded above.
  const seededEmployees: { id: string; status: string }[] = [{ id: adminEmployee.id, status: 'ACTIVE' }];
  const onLeaveEmployeeIds: string[] = [];

  for (const group of roster) {
    for (let i = 0; i < group.count; i++) {
      const code = `EMP${String(empIndex).padStart(4, '0')}`;
      const firstName = firstNames[(empIndex * 7) % firstNames.length];
      const lastName = lastNames[(empIndex * 13) % lastNames.length];
      const status = empIndex % 11 === 0 ? 'ON_LEAVE' : 'ACTIVE';

      // Spread birthdays/joining-day-of-year across the calendar; a few land within
      // the next 14 days so the "Milestones & Events" widget has real entries.
      const dobOffset = empIndex % 5 === 0 ? 3 + empIndex : -(30 + empIndex * 11);
      const dateOfBirth = addDays(today, dobOffset);
      dateOfBirth.setFullYear(1985 + (empIndex % 15));

      const joiningYearsAgo = 1 + (empIndex % 6);
      const dojOffset = empIndex % 7 === 0 ? 2 + empIndex : -(20 + empIndex * 9);
      const dateOfJoining = addDays(today, dojOffset);
      dateOfJoining.setFullYear(today.getFullYear() - joiningYearsAgo);

      const employee = await prisma.employee.upsert({
        where: { companyId_employeeCode: { companyId: company.id, employeeCode: code } },
        update: {},
        create: {
          companyId: company.id,
          branchId: branch.id,
          departmentId: departmentsByCode[group.deptCode].id,
          designationId: designationsByCode[group.desigCode].id,
          employeeCode: code,
          firstName,
          lastName,
          gender: empIndex % 2 === 0 ? 'FEMALE' : 'MALE',
          dateOfBirth,
          workEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${empIndex}@demo-manufacturing.com`,
          dateOfJoining,
          employmentType: 'PERMANENT',
          status,
        },
      });
      seededEmployees.push({ id: employee.id, status });
      if (status === 'ON_LEAVE') onLeaveEmployeeIds.push(employee.id);
      empIndex++;
    }
  }
  console.log(`Seeded ${seededEmployees.length - 1} additional employees across ${additionalDepartmentDefs.length} departments.`);

  // 12. Attendance records for today, so "Attendance Rate Today" reflects real check-ins.
  const attendanceDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  for (let idx = 0; idx < seededEmployees.length; idx++) {
    const emp = seededEmployees[idx];
    const status = emp.status === 'ON_LEAVE' ? 'ON_LEAVE' : idx % 13 === 0 ? 'ABSENT' : 'PRESENT';
    const checkIn = status === 'PRESENT' ? new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 3, 30 + (idx % 30))) : null;
    await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: attendanceDate } },
      update: {},
      create: {
        companyId: company.id,
        employeeId: emp.id,
        date: attendanceDate,
        status,
        checkIn,
        source: 'BIOMETRIC',
      },
    });
  }
  console.log('Seeded attendance records for today.');

  // 13. Leave requests for employees currently marked ON_LEAVE.
  const casualLeaveType = await prisma.leaveType.findFirst({ where: { companyId: company.id, code: 'CL' } });
  if (casualLeaveType) {
    for (const empId of onLeaveEmployeeIds) {
      const existing = await prisma.leaveRequest.findFirst({ where: { employeeId: empId, leaveTypeId: casualLeaveType.id } });
      if (!existing) {
        await prisma.leaveRequest.create({
          data: {
            companyId: company.id,
            employeeId: empId,
            leaveTypeId: casualLeaveType.id,
            startDate: today,
            endDate: addDays(today, 2),
            totalDays: 3,
            reason: 'Personal leave',
            status: 'APPROVED',
            approverId: adminEmployee.id,
            decidedAt: new Date(),
          },
        });
      }
    }
    console.log(`Seeded leave requests for ${onLeaveEmployeeIds.length} employee(s) on leave.`);
  }

  // 14. Onboarding tasks for the most recently seeded hires, so the "pending
  // onboarding" KPI and upcoming-events widget have live entries.
  const onboardingTargets = seededEmployees.slice(1, 4);
  const onboardingTaskDefs = ['Complete HR Documentation', 'IT Equipment Setup', 'Team Introduction Session'];
  for (const target of onboardingTargets) {
    for (const [i, title] of onboardingTaskDefs.entries()) {
      const existing = await prisma.employeeOnboardingTask.findFirst({ where: { employeeId: target.id, title } });
      if (!existing) {
        await prisma.employeeOnboardingTask.create({
          data: { employeeId: target.id, title, ownerType: 'HR', status: 'PENDING', dueDate: addDays(today, 2 + i * 3) },
        });
      }
    }
  }
  console.log('Seeded onboarding tasks for recent hires.');

  // 15. Job openings with candidates spread across the recruitment pipeline.
  const candidateFirstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Drew', 'Cameron', 'Skyler', 'Harper', 'Quinn', 'Reese', 'Rowan', 'Emerson'];
  const candidateLastNames = ['Blake', 'Ellis', 'Foster', 'Grant', 'Hayes', 'Irwin', 'Knight', 'Lambert', 'Norris', 'Ortiz', 'Pierce', 'Reyes', 'Stone', 'Walsh', 'Young'];

  const jobOpeningDefs: {
    title: string;
    deptCode: string;
    desigCode: string;
    numPositions: number;
    candidates: Partial<Record<CandidateStage, number>>;
  }[] = [
    { title: 'Senior Fullstack Engineer', deptCode: 'ENG', desigCode: 'ENG-SDE', numPositions: 3, candidates: { APPLIED: 6, SCREENING: 3, INTERVIEW: 2, OFFERED: 1, HIRED: 1 } },
    { title: 'Operations Manager', deptCode: 'OPS', desigCode: 'OPS-EXEC', numPositions: 1, candidates: { APPLIED: 4, SCREENING: 2, INTERVIEW: 1, OFFERED: 1 } },
    { title: 'Sales Development Representative', deptCode: 'SALES', desigCode: 'SALES-EXEC', numPositions: 2, candidates: { APPLIED: 5, SCREENING: 2, INTERVIEW: 1 } },
    { title: 'Product Designer', deptCode: 'PROD', desigCode: 'PROD-DES', numPositions: 1, candidates: { APPLIED: 3, SCREENING: 1, INTERVIEW: 1 } },
  ];

  let candidateGlobalIndex = 0;
  for (const jd of jobOpeningDefs) {
    let jobOpening = await prisma.jobOpening.findFirst({ where: { companyId: company.id, title: jd.title } });
    if (!jobOpening) {
      jobOpening = await prisma.jobOpening.create({
        data: {
          companyId: company.id,
          departmentId: departmentsByCode[jd.deptCode].id,
          designationId: designationsByCode[jd.desigCode].id,
          title: jd.title,
          numPositions: jd.numPositions,
          isActive: true,
        },
      });
    }

    for (const [stage, count] of Object.entries(jd.candidates) as [CandidateStage, number][]) {
      for (let i = 0; i < count; i++) {
        candidateGlobalIndex++;
        const firstName = candidateFirstNames[candidateGlobalIndex % candidateFirstNames.length];
        const lastName = candidateLastNames[(candidateGlobalIndex * 3) % candidateLastNames.length];
        const email = `candidate${candidateGlobalIndex}@example-mail.com`;
        const existing = await prisma.candidate.findFirst({ where: { jobOpeningId: jobOpening.id, email } });
        if (!existing) {
          await prisma.candidate.create({
            data: {
              jobOpeningId: jobOpening.id,
              firstName,
              lastName,
              email,
              stage,
              aiMatchScore: 60 + (candidateGlobalIndex % 35),
            },
          });
        }
      }
    }
  }
  console.log(`Seeded ${jobOpeningDefs.length} job openings with candidates across the pipeline.`);

  // 16. Compliance tasks for the current period - most filed, a few pending.
  const complianceTypes = await prisma.complianceType.findMany({ where: { companyId: company.id } });
  const periodLabel = `${today.toLocaleString('en-US', { month: 'long' })} ${today.getFullYear()}`;
  const complianceDueDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 20));
  for (const [i, type] of complianceTypes.entries()) {
    const existing = await prisma.complianceTask.findFirst({ where: { companyId: company.id, complianceTypeId: type.id, periodLabel } });
    if (!existing) {
      const filed = i % 3 !== 0;
      await prisma.complianceTask.create({
        data: {
          companyId: company.id,
          complianceTypeId: type.id,
          periodLabel,
          dueDate: complianceDueDate,
          status: filed ? 'FILED' : 'PENDING',
          filedDate: filed ? new Date() : null,
          filedById: filed ? adminEmployee.id : null,
        },
      });
    }
  }
  console.log('Seeded compliance tasks for the current period.');

  // 17. Payroll run for the current month.
  await prisma.payrollRun.upsert({
    where: { companyId_month_year: { companyId: company.id, month: today.getMonth() + 1, year: today.getFullYear() } },
    update: {},
    create: { companyId: company.id, month: today.getMonth() + 1, year: today.getFullYear(), status: 'PROCESSED', processedAt: new Date() },
  });
  console.log('Seeded current month payroll run.');

  // 18. Allocate the spare asset to a new hire for the recent-activity feed.
  const spareAsset = await prisma.asset.findFirst({ where: { companyId: company.id, assetTag: 'AST-0002' } });
  if (spareAsset && seededEmployees.length > 2) {
    const target = seededEmployees[2];
    const existingAllocation = await prisma.assetAllocation.findFirst({ where: { assetId: spareAsset.id, employeeId: target.id } });
    if (!existingAllocation) {
      await prisma.assetAllocation.create({ data: { assetId: spareAsset.id, employeeId: target.id } });
      await prisma.asset.update({ where: { id: spareAsset.id }, data: { status: 'ALLOCATED', currentEmployeeId: target.id } });
    }
  }
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
