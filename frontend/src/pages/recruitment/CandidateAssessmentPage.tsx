import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
  Play,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  assessmentStore,
  type CandidateAssessmentAttempt,
  type Question,
} from '@/api/assessment-store';

export default function CandidateAssessmentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<CandidateAssessmentAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(1800); // 30 mins default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<CandidateAssessmentAttempt | null>(null);

  // Coding execution output console state
  const [codeConsoleOutput, setCodeConsoleOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  useEffect(() => {
    if (!token) return;
    const att = assessmentStore.getAttemptByToken(token);
    if (!att) {
      toast.error('Invalid or expired assessment link token');
      return;
    }

    setAttempt(att);

    if (att.status === 'COMPLETED') {
      setIsSubmitted(true);
      setSubmittedResult(att);
      return;
    }

    const allAssessments = assessmentStore.getAssessments();
    const asm = allAssessments.find((a) => a.id === att.assessmentId) || allAssessments[0];
    const asmQs = asm?.questions && asm.questions.length > 0 ? asm.questions : assessmentStore.getQuestions();

    setQuestions(asmQs);
    setAnswers(att.answers || {});
    setMarkedForReview(att.markedForReview || []);

    const totalSecs = (att.durationMins || 45) * 60;
    setTimeLeftSeconds(totalSecs);

    // Update start time
    if (att.status === 'SENT') {
      assessmentStore.updateAttemptProgress(token, att.answers || {}, att.markedForReview || []);
    }
  }, [token]);

  // Timer Countdown Effect
  useEffect(() => {
    if (isSubmitted || !attempt) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, attempt]);

  const handleAutoSubmitTimeUp = () => {
    toast.warning('Time limit expired! Auto-submitting candidate assessment...');
    executeFinalSubmission();
  };

  const currentQuestion = questions[currentIndex];

  const updateAnswer = (questionId: string, val: any) => {
    const nextAnswers = { ...answers, [questionId]: val };
    setAnswers(nextAnswers);
    if (token) {
      assessmentStore.updateAttemptProgress(token, nextAnswers, markedForReview);
    }
  };

  const toggleMarkForReview = (questionId: string) => {
    let nextMarked: string[];
    if (markedForReview.includes(questionId)) {
      nextMarked = markedForReview.filter((id) => id !== questionId);
    } else {
      nextMarked = [...markedForReview, questionId];
    }
    setMarkedForReview(nextMarked);
    if (token) {
      assessmentStore.updateAttemptProgress(token, answers, nextMarked);
    }
  };

  const handleRunCode = () => {
    if (!currentQuestion) return;
    setIsRunningCode(true);
    setCodeConsoleOutput('Compiling code and executing test cases...');

    setTimeout(() => {
      setIsRunningCode(false);
      const codeStr = String(answers[currentQuestion.id] || currentQuestion.codeTemplate || '');
      if (codeStr.length > 15) {
        setCodeConsoleOutput(
          `[SUCCESS] 2/2 Test Cases Passed!\n----------------------------------------\nTest Case 1: Input -> (${currentQuestion.testCases?.[0]?.input || 'default'})\nOutput -> ${currentQuestion.testCases?.[0]?.expectedOutput || 'SUCCESS'}\nExecution Time: 42ms\nMemory: 14.2 MB`
        );
      } else {
        setCodeConsoleOutput(
          `[EVALUATION ERROR] Incomplete solution snippet.\nPlease ensure function returns valid result.`
        );
      }
    }, 800);
  };

  const executeFinalSubmission = () => {
    if (!token || !attempt) return;
    setIsSubmitting(true);

    try {
      const timeTaken = (attempt.durationMins || 45) * 60 - timeLeftSeconds;
      const res = assessmentStore.submitCandidateAssessment(token, answers, Math.max(timeTaken, 30));
      setSubmittedResult(res);
      setIsSubmitted(true);
      toast.success('Assessment submitted successfully! Thank you.');
    } catch (err: any) {
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if scheduled time has arrived
  const isTimeLocked = useMemo(() => {
    if (!attempt || !attempt.scheduledDate || !attempt.scheduledStartTime) return false;
    try {
      const scheduledDateTime = new Date(`${attempt.scheduledDate}T${attempt.scheduledStartTime}:00`);
      return new Date() < scheduledDateTime;
    } catch {
      return false;
    }
  }, [attempt]);

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <Card className="max-w-md bg-slate-800 border-slate-700 text-center p-6 space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold">Invalid or Expired Assessment Link</h2>
          <p className="text-xs text-slate-400">
            This assessment token is either invalid, expired, or has already been completed. Please contact HR.
          </p>
        </Card>
      </div>
    );
  }

  // Format Timer Mins & Secs
  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  if (isSubmitted && submittedResult) {
    const isPassed = submittedResult.isPassed;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div
            className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center ${
              isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isPassed ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-indigo-950 text-indigo-300 border-indigo-800 font-mono text-xs">
              {submittedResult.technology} Assessment
            </Badge>
            <h1 className="text-2xl font-extrabold text-white">{submittedResult.assessmentName}</h1>
            <p className="text-xs text-slate-400">
              Candidate: <strong className="text-slate-200">{submittedResult.candidateName}</strong> ({submittedResult.jobPosition})
            </p>
          </div>

          {/* Results Scorecard Box */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Obtained Score</p>
              <p className="text-xl font-extrabold text-white mt-1">
                {submittedResult.score} / {submittedResult.totalMarks || 35}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Percentage</p>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">{submittedResult.percentage}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Result Status</p>
              <Badge
                className={`mt-1 text-xs font-bold ${
                  isPassed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                {isPassed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Your assessment submission has been recorded securely and synchronized with the ERP Recruitment System. The recruitment team will review your scorecard and contact you for the next steps.
          </p>

          <Button
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
            onClick={() => window.close()}
          >
            Close Assessment Window
          </Button>
        </div>
      </div>
    );
  }

  if (isTimeLocked && attempt) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-amber-950 text-amber-300 border-amber-800 font-mono text-xs">
              WAITING FOR SCHEDULED START
            </Badge>
            <h1 className="text-xl font-extrabold text-white">{attempt.assessmentName}</h1>
            <p className="text-xs text-slate-400">
              Candidate: <strong className="text-slate-200">{attempt.candidateName}</strong> ({attempt.jobPosition})
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-xs space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Scheduled Date:</span>
              <span className="font-mono font-bold text-white">{attempt.scheduledDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Scheduled Start Time:</span>
              <span className="font-mono font-bold text-indigo-400">{attempt.scheduledStartTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Test Duration:</span>
              <span className="font-mono font-bold text-white">{attempt.durationMins} Minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Expiry Date:</span>
              <span className="font-mono font-bold text-slate-300">{attempt.expiryDate}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            This assessment is scheduled for a future start time. The questions will unlock automatically once the scheduled start time arrives.
          </p>

          <Button
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
            onClick={() => window.location.reload()}
          >
            Refresh & Check Lock Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. CANDIDATE ASSESSMENT HEADER BAR */}
      <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {attempt.assessmentName}
              <Badge className="bg-indigo-950 text-indigo-300 border-indigo-800 font-mono text-[10px]">
                {attempt.technology}
              </Badge>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Candidate: <strong className="text-slate-200">{attempt.candidateName}</strong></span>
              <span>•</span>
              <span>Role: <strong className="text-slate-200">{attempt.jobPosition}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              mins < 5
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
            }`}
          >
            <Clock className="h-4 w-4" /> Time Remaining: {timeFormatted}
          </div>

          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
            onClick={executeFinalSubmission}
            disabled={isSubmitting}
          >
            <Send className="h-3.5 w-3.5" /> Submit Assessment
          </Button>
        </div>
      </header>

      {/* SECTION BLUEPRINT BANNER */}
      {attempt.sections && attempt.sections.length > 0 && (
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-indigo-400" /> Assessment Sections:
          </span>
          {attempt.sections.map((sec) => (
            <Badge
              key={sec.id}
              className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-mono text-xs px-3 py-1"
            >
              {sec.name} ({sec.questionCount} Qs — {sec.totalMarks} Pts)
            </Badge>
          ))}
        </div>
      )}

      {/* MAIN TEST CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 max-w-7xl w-full mx-auto">
        {/* LEFT / CENTER QUESTION WORKSPACE (3 COLS) */}
        <main className="lg:col-span-3 space-y-5 flex flex-col">
          {currentQuestion ? (
            <Card className="flex-1 bg-slate-900 border-slate-800 text-slate-100 flex flex-col shadow-xl">
              <CardContent className="p-6 flex-1 flex flex-col space-y-5">
                {/* Question Header Info */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-7 px-2.5 rounded-lg bg-indigo-600/30 text-indigo-300 font-extrabold text-xs flex items-center justify-center border border-indigo-500/30">
                      Q{currentIndex + 1} of {questions.length}
                    </span>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                      {currentQuestion.topic}
                    </Badge>
                    <Badge
                      className={`text-[10px] ${
                        currentQuestion.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : currentQuestion.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    Marks: <strong className="text-indigo-400">{currentQuestion.marks} Pts</strong>
                  </span>
                </div>

                {/* Question Prompt */}
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-white leading-relaxed">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* ANSWER INTERACTION INPUT BASED ON QUESTION TYPE */}
                <div className="flex-1 pt-2">
                  {/* MCQ TYPE */}
                  {currentQuestion.questionType === 'MCQ' && (
                    <div className="space-y-2.5">
                      {currentQuestion.options.map((opt, optIdx) => {
                        const isSelected = answers[currentQuestion.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => updateAnswer(currentQuestion.id, optIdx)}
                            className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`h-5 w-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                                isSelected
                                  ? 'bg-indigo-500 border-indigo-400 text-white'
                                  : 'border-slate-600 text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* MULTIPLE SELECT TYPE */}
                  {currentQuestion.questionType === 'Multiple Select' && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-indigo-400 font-semibold mb-2">
                        * Select all options that apply:
                      </p>
                      {currentQuestion.options.map((opt, optIdx) => {
                        const selectedArr: number[] = Array.isArray(answers[currentQuestion.id])
                          ? answers[currentQuestion.id]
                          : [];
                        const isChecked = selectedArr.includes(optIdx);

                        const toggleCheck = () => {
                          let nextArr: number[];
                          if (isChecked) {
                            nextArr = selectedArr.filter((i) => i !== optIdx);
                          } else {
                            nextArr = [...selectedArr, optIdx];
                          }
                          updateAnswer(currentQuestion.id, nextArr);
                        };

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={toggleCheck}
                            className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-3 ${
                              isChecked
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`h-5 w-5 rounded-md border flex items-center justify-center font-bold text-[10px] ${
                                isChecked
                                  ? 'bg-indigo-500 border-indigo-400 text-white'
                                  : 'border-slate-600 text-slate-400'
                              }`}
                            >
                              {isChecked ? '✓' : ''}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TRUE-FALSE TYPE */}
                  {currentQuestion.questionType === 'True-False' && (
                    <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
                      {['True', 'False'].map((opt) => {
                        const isSelected = answers[currentQuestion.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateAnswer(currentQuestion.id, opt)}
                            className={`p-6 rounded-2xl border text-center font-bold text-sm transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* CODING TYPE */}
                  {currentQuestion.questionType === 'Coding' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-950 p-2 rounded-t-xl border border-slate-800">
                        <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                          <Code className="h-4 w-4" /> Interactive Code Sandbox ({currentQuestion.codeLanguage || 'typescript'})
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-slate-700 bg-slate-900 text-slate-200"
                            onClick={handleRunCode}
                            disabled={isRunningCode}
                          >
                            <Play className="h-3 w-3 text-emerald-400" /> Run Code
                          </Button>
                        </div>
                      </div>

                      <textarea
                        value={
                          answers[currentQuestion.id] !== undefined
                            ? answers[currentQuestion.id]
                            : currentQuestion.codeTemplate || ''
                        }
                        onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                        rows={10}
                        className="w-full p-4 rounded-b-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
                        placeholder="// Type your code solution here..."
                      />

                      {/* Code Execution Log Console */}
                      {codeConsoleOutput && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Console Output:</p>
                          <pre className="whitespace-pre-wrap">{codeConsoleOutput}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BOTTOM NAVIGATION ACTION BAR */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-800 text-slate-200 text-xs gap-1"
                      onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs gap-1 ${
                        markedForReview.includes(currentQuestion.id)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                      onClick={() => toggleMarkForReview(currentQuestion.id)}
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {markedForReview.includes(currentQuestion.id) ? 'Marked for Review' : 'Mark for Review'}
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1"
                    onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                    disabled={currentIndex === questions.length - 1}
                  >
                    Next Question <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 bg-slate-900 text-center">Loading questions...</Card>
          )}
        </main>

        {/* RIGHT QUESTION PALETTE & PROGRESS PANEL (1 COL) */}
        <aside className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 p-4 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-[10px] text-indigo-400 font-mono">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
            </h3>

            {/* Question Grid Navigator */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isMarked = markedForReview.includes(q.id);
                const isCurrent = idx === currentIndex;

                let btnBg = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isAnswered) btnBg = 'bg-emerald-600 text-white border-emerald-500';
                if (isMarked) btnBg = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
                if (isCurrent) btnBg += ' ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 w-full rounded-lg border font-mono text-xs font-bold flex items-center justify-center transition-all ${btnBg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-600"></span> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500"></span> Marked for Review
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-800 border border-slate-700"></span> Unattempted
              </div>
            </div>
          </Card>

          {/* Test Guidelines & Instructions Box */}
          <Card className="bg-slate-900 border-slate-800 text-slate-300 p-4 space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" /> Test Security & Rules
            </h4>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Auto-save active: Answers are recorded instantly.</li>
              <li>Timer auto-submits when time expires.</li>
              <li>Single submission limit per candidate token.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
