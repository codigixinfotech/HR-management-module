import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ListChecks,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  TrendingUp,
  Brain,
  Code,
  Sliders,
  Award,
  AlertCircle,
  FileCheck,
  Star,
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
import { StatusBadge } from '@/components/ui/status-badge';
import type { CandidateStage } from '@/api/types';

interface TestTemplate {
  id: string;
  name: string;
  dept: string;
  duration: string;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passingScore: number;
  status: 'Active' | 'Draft';
}

interface AttemptLog {
  id: string;
  candidateId?: string;
  candidate: string;
  testName: string;
  attemptDate: string;
  score: string;
  scorePercent?: number;
  passingScorePercent?: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED' | 'PENDING_REVIEW';
  strengths?: string;
  weaknesses?: string;
  comments?: string;
}

const INITIAL_TEMPLATES: TestTemplate[] = [
  { id: 'TST-201', name: 'React Architecture & State Challenge', dept: 'Engineering', duration: '90 mins', questions: 3, difficulty: 'Hard', passingScore: 70, status: 'Active' },
  { id: 'TST-202', name: 'DevOps Helm & Kubernetes Quiz', dept: 'Engineering', duration: '45 mins', questions: 30, difficulty: 'Medium', passingScore: 75, status: 'Active' },
  { id: 'TST-203', name: 'Figma Component & Styling Review', dept: 'Product Design', duration: '60 mins', questions: 1, difficulty: 'Medium', passingScore: 70, status: 'Active' },
  { id: 'TST-204', name: 'HR Compliance Scenario Analysis', dept: 'Human Resources', duration: '30 mins', questions: 15, difficulty: 'Easy', passingScore: 80, status: 'Active' },
];

const INITIAL_ATTEMPTS: AttemptLog[] = [
  { id: 'ATT-901', candidate: 'Siddharth Rao', testName: 'React Architecture & State Challenge', attemptDate: '04 Aug 2026', score: '92% (Pass)', scorePercent: 92, passingScorePercent: 70, status: 'COMPLETED' },
  { id: 'ATT-902', candidate: 'Neha Gupta', testName: 'DevOps Helm & Kubernetes Quiz', attemptDate: '05 Aug 2026', score: '88% (Pass)', scorePercent: 88, passingScorePercent: 75, status: 'COMPLETED' },
  { id: 'ATT-903', candidate: 'Kabir Mehta', testName: 'React Architecture & State Challenge', attemptDate: '05 Aug 2026', score: 'Awaiting Grading', scorePercent: 0, passingScorePercent: 70, status: 'PENDING_REVIEW' },
  { id: 'ATT-904', candidate: 'Ananya Deshmukh', testName: 'HR Compliance Scenario Analysis', attemptDate: '03 Aug 2026', score: '80% (Pass)', scorePercent: 80, passingScorePercent: 80, status: 'COMPLETED' },
  { id: 'ATT-905', candidate: 'Pooja Sharma', testName: 'Figma Component & Styling Review', attemptDate: '02 Aug 2026', score: '48% (Fail)', scorePercent: 48, passingScorePercent: 70, status: 'COMPLETED' },
];

export function AssessmentsTab() {
  const queryClient = useQueryClient();

  const [templates, setTemplates] = useState<TestTemplate[]>(INITIAL_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real database candidates from Job Openings API
  const { data: jobOpenings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Mutation: Update Candidate Stage upon grading
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update candidate stage'),
  });

  // Dynamically map real candidates to attempt logs
  const dynamicCandidateAttempts = useMemo(() => {
    const list: AttemptLog[] = [];
    jobOpenings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c: any) => {
          const isAssessmentStage =
            c.stage === 'ASSESSMENT_ASSIGNED' ||
            c.stage === 'ASSESSMENT_COMPLETED' ||
            c.stage === 'ASSESSMENT_PASSED' ||
            c.stage === 'ASSESSMENT_FAILED' ||
            c.stage === 'SHORTLISTED';

          if (isAssessmentStage) {
            const isPassed = c.stage === 'ASSESSMENT_PASSED';
            const isFailed = c.stage === 'ASSESSMENT_FAILED';
            const isDone = isPassed || isFailed;

            list.push({
              id: `ATT-${c.id}`,
              candidateId: c.id,
              candidate: `${c.firstName} ${c.lastName}`,
              testName: 'React Architecture & State Challenge',
              attemptDate: new Date(c.updatedAt || Date.now()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              score: isPassed ? '92% (Pass)' : isFailed ? '48% (Fail)' : 'Awaiting Grading',
              scorePercent: isPassed ? 92 : isFailed ? 48 : 0,
              passingScorePercent: 70,
              status: isDone ? 'COMPLETED' : 'PENDING_REVIEW',
            });
          }
        });
      }
    });

    // Merge static demo attempts if not duplicate
    INITIAL_ATTEMPTS.forEach((att) => {
      if (!list.some((a) => a.candidate.toLowerCase() === att.candidate.toLowerCase())) {
        list.push(att);
      }
    });

    return list;
  }, [jobOpenings]);

  // Modal State: Create Template
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDuration, setFormDuration] = useState('60 mins');
  const [formQuestions, setFormQuestions] = useState(5);
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [formPassingScore, setFormPassingScore] = useState(70);

  // Modal State: Grade Assessment
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [gradingAttempt, setGradingAttempt] = useState<AttemptLog | null>(null);
  const [evalScorePercent, setEvalScorePercent] = useState<number>(85);
  const [evalStrengths, setEvalStrengths] = useState<string>('Strong modular architecture, clean code practices.');
  const [evalWeaknesses, setEvalWeaknesses] = useState<string>('Minor edge case handling in asynchronous hooks.');
  const [evalComments, setEvalComments] = useState<string>('Candidate demonstrates high technical competency.');
  const [evalResult, setEvalResult] = useState<'PASS' | 'FAIL'>('PASS');

  const openAddModal = () => {
    setFormName('');
    setFormDept('Engineering');
    setFormDuration('60 mins');
    setFormQuestions(5);
    setFormDifficulty('Medium');
    setFormPassingScore(70);
    setIsOpen(true);
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Test Template Name is required');
      return;
    }

    const newTemplate: TestTemplate = {
      id: `TST-20${templates.length + 1}`,
      name: formName,
      dept: formDept,
      duration: formDuration,
      questions: formQuestions,
      difficulty: formDifficulty,
      passingScore: formPassingScore,
      status: 'Active',
    };

    setTemplates((prev) => [...prev, newTemplate]);
    toast.success('Assessment Test Template published');
    setIsOpen(false);
  };

  const openGradeModal = (attempt: AttemptLog) => {
    setGradingAttempt(attempt);
    setEvalScorePercent(85);
    setEvalStrengths('Strong modular architecture, clean state management.');
    setEvalWeaknesses('Minor async edge case handling.');
    setEvalComments('Recommended for next technical interview round.');
    setEvalResult('PASS');
    setIsGradeOpen(true);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingAttempt) return;

    const passingCutoff = gradingAttempt.passingScorePercent || 70;
    const isPassed = evalScorePercent >= passingCutoff && evalResult === 'PASS';
    const finalStatusText = isPassed ? `${evalScorePercent}% (Pass)` : `${evalScorePercent}% (Fail)`;

    if (gradingAttempt.candidateId) {
      updateStageMutation.mutate({
        id: gradingAttempt.candidateId,
        stage: isPassed ? 'ASSESSMENT_PASSED' : 'ASSESSMENT_FAILED',
      });
    }

    const nextStageText = isPassed ? 'ASSESSMENT_PASSED' : 'ASSESSMENT_FAILED';
    toast.success(
      `Evaluation submitted for ${gradingAttempt.candidate}! Score: ${finalStatusText}. Candidate stage updated to ${nextStageText}.`
    );
    setIsGradeOpen(false);
    setGradingAttempt(null);
  };

  const filteredAttempts = useMemo(() => {
    return dynamicCandidateAttempts.filter((a) => {
      const matchesSearch =
        a.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.testName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [dynamicCandidateAttempts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Assessment Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Test Templates</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{templates.length} Active</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Ready in library</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Brain className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Completed</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{dynamicCandidateAttempts.length} Attempts</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">78.5% Average Score</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requires Grading</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {dynamicCandidateAttempts.filter((a) => a.status === 'PENDING_REVIEW').length} Candidates
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Awaiting interviewer review</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Industry Benchmark</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">Top 15%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Passing standard rate</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Test Templates Library ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Test Templates Table */}
        <Card className="shadow-xs border-border/80 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Assessment Templates Library
              </CardTitle>
              <CardDescription className="text-xs">
                Browse pre-built coding tests, algorithmic evaluations, and scenario analyses
              </CardDescription>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                  <Plus className="h-3.5 w-3.5" /> Create Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Test Template</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddTemplate}>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Test Title</Label>
                    <Input
                      placeholder="e.g. Next.js App Directory Challenge"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Department</Label>
                      <Select value={formDept} onValueChange={setFormDept}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select dept" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
                          <SelectItem value="Product Design" className="text-xs">Product Design</SelectItem>
                          <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration Cap</Label>
                      <Select value={formDuration} onValueChange={setFormDuration}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30 mins" className="text-xs">30 mins</SelectItem>
                          <SelectItem value="45 mins" className="text-xs">45 mins</SelectItem>
                          <SelectItem value="60 mins" className="text-xs">60 mins</SelectItem>
                          <SelectItem value="90 mins" className="text-xs">90 mins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Questions</Label>
                      <Input
                        type="number"
                        value={formQuestions}
                        onChange={(e) => setFormQuestions(parseInt(e.target.value) || 1)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Passing Cutoff %</Label>
                      <Input
                        type="number"
                        value={formPassingScore}
                        onChange={(e) => setFormPassingScore(parseInt(e.target.value) || 70)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Difficulty</Label>
                      <Select value={formDifficulty} onValueChange={(v) => setFormDifficulty(v as any)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy" className="text-xs">Easy</SelectItem>
                          <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                          <SelectItem value="Hard" className="text-xs">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs font-semibold">
                      Publish Template
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Test ID</TableHead>
                  <TableHead className="text-xs">Template Name</TableHead>
                  <TableHead className="text-xs">Questions/Duration</TableHead>
                  <TableHead className="text-xs">Passing Cutoff</TableHead>
                  <TableHead className="text-xs">Difficulty</TableHead>
                  <TableHead className="text-right text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{t.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {t.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      {t.questions} Qs ({t.duration})
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-primary">{t.passingScore}%</TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={`text-[9.5px] font-semibold ${
                          t.difficulty === 'Hard'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : t.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}
                      >
                        {t.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9.5px] font-semibold">
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Candidate Attempts Tracker */}
        <Card className="shadow-xs border-border/80 lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-emerald-600" /> Candidate Attempt Logs
                </CardTitle>
                <CardDescription className="text-xs">
                  Review pass ratios, grading queues & candidate assessment reports
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter attempt or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8 text-xs"
              />
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {filteredAttempts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No matching attempt logs found.</p>
              ) : (
                filteredAttempts.map((a) => (
                  <div key={a.id} className="p-3 border border-border/80 rounded-xl text-xs hover:border-primary transition-colors flex flex-col justify-between gap-3 bg-card shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-foreground block">{a.candidate}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{a.testName}</span>
                      </div>
                      <StatusBadge status={a.status} className="text-[9px]" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] font-medium">
                      <span className="font-mono text-muted-foreground">{a.attemptDate}</span>
                      {a.status === 'PENDING_REVIEW' ? (
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2 bg-primary text-primary-foreground hover:bg-primary/90 gap-1 font-semibold"
                          onClick={() => openGradeModal(a)}
                        >
                          <Code className="h-3 w-3" /> Grade Task
                        </Button>
                      ) : (
                        <span className="font-semibold text-foreground font-mono">{a.score}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Grade Assessment Modal ── */}
      {gradingAttempt && (
        <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
          <DialogContent className="sm:max-w-lg border-border/80 shadow-2xl p-6">
            <DialogHeader className="border-b border-border/60 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold text-primary">
                <FileCheck className="h-5 w-5 text-primary" /> Grade Candidate Assessment & Evaluate Score
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 pt-2">
              <div className="bg-muted/30 border border-border/70 rounded-xl p-3 space-y-1 text-xs">
                <div>Candidate: <strong>{gradingAttempt.candidate}</strong></div>
                <div>Test Challenge: <strong>{gradingAttempt.testName}</strong></div>
                <div>Passing Cutoff: <strong className="text-primary">{gradingAttempt.passingScorePercent || 70}%</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Awarded Score (%) *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={evalScorePercent}
                    onChange={(e) => setEvalScorePercent(parseInt(e.target.value) || 0)}
                    className="h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Final Recommendation *</Label>
                  <Select value={evalResult} onValueChange={(v) => setEvalResult(v as any)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASS" className="text-xs">PASS (Proceed to Interview)</SelectItem>
                      <SelectItem value="FAIL" className="text-xs">FAIL (Do Not Proceed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Key Technical Strengths</Label>
                <Textarea
                  rows={2}
                  value={evalStrengths}
                  onChange={(e) => setEvalStrengths(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Areas for Improvement / Weaknesses</Label>
                <Textarea
                  rows={2}
                  value={evalWeaknesses}
                  onChange={(e) => setEvalWeaknesses(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Evaluator Summary Comments</Label>
                <Textarea
                  rows={2}
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-border/60">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsGradeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Submit Evaluation & Update Candidate Stage
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
