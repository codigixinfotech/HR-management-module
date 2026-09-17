import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  Printer,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getFullResumeUrl as resolveResumeUrl, openResumeInNewTab } from '@/utils/resume-url.util';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
  jobTitle?: string;
  resumeUrl?: string | null;
  experienceYears?: number | string;
  qualification?: string;
  skills?: string;
  notes?: string;
  score?: number | string;
}

export const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({
  isOpen,
  onClose,
  candidateName = 'Candidate',
  candidateEmail,
  candidatePhone,
  candidateLocation,
  jobTitle = 'Applied Position',
  resumeUrl,
  experienceYears,
  qualification,
  skills,
  notes,
  score,
}) => {
  const [iframeError, setIframeError] = useState(false);

  // Use the shared utility to build a full URL including the backend server origin.
  // This is critical on live/production where there is no Vite dev proxy to forward
  // relative /api/ paths to port 3001 — the shared util always prepends the backend host.
  const finalUrl = resolveResumeUrl(resumeUrl, candidateName);
  const isWordDoc = Boolean(finalUrl && (finalUrl.toLowerCase().endsWith('.docx') || finalUrl.toLowerCase().endsWith('.doc')));

  useEffect(() => {
    setIframeError(false);
    if (!finalUrl) {
      setIframeError(true);
      return;
    }

    if (finalUrl.startsWith('blob:')) {
      fetch(finalUrl)
        .then((res) => {
          if (!res.ok) setIframeError(true);
        })
        .catch(() => setIframeError(true));
      return;
    }

    if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
      fetch(finalUrl, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok && res.status !== 405 && res.status !== 403) setIframeError(true);
        })
        .catch(() => {
          // Keep default if HEAD is blocked by CORS
        });
    }
  }, [finalUrl]);

  const handleDownload = async () => {
    if (finalUrl) {
      try {
        const toastId = toast.loading(`Preparing resume download...`);
        const res = await fetch(finalUrl);
        if (res.ok) {
          const blob = await res.blob();
          const mimeType = isWordDoc
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf';
          const fileBlob = new Blob([blob], { type: mimeType });
          const blobUrl = URL.createObjectURL(fileBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = isWordDoc
            ? `${candidateName.replace(/\s+/g, '_')}_Resume.docx`
            : `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          toast.success(`Downloaded resume for ${candidateName}`, { id: toastId });
          return;
        }
      } catch (err) {
        console.warn('Direct blob download fallback:', err);
      }
      const link = document.createElement('a');
      link.href = finalUrl;
      link.target = '_blank';
      link.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading resume for ${candidateName}`);
    } else {
      // Generate text download fallback
      const textContent = `RESUME DOCUMENT - ${candidateName}\nPosition: ${jobTitle}\nEmail: ${candidateEmail || 'N/A'}\nPhone: ${candidatePhone || 'N/A'}\nLocation: ${candidateLocation || 'N/A'}\nExperience: ${experienceYears || 0} Years\nQualification: ${qualification || 'N/A'}\nSkills: ${skills || 'N/A'}\n\nNotes / Application:\n${notes || 'No additional notes'}`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName.replace(/\s+/g, '_')}_Profile.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded candidate profile text summary for ${candidateName}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800">
        {/* Header Toolbar */}
        <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                Resume Document Preview — {candidateName}
              </DialogTitle>
              <p className="text-xs text-slate-300">
                Applied for <strong>{jobTitle}</strong> {score ? `• ATS Score: ${score}%` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {finalUrl && !iframeError && !isWordDoc && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => openResumeInNewTab(resumeUrl || finalUrl, candidateName)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors h-8 border-0"
                title="Open original PDF directly in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400" /> New Tab
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              <Download className="h-3.5 w-3.5" /> {isWordDoc ? 'Download Word (.docx)' : finalUrl && !iframeError ? 'Download PDF' : 'Download Profile'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handlePrint}
              className="h-8 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body: Verified Digital Candidate Profile Card with Direct PDF Open Actions */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
            {/* Top Banner Notice with Direct New Tab Launch Button */}
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>
                  {finalUrl
                    ? `Candidate resume document attached. Click below to view the original PDF directly in a new browser tab.`
                    : `Viewing verified digital candidate profile summary for ${candidateName}.`}
                </span>
              </div>
              {finalUrl && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openResumeInNewTab(resumeUrl || finalUrl, candidateName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs h-8 border-0"
                  title="Open original PDF in a clean new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Full PDF in New Tab ↗
                </Button>
              )}
            </div>

              {/* Candidate Profile Header Card */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{candidateName}</h2>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{jobTitle}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {candidateEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-indigo-500" /> {candidateEmail}
                      </span>
                    )}
                    {candidatePhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-indigo-500" /> {candidatePhone}
                      </span>
                    )}
                    {candidateLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" /> {candidateLocation}
                      </span>
                    )}
                  </div>
                </div>

                {score && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-2xl text-center self-start shrink-0">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase block">ATS Match Score</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">{score}%</span>
                  </div>
                )}
              </div>

              {/* 1. Experience & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Relevant Experience
                  </span>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white">
                    {experienceYears !== null && experienceYears !== undefined
                      ? Number(experienceYears) === 0
                        ? '0 Years / Fresher'
                        : `${experienceYears} Years`
                      : 'Not Found in Resume'}
                  </strong>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Qualification
                  </span>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white">
                    {qualification || 'Graduate'}
                  </strong>
                </div>
              </div>

              {/* 2. Key Skills & Technologies */}
              {skills && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Technical Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.split(/[,;\n]/).map((sk, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold border border-indigo-200">
                        {sk.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Cover Letter / Application Summary Notes */}
              {notes && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Application Notes / Cover Letter
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl italic border border-slate-100 dark:border-slate-800 whitespace-pre-line">
                    {notes}
                  </p>
                </div>
              )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
