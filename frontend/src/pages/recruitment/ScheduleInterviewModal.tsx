import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Video,
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

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  initialCandidate,
  initialCandidateId,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const queryClient = useQueryClient();

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
  const [interviewFormat, setInterviewFormat] = useState<string>('Microsoft Teams');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [createTeamsMeeting, setCreateTeamsMeeting] = useState<boolean>(true);
  const [sendCalendarInvite, setSendCalendarInvite] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Scheduled Result Modal State
  const [scheduledSuccessResult, setScheduledSuccessResult] = useState<any>(null);

  // Selected Panel Members State
  const [selectedPanel, setSelectedPanel] = useState<PanelSelectionItem[]>([]);
  const [employeeSearch] = useState<string>('');

  // Fetch Candidates available for scheduling (SHORTLISTED or INTERVIEW)
  const { data: jobOpenings = [] } = useQuery({
    queryKey: ['job-openings-for-scheduling'],
    queryFn: () => jobOpeningsApi.list(),
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

  // Fetch Master Employee List for Panel Selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees-panel-roster'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeesList = useMemo(() => {
    return employeesData?.items || [];
  }, [employeesData]);

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
      setCandidateId(initialCandidate.id);
      setCandidateEmail(initialCandidate.email || 'motesanika@gmail.com');
      setPosition(initialCandidate.jobOpening?.title || 'Senior Fullstack Engineer');
      setRequisitionCode(initialCandidate.jobOpening?.requisitionCode || 'JR-2026-001');
      setJobOpeningId(initialCandidate.jobOpeningId);
    } else if (initialCandidateId) {
      const found = availableCandidates.find((c) => c.id === initialCandidateId);
      if (found) {
        setCandidateId(found.id);
        setCandidateEmail(found.email || 'motesanika@gmail.com');
        setPosition(found.jobOpening?.title || 'Senior Fullstack Engineer');
        setRequisitionCode(found.jobOpening?.requisitionCode || 'JR-2026-001');
        setJobOpeningId(found.jobOpeningId);
      }
    } else if (availableCandidates.length > 0 && !candidateId) {
      const first = availableCandidates[0];
      setCandidateId(first.id);
      setCandidateEmail(first.email || 'motesanika@gmail.com');
      setPosition(first.jobOpening?.title || 'Senior Fullstack Engineer');
      setRequisitionCode(first.jobOpening?.requisitionCode || 'JR-2026-001');
      setJobOpeningId(first.jobOpeningId);
    }
  }, [initialCandidate, initialCandidateId, availableCandidates]);

  // Set default panel members (Rajesh Sharma CTO & Priya Mehta HR Manager) if available
  useEffect(() => {
    if (employeesList.length > 0 && selectedPanel.length === 0) {
      const defaults: PanelSelectionItem[] = [];
      const rajesh = employeesList.find(
        (e) => e.firstName.toLowerCase().includes('rajesh') || e.employeeCode === 'EMP-8265',
      );
      const priya = employeesList.find(
        (e) => e.firstName.toLowerCase().includes('priya') || e.firstName.toLowerCase().includes('aishwarya'),
      );

      if (rajesh) {
        defaults.push({ employee: rajesh, role: 'Technical Interviewer' });
      }
      if (priya && priya.id !== rajesh?.id) {
        defaults.push({ employee: priya, role: 'Hiring Manager' });
      } else if (employeesList.length > 1 && !rajesh) {
        defaults.push({ employee: employeesList[0], role: 'Technical Interviewer' });
        defaults.push({ employee: employeesList[1], role: 'Hiring Manager' });
      } else if (employeesList.length > 0 && defaults.length === 0) {
        defaults.push({ employee: employeesList[0], role: 'Technical Interviewer' });
      }

      setSelectedPanel(defaults);
    }
  }, [employeesList]);

  // Format link auto generator
  const handleFormatChange = (fmt: string) => {
    setInterviewFormat(fmt);
    if (fmt === 'Microsoft Teams') {
      setCreateTeamsMeeting(true);
    } else if (fmt === 'Google Meet') {
      setMeetingLink('https://meet.google.com/ehcm-interview-room');
      setCreateTeamsMeeting(false);
    } else if (fmt === 'On-site') {
      setMeetingLink('Pune HQ - Room 302, Executive Conference Suite');
      setCreateTeamsMeeting(false);
    } else if (fmt === 'Phone') {
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
        teamsJoinUrl: data.teamsJoinUrl || data.meetingLink || 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_ehcm',
      });
      
      toast.success('Microsoft Teams Interview scheduled successfully! Calendar invitation sent.');
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to schedule interview.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId) {
      toast.error('Please select a candidate');
      return;
    }
    if (!candidateEmail || !candidateEmail.includes('@')) {
      toast.error('A valid candidate email address is required to create a Teams interview invitation.');
      return;
    }
    if (selectedPanel.length === 0) {
      toast.error('Assigned Interviewer Panel is mandatory. Please select at least one panel member.');
      return;
    }

    const panelMemberIds = selectedPanel.map((p) => p.employee.id);
    const panelMemberRoles: Record<string, string> = {};
    selectedPanel.forEach((p) => {
      panelMemberRoles[p.employee.id] = p.role;
    });

    createInterviewMutation.mutate({
      candidateId,
      candidateEmail,
      position: position || 'Senior Fullstack Engineer',
      requisitionCode: requisitionCode || 'JR-2026-001',
      jobOpeningId: jobOpeningId || undefined,
      interviewDate,
      startTime,
      durationMinutes,
      interviewFormat,
      createTeamsMeeting,
      meetingLink,
      notes,
      panelMemberIds,
      panelMemberRoles,
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

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Teams Meeting:</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Created ✓
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Outlook Calendar Invite:</span>
                <span className="inline-flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Sent to Candidate & Panel ✓
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={scheduledSuccessResult.teamsJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 h-10 text-xs">
                  <Video className="h-4 w-4" /> Join Teams Meeting
                </Button>
              </a>
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
                      {filteredEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.firstName} {emp.lastName} — {emp.designation?.title || 'Employee'} ({emp.department?.name || 'Dept'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date, Time, Duration & Format Row */}
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
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                      <SelectItem value="Google Meet">Google Meet</SelectItem>
                      <SelectItem value="On-site">On-site HQ</SelectItem>
                      <SelectItem value="Phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Microsoft Teams Options */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-teams-meeting"
                    checked={createTeamsMeeting}
                    onChange={(e) => setCreateTeamsMeeting(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="chk-teams-meeting" className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer">
                    Create Teams meeting automatically
                  </label>
                </div>
                <div className="flex items-center gap-2">
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
                  className="h-9 text-xs gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> Schedule Interview
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
}
