import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  experienceYears: number | null;
  totalExperienceYears?: number | null;
  experienceFound: boolean;
  skills: string[];
  education: string[];
  certifications: string[];
  companies: string[];
  jobTitles: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  rawTextPreview: string;
}

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  /**
   * Parses text from candidate profile data & attached resume file asynchronously
   */
  async parseCandidateResume(candidate: any): Promise<ParsedResumeData> {
    let fileContentText = '';

    const resolvedFilePath = this.resolvePhysicalResumePath(candidate.resumePath);

    if (resolvedFilePath && fs.existsSync(resolvedFilePath)) {
      try {
        const ext = path.extname(resolvedFilePath).toLowerCase();
        if (ext === '.pdf') {
          const pdfParse = require('pdf-parse');
          const dataBuffer = fs.readFileSync(resolvedFilePath);
          const pdfData = await pdfParse(dataBuffer);
          fileContentText = pdfData.text || '';
        } else if (ext === '.txt' || ext === '.csv') {
          fileContentText = fs.readFileSync(resolvedFilePath, 'utf8');
        } else {
          // For docx/other formats, attempt to read printable strings
          const buffer = fs.readFileSync(resolvedFilePath);
          fileContentText = buffer.toString('utf8', 0, Math.min(buffer.length, 100000));
        }
      } catch (err: any) {
        this.logger.warn(
          `Could not extract text from resume file at ${resolvedFilePath}: ${err.message}`,
        );
      }
    }

    // Combine raw text from candidate profile fields & actual parsed resume content for skill/metadata discovery
    const combinedRawText = [
      `${candidate.firstName || ''} ${candidate.lastName || ''}`,
      candidate.email || '',
      candidate.phone || '',
      candidate.currentLocation || '',
      candidate.qualification || '',
      candidate.skills || '',
      candidate.currentCompany || '',
      candidate.notes || '',
      candidate.coverLetter || '',
      fileContentText,
    ]
      .filter(Boolean)
      .join('\n');

    // Extract skills array
    const extractedSkills = this.extractSkills(combinedRawText, candidate.skills);

    // Extract experience years strictly from uploaded resume document text (NOT fallback profile data)
    const experienceYears = this.extractExperienceFromResume(fileContentText);

    // Extract education
    const education = this.extractEducation(candidate.qualification, combinedRawText);

    // Extract companies & job titles
    const companies = candidate.currentCompany
      ? [candidate.currentCompany]
      : this.extractCompanies(combinedRawText);
    const jobTitles = this.extractJobTitles(combinedRawText);

    // Extract URLs
    const linkedinUrl = this.extractRegex(
      combinedRawText,
      /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i,
    );
    const githubUrl = this.extractRegex(
      combinedRawText,
      /https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+/i,
    );

    return {
      name: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
      email: candidate.email || '',
      phone: candidate.phone || undefined,
      location: candidate.currentLocation || undefined,
      experienceYears,
      totalExperienceYears: experienceYears,
      experienceFound: experienceYears !== null,
      skills: extractedSkills,
      education,
      certifications: this.extractCertifications(combinedRawText),
      companies,
      jobTitles,
      linkedinUrl,
      githubUrl,
      rawTextPreview: combinedRawText.substring(0, 500),
    };
  }

  private resolvePhysicalResumePath(resumePath?: string | null): string | null {
    if (!resumePath || !resumePath.trim()) return null;
    const trimmed = resumePath.trim();

    // 1. Direct path exists
    if (fs.existsSync(trimmed)) return trimmed;

    // 2. Relative to process.cwd()
    const fromCwd = path.join(process.cwd(), trimmed.replace(/^\//, ''));
    if (fs.existsSync(fromCwd)) return fromCwd;

    // 3. Look in uploads/resumes/
    const filename = path.basename(trimmed);
    const uploadsPath = path.join(process.cwd(), 'uploads', 'resumes', filename);
    if (fs.existsSync(uploadsPath)) return uploadsPath;

    return null;
  }

  private extractSkills(rawText: string, explicitSkills?: string | null): string[] {
    const skillSet = new Set<string>();

    if (explicitSkills) {
      explicitSkills
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => skillSet.add(s));
    }

    // Standard technology & business skill dictionary for parsing
    const commonSkills = [
      'React',
      'React.js',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'NestJS',
      'Express',
      'Python',
      'Java',
      'C++',
      'C#',
      'Go',
      'SQL',
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'Azure',
      'GCP',
      'Git',
      'CI/CD',
      'GraphQL',
      'REST API',
      'Agile',
      'Scrum',
      'Project Management',
      'Hospital Operations',
      'Healthcare Management',
      'Patient Services',
      'Team Management',
      'Budget Management',
      'Communication',
      'Leadership',
      'Problem Solving',
      'ERP',
      'Accounting',
      'Finance',
      'HR Operations',
      'Payroll',
      'Recruitment',
      'Compliance',
    ];

    commonSkills.forEach((skill) => {
      const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(rawText)) {
        skillSet.add(skill);
      }
    });

    return Array.from(skillSet);
  }

  /**
   * Extracts experience years strictly from uploaded resume document text.
   * Returns:
   * - null: If no experience section, employment history, or experience years found (NOT VERIFIED)
   * - 0: If candidate is explicitly declared as Fresher / Entry Level / 0 years
   * - number (> 0): Years of experience calculated from resume text
   */
  public extractExperienceFromResume(resumeText?: string | null): number | null {
    if (!resumeText || !resumeText.trim()) {
      return null;
    }

    const text = resumeText.trim();

    // 1. Check for explicit Fresher / Entry Level declaration in resume text
    const fresherRegex = /\b(fresher|entry\s*level|fresh\s*graduate|trainee|no\s*(?:prior\s*)?experience|0\s*(?:years?|yrs?)(?:\s*(?:of)?\s*experience)?)\b/i;
    if (fresherRegex.test(text)) {
      const hasExpYears = /(?:total\s+experience|work\s+experience|experience)\s*[:=-]?\s*([1-9]\d*(?:\.\d+)?)\s*(?:years?|yrs?)/i.test(text);
      if (!hasExpYears) {
        return 0; // Verified Fresher (0 years)
      }
    }

    // 2. Check for explicit total experience statements:
    // e.g. "Total Experience: 5 Years", "Experience: 3.5 Yrs", "Overall Experience - 6 years"
    const explicitTotalExpRegex = /(?:total\s+(?:work\s+)?experience|overall\s+experience|experience\s+summary|relevant\s+experience)\s*[:=-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i;
    const totalMatch = text.match(explicitTotalExpRegex);
    if (totalMatch) {
      const val = parseFloat(totalMatch[1]);
      if (!isNaN(val) && val >= 0) {
        return val;
      }
    }

    // 3. Check for general experience statement:
    // e.g. "5+ years of experience", "having 4 years experience in...", "3 years of professional experience"
    const generalExpRegex = /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*(?:of)?\s*(?:relevant|hands-on|industry|work|professional|domain)?\s*experience)\b/i;
    const generalMatch = text.match(generalExpRegex);
    if (generalMatch) {
      const val = parseFloat(generalMatch[1]);
      if (!isNaN(val) && val >= 0) {
        return val;
      }
    }

    // 4. Look for an Experience / Employment History section header and extract date ranges or years within it
    const expSectionRegex = /(?:WORK\s+EXPERIENCE|EMPLOYMENT\s+HISTORY|PROFESSIONAL\s+EXPERIENCE|WORK\s+HISTORY|CAREER\s+HISTORY|EXPERIENCE)\b[\s\S]{10,2500}?(?=(?:EDUCATION|ACADEMIC|PROJECTS|SKILLS|CERTIFICATIONS|AWARDS|DECLARATION|$))/i;
    const sectionMatch = text.match(expSectionRegex);
    if (sectionMatch) {
      const sectionText = sectionMatch[0];

      // Check if within this experience section there is a year mention e.g. "3 years"
      const inSectionExp = sectionText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i);
      if (inSectionExp) {
        const val = parseFloat(inSectionExp[1]);
        if (!isNaN(val) && val > 0 && val < 50) {
          return val;
        }
      }

      // Check for date intervals e.g. "2019 - 2023", "Jan 2020 - Present", "06/2018 - 08/2022"
      const dateRanges = this.extractYearsFromDateRanges(sectionText);
      if (dateRanges !== null && dateRanges > 0) {
        return dateRanges;
      }
    }

    // 5. If no experience section, no employment history, and no years of experience found:
    return null;
  }

  private extractYearsFromDateRanges(text: string): number | null {
    const currentYear = new Date().getFullYear();
    const rangeRegex = /\b(19[89]\d|20[012]\d)\s*(?:-|–|—|to)\s*(19[89]\d|20[012]\d|Present|Current|Till\s*Date|Now)\b/gi;
    let match: RegExpExecArray | null;
    const intervals: Array<{ start: number; end: number }> = [];

    while ((match = rangeRegex.exec(text)) !== null) {
      const startYear = parseInt(match[1], 10);
      const endYear = /present|current|till\s*date|now/i.test(match[2])
        ? currentYear
        : parseInt(match[2], 10);

      if (startYear >= 1970 && endYear >= startYear && (endYear - startYear) <= 45) {
        intervals.push({ start: startYear, end: endYear });
      }
    }

    if (intervals.length === 0) return null;

    // Merge overlapping intervals to avoid double counting
    intervals.sort((a, b) => a.start - b.start);
    let mergedYears = 0;
    let curStart = intervals[0].start;
    let curEnd = intervals[0].end;

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].start <= curEnd) {
        curEnd = Math.max(curEnd, intervals[i].end);
      } else {
        mergedYears += curEnd - curStart;
        curStart = intervals[i].start;
        curEnd = intervals[i].end;
      }
    }
    mergedYears += curEnd - curStart;

    return mergedYears > 0 ? mergedYears : null;
  }

  private extractEducation(explicitQual?: string | null, rawText?: string): string[] {
    const list: string[] = [];
    if (explicitQual && explicitQual.trim()) {
      list.push(explicitQual.trim());
    }

    const keywords = [
      'B.Tech',
      'B.E.',
      'BE',
      'M.Tech',
      'MCA',
      'BCA',
      'B.Sc',
      'M.Sc',
      'MBA',
      'Diploma',
      'Doctorate',
      'PhD',
      '12th',
      '10th',
      'Bachelor of Engineering',
      'Bachelor of Technology',
      'Undergraduate',
      'Graduation',
    ];

    if (rawText) {
      keywords.forEach((kw) => {
        const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        if (new RegExp(`\\b${escaped}\\b`, 'i').test(rawText) && !list.includes(kw)) {
          list.push(kw);
        }
      });
    }

    return list;
  }

  private extractCompanies(text: string): string[] {
    const matches = text.match(/(?:at|worked at|company:?)\s+([A-Z][A-Za-z0-9\s&.-]{2,30})/gi);
    if (!matches) return [];
    return matches.map((m) => m.replace(/^(at|worked at|company:?)\s+/i, '').trim()).slice(0, 3);
  }

  private extractJobTitles(text: string): string[] {
    const titles = [
      'Software Engineer',
      'Senior Software Engineer',
      'Tech Lead',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'DevOps Engineer',
      'Product Manager',
      'HR Manager',
    ];
    return titles.filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(text));
  }

  private extractCertifications(text: string): string[] {
    const certs = [
      'AWS Certified',
      'Azure Certified',
      'PMP',
      'Scrum Master',
      'Google Cloud Certified',
      'CISSP',
      'CKA',
    ];
    return certs.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(text));
  }

  private extractRegex(text: string, regex: RegExp): string | undefined {
    const match = text.match(regex);
    return match ? match[0] : undefined;
  }
}
