import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
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
  const [position, setPosition] = useState<string>('');
  const [requisitionCode, setRequisitionCode] = useState<string>('JR-2026-001');
  const [jobOpeningId, setJobOpeningId] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState<string>('11:00 AM');
  const [interviewFormat, setInterviewFormat] = useState<string>('Google Meet');
  const [meetingLink, setMeetingLink] = useState<string>('https://meet.google.com/ehcm-interview-room');
  const [notes, setNotes] = useState<string>('');

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
      setPosition(initialCandidate.jobOpening?.title || 'Product Designer');
      setRequisitionCode(initialCandidate.jobOpening?.requisitionCode || 'JR-2026-001');
      setJobOpeningId(initialCandidate.jobOpeningId);
    } else if (initialCandidateId) {
      const found = availableCandidates.find((c) => c.id === initialCandidateId);
      if (found) {
        setCandidateId(found.id);
        setPosition(found.jobOpening?.title || 'Product Designer');
        setRequisitionCode(found.jobOpening?.requisitionCode || 'JR-2026-001');
        setJobOpeningId(found.jobOpeningId);
      }
    } else if (availableCandidates.length > 0 && !candidateId) {
      const first = availableCandidates[0];
      setCandidateId(first.id);
      setPosition(first.jobOpening?.title || 'Product Designer');
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
        defaults.push({ employee: priya, role: 'HR Interviewer' });
      } else if (employeesList.length > 1 && !rajesh) {
        defaults.push({ employee: employeesList[0], role: 'Technical Interviewer' });
        defaults.push({ employee: employeesList[1], role: 'HR Interviewer' });
      } else if (employeesList.length > 0 && defaults.length === 0) {
        defaults.push({ employee: employeesList[0], role: 'Primary Interviewer' });
      }

      setSelectedPanel(defaults);
    }
  }, [employeesList]);

  // Format link auto generator
  const handleFormatChange = (fmt: string) => {
    setInterviewFormat(fmt);
    if (fmt === 'Google Meet') {
      setMeetingLink('https://meet.google.com/ehcm-interview-room');
    } else if (fmt === 'Microsoft Teams') {
      setMeetingLink('https://teams.microsoft.com/l/meetup-join/ehcm-room');
    } else if (fmt === 'On-site') {
      setMeetingLink('Pune HQ - Room 302, Executive Conference Suite');
    } else if (fmt === 'Phone') {
      setMeetingLink('+91 98230 11223 (HR Conference Line)');
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
      selectedPanel.length === 0 ? 'Technical Interviewer' : selectedPanel.length === 1 ? 'HR Interviewer' : 'Panel Member';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Interview scheduled successfully! Panel members notified.');
      onSuccess?.();
      onClose();
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
      position: position || 'Product Designer',
      requisitionCode: requisitionCode || 'JR-2026-001',
      jobOpeningId: jobOpeningId || undefined,
      interviewDate,
      startTime,
      interviewFormat,
      meetingLink,
      notes,
      panelMemberIds,
      panelMemberRoles,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Schedule Interview & Assign Panel
          </DialogTitle>
          <DialogDescription className="text-xs">
            Schedule a technical or HR interview for shortlisted candidates and assign mandatory panel evaluators.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Candidate & Position Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/60">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Candidate Name *</Label>
              <Select
                value={candidateId}
                onValueChange={(val) => {
                  setCandidateId(val);
                  const found = availableCandidates.find((c) => c.id === val);
                  if (found) {
                    setPosition(found.jobOpening?.title || 'Product Designer');
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
              <Label className="text-xs font-semibold">Target Position & Requisition</Label>
              <div className="flex gap-2">
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Position Title"
                  className="h-9 text-xs bg-background flex-1"
                />
                <Input
                  value={requisitionCode}
                  onChange={(e) => setRequisitionCode(e.target.value)}
                  placeholder="JR Code"
                  className="h-9 text-xs bg-background w-28 font-mono"
                />
              </div>
            </div>
          </div>

          {/* MANDATORY INTERVIEWER PANEL SELECTION */}
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Assigned Interviewer Panel *
                <Badge className="bg-primary/20 text-primary text-[10px] ml-1">Mandatory</Badge>
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
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {item.employee.firstName.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-xs font-semibold text-foreground block">
                        {item.employee.firstName} {item.employee.lastName}
                      </strong>
                      <span className="text-[11px] text-muted-foreground block">
                        {item.employee.designation?.title || 'Panelist'} • {item.employee.department?.name || 'HR'}
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
                        <SelectItem value="HR Interviewer" className="text-xs">HR Interviewer</SelectItem>
                        <SelectItem value="Domain Specialist" className="text-xs">Domain Specialist</SelectItem>
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

          {/* Date, Time & Format Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <Label className="text-xs font-semibold">Format</Label>
              <Select value={interviewFormat} onValueChange={handleFormatChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="On-site">On-site HQ</SelectItem>
                  <SelectItem value="Phone">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting Link / Location */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Meeting Link / Location Room *</Label>
            <Input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="e.g. https://meet.google.com/abc-def-ghi"
              className="h-9 text-xs font-mono"
              required
            />
          </div>

          {/* Guidelines / Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Interview Instructions & Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter technical focus areas, coding topics, or HR instructions for panel members..."
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
              className="h-9 text-xs gap-1 font-semibold bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
