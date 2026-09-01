describe('PF 5-Way Compliance Reconciliation Engine', () => {
  function performReconciliation(dataset: {
    payrollGl: number;
    pfCalcEngine: number;
    ecrReturnSum: number;
    trrnChallanTotal: number;
    bankPaidAmount: number;
  }) {
    const variance =
      Math.abs(dataset.payrollGl - dataset.pfCalcEngine) +
      Math.abs(dataset.pfCalcEngine - dataset.ecrReturnSum) +
      Math.abs(dataset.ecrReturnSum - dataset.trrnChallanTotal) +
      Math.abs(dataset.trrnChallanTotal - dataset.bankPaidAmount);

    return {
      isReconciled: variance === 0,
      variance,
      status: variance === 0 ? 'RECONCILED' : 'VARIANCE_DETECTED',
    };
  }

  it('TC-RECON-01: Perfect match across all 5 datasets (Variance = 0)', () => {
    const result = performReconciliation({
      payrollGl: 580000,
      pfCalcEngine: 580000,
      ecrReturnSum: 580000,
      trrnChallanTotal: 580000,
      bankPaidAmount: 580000,
    });

    expect(result.isReconciled).toBe(true);
    expect(result.variance).toBe(0);
    expect(result.status).toBe('RECONCILED');
  });

  it('TC-RECON-02: Calculation vs Payroll GL Mismatch', () => {
    const result = performReconciliation({
      payrollGl: 580000,
      pfCalcEngine: 575000, // Mismatch
      ecrReturnSum: 575000,
      trrnChallanTotal: 575000,
      bankPaidAmount: 575000,
    });

    expect(result.isReconciled).toBe(false);
    expect(result.status).toBe('VARIANCE_DETECTED');
  });

  it('TC-RECON-03: ECR Return vs Calculation Mismatch', () => {
    const result = performReconciliation({
      payrollGl: 580000,
      pfCalcEngine: 580000,
      ecrReturnSum: 575000, // Mismatch
      trrnChallanTotal: 580000,
      bankPaidAmount: 580000,
    });

    expect(result.isReconciled).toBe(false);
    expect(result.status).toBe('VARIANCE_DETECTED');
  });

  it('TC-RECON-04: TRRN Challan Mismatch', () => {
    const result = performReconciliation({
      payrollGl: 580000,
      pfCalcEngine: 580000,
      ecrReturnSum: 580000,
      trrnChallanTotal: 570000, // Mismatch
      bankPaidAmount: 580000,
    });

    expect(result.isReconciled).toBe(false);
    expect(result.status).toBe('VARIANCE_DETECTED');
  });

  it('TC-RECON-05: Bank Payment UTR Mismatch', () => {
    const result = performReconciliation({
      payrollGl: 580000,
      pfCalcEngine: 580000,
      ecrReturnSum: 580000,
      trrnChallanTotal: 580000,
      bankPaidAmount: 575000, // Mismatch
    });

    expect(result.isReconciled).toBe(false);
    expect(result.status).toBe('VARIANCE_DETECTED');
  });
});
