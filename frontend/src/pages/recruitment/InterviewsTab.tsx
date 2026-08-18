import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Video,
  MapPin,
  Clock,
  User,
  Users,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { jobOpeningsApi, candidatesApi } from '@/api/recruitment';
import { useNavigate } from 'react-router-dom';
import type { CandidateStage } from '@/api/types';

interface InterviewItem {
  id: string;
  candidateId?: string;
  candidate: string;
  role: string;
  reqCode: string;
  panel: string;
  time: string;
  format: 'Google Meet' | 'In-person Pune HQ' | 'Microsoft Teams';
  status: 'READY_TO_SCHEDULE' | 'SCHEDULED' | 'PENDING_FEEDBACK' | 'COMPLETED' | 'CANCELLED';
}

export function InterviewsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [scheduledCustomPanels, setScheduledCustomPanels] = useState<InterviewItem[]>([]);

  // Fetch real Job Openings and candidates from DB
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Extract candidates whose stage is 'INTERVIEW'
  const dbInterviewCandidates = useMemo(() => {
    const list: InterviewItem[] = [];
    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c) => {
          if (c.stage === 'INTERVIEW') {
            list.push({
              id: `INT-${c.id.substring(0, 6).toUpperCase()}`,
              candidateId: c.id,
              candidate: `${c.firstName} ${c.lastName}`,
              role: job.title,
              reqCode: job.requisitionCode || 'JR-2026-001',
              panel: 'Rajesh Sharma (CTO)',
              time: '06 Aug 2026, 11:00 AM',
              format: 'Google Meet',
              status: 'READY_TO_SCHEDULE',
            });
          }
        });
      }
    });
    return list;
  }, [openings]);

  // Combine DB candidates with any locally scheduled panels
  const allInterviews = useMemo(() => {
    const combined = [...dbInterviewCandidates];
    scheduledCustomPanels.forEach((custom) => {
      const idx = combined.findIndex(
        (item) => item.candidateId && item.candidateId === custom.candidateId,
      );
      if (idx !== -1) {
        combined[idx] = { ...combined[idx], ...custom, status: custom.status };
      } else {
        combined.push(custom);
      }
    });
    return combined;
  }, [dbInterviewCandidates, scheduledCustomPanels]);

  // Stage Mutation to advance candidate when interview feedback is completed
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Candidate advanced to OFFERED stage!');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update stage'),
  });

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [formCandidate, setFormCandidate] = useState('');
  const [formRole, setFormRole] = useState('Chief Technology Officer');
  const [formPanel, setFormPanel] = useState('Rajesh Sharma (CTO)');
  const [formTime, setFormTime] = useState('06 Aug 2026, 11:00 AM');
  const [formFormat, setFormFormat] = useState<'Google Meet' | 'In-person Pune HQ' | 'Microsoft Teams'>('Google Meet');

  const openAddModal = (cand?: InterviewItem) => {
    if (cand) {
      setSelectedCandidateId(cand.candidateId || '');
      setFormCandidate(cand.candidate);
      setFormRole(cand.role);
    } else {
      setSelectedCandidateId('');
      setFormCandidate('');
      setFormRole(openings[0]?.title || 'Chief Technology Officer');
    }
    setFormPanel('Rajesh Sharma (CTO)');
    setFormTime('06 Aug 2026, 11:00 AM');
    setFormFormat('Google Meet');
    setIsOpen(true);
  };

  const handleAddInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate) {
      toast.error('Candidate name is required');
      return;
    }

    const newInterview: InterviewItem = {
      id: `INT-${Math.floor(100 + Math.random() * 900)}`,
      candidateId: selectedCandidateId || undefined,
      candidate: formCandidate,
      role: formRole,
      reqCode: 'JR-2026-001',
      panel: formPanel,
      time: formTime,
      format: formFormat,
      status: 'SCHEDULED',
    };

    setScheduledCustomPanels((prev) => {
      const filtered = prev.filter(
        (item) => !selectedCandidateId || item.candidateId !== selectedCandidateId,
      );
      return [...filtered, newInterview];
    });
    toast.success(`Interview scheduled successfully for ${formCandidate}`);
    setIsOpen(false);
  };

  const handleCancelInterview = (id: string) => {
    setScheduledCustomPanels((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'CANCELLED' } : i)),
    );
    toast.error('Interview cancelled');
  };

  const handleFeedbackSubmit = (item: InterviewItem) => {
    setScheduledCustomPanels((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'COMPLETED' } : i)),
    );
    if (item.candidateId) {
      updateStageMutation.mutate(
        { id: item.candidateId, stage: 'OFFERED' },
        {
          onSuccess: () => {
            toast.success(
              `Scorecard logged! Candidate selected & offer letter auto-generated. Opening Offers & Joining module...`,
            );
            navigate('/recruitment/offers');
          },
        },
      );
    } else {
      toast.success('Interview scorecard logged! Opening Offers & Joining module...');
      navigate('/recruitment/offers');
    }
  };

  const filteredInterviews = useMemo(() => {
    return allInterviews.filter((i) => {
      const matchesSearch =
        i.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.panel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFormat =
        selectedFormat === 'all'
          ? true
          : selectedFormat === 'online'
          ? i.format.includes('Meet') || i.format.includes('Teams')
          : i.format.includes('In-person');
      return matchesSearch && matchesFormat;
    });
  }, [allInterviews, searchQuery, selectedFormat]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Interview Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ready to Schedule</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allInterviews.filter((i) => i.status === 'READY_TO_SCHEDULE').length} Candidates
              </p>
              <p className="text-[10px] text-primary font-semibold mt-1">Shortlisted from Screening</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Panels</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allInterviews.filter((i) => i.status === 'SCHEDULED').length} Active
              </p>
              <p className="text-[10px] text-blue-600 font-semibold mt-1">Upcoming technical rounds</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completed Rounds</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allInterviews.filter((i) => i.status === 'COMPLETED').length} Evaluated
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Scorecards submitted</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Panel Evaluators</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">18 Pool</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Active panelists mapped</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Scheduled Interview Panels Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Interview Schedule & Shortlisted Candidates
              </CardTitle>
              <CardDescription className="text-xs">
                Candidates in INTERVIEW stage dynamically load here for panel allocation and technical scorecards
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'online', label: 'Video Call' },
                  { id: 'onsite', label: 'On-Site HQ' },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedFormat === format.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter candidate or panel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Interview Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => openAddModal()}>
                    <Plus className="h-3.5 w-3.5" /> Schedule Panel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Schedule Interview Panel</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddInterview}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Candidate Name</Label>
                      {dbInterviewCandidates.length > 0 ? (
                        <Select
                          value={selectedCandidateId}
                          onValueChange={(val) => {
                            setSelectedCandidateId(val);
                            const cand = dbInterviewCandidates.find((c) => c.candidateId === val);
                            if (cand) {
                              setFormCandidate(cand.candidate);
                              setFormRole(cand.role);
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select candidate in INTERVIEW stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {dbInterviewCandidates.map((c) => (
                              <SelectItem key={c.id} value={c.candidateId || c.id} className="text-xs">
                                {c.candidate} ({c.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g. Siddharth Rao"
                          value={formCandidate}
                          onChange={(e) => setFormCandidate(e.target.value)}
                          className="h-9 text-xs"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target Position</Label>
                        <Input
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Assigned Interviewer Panel</Label>
                        <Select value={formPanel} onValueChange={setFormPanel}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select panel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rajesh Sharma (CTO)" className="text-xs">
                              Rajesh Sharma (CTO)
                            </SelectItem>
                            <SelectItem value="Priya Verma (HR Lead)" className="text-xs">
                              Priya Verma (HR Lead)
                            </SelectItem>
                            <SelectItem value="Karan Malhotra (VP Product)" className="text-xs">
                              Karan Malhotra (VP Product)
                            </SelectItem>
                            <SelectItem value="Aishwarya Roy (Director HR)" className="text-xs">
                              Aishwarya Roy (Director HR)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date & Start Time</Label>
                        <Input
                          placeholder="e.g. 06 Aug 2026, 11:00 AM"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Interview Format</Label>
                        <Select value={formFormat} onValueChange={(v) => setFormFormat(v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Google Meet" className="text-xs">
                              Google Meet
                            </SelectItem>
                            <SelectItem value="In-person Pune HQ" className="text-xs">
                              In-person Pune HQ
                            </SelectItem>
                            <SelectItem value="Microsoft Teams" className="text-xs">
                              Microsoft Teams
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs font-semibold">
                        Confirm Schedule
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredInterviews.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-muted/20 space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">No Candidates in Interview Stage</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Advance candidates from <strong className="text-primary">Candidates $\rightarrow$ SCREENING $\rightarrow$ INTERVIEW</strong> to populate them here for schedule allocation.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Candidate Name</TableHead>
                  <TableHead className="text-xs">Target Position</TableHead>
                  <TableHead className="text-xs">Interviewer Panel</TableHead>
                  <TableHead className="text-xs">Date & Time</TableHead>
                  <TableHead className="text-xs">Format & Location</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((i) => (
                  <TableRow key={i.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{i.id}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{i.candidate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{i.role}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {i.panel}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {i.time}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        {i.format.includes('In-person') ? (
                          <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <Video className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        {i.format}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {i.status === 'READY_TO_SCHEDULE' ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-semibold">
                          READY TO SCHEDULE
                        </Badge>
                      ) : (
                        <StatusBadge status={i.status} className="text-[10px]" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {i.status === 'READY_TO_SCHEDULE' && (
                          <Button
                            size="sm"
                            className="h-7 text-[10.5px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1"
                            onClick={() => openAddModal(i)}
                          >
                            <Calendar className="h-3 w-3" /> Schedule
                          </Button>
                        )}
                        {i.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                              onClick={() => handleFeedbackSubmit(i)}
                            >
                              Submit Scorecard
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleCancelInterview(i.id)}
                              title="Cancel Panel"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {i.status === 'COMPLETED' && (
                          <Badge variant="outline" className="text-[9.5px] text-emerald-600 border-emerald-300 font-semibold">
                            Evaluated
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
