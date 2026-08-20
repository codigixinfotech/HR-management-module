import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Video,
  Briefcase,
  CheckCircle2,
  FileText,
  User,
  Star,
  Users,
  RotateCcw,
  Check,
  ShieldCheck,
  Play,
  FileCheck,
  XCircle,
  ArrowRight,
  PauseCircle,
  AlertCircle,
  FileSignature,
} from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { interviewsApi } from '@/api/interviews';
import { useAuthStore } from '@/stores/auth-store';
import type { CandidateInterview } from '@/api/types';
import { ScheduleNextRoundModal } from './ScheduleNextRoundModal';

interface InterviewDetailsModalProps {
  interviewId: string | null;
  isOpen: boolean;
  onClose: () => void;
  activeEmployeeId?: string;
  activeEmployeeName?: string;
  onEditSchedule?: (interview: CandidateInterview) => void;
  onScheduleNextRoundSuccess?: (newInterviewId: string) => void;
}

export function InterviewDetailsModal({
  interviewId,
  isOpen,
  onClose,
  activeEmployeeId,
  activeEmployeeName,
  onEditSchedule,
  onScheduleNextRoundSuccess,
}: InterviewDetailsModalProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('overview');

  // HR Decision Modals State
  const [isNextRoundModalOpen, setIsNextRoundModalOpen] = useState(false);
  const [isSelectConfirmOpen, setIsSelectConfirmOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  // Fetch full interview details from DB
  const { data: interview, isLoading } = useQuery({
    queryKey: ['interview-detail', interviewId],
    queryFn: () => (interviewId ? interviewsApi.get(interviewId) : null),
    enabled: Boolean(interviewId && isOpen),
  });

  // Scorecard Evaluation Form State
  const [techRating, setTechRating] = useState<number>(4);
  const [commRating, setCommRating] = useState<number>(4);
  const [problemRating, setProblemRating] = useState<number>(4);
  const [expRating, setExpRating] = useState<number>(4);
  const [knowledgeRating, setKnowledgeRating] = useState<number>(4);

  const [strengths, setStrengths] = useState<string>('Strong technical foundation and clear communication.');
  const [weaknesses, setWeaknesses] = useState<string>('Requires minor alignment on system architecture patterns.');
  const [evalNotes, setEvalNotes] = useState<string>('Performed very well during live problem solving.');
  const [recommendation, setRecommendation] = useState<string>('Hire');
  const [selectedPanelistId, setSelectedPanelistId] = useState<string>('');

  // Auto-set selected panelist whenever interview or activeEmployeeId changes
  React.useEffect(() => {
    if (interview && interview.panelMembers.length > 0) {
      const isMeAssigned = interview.panelMembers.find((p) => p.interviewerId === activeEmployeeId);
      if (isMeAssigned) {
        setSelectedPanelistId(isMeAssigned.interviewerId);
      } else {
        setSelectedPanelistId(interview.panelMembers[0].interviewerId);
      }
    }
  }, [interview, activeEmployeeId]);

  // Determine active evaluator employee ID (guaranteed to be an assigned panel member)
  const effectiveEvaluatorId = useMemo(() => {
    if (selectedPanelistId && interview?.panelMembers.some((p) => p.interviewerId === selectedPanelistId)) {
      return selectedPanelistId;
    }
    if (interview && interview.panelMembers.length > 0) {
      const me = interview.panelMembers.find((p) => p.interviewerId === activeEmployeeId);
      if (me) return me.interviewerId;
      return interview.panelMembers[0].interviewerId;
    }
    return activeEmployeeId || '';
  }, [selectedPanelistId, interview, activeEmployeeId]);

  // Check if current user is an assigned panel member
  const isAssignedInterviewer = useMemo(() => {
    if (!interview || !effectiveEvaluatorId) return false;
    return interview.panelMembers.some((pm) => pm.interviewerId === effectiveEvaluatorId);
  }, [interview, effectiveEvaluatorId]);

  // Existing evaluation submitted by active interviewer
  const existingEvaluation = useMemo(() => {
    if (!interview || !effectiveEvaluatorId) return null;
    return interview.evaluations.find((e) => e.interviewerId === effectiveEvaluatorId) || null;
  }, [interview, effectiveEvaluatorId]);

  // Pre-fill form if evaluation already exists
  React.useEffect(() => {
    if (existingEvaluation) {
      setTechRating(existingEvaluation.technicalSkills);
      setCommRating(existingEvaluation.communication);
      setProblemRating(existingEvaluation.problemSolving);
      setExpRating(existingEvaluation.relevantExperience);
      setKnowledgeRating(existingEvaluation.roleKnowledge);
      setStrengths(existingEvaluation.strengths || '');
      setWeaknesses(existingEvaluation.weaknesses || '');
      setEvalNotes(existingEvaluation.interviewNotes || '');
      setRecommendation(existingEvaluation.recommendation);
    }
  }, [existingEvaluation]);

  // Calculate live average scorecard score
  const currentAverageRating = useMemo(() => {
    const avg = (techRating + commRating + problemRating + expRating + knowledgeRating) / 5;
    return Math.round(avg * 10) / 10;
  }, [techRating, commRating, problemRating, expRating, knowledgeRating]);

  // Overall Panel Score Average across all panel evaluations
  const panelOverallAverage = useMemo(() => {
    if (!interview || !interview.evaluations || interview.evaluations.length === 0) return 0;
    const sum = interview.evaluations.reduce((acc, ev) => acc + ev.overallRating, 0);
    return Math.round((sum / interview.evaluations.length) * 10) / 10;
  }, [interview]);

  // Submit Evaluation Mutation
  const submitEvaluationMutation = useMutation({
    mutationFn: (payload: any) => interviewsApi.submitEvaluation(interview!.id, payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['interview-detail', interviewId] });
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success(
        `Evaluation submitted successfully! Status updated to ${res.interviewStatus}.`,
      );
      setActiveTab('evaluations-breakdown');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit interview evaluation.');
    },
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, remarks }: { status: string; remarks?: string }) =>
      interviewsApi.updateStatus(interview!.id, { status, remarks }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-detail', interviewId] });
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      if (data.status === 'SELECTED') {
        const candName = interview?.candidate
          ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
          : 'Casey Stone';
        toast.success(`Candidate ${candName} SELECTED! Redirecting to Offers & Joining...`);

        onClose();

        const urlParams = new URLSearchParams({
          autoCreate: 'true',
          candidateId: interview?.candidateId || '',
          candidateName: candName,
          candidateEmail: interview?.candidate?.email || 'candidate34@example-mail.com',
          position: interview?.position || 'Product Designer',
          requisitionCode: interview?.requisitionCode || 'JR-2026-001',
          interviewCode: interview?.interviewCode || 'INT-2026-001',
        });

        navigate(`/recruitment/offers?${urlParams.toString()}`);
      } else if (data.status === 'REJECTED') {
        toast.error(
          `Candidate ${interview?.candidate ? `${interview.candidate.firstName} ${interview.candidate.lastName}` : 'Candidate'} REJECTED.`,
        );
      } else if (data.status === 'ON_HOLD') {
        toast.warning(
          `Candidate ${interview?.candidate ? `${interview.candidate.firstName} ${interview.candidate.lastName}` : 'Candidate'} placed ON HOLD.`,
        );
      } else if (data.status === 'NEXT_ROUND') {
        toast.info(
          `Next round initiated for ${interview?.candidate ? `${interview.candidate.firstName} ${interview.candidate.lastName}` : 'Candidate'}.`,
        );
      } else {
        toast.success(`Interview status updated to ${data.status}`);
      }
    },
  });

  const handleScorecardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview || !effectiveEvaluatorId) {
      toast.error('Unable to identify evaluator ID');
      return;
    }

    const assigned = interview.panelMembers.find((p) => p.interviewerId === effectiveEvaluatorId);
    const evaluatorName = assigned ? assigned.interviewerName : activeEmployeeName || 'Interviewer';

    submitEvaluationMutation.mutate({
      interviewerId: effectiveEvaluatorId,
      interviewerName: evaluatorName,
      technicalSkills: techRating,
      communication: commRating,
      problemSolving: problemRating,
      relevantExperience: expRating,
      roleKnowledge: knowledgeRating,
      strengths,
      weaknesses,
      interviewNotes: evalNotes,
      recommendation,
    });
  };

  const statusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'EVALUATED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 flex items-center gap-1 font-semibold">
            <Check className="h-3 w-3" /> Evaluated
          </Badge>
        );
      case 'SELECTED':
        return (
          <Badge className="bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-xs">
            <Check className="h-3.5 w-3.5 text-white" /> Selected
          </Badge>
        );
      case 'REJECTED':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 font-semibold">Rejected</Badge>;
      case 'NEXT_ROUND':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1 font-semibold">
            <Calendar className="h-3 w-3 text-blue-600" /> Next Round
          </Badge>
        );
      case 'ON_HOLD':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3" /> On Hold
          </Badge>
        );
      case 'EVALUATION_PENDING':
      case 'COMPLETED':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3" /> Evaluation Pending
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1 font-semibold">
            <Play className="h-3 w-3 text-blue-600" /> In Progress
          </Badge>
        );
      case 'CANCELLED':
        return <Badge className="bg-rose-500/15 text-rose-700 border-rose-300 font-semibold">Cancelled</Badge>;
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300 flex items-center gap-1 font-semibold">
            <Calendar className="h-3 w-3" /> Scheduled
          </Badge>
        );
    }
  };

  const recBadge = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return <Badge className="bg-emerald-600 text-white font-bold">Strong Hire</Badge>;
      case 'Hire':
        return <Badge className="bg-teal-600 text-white font-semibold">Hire</Badge>;
      case 'Hold':
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300">Hold</Badge>;
      default:
        return <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-300">Reject</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-border/80 gap-0">
        {isLoading || !interview ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Loading interview details and scorecard...
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-primary/15 text-primary rounded-md border border-primary/20">
                    {interview.interviewCode}
                  </span>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {interview.requisitionCode || 'JR-2026-001'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {interview.interviewFormat}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {statusBadge(interview.status)}
                  {panelOverallAverage > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 flex items-center gap-1 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {panelOverallAverage} / 5.0
                    </Badge>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">
                Candidate: {interview.candidate ? `${interview.candidate.firstName} ${interview.candidate.lastName}` : 'Candidate'}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-3">
                <Briefcase className="h-3.5 w-3.5 text-primary" /> Target Position: <strong>{interview.position}</strong>
                <span>•</span>
                <Calendar className="h-3.5 w-3.5 text-primary" /> Date & Time: <strong>{new Date(interview.interviewDate).toLocaleDateString('en-GB')}, {interview.startTime}</strong>
              </p>

              {/* INTERVIEWER ASSIGNMENT BANNERS */}
              {isAssignedInterviewer ? (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <strong className="text-emerald-800 dark:text-emerald-300 font-bold block">
                        You are assigned as {interview.panelMembers.find((p) => p.interviewerId === effectiveEvaluatorId)?.panelRole || 'Interviewer'} for this interview.
                      </strong>
                      <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">
                        Conduct candidate evaluation, log scorecard ratings, and submit hire recommendation.
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setActiveTab('scorecard')}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                  >
                    <FileCheck className="h-3.5 w-3.5" /> Evaluate Candidate
                  </Button>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-muted/40 border border-border/50 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      Mandatory Interview Panel: <strong>{interview.panelMembers.map((p) => p.interviewerName).join(', ')}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Bar for Status Progression */}
            <div className="px-6 py-2 bg-muted/20 border-b border-border/50 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                {interview.meetingLink && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 font-semibold" asChild>
                    <a href={interview.meetingLink.startsWith('http') ? interview.meetingLink : '#'} target="_blank" rel="noreferrer">
                      <Video className="h-3.5 w-3.5 text-primary" /> Join Interview Meeting
                    </a>
                  </Button>
                )}

                {interview.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ status: 'IN_PROGRESS' })}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 font-semibold"
                  >
                    <Play className="h-3.5 w-3.5" /> Start Interview
                  </Button>
                )}

                {(interview.status === 'IN_PROGRESS' || interview.status === 'SCHEDULED') && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ status: 'COMPLETED' })}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Conducted
                  </Button>
                )}
              </div>

              {onEditSchedule && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditSchedule(interview)}
                  className="h-7 text-xs gap-1 text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Edit Schedule & Panel
                </Button>
              )}
            </div>

            {/* HR FINAL REVIEW & DECISION CARD */}
            {(interview.status === 'EVALUATED' ||
              interview.status === 'SELECTED' ||
              interview.status === 'REJECTED' ||
              interview.status === 'NEXT_ROUND' ||
              interview.status === 'ON_HOLD' ||
              interview.evaluations.length > 0) && (
              <div className="mx-6 mt-4 p-4 rounded-xl border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-card to-background space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> HR Final Review & Decision Workflow
                      <Badge className="bg-primary/20 text-primary text-[10px]">
                        Evaluated → HR Final Review → Final Decision
                      </Badge>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Review overall panel scorecards ({interview.evaluations.length}/{interview.panelMembers.length} submitted) and execute final hiring decision.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-muted-foreground block font-semibold">Aggregated Rating</span>
                      <strong className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {panelOverallAverage} / 5.0
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block font-semibold">Consensus Recommendation</span>
                      <Badge className="bg-emerald-600 text-white font-bold text-xs">
                        {interview.evaluations.some((e) => e.recommendation === 'Strong Hire')
                          ? 'Strong Hire'
                          : 'Hire'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* HR ACTION BUTTONS / SELECTED STATE */}
                {interview.status === 'SELECTED' ? (
                  <div className="pt-2 pb-1 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Candidate Selected – Ready for Offers & Joining</span>
                    </div>

                    <div>
                      <Button
                        size="sm"
                        className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                        onClick={() => {
                          onClose();
                          const candName = interview.candidate
                            ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
                            : 'Selected Candidate';
                          const urlParams = new URLSearchParams({
                            autoCreate: 'true',
                            candidateId: interview.candidateId || '',
                            candidateName: candName,
                            candidateEmail: interview.candidate?.email || 'candidate@example.com',
                            position: interview.position || 'Product Designer',
                            requisitionCode: interview.requisitionCode || 'JR-2026-001',
                            interviewCode: interview.interviewCode || 'INT-2026-001',
                          });
                          navigate(`/recruitment/offers?${urlParams.toString()}`);
                        }}
                      >
                        <FileSignature className="h-4 w-4" /> Proceed to Offers & Joining →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. SELECT CANDIDATE */}
                      <Button
                        size="sm"
                        onClick={() => setIsSelectConfirmOpen(true)}
                        disabled={updateStatusMutation.isPending}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Select Candidate
                      </Button>

                      {/* 2. REJECT CANDIDATE */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectReason('');
                          setIsRejectDialogOpen(true);
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="h-8 text-xs font-bold gap-1.5 shadow-xs"
                      >
                        <XCircle className="h-4 w-4" /> Reject Candidate
                      </Button>

                      {/* 3. SCHEDULE NEXT ROUND */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsNextRoundModalOpen(true)}
                        disabled={updateStatusMutation.isPending}
                        className="h-8 text-xs font-bold gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <ArrowRight className="h-4 w-4" /> Schedule Next Round
                      </Button>

                      {/* 4. PUT ON HOLD */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setHoldReason('');
                          setIsHoldDialogOpen(true);
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="h-8 text-xs font-bold gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <PauseCircle className="h-4 w-4" /> Put On Hold
                      </Button>
                    </div>

                    {interview.status === 'REJECTED' && (
                      <Badge variant="destructive" className="text-xs px-3 py-1 font-bold">
                        ✗ Candidate Rejected
                      </Badge>
                    )}
                    {interview.status === 'ON_HOLD' && (
                      <Badge className="bg-amber-500 text-white text-xs px-3 py-1 font-bold">
                        ⏸ Candidate Placed On Hold
                      </Badge>
                    )}
                    {interview.status === 'NEXT_ROUND' && (
                      <Badge className="bg-blue-600 text-white text-xs px-3 py-1 font-bold">
                        ➔ Next Round Scheduled
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content Tabs */}
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="overview" className="text-xs">
                    Interview Specs & Panel
                  </TabsTrigger>
                  <TabsTrigger value="scorecard" className="text-xs">
                    Evaluate & Scorecard {existingEvaluation ? '(Submitted)' : ''}
                  </TabsTrigger>
                  <TabsTrigger value="evaluations-breakdown" className="text-xs">
                    Panel Evaluations Breakdown ({interview.evaluations.length})
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW & PANEL */}
                <TabsContent value="overview" className="space-y-4 text-xs">
                  {/* Candidate Summary Card */}
                  {interview.candidate && (
                    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <User className="h-4 w-4 text-primary" /> Candidate Profile Summary
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                        <div>
                          <span className="text-muted-foreground block">Email & Phone</span>
                          <strong className="text-foreground">{interview.candidate.email}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Qualification</span>
                          <strong className="text-foreground">{interview.candidate.qualification || 'B.Tech CS'}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Experience</span>
                          <strong className="text-foreground">{interview.candidate.experience || '5 Years'}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Current Stage</span>
                          <Badge className="bg-primary/15 text-primary">{interview.candidate.stage}</Badge>
                        </div>
                      </div>

                      {interview.candidate.resumePath && (
                        <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                          <span className="text-muted-foreground">Attached Resume:</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                            <a href={`#`} onClick={(e) => e.preventDefault()}>
                              <FileText className="h-3.5 w-3.5 text-primary" /> View Candidate Resume
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assigned Panel Members Roster */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" /> Assigned Interview Panel Members
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {interview.panelMembers.map((pm) => {
                        const hasEvaluated = interview.evaluations.some(
                          (e) => e.interviewerId === pm.interviewerId,
                        );
                        return (
                          <div
                            key={pm.id}
                            className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                                  {pm.interviewerName.charAt(0)}
                                </div>
                                <div>
                                  <strong className="text-xs font-semibold text-foreground block">
                                    {pm.interviewerName}
                                  </strong>
                                  <span className="text-[10px] text-muted-foreground block">
                                    {pm.designation || 'Panelist'} • {pm.department || 'HR'}
                                  </span>
                                </div>
                              </div>

                              <Badge variant="outline" className="text-[10px]">
                                {pm.panelRole}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                              <span className="text-muted-foreground">Evaluation Status:</span>
                              {hasEvaluated ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Submitted
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format & Notes */}
                  {interview.notes && (
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                        Interview Instructions / Focus Areas
                      </h4>
                      <div className="p-3 bg-muted/30 rounded-lg border text-foreground whitespace-pre-wrap">
                        {interview.notes}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 2: EVALUATE & SCORECARD FORM */}
                <TabsContent value="scorecard" className="space-y-4 text-xs">
                  <form onSubmit={handleScorecardSubmit} className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/30 rounded-xl border gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="text-xs font-bold text-foreground">Scorecard Evaluator:</Label>
                          {interview.panelMembers.length > 0 ? (
                            <Select value={effectiveEvaluatorId} onValueChange={setSelectedPanelistId}>
                              <SelectTrigger className="h-7 text-xs bg-background w-[240px]">
                                <SelectValue placeholder="Select Evaluator" />
                              </SelectTrigger>
                              <SelectContent>
                                {interview.panelMembers.map((pm) => (
                                  <SelectItem key={pm.interviewerId} value={pm.interviewerId} className="text-xs">
                                    {pm.interviewerName} ({pm.panelRole})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs font-bold text-primary">
                              {activeEmployeeName || 'Interviewer'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-1">
                          Rate candidate on 1–5 scale across core competencies.
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Live Average Score</span>
                        <strong className="text-base font-bold text-primary font-mono">{currentAverageRating} / 5.0</strong>
                      </div>
                    </div>

                    {/* 5 Rating Criteria Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-card">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold">Technical Skills (1–5):</Label>
                          <span className="font-bold text-primary font-mono">{techRating} ★</span>
                        </div>
                        <Slider
                          value={[techRating]}
                          onValueChange={(v) => setTechRating(v[0])}
                          min={1}
                          max={5}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold">Communication & Clarity (1–5):</Label>
                          <span className="font-bold text-primary font-mono">{commRating} ★</span>
                        </div>
                        <Slider
                          value={[commRating]}
                          onValueChange={(v) => setCommRating(v[0])}
                          min={1}
                          max={5}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold">Problem Solving & Logic (1–5):</Label>
                          <span className="font-bold text-primary font-mono">{problemRating} ★</span>
                        </div>
                        <Slider
                          value={[problemRating]}
                          onValueChange={(v) => setProblemRating(v[0])}
                          min={1}
                          max={5}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold">Relevant Experience (1–5):</Label>
                          <span className="font-bold text-primary font-mono">{expRating} ★</span>
                        </div>
                        <Slider
                          value={[expRating]}
                          onValueChange={(v) => setExpRating(v[0])}
                          min={1}
                          max={5}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold">Role Knowledge & Culture Fit (1–5):</Label>
                          <span className="font-bold text-primary font-mono">{knowledgeRating} ★</span>
                        </div>
                        <Slider
                          value={[knowledgeRating]}
                          onValueChange={(v) => setKnowledgeRating(v[0])}
                          min={1}
                          max={5}
                          step={1}
                        />
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Key Strengths</Label>
                        <Textarea
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          placeholder="Highlight candidate technical strengths or achievements..."
                          className="text-xs min-h-[60px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">Areas for Improvement / Weaknesses</Label>
                        <Textarea
                          value={weaknesses}
                          onChange={(e) => setWeaknesses(e.target.value)}
                          placeholder="Mention any skill gaps or areas requiring coaching..."
                          className="text-xs min-h-[60px]"
                        />
                      </div>
                    </div>

                    {/* Detailed Notes & Recommendation */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-semibold">Detailed Interviewer Notes</Label>
                        <Textarea
                          value={evalNotes}
                          onChange={(e) => setEvalNotes(e.target.value)}
                          placeholder="Enter summary notes from the live interview session..."
                          className="text-xs min-h-[50px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Final Recommendation *</Label>
                        <Select value={recommendation} onValueChange={setRecommendation}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Recommendation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Strong Hire" className="text-xs font-bold text-emerald-700">Strong Hire</SelectItem>
                            <SelectItem value="Hire" className="text-xs font-semibold text-teal-700">Hire</SelectItem>
                            <SelectItem value="Hold" className="text-xs text-amber-700">Hold / Re-evaluate</SelectItem>
                            <SelectItem value="Reject" className="text-xs text-rose-700">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        type="submit"
                        disabled={submitEvaluationMutation.isPending}
                        className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Submit Scorecard Evaluation
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>

                {/* TAB 3: PANEL EVALUATIONS BREAKDOWN */}
                <TabsContent value="evaluations-breakdown" className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                    <div>
                      <h4 className="font-bold text-foreground text-xs">Panel Scorecards Summary</h4>
                      <span className="text-[11px] text-muted-foreground">
                        {interview.evaluations.length} of {interview.panelMembers.length} evaluations submitted.
                      </span>
                    </div>

                    {panelOverallAverage > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block font-semibold">Aggregated Panel Rating</span>
                        <strong className="text-lg font-bold text-primary font-mono">{panelOverallAverage} / 5.0</strong>
                      </div>
                    )}
                  </div>

                  {/* List of Individual Scorecards */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {interview.evaluations.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl border border-border/60 bg-card space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {ev.interviewerName.charAt(0)}
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-foreground block">
                                {ev.interviewerName}
                              </strong>
                              <span className="text-[10px] text-muted-foreground block">
                                Submitted on {new Date(ev.submittedAt).toLocaleString('en-GB')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              Rating: {ev.overallRating}/5.0
                            </span>
                            {recBadge(ev.recommendation)}
                          </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-5 gap-2 text-[10px] text-center bg-muted/20 p-2 rounded-lg font-mono">
                          <div>
                            <span className="text-muted-foreground block text-[9px]">Tech</span>
                            <strong>{ev.technicalSkills} ★</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px]">Comm</span>
                            <strong>{ev.communication} ★</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px]">Problem</span>
                            <strong>{ev.problemSolving} ★</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px]">Exp</span>
                            <strong>{ev.relevantExperience} ★</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px]">Role</span>
                            <strong>{ev.roleKnowledge} ★</strong>
                          </div>
                        </div>

                        {/* Text Feedback */}
                        {(ev.strengths || ev.weaknesses || ev.interviewNotes) && (
                          <div className="space-y-1 text-[11px] pt-1">
                            {ev.strengths && (
                              <div>
                                <strong className="text-emerald-700 dark:text-emerald-400">Strengths:</strong> {ev.strengths}
                              </div>
                            )}
                            {ev.weaknesses && (
                              <div>
                                <strong className="text-amber-700 dark:text-amber-400">Weaknesses:</strong> {ev.weaknesses}
                              </div>
                            )}
                            {ev.interviewNotes && (
                              <div>
                                <strong className="text-foreground">Notes:</strong> {ev.interviewNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {interview.evaluations.length === 0 && (
                      <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                        No panel evaluations submitted yet for this interview.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="p-4 bg-muted/30 border-t border-border/60">
              <Button variant="secondary" size="sm" onClick={onClose} className="h-8 text-xs">
                Close Details
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

      {/* CONFIRMATION DIALOG: SELECT CANDIDATE */}
      <Dialog open={isSelectConfirmOpen} onOpenChange={setIsSelectConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Confirm Candidate Selection
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to select{' '}
              <strong>
                {interview?.candidate
                  ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
                  : 'Casey Stone'}
              </strong>{' '}
              for the position of <strong>{interview?.position || 'Product Designer'}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
            <span className="font-semibold block">Workflow Progression:</span>
            <span>Interview → Selected → Offer & Joining</span>
            <p className="text-[11px] opacity-90">
              The candidate will be moved to <strong>Selected</strong> stage and immediately made available in the <strong>Offers & Joining</strong> module for offer letter generation.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsSelectConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
              onClick={() => {
                setIsSelectConfirmOpen(false);
                updateStatusMutation.mutate({ status: 'SELECTED' });
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: REJECT CANDIDATE */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Reject Candidate
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Specify reason for rejecting{' '}
              <strong>
                {interview?.candidate
                  ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
                  : 'Candidate'}
              </strong>:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">Rejection Reason / Remarks</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter HR rejection rationale or skill mismatch notes..."
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs font-bold gap-1"
              onClick={() => {
                setIsRejectDialogOpen(false);
                updateStatusMutation.mutate({ status: 'REJECTED', remarks: rejectReason });
              }}
            >
              <XCircle className="h-4 w-4" /> Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: PUT ON HOLD */}
      <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-600 flex items-center gap-2">
              <PauseCircle className="h-5 w-5" /> Put Candidate On Hold
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Enter hold rationale for{' '}
              <strong>
                {interview?.candidate
                  ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
                  : 'Candidate'}
              </strong>:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">Hold Reason / Future Alignment Notes</Label>
            <Textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="e.g. Awaiting headcount approval or comparing against upcoming candidates..."
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsHoldDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1"
              onClick={() => {
                setIsHoldDialogOpen(false);
                updateStatusMutation.mutate({ status: 'ON_HOLD', remarks: holdReason });
              }}
            >
              <PauseCircle className="h-4 w-4" /> Confirm Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SCHEDULE NEXT ROUND FORM MODAL */}
      <ScheduleNextRoundModal
        isOpen={isNextRoundModalOpen}
        onClose={() => setIsNextRoundModalOpen(false)}
        previousInterview={interview}
        onSuccess={(newId) => {
          setIsNextRoundModalOpen(false);
          onClose();
          if (onScheduleNextRoundSuccess) {
            onScheduleNextRoundSuccess(newId);
          }
        }}
      />
    </>
  );
}
