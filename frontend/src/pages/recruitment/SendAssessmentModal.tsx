import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Send,
  Calendar,
  Clock,
  Award,
  HelpCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Briefcase,
  Users,
} from 'lucide-react';
import { assessmentsApi, type Assessment, type CandidateAssessmentAttempt } from '@/api/assessment-store';
import { candidatesApi } from '@/api/recruitment';
import { apiClient } from '@/lib/api-client';
import { useCompany } from '@/context/CompanyContext';

export interface CandidateTarget {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  appliedRole?: string;
  companyId?: string;
  branchId?: string;
}

interface SendAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: CandidateTarget | null;
  candidates?: CandidateTarget[];
  companyId?: string;
  branchId?: string;
  onSuccess?: (attempts: CandidateAssessmentAttempt[]) => void;
}

export function SendAssessmentModal({
  isOpen,
  onClose,
  candidate,
  candidates,
  companyId,
  branchId,
  onSuccess,
}: SendAssessmentModalProps) {
  const { activeCompanyId } = useCompany();

  // Consolidate candidate list
  const targetCandidates: CandidateTarget[] = React.useMemo(() => {
    if (Array.isArray(candidates) && candidates.length > 0) {
      return candidates;
    }
    if (candidate) {
      return [candidate];
    }
    return [];
  }, [candidate, candidates]);

  const isMulti = targetCandidates.length > 1;
  const primaryCandidate = targetCandidates[0] || null;

  const effectiveCompanyId = companyId || primaryCandidate?.companyId || activeCompanyId;
  const effectiveBranchId = branchId || primaryCandidate?.branchId;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');

  // Assessment Schedule Fields
  const [scheduledDate, setScheduledDate] = useState<string>('2026-08-30');
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('11:00');
  const [emailSendingMode, setEmailSendingMode] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');

  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [createdAttempts, setCreatedAttempts] = useState<CandidateAssessmentAttempt[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && effectiveCompanyId) {
      assessmentsApi
        .getAssessments(effectiveCompanyId, effectiveBranchId)
        .then((list) => {
          const activeList = list.filter((a) => a.status === 'Published' || a.status === 'Ready');
          setAssessments(activeList);

          const targetPositionLower = (primaryCandidate?.jobTitle || primaryCandidate?.appliedRole || '').toLowerCase();
          const matched =
            activeList.find(
              (a) =>
                (a.jobPosition && a.jobPosition.toLowerCase().includes(targetPositionLower)) ||
                (a.technology && targetPositionLower.includes(a.technology.toLowerCase()))
            ) || activeList[0];

          if (matched) {
            setSelectedAssessmentId(matched.id);
            setCustomExpiryDate(matched.expiryDate || '2026-10-30');
          } else {
            setSelectedAssessmentId('');
          }
        });

      setScheduledDate('2026-08-30');
      setScheduledStartTime('11:00');
      setEmailSendingMode('IMMEDIATE');
      setCreatedAttempts([]);
    }
  }, [isOpen, primaryCandidate, effectiveCompanyId, effectiveBranchId]);

  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  useEffect(() => {
    if (activeAssessment && targetCandidates.length > 0) {
      const subject = `Technical Assessment Invitation – ${activeAssessment.name}`;
      const emailNotice =
        emailSendingMode === 'SCHEDULED'
          ? `Notice: This invitation is scheduled to be dispatched on ${scheduledDate} at ${scheduledStartTime}.`
          : `Notice: This assessment is scheduled for ${scheduledDate} at ${scheduledStartTime}. The test link will unlock at the scheduled start time.`;

      const candidateGreeting = isMulti ? 'Hello [Candidate Name],' : `Hello ${primaryCandidate?.name || 'Candidate'},`;
      const roleName = primaryCandidate?.jobTitle || primaryCandidate?.appliedRole || activeAssessment.jobPosition || 'Technical';

      const body = `${candidateGreeting}

You have been invited to complete the technical assessment for the ${roleName} position.

Assessment Details:
• Assessment: ${activeAssessment.name}
• Scheduled Date: ${scheduledDate}
• Start Time: ${scheduledStartTime}
• Duration: ${activeAssessment.durationMins} Minutes
• Questions: ${activeAssessment.questionCount} Questions
• Passing Cutoff: ${activeAssessment.passingPercentage}%
• Expiry Date: ${customExpiryDate || activeAssessment.expiryDate}

${emailNotice} Please complete the assessment before the expiry date by clicking your private test link.

Regards,
Recruitment Team – Codigix ERP`;

      setEmailSubject(subject);
      setEmailBody(body);
    }
  }, [activeAssessment, targetCandidates, isMulti, primaryCandidate, customExpiryDate, scheduledDate, scheduledStartTime, emailSendingMode]);

  if (targetCandidates.length === 0) return null;

  const handleSendAssessment = async () => {
    if (!activeAssessment) {
      toast.error('Please select an assessment template to send');
      return;
    }

    setIsSending(true);

    try {
      const attempts = await assessmentsApi.assignAttempt(
        {
          assessmentId: activeAssessment.id,
          candidates: targetCandidates.map((c) => ({
            id: c.id,
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Candidate',
            email: c.email || 'candidate@example.com',
            phone: c.phone || '',
            jobTitle: c.jobTitle || c.appliedRole || activeAssessment.jobPosition || 'Candidate',
          })),
          scheduledDate,
          scheduledStartTime,
          durationMinutes: activeAssessment.durationMins,
          expiryDate: customExpiryDate || activeAssessment.expiryDate,
          emailSendingMode,
          companyId: effectiveCompanyId,
          branchId: effectiveBranchId,
        },
        effectiveCompanyId,
        effectiveBranchId
      );

      // Update candidate ATS stages
      for (const c of targetCandidates) {
        try {
          await candidatesApi.updateStage(c.id, 'ASSESSMENT_ASSIGNED' as any);
        } catch {
          // ignore
        }
      }

      // Try SMTP email dispatch for each candidate
      for (const att of attempts) {
        const testUrl = `${window.location.origin}/candidate-assessment/${att.token}`;
        try {
          await apiClient.post('/recruitment/offers/send-email', {
            candidateName: att.candidateName,
            candidateEmail: att.candidateEmail,
            jobPosition: att.jobPosition || activeAssessment.jobPosition,
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
            bodyText: emailBody.replace('[Candidate Name]', att.candidateName),
          });
        } catch {
          // SMTP non-blocking
        }
      }

      setCreatedAttempts(attempts);
      toast.success(
        isMulti
          ? `Successfully created assessment invitations for ${attempts.length} candidates in database!`
          : `Assessment invitation created in database for ${attempts[0]?.candidateName}!`
      );

      if (onSuccess) {
        onSuccess(attempts);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch assessment');
    } finally {
      setIsSending(false);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/candidate-assessment/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Assessment link copied to clipboard!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {isMulti ? <Users className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Send Technical Assessment</span>
                  {isMulti && (
                    <Badge className="bg-indigo-600 text-white text-[11px] px-2 py-0.5 font-semibold">
                      {targetCandidates.length} Candidates Selected
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {isMulti
                    ? `Dispatch individual assessment invitations with unique secure tokens for all ${targetCandidates.length} candidates.`
                    : 'Configure assessment schedule, email dispatch mode, and generate candidate test link.'}
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

        {createdAttempts.length === 0 ? (
          <div className="space-y-4 py-2">
            {/* Candidate Summary Box */}
            {isMulti ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" /> Selected Candidates ({targetCandidates.length})
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    Multi-Dispatch
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {targetCandidates.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                      </span>
                      <span className="text-[11px] text-slate-400">({c.email})</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {(primaryCandidate?.name || primaryCandidate?.firstName || 'C').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {primaryCandidate?.name || `${primaryCandidate?.firstName || ''} ${primaryCandidate?.lastName || ''}`.trim() || 'Candidate'}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-slate-400" /> {primaryCandidate?.email || 'candidate@example.com'}
                      <span>•</span>
                      <Briefcase className="h-3 w-3 text-slate-400" /> {primaryCandidate?.jobTitle || primaryCandidate?.appliedRole || 'Candidate'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                  Shortlisted
                </Badge>
              </div>
            )}

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
                        {a.name} ({a.technology || 'General'})
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

            {/* Assessment Schedule Section */}
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

              {/* Email Option Checkboxes */}
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
                    (Email dispatched at {scheduledDate} {scheduledStartTime})
                  </span>
                </label>
              </div>
            </div>

            {/* Assessment Highlights */}
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
                <span className="text-[10px] text-slate-400 font-normal">Personalized per candidate</span>
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
                  rows={4}
                  className="text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed"
                />
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS / INVITATIONS CREATED CONFIRMATION STATE */
          <div className="py-5 space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assessment Invitations Generated! ({createdAttempts.length})
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Each candidate received a distinct unique secure token stored in MySQL.
              </p>
            </div>

            {/* List of generated links */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {createdAttempts.map((att) => {
                const testUrl = `${window.location.origin}/candidate-assessment/${att.token}`;
                return (
                  <div
                    key={att.token}
                    className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {att.candidateName}
                        </span>
                        <span className="text-[11px] text-slate-400">({att.candidateEmail})</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                        {att.token}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={testUrl}
                        className="flex-1 h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1"
                        onClick={() => copyLink(att.token)}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                      <a href={testUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="h-8 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                          <ExternalLink className="h-3 w-3" /> Open
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
          {createdAttempts.length === 0 ? (
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
                {isSending
                  ? 'Dispatching...'
                  : isMulti
                  ? `Send to All ${targetCandidates.length} Candidates`
                  : emailSendingMode === 'SCHEDULED'
                  ? 'Schedule & Send Email'
                  : 'Send Email Now'}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              onClick={onClose}
            >
              Done & Return to ERP
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
