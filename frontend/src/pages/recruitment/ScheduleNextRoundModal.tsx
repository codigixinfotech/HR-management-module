import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Video,
  User,
  Users,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  Plus,
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
import type { CandidateInterview, Employee } from '@/api/types';

interface ScheduleNextRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousInterview: CandidateInterview | null;
  onSuccess?: (newInterviewId?: string) => void;
}

interface PanelSelectionItem {
  employee: Employee;
  role: string;
}

export function ScheduleNextRoundModal({
  isOpen,
  onClose,
  previousInterview,
  onSuccess,
}: ScheduleNextRoundModalProps) {
  const queryClient = useQueryClient();

  // Form states
  const [interviewRound, setInterviewRound] = useState<string>('Round 2');
  const [interviewType, setInterviewType] = useState<string>('Technical Interview');
  const [interviewDate, setInterviewDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState<string>('11:00 AM');
  const [interviewFormat, setInterviewFormat] = useState<string>('Google Meet');
  const [meetingLink, setMeetingLink] = useState<string>('https://meet.google.com/ehcm-interview-room');
  const [instructions, setInstructions] = useState<string>('');

  // Panel selection
  const [selectedPanel, setSelectedPanel] = useState<PanelSelectionItem[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');

  // Fetch Master Employee List for Panel Selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees-panel-roster'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeesList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(employeesData)) list = employeesData;
    else if (employeesData && Array.isArray((employeesData as any).items)) list = (employeesData as any).items;
    else if (employeesData && Array.isArray((employeesData as any).data)) list = (employeesData as any).data;

    // Fallback roster if DB is empty or loading
    if (list.length === 0) {
      return [
        { id: 'emp-priya', firstName: 'Priya', lastName: 'Nair', employeeCode: 'EMP-101', department: { name: 'Human Resources' }, designation: { title: 'HR Interviewer' } },
        { id: 'emp-liam', firstName: 'Liam', lastName: 'Bose', employeeCode: 'EMP-102', department: { name: 'Human Resources' }, designation: { title: 'Panel Member' } },
        { id: 'emp-sanika', firstName: 'Sanika', lastName: 'Mote', employeeCode: 'EMP-103', department: { name: 'Human Resources' }, designation: { title: 'Technical Interviewer' } },
        { id: 'emp-rajesh', firstName: 'Rajesh', lastName: 'Sharma', employeeCode: 'EMP-8265', department: { name: 'Engineering' }, designation: { title: 'Chief Technology Officer' } },
      ];
    }
    return list;
  }, [employeesData]);

  // Pre-fill panel from previous interview if available
  useEffect(() => {
    if (isOpen && previousInterview) {
      const prefilled: PanelSelectionItem[] = [];

      if (previousInterview.panelMembers && previousInterview.panelMembers.length > 0) {
        previousInterview.panelMembers.forEach((pm, idx) => {
          let found = employeesList.find((e) => e.id === pm.interviewerId);
          if (!found && pm.interviewerName) {
            found = employeesList.find(
              (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === pm.interviewerName.toLowerCase(),
            );
          }
          if (!found && employeesList.length > idx) {
            found = employeesList[idx];
          }
          if (!found && employeesList.length > 0) {
            found = employeesList[0];
          }

          if (found) {
            prefilled.push({
              employee: found,
              role: pm.panelRole || 'Panel Member',
            });
          }
        });
      }

      if (prefilled.length === 0 && employeesList.length > 0) {
        employeesList.slice(0, 3).forEach((emp, idx) => {
          prefilled.push({
            employee: emp,
            role: idx === 0 ? 'Technical Interviewer' : idx === 1 ? 'HR Interviewer' : 'Panel Member',
          });
        });
      }

      setSelectedPanel(prefilled);
    }
  }, [isOpen, previousInterview, employeesList]);

  // Handle Format Changes
  const handleFormatChange = (fmt: string) => {
    setInterviewFormat(fmt);
    if (fmt === 'Google Meet') {
      setMeetingLink('https://meet.google.com/ehcm-next-round');
    } else if (fmt === 'Microsoft Teams') {
      setMeetingLink('https://teams.microsoft.com/l/meetup-join/ehcm-next-round');
    } else if (fmt === 'In Person') {
      setMeetingLink('Pune HQ - Executive Boardroom 401');
    } else if (fmt === 'Phone') {
      setMeetingLink('+91 98230 11223 (HR Conference)');
    }
  };

  // Add Member to Panel
  const handleAddPanelMember = (empId: string) => {
    const emp = employeesList.find((e) => e.id === empId);
    if (!emp) return;
    if (selectedPanel.some((p) => p.employee.id === empId)) {
      toast.error(`${emp.firstName} ${emp.lastName} is already added to the panel.`);
      return;
    }
    const defaultRole =
      selectedPanel.length === 0
        ? 'Technical Interviewer'
        : selectedPanel.length === 1
        ? 'HR Interviewer'
        : 'Panel Member';
    setSelectedPanel((prev) => [...prev, { employee: emp, role: defaultRole }]);
    setEmployeeSearch('');
  };

  // Remove Member
  const handleRemovePanelMember = (empId: string) => {
    setSelectedPanel((prev) => prev.filter((p) => p.employee.id !== empId));
  };

  // Role Change
  const handleRoleChange = (empId: string, newRole: string) => {
    setSelectedPanel((prev) =>
      prev.map((p) => (p.employee.id === empId ? { ...p, role: newRole } : p)),
    );
  };

  // Filtered employees for dropdown
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

  // Create Next Round Mutation
  const createNextRoundMutation = useMutation({
    mutationFn: (payload: any) => interviewsApi.create(payload),
    onSuccess: (newInterview) => {
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      queryClient.invalidateQueries({ queryKey: ['panel-reminders'] });
      queryClient.refetchQueries({ queryKey: ['interviews-list'] });

      toast.success(`${interviewRound} Scheduled Successfully!`, {
        description: `New Interview ID: ${newInterview.interviewCode}`,
        action: {
          label: 'View New Interview',
          onClick: () => {
            if (onSuccess) onSuccess(newInterview.id);
          },
        },
      });

      if (onSuccess) {
        onSuccess(newInterview.id);
      }
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to schedule next interview round.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previousInterview) {
      toast.error('Previous interview details missing.');
      return;
    }
    if (!interviewDate) {
      toast.error('Interview Date is required.');
      return;
    }
    if (!startTime) {
      toast.error('Interview Time is required.');
      return;
    }
    if (selectedPanel.length === 0) {
      toast.error('Please assign at least one interview panel member.');
      return;
    }

    const panelMemberIds = selectedPanel.map((p) => p.employee.id);
    const panelMemberRoles: Record<string, string> = {};
    selectedPanel.forEach((p) => {
      panelMemberRoles[p.employee.id] = p.role;
    });

    const formattedNotes = `[${interviewRound} - ${interviewType}] Prev ID: ${previousInterview.interviewCode}. ${
      instructions ? `Focus Areas: ${instructions}` : ''
    }`.trim();

    createNextRoundMutation.mutate({
      candidateId: previousInterview.candidateId,
      position: previousInterview.position,
      requisitionCode: previousInterview.requisitionCode || 'JR-2026-001',
      jobOpeningId: previousInterview.jobOpeningId || undefined,
      interviewDate: new Date(interviewDate).toISOString(),
      startTime,
      interviewFormat,
      meetingLink,
      notes: formattedNotes,
      panelMemberIds,
      panelMemberRoles,
      createdByName: 'HR Manager (Admin)',
    });
  };

  if (!isOpen || !previousInterview) return null;

  const candidateFullName = previousInterview.candidate
    ? `${previousInterview.candidate.firstName} ${previousInterview.candidate.lastName}`
    : 'Casey Stone';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-border/80 gap-0 p-0">
        {/* Header */}
        <DialogHeader className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary text-[10px] font-bold">
              Post-Evaluation Roster Flow
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Prev ID: {previousInterview.interviewCode}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Schedule Next Interview Round
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Schedule a follow-up interview round for candidate <strong>{candidateFullName}</strong> ({previousInterview.position}).
          </DialogDescription>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Read-Only Row: Candidate & Previous Interview ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-xl border border-border/60">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-semibold">1. Candidate (Read-Only)</Label>
              <Input
                value={`${candidateFullName} (${previousInterview.position})`}
                readOnly
                className="h-8 text-xs font-semibold bg-background/80 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-semibold">2. Previous Interview ID (Read-Only)</Label>
              <Input
                value={previousInterview.interviewCode}
                readOnly
                className="h-8 text-xs font-mono font-bold bg-background/80 text-primary cursor-not-allowed"
              />
            </div>
          </div>

          {/* Round & Type Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">3. Interview Round *</Label>
              <Select value={interviewRound} onValueChange={setInterviewRound}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Round 2" className="text-xs">Round 2</SelectItem>
                  <SelectItem value="Round 3" className="text-xs">Round 3</SelectItem>
                  <SelectItem value="Round 4" className="text-xs">Round 4</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other / Executive Round</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">4. Interview Type *</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical Interview" className="text-xs">Technical Interview</SelectItem>
                  <SelectItem value="HR Interview" className="text-xs">HR Interview</SelectItem>
                  <SelectItem value="Managerial Interview" className="text-xs">Managerial Interview</SelectItem>
                  <SelectItem value="Final Interview" className="text-xs">Final Interview</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">5. Interview Date *</Label>
              <Input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="h-9 text-xs font-mono bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">6. Interview Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="h-9 text-xs bg-background font-mono">
                  <SelectValue placeholder="Select Start Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                  <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                  <SelectItem value="03:00 PM">03:00 PM</SelectItem>
                  <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                  <SelectItem value="05:00 PM">05:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Format & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">7. Interview Format *</Label>
              <Select value={interviewFormat} onValueChange={handleFormatChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="In Person">In Person / On-site</SelectItem>
                  <SelectItem value="Phone">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">8. Meeting Link / Location *</Label>
              <Input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Meeting URL or room location..."
                className="h-9 text-xs font-mono bg-background"
                required
              />
            </div>
          </div>

          {/* Panel Selection */}
          <div className="space-y-2 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> 9. Interview Panel Members ({selectedPanel.length} Selected) *
              </Label>
              <span className="text-[11px] text-muted-foreground">Assign technical / HR panel</span>
            </div>

            {/* Dropdown to add member */}
            <div className="flex gap-2">
              <Select onValueChange={handleAddPanelMember}>
                <SelectTrigger className="h-9 text-xs bg-background flex-1">
                  <SelectValue placeholder="Select employee to add to interview panel..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {filteredEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.firstName} {emp.lastName} ({emp.designation?.title || 'Employee'}) — {emp.department?.name || 'HR'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Panel Members Roster List */}
            <div className="space-y-2 pt-1">
              {selectedPanel.map((item) => (
                <div
                  key={item.employee.id}
                  className="flex flex-wrap items-center justify-between p-2.5 bg-muted/30 border border-border/70 rounded-xl text-xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                      {item.employee.firstName[0]}
                    </div>
                    <div>
                      <strong className="text-foreground block font-bold">
                        {item.employee.firstName} {item.employee.lastName}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        {item.employee.designation?.title || 'Staff'} • {item.employee.department?.name || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={item.role}
                      onValueChange={(val) => handleRoleChange(item.employee.id, val)}
                    >
                      <SelectTrigger className="h-7 text-[11px] w-[160px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical Interviewer">Technical Interviewer</SelectItem>
                        <SelectItem value="HR Interviewer">HR Interviewer</SelectItem>
                        <SelectItem value="Managerial Interviewer">Managerial Interviewer</SelectItem>
                        <SelectItem value="Panel Member">Panel Member</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                      onClick={() => handleRemovePanelMember(item.employee.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {selectedPanel.length === 0 && (
                <div className="p-3 text-center text-xs text-rose-600 bg-rose-500/10 rounded-xl border border-rose-200">
                  Please add at least 1 panel member to conduct this interview round.
                </div>
              )}
            </div>
          </div>

          {/* 10. Focus Areas / Instructions (MUST BE VISIBLE) */}
          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" /> 10. Interview Instructions / Focus Areas (Optional)
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus on System Design, Microservices scalability, and Team leadership capabilities..."
              className="text-xs min-h-[75px] bg-background"
            />
            <span className="text-[10.5px] text-muted-foreground block">
              These instructions will be visible to panel members in their interview dashboard & automated notifications.
            </span>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t border-border/60 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={createNextRoundMutation.isPending || selectedPanel.length === 0}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Schedule Round
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
