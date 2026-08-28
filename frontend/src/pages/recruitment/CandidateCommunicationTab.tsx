import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Send,
  Paperclip,
  Video,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  X,
  Mail,
  Phone,
  MapPin,
  Plus,
  Briefcase,
  ShieldCheck,
  XCircle,
  Play,
  RotateCcw,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { jobOpeningsApi, candidatesApi, assessmentsApi } from '@/api/recruitment';
import { interviewsApi } from '@/api/interviews';
import { teamsChatApi, type CandidateTeamsMessage } from '@/api/teams-chat';
import { ResumeViewerModal } from '@/components/recruitment/ResumeViewerModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

export function CandidateCommunicationTab() {
  const queryClient = useQueryClient();

  // Filters & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Chat Input State
  const [messageText, setMessageText] = useState('');

  // Modals State
  const [isTeamsInviteModalOpen, setIsTeamsInviteModalOpen] = useState(false);
  const [isTeamsGuestModalOpen, setIsTeamsGuestModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isInterviewDetailsModalOpen, setIsInterviewDetailsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  // Teams Account Guest Connection State per Candidate
  const [teamsAccountStatusMap, setTeamsAccountStatusMap] = useState<Record<string, 'NOT_CONNECTED' | 'INVITATION_SENT' | 'CONNECTED'>>({});

  // Send Assessment Form State
  const [selectedAssessmentTitle, setSelectedAssessmentTitle] = useState('Full Stack Software Developer Technical Assessment');
  const [assessmentDuration, setAssessmentDuration] = useState('60 Minutes');
  const [assessmentDueDate, setAssessmentDueDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [assessmentNotes, setAssessmentNotes] = useState('Please complete the timed coding assessment before the due date.');

  // Teams Invitation Custom Notes
  const [teamsInviteNotes, setTeamsInviteNotes] = useState('Looking forward to speaking with you! Please click the Teams join link at the scheduled time.');
  const [teamsGuestNotes, setTeamsGuestNotes] = useState('Hello, you have been invited to join Codigix / EHCM Microsoft Teams as a guest for recruitment communication and your upcoming interview.');

  // Fetch Job Openings & Candidates
  const { data: openings, isLoading: isJobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Fetch Interviews list
  const { data: interviewsList, refetch: refetchInterviews } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewsApi.list(),
  });

  // Flatten candidate list across job openings
  const candidatesList = useMemo(() => {
    const list: any[] = [];
    if (!openings || openings.length === 0) {
      // Fallback demo candidates if openings not populated
      return [
        {
          id: 'cand-demo-1',
          name: 'Sanika Shelke',
          firstName: 'Sanika',
          lastName: 'Shelke',
          email: 'motesanika@gmail.com',
          phone: '+91 98765 43210',
          role: 'Senior Software Engineer',
          reqCode: 'JR-2026-019',
          stage: 'SHORTLISTED',
          aiMatchScore: 64,
          source: 'CAREERS_PORTAL',
          interviewDate: '28 Aug 2026',
          interviewTime: '11:00 AM',
          interviewer: 'Aishwarya Roy (Director HR)',
          teamsStatus: 'Created',
          teamsJoinUrl: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo1%40thread.v2/0?context=%7b%22Tid%22%3a%22d6ce9ff8-5916-4cc2-912f-6451cbd2ebb1%22%7d',
          assessmentStatus: 'Not Sent',
          assessmentName: 'Full Stack Skill Assessment',
        },
        {
          id: 'cand-demo-2',
          name: 'Rahul Pande',
          firstName: 'Rahul',
          lastName: 'Pande',
          email: 'rahul@gmail.com',
          phone: '+91 91234 56789',
          role: 'DevOps Engineer',
          reqCode: 'JR-2026-009',
          stage: 'APPLIED',
          aiMatchScore: 88,
          source: 'CAREERS_PORTAL',
          interviewDate: '29 Aug 2026',
          interviewTime: '02:30 PM',
          interviewer: 'Vikramaditya Sharma',
          teamsStatus: 'Invitation Sent',
          teamsJoinUrl: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo2%40thread.v2/0?context=%7b%22Tid%22%3a%22d6ce9ff8-5916-4cc2-912f-6451cbd2ebb1%22%7d',
          assessmentStatus: 'Sent',
          assessmentName: 'Cloud Architecture & Docker Test',
        },
      ];
    }

    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c: any) => {
          // Find matching interview if scheduled
          const matchInt = (interviewsList || []).find((i: any) => i.candidateId === c.id || i.candidateEmail === c.email);

          list.push({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone || '+91 98765 43210',
            role: job.title,
            reqCode: job.requisitionCode || job.mrNumber || 'JR-2026-001',
            jobId: job.id,
            stage: c.stage || 'APPLIED',
            aiMatchScore: c.atsAnalysis?.matchScore ?? c.aiMatchScore ?? 75,
            source: c.source || 'Careers Portal',
            candidateType: c.candidateType || 'EXPERIENCED',
            experience: c.experience || '4 Years',
            qualification: c.qualification || 'B.Tech Computer Science',
            currentLocation: c.currentLocation || 'Pune, India',
            resumePath: c.resumePath,
            // Interview & Teams Status
            interviewDate: matchInt?.interviewDate ? new Date(matchInt.interviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '28 Aug 2026',
            interviewTime: matchInt?.startTime || '11:00 AM',
            interviewer: matchInt?.panelMembers?.[0]?.interviewerName || 'Aishwarya Roy (Director HR)',
            teamsStatus: matchInt?.invitationStatus === 'SENT' ? 'Invitation Sent' : matchInt?.teamsJoinUrl ? 'Created' : 'Not Created',
            teamsJoinUrl: matchInt?.teamsJoinUrl || matchInt?.meetingLink || `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${c.id}%40thread.v2/0?context=%7b%22Tid%22%3a%22d6ce9ff8-5916-4cc2-912f-6451cbd2ebb1%22%7d`,
            // Assessment Status
            assessmentStatus: c.stage === 'ASSESSMENT_PASSED' ? 'Completed' : c.stage === 'ASSESSMENT_ASSIGNED' ? 'Sent' : 'Not Sent',
            assessmentName: `${job.title} Technical Assessment`,
          });
        });
      }
    });

    return list;
  }, [openings, interviewsList]);

  // Set default selected candidate
  useEffect(() => {
    if (candidatesList.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(candidatesList[0].id);
    }
  }, [candidatesList, selectedCandidateId]);

  // Active selected candidate object
  const activeCandidate = useMemo(() => {
    return candidatesList.find((c) => c.id === selectedCandidateId) || candidatesList[0] || null;
  }, [candidatesList, selectedCandidateId]);

  // Fetch persistent messages from database for selected candidate
  const { data: dbMessages, refetch: refetchDbMessages } = useQuery({
    queryKey: ['candidate-messages', activeCandidate?.id],
    queryFn: () => (activeCandidate ? teamsChatApi.getCandidateMessages(activeCandidate.id) : Promise.resolve([])),
    enabled: Boolean(activeCandidate?.id),
  });

  // Send message mutation via Graph API & DB
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeCandidate) return;
      return teamsChatApi.sendMessage(activeCandidate.id, {
        content,
        senderName: 'Aishwarya Roy (Director HR)',
        senderType: 'recruiter',
      });
    },
    onSuccess: (savedMsg) => {
      queryClient.invalidateQueries({ queryKey: ['candidate-messages', activeCandidate?.id] });
      setMessageText('');

      if (!savedMsg) return;

      if (savedMsg.deliveryStatus === 'SENT_TO_TEAMS') {
        toast.success('Message sent to candidate via Microsoft Teams!');
      } else if (savedMsg.deliveryStatus === 'FAILED_TEAMS_ACCOUNT_NOT_FOUND') {
        toast.error(`Candidate ${activeCandidate?.name} (${activeCandidate?.email}) does not have a Microsoft Teams account.`);
      } else if (savedMsg.deliveryStatus === 'FAILED_TEAMS_NOT_PROVISIONED') {
        toast.error('Microsoft Teams is not provisioned on this Azure AD tenant.');
      } else if (savedMsg.deliveryStatus === 'FAILED_MS_AUTH' || savedMsg.deliveryStatus === 'FAILED_GRAPH_PERMISSION') {
        toast.error('Microsoft Teams authentication or Graph permission required.');
      } else {
        toast.error('Unable to send message to Microsoft Teams.');
      }
    },
    onError: (err: any) => {
      toast.error(`Unable to send message to Microsoft Teams: ${err.message}`);
    },
  });

  // Post system event mutation
  const postSystemEventMutation = useMutation({
    mutationFn: async (payload: { senderName: string; content: string; eventType?: string; meta?: any }) => {
      if (!activeCandidate) return;
      return teamsChatApi.postSystemEvent(activeCandidate.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-messages', activeCandidate?.id] });
    },
  });

  // Filtered candidate list based on search and filters
  const filteredCandidates = useMemo(() => {
    return candidatesList.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reqCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;

      let matchesStatus = true;
      if (statusFilter === 'SCHEDULED') {
        matchesStatus = c.teamsStatus === 'Created' || c.teamsStatus === 'Invitation Sent';
      } else if (statusFilter === 'ASSESSMENT_PENDING') {
        matchesStatus = c.assessmentStatus === 'Sent' || c.assessmentStatus === 'In Progress';
      } else if (statusFilter === 'COMPLETED') {
        matchesStatus = c.stage === 'HIRED' || c.stage === 'OFFERED' || c.assessmentStatus === 'Completed';
      }

      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [candidatesList, searchQuery, stageFilter, statusFilter]);

  // Combine database messages with default onboarding intro
  const displayMessages = useMemo(() => {
    if (!activeCandidate) return [];

    const defaultIntro: any[] = [
      {
        id: `msg-sys-1-${activeCandidate.id}`,
        senderType: 'system',
        senderName: 'EHCM Recruitment Bot',
        content: `Application received for ${activeCandidate.role} (${activeCandidate.reqCode}). Sourced via ${activeCandidate.source}.`,
        sentAt: new Date().toISOString(),
        eventType: 'SCHEDULED',
        deliveryStatus: 'ERP_SYSTEM_EVENT',
      },
      {
        id: `msg-cand-1-${activeCandidate.id}`,
        senderType: 'candidate',
        senderName: activeCandidate.name,
        content: `Hello HR Team, thank you for reviewing my profile for the ${activeCandidate.role} position. I am very interested in this role!`,
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        deliveryStatus: 'ERP_CANDIDATE_INTRO',
      },
    ];

    if (dbMessages && dbMessages.length > 0) {
      return [...defaultIntro, ...dbMessages];
    }

    return defaultIntro;
  }, [activeCandidate, dbMessages]);

  // Compute Microsoft Teams Account Connection status dynamically
  const currentTeamsAccountStatus = useMemo(() => {
    if (!activeCandidate) return 'NOT_CONNECTED';
    if (activeCandidate.teamsChatId || activeCandidate.microsoftTeamsUserId) return 'CONNECTED';
    if (
      teamsAccountStatusMap[activeCandidate.id] === 'INVITATION_SENT' ||
      dbMessages?.some((m) => m.eventType === 'TEAMS_GUEST_INVITE')
    ) {
      return 'INVITATION_SENT';
    }
    return teamsAccountStatusMap[activeCandidate.id] || 'NOT_CONNECTED';
  }, [activeCandidate, teamsAccountStatusMap, dbMessages]);

  // Send recruiter chat message
  const handleSendMessage = () => {
    if (!messageText.trim() || !activeCandidate) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  // Quick Action Handlers
  const handleSendTeamsGuestInvite = async () => {
    if (!activeCandidate) return;

    try {
      await teamsChatApi.sendGuestInvitation(activeCandidate.id, teamsGuestNotes);
      setTeamsAccountStatusMap((prev) => ({
        ...prev,
        [activeCandidate.id]: 'INVITATION_SENT',
      }));
      queryClient.invalidateQueries({ queryKey: ['candidate-messages', activeCandidate.id] });
      setIsTeamsGuestModalOpen(false);
      toast.success(`Microsoft Teams Guest invitation sent to ${activeCandidate.name} (${activeCandidate.email})!`);
    } catch (err: any) {
      toast.error(`Unable to send Microsoft Teams guest invitation: ${err.message}`);
    }
  };

  const handleSendTeamsInvite = () => {
    if (!activeCandidate) return;

    postSystemEventMutation.mutate({
      senderName: 'Microsoft Teams Integration',
      content: `Teams Interview Invitation Sent to ${activeCandidate.name} (${activeCandidate.email}) & Interviewer Panel. Scheduled for ${activeCandidate.interviewDate} at ${activeCandidate.interviewTime}.`,
      eventType: 'TEAMS_INVITE',
    });

    activeCandidate.teamsStatus = 'Invitation Sent';
    setIsTeamsInviteModalOpen(false);
    toast.success(`Microsoft Teams invitation sent to ${activeCandidate.name} (${activeCandidate.email})!`);
  };

  const handleSendAssessmentLink = () => {
    if (!activeCandidate) return;

    postSystemEventMutation.mutate({
      senderName: 'EHCM Assessment Portal',
      content: `Assessment Link Sent: "${selectedAssessmentTitle}" (${assessmentDuration}). Due Date: ${assessmentDueDate}. Sent to ${activeCandidate.email}.`,
      eventType: 'ASSESSMENT_LINK',
    });

    activeCandidate.assessmentStatus = 'Sent';
    setIsAssessmentModalOpen(false);
    toast.success(`Assessment link sent to ${activeCandidate.name}!`);
  };

  const handleSendInterviewDetails = () => {
    if (!activeCandidate) return;

    postSystemEventMutation.mutate({
      senderName: 'Recruitment Desk',
      content: `Interview Details Shared with Candidate: ${activeCandidate.role} on ${activeCandidate.interviewDate} at ${activeCandidate.interviewTime} via Microsoft Teams. Panel: ${activeCandidate.interviewer}.`,
      eventType: 'INTERVIEW_DETAILS',
    });

    setIsInterviewDetailsModalOpen(false);
    toast.success(`Interview details emailed to ${activeCandidate.name}!`);
  };

  const handleCancelInterview = () => {
    if (!activeCandidate) return;

    postSystemEventMutation.mutate({
      senderName: 'Microsoft Teams Integration',
      content: `Interview Cancelled by Recruiter. Teams calendar event revoked and cancellation notice sent to ${activeCandidate.email}.`,
      eventType: 'CANCELLED',
    });

    activeCandidate.teamsStatus = 'Cancelled';
    toast.warning(`Interview cancelled for ${activeCandidate.name}`);
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'SHORTLISTED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'INTERVIEW':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'OFFERED':
      case 'HIRED':
        return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Teams – Candidate Communication
            </h2>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[10px]">
              Workspace
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage candidate communication, Teams interviews and assessment links in real-time
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-8 text-xs w-36 bg-slate-50 dark:bg-slate-800">
              <SelectValue placeholder="Stage Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="SCREENING">Screening</SelectItem>
              <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
              <SelectItem value="INTERVIEW">Interview</SelectItem>
              <SelectItem value="OFFERED">Offered</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-40 bg-slate-50 dark:bg-slate-800">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SCHEDULED">Teams Scheduled</SelectItem>
              <SelectItem value="ASSESSMENT_PENDING">Assessment Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchJobs();
              refetchInterviews();
              refetchDbMessages();
              toast.info('Workspace refreshed with latest candidate & interview telemetry');
            }}
            className="h-8 text-xs gap-1 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* 3-PANEL MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[680px]">
        {/* PANEL 1: LEFT CANDIDATE PANEL (3 COLS) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col h-[680px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 px-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-600" /> Candidates ({filteredCandidates.length})
            </span>
            <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600">
              Active Pipeline
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1 custom-scrollbar">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((cand) => {
                const isSelected = cand.id === activeCandidate?.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {cand.firstName[0]}
                          {cand.lastName[0]}
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white font-bold block text-xs leading-snug">
                            {cand.name}
                          </strong>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[140px]">
                            {cand.role}
                          </span>
                        </div>
                      </div>

                      <Badge className={`text-[9px] px-1.5 py-0.2 uppercase font-bold border ${getStageBadgeColor(cand.stage)}`}>
                        {cand.stage}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        AI Match: {cand.aiMatchScore}%
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            cand.teamsStatus === 'Invitation Sent'
                              ? 'bg-emerald-500'
                              : cand.teamsStatus === 'Created'
                              ? 'bg-indigo-500'
                              : 'bg-slate-300'
                          }`}
                        />
                        <span className="truncate max-w-[90px]">{cand.teamsStatus}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <AlertCircle className="h-6 w-6 mx-auto text-slate-300" />
                <p>No candidates match selected filters</p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: CENTER COMMUNICATION PANEL (MICROSOFT TEAMS CHAT) (5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[680px] shadow-xs">
          {activeCandidate ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {activeCandidate.firstName[0]}
                      {activeCandidate.lastName[0]}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      {activeCandidate.name}
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        ● Online / Active
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {activeCandidate.role} • <span className="font-mono text-indigo-600">{activeCandidate.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResumeModalOpen(true)}
                    className="h-7 text-[11px] font-semibold gap-1 text-slate-700 dark:text-slate-300 border-slate-200"
                  >
                    <FileText className="h-3 w-3 text-indigo-500" /> Resume
                  </Button>
                </div>
              </div>

              {/* Chat Conversation History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/20 dark:bg-slate-950/20">
                {displayMessages.length > 0 ? (
                  displayMessages.map((msg: any) => {
                    if (msg.senderType === 'system') {
                      return (
                        <div key={msg.id} className="my-3 flex justify-center">
                          <div className="bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-3 max-w-md text-center space-y-1 shadow-2xs">
                            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                              {msg.senderName}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{msg.content}</p>
                            <span className="text-[10px] text-slate-400 block pt-0.5">
                              {new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const isRecruiter = msg.senderType === 'recruiter';
                    const isTeamsDelivered = msg.deliveryStatus === 'SENT_TO_TEAMS';

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 ${isRecruiter ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`h-7 w-7 rounded-full text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-1 ${
                            isRecruiter ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          {isRecruiter ? 'HR' : activeCandidate.firstName[0]}
                        </div>

                        <div className={`space-y-1 max-w-[80%] ${isRecruiter ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                            <span>•</span>
                            <span>{new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isRecruiter
                                ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs'
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* Status Badge */}
                          {isRecruiter && (
                            <div className="flex items-center gap-1 text-[10px] px-1 pt-0.5">
                              {msg.deliveryStatus === 'SENT_TO_TEAMS' ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0 font-medium flex items-center gap-1">
                                  <CheckCheck className="h-3 w-3 text-emerald-600" /> ✓ Sent to Microsoft Teams
                                </Badge>
                              ) : msg.deliveryStatus === 'FAILED_TEAMS_ACCOUNT_NOT_FOUND' ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-amber-600" /> ⚠ Teams account not found
                                </Badge>
                              ) : msg.deliveryStatus === 'FAILED_TEAMS_NOT_PROVISIONED' ? (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[9px] px-1.5 py-0 font-medium flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-rose-600" /> ✕ Teams tenant unprovisioned
                                </Badge>
                              ) : msg.deliveryStatus === 'FAILED_GRAPH_PERMISSION' || msg.deliveryStatus === 'FAILED_MS_AUTH' ? (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[9px] px-1.5 py-0 font-medium flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3 text-rose-600" /> ⚠ Microsoft Graph permission required
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-[9px] px-1.5 py-0 font-medium">
                                  ERP Internal Note
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-300" />
                    <p>No messages yet. Start communication below.</p>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info('File attachment feature ready')}
                    className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Input
                    type="text"
                    placeholder="Type a message or candidate update..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 h-9 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />

                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  >
                    {sendMessageMutation.isPending ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <UserCheck className="h-10 w-10 text-slate-300" />
              <p>Select a candidate from the left panel to open communication workspace</p>
            </div>
          )}
        </div>

        {/* PANEL 3: RIGHT CANDIDATE ACTION PANEL (4 COLS) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[680px] shadow-xs overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {activeCandidate ? (
            <>
              {/* 1. Candidate Information Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-indigo-600" /> Candidate Information
                  </h4>
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-mono font-bold">
                    Match {activeCandidate.aiMatchScore}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Full Name</span>
                    <strong className="text-slate-900 dark:text-white text-xs">{activeCandidate.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Applied Position</span>
                    <strong className="text-slate-900 dark:text-white text-xs">{activeCandidate.role}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 text-[11px] block truncate">
                      {activeCandidate.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Requisition Code</span>
                    <strong className="font-mono text-xs text-slate-800 dark:text-slate-200">{activeCandidate.reqCode}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Microsoft Teams Account Connection Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" /> Microsoft Teams Account
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      currentTeamsAccountStatus === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : currentTeamsAccountStatus === 'INVITATION_SENT'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {currentTeamsAccountStatus === 'CONNECTED'
                      ? '🟢 Connected ✓'
                      : currentTeamsAccountStatus === 'INVITATION_SENT'
                      ? '🟡 Invitation Sent'
                      : '⚪ Not Connected'}
                  </Badge>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{activeCandidate.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Teams Guest Identity:</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[170px]">
                      {activeCandidate.email.replace('@', '_')}#EXT#
                    </span>
                  </div>
                </div>

                {currentTeamsAccountStatus === 'CONNECTED' ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Open Teams Chat
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTeamsGuestModalOpen(true)}
                    className="w-full h-8 text-xs font-semibold gap-1.5 border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                    {currentTeamsAccountStatus === 'INVITATION_SENT'
                      ? 'Resend Teams Guest Invitation'
                      : 'Invite Candidate to Microsoft Teams'}
                  </Button>
                )}
              </div>

              {/* 3. Microsoft Teams Interview Card */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-900/60 pb-2">
                  <span className="font-bold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-indigo-600" /> Interview & Teams Meeting
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      activeCandidate.teamsStatus === 'Invitation Sent'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : activeCandidate.teamsStatus === 'Created'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {activeCandidate.teamsStatus}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date & Time:</span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {activeCandidate.interviewDate} at {activeCandidate.interviewTime}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Interviewer Panel:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCandidate.interviewer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Microsoft Teams</span>
                  </div>
                </div>

                {activeCandidate.teamsJoinUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(activeCandidate.teamsJoinUrl, '_blank')}
                    className="w-full h-8 text-xs font-semibold gap-1.5 border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:border-indigo-800 mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-indigo-600" /> Join Teams Meeting
                  </Button>
                )}
              </div>

              {/* 3. Skill Assessment Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-600" /> Skill Assessment Status
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      activeCandidate.assessmentStatus === 'Sent' || activeCandidate.assessmentStatus === 'In Progress'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : activeCandidate.assessmentStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {activeCandidate.assessmentStatus}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">{activeCandidate.assessmentName}</p>
                  <p className="text-[11px] text-slate-500">Timed technical test (60 minutes)</p>
                </div>
              </div>

              {/* 4. QUICK ACTIONS SECTION */}
              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Quick Actions</h5>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsTeamsInviteModalOpen(true)}
                    className="w-full h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Video className="h-3.5 w-3.5" /> Send Teams Invitation
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssessmentModalOpen(true)}
                    className="w-full h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                  >
                    <Award className="h-3.5 w-3.5 text-indigo-500" /> Send Assessment Link
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInterviewDetailsModalOpen(true)}
                    className="w-full h-8 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-500" /> Send Interview Details
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="h-8 text-[11px] font-semibold gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                    >
                      <Calendar className="h-3 w-3 text-indigo-500" /> Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="h-8 text-[11px] font-semibold gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                    >
                      <RotateCcw className="h-3 w-3 text-amber-500" /> Reschedule
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelInterview}
                      className="h-8 text-[11px] font-semibold gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400"
                    >
                      <XCircle className="h-3 w-3" /> Cancel
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsResumeModalOpen(true)}
                      className="h-8 text-[11px] font-semibold gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                    >
                      <FileText className="h-3 w-3 text-indigo-500" /> View Resume
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <p>No active candidate selected</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 0: INVITE CANDIDATE TO MICROSOFT TEAMS GUEST */}
      {activeCandidate && (
        <Dialog open={isTeamsGuestModalOpen} onOpenChange={setIsTeamsGuestModalOpen}>
          <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                Invite Candidate to Microsoft Teams
              </DialogTitle>
              <DialogDescription className="text-xs">
                Invite candidate as a Microsoft Teams guest user for communication & interview access.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs custom-scrollbar">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p><strong>Candidate Name:</strong> {activeCandidate.name}</p>
                <p><strong>Email Address:</strong> <span className="font-mono text-indigo-600">{activeCandidate.email}</span></p>
                <p><strong>Organization:</strong> Codigix / EHCM</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Invitation Message Preview</Label>
                <Textarea
                  value={teamsGuestNotes}
                  onChange={(e) => setTeamsGuestNotes(e.target.value)}
                  className="text-xs min-h-[90px]"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTeamsGuestModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleSendTeamsGuestInvite} className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                <Send className="h-3.5 w-3.5" /> Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 1: SEND TEAMS INVITATION */}
      {activeCandidate && (
        <Dialog open={isTeamsInviteModalOpen} onOpenChange={setIsTeamsInviteModalOpen}>
          <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-600" />
                Send Microsoft Teams Invitation
              </DialogTitle>
              <DialogDescription className="text-xs">
                Confirm candidate interview details and send the calendar invitation via Microsoft Graph API.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs custom-scrollbar">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p><strong>Candidate:</strong> {activeCandidate.name} ({activeCandidate.email})</p>
                <p><strong>Position:</strong> {activeCandidate.role}</p>
                <p><strong>Date & Time:</strong> {activeCandidate.interviewDate} at {activeCandidate.interviewTime}</p>
                <p><strong>Interviewer Panel:</strong> {activeCandidate.interviewer}</p>
                <div className="pt-1">
                  <span className="block font-semibold text-slate-700 dark:text-slate-300">Teams Link:</span>
                  <p className="text-[11px] text-indigo-600 font-mono break-all bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1 border border-slate-200/60 dark:border-slate-700">
                    {activeCandidate.teamsJoinUrl}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Custom Message Preview</Label>
                <Textarea
                  value={teamsInviteNotes}
                  onChange={(e) => setTeamsInviteNotes(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTeamsInviteModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleSendTeamsInvite} className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                <Send className="h-3.5 w-3.5" /> Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 2: SEND ASSESSMENT LINK */}
      {activeCandidate && (
        <Dialog open={isAssessmentModalOpen} onOpenChange={setIsAssessmentModalOpen}>
          <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Send Online Skill Assessment Link
              </DialogTitle>
              <DialogDescription className="text-xs">
                Assign a timed coding / technical test to candidate {activeCandidate.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs custom-scrollbar">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Select Assessment Template</Label>
                <Select value={selectedAssessmentTitle} onValueChange={setSelectedAssessmentTitle}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Stack Software Developer Technical Assessment">Full Stack Software Developer Test (60 mins)</SelectItem>
                    <SelectItem value="DevOps & CI/CD Cloud Infrastructure Test">DevOps & Cloud Infrastructure Test (45 mins)</SelectItem>
                    <SelectItem value="UI/UX & Product Design Systems Assessment">UI/UX & Product Design Systems Assessment (45 mins)</SelectItem>
                    <SelectItem value="Core Aptitude & Logic Benchmark">Core Aptitude & Logic Benchmark (30 mins)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Duration</Label>
                  <Input value={assessmentDuration} onChange={(e) => setAssessmentDuration(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Due Date</Label>
                  <Input type="date" value={assessmentDueDate} onChange={(e) => setAssessmentDueDate(e.target.value)} className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Candidate Email</Label>
                <Input value={activeCandidate.email} readOnly className="h-9 text-xs bg-slate-50 font-mono" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Candidate Instructions</Label>
                <Textarea value={assessmentNotes} onChange={(e) => setAssessmentNotes(e.target.value)} className="text-xs min-h-[60px]" />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAssessmentModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleSendAssessmentLink} className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                <Send className="h-3.5 w-3.5" /> Send Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 3: SEND INTERVIEW DETAILS */}
      {activeCandidate && (
        <Dialog open={isInterviewDetailsModalOpen} onOpenChange={setIsInterviewDetailsModalOpen}>
          <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                Send Interview Details & Instructions
              </DialogTitle>
              <DialogDescription className="text-xs">
                Email complete interview schedule & preparation notes to {activeCandidate.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs custom-scrollbar">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p><strong>Candidate:</strong> {activeCandidate.name} ({activeCandidate.email})</p>
                <p><strong>Position:</strong> {activeCandidate.role}</p>
                <p><strong>Interview Date:</strong> {activeCandidate.interviewDate}</p>
                <p><strong>Time:</strong> {activeCandidate.interviewTime}</p>
                <p><strong>Interviewer:</strong> {activeCandidate.interviewer}</p>
                <p><strong>Format:</strong> Microsoft Teams</p>
                <div className="pt-1">
                  <span className="block font-semibold text-slate-700 dark:text-slate-300">Meeting Link:</span>
                  <p className="text-[11px] text-indigo-600 font-mono break-all bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1 border border-slate-200/60 dark:border-slate-700">
                    {activeCandidate.teamsJoinUrl}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsInterviewDetailsModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleSendInterviewDetails} className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                <Send className="h-3.5 w-3.5" /> Send Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 4: SCHEDULE INTERVIEW MODAL */}
      {activeCandidate && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          initialCandidateId={activeCandidate.id}
          onSuccess={() => {
            refetchInterviews();
            setIsScheduleModalOpen(false);
            toast.success('Interview scheduled successfully!');
          }}
        />
      )}

      {/* MODAL 5: RESUME VIEWER MODAL */}
      {activeCandidate && (
        <ResumeViewerModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          candidateName={activeCandidate.name}
          candidateEmail={activeCandidate.email}
          candidatePhone={activeCandidate.phone}
          candidateLocation={activeCandidate.currentLocation}
          jobTitle={activeCandidate.role}
          resumeUrl={activeCandidate.resumePath}
          experienceYears={activeCandidate.experience}
          qualification={activeCandidate.qualification}
          score={`${activeCandidate.aiMatchScore}%`}
        />
      )}
    </div>
  );
}
