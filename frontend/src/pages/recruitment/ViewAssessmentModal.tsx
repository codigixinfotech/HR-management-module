import { useState } from 'react';
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
  User,
  Mail,
  Briefcase,
  PlayCircle,
  FileCheck,
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssessmentAssignment } from '@/api/types';

interface ViewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssessmentAssignment | null;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  onSimulateSubmission?: () => void;
  onGradeAssessment?: () => void;
}

export function ViewAssessmentModal({
  isOpen,
  onClose,
  assignment,
  candidateName,
  candidateEmail,
  jobTitle,
  onSimulateSubmission,
  onGradeAssessment,
}: ViewAssessmentModalProps) {
  if (!assignment) return null;

  const displayCandidate = assignment.candidateName || candidateName || 'Candidate';
  const displayEmail = assignment.candidateEmail || candidateEmail || 'candidate@example.com';
  const displayPosition = assignment.jobTitle || jobTitle || 'Senior Position';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-border/80 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
              <span>Assigned Assessment Overview</span>
            </div>
            <Badge className="bg-purple-500/15 text-purple-700 border-purple-300 font-mono text-[10px]">
              {assignment.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detailed view of candidate assessment challenge, passing criteria, and attempt tracking.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Candidate Header Card */}
          <div className="bg-muted/30 border border-border/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <User className="h-4 w-4 text-primary" />
                <span>{displayCandidate}</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[10px]">
                Active Candidate
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{displayPosition}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Assigned Date: <strong className="text-foreground">{assignment.assignedDate || '20 Aug 2026'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Due Date: <strong className="text-foreground">{assignment.dueDate || '25 Aug 2026'}</strong></span>
              </div>
            </div>
          </div>

          {/* Test Challenge Template Card */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>{assignment.templateName || 'React Architecture & State Challenge'}</span>
              </div>
              <Badge className="bg-purple-600 text-white font-mono text-[10px]">
                {assignment.templateId || 'TST-201'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-background/60 p-3 rounded-lg border border-purple-500/10">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Duration</span>
                <span className="font-bold text-foreground">90 Minutes</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Questions</span>
                <span className="font-bold text-foreground">3 Coding Tasks</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Passing Cutoff</span>
                <span className="font-bold text-emerald-600 font-mono">{assignment.passingScorePercent || 70}%</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-foreground">Instructions Provided to Candidate:</span>
              <p className="text-xs text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/50 italic">
                "{assignment.instructions || 'Please complete all coding challenges and submit the code within the allocated duration. Maintain clean modular architecture.'}"
              </p>
            </div>
          </div>

          {/* Attempt Status Banner */}
          <div className="bg-card border border-border/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Assessment Status: <strong className="text-foreground">{assignment.score || 'Awaiting Candidate Submission'}</strong></span>
            </div>
            {assignment.scorePercent ? (
              <Badge className={assignment.scorePercent >= (assignment.passingScorePercent || 70) ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                {assignment.scorePercent >= (assignment.passingScorePercent || 70) ? 'PASS' : 'FAIL'}
              </Badge>
            ) : null}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onSimulateSubmission && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-purple-700 border-purple-300 hover:bg-purple-50 gap-1.5 font-semibold"
                onClick={onSimulateSubmission}
              >
                <PlayCircle className="h-4 w-4 text-purple-600" />
                Simulate Submission (92%)
              </Button>
            )}
            {onGradeAssessment && (
              <Button
                type="button"
                size="sm"
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-semibold"
                onClick={onGradeAssessment}
              >
                <FileCheck className="h-4 w-4" />
                Grade Assessment
              </Button>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
