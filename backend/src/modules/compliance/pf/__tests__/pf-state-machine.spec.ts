import { BadRequestException } from '@nestjs/common';
import { PfComplianceService } from '../services/pf-compliance.service';

describe('PfComplianceService - State Machine Guards', () => {
  let service: PfComplianceService;

  beforeEach(() => {
    // Instantiate with dummy dependencies for state validation tests
    service = new PfComplianceService(null as any, null as any, null as any);
  });

  it('TC-SM-01: PAYROLL_PENDING -> CALCULATED (MUST FAIL)', () => {
    expect(() => {
      service.validateTransition('PAYROLL_PENDING', 'CALCULATED');
    }).toThrow(BadRequestException);
  });

  it('TC-SM-02: CALCULATED -> PAID (MUST FAIL)', () => {
    expect(() => {
      service.validateTransition('CALCULATED', 'PAID');
    }).toThrow(BadRequestException);
  });

  it('TC-SM-03: READY_FOR_ECR -> PAYMENT_PENDING (MUST FAIL)', () => {
    expect(() => {
      service.validateTransition('READY_FOR_ECR', 'PAYMENT_PENDING');
    }).toThrow(BadRequestException);
  });

  it('TC-SM-04: PAYMENT_PENDING -> COMPLETED (MUST FAIL)', () => {
    expect(() => {
      service.validateTransition('PAYMENT_PENDING', 'COMPLETED');
    }).toThrow(BadRequestException);
  });

  it('TC-SM-05: Valid sequential transitions pass cleanly', () => {
    expect(() => service.validateTransition('PAYROLL_PENDING', 'PF_RUN_CREATED')).not.toThrow();
    expect(() => service.validateTransition('PF_RUN_CREATED', 'CALCULATING')).not.toThrow();
    expect(() => service.validateTransition('CALCULATING', 'CALCULATED')).not.toThrow();
    expect(() => service.validateTransition('CALCULATED', 'READY_FOR_ECR')).not.toThrow();
    expect(() => service.validateTransition('READY_FOR_ECR', 'ECR_GENERATED')).not.toThrow();
    expect(() => service.validateTransition('ECR_GENERATED', 'ECR_SUBMITTED')).not.toThrow();
    expect(() => service.validateTransition('ECR_SUBMITTED', 'CHALLAN_CREATED')).not.toThrow();
    expect(() => service.validateTransition('CHALLAN_CREATED', 'PAYMENT_PENDING')).not.toThrow();
    expect(() => service.validateTransition('PAYMENT_PENDING', 'PAID')).not.toThrow();
    expect(() => service.validateTransition('PAID', 'RECONCILIATION_PENDING')).not.toThrow();
    expect(() => service.validateTransition('RECONCILIATION_PENDING', 'COMPLETED')).not.toThrow();
  });
});
