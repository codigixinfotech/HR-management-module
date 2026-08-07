import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

interface TestTemplate {
  id: string;
  name: string;
  dept: string;
  duration: string;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Draft';
}

interface AttemptLog {
  id: string;
  candidate: string;
  testName: string;
  attemptDate: string;
  score: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED' | 'PENDING_REVIEW';
}

const INITIAL_TEMPLATES: TestTemplate[] = [
  { id: 'TST-201', name: 'React Architecture & State Challenge', dept: 'Engineering', duration: '90 mins', questions: 3, difficulty: 'Hard', status: 'Active' },
  { id: 'TST-202', name: 'DevOps Helm & Kubernetes Quiz', dept: 'Engineering', duration: '45 mins', questions: 30, difficulty: 'Medium', status: 'Active' },
  { id: 'TST-203', name: 'Figma Component & Styling Review', dept: 'Product Design', duration: '60 mins', questions: 1, difficulty: 'Medium', status: 'Active' },
  { id: 'TST-204', name: 'HR Compliance Scenario Analysis', dept: 'Human Resources', duration: '30 mins', questions: 15, difficulty: 'Easy', status: 'Active' },
];

const INITIAL_ATTEMPTS: AttemptLog[] = [
  { id: 'ATT-901', candidate: 'Siddharth Rao', testName: 'React Architecture & State Challenge', attemptDate: '04 Aug 2026', score: '92% (Pass)', status: 'COMPLETED' },
  { id: 'ATT-902', candidate: 'Neha Gupta', testName: 'DevOps Helm & Kubernetes Quiz', attemptDate: '05 Aug 2026', score: '88% (Pass)', status: 'COMPLETED' },
  { id: 'ATT-903', candidate: 'Kabir Mehta', testName: 'React Architecture & State Challenge', attemptDate: '05 Aug 2026', score: 'Awaiting Grading', status: 'PENDING_REVIEW' },
  { id: 'ATT-904', candidate: 'Ananya Deshmukh', testName: 'HR Compliance Scenario Analysis', attemptDate: '03 Aug 2026', score: '80% (Pass)', status: 'COMPLETED' },
  { id: 'ATT-905', candidate: 'Pooja Sharma', testName: 'Figma Component & Styling Review', attemptDate: '02 Aug 2026', score: '48% (Fail)', status: 'COMPLETED' },
];

export function AssessmentsTab() {
  const [templates, setTemplates] = useState<TestTemplate[]>(INITIAL_TEMPLATES);
  const [attempts] = useState<AttemptLog[]>(INITIAL_ATTEMPTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDuration, setFormDuration] = useState('60 mins');
  const [formQuestions, setFormQuestions] = useState(5);
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const openAddModal = () => {
    setFormName('');
    setFormDept('Engineering');
    setFormDuration('60 mins');
    setFormQuestions(5);
    setFormDifficulty('Medium');
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
      status: 'Active',
    };

    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Assessment Test Template published');
    setIsOpen(false);
  };

  const handleReviewCode = (candidate: string) => {
    toast.success(`Opening IDE workspace snapshot for ${candidate}...`);
  };

  const filteredAttempts = useMemo(() => {
    return attempts.filter(a => {
      const matchesSearch =
        a.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.testName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [attempts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Assessment Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Test Templates</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{templates.length} Active</p>
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{attempts.length} Attempts</p>
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {attempts.filter(a => a.status === 'PENDING_REVIEW').length} Coding Tasks
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">Top 15%</p>
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
                      onChange={e => setFormName(e.target.value)}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Total Questions</Label>
                      <Input
                        type="number"
                        value={formQuestions}
                        onChange={e => setFormQuestions(parseInt(e.target.value) || 1)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Difficulty Scale</Label>
                      <Select value={formDifficulty} onValueChange={v => setFormDifficulty(v as any)}>
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
                    <Button type="submit" size="sm" className="text-xs">
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
                  <TableHead className="text-xs">Difficulty</TableHead>
                  <TableHead className="text-right text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
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
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={`text-[9.5px] font-semibold ${t.difficulty === 'Hard'
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
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8 text-xs"
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredAttempts.map(a => (
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
                        variant="outline"
                        className="h-6 text-[10px] px-2 text-primary border-primary/20 hover:bg-primary/10 gap-1"
                        onClick={() => handleReviewCode(a.candidate)}
                      >
                        <Code className="h-3 w-3" /> Grade Task
                      </Button>
                    ) : (
                      <span className="font-semibold text-foreground font-mono">{a.score}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
