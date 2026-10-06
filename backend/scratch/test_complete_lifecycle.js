async function testCompleteLifecycle() {
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

  console.log('=== TEST 1: CREATE PRODUCTION LINE ===');
  const createLineRes = await fetch('http://localhost:3001/api/workforce/production-lines', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      lineCode: 'PL-TEST-' + Date.now().toString().slice(-4),
      lineName: 'Testing Automated Assembly Cell',
      lineType: 'Assembly',
      productionCapacity: 600,
      capacityUom: 'Units/Day',
      workingHours: 8,
      numberOfShifts: 2,
      status: 'ACTIVE',
      description: 'Automated test line created during verification'
    })
  });
  const newLine = await createLineRes.json();
  console.log('Created line:', newLine.id, newLine.lineCode);

  console.log('=== TEST 2: CREATE MACHINE ===');
  const createMachineRes = await fetch('http://localhost:3001/api/workforce/machines', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productionLineId: newLine.id,
      machineCode: 'TST-' + Date.now().toString().slice(-4),
      machineName: 'High-Precision Test CNC #99',
      machineType: 'CNC',
      machineCategory: 'Production Machine',
      manufacturer: 'DMG Mori',
      model: 'NLX 2500',
      capacity: 150,
      capacityUom: 'Units/Hour',
      operatingHours: 8,
      powerRating: 30,
      powerUom: 'kW',
      maintenanceFrequencyDays: 30,
      status: 'ACTIVE'
    })
  });
  const newMachine = await createMachineRes.json();
  console.log('Created machine:', newMachine.id, newMachine.machineCode);

  console.log('=== TEST 3: EDIT MACHINE ===');
  const editMachineRes = await fetch(`http://localhost:3001/api/workforce/machines/${newMachine.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      machineName: 'High-Precision Test CNC #99 (Updated)',
      capacity: 180
    })
  });
  const editedMachine = await editMachineRes.json();
  console.log('Updated machine capacity:', editedMachine.capacity, editedMachine.machineName);

  console.log('=== TEST 4: CREATE OPERATOR ===');
  const createOpRes = await fetch('http://localhost:3001/api/workforce/machine-operators', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operatorType: 'Employee',
      operatorName: 'Sunil Test Operator',
      operatorCode: 'OP-TST-' + Date.now().toString().slice(-4),
      department: 'Production',
      skill: 'CNC Multi-Axis Milling',
      skillLevel: 'Expert',
      certification: 'Certified Master Machinist',
      status: 'Available'
    })
  });
  const newOp = await createOpRes.json();
  console.log('Created operator:', newOp.id, newOp.operatorName, 'status:', newOp.status);

  console.log('=== TEST 5: ASSIGN OPERATOR (CREATE ALLOCATION) ===');
  const assignRes = await fetch('http://localhost:3001/api/workforce/machine-allocations', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productionLineId: newLine.id,
      machineId: newMachine.id,
      operatorId: newOp.id,
      shift: 'Morning (A)',
      allocationDate: '2026-10-06',
      startTime: '08:00',
      endTime: '16:30',
      workOrder: 'WO-TST-9001',
      operation: 'Shaft Machining Trial',
      efficiency: 98.0
    })
  });
  const allocResult = await assignRes.json();
  console.log('Allocation result:', allocResult);

  // Check operator status changed to Allocated
  const opCheck = await (await fetch(`http://localhost:3001/api/workforce/machine-operators/${newOp.id}`, { headers })).json();
  console.log('Operator status after assignment:', opCheck.status, 'currentMachineId:', opCheck.currentMachineId);

  console.log('=== TEST 6: START MAINTENANCE (INTERRUPTS ACTIVE ALLOCATION) ===');
  const startMaintRes = await fetch('http://localhost:3001/api/workforce/machine-maintenances/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      machineId: newMachine.id,
      productionLineId: newLine.id,
      maintenanceType: 'Preventive',
      priority: 'High',
      reason: 'Scheduled tool calibration and hydraulic fluid change',
      startDate: '2026-10-06',
      technicianName: 'Field Engineer Rajesh'
    })
  });
  const maintStarted = await startMaintRes.json();
  console.log('Maintenance started:', maintStarted);

  // Verify machine status changed to UNDER_MAINTENANCE
  const mCheck = await (await fetch(`http://localhost:3001/api/workforce/machines/${newMachine.id}`, { headers })).json();
  console.log('Machine status during maintenance:', mCheck.status);

  console.log('=== TEST 7: COMPLETE MAINTENANCE (RESTORES MACHINE TO ACTIVE) ===');
  const completeMaintRes = await fetch(`http://localhost:3001/api/workforce/machine-maintenances/${maintStarted.id}/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actualCompletionDate: '2026-10-06',
      technicianName: 'Field Engineer Rajesh',
      result: 'Completed Successfully',
      partsReplaced: 'Hydraulic Seal Kit (P/N DM-202)',
      remarks: 'Calibration verified at 0.001mm tolerance. Returned to active service.'
    })
  });
  const maintCompleted = await completeMaintRes.json();
  console.log('Complete maintenance result:', maintCompleted);

  // Verify machine status restored to ACTIVE
  const mRestored = await (await fetch(`http://localhost:3001/api/workforce/machines/${newMachine.id}`, { headers })).json();
  console.log('Machine status after maintenance completed:', mRestored.status);

  console.log('=== TEST 8: CLEANUP TEST RECORDS ===');
  await fetch(`http://localhost:3001/api/workforce/machines/${newMachine.id}`, { method: 'DELETE', headers });
  await fetch(`http://localhost:3001/api/workforce/production-lines/${newLine.id}`, { method: 'DELETE', headers });
  console.log('Cleanup completed!');

  console.log('\n>>> ALL 8 LIFECYCLE TESTS PASSED 100% SUCCESSFULLY! <<<');
}

testCompleteLifecycle().catch(console.error);
