import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  FileText,
  Users,
  DollarSign,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { jobOpeningsApi, manpowerRequisitionsApi } from '@/api/recruitment';
import { companiesApi, branchesApi, departmentsApi, designationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { costCentersApi, type CostCenter } from '@/api/cost-grades';
import { formatSalaryInLakhs } from '@/lib/utils';

export default function CreateJobRequisitionPage() {
  const navigate = useNavigate();
  const { mrId } = useParams<{ mrId?: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const isFromMR = Boolean(mrId || searchParams.get('mrId'));
  const targetMrId = mrId || searchParams.get('mrId') || '';

  // Tab Stepper State
  const [activeStepTab, setActiveStepTab] = useState<
    'mr_ref' | 'posting' | 'requirements' | 'compensation' | 'interview'
  >('mr_ref');

  // Inline Validation Field Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Master Data Queries ──
  const { data: approvedMrsResponse } = useQuery({
    queryKey: ['approved-manpower-requisitions'],
    queryFn: async () => {
      const res = await manpowerRequisitionsApi.getAll();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.filter((m: any) => m.status === 'APPROVED');
    },
  });

  const approvedMrs = approvedMrsResponse || [];
  const selectedMr = isFromMR ? approvedMrs.find((m: any) => m.id === targetMrId) : null;

  // ── Form State (Standalone Organization Setup) ──
  const [standaloneCompanyId, setStandaloneCompanyId] = useState('');
  const [standaloneBranchId, setStandaloneBranchId] = useState('');
  const [standaloneDepartmentId, setStandaloneDepartmentId] = useState('');
  const [standaloneCostCenter, setStandaloneCostCenter] = useState('');
  const [standaloneDesignationId, setStandaloneDesignationId] = useState('');
  const [standaloneNumPositions, setStandaloneNumPositions] = useState(1);

  const activeCompId = isFromMR ? selectedMr?.companyId : standaloneCompanyId;
  const activeBranchId = isFromMR ? selectedMr?.branchId : standaloneBranchId;
  const activeDeptId = isFromMR ? selectedMr?.departmentId : standaloneDepartmentId;

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', activeCompId],
    queryFn: () => branchesApi.list(activeCompId || undefined),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeCompId, activeBranchId],
    queryFn: () => departmentsApi.list(activeCompId || undefined, activeBranchId || undefined),
  });

  const { data: designations = [] } = useQuery({
    queryKey: ['designations', activeCompId, activeDeptId],
    queryFn: () => designationsApi.list(activeCompId || undefined, activeDeptId || undefined),
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers', activeCompId, activeBranchId, activeDeptId],
    queryFn: () => costCentersApi.list(activeCompId || undefined, activeBranchId || undefined, activeDeptId || undefined),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees', 1, 'all-active'],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const activeEmployees = useMemo(() => {
    const list = Array.isArray(employeesResponse)
      ? employeesResponse
      : (employeesResponse as any)?.items || (employeesResponse as any)?.data || [];
    return list.filter((e: any) => e.status === 'ACTIVE' || !e.status);
  }, [employeesResponse]);

  const { data: existingJobOpenings = [] } = useQuery({
    queryKey: ['job-openings-all'],
    queryFn: async () => {
      const res = await jobOpeningsApi.list();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // ── Cascading Dropdowns Filters ──
  const filteredBranches = useMemo(() => {
    if (!activeCompId) return [];
    return branches;
  }, [branches, activeCompId]);

  const filteredDepartments = useMemo(() => {
    if (!activeCompId) return [];
    return departments;
  }, [departments, activeCompId]);

  const filteredDesignations = useMemo(() => {
    if (!activeDeptId) return [];
    return designations;
  }, [designations, activeDeptId]);

  const filteredTeamEmployees = useMemo(() => {
    const activeCompId = isFromMR ? selectedMr?.companyId : standaloneCompanyId;
    const activeDeptId = isFromMR ? selectedMr?.departmentId : standaloneDepartmentId;

    return activeEmployees.filter((emp: any) => {
      if (activeCompId && emp.companyId && emp.companyId !== activeCompId) return false;
      if (activeDeptId && emp.departmentId && emp.departmentId !== activeDeptId) return false;
      return true;
    });
  }, [activeEmployees, isFromMR, selectedMr, standaloneCompanyId, standaloneDepartmentId]);

  // Handle Organization Cascading Resets
  const handleCompanyChange = (cId: string) => {
    setStandaloneCompanyId(cId);
    setStandaloneBranchId('');
    setStandaloneDepartmentId('');
    setStandaloneCostCenter('');
    setStandaloneDesignationId('');
    setFieldErrors((prev) => ({ ...prev, standaloneCompanyId: '' }));
  };

  const handleBranchChange = (bId: string) => {
    setStandaloneBranchId(bId);
    setStandaloneDepartmentId('');
    setStandaloneCostCenter('');
    setStandaloneDesignationId('');
    setFieldErrors((prev) => ({ ...prev, standaloneBranchId: '' }));
  };

  const handleDepartmentChange = (dId: string) => {
    setStandaloneDepartmentId(dId);
    setStandaloneDesignationId('');
    const targetDept = departments.find((d: any) => d.id === dId);
    const matchingCc = costCenters.find((cc: any) => cc.departmentId === dId || cc.branchId === standaloneBranchId);

    if (matchingCc) {
      setStandaloneCostCenter(`${matchingCc.code} - ${matchingCc.name}`);
    } else if (targetDept?.costCenter) {
      setStandaloneCostCenter(targetDept.costCenter);
    } else if (targetDept) {
      const cleanCode = targetDept.code ? targetDept.code.replace(/^DEPT-?/i, '') : 'CC';
      setStandaloneCostCenter(`CC-${cleanCode} - ${targetDept.name}`);
    } else {
      setStandaloneCostCenter('');
    }
    setFieldErrors((prev) => ({ ...prev, standaloneDepartmentId: '', standaloneCostCenter: '' }));
  };

  // Duplicate Check
  const duplicateActiveReq = useMemo(() => {
    const activeDept = isFromMR ? selectedMr?.departmentId : standaloneDepartmentId;
    const activeDes = isFromMR ? selectedMr?.designationId : standaloneDesignationId;

    if (!activeDept || !activeDes) return null;

    return existingJobOpenings.find(
      (job: any) =>
        job.departmentId === activeDept &&
        job.designationId === activeDes &&
        job.status !== 'CLOSED' &&
        job.status !== 'CANCELLED'
    );
  }, [existingJobOpenings, isFromMR, selectedMr, standaloneDepartmentId, standaloneDesignationId]);

  // ── Form State (Job Specification & Requirements) ──
  const [jobTitle, setJobTitle] = useState('');
  const [jobSummary, setJobSummary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobQualification, setJobQualification] = useState('');
  const [preferredQualification, setPreferredQualification] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [benefits, setBenefits] = useState('');

  const [candidateType, setCandidateType] = useState<'FRESHER' | 'EXPERIENCED' | 'BOTH'>('EXPERIENCED');
  const [minExp, setMinExp] = useState(1);
  const [maxExp, setMaxExp] = useState(3);
  const [graduationYear, setGraduationYear] = useState('');

  const [jobEmploymentType, setJobEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'>('FULL_TIME');
  const [workMode, setWorkMode] = useState('On-site');
  const [jobLocation, setJobLocation] = useState('');

  const [hiringManagerId, setHiringManagerId] = useState('');
  const [recruiterId, setRecruiterId] = useState('');
  const [hrbpId, setHrbpId] = useState('');

  const [jobMinSalaryLakh, setJobMinSalaryLakh] = useState(4);
  const [jobMaxSalaryLakh, setJobMaxSalaryLakh] = useState(8);

  const [applicationStartDate, setApplicationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobDeadline, setJobDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [jobVisibility, setJobVisibility] = useState('Public');

  const [interviewProcess, setInterviewProcess] = useState('Screening → Technical Assessment → Interview → HR Round');
  const [numInterviewRounds, setNumInterviewRounds] = useState(3);
  const [internalJustification, setInternalJustification] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Auto-fill when MR or Designation changes
  React.useEffect(() => {
    if (isFromMR && selectedMr) {
      setJobTitle(selectedMr.role || '');
      setJobQualification(selectedMr.qualification || 'Graduate / Technical Degree');
      setJobSkills(selectedMr.requiredSkills || '');
      setJobLocation(selectedMr.workLocation || '');
      if (selectedMr.managerId) {
        setHiringManagerId(selectedMr.managerId);
      }
    } else if (!isFromMR && standaloneDesignationId) {
      const selectedDes = designations.find((d: any) => d.id === standaloneDesignationId);
      if (selectedDes) {
        if (!jobTitle) setJobTitle(selectedDes.title);
        if (!jobQualification) setJobQualification(selectedDes.qualification || 'Graduate Degree');
        if (!jobSkills) setJobSkills(selectedDes.skills || '');
      }
    }
  }, [isFromMR, selectedMr, standaloneDesignationId, designations]);

  // ── Step Validation Functions ──
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!isFromMR) {
      if (!standaloneCompanyId) errors.standaloneCompanyId = 'Please select a Company Entity.';
      if (!standaloneBranchId) errors.standaloneBranchId = 'Please select a Branch Location.';
      if (!standaloneDepartmentId) errors.standaloneDepartmentId = 'Please select a Department.';
      if (!standaloneCostCenter.trim()) errors.standaloneCostCenter = 'Cost Center is required.';
      if (!standaloneDesignationId) errors.standaloneDesignationId = 'Please select a Designation / Job Role.';
      if (!standaloneNumPositions || standaloneNumPositions < 1) errors.standaloneNumPositions = 'Openings must be at least 1.';
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!jobTitle.trim() || jobTitle.length < 3) errors.jobTitle = 'Job Title must be at least 3 characters.';
    if (!jobSummary.trim() || jobSummary.length < 20) errors.jobSummary = 'Job Summary must be at least 20 characters.';
    if (!jobDescription.trim() || jobDescription.length < 50) errors.jobDescription = 'Detailed Job Description must be at least 50 characters.';
    if (!jobResponsibilities.trim() || jobResponsibilities.length < 20) errors.jobResponsibilities = 'Key Responsibilities must be at least 20 characters.';
    if (!jobQualification.trim()) errors.jobQualification = 'Required Qualification is required.';
    if (!jobSkills.trim()) errors.jobSkills = 'Required Skills are required.';

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (candidateType !== 'FRESHER') {
      if (minExp < 0) errors.minExp = 'Min Experience cannot be negative.';
      if (maxExp < minExp) errors.minExp = 'Max Experience must be greater than or equal to Min Experience.';
    }
    if (!hiringManagerId) errors.hiringManagerId = 'Please select a Hiring Manager.';
    if (!recruiterId) errors.recruiterId = 'Please select an Assigned Recruiter.';

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!isFromMR) {
      if (jobMinSalaryLakh <= 0) errors.jobMinSalaryLakh = 'Min Salary must be greater than 0.';
      if (jobMaxSalaryLakh < jobMinSalaryLakh) errors.jobMinSalaryLakh = 'Max Salary must be greater than or equal to Min Salary.';
    }
    if (!isFromMR && !jobLocation.trim()) errors.jobLocation = 'Work Location is required.';
    if (!jobDeadline) errors.jobDeadline = 'Application deadline date is required.';

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep5 = (targetStatus: string): boolean => {
    const errors: Record<string, string> = {};
    if (targetStatus === 'PENDING_APPROVAL') {
      const dummyText = ['ok', 'test', 'abc', 'testing', 'n/a', 'na'];
      const cleanedText = internalJustification.trim().toLowerCase();
      if (!cleanedText || cleanedText.length < 15 || dummyText.includes(cleanedText)) {
        errors.internalJustification = 'Please provide a meaningful business rationale (minimum 15 characters).';
      }
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (nextTab: typeof activeStepTab) => {
    if (activeStepTab === 'mr_ref') {
      if (!validateStep1()) {
        toast.error('Please complete all required fields in Step 1 (Organization Setup) before continuing.');
        return;
      }
    } else if (activeStepTab === 'posting') {
      if (!validateStep2()) {
        toast.error('Please complete all required fields in Step 2 (Job Details) before continuing.');
        return;
      }
    } else if (activeStepTab === 'requirements') {
      if (!validateStep3()) {
        toast.error('Please complete all required fields in Step 3 (Candidate & Team) before continuing.');
        return;
      }
    } else if (activeStepTab === 'compensation') {
      if (!validateStep4()) {
        toast.error('Please complete all required fields in Step 4 (Compensation & Dates) before continuing.');
        return;
      }
    }
    setActiveStepTab(nextTab);
  };

  // ── Create Job Opening Mutation ──
  const createJobReqMutation = useMutation({
    mutationFn: (data: any) => jobOpeningsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings-all'] });
      queryClient.invalidateQueries({ queryKey: ['job-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['approved-manpower-requisitions'] });

      const isDraft = variables.status === 'DRAFT';
      toast.success(
        isDraft
          ? 'Job Requisition saved as Draft.'
          : 'Job Requisition submitted successfully for Approval!'
      );
      navigate('/recruitment/requisitions');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit Job Requisition.');
    },
  });

  const handleSubmit = (targetStatus: 'DRAFT' | 'PENDING_APPROVAL') => {
    if (targetStatus === 'PENDING_APPROVAL') {
      if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5('PENDING_APPROVAL')) {
        toast.error('Validation failed. Please review highlighted inline errors across all steps.');
        return;
      }
    }

    const payload: any = {
      title: jobTitle.trim() || 'Job Requisition',
      summary: jobSummary.trim() || undefined,
      description: jobDescription.trim() || undefined,
      responsibilities: jobResponsibilities.trim() || undefined,
      qualification: isFromMR ? (selectedMr?.qualification || jobQualification) : jobQualification,
      preferredQualification: preferredQualification.trim() || undefined,
      skills: isFromMR ? (selectedMr?.requiredSkills || jobSkills) : jobSkills,
      preferredSkills: preferredSkills.trim() || undefined,
      certifications: certifications.trim() || undefined,
      benefits: benefits.trim() || undefined,

      candidateType,
      minExp: candidateType === 'FRESHER' ? 0 : Number(minExp),
      maxExp: candidateType === 'FRESHER' ? 1 : Number(maxExp),
      graduationYear: candidateType === 'FRESHER' ? graduationYear : undefined,

      employmentType: jobEmploymentType,
      workMode,
      location: isFromMR ? selectedMr?.workLocation : jobLocation,

      hiringManagerId: hiringManagerId || undefined,
      recruiterId: recruiterId || undefined,
      hrbpId: hrbpId || undefined,

      minSalary: isFromMR
        ? Number(selectedMr?.minSalary)
        : Math.round(Number(jobMinSalaryLakh) * 100000),
      maxSalary: isFromMR
        ? Number(selectedMr?.maxSalary)
        : Math.round(Number(jobMaxSalaryLakh) * 100000),

      applicationStartDate: applicationStartDate ? new Date(applicationStartDate).toISOString() : undefined,
      deadline: jobDeadline ? new Date(jobDeadline).toISOString() : undefined,
      visibility: jobVisibility,

      interviewProcess: interviewProcess.trim() || undefined,
      numRounds: Number(numInterviewRounds),
      internalJustification: internalJustification.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,

      status: targetStatus,
      isActive: false,
    };

    if (isFromMR && selectedMr) {
      payload.manpowerRequisitionId = selectedMr.id;
      payload.companyId = selectedMr.companyId;
      payload.branchId = selectedMr.branchId;
      payload.departmentId = selectedMr.departmentId;
      payload.designationId = selectedMr.designationId;
      payload.costCenter = selectedMr.costCenter;
      payload.positionsCount = selectedMr.numOpenings;
    } else {
      payload.companyId = standaloneCompanyId;
      payload.branchId = standaloneBranchId;
      payload.departmentId = standaloneDepartmentId;
      payload.designationId = standaloneDesignationId;
      payload.costCenter = standaloneCostCenter;
      payload.positionsCount = Number(standaloneNumPositions);
    }

    createJobReqMutation.mutate(payload);
  };

  const planCompany = isFromMR && selectedMr ? companies.find((c: any) => c.id === selectedMr.companyId) : null;
  const planBranch = isFromMR && selectedMr ? branches.find((b: any) => b.id === selectedMr.branchId) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Bar & Navigation ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <button
              onClick={() => navigate('/recruitment/requisitions')}
              className="hover:underline flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Job Requisitions
            </button>
            <ChevronRight className="h-3 w-3" />
            <span>Recruitment</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-foreground">
              {isFromMR ? 'Create Requisition from MR' : 'New Standalone Direct Requisition'}
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {isFromMR ? `Job Requisition (MR: ${selectedMr?.mrNumber || 'Approved'})` : 'Create Job Requisition'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enterprise recruitment workflow: Complete organization, specification, team assignment, and budget setup.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/recruitment/requisitions')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs font-semibold"
            onClick={() => handleSubmit('DRAFT')}
            disabled={createJobReqMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
            onClick={() => handleSubmit('PENDING_APPROVAL')}
            disabled={createJobReqMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" /> Submit for Approval
          </Button>
        </div>
      </div>

      {/* ── Compact Realtime Summary Bar ── */}
      <Card className="border-border/80 bg-muted/30">
        <CardContent className="p-3.5 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Company Entity</span>
            <span className="font-semibold truncate block">
              {isFromMR
                ? (planCompany?.name || 'Selected Company')
                : (companies.find((c: any) => c.id === standaloneCompanyId)?.name || 'Not Selected')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Branch Location</span>
            <span className="font-semibold truncate block">
              {isFromMR
                ? (planBranch?.name || 'Selected Branch')
                : (branches.find((b: any) => b.id === standaloneBranchId)?.name || 'Not Selected')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Department</span>
            <span className="font-semibold truncate block">
              {isFromMR
                ? selectedMr?.departmentName
                : (departments.find((d: any) => d.id === standaloneDepartmentId)?.name || 'Not Selected')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Designation / Role</span>
            <span className="font-semibold truncate block">
              {isFromMR
                ? selectedMr?.role
                : (designations.find((des: any) => des.id === standaloneDesignationId)?.title || 'Not Selected')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Approved Openings</span>
            <span className="font-bold text-primary block">
              +{isFromMR ? (selectedMr?.numOpenings || 1) : standaloneNumPositions} Pos
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium">Workflow Mode</span>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold mt-0.5 ${
                isFromMR
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
              }`}
            >
              {isFromMR ? 'APPROVED MR 🔒' : 'HEADCOUNT REVIEW'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Stepper Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleNextStep('mr_ref')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeStepTab === 'mr_ref'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border'
          }`}
        >
          <Building2 className="h-4 w-4" />
          {isFromMR ? '1. Approved MR 🔒' : '1. Organization Setup'}
          {(fieldErrors.standaloneCompanyId || fieldErrors.standaloneBranchId || fieldErrors.standaloneDepartmentId || fieldErrors.standaloneDesignationId) && (
            <span className="text-xs text-rose-500 font-bold">⚠️</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNextStep('posting')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeStepTab === 'posting'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border'
          }`}
        >
          <FileText className="h-4 w-4" /> 2. Job Specifications
          {(fieldErrors.jobTitle || fieldErrors.jobSummary || fieldErrors.jobDescription || fieldErrors.jobResponsibilities) && (
            <span className="text-xs text-rose-500 font-bold">⚠️</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNextStep('requirements')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeStepTab === 'requirements'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border'
          }`}
        >
          <Users className="h-4 w-4" /> 3. Candidate & Team
          {(fieldErrors.minExp || fieldErrors.hiringManagerId || fieldErrors.recruiterId) && (
            <span className="text-xs text-rose-500 font-bold">⚠️</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNextStep('compensation')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeStepTab === 'compensation'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border'
          }`}
        >
          <DollarSign className="h-4 w-4" /> 4. Compensation & Dates
          {(fieldErrors.jobMinSalaryLakh || fieldErrors.jobDeadline) && (
            <span className="text-xs text-rose-500 font-bold">⚠️</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNextStep('interview')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeStepTab === 'interview'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border'
          }`}
        >
          <Sparkles className="h-4 w-4" /> 5. Interview & Internal
          {fieldErrors.internalJustification && <span className="text-xs text-rose-500 font-bold">⚠️</span>}
        </button>
      </div>

      {/* ── STEP CONTENT ── */}
      <Card className="shadow-xs border-border">
        <CardContent className="p-6 text-xs space-y-6">
          {/* STEP 1: ORGANIZATION SETUP */}
          {activeStepTab === 'mr_ref' && (
            isFromMR && selectedMr ? (
              <div className="space-y-6">
                <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                    <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                      <Building2 className="h-5 w-5" /> Approved Manpower Requisition (Source of Truth)
                    </h4>
                    <Badge variant="outline" className="bg-background text-xs text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" /> Locked Headcount Budget
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">MR Number (Auto)</Label>
                      <p className="font-mono font-bold text-base text-primary mt-0.5">{selectedMr.mrNumber}</p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Manpower Plan Ref</Label>
                      <p className="font-mono font-bold text-xs text-foreground mt-0.5">{selectedMr.manpowerPlanId || 'MP-07'}</p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Company (Locked)</Label>
                      <p className="font-semibold text-xs text-foreground mt-0.5 truncate flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {planCompany?.name || 'CODIGIX_A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Branch (Locked)</Label>
                      <p className="font-semibold text-xs text-foreground mt-0.5 truncate flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {planBranch?.name ? `${planBranch.name} (${planBranch.city || 'Nashik'})` : 'NASHIK DEVELOPMENT'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Department (Locked)</Label>
                      <p className="font-semibold text-xs text-foreground mt-0.5">{selectedMr.departmentName}</p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Cost Center (Locked)</Label>
                      <p className="font-mono font-semibold text-xs text-foreground mt-0.5">{selectedMr.costCenter}</p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Designation / Role (Locked)</Label>
                      <p className="font-semibold text-xs text-foreground mt-0.5">{selectedMr.role}</p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Approved Openings</Label>
                      <div className="mt-0.5">
                        <Badge className="bg-primary/10 text-primary border-primary/30 font-mono font-bold text-xs">
                          +{selectedMr.numOpenings} Openings Approved
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    className="text-xs font-semibold gap-2"
                    onClick={() => handleNextStep('posting')}
                  >
                    Next: Job Specifications &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {duplicateActiveReq && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm block text-amber-900 dark:text-amber-200">Active Requisition Already Exists</span>
                      An active requisition ({duplicateActiveReq.requisitionCode || duplicateActiveReq.title}) already exists for this Designation in this Department. Requisition Status: <strong className="font-mono">{duplicateActiveReq.status}</strong>.
                    </div>
                  </div>
                )}

                <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                        <Building2 className="h-5 w-5" /> 1. Organization & Headcount Setup (Standalone Direct Requisition)
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select organization details in sequence: Company &rarr; Branch &rarr; Department &rarr; Cost Center &rarr; Designation.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-background text-xs text-blue-600 border-blue-500/30 gap-1 font-semibold shrink-0">
                      <Sparkles className="h-3.5 w-3.5" /> Direct Setup
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Company */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Company Entity *</Label>
                      <Select value={standaloneCompanyId} onValueChange={handleCompanyChange}>
                        <SelectTrigger className="h-9 text-xs bg-background font-semibold">
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
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Branch Location *</Label>
                      <Select
                        value={standaloneBranchId}
                        onValueChange={handleBranchChange}
                        disabled={!standaloneCompanyId}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
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
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Department *</Label>
                      <Select
                        value={standaloneDepartmentId}
                        onValueChange={handleDepartmentChange}
                        disabled={!standaloneBranchId}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
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
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Cost Center *</Label>
                      {costCenters.length > 0 ? (
                        <Select
                          value={standaloneCostCenter}
                          onValueChange={(v) => {
                            setStandaloneCostCenter(v);
                            setFieldErrors((prev) => ({ ...prev, standaloneCostCenter: '' }));
                          }}
                          disabled={!standaloneDepartmentId}
                        >
                          <SelectTrigger className="h-9 text-xs bg-background font-mono font-semibold">
                            <SelectValue placeholder={standaloneDepartmentId ? 'Select Cost Center' : 'Select Department first'} />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 overflow-y-auto">
                            {costCenters.map((cc: any) => (
                              <SelectItem key={cc.id} value={`${cc.code} - ${cc.name}`} className="text-xs font-mono">
                                {cc.code} - {cc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="text"
                          value={standaloneCostCenter}
                          onChange={(e) => {
                            setStandaloneCostCenter(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, standaloneCostCenter: '' }));
                          }}
                          disabled={!standaloneDepartmentId}
                          placeholder={standaloneDepartmentId ? 'e.g. CC-101 - IT Operations' : 'Select Department first'}
                          className="h-9 text-xs bg-background font-mono font-semibold"
                        />
                      )}
                      {fieldErrors.standaloneCostCenter && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.standaloneCostCenter}</p>
                      )}
                    </div>

                    {/* 5. Designation */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Designation / Job Role *</Label>
                      <Select
                        value={standaloneDesignationId}
                        onValueChange={(v) => {
                          setStandaloneDesignationId(v);
                          setFieldErrors((prev) => ({ ...prev, standaloneDesignationId: '' }));
                        }}
                        disabled={!standaloneDepartmentId}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background font-semibold">
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
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Number of Openings *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={standaloneNumPositions}
                        onChange={(e) => {
                          setStandaloneNumPositions(Math.max(1, Math.floor(Number(e.target.value))));
                          setFieldErrors((prev) => ({ ...prev, standaloneNumPositions: '' }));
                        }}
                        className="h-9 text-xs font-mono font-bold bg-background text-primary"
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
                    className="text-xs font-semibold gap-2"
                    onClick={() => handleNextStep('posting')}
                  >
                    Next: Job Specifications &rarr;
                  </Button>
                </div>
              </div>
            )
          )}

          {/* STEP 2: JOB POSTING SPECIFICATIONS */}
          {activeStepTab === 'posting' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
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
                    className="h-9 text-xs bg-background font-semibold text-foreground"
                    placeholder="e.g. Software Engineer / Senior Full Stack Developer"
                  />
                  {fieldErrors.jobTitle && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobTitle}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
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
                    className="h-9 text-xs bg-background"
                    placeholder="Short 1-2 sentence overview for career portal card..."
                  />
                  {fieldErrors.jobSummary && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobSummary}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
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
                    className="text-xs min-h-[100px]"
                    rows={4}
                    placeholder="Provide full job description including team overview, projects, domain expectations, and growth opportunities..."
                  />
                  {fieldErrors.jobDescription && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobDescription}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
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
                    className="text-xs min-h-[100px]"
                    rows={4}
                    placeholder="• Architect, build and maintain scalable features&#10;• Collaborate with cross-functional teams to deliver quality results&#10;• Conduct code reviews and mentor junior team members"
                  />
                  {fieldErrors.jobResponsibilities && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobResponsibilities}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">
                    Required Qualification * {isFromMR ? '(Locked from MR)' : ''}
                  </Label>
                  <Input
                    type="text"
                    readOnly={isFromMR}
                    value={isFromMR ? (selectedMr?.qualification || jobQualification || 'As per Designation Specification') : jobQualification}
                    onChange={(e) => {
                      setJobQualification(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, jobQualification: '' }));
                    }}
                    className={`h-9 text-xs ${isFromMR ? 'bg-muted/60 font-semibold cursor-not-allowed text-foreground' : 'bg-background'}`}
                    placeholder="e.g. B.Tech / M.Tech / MCA / Graduate"
                  />
                  {fieldErrors.jobQualification && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobQualification}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Preferred Qualification</Label>
                  <Input
                    type="text"
                    value={preferredQualification}
                    onChange={(e) => setPreferredQualification(e.target.value)}
                    className="h-9 text-xs bg-background"
                    placeholder="e.g. M.Tech / AWS Certified / Honors Graduate"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">
                    Required Skills * {isFromMR ? '(Locked from MR)' : ''}
                  </Label>
                  <Input
                    type="text"
                    readOnly={isFromMR}
                    value={isFromMR ? (selectedMr?.requiredSkills || jobSkills || 'As per Role Specification') : jobSkills}
                    onChange={(e) => {
                      setJobSkills(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, jobSkills: '' }));
                    }}
                    className={`h-9 text-xs ${isFromMR ? 'bg-muted/60 font-semibold cursor-not-allowed text-foreground' : 'bg-background'}`}
                    placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                  />
                  {fieldErrors.jobSkills && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobSkills}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Preferred Skills</Label>
                  <Input
                    type="text"
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    className="h-9 text-xs bg-background"
                    placeholder="e.g. Docker, Kubernetes, GraphQL, System Design"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setActiveStepTab('mr_ref')}>
                  &larr; Previous
                </Button>
                <Button type="button" size="sm" className="text-xs font-semibold gap-1.5" onClick={() => handleNextStep('requirements')}>
                  Next: Candidate & Team &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CANDIDATE REQUIREMENTS & HIRING TEAM */}
          {activeStepTab === 'requirements' && (
            <div className="space-y-6">
              {/* Candidate Eligibility Selector */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Experience Type *</Label>
                    <Select value={candidateType} onValueChange={(v: any) => setCandidateType(v)}>
                      <SelectTrigger className="h-9 text-xs bg-background">
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
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="font-semibold text-xs">Graduation / Passing Year</Label>
                      <Input
                        type="text"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="e.g. 2024 / 2025 / 2026"
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-xs">Min Exp (Years) *</Label>
                        <Input
                          type="number"
                          min={0}
                          value={minExp}
                          onChange={(e) => {
                            setMinExp(Number(e.target.value));
                            setFieldErrors((prev) => ({ ...prev, minExp: '' }));
                          }}
                          className="h-9 text-xs font-mono bg-background"
                        />
                        {fieldErrors.minExp && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.minExp}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-xs">Max Exp (Years) *</Label>
                        <Input
                          type="number"
                          min={0}
                          value={maxExp}
                          onChange={(e) => {
                            setMaxExp(Number(e.target.value));
                            setFieldErrors((prev) => ({ ...prev, minExp: '' }));
                          }}
                          className="h-9 text-xs font-mono bg-background"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hiring Team Assignment */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-2 border-b pb-2">
                  <Users className="h-4 w-4 text-primary" /> Hiring Team Assignment (Filtered Employee Master)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Hiring Manager *</Label>
                    <Select
                      value={hiringManagerId}
                      onValueChange={(v) => {
                        setHiringManagerId(v);
                        setFieldErrors((prev) => ({ ...prev, hiringManagerId: '' }));
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background font-semibold">
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

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Assigned Recruiter *</Label>
                    <Select
                      value={recruiterId}
                      onValueChange={(v) => {
                        setRecruiterId(v);
                        setFieldErrors((prev) => ({ ...prev, recruiterId: '' }));
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background font-semibold">
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

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">HR Business Partner (HRBP)</Label>
                    <Select value={hrbpId} onValueChange={setHrbpId}>
                      <SelectTrigger className="h-9 text-xs bg-background">
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

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setActiveStepTab('posting')}>
                  &larr; Previous
                </Button>
                <Button type="button" size="sm" className="text-xs font-semibold gap-1.5" onClick={() => handleNextStep('compensation')}>
                  Next: Compensation & Dates &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: COMPENSATION & DATES */}
          {activeStepTab === 'compensation' && (
            <div className="space-y-6">
              {/* Employment & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Employment Type *</Label>
                  <Select value={jobEmploymentType} onValueChange={(v: any) => setJobEmploymentType(v)}>
                    <SelectTrigger className="h-9 text-xs bg-background font-semibold">
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

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Work Mode *</Label>
                  <Select value={workMode} onValueChange={setWorkMode}>
                    <SelectTrigger className="h-9 text-xs bg-background font-semibold">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On-site" className="text-xs">On-site</SelectItem>
                      <SelectItem value="Hybrid" className="text-xs">Hybrid</SelectItem>
                      <SelectItem value="Remote" className="text-xs">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">
                    Work Location {isFromMR ? '(Locked from MR)' : '*'}
                  </Label>
                  <Input
                    type="text"
                    readOnly={isFromMR}
                    value={isFromMR ? (selectedMr?.workLocation || 'Nashik Center') : jobLocation}
                    onChange={(e) => {
                      setJobLocation(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, jobLocation: '' }));
                    }}
                    className={`h-9 text-xs ${isFromMR ? 'bg-muted/60 font-semibold cursor-not-allowed text-foreground' : 'bg-background'}`}
                    placeholder="e.g. Nashik Development Center / Remote"
                  />
                  {fieldErrors.jobLocation && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobLocation}</p>}
                </div>
              </div>

              {/* Compensation Details */}
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 space-y-4">
                <h4 className="font-semibold text-xs text-primary flex items-center justify-between border-b border-primary/20 pb-2">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Compensation Budget Range {isFromMR ? '(Locked from MR)' : ''}
                  </span>
                  <Badge variant="outline" className="bg-background text-xs text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Salary Band
                  </Badge>
                </h4>

                {isFromMR && selectedMr ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Minimum Annual CTC (Locked from MR)</Label>
                      <p className="font-mono font-bold text-base text-primary mt-0.5">
                        {formatSalaryInLakhs(selectedMr.minSalary >= 1000 ? selectedMr.minSalary : selectedMr.minSalary * 100000)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Stored: ₹{(selectedMr.minSalary >= 1000 ? selectedMr.minSalary : Math.round(selectedMr.minSalary * 100000)).toLocaleString('en-IN')} / year
                      </p>
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Maximum Annual CTC (Locked from MR)</Label>
                      <p className="font-mono font-bold text-base text-primary mt-0.5">
                        {formatSalaryInLakhs(selectedMr.maxSalary >= 1000 ? selectedMr.maxSalary : selectedMr.maxSalary * 100000)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Stored: ₹{(selectedMr.maxSalary >= 1000 ? selectedMr.maxSalary : Math.round(selectedMr.maxSalary * 100000)).toLocaleString('en-IN')} / year
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
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
                          className="h-9 text-xs font-mono font-bold bg-background text-primary"
                        />
                        {fieldErrors.jobMinSalaryLakh && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobMinSalaryLakh}</p>}
                      </div>
                      <div className="space-y-1.5">
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
                          className="h-9 text-xs font-mono font-bold bg-background text-primary"
                        />
                      </div>
                    </div>

                    <div className="bg-background p-3 rounded-lg border border-border/70 flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground text-[11px]">Formatted CTC Band:</span>
                      <span className="font-bold text-primary">
                        ₹{jobMinSalaryLakh.toFixed(2)} Lakh – ₹{jobMaxSalaryLakh.toFixed(2)} Lakh / year
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dates & Job Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Application Start Date *</Label>
                  <Input
                    type="date"
                    value={applicationStartDate}
                    onChange={(e) => setApplicationStartDate(e.target.value)}
                    className="h-9 text-xs bg-background font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Application Deadline *</Label>
                  <Input
                    type="date"
                    value={jobDeadline}
                    onChange={(e) => {
                      setJobDeadline(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, jobDeadline: '' }));
                    }}
                    className="h-9 text-xs bg-background font-mono"
                  />
                  {fieldErrors.jobDeadline && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.jobDeadline}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Job Visibility *</Label>
                  <Select value={jobVisibility} onValueChange={setJobVisibility}>
                    <SelectTrigger className="h-9 text-xs bg-background font-semibold">
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

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setActiveStepTab('requirements')}>
                  &larr; Previous
                </Button>
                <Button type="button" size="sm" className="text-xs font-semibold gap-1.5" onClick={() => handleNextStep('interview')}>
                  Next: Interview & Internal &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: INTERVIEW PROCESS & INTERNAL INFORMATION */}
          {activeStepTab === 'interview' && (
            <div className="space-y-6">
              {/* Interview Process Configuration */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-2 border-b pb-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Interview Process & Evaluation Setup
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="font-semibold text-xs">Interview Process Stages</Label>
                    <Input
                      type="text"
                      value={interviewProcess}
                      onChange={(e) => setInterviewProcess(e.target.value)}
                      className="h-9 text-xs bg-background"
                      placeholder="e.g. Screening → Technical Assessment → Technical Interview → HR Round"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Number of Rounds</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={numInterviewRounds}
                      onChange={(e) => setNumInterviewRounds(Number(e.target.value))}
                      className="h-9 text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Information & Rationale */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-2 border-b pb-2">
                  <FileText className="h-4 w-4 text-primary" /> Internal Information & Hiring Rationale
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
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
                      className="text-xs min-h-[70px]"
                      rows={3}
                      placeholder="Provide detailed business rationale for headcount requirement..."
                    />
                    {fieldErrors.internalJustification && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fieldErrors.internalJustification}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Internal Notes & Budget Comments</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="text-xs min-h-[70px]"
                      rows={3}
                      placeholder="Special budget notes or internal recruiter instructions..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setActiveStepTab('compensation')}>
                  &larr; Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={createJobReqMutation.isPending}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                    onClick={() => handleSubmit('PENDING_APPROVAL')}
                    disabled={createJobReqMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Submit for Approval
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
