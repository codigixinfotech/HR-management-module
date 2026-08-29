import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  TrendingUp,
  Star,
  UserX,
  Briefcase,
  UserCheck,
  ClipboardCheck,
  Award,
  FileText,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  GraduationCap,
  MapPin,
  Calendar,
  Layers,
  Brain,
} from 'lucide-react';
import { jobOpeningsApi, candidatesApi, assessmentsApi } from '@/api/recruitment';
import { AtsAnalysisCard } from '@/components/recruitment/AtsAnalysisCard';
import { ResumeViewerModal } from '@/components/recruitment/ResumeViewerModal';
import { employeesApi } from '@/api/employees';
import { tasksApi } from '@/api/tasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { CandidateStage, CandidateScreening, AssessmentAssignment } from '@/api/types';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { interviewsApi } from '@/api/interviews';
import { AssignAssessmentModal } from './AssignAssessmentModal';
import { ViewAssessmentModal } from './ViewAssessmentModal';
import { SendAssessmentModal } from './SendAssessmentModal';
import { Pagination } from '@/components/common/Pagination';
import { CandidateFullFormModal } from '@/components/recruitment/CandidateFullFormModal';
import { CandidateDetailsModal } from '@/components/recruitment/CandidateDetailsModal';
import { CandidateDeleteModal } from '@/components/recruitment/CandidateDeleteModal';

export function CandidatesTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Pagination State for Candidate Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal State: Full Form Add / Edit Candidate
  const [isFullFormOpen, setIsFullFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);

  // Modal State: View Candidate Details
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<any | null>(null);

  // Modal State: Delete Candidate
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCandidate, setDeletingCandidate] = useState<any | null>(null);

  // Modal State: Schedule Interview
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalCandidateId, setScheduleModalCandidateId] = useState<string>('');

  // Modal State: Assign & View Assessment Overview
  const [isAssignAssessmentOpen, setIsAssignAssessmentOpen] = useState(false);
  const [assignAssessmentCandidate, setAssignAssessmentCandidate] = useState<any>(null);
  const [isSendAssessmentModalOpen, setIsSendAssessmentModalOpen] = useState(false);
  const [sendAssessmentCandidate, setSendAssessmentCandidate] = useState<any>(null);
  const [isViewAssessmentOpen, setIsViewAssessmentOpen] = useState(false);
  const [viewAssessmentCandidate, setViewAssessmentCandidate] = useState<any>(null);
  const [viewAssessmentAssignment, setViewAssessmentAssignment] = useState<AssessmentAssignment | null>(null);
  const [assessmentAssignments, setAssessmentAssignments] = useState<Record<string, AssessmentAssignment>>({
    'cand-siddharth': {
      id: 'ATT-901',
      candidateId: 'cand-siddharth',
      candidateName: 'Siddharth Rao',
      candidateEmail: 'siddharth.rao@example.com',
      templateId: 'TST-201',
      templateName: 'React Architecture & State Challenge',
      assignedDate: '01 Aug 2026',
      dueDate: '06 Aug 2026',
      status: 'PASSED',
      score: '92% (Pass)',
      scorePercent: 92,
      passingScorePercent: 70,
    },
    'cand-neha': {
      id: 'ATT-902',
      candidateId: 'cand-neha',
      candidateName: 'Neha Gupta',
      candidateEmail: 'neha.gupta@example.com',
      templateId: 'TST-202',
      templateName: 'DevOps Helm & Kubernetes Quiz',
      assignedDate: '02 Aug 2026',
      dueDate: '07 Aug 2026',
      status: 'PASSED',
      score: '88% (Pass)',
      scorePercent: 88,
      passingScorePercent: 75,
    },
  });

  // Modal State: Focused Candidate Screening Evaluation Form
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [screeningCandidate, setScreeningCandidate] = useState<any>(null);
  const [isFetchingScreening, setIsFetchingScreening] = useState(false);
  const [resumeViewerCandidate, setResumeViewerCandidate] = useState<any>(null);

  // Form Fields: Basic Screening Info
  const [relExpYears, setRelExpYears] = useState<string>('6');
  const [relExpSummary, setRelExpSummary] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState<string>('30 Days');
  const [currentCtc, setCurrentCtc] = useState<string>('18');
  const [expectedCtc, setExpectedCtc] = useState<string>('24');
  const [highestQualification, setHighestQualification] = useState<string>('');
  const [qualificationMatch, setQualificationMatch] = useState<'YES' | 'NO' | 'PARTIAL'>('YES');
  const [skillsMatch, setSkillsMatch] = useState<'YES' | 'NO' | 'PARTIAL'>('YES');

  // Form Fields: Recruiter Evaluation Ratings (1 to 5)
  const [techRating, setTechRating] = useState<number>(4);
  const [commRating, setCommRating] = useState<number>(4);
  const [profileMatchRating, setProfileMatchRating] = useState<number>(4);
  const [screeningRemarks, setScreeningRemarks] = useState<string>('');
  const [screeningDecision, setScreeningDecision] = useState<'SHORTLIST' | 'HOLD' | 'REJECT'>('SHORTLIST');

  // Audit Fields (Assignable & Captured)
  const [screenedBy, setScreenedBy] = useState<string>('Aishwarya Roy (Director HR)');
  const [screeningDate, setScreeningDate] = useState<string>('18 Aug 2026, 02:30 PM');
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>('Aishwarya Roy (Director HR)');
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('18 Aug 2026, 02:30 PM');

  // Form Validation Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-calculated Overall Screening Score
  const overallScore = useMemo(() => {
    const avg = (techRating + commRating + profileMatchRating) / 3;
    return avg.toFixed(1);
  }, [techRating, commRating, profileMatchRating]);

  // Fetch Job Openings & real candidate records
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Fetch Candidate Interview History for selected candidate
  const { data: candidateInterviews = [] } = useQuery({
    queryKey: ['candidate-interviews-history', screeningCandidate?.id],
    queryFn: () => (screeningCandidate?.id ? interviewsApi.getCandidateHistory(screeningCandidate.id) : []),
    enabled: Boolean(screeningCandidate?.id && isScreeningOpen),
  });

  // Fetch real employee roster from Employee Master
  const { data: employeesData } = useQuery({
    queryKey: ['employees-master-list'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeeOptions = useMemo(() => {
    if (!employeesData?.items || employeesData.items.length === 0) {
      return [
        { id: 'emp-1', code: 'EMP-8265', name: 'Aishwarya Roy', dept: 'Human Resources', company: 'Codigix Infotech Pvt. Ltd.', title: 'Director HR' },
        { id: 'emp-2', code: 'EMP-0042', name: 'Sanika Mote', dept: 'Engineering', company: 'Codigix Infotech Pvt. Ltd.', title: 'HR Manager' },
        { id: 'emp-3', code: 'EMP-0019', name: 'Priya Verma', dept: 'Human Resources', company: 'Codigix Infotech Pvt. Ltd.', title: 'HR Lead' },
        { id: 'emp-4', code: 'EMP-0105', name: 'Rajesh Sharma', dept: 'Executive Office', company: 'Codigix Infotech Pvt. Ltd.', title: 'CTO' },
      ];
    }
    return employeesData.items.map((emp) => {
      const title = emp.designation?.title || 'Employee';
      const dept = emp.department?.name || 'Engineering';
      const company = emp.company?.name || 'Codigix Infotech Pvt. Ltd.';
      const code = emp.employeeCode || `EMP-${emp.id.substring(0, 4).toUpperCase()}`;
      return {
        id: emp.id,
        code,
        name: `${emp.firstName} ${emp.lastName}`,
        dept,
        company,
        title,
      };
    });
  }, [employeesData]);

  // Extract all candidates from job openings
  const allCandidates = useMemo(() => {
    const list: any[] = [];
    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c: any) => {
          list.push({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            phone: c.phone || 'N/A',
            role: job.title,
            reqCode: job.requisitionCode || job.mrNumber || 'JR-2026-001',
            jobId: job.id,
            stage: (c.stage as CandidateStage) || 'APPLIED',
            rating: c.screenings?.[0]?.overallScreeningScore ? `${c.screenings[0].overallScreeningScore}/5` : '4.0/5',
            score: c.atsAnalysis?.matchScore !== undefined ? `${c.atsAnalysis.matchScore}%` : (c.aiMatchScore !== null && c.aiMatchScore !== undefined ? `${c.aiMatchScore}%` : 'N/A'),
            source: c.source || 'Careers Portal',
            candidateType: c.candidateType || (c.experience?.toLowerCase().includes('fresher') || c.experience === '0 Years' || !c.experience ? 'FRESHER' : 'EXPERIENCED'),
            experience: c.experience || '6 Years',
            qualification: c.qualification || 'Graduate',
            currentLocation: c.currentLocation || 'Pune, India',
            currentCtc: c.currentCtc || 18,
            expectedCtc: c.expectedCtc || 24,
            noticePeriod: c.noticePeriod || '30 Days',
            resumePath: c.resumePath || null,
            latestScreening: c.screenings?.[0] || null,
            createdAt: c.createdAt,
          });
        });
      }
    });

    return list;
  }, [openings]);

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update candidate stage'),
  });
  const saveScreeningMutation = useMutation({
    mutationFn: ({ candidateId, payload }: { candidateId: string; payload: any }) =>
      candidatesApi.saveScreening(candidateId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      setIsScreeningOpen(false);
      const dec = payloadDecision;
      const candidateName = screeningCandidate?.name || 'Candidate';

      // Automatically create a Screening/Interview Task in Task Management assigned to Screened By employee
      const targetEmp = employeesData?.items?.find(
        (e: any) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(screenedBy.toLowerCase()) ||
          screenedBy.toLowerCase().includes(e.firstName.toLowerCase()),
      ) || employeesData?.items?.find((e: any) => e.employeeCode === 'EMP-8265') || employeesData?.items?.[0];

      if (targetEmp?.id && screeningCandidate) {
        tasksApi
          .create({
            title: `Screening Evaluation: ${screeningCandidate.name} (${screeningCandidate.role})`,
            taskType: 'RECRUITMENT',
            projectName: 'E-HCM Recruitment Core',
            priority: 'HIGH',
            assignedToId: targetEmp.id,
            description: `Conduct technical & qualification screening for candidate ${screeningCandidate.name} (Req: ${screeningCandidate.reqCode}). Score: ${overallScore}/5. Remarks: ${screeningRemarks}`,
            instructions: `Review resume, verify experience & qualification, conduct interview evaluation.`,
            managerRemarks: `Auto-allocated task assigned to ${targetEmp.firstName} ${targetEmp.lastName}.`,
          })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task-summary'] });
            toast.info(`Task auto-created & assigned to ${targetEmp.firstName} ${targetEmp.lastName} in Task Management!`);
          })
          .catch((e: any) => console.log('Auto-task creation note:', e));
      }

      if (dec === 'SHORTLIST') {
        toast.success(`Candidate screening saved! ${candidateName} shortlisted for interview.`, {
          action: {
            label: 'Schedule Interview',
            onClick: () => navigate('/recruitment/interviews'),
          },
        });
      } else if (dec === 'HOLD') {
        toast.info(`Screening evaluation saved. Candidate ${candidateName} placed ON HOLD.`);
      } else if (dec === 'REJECT') {
        toast.error(`Screening evaluation saved. Candidate ${candidateName} REJECTED.`);
      } else {
        toast.success(`Screening evaluation saved for ${candidateName}.`);
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to save candidate screening evaluation';
      toast.error(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(', ') : 'Failed to save screening');
    },
  });

  let payloadDecision = screeningDecision;

  const createCandidateMutation = useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) =>
      jobOpeningsApi.addCandidate(jobId, payload),
    onSuccess: (candidate) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success(`Candidate ${candidate.firstName} ${candidate.lastName} added successfully (Status: APPLIED)`);
      setIsFullFormOpen(false);
      setEditingCandidate(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to add candidate'),
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      candidatesApi.update(id, payload),
    onSuccess: (candidate) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-ats-analysis', candidate.id] });
      toast.success(`Candidate ${candidate.firstName} ${candidate.lastName} updated successfully`);
      setIsFullFormOpen(false);
      setEditingCandidate(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update candidate'),
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: (id: string) => candidatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Candidate record deleted successfully from database');
      setIsDeleteOpen(false);
      setDeletingCandidate(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to delete candidate'),
  });

  const handleFormSubmit = (payload: any, jobId: string, candidateId?: string) => {
    if (candidateId) {
      updateCandidateMutation.mutate({ id: candidateId, payload });
    } else {
      createCandidateMutation.mutate({ jobId, payload });
    }
  };

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setIsFullFormOpen(true);
  };

  const handleOpenEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setIsViewDetailsOpen(false);
    setIsFullFormOpen(true);
  };

  const handleOpenViewDetails = (candidate: any) => {
    setViewingCandidate(candidate);
    setIsViewDetailsOpen(true);
  };

  const handleOpenDelete = (candidate: any) => {
    setDeletingCandidate(candidate);
    setIsViewDetailsOpen(false);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    deleteCandidateMutation.mutate(id);
  };

  // Open Focused Candidate Screening Evaluation Dialog Modal
  const openScreeningModal = async (candidate: any) => {
    setScreeningCandidate(candidate);
    setValidationErrors({});
    setIsFetchingScreening(true);
    setIsScreeningOpen(true);

    try {
      const screening: CandidateScreening = await candidatesApi.getScreening(candidate.id);
      if (screening) {
        setRelExpYears(screening.relevantExperienceYears !== null && screening.relevantExperienceYears !== undefined ? String(screening.relevantExperienceYears) : (candidate.experience?.replace(/[^0-9.]/g, '') || '5'));
        setRelExpSummary(screening.relevantExperienceSummary || `Candidate has strong domain experience in ${candidate.role}.`);
        setCurrentLocation(screening.currentLocation || candidate.currentLocation || 'Pune, India');
        setNoticePeriod(screening.noticePeriod || candidate.noticePeriod || '30 Days');
        setCurrentCtc(screening.currentCtc !== null && screening.currentCtc !== undefined ? String(screening.currentCtc) : (candidate.currentCtc ? String(candidate.currentCtc) : '18'));
        setExpectedCtc(screening.expectedCtc !== null && screening.expectedCtc !== undefined ? String(screening.expectedCtc) : (candidate.expectedCtc ? String(candidate.expectedCtc) : '24'));
        setHighestQualification(screening.highestQualification || candidate.qualification || 'B.E. Computer Science');
        setQualificationMatch((screening.qualificationMatch as any) || 'YES');
        setSkillsMatch((screening.skillsMatch as any) || 'YES');
        setTechRating(screening.technicalRating || 4);
        setCommRating(screening.communicationRating || 4);
        setProfileMatchRating(screening.profileMatchRating || 4);
        setScreeningRemarks(screening.screeningRemarks || screening.rejectionReason || '');
        setScreeningDecision((screening.screeningDecision as any) || 'SHORTLIST');
        setScreenedBy(screening.screenedBy || 'Aishwarya Roy (Director HR)');
        setScreeningDate(screening.screenedAt ? new Date(screening.screenedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '18 Aug 2026, 02:30 PM');
        setLastUpdatedBy(screening.lastUpdatedBy || screening.screenedBy || 'Aishwarya Roy (Director HR)');
        setLastUpdatedDate(screening.lastUpdatedDate ? new Date(screening.lastUpdatedDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '18 Aug 2026, 02:30 PM');
      } else {
        // Defaults from candidate profile
        setRelExpYears(candidate.experience?.replace(/[^0-9.]/g, '') || '5');
        setRelExpSummary(`${candidate.name} has relevant experience for the ${candidate.role} position.`);
        setCurrentLocation(candidate.currentLocation || 'Pune, India');
        setNoticePeriod(candidate.noticePeriod || '30 Days');
        setCurrentCtc(candidate.currentCtc ? String(candidate.currentCtc) : '18');
        setExpectedCtc(candidate.expectedCtc ? String(candidate.expectedCtc) : '24');
        setHighestQualification(candidate.qualification || 'B.E. / B.Tech Computer Science');
        setQualificationMatch('YES');
        setSkillsMatch('YES');
        setTechRating(4);
        setCommRating(4);
        setProfileMatchRating(4);
        setScreeningRemarks('Candidate has strong technical domain knowledge and good team alignment. Recommended for technical panel interview.');
        setScreeningDecision('SHORTLIST');
        setScreenedBy('Aishwarya Roy (Director HR)');
        setScreeningDate('18 Aug 2026, 02:30 PM');
        setLastUpdatedBy('Aishwarya Roy (Director HR)');
        setLastUpdatedDate('18 Aug 2026, 02:30 PM');
      }
    } catch {
      // Fallback if API getScreening returns 404 or fails
      setRelExpYears(candidate.experience?.replace(/[^0-9.]/g, '') || '5');
      setRelExpSummary(`${candidate.name} has domain experience in ${candidate.role}.`);
      setCurrentLocation(candidate.currentLocation || 'Pune, India');
      setNoticePeriod(candidate.noticePeriod || '30 Days');
      setCurrentCtc(candidate.currentCtc ? String(candidate.currentCtc) : '18');
      setExpectedCtc(candidate.expectedCtc ? String(candidate.expectedCtc) : '24');
      setHighestQualification(candidate.qualification || 'B.E. Computer Science');
      setQualificationMatch('YES');
      setSkillsMatch('YES');
      setTechRating(4);
      setCommRating(4);
      setProfileMatchRating(4);
      setScreeningRemarks('Strong technical background and clear communication.');
      setScreeningDecision('SHORTLIST');
      setScreenedBy('Aishwarya Roy (Director HR)');
      setScreeningDate('18 Aug 2026, 02:30 PM');
      setLastUpdatedBy('Aishwarya Roy (Director HR)');
      setLastUpdatedDate('18 Aug 2026, 02:30 PM');
    } finally {
      setIsFetchingScreening(false);
    }
  };

  const handleSaveScreening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screeningCandidate) return;

    // Strict Validation
    const errors: Record<string, string> = {};

    const parsedExp = parseFloat(relExpYears);
    if (isNaN(parsedExp) || parsedExp < 0) {
      errors.relExpYears = 'Relevant Experience must be a valid non-negative number';
    }

    const parsedCurrentCtc = parseFloat(currentCtc);
    if (isNaN(parsedCurrentCtc) || parsedCurrentCtc < 0) {
      errors.currentCtc = 'Current CTC must be a valid non-negative number';
    }

    const parsedExpectedCtc = parseFloat(expectedCtc);
    if (isNaN(parsedExpectedCtc) || parsedExpectedCtc < 0) {
      errors.expectedCtc = 'Expected CTC must be a valid non-negative number';
    }

    if (!techRating || techRating < 1 || techRating > 5) {
      errors.techRating = 'Technical Rating must be selected (1-5)';
    }

    if (!commRating || commRating < 1 || commRating > 5) {
      errors.commRating = 'Communication Rating must be selected (1-5)';
    }

    if (!profileMatchRating || profileMatchRating < 1 || profileMatchRating > 5) {
      errors.profileMatchRating = 'Profile Match rating must be selected (1-5)';
    }

    if (!screeningDecision) {
      errors.screeningDecision = 'Screening Decision is mandatory (Shortlist / Hold / Reject)';
    }

    if (screeningDecision === 'REJECT' && !screeningRemarks.trim()) {
      errors.screeningRemarks = 'Rejection remarks/reason are required when rejecting a candidate';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before saving screening');
      return;
    }

    setValidationErrors({});
    payloadDecision = screeningDecision;

    saveScreeningMutation.mutate({
      candidateId: screeningCandidate.id,
      payload: {
        relevantExperienceYears: parsedExp,
        relevantExperienceSummary: relExpSummary,
        currentLocation,
        noticePeriod,
        currentCtc: parsedCurrentCtc,
        expectedCtc: parsedExpectedCtc,
        highestQualification,
        qualificationMatch,
        skillsMatch,
        technicalRating: techRating,
        communicationRating: commRating,
        profileMatchRating,
        overallScreeningScore: parseFloat(overallScore),
        screeningRemarks,
        rejectionReason: screeningDecision === 'REJECT' ? screeningRemarks : undefined,
        screeningDecision,
        screenedBy,
        lastUpdatedBy,
      },
    });
  };

  const handleReject = (candidate: any) => {
    openScreeningModal(candidate);
    setScreeningDecision('REJECT');
  };

  const [candidateTypeFilter, setCandidateTypeFilter] = useState<string>('all');

  const filteredCandidates = useMemo(() => {
    return allCandidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reqCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage =
        selectedStage === 'all'
          ? true
          : c.stage.toLowerCase() === selectedStage.toLowerCase() ||
            (selectedStage === 'screening' && (c.stage === 'APPLIED' || c.stage === 'SCREENING')) ||
            (selectedStage === 'on_hold' && (c.stage === 'ON_HOLD' || c.stage === 'HOLD'));

      const matchesCandidateType =
        candidateTypeFilter === 'all'
          ? true
          : c.candidateType?.toLowerCase() === candidateTypeFilter.toLowerCase();

      return matchesSearch && matchesStage && matchesCandidateType;
    });
  }, [allCandidates, searchQuery, selectedStage, candidateTypeFilter]);

  // Candidate Table Pagination Calculations
  const totalCandidateCount = filteredCandidates.length;
  const totalCandidatePages = Math.max(1, Math.ceil(totalCandidateCount / pageSize));
  const clampedCandidatePage = Math.min(Math.max(1, currentPage), totalCandidatePages);
  const candidateStartIndex = (clampedCandidatePage - 1) * pageSize;
  const paginatedCandidates = filteredCandidates.slice(candidateStartIndex, candidateStartIndex + pageSize);
  const candidateRangeStart = totalCandidateCount === 0 ? 0 : candidateStartIndex + 1;
  const candidateRangeEnd = Math.min(clampedCandidatePage * pageSize, totalCandidateCount);

  // Stage Badge Render Helper
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'APPLIED':
        return <Badge className="bg-slate-500/10 text-slate-700 border-slate-300 text-[10px]">APPLIED</Badge>;
      case 'SCREENING':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-300 text-[10px]">SCREENING</Badge>;
      case 'SHORTLISTED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> SHORTLISTED
          </Badge>
        );
      case 'ASSESSMENT_ASSIGNED':
        return (
          <Badge className="bg-purple-500/15 text-purple-700 border-purple-300 text-[10px] gap-1">
            <Brain className="h-3 w-3 text-purple-600 animate-pulse" /> ASSESSMENT ASSIGNED
          </Badge>
        );
      case 'ASSESSMENT_COMPLETED':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 text-[10px] gap-1">
            <Clock className="h-3 w-3 text-amber-600" /> PENDING EVALUATION
          </Badge>
        );
      case 'ASSESSMENT_PASSED':
        return (
          <Badge className="bg-emerald-600 text-white text-[10px] gap-1 shadow-2xs">
            <CheckCircle2 className="h-3 w-3" /> ASSESSMENT PASSED
          </Badge>
        );
      case 'ASSESSMENT_FAILED':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 border-rose-300 text-[10px] gap-1">
            <AlertCircle className="h-3 w-3 text-rose-600" /> ASSESSMENT FAILED
          </Badge>
        );
      case 'ON_HOLD':
      case 'HOLD':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 text-[10px] gap-1">
            <Award className="h-3 w-3 text-amber-600" /> ON HOLD
          </Badge>
        );
      case 'INTERVIEW':
        return <Badge className="bg-indigo-500/10 text-indigo-700 border-indigo-300 text-[10px]">INTERVIEW</Badge>;
      case 'OFFERED':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-300 text-[10px]">OFFERED</Badge>;
      case 'HIRED':
        return <Badge className="bg-emerald-600 text-white text-[10px]">HIRED</Badge>;
      case 'ONBOARDED':
        return <Badge className="bg-emerald-700 text-white text-[10px]">ONBOARDED</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/10 text-rose-700 border-rose-300 text-[10px]">REJECTED</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{stage}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Candidate Application Pipeline Stage Metrics ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Candidate Pool</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{allCandidates.length || 44} Profiles</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Careers & Portal Sync</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Screened & Eligible</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allCandidates.filter((c) => c.stage === 'SHORTLISTED' || c.stage === 'SCREENING').length || 7} Eligible
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Fulfill Criteria Pool</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Screening Pass Rate</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">88.5%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">AI Test Benchmark Score</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Star className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Offers Released</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allCandidates.filter((c) => c.stage === 'OFFERED' || c.stage === 'HIRED').length || 5} Released
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Joining Pending</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Candidate Directory & Application Pipeline Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3.5 border-b border-border/60 space-y-3">
          {/* Row 1: Header Title & Main Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" /> Candidate Directory & Application Pipeline
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-semibold">
                  {filteredCandidates.length} Candidates
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real candidate applications linked to published Job Requisitions (e.g., JR-2026-001)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                onClick={handleOpenAdd}
              >
                <Plus className="h-3.5 w-3.5" /> Add Candidate
              </Button>
            </div>
          </div>

          {/* Row 2: Filter Tabs, Candidate Type & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
            {/* Category Filter Pills */}
            <div className="flex items-center overflow-x-auto bg-muted/40 p-1 rounded-xl border border-border/70 scrollbar-none max-w-full">
              {[
                { id: 'all', label: 'All' },
                { id: 'applied', label: 'Applied' },
                { id: 'screening', label: 'Screening' },
                { id: 'shortlisted', label: 'Shortlisted' },
                { id: 'assessment_assigned', label: 'Assessment Assigned' },
                { id: 'assessment_passed', label: 'Assessment Passed' },
                { id: 'interview', label: 'Interview' },
                { id: 'offered', label: 'Offered' },
                { id: 'rejected', label: 'Rejected' },
              ].map((stg) => (
                <button
                  key={stg.id}
                  onClick={() => {
                    setSelectedStage(stg.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    selectedStage === stg.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {stg.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              {/* Candidate Type Filter */}
              <Select
                value={candidateTypeFilter}
                onValueChange={(val) => {
                  setCandidateTypeFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-36 bg-background">
                  <SelectValue placeholder="Candidate Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Types</SelectItem>
                  <SelectItem value="fresher" className="text-xs">Freshers Only</SelectItem>
                  <SelectItem value="experienced" className="text-xs">Experienced Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Bar */}
              <div className="relative w-44 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search candidate or JR code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Candidate ID</TableHead>
                <TableHead className="text-xs">Full Name & Email</TableHead>
                <TableHead className="text-xs">Applied Position</TableHead>
                <TableHead className="text-xs">Job Requisition</TableHead>
                <TableHead className="text-xs">Sourcing Channel</TableHead>
                <TableHead className="text-xs">Current Stage</TableHead>
                <TableHead className="text-xs">AI Match Score</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                    No candidates found for the selected stage filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCandidates.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {c.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 font-semibold ${
                            c.candidateType === 'FRESHER'
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                          }`}
                        >
                          {c.candidateType === 'FRESHER' ? 'Fresher' : 'Experienced'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{c.email}</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {c.role}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-primary">{c.reqCode}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{c.source}</TableCell>
                    <TableCell className="text-xs font-mono text-[11px] font-semibold uppercase">
                      {getStageBadge(c.stage)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600 font-mono">{c.score}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                          onClick={() => handleOpenViewDetails(c)}
                          title="View Candidate Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Candidate Profile"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                          onClick={() => handleOpenDelete(c)}
                          title="Delete Candidate Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10.5px] px-2 text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                          onClick={() => openScreeningModal(c)}
                        >
                          <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                          {c.stage === 'APPLIED'
                            ? 'Start Screening'
                            : c.stage === 'SHORTLISTED'
                            ? 'Edit Screening'
                            : c.stage === 'ON_HOLD'
                            ? 'Review Screening'
                            : c.stage === 'REJECTED'
                            ? 'View Screening'
                            : 'Screening Evaluation'}
                        </Button>

                        {/* STAGE-SPECIFIC ASSESSMENT & INTERVIEW ACTIONS */}
                        {(c.stage === 'SHORTLISTED' || c.stage === 'SCREENING' || c.stage === 'APPLIED') && (
                          <Button
                            size="sm"
                            className="h-7 text-[10.5px] px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1 shadow-2xs"
                            onClick={() => {
                              setSendAssessmentCandidate(c);
                              setIsSendAssessmentModalOpen(true);
                            }}
                          >
                            <Brain className="h-3.5 w-3.5" /> Send Assessment
                          </Button>
                        )}

                        {c.stage === 'ASSESSMENT_ASSIGNED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 text-purple-700 border-purple-300 hover:bg-purple-50 font-semibold gap-1 shadow-2xs"
                            onClick={() => {
                              const activeAssign = assessmentAssignments[c.id] || {
                                id: `ATT-${c.id.substring(0, 4)}`,
                                candidateId: c.id,
                                candidateName: c.name,
                                candidateEmail: c.email,
                                jobTitle: c.role,
                                templateId: 'TST-201',
                                templateName: 'React Architecture & State Challenge',
                                assignedDate: '20 Aug 2026',
                                dueDate: '25 Aug 2026',
                                instructions: 'Please complete all coding challenges and submit the code within the allocated duration. Maintain clean modular architecture.',
                                status: 'ASSIGNED',
                                score: 'Awaiting Candidate Submission',
                                passingScorePercent: 70,
                              };
                              setViewAssessmentCandidate(c);
                              setViewAssessmentAssignment(activeAssign);
                              setIsViewAssessmentOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 text-purple-600" /> View Assessment
                          </Button>
                        )}

                        {c.stage === 'ASSESSMENT_COMPLETED' && (
                          <Button
                            size="sm"
                            className="h-7 text-[10.5px] px-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1"
                            onClick={() => {
                              navigate('/recruitment/assessments');
                              toast.info(`Redirecting to Recruitment -> Assessments to grade evaluation for ${c.name}`);
                            }}
                          >
                            <Clock className="h-3.5 w-3.5" /> Grade Assessment
                          </Button>
                        )}

                        {c.stage === 'ASSESSMENT_PASSED' && (
                          <Button
                            size="sm"
                            className="h-7 text-[10.5px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 shadow-2xs"
                            onClick={() => {
                              setScheduleModalCandidateId(c.id);
                              setIsScheduleModalOpen(true);
                            }}
                          >
                            <Calendar className="h-3.5 w-3.5" /> Schedule Interview
                          </Button>
                        )}

                        {c.stage === 'ASSESSMENT_FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold gap-1"
                            onClick={() => {
                              if (confirm(`Assessment was not passed for ${c.name}. Do you want to manually override and continue to interview this candidate?`)) {
                                updateStageMutation.mutate({ id: c.id, stage: 'ASSESSMENT_PASSED' });
                                setScheduleModalCandidateId(c.id);
                                setIsScheduleModalOpen(true);
                              }
                            }}
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Override & Schedule Interview
                          </Button>
                        )}

                        {(c.stage === 'APPLIED' || c.stage === 'INTERVIEW') && (
                          <Button
                            size="sm"
                            className="h-7 text-[10.5px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                            onClick={() => {
                              setScheduleModalCandidateId(c.id);
                              setIsScheduleModalOpen(true);
                            }}
                          >
                            <Calendar className="h-3 w-3" /> Schedule Interview
                          </Button>
                        )}

                        {c.stage !== 'REJECTED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(c)}
                            title="Decline Candidate"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Global Reusable EHCM ERP Pagination Component */}
          <Pagination
            totalRecords={totalCandidateCount}
            currentPage={clampedCandidatePage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="candidates"
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* ── 3. Enhanced Candidate Screening Evaluation Dialog Modal ── */}
      <Dialog open={isScreeningOpen} onOpenChange={setIsScreeningOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <ClipboardCheck className="h-5 w-5 text-primary" /> Candidate Screening Evaluation
            </DialogTitle>
          </DialogHeader>

          {isFetchingScreening ? (
            <div className="py-12 text-center space-y-2 text-muted-foreground text-xs">
              <Clock className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Loading candidate screening details & application profile...</p>
            </div>
          ) : screeningCandidate ? (
            <form onSubmit={handleSaveScreening} className="space-y-5 pt-1">
              {/* Validation Errors Header Banner */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl space-y-1 text-xs text-destructive">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Please fix the following validation errors:</span>
                  </div>
                  <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                    {Object.values(validationErrors).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 1. CANDIDATE INFORMATION – READ ONLY */}
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" /> 1. Candidate Application Details (Read-Only)
                  </span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    System Record
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Candidate Name</span>
                    <strong className="text-foreground font-semibold text-xs">{screeningCandidate.name}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Candidate ID</span>
                    <strong className="text-primary font-mono text-xs font-semibold">{screeningCandidate.id}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Applied Position</span>
                    <strong className="text-foreground font-semibold text-xs flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      {screeningCandidate.role}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Job Requisition Code</span>
                    <strong className="text-primary font-mono font-bold text-xs">{screeningCandidate.reqCode}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">AI Match Score</span>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[11px] font-mono font-bold">
                      <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                      {screeningCandidate.score && screeningCandidate.score !== '88%' ? screeningCandidate.score : 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Resume / Document</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] text-primary border-primary/30 hover:bg-primary/10 px-2 mt-0.5 gap-1"
                      onClick={() => {
                        setResumeViewerCandidate(screeningCandidate);
                      }}
                    >
                      <Eye className="h-3 w-3" /> View Resume
                    </Button>
                  </div>
                </div>
              </div>

              {/* REAL ATS RESUME ANALYSIS & JOB MATCHING BREAKDOWN CARD */}
              <AtsAnalysisCard
                candidateId={screeningCandidate.id}
                candidateName={screeningCandidate.name}
                jobTitle={screeningCandidate.role}
                resumePath={screeningCandidate.resumePath}
                onAnalysisLoaded={(atsData) => {
                  if (atsData && atsData.matchScore !== undefined) {
                    setScreeningCandidate((prev: any) => prev ? { ...prev, score: `${atsData.matchScore}%` } : null);
                  }
                }}
              />

              {/* CANDIDATE INTERVIEW HISTORY */}
              <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-primary/20 pb-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> Candidate Interview Panel History
                  </span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    {candidateInterviews.length} Round(s) Conducted
                  </Badge>
                </div>

                {candidateInterviews.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {candidateInterviews.map((inv) => {
                      const evalCount = inv.evaluations?.length || 0;
                      const avgScore =
                        evalCount > 0
                          ? Math.round(
                              (inv.evaluations.reduce((a, b) => a + b.overallRating, 0) / evalCount) * 10,
                            ) / 10
                          : 0;

                      return (
                        <div
                          key={inv.id}
                          className="p-3 bg-background rounded-lg border border-border/60 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary text-xs">{inv.interviewCode}</span>
                              <Badge variant="outline" className="text-[10px]">{inv.interviewFormat}</Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              {avgScore > 0 && (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 font-bold text-[10px] flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {avgScore} / 5.0
                                </Badge>
                              )}
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-foreground text-[10px]">
                                {inv.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                            <span>
                              Date: <strong>{new Date(inv.interviewDate).toLocaleDateString('en-GB')}, {inv.startTime}</strong>
                            </span>
                            <span>
                              Panel: <strong>{inv.panelMembers.map((p) => `${p.interviewerName} (${p.panelRole})`).join(', ')}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic text-center py-2">
                    No interview rounds scheduled yet for this candidate. Click "Schedule Interview" from the roster.
                  </p>
                )}
              </div>

              {/* 2. BASIC SCREENING INFORMATION */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 border-b pb-1">
                  <FileText className="h-4 w-4 text-primary" /> 2. Basic Screening Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Relevant Experience (Years) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={relExpYears}
                      onChange={(e) => setRelExpYears(e.target.value)}
                      placeholder="e.g. 6"
                      className={`h-8 text-xs ${validationErrors.relExpYears ? 'border-destructive' : ''}`}
                    />
                    {validationErrors.relExpYears && (
                      <p className="text-[10px] text-destructive">{validationErrors.relExpYears}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Current Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        placeholder="e.g. Pune, MH"
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Notice Period</Label>
                    <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Notice Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate" className="text-xs">Immediate / Serving Notice</SelectItem>
                        <SelectItem value="15 Days" className="text-xs">15 Days</SelectItem>
                        <SelectItem value="30 Days" className="text-xs">30 Days</SelectItem>
                        <SelectItem value="60 Days" className="text-xs">60 Days</SelectItem>
                        <SelectItem value="90 Days" className="text-xs">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Current CTC (₹ / LPA) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={currentCtc}
                        onChange={(e) => setCurrentCtc(e.target.value)}
                        placeholder="e.g. 18.0"
                        className={`h-8 pl-8 text-xs ${validationErrors.currentCtc ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {validationErrors.currentCtc && (
                      <p className="text-[10px] text-destructive">{validationErrors.currentCtc}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Expected CTC (₹ / LPA) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={expectedCtc}
                        onChange={(e) => setExpectedCtc(e.target.value)}
                        placeholder="e.g. 24.0"
                        className={`h-8 pl-8 text-xs ${validationErrors.expectedCtc ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {validationErrors.expectedCtc && (
                      <p className="text-[10px] text-destructive">{validationErrors.expectedCtc}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs font-semibold">Highest Qualification</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={highestQualification}
                        onChange={(e) => setHighestQualification(e.target.value)}
                        placeholder="e.g. B.E. Computer Science"
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Qualification Match</Label>
                    <div className="flex items-center gap-1 pt-0.5">
                      {(['YES', 'PARTIAL', 'NO'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setQualificationMatch(opt)}
                          className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-md border transition-all ${
                            qualificationMatch === opt
                              ? opt === 'YES'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : opt === 'PARTIAL'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-background hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Required Skills Match</Label>
                    <div className="flex items-center gap-1 pt-0.5">
                      {(['YES', 'PARTIAL', 'NO'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSkillsMatch(opt)}
                          className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-md border transition-all ${
                            skillsMatch === opt
                              ? opt === 'YES'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : opt === 'PARTIAL'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-background hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Relevant Experience Summary</Label>
                  <Textarea
                    value={relExpSummary}
                    onChange={(e) => setRelExpSummary(e.target.value)}
                    placeholder="Provide a concise summary of candidate's relevant domain projects and work experience..."
                    className="text-xs min-h-[50px]"
                    rows={2}
                  />
                </div>
              </div>

              {/* 3. RECRUITER EVALUATION */}
              <div className="space-y-3 pt-1 border-t">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 border-b pb-1">
                  <Star className="h-4 w-4 text-amber-500" /> 3. Recruiter Evaluation (1–5 Rating Scale)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Technical Rating</Label>
                      <span className="text-[11px] font-bold text-primary">{techRating} / 5</span>
                    </div>
                    <Select value={String(techRating)} onValueChange={(v) => setTechRating(parseInt(v))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5" className="text-xs">5 ★★★★★ (Exceptional)</SelectItem>
                        <SelectItem value="4" className="text-xs">4 ★★★★☆ (Good / Strong)</SelectItem>
                        <SelectItem value="3" className="text-xs">3 ★★★☆☆ (Average)</SelectItem>
                        <SelectItem value="2" className="text-xs">2 ★★☆☆☆ (Below Average)</SelectItem>
                        <SelectItem value="1" className="text-xs">1 ★☆☆☆☆ (Poor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Communication Rating</Label>
                      <span className="text-[11px] font-bold text-primary">{commRating} / 5</span>
                    </div>
                    <Select value={String(commRating)} onValueChange={(v) => setCommRating(parseInt(v))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5" className="text-xs">5 ★★★★★ (Exceptional)</SelectItem>
                        <SelectItem value="4" className="text-xs">4 ★★★★☆ (Good / Fluent)</SelectItem>
                        <SelectItem value="3" className="text-xs">3 ★★★☆☆ (Average)</SelectItem>
                        <SelectItem value="2" className="text-xs">2 ★★☆☆☆ (Below Average)</SelectItem>
                        <SelectItem value="1" className="text-xs">1 ★☆☆☆☆ (Poor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Profile Match</Label>
                      <span className="text-[11px] font-bold text-primary">{profileMatchRating} / 5</span>
                    </div>
                    <Select value={String(profileMatchRating)} onValueChange={(v) => setProfileMatchRating(parseInt(v))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5" className="text-xs">5 ★★★★★ (Exceptional Fit)</SelectItem>
                        <SelectItem value="4" className="text-xs">4 ★★★★☆ (Good Fit)</SelectItem>
                        <SelectItem value="3" className="text-xs">3 ★★★☆☆ (Moderate Fit)</SelectItem>
                        <SelectItem value="2" className="text-xs">2 ★★☆☆☆ (Below Average)</SelectItem>
                        <SelectItem value="1" className="text-xs">1 ★☆☆☆☆ (Poor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Overall Score Highlight Banner */}
                <div className="p-3 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-base shadow-xs">
                      {overallScore}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Overall Screening Score</p>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1">
                        {parseFloat(overallScore) >= 4.0 ? (
                          <span className="text-emerald-600">★★★★☆ (Strong Candidate Fit)</span>
                        ) : parseFloat(overallScore) >= 3.0 ? (
                          <span className="text-amber-600">★★★☆☆ (Average Candidate Fit)</span>
                        ) : (
                          <span className="text-rose-600">★★☆☆☆ (Low Candidate Fit)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs font-mono font-bold">
                    Auto-Calculated
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Screening Remarks & Observations {screeningDecision === 'REJECT' && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    value={screeningRemarks}
                    onChange={(e) => setScreeningRemarks(e.target.value)}
                    placeholder={
                      screeningDecision === 'REJECT'
                        ? 'Mandatory rejection reason/remarks detailing candidate mismatch...'
                        : 'Detail technical strengths, leadership traits, notice period flexibility, and observations for interview panel...'
                    }
                    className={`text-xs min-h-[65px] ${validationErrors.screeningRemarks ? 'border-destructive' : ''}`}
                    rows={3}
                  />
                  {validationErrors.screeningRemarks && (
                    <p className="text-[10px] text-destructive">{validationErrors.screeningRemarks}</p>
                  )}
                </div>
              </div>

              {/* 4. SCREENING DECISION */}
              <div className="space-y-2 pt-1 border-t">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-primary" /> 4. Screening Decision <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setScreeningDecision('SHORTLIST')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      screeningDecision === 'SHORTLIST'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/30'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                    <span>Shortlist</span>
                    <span className="text-[9.5px] opacity-80 font-normal">Eligible for Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScreeningDecision('HOLD')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      screeningDecision === 'HOLD'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/30'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <Award className="h-4 w-4 text-amber-100" />
                    <span>Hold</span>
                    <span className="text-[9.5px] opacity-80 font-normal">Review Later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScreeningDecision('REJECT')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      screeningDecision === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-600/30'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <UserX className="h-4 w-4 text-rose-100" />
                    <span>Reject</span>
                    <span className="text-[9.5px] opacity-80 font-normal">Requires Remarks</span>
                  </button>
                </div>
              </div>

              {/* 5. AUDIT INFORMATION */}
              <div className="space-y-2 pt-1 border-t">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 border-b pb-1">
                  <Clock className="h-4 w-4 text-primary" /> 5. Audit Information (Manually Assignable)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/60 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Screened By (Employee Master)</Label>
                    <Select value={screenedBy} onValueChange={setScreenedBy}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Recruiter from Employee Master" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {employeeOptions.map((emp) => (
                          <SelectItem key={emp.id} value={emp.name} className="text-xs">
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Screening Date</Label>
                    <Input
                      value={screeningDate}
                      onChange={(e) => setScreeningDate(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="e.g. 18 Aug 2026, 02:30 PM"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Last Updated By (Employee Master)</Label>
                    <Select value={lastUpdatedBy} onValueChange={setLastUpdatedBy}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Evaluator from Employee Master" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {employeeOptions.map((emp) => (
                          <SelectItem key={emp.id} value={emp.name} className="text-xs">
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Last Updated Date</Label>
                    <Input
                      value={lastUpdatedDate}
                      onChange={(e) => setLastUpdatedDate(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="e.g. 18 Aug 2026, 02:30 PM"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsScreeningOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-xs"
                  disabled={saveScreeningMutation.isPending}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {saveScreeningMutation.isPending ? 'Saving Evaluation...' : 'Save Screening'}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* SCHEDULE INTERVIEW MODAL */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        initialCandidateId={scheduleModalCandidateId}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleModalCandidateId('');
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['job-openings'] });
          queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
          queryClient.invalidateQueries({ queryKey: ['interviews-summary'] });
        }}
      />

      {/* ASSIGN ASSESSMENT MODAL */}
      {assignAssessmentCandidate && (
        <AssignAssessmentModal
          isOpen={isAssignAssessmentOpen}
          candidate={assignAssessmentCandidate}
          onClose={() => {
            setIsAssignAssessmentOpen(false);
            setAssignAssessmentCandidate(null);
          }}
          onAssignSuccess={(assignment) => {
            setAssessmentAssignments((prev) => ({
              ...prev,
              [assignment.candidateId]: assignment,
            }));
            updateStageMutation.mutate({ id: assignment.candidateId, stage: 'ASSESSMENT_ASSIGNED' });
          }}
        />
      )}

      {/* VIEW ASSESSMENT OVERVIEW MODAL */}
      <ViewAssessmentModal
        isOpen={isViewAssessmentOpen}
        assignment={viewAssessmentAssignment}
        candidateName={viewAssessmentCandidate?.name}
        candidateEmail={viewAssessmentCandidate?.email}
        jobTitle={viewAssessmentCandidate?.role}
        onClose={() => {
          setIsViewAssessmentOpen(false);
          setViewAssessmentCandidate(null);
          setViewAssessmentAssignment(null);
        }}
        onSimulateSubmission={() => {
          if (!viewAssessmentCandidate) return;
          updateStageMutation.mutate({ id: viewAssessmentCandidate.id, stage: 'ASSESSMENT_PASSED' });
          toast.success(`Simulated test submission for ${viewAssessmentCandidate.name}! Score: 92% (Pass). Stage updated to ASSESSMENT_PASSED.`);
          setIsViewAssessmentOpen(false);
        }}
        onGradeAssessment={() => {
          setIsViewAssessmentOpen(false);
          navigate('/recruitment/assessments');
          toast.info(`Navigating to Recruitment -> Assessments tab to grade candidate attempt.`);
        }}
      />

      {/* FULL-PAGE COMPLETE ADD / EDIT CANDIDATE FORM MODAL */}
      <CandidateFullFormModal
        isOpen={isFullFormOpen}
        onClose={() => {
          setIsFullFormOpen(false);
          setEditingCandidate(null);
        }}
        onSubmit={handleFormSubmit}
        jobOpenings={openings}
        employeesList={employeeOptions}
        initialData={editingCandidate}
        isSubmitting={createCandidateMutation.isPending || updateCandidateMutation.isPending}
      />

      {/* VIEW CANDIDATE DETAILS MODAL */}
      <CandidateDetailsModal
        isOpen={isViewDetailsOpen}
        onClose={() => {
          setIsViewDetailsOpen(false);
          setViewingCandidate(null);
        }}
        candidate={viewingCandidate}
        onEdit={handleOpenEdit}
        onStartScreening={openScreeningModal}
        onDelete={handleOpenDelete}
      />

      {/* DELETE CANDIDATE CONFIRMATION MODAL */}
      <CandidateDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingCandidate(null);
        }}
        onConfirm={handleConfirmDelete}
        candidate={deletingCandidate}
        isDeleting={deleteCandidateMutation.isPending}
      />

      {/* INTERACTIVE PDF & RESUME DOCUMENT VIEWER MODAL */}
      {resumeViewerCandidate && (
        <ResumeViewerModal
          isOpen={Boolean(resumeViewerCandidate)}
          onClose={() => setResumeViewerCandidate(null)}
          candidateName={resumeViewerCandidate.name}
          candidateEmail={resumeViewerCandidate.email}
          candidatePhone={resumeViewerCandidate.phone}
          candidateLocation={resumeViewerCandidate.currentLocation}
          jobTitle={resumeViewerCandidate.role || resumeViewerCandidate.jobOpening?.title}
          resumeUrl={resumeViewerCandidate.resumePath}
          experienceYears={resumeViewerCandidate.experience}
          qualification={resumeViewerCandidate.qualification}
          skills={resumeViewerCandidate.skills}
          notes={resumeViewerCandidate.notes || resumeViewerCandidate.coverLetter}
          score={resumeViewerCandidate.score}
        />
      )}

      {/* SEND ASSESSMENT INVITATION MODAL */}
      <SendAssessmentModal
        isOpen={isSendAssessmentModalOpen}
        onClose={() => {
          setIsSendAssessmentModalOpen(false);
          setSendAssessmentCandidate(null);
        }}
        candidate={sendAssessmentCandidate}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['job-openings'] });
        }}
      />
    </div>
  );
}
