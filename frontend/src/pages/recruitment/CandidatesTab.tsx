import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  TrendingUp,
  Star,
  UserX,
  Briefcase,
  UserCheck,
  ClipboardCheck,
  Award,
} from 'lucide-react';
import { jobOpeningsApi, candidatesApi } from '@/api/recruitment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { CandidateStage } from '@/api/types';

export function CandidatesTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Modal State: Add Candidate
  const [isOpen, setIsOpen] = useState(false);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Modal State: Focused Screening Evaluation Form
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [screeningCandidate, setScreeningCandidate] = useState<any>(null);
  const [relExperience, setRelExperience] = useState('6 Years');
  const [techRating, setTechRating] = useState('4');
  const [commRating, setCommRating] = useState('4');
  const [overallRating, setOverallRating] = useState('4');
  const [screeningRemarks, setScreeningRemarks] = useState('');
  const [screeningDecision, setScreeningDecision] = useState<'SHORTLIST' | 'HOLD' | 'REJECT'>('SHORTLIST');

  // Fetch Job Openings to associate candidate with real Job Requisition (JR-2026-001)
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Extract all candidates from openings
  const allCandidates = useMemo(() => {
    const list: any[] = [];
    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c) => {
          list.push({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            phone: c.phone || 'N/A',
            role: job.title,
            reqCode: job.requisitionCode || job.mrNumber || 'JR-2026-001',
            jobId: job.id,
            stage: c.stage || 'APPLIED',
            rating: '4.8/5',
            score: c.aiMatchScore ? `${c.aiMatchScore}%` : '88%',
            source: c.source || 'Careers Portal',
            experience: c.experience || '6 Years',
            qualification: c.qualification || 'Graduate',
            status: c.stage === 'HIRED' ? 'OFFERED' : c.stage === 'REJECTED' ? 'REJECTED' : 'APPLIED',
            createdAt: c.createdAt,
          });
        });
      }
    });

    return list;
  }, [openings]);

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update candidate stage'),
  });

  const addCandidateMutation = useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) =>
      jobOpeningsApi.addCandidate(jobId, payload),
    onSuccess: (candidate) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success(`Candidate ${candidate.firstName} ${candidate.lastName} added successfully (Status: APPLIED)`);
      setIsOpen(false);
      setFormFirstName('');
      setFormLastName('');
      setFormEmail('');
      setFormPhone('');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to add candidate'),
  });

  const openAddModal = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setSelectedJobId(openings[0]?.id || '');
    setIsOpen(true);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim()) {
      toast.error('First Name and Last Name are required');
      return;
    }
    if (!formEmail.trim()) {
      toast.error('Email Address is required');
      return;
    }
    if (!selectedJobId) {
      toast.error('Target Job Requisition is required');
      return;
    }

    addCandidateMutation.mutate({
      jobId: selectedJobId,
      payload: {
        firstName: formFirstName,
        lastName: formLastName,
        email: formEmail,
        phone: formPhone || undefined,
        stage: 'APPLIED',
      },
    });
  };

  // Open Focused Screening Evaluation Form
  const openScreeningModal = (candidate: any) => {
    setScreeningCandidate(candidate);
    setRelExperience(candidate.experience || '6 Years Relevant Experience');
    setTechRating('4');
    setCommRating('4');
    setOverallRating('4');
    setScreeningRemarks('Strong technical foundation, excellent domain understanding, recommended for technical interview.');
    setScreeningDecision('SHORTLIST');
    setIsScreeningOpen(true);
  };

  const handleSaveScreening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screeningCandidate) return;

    let targetStage: CandidateStage = 'INTERVIEW';
    if (screeningDecision === 'SHORTLIST') {
      targetStage = 'INTERVIEW';
    } else if (screeningDecision === 'HOLD') {
      targetStage = 'APPLIED';
    } else if (screeningDecision === 'REJECT') {
      targetStage = 'REJECTED';
    }

    updateStageMutation.mutate(
      { id: screeningCandidate.id, stage: targetStage },
      {
        onSuccess: () => {
          setIsScreeningOpen(false);
          if (screeningDecision === 'SHORTLIST') {
            toast.success(
              `Screening Saved! ${screeningCandidate.name} shortlisted. Opening Interviews module...`,
            );
            navigate('/recruitment/interviews');
          } else if (screeningDecision === 'HOLD') {
            toast.info(`Candidate ${screeningCandidate.name} put on HOLD.`);
          } else {
            toast.error(`Candidate ${screeningCandidate.name} DECLINED.`);
          }
        },
      },
    );
  };

  const handleAdvanceStage = (c: any) => {
    if (c.stage === 'APPLIED' || c.stage === 'SCREENING') {
      openScreeningModal(c);
    } else if (c.stage === 'INTERVIEW') {
      updateStageMutation.mutate({ id: c.id, stage: 'OFFERED' });
      toast.success(`${c.name} advanced to OFFERED stage`);
    } else if (c.stage === 'OFFERED') {
      updateStageMutation.mutate({ id: c.id, stage: 'HIRED' });
      toast.success(`${c.name} HIRED successfully!`);
    }
  };

  const handleReject = (id: string) => {
    updateStageMutation.mutate({ id, stage: 'REJECTED' });
    toast.error('Candidate marked as REJECTED');
  };

  const filteredCandidates = useMemo(() => {
    return allCandidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reqCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage =
        selectedStage === 'all' ? true : c.stage.toLowerCase() === selectedStage.toLowerCase();
      return matchesSearch && matchesStage;
    });
  }, [allCandidates, searchQuery, selectedStage]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Pipeline Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Applicants</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{allCandidates.length} Profiles</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Careers & Portal Sync</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Interviews</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allCandidates.filter((c) => c.stage === 'INTERVIEW').length} Candidates
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Technical Rounds Scheduled</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Average Match Rate</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">88.5%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">AI Resume Screen Score</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Star className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Offer Stage</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allCandidates.filter((c) => c.stage === 'OFFERED').length} Released
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Approval Pending</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Candidate Directory & Application Pipeline Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Candidate Directory & Application Pipeline
              </CardTitle>
              <CardDescription className="text-xs">
                Real candidate applications linked to published Job Requisitions (e.g., JR-2026-001)
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'applied', label: 'Applied' },
                  { id: 'screening', label: 'Screening' },
                  { id: 'interview', label: 'Interview' },
                  { id: 'offered', label: 'Offered' },
                ].map((stg) => (
                  <button
                    key={stg.id}
                    onClick={() => setSelectedStage(stg.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedStage === stg.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {stg.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search candidate or JR code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Candidate Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Candidate Profile</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddCandidate}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">First Name *</Label>
                        <Input
                          placeholder="e.g. Pratham"
                          value={formFirstName}
                          onChange={(e) => setFormFirstName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Last Name *</Label>
                        <Input
                          placeholder="e.g. Shelke"
                          value={formLastName}
                          onChange={(e) => setFormLastName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="pratham@example.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mobile Number</Label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Job Requisition *</Label>
                      <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select target job" />
                        </SelectTrigger>
                        <SelectContent>
                          {openings.map((job) => (
                            <SelectItem key={job.id} value={job.id} className="text-xs">
                              {job.title} ({job.requisitionCode || 'JR-2026-001'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        size="sm"
                        className="text-xs font-semibold"
                        disabled={addCandidateMutation.isPending}
                      >
                        Create Candidate Profile
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
                <TableHead className="text-xs">Candidate ID</TableHead>
                <TableHead className="text-xs">Full Name & Email</TableHead>
                <TableHead className="text-xs">Applied Position</TableHead>
                <TableHead className="text-xs">Job Requisition</TableHead>
                <TableHead className="text-xs">Sourcing Channel</TableHead>
                <TableHead className="text-xs">Current Stage</TableHead>
                <TableHead className="text-xs">AI Match Score</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                    No candidates found for the selected stage filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {c.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground block">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">{c.email}</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {c.role}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-primary">{c.reqCode}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{c.source}</TableCell>
                    <TableCell className="text-xs font-mono text-[11px] font-semibold uppercase">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {c.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600 font-mono">{c.score}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.stage !== 'HIRED' && c.stage !== 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                            onClick={() => handleAdvanceStage(c)}
                            disabled={updateStageMutation.isPending}
                          >
                            {c.stage === 'APPLIED'
                              ? 'Start Screening'
                              : c.stage === 'SCREENING'
                              ? 'Shortlist Interview'
                              : c.stage === 'INTERVIEW'
                              ? 'Release Offer'
                              : 'Hire'}
                          </Button>
                        )}
                        {c.stage !== 'REJECTED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(c.id)}
                            title="Decline Candidate"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── 3. Focused Candidate Screening Evaluation Dialog Modal ── */}
      <Dialog open={isScreeningOpen} onOpenChange={setIsScreeningOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Candidate Screening Evaluation
            </DialogTitle>
          </DialogHeader>

          {screeningCandidate && (
            <form onSubmit={handleSaveScreening} className="space-y-4 pt-1">
              {/* READ-ONLY SUMMARY HEADER */}
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Candidate Name:</span>
                  <strong className="text-foreground font-semibold text-xs">{screeningCandidate.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Applied Position:</span>
                  <strong className="text-foreground font-semibold text-xs">{screeningCandidate.role}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Job Requisition:</span>
                  <strong className="text-primary font-mono font-bold text-xs">{screeningCandidate.reqCode}</strong>
                </div>
              </div>

              {/* EVALUATION FIELDS ONLY */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Relevant Experience Summary</Label>
                <Input
                  value={relExperience}
                  onChange={(e) => setRelExperience(e.target.value)}
                  placeholder="e.g. 6 Years in Cloud Architecture & Team Leadership"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Technical Rating</Label>
                  <Select value={techRating} onValueChange={setTechRating}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="text-xs">5 ★★★★★ (Exceptional)</SelectItem>
                      <SelectItem value="4" className="text-xs">4 ★★★★☆ (Strong)</SelectItem>
                      <SelectItem value="3" className="text-xs">3 ★★★☆☆ (Average)</SelectItem>
                      <SelectItem value="2" className="text-xs">2 ★★☆☆☆ (Below Avg)</SelectItem>
                      <SelectItem value="1" className="text-xs">1 ★☆☆☆☆ (Poor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Communication</Label>
                  <Select value={commRating} onValueChange={setCommRating}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="text-xs">5 ★★★★★ (Fluent)</SelectItem>
                      <SelectItem value="4" className="text-xs">4 ★★★★☆ (Good)</SelectItem>
                      <SelectItem value="3" className="text-xs">3 ★★★☆☆ (Acceptable)</SelectItem>
                      <SelectItem value="2" className="text-xs">2 ★★☆☆☆ (Needs Work)</SelectItem>
                      <SelectItem value="1" className="text-xs">1 ★☆☆☆☆ (Poor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Profile Match</Label>
                  <Select value={overallRating} onValueChange={setOverallRating}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="text-xs">5 ★★★★★ (Best Fit)</SelectItem>
                      <SelectItem value="4" className="text-xs">4 ★★★★☆ (Good Fit)</SelectItem>
                      <SelectItem value="3" className="text-xs">3 ★★★☆☆ (Moderate)</SelectItem>
                      <SelectItem value="2" className="text-xs">2 ★★☆☆☆ (Low Fit)</SelectItem>
                      <SelectItem value="1" className="text-xs">1 ★☆☆☆☆ (Mismatch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Screening Remarks & Observations</Label>
                <Textarea
                  value={screeningRemarks}
                  onChange={(e) => setScreeningRemarks(e.target.value)}
                  placeholder="Key technical strengths, culture fit notes, or specific areas for interview panel..."
                  className="text-xs min-h-[60px]"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Screening Decision</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScreeningDecision('SHORTLIST')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      screeningDecision === 'SHORTLIST'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreeningDecision('HOLD')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      screeningDecision === 'HOLD'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" /> Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreeningDecision('REJECT')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      screeningDecision === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <UserX className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs border-t">
                <div>
                  <span className="text-[10.5px] text-muted-foreground block">Screened By</span>
                  <strong className="text-foreground font-medium text-[11px]">Aishwarya Roy (Director HR)</strong>
                </div>
                <div>
                  <span className="text-[10.5px] text-muted-foreground block">Screening Date</span>
                  <strong className="text-foreground font-mono text-[11px]">17 Aug 2026, 03:25 PM</strong>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsScreeningOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
                  disabled={updateStageMutation.isPending}
                >
                  <UserCheck className="h-3.5 w-3.5" /> Save Screening
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
