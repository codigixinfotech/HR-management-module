import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Eye,
} from 'lucide-react';
import { formatSalaryInLakhs, formatSalaryRangeInLakhs } from '@/lib/utils';
import { jobOpeningsApi, manpowerRequisitionsApi } from '@/api/recruitment';
import { companiesApi, branchesApi, departmentsApi, designationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ManpowerRequisition, JobOpening, Branch } from '@/api/types';

interface RequisitionsTabProps {
  isStandaloneOpen?: boolean;
  onStandaloneClose?: () => void;
}

export function RequisitionsTab({ isStandaloneOpen, onStandaloneClose }: RequisitionsTabProps = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Create Job Requisition Dialog State
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [selectedMr, setSelectedMr] = useState<ManpowerRequisition | null>(null);

  // View MR Details Dialog State
  const [isViewMrOpen, setIsViewMrOpen] = useState(false);
  const [viewingMr, setViewingMr] = useState<ManpowerRequisition | null>(null);

  const openViewMrModal = (mr: ManpowerRequisition) => {
    setViewingMr(mr);
    setIsViewMrOpen(true);
  };

  // Enterprise Form fields for Create Job Requisition
  const [reqMode, setReqMode] = useState<'FROM_MR' | 'STANDALONE'>('FROM_MR');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Standalone Organization Selection Fields
  const [standaloneCompanyId, setStandaloneCompanyId] = useState('');
  const [standaloneBranchId, setStandaloneBranchId] = useState('');
  const [standaloneDepartmentId, setStandaloneDepartmentId] = useState('');
  const [standaloneCostCenter, setStandaloneCostCenter] = useState('');
  const [standaloneDesignationId, setStandaloneDesignationId] = useState('');
  const [standaloneNumPositions, setStandaloneNumPositions] = useState<number>(1);

  const [createReqTab, setCreateReqTab] = useState<'mr_ref' | 'posting' | 'requirements' | 'compensation' | 'interview'>('mr_ref');
  const [jobTitle, setJobTitle] = useState('');
  const [jobSummary, setJobSummary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [jobQualification, setJobQualification] = useState('');
  const [preferredQualification, setPreferredQualification] = useState('');
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('');
  const [benefits, setBenefits] = useState('');

  const [candidateType, setCandidateType] = useState<'FRESHER' | 'EXPERIENCED' | 'BOTH'>('BOTH');
  const [minExp, setMinExp] = useState<number>(1);
  const [maxExp, setMaxExp] = useState<number>(5);
  const [graduationYear, setGraduationYear] = useState('');
  const [jobExperience, setJobExperience] = useState('');
  const [workMode, setWorkMode] = useState('On-site');
  const [jobLocation, setJobLocation] = useState('');
  const [jobEmploymentType, setJobEmploymentType] = useState('FULL_TIME');

  const [hiringManagerId, setHiringManagerId] = useState('');
  const [recruiterId, setRecruiterId] = useState('');
  const [hrbpId, setHrbpId] = useState('');

  const [jobMinSalaryLakh, setJobMinSalaryLakh] = useState<number>(6);
  const [jobMaxSalaryLakh, setJobMaxSalaryLakh] = useState<number>(12);

  const [applicationStartDate, setApplicationStartDate] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [jobVisibility, setJobVisibility] = useState('Public');

  const [interviewProcess, setInterviewProcess] = useState('Application Screening → HR Screening → Technical Assessment → Technical Interview → Managerial Round → HR Offer');
  const [numInterviewRounds, setNumInterviewRounds] = useState(3);
  const [hasAssessment, setHasAssessment] = useState(false);

  const [internalNotes, setInternalNotes] = useState('');
  const [internalJustification, setInternalJustification] = useState('');

  // Queries
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.list() });
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsApi.list() });
  const { data: designations = [] } = useQuery({ queryKey: ['designations'], queryFn: () => designationsApi.list() });
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 'all-active'],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });
  const { data: openings = [], isLoading: isOpeningsLoading } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });
  const { data: requisitions = [], isLoading: isMrsLoading } = useQuery({
    queryKey: ['manpower-requisitions'],
    queryFn: () => manpowerRequisitionsApi.list(),
  });

  // Dependent organization filters
  const filteredBranches = useMemo(() => {
    if (!standaloneCompanyId) return [];
    return branches.filter((b: any) => b.companyId === standaloneCompanyId);
  }, [branches, standaloneCompanyId]);

  const filteredDepartments = useMemo(() => {
    if (!standaloneCompanyId) return [];
    return departments.filter((d: any) => !d.companyId || d.companyId === standaloneCompanyId);
  }, [departments, standaloneCompanyId]);

  const filteredDesignations = useMemo(() => {
    if (!standaloneDepartmentId) return [];
    return designations.filter((des: any) => !des.departmentId || des.departmentId === standaloneDepartmentId);
  }, [designations, standaloneDepartmentId]);

  const activeEmployees = useMemo(() => {
    if (!employeesData?.items) return [];
    return employeesData.items;
  }, [employeesData]);

  const filteredTeamEmployees = useMemo(() => {
    if (!activeEmployees.length) return [];
    if (reqMode === 'STANDALONE' && standaloneCompanyId) {
      const filtered = activeEmployees.filter((emp: any) => !emp.companyId || emp.companyId === standaloneCompanyId);
      return filtered.length ? filtered : activeEmployees;
    }
    return activeEmployees;
  }, [activeEmployees, reqMode, standaloneCompanyId]);

  // Duplicate active requisition check
  const duplicateActiveReq = useMemo(() => {
    if (reqMode !== 'STANDALONE' || !standaloneCompanyId || !standaloneDepartmentId || !standaloneDesignationId) {
      return null;
    }
    return openings.find(
      (o: any) =>
        o.companyId === standaloneCompanyId &&
        o.departmentId === standaloneDepartmentId &&
        o.designationId === standaloneDesignationId &&
        o.status !== 'CLOSED' &&
        o.status !== 'CANCELLED'
    );
  }, [openings, reqMode, standaloneCompanyId, standaloneDepartmentId, standaloneDesignationId]);

  // Cascading organization selection handlers
  const handleCompanyChange = (v: string) => {
    setStandaloneCompanyId(v);
    setStandaloneBranchId('');
    setStandaloneDepartmentId('');
    setStandaloneCostCenter('');
    setStandaloneDesignationId('');
    setFieldErrors((prev) => ({
      ...prev,
      standaloneCompanyId: '',
      standaloneBranchId: '',
      standaloneDepartmentId: '',
      standaloneCostCenter: '',
      standaloneDesignationId: '',
    }));
  };

  const handleBranchChange = (v: string) => {
    setStandaloneBranchId(v);
    setStandaloneDepartmentId('');
    setStandaloneCostCenter('');
    setStandaloneDesignationId('');
    setFieldErrors((prev) => ({
      ...prev,
      standaloneBranchId: '',
      standaloneDepartmentId: '',
      standaloneCostCenter: '',
      standaloneDesignationId: '',
    }));
  };

  const handleDepartmentChange = (v: string) => {
    setStandaloneDepartmentId(v);
    setStandaloneDesignationId('');
    const dept = departments.find((d: any) => d.id === v);
    const autoCc = dept?.code ? `CCP-${dept.code} - ${dept.name}` : `CCP-${dept?.name || 'GEN'}`;
    setStandaloneCostCenter(autoCc);
    setFieldErrors((prev) => ({
      ...prev,
      standaloneDepartmentId: '',
      standaloneCostCenter: '',
      standaloneDesignationId: '',
    }));
  };

  // Step Validation Functions
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (reqMode === 'STANDALONE') {
      if (!standaloneCompanyId) errors.standaloneCompanyId = 'Company Entity is required.';
      if (!standaloneBranchId) errors.standaloneBranchId = 'Please select a Branch Location.';
      if (!standaloneDepartmentId) errors.standaloneDepartmentId = 'Please select a Department.';
      if (!standaloneCostCenter || !standaloneCostCenter.trim()) errors.standaloneCostCenter = 'Cost Center is required.';
      if (!standaloneDesignationId) errors.standaloneDesignationId = 'Please select a Designation / Job Role.';
      if (!standaloneNumPositions || standaloneNumPositions < 1) errors.standaloneNumPositions = 'Number of openings must be at least 1.';
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!jobTitle.trim() || jobTitle.trim().length < 3 || jobTitle.trim().length > 150) {
      errors.jobTitle = 'Job Posting Title must be between 3 and 150 characters.';
    }
    if (!jobSummary.trim() || jobSummary.trim().length < 20 || jobSummary.trim().length > 500) {
      errors.jobSummary = 'Job Summary must be between 20 and 500 characters.';
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      errors.jobDescription = 'Detailed Job Description must be at least 50 characters.';
    }
    if (!jobResponsibilities.trim() || jobResponsibilities.trim().length < 20) {
      errors.jobResponsibilities = 'Key Responsibilities & Duties must be at least 20 characters.';
    }
    const finalQual = reqMode === 'FROM_MR' ? (selectedMr?.qualification || jobQualification) : jobQualification;
    if (!finalQual || !finalQual.trim()) {
      errors.jobQualification = 'Required Qualification is required.';
    }
    const finalSkills = reqMode === 'FROM_MR' ? (selectedMr?.requiredSkills || jobSkills) : jobSkills;
    if (!finalSkills || !finalSkills.trim()) {
      errors.jobSkills = 'Required Skills are required.';
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (candidateType === 'EXPERIENCED' || candidateType === 'BOTH') {
      if (minExp < 0) errors.minExp = 'Minimum experience cannot be negative.';
      if (maxExp < 0) errors.maxExp = 'Maximum experience cannot be negative.';
      if (minExp > maxExp) errors.minExp = 'Minimum experience cannot be greater than Maximum experience.';
    }
    if (!hiringManagerId) errors.hiringManagerId = 'Please select a Hiring Manager.';
    if (!recruiterId) errors.recruiterId = 'Please select an assigned Recruiter.';
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    if (!jobEmploymentType) errors.jobEmploymentType = 'Employment Type is required.';
    if (!workMode) errors.workMode = 'Work Mode is required.';
    const finalLocation = reqMode === 'FROM_MR' ? selectedMr?.workLocation : jobLocation;
    if (!finalLocation || !finalLocation.trim()) errors.jobLocation = 'Work Location is required.';

    if (reqMode === 'STANDALONE') {
      if (!jobMinSalaryLakh || jobMinSalaryLakh <= 0) errors.jobMinSalaryLakh = 'Minimum CTC must be greater than 0.';
      if (!jobMaxSalaryLakh || jobMaxSalaryLakh <= 0) errors.jobMaxSalaryLakh = 'Maximum CTC must be greater than 0.';
      if (jobMinSalaryLakh > jobMaxSalaryLakh) errors.jobMinSalaryLakh = 'Minimum CTC cannot be greater than Maximum CTC.';
    }

    if (applicationStartDate && jobDeadline) {
      if (new Date(jobDeadline) < new Date(applicationStartDate)) {
        errors.jobDeadline = 'Application Deadline cannot be earlier than Application Start Date.';
      }
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep5 = () => {
    const errors: Record<string, string> = {};
    const text = internalJustification.trim().toLowerCase();
    if (!text || text.length < 15 || text === 'ok' || text === 'test' || text === 'abc' || text === 'testing') {
      errors.internalJustification = 'Please enter a valid, meaningful hiring justification (at least 15 characters).';
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Step Advancement Guard
  const handleNextStep = (nextTab: 'mr_ref' | 'posting' | 'requirements' | 'compensation' | 'interview') => {
    if (createReqTab === 'mr_ref' && !validateStep1()) {
      toast.error('Please complete all required fields in Step 1 (Organization Setup) before continuing.');
      return;
    }
    if (createReqTab === 'posting' && !validateStep2()) {
      toast.error('Please complete all required fields in Step 2 (Job Details) before continuing.');
      return;
    }
    if (createReqTab === 'requirements' && !validateStep3()) {
      toast.error('Please complete all required fields in Step 3 (Candidate & Team) before continuing.');
      return;
    }
    if (createReqTab === 'compensation' && !validateStep4()) {
      toast.error('Please complete all required fields in Step 4 (Compensation & Dates) before continuing.');
      return;
    }
    setCreateReqTab(nextTab);
  };

  const planCompany = useMemo(() => {
    if (!selectedMr?.companyId) return null;
    return companies.find((c: any) => c.id === selectedMr.companyId);
  }, [selectedMr, companies]);

  const planBranch = useMemo(() => {
    if (!selectedMr?.branchId) return null;
    return branches.find((b: any) => b.id === selectedMr.branchId);
  }, [selectedMr, branches]);

  const selectedMrManager = useMemo(() => {
    if (!selectedMr?.reportingManagerId || !activeEmployees.length) return null;
    return activeEmployees.find((emp: any) => emp.id === selectedMr.reportingManagerId);
  }, [selectedMr, activeEmployees]);

  const viewingMrCompany = useMemo(() => {
    if (!viewingMr?.companyId) return null;
    return companies.find((c: any) => c.id === viewingMr.companyId);
  }, [viewingMr, companies]);

  const viewingMrBranch = useMemo(() => {
    if (!viewingMr?.branchId) return null;
    return branches.find((b: any) => b.id === viewingMr.branchId);
  }, [viewingMr, branches]);

  const viewingMrManager = useMemo(() => {
    if (!viewingMr?.reportingManagerId || !activeEmployees.length) return null;
    return activeEmployees.find((emp: any) => emp.id === viewingMr.reportingManagerId);
  }, [viewingMr, activeEmployees]);

  // Approve / Reject MR Mutation
  const updateMrStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      manpowerRequisitionsApi.updateStatus(id, status, rejectionReason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manpower-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });

      if (data.status === 'APPROVED') {
        toast.success(`Manpower Requisition ${data.mrNumber} Approved successfully.`);
      } else if (data.status === 'REJECTED') {
        toast.info(`Manpower Requisition ${data.mrNumber} set to REJECTED. Planned hires restored.`);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update MR status'),
  });

  // Create Job Requisition Mutation
  const createJobReqMutation = useMutation({
    mutationFn: (payload: Partial<JobOpening>) => jobOpeningsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success(`Job Requisition ${data.requisitionCode || data.title} created successfully!`);
      setIsReqOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create Job Requisition'),
  });

  // Publish Job Opening Mutation
  const publishOpeningMutation = useMutation({
    mutationFn: (id: string) => jobOpeningsApi.publish(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings-all'] });
      queryClient.invalidateQueries({ queryKey: ['public-job-openings'] });
      toast.success('Job published successfully! It is now live on the Career Portal.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to publish job opening'),
  });

  const handlePublishJobOpening = (opening: any) => {
    publishOpeningMutation.mutate(opening.id);
  };

  // Handle Approve MR with Clean Confirmation Prompt
  const handleApproveMr = (mr: ManpowerRequisition) => {
    const confirmMsg = `Approve Manpower Requisition ${mr.mrNumber} for ${mr.role} (${mr.numOpenings} Openings)?`;
    if (confirm(confirmMsg)) {
      updateMrStatusMutation.mutate({ id: mr.id, status: 'APPROVED' });
    }
  };
  // Handle Reject MR
  const handleRejectMr = (mr: ManpowerRequisition) => {
    const reason = prompt(`Enter rejection reason for MR ${mr.mrNumber}:`, 'Budget constraint / position postponed');
    if (reason !== null) {
      updateMrStatusMutation.mutate({ id: mr.id, status: 'REJECTED', rejectionReason: reason });
    }
  };

  // Open Create Job Requisition Page for Approved MR
  const openCreateJobReqModal = (mr: ManpowerRequisition) => {
    // Check if JR already raised for this approved MR
    const existingJr = openings.find(
      (o) => o.manpowerRequisitionId === mr.id || (o.mrNumber && o.mrNumber === mr.mrNumber)
    );

    if (existingJr) {
      toast.info(`Job Requisition ${existingJr.requisitionCode || 'JR'} has already been created for ${mr.mrNumber}.`);
      return;
    }

    navigate(`/recruitment/requisitions/create-from-mr/${mr.id}`);
  };

  // Open Standalone Job Requisition Page (Direct Post Job Opening)
  const openStandaloneJobReqModal = () => {
    navigate('/recruitment/requisitions/new');
  };

  useEffect(() => {
    if (isStandaloneOpen) {
      openStandaloneJobReqModal();
    }
  }, [isStandaloneOpen]);

  // Handle Submit Job Requisition
  const handleSubmitJobReq = (targetStatus: 'DRAFT' | 'READY_TO_PUBLISH' = 'READY_TO_PUBLISH') => {
    if (!validateStep1()) {
      setCreateReqTab('mr_ref');
      toast.error('Please fix errors in Step 1 (Organization Setup).');
      return;
    }
    if (!validateStep2()) {
      setCreateReqTab('posting');
      toast.error('Please fix errors in Step 2 (Job Posting Details).');
      return;
    }
    if (!validateStep3()) {
      setCreateReqTab('requirements');
      toast.error('Please fix errors in Step 3 (Candidate & Team).');
      return;
    }
    if (!validateStep4()) {
      setCreateReqTab('compensation');
      toast.error('Please fix errors in Step 4 (Compensation & Dates).');
      return;
    }
    if (!validateStep5()) {
      setCreateReqTab('interview');
      toast.error('Please fix errors in Step 5 (Interview & Internal).');
      return;
    }

    const selectedDesig = designations.find((d: any) => d.id === standaloneDesignationId);
    const finalJobTitle = reqMode === 'FROM_MR' ? selectedMr!.role : (jobTitle.trim() || selectedDesig?.title || 'Software Engineer');

    const minSalaryRupees = reqMode === 'FROM_MR' && selectedMr?.minSalary
      ? (selectedMr.minSalary >= 1000 ? selectedMr.minSalary : Math.round(selectedMr.minSalary * 100000))
      : Math.round(jobMinSalaryLakh * 100000);

    const maxSalaryRupees = reqMode === 'FROM_MR' && selectedMr?.maxSalary
      ? (selectedMr.maxSalary >= 1000 ? selectedMr.maxSalary : Math.round(selectedMr.maxSalary * 100000))
      : Math.round(jobMaxSalaryLakh * 100000);

    let formattedExp = reqMode === 'FROM_MR' ? (selectedMr?.experience || jobExperience) : jobExperience;
    if (candidateType === 'FRESHER') {
      formattedExp = 'Fresher (0 - 1 Years)';
    } else if (candidateType === 'EXPERIENCED') {
      formattedExp = `${minExp} - ${maxExp} Years`;
    } else if (candidateType === 'BOTH') {
      formattedExp = 'Freshers & Experienced Eligible';
    }

    const fullDescription = `${jobSummary}\n\n${jobDescription}`;

    const payload: Partial<JobOpening> = {
      companyId: reqMode === 'FROM_MR' ? (selectedMr!.companyId || companies[0]?.id || '') : standaloneCompanyId,
      departmentId: reqMode === 'FROM_MR' ? (selectedMr!.departmentId || null) : (standaloneDepartmentId || null),
      designationId: reqMode === 'FROM_MR' ? (selectedMr!.designationId || null) : (standaloneDesignationId || null),
      manpowerRequisitionId: reqMode === 'FROM_MR' ? selectedMr!.id : undefined,
      mrNumber: reqMode === 'FROM_MR' ? selectedMr!.mrNumber : undefined,
      manpowerPlanCode: reqMode === 'FROM_MR' ? (selectedMr!.manpowerPlanId || null) : null,
      title: finalJobTitle,
      description: fullDescription,
      responsibilities: jobResponsibilities,
      numPositions: reqMode === 'FROM_MR' ? (selectedMr!.numOpenings || 1) : standaloneNumPositions,
      costCenter: reqMode === 'FROM_MR' ? (selectedMr!.costCenter || '') : standaloneCostCenter,
      employmentType: (reqMode === 'FROM_MR' ? (selectedMr!.employmentType || jobEmploymentType) : jobEmploymentType) as any,
      priority: (reqMode === 'FROM_MR' ? (selectedMr!.priority || 'NORMAL') : 'NORMAL') as any,
      candidateType,
      minExperience: candidateType === 'FRESHER' ? 0 : minExp,
      maxExperience: candidateType === 'FRESHER' ? 1 : maxExp,
      graduationYear: graduationYear || undefined,
      minSalary: minSalaryRupees,
      maxSalary: maxSalaryRupees,
      qualification: reqMode === 'FROM_MR' ? (selectedMr!.qualification || jobQualification) : jobQualification,
      experience: formattedExp,
      requiredSkills: reqMode === 'FROM_MR' ? (selectedMr!.requiredSkills || jobSkills) : jobSkills,
      workLocation: reqMode === 'FROM_MR' ? selectedMr!.workLocation : jobLocation,
      reportingManagerId: reqMode === 'FROM_MR' ? (selectedMr!.reportingManagerId || hiringManagerId) : hiringManagerId,
      applicationDeadline: jobDeadline || undefined,
      status: targetStatus,
      isActive: false,

      // Enterprise extensions
      workMode,
      hiringManagerId,
      recruiterId,
      hrbpId: hrbpId || undefined,
      applicationStartDate: applicationStartDate || undefined,
      jobVisibility,
      preferredSkills,
      preferredQualification,
      certifications,
      languages,
      benefits,
      interviewProcess,
      numInterviewRounds,
      hasAssessment,
      internalNotes,
      internalJustification,
    };

    createJobReqMutation.mutate(payload);
  };

  const filteredOpenings = useMemo(() => {
    if (!openings) return [];
    return openings.filter((o) => {
      const matchesSearch =
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.department?.name && o.department.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.requisitionCode && o.requisitionCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept =
        selectedDept === 'all' ? true : o.department?.name?.toLowerCase() === selectedDept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [openings, searchQuery, selectedDept]);

  const pendingMrsCount = requisitions.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const approvedMrsCount = requisitions.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* ── 1. Manpower Requisitions (MR) Approvals Queue Card ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Manpower Requisitions (MR) Approval Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Stage 1: Internal headcount approval required before initiating recruitment job requisitions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-semibold">
              {pendingMrsCount} Pending Approvals
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
              {approvedMrsCount} Approved MRs
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isMrsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading manpower requisitions...
            </div>
          ) : requisitions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No Manpower Requisitions submitted yet. Go to <strong>Manpower Planning</strong> and click <strong>"Raise MR"</strong> to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">MR Number</TableHead>
                  <TableHead className="text-xs">Role / Designation</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Cost Center</TableHead>
                  <TableHead className="text-xs">Openings</TableHead>
                  <TableHead className="text-xs">Joining Date</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Stage 1 Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((mr) => {
                  const isPending = mr.status === 'PENDING_APPROVAL' || mr.status === 'DRAFT';
                  const isApproved = mr.status === 'APPROVED';
                  const isRejected = mr.status === 'REJECTED';
                  const linkedJr = openings.find(
                    (o) => o.manpowerRequisitionId === mr.id || (o.mrNumber && o.mrNumber === mr.mrNumber)
                  );

                  return (
                    <TableRow key={mr.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        <button
                          type="button"
                          onClick={() => openViewMrModal(mr)}
                          className="hover:underline flex items-center gap-1.5 text-primary font-bold focus:outline-none"
                          title="Click to view full MR details"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                          {mr.mrNumber}
                        </button>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {mr.role}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{mr.departmentName}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">{mr.costCenter}</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-primary">
                        +{mr.numOpenings} Openings
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Date(mr.joiningDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] uppercase font-semibold ${
                            mr.priority === 'URGENT' || mr.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }`}
                        >
                          {mr.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : isRejected
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {mr.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 text-foreground hover:bg-accent gap-1 font-medium"
                            onClick={() => openViewMrModal(mr)}
                          >
                            <Eye className="h-3 w-3 text-primary" /> View Details
                          </Button>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-[10.5px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                                onClick={() => handleApproveMr(mr)}
                                disabled={updateMrStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve MR
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10.5px] px-2 text-rose-600 border-rose-300 hover:bg-rose-50 gap-1 font-semibold"
                                onClick={() => handleRejectMr(mr)}
                                disabled={updateMrStatusMutation.isPending}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          {isApproved && (
                            linkedJr ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10.5px] px-2.5 py-1 font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Job Req Created ({linkedJr.requisitionCode || 'JR'})
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-[10.5px] px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground gap-1 font-semibold"
                                onClick={() => openCreateJobReqModal(mr)}
                              >
                                <Plus className="h-3 w-3" /> Create Job Requisition
                              </Button>
                            )
                          )}
                          {isRejected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10.5px] px-2.5 text-amber-600 border-amber-300 hover:bg-amber-50 gap-1 font-semibold"
                              onClick={() => handleApproveMr(mr)}
                            >
                              Revise & Resubmit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── View Manpower Requisition Details Dialog ── */}
      <Dialog open={isViewMrOpen} onOpenChange={setIsViewMrOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Manpower Requisition Details: {viewingMr?.mrNumber}
              </span>
              <Badge
                className={`text-[10px] font-semibold ${
                  viewingMr?.status === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : viewingMr?.status === 'REJECTED'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {viewingMr?.status.replace(/_/g, ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {viewingMr && (
            <div className="space-y-4 text-xs pt-2">
              {/* Section 1: Organizational & Headcount Details */}
              <div className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-2.5">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> 1. Organizational & Headcount Allocation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">MR Number</Label>
                    <p className="font-mono font-bold text-xs text-primary mt-0.5">{viewingMr.mrNumber}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Manpower Plan Ref</Label>
                    <p className="font-mono font-bold text-xs text-foreground mt-0.5">{viewingMr.manpowerPlanId || 'MP-07'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Company</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5 truncate">{viewingMrCompany?.name || 'CODIGIX_A'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Branch</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5 truncate">
                      {viewingMrBranch?.name ? `${viewingMrBranch.name} (${viewingMrBranch.city || 'Nashik'})` : 'NASHIK DEVELOPMENT'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Department</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{viewingMr.departmentName}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Cost Center</Label>
                    <p className="font-mono font-semibold text-xs text-foreground mt-0.5">{viewingMr.costCenter}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Designation / Role</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{viewingMr.role}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Approved Openings</Label>
                    <div className="mt-0.5">
                      <Badge className="bg-primary/10 text-primary border-primary/30 font-mono font-bold text-xs">
                        +{viewingMr.numOpenings} Positions
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Hiring & Requirements */}
              <div className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-2.5">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" /> 2. Hiring & Role Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Experience Level</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{viewingMr.experience || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Employment Type</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{viewingMr.employmentType || 'FULL_TIME'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Priority</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{viewingMr.priority || 'NORMAL'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Target Joining Date</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{new Date(viewingMr.joiningDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Work Location</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5 truncate">{viewingMr.workLocation}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Reporting Manager</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5 truncate">
                      {viewingMrManager ? `${viewingMrManager.firstName} ${viewingMrManager.lastName}` : 'Assigned Manager'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Required Qualification</Label>
                    <p className="font-medium text-xs text-foreground bg-background p-2 rounded border border-border/60 mt-0.5">
                      {viewingMr.qualification || 'As per Designation Specification'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Required Skills</Label>
                    <p className="font-medium text-xs text-foreground bg-background p-2 rounded border border-border/60 mt-0.5">
                      {viewingMr.requiredSkills || 'As per Role Specification'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Compensation & Budget */}
              <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 space-y-2">
                <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b border-primary/20 pb-1">
                  <DollarSign className="h-3.5 w-3.5" /> 3. Approved Compensation & Budget
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Annual CTC Range (Indian Lakh)</Label>
                    <p className="font-mono font-bold text-sm text-primary mt-0.5">
                      {formatSalaryRangeInLakhs(viewingMr.minSalary, viewingMr.maxSalary)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Exact Stored Annual Budget (INR Rupees)</Label>
                    <p className="font-mono font-semibold text-xs text-foreground mt-0.5">
                      ₹{(viewingMr.minSalary >= 1000 ? viewingMr.minSalary : Math.round(viewingMr.minSalary * 100000)).toLocaleString('en-IN')} – ₹{(viewingMr.maxSalary >= 1000 ? viewingMr.maxSalary : Math.round(viewingMr.maxSalary * 100000)).toLocaleString('en-IN')} / year
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Justification & Audit */}
              <div className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <FileText className="h-3.5 w-3.5 text-primary" /> 4. Hiring Justification & Audit Trail
                </h4>
                <div>
                  <Label className="text-[10px] text-muted-foreground font-medium">Hiring Reason / Justification</Label>
                  <p className="text-xs text-foreground bg-background p-2.5 rounded-lg border border-border/60 mt-0.5 whitespace-pre-wrap">
                    {viewingMr.reason || 'No justification text provided.'}
                  </p>
                </div>
                {viewingMr.rejectionReason && (
                  <div>
                    <Label className="text-[10px] text-rose-600 font-semibold">Rejection Reason</Label>
                    <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 mt-0.5">
                      {viewingMr.rejectionReason}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 text-muted-foreground">
                  <div>Requested By: <strong className="text-foreground">{viewingMr.requestorName || 'HR Admin'}</strong></div>
                  <div>Created Date: <strong className="text-foreground">{new Date(viewingMr.createdAt).toLocaleDateString()}</strong></div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsViewMrOpen(false)}
                >
                  Close
                </Button>
                {viewingMr.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs text-rose-600 border-rose-300 hover:bg-rose-50 font-semibold gap-1"
                      onClick={() => {
                        setIsViewMrOpen(false);
                        handleRejectMr(viewingMr);
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject MR
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                      onClick={() => {
                        setIsViewMrOpen(false);
                        handleApproveMr(viewingMr);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve MR
                    </Button>
                  </>
                )}
                {viewingMr.status === 'APPROVED' && (
                  (() => {
                    const viewingLinkedJr = openings.find(
                      (o) => o.manpowerRequisitionId === viewingMr.id || (o.mrNumber && o.mrNumber === viewingMr.mrNumber)
                    );
                    return viewingLinkedJr ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs px-3 py-1.5 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Job Req Created ({viewingLinkedJr.requisitionCode || 'JR'})
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="text-xs font-semibold gap-1.5"
                        onClick={() => {
                          setIsViewMrOpen(false);
                          openCreateJobReqModal(viewingMr);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Create Job Requisition
                      </Button>
                    );
                  })()
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 2. Create Job Requisition Dialog (Enterprise Setup for MR and Standalone) ── */}
      <Dialog
        open={isReqOpen}
        onOpenChange={(open) => {
          setIsReqOpen(open);
          if (!open && onStandaloneClose) {
            onStandaloneClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[94vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Create Job Requisition ({reqMode === 'FROM_MR' ? 'From Approved MR' : 'Standalone Direct Setup'})
              </span>
              <div className="flex items-center gap-2">
                {reqMode === 'FROM_MR' ? (
                  <>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono font-bold">
                      MR: {selectedMr?.mrNumber}
                    </Badge>
                    <Badge variant="outline" className="bg-background text-emerald-600 border-emerald-500/30 text-[10px] gap-1 font-semibold">
                      <ShieldCheck className="h-3 w-3" /> Auto-Filled & Locked
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="bg-background text-blue-600 border-blue-500/30 text-[10px] gap-1 font-semibold">
                    <Sparkles className="h-3 w-3" /> Direct Requisition (Headcount Review)
                  </Badge>
                )}
              </div>
            </DialogTitle>

            {/* Enterprise Step Navigation Tabs */}
            <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleNextStep('mr_ref')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  createReqTab === 'mr_ref'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                {reqMode === 'FROM_MR' ? '1. Approved MR 🔒' : '1. Organization Setup'}
                {(fieldErrors.standaloneCompanyId || fieldErrors.standaloneBranchId || fieldErrors.standaloneDepartmentId || fieldErrors.standaloneDesignationId) && (
                  <span className="text-[10px] text-rose-600 font-bold">⚠️</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleNextStep('posting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  createReqTab === 'posting'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> 2. Job Details
                {(fieldErrors.jobTitle || fieldErrors.jobSummary || fieldErrors.jobDescription || fieldErrors.jobResponsibilities) && (
                  <span className="text-[10px] text-rose-600 font-bold">⚠️</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleNextStep('requirements')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  createReqTab === 'requirements'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> 3. Candidate & Team
                {(fieldErrors.minExp || fieldErrors.hiringManagerId || fieldErrors.recruiterId) && (
                  <span className="text-[10px] text-rose-600 font-bold">⚠️</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleNextStep('compensation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  createReqTab === 'compensation'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" /> 4. Compensation & Dates
                {(fieldErrors.jobMinSalaryLakh || fieldErrors.jobDeadline) && (
                  <span className="text-[10px] text-rose-600 font-bold">⚠️</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleNextStep('interview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  createReqTab === 'interview'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> 5. Interview & Internal
                {fieldErrors.internalJustification && (
                  <span className="text-[10px] text-rose-600 font-bold">⚠️</span>
                )}
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-2">
            {/* ── Top Compact Organization Summary Bar ── */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border/80 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Company Entity</span>
                <span className="font-semibold truncate block">
                  {reqMode === 'FROM_MR'
                    ? (planCompany?.name || 'Selected Company')
                    : (companies.find((c: any) => c.id === standaloneCompanyId)?.name || 'Not Selected')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Branch Location</span>
                <span className="font-semibold truncate block">
                  {reqMode === 'FROM_MR'
                    ? (planBranch?.name || 'Selected Branch')
                    : (branches.find((b: any) => b.id === standaloneBranchId)?.name || 'Not Selected')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Department</span>
                <span className="font-semibold truncate block">
                  {reqMode === 'FROM_MR'
                    ? selectedMr?.departmentName
                    : (departments.find((d: any) => d.id === standaloneDepartmentId)?.name || 'Not Selected')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Designation / Role</span>
                <span className="font-semibold truncate block">
                  {reqMode === 'FROM_MR'
                    ? selectedMr?.role
                    : (designations.find((des: any) => des.id === standaloneDesignationId)?.title || 'Not Selected')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Openings</span>
                <span className="font-bold text-primary block">
                  +{reqMode === 'FROM_MR' ? (selectedMr?.numOpenings || 1) : standaloneNumPositions} Pos
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Workflow Mode</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${
                    reqMode === 'FROM_MR'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                  }`}
                >
                  {reqMode === 'FROM_MR' ? 'APPROVED MR 🔒' : 'HEADCOUNT REVIEW'}
                </Badge>
              </div>
            </div>

            {/* ── TAB 1: APPROVED MR REFERENCE OR STANDALONE ORGANIZATION SETUP ── */}
            {createReqTab === 'mr_ref' && (
              reqMode === 'FROM_MR' && selectedMr ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" /> Approved Manpower Requisition Details (Read-Only Source of Truth)
                      </h4>
                      <Badge variant="outline" className="bg-background text-[10px] text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                        <ShieldCheck className="h-3 w-3" /> Locked Headcount Budget
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">MR Number (Auto)</Label>
                        <p className="font-mono font-bold text-sm text-primary mt-0.5">{selectedMr.mrNumber}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Manpower Plan Ref</Label>
                        <p className="font-mono font-bold text-xs text-foreground mt-0.5">{selectedMr.manpowerPlanId || 'MP-07'}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Company (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5 truncate flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          {planCompany?.name || 'CODIGIX_A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Branch (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5 truncate flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          {planBranch?.name ? `${planBranch.name} (${planBranch.city || 'Nashik'})` : 'NASHIK DEVELOPMENT'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Department (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{selectedMr.departmentName}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Cost Center (Locked)</Label>
                        <p className="font-mono font-semibold text-xs text-foreground mt-0.5">{selectedMr.costCenter}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Designation / Role (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{selectedMr.role}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Approved Openings</Label>
                        <div className="mt-0.5">
                          <Badge className="bg-primary/10 text-primary border-primary/30 font-mono font-bold text-xs">
                            +{selectedMr.numOpenings} Openings Approved
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Approved Experience (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{selectedMr.experience || 'Fresher / Experienced'}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Approved CTC Range (Locked)</Label>
                        <p className="font-mono font-bold text-xs text-primary mt-0.5">
                          {formatSalaryRangeInLakhs(selectedMr.minSalary, selectedMr.maxSalary)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Work Location (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5 truncate">{selectedMr.workLocation}</p>
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Reporting Manager (Locked)</Label>
                        <p className="font-semibold text-xs text-foreground mt-0.5 truncate">
                          {selectedMrManager ? `${selectedMrManager.firstName} ${selectedMrManager.lastName}` : 'Assigned Manager'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-primary/20">
                      <div>
                        <Label className="text-[10px] text-muted-foreground font-medium">Approved Qualification Specification</Label>
                        <p className="font-medium text-xs text-foreground bg-background p-2 rounded border border-border/60 mt-0.5">
                          {selectedMr.qualification || 'As per Designation Specification'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground font-medium">Approved Skills Specification</Label>
                        <p className="font-medium text-xs text-foreground bg-background p-2 rounded border border-border/60 mt-0.5">
                          {selectedMr.requiredSkills || 'As per Role Specification'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs font-semibold gap-1.5"
                      onClick={() => handleNextStep('posting')}
                    >
                      Next: Job Posting Details &rarr;
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateActiveReq && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 shadow-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold block text-amber-900 dark:text-amber-200">Active Requisition Already Exists</span>
                        An active requisition ({duplicateActiveReq.requisitionCode || duplicateActiveReq.title}) already exists for this Designation in this Department. Current Status: <strong className="font-mono">{duplicateActiveReq.status}</strong>.
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <div>
                        <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" /> 1. Organization & Headcount Setup (Standalone Direct Requisition)
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Select organization details in sequence: Company &rarr; Branch &rarr; Department &rarr; Cost Center &rarr; Designation.
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-background text-[10px] text-blue-600 border-blue-500/30 gap-1 font-semibold shrink-0">
                        <Sparkles className="h-3 w-3" /> Direct Setup
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 1. Company */}
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Company Entity *</Label>
                        <Select value={standaloneCompanyId} onValueChange={handleCompanyChange}>
                          <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c: any) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.standaloneCompanyId && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneCompanyId}</p>
                        )}
                      </div>

                      {/* 2. Branch */}
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Branch Location *</Label>
                        <Select
                          value={standaloneBranchId}
                          onValueChange={handleBranchChange}
                          disabled={!standaloneCompanyId}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder={standaloneCompanyId ? 'Select Branch' : 'Select Company first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredBranches.map((b: any) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name} ({b.city || 'Nashik'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.standaloneBranchId && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneBranchId}</p>
                        )}
                      </div>

                      {/* 3. Department */}
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Department *</Label>
                        <Select
                          value={standaloneDepartmentId}
                          onValueChange={handleDepartmentChange}
                          disabled={!standaloneBranchId}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder={standaloneBranchId ? 'Select Department' : 'Select Branch first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDepartments.map((d: any) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name} ({d.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.standaloneDepartmentId && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneDepartmentId}</p>
                        )}
                      </div>

                      {/* 4. Cost Center */}
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Cost Center *</Label>
                        <Input
                          type="text"
                          value={standaloneCostCenter}
                          onChange={(e) => {
                            setStandaloneCostCenter(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, standaloneCostCenter: '' }));
                          }}
                          disabled={!standaloneDepartmentId}
                          placeholder={standaloneDepartmentId ? 'e.g. CCP234 - Software Development' : 'Select Department first'}
                          className="h-8 text-xs bg-background font-mono"
                        />
                        {fieldErrors.standaloneCostCenter && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneCostCenter}</p>
                        )}
                      </div>

                      {/* 5. Designation */}
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Designation / Job Role *</Label>
                        <Select
                          value={standaloneDesignationId}
                          onValueChange={(v) => {
                            setStandaloneDesignationId(v);
                            setFieldErrors((prev) => ({ ...prev, standaloneDesignationId: '' }));
                          }}
                          disabled={!standaloneDepartmentId}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                            <SelectValue placeholder={standaloneDepartmentId ? 'Select Designation' : 'Select Department first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDesignations.map((des: any) => (
                              <SelectItem key={des.id} value={des.id} className="text-xs">
                                {des.title} ({des.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.standaloneDesignationId && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneDesignationId}</p>
                        )}
                      </div>

                      {/* 6. Openings */}
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Number of Openings *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={standaloneNumPositions}
                          onChange={(e) => {
                            setStandaloneNumPositions(Math.max(1, Math.floor(Number(e.target.value))));
                            setFieldErrors((prev) => ({ ...prev, standaloneNumPositions: '' }));
                          }}
                          className="h-8 text-xs font-mono font-bold bg-background text-primary"
                        />
                        {fieldErrors.standaloneNumPositions && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneNumPositions}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs font-semibold gap-1.5"
                      onClick={() => handleNextStep('posting')}
                    >
                      Next: Job Posting Details &rarr;
                    </Button>
                  </div>
                </div>
              )
            )}

            {/* ── TAB 2: JOB POSTING DETAILS ── */}
            {createReqTab === 'posting' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs">Job Posting Title *</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">{jobTitle.length}/150</span>
                    </div>
                    <Input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobTitle: '' }));
                      }}
                      className="h-8 text-xs bg-background font-semibold text-foreground"
                      placeholder="e.g. Software Engineer / Senior Full Stack Developer"
                    />
                    {fieldErrors.jobTitle && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobTitle}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs">Job Summary *</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">{jobSummary.length}/500</span>
                    </div>
                    <Input
                      type="text"
                      value={jobSummary}
                      onChange={(e) => {
                        setJobSummary(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobSummary: '' }));
                      }}
                      className="h-8 text-xs bg-background"
                      placeholder="Short 1-2 sentence overview for career portal card..."
                    />
                    {fieldErrors.jobSummary && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobSummary}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs">Detailed Job Description *</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">Min 50 chars</span>
                    </div>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobDescription: '' }));
                      }}
                      className="text-xs min-h-[90px]"
                      rows={4}
                      placeholder="Provide full job description including team overview, projects, domain expectations, and growth opportunities..."
                    />
                    {fieldErrors.jobDescription && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobDescription}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs">Key Responsibilities & Duties *</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">Min 20 chars</span>
                    </div>
                    <Textarea
                      value={jobResponsibilities}
                      onChange={(e) => {
                        setJobResponsibilities(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobResponsibilities: '' }));
                      }}
                      className="text-xs min-h-[90px]"
                      rows={4}
                      placeholder="• Architect, build and maintain scalable features&#10;• Collaborate with cross-functional teams to deliver quality results&#10;• Conduct code reviews and mentor junior team members"
                    />
                    {fieldErrors.jobResponsibilities && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobResponsibilities}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">
                      Required Qualification * {reqMode === 'FROM_MR' ? '(Locked from MR)' : ''}
                    </Label>
                    <Input
                      type="text"
                      readOnly={reqMode === 'FROM_MR'}
                      value={reqMode === 'FROM_MR' ? (selectedMr?.qualification || jobQualification || 'As per Designation Specification') : jobQualification}
                      onChange={(e) => {
                        setJobQualification(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobQualification: '' }));
                      }}
                      className={`h-8 text-xs ${reqMode === 'FROM_MR' ? 'bg-muted/60 font-semibold cursor-not-allowed text-foreground' : 'bg-background'}`}
                      placeholder="e.g. B.Tech / M.Tech / MCA / Graduate"
                    />
                    {fieldErrors.jobQualification && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobQualification}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Preferred Qualification</Label>
                    <Input
                      type="text"
                      value={preferredQualification}
                      onChange={(e) => setPreferredQualification(e.target.value)}
                      className="h-8 text-xs bg-background"
                      placeholder="e.g. M.Tech / AWS Certified / Honors Graduate"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">
                      Required Skills * {reqMode === 'FROM_MR' ? '(Locked from MR)' : ''}
                    </Label>
                    <Input
                      type="text"
                      readOnly={reqMode === 'FROM_MR'}
                      value={reqMode === 'FROM_MR' ? (selectedMr?.requiredSkills || jobSkills || 'As per Role Specification') : jobSkills}
                      onChange={(e) => {
                        setJobSkills(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobSkills: '' }));
                      }}
                      className={`h-8 text-xs ${reqMode === 'FROM_MR' ? 'bg-muted/60 font-semibold cursor-not-allowed text-foreground' : 'bg-background'}`}
                      placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                    />
                    {fieldErrors.jobSkills && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobSkills}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Preferred Skills</Label>
                    <Input
                      type="text"
                      value={preferredSkills}
                      onChange={(e) => setPreferredSkills(e.target.value)}
                      className="h-8 text-xs bg-background"
                      placeholder="e.g. Docker, Kubernetes, GraphQL, System Design"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="font-semibold text-xs">Certifications & Benefits</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="text"
                        value={certifications}
                        onChange={(e) => setCertifications(e.target.value)}
                        className="h-8 text-xs bg-background"
                        placeholder="Certifications (e.g. AWS Architect, PMP)"
                      />
                      <Input
                        type="text"
                        value={benefits}
                        onChange={(e) => setBenefits(e.target.value)}
                        className="h-8 text-xs bg-background"
                        placeholder="Benefits (e.g. Health Insurance, Bonus)"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setCreateReqTab('mr_ref')}>
                    &larr; Previous
                  </Button>
                  <Button type="button" size="sm" className="text-xs font-semibold gap-1.5" onClick={() => handleNextStep('requirements')}>
                    Next: Candidate & Team &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* ── TAB 3: CANDIDATE REQUIREMENTS & HIRING TEAM ── */}
            {createReqTab === 'requirements' && (
              <div className="space-y-4">
                {/* Candidate Eligibility Selector */}
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border space-y-3">
                  <h4 className="font-semibold text-xs text-foreground flex items-center justify-between">
                    <span>Candidate Eligibility & Experience Range *</span>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {candidateType === 'FRESHER'
                        ? 'Fresher Only (0 - 1 Years)'
                        : candidateType === 'EXPERIENCED'
                        ? `Experienced (${minExp} - ${maxExp} Years)`
                        : `Freshers & Experienced Both Eligible (${minExp} - ${maxExp} Years)`}
                    </Badge>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold text-xs">Experience Type *</Label>
                      <Select value={candidateType} onValueChange={(v: any) => setCandidateType(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select Candidate Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FRESHER" className="text-xs font-medium">Fresher (0 - 1 Years)</SelectItem>
                          <SelectItem value="EXPERIENCED" className="text-xs font-medium">Experienced Only</SelectItem>
                          <SelectItem value="BOTH" className="text-xs font-medium">Both (Freshers & Experienced)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {candidateType === 'FRESHER' ? (
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="font-semibold text-xs">Graduation / Passing Year</Label>
                        <Input
                          type="text"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          placeholder="e.g. 2024 / 2025 / 2026"
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label className="font-semibold text-xs">Min Exp (Years) *</Label>
                          <Input
                            type="number"
                            min={0}
                            value={minExp}
                            onChange={(e) => {
                              setMinExp(Number(e.target.value));
                              setFieldErrors((prev) => ({ ...prev, minExp: '' }));
                            }}
                            className="h-8 text-xs font-mono bg-background"
                          />
                          {fieldErrors.minExp && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.minExp}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-xs">Max Exp (Years) *</Label>
                          <Input
                            type="number"
                            min={0}
                            value={maxExp}
                            onChange={(e) => {
                              setMaxExp(Number(e.target.value));
                              setFieldErrors((prev) => ({ ...prev, minExp: '' }));
                            }}
                            className="h-8 text-xs font-mono bg-background"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Hiring Team Assignment */}
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border space-y-3">
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> Hiring Team Assignment (Filtered Employee Master)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold text-xs">Hiring Manager *</Label>
                      <Select
                        value={hiringManagerId}
                        onValueChange={(v) => {
                          setHiringManagerId(v);
                          setFieldErrors((prev) => ({ ...prev, hiringManagerId: '' }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                          <SelectValue placeholder="Select Hiring Manager" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          {filteredTeamEmployees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id} className="text-xs">
                              {emp.firstName} {emp.lastName} ({emp.designationTitle || emp.role || 'Manager'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.hiringManagerId && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.hiringManagerId}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label className="font-semibold text-xs">Assigned Recruiter *</Label>
                      <Select
                        value={recruiterId}
                        onValueChange={(v) => {
                          setRecruiterId(v);
                          setFieldErrors((prev) => ({ ...prev, recruiterId: '' }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                          <SelectValue placeholder="Select Recruiter" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          {filteredTeamEmployees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id} className="text-xs">
                              {emp.firstName} {emp.lastName} ({emp.designationTitle || emp.role || 'Recruiter'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.recruiterId && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.recruiterId}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label className="font-semibold text-xs">HR Business Partner (HRBP)</Label>
                      <Select value={hrbpId} onValueChange={setHrbpId}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select HRBP (Optional)" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          {filteredTeamEmployees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id} className="text-xs">
                              {emp.firstName} {emp.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setCreateReqTab('posting')}>
                    &larr; Previous
                  </Button>
                  <Button type="button" size="sm" className="text-xs font-semibold gap-1.5" onClick={() => handleNextStep('compensation')}>
                    Next: Compensation & Dates &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* ── TAB 4: COMPENSATION & DATES ── */}
            {createReqTab === 'compensation' && (
              <div className="space-y-4">
                {/* Employment & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Employment Type *</Label>
                    <Select value={jobEmploymentType} onValueChange={(v: any) => setJobEmploymentType(v)}>
                      <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME" className="text-xs">Full Time</SelectItem>
                        <SelectItem value="PART_TIME" className="text-xs">Part Time</SelectItem>
                        <SelectItem value="CONTRACT" className="text-xs">Contract</SelectItem>
                        <SelectItem value="INTERN" className="text-xs">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Work Mode *</Label>
                    <Select value={workMode} onValueChange={setWorkMode}>
                      <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On-site" className="text-xs">On-site</SelectItem>
                        <SelectItem value="Hybrid" className="text-xs">Hybrid</SelectItem>
                        <SelectItem value="Remote" className="text-xs">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">
                      Work Location {reqMode === 'FROM_MR' ? '(Locked from MR)' : '*'}
                    </Label>
                    <Input
                      type="text"
                      readOnly={reqMode === 'FROM_MR'}
                      value={reqMode === 'FROM_MR' ? (selectedMr?.workLocation || 'Nashik Center') : jobLocation}
                      onChange={(e) => {
                        setJobLocation(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobLocation: '' }));
                      }}
                      className={`h-8 text-xs ${reqMode === 'FROM_MR' ? 'bg-muted/60 font-semibold cursor-not-allowed text-foreground' : 'bg-background'}`}
                      placeholder="e.g. Nashik Development Center / Remote"
                    />
                    {fieldErrors.jobLocation && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobLocation}</p>}
                  </div>
                </div>

                {/* Compensation Details */}
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                  <h4 className="font-semibold text-xs text-primary flex items-center justify-between border-b border-primary/20 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" /> Compensation Budget Range {reqMode === 'FROM_MR' ? '(Locked from MR)' : ''}
                    </span>
                    <Badge variant="outline" className="bg-background text-[10px] text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                      <ShieldCheck className="h-3 w-3" /> Salary Band
                    </Badge>
                  </h4>

                  {reqMode === 'FROM_MR' && selectedMr ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Minimum Annual CTC (Locked from MR)</Label>
                        <p className="font-mono font-bold text-sm text-primary mt-0.5">
                          {formatSalaryInLakhs(selectedMr.minSalary >= 1000 ? selectedMr.minSalary : selectedMr.minSalary * 100000)}
                        </p>
                        <p className="text-[9.5px] text-muted-foreground mt-0.5">
                          Stored: ₹{(selectedMr.minSalary >= 1000 ? selectedMr.minSalary : Math.round(selectedMr.minSalary * 100000)).toLocaleString('en-IN')} / year
                        </p>
                      </div>

                      <div>
                        <Label className="text-[10.5px] text-muted-foreground font-medium">Maximum Annual CTC (Locked from MR)</Label>
                        <p className="font-mono font-bold text-sm text-primary mt-0.5">
                          {formatSalaryInLakhs(selectedMr.maxSalary >= 1000 ? selectedMr.maxSalary : selectedMr.maxSalary * 100000)}
                        </p>
                        <p className="text-[9.5px] text-muted-foreground mt-0.5">
                          Stored: ₹{(selectedMr.maxSalary >= 1000 ? selectedMr.maxSalary : Math.round(selectedMr.maxSalary * 100000)).toLocaleString('en-IN')} / year
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="font-semibold text-xs">Min Annual CTC (₹ Lakhs) *</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={jobMinSalaryLakh}
                            onChange={(e) => {
                              setJobMinSalaryLakh(Number(e.target.value));
                              setFieldErrors((prev) => ({ ...prev, jobMinSalaryLakh: '' }));
                            }}
                            className="h-8 text-xs font-mono font-bold bg-background text-primary"
                          />
                          {fieldErrors.jobMinSalaryLakh && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobMinSalaryLakh}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-xs">Max Annual CTC (₹ Lakhs) *</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={jobMaxSalaryLakh}
                            onChange={(e) => {
                              setJobMaxSalaryLakh(Number(e.target.value));
                              setFieldErrors((prev) => ({ ...prev, jobMinSalaryLakh: '' }));
                            }}
                            className="h-8 text-xs font-mono font-bold bg-background text-primary"
                          />
                        </div>
                      </div>

                      <div className="bg-background p-2.5 rounded-lg border border-border/70 flex items-center justify-between text-xs font-mono">
                        <span className="text-muted-foreground text-[11px]">Formatted CTC Band:</span>
                        <span className="font-bold text-primary">
                          ₹{jobMinSalaryLakh.toFixed(2)} Lakh – ₹{jobMaxSalaryLakh.toFixed(2)} Lakh / year
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates & Job Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Application Start Date *</Label>
                    <Input
                      type="date"
                      value={applicationStartDate}
                      onChange={(e) => setApplicationStartDate(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Application Deadline *</Label>
                    <Input
                      type="date"
                      value={jobDeadline}
                      onChange={(e) => {
                        setJobDeadline(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, jobDeadline: '' }));
                      }}
                      className="h-8 text-xs bg-background font-mono"
                    />
                    {fieldErrors.jobDeadline && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobDeadline}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-xs">Job Visibility *</Label>
                    <Select value={jobVisibility} onValueChange={setJobVisibility}>
                      <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public" className="text-xs">Public (Career Portal)</SelectItem>
                        <SelectItem value="Internal" className="text-xs">Internal Only (Employee Portal)</SelectItem>
                        <SelectItem value="Public + Internal" className="text-xs">Public + Internal Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setCreateReqTab('requirements')}>
                    &larr; Previous
                  </Button>
                  <Button type="button" size="sm" className="text-xs font-semibold gap-1.5" onClick={() => handleNextStep('interview')}>
                    Next: Interview & Internal &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* ── TAB 5: INTERVIEW PROCESS & INTERNAL INFORMATION ── */}
            {createReqTab === 'interview' && (
              <div className="space-y-4">
                {/* Interview Process Configuration */}
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border space-y-3">
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Interview Process & Evaluation Setup
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="font-semibold text-xs">Interview Process Stages</Label>
                      <Input
                        type="text"
                        value={interviewProcess}
                        onChange={(e) => setInterviewProcess(e.target.value)}
                        className="h-8 text-xs bg-background"
                        placeholder="e.g. Screening → Technical Assessment → Technical Interview → HR Round"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="font-semibold text-xs">Number of Rounds</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={numInterviewRounds}
                        onChange={(e) => setNumInterviewRounds(Number(e.target.value))}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Internal Only Rationale & Notes */}
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border space-y-3">
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Internal Information & Hiring Rationale
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-xs">Hiring Reason / Justification *</Label>
                        <span className="text-[10px] text-muted-foreground font-mono">Min 15 chars</span>
                      </div>
                      <Textarea
                        value={internalJustification}
                        onChange={(e) => {
                          setInternalJustification(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, internalJustification: '' }));
                        }}
                        className="text-xs min-h-[60px]"
                        rows={3}
                        placeholder="Provide detailed business rationale for headcount requirement..."
                      />
                      {fieldErrors.internalJustification && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.internalJustification}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="font-semibold text-xs">Internal Notes & Budget Comments</Label>
                      <Textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        className="text-xs min-h-[60px]"
                        rows={3}
                        placeholder="Special budget notes or internal recruiter instructions..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setCreateReqTab('compensation')}>
                    &larr; Previous
                  </Button>
                </div>
              </div>
            )}

            {/* ── Dialog Action Buttons ── */}
            <DialogFooter className="pt-4 border-t border-border gap-2 sm:gap-0 flex justify-between items-center">
              <div className="text-[11px] text-muted-foreground font-medium">
                Step {createReqTab === 'mr_ref' ? 1 : createReqTab === 'posting' ? 2 : createReqTab === 'requirements' ? 3 : createReqTab === 'compensation' ? 4 : 5} of 5
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsReqOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => handleSubmitJobReq('DRAFT')}
                  disabled={createJobReqMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                  onClick={() => handleSubmitJobReq('READY_TO_PUBLISH')}
                  disabled={createJobReqMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Save & Set Ready to Publish
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── 3. Job Requisitions & Job Openings List (Stage 2 & Stage 3) ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Job Requisitions & Job Portal Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Stage 2 & 3: Detailed recruitment requisitions and live postings published to Careers / Job Portal
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter job requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                onClick={openStandaloneJobReqModal}
              >
                <Plus className="h-3.5 w-3.5" /> Post Job Opening
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isOpeningsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading job requisitions...
            </div>
          ) : filteredOpenings.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No job requisitions created yet. Click <strong>"Create Job Requisition"</strong> on an Approved MR.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Req Code / ID</TableHead>
                  <TableHead className="text-xs">MR Ref</TableHead>
                  <TableHead className="text-xs">Job Position Title</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Openings</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created Date</TableHead>
                  <TableHead className="text-right text-xs">Stage 3 Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpenings.map((opening) => {
                  const isPublished = opening.status === 'PUBLISHED' || opening.isActive;
                  const isStandalone = !opening.manpowerRequisitionId;
                  const isReadyToPublish = !isPublished && (isStandalone || opening.status === 'READY_TO_PUBLISH');
                  const reqCode = opening.requisitionCode || `JR-2026-0${opening.id.substring(0, 2)}`;

                  return (
                    <TableRow key={opening.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{reqCode}</TableCell>
                      <TableCell className="font-mono text-xs text-primary font-bold">
                        {opening.mrNumber || (opening.manpowerRequisitionId ? requisitions.find((r) => r.id === opening.manpowerRequisitionId)?.mrNumber : null) || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">{opening.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">
                        {opening.department?.name || 'General'}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-primary">
                        {opening.numPositions} Positions
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : isReadyToPublish
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {isPublished ? 'PUBLISHED' : isReadyToPublish ? 'READY TO PUBLISH' : 'DRAFT'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(opening.createdAt || Date.now()).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPublished ? (
                            <Button
                              size="sm"
                              className="h-7 text-[10.5px] px-2.5 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold shadow-xs"
                              onClick={() => handlePublishJobOpening(opening)}
                              disabled={publishOpeningMutation.isPending}
                            >
                              <Globe className="h-3 w-3" /> Publish Job Opening
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <a
                                href="/careers"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 font-semibold gap-1">
                                  <Globe className="h-3 w-3" /> View Career Page
                                </Button>
                              </a>
                              <Link to={`/recruitment/candidates?jobOpeningId=${opening.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold gap-1">
                                  View Candidates <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
