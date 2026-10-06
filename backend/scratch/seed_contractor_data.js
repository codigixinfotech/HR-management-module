const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('--- Seeding Realistic Contractor Management Data ---');

  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log(`Found ${companies.length} companies:`, companies.map(c => c.name));

  // Get first plant branch, machine, production line, shift
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, companyId: true } });
  const plantBranch = branches.find(b => b.name.toLowerCase().includes('pune') || b.name.toLowerCase().includes('plant') || b.name.toLowerCase().includes('b')) || branches[0];
  const branchId = plantBranch ? plantBranch.id : null;

  const lines = await prisma.$queryRawUnsafe(`SELECT id, lineCode, lineName FROM production_lines LIMIT 5`);
  const machines = await prisma.$queryRawUnsafe(`SELECT id, machineCode, machineName FROM machines WHERE status = 'ACTIVE' LIMIT 5`);
  const shifts = await prisma.shiftType.findMany({ select: { id: true, name: true } });
  const shiftId = shifts.length > 0 ? shifts[0].id : null;

  for (const comp of companies) {
    const companyId = comp.id;
    console.log(`\nSeeding for company: ${comp.name} (${companyId})`);

    // Clean existing contractor data for idempotency
    await prisma.$executeRawUnsafe(`DELETE FROM contractor_vendor_history WHERE vendor_id IN (SELECT id FROM contractor_vendors WHERE company_id = ?)`, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM contractor_documents WHERE vendor_id IN (SELECT id FROM contractor_vendors WHERE company_id = ?)`, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM contractor_compliance WHERE company_id = ?`, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM worker_deployments WHERE company_id = ?`, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM contractor_workers WHERE company_id = ?`, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM contractor_contracts WHERE company_id = ?`, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM contractor_vendors WHERE company_id = ?`, companyId);

    // 1. Vendors
    const v1Id = `vnd-001-${companyId.slice(-4)}`;
    const v2Id = `vnd-002-${companyId.slice(-4)}`;
    const v3Id = `vnd-003-${companyId.slice(-4)}`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO contractor_vendors (
        id, company_id, branch_id, vendor_code, legal_name, display_name,
        vendor_type, registration_number, gstin, pan, registered_address,
        city, state, pincode, primary_contact_name, primary_contact_phone,
        primary_contact_email, emergency_contact_name, emergency_contact_phone,
        status, remarks, created_at, updated_at
      ) VALUES 
      (?, ?, ?, 'VND-001', 'Maharashtra Industrial Manpower Services Pvt Ltd', 'MIMS Staffing', 'MANPOWER_AGENCY', 'REG/MH/2018/00912', '27AABCM8901D1Z4', 'AABCM8901D', 'Plot 45, MIDC Industrial Area, Bhosari', 'Pune', 'Maharashtra', '411026', 'Ramesh Kulkarni', '+91 98234 11223', 'ramesh@mimsmanpower.com', 'Vinod Deshmukh', '+91 98234 99887', 'ACTIVE', 'Primary supplier of CNC machinists and line fitters', NOW(), NOW()),
      (?, ?, ?, 'VND-002', 'Prime Facility Workforce Solutions LLP', 'Prime Workforce', 'FACILITY_MANAGEMENT', 'LLP/MH/2020/00451', '27BBBPF4321E1Z8', 'BBBPF4321E', '12 Sector 10, PCMC Commercial Complex, Chinchwad', 'Pune', 'Maharashtra', '411019', 'Sanjay More', '+91 97654 44321', 'sanjay.more@primeworkforce.in', 'Anand Kadam', '+91 97654 00998', 'ACTIVE', 'Cleanroom housekeeping, waste segregation & facility staff', NOW(), NOW()),
      (?, ?, ?, 'VND-003', 'Secure Workforce Solutions India Pvt Ltd', 'SecureForce', 'SECURITY_AGENCY', 'REG/DL/2016/00128', '27AAACS1234F1Z2', 'AAACS1234F', 'B-14 Trade Centre, Viman Nagar', 'Pune', 'Maharashtra', '411014', 'Col. Jaswant Rathore', '+91 94220 88712', 'operations@secureforce.in', 'Subedar S. Shinde', '+91 94220 11223', 'ACTIVE', 'Plant perimeter security, visitor management & access control', NOW(), NOW())
    `, v1Id, companyId, branchId, v2Id, companyId, branchId, v3Id, companyId, branchId);
    console.log('✓ Inserted 3 Vendors');

    // 2. Contracts
    const c1Id = `cnt-001-${companyId.slice(-4)}`;
    const c2Id = `cnt-002-${companyId.slice(-4)}`;
    const c3Id = `cnt-003-${companyId.slice(-4)}`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO contractor_contracts (
        id, vendor_id, company_id, branch_id, contract_number,
        contract_start_date, contract_end_date, contract_type,
        scope_of_work, maximum_headcount, billing_type,
        billing_rate, payment_terms, status, renewal_required,
        remarks, created_at, updated_at
      ) VALUES
      (?, ?, ?, ?, 'CNT-2026-001', '2026-04-01', '2027-03-31', 'MANPOWER_SUPPLY', 'Supply of certified CNC operators, multi-axis machinists & line assembly fitters', 50, 'MONTHLY', 28500.00, 'Net 30 Days', 'ACTIVE', FALSE, 'Annual industrial staffing contract', NOW(), NOW()),
      (?, ?, ?, ?, 'CNT-2026-002', '2026-01-01', '2026-12-31', 'FACILITY', 'Cleanroom sanitation, shopfloor housekeeping and waste disposal management', 25, 'MONTHLY', 18500.00, 'Net 15 Days', 'ACTIVE', TRUE, 'Facility management agreement - expiring end of year', NOW(), NOW()),
      (?, ?, ?, ?, 'CNT-2026-003', '2026-01-01', '2026-11-15', 'SECURITY', '24x7 Armed & unarmed physical plant security, CCTV surveillance & gate entry control', 20, 'MONTHLY', 22000.00, 'Net 30 Days', 'ACTIVE', TRUE, 'Security service contract - renewal due in Nov', NOW(), NOW())
    `, c1Id, v1Id, companyId, branchId, c2Id, v2Id, companyId, branchId, c3Id, v3Id, companyId, branchId);
    console.log('✓ Inserted 3 Contracts');

    // 3. Workers
    const cw1Id = `cw-001-${companyId.slice(-4)}`;
    const cw2Id = `cw-002-${companyId.slice(-4)}`;
    const cw3Id = `cw-003-${companyId.slice(-4)}`;
    const cw4Id = `cw-004-${companyId.slice(-4)}`;
    const cw5Id = `cw-005-${companyId.slice(-4)}`;
    const cw6Id = `cw-006-${companyId.slice(-4)}`;
    const cw7Id = `cw-007-${companyId.slice(-4)}`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO contractor_workers (
        id, vendor_id, contract_id, company_id, branch_id,
        worker_code, first_name, middle_name, last_name,
        gender, date_of_birth, mobile, email,
        government_id_type, government_id_number,
        joining_date, designation, skill, skill_level, status,
        emergency_contact_name, emergency_contact_phone,
        created_at, updated_at
      ) VALUES
      (?, ?, ?, ?, ?, 'CW-001', 'Amit', 'Ramchandra', 'Kumar', 'MALE', '1992-05-14', '+91 98201 11221', 'amit.kumar@staffing.com', 'AADHAAR', '9876-1234-5678', '2026-04-05', 'CNC Machine Operator', 'CNC Multi-Axis Milling', 'Skilled', 'ACTIVE', 'Ramchandra Kumar', '+91 98201 99001', NOW(), NOW()),
      (?, ?, ?, ?, ?, 'CW-002', 'Rahul', 'Dattatray', 'Patil', 'MALE', '1994-08-22', '+91 98202 22332', 'rahul.patil@staffing.com', 'AADHAAR', '8765-2345-6789', '2026-04-08', 'Assembly Fitter', 'Line Assembly & Torquing', 'Skilled', 'ACTIVE', 'Dattatray Patil', '+91 98202 99002', NOW(), NOW()),
      (?, ?, ?, ?, ?, 'CW-003', 'Suresh', 'Babu', 'Jadhav', 'MALE', '1989-11-03', '+91 98203 33443', 'suresh.jadhav@staffing.com', 'AADHAAR', '7654-3456-7890', '2026-04-12', 'Industrial Electrician', 'Panel Wiring & Electrical Troubleshooting', 'Expert', 'ACTIVE', 'Babu Jadhav', '+91 98203 99003', NOW(), NOW()),
      (?, ?, ?, ?, ?, 'CW-004', 'Mahesh', 'Pandurang', 'Shinde', 'MALE', '1996-03-18', '+91 98204 44554', 'mahesh.shinde@staffing.com', 'AADHAAR', '6543-4567-8901', '2026-01-15', 'Sanitation Lead', 'Cleanroom Sanitation & Waste Handling', 'Semi-Skilled', 'ACTIVE', 'Pandurang Shinde', '+91 98204 99004', NOW(), NOW()),
      (?, ?, ?, ?, ?, 'CW-005', 'Priya', 'Santosh', 'More', 'FEMALE', '1995-07-29', '+91 98205 55665', 'priya.more@staffing.com', 'AADHAAR', '5432-5678-9012', '2026-04-20', 'Quality Inspector', 'Component Visual & Gauge Inspection', 'Skilled', 'ACTIVE', 'Santosh More', '+91 98205 99005', NOW(), NOW()),
      (?, ?, ?, ?, ?, 'CW-006', 'Santosh', 'Eknath', 'Gaikwad', 'MALE', '1990-12-11', '+91 98206 66776', 'santosh.gaikwad@staffing.com', 'AADHAAR', '4321-6789-0123', '2026-01-10', 'Security Guard', 'Perimeter Patrolling & Access Verification', 'Semi-Skilled', 'ACTIVE', 'Eknath Gaikwad', '+91 98206 99006', NOW(), NOW()),
      (?, ?, ?, ?, ?, 'CW-007', 'Ganesh', 'Tukaram', 'Sawant', 'MALE', '1993-09-05', '+91 98207 77887', 'ganesh.sawant@staffing.com', 'AADHAAR', '3210-7890-1234', '2026-04-25', 'Forklift Driver', 'Material Handling & Stacker Operation', 'Skilled', 'ACTIVE', 'Tukaram Sawant', '+91 98207 99007', NOW(), NOW())
    `, 
    cw1Id, v1Id, c1Id, companyId, branchId,
    cw2Id, v1Id, c1Id, companyId, branchId,
    cw3Id, v1Id, c1Id, companyId, branchId,
    cw4Id, v2Id, c2Id, companyId, branchId,
    cw5Id, v1Id, c1Id, companyId, branchId,
    cw6Id, v3Id, c3Id, companyId, branchId,
    cw7Id, v1Id, c1Id, companyId, branchId
    );
    console.log('✓ Inserted 7 Contractor Workers');

    // 4. Deployments (integrate with machines and lines if available)
    const machine1Id = machines.length > 0 ? machines[0].id : null;
    const machine2Id = machines.length > 1 ? machines[1].id : null;
    const line1Id = lines.length > 0 ? lines[0].id : null;
    const line2Id = lines.length > 1 ? lines[1].id : null;
    const cSuffix = companyId.slice(-4);

    await prisma.$executeRawUnsafe(`
      INSERT INTO worker_deployments (
        id, worker_id, vendor_id, contract_id, company_id, branch_id,
        production_line_id, machine_id, shift_id, designation,
        deployment_type, start_date, status, remarks, created_at, updated_at
      ) VALUES
      (CONCAT('wd-001-', ?), ?, ?, ?, ?, ?, ?, ?, ?, 'CNC Machine Operator', 'MACHINE_OPERATOR', '2026-04-06', 'ACTIVE', 'Shop Floor Line 1 CNC deployment', NOW(), NOW()),
      (CONCAT('wd-002-', ?), ?, ?, ?, ?, ?, ?, ?, ?, 'Assembly Fitter', 'LINE_ASSEMBLY', '2026-04-09', 'ACTIVE', 'Sub-assembly cell line deployment', NOW(), NOW()),
      (CONCAT('wd-003-', ?), ?, ?, ?, ?, ?, ?, ?, ?, 'Industrial Electrician', 'PLANT_FLOOR', '2026-04-13', 'ACTIVE', 'Plant electrical maintenance deployment', NOW(), NOW()),
      (CONCAT('wd-004-', ?), ?, ?, ?, ?, ?, NULL, NULL, ?, 'Sanitation Lead', 'FACILITY', '2026-01-16', 'ACTIVE', 'Cleanroom daily maintenance & waste disposal', NOW(), NOW()),
      (CONCAT('wd-005-', ?), ?, ?, ?, ?, ?, ?, ?, ?, 'Quality Inspector', 'LINE_ASSEMBLY', '2026-04-21', 'ACTIVE', 'End of line final QC check station', NOW(), NOW()),
      (CONCAT('wd-006-', ?), ?, ?, ?, ?, ?, NULL, NULL, ?, 'Security Guard', 'SECURITY', '2026-01-11', 'ACTIVE', 'Main gate entry log & perimeter patrolling', NOW(), NOW())
    `,
    cSuffix, cw1Id, v1Id, c1Id, companyId, branchId, line1Id, machine1Id, shiftId,
    cSuffix, cw2Id, v1Id, c1Id, companyId, branchId, line1Id, null, shiftId,
    cSuffix, cw3Id, v1Id, c1Id, companyId, branchId, line2Id, machine2Id, shiftId,
    cSuffix, cw4Id, v2Id, c2Id, companyId, branchId, shiftId,
    cSuffix, cw5Id, v1Id, c1Id, companyId, branchId, line2Id, null, shiftId,
    cSuffix, cw6Id, v3Id, c3Id, companyId, branchId, shiftId
    );
    console.log('✓ Inserted 6 Active Deployments');

    // 5. Statutory Compliance (CLRA, PF, ESIC)
    await prisma.$executeRawUnsafe(`
      INSERT INTO contractor_compliance (
        id, vendor_id, contract_id, company_id, branch_id,
        compliance_type, license_number, issue_date, expiry_date,
        issuing_authority, status, verified_by, verified_at,
        remarks, created_at, updated_at
      ) VALUES
      (CONCAT('cmp-001-', ?), ?, ?, ?, ?, 'CLRA', 'CLRA-MH-2024-889', '2024-04-01', '2027-03-31', 'Office of the Labour Commissioner, Pune Division', 'VALID', 'HR Compliance Auditor', NOW(), 'Principal Employer registration Form V submitted', NOW(), NOW()),
      (CONCAT('cmp-002-', ?), ?, ?, ?, ?, 'PF', 'PF-MH-PUN-0091823', '2024-01-01', '2027-01-01', 'Employees Provident Fund Organisation, Pune', 'VALID', 'HR Compliance Auditor', NOW(), 'Monthly ECR returns verified for Q1 2026', NOW(), NOW()),
      (CONCAT('cmp-003-', ?), ?, ?, ?, ?, 'ESIC', 'ESIC-31000987654321', '2024-01-01', '2027-01-01', 'Employees State Insurance Corporation, Maharashtra', 'VALID', 'HR Compliance Auditor', NOW(), 'Form 6 return filed and biometric cards checked', NOW(), NOW()),
      (CONCAT('cmp-004-', ?), ?, ?, ?, ?, 'CLRA', 'CLRA-MH-2023-412', '2023-11-01', '2026-10-31', 'Labour Office, Pune Region', 'EXPIRING', 'HR Compliance Auditor', NOW(), 'Renewal application submitted to Labour Department', NOW(), NOW()),
      (CONCAT('cmp-005-', ?), ?, ?, ?, ?, 'CLRA', 'CLRA-MH-2022-901', '2022-01-01', '2027-03-31', 'Home Department (PASARA), Govt of Maharashtra', 'VALID', 'HR Compliance Auditor', NOW(), 'PASARA private security agency license verified', NOW(), NOW())
    `,
    cSuffix, v1Id, c1Id, companyId, branchId,
    cSuffix, v1Id, c1Id, companyId, branchId,
    cSuffix, v1Id, c1Id, companyId, branchId,
    cSuffix, v2Id, c2Id, companyId, branchId,
    cSuffix, v3Id, c3Id, companyId, branchId
    );
    console.log('✓ Inserted 5 Statutory Compliance Records (CLRA, PF, ESIC)');

    // 6. Documents
    await prisma.$executeRawUnsafe(`
      INSERT INTO contractor_documents (
        id, vendor_id, contract_id, document_type, document_name,
        file_name, file_url, issue_date, expiry_date,
        verification_status, uploaded_by, uploaded_at
      ) VALUES
      (CONCAT('doc-001-', ?), ?, ?, 'CONTRACT_AGREEMENT', 'Executed Staffing Agreement CNT-2026-001.pdf', 'cnt_2026_001_signed.pdf', '/documents/contractors/cnt_2026_001.pdf', '2026-04-01', '2027-03-31', 'VERIFIED', 'HR Admin', NOW()),
      (CONCAT('doc-002-', ?), ?, ?, 'CLRA_LICENSE', 'Government CLRA License CLRA-MH-2024-889.pdf', 'clra_mh_2024_889.pdf', '/documents/contractors/clra_889.pdf', '2024-04-01', '2027-03-31', 'VERIFIED', 'HR Compliance', NOW()),
      (CONCAT('doc-003-', ?), ?, NULL, 'GST_CERTIFICATE', 'GST Registration Certificate 27AABCM8901D1Z4.pdf', 'gst_reg_cert.pdf', '/documents/contractors/gst_mims.pdf', '2018-06-15', NULL, 'VERIFIED', 'HR Admin', NOW()),
      (CONCAT('doc-004-', ?), ?, ?, 'CLRA_LICENSE', 'CLRA Housekeeping Staffing License 412.pdf', 'clra_facility_412.pdf', '/documents/contractors/clra_facility_412.pdf', '2023-11-01', '2026-10-31', 'VERIFIED', 'HR Compliance', NOW())
    `,
    cSuffix, v1Id, c1Id,
    cSuffix, v1Id, c1Id,
    cSuffix, v1Id,
    cSuffix, v2Id, c2Id
    );
    console.log('✓ Inserted 4 Contractor Documents');

    // 7. Vendor History / Audit
    await prisma.$executeRawUnsafe(`
      INSERT INTO contractor_vendor_history (
        id, vendor_id, action, entity_type, entity_id,
        new_value, reason, performed_by, performed_at
      ) VALUES
      (CONCAT('hist-001-', ?), ?, 'VENDOR_CREATED', 'VENDOR', ?, '{"status":"ACTIVE","name":"Maharashtra Industrial Manpower Services"}', 'Vendor on-boarding completed', 'HR Admin', DATE_SUB(NOW(), INTERVAL 15 DAY)),
      (CONCAT('hist-002-', ?), ?, 'CONTRACT_CREATED', 'CONTRACT', ?, '{"contractNumber":"CNT-2026-001","maxHeadcount":50}', 'New annual master staffing agreement signed', 'HR Admin', DATE_SUB(NOW(), INTERVAL 12 DAY)),
      (CONCAT('hist-003-', ?), ?, 'COMPLIANCE_ADDED', 'COMPLIANCE', CONCAT('cmp-001-', ?), '{"type":"CLRA","licenseNumber":"CLRA-MH-2024-889"}', 'CLRA license verification approved by legal team', 'HR Compliance Auditor', DATE_SUB(NOW(), INTERVAL 10 DAY)),
      (CONCAT('hist-004-', ?), ?, 'WORKER_DEPLOYED', 'DEPLOYMENT', CONCAT('wd-001-', ?), '{"worker":"Amit Kumar (CW-001)","line":"PL-001"}', 'Shop floor machine operator deployment', 'Shop Floor Supervisor', DATE_SUB(NOW(), INTERVAL 5 DAY))
    `,
    cSuffix, v1Id, v1Id,
    cSuffix, v1Id, c1Id,
    cSuffix, v1Id, cSuffix,
    cSuffix, v1Id, cSuffix
    );
    console.log('✓ Inserted Vendor Audit History');
  }

  await prisma.$disconnect();
  console.log('\n>>> CONTRACTOR DATA SEEDED 100% SUCCESSFULLY! <<<');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
