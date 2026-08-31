import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Brain,
  Calendar,
  Clock,
  Code,
  FileText,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { AssessmentAssignment } from '@/api/types';

export interface TestTemplateItem {
  id: string;
  name: string;
  dept: string;
  duration: string;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passingScore: number;
  status: 'Active' | 'Draft';
}

export const ASSESSMENT_TEMPLATES: TestTemplateItem[] = [
  { id: 'TST-201', name: 'React Architecture & State Challenge', dept: 'Engineering', duration: '90 mins', questions: 3, difficulty: 'Hard', passingScore: 70, status: 'Active' },
  { id: 'TST-202', name: 'DevOps Helm & Kubernetes Quiz', dept: 'Engineering', duration: '45 mins', questions: 30, difficulty: 'Medium', passingScore: 75, status: 'Active' },
  { id: 'TST-203', name: 'Figma Component & Styling Review', dept: 'Product Design', duration: '60 mins', questions: 1, difficulty: 'Medium', passingScore: 70, status: 'Active' },
  { id: 'TST-204', name: 'HR Compliance Scenario Analysis', dept: 'Human Resources', duration: '30 mins', questions: 15, difficulty: 'Easy', passingScore: 80, status: 'Active' },
];

interface AssignAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onAssignSuccess: (assignment: AssessmentAssignment) => void;
}

export function AssignAssessmentModal({
  isOpen,
  onClose,
  candidate,
  onAssignSuccess,
}: AssignAssessmentModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('TST-201');
  const [assessmentType, setAssessmentType] = useState<string>('TECHNICAL_CODING');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [instructions, setInstructions] = useState<string>(
    'Please complete all coding challenges and submit the code within the allocated duration. Maintain clean modular architecture.'
  );

  const selectedTemplate = ASSESSMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) || ASSESSMENT_TEMPLATES[0];

  useEffect(() => {
    const titleLower = (candidate?.jobTitle || '').toLowerCase();
    if (titleLower) {
      if (titleLower.includes('design')) {
        setSelectedTemplateId('TST-203');
      } else if (titleLower.includes('devops') || titleLower.includes('kubernetes')) {
        setSelectedTemplateId('TST-202');
      } else if (titleLower.includes('hr') || titleLower.includes('compliance')) {
        setSelectedTemplateId('TST-204');
      } else {
        setSelectedTemplateId('TST-201');
      }
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();

    const assignment: AssessmentAssignment = {
      id: `ATT-${Math.floor(900 + Math.random() * 100)}`,
      candidateId: candidate.id,
      candidateName: candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`,
      candidateEmail: candidate.email,
      jobId: candidate.jobOpeningId || candidate.jobId,
      jobTitle: candidate.jobTitle || 'Senior Fullstack Engineer',
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      assignedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      instructions,
      status: 'ASSIGNED',
      passingScorePercent: selectedTemplate.passingScore,
    };

    onAssignSuccess(assignment);
    toast.success(`Assessment '${selectedTemplate.name}' assigned to ${assignment.candidateName}! Candidate status updated to ASSESSMENT_ASSIGNED.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-border/80 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Brain className="h-5 w-5 animate-pulse" />
            <span>Assign Candidate Assessment</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link an evaluation test to candidate application & update candidate stage to <strong>ASSESSMENT_ASSIGNED</strong>.
          </p>
        </DialogHeader>

        <form onSubmit={handleAssign} className="space-y-5 pt-2">
          {/* Candidate & Job Summary Card (Auto-Filled) */}
          <div className="bg-muted/30 border border-border/70 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Candidate Profile:</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                Shortlisted Candidate
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Candidate Name:</span>{' '}
                <strong className="text-foreground">{candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <strong className="text-foreground">{candidate.email}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Candidate ID:</span>{' '}
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{candidate.id}</code>
              </div>
              <div>
                <span className="text-muted-foreground">Position / Requisition:</span>{' '}
                <strong className="text-foreground">{candidate.jobTitle || 'Senior Fullstack Engineer'}</strong>
              </div>
            </div>
          </div>

          {/* Assessment Selection Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Assessment Template *</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.id} – {t.name} ({t.duration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assessment Type *</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICAL_CODING" className="text-xs">Technical Coding Challenge</SelectItem>
                  <SelectItem value="QUIZ_MULTIPLE_CHOICE" className="text-xs">Multiple Choice MCQ Quiz</SelectItem>
                  <SelectItem value="DESIGN_STYLING_REVIEW" className="text-xs">Design / Case Study Review</SelectItem>
                  <SelectItem value="MANAGERIAL_SCENARIO" className="text-xs">Managerial Scenario Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Template Highlights Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {selectedTemplate.name}
              </span>
              <Badge className={
                selectedTemplate.difficulty === 'Hard' ? 'bg-destructive text-white' :
                selectedTemplate.difficulty === 'Medium' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
              }>
                {selectedTemplate.difficulty} Difficulty
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Duration: <strong>{selectedTemplate.duration}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>Questions: <strong>{selectedTemplate.questions} Tasks</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>Passing Score: <strong>{selectedTemplate.passingScore}%</strong></span>
              </div>
            </div>
          </div>

          {/* Due Date & Custom Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assessment Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Custom Assessment Instructions for Candidate</Label>
              <Textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="text-xs"
                placeholder="Enter instructions..."
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Assign & Send Assessment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
