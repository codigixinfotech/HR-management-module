import { Injectable } from '@nestjs/common';

export interface ExperienceMatchResult {
  candidateExpYears: number;
  minRequiredYears: number;
  maxRequiredYears?: number;
  isMatch: boolean;
  score: number; // 0 to 100
  summary: string;
}

@Injectable()
export class ExperienceMatchingService {
  /**
   * Matches candidate experience against Job Opening experience requirement
   */
  matchExperience(candidateExpYears: number, minReqYears?: number | null, maxReqYears?: number | null): ExperienceMatchResult {
    const minReq = minReqYears ?? 0;
    const maxReq = maxReqYears ?? 10;

    if (minReq === 0 && candidateExpYears >= 0) {
      return {
        candidateExpYears,
        minRequiredYears: minReq,
        maxRequiredYears: maxReq,
        isMatch: true,
        score: 100,
        summary: `Eligible for Entry Level / Fresher requirements (${candidateExpYears} Yrs submitted).`,
      };
    }

    if (candidateExpYears >= minReq) {
      return {
        candidateExpYears,
        minRequiredYears: minReq,
        maxRequiredYears: maxReq,
        isMatch: true,
        score: 100,
        summary: `Meets minimum experience requirement of ${minReq} Years (${candidateExpYears} Yrs submitted).`,
      };
    }

    // Proportional score if below min requirement
    const ratio = Math.max(0, candidateExpYears / minReq);
    const score = Math.round(ratio * 100);

    return {
      candidateExpYears,
      minRequiredYears: minReq,
      maxRequiredYears: maxReq,
      isMatch: false,
      score,
      summary: `Below required minimum experience of ${minReq} Years (${candidateExpYears} Yrs submitted).`,
    };
  }

  /**
   * Evaluates academic qualification match
   */
  matchQualification(candidateQual?: string | null, requiredQual?: string | null) {
    if (!requiredQual || !requiredQual.trim()) {
      return {
        candidateQual: candidateQual || 'Graduate',
        requiredQual: 'Not specified',
        isMatch: true,
        score: 100,
      };
    }

    const cand = (candidateQual || '').toLowerCase();
    const req = requiredQual.toLowerCase();

    if (cand.includes(req) || req.includes(cand)) {
      return { candidateQual: candidateQual || 'Graduate', requiredQual, isMatch: true, score: 100 };
    }

    // Standard degree match equivalents
    if ((cand.includes('b.tech') || cand.includes('b.e.') || cand.includes('undergraduate')) && (req.includes('b.tech') || req.includes('graduation') || req.includes('bachelor'))) {
      return { candidateQual: candidateQual || 'B.Tech', requiredQual, isMatch: true, score: 100 };
    }

    return {
      candidateQual: candidateQual || 'Graduate',
      requiredQual,
      isMatch: false,
      score: 70, // Partial qualification match score
    };
  }
}
