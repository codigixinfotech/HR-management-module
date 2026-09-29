import { useRef, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Plus,
  Check,
  Laptop,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
  Camera,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  IndianRupee,
  Briefcase,
  Calendar,
  Clock,
  Sparkles,
  Building,
  UserCheck,
  RefreshCw,
  UserX,
  User,
  Users,
  MapPin,
  GraduationCap,
  CreditCard,
  Printer,
  TrendingUp,
  Edit3,
  Lock,
  Send,
  Save,
  X,
  Info,
  FileUp,
} from 'lucide-react';
import { isSuperAdminUser, isCompanyAdminUser, isBranchAdminUser } from '@/lib/modules';
import { employeesApi } from '@/api/employees';
import { assetsApi } from '@/api/asset-management';
import { payGradesApi } from '@/api/cost-grades';
import { exitsApi } from '@/api/exits';
import { salaryAssignmentsApi } from '@/api/payroll';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { notificationStore } from '@/utils/notificationStore';
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
  const isMyProfile = rawId === 'me' || !rawId || (!!authUser?.employee?.id && employee?.id === authUser.employee.id);
  const isAdmin = isSuperAdminUser(authUser) || isCompanyAdminUser(authUser) || isBranchAdminUser(authUser);
  const isSelfEmployee = isMyProfile && !isAdmin;

  const [activeEditSection, setActiveEditSection] = useState<string | null>(null);

  const [draftPersonal, setDraftPersonal] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    religion: '',
    nationality: '',
    personalEmail: '',
    phone: '',
    facePhoto: '',
  });

  const [draftContact, setDraftContact] = useState({
    phone: '',
    personalEmail: '',
    currentAddress: '',
    permanentAddress: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
  });
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  const [draftFamily, setDraftFamily] = useState({
    familyMemberName: '',
    familyRelationship: '',
    familyDob: '',
    familyContact: '',
    nomineeName: '',
    nomineeRelationship: '',
    nomineeShare: '',
  });

  const [draftEducation, setDraftEducation] = useState({
    educationQualification: '',
    educationSpecialization: '',
    educationInstitution: '',
    educationUniversity: '',
    educationPassingYear: '',
    educationPercentage: '',
  });

  const [draftExperience, setDraftExperience] = useState({
    prevCompany: '',
    prevJobTitle: '',
    prevStartDate: '',
    prevEndDate: '',
    prevTotalExp: '',
    prevReasonForLeaving: '',
  });

  const [draftBanking, setDraftBanking] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankBranchName: '',
    bankAccountHolderName: '',
  });

  const [draftEmployment, setDraftEmployment] = useState({
    workMode: 'Onsite',
    shift: 'General Day Shift (G)',
  });

  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycDocType, setKycDocType] = useState('PAN');
  const [kycDocNumber, setKycDocNumber] = useState('');
  const [kycRemarks, setKycRemarks] = useState('');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const handleStartEdit = async (section: string) => {
    let emp = employee;
    try {
      const fetched = await queryClient.fetchQuery({
        queryKey: ['employee', id],
        queryFn: () => employeesApi.get(id!),
        staleTime: 0,
      });
      if (fetched) {
        emp = fetched;
      }
    } catch (err) {
      console.warn('Could not refetch employee before editing, falling back to cache:', err);
    }

    if (!emp) return;
    setActiveEditSection(section);

    if (section === 'personal') {
      setDraftPersonal({
        firstName: emp.firstName || '',
        middleName: emp.middleName || '',
        lastName: emp.lastName || '',
        dateOfBirth: emp.dateOfBirth ? String(emp.dateOfBirth).split('T')[0] : '',
        gender: emp.gender || '',
        maritalStatus: emp.maritalStatus || '',
        bloodGroup: emp.bloodGroup || '',
        religion: emp.religion || '',
        nationality: emp.nationality || 'Indian',
        personalEmail: emp.personalEmail || '',
        phone: emp.phone || '',
        facePhoto: emp.facePhoto || '',
      });
    } else if (section === 'employment') {
      setDraftEmployment({
        workMode: emp.workMode || 'Onsite',
        shift: emp.shift || 'General Day Shift (G)',
      });
    } else if (section === 'contact') {
      setDraftContact({
        phone: emp.phone || '',
        personalEmail: emp.personalEmail || '',
        currentAddress: emp.currentAddress || emp.addressLine1 || '',
        permanentAddress: emp.permanentAddress || '',
        addressLine1: emp.addressLine1 || emp.currentAddress || '',
        addressLine2: emp.addressLine2 || '',
        city: emp.city || '',
        state: emp.state || '',
        country: emp.country || 'India',
        pincode: emp.pincode || '',
        emergencyContactName: emp.emergencyContactName || '',
        emergencyContactRelationship: emp.emergencyContactRelationship || '',
        emergencyContactPhone: emp.emergencyContactPhone || '',
      });
      setSameAsCurrentAddress(Boolean(emp.currentAddress && emp.permanentAddress && emp.currentAddress === emp.permanentAddress));
    } else if (section === 'family') {
      setDraftFamily({
        familyMemberName: emp.familyMemberName || '',
        familyRelationship: emp.familyRelationship || '',
        familyDob: emp.familyDob ? String(emp.familyDob).split('T')[0] : '',
        familyContact: emp.familyContact || '',
        nomineeName: emp.nomineeName || '',
        nomineeRelationship: emp.nomineeRelationship || '',
        nomineeShare: emp.nomineeShare != null ? String(emp.nomineeShare) : '',
      });
    } else if (section === 'education') {
      setDraftEducation({
        educationQualification: emp.educationQualification || '',
        educationSpecialization: emp.educationSpecialization || '',
        educationInstitution: emp.educationInstitution || '',
        educationUniversity: emp.educationUniversity || '',
        educationPassingYear: emp.educationPassingYear != null ? String(emp.educationPassingYear) : '',
        educationPercentage: emp.educationPercentage != null ? String(emp.educationPercentage) : '',
      });
    } else if (section === 'experience') {
      setDraftExperience({
        prevCompany: emp.prevCompany || '',
        prevJobTitle: emp.prevJobTitle || '',
        prevStartDate: emp.prevStartDate ? String(emp.prevStartDate).split('T')[0] : '',
        prevEndDate: emp.prevEndDate ? String(emp.prevEndDate).split('T')[0] : '',
        prevTotalExp: emp.prevTotalExp || '',
        prevReasonForLeaving: emp.prevReasonForLeaving || '',
      });
    } else if (section === 'banking') {
      setDraftBanking({
        bankName: emp.bankName || '',
        bankAccountNumber: emp.bankAccountNumber || '',
        bankIfscCode: emp.bankIfscCode || '',
        bankBranchName: emp.bankBranchName || '',
        bankAccountHolderName: emp.bankAccountHolderName || '',
      });
    }
  };

  const profileSaveMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      const payload: Record<string, any> = {};

      for (const [k, v] of Object.entries(data)) {
        if (v === '' && employee && (employee as any)[k] !== undefined && (employee as any)[k] !== null && (employee as any)[k] !== '') {
          payload[k] = (employee as any)[k];
        } else {
          payload[k] = v;
        }
      }

      if (section === 'education') {
        payload.educationPassingYear =
          payload.educationPassingYear !== '' && payload.educationPassingYear != null
            ? parseInt(String(payload.educationPassingYear), 10)
            : undefined;
        payload.educationPercentage =
          payload.educationPercentage !== '' && payload.educationPercentage != null
            ? parseFloat(String(payload.educationPercentage))
            : undefined;
      } else if (section === 'family') {
        payload.nomineeShare =
          payload.nomineeShare !== '' && payload.nomineeShare != null
            ? parseFloat(String(payload.nomineeShare))
            : undefined;
        payload.familyDob = payload.familyDob || undefined;
      } else if (section === 'personal') {
        payload.dateOfBirth = payload.dateOfBirth || undefined;
      } else if (section === 'experience') {
        payload.prevStartDate = payload.prevStartDate || undefined;
        payload.prevEndDate = payload.prevEndDate || undefined;
      }

      if (isMyProfile) {
        return await employeesApi.updateMyProfile(payload);
      } else {
        return await employeesApi.update(targetEmpId, payload);
      }
    },
    onSuccess: (updatedEmployee: any, variables) => {
      if (updatedEmployee) {
        queryClient.setQueryData(['employee', id], updatedEmployee);
        if (targetEmpId && targetEmpId !== id) {
          queryClient.setQueryData(['employee', targetEmpId], updatedEmployee);
        }
        if (rawId === 'me' && authUser) {
          setUser({
            ...authUser,
            employee: {
              id: updatedEmployee.id,
              employeeCode: updatedEmployee.employeeCode,
              firstName: updatedEmployee.firstName,
              lastName: updatedEmployee.lastName,
              fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
              departmentId: updatedEmployee.departmentId,
              departmentName: updatedEmployee.department?.name || null,
              designationId: updatedEmployee.designationId,
              designationTitle: updatedEmployee.designation?.title || null,
            },
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setActiveEditSection(null);

      const sectionNames: Record<string, string> = {
        personal: 'Personal Profile',
        employment: 'Employment Details',
        contact: 'Contact & Address',
        family: 'Family & Nominee',
        education: 'Education Details',
        experience: 'Previous Experience',
        banking: 'Banking Information',
      };
      const sName = sectionNames[variables.section] || variables.section;

      try {
        const empName = updatedEmployee
          ? `${updatedEmployee.firstName} ${updatedEmployee.lastName}`
          : employee
          ? `${employee.firstName} ${employee.lastName}`
          : (authUser?.name || 'Employee');
        const empCode = updatedEmployee?.employeeCode || employee?.employeeCode || 'EMP';
        const branchName = updatedEmployee?.branch?.name || employee?.branch?.name || authUser?.branch?.name || 'Branch';

        notificationStore.addNotifications([
          {
            type: 'SYSTEM',
            employeeId: '',
            employeeName: empName,
            title: `Profile Update: ${sName}`,
            message: `${empName} (${empCode}) updated details in ${sName} at ${branchName}. Sent to Branch Admin for verification.`,
            actionUrl: `/employees/detail/${employee?.id || 'me'}?tab=${variables.section}`,
            sender: employee?.workEmail || authUser?.email || 'Self-Service Portal',
          },
        ]);
      } catch (err) {
        console.error('Failed to dispatch notification', err);
      }

      toast.success(`${sName} updated successfully and notification sent to Branch Admin!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to save changes');
    },
  });

  const handleKycSubmit = async () => {
    if (!kycDocNumber && !kycFile) {
      toast.error('Please provide a document number or upload a document file.');
      return;
    }
    setIsSubmittingKyc(true);
    try {
      if (kycFile && targetEmpId) {
        await employeesApi.uploadDocument(targetEmpId, kycFile, kycDocType);
      }

      const empName = employee ? `${employee.firstName} ${employee.lastName}` : (authUser?.name || 'Employee');
      const empCode = employee?.employeeCode || 'EMP';
      const branchName = employee?.branch?.name || authUser?.branch?.name || 'Branch';

      notificationStore.addNotifications([
        {
          type: 'SYSTEM',
          employeeId: '',
          employeeName: empName,
          title: `KYC Update Request: ${kycDocType}`,
          message: `${empName} (${empCode}) submitted a statutory KYC update request for ${kycDocType} (${kycDocNumber || 'Document Attached'}). Remarks: ${kycRemarks || 'Verification requested.'} at ${branchName}.`,
          actionUrl: `/employees/detail/${employee?.id || 'me'}?tab=kyc`,
          sender: employee?.workEmail || authUser?.email || 'Self-Service Portal',
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['employee'] });
      setIsKycModalOpen(false);
      setKycDocNumber('');
      setKycRemarks('');
      setKycFile(null);
      toast.success('KYC Update Request submitted and sent to Branch Admin for verification!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to submit KYC request');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

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
    queryKey: ['employee-exits', targetEmpId, (employee as any)?.companyId],
    queryFn: () => exitsApi.list({ search: targetEmpId, companyId: (employee as any)?.companyId }),
    enabled: !!targetEmpId,
  });
  const activeExitRecord = employeeExits[0] || null;

  const employeeCompanyId = (employee as any)?.companyId;

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', employeeCompanyId],
    queryFn: () => assetsApi.list(employeeCompanyId),
    enabled: !!employeeCompanyId,
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

  const availableAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        (!employeeCompanyId || a.companyId === employeeCompanyId) &&
        (a.status === 'IN_STOCK' || a.status === 'AVAILABLE') &&
        a.assignmentType !== 'LOCATION' &&
        a.assignmentType !== 'DEPARTMENT',
    );
  }, [assets, employeeCompanyId]);

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
      toast.success('Document uploaded to vault and queued for HR verification');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (isMyProfile) {
        try {
          const empName = employee ? `${employee.firstName} ${employee.lastName}` : (authUser?.name || 'Employee');
          const empCode = employee?.employeeCode || 'EMP';
          const branchName = employee?.branch?.name || authUser?.branch?.name || 'Branch';

          notificationStore.addNotifications([
            {
              type: 'SYSTEM',
              employeeId: '',
              employeeName: empName,
              title: `New Document Uploaded: ${docType}`,
              message: `${empName} (${empCode}) uploaded a document (${docType}) in Document Vault for HR verification at ${branchName}.`,
              actionUrl: `/employees/detail/${employee?.id || 'me'}?tab=documents`,
              sender: employee?.workEmail || authUser?.email || 'Self-Service Portal',
            },
          ]);
        } catch (err) {
          console.error('Failed to notify branch admin', err);
        }
      }
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

  const isMe =
    rawId === 'me' ||
    id === 'me' ||
    employee?.id === authUser?.employee?.id ||
    employee?.userId === authUser?.id ||
    employee?.workEmail === authUser?.email;

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
          <Link to={isMe ? "/dashboard" : "/employees"}>
            <ArrowLeft className="h-4 w-4" /> {isMe ? "Return to Dashboard" : "Return to Employee Directory"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar Breadcrumb & Navigation Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" asChild>
            <Link to={isMe ? "/dashboard" : "/employees"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {isMe ? 'My Profile • Employee Self-Service Dossier' : 'Employee Master Record'}
              </span>
              {isMe && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active User Profile
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5 flex items-center gap-2">
              {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName}
            </h1>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {employee.facePhoto ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs py-1 px-2.5 gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Face Registered
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterFaceOpen(true)}
              className="text-xs h-8 gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
            >
              <Camera className="h-3.5 w-3.5" /> Register Face
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-8 gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Profile
          </Button>

          {/* Admin status control */}
          {!isMe && (isSuperAdminUser(authUser) || isCompanyAdminUser(authUser) || isBranchAdminUser(authUser)) && (
            <div className="w-36">
              <Select value={employee.status} onValueChange={(v) => statusMutation.mutate(v as EmployeeStatus)}>
                <SelectTrigger className="h-8 text-xs font-semibold">
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
          )}
        </div>
      </div>

      {/* ── Executive Hero Card ── */}
      <Card className="border border-border/80 shadow-xs overflow-hidden bg-gradient-to-br from-card via-card to-muted/20">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-cyan-500" />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Avatar + Identity + Metadata */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              {/* Avatar Photo */}
              <div className="relative shrink-0">
                {employee.facePhoto ? (
                  <img
                    src={employee.facePhoto}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30 shadow-md ring-4 ring-primary/5"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-primary/5 uppercase tracking-wider">
                    {employee.firstName?.[0] || 'E'}{employee.lastName?.[0] || 'M'}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center shadow-xs ${
                  employee.status === 'ACTIVE' ? 'bg-emerald-500' : employee.status === 'PROBATION' ? 'bg-amber-500' : 'bg-muted-foreground'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              </div>

              {/* Title & Core Details */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted border border-border/80 text-foreground">
                    {employee.employeeCode}
                  </span>
                  <StatusBadge status={employee.status} />
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/25">
                    {employee.employmentType || 'PERMANENT'}
                  </Badge>
                </div>

                <p className="text-xs font-medium text-muted-foreground flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground">{employee.designation?.title || 'Team Member'}</span>
                  <span>•</span>
                  <span>{employee.department?.name || 'General Operations'}</span>
                  <span>•</span>
                  <span>{employee.branch?.name || 'Head Office'}</span>
                  <span>•</span>
                  <span className="text-muted-foreground/80">{employee.company?.name || 'Enterprise'}</span>
                </p>

                {/* Key Telemetry Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium flex items-center gap-1 border border-border/50">
                    <Briefcase className="h-3 w-3 text-primary" />
                    <span>{employee.workMode || 'Onsite'}</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium flex items-center gap-1 border border-border/50">
                    <Clock className="h-3 w-3 text-indigo-500" />
                    <span>{employee.shift || 'General Day Shift (G)'}</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium flex items-center gap-1 border border-border/50">
                    <Calendar className="h-3 w-3 text-emerald-600" />
                    <span>Joined: {formatDateDisplay(employee.dateOfJoining)}</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium flex items-center gap-1 border border-border/50 font-mono">
                    <Award className="h-3 w-3 text-amber-500" />
                    <span>Grade: {getGradeLevelDisplay(employee.grade, employee.level)}</span>
                  </span>
                  {employee.reportingManager && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium flex items-center gap-1 border border-border/50">
                      <UserCheck className="h-3 w-3 text-cyan-600" />
                      <span>Manager: {employee.reportingManager.firstName} {employee.reportingManager.lastName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Overview Matrix Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/60">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center min-w-[95px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Documents</span>
                <span className="text-base font-black text-foreground mt-0.5 block">{employee.documents?.length || 0}</span>
                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Vault</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center min-w-[95px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Assets</span>
                <span className="text-base font-black text-foreground mt-0.5 block">{employee.currentAssets?.length || 0}</span>
                <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-medium">Allocated</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center min-w-[95px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">LMS / Skills</span>
                <span className="text-base font-black text-foreground mt-0.5 block">{employee.courseEnrollments?.length || 0}</span>
                <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-medium">Upskilling</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center min-w-[95px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">KYC Status</span>
                <span className="text-base font-black text-foreground mt-0.5 block font-mono">
                  {employee.kycStatus === 'VERIFIED' ? '✓ OK' : 'PENDING'}
                </span>
                <span className="text-[9.5px] text-cyan-600 dark:text-cyan-400 font-medium">Statutory</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={searchParams.get('tab') || 'employment'} className="w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs List */}
          <div className="md:w-64 shrink-0">
            <Card className="border border-border/80 shadow-2xs sticky top-20">
              <CardContent className="p-2">
                <TabsList className="flex flex-col h-auto bg-transparent w-full space-y-1 items-stretch">
                  <TabsTrigger value="personal" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>Personal Profile</span>
                  </TabsTrigger>

                  <TabsTrigger value="employment" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>Employment Details</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase font-bold tracking-wider data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.employmentType || 'PERM'}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="biometric" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <Camera className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                      <span>Attendance & Biometric</span>
                    </div>
                    {employee.facePhoto && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" title="Face Registered" />
                    )}
                  </TabsTrigger>

                  <TabsTrigger value="contact" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>Contact & Address</span>
                  </TabsTrigger>

                  <TabsTrigger value="family" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>Family & Nominee</span>
                  </TabsTrigger>

                  <TabsTrigger value="education" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span>Education Details</span>
                  </TabsTrigger>

                  <TabsTrigger value="experience" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Previous Experience</span>
                  </TabsTrigger>

                  <TabsTrigger value="banking" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 shrink-0" />
                    <span>Banking Information</span>
                  </TabsTrigger>

                  <TabsTrigger value="kyc" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Aadhaar / PAN / KYC</span>
                    </div>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                      employee.kycStatus === 'VERIFIED' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                    }`}>
                      {employee.kycStatus || 'PENDING'}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="pf_esic" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>PF & ESIC Registry</span>
                  </TabsTrigger>

                  <TabsTrigger value="salary" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                    <span>Salary Structure</span>
                  </TabsTrigger>

                  <TabsTrigger value="documents" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>Document Vault</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.documents?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="assets" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-3.5 w-3.5 shrink-0" />
                      <span>Assigned Assets</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.currentAssets?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="training" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 shrink-0" />
                      <span>Upskilling & LMS</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.courseEnrollments?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="performance" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      <span>KPIs & Performance</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.kpis?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="notes" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>Internal HR Notes</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.hrNotes?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="timeline" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Career & History</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.positionHistory?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="onboarding" className="justify-between text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Onboarding Tasks</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {employee.onboardingTasks?.length || 0}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="exit" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                    <UserX className="h-3.5 w-3.5 shrink-0" />
                    <span>Exit & Offboarding</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Tabs Content */}
          <div className="flex-1 min-w-0">
            {/* 1. PERSONAL */}
            <TabsContent value="personal" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Personal Profile Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Basic personal identity, demographic data, and contact info.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeEditSection === 'personal' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'personal', data: draftPersonal })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('personal')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {activeEditSection === 'personal' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                          You are editing your personal profile. Saved changes will notify your Branch Admin for audit and verification.
                        </span>
                      </div>

                      <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
                        <div className="h-16 w-16 rounded-full bg-primary/10 border flex items-center justify-center overflow-hidden shrink-0">
                          {draftPersonal.facePhoto ? (
                            <img src={draftPersonal.facePhoto} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-primary/60" />
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold block mb-1">Profile Photo</Label>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="profile-photo-input"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  toast.error('Image size must be less than 2MB');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setDraftPersonal((prev) => ({ ...prev, facePhoto: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => document.getElementById('profile-photo-input')?.click()}
                          >
                            <Camera className="h-3 w-3" /> Change Photo
                          </Button>
                          <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG or WEBP (Max 2MB)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">First Name *</Label>
                          <Input
                            value={draftPersonal.firstName}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, firstName: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Middle Name</Label>
                          <Input
                            value={draftPersonal.middleName}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, middleName: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Last Name *</Label>
                          <Input
                            value={draftPersonal.lastName}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, lastName: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Date of Birth</Label>
                          <Input
                            type="date"
                            value={draftPersonal.dateOfBirth}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gender</Label>
                          <Select
                            value={draftPersonal.gender || 'OTHER'}
                            onValueChange={(val) => setDraftPersonal((p) => ({ ...p, gender: val }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Marital Status</Label>
                          <Select
                            value={draftPersonal.maritalStatus || 'Single'}
                            onValueChange={(val) => setDraftPersonal((p) => ({ ...p, maritalStatus: val }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                              <SelectItem value="Divorced">Divorced</SelectItem>
                              <SelectItem value="Widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Blood Group</Label>
                          <Select
                            value={draftPersonal.bloodGroup || 'O+'}
                            onValueChange={(val) => setDraftPersonal((p) => ({ ...p, bloodGroup: val }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Blood Group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Religion</Label>
                          <Input
                            value={draftPersonal.religion}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, religion: e.target.value }))}
                            placeholder="e.g. Hindu, Christian, Muslim"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Nationality</Label>
                          <Input
                            value={draftPersonal.nationality}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, nationality: e.target.value }))}
                            placeholder="e.g. Indian"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Personal Email</Label>
                          <Input
                            type="email"
                            value={draftPersonal.personalEmail}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, personalEmail: e.target.value }))}
                            placeholder="personal@email.com"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Personal Phone</Label>
                          <Input
                            type="tel"
                            value={draftPersonal.phone}
                            onChange={(e) => setDraftPersonal((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="+91 9876543210"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Full Name</p>
                          <p className="font-semibold text-foreground">{[employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Date of Birth</p>
                          <p className="font-semibold">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Gender</p>
                          <p className="font-semibold uppercase">{employee.gender ?? 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Marital Status</p>
                          <p className="font-semibold">{employee.maritalStatus || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Nationality</p>
                          <p className="font-semibold">{employee.nationality || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Blood Group</p>
                          <p className="font-semibold">{employee.bloodGroup || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Religion</p>
                          <p className="font-semibold">{employee.religion || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Personal Phone</p>
                          <p className="font-semibold">{employee.phone || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-muted-foreground font-medium">Personal Email</p>
                          <p className="font-semibold">{employee.personalEmail || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    {activeEditSection === 'employment' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'employment', data: draftEmployment })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('employment')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
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
                  {activeEditSection === 'employment' && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                      <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>
                        You can update your preferred Shift and Work Mode. Organizational and payroll details are marked with 🔒 HR Controlled and remain read-only.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Employment Type - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Employment Type</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.employmentType || 'Permanent'}</p>
                    </div>

                    {/* Employment Status - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Employment Status</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.status || 'Active'}</p>
                    </div>

                    {/* Date of Joining - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Date of Joining</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">
                        {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString('en-GB') : 'Not specified'}
                      </p>
                    </div>

                    {/* Employee Code - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Employee Code</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-mono font-bold text-primary text-xs">{employee.employeeCode}</p>
                    </div>

                    {/* Department - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Department</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.department?.name || 'Production'}</p>
                    </div>

                    {/* Designation - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Designation</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.designation?.title || 'Production Operator'}</p>
                    </div>

                    {/* Reporting Manager - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Reporting Manager</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">
                        {employee.reportingManager ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}` : 'None / MD Direct'}
                      </p>
                    </div>

                    {/* Employee Category - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Employee Category</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.employeeCategory || 'Executive'}</p>
                    </div>

                    {/* Shift Assignment - EDITABLE */}
                    <div className={`space-y-1 p-1.5 rounded-lg ${activeEditSection === 'employment' ? 'bg-primary/5 border border-primary/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Shift Assignment</p>
                        {activeEditSection === 'employment' ? (
                          <span className="text-[8.5px] text-primary bg-primary/10 px-1 py-0.2 rounded font-bold">Editable</span>
                        ) : null}
                      </div>
                      {activeEditSection === 'employment' ? (
                        <Select
                          value={draftEmployment.shift}
                          onValueChange={(val) => setDraftEmployment((p) => ({ ...p, shift: val }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select Shift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General Day Shift (G)">General Day Shift (G)</SelectItem>
                            <SelectItem value="Morning Shift (M)">Morning Shift (M)</SelectItem>
                            <SelectItem value="Evening Shift (E)">Evening Shift (E)</SelectItem>
                            <SelectItem value="Night Shift (N)">Night Shift (N)</SelectItem>
                            <SelectItem value="Rotational Shift (R)">Rotational Shift (R)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-semibold text-foreground text-xs">{employee.shift || 'General Day Shift (G)'}</p>
                      )}
                    </div>

                    {/* Work Mode - EDITABLE */}
                    <div className={`space-y-1 p-1.5 rounded-lg ${activeEditSection === 'employment' ? 'bg-primary/5 border border-primary/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Work Mode</p>
                        {activeEditSection === 'employment' ? (
                          <span className="text-[8.5px] text-primary bg-primary/10 px-1 py-0.2 rounded font-bold">Editable</span>
                        ) : null}
                      </div>
                      {activeEditSection === 'employment' ? (
                        <Select
                          value={draftEmployment.workMode}
                          onValueChange={(val) => setDraftEmployment((p) => ({ ...p, workMode: val }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select Work Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Onsite">Onsite</SelectItem>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-semibold text-foreground text-xs">{employee.workMode || 'Onsite'}</p>
                      )}
                    </div>

                    {/* Job Grade / Level - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Job Grade / Level</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-mono font-semibold text-foreground text-xs">{getGradeLevelDisplay(employee.grade, employee.level)}</p>
                    </div>

                    {/* Cost Center - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Cost Center</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.costCenter || 'CC-OPS-001'}</p>
                    </div>

                    {/* Organization Entity - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Organization Entity</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.company?.name || '-'}</p>
                    </div>

                    {/* Branch Facility - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Branch Facility</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.branch?.name || 'Head Office'}</p>
                    </div>

                    {/* Work Location - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Work Location</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{employee.location || '-'}</p>
                    </div>

                    {/* Business Unit - HR Controlled */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground font-medium text-[11px]">Business Unit</p>
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                          <Lock className="h-2.5 w-2.5" /> HR Controlled
                        </span>
                      </div>
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
                          <span className="text-[10px] text-muted-foreground font-semibold block">1. Joined Organization</span>
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
                    {employee.faceTemplate ? (
                      <Badge className="bg-emerald-600 text-white font-semibold text-xs gap-1.5 py-1 px-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Biometrics Enrolled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 font-semibold text-xs gap-1.5 py-1 px-2.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Pending HR Registration
                      </Badge>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                        onClick={() => setIsRegisterFaceOpen(true)}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {employee.faceTemplate ? 'Re-Register Face' : 'Register Face'}
                      </Button>
                    )}
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
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Contact & Address Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Residential addresses, city/state, and emergency contacts.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeEditSection === 'contact' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'contact', data: draftContact })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('contact')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {activeEditSection === 'contact' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                          Updating your contact and address details will alert your Branch Admin to review and audit records.
                        </span>
                      </div>

                      {/* Phone & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Personal Phone</Label>
                          <Input
                            value={draftContact.phone || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftContact((p) => ({ ...p, phone: val }));
                              setDraftPersonal((p) => ({ ...p, phone: val }));
                            }}
                            placeholder="+91 9876543210"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Personal Email</Label>
                          <Input
                            type="email"
                            value={draftContact.personalEmail || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftContact((p) => ({ ...p, personalEmail: val }));
                              setDraftPersonal((p) => ({ ...p, personalEmail: val }));
                            }}
                            placeholder="personal@domain.com"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Address Lines */}
                      <div className="border-t pt-3 space-y-3">
                        <h4 className="font-semibold text-foreground text-xs">Current Residential Address</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Address Line 1</Label>
                            <Input
                              value={draftContact.addressLine1}
                              onChange={(e) => setDraftContact((p) => ({ ...p, addressLine1: e.target.value }))}
                              placeholder="Flat/House No, Building, Street"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Address Line 2</Label>
                            <Input
                              value={draftContact.addressLine2}
                              onChange={(e) => setDraftContact((p) => ({ ...p, addressLine2: e.target.value }))}
                              placeholder="Landmark, Area, Colony"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">City</Label>
                            <Input
                              value={draftContact.city}
                              onChange={(e) => setDraftContact((p) => ({ ...p, city: e.target.value }))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">State</Label>
                            <Input
                              value={draftContact.state}
                              onChange={(e) => setDraftContact((p) => ({ ...p, state: e.target.value }))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Country</Label>
                            <Input
                              value={draftContact.country}
                              onChange={(e) => setDraftContact((p) => ({ ...p, country: e.target.value }))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Pincode</Label>
                            <Input
                              value={draftContact.pincode}
                              onChange={(e) => setDraftContact((p) => ({ ...p, pincode: e.target.value }))}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Full Current Address</Label>
                          <Textarea
                            rows={2}
                            value={draftContact.currentAddress}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftContact((p) => ({
                                ...p,
                                currentAddress: val,
                                permanentAddress: sameAsCurrentAddress ? val : p.permanentAddress,
                              }));
                            }}
                            placeholder="Complete address with landmark"
                            className="text-xs min-h-[50px]"
                          />
                        </div>
                      </div>

                      {/* Permanent Address with Checkbox */}
                      <div className="border-t pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground text-xs">Permanent Address</h4>
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-primary font-medium select-none">
                            <Checkbox
                              checked={sameAsCurrentAddress}
                              onCheckedChange={(checked) => {
                                const isChecked = !!checked;
                                setSameAsCurrentAddress(isChecked);
                                if (isChecked) {
                                  setDraftContact((p) => ({ ...p, permanentAddress: p.currentAddress }));
                                }
                              }}
                            />
                            <span>Permanent address same as current address</span>
                          </label>
                        </div>
                        <div className="space-y-1">
                          <Textarea
                            rows={2}
                            disabled={sameAsCurrentAddress}
                            value={draftContact.permanentAddress}
                            onChange={(e) => setDraftContact((p) => ({ ...p, permanentAddress: e.target.value }))}
                            placeholder="Complete permanent address"
                            className="text-xs min-h-[50px] disabled:opacity-60 disabled:bg-muted"
                          />
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="border-t pt-3 space-y-3">
                        <h4 className="font-semibold text-foreground text-xs">Emergency Contact Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Contact Person Name</Label>
                            <Input
                              value={draftContact.emergencyContactName}
                              onChange={(e) => setDraftContact((p) => ({ ...p, emergencyContactName: e.target.value }))}
                              placeholder="e.g. Ramesh Sharma"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Relationship</Label>
                            <Input
                              value={draftContact.emergencyContactRelationship}
                              onChange={(e) => setDraftContact((p) => ({ ...p, emergencyContactRelationship: e.target.value }))}
                              placeholder="e.g. Spouse, Father, Mother"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Emergency Phone</Label>
                            <Input
                              type="tel"
                              value={draftContact.emergencyContactPhone}
                              onChange={(e) => setDraftContact((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                              placeholder="+91 9876543210"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Personal Phone</p>
                          <p className="font-semibold">{employee.phone ?? 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground font-medium text-[11px]">Work Phone</p>
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                              <Lock className="h-2.5 w-2.5" /> HR Controlled
                            </span>
                          </div>
                          <p className="font-semibold">{employee.workPhone ?? 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground font-medium text-[11px]">Work Email</p>
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                              <Lock className="h-2.5 w-2.5" /> HR Controlled
                            </span>
                          </div>
                          <p className="font-semibold">{employee.workEmail ?? 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Personal Email</p>
                          <p className="font-semibold">{employee.personalEmail ?? 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-semibold">Current Address</p>
                          <p className="text-foreground leading-normal">{employee.currentAddress || 'Not specified'}</p>
                          {(employee.city || employee.state || employee.pincode) && (
                            <p className="text-[11px] text-muted-foreground">
                              {[employee.city, employee.state, employee.country, employee.pincode].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-semibold">Permanent Address</p>
                          <p className="text-foreground leading-normal">{employee.permanentAddress || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-muted-foreground font-semibold mb-2">Emergency Contact</p>
                        {employee.emergencyContactName ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/20 border">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Name</span>
                              <span className="font-semibold text-xs">{employee.emergencyContactName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Relationship</span>
                              <span className="font-semibold text-xs">{employee.emergencyContactRelationship || 'Relative'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Phone</span>
                              <span className="font-semibold text-xs">{employee.emergencyContactPhone || 'Not specified'}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No emergency contact registered.</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. FAMILY */}
            <TabsContent value="family" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Family Details & Nominees</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Statutory nominee registration and primary dependents.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeEditSection === 'family' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'family', data: draftFamily })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('family')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                  {activeEditSection === 'family' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                          Updating family or nominee records will dispatch a notification to the Branch Admin for review.
                        </span>
                      </div>

                      {/* Family Member Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" /> Primary Family Member / Dependent
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Member Name</Label>
                            <Input
                              value={draftFamily.familyMemberName}
                              onChange={(e) => setDraftFamily((p) => ({ ...p, familyMemberName: e.target.value }))}
                              placeholder="Full Name"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Relationship</Label>
                            <Select
                              value={draftFamily.familyRelationship || 'Spouse'}
                              onValueChange={(val) => setDraftFamily((p) => ({ ...p, familyRelationship: val }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Father">Father</SelectItem>
                                <SelectItem value="Mother">Mother</SelectItem>
                                <SelectItem value="Son">Son</SelectItem>
                                <SelectItem value="Daughter">Daughter</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Date of Birth</Label>
                            <Input
                              type="date"
                              value={draftFamily.familyDob}
                              onChange={(e) => setDraftFamily((p) => ({ ...p, familyDob: e.target.value }))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Contact Number</Label>
                            <Input
                              type="tel"
                              value={draftFamily.familyContact}
                              onChange={(e) => setDraftFamily((p) => ({ ...p, familyContact: e.target.value }))}
                              placeholder="+91 9876543210"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nominee Section */}
                      <div className="border-t pt-3 space-y-3">
                        <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Statutory Nominee (Gratuity / PF / Insurance)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nominee Full Name</Label>
                            <Input
                              value={draftFamily.nomineeName}
                              onChange={(e) => setDraftFamily((p) => ({ ...p, nomineeName: e.target.value }))}
                              placeholder="Nominee Name"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Nominee Relationship</Label>
                            <Input
                              value={draftFamily.nomineeRelationship}
                              onChange={(e) => setDraftFamily((p) => ({ ...p, nomineeRelationship: e.target.value }))}
                              placeholder="e.g. Spouse / Mother / Father"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Share Percentage (%)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={draftFamily.nomineeShare}
                              onChange={(e) => setDraftFamily((p) => ({ ...p, nomineeShare: e.target.value }))}
                              placeholder="100"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {employee.familyMemberName || employee.nomineeName ? (
                        <>
                          {employee.familyMemberName && (
                            <div className="flex items-center justify-between border-b pb-3">
                              <div>
                                <p className="font-semibold text-foreground text-xs">{employee.familyMemberName}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {employee.familyRelationship || 'Family Member'}
                                  {employee.familyDob ? ` • DOB: ${new Date(employee.familyDob).toLocaleDateString()}` : ''}
                                  {employee.familyContact ? ` • Phone: ${employee.familyContact}` : ''}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">Family Member</Badge>
                            </div>
                          )}
                          {employee.nomineeName && (
                            <div className="flex items-center justify-between border-b pb-3">
                              <div>
                                <p className="font-semibold text-foreground text-xs">{employee.nomineeName}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {employee.nomineeRelationship || 'Nominee'}
                                  {employee.nomineeShare ? ` • Share: ${employee.nomineeShare}%` : ''}
                                </p>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                                Nominee ({employee.nomineeShare || 100}%)
                              </Badge>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>No family or nominee records added yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs gap-1"
                            onClick={() => handleStartEdit('family')}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Family & Nominee Details
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. EDUCATION */}
            <TabsContent value="education" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Academic Education History</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Degree qualifications, university records, and passing credentials.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeEditSection === 'education' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'education', data: draftEducation })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('education')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> {employee.educationQualification ? 'Edit' : 'Add Education'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                  {activeEditSection === 'education' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                          Submit your degree and college information. Notification will be dispatched to the Branch Admin.
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Degree / Qualification *</Label>
                          <Input
                            value={draftEducation.educationQualification}
                            onChange={(e) => setDraftEducation((p) => ({ ...p, educationQualification: e.target.value }))}
                            placeholder="e.g. B.Tech / MBA / B.Sc / Diploma"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Specialization / Discipline</Label>
                          <Input
                            value={draftEducation.educationSpecialization}
                            onChange={(e) => setDraftEducation((p) => ({ ...p, educationSpecialization: e.target.value }))}
                            placeholder="e.g. Computer Science / Mechanical / Marketing"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">School / College / Institution</Label>
                          <Input
                            value={draftEducation.educationInstitution}
                            onChange={(e) => setDraftEducation((p) => ({ ...p, educationInstitution: e.target.value }))}
                            placeholder="e.g. National Institute of Technology"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">University / Board</Label>
                          <Input
                            value={draftEducation.educationUniversity}
                            onChange={(e) => setDraftEducation((p) => ({ ...p, educationUniversity: e.target.value }))}
                            placeholder="e.g. Mumbai University / CBSE"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Year of Passing</Label>
                          <Input
                            type="number"
                            value={draftEducation.educationPassingYear}
                            onChange={(e) => setDraftEducation((p) => ({ ...p, educationPassingYear: e.target.value }))}
                            placeholder="e.g. 2023"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Percentage / CGPA</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={draftEducation.educationPercentage}
                            onChange={(e) => setDraftEducation((p) => ({ ...p, educationPercentage: e.target.value }))}
                            placeholder="e.g. 84.5"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {employee.educationQualification ? (
                        <div className="border-l-2 border-primary pl-3 py-1">
                          <p className="font-semibold text-sm text-foreground">{employee.educationQualification}</p>
                          {employee.educationSpecialization && (
                            <p className="text-xs text-primary font-medium">{employee.educationSpecialization}</p>
                          )}
                          <p className="text-muted-foreground mt-1">
                            {employee.educationInstitution || 'No Institution'} • {employee.educationUniversity || 'No Board/University'}
                            {employee.educationPassingYear ? ` • Class of ${employee.educationPassingYear}` : ''}
                          </p>
                          {employee.educationPercentage && (
                            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Grade / Score: {employee.educationPercentage}%</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>No academic education records found.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs gap-1"
                            onClick={() => handleStartEdit('education')}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Education Details
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. EXPERIENCE */}
            <TabsContent value="experience" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Previous Work Experience</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Past employers, designations, tenure, and prior experience history.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeEditSection === 'experience' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'experience', data: draftExperience })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('experience')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> {employee.prevCompany ? 'Edit' : 'Add Experience'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                  {activeEditSection === 'experience' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                          Provide prior employment history. Your update will notify the Branch Admin.
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Organization Name *</Label>
                          <Input
                            value={draftExperience.prevCompany}
                            onChange={(e) => setDraftExperience((p) => ({ ...p, prevCompany: e.target.value }))}
                            placeholder="e.g. Tata Consultancy Services"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Job Title / Designation *</Label>
                          <Input
                            value={draftExperience.prevJobTitle}
                            onChange={(e) => setDraftExperience((p) => ({ ...p, prevJobTitle: e.target.value }))}
                            placeholder="e.g. Software Engineer / Operations Executive"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Start Date</Label>
                          <Input
                            type="date"
                            value={draftExperience.prevStartDate}
                            onChange={(e) => setDraftExperience((p) => ({ ...p, prevStartDate: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Date</Label>
                          <Input
                            type="date"
                            value={draftExperience.prevEndDate}
                            onChange={(e) => setDraftExperience((p) => ({ ...p, prevEndDate: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total Duration / Exp</Label>
                          <Input
                            value={draftExperience.prevTotalExp}
                            onChange={(e) => setDraftExperience((p) => ({ ...p, prevTotalExp: e.target.value }))}
                            placeholder="e.g. 2 Years 6 Months"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reason for Leaving</Label>
                        <Textarea
                          rows={2}
                          value={draftExperience.prevReasonForLeaving}
                          onChange={(e) => setDraftExperience((p) => ({ ...p, prevReasonForLeaving: e.target.value }))}
                          placeholder="e.g. Career growth / relocation"
                          className="text-xs min-h-[50px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {employee.prevCompany ? (
                        <div className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                          <p className="font-semibold text-sm text-foreground">{employee.prevJobTitle || 'Previous Employee'}</p>
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{employee.prevCompany}</p>
                          <p className="text-muted-foreground text-[11px]">
                            {employee.prevStartDate ? new Date(employee.prevStartDate).toLocaleDateString() : ''}
                            {employee.prevEndDate ? ` - ${new Date(employee.prevEndDate).toLocaleDateString()}` : ''}
                            {employee.prevTotalExp ? ` • Total Experience: ${employee.prevTotalExp}` : ''}
                          </p>
                          {employee.prevReasonForLeaving && (
                            <p className="text-[11px] text-muted-foreground mt-1">Reason for Leaving: {employee.prevReasonForLeaving}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>No previous work experience listed.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs gap-1"
                            onClick={() => handleStartEdit('experience')}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Previous Experience
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 6. BANKING */}
            <TabsContent value="banking" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Banking Details (Salary Account)</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Statutory salary disbursement account & IFSC registry.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeEditSection === 'banking' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setActiveEditSection(null)}
                          disabled={profileSaveMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          onClick={() => profileSaveMutation.mutate({ section: 'banking', data: draftBanking })}
                          disabled={profileSaveMutation.isPending}
                        >
                          {profileSaveMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                        onClick={() => handleStartEdit('banking')}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {activeEditSection === 'banking' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                          Notice: Updates to banking credentials require review by the Branch Admin & Payroll team before next salary cycle.
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Bank Name *</Label>
                          <Input
                            value={draftBanking.bankName}
                            onChange={(e) => setDraftBanking((p) => ({ ...p, bankName: e.target.value }))}
                            placeholder="e.g. HDFC Bank / State Bank of India"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number *</Label>
                          <Input
                            value={draftBanking.bankAccountNumber}
                            onChange={(e) => setDraftBanking((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                            placeholder="Bank Account Number"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">IFSC Code *</Label>
                          <Input
                            value={draftBanking.bankIfscCode}
                            onChange={(e) => setDraftBanking((p) => ({ ...p, bankIfscCode: e.target.value.toUpperCase() }))}
                            placeholder="e.g. HDFC0001234"
                            className="h-8 text-xs font-mono uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Branch Name</Label>
                          <Input
                            value={draftBanking.bankBranchName}
                            onChange={(e) => setDraftBanking((p) => ({ ...p, bankBranchName: e.target.value }))}
                            placeholder="Branch Location"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Holder Name *</Label>
                          <Input
                            value={draftBanking.bankAccountHolderName}
                            onChange={(e) => setDraftBanking((p) => ({ ...p, bankAccountHolderName: e.target.value }))}
                            placeholder="Name as in Bank Passbook"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {employee.bankName || employee.bankAccountNumber ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Bank Name</p>
                            <p className="font-semibold text-foreground text-sm">{employee.bankName || 'Not specified'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Account Number</p>
                            <p className="font-semibold font-mono text-foreground text-sm">{employee.bankAccountNumber || 'Not specified'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">IFSC Code</p>
                            <p className="font-semibold font-mono uppercase text-foreground">{employee.bankIfscCode || 'Not specified'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Branch Location</p>
                            <p className="font-semibold">{employee.bankBranchName || 'Not specified'}</p>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <p className="text-muted-foreground">Account Holder Name</p>
                            <p className="font-semibold">{employee.bankAccountHolderName || 'Not specified'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>No salary bank account details recorded.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs gap-1"
                            onClick={() => handleStartEdit('banking')}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Bank Account Details
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 7. KYC */}
            <TabsContent value="kyc" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">KYC Credentials (Aadhaar & PAN)</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Statutory UIDAI Aadhaar, PAN card, and passport registry.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                    onClick={() => setIsKycModalOpen(true)}
                  >
                    <FileUp className="h-3.5 w-3.5" /> Request KYC Update
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.aadhaarNumber || employee.panNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Aadhaar Number (UIDAI)</p>
                        <p className="font-semibold font-mono text-foreground">{employee.aadhaarNumber || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Income Tax PAN Number</p>
                        <p className="font-semibold font-mono uppercase text-foreground">{employee.panNumber || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Passport Number</p>
                        <p className="font-semibold font-mono uppercase text-foreground">{employee.passportNumber || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Verification Status</p>
                        <div>
                          <Badge className={
                            employee.kycStatus === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-bold'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-bold'
                          }>
                            {employee.kycStatus || 'PENDING'}
                          </Badge>
                          {employee.kycVerificationDate && (
                            <span className="text-[10px] text-muted-foreground ml-2">Verified on {new Date(employee.kycVerificationDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No KYC credentials recorded on file.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:text-primary font-medium"
                          onClick={() => setIsKycModalOpen(true)}
                        >
                          <FileUp className="h-3.5 w-3.5" /> Request Update
                        </Button>
                    </div>
                  )}

                  <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        Aadhaar and PAN details require document proof verification. Use &quot;Request KYC Update&quot; to send updated credentials directly to the Branch Admin.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 8. PF & ESIC */}
            <TabsContent value="pf_esic" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-semibold">Provident Fund & ESIC Registration</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Statutory social security, PF member IDs, and ESIC registrations.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400 gap-1.5 py-1">
                    <Lock className="h-3 w-3" /> HR Controlled
                  </Badge>
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

                      {isAdmin ? (
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50">
                          <Link to="/payroll/structure">
                            Manage in Payroll <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs font-semibold text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400 gap-1.5 py-1">
                          <Lock className="h-3 w-3" /> HR Controlled
                        </Badge>
                      )}
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
                  <div>
                    <CardTitle className="text-base font-semibold">Documents Vault</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload personal, identity, and educational proof files for HR verification.
                    </p>
                  </div>
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
                    <Button size="sm" className="text-xs h-8 gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                      <Upload className="h-3.5 w-3.5" /> Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      Employees can upload and view documents. Verification is controlled strictly by HR Administration.
                    </span>
                  </div>

                  {employee.documents && employee.documents.length > 0 ? (
                    employee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-medium text-foreground">{doc.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.docType}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 font-medium">
                            Pending HR Verification
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDocMutation.mutate(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
                  <Dialog
                    open={isAssetOpen}
                    onOpenChange={(open) => {
                      setIsAssetOpen(open);
                      if (!open) {
                        setSelectedAssetId('');
                        setAssetRemarks('');
                      }
                    }}
                  >
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
                          disabled={!selectedAssetId || selectedAssetId === 'none' || allocateAssetMutation.isPending}
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

      {/* KYC Update Request Dialog */}
      <Dialog open={isKycModalOpen} onOpenChange={setIsKycModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Request Statutory KYC Update
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs py-2">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
              <p className="font-semibold text-xs">Branch Admin Verification Required</p>
              <p className="text-[11px] mt-0.5 text-muted-foreground">
                Statutory credentials (PAN, Aadhaar, Passport) require document proof verification. Submitting this request sends an alert to your Branch Admin.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Document Type *</Label>
              <Select value={kycDocType} onValueChange={setKycDocType}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="AADHAAR">Aadhaar Card (UIDAI)</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="VOTER_ID">Voter ID</SelectItem>
                  <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Document / ID Number *</Label>
              <Input
                value={kycDocNumber}
                onChange={(e) => setKycDocNumber(e.target.value)}
                placeholder={kycDocType === 'PAN' ? 'ABCDE1234F' : kycDocType === 'AADHAAR' ? '12-digit Aadhaar' : 'Document Number'}
                className="h-8 text-xs uppercase font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Upload Proof Document (PDF, JPG, PNG)</Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setKycFile(file);
                }}
                className="h-8 text-xs"
              />
              {kycFile && (
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  ✓ Selected: {kycFile.name} ({(kycFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Remarks / Reason for Update</Label>
              <Textarea
                value={kycRemarks}
                onChange={(e) => setKycRemarks(e.target.value)}
                placeholder="e.g., Updated address on Aadhaar card, renewed passport..."
                className="text-xs resize-none h-18"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsKycModalOpen(false)}
              disabled={isSubmittingKyc}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
              disabled={isSubmittingKyc}
              onClick={handleKycSubmit}
            >
              {isSubmittingKyc ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Submit Request
                </>
              )}
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
