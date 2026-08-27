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

  const getBackendHost = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    }
    const hostname = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
    return `http://${hostname}:3001`;
  };

  // Normalize document URL
  const getFullResumeUrl = () => {
    if (!resumeUrl || typeof resumeUrl !== 'string') return null;
    const cleanUrl = resumeUrl.trim();
    if (!cleanUrl) return null;

    if (
      cleanUrl.startsWith('blob:') ||
      cleanUrl.startsWith('data:') ||
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('https://')
    ) {
      return cleanUrl;
    }

    const host = getBackendHost();

    if (cleanUrl.startsWith('/uploads')) {
      return `${host}${cleanUrl}`;
    }

    // Extract filename e.g. "resume (1).pdf"
    const filename = cleanUrl.split('/').pop() || cleanUrl;
    return `${host}/uploads/resumes/${filename}`;
  };

  const finalUrl = getFullResumeUrl();

  useEffect(() => {
    setIframeError(false);
    if (finalUrl && (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
      fetch(finalUrl, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok) setIframeError(true);
        })
        .catch(() => setIframeError(true));
    }
  }, [finalUrl]);

  const handleDownload = () => {
    if (finalUrl) {
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
            {finalUrl && (
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400" /> New Tab
              </a>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
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

        {/* Modal Body: PDF Iframe / Object or Structured Digital Resume Fallback */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950">
          {finalUrl && !iframeError ? (
            <div className="w-full h-[620px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <object
                data={finalUrl}
                type="application/pdf"
                className="w-full h-full border-0"
                onError={() => setIframeError(true)}
              >
                <iframe
                  src={finalUrl}
                  title={`${candidateName} Resume PDF`}
                  className="w-full h-full border-0"
                  onError={() => setIframeError(true)}
                />
              </object>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
              {/* Top Banner Notice if PDF URL not directly loadable */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Viewing parsed digital resume profile document for <strong>{candidateName}</strong>.</span>
                </div>
                {finalUrl && (
                  <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline text-amber-900 dark:text-amber-200">
                    Open File directly ↗
                  </a>
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
                    {experienceYears ? `${experienceYears} Years` : 'Fresher / Entry Level'}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
