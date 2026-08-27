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
        matchedSkills: candidateSkills,
        missingSkills: [],
        score: 100,
      };
    }

    // Parse required skills from job opening
    const requiredSkillsList = requiredSkillsRaw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (requiredSkillsList.length === 0) {
      return {
        matchedSkills: candidateSkills,
        missingSkills: [],
        score: 100,
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
    const normCand = this.normalize(candSkill);
    const normReq = this.normalize(reqSkill);

    if (normCand === normReq) return true;
    if (normCand.includes(normReq) || normReq.includes(normCand)) return true;

    // Synonyms & Aliases
    const aliases: Record<string, string[]> = {
      react: ['reactjs', 'react.js', 'react native', 'frontend', 'fullstack', 'full stack developer'],
      node: ['nodejs', 'node.js', 'express', 'backend', 'fullstack', 'full stack developer'],
      postgres: ['postgresql', 'postgres sql', 'pg', 'sql'],
      mysql: ['sql', 'database', 'relational database'],
      sql: ['mysql', 'postgresql', 'postgres', 'sqlite', 'database'],
      aws: ['amazon web services', 'cloud', 'devops'],
      docker: ['containers', 'kubernetes', 'k8s', 'devops'],
      typescript: ['ts', 'javascript', 'js'],
      devops: ['docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'gcp', 'jenkins', 'devops eng', 'devops engineer'],
      software: ['software engineer', 'full stack developer', 'developer', 'engineer', 'tech lead'],
      fullstack: ['full stack', 'full stack developer', 'react', 'node', 'express', 'mysql', 'software engineer'],
    };

    for (const [key, synonymList] of Object.entries(aliases)) {
      const matchesKey = normCand.includes(key) || normReq.includes(key);
      if (matchesKey) {
        if (synonymList.some((syn) => normCand.includes(this.normalize(syn)) || normReq.includes(this.normalize(syn)))) {
          return true;
        }
      }
    }

    return false;
  }

  private normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}
