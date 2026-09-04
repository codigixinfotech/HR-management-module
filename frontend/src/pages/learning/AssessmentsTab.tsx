import { useState, useMemo, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { apiClient } from '@/lib/api-client';
import type { AssessmentItem } from './types';
import { CreateAssessmentModal } from './CreateAssessmentModal';

export function AssessmentsTab() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get<any[]>('/learning/catalog-courses')
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        const mapped: AssessmentItem[] = list
          .filter((c: any) => c.assessmentIncluded)
          .map((c: any) => ({
            id: `ASM-${c.code || c.id}`,
            code: `ASM-${c.code || c.id}`,
            courseId: c.id || c.code,
            courseTitle: c.title,
            name: `${c.title} Evaluation & Exam`,
            title: `${c.title} Evaluation & Exam`,
            type: 'Final Exam',
            durationMinutes: 45,
            passingScore: 70,
            totalQuestions: 15,
            attemptsAllowed: 3,
            questions: [],
            status: 'Published',
          }));
        setAssessments(mapped);
      })
      .catch((err) => console.warn('Failed to load assessments from catalog:', err));
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const totalCount = assessments.length;
  const publishedCount = assessments.filter((a) => a.status === 'Published').length;
  const draftCount = assessments.filter((a) => a.status === 'Draft').length;

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.code.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== 'All' && a.type !== typeFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      return true;
    });
  }, [assessments, searchQuery, typeFilter, statusFilter]);

  const handleSaveAssessment = (newAsm: AssessmentItem) => {
    setAssessments([newAsm, ...assessments]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" /> Assessments & Quizzes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create online quizzes, final exams, practical evaluations, and score thresholds for training verification
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" /> Create Assessment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">Total Assessments</span>
            <span className="text-2xl font-extrabold text-foreground">{totalCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Published</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{publishedCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Draft</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{draftCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assessment name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] bg-background">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Quiz">Quiz</SelectItem>
              <SelectItem value="Final Exam">Final Exam</SelectItem>
              <SelectItem value="Practical">Practical</SelectItem>
              <SelectItem value="Evaluation">Evaluation</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assessment Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Code</TableHead>
                <TableHead className="text-xs font-bold">Assessment Name</TableHead>
                <TableHead className="text-xs font-bold">Related Course</TableHead>
                <TableHead className="text-xs font-bold">Type</TableHead>
                <TableHead className="text-xs font-bold">Questions</TableHead>
                <TableHead className="text-xs font-bold">Duration</TableHead>
                <TableHead className="text-xs font-bold">Passing Score</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold">{a.code}</TableCell>
                  <TableCell className="text-xs font-medium">{a.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.courseTitle}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold">{a.questions.length} Qs</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.durationMinutes} mins</TableCell>
                  <TableCell className="text-xs font-mono font-bold text-primary">≥ {a.passingScore}%</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={a.status} className="text-[10px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <CreateAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAssessment}
      />
    </div>
  );
}
