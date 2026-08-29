import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Code,
  User,
  HelpCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type CandidateAssessmentAttempt } from '@/api/assessment-store';

interface ViewAssessmentResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: CandidateAssessmentAttempt | null;
}

export function ViewAssessmentResultModal({ isOpen, onClose, attempt }: ViewAssessmentResultModalProps) {
  if (!attempt) return null;

  const isPassed = attempt.isPassed ?? (attempt.percentage ? attempt.percentage >= attempt.passingPercentage : false);
  const timeTakenFormatted = attempt.timeTakenSeconds
    ? `${Math.floor(attempt.timeTakenSeconds / 60)} mins ${attempt.timeTakenSeconds % 60} secs`
    : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Assessment Evaluation Scorecard
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Comprehensive question breakdown & automated evaluation analytics
                </DialogDescription>
              </div>
            </div>

            <Badge
              className={`px-3 py-1 text-xs font-bold ${
                isPassed
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
              }`}
            >
              {isPassed ? 'PASSED' : 'FAILED'} ({attempt.percentage || 0}%)
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Candidate</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{attempt.candidateName}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{attempt.jobPosition}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assessment</p>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{attempt.assessmentName}</h4>
              <Badge variant="outline" className="mt-1 text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {attempt.technology}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Time & Duration</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> {timeTakenFormatted}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Limit: {attempt.durationMins} mins
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Final Result</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {attempt.score || 0} / {attempt.totalMarks || 35}
                </span>
                <span className="text-xs font-bold text-slate-500">({attempt.percentage || 0}%)</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Cutoff: {attempt.passingPercentage}%
              </p>
            </div>
          </div>

          {/* Question Level Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" /> Detailed Question Performance ({attempt.questionResults?.length || 0} Questions)
            </h3>

            <div className="space-y-3">
              {attempt.questionResults && attempt.questionResults.length > 0 ? (
                attempt.questionResults.map((qr, index) => (
                  <div
                    key={qr.questionId || index}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{qr.questionText}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`text-[10px] ${
                            qr.isCorrect
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}
                        >
                          {qr.isCorrect ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Correct (+{qr.marksObtained}/{qr.maxMarks})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Incorrect ({qr.marksObtained}/{qr.maxMarks})
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Candidate Answer vs Correct Answer Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Candidate Answer</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 font-mono">
                          {String(qr.candidateAnswer || 'No Answer Provided')}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                        <p className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Correct Answer</p>
                        <p className="font-semibold text-emerald-800 dark:text-emerald-200 mt-1 font-mono">
                          {String(qr.correctAnswer || 'N/A')}
                        </p>
                      </div>
                    </div>

                    {/* For Coding Questions: Submitted Code Block */}
                    {qr.submittedCode && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Code className="h-3.5 w-3.5 text-indigo-600" /> Submitted Code ({qr.codeLanguage || 'code'})
                          </span>
                          {qr.testCasesTotal !== undefined && (
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">
                              Test Cases Passed: {qr.testCasesPassed} / {qr.testCasesTotal}
                            </span>
                          )}
                        </div>
                        <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                          {qr.submittedCode}
                        </pre>
                      </div>
                    )}

                    {/* Explanation */}
                    {qr.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-md">
                        <strong className="text-slate-700 dark:text-slate-300">Explanation / Evaluator Note:</strong>{' '}
                        {qr.explanation}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                  No question-level results available for this attempt.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" className="text-xs" onClick={onClose}>
            Close Scorecard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
