import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  experienceYears: number;
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

    // Combine raw text from candidate profile fields & actual parsed resume content
    const combinedRawText = [
      `${candidate.firstName || ''} ${candidate.lastName || ''}`,
      candidate.email || '',
      candidate.phone || '',
      candidate.currentLocation || '',
      candidate.qualification || '',
      candidate.skills || '',
      candidate.experience || '',
      candidate.currentCompany || '',
      candidate.notes || '',
      candidate.coverLetter || '',
      fileContentText,
    ]
      .filter(Boolean)
      .join('\n');

    // Extract skills array
    const extractedSkills = this.extractSkills(combinedRawText, candidate.skills);

    // Extract experience years
    const experienceYears = this.extractExperienceYears(candidate.experience, combinedRawText);

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
      'Linux',
      'CI/CD',
      'HTML',
      'CSS',
      'Tailwind',
      'GraphQL',
      'REST API',
      'Microservices',
      'Software Engineering',
      'ERP',
      'CRM',
      'Problem Solving',
      'Communication',
      'Customer Support',
      'System Architecture',
      'UI/UX Design',
      'Figma',
      'Wireframing',
      'Agile',
      'Scrum',
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

  private extractExperienceYears(explicitExp?: string | null, rawText?: string): number {
    if (explicitExp) {
      const match = String(explicitExp).match(/([\d.]+)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) return val;
      }
    }
    if (rawText) {
      const match = rawText.match(/(\d+)\+?\s*(years?|yrs?)/i);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
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
