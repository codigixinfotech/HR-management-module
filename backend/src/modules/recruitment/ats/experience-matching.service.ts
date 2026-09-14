import { Injectable } from '@nestjs/common';

export interface ExperienceMatchResult {
  candidateExpYears: number;
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
    candidateExpYears: number,
    minReqYears?: number | null,
    maxReqYears?: number | null,
  ): ExperienceMatchResult {
    const minReq = minReqYears ?? 0;
    const maxReq = maxReqYears ?? 10;
    const candidateYears = Math.max(0, candidateExpYears || 0);

    // 1. Fresher / No min experience required
    if (minReq === 0) {
      return {
        candidateExpYears: candidateYears,
        minRequiredYears: minReq,
        maxRequiredYears: maxReq,
        isMatch: true,
        score: 100,
        summary: `Eligible for Fresher / Entry Level requirements (${candidateYears} Yrs found).`,
      };
    }

    // 2. Meets or exceeds minimum required experience
    if (candidateYears >= minReq) {
      return {
        candidateExpYears: candidateYears,
        minRequiredYears: minReq,
        maxRequiredYears: maxReq,
        isMatch: true,
        score: 100,
        summary: `Meets minimum experience requirement of ${minReq} Years (${candidateYears} Yrs found).`,
      };
    }

    // 3. Below minimum requirement -> proportional score, but isMatch is FALSE
    const score = Math.round(Math.min(100, Math.max(0, (candidateYears / minReq) * 100)));

    return {
      candidateExpYears: candidateYears,
      minRequiredYears: minReq,
      maxRequiredYears: maxReq,
      isMatch: false,
      score,
      summary: `Below required minimum experience of ${minReq} Years (${candidateYears} Yrs found).`,
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
