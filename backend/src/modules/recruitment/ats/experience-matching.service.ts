import { Injectable } from '@nestjs/common';

export interface ExperienceMatchResult {
  status: 'VERIFIED' | 'NOT_VERIFIED' | 'FRESHER';
  candidateExpYears: number | null;
  minRequiredYears: number;
  maxRequiredYears?: number;
  isMatch: boolean;
  score: number; // 0 to 100
  summary: string;
}

export interface QualificationMatchResult {
  candidateQual: string;
  requiredQual: string;
  isMatch: boolean;
  score: number; // 0 to 100
  summary?: string;
}

@Injectable()
export class ExperienceMatchingService {
  /**
   * Matches candidate experience against Job Opening experience requirement
   */
  matchExperience(
    candidateExpYears: number | null | undefined,
    minReqYears?: number | null,
    maxReqYears?: number | null,
  ): ExperienceMatchResult {
    const minReq = minReqYears ?? 0;
    const maxReq = maxReqYears ?? (minReq > 0 ? minReq + 3 : 10);

    // 1. Candidate experience NOT found in uploaded PDF resume
    if (candidateExpYears === null || candidateExpYears === undefined) {
      return {
        status: 'NOT_VERIFIED',
        candidateExpYears: null,
        minRequiredYears: minReq,
        maxRequiredYears: maxReq,
        isMatch: false,
        score: 0,
        summary: `Not Verified — Candidate experience not found in uploaded resume. Required: ${minReq}${maxReq ? `–${maxReq}` : ''} years.`,
      };
    }

    // 2. Candidate is verified 0 years / Fresher in resume
    if (candidateExpYears === 0) {
      if (minReq === 0) {
        return {
          status: 'FRESHER',
          candidateExpYears: 0,
          minRequiredYears: minReq,
          maxRequiredYears: maxReq,
          isMatch: true,
          score: 100,
          summary: `Eligible for Fresher / Entry Level requirements (0 Yrs found in resume).`,
        };
      } else {
        return {
          status: 'VERIFIED',
          candidateExpYears: 0,
          minRequiredYears: minReq,
          maxRequiredYears: maxReq,
          isMatch: false,
          score: 0,
          summary: `Below required minimum experience of ${minReq} Years (0 Yrs / Fresher found in resume).`,
        };
      }
    }

    // 3. Normal experience calculation (> 0 years)
    const candidateYears = candidateExpYears;

    if (candidateYears >= minReq) {
      return {
        status: 'VERIFIED',
        candidateExpYears: candidateYears,
        minRequiredYears: minReq,
        maxRequiredYears: maxReq,
        isMatch: true,
        score: 100,
        summary: `Meets minimum experience requirement of ${minReq} Years (${candidateYears} Yrs found in resume).`,
      };
    }

    // Below minimum requirement -> proportional score, but isMatch is FALSE
    const score = minReq > 0 ? Math.round(Math.min(100, Math.max(0, (candidateYears / minReq) * 100))) : 100;

    return {
      status: 'VERIFIED',
      candidateExpYears: candidateYears,
      minRequiredYears: minReq,
      maxRequiredYears: maxReq,
      isMatch: false,
      score,
      summary: `Below required minimum experience of ${minReq} Years (${candidateYears} Yrs found in resume).`,
    };
  }

  /**
   * Evaluates academic qualification match
   */
  matchQualification(
    candidateQual?: string | null,
    requiredQual?: string | null,
  ): QualificationMatchResult {
    // If no specific qualification required, it's satisfied
    if (
      !requiredQual ||
      !requiredQual.trim() ||
      requiredQual.trim().toLowerCase() === 'not specified'
    ) {
      return {
        candidateQual: candidateQual || 'Not specified',
        requiredQual: 'Not specified',
        isMatch: true,
        score: 100,
        summary: 'No specific qualification required.',
      };
    }

    // If candidate has no qualification provided, it cannot match
    if (!candidateQual || !candidateQual.trim()) {
      return {
        candidateQual: 'None provided',
        requiredQual,
        isMatch: false,
        score: 0,
        summary: 'No qualification found on resume or application.',
      };
    }

    const candRaw = candidateQual.trim().toLowerCase();
    const reqOptions = requiredQual
      .split(/[,;\n/]/)
      .map((q) => q.trim().toLowerCase())
      .filter(Boolean);

    // Define degree groups with synonyms
    const DEGREE_GROUPS: string[][] = [
      [
        'btech',
        'b.tech',
        'be',
        'b.e',
        'b.e.',
        'bee',
        'bachelor of engineering',
        'bachelor of technology',
        'undergraduate',
        'bachelor',
        'bachelors',
        'graduation',
      ],
      [
        'mtech',
        'm.tech',
        'me',
        'm.e',
        'm.e.',
        'master of engineering',
        'master of technology',
        'post graduate',
        'master',
        'masters',
      ],
      ['bca', 'bachelor of computer applications'],
      ['mca', 'master of computer applications'],
      ['bsc', 'b.sc', 'bachelor of science'],
      ['msc', 'm.sc', 'master of science'],
      ['bba', 'bachelor of business administration'],
      ['mba', 'master of business administration'],
      ['diploma'],
      ['phd', 'doctorate'],
      ['12th', 'hsc', 'intermediate'],
      ['10th', 'ssc', 'matriculation'],
    ];

    const clean = (s: string) => s.replace(/[^a-z0-9]/g, '');
    const candNorm = clean(candRaw);

    for (const reqOpt of reqOptions) {
      const reqNorm = clean(reqOpt);
      if (!reqNorm) continue;

      // Exact normalized match
      if (candNorm === reqNorm) {
        return {
          candidateQual,
          requiredQual,
          isMatch: true,
          score: 100,
          summary: `Matches required qualification: ${reqOpt}`,
        };
      }

      // Check degree group equivalence
      for (const group of DEGREE_GROUPS) {
        const candInGroup = group.some(
          (deg) => clean(deg) === candNorm || candNorm.includes(clean(deg)),
        );
        const reqInGroup = group.some(
          (deg) => clean(deg) === reqNorm || reqNorm.includes(clean(deg)),
        );
        if (candInGroup && reqInGroup) {
          return {
            candidateQual,
            requiredQual,
            isMatch: true,
            score: 100,
            summary: `Meets requirement (${reqOpt}) via equivalent degree (${candidateQual})`,
          };
        }
      }
    }

    // No match found
    return {
      candidateQual,
      requiredQual,
      isMatch: false,
      score: 0,
      summary: `Does not meet required qualification (${requiredQual}).`,
    };
  }
}
