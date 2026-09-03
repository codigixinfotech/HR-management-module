import { EcrV2GeneratorService } from '../services/ecr-v2-generator.service';

describe('EcrV2GeneratorService - EPFO ECR v2.0 Format Validator', () => {
  let service: EcrV2GeneratorService;

  beforeEach(() => {
    service = new EcrV2GeneratorService();
  });

  it('TC-ECR-01: Should generate valid #~# delimited ECR lines with 11 fields', () => {
    const input = [
      {
        uan: '100912345678',
        employeeName: 'Rahul Sharma',
        grossWage: 25000,
        pfWage: 15000,
        epsWage: 15000,
        edliWage: 15000,
        employeePf: 1800,
        employerEps: 1250,
        employerEpf: 550,
        ncpDays: 0,
        refundOfAdvance: 0,
      },
    ];

    const result = service.generateEcrText(input);

    expect(result.recordCount).toBe(1);
    expect(result.totalPfWageSum).toBe(15000);
    expect(result.totalEeRemitted).toBe(1800);
    expect(result.totalErRemitted).toBe(1800);

    const line = result.fileContent.trim();
    const fields = line.split('#~#');

    expect(fields.length).toBe(11);
    expect(fields[0]).toBe('100912345678');
    expect(fields[1]).toBe('RAHUL SHARMA'); // Uppercase
    expect(fields[2]).toBe('25000');
    expect(fields[3]).toBe('15000');
    expect(fields[4]).toBe('15000');
    expect(fields[5]).toBe('15000');
    expect(fields[6]).toBe('1800');
    expect(fields[7]).toBe('1250');
    expect(fields[8]).toBe('550');
    expect(fields[9]).toBe('0');
    expect(fields[10]).toBe('0');
  });
});
