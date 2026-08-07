import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Users, ShieldCheck, ArrowRightLeft, UserX } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { companiesApi, departmentsApi, designationsApi } from '@/api/organization';
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
  companyId: z.string().min(1, 'Company is required'),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  workEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeListPage() {
  const queryClient = useQueryClient();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'directory';
  const [open, setOpen] = useState(false);

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 200 }),
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { companyId: '', employeeCode: '', firstName: '', lastName: '', workEmail: '', phone: '', dateOfJoining: '' },
  });

  const selectedCompanyId = form.watch('companyId');
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

  const createMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      employeesApi.create({
        ...values,
        departmentId: values.departmentId || undefined,
        designationId: values.designationId || undefined,
        workEmail: values.workEmail || undefined,
        dateOfJoining: values.dateOfJoining || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
      setOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

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
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => form.reset({ companyId: companies?.[0]?.id ?? '', employeeCode: '', firstName: '', lastName: '', workEmail: '', phone: '', dateOfJoining: '' })}>
                <Plus className="h-3.5 w-3.5" /> Add Employee Master
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add New Employee Master Record</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Entity</Label>
                  <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name</Label>
                    <Input className="h-9 text-xs" {...form.register('firstName')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name</Label>
                    <Input className="h-9 text-xs" {...form.register('lastName')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employee Code</Label>
                    <Input className="h-9 text-xs" placeholder="e.g. EMP0005" {...form.register('employeeCode')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date of Joining</Label>
                    <Input type="date" className="h-9 text-xs" {...form.register('dateOfJoining')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Select value={form.watch('departmentId') || ''} onValueChange={(v) => form.setValue('departmentId', v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions?.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Designation</Label>
                    <Select value={form.watch('designationId') || ''} onValueChange={(v) => form.setValue('designationId', v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationOptions?.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">
                            {d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Work Email</Label>
                    <Input type="email" className="h-9 text-xs" {...form.register('workEmail')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone Number</Label>
                    <Input className="h-9 text-xs" {...form.register('phone')} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" className="text-xs" disabled={createMutation.isPending}>
                    Create Employee Record
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
