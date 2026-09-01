import { Injectable } from '@nestjs/common';

export interface EcrRecordInput {
  uan: string;
  employeeName: string;
  grossWage: number;
  pfWage: number;
  epsWage: number;
  edliWage: number;
  employeePf: number;    // EE EPF (12%)
  employerEps: number;   // ER EPS (8.33%)
  employerEpf: number;   // ER EPF Difference (3.67%)
  ncpDays: number;
  refundOfAdvance?: number;
}

@Injectable()
export class EcrV2GeneratorService {
  private readonly DELIMITER = '#~#';

  /**
   * Generates official EPFO ECR v2.0 text file string formatted according to EPFO Unified Portal specification.
   */
  public generateEcrText(records: EcrRecordInput[]): {
    fileContent: string;
    recordCount: number;
    totalPfWageSum: number;
    totalEeRemitted: number;
    totalErRemitted: number;
  } {
    const lines: string[] = [];
    let totalPfWageSum = 0;
    let totalEeRemitted = 0;
    let totalErRemitted = 0;

    for (const r of records) {
      const uan = (r.uan || '').trim().replace(/[^0-9]/g, '');
      const name = (r.employeeName || '').toUpperCase().trim().replace(/#/g, '');
      const gross = Math.round(Number(r.grossWage || 0));
      const pfWage = Math.round(Number(r.pfWage || 0));
      const epsWage = Math.round(Number(r.epsWage || 0));
      const edliWage = Math.round(Number(r.edliWage || 0));
      const eePf = Math.round(Number(r.employeePf || 0));
      const erEps = Math.round(Number(r.employerEps || 0));
      const erEpf = Math.round(Number(r.employerEpf || 0));
      const ncp = Math.max(0, Math.round(Number(r.ncpDays || 0)));
      const refund = Math.max(0, Math.round(Number(r.refundOfAdvance || 0)));

      totalPfWageSum += pfWage;
      totalEeRemitted += eePf;
      totalErRemitted += erEps + erEpf;

      // Line format: UAN#~#Member Name#~#Gross Wages#~#EPF Wages#~#EPS Wages#~#EDLI Wages#~#EPF Contribution#~#EPS Contribution#~#EPF EPS Difference#~#NCP Days#~#Refund of Advances
      const line = [
        uan,
        name,
        gross,
        pfWage,
        epsWage,
        edliWage,
        eePf,
        erEps,
        erEpf,
        ncp,
        refund,
      ].join(this.DELIMITER);

      lines.push(line);
    }

    const fileContent = lines.join('\n');

    return {
      fileContent,
      recordCount: records.length,
      totalPfWageSum,
      totalEeRemitted,
      totalErRemitted,
    };
  }
}
