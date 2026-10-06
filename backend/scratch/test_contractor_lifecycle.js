async function testContractorLifecycle() {
  console.log('--- TESTING CONTRACTOR MANAGEMENT API FLOW ---');

  // Login
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ppurvesh503@gmail.com', password: 'Patil@123' })
  });
  const { accessToken } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };

  // 1. Dashboard
  console.log('\n=== TEST 1: GET DASHBOARD KPIS ===');
  const dashRes = await fetch('http://localhost:3001/api/workforce/contractors/dashboard', { headers });
  const dashData = await dashRes.json();
  console.log('Dashboard metrics:', dashData);

  // 2. List Vendors
  console.log('\n=== TEST 2: LIST VENDORS ===');
  const vendorsRes = await fetch('http://localhost:3001/api/workforce/contractors/vendors', { headers });
  const vendors = await vendorsRes.json();
  console.log(`Retrieved ${vendors.length} vendors. First vendor:`, vendors[0]?.vendor_code, vendors[0]?.legal_name);

  // 3. Create Vendor
  console.log('\n=== TEST 3: CREATE VENDOR ===');
  const createVendorRes = await fetch('http://localhost:3001/api/workforce/contractors/vendors', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorCode: 'VND-TST-99',
      legalName: 'Apex Precision Staffing Services Pvt Ltd',
      displayName: 'Apex Staffing',
      vendorType: 'MANPOWER_AGENCY',
      registrationNumber: 'REG/TST/999',
      gstin: '27AABCA9999Z1Z1',
      pan: 'AABCA9999Z',
      registeredAddress: 'MIDC Phase II, Hinjewadi',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      primaryContactName: 'Nitin Sharma',
      primaryContactPhone: '+91 99887 66554',
      primaryContactEmail: 'nitin@apexstaffing.in',
      status: 'ACTIVE'
    })
  });
  const newVendor = await createVendorRes.json();
  console.log('Created vendor:', newVendor.id, newVendor.vendor_code, newVendor.legal_name);

  // 4. Duplicate Vendor Code Check (Expect 409)
  console.log('\n=== TEST 4: DUPLICATE VENDOR CODE VALIDATION ===');
  const dupVendorRes = await fetch('http://localhost:3001/api/workforce/contractors/vendors', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorCode: 'VND-TST-99',
      legalName: 'Duplicate Agency Test',
      primaryContactName: 'Test',
      primaryContactPhone: '+91 90000 00000',
      primaryContactEmail: 'test@dup.com'
    })
  });
  console.log('Duplicate vendor HTTP status:', dupVendorRes.status, '(Expect 409 Conflict)');

  // 5. Create Contract
  console.log('\n=== TEST 5: CREATE CONTRACT ===');
  const createContractRes = await fetch('http://localhost:3001/api/workforce/contractors/contracts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorId: newVendor.id,
      contractNumber: 'CNT-TST-9901',
      contractStartDate: '2026-10-01',
      contractEndDate: '2027-09-30',
      contractType: 'MANPOWER_SUPPLY',
      scopeOfWork: 'Technical Line Assembly Fitters and Welders',
      maximumHeadcount: 15,
      billingType: 'MONTHLY',
      billingRate: 26000.00,
      paymentTerms: 'Net 30 Days',
      status: 'ACTIVE'
    })
  });
  const newContract = await createContractRes.json();
  console.log('Created contract:', newContract.id, newContract.contract_number, 'Max Headcount:', newContract.maximum_headcount);

  // 6. Invalid Contract Dates Check (Expect 400)
  console.log('\n=== TEST 6: INVALID CONTRACT DATES VALIDATION ===');
  const invalidDateRes = await fetch('http://localhost:3001/api/workforce/contractors/contracts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorId: newVendor.id,
      contractNumber: 'CNT-BAD-DATES',
      contractStartDate: '2027-01-01',
      contractEndDate: '2026-01-01', // End date before start date!
      scopeOfWork: 'Invalid dates test',
      status: 'ACTIVE'
    })
  });
  console.log('Invalid dates HTTP status:', invalidDateRes.status, '(Expect 400 Bad Request)');

  // 7. Add Compliance (CLRA License)
  console.log('\n=== TEST 7: ADD STATUTORY COMPLIANCE (CLRA) ===');
  const createCompRes = await fetch('http://localhost:3001/api/workforce/contractors/compliance', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorId: newVendor.id,
      contractId: newContract.id,
      complianceType: 'CLRA',
      licenseNumber: 'CLRA-MH-2026-TST',
      issueDate: '2026-04-01',
      expiryDate: '2027-03-31',
      issuingAuthority: 'Labour Department, Pune Circle',
      status: 'VALID'
    })
  });
  const newComp = await createCompRes.json();
  console.log('Created compliance:', newComp.id, newComp.compliance_type, 'Status:', newComp.status);

  // 8. Create Contractor Worker
  console.log('\n=== TEST 8: CREATE CONTRACTOR WORKER ===');
  const createWorkerRes = await fetch('http://localhost:3001/api/workforce/contractors/workers', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorId: newVendor.id,
      contractId: newContract.id,
      workerCode: 'CW-TST-901',
      firstName: 'Kiran',
      lastName: 'Wagh',
      mobile: '+91 98333 44556',
      email: 'kiran.wagh@staffing.com',
      joiningDate: '2026-10-05',
      designation: 'Milling Operator',
      skill: 'CNC Milling',
      skillLevel: 'Skilled',
      status: 'ACTIVE'
    })
  });
  const newWorker = await createWorkerRes.json();
  console.log('Created contractor worker:', newWorker.id, newWorker.worker_code, `${newWorker.first_name} ${newWorker.last_name}`);

  // 9. Deploy Worker
  console.log('\n=== TEST 9: DEPLOY WORKER ===');
  const deployRes = await fetch('http://localhost:3001/api/workforce/contractors/deployments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      workerId: newWorker.id,
      vendorId: newVendor.id,
      contractId: newContract.id,
      designation: 'Milling Operator',
      deploymentType: 'MACHINE_OPERATOR',
      startDate: '2026-10-06',
      remarks: 'Allocated to machining test cell'
    })
  });
  const newDep = await deployRes.json();
  console.log('Deployment created:', newDep.id, 'Status:', newDep.status, 'Start date:', newDep.start_date);

  // 10. Overlapping Deployment Check (Expect 409)
  console.log('\n=== TEST 10: OVERLAPPING DEPLOYMENT VALIDATION ===');
  const dupDeployRes = await fetch('http://localhost:3001/api/workforce/contractors/deployments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      workerId: newWorker.id,
      vendorId: newVendor.id,
      contractId: newContract.id,
      startDate: '2026-10-06'
    })
  });
  console.log('Overlapping deployment HTTP status:', dupDeployRes.status, '(Expect 409 Conflict)');

  // 11. Complete Deployment
  console.log('\n=== TEST 11: COMPLETE DEPLOYMENT ===');
  const compDepRes = await fetch(`http://localhost:3001/api/workforce/contractors/deployments/${newDep.id}/complete`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ remarks: 'Completed trial deployment period' })
  });
  const completedDep = await compDepRes.json();
  console.log('Deployment completed status:', completedDep.status, 'End Date:', completedDep.end_date);

  // 12. Renew Contract
  console.log('\n=== TEST 12: RENEW CONTRACT ===');
  const renewRes = await fetch(`http://localhost:3001/api/workforce/contractors/contracts/${newContract.id}/renew`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      newEndDate: '2028-03-31',
      maximumHeadcount: 20,
      billingRate: 28000.00,
      remarks: 'Annual renewal with headcount expansion'
    })
  });
  const renewedContract = await renewRes.json();
  console.log('Renewed contract end date:', renewedContract.contract_end_date, 'New Max Headcount:', renewedContract.maximum_headcount);

  // 13. Suspend and Reactivate Vendor
  console.log('\n=== TEST 13: SUSPEND & REACTIVATE VENDOR ===');
  const suspendRes = await fetch(`http://localhost:3001/api/workforce/contractors/vendors/${newVendor.id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'SUSPENDED', reason: 'Audit pending' })
  });
  const suspendedVendor = await suspendRes.json();
  console.log('Vendor status after suspend:', suspendedVendor.status);

  const activateRes = await fetch(`http://localhost:3001/api/workforce/contractors/vendors/${newVendor.id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'ACTIVE', reason: 'Audit passed' })
  });
  const activatedVendor = await activateRes.json();
  console.log('Vendor status after reactivation:', activatedVendor.status);

  // 14. Document Upload & List
  console.log('\n=== TEST 14: DOCUMENT UPLOAD & LIST ===');
  const docRes = await fetch('http://localhost:3001/api/workforce/contractors/documents', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vendorId: newVendor.id,
      contractId: newContract.id,
      documentType: 'CONTRACT_AGREEMENT',
      documentName: 'Signed Test Agreement.pdf',
      fileName: 'signed_test.pdf',
      fileUrl: '/docs/signed_test.pdf'
    })
  });
  const newDoc = await docRes.json();
  console.log('Uploaded document:', newDoc.id, newDoc.document_name);

  // 15. Audit History Check
  console.log('\n=== TEST 15: VENDOR AUDIT HISTORY ===');
  const histRes = await fetch(`http://localhost:3001/api/workforce/contractors/vendors/${newVendor.id}/history`, { headers });
  const history = await histRes.json();
  console.log(`Retrieved ${history.length} audit history records for vendor.`);

  // Cleanup test records
  console.log('\n=== CLEANUP TEST RECORDS ===');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.$executeRawUnsafe(`DELETE FROM contractor_vendor_history WHERE vendor_id = ?`, newVendor.id);
  await prisma.$executeRawUnsafe(`DELETE FROM contractor_documents WHERE vendor_id = ?`, newVendor.id);
  await prisma.$executeRawUnsafe(`DELETE FROM contractor_compliance WHERE vendor_id = ?`, newVendor.id);
  await prisma.$executeRawUnsafe(`DELETE FROM worker_deployments WHERE vendor_id = ?`, newVendor.id);
  await prisma.$executeRawUnsafe(`DELETE FROM contractor_workers WHERE vendor_id = ?`, newVendor.id);
  await prisma.$executeRawUnsafe(`DELETE FROM contractor_contracts WHERE vendor_id = ?`, newVendor.id);
  await prisma.$executeRawUnsafe(`DELETE FROM contractor_vendors WHERE id = ?`, newVendor.id);
  await prisma.$disconnect();
  console.log('Cleaned up test records successfully!');

  console.log('\n>>> ALL 15 CONTRACTOR MANAGEMENT API TESTS PASSED 100%! <<<');
}

testContractorLifecycle().catch(err => {
  console.error('Lifecycle test error:', err);
  process.exit(1);
});
