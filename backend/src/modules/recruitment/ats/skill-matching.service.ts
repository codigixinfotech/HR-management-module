import { Injectable } from '@nestjs/common';

export interface SkillMatchResult {
  matchedSkills: string[];
  missingSkills: string[];
  score: number; // 0 to 100
}

@Injectable()
export class SkillMatchingService {
  /**
   * Matches candidate skills against Job Opening required skills
   */
  matchSkills(candidateSkills: string[], requiredSkillsRaw?: string | null): SkillMatchResult {
    if (!requiredSkillsRaw || !requiredSkillsRaw.trim()) {
      return {
        matchedSkills: candidateSkills || [],
        missingSkills: [],
        score: candidateSkills && candidateSkills.length > 0 ? 100 : 0,
      };
    }

    // Parse required skills from job opening
    const requiredSkillsList = requiredSkillsRaw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (requiredSkillsList.length === 0) {
      return {
        matchedSkills: candidateSkills || [],
        missingSkills: [],
        score: candidateSkills && candidateSkills.length > 0 ? 100 : 0,
      };
    }

    if (!candidateSkills || candidateSkills.length === 0) {
      return {
        matchedSkills: [],
        missingSkills: requiredSkillsList,
        score: 0,
      };
    }

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkillsList.forEach((reqSkill) => {
      const isMatched = candidateSkills.some((candSkill) =>
        this.areSkillsEquivalent(candSkill, reqSkill)
      );

      if (isMatched) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const matchRatio = matchedSkills.length / requiredSkillsList.length;
    const score = Math.round(matchRatio * 100);

    return {
      matchedSkills,
      missingSkills,
      score,
    };
  }

  private areSkillsEquivalent(candSkill: string, reqSkill: string): boolean {
    if (!candSkill || !reqSkill) return false;

    const trimmedCand = candSkill.trim();
    const trimmedReq = reqSkill.trim();

    // 1. Direct case-insensitive match
    if (trimmedCand.toLowerCase() === trimmedReq.toLowerCase()) return true;

    const normCand = this.normalize(trimmedCand);
    const normReq = this.normalize(trimmedReq);

    // 2. Normalized match (e.g. "React.js" -> "reactjs" === "ReactJS" -> "reactjs")
    if (normCand === normReq && normCand.length >= 2) return true;

    // 3. Synonym Groups: Both candidate skill and required skill must belong to the same synonym group
    const SYNONYM_GROUPS: string[][] = [
      ['react', 'reactjs', 'react.js', 'react native'],
      ['node', 'nodejs', 'node.js', 'express', 'express.js', 'expressjs'],
      ['typescript', 'ts'],
      ['javascript', 'js', 'es6', 'ecmascript'],
      ['postgres', 'postgresql', 'pgsql'],
      ['mysql', 'mariadb'],
      ['k8s', 'kubernetes'],
      ['golang', 'go', 'golang developer'],
      ['aws', 'amazon web services'],
      ['gcp', 'google cloud', 'google cloud platform'],
      ['azure', 'microsoft azure'],
      ['docker', 'containerization'],
      ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],
      ['ui/ux', 'uiux', 'ui/ux design', 'ui designer', 'ux designer'],
      ['qa', 'quality assurance', 'software testing', 'manual testing', 'automation testing'],
      ['rest api', 'rest', 'restful api', 'restful'],
      ['graphql', 'apollo'],
      ['c#', 'csharp', '.net', 'dotnet'],
      ['c++', 'cpp'],
    ];

    for (const group of SYNONYM_GROUPS) {
      const candInGroup = group.some(
        (term) => this.normalize(term) === normCand || normCand.includes(this.normalize(term))
      );
      const reqInGroup = group.some(
        (term) => this.normalize(term) === normReq || normReq.includes(this.normalize(term))
      );
      if (candInGroup && reqInGroup) {
        return true;
      }
    }

    return false;
  }

  private normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}
