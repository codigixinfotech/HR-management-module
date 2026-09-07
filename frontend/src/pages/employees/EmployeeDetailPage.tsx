import { useRef, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Trash2, Plus, Check, Laptop, ShieldAlert, Award, FileText, CheckCircle2, Camera, AlertCircle, ShieldCheck, ArrowRight, IndianRupee, Briefcase, Calendar, Clock, Sparkles, Building, UserCheck, RefreshCw, UserX } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { assetsApi } from '@/api/asset-management';
import { payGradesApi } from '@/api/cost-grades';
import { exitsApi } from '@/api/exits';
import { salaryAssignmentsApi } from '@/api/payroll';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import type { ApprovalStatus, EmployeeStatus } from '@/api/types';
import { RegisterFaceModal } from './RegisterFaceModal';

const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'PROBATION', 'NOTICE_PERIOD', 'EXITED'];

export default function EmployeeDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const id = rawId === 'me' || !rawId ? 'me' : rawId;
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog State controls
  const [docType, setDocType] = useState('ID_PROOF');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('HR');

  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetRemarks, setAssetRemarks] = useState('');

  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseType, setCourseType] = useState('Technical');
  const [courseStatus, setCourseStatus] = useState('In Progress');
  const [courseCert, setCourseCert] = useState('');

  const [isKpiOpen, setIsKpiOpen] = useState(false);
  const [kpiTitle, setKpiTitle] = useState('');
  const [kpiCategory, setKpiCategory] = useState('Quality');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiWeight, setKpiWeight] = useState(10);
  const [kpiPeriod, setKpiPeriod] = useState('Q3 2026');
  const [kpiRating, setKpiRating] = useState('');
  const [kpiFeedback, setKpiFeedback] = useState('');

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('General');
  const [noteAuthor, setNoteAuthor] = useState('HR Administrator');

  const [isRegisterFaceOpen, setIsRegisterFaceOpen] = useState(false);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);

  // Final Probation Review & Evaluation Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'CONFIRM' | 'EXTEND' | 'NOT_CONFIRM'>('CONFIRM');

  // Option 1: Confirm state
  const [confirmAuthority, setConfirmAuthority] = useState('HR + Management');
  const [confirmRemarks, setConfirmRemarks] = useState('Employee has successfully met performance benchmarks.');

  // Option 2: Extend state
  const [extensionPeriod, setExtensionPeriod] = useState('3 Months');
  const [extensionReason, setExtensionReason] = useState('Performance improvement required');
  const [improvementAreas, setImprovementAreas] = useState('Machine operation / production accuracy');
  const [supportTraining, setSupportTraining] = useState('Additional machine training');
  const [extensionReviewBy, setExtensionReviewBy] = useState('Reporting Manager + HR');
  const [employeeComments, setEmployeeComments] = useState('');

  // Option 3: Do Not Confirm state
  const [nonConfirmReason, setNonConfirmReason] = useState('Performance did not meet required standards');
  const [nonConfirmNoticeDays, setNonConfirmNoticeDays] = useState(15);
  const [nonConfirmFeedback, setNonConfirmFeedback] = useState('Performance benchmarks and production criteria were not fulfilled during the statutory evaluation period.');

  // Contract Lifecycle & Renewal Action Modal States
  const [isContractActionOpen, setIsContractActionOpen] = useState(false);
  const [contractActionTab, setContractActionTab] = useState<'RENEW' | 'CONVERT_PERMANENT' | 'DO_NOT_RENEW'>('RENEW');

  // Form 1: Renew Contract state
  const [renewReason, setRenewReason] = useState('Satisfactory performance and operational continuity for next term.');
  const [renewSalaryRevision, setRenewSalaryRevision] = useState('+8% Standard annual revision');
  const [renewDocFile, setRenewDocFile] = useState('');
  const [renewManagerRec, setRenewManagerRec] = useState('Approved');
  const [renewHrApproval, setRenewHrApproval] = useState('Required');

  // Form 2: Convert to Permanent state
  const [convertEffectiveDate, setConvertEffectiveDate] = useState('2027-09-07');
  const [convertReason, setConvertReason] = useState('Regularized to permanent employment based on contract tenure performance.');
  const [convertManagerRec, setConvertManagerRec] = useState('Approved');
  const [convertHrApproval, setConvertHrApproval] = useState('Required');
  const [convertDocFile, setConvertDocFile] = useState('Permanent_Regularization_Letter.pdf');

  // Form 3: Do Not Renew state
  const [nonRenewReason, setNonRenewReason] = useState('Contract Term Concluded');
  const [nonRenewNoticeDays, setNonRenewNoticeDays] = useState(30);
  const [nonRenewManagerComments, setNonRenewManagerComments] = useState('Project milestones completed; contract reaching scheduled expiry.');
  const [nonRenewHrComments, setNonRenewHrComments] = useState('Separation protocol initiated with 30-day exit clearance.');

  const formatDateDisplay = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return 'Pending';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Pending';
    const monList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const mon = monList[d.getMonth()];
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
  };

  // Queries
  const { data: employee, isLoading, isError } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await employeesApi.get(id!);
      if (rawId === 'me' && res && authUser) {
        // Sync auth store employee state with database record
        setUser({
          ...authUser,
          employee: {
            id: res.id,
            employeeCode: res.employeeCode,
            firstName: res.firstName,
            lastName: res.lastName,
            fullName: `${res.firstName} ${res.lastName}`,
            departmentId: res.departmentId,
            departmentName: res.department?.name || null,
            designationId: res.designationId,
            designationTitle: res.designation?.title || null,
          },
        });
      }
      return res;
    },
    enabled: !!id,
    retry: 1,
  });

  const targetEmpId = employee?.id || id;

  const { data: salaryAssignmentsList = [] } = useQuery({
    queryKey: ['employee-salary-assignments', targetEmpId],
    queryFn: () => salaryAssignmentsApi.list(undefined, targetEmpId),
    enabled: !!targetEmpId && targetEmpId !== 'me',
  });

  const activeSalaryAssignment =
    salaryAssignmentsList.find((a: any) => a.status === 'ACTIVE') ||
    (employee as any)?.salaryAssignment ||
    salaryAssignmentsList[0];

  const { data: employeeExits = [] } = useQuery({
    queryKey: ['employee-exits', targetEmpId],
    queryFn: () => exitsApi.list({ search: targetEmpId }),
    enabled: !!targetEmpId,
  });
  const activeExitRecord = employeeExits[0] || null;

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list(),
  });

  const { data: payGrades = [] } = useQuery({
    queryKey: ['pay-grades'],
    queryFn: () => payGradesApi.list(),
  });

  const getGradeLevelDisplay = (gradeVal?: string | null, levelVal?: string | null) => {
    if (!gradeVal && !levelVal) return '-';
    const matched = payGrades.find(pg => pg.id === gradeVal || pg.gradeCode === gradeVal);
    if (matched) {
      const gCode = matched.gradeCode;
      const lvl = (levelVal && !levelVal.startsWith('cm') && levelVal.length <= 10) ? levelVal : matched.level;
      return `${gCode} / ${lvl || 'L1'}`;
    }
    if (gradeVal && (gradeVal.startsWith('cm') || gradeVal.length > 20)) {
      if (levelVal && !levelVal.startsWith('cm') && levelVal.length <= 10) {
        return levelVal;
      }
      return 'E2 / L1';
    }
    const g = gradeVal || '-';
    const l = levelVal || '';
    if (!l || g === l) return g;
    return `${g} / ${l}`;
  };

  const availableAssets = assets.filter(a => a.status === 'IN_STOCK');

  const probationDetailCheckpoints = useMemo(() => {
    if (!employee) return null;
    const sDateStr = employee.dateOfJoining;
    if (!sDateStr) return null;
    const sDate = new Date(sDateStr);
    if (isNaN(sDate.getTime())) return null;

    const probStr = employee.probationPeriod || '6 Months';
    const match = probStr.match(/(\d+)/);
    const months = match ? parseInt(match[1], 10) : 6;

    let eDate = employee.probationEndDate ? new Date(employee.probationEndDate) : new Date(sDate);
    if (!employee.probationEndDate) {
      eDate = new Date(sDate);
      eDate.setMonth(eDate.getMonth() + months);
      eDate.setDate(eDate.getDate() - 1);
    }

    // 90-Day Review Checkpoint (approx 90 days after joining)
    const ninetyDayDate = new Date(sDate);
    ninetyDayDate.setDate(ninetyDayDate.getDate() + 90);

    const remDate = new Date(eDate);
    remDate.setDate(remDate.getDate() - 15);

    return {
      joined: formatDateDisplay(sDate),
      ninetyDayReview: formatDateDisplay(ninetyDayDate),
      midReview: formatDateDisplay(ninetyDayDate),
      hrReminder: formatDateDisplay(remDate),
      finalDecision: formatDateDisplay(eDate),
      months,
      endDateFormatted: formatDateDisplay(eDate),
      rawStartDate: sDate,
      rawEndDate: eDate,
    };
  }, [employee]);

  const currentProbationEndDate = useMemo(() => {
    if (employee?.probationEndDate) return new Date(employee.probationEndDate);
    if (probationDetailCheckpoints?.rawEndDate) return probationDetailCheckpoints.rawEndDate;
    return new Date('2027-03-06');
  }, [employee, probationDetailCheckpoints]);

  const calculatedNewEndDate = useMemo(() => {
    const extMonths = parseInt(extensionPeriod, 10) || 3;
    const d = new Date(currentProbationEndDate);
    d.setMonth(d.getMonth() + extMonths);
    return d;
  }, [currentProbationEndDate, extensionPeriod]);

  const calculatedLastWorkingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + Number(nonConfirmNoticeDays || 15));
    return d;
  }, [nonConfirmNoticeDays]);

  const latestProbationReviewNote = useMemo(() => {
    if (!employee?.hrNotes || employee.hrNotes.length === 0) return null;
    return employee.hrNotes.find((n: any) =>
      n.noteType === 'PROBATION_CONFIRMATION' ||
      n.noteType === 'PROBATION_EXTENSION' ||
      n.noteType === 'PROBATION_NON_CONFIRMATION'
    ) || null;
  }, [employee?.hrNotes]);

  const parsedReviewData = useMemo(() => {
    if (!latestProbationReviewNote) return null;
    try {
      return JSON.parse(latestProbationReviewNote.note);
    } catch {
      return null;
    }
  }, [latestProbationReviewNote]);

  const contractHistoryList = useMemo(() => {
    const list: any[] = [];
    (employee?.hrNotes || []).forEach((n: any) => {
      if (n.noteType === 'CONTRACT_DETAILS') {
        try {
          const p = JSON.parse(n.note);
          list.push({ ...p, id: n.id, createdAt: n.createdDate });
        } catch {}
      }
    });
    return list;
  }, [employee]);

  const activeContractVersion = useMemo(() => {
    if (contractHistoryList.length > 0) {
      return contractHistoryList[0];
    }
    const code = employee?.employeeCode?.replace(/^EMP-?/i, '') || '00002';
    return {
      contractNumber: `CNT-2026-${code.padStart(5, '0')}`,
      contractStartDate: employee?.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '2026-09-07',
      contractEndDate: '2027-09-06',
      contractDuration: '12 Months',
      contractStatus: 'Active',
      contractType: 'Fixed Term',
      renewalStatus: 'Pending',
      contractDocument: `CNT-2026-${code.padStart(5, '0')}_Agreement.pdf`,
      version: 'v1.0 (Current)',
    };
  }, [contractHistoryList, employee]);

  const nextContractNumber = useMemo(() => {
    const code = employee?.employeeCode?.replace(/^EMP-?/i, '') || '00008';
    return `CNT-2027-${code.padStart(5, '0')}`;
  }, [employee]);

  const isNonConfirmed = employee?.status === 'NOTICE_PERIOD' || latestProbationReviewNote?.noteType === 'PROBATION_NON_CONFIRMATION';

  const isExtended = !isNonConfirmed && (
    latestProbationReviewNote?.noteType === 'PROBATION_EXTENSION' ||
    (employee?.status === 'PROBATION' && employee?.hrNotes?.some((n: any) => n.noteType === 'PROBATION_EXTENSION'))
  );

  const isInProbation = !isNonConfirmed && !isExtended && employee?.status === 'PROBATION';

  const isConfirmedOrActive = !isNonConfirmed && !isExtended && employee?.status !== 'PROBATION' && (employee?.status === 'ACTIVE' || employee?.status === 'CONFIRMED');

  const isContractType = employee?.employmentType === 'CONTRACT' || String(employee?.employmentType || '').startsWith('CONTRACT') || employee?.employmentType === 'TEMPORARY';
  const isPermanentType = employee?.employmentType === 'PERMANENT';

  const submitProbationReviewMutation = useMutation({
    mutationFn: async () => {
      if (reviewDecision === 'CONFIRM') {
        const effDate = employee?.probationEndDate || new Date().toISOString().split('T')[0];
        await employeesApi.update(targetEmpId, {
          status: 'ACTIVE',
          confirmationDate: effDate,
          confirmationReviewBy: confirmAuthority,
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'PROBATION_CONFIRMATION',
          note: JSON.stringify({
            decision: 'CONFIRM',
            effectiveDate: effDate,
            authority: confirmAuthority,
            remarks: confirmRemarks,
            employmentType: employee?.employmentType,
            letterGenerated: true,
          }),
          createdBy: authUser?.name || 'HR & Management Committee',
        });
      } else if (reviewDecision === 'EXTEND') {
        const newEndStr = calculatedNewEndDate.toISOString().split('T')[0];
        const extMonths = parseInt(extensionPeriod, 10) || 3;
        const totalMonths = (probationDetailCheckpoints?.months || 6) + extMonths;
        await employeesApi.update(targetEmpId, {
          status: 'PROBATION',
          probationEndDate: newEndStr,
          probationPeriod: `${totalMonths} Months`,
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'PROBATION_EXTENSION',
          note: JSON.stringify({
            decision: 'EXTEND',
            originalEndDate: probationDetailCheckpoints?.endDateFormatted || '06-Mar-2027',
            newEndDate: formatDateDisplay(calculatedNewEndDate),
            extensionPeriod,
            reason: extensionReason,
            improvementAreas,
            supportTraining,
            reviewBy: extensionReviewBy,
            comments: employeeComments,
            extensionCount: (employee?.hrNotes?.filter((n: any) => n.noteType === 'PROBATION_EXTENSION').length || 0) + 1,
            nextReview: formatDateDisplay(new Date(calculatedNewEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)),
          }),
          createdBy: authUser?.name || 'Reporting Manager + HR',
        });
      } else if (reviewDecision === 'NOT_CONFIRM') {
        await employeesApi.update(targetEmpId, {
          status: 'NOTICE_PERIOD',
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'PROBATION_NON_CONFIRMATION',
          note: JSON.stringify({
            decision: 'NOT_CONFIRM',
            decisionDate: formatDateDisplay(new Date()),
            reason: nonConfirmReason,
            noticePeriodDays: nonConfirmNoticeDays,
            lastWorkingDate: formatDateDisplay(calculatedLastWorkingDate),
            feedback: nonConfirmFeedback,
            exitWorkflowInitiated: true,
          }),
          createdBy: authUser?.name || 'HR Department',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      setIsReviewModalOpen(false);
      if (reviewDecision === 'CONFIRM') {
        toast.success(
          isPermanentType
            ? 'Employee confirmed as Permanent Staff! Confirmation letter archived in Document Vault.'
            : 'Probation completed! Contract remains active and in good standing.'
        );
      } else if (reviewDecision === 'EXTEND') {
        toast.success(`Probation extended by ${extensionPeriod}. New end date: ${formatDateDisplay(calculatedNewEndDate)}`);
      } else {
        toast.warning('Non-confirmation recorded. Exit and offboarding workflow initiated.');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit probation review');
    }
  });

  const submitContractActionMutation = useMutation({
    mutationFn: async () => {
      if (contractActionTab === 'RENEW') {
        await employeesApi.update(targetEmpId, {
          contractStatus: 'Active',
          contractRenewalDecision: 'Renewal Approved',
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'CONTRACT_DETAILS',
          note: JSON.stringify({
            contractType: 'Fixed Term',
            contractNumber: nextContractNumber,
            contractStartDate: '2027-09-07',
            contractEndDate: '2028-09-06',
            contractDuration: '12 Months',
            contractStatus: 'Active',
            renewalStatus: 'Approved',
            renewalReason: renewReason,
            salaryRevision: renewSalaryRevision,
            contractDocument: renewDocFile || `${nextContractNumber}_Renewal_Agreement.pdf`,
            managerRecommendation: renewManagerRec,
            hrApproval: renewHrApproval,
            version: `v${contractHistoryList.length + 2}.0 (Current)`,
          }),
          createdBy: authUser?.name || 'HR Management',
        });
      } else if (contractActionTab === 'CONVERT_PERMANENT') {
        await employeesApi.update(targetEmpId, {
          employmentType: 'PERMANENT',
          status: 'ACTIVE',
          confirmationDate: convertEffectiveDate || new Date().toISOString().split('T')[0],
          confirmationReviewBy: authUser?.name || 'HR Management Board',
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'CONTRACT_DETAILS',
          note: JSON.stringify({
            ...activeContractVersion,
            contractStatus: 'Converted to Permanent',
            renewalStatus: 'Converted to Permanent',
            conversionEffectiveDate: convertEffectiveDate,
            reason: convertReason,
            managerRecommendation: convertManagerRec,
            hrApproval: convertHrApproval,
            document: convertDocFile,
          }),
          createdBy: authUser?.name || 'Management Board',
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'PROBATION_CONFIRMATION',
          note: JSON.stringify({
            decision: 'PERMANENT_REGULARIZATION',
            effectiveDate: convertEffectiveDate,
            authority: authUser?.name || 'HR Management Board',
            remarks: convertReason,
            continuousServiceFrom: employee?.dateOfJoining,
          }),
          createdBy: authUser?.name || 'Management Board',
        });
      } else if (contractActionTab === 'DO_NOT_RENEW') {
        await employeesApi.update(targetEmpId, {
          status: 'NOTICE_PERIOD',
          dateOfExit: activeContractVersion.contractEndDate || '2027-09-06',
        });
        await employeesApi.addHrNote(targetEmpId, {
          noteType: 'CONTRACT_DETAILS',
          note: JSON.stringify({
            ...activeContractVersion,
            contractStatus: 'Non-Renewal Approved',
            renewalStatus: 'Do Not Renew',
            nonRenewReason,
            noticeDays: nonRenewNoticeDays,
            managerComments: nonRenewManagerComments,
            hrComments: nonRenewHrComments,
            finalDecisionDate: new Date().toISOString().split('T')[0],
          }),
          createdBy: authUser?.name || 'HR Operations',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      setIsContractActionOpen(false);
      if (contractActionTab === 'RENEW') {
        toast.success(`Contract renewed successfully! New Version created: ${nextContractNumber}`);
      } else if (contractActionTab === 'CONVERT_PERMANENT') {
        toast.success('Employee successfully regularized to Permanent Employment!');
      } else {
        toast.warning('Contract non-renewal approved. Status transitioned to Notice Period & Exit workflow.');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit contract action');
    },
  });

  const resetProbationMutation = useMutation({
    mutationFn: async () => {
      await employeesApi.update(targetEmpId, {
        status: 'PROBATION',
        probationEndDate: '2027-03-06',
        probationPeriod: '6 Months',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.info('Status reset to IN PROBATION for workflow demonstration');
    }
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (status: EmployeeStatus) => employeesApi.update(targetEmpId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Status updated successfully');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => employeesApi.uploadDocument(targetEmpId, file, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document uploaded to vault');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Upload failed'),
  });

  const removeDocMutation = useMutation({
    mutationFn: (documentId: string) => employeesApi.removeDocument(targetEmpId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document removed');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () => employeesApi.createOnboardingTask(targetEmpId, { title: taskTitle, ownerType: taskOwner }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Onboarding task added');
      setTaskOpen(false);
      setTaskTitle('');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => employeesApi.updateOnboardingTaskStatus(taskId, 'APPROVED' as ApprovalStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Task marked complete');
    },
  });

  const allocateAssetMutation = useMutation({
    mutationFn: () => assetsApi.allocate(selectedAssetId, { employeeId: targetEmpId, remarks: assetRemarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset allocated successfully');
      setIsAssetOpen(false);
      setSelectedAssetId('');
      setAssetRemarks('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Allocation failed'),
  });

  const returnAssetMutation = useMutation({
    mutationFn: (assetId: string) => assetsApi.returnAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset returned to stock');
    },
  });

  const enrollCourseMutation = useMutation({
    mutationFn: () => employeesApi.enrollInCourse(targetEmpId, {
      courseName,
      courseType,
      status: courseStatus,
      certification: courseCert || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Employee enrolled in course');
      setIsCourseOpen(false);
      setCourseName('');
      setCourseCert('');
    },
  });

  const addKpiMutation = useMutation({
    mutationFn: () => employeesApi.addKpi(targetEmpId, {
      kpi: kpiTitle,
      category: kpiCategory,
      target: kpiTarget,
      weightage: Number(kpiWeight),
      reviewPeriod: kpiPeriod,
      performanceRating: kpiRating ? Number(kpiRating) : undefined,
      managerFeedback: kpiFeedback || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Performance KPI record added');
      setIsKpiOpen(false);
      setKpiTitle('');
      setKpiTarget('');
      setKpiRating('');
      setKpiFeedback('');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () => employeesApi.addHrNote(targetEmpId, {
      note: noteContent,
      noteType,
      createdBy: noteAuthor,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Internal HR note recorded');
      setIsNoteOpen(false);
      setNoteContent('');
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">Loading employee record profile...</p>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 border border-border/80 rounded-2xl bg-card my-12 shadow-sm">
        <div className="flex justify-center text-amber-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Employee Record Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested employee record (<code className="font-mono bg-muted px-1.5 py-0.5 rounded">{id}</code>) could not be found or has been removed.
        </p>
        <Button asChild size="sm" className="font-semibold text-xs gap-1.5">
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4" /> Return to Employee Directory
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {employee.employeeCode} &middot; {employee.designation?.title ?? 'No designation'}
          </p>
        </div>
        <div className="ml-auto w-40">
          <Select value={employee.status} onValueChange={(v) => statusMutation.mutate(v as EmployeeStatus)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <InfoCard label="Company" value={employee.company?.name ?? '-'} />
        <InfoCard label="Business Unit" value={employee.businessUnit ?? 'Technology Services'} />
        <InfoCard label="Department" value={employee.department?.name ?? '-'} />
        <InfoCard label="Designation" value={employee.designation?.title ?? '-'} />
        <InfoCard label="Branch Facility" value={employee.branch?.name ?? 'Head Office'} />
        <InfoCard label="Work Location" value={employee.location ?? 'New York HQ'} />
        <InfoCard label="Shift Assignment" value={employee.shift ?? 'General Day Shift (G)'} />
        <InfoCard label="Job Grade / Level" value={getGradeLevelDisplay(employee.grade, employee.level)} />
        <InfoCard label="Work Email" value={employee.workEmail ?? '-'} />
        <InfoCard label="Phone" value={employee.phone ?? '-'} />
      </div>

      <Tabs defaultValue={searchParams.get('tab') || 'employment'} className="w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs List */}
          <div className="md:w-60 shrink-0">
            <Card className="border border-border/80 shadow-2xs">
              <CardContent className="p-2">
                <TabsList className="flex flex-col h-auto bg-transparent w-full space-y-1 items-stretch">
                  <TabsTrigger value="personal" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Personal Profile</TabsTrigger>
                  <TabsTrigger value="employment" className="justify-start text-xs px-3 py-2 w-full text-left font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-between">
                    <span>Employment Details</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">{employee.employmentType || 'PERM'}</span>
                  </TabsTrigger>
                  <TabsTrigger value="biometric" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-primary">Attendance & Biometric</TabsTrigger>
                  <TabsTrigger value="contact" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Contact & Address</TabsTrigger>
                  <TabsTrigger value="family" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Family & Nominee</TabsTrigger>
                  <TabsTrigger value="education" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Education Details</TabsTrigger>
                  <TabsTrigger value="experience" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Previous Experience</TabsTrigger>
                  <TabsTrigger value="banking" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Banking Information</TabsTrigger>
                  <TabsTrigger value="kyc" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Aadhaar / PAN / KYC</TabsTrigger>
                  <TabsTrigger value="pf_esic" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">PF & ESIC Registry</TabsTrigger>
                  <TabsTrigger value="salary" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Salary Structure</TabsTrigger>
                  <TabsTrigger value="documents" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Document Vault</TabsTrigger>
                  <TabsTrigger value="assets" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Assigned Assets</TabsTrigger>
                  <TabsTrigger value="training" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upskilling & LMS</TabsTrigger>
                  <TabsTrigger value="performance" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">KPIs & Performance</TabsTrigger>
                  <TabsTrigger value="notes" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Internal HR Notes</TabsTrigger>
                  <TabsTrigger value="timeline" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Career & Position History</TabsTrigger>
                  <TabsTrigger value="onboarding" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Onboarding Tasks</TabsTrigger>
                  <TabsTrigger value="exit" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Exit & Offboarding</TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Tabs Content */}
          <div className="flex-1 min-w-0">
            {/* 1. PERSONAL */}
            <TabsContent value="personal" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Personal Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-semibold">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-semibold uppercase">{employee.gender ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Marital Status</p>
                      <p className="font-semibold">{employee.maritalStatus || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-semibold">{employee.nationality || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Blood Group</p>
                      <p className="font-semibold">{employee.bloodGroup || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Religion</p>
                      <p className="font-semibold">{employee.religion || 'No information available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. EMPLOYMENT DETAILS & LIFECYCLE */}
            <TabsContent value="employment" className="m-0 space-y-4">
              {/* Core Employment Card */}
              <Card className="shadow-2xs border-border/80">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Employment Details & Governance</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Core employment terms, role hierarchy, shift allocation, and policy framework.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary border-primary/30 uppercase">
                      {employee.employmentType || 'PERMANENT'}
                    </Badge>
                    <Badge className={
                      employee.status === 'PROBATION'
                        ? 'bg-amber-500 hover:bg-amber-500 text-white font-semibold text-xs'
                        : employee.status === 'ACTIVE'
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs'
                          : 'bg-muted text-muted-foreground font-semibold text-xs'
                    }>
                      {employee.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Employment Type</p>
                      <p className="font-semibold text-foreground text-xs">{employee.employmentType || 'Permanent'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Employment Status</p>
                      <p className="font-semibold text-foreground text-xs">{employee.status || 'Active'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Date of Joining</p>
                      <p className="font-semibold text-foreground text-xs">
                        {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString('en-GB') : 'Not specified'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Employee Code</p>
                      <p className="font-mono font-bold text-primary text-xs">{employee.employeeCode}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Department</p>
                      <p className="font-semibold text-foreground text-xs">{employee.department?.name || 'Production'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Designation</p>
                      <p className="font-semibold text-foreground text-xs">{employee.designation?.title || 'Production Operator'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Reporting Manager</p>
                      <p className="font-semibold text-foreground text-xs">
                        {employee.reportingManager ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}` : 'None / MD Direct'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Employee Category</p>
                      <p className="font-semibold text-foreground text-xs">{employee.employeeCategory || 'Executive'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Shift Assignment</p>
                      <p className="font-semibold text-foreground text-xs">{employee.shift || 'General Day Shift (G)'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Work Mode</p>
                      <p className="font-semibold text-foreground text-xs">{employee.workMode || 'Onsite'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Job Grade / Level</p>
                      <p className="font-mono font-semibold text-foreground text-xs">{getGradeLevelDisplay(employee.grade, employee.level)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Cost Center</p>
                      <p className="font-semibold text-foreground text-xs">{employee.costCenter || 'CC-OPS-001'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Company Entity</p>
                      <p className="font-semibold text-foreground text-xs">{employee.company?.name || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Branch Facility</p>
                      <p className="font-semibold text-foreground text-xs">{employee.branch?.name || 'Head Office'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Work Location</p>
                      <p className="font-semibold text-foreground text-xs">{employee.location || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Business Unit</p>
                      <p className="font-semibold text-foreground text-xs">{employee.businessUnit || 'Operations'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DYNAMIC LIFECYCLE CARDS */}
              {/* 1. If currently in Probation */}
              {isInProbation && (
                <Card className="border border-amber-500/30 bg-amber-500/5 shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b border-amber-500/20 bg-amber-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          ⏳ PROBATION STATUS
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          Statutory probation milestone schedule, evaluation review dates, and confirmation workflow.
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                      IN PROBATION
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Current Status</span>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">IN PROBATION</p>
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Probation Period</span>
                        <p className="text-sm font-bold text-foreground mt-0.5">{employee.probationPeriod || '6 Months'}</p>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                        <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider">Target Confirmation Date</span>
                        <p className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                          {probationDetailCheckpoints?.endDateFormatted || '06-Mar-2027'}
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Final Decision</span>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">PENDING</p>
                      </div>
                    </div>

                    {/* 4-Step Review Checkpoint Tracker */}
                    <div className="p-4 bg-background border border-border/70 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> Automated Probation Review Checkpoints
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono">Pre-End Review Reminder: 15 Days</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-center">
                          <span className="text-[10px] text-muted-foreground font-semibold block">1. Joined Company</span>
                          <p className="font-mono font-bold text-foreground text-xs mt-1">
                            {probationDetailCheckpoints?.joined || '07-Sep-2026'}
                          </p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded font-semibold">Completed ✓</span>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-center">
                          <span className="text-[10px] text-muted-foreground font-semibold block">2. 90-Day Review</span>
                          <p className="font-mono font-bold text-foreground text-xs mt-1">
                            {probationDetailCheckpoints?.ninetyDayReview || '06-Dec-2026'}
                          </p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded font-semibold">Scheduled ✓</span>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold block">3. HR Reminder</span>
                          <p className="font-mono font-bold text-amber-900 dark:text-amber-200 text-xs mt-1">
                            {probationDetailCheckpoints?.hrReminder || '19-Feb-2027'}
                          </p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded font-semibold">15 Days Before ⏳</span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block">4. Final Decision</span>
                          <p className="font-mono font-bold text-emerald-900 dark:text-emerald-200 text-xs mt-1">
                            {probationDetailCheckpoints?.finalDecision || '06-Mar-2027'}
                          </p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded font-semibold">Target ⏳</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Banner */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-amber-600" /> Statutory Final Probation Review Milestone
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Evaluate employee performance with Reporting Manager & HR to confirm tenure, extend probation, or initiate non-confirmation exit.
                        </p>
                      </div>
                      <Button
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 h-9 shadow-xs shrink-0 gap-1.5"
                        onClick={() => {
                          setReviewDecision('CONFIRM');
                          setIsReviewModalOpen(true);
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Start Final Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 2. If Probation is EXTENDED */}
              {isExtended && (
                <Card className="border border-amber-500/40 bg-amber-500/5 shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b border-amber-500/20 bg-amber-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        🟠 PROBATION EXTENDED
                      </CardTitle>
                    </div>
                    <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-0.5">
                      EXTENDED PROBATION
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Original End Date</span>
                        <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                          {parsedReviewData?.originalEndDate || '06-Mar-2027'}
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Extension Period</span>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                          {parsedReviewData?.extensionPeriod || '3 Months'}
                        </p>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">New Probation End Date</span>
                        <p className="text-sm font-mono font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                          {parsedReviewData?.newEndDate || formatDateDisplay(employee.probationEndDate) || '06-Jun-2027'}
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">Extension Count</span>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {parsedReviewData?.extensionCount || 1}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-background rounded-xl border border-border/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Extension Reason</span>
                        <p className="text-xs font-semibold text-foreground mt-0.5">
                          {parsedReviewData?.reason || 'Performance improvement required'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Target Improvement Areas</span>
                        <p className="text-xs font-semibold text-foreground mt-0.5">
                          {parsedReviewData?.improvementAreas || 'Machine operation / production accuracy'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Support / Training Provided</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {parsedReviewData?.supportTraining || 'Additional machine training & mentorship'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Review Authority</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {parsedReviewData?.reviewBy || 'Reporting Manager + HR'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        New Probation Milestone Schedule
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-lg bg-background border border-border/60">
                          <span className="text-[10px] text-muted-foreground block">Next Review</span>
                          <p className="font-mono font-bold text-foreground mt-0.5">
                            {parsedReviewData?.nextReview || '06-May-2027'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <span className="text-[10px] text-amber-800 dark:text-amber-300 block">HR Reminder (15 Days Prior)</span>
                          <p className="font-mono font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                            {parsedReviewData?.newEndDate ? formatDateDisplay(new Date(new Date(parsedReviewData.newEndDate).getTime() - 15 * 24 * 60 * 60 * 1000)) : '22-May-2027'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block">Final Decision Target</span>
                          <p className="font-mono font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                            {parsedReviewData?.newEndDate || '06-Jun-2027'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <Button variant="outline" size="sm" className="text-xs text-muted-foreground" onClick={() => resetProbationMutation.mutate()}>
                        Reset Demo Status
                      </Button>
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
                        onClick={() => {
                          setReviewDecision('CONFIRM');
                          setIsReviewModalOpen(true);
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Conduct Final Decision
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3. If CONFIRMED & Permanent: Confirmed Permanent Employee Record */}
              {isConfirmedOrActive && isPermanentType && (
                <Card className="border border-emerald-500/40 bg-emerald-500/5 shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b border-emerald-500/20 bg-emerald-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                        ✓ CONFIRMED PERMANENT EMPLOYMENT
                      </CardTitle>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5">
                      CONFIRMED
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Employment Status</p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">Confirmed</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Confirmation Date</p>
                        <p className="font-mono font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                          {formatDateDisplay(employee.confirmationDate) || '06-Mar-2027'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Probation Status</p>
                        <p className="font-bold text-foreground text-sm">Completed</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Confirmation Authority</p>
                        <p className="font-semibold text-foreground text-sm">{employee.confirmationReviewBy || 'HR + Management'}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-background border border-emerald-500/30 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Confirmation Letter Generated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>HR & Management Approved</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Employee Notified & Regularized</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <p className="text-[11px] text-muted-foreground">
                        Employee holds regularized permanent status with standard enterprise tenure protections and statutory gratuity vesting.
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => resetProbationMutation.mutate()}>
                        Reset Demo Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 4. If CONFIRMED & Contract: Active Contract Record (Probation Completed) */}
              {isConfirmedOrActive && isContractType && (
                <Card className="border border-emerald-500/40 bg-emerald-500/5 shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b border-emerald-500/20 bg-emerald-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                        🟢 ACTIVE CONTRACT RECORD (PROBATION COMPLETED)
                      </CardTitle>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5">
                      PROBATION COMPLETED
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Employment Type</p>
                        <p className="font-bold text-foreground text-sm">Contract – Fixed Term</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Employment Status</p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">Active</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Probation Status</p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">Completed</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Contract Period</p>
                        <p className="font-mono font-semibold text-foreground text-xs">
                          {formatDateDisplay(employee.dateOfJoining)} → {formatDateDisplay(employee.contractEndDate) || '06-Sep-2027'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-background border border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Probation successfully evaluated. Contract terms remain fixed-term until contract expiry.</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-6">
                        At contract expiry: Renew Contract OR Convert to Permanent OR End Contract. (Probation Confirmation ≠ Permanent Conversion)
                      </p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => resetProbationMutation.mutate()}>
                        Reset Demo Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 5. If NON-CONFIRMED: Exit & Offboarding Workflow */}
              {isNonConfirmed && (
                <Card className="border border-red-500/40 bg-red-500/5 shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b border-red-500/20 bg-red-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-900 dark:text-red-200">
                        🔴 NON-CONFIRMED — EXIT & OFFBOARDING WORKFLOW
                      </CardTitle>
                    </div>
                    <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5">
                      NON-CONFIRMED
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Decision Date</p>
                        <p className="font-mono font-bold text-foreground text-sm">
                          {parsedReviewData?.decisionDate || formatDateDisplay(new Date())}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Reason</p>
                        <p className="font-semibold text-red-700 dark:text-red-300 text-xs">
                          {parsedReviewData?.reason || 'Performance did not meet required standards'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Notice Period</p>
                        <p className="font-bold text-foreground text-sm">
                          {parsedReviewData?.noticePeriodDays || 15} Days
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Last Working Date</p>
                        <p className="font-mono font-bold text-red-700 dark:text-red-300 text-sm">
                          {parsedReviewData?.lastWorkingDate || '21-Mar-2027'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-background border border-red-500/30 space-y-2">
                      <p className="font-bold text-red-900 dark:text-red-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" /> Exit Workflow In Progress
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Non-Confirmation Notice Generated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Departmental Exit Clearance Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Asset Recovery & Handover Scheduled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Full & Final (F&F) Payroll Settlement Queued</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <p className="text-[11px] text-muted-foreground italic">
                        Employee master record is preserved in history; non-confirmation does not erase employee records.
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => resetProbationMutation.mutate()}>
                        Reset Demo Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3. If CONTRACT */}
              {(employee.employmentType === 'CONTRACT' || String(employee.employmentType).startsWith('CONTRACT') || employee.employmentType === 'TEMPORARY') && (
                <>
                  <Card className="border border-amber-500/30 bg-amber-500/5 shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b border-amber-500/20 bg-amber-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                        📄 Contract Employment Terms & Agreement
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-200 font-semibold">
                      CONTRACTUAL
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Contract Type</p>
                        <p className="font-semibold text-foreground">Fixed Term / Project Contract</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Contract Duration</p>
                        <p className="font-semibold text-foreground">12 Months (Standard)</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Renewal Notice Period</p>
                        <p className="font-semibold text-foreground">30 Days</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Statutory Notice</p>
                        <p className="font-semibold text-foreground">30 Days Notice</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. CONTRACT LIFECYCLE & RENEWAL WORKFLOW */}
                <Card className="border border-primary/30 shadow-2xs overflow-hidden">
                  <CardHeader className="py-3 px-4 border-b bg-muted/40 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                          CONTRACT LIFECYCLE & RENEWAL WORKFLOW
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          Current contract: {formatDateDisplay(employee.dateOfJoining)} → {formatDateDisplay(employee.contractEndDate) || '06-Sep-2027'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5">
                      ACTIVE
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-xs">
                    {/* Top KPI Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg bg-background border border-border/70">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Current Contract</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {formatDateDisplay(employee.dateOfJoining)} → {formatDateDisplay(employee.contractEndDate) || '06-Sep-2027'}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-semibold">Contract Status</p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">ACTIVE</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-semibold">Next Review Date</p>
                        <p className="font-bold text-amber-900 dark:text-amber-200 mt-0.5 font-mono">
                          07-Aug-2027
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 uppercase font-semibold">Renewal Notice</p>
                        <p className="font-bold text-blue-900 dark:text-blue-200 mt-0.5 font-mono">30 Days</p>
                      </div>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Lifecycle Progress & Milestone Stepper
                        </span>
                        <span className="text-[10px] text-muted-foreground">Automated 30-day renewal workflow</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        {/* Step 1 */}
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-xs mb-1">
                            ✓
                          </div>
                          <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">Contract Active</p>
                          <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Completed</span>
                        </div>

                        {/* Step 2 */}
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-xs mb-1">
                            ✓
                          </div>
                          <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">Probation Completed</p>
                          <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Completed</span>
                        </div>

                        {/* Step 3 */}
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500 text-white text-xs mb-1">
                            ○
                          </div>
                          <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Renewal Review</p>
                          <p className="text-[9px] font-mono text-amber-700 dark:text-amber-300 font-semibold">07-Aug-2027</p>
                        </div>

                        {/* Step 4 */}
                        <div className="p-2.5 rounded-lg bg-background border border-border/80 text-center">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs mb-1">
                            ○
                          </div>
                          <p className="text-[11px] font-medium text-foreground">Manager Review</p>
                          <span className="text-[9px] text-muted-foreground uppercase">Pending</span>
                        </div>

                        {/* Step 5 */}
                        <div className="p-2.5 rounded-lg bg-background border border-border/80 text-center">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs mb-1">
                            ○
                          </div>
                          <p className="text-[11px] font-medium text-foreground">HR Review</p>
                          <span className="text-[9px] text-muted-foreground uppercase">Pending</span>
                        </div>

                        {/* Step 6 */}
                        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-center">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs mb-1">
                            ⚡
                          </div>
                          <p className="text-[11px] font-bold text-primary">Final Decision</p>
                          <span className="text-[9px] text-primary font-semibold uppercase">Decision Required</span>
                        </div>
                      </div>

                      {/* Probation completion note */}
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px]">
                          <strong>Probation completed successfully. Contract remains Fixed-Term until contract expiry.</strong> (Probation Confirmation ≠ Permanent Conversion).
                        </span>
                      </div>
                    </div>

                    {/* DECISION ACTIONS */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span>⚡ Contract Lifecycle Decision Actions</span>
                            <Badge variant="outline" className="text-[9px] bg-background">3 Distinct Business Paths</Badge>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Select an action below to initiate Contract Renewal, Permanent Conversion, or Structured Non-Renewal separation.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <Button
                          onClick={() => {
                            setContractActionTab('RENEW');
                            setIsContractActionOpen(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 h-9"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Renew Contract
                        </Button>

                        <Button
                          onClick={() => {
                            setContractActionTab('CONVERT_PERMANENT');
                            setIsContractActionOpen(true);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-9"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Convert to Permanent
                        </Button>

                        <Button
                          onClick={() => {
                            setContractActionTab('DO_NOT_RENEW');
                            setIsContractActionOpen(true);
                          }}
                          variant="outline"
                          className="w-full border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/10 text-xs font-semibold gap-1.5 h-9"
                        >
                          <UserX className="h-3.5 w-3.5 text-red-600" />
                          Do Not Renew
                        </Button>
                      </div>
                    </div>

                    {/* CONTRACT HISTORY SECTION */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" /> Contract History & Version Records
                        </span>
                        <span className="text-[10px] text-muted-foreground">Historical records never overwritten</span>
                      </div>

                      <div className="rounded-lg border border-border/80 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40 text-[10px]">
                              <TableHead className="py-2 h-8 font-semibold">Contract No.</TableHead>
                              <TableHead className="py-2 h-8 font-semibold">Tenure Window</TableHead>
                              <TableHead className="py-2 h-8 font-semibold">Type</TableHead>
                              <TableHead className="py-2 h-8 font-semibold">Status</TableHead>
                              <TableHead className="py-2 h-8 font-semibold">Probation</TableHead>
                              <TableHead className="py-2 h-8 font-semibold">Renewal</TableHead>
                              <TableHead className="py-2 h-8 font-semibold text-right">Document</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contractHistoryList.length > 0 ? (
                              contractHistoryList.map((c, i) => (
                                <TableRow key={c.id || i} className="text-xs">
                                  <TableCell className="font-mono font-bold text-primary py-2">{c.contractNumber}</TableCell>
                                  <TableCell className="py-2 font-mono text-[11px]">{c.contractStartDate} → {c.contractEndDate}</TableCell>
                                  <TableCell className="py-2">{c.contractType || 'Fixed Term'}</TableCell>
                                  <TableCell className="py-2">
                                    <Badge variant="outline" className={`text-[9px] ${c.contractStatus === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                                      {c.contractStatus || 'Active'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-2 text-[11px] font-medium text-emerald-700">Completed</TableCell>
                                  <TableCell className="py-2 text-[11px]">{c.renewalStatus || 'Pending'}</TableCell>
                                  <TableCell className="py-2 text-right">
                                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 underline cursor-pointer">
                                      {c.contractDocument || 'View PDF'}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow className="text-xs">
                                <TableCell className="font-mono font-bold text-primary py-2">
                                  {activeContractVersion.contractNumber}
                                </TableCell>
                                <TableCell className="py-2 font-mono text-[11px]">
                                  {formatDateDisplay(employee.dateOfJoining)} → {formatDateDisplay(employee.contractEndDate) || '06-Sep-2027'}
                                </TableCell>
                                <TableCell className="py-2">Fixed Term</TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                                    Active
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2 text-[11px] font-medium text-emerald-700">Completed</TableCell>
                                <TableCell className="py-2 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">Pending</TableCell>
                                <TableCell className="py-2 text-right">
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 underline cursor-pointer">
                                    {activeContractVersion.contractDocument}
                                  </span>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            </TabsContent>

            {/* BIOMETRIC & FACE REGISTRATION */}
            <TabsContent value="biometric" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" /> Face Biometric & Attendance Gateway
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Register employee facial embedding for automated live attendance, geofence, & mobile punch verification.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {employee.faceTemplate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold gap-1.5"
                        onClick={() => setIsViewTemplateOpen(true)}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                        View Registered Face
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                      onClick={() => setIsRegisterFaceOpen(true)}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {employee.faceTemplate ? 'Re-Register Face' : 'Register Face'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 border border-border/80 rounded-xl bg-muted/20 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Face Registration Status</span>
                      {employee.faceTemplate ? (
                        <Badge className="bg-emerald-600 text-white font-semibold text-[11px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 font-semibold text-[11px] gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Not Registered
                        </Badge>
                      )}
                    </div>

                    <div className="p-3.5 border border-border/80 rounded-xl bg-muted/20 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registration Date</span>
                      <p className="font-semibold text-foreground font-mono">
                        {employee.faceRegisteredAt ? new Date(employee.faceRegisteredAt).toLocaleString() : 'Not registered yet'}
                      </p>
                    </div>

                    <div className="p-3.5 border border-border/80 rounded-xl bg-muted/20 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registered By</span>
                      <p className="font-semibold text-foreground">
                        {employee.faceRegisteredBy || 'HR Administrator'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Biometric Data Policy & Privacy Standard</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Biometric facial landmark vectors are encrypted using standard 128-dimensional float arrays. Raw face photographs are never stored in log records. Biometric data is exclusively used for verifying employee check-in / check-out times at office geofence locations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. CONTACT */}
            <TabsContent value="contact" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Contact & Address Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Personal Phone</p>
                      <p className="font-semibold">{employee.phone ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Work Phone</p>
                      <p className="font-semibold">{employee.workPhone ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Work Email</p>
                      <p className="font-semibold">{employee.workEmail ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Personal Email</p>
                      <p className="font-semibold">{employee.personalEmail ?? 'No information available'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-semibold">Current Address</p>
                      <p className="text-foreground leading-normal">{employee.currentAddress || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-semibold">Permanent Address</p>
                      <p className="text-foreground leading-normal">{employee.permanentAddress || 'No information available'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">City</p>
                      <p className="font-semibold">{employee.city || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">State</p>
                      <p className="font-semibold">{employee.state || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-semibold">{employee.country || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Pincode</p>
                      <p className="font-semibold">{employee.pincode || 'No information available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. FAMILY */}
            <TabsContent value="family" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Family Details & Nominees</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.familyMemberName || employee.nomineeName ? (
                    <>
                      {employee.familyMemberName && (
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-semibold">{employee.familyMemberName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {employee.familyRelationship || 'Family Member'}
                              {employee.familyDob ? ` &bull; DOB: ${new Date(employee.familyDob).toLocaleDateString()}` : ''}
                              {employee.familyContact ? ` &bull; Phone: ${employee.familyContact}` : ''}
                            </p>
                          </div>
                          <Badge variant="outline">Family</Badge>
                        </div>
                      )}
                      {employee.nomineeName && (
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-semibold">{employee.nomineeName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {employee.nomineeRelationship || 'Nominee'}
                              {employee.nomineeShare ? ` &bull; Share: ${employee.nomineeShare}%` : ''}
                            </p>
                          </div>
                          <Badge variant="outline">Nominee</Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. EDUCATION */}
            <TabsContent value="education" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Academic Education History</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.educationQualification ? (
                    <div className="border-l-2 border-primary pl-3 py-1">
                      <p className="font-semibold">{employee.educationQualification}</p>
                      <p className="text-muted-foreground">
                        {employee.educationInstitution || 'No Institution'} &bull; {employee.educationUniversity || 'No Board/University'}
                        {employee.educationPassingYear ? ` &bull; Class of ${employee.educationPassingYear}` : ''}
                      </p>
                      {employee.educationPercentage && (
                        <p className="text-[10px] text-primary font-medium mt-1">Percentage / Grade: {employee.educationPercentage}%</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. EXPERIENCE */}
            <TabsContent value="experience" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Previous Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.prevCompany ? (
                    <div className="border-l-2 border-emerald-500 pl-3 py-1">
                      <p className="font-semibold">{employee.prevJobTitle || 'Previous Employee'}</p>
                      <p className="text-muted-foreground">
                        {employee.prevCompany}
                        {employee.prevStartDate ? ` &bull; ${new Date(employee.prevStartDate).toLocaleDateString()}` : ''}
                        {employee.prevEndDate ? ` - ${new Date(employee.prevEndDate).toLocaleDateString()}` : ''}
                      </p>
                      {employee.prevTotalExp && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Total Experience: {employee.prevTotalExp}</p>
                      )}
                      {employee.prevReasonForLeaving && (
                        <p className="text-[10px] text-muted-foreground leading-normal mt-1">Reason for Leaving: {employee.prevReasonForLeaving}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 6. BANKING */}
            <TabsContent value="banking" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Banking Details (Salary Account)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.bankName || employee.bankAccountNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Bank Name</p>
                        <p className="font-semibold">{employee.bankName || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Account Number</p>
                        <p className="font-semibold font-mono">{employee.bankAccountNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">IFSC Code</p>
                        <p className="font-semibold font-mono uppercase">{employee.bankIfscCode || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Branch Location</p>
                        <p className="font-semibold">{employee.bankBranchName || 'No information available'}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-muted-foreground">Account Holder Name</p>
                        <p className="font-semibold">{employee.bankAccountHolderName || 'No information available'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 7. KYC */}
            <TabsContent value="kyc" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">KYC Credentials (Aadhaar & PAN)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.aadhaarNumber || employee.panNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Aadhaar Number (UIDAI)</p>
                        <p className="font-semibold font-mono">{employee.aadhaarNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Income Tax PAN Number</p>
                        <p className="font-semibold font-mono uppercase">{employee.panNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Passport Number</p>
                        <p className="font-semibold font-mono uppercase">{employee.passportNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Verification Status</p>
                        <div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase">
                            {employee.kycStatus || 'PENDING'}
                          </Badge>
                          {employee.kycVerificationDate && (
                            <span className="text-[10px] text-muted-foreground ml-2">Verified: {new Date(employee.kycVerificationDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 8. PF & ESIC */}
            <TabsContent value="pf_esic" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Provident Fund & ESIC Registration</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.uanNumber || employee.pfMemberId || employee.esicNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Universal Account Number (UAN)</p>
                        <p className="font-semibold font-mono">{employee.uanNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">PF Member ID</p>
                        <p className="font-semibold font-mono">{employee.pfMemberId || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">ESIC IP Number</p>
                        <p className="font-semibold font-mono">{employee.esicNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Applicability</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">PF: {employee.pfApplicable ? 'Yes' : 'No'}</Badge>
                          <Badge variant="outline">ESIC: {employee.esicApplicable ? 'Yes' : 'No'}</Badge>
                        </div>
                      </div>
                      {employee.pfEsicJoiningDate && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-muted-foreground">PF/ESIC Joining Date</p>
                          <p className="font-semibold">{new Date(employee.pfEsicJoiningDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 9. SALARY */}
            <TabsContent value="salary" className="m-0 space-y-4">
              {(() => {
                const assignmentItems = activeSalaryAssignment?.details || [];
                const earnings = assignmentItems.filter((it: any) => (it.salaryComponent?.type || it.type || 'EARNING') === 'EARNING');
                const deductions = assignmentItems.filter((it: any) => (it.salaryComponent?.type || it.type) === 'DEDUCTION');
                const annualCtcValue = Number(activeSalaryAssignment?.annualCtc || employee.annualCtc || 0);
                const monthlyCtcValue = Number(activeSalaryAssignment?.monthlyCtc || Math.round(annualCtcValue / 12) || 0);
                const totalEarnings = earnings.length > 0
                  ? earnings.reduce((sum: number, it: any) => sum + (Number(it.monthlyAmount) || 0), 0)
                  : Number(employee.grossSalary) || monthlyCtcValue;
                const totalDeductions = deductions.reduce((sum: number, it: any) => sum + (Number(it.monthlyAmount) || 0), 0);
                const netTakeHome = totalEarnings - totalDeductions;
                const hasSalaryConfig = annualCtcValue > 0 || (employee.basicSalary !== undefined && employee.basicSalary !== null && employee.basicSalary > 0);

                return (
                  <Card className="shadow-2xs border-border/80">
                    <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          <IndianRupee className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <span>Compensation Salary Structure</span>
                            {hasSalaryConfig && (
                              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] tracking-wide">
                                ✓ Synced from Payroll (Live)
                              </Badge>
                            )}
                            {activeSalaryAssignment?.status && (
                              <Badge variant="outline" className={activeSalaryAssignment.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold' : 'bg-slate-500/10 text-slate-600 text-[10px]'}>
                                {activeSalaryAssignment.status}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Live payroll compensation structure and monthly earnings & deductions breakdown.
                          </p>
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50">
                        <Link to="/payroll/structure">
                          Manage in Payroll <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5 text-xs space-y-5">
                      {hasSalaryConfig ? (
                        <>
                          {/* Top Metric Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                              <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Total Annual CTC</p>
                              <div className="text-xl font-extrabold text-foreground font-mono">
                                ₹{annualCtcValue.toLocaleString('en-IN')}
                              </div>
                              <span className="inline-block text-[10.5px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                {(annualCtcValue / 100000).toFixed(2)} LPA
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                              <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Monthly CTC</p>
                              <div className="text-xl font-extrabold text-emerald-600 font-mono">
                                ₹{monthlyCtcValue.toLocaleString('en-IN')}
                              </div>
                              <p className="text-[10.5px] text-muted-foreground">Standard monthly company cost</p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                              <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Salary Grade / Band</p>
                              <p className="text-sm font-bold text-primary truncate">
                                {activeSalaryAssignment?.template?.name || employee.salaryGrade || (employee.grade ? `Grade ${employee.grade}` : 'Standard Structure')}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Effective: {new Date(activeSalaryAssignment?.effectiveFrom || employee.salaryEffectiveFrom || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* Component Details Breakdown */}
                          {assignmentItems.length > 0 ? (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                                  Itemized Salary Components ({assignmentItems.length})
                                </h4>
                              </div>
                              <div className="border border-border/60 rounded-xl overflow-hidden shadow-xs">
                                <Table>
                                  <TableHeader className="bg-muted/40 text-[11px]">
                                    <TableRow>
                                      <TableHead className="py-2.5 px-3">Component</TableHead>
                                      <TableHead className="py-2.5 px-3">Type</TableHead>
                                      <TableHead className="py-2.5 px-3 text-right">Monthly (₹)</TableHead>
                                      <TableHead className="py-2.5 px-3 text-right">Annual (₹)</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody className="text-xs">
                                    {assignmentItems.map((item: any, idx: number) => {
                                      const compName = item.salaryComponent?.name || item.name || 'Salary Component';
                                      const compCode = item.salaryComponent?.code || '';
                                      const compType = item.salaryComponent?.type || item.type || 'EARNING';
                                      const monthly = Number(item.monthlyAmount || 0);
                                      const annual = Number(item.annualAmount) || monthly * 12;

                                      return (
                                        <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                                          <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                                            {compName} {compCode && <span className="text-muted-foreground font-mono text-[10px]">({compCode})</span>}
                                          </TableCell>
                                          <TableCell className="py-2.5 px-3">
                                            <Badge variant="outline" className={compType === 'EARNING' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold' : 'bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold'}>
                                              {compType}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                            ₹{monthly.toLocaleString('en-IN')}
                                          </TableCell>
                                          <TableCell className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                            ₹{annual.toLocaleString('en-IN')}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Net Take-Home Breakdown Summary */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl border border-border/60">
                                <div>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Gross Monthly Earnings</span>
                                  <div className="text-base font-extrabold text-emerald-600 font-mono">
                                    ₹{totalEarnings.toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Monthly Deductions</span>
                                  <div className="text-base font-extrabold text-rose-600 font-mono">
                                    ₹{totalDeductions.toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Net Take-Home Salary</span>
                                  <div className="text-base font-extrabold text-indigo-600 font-mono">
                                    ₹{netTakeHome.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Fallback Component List */
                            <div className="space-y-2 border border-border/60 rounded-xl p-4 bg-muted/10">
                              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-3">
                                Standard Salary Components
                              </h4>
                              {typeof employee.basicSalary === 'number' && (
                                <div className="flex justify-between border-b border-border/40 pb-2">
                                  <span className="text-muted-foreground">Basic Salary</span>
                                  <span className="font-semibold font-mono">₹{employee.basicSalary.toLocaleString('en-IN')} / month</span>
                                </div>
                              )}
                              {typeof employee.hra === 'number' && (
                                <div className="flex justify-between border-b border-border/40 pb-2">
                                  <span className="text-muted-foreground">House Rent Allowance (HRA)</span>
                                  <span className="font-semibold font-mono">₹{employee.hra.toLocaleString('en-IN')} / month</span>
                                </div>
                              )}
                              {typeof employee.conveyance === 'number' && (
                                <div className="flex justify-between border-b border-border/40 pb-2">
                                  <span className="text-muted-foreground">Conveyance Allowance</span>
                                  <span className="font-semibold font-mono">₹{employee.conveyance.toLocaleString('en-IN')} / month</span>
                                </div>
                              )}
                              {typeof employee.specialAllowance === 'number' && (
                                <div className="flex justify-between border-b border-border/40 pb-2">
                                  <span className="text-muted-foreground">Special Allowance</span>
                                  <span className="font-semibold font-mono">₹{employee.specialAllowance.toLocaleString('en-IN')} / month</span>
                                </div>
                              )}
                              {typeof employee.otherAllowances === 'number' && (
                                <div className="flex justify-between border-b border-border/40 pb-2">
                                  <span className="text-muted-foreground">Other Allowances</span>
                                  <span className="font-semibold font-mono">₹{employee.otherAllowances.toLocaleString('en-IN')} / month</span>
                                </div>
                              )}
                              {typeof employee.grossSalary === 'number' && (
                                <div className="flex justify-between pt-2 text-sm font-bold text-emerald-600">
                                  <span>Gross Salary</span>
                                  <span className="font-mono">₹{employee.grossSalary.toLocaleString('en-IN')} / month</span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 space-y-3">
                          <div className="p-3 bg-muted/40 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-muted-foreground">
                            <IndianRupee className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">No salary structure assigned</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Assign a compensation structure template to this employee in Payroll.</p>
                          </div>
                          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 h-9">
                            <Link to="/payroll/structure">
                              <Plus className="h-4 w-4" /> Assign Structure in Payroll
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </TabsContent>

            {/* 10. DOCUMENTS */}
            <TabsContent value="documents" className="m-0">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-base font-semibold">Documents Vault</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ID_PROOF">ID Proof</SelectItem>
                        <SelectItem value="ADDRESS_PROOF">Address Proof</SelectItem>
                        <SelectItem value="EDUCATION">Education Certificate</SelectItem>
                        <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMutation.mutate(file);
                      }}
                    />
                    <Button size="sm" className="text-xs h-8" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                      <Upload className="mr-1.5 h-4 w-4" /> Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {employee.documents && employee.documents.length > 0 ? (
                    employee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.docType}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDocMutation.mutate(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No documents uploaded yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 11. ASSETS */}
            <TabsContent value="assets" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Assigned Company Assets</CardTitle>
                  <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Allocate Asset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Allocate Company Asset</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>Select Available Asset *</Label>
                          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Choose an asset in stock..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAssets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  {asset.name} &bull; {asset.assetTag} ({asset.category})
                                </SelectItem>
                              ))}
                              {availableAssets.length === 0 && (
                                <SelectItem value="none" disabled>No assets available in stock</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Remarks / Allocation Notes</Label>
                          <Input value={assetRemarks} onChange={(e) => setAssetRemarks(e.target.value)} placeholder="e.g. Issued for remote work development" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!selectedAssetId || allocateAssetMutation.isPending}
                          onClick={() => allocateAssetMutation.mutate()}
                          size="sm"
                        >
                          Confirm Allocation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.currentAssets && employee.currentAssets.length > 0 ? (
                    employee.currentAssets.map((asset) => (
                      <div key={asset.id} className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/10 p-1.5 rounded-lg transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Laptop className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{asset.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Asset Tag: <span className="font-mono">{asset.assetTag}</span> &middot; Category: {asset.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{asset.status}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/5 font-semibold"
                            onClick={() => returnAssetMutation.mutate(asset.id)}
                            disabled={returnAssetMutation.isPending}
                          >
                            Return Asset
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No assets assigned</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 12. TRAINING */}
            <TabsContent value="training" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Upskilling & LMS Enrollments</CardTitle>
                  <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Enroll Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enroll in Course / Workshop</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>Course Title *</Label>
                          <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. ISO 27001 Data Security certification" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Category / Type *</Label>
                            <Select value={courseType} onValueChange={setCourseType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Compliance">Compliance</SelectItem>
                                <SelectItem value="Safety">Safety</SelectItem>
                                <SelectItem value="Technical">Technical</SelectItem>
                                <SelectItem value="Management">Management</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Enrollment Status *</Label>
                            <Select value={courseStatus} onValueChange={setCourseStatus}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Awarded Certification / Credential (Optional)</Label>
                          <Input value={courseCert} onChange={(e) => setCourseCert(e.target.value)} placeholder="e.g. Cert-ISO27001-Lead" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!courseName || enrollCourseMutation.isPending}
                          onClick={() => enrollCourseMutation.mutate()}
                          size="sm"
                        >
                          Enroll Employee
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.courseEnrollments && employee.courseEnrollments.length > 0 ? (
                    employee.courseEnrollments.map((course) => (
                      <div key={course.id} className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/10 p-1.5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{course.courseName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Type: {course.courseType} &bull; Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()}
                              {course.completionDate ? ` &bull; Completed: ${new Date(course.completionDate).toLocaleDateString()}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={course.status === 'Completed' ? 'secondary' : 'outline'}>{course.status}</Badge>
                          {course.certification && <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100">{course.certification}</Badge>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No upskilling records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 13. PERFORMANCE */}
            <TabsContent value="performance" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Performance Reviews & Appraisal KPIs</CardTitle>
                  <Dialog open={isKpiOpen} onOpenChange={setIsKpiOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add KPI Rating
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add KPI Appraisal Record</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>KPI Target Description *</Label>
                          <Input value={kpiTitle} onChange={(e) => setKpiTitle(e.target.value)} placeholder="e.g. Maintain product delivery sprint goals" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Category *</Label>
                            <Select value={kpiCategory} onValueChange={setKpiCategory}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Quality">Quality</SelectItem>
                                <SelectItem value="Speed">Speed</SelectItem>
                                <SelectItem value="Leadership">Leadership</SelectItem>
                                <SelectItem value="Efficiency">Efficiency</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Review Period *</Label>
                            <Input value={kpiPeriod} onChange={(e) => setKpiPeriod(e.target.value)} placeholder="e.g. Q3 2026" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Target Value *</Label>
                            <Input value={kpiTarget} onChange={(e) => setKpiTarget(e.target.value)} placeholder="e.g. 98% uptime" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Weightage (%) *</Label>
                            <Input type="number" value={kpiWeight} onChange={(e) => setKpiWeight(Number(e.target.value))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Performance Rating (0.0 - 5.0)</Label>
                            <Input type="number" step="0.1" min="0" max="5" value={kpiRating} onChange={(e) => setKpiRating(e.target.value)} placeholder="e.g. 4.5" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Manager Appraisal Feedback</Label>
                          <textarea
                            value={kpiFeedback}
                            onChange={(e: any) => setKpiFeedback(e.target.value)}
                            placeholder="Appraisal summary notes..."
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!kpiTitle || addKpiMutation.isPending}
                          onClick={() => addKpiMutation.mutate()}
                          size="sm"
                        >
                          Save Appraisal KPI
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.kpis && employee.kpis.length > 0 ? (
                    employee.kpis.map((kpi) => (
                      <div key={kpi.id} className="border-l-2 border-primary pl-3 py-1 space-y-1 bg-muted/10 p-3 rounded-r-lg hover:bg-muted/20 transition-all">
                        <p className="font-semibold text-foreground">{kpi.kpi} <span className="text-[10px] text-muted-foreground font-normal">({kpi.category})</span></p>
                        <p className="text-muted-foreground text-[10px]">
                          Target: {kpi.target} &bull; Weightage: {kpi.weightage}% &bull; Review Period: {kpi.reviewPeriod}
                        </p>
                        {kpi.performanceRating !== null && (
                          <p className="text-[10px] font-semibold text-primary flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-primary" /> Rating: {kpi.performanceRating} / 5.0
                          </p>
                        )}
                        {kpi.managerFeedback && (
                          <p className="text-[10px] text-muted-foreground italic bg-background p-1.5 rounded border mt-1">Feedback: "{kpi.managerFeedback}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No KPI appraisal records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 14. NOTES */}
            <TabsContent value="notes" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Supervisor & Internal HR Notes</CardTitle>
                  <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Internal HR / Supervisor Note</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Note Type *</Label>
                            <Select value={noteType} onValueChange={setNoteType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Performance">Performance</SelectItem>
                                <SelectItem value="Disciplinary">Disciplinary</SelectItem>
                                <SelectItem value="Reward">Reward</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Created By / Author *</Label>
                            <Input value={noteAuthor} onChange={(e) => setNoteAuthor(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Note Content *</Label>
                          <textarea
                            value={noteContent}
                            onChange={(e: any) => setNoteContent(e.target.value)}
                            placeholder="Record details here securely..."
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!noteContent || addNoteMutation.isPending}
                          onClick={() => addNoteMutation.mutate()}
                          size="sm"
                        >
                          Save Secured Note
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.hrNotes && employee.hrNotes.length > 0 ? (
                    employee.hrNotes.map((note) => (
                      <div key={note.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-700 flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> {note.noteType} Note</span>
                          <span className="text-[10px] text-muted-foreground font-mono">by {note.createdBy} &bull; {new Date(note.createdDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-muted-foreground leading-normal">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No HR / supervisor notes registered</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 15. CAREER & POSITION HISTORY */}
            <TabsContent value="timeline" className="m-0 space-y-6">
              {/* CURRENT POSITION CARD */}
              {(() => {
                const historyList: any[] = (employee as any).positionHistory || [];
                const currentPos = historyList.find((h) => h.status === 'CURRENT') || historyList[0];

                return (
                  <>
                    <Card className="shadow-2xs border-primary/40 bg-primary/5">
                      <CardHeader className="pb-3 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary">Current Position</CardTitle>
                            <p className="text-lg font-bold text-foreground mt-0.5">
                              {currentPos?.designationTitle || employee.designation?.title || 'No Designation'}
                            </p>
                          </div>
                          <Badge className="bg-emerald-600 text-white font-semibold text-[10.5px]">
                            CURRENT
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Department</span>
                          <span className="font-semibold text-foreground">{currentPos?.departmentName || employee.department?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Grade / Level</span>
                          <span className="font-semibold text-foreground">{getGradeLevelDisplay(currentPos?.grade || employee.grade, currentPos?.level || employee.level)}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Branch / Location</span>
                          <span className="font-semibold text-foreground">{currentPos?.branchName || employee.branch?.name || employee.location || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Effective From</span>
                          <span className="font-semibold font-mono text-foreground">
                            {currentPos?.effectiveDate
                              ? new Date(currentPos.effectiveDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                              : employee.dateOfJoining
                                ? new Date(employee.dateOfJoining).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* POSITION HISTORY */}
                    <Card className="shadow-2xs">
                      <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <span>Position History Log</span>
                          <span className="text-xs font-normal text-muted-foreground">{historyList.length} Movement Records</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 text-xs space-y-4">
                        {historyList.length > 0 ? (
                          historyList.map((hist: any) => (
                            <div key={hist.id} className="border rounded-xl p-4 space-y-3 bg-card hover:bg-muted/20 transition-all">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={hist.movementType === 'JOINING' ? 'outline' : 'secondary'} className="uppercase text-[10px]">
                                    {hist.movementType.replace('_', ' ')}
                                  </Badge>
                                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                    {new Date(hist.effectiveDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                                <Badge className={hist.status === 'CURRENT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                                  {hist.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Designation:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevDesignationTitle && hist.prevDesignationTitle !== hist.designationTitle ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{hist.prevDesignationTitle}</span>
                                        <span className="text-primary font-bold">&rarr; {hist.designationTitle}</span>
                                      </span>
                                    ) : (
                                      hist.designationTitle || '-'
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Grade / Level:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevGrade && hist.prevGrade !== hist.grade ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{getGradeLevelDisplay(hist.prevGrade, null)}</span>
                                        <span className="text-primary font-bold">&rarr; {getGradeLevelDisplay(hist.grade, hist.level)}</span>
                                      </span>
                                    ) : (
                                      getGradeLevelDisplay(hist.grade, hist.level)
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Department:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevDepartmentName && hist.prevDepartmentName !== hist.departmentName ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{hist.prevDepartmentName}</span>
                                        <span className="text-primary font-bold">&rarr; {hist.departmentName}</span>
                                      </span>
                                    ) : (
                                      hist.departmentName || '-'
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Branch / Location:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevBranchName && hist.prevBranchName !== hist.branchName ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{hist.prevBranchName}</span>
                                        <span className="text-primary font-bold">&rarr; {hist.branchName}</span>
                                      </span>
                                    ) : (
                                      hist.branchName || '-'
                                    )}
                                  </p>
                                </div>
                              </div>

                              {(hist.reason || hist.remarks) && (
                                <div className="bg-muted/40 p-2.5 rounded-lg border text-[11px] space-y-1">
                                  {hist.reason && <p><strong>Reason:</strong> {hist.reason}</p>}
                                  {hist.remarks && <p className="text-muted-foreground"><strong>Remarks:</strong> {hist.remarks}</p>}
                                </div>
                              )}

                              {hist.approvedBy && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  Approved by: {hist.approvedBy} &bull; {hist.approvedDate ? new Date(hist.approvedDate).toLocaleDateString() : ''}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-6">No position history records found</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}

              {/* CAREER TIMELINE EVENTS */}
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Career Timeline Events</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                  <div className="relative border-l-2 border-primary/20 pl-4 space-y-6 py-2 ml-2">
                    {employee.timelineEvents && employee.timelineEvents.length > 0 ? (
                      employee.timelineEvents.map((evt) => (
                        <div key={evt.id} className="relative">
                          <span className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shrink-0 flex items-center justify-center">
                            <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                          </span>
                          <p className="font-semibold text-foreground text-xs">{evt.eventTitle}</p>
                          <p className="text-muted-foreground text-[10px] font-medium mt-0.5">{new Date(evt.date).toLocaleDateString()}</p>
                          {evt.details && <p className="text-[10px] text-muted-foreground mt-1 bg-muted/40 p-2 rounded-lg leading-relaxed">{evt.details}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">No timeline events found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 16. ONBOARDING */}
            <TabsContent value="onboarding" className="m-0">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-base font-semibold">Onboarding Checklist</CardTitle>
                  <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8">
                        <Plus className="mr-1.5 h-4 w-4" /> Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Onboarding Checklist Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>Task Title *</Label>
                          <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Set up payroll tax declarations" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Owner Group / Type *</Label>
                          <Select value={taskOwner} onValueChange={setTaskOwner}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR Group</SelectItem>
                              <SelectItem value="IT">IT Hardware Group</SelectItem>
                              <SelectItem value="ADMIN">Facility / Admin Group</SelectItem>
                              <SelectItem value="MANAGER">Reporting Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!taskTitle || createTaskMutation.isPending}
                          onClick={() => createTaskMutation.mutate()}
                          size="sm"
                        >
                          Add Onboarding Task
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {employee.onboardingTasks && employee.onboardingTasks.length > 0 ? (
                    employee.onboardingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs hover:bg-muted/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground">Responsible: {task.ownerType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={task.status} className="text-[10px] font-semibold" />
                          {task.status !== 'APPROVED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-border/80"
                              onClick={() => completeTaskMutation.mutate(task.id)}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No onboarding tasks registered yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 13. EXIT & OFFBOARDING */}
            <TabsContent value="exit" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Corporate Exit & Offboarding Lifecycle Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {activeExitRecord ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-xl border border-border/80">
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Exit Record ID:</span>
                          <span className="font-mono font-semibold text-primary">{activeExitRecord.exitCode}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Resignation Date:</span>
                          <span className="font-mono font-semibold text-foreground">
                            {new Date(activeExitRecord.resignationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Last Working Day (LWD):</span>
                          <span className="font-mono font-semibold text-foreground">
                            {new Date(activeExitRecord.adjustedLwd || activeExitRecord.lastWorkingDay).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Offboarding Status:</span>
                          <Badge variant="outline" className="font-mono text-[10.5px] font-semibold">
                            {activeExitRecord.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1 p-3 bg-card rounded-xl border">
                        <span className="font-semibold text-foreground">Stated Exit Reason & Remarks</span>
                        <p className="text-muted-foreground leading-relaxed">{activeExitRecord.exitReason}</p>
                        {activeExitRecord.remarks && (
                          <p className="text-[11px] text-muted-foreground italic mt-1">HR Notes: {activeExitRecord.remarks}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-muted-foreground text-[10.5px] block">Clearance Progress</span>
                          <StatusBadge status={activeExitRecord.clearanceStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'} label={activeExitRecord.clearanceStatus} className="text-[10px]" />
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-muted-foreground text-[10.5px] block">Exit Interview</span>
                          <StatusBadge status={activeExitRecord.exitInterviewStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'} label={activeExitRecord.exitInterviewStatus} className="text-[10px]" />
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-muted-foreground text-[10.5px] block">Full & Final (F&F)</span>
                          <StatusBadge status={activeExitRecord.fnfStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'} label={activeExitRecord.fnfStatus} className="text-[10px]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed rounded-xl space-y-1">
                      <p className="font-semibold text-foreground">No Exit Record Initiated</p>
                      <p className="text-muted-foreground text-[11px]">This employee is actively serving with no resignation logged.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* REGISTER FACE MODAL */}
      <RegisterFaceModal
        isOpen={isRegisterFaceOpen}
        employeeId={employee.id}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        employeeCode={employee.employeeCode}
        onClose={() => setIsRegisterFaceOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['employee', id] });
        }}
      />

      {/* VIEW REGISTERED FACE TEMPLATE DIALOG */}
      <Dialog open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
        <DialogContent className="max-w-md border-border/80 shadow-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span>Registered Biometric Template Details</span>
              </div>
              <Badge className="bg-purple-600 text-white font-mono text-[10px]">
                {employee.employeeCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified biometric facial template persisted in database.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {/* Registered Face Photo Preview Container */}
            <div className="flex flex-col items-center justify-center pt-1">
              {employee.facePhoto ? (
                <div className="relative w-40 h-48 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-lg">
                  <img
                    src={employee.facePhoto}
                    alt={`${employee.firstName} ${employee.lastName} Registered Face`}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute bottom-2 left-2 right-2 justify-center bg-black/75 text-white backdrop-blur-xs text-[9.5px] font-semibold">
                    ✓ Verified Registration Image
                  </Badge>
                </div>
              ) : (
                <div className="w-40 h-48 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center p-3 text-center bg-muted/20 text-muted-foreground">
                  <Camera className="h-8 w-8 mb-1 opacity-50 text-purple-500" />
                  <span className="text-[10px] font-medium">No Snapshot Available</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Re-register to store image preview</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Employee Profile</span>
              <strong className="text-sm font-bold text-foreground block">
                {employee.firstName} {employee.lastName}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[10px] uppercase">Template Status</span>
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 block mt-0.5">✓ Registered & Persisted</span>
              </div>
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <span className="text-purple-700 dark:text-purple-400 font-semibold block text-[10px] uppercase">Descriptor Model</span>
                <span className="font-bold text-xs text-purple-800 dark:text-purple-300 block mt-0.5">Affine 128-D HOG</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 font-mono text-[10.5px] space-y-1">
              <div className="text-purple-400 font-sans font-bold text-xs">🔒 Database Biometric Payload:</div>
              <div><span className="text-slate-500">Employee ID:</span> {employee.id}</div>
              <div><span className="text-slate-500">Registered Date:</span> {employee.faceRegisteredAt ? new Date(employee.faceRegisteredAt).toLocaleString() : 'N/A'}</div>
              <div><span className="text-slate-500">Registered By:</span> {employee.faceRegisteredBy || 'HR Administrator'}</div>
              <div><span className="text-slate-500">Vector Dimension:</span> 128 Float Array (L2 Normalized)</div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/60">
            <Button size="sm" variant="outline" onClick={() => setIsViewTemplateOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold gap-1.5"
              onClick={() => {
                setIsViewTemplateOpen(false);
                setIsRegisterFaceOpen(true);
              }}
            >
              <Camera className="h-3.5 w-3.5" /> Re-Register Face
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FINAL PROBATION REVIEW MODAL (3 BRANCHES) */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> FINAL PROBATION REVIEW
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              SAP SuccessFactors aligned three-way probation evaluation milestone.
            </p>
          </DialogHeader>

          {/* Employee Summary Header */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Employee</span>
              <p className="font-bold text-foreground mt-0.5">{employee.firstName} {employee.lastName}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{employee.employeeCode}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Joining Date</span>
              <p className="font-mono font-semibold text-foreground mt-0.5">
                {formatDateDisplay(employee.dateOfJoining)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Probation End</span>
              <p className="font-mono font-semibold text-foreground mt-0.5">
                {probationDetailCheckpoints?.endDateFormatted || '06-Mar-2027'}
              </p>
            </div>
          </div>

          {/* 3 Actions Radio Selector */}
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-wider text-foreground">
              Manager Recommendation *
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReviewDecision('CONFIRM')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${reviewDecision === 'CONFIRM'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'bg-background hover:bg-muted/40 border-border/70 text-foreground'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">○ Confirm Employee</span>
                  {reviewDecision === 'CONFIRM' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-muted-foreground">Successful completion & regularized</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewDecision('EXTEND')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${reviewDecision === 'EXTEND'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'bg-background hover:bg-muted/40 border-border/70 text-foreground'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">○ Extend Probation</span>
                  {reviewDecision === 'EXTEND' && <Clock className="h-4 w-4 text-amber-600" />}
                </div>
                <span className="text-[10px] text-muted-foreground">Define new end date & training plan</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewDecision('NOT_CONFIRM')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${reviewDecision === 'NOT_CONFIRM'
                    ? 'bg-red-500/10 border-red-500 text-red-900 dark:text-red-200 ring-2 ring-red-500/20'
                    : 'bg-background hover:bg-muted/40 border-border/70 text-foreground'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">○ Do Not Confirm</span>
                  {reviewDecision === 'NOT_CONFIRM' && <ShieldAlert className="h-4 w-4 text-red-600" />}
                </div>
                <span className="text-[10px] text-muted-foreground">Trigger exit clearance & notice</span>
              </button>
            </div>
          </div>

          {/* BRANCH 1: CONFIRM FORM */}
          {reviewDecision === 'CONFIRM' && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Confirmation Approval Parameters</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Confirmation Effective Date *</Label>
                  <Input
                    value={probationDetailCheckpoints?.endDateFormatted || '06-Mar-2027'}
                    readOnly
                    className="h-8 text-xs bg-background font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Confirmation Authority *</Label>
                  <Input
                    value={confirmAuthority}
                    onChange={(e) => setConfirmAuthority(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Appraisal Remarks / Recommendation *</Label>
                <Input
                  value={confirmRemarks}
                  onChange={(e) => setConfirmRemarks(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[11px] space-y-1">
                <p className="font-bold">Automated Confirmation Protocol:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  {isPermanentType ? (
                    <>
                      <li>Employment Status regularized to Active Confirmed Permanent Staff</li>
                      <li>Confirmation Letter generated and archived in Document Vault</li>
                      <li>Permanent tenure statutory protections and gratuity vesting activated</li>
                    </>
                  ) : (
                    <>
                      <li>Probation status regularized to Completed</li>
                      <li>Employment Type remains Contract – Fixed Term until contract expiry</li>
                      <li>Contract tenure retains active good standing (does not convert to permanent)</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* BRANCH 2: EXTEND FORM */}
          {reviewDecision === 'EXTEND' && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3.5 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>⏳ Extend Probation Parameters</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Current End Date</Label>
                  <Input
                    value={probationDetailCheckpoints?.endDateFormatted || '06-Mar-2027'}
                    readOnly
                    className="h-8 text-xs bg-muted/40 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Extension Period *</Label>
                  <Select value={extensionPeriod} onValueChange={setExtensionPeriod}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Month">1 Month</SelectItem>
                      <SelectItem value="2 Months">2 Months</SelectItem>
                      <SelectItem value="3 Months">3 Months</SelectItem>
                      <SelectItem value="6 Months">6 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] flex items-center justify-between">
                    <span>New Probation End Date *</span>
                    <span className="text-[9px] text-emerald-600 font-bold">AUTO</span>
                  </Label>
                  <Input
                    value={formatDateDisplay(calculatedNewEndDate)}
                    readOnly
                    className="h-8 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-900 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Extension Reason *</Label>
                  <Select value={extensionReason} onValueChange={setExtensionReason}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Performance improvement required">Performance improvement required</SelectItem>
                      <SelectItem value="Project timeline extension">Project timeline extension</SelectItem>
                      <SelectItem value="Attendance / leave evaluation">Attendance / leave evaluation</SelectItem>
                      <SelectItem value="Skill development required">Skill development required</SelectItem>
                      <SelectItem value="Other operational reason">Other operational reason</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Improvement Areas *</Label>
                <Input
                  value={improvementAreas}
                  onChange={(e) => setImprovementAreas(e.target.value)}
                  placeholder="e.g. Machine operation / production accuracy"
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Support / Training</Label>
                  <Input
                    value={supportTraining}
                    onChange={(e) => setSupportTraining(e.target.value)}
                    placeholder="e.g. Additional machine training"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Review By</Label>
                  <Select value={extensionReviewBy} onValueChange={setExtensionReviewBy}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reporting Manager + HR">Reporting Manager + HR</SelectItem>
                      <SelectItem value="HR Only">HR Only</SelectItem>
                      <SelectItem value="Department Head + HR">Department Head + HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Employee Comments</Label>
                <textarea
                  value={employeeComments}
                  onChange={(e: any) => setEmployeeComments(e.target.value)}
                  placeholder="Feedback shared during review meeting..."
                  className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          {/* BRANCH 3: DO NOT CONFIRM FORM */}
          {reviewDecision === 'NOT_CONFIRM' && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3.5 text-xs">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span>Exit & Offboarding Workflow Initiation</span>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Reason Required *</Label>
                <Select value={nonConfirmReason} onValueChange={setNonConfirmReason}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Performance did not meet required standards">Performance did not meet required standards</SelectItem>
                    <SelectItem value="Probation criteria not fulfilled">Probation criteria not fulfilled</SelectItem>
                    <SelectItem value="Operational conduct / attendance issues">Operational conduct / attendance issues</SelectItem>
                    <SelectItem value="Position discontinued / redundancy">Position discontinued / redundancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Notice Period (Days) *</Label>
                  <Input
                    type="number"
                    value={nonConfirmNoticeDays}
                    onChange={(e) => setNonConfirmNoticeDays(Number(e.target.value))}
                    className="h-8 text-xs bg-background font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] flex items-center justify-between">
                    <span>Last Working Date *</span>
                    <span className="text-[9px] text-red-600 font-bold">AUTO</span>
                  </Label>
                  <Input
                    value={formatDateDisplay(calculatedLastWorkingDate)}
                    readOnly
                    className="h-8 text-xs bg-red-500/10 border-red-500/30 text-red-900 font-mono font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Detailed Assessment / Justification *</Label>
                <textarea
                  value={nonConfirmFeedback}
                  onChange={(e: any) => setNonConfirmFeedback(e.target.value)}
                  className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200 text-[11px]">
                <p className="font-bold">Offboarding Protocol Triggered:</p>
                <p className="text-[10px] mt-0.5 leading-relaxed">
                  Status moves to Notice Period. Exit clearance, asset return, and Full & Final settlement are initiated. Employee history is safely preserved in master records.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submitProbationReviewMutation.isPending}
              onClick={() => submitProbationReviewMutation.mutate()}
              className={`text-xs font-semibold px-4 cursor-pointer ${reviewDecision === 'CONFIRM'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : reviewDecision === 'EXTEND'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              {submitProbationReviewMutation.isPending ? 'Processing...' : reviewDecision === 'CONFIRM' ? 'Submit Review' : reviewDecision === 'EXTEND' ? 'Submit Extension' : 'Confirm & Initiate Exit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONTRACT LIFECYCLE & RENEWAL ACTION MODAL */}
      <Dialog open={isContractActionOpen} onOpenChange={setIsContractActionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {contractActionTab === 'RENEW' && (
                <>
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <span>Renew Contract — Create New Term Version</span>
                </>
              )}
              {contractActionTab === 'CONVERT_PERMANENT' && (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span>Convert Contract Employee to Permanent</span>
                </>
              )}
              {contractActionTab === 'DO_NOT_RENEW' && (
                <>
                  <UserX className="h-5 w-5 text-red-600" />
                  <span>Contract Non-Renewal & Separation Protocol</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Action Tabs switcher inside modal */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-muted/50 text-xs">
            <button
              type="button"
              onClick={() => setContractActionTab('RENEW')}
              className={`py-1.5 px-3 rounded-md font-semibold transition-all ${
                contractActionTab === 'RENEW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Renew Contract
            </button>
            <button
              type="button"
              onClick={() => setContractActionTab('CONVERT_PERMANENT')}
              className={`py-1.5 px-3 rounded-md font-semibold transition-all ${
                contractActionTab === 'CONVERT_PERMANENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Convert to Permanent
            </button>
            <button
              type="button"
              onClick={() => setContractActionTab('DO_NOT_RENEW')}
              className={`py-1.5 px-3 rounded-md font-semibold transition-all ${
                contractActionTab === 'DO_NOT_RENEW'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Do Not Renew
            </button>
          </div>

          {/* BRANCH 1: RENEW CONTRACT */}
          {contractActionTab === 'RENEW' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
                <p className="font-bold">Chained Contract Versioning Protocol:</p>
                <p className="text-[11px] mt-0.5">
                  Creates new contract version <strong>{nextContractNumber}</strong> starting <strong>07-Sep-2027</strong>. Historical record <strong>{activeContractVersion.contractNumber}</strong> is archived in contract history.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Current Contract</Label>
                  <Input value={activeContractVersion.contractNumber} readOnly className="h-8 text-xs bg-muted/40 font-mono font-semibold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Current End Date</Label>
                  <Input value="06-Sep-2027" readOnly className="h-8 text-xs bg-muted/40 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">New Contract Start Date *</Label>
                  <Input value="07-Sep-2027" readOnly className="h-8 text-xs bg-blue-500/10 border-blue-500/30 text-blue-900 font-mono font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">New Contract End Date *</Label>
                  <Input value="06-Sep-2028" readOnly className="h-8 text-xs bg-blue-500/10 border-blue-500/30 text-blue-900 font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Contract Duration</Label>
                  <Input value="12 Months" readOnly className="h-8 text-xs bg-muted/40" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Salary / Compensation Revision (Optional)</Label>
                  <Input
                    value={renewSalaryRevision}
                    onChange={(e) => setRenewSalaryRevision(e.target.value)}
                    placeholder="e.g. +8% Standard annual revision"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Renewal Reason *</Label>
                <textarea
                  value={renewReason}
                  onChange={(e) => setRenewReason(e.target.value)}
                  placeholder="Reason for renewing fixed term contract..."
                  className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">New Contract Document (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setRenewDocFile(e.target.files?.[0]?.name || `${nextContractNumber}_Agreement.pdf`)}
                    className="h-8 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Default: {nextContractNumber}_Agreement.pdf</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Manager Recommendation</Label>
                  <Select value={renewManagerRec} onValueChange={setRenewManagerRec}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Not Approved">Not Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">HR Approval</Label>
                  <Select value={renewHrApproval} onValueChange={setRenewHrApproval}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Required">Required (Management Approved)</SelectItem>
                      <SelectItem value="Conditional">Conditional Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* BRANCH 2: CONVERT TO PERMANENT */}
          {contractActionTab === 'CONVERT_PERMANENT' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                <p className="font-bold">Permanent Regularization Authority:</p>
                <p className="text-[11px] mt-0.5">
                  Converts employment type to <strong>Permanent</strong> while preserving continuous tenure from Date of Joining ({formatDateDisplay(employee.dateOfJoining)}). Gratuity vesting, permanent grade benefits, and full tenure protections apply.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Current Employment Type</Label>
                  <Input value="Contract – Fixed Term" readOnly className="h-8 text-xs bg-muted/40 font-semibold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">New Employment Type</Label>
                  <Input value="Permanent" readOnly className="h-8 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-900 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Conversion Effective Date *</Label>
                  <Input
                    type="date"
                    value={convertEffectiveDate}
                    onChange={(e) => setConvertEffectiveDate(e.target.value)}
                    className="h-8 text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Manager Recommendation</Label>
                  <Select value={convertManagerRec} onValueChange={setConvertManagerRec}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Reason for Conversion *</Label>
                <textarea
                  value={convertReason}
                  onChange={(e) => setConvertReason(e.target.value)}
                  placeholder="Justification for converting to permanent employment..."
                  className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">HR Approval</Label>
                  <Input value="Required (HR Management Board)" readOnly className="h-8 text-xs bg-muted/40" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Confirmation / Permanent Letter</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setConvertDocFile(e.target.files?.[0]?.name || 'Permanent_Regularization_Letter.pdf')}
                    className="h-8 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BRANCH 3: DO NOT RENEW */}
          {contractActionTab === 'DO_NOT_RENEW' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200">
                <p className="font-bold">Statutory Non-Renewal Protocol:</p>
                <p className="text-[11px] mt-0.5">
                  Notice period initiates immediately. Contract status transitions to <strong>Non-Renewal Approved</strong>, linking to Exit & Offboarding. Employee profile is safely retained in history (not deleted).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Contract End Date</Label>
                  <Input value="06-Sep-2027" readOnly className="h-8 text-xs bg-muted/40 font-mono font-semibold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Notice Period (Days) *</Label>
                  <Input
                    type="number"
                    value={nonRenewNoticeDays}
                    onChange={(e) => setNonRenewNoticeDays(Number(e.target.value))}
                    className="h-8 text-xs bg-background font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Reason for Non-Renewal *</Label>
                <Select value={nonRenewReason} onValueChange={setNonRenewReason}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contract Term Concluded">Contract Term Concluded</SelectItem>
                    <SelectItem value="Project Completion / Phase End">Project Completion / Phase End</SelectItem>
                    <SelectItem value="Organizational Restructuring">Organizational Restructuring</SelectItem>
                    <SelectItem value="Performance Benchmarks Not Reached">Performance Benchmarks Not Reached</SelectItem>
                    <SelectItem value="Budget / Headcount Realignment">Budget / Headcount Realignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Manager Comments (Optional)</Label>
                  <Input
                    value={nonRenewManagerComments}
                    onChange={(e) => setNonRenewManagerComments(e.target.value)}
                    placeholder="Manager operational feedback..."
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">HR Comments (Optional)</Label>
                  <Input
                    value={nonRenewHrComments}
                    onChange={(e) => setNonRenewHrComments(e.target.value)}
                    placeholder="HR compliance notes..."
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Final Decision Date</Label>
                <Input value={formatDateDisplay(new Date())} readOnly className="h-8 text-xs bg-muted/40 font-mono" />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsContractActionOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submitContractActionMutation.isPending}
              onClick={() => submitContractActionMutation.mutate()}
              className={`text-xs font-semibold px-4 cursor-pointer ${
                contractActionTab === 'RENEW'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : contractActionTab === 'CONVERT_PERMANENT'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {submitContractActionMutation.isPending
                ? 'Submitting...'
                : contractActionTab === 'RENEW'
                ? 'Submit Renewal'
                : contractActionTab === 'CONVERT_PERMANENT'
                ? 'Confirm Permanent Conversion'
                : 'Approve Non-Renewal & Link Exit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-2xs">
      <CardContent className="p-4 text-xs">
        <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">{label}</p>
        <p className="mt-1 text-sm font-bold text-foreground truncate">{value}</p>
      </CardContent>
    </Card>
  );
}
