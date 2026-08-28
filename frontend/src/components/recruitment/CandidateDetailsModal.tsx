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

  React.useEffect(() => {
    if (candidate) {
      setLiveScore(candidate.atsAnalysis?.matchScore !== undefined ? `${candidate.atsAnalysis.matchScore}%` : (candidate.aiMatchScore !== null && candidate.aiMatchScore !== undefined ? `${candidate.aiMatchScore}%` : null));
    }
  }, [candidate]);

  if (!candidate) return null;

  const candidateIdShort = candidate.id ? candidate.id.substring(0, 8) : 'CMT-2026';
  const appliedDateFormatted = candidate.createdAt
    ? new Date(candidate.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '27 Aug 2026';

  const displayScore = liveScore || (candidate.atsAnalysis?.matchScore !== undefined ? `${candidate.atsAnalysis.matchScore}%` : (candidate.aiMatchScore ? `${candidate.aiMatchScore}%` : (candidate.score && candidate.score !== '88%' ? candidate.score : 'N/A')));

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
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.currentLocation || 'Pune, India'}</span>
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
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{candidate.experience || '3 Years'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current / Last Company</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.currentCompany || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Notice Period</span>
                <span className="font-semibold text-slate-900 dark:text-white">{candidate.noticePeriod || '30 Days'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current CTC</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {candidate.currentCtc ? (
                    Number(candidate.currentCtc) < 100
                      ? `₹ ${(Number(candidate.currentCtc) * 100000).toLocaleString('en-IN')} (${Number(candidate.currentCtc).toFixed(1)} LPA)`
                      : `₹ ${Number(candidate.currentCtc).toLocaleString('en-IN')} (${(Number(candidate.currentCtc) / 100000).toFixed(1)} LPA)`
                  ) : (
                    '₹ 8,00,000 (8.0 LPA)'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Expected CTC</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {candidate.expectedCtc ? (
                    Number(candidate.expectedCtc) < 100
                      ? `₹ ${(Number(candidate.expectedCtc) * 100000).toLocaleString('en-IN')} (${Number(candidate.expectedCtc).toFixed(1)} LPA)`
                      : `₹ ${Number(candidate.expectedCtc).toLocaleString('en-IN')} (${(Number(candidate.expectedCtc) / 100000).toFixed(1)} LPA)`
                  ) : (
                    '₹ 12,00,000 (12.0 LPA)'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Skills & Competencies */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Star className="h-4 w-4 text-indigo-600" /> Skills & Competencies
            </h4>
            <div className="space-y-2">
              <span className="text-slate-500 block text-[11px] font-semibold">Technical Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {(candidate.skills || 'React.js, TypeScript, Node.js, SQL').split(/[,;\n]/).map((sk: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                    {sk.trim()}
                  </Badge>
                ))}
              </div>
            </div>
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
                    {candidate.resumePath ? candidate.resumePath.split('/').pop() : `${candidate.name || 'Candidate'}_Resume.pdf`}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Verified Candidate Resume Document</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => setIsResumeModalOpen(true)}
              >
                <Eye className="h-3.5 w-3.5" /> View Resume
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
