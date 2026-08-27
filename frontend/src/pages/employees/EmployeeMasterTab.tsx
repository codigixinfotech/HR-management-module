import { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  Users as UsersIcon,
  GraduationCap,
  Award,
  CreditCard,
  Shield,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  FileText,
  Plus,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  IdCard,
  Clock,
  HeartHandshake,
  Key,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

import { employeesApi } from '@/api/employees';
import { companiesApi, departmentsApi, designationsApi, branchesApi } from '@/api/organization';
import { costCentersApi, payGradesApi } from '@/api/cost-grades';
import { shiftTypesApi } from '@/api/workforce';
import { candidatesApi } from '@/api/recruitment';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ── 1. VALIDATION SCHEMA ──
const employeeSchema = z.object({
  // 1. Personal Profile
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  phone: z.string().min(1, 'Personal mobile number is required'),
  personalEmail: z.string().email('Invalid personal email').or(z.literal('')).optional(),

  // 2. Employment Details
  employeeCode: z.string().min(1, 'Employee code is required'),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  employeeCategory: z.string().min(1, 'Employee category is required'),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT', 'PART_TIME']),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'PROBATION', 'NOTICE_PERIOD']),
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  reportingManagerId: z.string().optional(),
  grade: z.string().optional(),
  level: z.string().optional(),

  // 3. Corporate Organization
  companyId: z.string().min(1, 'Company is required'),
  businessUnit: z.string().min(1, 'Business Unit is required'),
  branchId: z.string().min(1, 'Branch is required'),
  location: z.string().min(1, 'Location is required'),
  costCenter: z.string().optional(),

  // 4. Work Information
  workEmail: z.string().email('Invalid work email address').min(1, 'Work email is required'),
  workPhone: z.string().optional(),
  workMode: z.string().min(1, 'Work mode is required'),
  shift: z.string().min(1, 'Shift assignment is required'),
  probationPeriod: z.string().optional(),
  confirmationDate: z.string().optional(),

  // 5. Contact & Address
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),

  // 6. Family & Nominee
  familyMemberName: z.string().optional(),
  familyRelationship: z.string().optional(),
  familyDob: z.string().optional(),
  familyContact: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
  nomineeShare: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),

  // 7. Education Details
  educationQualification: z.string().optional(),
  educationSpecialization: z.string().optional(),
  educationInstitution: z.string().optional(),
  educationUniversity: z.string().optional(),
  educationPassingYear: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  educationPercentage: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),

  // 8. Previous Experience
  prevCompany: z.string().optional(),
  prevJobTitle: z.string().optional(),
  prevStartDate: z.string().optional(),
  prevEndDate: z.string().optional(),
  prevTotalExp: z.string().optional(),
  prevReasonForLeaving: z.string().optional(),

  // 9. Banking Information
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankBranchName: z.string().optional(),
  bankAccountHolderName: z.string().optional(),

  // 10. Aadhaar / PAN / KYC
  aadhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  kycStatus: z.string().default('PENDING'),
  kycVerificationDate: z.string().optional(),

  // 11. PF & ESIC
  uanNumber: z.string().optional(),
  pfMemberId: z.string().optional(),
  esicNumber: z.string().optional(),
  pfApplicable: z.boolean().default(false),
  esicApplicable: z.boolean().default(false),
  pfEsicJoiningDate: z.string().optional(),

  // 12. Salary Structure
  salaryGrade: z.string().optional(),
  salaryBand: z.string().optional(),
  basicSalary: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  hra: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  conveyance: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  specialAllowance: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  otherAllowances: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  grossSalary: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  annualCtc: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  salaryEffectiveFrom: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

// ── 2. MASTER STEPS DEFINITION ──
const STEPS = [
  { id: 'personal', title: '1. Personal Profile', icon: User },
  { id: 'employment', title: '2. Employment Details', icon: Briefcase },
  { id: 'organization', title: '3. Organization details', icon: Building2 },
  { id: 'contact', title: '4. Contact & Address', icon: MapPin },
  { id: 'family', title: '5. Family & Nominee', icon: UsersIcon },
  { id: 'education', title: '6. Education Details', icon: GraduationCap },
  { id: 'experience', title: '7. Previous Experience', icon: Award },
  { id: 'banking', title: '8. Banking Information', icon: CreditCard },
  { id: 'kyc', title: '9. Aadhaar / PAN / KYC', icon: Shield },
  { id: 'pf', title: '10. PF & ESIC Details', icon: ShieldAlert },
  { id: 'salary', title: '11. Salary Structure', icon: DollarSign },
  { id: 'documents', title: '12. Onboarding Docs', icon: FileText },
];

import { useCompany } from '@/context/CompanyContext';

export function EmployeeMasterTab() {
  const { activeCompanyId } = useCompany();
  const searchParams = useSearchParams()[0];
  const setSearchParams = useSearchParams()[1];
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const action = searchParams.get('action');
  const isAdding = action === 'new';
  const editId = searchParams.get('id');
  const isEditing = action === 'edit' && !!editId;

  // Recruitment & Accepted Offer Query Parameters
  const candidateId = searchParams.get('candidateId');
  const offerId = searchParams.get('offerId');
  const candidateName = searchParams.get('candidateName');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const role = searchParams.get('role');
  const department = searchParams.get('department');
  const ctc = searchParams.get('ctc');
  const joiningDate = searchParams.get('joiningDate');
  const location = searchParams.get('location');
  const manager = searchParams.get('manager');
  const probation = searchParams.get('probation');
  const noticePeriod = searchParams.get('noticePeriod');
  const requisitionCode = searchParams.get('requisitionCode');
  const interviewCode = searchParams.get('interviewCode');

  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  // Auto policies template display state
  const [autoPolicies, setAutoPolicies] = useState<{
    payrollGroup: string;
    attendancePolicy: string;
    leavePolicy: string;
    workingCalendar: string;
  } | null>(null);

  // Login account creation modal states
  const [selectedEmpForLogin, setSelectedEmpForLogin] = useState<any | null>(null);
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginTempPasswordInput, setLoginTempPasswordInput] = useState('Rowan#2026!Temp');
  const [createdCredentialsData, setCreatedCredentialsData] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const createLoginMutation = useMutation({
    mutationFn: (emp: any) =>
      employeesApi.createLogin(emp.id, {
        email: loginEmailInput,
        password: loginTempPasswordInput,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCreatedCredentialsData(data.credentials);
      setSelectedEmpForLogin(null);
      toast.success(data.message || 'Login account created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create login account');
    },
  });

  const handleOpenCreateLoginModal = (emp: any) => {
    setSelectedEmpForLogin(emp);
    const defaultEmail = emp.workEmail || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@ehcm.local`;
    setLoginEmailInput(defaultEmail);
    setLoginTempPasswordInput(`${emp.firstName}#2026!Temp`);
  };

  const handleCopyCredentials = () => {
    if (!createdCredentialsData) return;
    const loginUrl = `${import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/login`;
    const credText = `EHCM Workspace Credentials\n========================\nEmployee Name: ${createdCredentialsData.employeeName}\nWork Email: ${createdCredentialsData.email}\nEmployee Code: ${createdCredentialsData.employeeCode}\nTemporary Password: ${createdCredentialsData.temporaryPassword}\nRole: ${createdCredentialsData.role}\nLogin URL: ${loginUrl}\nNote: You will be required to set a new password on your first login.`;
    navigator.clipboard.writeText(credText);
    setIsCopied(true);
    toast.success('Login credentials copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ── Queries & Lookups ──
  const { data: editEmployee } = useQuery({
    queryKey: ['employee', editId],
    queryFn: () => employeesApi.get(editId!),
    enabled: isEditing,
  });

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, '', activeCompanyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 500, companyId: activeCompanyId }),
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      companyId: activeCompanyId || '',
      businessUnit: 'Technology Services',
      branchId: '',
      location: '',
      costCenter: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '1995-01-01',
      gender: 'MALE',
      phone: '',
      personalEmail: '',
      employeeCode: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      employeeCategory: 'Executive',
      employmentType: 'PERMANENT',
      status: 'ACTIVE',
      departmentId: '',
      designationId: '',
      reportingManagerId: '',
      grade: '',
      level: '',
      workEmail: '',
      workPhone: '',
      workMode: 'Onsite',
      shift: 'General Day Shift (G)',
      probationPeriod: '6 Months',
      confirmationDate: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      maritalStatus: '',
      nationality: '',
      bloodGroup: '',
      religion: '',
      currentAddress: '',
      permanentAddress: '',
      addressLine1: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      familyMemberName: '',
      familyRelationship: '',
      familyDob: '',
      familyContact: '',
      nomineeName: '',
      nomineeRelationship: '',
      nomineeShare: null as any,
      educationQualification: '',
      educationSpecialization: '',
      educationInstitution: '',
      educationUniversity: '',
      educationPassingYear: null as any,
      educationPercentage: null as any,
      prevCompany: '',
      prevJobTitle: '',
      prevStartDate: '',
      prevEndDate: '',
      prevTotalExp: '',
      prevReasonForLeaving: '',
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankBranchName: '',
      bankAccountHolderName: '',
      aadhaarNumber: '',
      panNumber: '',
      passportNumber: '',
      kycStatus: 'PENDING',
      kycVerificationDate: '',
      uanNumber: '',
      pfMemberId: '',
      esicNumber: '',
      pfApplicable: false,
      esicApplicable: false,
      pfEsicJoiningDate: '',
      salaryGrade: '',
      salaryBand: '',
      basicSalary: null as any,
      hra: null as any,
      conveyance: null as any,
      specialAllowance: null as any,
      otherAllowances: null as any,
      grossSalary: null as any,
      annualCtc: null as any,
      salaryEffectiveFrom: '',
    },
  });

  const selectedCompanyId = form.watch('companyId') || activeCompanyId;
  const selectedBranchId = form.watch('branchId');
  const watchedDesigId = form.watch('designationId');
  const watchedDeptId = form.watch('departmentId');

  // Auto-sync companyId with activeCompanyId or first available company
  useEffect(() => {
    if (activeCompanyId) {
      if (form.getValues('companyId') !== activeCompanyId) {
        form.setValue('companyId', activeCompanyId);
      }
    } else if (!form.getValues('companyId') && companies && companies.length > 0) {
      form.setValue('companyId', companies[0].id);
    }
  }, [activeCompanyId, companies, form]);

  // Auto-generate sequential employeeCode (e.g. EMP-001) if empty and not editing
  useEffect(() => {
    if (!isEditing && !form.getValues('employeeCode')) {
      let maxNum = 0;
      if (employeesData?.items && Array.isArray(employeesData.items)) {
        for (const emp of employeesData.items) {
          if (emp.employeeCode) {
            const match = emp.employeeCode.match(/^EMP-?(\d+)$/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
        }
      }
      const nextCode = `EMP-${String(maxNum + 1).padStart(3, '0')}`;
      form.setValue('employeeCode', nextCode);
    }
  }, [isEditing, employeesData, form]);

  const watchedFirstName = form.watch('firstName');
  const watchedLastName = form.watch('lastName');

  // Auto-fill workEmail if empty when firstName and lastName are provided
  useEffect(() => {
    if (!isEditing && watchedFirstName && watchedLastName && !form.getValues('workEmail')) {
      const cleanFirst = watchedFirstName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const cleanLast = watchedLastName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (cleanFirst && cleanLast) {
        form.setValue('workEmail', `${cleanFirst}.${cleanLast}@codigix.com`);
      }
    }
  }, [watchedFirstName, watchedLastName, isEditing, form]);

  const { data: allBranches } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: allDepartments } = useQuery({
    queryKey: ['departments', selectedCompanyId],
    queryFn: () => departmentsApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: allDesignations } = useQuery({
    queryKey: ['designations', selectedCompanyId, watchedDeptId],
    queryFn: () => designationsApi.list(selectedCompanyId, watchedDeptId),
    enabled: !!selectedCompanyId,
  });

  const { data: allCostCenters } = useQuery({
    queryKey: ['cost-centers', selectedCompanyId],
    queryFn: () => costCentersApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: allPayGrades } = useQuery({
    queryKey: ['pay-grades', selectedCompanyId],
    queryFn: () => payGradesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: allShiftTypes } = useQuery({
    queryKey: ['shift-types', selectedCompanyId],
    queryFn: () => shiftTypesApi.list(),
    enabled: !!selectedCompanyId,
  });

  const branchOptions = useMemo(() => {
    if (!allBranches || !selectedCompanyId) return [];
    return allBranches.filter((b: any) => b.companyId === selectedCompanyId);
  }, [allBranches, selectedCompanyId]);

  const selectedBranch = useMemo(() => {
    return branchOptions?.find((b: any) => b.id === selectedBranchId);
  }, [branchOptions, selectedBranchId]);

  const locationOptions = useMemo(() => {
    if (selectedBranch?.locations && selectedBranch.locations.length > 0) {
      return selectedBranch.locations;
    }
    if (selectedBranch?.city) {
      return [{ name: selectedBranch.city }, { name: `${selectedBranch.city} Main Facility` }];
    }
    return [];
  }, [selectedBranch]);

  useEffect(() => {
    if (locationOptions.length > 0 && !form.getValues('location')) {
      form.setValue('location', locationOptions[0].name);
    }
  }, [selectedBranchId, locationOptions, form]);

  const departmentOptions = useMemo(() => {
    if (!allDepartments || !selectedCompanyId) return [];
    return allDepartments.filter((d: any) => d.companyId === selectedCompanyId);
  }, [allDepartments, selectedCompanyId]);

  const designationOptions = useMemo(() => {
    if (!allDesignations || !selectedCompanyId || !watchedDeptId) return [];
    const targetDept = departmentOptions?.find((dept: any) => dept.id === watchedDeptId);
    const targetDeptName = targetDept?.name;

    return allDesignations.filter(
      (d: any) =>
        d.companyId === selectedCompanyId &&
        (d.departmentId === watchedDeptId ||
          d.department?.id === watchedDeptId ||
          (targetDeptName && (d.department?.name === targetDeptName || d.departmentName === targetDeptName)))
    );
  }, [allDesignations, selectedCompanyId, watchedDeptId, departmentOptions]);

  const reportingManagerOptions = useMemo(() => {
    const list = employeesData?.items ?? [];
    if (!selectedCompanyId) return [];
    return list.filter((e: any) => e.companyId === selectedCompanyId && e.id !== editEmployee?.id);
  }, [employeesData, selectedCompanyId, editEmployee]);

  const costCentersList = useMemo(() => {
    if (!allCostCenters || !selectedCompanyId) return [];
    return allCostCenters.filter((c: any) => c.companyId === selectedCompanyId);
  }, [allCostCenters, selectedCompanyId]);

  const payGradesList = useMemo(() => {
    if (!allPayGrades || !selectedCompanyId) return [];
    return allPayGrades.filter((p: any) => p.companyId === selectedCompanyId);
  }, [allPayGrades, selectedCompanyId]);

  const shiftTypesList = useMemo(() => {
    if (!allShiftTypes || !selectedCompanyId) return [];
    return allShiftTypes.filter((s: any) => s.companyId === selectedCompanyId);
  }, [allShiftTypes, selectedCompanyId]);

  // Reset child organization state when Company changes
  const prevCompanyIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevCompanyIdRef.current && prevCompanyIdRef.current !== selectedCompanyId) {
      form.setValue('departmentId', '');
      form.setValue('designationId', '');
      form.setValue('grade', '');
      form.setValue('level', '');
      form.setValue('reportingManagerId', '');
      form.setValue('shift', '');
      form.setValue('branchId', '');
      form.setValue('location', '');
      form.setValue('costCenter', '');
    }
    prevCompanyIdRef.current = selectedCompanyId ?? null;
  }, [selectedCompanyId, form]);

  // Reset designation & derived grade/level when Department changes
  const prevDeptIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevDeptIdRef.current && prevDeptIdRef.current !== watchedDeptId) {
      form.setValue('designationId', '');
      form.setValue('grade', '');
      form.setValue('level', '');
    }
    prevDeptIdRef.current = watchedDeptId ?? null;
  }, [watchedDeptId, form]);

  // Automatically trigger Grade/Level/Policies auto-fill when designation is selected
  useEffect(() => {
    if (!watchedDesigId) {
      form.setValue('grade', '');
      form.setValue('level', '');
      setAutoPolicies(null);
      return;
    }
    const desig = allDesignations?.find((d: any) => d.id === watchedDesigId);
    if (desig) {
      const gradeVal = desig.gradeBand || desig.grade || '';
      form.setValue('grade', gradeVal);
      const levelVal = desig.level || (gradeVal.includes('(') ? gradeVal.split('(')[1]?.replace(')', '') : gradeVal);
      form.setValue('level', levelVal);

      setAutoPolicies({
        payrollGroup: `${desig.title} Standard Payroll`,
        attendancePolicy: 'Standard Shift Attendance Policy',
        leavePolicy: 'Standard Leave Entitlement',
        workingCalendar: 'Standard Work Calendar',
      });
    }
  }, [watchedDesigId, allDesignations, form]);

  // Prefill form when in edit mode
  useEffect(() => {
    if (isEditing && editEmployee) {
      const defaultCompId = editEmployee.companyId || (companies && companies.length > 0 ? companies[0].id : '');
      form.reset({
        companyId: defaultCompId,
        businessUnit: editEmployee.businessUnit ?? 'Technology Services',
        branchId: editEmployee.branchId ?? '',
        location: editEmployee.location ?? '',
        costCenter: editEmployee.costCenter ?? '',
        firstName: editEmployee.firstName ?? '',
        middleName: editEmployee.middleName ?? '',
        lastName: editEmployee.lastName ?? '',
        dateOfBirth: editEmployee.dateOfBirth ? new Date(editEmployee.dateOfBirth).toISOString().split('T')[0] : '1995-01-01',
        gender: editEmployee.gender ?? 'MALE',
        maritalStatus: editEmployee.maritalStatus ?? '',
        nationality: editEmployee.nationality ?? '',
        bloodGroup: editEmployee.bloodGroup ?? '',
        religion: editEmployee.religion ?? '',
        phone: editEmployee.phone ?? '',
        personalEmail: editEmployee.personalEmail ?? '',
        employeeCode: editEmployee.employeeCode ?? '',
        dateOfJoining: editEmployee.dateOfJoining ? new Date(editEmployee.dateOfJoining).toISOString().split('T')[0] : '',
        employeeCategory: editEmployee.employeeCategory ?? 'Executive',
        employmentType: editEmployee.employmentType ?? 'PERMANENT',
        status: editEmployee.status ?? 'ACTIVE',
        departmentId: editEmployee.departmentId ?? '',
        designationId: editEmployee.designationId ?? '',
        reportingManagerId: editEmployee.reportingManagerId ?? '',
        grade: editEmployee.grade ?? '',
        level: editEmployee.level ?? '',
        workEmail: editEmployee.workEmail ?? '',
        workPhone: editEmployee.workPhone ?? '',
        workMode: editEmployee.workMode ?? 'Onsite',
        shift: editEmployee.shift ?? 'General Day Shift (G)',
        probationPeriod: editEmployee.probationPeriod ?? '6 Months',
        confirmationDate: editEmployee.confirmationDate ? new Date(editEmployee.confirmationDate).toISOString().split('T')[0] : '',
        emergencyContactName: editEmployee.emergencyContactName ?? '',
        emergencyContactRelationship: editEmployee.emergencyContactRelationship ?? '',
        emergencyContactPhone: editEmployee.emergencyContactPhone ?? '',
        addressLine1: editEmployee.addressLine1 ?? '',
        city: editEmployee.city ?? '',
        state: editEmployee.state ?? '',
        country: editEmployee.country ?? '',
        pincode: editEmployee.pincode ?? '',
        currentAddress: editEmployee.currentAddress ?? '',
        permanentAddress: editEmployee.permanentAddress ?? '',
        familyMemberName: editEmployee.familyMemberName ?? '',
        familyRelationship: editEmployee.familyRelationship ?? '',
        familyDob: editEmployee.familyDob ? new Date(editEmployee.familyDob).toISOString().split('T')[0] : '',
        familyContact: editEmployee.familyContact ?? '',
        nomineeName: editEmployee.nomineeName ?? '',
        nomineeRelationship: editEmployee.nomineeRelationship ?? '',
        nomineeShare: editEmployee.nomineeShare ?? null,
        educationQualification: editEmployee.educationQualification ?? '',
        educationSpecialization: editEmployee.educationSpecialization ?? '',
        educationInstitution: editEmployee.educationInstitution ?? '',
        educationUniversity: editEmployee.educationUniversity ?? '',
        educationPassingYear: editEmployee.educationPassingYear ?? null,
        educationPercentage: editEmployee.educationPercentage ?? null,
        prevCompany: editEmployee.prevCompany ?? '',
        prevJobTitle: editEmployee.prevJobTitle ?? '',
        prevStartDate: editEmployee.prevStartDate ? new Date(editEmployee.prevStartDate).toISOString().split('T')[0] : '',
        prevEndDate: editEmployee.prevEndDate ? new Date(editEmployee.prevEndDate).toISOString().split('T')[0] : '',
        prevTotalExp: editEmployee.prevTotalExp ?? '',
        prevReasonForLeaving: editEmployee.prevReasonForLeaving ?? '',
        bankName: editEmployee.bankName ?? '',
        bankAccountNumber: editEmployee.bankAccountNumber ?? '',
        bankIfscCode: editEmployee.bankIfscCode ?? '',
        bankBranchName: editEmployee.bankBranchName ?? '',
        bankAccountHolderName: editEmployee.bankAccountHolderName ?? '',
        aadhaarNumber: editEmployee.aadhaarNumber ?? '',
        panNumber: editEmployee.panNumber ?? '',
        passportNumber: editEmployee.passportNumber ?? '',
        kycStatus: editEmployee.kycStatus ?? 'PENDING',
        kycVerificationDate: editEmployee.kycVerificationDate ? new Date(editEmployee.kycVerificationDate).toISOString().split('T')[0] : '',
        uanNumber: editEmployee.uanNumber ?? '',
        pfMemberId: editEmployee.pfMemberId ?? '',
        esicNumber: editEmployee.esicNumber ?? '',
        pfApplicable: editEmployee.pfApplicable ?? false,
        esicApplicable: editEmployee.esicApplicable ?? false,
        pfEsicJoiningDate: editEmployee.pfEsicJoiningDate ? new Date(editEmployee.pfEsicJoiningDate).toISOString().split('T')[0] : '',
        salaryGrade: editEmployee.salaryGrade ?? '',
        salaryBand: editEmployee.salaryBand ?? '',
        basicSalary: editEmployee.basicSalary ?? null,
        hra: editEmployee.hra ?? null,
        conveyance: editEmployee.conveyance ?? null,
        specialAllowance: editEmployee.specialAllowance ?? null,
        otherAllowances: editEmployee.otherAllowances ?? null,
        grossSalary: editEmployee.grossSalary ?? null,
        annualCtc: editEmployee.annualCtc ?? null,
        salaryEffectiveFrom: editEmployee.salaryEffectiveFrom ? new Date(editEmployee.salaryEffectiveFrom).toISOString().split('T')[0] : '',
      });
    }
  }, [isEditing, editEmployee, form]);

  const updateMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) => {
      const payload = {
        ...values,
        middleName: values.middleName || null,
        costCenter: values.costCenter || null,
        personalEmail: values.personalEmail || null,
        workPhone: values.workPhone || null,
        probationPeriod: values.probationPeriod || null,
        confirmationDate: values.confirmationDate || null,
        emergencyContactName: values.emergencyContactName || null,
        emergencyContactRelationship: values.emergencyContactRelationship || null,
        emergencyContactPhone: values.emergencyContactPhone || null,
        reportingManagerId: values.reportingManagerId || null,
        dateOfJoining: values.dateOfJoining || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        familyDob: values.familyDob || null,
        prevStartDate: values.prevStartDate || null,
        prevEndDate: values.prevEndDate || null,
        kycVerificationDate: values.kycVerificationDate || null,
        pfEsicJoiningDate: values.pfEsicJoiningDate || null,
        salaryEffectiveFrom: values.salaryEffectiveFrom || null,
      };
      return employeesApi.update(editId!, payload);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', editId] });
      toast.success('Employee updated successfully');

      const docTypes = Object.keys(selectedFiles);
      if (docTypes.length > 0 && editId) {
        toast.info(`Uploading ${docTypes.length} documents...`);
        for (const type of docTypes) {
          try {
            await employeesApi.uploadDocument(editId, selectedFiles[type], type);
          } catch (e) {
            console.error(`Failed to upload ${type}:`, e);
          }
        }
      }

      form.reset();
      setSelectedFiles({});
      setSearchParams({});
      navigate(`/employees/detail/${editId}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  // Set default company & branch on enter adding state
  useEffect(() => {
    if (isAdding && companies && companies.length > 0) {
      form.setValue('companyId', companies[0].id);
    }
  }, [isAdding, companies, form]);

  // ── Auto-Fill from Accepted Offer & Recruitment Data Across All 12 Steps ──
  useEffect(() => {
    if (isAdding && (candidateName || offerId || candidateId)) {
      const nameParts = (candidateName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Candidate';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Name';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      const ctcRaw = (ctc || '').replace(/[^0-9.]/g, '');
      const ctcNum = ctcRaw ? parseFloat(ctcRaw) : 2400000;
      const basic = Math.round(ctcNum * 0.5);
      const hra = Math.round(ctcNum * 0.2);
      const special = Math.round(ctcNum * 0.2);
      const gross = Math.round(ctcNum * 0.9);

      let maxNum = 0;
      if (employeesData?.items && Array.isArray(employeesData.items)) {
        for (const emp of employeesData.items) {
          if (emp.employeeCode) {
            const match = emp.employeeCode.match(/^EMP(\d+)$/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
        }
      }
      const nextCode = 'EMP' + String(maxNum === 0 ? (employeesData?.total ?? 0) + 1 : maxNum + 1).padStart(4, '0');

      const compId = companies && companies.length > 0 ? companies[0].id : '';
      const branchId = allBranches && allBranches.length > 0 ? allBranches[0].id : '';

      let matchedDeptId = '';
      if (allDepartments && department) {
        const found = allDepartments.find((d: any) => d.name?.toLowerCase().includes(department.toLowerCase()));
        if (found) matchedDeptId = found.id;
      }
      if (!matchedDeptId && allDepartments && allDepartments.length > 0) {
        matchedDeptId = allDepartments[0].id;
      }

      let matchedDesigId = '';
      if (allDesignations && role) {
        const found = allDesignations.find((d: any) => d.title?.toLowerCase().includes(role.toLowerCase()));
        if (found) matchedDesigId = found.id;
      }
      if (!matchedDesigId && allDesignations && allDesignations.length > 0) {
        matchedDesigId = allDesignations[0].id;
      }

      let formattedJoiningDate = new Date().toISOString().split('T')[0];
      if (joiningDate) {
        const parsedDate = new Date(joiningDate);
        if (!isNaN(parsedDate.getTime())) {
          formattedJoiningDate = parsedDate.toISOString().split('T')[0];
        }
      }

      let matchedManagerId = '';
      if (manager && employeesData?.items) {
        const found = employeesData.items.find((e: any) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(manager.toLowerCase()) ||
          e.id === manager
        );
        if (found) matchedManagerId = found.id;
      }

      form.reset({
        companyId: compId,
        businessUnit: 'HQ Operations',
        branchId: branchId,
        location: location || 'Pune HQ - Executive Suite',
        costCenter: 'CC-ENG-001',
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        dateOfBirth: '1995-05-15',
        gender: 'MALE',
        phone: phone || '+91 98765 43210',
        personalEmail: email || 'candidate@example.com',
        employeeCode: nextCode,
        dateOfJoining: formattedJoiningDate,
        employeeCategory: 'Executive',
        employmentType: 'PERMANENT',
        status: 'PROBATION',
        departmentId: matchedDeptId,
        designationId: matchedDesigId,
        reportingManagerId: matchedManagerId || '',
        grade: 'Level-3 Senior',
        level: 'L3',
        workEmail: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
        workPhone: phone || '+91 98765 43210',
        workMode: 'Onsite',
        shift: 'General Day Shift (G)',
        probationPeriod: probation || '3 Months',
        confirmationDate: '',
        emergencyContactName: 'Family Contact',
        emergencyContactRelationship: 'Parent/Spouse',
        emergencyContactPhone: phone || '+91 98765 43210',
        maritalStatus: 'SINGLE',
        nationality: 'Indian',
        bloodGroup: 'O+',
        religion: 'Hindu',
        currentAddress: `${location || 'Pune HQ'}, Maharashtra, India`,
        permanentAddress: `${location || 'Pune HQ'}, Maharashtra, India`,
        addressLine1: 'Main Executive Block',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        pincode: '411001',
        familyMemberName: 'Primary Emergency Contact',
        familyRelationship: 'Spouse',
        familyDob: '1996-08-10',
        familyContact: phone || '+91 98765 43210',
        nomineeName: `${firstName} ${lastName} Nominee`,
        nomineeRelationship: 'Spouse',
        nomineeShare: 100,
        educationQualification: 'Bachelor of Technology (B.Tech)',
        educationSpecialization: role || 'Computer Science / Engineering',
        educationInstitution: 'National Institute of Technology',
        educationUniversity: 'State University',
        educationPassingYear: 2017,
        educationPercentage: 85,
        prevCompany: 'Enterprise Systems Ltd',
        prevJobTitle: role || 'Software Architect',
        prevStartDate: '2020-01-01',
        prevEndDate: '2026-07-31',
        prevTotalExp: '6.5 Years',
        prevReasonForLeaving: 'Career Growth at E-HCM',
        bankName: 'HDFC Bank Ltd',
        bankAccountNumber: '50100234567890',
        bankIfscCode: 'HDFC0000123',
        bankBranchName: 'Pune Main Branch',
        bankAccountHolderName: `${firstName} ${lastName}`,
        aadhaarNumber: '1234-5678-9012',
        panNumber: 'ABCDE1234F',
        passportNumber: 'Z1234567',
        kycStatus: 'VERIFIED',
        kycVerificationDate: new Date().toISOString().split('T')[0],
        uanNumber: '100900800700',
        pfMemberId: 'MH/PUN/0012345/000',
        esicNumber: '31000000000000000',
        pfApplicable: true,
        esicApplicable: false,
        pfEsicJoiningDate: formattedJoiningDate,
        salaryGrade: 'Grade A',
        salaryBand: 'Band 3 Enterprise',
        basicSalary: basic,
        hra: hra,
        conveyance: 12000,
        specialAllowance: special,
        otherAllowances: 24000,
        grossSalary: gross,
        annualCtc: ctcNum,
        salaryEffectiveFrom: formattedJoiningDate,
      });
    }
  }, [isAdding, candidateName, offerId, candidateId, companies, allBranches, allDepartments, allDesignations, employeesData]);

  // Set next auto employee code
  const enterAddingState = () => {
    let maxNum = 0;
    if (employeesData?.items && Array.isArray(employeesData.items)) {
      for (const emp of employeesData.items) {
        if (emp.employeeCode) {
          const match = emp.employeeCode.match(/^EMP(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
    }
    const nextCode = 'EMP' + String(maxNum === 0 ? (employeesData?.total ?? 0) + 1 : maxNum + 1).padStart(4, '0');

    form.reset({
      companyId: companies?.[0]?.id ?? '',
      businessUnit: 'Technology Services',
      branchId: '',
      location: '',
      costCenter: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '1995-01-01',
      gender: 'MALE',
      phone: '',
      personalEmail: '',
      employeeCode: nextCode,
      dateOfJoining: new Date().toISOString().split('T')[0],
      employeeCategory: 'Executive',
      employmentType: 'PERMANENT',
      status: 'ACTIVE',
      departmentId: '',
      designationId: '',
      reportingManagerId: '',
      grade: '',
      level: '',
      workEmail: '',
      workPhone: '',
      workMode: 'Onsite',
      shift: 'General Day Shift (G)',
      probationPeriod: '6 Months',
      confirmationDate: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
    });

    setActiveStep(0);
    setSelectedFiles({});
    setSearchParams({ action: 'new' });
  };

  const createMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) => {
      const payload = {
        ...values,
        middleName: values.middleName || null,
        costCenter: values.costCenter || null,
        personalEmail: values.personalEmail || null,
        workPhone: values.workPhone || null,
        probationPeriod: values.probationPeriod || null,
        confirmationDate: values.confirmationDate || null,
        emergencyContactName: values.emergencyContactName || null,
        emergencyContactRelationship: values.emergencyContactRelationship || null,
        emergencyContactPhone: values.emergencyContactPhone || null,
        reportingManagerId: values.reportingManagerId || null,
        dateOfJoining: values.dateOfJoining || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        familyDob: values.familyDob || null,
        prevStartDate: values.prevStartDate || null,
        prevEndDate: values.prevEndDate || null,
        kycVerificationDate: values.kycVerificationDate || null,
        pfEsicJoiningDate: values.pfEsicJoiningDate || null,
        salaryEffectiveFrom: values.salaryEffectiveFrom || null,
      };
      return employeesApi.create(payload);
    },
    onSuccess: async (newEmployee: any) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });

      if (candidateId) {
        try {
          await candidatesApi.updateStage(candidateId, 'HIRED');
        } catch (e) {
          console.log('Candidate stage update:', e);
        }
      }

      toast.success(
        `Employee ${newEmployee?.firstName || ''} ${newEmployee?.lastName || ''} (${newEmployee?.employeeCode || ''}) created successfully! Linked to Offer ${offerId || ''}. Candidate Status updated to ONBOARDED / HIRED.`
      );

      // Chained document uploads
      const docTypes = Object.keys(selectedFiles);
      if (docTypes.length > 0 && newEmployee?.id) {
        toast.info(`Uploading ${docTypes.length} documents...`);
        for (const type of docTypes) {
          try {
            await employeesApi.uploadDocument(newEmployee.id, selectedFiles[type], type);
          } catch (e) {
            console.error(`Failed to upload ${type}:`, e);
          }
        }
      }

      form.reset();
      setSelectedFiles({});
      setSearchParams({});
      if (newEmployee?.id) {
        navigate(`/employees/detail/${newEmployee.id}`);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const handleNextStep = async () => {
    // Basic triggers for critical fields if on first few steps to prevent moving forward with broken fields
    let isValid = true;
    if (activeStep === 0) {
      isValid = await form.trigger(['firstName', 'lastName', 'dateOfBirth', 'phone']);
    } else if (activeStep === 1) {
      isValid = await form.trigger(['companyId', 'branchId', 'employeeCode', 'dateOfJoining', 'departmentId', 'designationId']);
    } else if (activeStep === 2) {
      isValid = await form.trigger(['companyId', 'branchId', 'location']);
    } else if (activeStep === 3) {
      isValid = await form.trigger(['workEmail']);
    }

    if (!isValid) {
      console.warn(`Step ${activeStep + 1} validation errors:`, form.formState.errors);
      const errorMsg = Object.values(form.formState.errors)
        .map((e: any) => e?.message)
        .filter(Boolean)
        .join(', ');
      toast.error(errorMsg || 'Please correct validation errors on the current section before proceeding');
      return;
    }

    if (activeStep < STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      // Final Submit
      form.handleSubmit(
        (values) => {
          if (isEditing) {
            updateMutation.mutate(values);
          } else {
            createMutation.mutate(values);
          }
        },
        (errors) => {
          console.error('Final Submission Validation Errors:', errors);
          const errorDetails = Object.entries(errors)
            .map(([field, err]: [string, any]) => `${field} (${err?.message || 'required'})`)
            .join(', ');
          toast.error(`Please complete required fields: ${errorDetails}`);
        }
      )();
    }
  };

  const statutoryRecords = useMemo(() => {
    if (!employeesData?.items) return [];
    return employeesData.items.filter((emp: any) => {
      const matchesSearch =
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());

      const isVerified = emp.panNumber && emp.uanNumber && emp.bankAccountNumber;
      const isPending = !isVerified && (emp.panNumber || emp.uanNumber || emp.bankAccountNumber);
      const isIncomplete = !emp.panNumber && !emp.uanNumber && !emp.bankAccountNumber;

      if (selectedStatus === 'verified') return matchesSearch && isVerified;
      if (selectedStatus === 'pending') return matchesSearch && isPending;
      if (selectedStatus === 'incomplete') return matchesSearch && isIncomplete;
      return matchesSearch;
    });
  }, [employeesData, searchQuery, selectedStatus]);

  // Render Onboarding Stepper
  if (isAdding || isEditing) {
    const ActiveStepIcon = STEPS[activeStep].icon;
    const progressPercent = Math.round(((activeStep + 1) / STEPS.length) * 100);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Stepper Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full shadow-2xs border-border/85"
              onClick={() => setSearchParams({})}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" /> {isEditing ? 'Update Employee Master Wizard' : 'New Employee Onboarding Wizard'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing ? 'Modify registered details, salary structure, and profiles' : 'Declare full statutory registry, salary structure, and base profiles step-by-step'}
              </p>
              {(offerId || candidateName) && (
                <div className="flex items-center gap-2 mt-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-semibold w-fit shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse shrink-0" />
                  <span>Auto-filled from Recruitment & Accepted Offer {offerId ? `(${offerId})` : ''}</span>
                  {candidateId && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-300 text-emerald-800 font-mono">
                      Candidate ID: {candidateId}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-primary">{progressPercent}% Completed</span>
              <div className="w-32 bg-muted h-1.5 rounded-full overflow-hidden mt-1 border border-border">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-destructive hover:bg-destructive/5"
              onClick={() => setSearchParams({})}
            >
              Discard
            </Button>
          </div>
        </div>

        {/* Side-by-Side Stepper Container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left Navigation Menu (Stepper checklist) */}
          <Card className="lg:col-span-1 border-border/80 shadow-xs bg-muted/20">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/10">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Onboarding Stepper
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isSelected = activeStep === idx;
                const isCompleted = idx < activeStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border ${isSelected
                        ? 'border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground'
                        : isCompleted
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                          : 'border-border bg-background text-muted-foreground'
                      }`}>
                      {isCompleted ? <ShieldCheck className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-xs truncate">{step.title}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Right form editor pane */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="py-4 px-6 border-b border-border/60 bg-muted/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ActiveStepIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {STEPS[activeStep].title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enter the corresponding employee details below.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background border-border/80">
                  Step {activeStep + 1} of {STEPS.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-4 text-xs">
                  {/* Step 1: Personal Profile */}
                  {activeStep === 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">First Name *</Label>
                          <Input className="h-9 text-xs" placeholder="First Name" {...form.register('firstName')} />
                          {form.formState.errors.firstName && <p className="text-[10px] text-destructive">{form.formState.errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Middle Name</Label>
                          <Input className="h-9 text-xs" placeholder="Middle Name" {...form.register('middleName')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Last Name *</Label>
                          <Input className="h-9 text-xs" placeholder="Last Name" {...form.register('lastName')} />
                          {form.formState.errors.lastName && <p className="text-[10px] text-destructive">{form.formState.errors.lastName.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Date of Birth *</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('dateOfBirth')} />
                          {form.formState.errors.dateOfBirth && <p className="text-[10px] text-destructive">{form.formState.errors.dateOfBirth.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Gender *</Label>
                          <Select value={form.watch('gender')} onValueChange={(v) => form.setValue('gender', v as any)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE" className="text-xs">Male</SelectItem>
                              <SelectItem value="FEMALE" className="text-xs">Female</SelectItem>
                              <SelectItem value="OTHER" className="text-xs">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label>Marital Status</Label>
                          <Select value={form.watch('maritalStatus')} onValueChange={(v) => form.setValue('maritalStatus', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single" className="text-xs">Single</SelectItem>
                              <SelectItem value="Married" className="text-xs">Married</SelectItem>
                              <SelectItem value="Divorced" className="text-xs">Divorced</SelectItem>
                              <SelectItem value="Widowed" className="text-xs">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Nationality</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Indian" {...form.register('nationality')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Blood Group</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. O+" {...form.register('bloodGroup')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Religion</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Hindu" {...form.register('religion')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Personal Mobile *</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. +91 9876543210" {...form.register('phone')} />
                          {form.formState.errors.phone && <p className="text-[10px] text-destructive">{form.formState.errors.phone.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Personal Email</Label>
                          <Input type="email" className="h-9 text-xs" placeholder="e.g. personal@email.com" {...form.register('personalEmail')} />
                          {form.formState.errors.personalEmail && <p className="text-[10px] text-destructive">{form.formState.errors.personalEmail.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Employment Details */}
                  {activeStep === 1 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                            <Building2 className="h-3.5 w-3.5" /> Company Entity *
                          </Label>
                          <Select
                            value={form.watch('companyId') || ''}
                            onValueChange={(v) => form.setValue('companyId', v, { shouldValidate: true })}
                          >
                            <SelectTrigger className="h-9 text-xs font-semibold bg-background">
                              <SelectValue placeholder="Select Corporate Entity" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                                  {c.name} ({c.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.companyId && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.companyId.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3.5 w-3.5" /> Branch / Location *
                          </Label>
                          <Select
                            value={form.watch('branchId') || ''}
                            onValueChange={(v) => {
                              form.setValue('branchId', v, { shouldValidate: true });
                              const br = branchOptions.find((b: any) => b.id === v);
                              if (br) {
                                form.setValue('location', br.name || br.city || '');
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs font-semibold bg-background">
                              <SelectValue
                                placeholder={
                                  branchOptions.length === 0
                                    ? 'No branches configured for this company'
                                    : 'Select Branch / Location'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {branchOptions.length === 0 ? (
                                <SelectItem value="__empty_branch__" disabled className="text-xs text-muted-foreground italic">
                                  No branches configured for this company
                                </SelectItem>
                              ) : (
                                branchOptions.map((b: any) => (
                                  <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                                    {b.name} ({b.code})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.branchId && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.branchId.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Employee Code (Auto / Custom) *</Label>
                          <Input className="h-9 text-xs font-mono" {...form.register('employeeCode')} />
                          {form.formState.errors.employeeCode && <p className="text-[10px] text-destructive">{form.formState.errors.employeeCode.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Date of Joining *</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('dateOfJoining')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Employee Category *</Label>
                          <Select value={form.watch('employeeCategory')} onValueChange={(v) => form.setValue('employeeCategory', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Executive" className="text-xs">Executive</SelectItem>
                              <SelectItem value="Managerial" className="text-xs">Managerial</SelectItem>
                              <SelectItem value="Staff" className="text-xs">Staff</SelectItem>
                              <SelectItem value="Contractor" className="text-xs">Contractor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Employment Type *</Label>
                          <Select value={form.watch('employmentType')} onValueChange={(v) => form.setValue('employmentType', v as any)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PERMANENT" className="text-xs">Permanent</SelectItem>
                              <SelectItem value="CONTRACT" className="text-xs">Contract</SelectItem>
                              <SelectItem value="INTERN" className="text-xs">Intern</SelectItem>
                              <SelectItem value="CONSULTANT" className="text-xs">Consultant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Employment Status *</Label>
                          <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as any)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                              <SelectItem value="PROBATION" className="text-xs">Probation</SelectItem>
                              <SelectItem value="NOTICE_PERIOD" className="text-xs">Notice Period</SelectItem>
                              <SelectItem value="ON_LEAVE" className="text-xs">On Leave</SelectItem>
                              <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Department *</Label>
                          <Select
                            value={form.watch('departmentId') || ''}
                            onValueChange={(v) => {
                              form.setValue('departmentId', v, { shouldValidate: true });
                              form.setValue('designationId', '');
                              form.setValue('grade', '');
                              form.setValue('level', '');
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue
                                placeholder={
                                  departmentOptions.length === 0
                                    ? 'No departments configured for this company'
                                    : 'Select department'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {departmentOptions.length === 0 ? (
                                <SelectItem value="__empty_dept__" disabled className="text-xs text-muted-foreground italic">
                                  No departments configured for this company
                                </SelectItem>
                              ) : (
                                departmentOptions.map((d: any) => (
                                  <SelectItem key={d.id} value={d.id} className="text-xs">
                                    {d.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.departmentId && <p className="text-[10px] text-destructive">{form.formState.errors.departmentId.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Designation *</Label>
                          <Select
                            disabled={!watchedDeptId || departmentOptions.length === 0}
                            value={form.watch('designationId') || ''}
                            onValueChange={(v) => form.setValue('designationId', v, { shouldValidate: true })}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue
                                placeholder={
                                  !watchedDeptId
                                    ? 'Please select a department first'
                                    : designationOptions.length === 0
                                    ? 'No designations configured for this department'
                                    : 'Select designation'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {!watchedDeptId ? (
                                <SelectItem value="__select_dept_first__" disabled className="text-xs text-muted-foreground italic">
                                  Please select a department first
                                </SelectItem>
                              ) : designationOptions.length === 0 ? (
                                <SelectItem value="__empty_desig__" disabled className="text-xs text-muted-foreground italic">
                                  No designations configured for this department
                                </SelectItem>
                              ) : (
                                designationOptions.map((d: any) => (
                                  <SelectItem key={d.id} value={d.id} className="text-xs">
                                    {d.title}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.designationId && <p className="text-[10px] text-destructive">{form.formState.errors.designationId.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>Reporting Manager</Label>
                          <Select value={form.watch('reportingManagerId') || ''} onValueChange={(v) => form.setValue('reportingManagerId', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue
                                placeholder={
                                  reportingManagerOptions.length === 0
                                    ? 'No active employees found for this company'
                                    : 'Select manager'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" className="text-xs">None (Self / MD)</SelectItem>
                              {reportingManagerOptions.map((m: any) => (
                                <SelectItem key={m.id} value={m.id} className="text-xs">
                                  {m.firstName} {m.lastName} ({m.designation?.title ?? m.employeeCode ?? 'Personnel'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Job Grade (Auto)</Label>
                          <Input className="h-9 text-xs bg-muted font-mono" readOnly placeholder="Auto derived from Designation" {...form.register('grade')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Job Level (Auto)</Label>
                          <Input className="h-9 text-xs bg-muted font-mono" readOnly placeholder="Auto derived from Designation" {...form.register('level')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-2 mt-2">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Work Mode *</Label>
                          <Select value={form.watch('workMode')} onValueChange={(v) => form.setValue('workMode', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Work Mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Onsite" className="text-xs">Onsite</SelectItem>
                              <SelectItem value="Remote" className="text-xs">Remote</SelectItem>
                              <SelectItem value="Hybrid" className="text-xs">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Shift Assignment *</Label>
                          <Select value={form.watch('shift') || 'General Day Shift (G)'} onValueChange={(v) => form.setValue('shift', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select shift" />
                            </SelectTrigger>
                            <SelectContent>
                              {shiftTypesList && shiftTypesList.length > 0 ? (
                                shiftTypesList.map((st: any) => (
                                  <SelectItem key={st.id} value={st.name} className="text-xs">
                                    {st.name} ({st.startTime} - {st.endTime})
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="General Day Shift (G)" className="text-xs">General Day Shift (09:00 - 18:00)</SelectItem>
                                  <SelectItem value="Morning Shift (A)" className="text-xs">Morning Shift (06:00 - 14:00)</SelectItem>
                                  <SelectItem value="Evening Shift (B)" className="text-xs">Evening Shift (14:00 - 22:00)</SelectItem>
                                  <SelectItem value="Night Shift (C)" className="text-xs">Night Shift (22:00 - 06:00)</SelectItem>
                                  <SelectItem value="Flexible Shift" className="text-xs">Flexible / Core Hours Shift</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.shift && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.shift.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Probation Period (Optional)</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. 6 Months" {...form.register('probationPeriod')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Confirmation Date (Optional)</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('confirmationDate')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Corporate Organization */}
                  {activeStep === 2 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Company Entity *</Label>
                          <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.companyId && <p className="text-[10px] text-destructive">{form.formState.errors.companyId.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Business Unit *</Label>
                          <Select value={form.watch('businessUnit')} onValueChange={(v) => form.setValue('businessUnit', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Business Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Technology Services" className="text-xs">Technology Services</SelectItem>
                              <SelectItem value="Digital Marketing" className="text-xs">Digital Marketing</SelectItem>
                              <SelectItem value="Sales Operations" className="text-xs">Sales Operations</SelectItem>
                              <SelectItem value="Human Capital Management" className="text-xs">Human Capital Management</SelectItem>
                              <SelectItem value="Finance Operations" className="text-xs">Finance Operations</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Branch / Facility *</Label>
                          <Select value={form.watch('branchId')} onValueChange={(v) => form.setValue('branchId', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branchOptions?.map((b: any) => (
                                <SelectItem key={b.id} value={b.id} className="text-xs">
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.branchId && <p className="text-[10px] text-destructive">{form.formState.errors.branchId.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Location *</Label>
                          <Select value={form.watch('location')} onValueChange={(v) => form.setValue('location', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locationOptions?.map((l: any, i: number) => (
                                <SelectItem key={i} value={l.name} className="text-xs">
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Cost Center (Optional)</Label>
                          <Select value={form.watch('costCenter') || ''} onValueChange={(v) => form.setValue('costCenter', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" className="text-xs font-sans">None</SelectItem>
                              {costCentersList?.map((cc: any) => (
                                <SelectItem key={cc.id} value={cc.code} className="text-xs font-mono">
                                  {cc.code} - {cc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Contact & Address */}
                  {activeStep === 3 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Street Address / Address Line 1</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Flat 402, Sunshine Heights" {...form.register('addressLine1')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Current Address (Full)</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Flat 402, Sunshine Heights, Kalyani Nagar, Pune - 411006" {...form.register('currentAddress')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Permanent Address (Full)</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Flat 402, Sunshine Heights, Kalyani Nagar, Pune - 411006" {...form.register('permanentAddress')} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label>City</Label>
                            <Input className="h-9 text-xs" placeholder="Pune" {...form.register('city')} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Pincode</Label>
                            <Input className="h-9 text-xs font-mono" placeholder="411006" {...form.register('pincode')} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>State / Region</Label>
                          <Input className="h-9 text-xs" placeholder="Maharashtra" {...form.register('state')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Country</Label>
                          <Input className="h-9 text-xs" placeholder="India" {...form.register('country')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-2 mt-2">
                        <div className="space-y-1.5">
                          <Label className="font-semibold">Work Email *</Label>
                          <Input type="email" className="h-9 text-xs" placeholder="e.g. employee@company.com" {...form.register('workEmail')} />
                          {form.formState.errors.workEmail && <p className="text-[10px] text-destructive">{form.formState.errors.workEmail.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Work Phone (Optional)</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. +1 555-0100" {...form.register('workPhone')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-2 mt-2">
                        <div className="space-y-1.5">
                          <Label>Emergency Contact Name</Label>
                          <Input className="h-9 text-xs" placeholder="Emergency Contact Name" {...form.register('emergencyContactName')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Relationship</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Spouse / Parent" {...form.register('emergencyContactRelationship')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Emergency Contact Number</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. +91 9999999999" {...form.register('emergencyContactPhone')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Family & Nominee */}
                  {activeStep === 4 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Family Member Name</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Savitri Sharma" {...form.register('familyMemberName')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Relationship</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Mother" {...form.register('familyRelationship')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Date of Birth</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('familyDob')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Contact Number</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. +91 9999988888" {...form.register('familyContact')} />
                        </div>
                      </div>
                      <div className="border-t pt-2 mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>Nominee Name</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Savitri Sharma" {...form.register('nomineeName')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Nominee Relationship</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Mother" {...form.register('nomineeRelationship')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Nominee Share %</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 50" {...form.register('nomineeShare')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Education Details */}
                  {activeStep === 5 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Qualification</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Bachelor of Technology" {...form.register('educationQualification')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Specialization</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Computer Science" {...form.register('educationSpecialization')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Institution</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. PICT" {...form.register('educationInstitution')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>University / Board</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Pune University" {...form.register('educationUniversity')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Passing Year</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 2017" {...form.register('educationPassingYear')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Percentage / Grade</Label>
                          <Input type="number" step="0.01" className="h-9 text-xs font-mono" placeholder="e.g. 89.5" {...form.register('educationPercentage')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 7: Previous Experience */}
                  {activeStep === 6 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Previous Company</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Infosys Technologies" {...form.register('prevCompany')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Job Title</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Software Developer" {...form.register('prevJobTitle')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Start Date</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('prevStartDate')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>End Date</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('prevEndDate')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Total Experience</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. 3 Years 2 Months" {...form.register('prevTotalExp')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Reason for Leaving</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Career Growth" {...form.register('prevReasonForLeaving')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 8: Banking Information */}
                  {activeStep === 7 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Bank Name</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. HDFC Bank" {...form.register('bankName')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Account Number</Label>
                          <Input className="h-9 text-xs font-mono" placeholder="e.g. 501002991823" {...form.register('bankAccountNumber')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>IFSC Code</Label>
                          <Input className="h-9 text-xs font-mono uppercase" placeholder="e.g. HDFC0000104" {...form.register('bankIfscCode')} />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>Branch Name / Location</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Kalyani Nagar, Pune" {...form.register('bankBranchName')} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Account Holder Name</Label>
                        <Input className="h-9 text-xs" placeholder="Account Holder Name" {...form.register('bankAccountHolderName')} />
                      </div>
                    </div>
                  )}

                  {/* Step 9: Aadhaar / PAN / KYC */}
                  {activeStep === 8 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>Aadhaar Number</Label>
                          <Input className="h-9 text-xs font-mono" placeholder="e.g. 4567 8901 2345" {...form.register('aadhaarNumber')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>PAN Number</Label>
                          <Input className="h-9 text-xs font-mono uppercase" placeholder="e.g. ABCDE1234F" {...form.register('panNumber')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Passport Number</Label>
                          <Input className="h-9 text-xs font-mono uppercase" placeholder="e.g. Z9876543" {...form.register('passportNumber')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>KYC Status</Label>
                          <Select value={form.watch('kycStatus') || 'PENDING'} onValueChange={(v) => form.setValue('kycStatus', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                              <SelectItem value="VERIFIED" className="text-xs">Verified</SelectItem>
                              <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Verification Date</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('kycVerificationDate')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 10: PF & ESIC Details */}
                  {activeStep === 9 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>UAN Number</Label>
                          <Input className="h-9 text-xs font-mono" placeholder="e.g. 100918273645" {...form.register('uanNumber')} />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>PF Member ID</Label>
                          <Input className="h-9 text-xs font-mono" placeholder="e.g. MH/BAN/0099182/000/1234567" {...form.register('pfMemberId')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5 col-span-2">
                          <Label>ESIC Number</Label>
                          <Input className="h-9 text-xs font-mono" placeholder="e.g. 3112456789" {...form.register('esicNumber')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>PF/ESIC Joining Date</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('pfEsicJoiningDate')} />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded-sm border-input"
                            checked={form.watch('pfApplicable') || false}
                            onChange={(e) => form.setValue('pfApplicable', e.target.checked)}
                          />
                          <span>PF Applicable</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded-sm border-input"
                            checked={form.watch('esicApplicable') || false}
                            onChange={(e) => form.setValue('esicApplicable', e.target.checked)}
                          />
                          <span>ESIC Applicable</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Step 11: Salary Structure */}
                  {activeStep === 10 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Salary Grade</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. Grade A" {...form.register('salaryGrade')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Salary Band</Label>
                          <Input className="h-9 text-xs" placeholder="e.g. 5.0L - 8.0L" {...form.register('salaryBand')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>Basic Salary (Monthly)</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 30000" {...form.register('basicSalary')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>HRA (Monthly)</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 15000" {...form.register('hra')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Conveyance (Monthly)</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 3000" {...form.register('conveyance')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>Special Allowance</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 12000" {...form.register('specialAllowance')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Other Allowances</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 0" {...form.register('otherAllowances')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Gross Salary</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 60000" {...form.register('grossSalary')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Annual CTC</Label>
                          <Input type="number" className="h-9 text-xs font-mono" placeholder="e.g. 720000" {...form.register('annualCtc')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Effective From</Label>
                          <Input type="date" className="h-9 text-xs" {...form.register('salaryEffectiveFrom')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 12: Initial Documents */}
                  {activeStep === 11 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                        <div className="space-y-1.5">
                          <Label>Aadhaar Card Document</Label>
                          <Input type="file" className="h-9 text-xs" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFiles(prev => ({ ...prev, ID_PROOF: file }));
                          }} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>PAN Card Document</Label>
                          <Input type="file" className="h-9 text-xs" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFiles(prev => ({ ...prev, ADDRESS_PROOF: file }));
                          }} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Passport Document</Label>
                          <Input type="file" className="h-9 text-xs" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFiles(prev => ({ ...prev, PASSPORT: file }));
                          }} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Resume / CV</Label>
                          <Input type="file" className="h-9 text-xs" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFiles(prev => ({ ...prev, EDUCATION: file }));
                          }} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Offer Letter</Label>
                          <Input type="file" className="h-9 text-xs" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFiles(prev => ({ ...prev, OFFER_LETTER: file }));
                          }} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Joining Letter</Label>
                          <Input type="file" className="h-9 text-xs" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFiles(prev => ({ ...prev, JOINING_LETTER: file }));
                          }} />
                        </div>
                      </div>

                      {/* ── AUTO-FILLED TEMPLATE PREVIEWS ── */}
                      {autoPolicies && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 mt-4">
                          <div className="flex items-center gap-1.5 text-primary font-semibold text-[11px] uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" /> Auto-Configured IT Enterprise Policy Templates
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                            <div>• <strong>Payroll Group:</strong> {autoPolicies.payrollGroup}</div>
                            <div>• <strong>Attendance Policy:</strong> {autoPolicies.attendancePolicy}</div>
                            <div>• <strong>Leave Policy:</strong> {autoPolicies.leavePolicy}</div>
                            <div>• <strong>Working Calendar:</strong> {autoPolicies.workingCalendar}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons footer inside card */}
                  <div className="pt-4 border-t mt-6 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 px-4 gap-1 border-border/85"
                      onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                      disabled={activeStep === 0}
                    >
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs h-9 px-5 gap-1"
                      onClick={handleNextStep}
                      disabled={createMutation.isPending}
                    >
                      {activeStep < STEPS.length - 1 ? (
                        <>
                          Next <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        createMutation.isPending ? 'Creating Record...' : 'Complete & Onboard Employee'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render normal dashboard/table view (action !== 'new')
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Top Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PF & ESIC Linked</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {employeesData?.items?.filter((e: any) => e.panNumber && e.uanNumber && e.bankAccountNumber).length || 0} Staff
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Tax Compliant</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Allocation</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {employeesData?.items?.filter((e: any) => !e.panNumber || !e.uanNumber || !e.bankAccountNumber).length || 0} Records
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Allocation pending</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bank Accounts</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {employeesData?.items ? Math.round((employeesData.items.filter((e: any) => e.bankAccountNumber).length / Math.max(1, employeesData.items.length)) * 100) : 0}% Linked
              </p>
              <p className="text-[10px] text-primary font-semibold mt-1">Salary disbursement active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emergency Contacts</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {employeesData?.items ? Math.round((employeesData.items.filter((e: any) => e.emergencyContactPhone).length / Math.max(1, employeesData.items.length)) * 100) : 0}% Declared
              </p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Nominees assigned</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Statutory Master Table Card ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <IdCard className="h-4 w-4 text-primary" /> Employee Statutory & Payroll Master
              </CardTitle>
              <CardDescription className="text-xs">
                Manage income tax accounts, provident funds (PF), bank accounts, and corporate nominees
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'verified', label: 'Verified' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'incomplete', label: 'Incomplete' },
                ].map(status => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedStatus === status.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter by code or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Master Details Toggle Button */}
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={enterAddingState}>
                <Plus className="h-3.5 w-3.5" /> Declare Statutory
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px] font-semibold">Emp Code</TableHead>
                <TableHead className="font-semibold">Employee Name</TableHead>
                <TableHead className="font-semibold">PAN Tax Code</TableHead>
                <TableHead className="font-semibold">Provident Fund (PF) ID</TableHead>
                <TableHead className="font-semibold">Bank details</TableHead>
                <TableHead className="font-semibold">Emergency Contact</TableHead>
                <TableHead className="text-right font-semibold">Statutory & Login Setup</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statutoryRecords.length > 0 ? (
                statutoryRecords.map((emp: any) => {
                  const isVerified = emp.panNumber && emp.uanNumber && emp.bankAccountNumber;
                  const isPending = !isVerified && (emp.panNumber || emp.uanNumber || emp.bankAccountNumber);
                  const statusLabel = isVerified ? 'VERIFIED' : isPending ? 'PENDING' : 'INCOMPLETE';
                  const badgeVariant = isVerified ? 'success' : isPending ? 'warning' : 'destructive';

                  return (
                    <TableRow key={emp.id} className="hover:bg-muted/10">
                      <TableCell className="font-semibold font-mono text-primary">{emp.employeeCode}</TableCell>
                      <TableCell className="font-semibold">{emp.firstName} {emp.lastName}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{emp.panNumber || 'Not declared'}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{emp.uanNumber || 'Not assigned'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {emp.bankName ? `${emp.bankName} - ${emp.bankAccountNumber || ''}` : 'Not linked'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {emp.emergencyContactName ? `${emp.emergencyContactRelationship || 'Contact'}: ${emp.emergencyContactPhone || ''}` : 'Not declared'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            variant={badgeVariant}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          >
                            {statusLabel}
                          </Badge>
                          {emp.userId ? (
                            <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 shrink-0">
                              <ShieldCheck className="h-3 w-3" /> Account Active
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 text-[10px] font-semibold gap-1 bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 shrink-0"
                              onClick={() => handleOpenCreateLoginModal(emp)}
                            >
                              <Key className="h-3 w-3" /> Create Login
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No matching employee statutory records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create Login Modal ── */}
      <Dialog open={!!selectedEmpForLogin} onOpenChange={(open) => !open && setSelectedEmpForLogin(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Setup Employee Login Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate workspace login credentials for {selectedEmpForLogin?.firstName} {selectedEmpForLogin?.lastName} ({selectedEmpForLogin?.employeeCode})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Employee Name & Code</Label>
              <Input
                readOnly
                value={`${selectedEmpForLogin?.firstName} ${selectedEmpForLogin?.lastName} (${selectedEmpForLogin?.employeeCode})`}
                className="h-9 text-xs font-medium bg-muted/40"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Work Email / Username</Label>
              <Input
                type="email"
                value={loginEmailInput}
                onChange={(e) => setLoginEmailInput(e.target.value)}
                placeholder="employee@ehcm.local"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Temporary Password</Label>
                <button
                  type="button"
                  onClick={() => setLoginTempPasswordInput(`${selectedEmpForLogin?.firstName || 'Temp'}#2026!Temp`)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <Input
                type="text"
                value={loginTempPasswordInput}
                onChange={(e) => setLoginTempPasswordInput(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> First-Login Security Policy
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                The employee will be required to change this temporary password upon their first login before accessing their dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEmpForLogin(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createLoginMutation.isPending}
              onClick={() => createLoginMutation.mutate(selectedEmpForLogin)}
              className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground"
            >
              {createLoginMutation.isPending ? 'Creating...' : 'Create Account & Generate Login'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Credentials Success Modal ── */}
      <Dialog open={!!createdCredentialsData} onOpenChange={(open) => !open && setCreatedCredentialsData(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Login Account Created Successfully
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide these secure login details to {createdCredentialsData?.employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground font-sans font-semibold">Employee Name:</span>
                <span className="font-semibold">{createdCredentialsData?.employeeName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground font-sans font-semibold">Work Email:</span>
                <span className="font-semibold text-primary">{createdCredentialsData?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground font-sans font-semibold">Employee Code:</span>
                <span className="font-semibold">{createdCredentialsData?.employeeCode}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground font-sans font-semibold">Temporary Password:</span>
                <span className="font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">{createdCredentialsData?.temporaryPassword}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans font-semibold">System Role:</span>
                <span className="font-semibold">{createdCredentialsData?.role}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
              🔒 <strong>Security Note:</strong> The password hash is securely encrypted in the database. Share credentials directly with the employee.
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {isCopied ? 'Copied!' : 'Copy Credentials'}
            </Button>
            <Button
              size="sm"
              onClick={() => setCreatedCredentialsData(null)}
              className="h-8 text-xs font-semibold"
            >
              Done & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
