import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';

interface InterviewItem {
  id: string;
  candidate: string;
  role: string;
  panel: string;
  time: string;
  format: 'Google Meet' | 'In-person Pune HQ' | 'Microsoft Teams';
  status: 'SCHEDULED' | 'PENDING_FEEDBACK' | 'COMPLETED' | 'CANCELLED';
}

const INITIAL_INTERVIEWS: InterviewItem[] = [
  { id: 'INT-501', candidate: 'Siddharth Rao', role: 'Senior React Architect', panel: 'Rajesh Sharma (CTO)', time: '05 Aug 2026, 11:00 AM', format: 'Google Meet', status: 'SCHEDULED' },
  { id: 'INT-502', candidate: 'Neha Gupta', role: 'DevOps & Kubernetes Engineer', panel: 'Priya Verma (HR Lead)', time: '05 Aug 2026, 03:00 PM', format: 'In-person Pune HQ', status: 'SCHEDULED' },
  { id: 'INT-503', candidate: 'Vikramaditya Singh', role: 'Product Design Manager', panel: 'Karan Malhotra (VP Product)', time: '04 Aug 2026, 02:00 PM', format: 'Google Meet', status: 'COMPLETED' },
  { id: 'INT-504', candidate: 'Ananya Deshmukh', role: 'HR Operations Lead', stage: 'SCREENING', panel: 'Aishwarya Roy (Director HR)', time: '04 Aug 2026, 04:30 PM', format: 'Google Meet', status: 'PENDING_FEEDBACK' } as any,
];

export function InterviewsTab() {
  const [interviews, setInterviews] = useState<InterviewItem[]>(INITIAL_INTERVIEWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formCandidate, setFormCandidate] = useState('');
  const [formRole, setFormRole] = useState('Senior React Architect');
  const [formPanel, setFormPanel] = useState('Rajesh Sharma (CTO)');
  const [formTime, setFormTime] = useState('06 Aug 2026, 11:00 AM');
  const [formFormat, setFormFormat] = useState<'Google Meet' | 'In-person Pune HQ' | 'Microsoft Teams'>('Google Meet');

  const openAddModal = () => {
    setFormCandidate('');
    setFormRole('Senior React Architect');
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
      id: `INT-50${interviews.length + 1}`,
      candidate: formCandidate,
      role: formRole,
      panel: formPanel,
      time: formTime,
      format: formFormat,
      status: 'SCHEDULED',
    };

    setInterviews(prev => [...prev, newInterview]);
    toast.success('Interview panel scheduled successfully');
    setIsOpen(false);
  };

  const handleCancelInterview = (id: string) => {
    setInterviews(prev =>
      prev.map(i =>
        i.id === id ? { ...i, status: 'CANCELLED' } : i,
      ),
    );
    toast.error('Interview cancelled');
  };

  const handleFeedbackSubmit = (id: string) => {
    setInterviews(prev =>
      prev.map(i =>
        i.id === id ? { ...i, status: 'COMPLETED' } : i,
      ),
    );
    toast.success('Interview scorecard feedback logged successfully!');
  };

  const filteredInterviews = useMemo(() => {
    return interviews.filter(i => {
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
  }, [interviews, searchQuery, selectedFormat]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Interview Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Scheduled</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {interviews.filter(i => i.status === 'SCHEDULED').length} Active
              </p>
              <p className="text-[10px] text-primary font-semibold mt-1">Due this week</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completed Panels</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {interviews.filter(i => i.status === 'COMPLETED').length} Rounds
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Scorecards logged</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Feedback</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {interviews.filter(i => i.status === 'PENDING_FEEDBACK').length} Reviews
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Awaiting CTO / HR sign-off</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Panel Evaluators</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">18 Pool</p>
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
                <Calendar className="h-4 w-4 text-primary" /> Interview Schedule & Panel Allocations
              </CardTitle>
              <CardDescription className="text-xs">
                Manage upcoming panels, video link sync, classroom assignments, and technical evaluation feedback
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'online', label: 'Video Call' },
                  { id: 'onsite', label: 'On-Site HQ' },
                ].map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedFormat === format.id
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
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Interview Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
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
                      <Input
                        placeholder="e.g. Siddharth Rao"
                        value={formCandidate}
                        onChange={e => setFormCandidate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target Position</Label>
                        <Select value={formRole} onValueChange={setFormRole}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Senior React Architect" className="text-xs">Senior React Architect</SelectItem>
                            <SelectItem value="DevOps & Kubernetes Engineer" className="text-xs">DevOps Engineer</SelectItem>
                            <SelectItem value="Product Design Manager" className="text-xs">Product Designer</SelectItem>
                            <SelectItem value="HR Operations Lead" className="text-xs">HR Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Assigned Interviewer Panel</Label>
                        <Select value={formPanel} onValueChange={setFormPanel}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select panel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rajesh Sharma (CTO)" className="text-xs">Rajesh Sharma (CTO)</SelectItem>
                            <SelectItem value="Priya Verma (HR Lead)" className="text-xs">Priya Verma (HR Lead)</SelectItem>
                            <SelectItem value="Karan Malhotra (VP Product)" className="text-xs">Karan Malhotra (VP Product)</SelectItem>
                            <SelectItem value="Aishwarya Roy (Director HR)" className="text-xs">Aishwarya Roy (Director HR)</SelectItem>
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
                          onChange={e => setFormTime(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Interview Location Format</Label>
                        <Select value={formFormat} onValueChange={v => setFormFormat(v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Google Meet" className="text-xs">Google Meet</SelectItem>
                            <SelectItem value="In-person Pune HQ" className="text-xs">In-person Pune HQ</SelectItem>
                            <SelectItem value="Microsoft Teams" className="text-xs">Microsoft Teams</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Candidate</TableHead>
                <TableHead className="text-xs">Target Role</TableHead>
                <TableHead className="text-xs">Interviewer Panel</TableHead>
                <TableHead className="text-xs">Date & Time</TableHead>
                <TableHead className="text-xs">Format & Room</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.map(i => (
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
                    <StatusBadge status={i.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {i.status === 'PENDING_FEEDBACK' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold animate-pulse"
                        onClick={() => handleFeedbackSubmit(i.id)}
                      >
                        Submit Scorecard
                      </Button>
                    )}
                    {i.status === 'SCHEDULED' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleCancelInterview(i.id)} title="Cancel Panel">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
