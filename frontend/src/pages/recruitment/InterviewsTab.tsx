import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Video,
  Clock,
  UserCheck,
  Play,
  Check,
  Star,
  Eye,
  FileCheck,
  FileSignature,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';
import { interviewsApi } from '@/api/interviews';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { InterviewDetailsModal } from './InterviewDetailsModal';
import { useAuthStore } from '@/stores/auth-store';

import { InterviewReminderNotifier, InterviewReminderBanner } from '@/components/recruitment/InterviewReminderNotifier';
import { toast } from 'sonner';

export function InterviewsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Active persona selection for testing interviewer vs HR view
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [viewScope, setViewScope] = useState<'ALL' | 'MY_INTERVIEWS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');

  // Pagination State for Interviews Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch Master Employees List to choose active interviewer persona
  const { data: employeesData } = useQuery({
    queryKey: ['employees-master-list'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeesList = useMemo(() => {
    return employeesData?.items || [];
  }, [employeesData]);

  // Determine active logged-in employee persona
  const activeEmployee = useMemo(() => {
    if (selectedPersonaId) {
      const found = employeesList.find((e) => e.id === selectedPersonaId);
      if (found) return found;
    }
    const uAny = user as any;
    if (user?.email) {
      const emailLower = user.email.toLowerCase();
      const foundByEmail = employeesList.find(
        (e) => e.workEmail?.toLowerCase() === emailLower || e.personalEmail?.toLowerCase() === emailLower,
      );
      if (foundByEmail) return foundByEmail;
    }
    const rajesh = employeesList.find((e) => e.firstName.toLowerCase().includes('rajesh'));
    if (rajesh) return rajesh;
    return employeesList[0] || null;
  }, [selectedPersonaId, employeesList, user]);

  const activeEmployeeName = activeEmployee
    ? `${activeEmployee.firstName} ${activeEmployee.lastName}`
    : (user as any)?.name || 'Rajesh Sharma (CTO)';

  // Fetch active interview reminders for active persona
  const { data: reminders = [] } = useQuery({
    queryKey: ['interview-reminders', activeEmployee?.id],
    queryFn: () => (activeEmployee?.id ? interviewsApi.getReminders(activeEmployee.id) : []),
    enabled: Boolean(activeEmployee?.id),
    refetchInterval: 15000,
  });

  // Fetch Dashboard Summary KPIs
  const { data: summary } = useQuery({
    queryKey: ['interviews-summary'],
    queryFn: () => interviewsApi.getSummary(),
  });

  // Fetch Interviews List from Backend API
  const { data: interviewsList = [], isLoading } = useQuery({
    queryKey: ['interviews-list', viewScope, activeEmployee?.id, activeTabFilter, searchQuery, selectedFormat],
    queryFn: () =>
      interviewsApi.list({
        interviewerId: viewScope === 'MY_INTERVIEWS' ? activeEmployee?.id : undefined,
        status: activeTabFilter !== 'ALL' && activeTabFilter !== 'TODAY' && activeTabFilter !== 'UPCOMING' ? activeTabFilter : undefined,
        filterTab: activeTabFilter === 'TODAY' ? 'today' : activeTabFilter === 'UPCOMING' ? 'upcoming' : undefined,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
      }),
  });

  // Filter list by format if needed
  const filteredInterviews = useMemo(() => {
    if (selectedFormat === 'ALL') return interviewsList;
    return interviewsList.filter((i) => i.interviewFormat === selectedFormat);
  }, [interviewsList, selectedFormat]);

  const handleOpenDetails = (id: string) => {
    setSelectedInterviewId(id);
    setIsDetailsOpen(true);
  };

  const statusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'EVALUATED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 flex items-center gap-1">
            <Check className="h-3 w-3" /> Evaluated
          </Badge>
        );
      case 'SELECTED':
        return (
          <Badge className="bg-emerald-600 text-white font-bold flex items-center gap-1">
            <Check className="h-3 w-3 text-white" /> Selected
          </Badge>
        );
      case 'REJECTED':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300">Rejected</Badge>;
      case 'NEXT_ROUND':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-blue-600" /> Next Round
          </Badge>
        );
      case 'ON_HOLD':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" /> On Hold
          </Badge>
        );
      case 'EVALUATION_PENDING':
      case 'COMPLETED':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending Evaluation
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1">
            <Play className="h-3 w-3 text-blue-600" /> In Progress
          </Badge>
        );
      case 'CANCELLED':
        return <Badge className="bg-rose-500/15 text-rose-700 border-rose-300">Cancelled</Badge>;
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifier for 15-min and Starting Now alerts */}
      <InterviewReminderNotifier
        activeEmployeeId={activeEmployee?.id}
        activeEmployeeName={activeEmployeeName}
        onOpenDetails={handleOpenDetails}
      />

      {/* Top Banner Alert for Active Reminders */}
      <InterviewReminderBanner
        reminders={reminders}
        activeEmployeeName={activeEmployeeName}
        onOpenDetails={handleOpenDetails}
      />
      {/* Active Interviewer Persona Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            {activeEmployeeName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">{activeEmployeeName}</h3>
              <Badge className="bg-primary/15 text-primary text-[10px]">Active Evaluator Persona</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeEmployee?.designation?.title || 'CTO'} • {activeEmployee?.department?.name || 'Technology'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Persona:</Label>
            <Select value={activeEmployee?.id || ''} onValueChange={(val) => setSelectedPersonaId(val)}>
              <SelectTrigger className="h-9 text-xs w-[220px] bg-background">
                <SelectValue placeholder="Select Evaluator Persona" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {employeesList.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-xs">
                    {emp.firstName} {emp.lastName} ({emp.designation?.title || emp.department?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setIsScheduleOpen(true)}
            className="h-9 text-xs font-semibold shadow-sm gap-1.5 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Schedule Interview Panel
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Total Scheduled</span>
          <strong className="text-xl font-bold text-foreground">{summary?.total || filteredInterviews.length}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Ready to Schedule</span>
          <strong className="text-xl font-bold text-primary">{summary?.readyToSchedule || 0}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Active Panels</span>
          <strong className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary?.scheduled || 0}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Today's Rounds</span>
          <strong className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary?.todaysInterviews || 0}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Completed</span>
          <strong className="text-xl font-bold text-teal-600 dark:text-teal-400">{summary?.completed || 0}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Pending Feedback</span>
          <strong className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary?.pendingEvaluation || 0}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Evaluated</span>
          <strong className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary?.evaluated || 0}</strong>
        </Card>
      </div>

      {/* Main Interviews Roster & Filter Bar */}
      <Card className="border border-border/60 bg-card">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Candidate Interview Schedule & Panel Evaluation Roster
            </CardTitle>
            <CardDescription className="text-xs">
              Manage interview panels, conduct technical evaluations, log 1-5 scorecards, and review ratings.
            </CardDescription>
          </div>

          {/* Scope Toggle: All Interviews vs My Assigned Interviews */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
            <Button
              variant={viewScope === 'ALL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewScope('ALL')}
              className="h-7 text-xs px-3 rounded-lg font-semibold"
            >
              All Interviews (HR)
            </Button>
            <Button
              variant={viewScope === 'MY_INTERVIEWS' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewScope('MY_INTERVIEWS')}
              className="h-7 text-xs px-3 rounded-lg font-semibold gap-1"
            >
              <UserCheck className="h-3.5 w-3.5" /> My Assigned ({activeEmployeeName.split(' ')[0]})
            </Button>
          </div>
        </CardHeader>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, requisition code, position, or panel member..."
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={activeTabFilter} onValueChange={setActiveTabFilter}>
              <SelectTrigger className="h-9 text-xs w-[150px] bg-background">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED" className="text-xs">Scheduled</SelectItem>
                <SelectItem value="TODAY" className="text-xs">Today's Rounds</SelectItem>
                <SelectItem value="UPCOMING" className="text-xs">Upcoming</SelectItem>
                <SelectItem value="EVALUATION_PENDING" className="text-xs">Pending Feedback</SelectItem>
                <SelectItem value="EVALUATED" className="text-xs">Evaluated</SelectItem>
                <SelectItem value="SELECTED" className="text-xs">Selected</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                <SelectItem value="NEXT_ROUND" className="text-xs">Next Round</SelectItem>
                <SelectItem value="ON_HOLD" className="text-xs">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="h-9 text-xs w-[140px] bg-background">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Formats</SelectItem>
                <SelectItem value="Google Meet" className="text-xs">Google Meet</SelectItem>
                <SelectItem value="Microsoft Teams" className="text-xs">Microsoft Teams</SelectItem>
                <SelectItem value="On-site" className="text-xs">On-site HQ</SelectItem>
                <SelectItem value="Phone" className="text-xs">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40 text-[10px] uppercase tracking-wider font-semibold">
                <TableRow>
                  <TableHead className="py-3 px-4">Interview ID</TableHead>
                  <TableHead className="py-3 px-4">Candidate & Position</TableHead>
                  <TableHead className="py-3 px-4">Assigned Interview Panel</TableHead>
                  <TableHead className="py-3 px-4">Date & Time</TableHead>
                  <TableHead className="py-3 px-4">Format & Meeting Link</TableHead>
                  <TableHead className="py-3 px-4">Status</TableHead>
                  <TableHead className="py-3 px-4">Panel Rating</TableHead>
                  <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 font-medium">
                {(() => {
                  const totalInterviews = filteredInterviews.length;
                  const totalPages = Math.max(1, Math.ceil(totalInterviews / pageSize));
                  const clampedPage = Math.min(Math.max(1, currentPage), totalPages);
                  const startIndex = (clampedPage - 1) * pageSize;
                  const paginatedInterviews = filteredInterviews.slice(startIndex, startIndex + pageSize);

                  return paginatedInterviews.map((item) => {
                    const isAssigned = item.panelMembers.some(
                      (pm) => pm.interviewerId === activeEmployee?.id,
                    );
                    const evalCount = item.evaluations?.length || 0;
                    const panelCount = item.panelMembers?.length || 1;

                    // Compute average panel rating
                    const avgRating =
                      evalCount > 0
                        ? Math.round(
                            (item.evaluations.reduce((a, b) => a + b.overallRating, 0) / evalCount) * 10,
                          ) / 10
                        : 0;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-3 px-4 font-mono font-bold text-primary">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{item.interviewCode}</span>
                            {item.notes?.includes('Round 2') ? (
                              <Badge className="bg-blue-600 text-white text-[9.5px] px-1.5 py-0 font-bold">Round 2</Badge>
                            ) : item.notes?.includes('Round 3') ? (
                              <Badge className="bg-purple-600 text-white text-[9.5px] px-1.5 py-0 font-bold">Round 3</Badge>
                            ) : item.notes?.includes('Round 4') ? (
                              <Badge className="bg-indigo-600 text-white text-[9.5px] px-1.5 py-0 font-bold">Round 4</Badge>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4">
                          <div className="font-semibold text-foreground">
                            {item.candidate ? `${item.candidate.firstName} ${item.candidate.lastName}` : 'Candidate'}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <span>{item.position}</span>
                            <span>•</span>
                            <span className="font-mono">{item.requisitionCode || 'JR-2026-001'}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {item.panelMembers.map((pm) => {
                                const isMe = pm.interviewerId === activeEmployee?.id;
                                return (
                                  <Badge
                                    key={pm.id}
                                    variant={isMe ? 'default' : 'outline'}
                                    className={`text-[10px] flex items-center gap-1 ${
                                      isMe ? 'bg-primary/20 text-primary border-primary/30 font-bold' : 'bg-background'
                                    }`}
                                  >
                                    <span>{pm.interviewerName}</span>
                                    <span className="text-[9px] text-muted-foreground">– {pm.panelRole}</span>
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4">
                          <div className="font-mono text-[11px]">
                            {new Date(item.interviewDate).toLocaleDateString('en-GB')}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.startTime}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {item.interviewFormat}
                            </Badge>
                            {item.meetingLink && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                <a
                                  href={item.meetingLink.startsWith('http') ? item.meetingLink : '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Join Meeting"
                                >
                                  <Video className="h-3.5 w-3.5 text-primary" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4">{statusBadge(item.status)}</TableCell>

                        <TableCell className="py-3 px-4">
                          {avgRating > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                <span>{avgRating}/5.0</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block">
                                ({evalCount}/{panelCount} Evaluated)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No ratings yet</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.teamsJoinUrl || item.meetingLink ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300 font-semibold gap-1 hover:bg-indigo-100"
                                asChild
                              >
                                <a href={item.teamsJoinUrl || item.meetingLink} target="_blank" rel="noreferrer">
                                  <Video className="h-3.5 w-3.5 text-indigo-600" /> Join Teams
                                </a>
                              </Button>
                            ) : null}

                            {item.status === 'SELECTED' && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs"
                                onClick={() => {
                                  const candName = item.candidate
                                    ? `${item.candidate.firstName} ${item.candidate.lastName}`
                                    : 'Selected Candidate';
                                  const urlParams = new URLSearchParams({
                                    autoCreate: 'true',
                                    candidateId: item.candidateId || '',
                                    candidateName: candName,
                                    candidateEmail: item.candidate?.email || 'candidate@example.com',
                                    position: item.position || 'Product Designer',
                                    requisitionCode: item.requisitionCode || 'JR-2026-001',
                                    interviewCode: item.interviewCode || 'INT-2026-001',
                                  });
                                  navigate(`/recruitment/offers?${urlParams.toString()}`);
                                }}
                              >
                                <FileSignature className="h-3.5 w-3.5" /> Release Offer
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleOpenDetails(item.id)}
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>

                            {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    const newDate = prompt('Enter new Interview Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                                    const newTime = prompt('Enter new Start Time (e.g. 02:00 PM):', '02:00 PM');
                                    if (newDate && newTime) {
                                      try {
                                        await interviewsApi.reschedule(item.id, { interviewDate: newDate, startTime: newTime });
                                        queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
                                        toast.success('Interview rescheduled & Teams calendar invite updated!');
                                      } catch (err) {
                                        toast.error('Failed to reschedule interview');
                                      }
                                    }
                                  }}
                                  className="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50"
                                >
                                  Reschedule
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to cancel interview ${item.interviewCode}? Teams calendar event will be revoked.`)) {
                                      try {
                                        await interviewsApi.cancel(item.id, 'Cancelled by recruiter');
                                        queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
                                        toast.success(`Interview ${item.interviewCode} cancelled and Teams invite revoked.`);
                                      } catch (err) {
                                        toast.error('Failed to cancel interview');
                                      }
                                    }
                                  }}
                                  className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}

                            {isAssigned && item.status !== 'SELECTED' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenDetails(item.id)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                              >
                                <FileCheck className="h-3.5 w-3.5" /> Evaluate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}

                {filteredInterviews.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                      No interview schedules found matching your scope/filter. Click{' '}
                      <strong>Schedule Interview Panel</strong> to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Global Reusable EHCM ERP Pagination Component */}
          {filteredInterviews.length > 0 && (
            <Pagination
              totalRecords={filteredInterviews.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="interviews"
              className="p-4"
            />
          )}
        </CardContent>
      </Card>

      {/* SCHEDULE INTERVIEW MODAL */}
      <ScheduleInterviewModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
          queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
        }}
      />

      {/* INTERVIEW DETAILS & EVALUATION MODAL */}
      <InterviewDetailsModal
        interviewId={selectedInterviewId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedInterviewId(null);
        }}
        activeEmployeeId={activeEmployee?.id}
        activeEmployeeName={activeEmployeeName}
        onScheduleNextRoundSuccess={(newInterviewId) => {
          setIsDetailsOpen(false);
          queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
          queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
          setTimeout(() => {
            setSelectedInterviewId(newInterviewId);
            setIsDetailsOpen(true);
          }, 250);
        }}
      />
    </div>
  );
}
