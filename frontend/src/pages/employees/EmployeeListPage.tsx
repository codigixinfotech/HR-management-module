import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Users, ShieldCheck, ArrowRightLeft, UserX, Sparkles, Building2 } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { companiesApi, departmentsApi, designationsApi, branchesApi } from '@/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import new tab components
import { EmployeeDirectoryTab } from './EmployeeDirectoryTab';
import { EmployeeMasterTab } from './EmployeeMasterTab';
import { DocumentVaultTab } from './DocumentVaultTab';
import { SkillsCertificationsTab } from './SkillsCertificationsTab';
import { TransfersPromotionsTab } from './TransfersPromotionsTab';
import { ExitManagementTab } from './ExitManagementTab';
import { EmployeeReportsTab } from './EmployeeReportsTab';

const employeeSchema = z.object({
  // 1. Corporate Organization
  companyId: z.string().min(1, 'Company is required'),
  businessUnit: z.string().min(1, 'Business Unit is required'),
  branchId: z.string().min(1, 'Branch is required'),
  location: z.string().min(1, 'Location is required'),
  costCenter: z.string().optional(),

  // 2. Personal Information
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(1, 'Personal mobile number is required'),
  personalEmail: z.string().email('Invalid personal email').or(z.literal('')).optional(),

  // 3. Employment Details
  employeeCode: z.string().min(1, 'Employee code is required'),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  employeeCategory: z.string().min(1, 'Employee category is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  status: z.string().min(1, 'Employment status is required'),
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  reportingManagerId: z.string().min(1, 'Reporting manager is required'),
  grade: z.string().optional(),
  level: z.string().optional(),

  // 4. Work Information
  workEmail: z.string().email('Invalid work email address').min(1, 'Work email is required'),
  workPhone: z.string().optional(),
  workMode: z.string().min(1, 'Work mode is required'),
  shift: z.string().min(1, 'Shift assignment is required'),
  probationPeriod: z.string().optional(),
  confirmationDate: z.string().optional(),

  // 5. Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'directory';
  const [open, setOpen] = useState(false);

  // Auto-filled policies display state
  const [autoPolicies, setAutoPolicies] = useState<{
    payrollGroup: string;
    attendancePolicy: string;
    leavePolicy: string;
    workingCalendar: string;
  } | null>(null);

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 200 }),
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      companyId: '',
      businessUnit: 'Technology Services',
      branchId: '',
      location: 'New York HQ',
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
    },
  });

  const selectedCompanyId = form.watch('companyId');
  const watchedDeptId = form.watch('departmentId');
  const watchedDesigId = form.watch('designationId');
  const selectedBranchId = form.watch('branchId');

  const { data: branchOptions } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const selectedBranch = useMemo(() => {
    return branchOptions?.find((b: any) => b.id === selectedBranchId);
  }, [branchOptions, selectedBranchId]);

  const locationOptions = selectedBranch?.locations ?? [];

  useEffect(() => {
    if (locationOptions.length > 0) {
      form.setValue('location', locationOptions[0].name);
    } else {
      form.setValue('location', '');
    }
  }, [selectedBranchId, locationOptions, form]);

  const { data: departmentOptions } = useQuery({
    queryKey: ['departments', selectedCompanyId],
    queryFn: () => departmentsApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: designationOptions } = useQuery({
    queryKey: ['designations', selectedCompanyId],
    queryFn: () => designationsApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  // Automatically trigger Grade/Level/Policies auto-fill when Technology Department and Software Engineer Designation are selected
  useEffect(() => {
    if (!watchedDeptId || !watchedDesigId) {
      setAutoPolicies(null);
      return;
    }
    const dept = departmentOptions?.find((d) => d.id === watchedDeptId);
    const desig = designationOptions?.find((d) => d.id === watchedDesigId);

    if (
      (dept?.name === 'Engineering & Technology' || dept?.code === 'ENG') &&
      (desig?.title === 'Software Engineer' || desig?.code === 'ENG-SDE')
    ) {
      form.setValue('grade', 'E2');
      form.setValue('level', 'L1');
      
      // Auto-fill default manager (e.g. Alex Vance or Rajesh Sharma)
      const defaultManager =
        data?.items?.find((emp: any) => emp.firstName === 'Alex' && emp.lastName === 'Vance') ||
        data?.items?.find((emp: any) => emp.firstName === 'Rajesh' && emp.lastName === 'Sharma') ||
        data?.items?.[0];

      if (defaultManager) {
        form.setValue('reportingManagerId', defaultManager.id);
      }

      setAutoPolicies({
        payrollGroup: 'Standard IT Payroll Group',
        attendancePolicy: 'Standard Flexible IT Attendance Policy',
        leavePolicy: 'Premium Technology Leave Policy',
        workingCalendar: 'IT Software Calendar (5-day)',
      });
      toast.info('Auto-populated IT corporate policy templates based on Technology → Software Engineer role!', {
        icon: <Sparkles className="h-4 w-4 text-primary" />,
      });
    } else {
      setAutoPolicies(null);
    }
  }, [watchedDeptId, watchedDesigId, departmentOptions, designationOptions, data, form]);

  const createMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) => {
      const payload = {
        ...values,
        middleName: values.middleName || null,
        costCenter: values.costCenter || null,
        personalEmail: values.personalEmail || null,
        workPhone: values.workPhone || null,
        probationPeriod: values.probationPeriod || null,
        confirmationDate: values.confirmationDate ? new Date(values.confirmationDate).toISOString() : null,
        emergencyContactName: values.emergencyContactName || null,
        emergencyContactRelationship: values.emergencyContactRelationship || null,
        emergencyContactPhone: values.emergencyContactPhone || null,
        dateOfJoining: values.dateOfJoining ? new Date(values.dateOfJoining).toISOString() : undefined,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
      };
      return employeesApi.create(payload);
    },
    onSuccess: (newEmployee: any) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
      setOpen(false);
      form.reset();
      if (newEmployee?.id) {
        navigate(`/employees/detail/${newEmployee.id}`);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const handleOpenCreate = () => {
    const nextCode = 'EMP' + String((data?.total ?? 24) + 1).padStart(4, '0');
    form.reset({
      companyId: companies?.[0]?.id ?? '',
      businessUnit: 'Technology Services',
      branchId: branchOptions?.[0]?.id ?? '',
      location: 'New York HQ',
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
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Employee Directory & Lifecycle Master"
        description="Complete employee master profile, digital document vault, transfers, skill records & exit offboarding"
        badge={`${data?.total ?? 0} Total Active Personnel`}
        badgeVariant="success"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs" onClick={handleOpenCreate}>
                <Plus className="h-3.5 w-3.5" /> Add Employee Master
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Building2 className="h-5 w-5 text-primary" /> Quick Add New Employee Master Record
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-4 text-xs" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                                {/* ── SECTION 1: CORPORATE ORGANIZATION ── */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-1 border-b pb-1 text-[11px] uppercase tracking-wider">
                    1. Corporate Organization
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Company Entity *</Label>
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
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Business Unit *</Label>
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
                      {form.formState.errors.businessUnit && <p className="text-[10px] text-destructive">{form.formState.errors.businessUnit.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Branch / Facility *</Label>
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
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Location *</Label>
                      <Select value={form.watch('location')} onValueChange={(v) => form.setValue('location', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions && locationOptions.length > 0 ? (
                            locationOptions.map((loc: any) => (
                              <SelectItem key={loc.id} value={loc.name} className="text-xs">
                                {loc.name} {loc.buildingName ? `(${loc.buildingName})` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-2 px-2.5 text-[10px] text-muted-foreground italic">
                              No locations configured.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.location && <p className="text-[10px] text-destructive">{form.formState.errors.location.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Cost Center (Optional)</Label>
                      <Select value={form.watch('costCenter') || ''} onValueChange={(v) => form.setValue('costCenter', v)}>
                        <SelectTrigger className="h-9 text-xs font-mono">
                          <SelectValue placeholder="Select cost center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">None</SelectItem>
                          <SelectItem value="CC-101" className="text-xs font-mono">CC-101 (HR & Admin)</SelectItem>
                          <SelectItem value="CC-102" className="text-xs font-mono">CC-102 (Engineering)</SelectItem>
                          <SelectItem value="CC-103" className="text-xs font-mono">CC-103 (Sales & Mkt)</SelectItem>
                          <SelectItem value="CC-104" className="text-xs font-mono">CC-104 (Plant Ops)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: PERSONAL INFORMATION ── */}
                <div className="space-y-3 pt-1">
                  <h4 className="font-semibold text-primary flex items-center gap-1 border-b pb-1 text-[11px] uppercase tracking-wider">
                    2. Personal Information
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">First Name *</Label>
                      <Input className="h-9 text-xs" placeholder="First Name" {...form.register('firstName')} />
                      {form.formState.errors.firstName && <p className="text-[10px] text-destructive">{form.formState.errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Middle Name (Optional)</Label>
                      <Input className="h-9 text-xs" placeholder="Middle Name" {...form.register('middleName')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Last Name *</Label>
                      <Input className="h-9 text-xs" placeholder="Last Name" {...form.register('lastName')} />
                      {form.formState.errors.lastName && <p className="text-[10px] text-destructive">{form.formState.errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Date of Birth *</Label>
                      <Input type="date" className="h-9 text-xs" {...form.register('dateOfBirth')} />
                      {form.formState.errors.dateOfBirth && <p className="text-[10px] text-destructive">{form.formState.errors.dateOfBirth.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Gender *</Label>
                      <Select value={form.watch('gender')} onValueChange={(v) => form.setValue('gender', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE" className="text-xs">Male</SelectItem>
                          <SelectItem value="FEMALE" className="text-xs">Female</SelectItem>
                          <SelectItem value="OTHER" className="text-xs">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.gender && <p className="text-[10px] text-destructive">{form.formState.errors.gender.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Personal Mobile Number *</Label>
                      <Input className="h-9 text-xs" placeholder="e.g. +91 9876543210" {...form.register('phone')} />
                      {form.formState.errors.phone && <p className="text-[10px] text-destructive">{form.formState.errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Personal Email (Optional)</Label>
                      <Input type="email" className="h-9 text-xs" placeholder="e.g. personal@email.com" {...form.register('personalEmail')} />
                      {form.formState.errors.personalEmail && <p className="text-[10px] text-destructive">{form.formState.errors.personalEmail.message}</p>}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: EMPLOYMENT DETAILS ── */}
                <div className="space-y-3 pt-1">
                  <h4 className="font-semibold text-primary flex items-center gap-1 border-b pb-1 text-[11px] uppercase tracking-wider">
                    3. Employment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Employee Code (Auto Generated) *</Label>
                      <Input className="h-9 text-xs font-mono bg-muted" readOnly {...form.register('employeeCode')} />
                      {form.formState.errors.employeeCode && <p className="text-[10px] text-destructive">{form.formState.errors.employeeCode.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Date of Joining *</Label>
                      <Input type="date" className="h-9 text-xs" {...form.register('dateOfJoining')} />
                      {form.formState.errors.dateOfJoining && <p className="text-[10px] text-destructive">{form.formState.errors.dateOfJoining.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Employee Category *</Label>
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
                      {form.formState.errors.employeeCategory && <p className="text-[10px] text-destructive">{form.formState.errors.employeeCategory.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Employment Type *</Label>
                      <Select value={form.watch('employmentType')} onValueChange={(v) => form.setValue('employmentType', v)}>
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
                      {form.formState.errors.employmentType && <p className="text-[10px] text-destructive">{form.formState.errors.employmentType.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Employment Status *</Label>
                      <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
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
                      {form.formState.errors.status && <p className="text-[10px] text-destructive">{form.formState.errors.status.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Department *</Label>
                      <Select value={form.watch('departmentId') || ''} onValueChange={(v) => form.setValue('departmentId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.departmentId && <p className="text-[10px] text-destructive">{form.formState.errors.departmentId.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Designation *</Label>
                      <Select value={form.watch('designationId') || ''} onValueChange={(v) => form.setValue('designationId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {designationOptions?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.designationId && <p className="text-[10px] text-destructive">{form.formState.errors.designationId.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <Label className="text-[11px] font-semibold">Reporting Manager *</Label>
                      <Select value={form.watch('reportingManagerId') || ''} onValueChange={(v) => form.setValue('reportingManagerId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {data?.items?.map((m: any) => (
                            <SelectItem key={m.id} value={m.id} className="text-xs">
                              {m.firstName} {m.lastName} ({m.designation?.title ?? 'Personnel'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.reportingManagerId && <p className="text-[10px] text-destructive">{form.formState.errors.reportingManagerId.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Job Grade (Auto)</Label>
                      <Input className="h-9 text-xs bg-muted font-mono" readOnly placeholder="e.g. E2" {...form.register('grade')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Job Level (Auto)</Label>
                      <Input className="h-9 text-xs bg-muted font-mono" readOnly placeholder="e.g. L1" {...form.register('level')} />
                    </div>
                  </div>
                </div>

                {/* ── SECTION 4: WORK INFORMATION ── */}
                <div className="space-y-3 pt-1">
                  <h4 className="font-semibold text-primary flex items-center gap-1 border-b pb-1 text-[11px] uppercase tracking-wider">
                    4. Work Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Work Email *</Label>
                      <Input type="email" className="h-9 text-xs" placeholder="e.g. employee@company.com" {...form.register('workEmail')} />
                      {form.formState.errors.workEmail && <p className="text-[10px] text-destructive">{form.formState.errors.workEmail.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Work Phone (Optional)</Label>
                      <Input className="h-9 text-xs" placeholder="e.g. +1 555-0100" {...form.register('workPhone')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Work Mode *</Label>
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
                      {form.formState.errors.workMode && <p className="text-[10px] text-destructive">{form.formState.errors.workMode.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Shift Assignment *</Label>
                      <Select value={form.watch('shift')} onValueChange={(v) => form.setValue('shift', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Day Shift (G)" className="text-xs">General Shift (09:00 - 18:00)</SelectItem>
                          <SelectItem value="Morning Shift (A)" className="text-xs">Morning Shift (06:00 - 14:00)</SelectItem>
                          <SelectItem value="Evening Shift (B)" className="text-xs">Evening Shift (14:00 - 22:00)</SelectItem>
                          <SelectItem value="Night Shift (C)" className="text-xs">Night Shift (22:00 - 06:00)</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.shift && <p className="text-[10px] text-destructive">{form.formState.errors.shift.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Probation Period (Optional)</Label>
                      <Input className="h-9 text-xs" placeholder="e.g. 6 Months" {...form.register('probationPeriod')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Confirmation Date (Optional)</Label>
                      <Input type="date" className="h-9 text-xs" {...form.register('confirmationDate')} />
                    </div>
                  </div>
                </div>

                {/* ── SECTION 5: EMERGENCY CONTACT ── */}
                <div className="space-y-3 pt-1">
                  <h4 className="font-semibold text-primary flex items-center gap-1 border-b pb-1 text-[11px] uppercase tracking-wider">
                    5. Emergency Contact
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Emergency Contact Name (Optional)</Label>
                      <Input className="h-9 text-xs" placeholder="Emergency Contact Name" {...form.register('emergencyContactName')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Relationship (Optional)</Label>
                      <Input className="h-9 text-xs" placeholder="e.g. Spouse / Parent" {...form.register('emergencyContactRelationship')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Emergency Contact Number (Optional)</Label>
                      <Input className="h-9 text-xs" placeholder="e.g. +91 9999999999" {...form.register('emergencyContactPhone')} />
                    </div>
                  </div>
                </div>

                {/* ── AUTO-FILLED TEMPLATE PREVIEWS ── */}
                {autoPolicies && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-primary font-semibold text-[11px] uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" /> Auto-Configured IT Enterprise Policy Templates
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                      <div>• <strong>Payroll Group:</strong> {autoPolicies.payrollGroup}</div>
                      <div>• <strong>Attendance Policy:</strong> {autoPolicies.attendancePolicy}</div>
                      <div>• <strong>Leave Policy:</strong> {autoPolicies.leavePolicy}</div>
                      <div>• <strong>Working Calendar:</strong> {autoPolicies.workingCalendar}</div>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button type="submit" size="sm" className="text-xs px-6 py-2 gap-1.5" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Employee Record'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Active Employees"
          value={`${data?.total ?? 0}`}
          hint="100% Payroll Enrolled"
          accent="success"
        />
        <StatCard
          icon={ShieldCheck}
          label="Verified Documents"
          value="96.8%"
          hint="Aadhaar & PAN Synced"
          accent="info"
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Promotions & Transfers YTD"
          value="12"
          hint="Internal Career Progression"
          accent="primary"
        />
        <StatCard
          icon={UserX}
          label="Annual Attrition Rate"
          value="3.8%"
          hint="Low Attrition Score"
          accent="warning"
        />
      </div>

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'directory' && (
        <EmployeeDirectoryTab employees={data?.items} isLoading={isLoading} />
      )}

      {activeTab === 'master' && <EmployeeMasterTab />}

      {activeTab === 'documents' && <DocumentVaultTab />}

      {activeTab === 'skills' && <SkillsCertificationsTab />}

      {activeTab === 'transfers' && <TransfersPromotionsTab />}

      {activeTab === 'exit' && <ExitManagementTab />}

      {activeTab === 'reports' && <EmployeeReportsTab />}
    </div>
  );
}
