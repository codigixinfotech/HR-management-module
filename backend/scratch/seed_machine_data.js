const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Starting machine management seeding...');

  // Get companies
  const companies = await prisma.company.findMany({
    include: {
      branches: true,
      departments: true,
      employees: { take: 10 }
    }
  });

  if (companies.length === 0) {
    console.log('No companies found.');
    await prisma.$disconnect();
    return;
  }

  for (const company of companies) {
    const compId = company.id;
    const branches = company.branches.length > 0 ? company.branches : [{ id: null, name: 'Head Office' }];
    const depts = company.departments.length > 0 ? company.departments : [{ id: null, name: 'Production' }];
    const emps = company.employees;

    // Check if lines already seeded for this company
    const existingLines = await prisma.$queryRawUnsafe(
      'SELECT id FROM production_lines WHERE companyId = ?',
      compId
    );

    if (existingLines.length > 0) {
      console.log(`Company ${company.name} already has ${existingLines.length} lines. Skipping seed.`);
      continue;
    }

    console.log(`Seeding data for company: ${company.name} (${compId})`);

    const primaryBranch = branches[0];
    const prodDept = depts.find(d => d.name.toLowerCase().includes('prod') || d.name.toLowerCase().includes('op')) || depts[0];

    const supervisor1 = emps[0] ? `${emps[0].firstName} ${emps[0].lastName}` : 'Amit Patel';
    const supervisor1Id = emps[0] ? emps[0].id : null;
    const supervisor2 = emps[1] ? `${emps[1].firstName} ${emps[1].lastName}` : 'Rajesh Sharma';
    const supervisor2Id = emps[1] ? emps[1].id : null;

    // 1. Create Production Lines
    const linesToInsert = [
      {
        id: `pl-${compId.slice(-6)}-1`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        lineCode: 'PL-001',
        lineName: 'CNC Production Line 1',
        lineType: 'Production',
        location: 'Bay A - Heavy Machinery Shop',
        supervisorId: supervisor1Id,
        supervisorName: supervisor1,
        productionCapacity: 500,
        capacityUom: 'Units/Day',
        workingHours: 8,
        numberOfShifts: 2,
        status: 'ACTIVE',
        description: 'High-precision CNC milling and turning cell with 5-axis capability.'
      },
      {
        id: `pl-${compId.slice(-6)}-2`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        lineCode: 'PL-002',
        lineName: 'Robotic Welding Line',
        lineType: 'Production',
        location: 'Bay B - Fabrication Shop',
        supervisorId: supervisor2Id,
        supervisorName: supervisor2,
        productionCapacity: 350,
        capacityUom: 'Units/Day',
        workingHours: 16,
        numberOfShifts: 2,
        status: 'ACTIVE',
        description: 'Automated MIG/TIG multi-axis robotic welding and seam tracking cell.'
      },
      {
        id: `pl-${compId.slice(-6)}-3`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        lineCode: 'PL-003',
        lineName: 'Packaging & Palletizing Line',
        lineType: 'Packaging',
        location: 'Bay C - Finishing & Dispatch',
        supervisorId: supervisor1Id,
        supervisorName: supervisor1,
        productionCapacity: 1200,
        capacityUom: 'Units/Day',
        workingHours: 8,
        numberOfShifts: 1,
        status: 'ACTIVE',
        description: 'End-of-line high-speed carton packing, shrink-wrap and automated palletizing.'
      },
      {
        id: `pl-${compId.slice(-6)}-4`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        lineCode: 'PL-004',
        lineName: 'High-Speed Stamping Line',
        lineType: 'Production',
        location: 'Bay D - Press Shop',
        supervisorId: supervisor2Id,
        supervisorName: supervisor2,
        productionCapacity: 800,
        capacityUom: 'Units/Day',
        workingHours: 16,
        numberOfShifts: 2,
        status: 'ACTIVE',
        description: 'Heavy hydraulic and progressive stamping presses for component sheet forming.'
      },
      {
        id: `pl-${compId.slice(-6)}-5`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        lineCode: 'PL-005',
        lineName: 'Central Assembly & QC Rig',
        lineType: 'Assembly',
        location: 'Bay E - Final Assembly Cleanroom',
        supervisorId: supervisor1Id,
        supervisorName: supervisor1,
        productionCapacity: 400,
        capacityUom: 'Units/Day',
        workingHours: 8,
        numberOfShifts: 1,
        status: 'ACTIVE',
        description: 'Sub-assembly integration, wire harness routing, and inline QA telemetry scanning.'
      }
    ];

    for (const line of linesToInsert) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO production_lines (
          id, companyId, branchId, departmentId, lineCode, lineName, lineType,
          location, supervisorId, supervisorName, productionCapacity, capacityUom,
          workingHours, numberOfShifts, status, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        line.id, line.companyId, line.branchId, line.departmentId, line.lineCode, line.lineName, line.lineType,
        line.location, line.supervisorId, line.supervisorName, line.productionCapacity, line.capacityUom,
        line.workingHours, line.numberOfShifts, line.status, line.description
      );
    }

    // 2. Create Machines
    const machinesToInsert = [
      {
        id: `m-${compId.slice(-6)}-1`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        productionLineId: linesToInsert[0].id,
        machineCode: 'CNC-001',
        machineName: 'CNC Lathe #01 (5-Axis Turning)',
        machineType: 'CNC',
        machineCategory: 'Production Machine',
        manufacturer: 'Mazak Corporation',
        model: 'Integrex i-200S',
        serialNumber: 'MZK-2024-9812',
        assetNumber: 'AST-MCH-001',
        workstation: 'WS-01 Turning Cell',
        location: 'Bay A, Section 1',
        capacity: 100,
        capacityUom: 'Units/Hour',
        operatingHours: 8,
        powerRating: 25,
        powerUom: 'kW',
        maintenanceFrequencyDays: 30,
        lastMaintenanceDate: '2026-09-10',
        nextMaintenanceDate: '2026-10-10',
        status: 'ACTIVE'
      },
      {
        id: `m-${compId.slice(-6)}-2`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        productionLineId: linesToInsert[1].id,
        machineCode: 'WLD-002',
        machineName: 'Robotic Welder Arm #02',
        machineType: 'Welding',
        machineCategory: 'Production Machine',
        manufacturer: 'Fanuc Robotics',
        model: 'ARC Mate 120iD',
        serialNumber: 'FNC-ARC-4402',
        assetNumber: 'AST-MCH-002',
        workstation: 'WS-02 Weld Cell',
        location: 'Bay B, Section 2',
        capacity: 80,
        capacityUom: 'Units/Hour',
        operatingHours: 16,
        powerRating: 35,
        powerUom: 'kW',
        maintenanceFrequencyDays: 45,
        lastMaintenanceDate: '2026-09-01',
        nextMaintenanceDate: '2026-10-15',
        status: 'ACTIVE'
      },
      {
        id: `m-${compId.slice(-6)}-3`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        productionLineId: linesToInsert[2].id,
        machineCode: 'PKG-003',
        machineName: 'Automated Conveyor Packaging System',
        machineType: 'Packaging',
        machineCategory: 'Packaging System',
        manufacturer: 'Bosch Packaging Technology',
        model: 'Pack-500 Pro',
        serialNumber: 'BOS-PKG-7721',
        assetNumber: 'AST-MCH-003',
        workstation: 'WS-03 Packaging Rig',
        location: 'Bay C, Section 1',
        capacity: 300,
        capacityUom: 'Units/Hour',
        operatingHours: 8,
        powerRating: 18,
        powerUom: 'kW',
        maintenanceFrequencyDays: 30,
        lastMaintenanceDate: '2026-09-05',
        nextMaintenanceDate: '2026-10-05',
        status: 'UNDER_MAINTENANCE'
      },
      {
        id: `m-${compId.slice(-6)}-4`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        productionLineId: linesToInsert[3].id,
        machineCode: 'STP-004',
        machineName: 'High-Speed Stamping Press #04',
        machineType: 'Stamping Press',
        machineCategory: 'Production Machine',
        manufacturer: 'Schuler Group',
        model: 'MSP 400 Servo',
        serialNumber: 'SCH-PR-3310',
        assetNumber: 'AST-MCH-004',
        workstation: 'WS-04 Press Bed',
        location: 'Bay D, Section 1',
        capacity: 450,
        capacityUom: 'Units/Hour',
        operatingHours: 16,
        powerRating: 55,
        powerUom: 'kW',
        maintenanceFrequencyDays: 60,
        lastMaintenanceDate: '2026-08-20',
        nextMaintenanceDate: '2026-10-20',
        status: 'ACTIVE'
      },
      {
        id: `m-${compId.slice(-6)}-5`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        productionLineId: linesToInsert[4].id,
        machineCode: 'QC-005',
        machineName: 'Inline Laser QC Telemetry Scanner #01',
        machineType: 'Quality Scanner',
        machineCategory: 'QC / Telemetry',
        manufacturer: 'Keyence Optical Systems',
        model: 'LJ-X8000 3D',
        serialNumber: 'KEY-SCN-1109',
        assetNumber: 'AST-MCH-005',
        workstation: 'WS-05 Inspection Bay',
        location: 'Bay E, Section 1',
        capacity: 500,
        capacityUom: 'Units/Hour',
        operatingHours: 8,
        powerRating: 5,
        powerUom: 'kW',
        maintenanceFrequencyDays: 90,
        lastMaintenanceDate: '2026-07-15',
        nextMaintenanceDate: '2026-10-15',
        status: 'ACTIVE'
      },
      {
        id: `m-${compId.slice(-6)}-6`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        departmentId: prodDept ? prodDept.id : null,
        productionLineId: linesToInsert[0].id,
        machineCode: 'CNC-002',
        machineName: 'CNC Vertical Milling Machine #02',
        machineType: 'CNC',
        machineCategory: 'Production Machine',
        manufacturer: 'Haas Automation',
        model: 'VF-4SS Super Speed',
        serialNumber: 'HAS-VF4-8831',
        assetNumber: 'AST-MCH-006',
        workstation: 'WS-01 Milling Cell',
        location: 'Bay A, Section 2',
        capacity: 90,
        capacityUom: 'Units/Hour',
        operatingHours: 8,
        powerRating: 22,
        powerUom: 'kW',
        maintenanceFrequencyDays: 30,
        lastMaintenanceDate: '2026-09-12',
        nextMaintenanceDate: '2026-10-12',
        status: 'ACTIVE'
      }
    ];

    for (const m of machinesToInsert) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO machines (
          id, companyId, branchId, departmentId, productionLineId, machineCode,
          machineName, machineType, machineCategory, manufacturer, model, serialNumber,
          assetNumber, workstation, location, capacity, capacityUom, operatingHours,
          powerRating, powerUom, maintenanceFrequencyDays, lastMaintenanceDate,
          nextMaintenanceDate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        m.id, m.companyId, m.branchId, m.departmentId, m.productionLineId, m.machineCode,
        m.machineName, m.machineType, m.machineCategory, m.manufacturer, m.model, m.serialNumber,
        m.assetNumber, m.workstation, m.location, m.capacity, m.capacityUom, m.operatingHours,
        m.powerRating, m.powerUom, m.maintenanceFrequencyDays, m.lastMaintenanceDate,
        m.nextMaintenanceDate, m.status
      );
    }

    // 3. Create Machine Operators (Linked to real DB employees or contractors)
    const operatorsToInsert = [
      {
        id: `op-${compId.slice(-6)}-1`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: emps[0] ? emps[0].id : null,
        operatorType: 'Employee',
        operatorName: emps[0] ? `${emps[0].firstName} ${emps[0].lastName}` : 'Amit Patel',
        operatorCode: emps[0] ? emps[0].employeeCode : 'EMP-001',
        department: 'Production',
        skill: 'CNC Machining & G-Code Programming',
        skillLevel: 'Expert',
        certification: 'Master CNC Machinist Level IV',
        certificationExpiry: '2026-12-31',
        contractorAgency: null,
        contractorComplianceStatus: 'VALID',
        status: 'Allocated',
        currentMachineId: machinesToInsert[0].id,
        currentShift: 'Morning (A)'
      },
      {
        id: `op-${compId.slice(-6)}-2`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: emps[1] ? emps[1].id : null,
        operatorType: 'Employee',
        operatorName: emps[1] ? `${emps[1].firstName} ${emps[1].lastName}` : 'Rajesh Sharma',
        operatorCode: emps[1] ? emps[1].employeeCode : 'EMP-002',
        department: 'Production',
        skill: 'Robotic Seam Welding (MIG/TIG)',
        skillLevel: 'Expert',
        certification: 'AWS Certified Robotic Welder',
        certificationExpiry: '2027-06-30',
        contractorAgency: null,
        contractorComplianceStatus: 'VALID',
        status: 'Allocated',
        currentMachineId: machinesToInsert[1].id,
        currentShift: 'General (G)'
      },
      {
        id: `op-${compId.slice(-6)}-3`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: null,
        operatorType: 'Contractor',
        operatorName: 'Rahul Kumar',
        operatorCode: 'CW-021',
        department: 'Packaging & Finishing',
        skill: 'Automated Packaging & Case Erector Ops',
        skillLevel: 'Intermediate',
        certification: 'PMMI Packaging Specialist',
        certificationExpiry: '2026-11-15',
        contractorAgency: 'Apex Industrial Manpower Services',
        contractorComplianceStatus: 'VALID',
        status: 'Allocated',
        currentMachineId: machinesToInsert[2].id,
        currentShift: 'Evening (B)'
      },
      {
        id: `op-${compId.slice(-6)}-4`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: emps[2] ? emps[2].id : null,
        operatorType: 'Employee',
        operatorName: emps[2] ? `${emps[2].firstName} ${emps[2].lastName}` : 'Vikas Deshmukh',
        operatorCode: emps[2] ? emps[2].employeeCode : 'EMP-003',
        department: 'Production',
        skill: 'Heavy Press Die Setting & Stamping',
        skillLevel: 'Expert',
        certification: 'PMA Certified Stamping Press Specialist',
        certificationExpiry: '2027-03-31',
        contractorAgency: null,
        contractorComplianceStatus: 'VALID',
        status: 'Allocated',
        currentMachineId: machinesToInsert[3].id,
        currentShift: 'Morning (A)'
      },
      {
        id: `op-${compId.slice(-6)}-5`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: emps[3] ? emps[3].id : null,
        operatorType: 'Employee',
        operatorName: emps[3] ? `${emps[3].firstName} ${emps[3].lastName}` : 'Pooja Hegde',
        operatorCode: emps[3] ? emps[3].employeeCode : 'EMP-004',
        department: 'Quality Assurance',
        skill: 'Optical 3D Metrology & Geometric Tolerancing',
        skillLevel: 'Specialist',
        certification: 'ASQ Certified Quality Inspector (CQI)',
        certificationExpiry: '2027-08-31',
        contractorAgency: null,
        contractorComplianceStatus: 'VALID',
        status: 'Allocated',
        currentMachineId: machinesToInsert[4].id,
        currentShift: 'General (G)'
      },
      {
        id: `op-${compId.slice(-6)}-6`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: emps[4] ? emps[4].id : null,
        operatorType: 'Employee',
        operatorName: emps[4] ? `${emps[4].firstName} ${emps[4].lastName}` : 'Sunil Rao',
        operatorCode: emps[4] ? emps[4].employeeCode : 'EMP-005',
        department: 'Production',
        skill: 'CNC Multi-Spindle Turning & Milling',
        skillLevel: 'Intermediate',
        certification: 'NIMS Machining Level II',
        certificationExpiry: '2026-10-31',
        contractorAgency: null,
        contractorComplianceStatus: 'VALID',
        status: 'Available',
        currentMachineId: null,
        currentShift: null
      },
      {
        id: `op-${compId.slice(-6)}-7`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        employeeId: null,
        operatorType: 'Contractor',
        operatorName: 'Sanjay Verma',
        operatorCode: 'CW-045',
        department: 'Production',
        skill: 'TIG Shielded Metal Arc Welding',
        skillLevel: 'Intermediate',
        certification: 'IBR Qualified Welder',
        certificationExpiry: '2026-12-15',
        contractorAgency: 'Prime Staffing Solutions Ltd',
        contractorComplianceStatus: 'VALID',
        status: 'Available',
        currentMachineId: null,
        currentShift: null
      }
    ];

    for (const op of operatorsToInsert) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO machine_operators (
          id, companyId, branchId, employeeId, operatorType, operatorName,
          operatorCode, department, skill, skillLevel, certification,
          certificationExpiry, contractorAgency, contractorComplianceStatus,
          status, currentMachineId, currentShift
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        op.id, op.companyId, op.branchId, op.employeeId, op.operatorType, op.operatorName,
        op.operatorCode, op.department, op.skill, op.skillLevel, op.certification,
        op.certificationExpiry, op.contractorAgency, op.contractorComplianceStatus,
        op.status, op.currentMachineId, op.currentShift
      );
    }

    // 4. Create Machine Allocations
    const allocationsToInsert = [
      {
        id: `alloc-${compId.slice(-6)}-1`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        productionLineId: linesToInsert[0].id,
        machineId: machinesToInsert[0].id,
        operatorId: operatorsToInsert[0].id,
        operatorType: 'Employee',
        supervisorId: supervisor1Id,
        supervisorName: supervisor1,
        shift: 'Morning (A)',
        allocationDate: '2026-10-05',
        startTime: '08:00:00',
        endTime: '16:30:00',
        workOrder: 'WO-2026-1044',
        operation: 'Precision Rotor Shaft Roughing & Finishing',
        efficiency: 98.5,
        status: 'ACTIVE',
        remarks: 'Normal production run. Tolerance adherence verified at ±0.005mm.'
      },
      {
        id: `alloc-${compId.slice(-6)}-2`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        productionLineId: linesToInsert[1].id,
        machineId: machinesToInsert[1].id,
        operatorId: operatorsToInsert[1].id,
        operatorType: 'Employee',
        supervisorId: supervisor2Id,
        supervisorName: supervisor2,
        shift: 'General (G)',
        allocationDate: '2026-10-05',
        startTime: '09:00:00',
        endTime: '17:30:00',
        workOrder: 'WO-2026-1052',
        operation: 'Chassis Sub-frame Seam Welding',
        efficiency: 96.2,
        status: 'ACTIVE',
        remarks: 'Batch 4B structural seam welding with automated wire feeder.'
      },
      {
        id: `alloc-${compId.slice(-6)}-3`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        productionLineId: linesToInsert[2].id,
        machineId: machinesToInsert[2].id,
        operatorId: operatorsToInsert[2].id,
        operatorType: 'Contractor',
        supervisorId: supervisor1Id,
        supervisorName: supervisor1,
        shift: 'Evening (B)',
        allocationDate: '2026-10-05',
        startTime: '16:00:00',
        endTime: '00:30:00',
        workOrder: 'WO-2026-1060',
        operation: 'Final Consumer Packaging & Carton Sealing',
        efficiency: 84.0,
        status: 'INTERRUPTED',
        remarks: 'Interrupted due to scheduled preventive conveyor belt tension calibration.'
      },
      {
        id: `alloc-${compId.slice(-6)}-4`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        productionLineId: linesToInsert[3].id,
        machineId: machinesToInsert[3].id,
        operatorId: operatorsToInsert[3].id,
        operatorType: 'Employee',
        supervisorId: supervisor2Id,
        supervisorName: supervisor2,
        shift: 'Morning (A)',
        allocationDate: '2026-10-05',
        startTime: '08:00:00',
        endTime: '16:30:00',
        workOrder: 'WO-2026-1071',
        operation: 'Progressive Blanking & Piercing Operation',
        efficiency: 95.1,
        status: 'ACTIVE',
        remarks: 'Coil feed running smoothly at 120 strokes/min.'
      },
      {
        id: `alloc-${compId.slice(-6)}-5`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        productionLineId: linesToInsert[4].id,
        machineId: machinesToInsert[4].id,
        operatorId: operatorsToInsert[4].id,
        operatorType: 'Employee',
        supervisorId: supervisor1Id,
        supervisorName: supervisor1,
        shift: 'General (G)',
        allocationDate: '2026-10-05',
        startTime: '09:00:00',
        endTime: '17:30:00',
        workOrder: 'WO-2026-1080',
        operation: '100% Inline CMM Laser Profile Telemetry',
        efficiency: 99.1,
        status: 'ACTIVE',
        remarks: 'Zero optical distortion detected across all components.'
      }
    ];

    for (const al of allocationsToInsert) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO machine_allocations (
          id, companyId, branchId, productionLineId, machineId, operatorId,
          operatorType, supervisorId, supervisorName, shift, allocationDate,
          startTime, endTime, workOrder, operation, efficiency, status, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        al.id, al.companyId, al.branchId, al.productionLineId, al.machineId, al.operatorId,
        al.operatorType, al.supervisorId, al.supervisorName, al.shift, al.allocationDate,
        al.startTime, al.endTime, al.workOrder, al.operation, al.efficiency, al.status, al.remarks
      );
    }

    // 5. Create Machine Maintenances
    const maintenancesToInsert = [
      {
        id: `maint-${compId.slice(-6)}-1`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        machineId: machinesToInsert[2].id,
        productionLineId: linesToInsert[2].id,
        maintenanceType: 'Preventive',
        priority: 'Medium',
        reason: '30-day conveyor drive roller inspection and belt tension recalibration.',
        startDate: '2026-10-05',
        expectedCompletionDate: '2026-10-06',
        actualCompletionDate: null,
        technicianName: 'Suresh Patil (Internal Maintenance Team)',
        status: 'In Progress',
        result: null,
        partsReplaced: null,
        remarks: 'Conveyor drive motor lubrication completed; replacing secondary roller bearing.',
        interruptedAllocationId: allocationsToInsert[2].id
      },
      {
        id: `maint-${compId.slice(-6)}-2`,
        companyId: compId,
        branchId: primaryBranch ? primaryBranch.id : null,
        machineId: machinesToInsert[0].id,
        productionLineId: linesToInsert[0].id,
        maintenanceType: 'Preventive',
        priority: 'Low',
        reason: 'Monthly spindle coolant pressure test and guideway oil filter change.',
        startDate: '2026-09-10',
        expectedCompletionDate: '2026-09-10',
        actualCompletionDate: '2026-09-10',
        technicianName: 'Mazak Authorized Field Service',
        status: 'Completed',
        result: 'Completed Successfully',
        partsReplaced: 'Hydraulic filter element (P/N MZ-8820), 10L Spindle Coolant synthetic oil',
        remarks: 'Spindle runout verified < 0.002mm. Ready for production.',
        interruptedAllocationId: null
      }
    ];

    for (const mt of maintenancesToInsert) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO machine_maintenances (
          id, companyId, branchId, machineId, productionLineId, maintenanceType,
          priority, reason, startDate, expectedCompletionDate, actualCompletionDate,
          technicianName, status, result, partsReplaced, remarks, interruptedAllocationId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        mt.id, mt.companyId, mt.branchId, mt.machineId, mt.productionLineId, mt.maintenanceType,
        mt.priority, mt.reason, mt.startDate, mt.expectedCompletionDate, mt.actualCompletionDate,
        mt.technicianName, mt.status, mt.result, mt.partsReplaced, mt.remarks, mt.interruptedAllocationId
      );
    }

    console.log(`Seeded lines, machines, operators, allocations, and maintenance for ${company.name}`);
  }

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  prisma.$disconnect();
  process.exit(1);
});
