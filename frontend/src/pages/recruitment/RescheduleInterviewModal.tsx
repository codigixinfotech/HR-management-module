import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  DoorOpen,
  Video,
  PhoneCall,
  Users,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X,
  History,
  ShieldCheck,
  Send,
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
import { useRecruitmentConfig } from '@/hooks/useRecruitmentConfig';
import { employeesApi } from '@/api/employees';
import { interviewsApi } from '@/api/interviews';
import type { CandidateInterview, Employee } from '@/api/types';

interface RescheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: CandidateInterview | null;
  onSuccess?: () => void;
}

const RESCHEDULE_REASONS = [
  'Panel member unavailable',
  'Candidate requested time change',
  'Room / Facility conflict',
  'Technical / Infrastructure issue',
  'Emergency / Unforeseen conflict',
  'Hiring priority rescheduled',
  'Other operational reason',
];

const ALL_INTERVIEW_TYPES = [
  'Microsoft Teams',
  'Google Meet',
  'In-Person / Offline',
  'Phone Call',
];

export function RescheduleInterviewModal({
  isOpen,
  onClose,
  interview,
  onSuccess,
}: RescheduleInterviewModalProps) {
  const queryClient = useQueryClient();
  const {
    interviewMode: configInterviewMode,
    defaultInterviewLocation,
    defaultInterviewBuilding,
    defaultInterviewRoom,
  } = useRecruitmentConfig();

  // Master employees roster for panel assignment
  const { data: employeesData } = useQuery({
    queryKey: ['employees-panel-roster'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
    enabled: isOpen,
  });
  const employeesList = useMemo(() => employeesData?.items || [], [employeesData]);

  // Form states
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('11:00 AM');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [interviewFormat, setInterviewFormat] = useState<string>('In-Person / Offline');

  // Venue states
  const [location, setLocation] = useState<string>('Pune Manufacturing Plant');
  const [building, setBuilding] = useState<string>('Administration Block');
  const [room, setRoom] = useState<string>('HR Interview Room 1');

  // Online meeting link
  const [meetingLink, setMeetingLink] = useState<string>('');

  // Panel state
  const [selectedPanel, setSelectedPanel] = useState<Array<{ employeeId: string; name: string; role: string; designation?: string }>>([]);

  // Reschedule reasons and remarks
  const [reason, setReason] = useState<string>('Panel member unavailable');
  const [remarks, setRemarks] = useState<string>('');

  // Notifications
  const [notifyCandidate, setNotifyCandidate] = useState<boolean>(true);
  const [notifyPanel, setNotifyPanel] = useState<boolean>(true);

  // Sync state when modal opens or interview prop changes
  useEffect(() => {
    if (interview && isOpen) {
      const origDateIso = new Date(interview.interviewDate).toISOString().split('T')[0];
      setInterviewDate(origDateIso);
      setStartTime(interview.startTime || '11:00 AM');
      setDurationMinutes(interview.durationMinutes || 60);

      const format = interview.interviewFormat || (interview.interviewMode === 'OFFLINE' ? 'In-Person / Offline' : 'Microsoft Teams');
      setInterviewFormat(format === 'On-site HQ' || format === 'On-site' ? 'In-Person / Offline' : format);

      setLocation(interview.location || defaultInterviewLocation || 'Pune Manufacturing Plant');
      setBuilding(interview.building || defaultInterviewBuilding || 'Administration Block');
      setRoom(interview.room || defaultInterviewRoom || 'HR Interview Room 1');

      setMeetingLink(interview.meetingLink || '');
      setReason('Panel member unavailable');
      setRemarks('');
      setNotifyCandidate(true);
      setNotifyPanel(true);

      // Populate existing panel members
      if (interview.panelMembers && interview.panelMembers.length > 0) {
        setSelectedPanel(
          interview.panelMembers.map((pm: any) => ({
            employeeId: pm.interviewerId || pm.id,
            name: pm.interviewerName || `${pm.interviewer?.firstName || ''} ${pm.interviewer?.lastName || ''}`.trim() || 'Panel Member',
            role: pm.panelRole || 'Interviewer',
            designation: pm.designation || pm.interviewer?.designation?.title,
          }))
        );
      } else {
        setSelectedPanel([]);
      }
    }
  }, [interview, isOpen, defaultInterviewLocation, defaultInterviewBuilding, defaultInterviewRoom]);

  const isOffline =
    interviewFormat === 'In-Person / Offline' ||
    interviewFormat === 'In-Person' ||
    interviewFormat === 'On-site HQ' ||
    interviewFormat === 'On-site';

  // Format change handler
  const handleFormatChange = (fmt: string) => {
    setInterviewFormat(fmt);
    if (fmt === 'Microsoft Teams') {
      if (!meetingLink || meetingLink.includes('meet.google.com')) {
        setMeetingLink('https://teams.microsoft.com/l/meetup-join/ehcm-rescheduled-room');
      }
    } else if (fmt === 'Google Meet') {
      setMeetingLink('https://meet.google.com/ehcm-interview-room');
    } else if (fmt === 'In-Person / Offline') {
      setMeetingLink('');
    } else if (fmt === 'Phone Call') {
      setMeetingLink('+91 98230 11223 (HR Conference Line)');
    }
  };

  // Add panel member
  const handleAddPanelMember = (empId: string) => {
    const emp = employeesList.find((e) => e.id === empId);
    if (!emp) return;
    if (selectedPanel.some((p) => p.employeeId === empId)) {
      toast.error(`${emp.firstName} ${emp.lastName} is already assigned to this panel.`);
      return;
    }
    const defaultRole = selectedPanel.length === 0 ? 'Technical Interviewer' : selectedPanel.length === 1 ? 'Hiring Manager' : 'Panel Member';
    setSelectedPanel((prev) => [
      ...prev,
      {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        role: defaultRole,
        designation: emp.designation?.title,
      },
    ]);
  };

  // Remove panel member
  const handleRemovePanelMember = (empId: string) => {
    setSelectedPanel((prev) => prev.filter((p) => p.employeeId !== empId));
  };

  // Change role
  const handleRoleChange = (empId: string, newRole: string) => {
    setSelectedPanel((prev) =>
      prev.map((p) => (p.employeeId === empId ? { ...p, role: newRole } : p))
    );
  };

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: (payload: any) => interviewsApi.reschedule(interview!.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
      queryClient.invalidateQueries({ queryKey: ['interview-detail', interview?.id] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });

      toast.success(
        `Interview ${interview?.interviewCode} rescheduled successfully! Slot updated to ${new Date(interviewDate).toLocaleDateString('en-GB')} at ${startTime}.`
      );
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const rawMsg = err?.response?.data?.message || err?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : typeof rawMsg === 'string' ? rawMsg : 'Failed to reschedule interview.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    if (!interviewDate) {
      toast.error('Please select a valid new interview date.');
      return;
    }
    if (!startTime.trim()) {
      toast.error('Please specify the interview start time.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please select the reason for rescheduling.');
      return;
    }

    if (isOffline) {
      if (!location.trim()) {
        toast.error('Interview Location is mandatory for In-Person interviews.');
        return;
      }
      if (!room.trim()) {
        toast.error('Interview Room is mandatory for In-Person interviews.');
        return;
      }
    }

    const panelMemberIds = selectedPanel.map((p) => p.employeeId);
    const panelMemberRoles: Record<string, string> = {};
    selectedPanel.forEach((p) => {
      panelMemberRoles[p.employeeId] = p.role;
    });

    const origDateStr = new Date(interview.interviewDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    rescheduleMutation.mutate({
      interviewDate,
      startTime,
      durationMinutes,
      interviewFormat: isOffline ? 'In-Person / Offline' : interviewFormat,
      interviewMode: isOffline ? 'OFFLINE' : 'ONLINE',
      location: isOffline ? location : null,
      building: isOffline ? building : null,
      room: isOffline ? room : null,
      meetingLink: isOffline ? null : meetingLink,
      reason,
      remarks,
      panelMemberIds,
      panelMemberRoles,
      notifyCandidate,
      notifyPanel,
      rescheduledByName: 'HR Administrator',
      originalInterviewDate: origDateStr,
      originalStartTime: interview.startTime,
    });
  };

  if (!interview) return null;

  const candidateName = interview.candidate
    ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
    : 'Candidate';
  const positionTitle = interview.position || interview.jobOpening?.title || 'Role';
  const reqCode = interview.requisitionCode || interview.jobOpening?.requisitionCode || 'JR-2026-001';

  const origFormattedDate = new Date(interview.interviewDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 border-border/80 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-indigo-600" /> Reschedule Interview
                <Badge variant="outline" className="font-mono text-[11px] font-semibold text-primary border-primary/30">
                  {interview.interviewCode}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update the interview date/time without creating a duplicate interview.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Candidate & Current Schedule Summary Card */}
          <div className="p-4 rounded-xl border border-border/70 bg-gradient-to-r from-slate-50 via-background to-indigo-50/20 dark:from-slate-900/60 dark:via-background dark:to-indigo-950/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Candidate
                </span>
                <strong className="text-sm font-bold text-foreground block">{candidateName}</strong>
                <span className="text-xs text-muted-foreground">
                  {positionTitle} • {reqCode}
                </span>
              </div>
              <Badge className="bg-indigo-600 text-white font-bold text-xs self-start sm:self-center">
                Updating {interview.interviewCode} In-Place
              </Badge>
            </div>

            <div className="pt-2.5 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Current Schedule:</span>
                <strong className="text-foreground flex items-center gap-1.5 pt-0.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  {origFormattedDate} • {interview.startTime} ({interview.durationMinutes || 60} Min)
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">Current Venue / Type:</span>
                <span className="text-foreground flex items-center gap-1.5 pt-0.5 truncate">
                  {interview.interviewMode === 'OFFLINE' || interview.interviewFormat === 'In-Person / Offline' ? (
                    <>
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {interview.location || 'Pune Plant'}{interview.room ? ` • ${interview.room}` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{interview.interviewFormat || 'Microsoft Teams'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Section: New Interview Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> New Interview Schedule
              </span>
            </div>

            {/* Row 1: Date, Start Time, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Interview Date *</Label>
                <Input
                  type="date"
                  value={interviewDate}
                  min={new Date().toISOString().split('T')[0]}
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
                    <SelectItem value="30" className="text-xs">30 Minutes</SelectItem>
                    <SelectItem value="45" className="text-xs">45 Minutes</SelectItem>
                    <SelectItem value="60" className="text-xs">60 Minutes</SelectItem>
                    <SelectItem value="90" className="text-xs">90 Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Interview Type */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Interview Type *</Label>
              <Select value={interviewFormat} onValueChange={handleFormatChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Interview Type..." />
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

            {/* Conditional Venue / Meeting Link Fields */}
            {isOffline ? (
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <Label className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      In-Person Interview Venue
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
                    Room Conflict Checked
                  </Badge>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Interview Location *</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Pune Manufacturing Plant"
                    className="h-9 text-xs bg-background"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Building / Area</Label>
                    <Input
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="Administration Block"
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Interview Room *</Label>
                    <Input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="HR Interview Room 1"
                      className="h-9 text-xs bg-background"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-primary" /> Online Meeting Link / Conference
                  </Label>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                    Online Active
                  </span>
                </div>
                <Input
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
            )}
          </div>

          {/* Section: Interview Panel Members */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Interview Panel Members
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedPanel.length} Interviewer(s) Assigned
              </span>
            </div>

            {/* Panel members list */}
            <div className="space-y-2">
              {selectedPanel.map((item) => (
                <div
                  key={item.employeeId}
                  className="p-2.5 bg-background rounded-lg border border-border/70 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-xs font-semibold text-foreground block">{item.name}</strong>
                      <span className="text-[10px] text-muted-foreground block">{item.designation || 'Panelist'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={item.role}
                      onValueChange={(val) => handleRoleChange(item.employeeId, val)}
                    >
                      <SelectTrigger className="h-7 text-[11px] w-[140px]">
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
                      onClick={() => handleRemovePanelMember(item.employeeId)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {selectedPanel.length === 0 && (
                <div className="p-3 text-center border border-dashed border-amber-300 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
                  No panel members assigned. Add interviewers from master roster below.
                </div>
              )}
            </div>

            {/* Quick Add from Master Roster */}
            <Select onValueChange={handleAddPanelMember}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="+ Add panel member from Employee Master..." />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {employeesList.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-xs">
                    {emp.firstName} {emp.lastName} — {emp.designation?.title || 'Employee'} ({emp.department?.name || 'Dept'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section: Reason & Remarks */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" /> Reason for Rescheduling *
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Rescheduling Reason..." />
                </SelectTrigger>
                <SelectContent>
                  {RESCHEDULE_REASONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Additional Remarks / Recruiter Notes</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Explain the reason or provide any special instructions for candidate and panel members..."
                className="text-xs min-h-[55px]"
              />
            </div>

            {/* Notifications */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/20 p-3 rounded-xl border border-border/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={notifyCandidate}
                  onChange={(e) => setNotifyCandidate(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <Send className="h-3.5 w-3.5 text-indigo-600" /> Notify Candidate (Email & Calendar Update)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={notifyPanel}
                  onChange={(e) => setNotifyPanel(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <Users className="h-3.5 w-3.5 text-indigo-600" /> Notify Interview Panel
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rescheduleMutation.isPending}
              className="h-9 text-xs gap-1.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" /> Reschedule Interview
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
