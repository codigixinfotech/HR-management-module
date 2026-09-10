const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const empId = 'cmtr2qzm7006zip185kbklj96';
  const companyId = 'cmto136wt01ibipkgbon2sw9s';

  // Check if any records exist
  const existing = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM shift_change_requests');
  console.log('Existing shift change requests:', existing);

  // Clear or seed
  await prisma.$executeRawUnsafe('DELETE FROM shift_change_requests');

  // 1. Approved request
  await prisma.$executeRawUnsafe(`
    INSERT INTO shift_change_requests (
      id, companyId, employeeId, currentShift, requestedShift, changeType,
      effectiveDate, effectiveTo, reason, appliedDate, status, reviewerRemarks,
      approvedBy, approvedAt, history, createdAt, updatedAt
    ) VALUES (
      'sc-001', ?, ?, 'Morning Shift (MS)', 'Evening Shift (ES)', 'Temporary',
      '2026-09-15', '2026-09-30', 'Production line tooling upgrade coverage', '2026-09-10', 'Approved',
      'Approved for manufacturing line tooling upgrade handover', 'Plant Operations Head', '2026-09-10T14:30:00Z',
      ?, NOW(3), NOW(3)
    )
  `, companyId, empId, JSON.stringify([
    {
      date: '2026-09-10',
      stage: 'Submission',
      actor: 'Sudarshan Kale',
      action: 'Submitted Temporary Shift Change Request',
      notes: 'Requested temporary transition from MS to ES for tooling upgrade coverage'
    },
    {
      date: '2026-09-10',
      stage: 'Manager Approval',
      actor: 'Plant Operations Head',
      action: 'Approved & Scheduled Future Roster Update',
      notes: 'Approved for manufacturing line tooling upgrade handover'
    }
  ]));

  // 2. Pending Approval request (The newly submitted request by Sudarshan)
  await prisma.$executeRawUnsafe(`
    INSERT INTO shift_change_requests (
      id, companyId, employeeId, currentShift, requestedShift, changeType,
      effectiveDate, effectiveTo, reason, appliedDate, status, reviewerRemarks,
      history, createdAt, updatedAt
    ) VALUES (
      'sc-002', ?, ?, 'General Shift (GS)', 'Night Shift (NS)', 'Temporary',
      '2026-09-15', '2026-09-15', 'Production coverage', '2026-09-10', 'Pending Approval',
      NULL,
      ?, NOW(3), NOW(3)
    )
  `, companyId, empId, JSON.stringify([
    {
      date: '2026-09-10',
      stage: 'Submission',
      actor: 'Sudarshan Kale',
      action: 'Submitted Temporary Shift Change Request',
      notes: 'Production coverage'
    }
  ]));

  // 3. Cancelled request
  await prisma.$executeRawUnsafe(`
    INSERT INTO shift_change_requests (
      id, companyId, employeeId, currentShift, requestedShift, changeType,
      effectiveDate, effectiveTo, reason, appliedDate, status, reviewerRemarks,
      history, createdAt, updatedAt
    ) VALUES (
      'sc-003', ?, ?, 'Morning Shift (MS)', 'Night Shift (NS)', 'Permanent',
      '2026-10-01', NULL, 'Furnace temperature monitoring special assignment', '2026-09-10', 'Cancelled',
      'Cancelled by requester',
      ?, NOW(3), NOW(3)
    )
  `, companyId, empId, JSON.stringify([
    {
      date: '2026-09-10',
      stage: 'Submission',
      actor: 'Sudarshan Kale',
      action: 'Submitted Permanent Shift Change Request',
      notes: 'Furnace temperature monitoring special assignment'
    },
    {
      date: '2026-09-10',
      stage: 'Cancellation',
      actor: 'Sudarshan Kale',
      action: 'Cancelled Shift Change Request',
      notes: 'Cancelled before manager review'
    }
  ]));

  const rows = await prisma.$queryRawUnsafe('SELECT id, status, currentShift, requestedShift, reason FROM shift_change_requests');
  console.log('SEEDED ROWS:', rows);
}

main().catch(console.error).finally(() => prisma.$disconnect());
