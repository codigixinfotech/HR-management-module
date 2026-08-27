import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  FileText,
  RefreshCw,
  ExternalLink,
  Download,
  Award,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { atsApi, type AtsAnalysisData } from '@/api/recruitment';
import { ResumeViewerModal } from './ResumeViewerModal';

interface AtsAnalysisCardProps {
  candidateId: string;
  candidateName?: string;
  jobTitle?: string;
  resumePath?: string;
  onAnalysisLoaded?: (data: AtsAnalysisData) => void;
}

export const AtsAnalysisCard: React.FC<AtsAnalysisCardProps> = ({
  candidateId,
  candidateName = 'Candidate',
  jobTitle = 'Target Job',
  resumePath,
  onAnalysisLoaded,
}) => {
  const queryClient = useQueryClient();
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const { data: ats, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidate-ats-analysis', candidateId],
    queryFn: async () => {
      const res = await atsApi.get(candidateId);
      if (onAnalysisLoaded && res) onAnalysisLoaded(res);
      return res;
    },
    enabled: Boolean(candidateId),
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => atsApi.reanalyze(candidateId),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['candidate-ats-analysis', candidateId], updatedData);
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success(`ATS Re-analysis complete for ${candidateName}! Match Score: ${updatedData.matchScore}%`);
      if (onAnalysisLoaded) onAnalysisLoaded(updatedData);
    },
    onError: () => {
      toast.error('Failed to re-analyze resume');
    },
  });

  if (isLoading) {
    return (
      <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-spin" />
          <div>
            <p className="font-bold text-xs text-indigo-800 dark:text-indigo-300">ATS Resume Analysis: Processing...</p>
            <p className="text-[11px] text-slate-500">Extracting skills, experience & qualification matching against {jobTitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !ats) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <FileText className="h-4 w-4 text-slate-400" />
          <span>ATS Analysis available. Click re-run to analyze candidate resume against job requirements.</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => reanalyzeMutation.mutate()}
          disabled={reanalyzeMutation.isPending}
          className="h-7 text-xs font-semibold gap-1 text-indigo-600 border-indigo-200"
        >
          <RefreshCw className={`h-3 w-3 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
          Run ATS Analysis
        </Button>
      </div>
    );
  }

  const score = ats.matchScore;
  const isHighMatch = score >= 75;
  const isMediumMatch = score >= 50 && score < 75;

  const scoreBadgeColor = isHighMatch
    ? 'bg-emerald-500 text-white dark:bg-emerald-600'
    : isMediumMatch
    ? 'bg-amber-500 text-white dark:bg-amber-600'
    : 'bg-rose-500 text-white dark:bg-rose-600';

  const matchedSkills: string[] = Array.isArray(ats.skillsMatched) ? ats.skillsMatched : [];
  const missingSkills: string[] = Array.isArray(ats.skillsMissing) ? ats.skillsMissing : [];
  const extracted = ats.extractedData || {};

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Top Banner: Score & Re-run Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${scoreBadgeColor}`}>
            {score}%
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> ATS Resume Match Score
              </span>
              <Badge variant="outline" className={`text-[10px] font-bold ${scoreBadgeColor}`}>
                {isHighMatch ? 'Strong Match' : isMediumMatch ? 'Moderate Match' : 'Low Match'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated against <strong>{jobTitle}</strong> requisition parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsResumeModalOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
          >
            <ExternalLink className="h-3.5 w-3.5 text-indigo-500" /> View Resume
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reanalyzeMutation.mutate()}
            disabled={reanalyzeMutation.isPending}
            className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
            {reanalyzeMutation.isPending ? 'Analyzing...' : 'Re-Run ATS'}
          </Button>
        </div>
      </div>

      {/* 3 Parameter Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* 1. Skill Match Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-indigo-500" /> Skill Match (50%)
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {matchedSkills.length} / {matchedSkills.length + missingSkills.length}
            </span>
          </div>
          <Progress
            value={matchedSkills.length + missingSkills.length > 0 ? (matchedSkills.length / (matchedSkills.length + missingSkills.length)) * 100 : 100}
            className="h-1.5 bg-slate-200 dark:bg-slate-700"
          />
        </div>

        {/* 2. Experience Match Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Experience Match (30%)
            </span>
            <span className="font-bold text-emerald-600 font-mono">
              {ats.experienceMatch?.isMatch ? '✓ Eligible' : `${ats.experienceMatch?.candidateExpYears || 0} Yrs`}
            </span>
          </div>
          <Progress value={ats.experienceMatch?.score || 100} className="h-1.5 bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* 3. Qualification Match Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Qualification (20%)
            </span>
            <span className="font-bold text-emerald-600 font-mono">
              {ats.qualificationMatch?.isMatch ? '✓ Verified' : 'Partial'}
            </span>
          </div>
          <Progress value={ats.qualificationMatch?.score || 80} className="h-1.5 bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Matched Skills vs Missing Skills Pill Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Matched Skills */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Matched Required Skills ({matchedSkills.length})
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((sk, idx) => (
                <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-semibold text-[11px] border border-emerald-200">
                  ✓ {sk}
                </Badge>
              ))
            ) : (
              <span className="text-slate-400 italic text-[11px]">No exact matched skill tokens found</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold uppercase tracking-wider text-[11px]">
            <XCircle className="h-4 w-4 text-rose-600" /> Missing / Gap Skills ({missingSkills.length})
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {missingSkills.length > 0 ? (
              missingSkills.map((sk, idx) => (
                <Badge key={idx} variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold text-[11px] border border-rose-200">
                  ✗ {sk}
                </Badge>
              ))
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ All required job skills matched!</span>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Resume Details Summary */}
      {extracted && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs bg-slate-50/40 dark:bg-slate-800/20">
          <h5 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-600" /> Parsed Resume Entity Summary
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-300">
            <p><strong>Candidate Name:</strong> {extracted.name || candidateName}</p>
            <p><strong>Email:</strong> {extracted.email || 'N/A'}</p>
            <p><strong>Experience:</strong> {extracted.experienceYears ?? 0} Years</p>
            <p><strong>Education:</strong> {Array.isArray(extracted.education) ? extracted.education.join(', ') : 'Graduate'}</p>
            <p><strong>Companies:</strong> {Array.isArray(extracted.companies) && extracted.companies.length > 0 ? extracted.companies.join(', ') : 'N/A'}</p>
            <p><strong>Certifications:</strong> {Array.isArray(extracted.certifications) && extracted.certifications.length > 0 ? extracted.certifications.join(', ') : 'None'}</p>
          </div>
        </div>
      )}

      {/* Resume Document Viewer Modal */}
      <ResumeViewerModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        candidateName={extracted.name || candidateName}
        candidateEmail={extracted.email}
        candidatePhone={extracted.phone}
        candidateLocation={extracted.location}
        jobTitle={jobTitle}
        resumeUrl={resumePath}
        experienceYears={extracted.experienceYears}
        qualification={Array.isArray(extracted.education) ? extracted.education.join(', ') : undefined}
        skills={Array.isArray(extracted.skills) ? extracted.skills.join(', ') : undefined}
        score={score}
      />
    </div>
  );
};
