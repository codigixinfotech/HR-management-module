import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Video,
  MapPin,
  Building2,
  DoorOpen,
} from 'lucide-react';
import { useRecruitmentConfig } from '@/hooks/useRecruitmentConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';
import { interviewsApi } from '@/api/interviews';
import { jobOpeningsApi } from '@/api/recruitment';
import type { Candidate, Employee } from '@/api/types';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCandidate?: Candidate | null;
  initialCandidateId?: string;
  onSuccess?: () => void;
}

interface PanelSelectionItem {
  employee: Employee;
  role: string;
}

import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser, isBranchAdminUser, isCompanyAdminUser } from '@/lib/modules';

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  initialCandidate,
  initialCandidateId,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);
  const isBranchAdmin = useMemo(() => isBranchAdminUser(user), [user]);
  const isCompanyAdmin = useMemo(() => isCompanyAdminUser(user), [user]);

  const userCompanyId = user?.companyId || (user?.employee as any)?.companyId || '';
  const userBranchId = user?.branchId || user?.employee?.branchId || '';

  // Determine effective tenant scope:
  // Branch Admin: strictly user's company and user's branch
  // Company Admin: strictly user's company, all branches
  // Super Admin: activeCompanyId (or candidate's job company, or user's company)
  const scopedCompanyId = useMemo(() => {
    if (isBranchAdmin || isCompanyAdmin) {
      return userCompanyId;
    }
    return activeCompanyId || initialCandidate?.jobOpening?.companyId || userCompanyId || '';
  }, [isBranchAdmin, isCompanyAdmin, userCompanyId, activeCompanyId, initialCandidate]);

  const scopedBranchId = useMemo(() => {
    if (isBranchAdmin) {
      return userBranchId;
    }
    return '';
  }, [isBranchAdmin, userBranchId]);

  // Recruitment config → drives interview mode & default offline venue values
  const {
    interviewMode: configInterviewMode,
    defaultInterviewLocation,
    defaultInterviewBuilding,
    defaultInterviewRoom,
  } = useRecruitmentConfig();

  const configMode = configInterviewMode || 'BOTH';

  const [candidateId, setCandidateId] = useState<string>('');
  const [candidateEmail, setCandidateEmail] = useState<string>('motesanika@gmail.com');
  const [position, setPosition] = useState<string>('');
  const [requisitionCode, setRequisitionCode] = useState<string>('JR-2026-001');
  const [jobOpeningId, setJobOpeningId] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState<string>('11:00 AM');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // ------ Interview Format / Type ------
  // OFFLINE -> 'In-Person / Offline'
  // ONLINE -> 'Microsoft Teams'
  // BOTH -> default 'Microsoft Teams'
  const [interviewFormat, setInterviewFormat] = useState<string>(() =>
    configMode === 'OFFLINE' ? 'In-Person / Offline' : 'Microsoft Teams',
  );
  const [linkAllocationMode, setLinkAllocationMode] = useState<'AUTO_POOL' | 'CUSTOM'>('AUTO_POOL');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [createTeamsMeeting, setCreateTeamsMeeting] = useState<boolean>(true);
  const [sendCalendarInvite, setSendCalendarInvite] = useState<boolean>(true);

  // ------ Offline venue fields (used when In-Person / Offline is active) ------
  const [offlineLocation, setOfflineLocation] = useState<string>('Pune Manufacturing Plant');
  const [offlineBuilding, setOfflineBuilding] = useState<string>('Administration Block');
  const [offlineRoom, setOfflineRoom] = useState<string>('HR Interview Room 1');

  const [notes, setNotes] = useState<string>('');

  // All interview types are selectable and editable across all modes
  const ALL_INTERVIEW_TYPES = [
    'Microsoft Teams',
    'Google Meet',
    'In-Person / Offline',
    'Phone Call',
  ];

  // Set default format based on configMode when initialized (without overriding user edits)
  const hasUserEditedFormat = useRef(false);
  useEffect(() => {
    if (!hasUserEditedFormat.current && configInterviewMode) {
      if (configInterviewMode === 'OFFLINE') {
        setInterviewFormat('In-Person / Offline');
      } else if (configInterviewMode === 'ONLINE') {
        setInterviewFormat('Microsoft Teams');
      }
    }
  }, [configInterviewMode]);

  // Sync offline field defaults when config loads
  useEffect(() => {
    if (defaultInterviewLocation) setOfflineLocation(defaultInterviewLocation);
    if (defaultInterviewBuilding) setOfflineBuilding(defaultInterviewBuilding);
    if (defaultInterviewRoom) setOfflineRoom(defaultInterviewRoom);
  }, [defaultInterviewLocation, defaultInterviewBuilding, defaultInterviewRoom]);

  const isOffline =
    interviewFormat === 'In-Person / Offline' ||
    interviewFormat === 'On-site HQ' ||
    interviewFormat === 'In-Person' ||
    interviewFormat === 'On-site';

  // Query Preview Assigned Teams Link from Pool
  const { data: previewPoolLink } = useQuery({
    queryKey: ['preview-pool-allocation', interviewDate, startTime, durationMinutes],
    queryFn: async () => {
      const res = await fetch('/api/recruitment/teams-links/preview-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewDate, startTime, durationMinutes }),
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(
      !isOffline &&
      interviewDate &&
      startTime &&
      linkAllocationMode === 'AUTO_POOL' &&
      interviewFormat === 'Microsoft Teams',
    ),
  });

  // Scheduled Result Modal State
  const [scheduledSuccessResult, setScheduledSuccessResult] = useState<any>(null);

  // Selected Panel Members State
  const [selectedPanel, setSelectedPanel] = useState<PanelSelectionItem[]>([]);
  const [employeeSearch] = useState<string>('');

  // Fetch Candidates available for scheduling (SHORTLISTED or INTERVIEW)
  const { data: jobOpenings = [] } = useQuery({
    queryKey: ['job-openings-for-scheduling', activeCompanyId],
    queryFn: () => jobOpeningsApi.list(activeCompanyId),
  });

  const availableCandidates = useMemo(() => {
    const list: Candidate[] = [];
    jobOpenings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c) => {
          if (
            c.stage === 'SHORTLISTED' ||
            c.stage === 'INTERVIEW' ||
            c.stage === 'APPLIED' ||
            c.stage === 'ASSESSMENT_PASSED' ||
            c.stage === 'ASSESSMENT_FAILED' ||
            c.stage === 'ASSESSMENT_ASSIGNED'
          ) {
            list.push({ ...c, jobOpening: job });
          }
        });
      }
    });
    return list;
  }, [jobOpenings]);

  // Fetch Master Employee List for Panel Selection with strict company & branch scoping
  const { data: employeesData } = useQuery({
    queryKey: ['employees-panel-roster', scopedCompanyId, scopedBranchId],
    queryFn: () =>
      employeesApi.list({
        pageSize: 500,
        companyId: scopedCompanyId || undefined,
        branchId: scopedBranchId || undefined,
      }),
  });

  const employeesList = useMemo(() => {
    const rawItems: Employee[] =
      employeesData?.items || (Array.isArray(employeesData) ? (employeesData as any) : []);

    return rawItems.filter((e) => {
      // Exclude inactive / terminated
      if (e.status && (e.status === 'TERMINATED' || e.status === 'INACTIVE')) return false;

      // Filter by company
      if (scopedCompanyId && e.companyId && e.companyId !== scopedCompanyId) {
        return false;
      }

      // Strict Branch Isolation for Branch Admin
      if (isBranchAdmin && scopedBranchId) {
        const empBranchId = e.branchId || (e as any).branch?.id;
        if (empBranchId !== scopedBranchId) {
          return false;
        }
      }

      return true;
    });
  }, [employeesData, scopedCompanyId, scopedBranchId, isBranchAdmin]);

  // Filtered employees for dropdown search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeesList;
    const term = employeeSearch.toLowerCase().trim();
    return employeesList.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
        e.employeeCode.toLowerCase().includes(term) ||
        e.department?.name?.toLowerCase().includes(term) ||
        e.designation?.title?.toLowerCase().includes(term),
    );
  }, [employeesList, employeeSearch]);

  // Populate candidate data when initialCandidate is passed or candidateId changes
  useEffect(() => {
    if (initialCandidate) {
      setCandidateId(initialCandidate.id || 'cand-demo-1');
      setCandidateEmail(initialCandidate.email || 'motesanika@gmail.com');
      setPosition(initialCandidate.jobOpening?.title || initialCandidate.role || 'Senior Software Engineer');
      setRequisitionCode(initialCandidate.jobOpening?.requisitionCode || initialCandidate.reqCode || 'JR-2026-019');
      setJobOpeningId(initialCandidate.jobOpeningId);
    } else if (initialCandidateId) {
      const found = availableCandidates.find((c) => c.id === initialCandidateId);
      if (found) {
        setCandidateId(found.id);
        setCandidateEmail(found.email || 'motesanika@gmail.com');
        setPosition(found.jobOpening?.title || 'Senior Software Engineer');
        setRequisitionCode(found.jobOpening?.requisitionCode || 'JR-2026-019');
        setJobOpeningId(found.jobOpeningId);
      } else {
        setCandidateId(initialCandidateId);
        setCandidateEmail('motesanika@gmail.com');
        setPosition('Senior Software Engineer');
        setRequisitionCode('JR-2026-019');
      }
    } else if (availableCandidates.length > 0 && !candidateId) {
      const first = availableCandidates[0];
      setCandidateId(first.id);
      setCandidateEmail(first.email || 'motesanika@gmail.com');
      setPosition(first.jobOpening?.title || 'Senior Software Engineer');
      setRequisitionCode(first.jobOpening?.requisitionCode || 'JR-2026-019');
      setJobOpeningId(first.jobOpeningId);
    } else if (!candidateId) {
      setCandidateId('cand-demo-1');
      setCandidateEmail('motesanika@gmail.com');
      setPosition('Senior Software Engineer');
      setRequisitionCode('JR-2026-019');
    }
  }, [initialCandidate, initialCandidateId, availableCandidates]);

  // Prune any panel members that do not belong to the current filtered branch roster
  useEffect(() => {
    if (selectedPanel.length > 0 && employeesList.length > 0) {
      setSelectedPanel((prev) =>
        prev.filter((p) => employeesList.some((e) => e.id === p.employee.id)),
      );
    }
  }, [employeesList]);

  // Set default panel members strictly from the filtered branch roster
  useEffect(() => {
    if (selectedPanel.length === 0 && employeesList.length > 0) {
      const defaults: PanelSelectionItem[] = [];

      // 1. Find a technical / engineering / operations member in this branch
      const techInterviewer =
        employeesList.find((e) => {
          const title = (e.designation?.title || '').toLowerCase();
          const dept = (e.department?.name || '').toLowerCase();
          return (
            title.includes('tech') ||
            title.includes('engineer') ||
            title.includes('lead') ||
            title.includes('developer') ||
            dept.includes('eng') ||
            dept.includes('prod')
          );
        }) || employeesList[0];

      if (techInterviewer) {
        defaults.push({ employee: techInterviewer, role: 'Technical Interviewer' });
      }

      // 2. Find an HR or managerial member in this branch (different from tech interviewer)
      const hrInterviewer =
        employeesList.find((e) => {
          if (e.id === techInterviewer?.id) return false;
          const title = (e.designation?.title || '').toLowerCase();
          const dept = (e.department?.name || '').toLowerCase();
          return (
            title.includes('hr') ||
            title.includes('manager') ||
            dept.includes('hr') ||
            dept.includes('human')
          );
        }) ||
        (employeesList.length > 1
          ? employeesList.find((e) => e.id !== techInterviewer?.id)
          : null);

      if (hrInterviewer) {
        defaults.push({ employee: hrInterviewer, role: 'Hiring Manager' });
      }

      setSelectedPanel(defaults);
    }
  }, [employeesList, selectedPanel.length]);

  // Format link auto generator
  const handleFormatChange = (fmt: string) => {
    hasUserEditedFormat.current = true;
    setInterviewFormat(fmt);
    if (fmt === 'Microsoft Teams') {
      setCreateTeamsMeeting(true);
      setLinkAllocationMode('AUTO_POOL');
    } else if (fmt === 'Google Meet') {
      setMeetingLink('https://meet.google.com/ehcm-interview-room');
      setCreateTeamsMeeting(false);
    } else if (fmt === 'In-Person / Offline' || fmt === 'On-site HQ' || fmt === 'On-site') {
      setMeetingLink('');
      setCreateTeamsMeeting(false);
    } else if (fmt === 'Phone Call' || fmt === 'Phone') {
      setMeetingLink('+91 98230 11223 (HR Conference Line)');
      setCreateTeamsMeeting(false);
    }
  };

  // Add Employee to Panel
  const handleAddPanelMember = (empId: string) => {
    const emp = employeesList.find((e) => e.id === empId);
    if (!emp) return;
    if (selectedPanel.some((p) => p.employee.id === empId)) {
      toast.error(`${emp.firstName} ${emp.lastName} is already added to the panel.`);
      return;
    }
    const defaultRole =
      selectedPanel.length === 0 ? 'Technical Interviewer' : selectedPanel.length === 1 ? 'Hiring Manager' : 'Panel Member';
    setSelectedPanel((prev) => [...prev, { employee: emp, role: defaultRole }]);
  };

  // Remove Employee from Panel
  const handleRemovePanelMember = (empId: string) => {
    setSelectedPanel((prev) => prev.filter((p) => p.employee.id !== empId));
  };

  // Change Role for Panel Member
  const handleRoleChange = (empId: string, newRole: string) => {
    setSelectedPanel((prev) =>
      prev.map((p) => (p.employee.id === empId ? { ...p, role: newRole } : p)),
    );
  };

  // Create Interview Mutation
  const createInterviewMutation = useMutation({
    mutationFn: (payload: any) => interviewsApi.create(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });

      const cand = availableCandidates.find((c) => c.id === candidateId) || initialCandidate;
      setScheduledSuccessResult({
        interview: data,
        candidateName: cand ? `${cand.firstName} ${cand.lastName}` : 'Sanika Shelke',
        candidateEmail: candidateEmail || cand?.email || 'motesanika@gmail.com',
        position: position || cand?.jobOpening?.title || 'Senior Fullstack Engineer',
        teamsJoinUrl: data.teamsJoinUrl || data.meetingLink || '',
        interviewFormat: isOffline ? 'In-Person / Offline' : interviewFormat,
        isOffline,
        location: isOffline ? `${offlineLocation} — ${offlineRoom}` : undefined,
      });

      if (isOffline) {
        toast.success(`In-Person Interview scheduled & calendar invitation sent to ${candidateEmail || 'candidate'}!`);
      } else {
        toast.success(`${interviewFormat} Interview scheduled & email invitation sent to ${candidateEmail || 'candidate'}!`);
      }
      onSuccess?.();
    },
    onError: (err: any) => {
      const rawMsg = err?.response?.data?.message || err?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : typeof rawMsg === 'string' ? rawMsg : 'Failed to schedule interview.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId) {
      toast.error('Please select a candidate');
      return;
    }
    if (!candidateEmail || !candidateEmail.includes('@')) {
      toast.error('A valid candidate email address is required.');
      return;
    }
    if (selectedPanel.length === 0) {
      toast.error('Assigned Interviewer Panel is mandatory. Please select at least one panel member.');
      return;
    }

    // Offline validation
    if (isOffline) {
      if (!offlineLocation.trim()) {
        toast.error('Interview Location is required for In-Person interviews.');
        return;
      }
      if (!offlineRoom.trim()) {
        toast.error('Interview Room is required for In-Person interviews.');
        return;
      }
    }

    const panelMemberIds = selectedPanel.map((p) => p.employee.id);
    const panelMemberRoles: Record<string, string> = {};
    selectedPanel.forEach((p) => {
      panelMemberRoles[p.employee.id] = p.role;
    });

    const resolvedMeetingLink = isOffline
      ? null
      : interviewFormat === 'Microsoft Teams'
        ? (linkAllocationMode === 'AUTO_POOL' ? (previewPoolLink?.meetingUrl || null) : meetingLink || null)
        : meetingLink || null;

    createInterviewMutation.mutate({
      candidateId,
      candidateEmail,
      position: position || 'Senior Fullstack Engineer',
      requisitionCode: requisitionCode || 'JR-2026-001',
      jobOpeningId: jobOpeningId || undefined,
      interviewDate,
      startTime,
      durationMinutes,
      interviewMode: isOffline ? 'OFFLINE' : 'ONLINE',
      interviewFormat: isOffline ? 'In-Person / Offline' : interviewFormat,
      createTeamsMeeting: !isOffline && interviewFormat === 'Microsoft Teams' && linkAllocationMode === 'AUTO_POOL',
      meetingLink: resolvedMeetingLink,
      location: isOffline ? offlineLocation : null,
      building: isOffline ? offlineBuilding : null,
      room: isOffline ? offlineRoom : null,
      notes,
      panelMemberIds,
      panelMemberRoles,
      sendCalendarInvite,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {scheduledSuccessResult ? (
          <div className="py-4 space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Interview Scheduled Successfully ✓
              </h3>
              <p className="text-xs text-slate-500">
                Microsoft Teams meeting and calendar invitation dispatched via EHCM Recruitment ERP.
              </p>
            </div>

            {/* Confirmation Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Candidate:</span>
                <strong className="text-slate-900 dark:text-white font-semibold">{scheduledSuccessResult.candidateName}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Candidate Email:</span>
                <strong className="text-indigo-600 font-mono">{scheduledSuccessResult.candidateEmail}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Position / Requisition:</span>
                <strong className="text-slate-900 dark:text-white font-semibold">{scheduledSuccessResult.position}</strong>
              </div>

              {scheduledSuccessResult.isOffline ? (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Interview Venue:</span>
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200">
                    <MapPin className="h-3.5 w-3.5" /> {scheduledSuccessResult.location}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Interview Format:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {scheduledSuccessResult.interviewFormat || 'Online Meeting'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Calendar & Email Invite:</span>
                <span className="inline-flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Sent to Candidate & Panel ✓
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {scheduledSuccessResult.teamsJoinUrl && !scheduledSuccessResult.isOffline ? (
                <a
                  href={scheduledSuccessResult.teamsJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 h-10 text-xs">
                    <Video className="h-4 w-4" /> Join Meeting
                  </Button>
                </a>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setScheduledSuccessResult(null);
                  onClose();
                }}
                className="flex-1 h-10 text-xs font-semibold"
              >
                Done / Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" /> Schedule Interview & Assign Panel
              </DialogTitle>
              <DialogDescription className="text-xs">
                Schedule a Microsoft Teams technical or HR interview for candidates and dispatch calendar invitations.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
              {/* Candidate & Position Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Candidate Name *</Label>
                  <Select
                    value={candidateId}
                    onValueChange={(val) => {
                      setCandidateId(val);
                      const found = availableCandidates.find((c) => c.id === val);
                      if (found) {
                        setCandidateEmail(found.email || 'motesanika@gmail.com');
                        setPosition(found.jobOpening?.title || 'Senior Fullstack Engineer');
                        setRequisitionCode(found.jobOpening?.requisitionCode || 'JR-2026-001');
                        setJobOpeningId(found.jobOpeningId);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableCandidates.map((cand) => (
                        <SelectItem key={cand.id} value={cand.id} className="text-xs">
                          {cand.firstName} {cand.lastName} ({cand.jobOpening?.title || 'Candidate'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Candidate Email *</Label>
                  <Input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Target Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Position Title *</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Senior Fullstack Engineer"
                    className="h-9 text-xs bg-background"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Requisition Code</Label>
                  <Input
                    value={requisitionCode}
                    onChange={(e) => setRequisitionCode(e.target.value)}
                    placeholder="JR-2026-001"
                    className="h-9 text-xs bg-background font-mono"
                  />
                </div>
              </div>

              {/* MANDATORY INTERVIEWER PANEL SELECTION */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" /> Assigned Interviewer Panel *
                    <Badge className="bg-indigo-600 text-white text-[10px] ml-1">Mandatory</Badge>
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {selectedPanel.length} Panel Member(s) Added
                  </span>
                </div>

                {/* Selected Panel Members Cards */}
                <div className="space-y-2">
                  {selectedPanel.map((item) => (
                    <div
                      key={item.employee.id}
                      className="p-3 bg-background rounded-lg border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">
                          {item.employee.firstName.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-xs font-semibold text-foreground block">
                            {item.employee.firstName} {item.employee.lastName}
                          </strong>
                          <span className="text-[11px] text-muted-foreground block">
                            {item.employee.designation?.title || 'Panelist'} • {item.employee.department?.name || 'Engineering'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                          value={item.role}
                          onValueChange={(val) => handleRoleChange(item.employee.id, val)}
                        >
                          <SelectTrigger className="h-7 text-[11px] w-[150px]">
                            <SelectValue placeholder="Panel Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technical Interviewer" className="text-xs">Technical Interviewer</SelectItem>
                            <SelectItem value="Hiring Manager" className="text-xs">Hiring Manager</SelectItem>
                            <SelectItem value="HR Interviewer" className="text-xs">HR Interviewer</SelectItem>
                            <SelectItem value="Panel Member" className="text-xs">Panel Member</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePanelMember(item.employee.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedPanel.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-amber-300 bg-amber-500/5 rounded-lg text-amber-700 dark:text-amber-400 text-xs flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>No interviewers assigned yet. Select from the roster below.</span>
                    </div>
                  )}
                </div>

                {/* Employee Search & Add Dropdown */}
                <div className="pt-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Search & Add Panel Members from Employee Master:
                  </Label>
                  <Select onValueChange={handleAddPanelMember}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="+ Select Employee to add to Interview Panel..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredEmployees.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground text-center">
                          No employees available in this branch roster
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            {emp.firstName} {emp.lastName} — {emp.designation?.title || 'Employee'} ({emp.department?.name || 'Dept'})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date, Time, Duration, Interview Type Row (Matching Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Interview Date *</Label>
                  <Input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Start Time *</Label>
                  <Input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Duration</Label>
                  <Select
                    value={String(durationMinutes)}
                    onValueChange={(val) => setDurationMinutes(Number(val))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Minutes</SelectItem>
                      <SelectItem value="45">45 Minutes</SelectItem>
                      <SelectItem value="60">60 Minutes</SelectItem>
                      <SelectItem value="90">90 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Interview Type *</Label>
                  <Select value={interviewFormat} onValueChange={handleFormatChange}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Interview Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_INTERVIEW_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ─── Conditional Panels Based on Interview Type / Config ─── */}

              {/* 1. In-Person / Offline Venue (Shown when config=OFFLINE or In-Person / Offline is selected) */}
              {isOffline && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      <Label className="text-xs font-bold text-amber-800 dark:text-amber-300">In-Person Interview Venue</Label>
                    </div>
                    {configMode === 'OFFLINE' && (
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                        Company Policy: In-Person
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Interview Location *
                    </Label>
                    <Input
                      value={offlineLocation}
                      onChange={(e) => setOfflineLocation(e.target.value)}
                      placeholder="Pune Manufacturing Plant"
                      className="h-9 text-xs bg-background"
                      required
                    />
                  </div>

                  {/* Building & Room */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Building / Area
                      </Label>
                      <Input
                        value={offlineBuilding}
                        onChange={(e) => setOfflineBuilding(e.target.value)}
                        placeholder="Administration Block"
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        Interview Room *
                      </Label>
                      <Input
                        value={offlineRoom}
                        onChange={(e) => setOfflineRoom(e.target.value)}
                        placeholder="HR Interview Room 1"
                        className="h-9 text-xs bg-background"
                        required
                      />
                    </div>
                  </div>

                  {/* Calendar invite checkbox */}
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                    <input
                      type="checkbox"
                      id="chk-calendar-invite-offline"
                      checked={sendCalendarInvite}
                      onChange={(e) => setSendCalendarInvite(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <label htmlFor="chk-calendar-invite-offline" className="text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                      Send calendar / email invitation to Candidate & Panel
                    </label>
                  </div>
                </div>
              )}

              {/* 2. Microsoft Teams Link Assignment (Shown when NOT offline and Teams is selected) */}
              {!isOffline && interviewFormat === 'Microsoft Teams' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      Teams Meeting Link Assignment
                    </Label>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                      Link Pool Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="linkMode"
                        checked={linkAllocationMode === 'AUTO_POOL'}
                        onChange={() => {
                          setLinkAllocationMode('AUTO_POOL');
                          setMeetingLink('');
                          setCreateTeamsMeeting(true);
                        }}
                        className="text-indigo-600 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Automatically assign an available Teams meeting link from pool
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="linkMode"
                        checked={linkAllocationMode === 'CUSTOM'}
                        onChange={() => setLinkAllocationMode('CUSTOM')}
                        className="text-indigo-600 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Custom Teams / Room URL
                      </span>
                    </label>
                  </div>

                  {linkAllocationMode === 'AUTO_POOL' ? (
                    <div className="space-y-1 pt-1">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Assigned Teams Meeting Link (Auto-selected from Pool)
                      </Label>
                      <Input
                        type="text"
                        readOnly
                        value={
                          previewPoolLink?.meetingUrl
                            ? `${previewPoolLink.title}: ${previewPoolLink.meetingUrl}`
                            : 'Checking pool availability...'
                        }
                        className="h-8 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Custom Teams Meeting Link / URL
                      </Label>
                      <Input
                        type="text"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="Paste custom Teams meeting URL..."
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <input
                      type="checkbox"
                      id="chk-calendar-invite"
                      checked={sendCalendarInvite}
                      onChange={(e) => setSendCalendarInvite(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="chk-calendar-invite" className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer">
                      Send calendar invitation to Candidate & Panel
                    </label>
                  </div>
                </div>
              )}

              {/* 3. Google Meet Link Assignment (Shown when NOT offline and Google Meet is selected) */}
              {!isOffline && interviewFormat === 'Google Meet' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Google Meet Link / Meeting URL
                    </Label>
                    <Input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/ehcm-interview-room"
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <input
                      type="checkbox"
                      id="chk-calendar-invite-meet"
                      checked={sendCalendarInvite}
                      onChange={(e) => setSendCalendarInvite(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="chk-calendar-invite-meet" className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer">
                      Send calendar invitation to Candidate & Panel
                    </label>
                  </div>
                </div>
              )}

              {/* 4. Phone Call */}
              {!isOffline && (interviewFormat === 'Phone Call' || interviewFormat === 'Phone') && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Phone Number / Conference Line
                    </Label>
                    <Input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="+91 98230 11223 (HR Conference Line)"
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <input
                      type="checkbox"
                      id="chk-calendar-invite-phone"
                      checked={sendCalendarInvite}
                      onChange={(e) => setSendCalendarInvite(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="chk-calendar-invite-phone" className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer">
                      Send calendar invitation to Candidate & Panel
                    </label>
                  </div>
                </div>
              )}

              {/* Guidelines / Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Interview Instructions & Agenda</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter technical focus areas, coding topics, or HR instructions for candidate & panel members..."
                  className="text-xs min-h-[60px]"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInterviewMutation.isPending}
                  className="h-9 text-xs gap-1.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Schedule & Send Email Now
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

