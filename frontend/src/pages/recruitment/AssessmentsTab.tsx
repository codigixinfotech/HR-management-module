import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Brain,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  TrendingUp,
  Code,
  Award,
  AlertCircle,
  FileCheck,
  Send,
  Upload,
  Eye,
  Edit,
  Trash2,
  Copy,
  Filter,
  Layers,
  HelpCircle,
  BarChart3,
  Users,
  Check,
  XCircle,
  ExternalLink,
  Sparkles,
  ChevronDown,
  Briefcase,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  assessmentStore,
  type Question,
  type Assessment,
  type AssessmentSection,
  type CandidateAssessmentAttempt,
} from '@/api/assessment-store';
import { useQuery } from '@tanstack/react-query';
import { jobOpeningsApi } from '@/api/recruitment';
import { SendAssessmentModal } from './SendAssessmentModal';
import { ViewAssessmentResultModal } from './ViewAssessmentResultModal';

interface SearchableSelectInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ElementType;
}

function SearchableSelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select or type position...',
  icon: Icon = Briefcase,
}: SearchableSelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options || [];
    return (options || []).filter((opt) => opt && typeof opt === 'string' && opt.toLowerCase().includes((searchTerm || '').toLowerCase()));
  }, [options, searchTerm]);

  return (
    <div className="space-y-1.5 relative" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label}</Label>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
          Dropdown • Search • Manual Entry
        </span>
      </div>

      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="h-9 text-xs pr-8 bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 focus:border-indigo-500 shadow-2xs font-semibold text-slate-900 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/80 rounded-xl shadow-2xl p-2 space-y-2 max-h-60 overflow-y-auto">
          {/* Internal Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search position or type custom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>Matching Options</span>
              <span className="font-mono text-indigo-500">{filteredOptions.length}</span>
            </p>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    value === opt
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-indigo-500" /> {opt}
                  </span>
                  {value === opt && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching options. Typing custom: "{searchTerm || value}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssessmentsTab() {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'question-bank' | 'create-assessment' | 'assessments' | 'candidates' | 'attempts' | 'reports'
  >('overview');

  // Reactivity State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<CandidateAssessmentAttempt[]>([]);

  // Fetch real candidates from backend
  const { data: jobOpenings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  const availablePositionsList = useMemo(() => {
    const defaultPositions = [
      'DevOps Engineer',
      'Senior React Developer',
      'Backend Node.js Engineer',
      'Full Stack Engineer',
      'DevOps & Cloud Architect',
      'Frontend TypeScript Engineer',
      'Python & Data Engineer',
      'Java Enterprise Architect',
      'SQL & Data Analyst',
      'UI/UX Design Specialist',
      'HR Compliance Officer',
      'Product Specialist & Tech Lead',
      'QA Automation Specialist',
    ];
    const fromJobs = (jobOpenings || []).map((j: any) => j.title).filter(Boolean);
    return Array.from(new Set([...fromJobs, ...defaultPositions]));
  }, [jobOpenings]);

  const availableTechList = useMemo(() => {
    return [
      'DevOps',
      'React.js',
      'Node.js',
      'General',
      'Reasoning',
      'Programming',
      'JavaScript',
      'TypeScript',
      'SQL',
      'Python',
      'Java',
      'Other Technologies',
    ];
  }, []);

  const refreshData = () => {
    setQuestions(assessmentStore.getQuestions());
    setAssessments(assessmentStore.getAssessments());
    setAttempts(assessmentStore.getAttempts());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter States - Question Bank
  const [qbTechFilter, setQbTechFilter] = useState('ALL');
  const [qbDiffFilter, setQbDiffFilter] = useState('ALL');
  const [qbTypeFilter, setQbTypeFilter] = useState('ALL');
  const [qbSearch, setQbSearch] = useState('');

  // Modal States
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Send Assessment Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendCandidateTarget, setSendCandidateTarget] = useState<any>(null);

  // Result Modal State
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultAttempt, setSelectedResultAttempt] = useState<CandidateAssessmentAttempt | null>(null);

  // Question Form State
  const [qFormText, setQFormText] = useState('');
  const [qFormTech, setQFormTech] = useState('React.js');
  const [qFormTopic, setQFormTopic] = useState('React Hooks');
  const [qFormDiff, setQFormDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qFormType, setQFormType] = useState<'MCQ' | 'Multiple Select' | 'True-False' | 'Coding'>('MCQ');
  const [qFormOptions, setQFormOptions] = useState<string>('useState, useEffect, useMemo, useRef');
  const [qFormCorrectAns, setQFormCorrectAns] = useState<string>('1');
  const [qFormMarks, setQFormMarks] = useState<number>(1);
  const [qFormExplanation, setQFormExplanation] = useState<string>('');
  const [qFormCodeTemplate, setQFormCodeTemplate] = useState<string>('');

  // ── CREATE ASSESSMENT BLUEPRINT FORM STATE ──
  const [caName, setCaName] = useState('DevOps Assessment');
  const [caJobPosition, setCaJobPosition] = useState('DevOps Engineer');
  const [caDurationMins, setCaDurationMins] = useState(60);
  const [caPassingPercentage, setCaPassingPercentage] = useState(70);
  const [caStartDate, setCaStartDate] = useState('2026-08-28');
  const [caExpiryDate, setCaExpiryDate] = useState('2026-10-30');

  // Assessment Blueprint Sections
  const [caSections, setCaSections] = useState<AssessmentSection[]>([
    {
      id: 'sec-1',
      name: 'Aptitude',
      technology: 'General',
      questionType: 'MCQ',
      difficulty: 'Medium',
      questionCount: 10,
      marksPerQuestion: 1,
      totalMarks: 10,
    },
    {
      id: 'sec-2',
      name: 'Logical Reasoning',
      technology: 'Reasoning',
      questionType: 'MCQ',
      difficulty: 'Medium',
      questionCount: 10,
      marksPerQuestion: 1,
      totalMarks: 10,
    },
    {
      id: 'sec-3',
      name: 'Technical',
      technology: 'React.js',
      topic: 'React Hooks / React.js',
      questionType: 'MCQ',
      difficulty: 'Medium',
      questionCount: 20,
      marksPerQuestion: 1,
      totalMarks: 20,
    },
    {
      id: 'sec-4',
      name: 'Programming',
      technology: 'Programming',
      questionType: 'Coding',
      difficulty: 'Hard',
      questionCount: 5,
      marksPerQuestion: 2,
      totalMarks: 10,
    },
  ]);

  // Section Modal State
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [secFormName, setSecFormName] = useState('Technical');
  const [secFormTech, setSecFormTech] = useState('DevOps');
  const [secFormTopic, setSecFormTopic] = useState('');
  const [secFormType, setSecFormType] = useState<'MCQ' | 'Multiple Select' | 'True-False' | 'Coding'>('MCQ');
  const [secFormDiff, setSecFormDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [secFormCount, setSecFormCount] = useState(10);
  const [secFormMarksPerQ, setSecFormMarksPerQ] = useState(1);

  // Computed Totals for Blueprint
  const totalBlueprintQuestions = useMemo(
    () => caSections.reduce((acc, s) => acc + (s.questionCount || 0), 0),
    [caSections]
  );

  const totalBlueprintMarks = useMemo(
    () => caSections.reduce((acc, s) => acc + (s.totalMarks || 0), 0),
    [caSections]
  );

  const passingMarksRequired = useMemo(
    () => Math.round((totalBlueprintMarks * caPassingPercentage) / 100),
    [totalBlueprintMarks, caPassingPercentage]
  );

  // ── Section-wise Question Availability & Auto Selection Engine ──
  const getMatchingQuestionsForSection = (sec: AssessmentSection) => {
    if (!sec) return [];
    const secTech = (sec.technology || '').toLowerCase();
    const secTopic = (sec.topic || '').toLowerCase();

    // Tier 1: Match Tech + QuestionType + Topic (if topic set)
    let matching = (questions || []).filter((q) => {
      if (!q || q.status !== 'Active') return false;
      const qTech = (q.technology || '').toLowerCase();
      const qTopic = (q.topic || '').toLowerCase();

      const techMatch =
        qTech === secTech ||
        (sec.technology === 'General' && (qTech === 'general' || qTech === 'aptitude')) ||
        (sec.technology === 'Reasoning' && (qTech === 'reasoning' || qTech === 'logic')) ||
        (sec.technology === 'Programming' && (qTech === 'programming' || q.questionType === 'Coding'));

      const typeMatch = sec.questionType ? q.questionType === sec.questionType : true;
      const topicMatch = secTopic ? qTopic.includes(secTopic) : true;
      return techMatch && typeMatch && topicMatch;
    });

    // Tier 2 Fallback: If topic filter returned fewer than required, search across all topics in that tech & type
    if (matching.length < (sec.questionCount || 0)) {
      matching = (questions || []).filter((q) => {
        if (!q || q.status !== 'Active') return false;
        const qTech = (q.technology || '').toLowerCase();

        const techMatch =
          qTech === secTech ||
          (sec.technology === 'General' && (qTech === 'general' || qTech === 'aptitude')) ||
          (sec.technology === 'Reasoning' && (qTech === 'reasoning' || qTech === 'logic')) ||
          (sec.technology === 'Programming' && (qTech === 'programming' || q.questionType === 'Coding'));

        const typeMatch = sec.questionType ? q.questionType === sec.questionType : true;
        return techMatch && typeMatch;
      });
    }

    // Tier 3 Fallback: If still fewer, search across all active questions in that technology
    if (matching.length < (sec.questionCount || 0)) {
      matching = (questions || []).filter((q) => {
        if (!q || q.status !== 'Active') return false;
        const qTech = (q.technology || '').toLowerCase();
        return (
          qTech === secTech ||
          (sec.technology === 'General' && (qTech === 'general' || qTech === 'aptitude')) ||
          (sec.technology === 'Reasoning' && (qTech === 'reasoning' || qTech === 'logic')) ||
          (sec.technology === 'Programming' && (qTech === 'programming' || q.questionType === 'Coding'))
        );
      });
    }

    return matching;
  };

  const sectionSelectionStatus = useMemo(() => {
    return caSections.map((sec) => {
      const matching = getMatchingQuestionsForSection(sec);
      const required = sec.questionCount;
      const available = matching.length;
      const selectedList = sec.selectedQuestions || matching.slice(0, Math.min(available, required));
      const selectedCount = selectedList.length;
      const isInsufficient = selectedCount < required;
      const missingCount = isInsufficient ? required - selectedCount : 0;

      return {
        sectionId: sec.id,
        sectionName: sec.name,
        tech: sec.technology,
        type: sec.questionType,
        required,
        available,
        selected: selectedCount,
        isInsufficient,
        missingCount,
        matchingQuestions: matching,
      };
    });
  }, [caSections, questions]);

  const hasInsufficientQuestions = useMemo(() => {
    return sectionSelectionStatus.some((s) => s.isInsufficient);
  }, [sectionSelectionStatus]);

  const handleAutoSelectAllSections = () => {
    let insufficientFound = false;
    const updatedSections = caSections.map((sec) => {
      const matching = getMatchingQuestionsForSection(sec);
      const count = Math.min(sec.questionCount, matching.length);
      const selected = matching.slice(0, count);

      if (selected.length < sec.questionCount) {
        insufficientFound = true;
      }

      return {
        ...sec,
        selectedQuestions: selected,
      };
    });

    setCaSections(updatedSections);
    if (insufficientFound) {
      toast.warning('Auto-selection completed with warnings: Some sections have insufficient questions in Question Bank!');
    } else {
      toast.success('Successfully auto-selected exact required questions for all sections!');
    }
  };

  const regenerateSectionQuestions = (secId: string) => {
    setCaSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== secId) return sec;
        const matching = getMatchingQuestionsForSection(sec);
        const shuffled = [...matching].sort(() => Math.random() - 0.5);
        const count = Math.min(sec.questionCount, shuffled.length);

        return {
          ...sec,
          selectedQuestions: shuffled.slice(0, count),
        };
      })
    );
    toast.success('Section questions regenerated from Question Bank!');
  };

  // Section Modal Handlers
  const openAddSectionModal = (sec?: AssessmentSection) => {
    if (sec) {
      setEditingSectionId(sec.id);
      setSecFormName(sec.name);
      setSecFormTech(sec.technology);
      setSecFormTopic(sec.topic || '');
      setSecFormType(sec.questionType);
      setSecFormDiff(sec.difficulty);
      setSecFormCount(sec.questionCount);
      setSecFormMarksPerQ(sec.marksPerQuestion);
    } else {
      setEditingSectionId(null);
      setSecFormName('New Section');
      setSecFormTech('DevOps');
      setSecFormTopic('');
      setSecFormType('MCQ');
      setSecFormDiff('Medium');
      setSecFormCount(10);
      setSecFormMarksPerQ(1);
    }
    setIsAddSectionOpen(true);
  };

  const handleSaveSection = () => {
    if (!secFormName) {
      toast.error('Section Name is required');
      return;
    }

    const totMarks = secFormCount * secFormMarksPerQ;

    if (editingSectionId) {
      setCaSections((prev) =>
        prev.map((s) =>
          s.id === editingSectionId
            ? {
                ...s,
                name: secFormName,
                technology: secFormTech,
                topic: secFormTopic,
                questionType: secFormType,
                difficulty: secFormDiff,
                questionCount: secFormCount,
                marksPerQuestion: secFormMarksPerQ,
                totalMarks: totMarks,
              }
            : s
        )
      );
      toast.success('Section updated');
    } else {
      const newSec: AssessmentSection = {
        id: `sec-${Date.now()}`,
        name: secFormName,
        technology: secFormTech,
        topic: secFormTopic,
        questionType: secFormType,
        difficulty: secFormDiff,
        questionCount: secFormCount,
        marksPerQuestion: secFormMarksPerQ,
        totalMarks: totMarks,
      };
      setCaSections((prev) => [...prev, newSec]);
      toast.success('Section added to blueprint');
    }

    setIsAddSectionOpen(false);
  };

  const removeSection = (secId: string) => {
    setCaSections((prev) => prev.filter((s) => s.id !== secId));
    toast.success('Section removed');
  };

  // Metrics
  const activeAssessmentsCount = useMemo(() => assessments.filter((a) => a.status === 'Published' || a.status === 'Ready').length, [assessments]);
  const totalQuestionsCount = questions.length;
  const attemptsSentCount = attempts.length;
  const completedAttempts = useMemo(() => attempts.filter((a) => a.status === 'COMPLETED'), [attempts]);
  const completedAttemptsCount = completedAttempts.length;
  const pendingReviewCount = useMemo(() => attempts.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'SENT').length, [attempts]);

  const averageScorePercent = useMemo(() => {
    if (completedAttempts.length === 0) return 78;
    const sum = completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    return Math.round(sum / completedAttempts.length);
  }, [completedAttempts]);

  const passRatePercent = useMemo(() => {
    if (completedAttempts.length === 0) return 85;
    const passed = completedAttempts.filter((a) => a.isPassed).length;
    return Math.round((passed / completedAttempts.length) * 100);
  }, [completedAttempts]);

  const techQuestionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      map[q.technology] = (map[q.technology] || 0) + 1;
    });
    return map;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const searchLower = (qbSearch || '').toLowerCase();
    return (questions || []).filter((q) => {
      if (!q) return false;
      const matchTech = qbTechFilter === 'ALL' || q.technology === qbTechFilter;
      const matchDiff = qbDiffFilter === 'ALL' || q.difficulty === qbDiffFilter;
      const matchType = qbTypeFilter === 'ALL' || q.questionType === qbTypeFilter;
      const matchSearch =
        !searchLower ||
        (q.questionText || '').toLowerCase().includes(searchLower) ||
        (q.topic || '').toLowerCase().includes(searchLower) ||
        (q.technology || '').toLowerCase().includes(searchLower);
      return matchTech && matchDiff && matchType && matchSearch;
    });
  }, [questions, qbTechFilter, qbDiffFilter, qbTypeFilter, qbSearch]);

  const openAddQuestionModal = (q?: Question, prefillTech?: string) => {
    if (q) {
      setEditingQuestion(q);
      setQFormText(q.questionText);
      setQFormTech(q.technology);
      setQFormTopic(q.topic);
      setQFormDiff(q.difficulty);
      setQFormType(q.questionType);
      setQFormOptions(q.options ? q.options.join(', ') : '');
      setQFormCorrectAns(String(q.correctAnswer));
      setQFormMarks(q.marks || 1);
      setQFormExplanation(q.explanation || '');
      setQFormCodeTemplate(q.codeTemplate || '');
    } else {
      setEditingQuestion(null);
      setQFormText('');
      setQFormTech(prefillTech || 'React.js');
      setQFormTopic('React Hooks');
      setQFormDiff('Medium');
      setQFormType('MCQ');
      setQFormOptions('Option A, Option B, Option C, Option D');
      setQFormCorrectAns('0');
      setQFormMarks(1);
      setQFormExplanation('');
      setQFormCodeTemplate('');
    }
    setIsAddQuestionOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qFormText) {
      toast.error('Question text is required');
      return;
    }

    const opts = qFormOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let parsedAns: any = qFormCorrectAns;
    if (qFormType === 'MCQ') {
      parsedAns = isNaN(Number(qFormCorrectAns)) ? qFormCorrectAns : Number(qFormCorrectAns);
    } else if (qFormType === 'Multiple Select') {
      parsedAns = qFormCorrectAns.split(',').map((x) => (isNaN(Number(x.trim())) ? x.trim() : Number(x.trim())));
    }

    assessmentStore.saveQuestion({
      id: editingQuestion ? editingQuestion.id : undefined,
      technology: qFormTech,
      topic: qFormTopic,
      questionText: qFormText,
      difficulty: qFormDiff,
      questionType: qFormType,
      options: opts,
      correctAnswer: parsedAns,
      marks: qFormMarks,
      explanation: qFormExplanation,
      codeTemplate: qFormCodeTemplate,
      status: 'Active',
    });

    toast.success(editingQuestion ? 'Question updated' : 'Question added to Question Bank');
    setIsAddQuestionOpen(false);
    refreshData();
  };

  const handleBulkUpload = () => {
    if (!bulkJsonText) {
      toast.error('Please paste valid JSON questions format');
      return;
    }
    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed)) {
        toast.error('JSON must be an array of questions');
        return;
      }
      assessmentStore.bulkAddQuestions(parsed);
      toast.success(`Successfully uploaded ${parsed.length} questions to Question Bank!`);
      setIsBulkUploadOpen(false);
      setBulkJsonText('');
      refreshData();
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  const handleCreateAssessmentSubmit = (statusStr: 'Published' | 'Draft' = 'Published') => {
    if (!caName) {
      toast.error('Assessment Title is required');
      return;
    }

    if (statusStr === 'Published' && hasInsufficientQuestions) {
      toast.error('Cannot publish assessment: One or more sections have insufficient questions in Question Bank!');
      return;
    }

    // Collect all selected questions across sections
    let allQs: Question[] = [];
    caSections.forEach((sec) => {
      if (sec.selectedQuestions && sec.selectedQuestions.length > 0) {
        allQs.push(...sec.selectedQuestions);
      } else {
        const matching = getMatchingQuestionsForSection(sec);
        allQs.push(...matching.slice(0, sec.questionCount));
      }
    });

    if (allQs.length === 0) {
      allQs = questions.slice(0, totalBlueprintQuestions);
    }

    const asm = assessmentStore.saveAssessment({
      name: caName,
      technology: caSections[0]?.technology || 'React.js',
      jobPosition: caJobPosition,
      difficulty: 'Medium',
      questionCount: totalBlueprintQuestions,
      durationMins: caDurationMins,
      passingPercentage: caPassingPercentage,
      totalMarks: totalBlueprintMarks,
      attemptLimit: 1,
      startDate: caStartDate,
      expiryDate: caExpiryDate,
      sections: caSections,
      questions: allQs,
      status: statusStr,
    });

    toast.success(`Assessment "${asm.name}" (${asm.id}) saved as ${statusStr}!`);
    refreshData();
    setActiveSubTab('assessments');
  };

  // Filter States for Candidates Subtab
  const [candStageFilter, setCandStageFilter] = useState<'ELIGIBLE' | 'SHORTLISTED' | 'PASSED' | 'FAILED' | 'INVITED' | 'ALL'>('ELIGIBLE');
  const [candSearch, setCandSearch] = useState('');

  const assessmentEligibleCandidates = useMemo(() => {
    const list: any[] = [];
    jobOpenings.forEach((job: any) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c: any) => {
          list.push({
            ...c,
            jobTitle: job.title,
            appliedRole: job.title,
          });
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { id: 'cand-001', name: 'Siddharth Rao', email: 'siddharth.rao@example.com', jobTitle: 'DevOps Engineer', stage: 'ASSESSMENT_PASSED' },
        { id: 'cand-002', name: 'Sanuu Mote', email: 'sanuumote@gmail.com', jobTitle: 'Senior React Developer', stage: 'SHORTLISTED' },
        { id: 'cand-003', name: 'Sanika Shelke', email: 'sanikashelke@gmail.com', jobTitle: 'Software Engineer', stage: 'SHORTLISTED' },
        { id: 'cand-004', name: 'Neha Kale', email: 'neha.kale@example.com', jobTitle: 'DevOps Engineer', stage: 'APPLIED' },
        { id: 'cand-005', name: 'Sudarshan Kale', email: 'sudarshan.kale@example.com', jobTitle: 'IT Manager', stage: 'SHORTLISTED' }
      );
    }

    const enrichedList = list.map((cand) => {
      const candidateId = cand.id;
      const candidateEmail = cand.email ? (cand.email || '').toLowerCase() : '';

      const matchingAttempt = (attempts || []).find(
        (att) => att.candidateId === candidateId || (att.candidateEmail && candidateEmail && (att.candidateEmail || '').toLowerCase() === candidateEmail)
      );

      let effectiveStage = cand.stage || 'SHORTLISTED';
      if (matchingAttempt) {
        if (matchingAttempt.status === 'COMPLETED') {
          effectiveStage = matchingAttempt.isPassed ? 'ASSESSMENT_PASSED' : 'ASSESSMENT_FAILED';
        } else if (matchingAttempt.status === 'IN_PROGRESS') {
          effectiveStage = 'IN_PROGRESS';
        } else if (matchingAttempt.status === 'SENT') {
          effectiveStage = 'ASSESSMENT_INVITED';
        }
      }

      return {
        ...cand,
        effectiveStage,
        attempt: matchingAttempt,
      };
    });

    return enrichedList.filter((cand) => {
      const stage = cand.effectiveStage;
      const isAssessmentStage =
        stage === 'SHORTLISTED' ||
        stage === 'ASSESSMENT_INVITED' ||
        stage === 'ASSESSMENT_ASSIGNED' ||
        stage === 'IN_PROGRESS' ||
        stage === 'ASSESSMENT_PASSED' ||
        stage === 'ASSESSMENT_FAILED' ||
        stage === 'COMPLETED';

      let matchStage = true;
      if (candStageFilter === 'ELIGIBLE') {
        matchStage = isAssessmentStage;
      } else if (candStageFilter === 'SHORTLISTED') {
        matchStage = stage === 'SHORTLISTED';
      } else if (candStageFilter === 'PASSED') {
        matchStage = stage === 'ASSESSMENT_PASSED';
      } else if (candStageFilter === 'FAILED') {
        matchStage = stage === 'ASSESSMENT_FAILED';
      } else if (candStageFilter === 'INVITED') {
        matchStage = stage === 'ASSESSMENT_INVITED' || stage === 'ASSESSMENT_ASSIGNED' || stage === 'IN_PROGRESS';
      } else if (candStageFilter === 'ALL') {
        matchStage = true;
      }

      const searchLower = (candSearch || '').toLowerCase().trim();
      const candidateName = cand.name || `${cand.firstName || ''} ${cand.lastName || ''}`.trim();
      const matchSearch =
        !searchLower ||
        (candidateName || '').toLowerCase().includes(searchLower) ||
        (cand.email || '').toLowerCase().includes(searchLower) ||
        (cand.jobTitle || '').toLowerCase().includes(searchLower);

      return matchStage && matchSearch;
    });
  }, [jobOpenings, attempts, candStageFilter, candSearch]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Metrics Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Tests</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{activeAssessmentsCount}</p>
          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Published</p>
        </Card>

        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Question Bank</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{totalQuestionsCount}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{Object.keys(techQuestionCounts).length} Techs</p>
        </Card>

        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tests Sent</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{attemptsSentCount}</p>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">Invitations</p>
        </Card>

        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completed</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{completedAttemptsCount}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Evaluated</p>
        </Card>

        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{pendingReviewCount}</p>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Active Links</p>
        </Card>

        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Score</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{averageScorePercent}%</p>
          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Mean Performance</p>
        </Card>

        <Card className="shadow-2xs border-border/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pass Rate</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{passRatePercent}%</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Benchmark</p>
        </Card>
      </div>

      {/* ── 2. Navigation Sub-Tabs ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'question-bank', label: `Question Bank (${questions.length})`, icon: BookOpen },
          { id: 'create-assessment', label: 'Create Assessment', icon: Plus },
          { id: 'assessments', label: `Assessments (${assessments.length})`, icon: Layers },
          { id: 'candidates', label: 'Candidates', icon: Users },
          { id: 'attempts', label: `Attempts (${attempts.length})`, icon: FileCheck },
          { id: 'reports', label: 'Reports', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 3. SUBTAB CONTENTS ── */}

      {/* SUBTAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-2xs">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Active Assessment Templates</CardTitle>
                  <CardDescription className="text-xs">
                    Pre-configured technology assessments published for candidate evaluation
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setActiveSubTab('create-assessment')}>
                  <Plus className="h-3.5 w-3.5" /> Create Assessment
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px] uppercase font-bold">
                      <TableHead>Test ID</TableHead>
                      <TableHead>Assessment Name</TableHead>
                      <TableHead>Technology</TableHead>
                      <TableHead>Questions / Mins</TableHead>
                      <TableHead>Passing %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {assessments.map((asm) => (
                      <TableRow key={asm.id}>
                        <TableCell className="font-mono font-bold text-indigo-600">{asm.id}</TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-white">{asm.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800 font-mono">
                            {asm.technology}
                          </Badge>
                        </TableCell>
                        <TableCell>{asm.questionCount || asm.questions?.length} Qs ({asm.durationMins}m)</TableCell>
                        <TableCell className="font-bold">{asm.passingPercentage}%</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            {asm.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-indigo-600"
                            onClick={() => {
                              setActiveSubTab('assessments');
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-2xs p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Question Bank Distribution</span>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-indigo-600" onClick={() => setActiveSubTab('question-bank')}>
                  Manage Bank →
                </Button>
              </h3>

              <div className="space-y-2">
                {['React.js', 'Node.js', 'DevOps', 'General', 'Reasoning', 'Programming', 'JavaScript', 'TypeScript'].map((tech) => {
                  const count = techQuestionCounts[tech] || 0;
                  const percent = Math.min(Math.round((count / (totalQuestionsCount || 1)) * 100), 100);
                  return (
                    <div key={tech} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-slate-200">{tech}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{count} Qs</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.max(percent, 10)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SUBTAB 2: QUESTION BANK */}
      {activeSubTab === 'question-bank' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={qbSearch}
                  onChange={(e) => setQbSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200"
                />
              </div>

              <Select value={qbTechFilter} onValueChange={setQbTechFilter}>
                <SelectTrigger className="h-8 text-xs w-36 bg-slate-50 dark:bg-slate-800">
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Techs</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="React.js">React.js</SelectItem>
                  <SelectItem value="Node.js">Node.js</SelectItem>
                  <SelectItem value="General">General (Aptitude)</SelectItem>
                  <SelectItem value="Reasoning">Reasoning</SelectItem>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="SQL">SQL</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                </SelectContent>
              </Select>

              <Select value={qbDiffFilter} onValueChange={setQbDiffFilter}>
                <SelectTrigger className="h-8 text-xs w-32 bg-slate-50 dark:bg-slate-800">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={qbTypeFilter} onValueChange={setQbTypeFilter}>
                <SelectTrigger className="h-8 text-xs w-36 bg-slate-50 dark:bg-slate-800">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="Multiple Select">Multiple Select</SelectItem>
                  <SelectItem value="True-False">True-False</SelectItem>
                  <SelectItem value="Coding">Coding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setIsBulkUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Bulk Upload JSON
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => openAddQuestionModal()}>
                <Plus className="h-3.5 w-3.5" /> Add Question
              </Button>
            </div>
          </div>

          <Card className="shadow-2xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] uppercase font-bold">
                    <TableHead>QST ID</TableHead>
                    <TableHead>Question & Topic</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {filteredQuestions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono font-bold text-indigo-600">{q.id}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{q.questionText}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Topic: {q.topic}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 font-mono">
                          {q.technology}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {q.questionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{q.marks} Pts</TableCell>
                      <TableCell>
                        <Badge
                          className={`cursor-pointer text-[10px] ${
                            q.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
                          }`}
                          onClick={() => {
                            assessmentStore.toggleQuestionStatus(q.id);
                            refreshData();
                          }}
                        >
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-600" onClick={() => setPreviewQuestion(q)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600" onClick={() => openAddQuestionModal(q)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-600"
                            onClick={() => {
                              assessmentStore.deleteQuestion(q.id);
                              toast.success('Question removed');
                              refreshData();
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB 3: CREATE ASSESSMENT WORKFLOW (WITH SECTION BLUEPRINT) */}
      {activeSubTab === 'create-assessment' && (
        <Card className="shadow-2xs max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" /> Create & Configure Technical Assessment
            </CardTitle>
            <CardDescription className="text-xs">
              Configure assessment sections, automatic question selection rules from the Question Bank, and publish test blueprint
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateAssessmentSubmit('Published'); }} className="space-y-6">
              {/* 1. TOP BASIC FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Assessment Title</Label>
                  <Input
                    type="text"
                    placeholder="e.g. DevOps Assessment"
                    value={caName}
                    onChange={(e) => setCaName(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <SearchableSelectInput
                  label="Target Job Position"
                  value={caJobPosition}
                  onChange={setCaJobPosition}
                  options={availablePositionsList}
                  placeholder="Search position or type custom (e.g. DevOps Engineer)..."
                  icon={Briefcase}
                />

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={caDurationMins}
                    onChange={(e) => setCaDurationMins(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Passing Percentage (%)</Label>
                  <Input
                    type="number"
                    value={caPassingPercentage}
                    onChange={(e) => setCaPassingPercentage(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Expiry Date</Label>
                  <Input
                    type="date"
                    value={caExpiryDate}
                    onChange={(e) => setCaExpiryDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* 2. ASSESSMENT SECTIONS BLUEPRINT CARD */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600" /> Assessment Sections
                    </h3>
                    <p className="text-xs text-slate-500">Configure questions and marks for each assessment section.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    onClick={() => openAddSectionModal()}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Section
                  </Button>
                </div>

                {/* Sections Blueprint Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/80">
                      <TableRow className="text-[11px] uppercase font-bold">
                        <TableHead>Section</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Marks/Q</TableHead>
                        <TableHead>Total Marks</TableHead>
                        <TableHead>Technology</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {caSections.map((sec) => (
                        <TableRow key={sec.id}>
                          <TableCell className="font-bold text-slate-900 dark:text-white">{sec.name}</TableCell>
                          <TableCell className="font-mono">{sec.questionCount}</TableCell>
                          <TableCell className="font-mono">{sec.marksPerQuestion}</TableCell>
                          <TableCell className="font-bold text-indigo-600 font-mono">{sec.totalMarks}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {sec.technology}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600" onClick={() => openAddSectionModal(sec)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={() => removeSection(sec.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-6 text-xs font-bold">
                    <span>Total Questions: <strong className="text-indigo-600 text-sm">{totalBlueprintQuestions}</strong></span>
                    <span>Total Marks: <strong className="text-emerald-600 text-sm">{totalBlueprintMarks}</strong></span>
                  </div>
                </div>
              </div>

              {/* 3. AUTOMATIC QUESTION BANK SELECTION ENGINE (SECTION BY SECTION) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600" /> Automatic Section-wise Question Selection Engine
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Evaluates rules: Section → Technology → Question Type → Difficulty → Count
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleAutoSelectAllSections}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Auto-Select All Questions
                  </Button>
                </div>

                {/* Section Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {sectionSelectionStatus.map((st) => (
                    <div
                      key={st.sectionId}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 transition-colors ${
                        st.isInsufficient
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {st.isInsufficient ? (
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          {st.sectionName}
                        </span>
                        <Badge
                          className={`text-[10px] ${
                            st.isInsufficient
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          }`}
                        >
                          {st.isInsufficient ? `⚠ Missing ${st.missingCount} Qs` : `Selected: ${st.selected}/${st.required}`}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                        <p>
                          Required: <strong>{st.required}</strong> • Available in Bank: <strong>{st.available}</strong> • Tech: <strong>{st.tech}</strong>
                        </p>
                        {st.isInsufficient && (
                          <div className="p-2 rounded bg-amber-100/60 dark:bg-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200 font-semibold space-y-1">
                            <p>⚠ Insufficient questions in Question Bank for section "{st.sectionName}".</p>
                            <p>Required: {st.required} | Available: {st.available} | Missing: {st.missingCount}</p>
                          </div>
                        )}
                      </div>

                      {st.isInsufficient && (
                        <Button
                          type="button"
                          size="sm"
                          className="w-full h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 mt-1"
                          onClick={() => openAddQuestionModal(undefined, st.tech)}
                        >
                          <Plus className="h-3 w-3" /> Add Questions to Question Bank
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. SHOW SELECTED QUESTIONS GROUPED BY SECTION */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Selected Questions ({totalBlueprintQuestions}) Grouped by Section
                </h4>

                {caSections.map((sec) => {
                  const secQuestions = sec.selectedQuestions || [];
                  return (
                    <div key={sec.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span>▼ {sec.name}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            — {sec.questionCount} Questions — {sec.totalMarks} Marks ({sec.technology})
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] text-indigo-600 hover:bg-indigo-50"
                            onClick={() => regenerateSectionQuestions(sec.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Regenerate Section
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                        {secQuestions.length > 0 ? (
                          secQuestions.map((q, idx) => (
                            <div key={q.id || idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                              <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                {idx + 1}. {q.questionText}
                              </span>
                              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                {q.marks || sec.marksPerQuestion} Pts
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-center text-xs text-slate-400">
                            Click "Auto-Select All Questions" to populate questions for this section.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 5. ASSESSMENT SUMMARY BEFORE PUBLISH CARD */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-4 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Assessment Blueprint Summary
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center border-b border-slate-800 pb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Total Questions</p>
                    <p className="text-lg font-bold text-white mt-0.5">{totalBlueprintQuestions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Total Marks</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">{totalBlueprintMarks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Duration</p>
                    <p className="text-lg font-bold text-white mt-0.5">{caDurationMins} Mins</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Passing Score</p>
                    <p className="text-lg font-bold text-indigo-400 mt-0.5">{caPassingPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Passing Marks</p>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">{passingMarksRequired}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Sections</p>
                    <p className="text-lg font-bold text-white mt-0.5">{caSections.length}</p>
                  </div>
                </div>

                {/* Question Distribution Pills */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Question Distribution:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {caSections.map((sec) => (
                      <Badge key={sec.id} className="bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px] px-3 py-1">
                        {sec.name}: <strong className="text-indigo-400 ml-1">{sec.questionCount} Qs ({sec.totalMarks} Pts)</strong>
                      </Badge>
                    ))}
                  </div>
                </div>

                {hasInsufficientQuestions && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Cannot Publish:</strong> One or more assessment sections have insufficient questions in the Question Bank. Add questions or adjust section counts.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-slate-800 text-slate-200 text-xs"
                    onClick={() => handleCreateAssessmentSubmit('Draft')}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    className={`text-xs font-bold px-6 ${
                      hasInsufficientQuestions
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    Publish Assessment
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SUBTAB 4: ASSESSMENTS LIST */}
      {activeSubTab === 'assessments' && (
        <Card className="shadow-2xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Published Technical Assessments</CardTitle>
              <CardDescription className="text-xs">
                Manage assessment configurations, generated candidate links, and publishing status
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setActiveSubTab('create-assessment')}>
              <Plus className="h-3.5 w-3.5" /> Create New Assessment
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] uppercase font-bold">
                  <TableHead>Assessment ID</TableHead>
                  <TableHead>Assessment Name</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Target Position</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Passing %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {assessments.map((asm) => (
                  <TableRow key={asm.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">{asm.id}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-white">{asm.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800 font-mono">
                        {asm.technology}
                      </Badge>
                    </TableCell>
                    <TableCell>{asm.jobPosition}</TableCell>
                    <TableCell className="font-bold">{asm.questionCount || asm.questions?.length} Qs</TableCell>
                    <TableCell>{asm.durationMins} Mins</TableCell>
                    <TableCell className="font-bold text-emerald-600">{asm.passingPercentage}%</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        {asm.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                          onClick={() => {
                            setSendCandidateTarget(allCandidatesList[0]);
                            setIsSendModalOpen(true);
                          }}
                        >
                          <Send className="h-3 w-3" /> Send
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-600"
                          onClick={() => {
                            assessmentStore.deleteAssessment(asm.id);
                            toast.success('Assessment deleted');
                            refreshData();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* SUBTAB 5: CANDIDATES LIST */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-4">
          {/* Header & Filter Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" /> Candidate Assessment Management
              </h3>
              <p className="text-xs text-slate-500">
                Shows candidates eligible for assessment (Shortlisted & Assessment Stages). Dispatch invitations and view scorecards.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search candidate, email or title..."
                  value={candSearch}
                  onChange={(e) => setCandSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200"
                />
              </div>

              <Select value={candStageFilter} onValueChange={(v: any) => setCandStageFilter(v)}>
                <SelectTrigger className="h-8 text-xs w-56 bg-slate-50 dark:bg-slate-800">
                  <SelectValue placeholder="Stage Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ELIGIBLE">Eligible Candidates Only (Default)</SelectItem>
                  <SelectItem value="SHORTLISTED">Shortlisted Only</SelectItem>
                  <SelectItem value="INVITED">Assessment Invited / Sent</SelectItem>
                  <SelectItem value="PASSED">Assessment Passed</SelectItem>
                  <SelectItem value="FAILED">Assessment Failed</SelectItem>
                  <SelectItem value="ALL">All ATS Candidates (Unfiltered)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="shadow-2xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] uppercase font-bold">
                    <TableHead>Candidate</TableHead>
                    <TableHead>Applied Position</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assessment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {assessmentEligibleCandidates.length > 0 ? (
                    assessmentEligibleCandidates.map((cand) => {
                      const candidateName = cand.name || `${cand.firstName || ''} ${cand.lastName || ''}`.trim();
                      const stage = cand.effectiveStage;
                      const attempt = cand.attempt;

                      return (
                        <TableRow key={cand.id}>
                          <TableCell className="font-bold text-slate-900 dark:text-white">{candidateName}</TableCell>
                          <TableCell>{cand.jobTitle || 'DevOps Engineer'}</TableCell>
                          <TableCell className="font-mono text-slate-500">{cand.email}</TableCell>

                          <TableCell>
                            {stage === 'SHORTLISTED' && (
                              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">
                                SHORTLISTED
                              </Badge>
                            )}
                            {(stage === 'ASSESSMENT_INVITED' || stage === 'ASSESSMENT_ASSIGNED') && (
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                                ASSESSMENT INVITED
                              </Badge>
                            )}
                            {stage === 'IN_PROGRESS' && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                                TEST IN PROGRESS
                              </Badge>
                            )}
                            {stage === 'ASSESSMENT_PASSED' && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> PASSED {attempt?.percentage ? `(${attempt.percentage}%)` : ''}
                              </Badge>
                            )}
                            {stage === 'ASSESSMENT_FAILED' && (
                              <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> FAILED {attempt?.percentage ? `(${attempt.percentage}%)` : ''}
                              </Badge>
                            )}
                            {stage !== 'SHORTLISTED' &&
                              stage !== 'ASSESSMENT_INVITED' &&
                              stage !== 'ASSESSMENT_ASSIGNED' &&
                              stage !== 'IN_PROGRESS' &&
                              stage !== 'ASSESSMENT_PASSED' &&
                              stage !== 'ASSESSMENT_FAILED' && (
                                <Badge variant="outline" className="text-[10px] text-slate-500">
                                  {stage}
                                </Badge>
                              )}
                          </TableCell>

                          <TableCell className="text-right">
                            {stage === 'SHORTLISTED' && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1 font-semibold"
                                onClick={() => {
                                  setSendCandidateTarget(cand);
                                  setIsSendModalOpen(true);
                                }}
                              >
                                <Send className="h-3 w-3" /> Send Assessment Link
                              </Button>
                            )}

                            {(stage === 'ASSESSMENT_INVITED' || stage === 'ASSESSMENT_ASSIGNED') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-1 font-semibold"
                                onClick={() => {
                                  setSendCandidateTarget(cand);
                                  setIsSendModalOpen(true);
                                }}
                              >
                                <RotateCcw className="h-3 w-3" /> Resend Link
                              </Button>
                            )}

                            {stage === 'IN_PROGRESS' && (
                              <span className="text-[11px] text-slate-400 font-mono">Taking Test...</span>
                            )}

                            {(stage === 'ASSESSMENT_PASSED' || stage === 'ASSESSMENT_FAILED') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`h-7 text-xs gap-1 font-semibold ${
                                  stage === 'ASSESSMENT_PASSED'
                                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                }`}
                                onClick={() => {
                                  if (attempt) {
                                    setSelectedResultAttempt(attempt);
                                    setIsResultModalOpen(true);
                                  } else {
                                    toast.info('Scorecard details available in Attempts tab');
                                  }
                                }}
                              >
                                <Eye className="h-3 w-3" /> View Scorecard
                              </Button>
                            )}

                            {stage !== 'SHORTLISTED' &&
                              stage !== 'ASSESSMENT_INVITED' &&
                              stage !== 'ASSESSMENT_ASSIGNED' &&
                              stage !== 'IN_PROGRESS' &&
                              stage !== 'ASSESSMENT_PASSED' &&
                              stage !== 'ASSESSMENT_FAILED' && (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400">
                        No eligible candidates found matching current filter ({candStageFilter}).
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB 6: CANDIDATE ATTEMPTS LOGS */}
      {activeSubTab === 'attempts' && (
        <Card className="shadow-2xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Candidate Attempt Logs & Evaluation Scorecards</CardTitle>
              <CardDescription className="text-xs">
                Track candidate test start times, submissions, auto-evaluated scores, and detailed question results
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] uppercase font-bold">
                  <TableHead>Token ID</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Assessment Name</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {attempts.map((att) => {
                  const isPassed = att.isPassed;
                  return (
                    <TableRow key={att.token}>
                      <TableCell className="font-mono text-[11px] text-slate-500">{att.token}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">{att.candidateName}</TableCell>
                      <TableCell>{att.assessmentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {att.technology}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                          {att.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-900 dark:text-white">
                        {att.score !== undefined ? `${att.score} / ${att.totalMarks || 50} (${att.percentage}%)` : 'Pending'}
                      </TableCell>
                      <TableCell>
                        {att.status === 'COMPLETED' ? (
                          <Badge
                            className={`text-[10px] ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}
                          >
                            {isPassed ? 'PASSED' : 'FAILED'}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">In Progress</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setSelectedResultAttempt(att);
                            setIsResultModalOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" /> View Scorecard
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* SUBTAB 7: REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold">Assessment Performance Analytics & Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-semibold text-slate-500">Overall Pass Rate</p>
                <p className="text-3xl font-extrabold text-indigo-600 mt-1">{passRatePercent}%</p>
                <p className="text-[11px] text-slate-400 mt-1">Candidates meeting passing percentage criteria</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-xs font-semibold text-slate-500">Average Technical Score</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">{averageScorePercent}%</p>
                <p className="text-[11px] text-slate-400 mt-1">Mean percentage score across all completed tests</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                <p className="text-xs font-semibold text-slate-500">Total Assessments Sent</p>
                <p className="text-3xl font-extrabold text-purple-600 mt-1">{attempts.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Evaluations dispatched to candidates</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Send Assessment Modal */}
      <SendAssessmentModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        candidate={sendCandidateTarget}
        onSuccess={() => {
          refreshData();
          setActiveSubTab('attempts');
        }}
      />

      {/* 2. View Result Scorecard Modal */}
      <ViewAssessmentResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        attempt={selectedResultAttempt}
      />

      {/* 3. Add / Edit Question Modal */}
      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingQuestion ? 'Edit Question Bank Item' : 'Add Question to Question Bank'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define question prompt, choices, technology tags, and answer key
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuestion} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Question Prompt</Label>
              <Textarea
                value={qFormText}
                onChange={(e) => setQFormText(e.target.value)}
                rows={3}
                className="text-xs"
                placeholder="Enter technical question text..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Technology Tag</Label>
                <Select value={qFormTech} onValueChange={setQFormTech}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="React.js">React.js</SelectItem>
                    <SelectItem value="Node.js">Node.js</SelectItem>
                    <SelectItem value="General">General (Aptitude)</SelectItem>
                    <SelectItem value="Reasoning">Reasoning</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="JavaScript">JavaScript</SelectItem>
                    <SelectItem value="TypeScript">TypeScript</SelectItem>
                    <SelectItem value="SQL">SQL</SelectItem>
                    <SelectItem value="Python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Topic / Sub-skill</Label>
                <Input
                  type="text"
                  value={qFormTopic}
                  onChange={(e) => setQFormTopic(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="e.g. React Hooks, CI/CD"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Difficulty</Label>
                <Select value={qFormDiff} onValueChange={(v: any) => setQFormDiff(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Question Type</Label>
                <Select value={qFormType} onValueChange={(v: any) => setQFormType(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="Multiple Select">Multiple Select</SelectItem>
                    <SelectItem value="True-False">True-False</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {qFormType !== 'Coding' && qFormType !== 'True-False' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Options (Comma Separated)</Label>
                <Input
                  type="text"
                  value={qFormOptions}
                  onChange={(e) => setQFormOptions(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="Option A, Option B, Option C, Option D"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Correct Answer (Index or Value)</Label>
                <Input
                  type="text"
                  value={qFormCorrectAns}
                  onChange={(e) => setQFormCorrectAns(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="e.g. 1 or True or 0,1,3"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Marks Per Question</Label>
                <Input
                  type="number"
                  value={qFormMarks}
                  onChange={(e) => setQFormMarks(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Explanation / Evaluator Note</Label>
              <Input
                type="text"
                value={qFormExplanation}
                onChange={(e) => setQFormExplanation(e.target.value)}
                className="h-8 text-xs"
                placeholder="Explanation shown on scorecard..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddQuestionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 text-white text-xs">
                Save Question
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Add / Edit Section Modal */}
      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingSectionId ? 'Edit Assessment Section' : 'Add Assessment Section'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure question count, technology tags, and marks per question for this section
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Section Name *</Label>
              <Input
                value={secFormName}
                onChange={(e) => setSecFormName(e.target.value)}
                placeholder="e.g. Technical, Aptitude, Programming"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Technology / Skill *</Label>
              <Select value={secFormTech} onValueChange={setSecFormTech}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="React.js">React.js</SelectItem>
                  <SelectItem value="Node.js">Node.js</SelectItem>
                  <SelectItem value="General">General (Aptitude)</SelectItem>
                  <SelectItem value="Reasoning">Reasoning (Logical)</SelectItem>
                  <SelectItem value="Programming">Programming (Coding)</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="SQL">SQL</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Topic / Sub-skill</Label>
              <Input
                value={secFormTopic}
                onChange={(e) => setSecFormTopic(e.target.value)}
                placeholder="e.g. React Hooks, CI/CD Pipelines"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Question Type</Label>
                <Select value={secFormType} onValueChange={(v: any) => setSecFormType(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="Multiple Select">Multiple Select</SelectItem>
                    <SelectItem value="True-False">True-False</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Difficulty</Label>
                <Select value={secFormDiff} onValueChange={(v: any) => setSecFormDiff(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Number of Questions *</Label>
                <Input
                  type="number"
                  value={secFormCount}
                  onChange={(e) => setSecFormCount(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Marks Per Question *</Label>
                <Input
                  type="number"
                  value={secFormMarksPerQ}
                  onChange={(e) => setSecFormMarksPerQ(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 text-white text-xs" onClick={handleSaveSection}>
              Save Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Bulk Upload Modal */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Bulk Upload Questions (JSON)</DialogTitle>
            <DialogDescription className="text-xs">
              Paste an array of question JSON objects to import questions in bulk into the Question Bank
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
              rows={8}
              className="text-xs font-mono bg-slate-950 text-emerald-400 p-3"
              placeholder={`[\n  {\n    "technology": "DevOps",\n    "topic": "Docker",\n    "questionText": "What is docker build?",\n    "difficulty": "Easy",\n    "questionType": "MCQ",\n    "options": ["Option A", "Option B"],\n    "correctAnswer": 0,\n    "marks": 1\n  }\n]`}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBulkUploadOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 text-white text-xs" onClick={handleBulkUpload}>
              Upload Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Preview Question Modal */}
      <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Question Preview</span>
              <Badge variant="outline" className="font-mono text-xs">
                {previewQuestion?.technology}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {previewQuestion && (
            <div className="space-y-3 py-2 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Prompt:</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{previewQuestion.questionText}</p>
              </div>

              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Options:</p>
                  <ul className="space-y-1 pl-2">
                    {previewQuestion.options.map((opt, i) => (
                      <li key={i} className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {String.fromCharCode(65 + i)}. {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-600">Correct Answer:</p>
                <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {String(previewQuestion.correctAnswer)}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Explanation:</p>
                <p className="text-slate-600 dark:text-slate-400 italic">{previewQuestion.explanation || 'None provided'}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setPreviewQuestion(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
