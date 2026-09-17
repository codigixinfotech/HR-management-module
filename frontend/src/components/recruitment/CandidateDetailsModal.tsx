import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Download,
  Eye,
  Edit,
  Trash2,
  X,
  ClipboardCheck,
  Award,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AtsAnalysisCard } from './AtsAnalysisCard';

import { ResumeViewerModal } from './ResumeViewerModal';
import { openResumeInNewTab } from '@/utils/resume-url.util';

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any | null;
  onEdit?: (candidate: any) => void;
  onStartScreening?: (candidate: any) => void;
  onDelete?: (candidate: any) => void;
}

export const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onEdit,
  onStartScreening,
  onDelete,
}) => {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [liveScore, setLiveScore] = useState<string | null>(null);
  const [liveAtsData, setLiveAtsData] = useState<any>(null);

  React.useEffect(() => {
    if (candidate) {
      setLiveScore(candidate.atsAnalysis?.matchScore !== undefined ? `${candidate.atsAnalysis.matchScore}%` : (candidate.aiMatchScore !== null && candidate.aiMatchScore !== undefined ? `${candidate.aiMatchScore}%` : null));
      setLiveAtsData(candidate.atsAnalysis || null);
    }
  }, [candidate]);

  const handleViewResume = () => {
    const candidateName = candidate?.name || `${candidate?.firstName || ''} ${candidate?.lastName || ''}`.trim() || 'Candidate';
    openResumeInNewTab(candidate?.resumePath, candidateName, () => setIsResumeModalOpen(true));
  };

  // 1. Candidate's own skills (from profile/form or ATS extracted from resume)
  const candidateSkillsList = React.useMemo(() => {
    if (candidate?.skills && typeof candidate.skills === 'string' && candidate.skills.trim()) {
      return candidate.skills
        .split(/[,;\n•|]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    const atsExtracted = liveAtsData?.extractedData?.skills || candidate?.atsAnalysis?.extractedData?.skills;
    if (Array.isArray(atsExtracted) && atsExtracted.length > 0) {
      return atsExtracted.map((s: any) => String(s).trim()).filter(Boolean);
    }
    return [];
  }, [candidate, liveAtsData]);

  // 2. Job Opening required skills (from candidate.jobOpening or candidate's requisition)
  const jobRequiredSkillsList = React.useMemo(() => {
    const raw = candidate?.jobOpening?.requiredSkills || candidate?.jobOpening?.skills || '';
    if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
    return raw
      .split(/[,;\n•|]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [candidate]);

  const matchedSkills: string[] = React.useMemo(() => {
    const list = liveAtsData?.skillsMatched || candidate?.atsAnalysis?.skillsMatched;
    return Array.isArray(list) ? list : [];
  }, [candidate, liveAtsData]);

  if (!candidate) return null;

  const candidateIdShort = candidate.id ? candidate.id.substring(0, 8) : 'CMT-2026';
  const appliedDateFormatted = candidate.createdAt
    ? new Date(candidate.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const displayScore =
    liveScore ??
    (candidate.atsAnalysis?.matchScore !== undefined && candidate.atsAnalysis?.matchScore !== null
      ? `${candidate.atsAnalysis.matchScore}%`
      : candidate.aiMatchScore !== null && candidate.aiMatchScore !== undefined
      ? `${candidate.aiMatchScore}%`
      : candidate.score && candidate.score !== '88%'
      ? candidate.score
      : 'N/A');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white font-mono text-[10px] uppercase">
                ID: {candidateIdShort}
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-semibold">
                {candidate.candidateType === 'FRESHER' ? 'Fresher' : 'Experienced'}
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{candidate.name || `${candidate.firstName} ${candidate.lastName}`}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{candidate.role || 'Applied Position'}</span>
              <span>•</span>
              <span className="font-mono text-indigo-300">Requisition: {candidate.reqCode || 'JR-2026-001'}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* Profile Overview Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Application Status</span>
              <Badge className="bg-indigo-100 text-indigo-800 text-[11px] font-bold mt-1">
                {candidate.stage || 'APPLIED'}
              </Badge>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Match Score</span>
              <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
                {displayScore}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Application Source</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 mt-1 block">
                {candidate.source || 'Careers Portal'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Applied Date</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 mt-1 block">
                {appliedDateFormatted}
              </span>
            </div>
          </div>

          {/* ATS Analysis Breakdown Card */}
          <AtsAnalysisCard
            candidateId={candidate.id}
            candidateName={candidate.name}
            jobTitle={candidate.role}
            resumePath={candidate.resumePath}
            onAnalysisLoaded={(atsData) => {
              setLiveAtsData(atsData);
              if (atsData && atsData.matchScore !== undefined) {
                setLiveScore(`${atsData.matchScore}%`);
              }
            }}
          />
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <User className="h-4 w-4 text-indigo-600" /> Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{candidate.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.currentLocation || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Qualification:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.qualification || 'Graduate'}</span>
              </div>
            </div>
          </div>

          {/* 2. Employment & Experience */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Building2 className="h-4 w-4 text-indigo-600" /> Experience & Employment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Experience</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {candidate.experience || (candidate.candidateType === 'FRESHER' ? 'Fresher (0 Years)' : 'N/A')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current / Last Company</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.currentCompany || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Notice Period</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.noticePeriod || 'Immediate / Not Specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current CTC</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {candidate.currentCtc != null && candidate.currentCtc !== '' && candidate.currentCtc !== 'N/A' ? (
                    Number(candidate.currentCtc) <= 100
                      ? `₹ ${(Number(candidate.currentCtc) * 100000).toLocaleString('en-IN')} (${Number(candidate.currentCtc).toFixed(1)} LPA)`
                      : `₹ ${Number(candidate.currentCtc).toLocaleString('en-IN')} (${(Number(candidate.currentCtc) / 100000).toFixed(1)} LPA)`
                  ) : (
                    'Not Disclosed'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Expected CTC</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {candidate.expectedCtc != null && candidate.expectedCtc !== '' && candidate.expectedCtc !== 'N/A' ? (
                    Number(candidate.expectedCtc) <= 100
                      ? `₹ ${(Number(candidate.expectedCtc) * 100000).toLocaleString('en-IN')} (${Number(candidate.expectedCtc).toFixed(1)} LPA)`
                      : `₹ ${Number(candidate.expectedCtc).toLocaleString('en-IN')} (${(Number(candidate.expectedCtc) / 100000).toFixed(1)} LPA)`
                  ) : (
                    'Not Disclosed'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Skills & Competencies */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Star className="h-4 w-4 text-indigo-600" /> Skills & Competencies
            </h4>

            {/* Candidate Profile Skills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 block text-[11px] font-semibold">
                  Candidate Profile Skills:
                </span>
                {candidateSkillsList.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {candidateSkillsList.length} skill{candidateSkillsList.length !== 1 ? 's' : ''} listed
                  </span>
                )}
              </div>
              {candidateSkillsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {candidateSkillsList.map((sk: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                    >
                      {sk}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  No candidate profile skills specified.
                </p>
              )}
            </div>

            {/* Requisition Required Skills */}
            {jobRequiredSkillsList.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[11px] font-semibold">
                    Requisition Required Skills ({candidate.role || 'Job'}):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {jobRequiredSkillsList.length} required
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobRequiredSkillsList.map((sk: string, i: number) => {
                    const isMatched = matchedSkills.some(
                      (m: string) => m.toLowerCase().trim() === sk.toLowerCase().trim()
                    );
                    return (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-[11px] font-semibold ${
                          isMatched
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isMatched && <span className="mr-1 text-emerald-600 font-bold">✓</span>}
                        {sk}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Resume & Attached Documents */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <FileText className="h-4 w-4 text-indigo-600" /> Resume & Documents
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                    {(() => {
                      if (!candidate.resumePath) return `${candidate.name || 'Candidate'}_Resume.pdf`;
                      const rawName = candidate.resumePath.split('/').pop() || '';
                      if (rawName.startsWith('blob:') || /^[a-f0-9-]{32,}$/i.test(rawName)) {
                        return `${candidate.name || 'Candidate'}_Resume.pdf`;
                      }
                      return rawName;
                    })()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Verified Candidate Resume Document</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={handleViewResume}
                title="Open resume PDF in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Resume
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-b-2xl">
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(candidate)}
              className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Candidate
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onStartScreening && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartScreening(candidate)}
                className="h-8 text-xs font-semibold text-indigo-600 border-indigo-300 hover:bg-indigo-50"
              >
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Screening Evaluation
              </Button>
            )}

            {onEdit && (
              <Button
                size="sm"
                onClick={() => onEdit(candidate)}
                className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs font-semibold">
              Close
            </Button>
          </div>
        </div>

        <ResumeViewerModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          candidateName={candidate.name}
          candidateEmail={candidate.email}
          candidatePhone={candidate.phone}
          candidateLocation={candidate.currentLocation}
          jobTitle={candidate.role}
          resumeUrl={candidate.resumePath}
          experienceYears={candidate.experience}
          qualification={candidate.qualification}
          skills={candidate.skills}
          notes={candidate.notes || candidate.coverLetter}
          score={candidate.score}
        />
      </DialogContent>
    </Dialog>
  );
};
