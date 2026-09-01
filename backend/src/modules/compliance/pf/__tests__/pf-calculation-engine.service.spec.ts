import { PfCalculationEngineService, PfConfigInput } from '../services/pf-calculation-engine.service';

describe('PfCalculationEngineService - Statutory Rules', () => {
  let service: PfCalculationEngineService;

  const defaultConfig: PfConfigInput = {
    pfWageCeiling: 15000,
    epsWageCeiling: 15000,
    edliWageCeiling: 15000,
    employeePfRate: 12.0,
    employerEpsRate: 8.33,
    employerEpfRate: 3.67,
    edliRate: 0.5,
    adminRate: 0.5,
    minAdminCharge: 500,
    epsMaxCap: 1250,
    edliMaxCap: 75,
    edliExempt: false,
    account22Applicable: false,
    account22Rate: 0.005,
    account22Min: 1.0,
    allowHigherWage: true,
    restrictEpsOver58: true,
    policyVersion: 'EPFO_2026_V1',
  };

  beforeEach(() => {
    service = new PfCalculationEngineService();
  });

  it('TC-PF-01: Standard calculation for Basic = ₹10,000, Age = 30', () => {
    const result = service.calculateRecord(
      {
        id: 'emp-1',
        name: 'John Doe',
        basicSalary: 10000,
        daAllowance: 0,
        dateOfBirth: '1995-01-01',
      },
      defaultConfig,
    );

    expect(result.pfWage).toBe(10000);
    expect(result.epsWage).toBe(10000);
    expect(result.employeePf).toBe(1200); // 12%
    expect(result.employerEps).toBe(833); // 8.33% of 10000
    expect(result.employerEpf).toBe(367); // 1200 - 833
    expect(result.edli).toBe(50); // 0.5%
    expect(result.epsEligible).toBe(true);
  });

  it('TC-PF-02: Capped calculation for Basic = ₹25,000, Age = 30 (higherWageOptIn = false)', () => {
    const result = service.calculateRecord(
      {
        id: 'emp-2',
        name: 'Jane Smith',
        basicSalary: 25000,
        daAllowance: 0,
        higherWageOptIn: false,
        dateOfBirth: '1995-01-01',
      },
      defaultConfig,
    );

    expect(result.pfWage).toBe(15000); // Capped at ₹15,000
    expect(result.epsWage).toBe(15000);
    expect(result.employeePf).toBe(1800); // 12% of 15000
    expect(result.employerEps).toBe(1250); // Capped at ₹1,250
    expect(result.employerEpf).toBe(550); // 1800 - 1250
    expect(result.edli).toBe(75); // Capped at ₹75
  });

  it('TC-PF-03: Higher Wage Opt-in calculation for Basic = ₹30,000', () => {
    const result = service.calculateRecord(
      {
        id: 'emp-3',
        name: 'Alice Johnson',
        basicSalary: 30000,
        daAllowance: 0,
        higherWageOptIn: true,
        dateOfBirth: '1995-01-01',
      },
      defaultConfig,
    );

    expect(result.pfWage).toBe(30000); // Uncapped
    expect(result.epsWage).toBe(30000);
    expect(result.employeePf).toBe(3600); // 12% of 30000
    expect(result.employerEps).toBe(2499); // 8.33% of 30000 uncapped
    expect(result.employerEpf).toBe(1101); // 3600 - 2499
  });

  it('TC-PF-04: Age >= 58 restriction (EPS Restricted)', () => {
    const result = service.calculateRecord(
      {
        id: 'emp-4',
        name: 'Senior Employee',
        basicSalary: 20000,
        daAllowance: 0,
        dateOfBirth: '1960-01-01', // Age > 58
      },
      defaultConfig,
    );

    expect(result.epsEligible).toBe(false);
    expect(result.epsWage).toBe(0);
    expect(result.employerEps).toBe(0); // 0% EPS
    expect(result.employerEpf).toBe(1800); // Full 12% to EPF Acct #1
  });

  it('TC-PF-05: Account #2 Admin Charge minimum ₹500 floor', () => {
    const records = [
      service.calculateRecord(
        { id: 'emp-1', name: 'User 1', basicSalary: 10000, dateOfBirth: '1995-01-01' },
        defaultConfig,
      ),
    ];

    const totals = service.calculateEstablishmentTotals(records, defaultConfig);

    // 0.5% of 10,000 = ₹50, but statutory minimum floor is ₹500
    expect(totals.totalAdminCharge).toBe(500);
  });

  it('TC-PF-06: EDLI Exempt & Account #22 Inspection Charge (0.005% min ₹1)', () => {
    const exemptConfig: PfConfigInput = {
      ...defaultConfig,
      edliExempt: true,
      account22Applicable: true,
    };

    const records = [
      service.calculateRecord(
        { id: 'emp-1', name: 'User 1', basicSalary: 15000, dateOfBirth: '1995-01-01' },
        exemptConfig,
      ),
    ];

    const totals = service.calculateEstablishmentTotals(records, exemptConfig);

    expect(records[0].edli).toBe(0); // EDLI Exempt
    expect(totals.totalAcct22Charge).toBe(1); // 0.005% of 15,000 = 0.75, min floor = ₹1
  });
});
