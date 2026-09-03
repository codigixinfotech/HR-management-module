import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCheck,
  HelpCircle,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATALOG_COURSES, type AssessmentItem, type QuestionItem } from './mockTrainingData';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessment: AssessmentItem) => void;
}

export function CreateAssessmentModal({ isOpen, onClose, onSave }: CreateAssessmentModalProps) {
  const [name, setName] = useState('Industrial Safety & Fire Response Quiz');
  const [code, setCode] = useState(`ASM-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [courseId, setCourseId] = useState(CATALOG_COURSES[0].id);
  const [assessmentType, setAssessmentType] = useState<AssessmentItem['type']>('Quiz');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [attemptsAllowed, setAttemptsAllowed] = useState<number>(2);
  const [passingScore, setPassingScore] = useState<number>(60);

  // Rules
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [allowRetake, setAllowRetake] = useState(true);

  // Questions
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: 'Q1',
      question: 'What is the primary action during a Type-A electrical fire outbreak?',
      optionA: 'Pour water over electrical panels',
      optionB: 'Disconnect power source & use CO2 fire extinguisher',
      optionC: 'Open all windows immediately',
      optionD: 'Ignore alarm and call maintenance',
      correctAnswer: 'B',
      marks: 5,
    },
  ]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const newQ: QuestionItem = {
      id: `Q${questions.length + 1}`,
      question: `Question ${questions.length + 1}: Enter question description here...`,
      optionA: 'Option A statement',
      optionB: 'Option B statement',
      optionC: 'Option C statement',
      optionD: 'Option D statement',
      correctAnswer: 'A',
      marks: 5,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSaveAssessment = (status: 'Published' | 'Draft') => {
    const courseObj = CATALOG_COURSES.find((c) => c.id === courseId);
    const newAssessment: AssessmentItem = {
      id: code,
      code,
      name,
      courseId,
      courseTitle: courseObj?.title || 'Safety Fundamentals',
      type: assessmentType,
      durationMinutes,
      attemptsAllowed,
      passingScore,
      randomizeQuestions,
      showResultImmediately,
      allowRetake,
      questions,
      status,
    };
    onSave(newAssessment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-background rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">CREATE ASSESSMENT</h2>
              <p className="text-xs text-muted-foreground">Design quizzes, final exams, or practical evaluations</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
              1. Assessment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assessment Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assessment Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Related Course *</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATALOG_COURSES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assessment Type *</Label>
                <RadioGroup
                  value={assessmentType}
                  onValueChange={(val) => setAssessmentType(val as any)}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {['Quiz', 'Final Exam', 'Practical', 'Evaluation'].map((t) => (
                    <div key={t} className="flex items-center space-x-1 border rounded px-2.5 py-1 cursor-pointer">
                      <RadioGroupItem value={t} id={`asmType-${t}`} />
                      <Label htmlFor={`asmType-${t}`} className="text-xs cursor-pointer">
                        {t}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration (Minutes) *</Label>
                <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Attempts Allowed *</Label>
                <Input type="number" value={attemptsAllowed} onChange={(e) => setAttemptsAllowed(Number(e.target.value))} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Passing Score % *</Label>
                <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="text-xs" />
              </div>
            </div>
          </div>

          {/* Question Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                2. Question Bank ({questions.length} Questions)
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={handleAddQuestion} className="gap-1 text-xs h-7">
                <Plus className="h-3 w-3" /> Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border rounded-xl bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Question {idx + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(q.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => {
                      const updated = questions.map((item) => (item.id === q.id ? { ...item, question: e.target.value } : item));
                      setQuestions(updated);
                    }}
                    className="text-xs"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <Input
                      placeholder="Option A"
                      value={q.optionA}
                      onChange={(e) => {
                        const updated = questions.map((item) => (item.id === q.id ? { ...item, optionA: e.target.value } : item));
                        setQuestions(updated);
                      }}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Option B"
                      value={q.optionB}
                      onChange={(e) => {
                        const updated = questions.map((item) => (item.id === q.id ? { ...item, optionB: e.target.value } : item));
                        setQuestions(updated);
                      }}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Option C"
                      value={q.optionC}
                      onChange={(e) => {
                        const updated = questions.map((item) => (item.id === q.id ? { ...item, optionC: e.target.value } : item));
                        setQuestions(updated);
                      }}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Option D"
                      value={q.optionD}
                      onChange={(e) => {
                        const updated = questions.map((item) => (item.id === q.id ? { ...item, optionD: e.target.value } : item));
                        setQuestions(updated);
                      }}
                      className="text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs pt-1 border-t">
                    <span>Correct Answer:</span>
                    <Select
                      value={q.correctAnswer}
                      onValueChange={(val) => {
                        const updated = questions.map((item) => (item.id === q.id ? { ...item, correctAnswer: val as any } : item));
                        setQuestions(updated);
                      }}
                    >
                      <SelectTrigger className="text-xs h-7 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                        <SelectItem value="C">Option C</SelectItem>
                        <SelectItem value="D">Option D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Rules */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">3. Exam Rules</h3>
            <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={randomizeQuestions} onCheckedChange={(c) => setRandomizeQuestions(!!c)} />
                Randomize Questions
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={showResultImmediately} onCheckedChange={(c) => setShowResultImmediately(!!c)} />
                Show Result Immediately
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={allowRetake} onCheckedChange={(c) => setAllowRetake(!!c)} />
                Allow Retake
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSaveAssessment('Draft')} className="text-xs">
              Save Draft
            </Button>
            <Button size="sm" onClick={() => handleSaveAssessment('Published')} className="gap-1.5 text-xs bg-primary text-primary-foreground">
              <Check className="h-4 w-4" /> Publish Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
