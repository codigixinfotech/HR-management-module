import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  TrendingUp,
  Star,
  UserX,
  FileDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';

interface CandidateItem {
  id: string;
  name: string;
  role: string;
  stage: 'SCREENING' | 'TECHNICAL_INTERVIEW' | 'HR_ROUND' | 'OFFER_RELEASED' | 'REJECTED';
  rating: string;
  score: string;
  source: string;
  status: 'APPLIED' | 'INTERVIEWING' | 'SHORTLISTED' | 'OFFERED' | 'REJECTED';
}

const INITIAL_CANDIDATES: CandidateItem[] = [
  { id: 'CND-801', name: 'Siddharth Rao', role: 'Senior React Architect', stage: 'TECHNICAL_INTERVIEW', rating: '4.8/5', score: '92%', source: 'LinkedIn Sourced', status: 'SHORTLISTED' },
  { id: 'CND-802', name: 'Neha Gupta', role: 'DevOps & Kubernetes Engineer', stage: 'HR_ROUND', rating: '4.5/5', score: '88%', source: 'Careers Portal', status: 'INTERVIEWING' },
  { id: 'CND-803', name: 'Vikramaditya Singh', role: 'Product Design Manager', stage: 'OFFER_RELEASED', rating: '4.9/5', score: '95%', source: 'Employee Referral', status: 'OFFERED' },
  { id: 'CND-804', name: 'Ananya Deshmukh', role: 'HR Operations Lead', stage: 'SCREENING', rating: '4.2/5', score: '81%', source: 'LinkedIn Sourced', status: 'APPLIED' },
  { id: 'CND-805', name: 'Kabir Mehta', role: 'Staff Node.js Engineer', stage: 'TECHNICAL_INTERVIEW', rating: '4.7/5', score: '90%', source: 'Indeed Sourced', status: 'INTERVIEWING' },
  { id: 'CND-806', name: 'Pooja Sharma', role: 'Lead Data Analyst', stage: 'SCREENING', rating: '3.8/5', score: '72%', source: 'Careers Portal', status: 'REJECTED' },
];

export function CandidatesTab() {
  const [candidates, setCandidates] = useState<CandidateItem[]>(INITIAL_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Senior React Architect');
  const [formSource, setFormSource] = useState('LinkedIn Sourced');
  const [formScore, setFormScore] = useState('85%');

  const openAddModal = () => {
    setFormName('');
    setFormRole('Senior React Architect');
    setFormSource('LinkedIn Sourced');
    setFormScore('85%');
    setIsOpen(true);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Candidate full name is required');
      return;
    }

    const newCandidate: CandidateItem = {
      id: `CND-80${candidates.length + 1}`,
      name: formName,
      role: formRole,
      stage: 'SCREENING',
      rating: 'Pending',
      score: formScore,
      source: formSource,
      status: 'APPLIED',
    };

    setCandidates(prev => [...prev, newCandidate]);
    toast.success('Candidate profile added successfully');
    setIsOpen(false);
  };

  const handleAdvanceStage = (id: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        let nextStage = c.stage;
        let nextStatus = c.status;
        if (c.stage === 'SCREENING') {
          nextStage = 'TECHNICAL_INTERVIEW';
          nextStatus = 'INTERVIEWING';
        } else if (c.stage === 'TECHNICAL_INTERVIEW') {
          nextStage = 'HR_ROUND';
          nextStatus = 'SHORTLISTED';
        } else if (c.stage === 'HR_ROUND') {
          nextStage = 'OFFER_RELEASED';
          nextStatus = 'OFFERED';
        }
        return { ...c, stage: nextStage, status: nextStatus };
      }),
    );
    toast.success('Candidate advanced to next evaluation stage');
  };

  const handleReject = (id: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id ? { ...c, stage: 'REJECTED', status: 'REJECTED' } : c,
      ),
    );
    toast.error('Candidate marked as rejected');
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage =
        selectedStage === 'all' ? true : c.stage.toLowerCase() === selectedStage.toLowerCase();
      return matchesSearch && matchesStage;
    });
  }, [candidates, searchQuery, selectedStage]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Pipeline Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Sourced</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{candidates.length} Profiles</p>
              <p className="text-[10px] text-primary font-semibold mt-1">LinkedIn & Portal Sync</p>
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {candidates.filter(c => c.status === 'INTERVIEWING').length} Candidates
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">86.4%</p>
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {candidates.filter(c => c.status === 'OFFERED').length} Released
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Approval pending</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Evaluation Pipeline Master Directory ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Evaluation Directory & Candidate Pipeline
              </CardTitle>
              <CardDescription className="text-xs">
                Review applicant screening matching parameters, technical panels, assessment reviews & stage controls
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'screening', label: 'Screening' },
                  { id: 'technical_interview', label: 'Tech Round' },
                  { id: 'hr_round', label: 'HR Round' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedStage(cat.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedStage === cat.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search candidate name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
                    <DialogTitle>Add Candidate Profile</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddCandidate}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        placeholder="Candidate Name"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
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
                        <Label className="text-xs">Sourcing Channel</Label>
                        <Select value={formSource} onValueChange={setFormSource}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LinkedIn Sourced" className="text-xs">LinkedIn Sourced</SelectItem>
                            <SelectItem value="Careers Portal" className="text-xs">Careers Portal</SelectItem>
                            <SelectItem value="Employee Referral" className="text-xs">Employee Referral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">AI Resume Match Score</Label>
                      <Input
                        placeholder="e.g. 88%"
                        value={formScore}
                        onChange={e => setFormScore(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Add Candidate
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
                <TableHead className="text-xs">Full Name</TableHead>
                <TableHead className="text-xs">Applied Position</TableHead>
                <TableHead className="text-xs">Sourcing Channel</TableHead>
                <TableHead className="text-xs">Current Stage</TableHead>
                <TableHead className="text-xs">AI Match Score</TableHead>
                <TableHead className="text-xs">Panel Score</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map(c => (
                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{c.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{c.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{c.role}</TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">{c.source}</TableCell>
                  <TableCell className="text-xs font-mono text-[11px] font-semibold uppercase">{c.stage}</TableCell>
                  <TableCell className="text-xs font-semibold text-emerald-600 font-mono">{c.score}</TableCell>
                  <TableCell className="text-xs font-mono">{c.rating}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={c.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {c.stage !== 'OFFER_RELEASED' && c.stage !== 'REJECTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                        onClick={() => handleAdvanceStage(c.id)}
                      >
                        Advance
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Download Resume">
                      <FileDown className="h-3.5 w-3.5" />
                    </Button>
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
