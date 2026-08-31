import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Send,
  Mail,
  Clock,
  HelpCircle,
  Award,
  Calendar,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  RotateCcw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { assessmentStore, type Assessment, type CandidateAssessmentAttempt } from '@/api/assessment-store';
import { candidatesApi } from '@/api/recruitment';
import { apiClient } from '@/lib/api-client';

interface SendAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    jobTitle?: string;
    appliedRole?: string;
  } | null;
  onSuccess?: (attempt: CandidateAssessmentAttempt) => void;
}

export function SendAssessmentModal({ isOpen, onClose, candidate, onSuccess }: SendAssessmentModalProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  
  // Assessment Schedule Fields
  const [scheduledDate, setScheduledDate] = useState<string>('2026-08-30');
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('11:00');
  const [emailSendingMode, setEmailSendingMode] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');

  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [createdAttempt, setCreatedAttempt] = useState<CandidateAssessmentAttempt | null>(null);
  const [isSending, setIsSending] = useState(false);

  const candidateName = candidate
    ? candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate'
    : 'Candidate';
  const candidateEmail = candidate?.email || 'candidate@example.com';
  const jobPosition = candidate?.jobTitle || candidate?.appliedRole || 'Full Stack Engineer';

  useEffect(() => {
    if (isOpen) {
      const list = assessmentStore.getAssessments().filter((a) => a.status === 'Published' || a.status === 'Ready');
      setAssessments(list);

      const targetPositionLower = (jobPosition || '').toLowerCase();
      const matched =
        list.find(
          (a) =>
            (a.jobPosition && (a.jobPosition || '').toLowerCase().includes(targetPositionLower)) ||
            (a.technology && targetPositionLower.includes((a.technology || '').toLowerCase()))
        ) || list[0];

      if (matched) {
        setSelectedAssessmentId(matched.id);
        setCustomExpiryDate(matched.expiryDate || '2026-10-30');
      }

      setScheduledDate('2026-08-30');
      setScheduledStartTime('11:00');
      setEmailSendingMode('IMMEDIATE');
      setCreatedAttempt(null);
    }
  }, [isOpen, candidate, jobPosition]);

  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  useEffect(() => {
    if (activeAssessment && candidate) {
      const subject = `Technical Assessment Invitation – ${activeAssessment.name}`;
      const emailNotice =
        emailSendingMode === 'SCHEDULED'
          ? `Notice: This invitation is scheduled to be dispatched on ${scheduledDate} at ${scheduledStartTime}.`
          : `Notice: This assessment is scheduled for ${scheduledDate} at ${scheduledStartTime}. The test link will unlock at the scheduled start time.`;

      const body = `Hello ${candidateName},

You have been invited to complete the technical assessment for the ${jobPosition} position.

Assessment Details:
• Assessment: ${activeAssessment.name}
• Scheduled Date: ${scheduledDate}
• Start Time: ${scheduledStartTime}
• Duration: ${activeAssessment.durationMins} Minutes
• Questions: ${activeAssessment.questionCount} Questions
• Passing Cutoff: ${activeAssessment.passingPercentage}%
• Expiry Date: ${customExpiryDate || activeAssessment.expiryDate}

${emailNotice} Please complete the assessment before the expiry date by clicking the link below.

Regards,
Recruitment Team – Codigix ERP`;

      setEmailSubject(subject);
      setEmailBody(body);
    }
  }, [activeAssessment, candidate, candidateName, jobPosition, customExpiryDate, scheduledDate, scheduledStartTime, emailSendingMode]);

  if (!candidate) return null;

  const handleSendAssessment = async () => {
    if (!activeAssessment) {
      toast.error('Please select an assessment template to send');
      return;
    }

    setIsSending(true);

    try {
      const attempt = assessmentStore.createCandidateAttempt({
        assessmentId: activeAssessment.id,
        candidateId: candidate.id,
        candidateName,
        candidateEmail,
        jobPosition,
        expiryDate: customExpiryDate || activeAssessment.expiryDate,
        scheduledDate,
        scheduledStartTime,
        durationMinutes: activeAssessment.durationMins,
        emailSendingMode,
      });

      const testUrl = `${window.location.origin}/candidate-assessment/${attempt.token}`;

      // Update candidate ATS status
      try {
        await candidatesApi.updateStage(candidate.id, 'ASSESSMENT_ASSIGNED' as any);
      } catch (err) {
        console.warn('Sync stage warning', err);
      }

      let emailSuccess = true;
      let emailErrorMsg = '';

      // Trigger backend SMTP email dispatch
      try {
        const res = await apiClient.post('/recruitment/offers/send-email', {
          candidateName,
          candidateEmail,
          jobPosition,
          assessmentName: activeAssessment.name,
          scheduledDate,
          scheduledStartTime,
          durationMins: activeAssessment.durationMins,
          questionCount: activeAssessment.questionCount,
          passingPercentage: activeAssessment.passingPercentage,
          expiryDate: customExpiryDate || activeAssessment.expiryDate,
          testUrl,
          emailSendingMode,
          subject: emailSubject,
          bodyText: emailBody,
        });

        if (res.data?.success === false) {
          emailSuccess = false;
          emailErrorMsg = res.data.error || res.data.message || 'SMTP Authentication Failed';
        }
      } catch (err: any) {
        emailSuccess = false;
        emailErrorMsg = err.response?.data?.message || err.message || 'SMTP Connection Error';
      }

      setCreatedAttempt(attempt);

      if (emailSuccess) {
        toast.success(`Assessment invitation email sent via SMTP to ${candidateEmail}!`);
      } else {
        toast.error(`Gmail SMTP Delivery Failed: ${emailErrorMsg}`, { duration: 6000 });
      }

      if (onSuccess) {
        onSuccess(attempt);
      }
    } catch (err: any) {
      toast.error('Failed to dispatch assessment email');
    } finally {
      setIsSending(false);
    }
  };

  const candidateTestUrl = createdAttempt
    ? `${window.location.origin}/candidate-assessment/${createdAttempt.token}`
    : '';

  const copyTestLink = () => {
    if (!candidateTestUrl) return;
    navigator.clipboard.writeText(candidateTestUrl);
    toast.success('Candidate Assessment link copied to clipboard!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Send Technical Assessment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Configure assessment schedule, email dispatch mode, and generate candidate test link
                </DialogDescription>
              </div>
            </div>
            {activeAssessment && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-xs">
                {activeAssessment.technology}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {!createdAttempt ? (
          <div className="space-y-4 py-2">
            {/* Candidate Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {candidateName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{candidateName}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3 text-slate-400" /> {candidateEmail}
                    <span>•</span>
                    <Briefcase className="h-3 w-3 text-slate-400" /> {jobPosition}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                Shortlisted
              </Badge>
            </div>

            {/* Assessment Selector & Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Assessment Template</Label>
                <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-800">
                    <SelectValue placeholder="Choose assessment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.name} ({a.technology})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custom Expiry Date</Label>
                <input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>
            </div>

            {/* ── NEW: ASSESSMENT SCHEDULE SECTION ── */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600" /> Assessment Schedule
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Scheduled Date</Label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Start Time</Label>
                  <input
                    type="time"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Test Duration</Label>
                  <div className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-indigo-600 flex items-center">
                    {activeAssessment?.durationMins || 60} Minutes
                  </div>
                </div>
              </div>

              {/* Email Option Checkboxes / Radios */}
              <div className="pt-1.5 space-y-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="emailSendingMode"
                    checked={emailSendingMode === 'IMMEDIATE'}
                    onChange={() => setEmailSendingMode('IMMEDIATE')}
                    className="h-3.5 w-3.5 text-indigo-600 accent-indigo-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Send invitation email immediately
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Email sent now; candidate can take test starting {scheduledDate} at {scheduledStartTime})
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="emailSendingMode"
                    checked={emailSendingMode === 'SCHEDULED'}
                    onChange={() => setEmailSendingMode('SCHEDULED')}
                    className="h-3.5 w-3.5 text-indigo-600 accent-indigo-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Schedule email for assessment start time
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Email will be dispatched automatically at {scheduledDate} {scheduledStartTime})
                  </span>
                </label>
              </div>
            </div>

            {/* Assessment Details Highlights Grid */}
            {activeAssessment && (
              <div className="grid grid-cols-4 gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Questions</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                    <HelpCircle className="h-3.5 w-3.5" /> {activeAssessment.questionCount} Qs
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Duration</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5" /> {activeAssessment.durationMins} Mins
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Passing Cutoff</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                    <Award className="h-3.5 w-3.5" /> {activeAssessment.passingPercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Marks</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {activeAssessment.totalMarks || 50} Pts
                  </p>
                </div>
              </div>
            )}

            {/* Email Preview Section */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Email Invitation Preview</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-formatted email template</span>
              </Label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={5}
                  className="text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed"
                />
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS / SENT CONFIRMATION STATE */
          <div className="py-6 space-y-5 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assessment Scheduled for {createdAttempt.candidateName}!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {emailSendingMode === 'SCHEDULED'
                  ? `Email scheduled to dispatch automatically at ${scheduledDate} ${scheduledStartTime} to ${createdAttempt.candidateEmail}.`
                  : `Invitation email sent immediately to ${createdAttempt.candidateEmail}.`} Candidate stage updated to <Badge className="bg-purple-100 text-purple-700 font-mono text-[10px]">ASSESSMENT_ASSIGNED</Badge>.
              </p>
            </div>

            {/* Candidate Unique Test Link Box */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-left">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Unique Candidate Assessment Link</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Token: {createdAttempt.token}</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={candidateTestUrl}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-indigo-600 dark:text-indigo-400"
                />
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9" onClick={copyTestLink}>
                  <Copy className="h-3.5 w-3.5" /> Copy Link
                </Button>
                <a href={candidateTestUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Test
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
          {!createdAttempt ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5"
                onClick={handleSendAssessment}
                disabled={isSending}
              >
                <Send className="h-3.5 w-3.5" />
                {emailSendingMode === 'SCHEDULED' ? 'Schedule & Send Email' : 'Send Email Now'}
              </Button>
            </>
          ) : (
            <Button size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs" onClick={onClose}>
              Done & Return to ERP
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
