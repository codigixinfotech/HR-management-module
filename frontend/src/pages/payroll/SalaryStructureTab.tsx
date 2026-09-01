import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Layers,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Brain,
  Info,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';
import { salaryComponentsApi, salaryTemplatesApi, salaryAssignmentsApi } from '@/api/payroll';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

// ── ZOD SCHEMAS ──
const componentSchema = z.object({
  code: z.string().min(1, 'Component Code is required').transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1, 'Component Name is required'),
  type: z.enum(['EARNING', 'DEDUCTION']),
  category: z.string().optional(),
  description: z.string().optional(),
  calculationType: z.string().default('FIXED'),
  calculationValue: z.coerce.number().default(0),
  calculationBase: z.string().optional(),
  isStatutory: z.boolean().default(false),
  isTaxable: z.boolean().default(true),
  includeInGross: z.boolean().default(true),
  includeInCtc: z.boolean().default(true),
  isPfApplicable: z.boolean().default(false),
  isEsiApplicable: z.boolean().default(false),
  isPtApplicable: z.boolean().default(false),
  isTdsApplicable: z.boolean().default(false),
  showOnPayslip: z.boolean().default(true),
  isActive: z.boolean().default(true),
});
type ComponentFormValues = z.infer<typeof componentSchema>;

export function SalaryStructureTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('components');

  // Dialog Controls
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any | null>(null);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Search and Filter states
  const [componentSearch, setComponentSearch] = useState('');
  const [componentTypeFilter, setComponentTypeFilter] = useState('ALL');

  const [employeeSearch, setEmployeeSearch] = useState('');

  // ── 1. API QUERIES ──
  const { data: components = [], isLoading: loadingComponents } = useQuery({
    queryKey: ['salary-components', companyId, componentSearch, componentTypeFilter],
    queryFn: () => salaryComponentsApi.list(companyId, componentSearch, componentTypeFilter === 'ALL' ? undefined : componentTypeFilter),
    enabled: !!companyId,
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['salary-templates', companyId],
    queryFn: () => salaryTemplatesApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['salary-assignments', companyId],
    queryFn: () => salaryAssignmentsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: revisions = [], isLoading: loadingRevisions } = useQuery({
    queryKey: ['salary-revisions', companyId],
    queryFn: () => salaryAssignmentsApi.listRevisions(companyId),
    enabled: !!companyId,
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 500, companyId }),
    enabled: !!companyId,
  });

  const realEmployees = employeesPage?.items || [];

  // ── 2. REACT HOOK FORM SETUP ──

  // Component Form
  const componentForm = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'EARNING',
      category: 'Basic',
      description: '',
      calculationType: 'FIXED',
      calculationValue: 0,
      calculationBase: 'BASIC',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: false,
      isTdsApplicable: false,
      showOnPayslip: true,
      isActive: true,
    },
  });

  // Template Form
  const templateForm = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      currency: 'INR',
      payFrequency: 'MONTHLY',
      items: [
        { salaryComponentId: '', monthlyAmount: 0, annualAmount: 0 },
      ],
    },
  });

  const { fields: templateFields, append: appendTemplateItem, remove: removeTemplateItem } = useFieldArray({
    control: templateForm.control,
    name: 'items',
  });

  // Assignment Form
  const assignForm = useForm({
    defaultValues: {
      employeeId: '',
      templateId: '',
      annualCtc: 600000,
      monthlyCtc: 50000,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      revisionReason: 'Annual Appraisal & Performance Revision',
      details: [] as { salaryComponentId: string; name: string; type: string; monthlyAmount: number; annualAmount: number }[],
    },
  });

  // ── 3. MUTATIONS ──

  // Component Save / Edit
  const createComponentMutation = useMutation({
    mutationFn: (values: ComponentFormValues) => {
      if (editingComponent) {
        return salaryComponentsApi.update(editingComponent.id, values);
      }
      return salaryComponentsApi.create({ ...values, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success(editingComponent ? 'Salary component updated' : 'Salary component created');
      setComponentDialogOpen(false);
      setEditingComponent(null);
      componentForm.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save salary component'),
  });

  // Component Delete
  const deleteComponentMutation = useMutation({
    mutationFn: (id: string) => salaryComponentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Cannot delete component'),
  });

  // Template Save / Edit
  const saveTemplateMutation = useMutation({
    mutationFn: (values: any) => {
      if (editingTemplate) {
        return salaryTemplatesApi.update(editingTemplate.id, values);
      }
      return salaryTemplatesApi.create({ ...values, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-templates'] });
      toast.success(editingTemplate ? 'Template updated successfully' : 'Salary structure template created');
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save template'),
  });

  // Assignment Save / Revise
  const saveAssignmentMutation = useMutation({
    mutationFn: (values: any) => {
      const cleanDetails = values.details?.map((d: any) => ({
        salaryComponentId: d.salaryComponentId,
        monthlyAmount: Number(d.monthlyAmount) || 0,
        annualAmount: Number(d.annualAmount) || (Number(d.monthlyAmount) || 0) * 12,
        calculationType: d.calculationType || 'FIXED',
        calculationValue: Number(d.calculationValue) || 0,
      }));
      return salaryAssignmentsApi.assign({
        ...values,
        companyId,
        annualCtc: Number(values.annualCtc),
        monthlyCtc: Number(values.monthlyCtc),
        details: cleanDetails,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['salary-revisions'] });
      toast.success('Employee salary structure assigned and saved to database!');
      setAssignDialogOpen(false);
      assignForm.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to assign salary structure'),
  });

  // ── 4. HANDLERS & COMPUTATIONS ──

  const handleOpenAddComponent = () => {
    setEditingComponent(null);
    componentForm.reset({
      code: '',
      name: '',
      type: 'EARNING',
      category: 'Basic',
      description: '',
      calculationType: 'FIXED',
      calculationValue: 0,
      calculationBase: 'BASIC',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: false,
      isTdsApplicable: false,
      showOnPayslip: true,
      isActive: true,
    });
    setComponentDialogOpen(true);
  };

  const handleOpenEditComponent = (comp: any) => {
    setEditingComponent(comp);
    componentForm.reset({
      code: comp.code,
      name: comp.name,
      type: comp.type,
      category: comp.category || 'Basic',
      description: comp.description || '',
      calculationType: comp.calculationType || 'FIXED',
      calculationValue: comp.calculationValue || 0,
      calculationBase: comp.calculationBase || 'BASIC',
      isStatutory: comp.isStatutory || false,
      isTaxable: comp.isTaxable ?? true,
      includeInGross: comp.includeInGross ?? true,
      includeInCtc: comp.includeInCtc ?? true,
      isPfApplicable: comp.isPfApplicable || false,
      isEsiApplicable: comp.isEsiApplicable || false,
      isPtApplicable: comp.isPtApplicable || false,
      isTdsApplicable: comp.isTdsApplicable || false,
      showOnPayslip: comp.showOnPayslip ?? true,
      isActive: comp.isActive ?? true,
    });
    setComponentDialogOpen(true);
  };

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    templateForm.reset({
      name: '',
      code: '',
      description: '',
      currency: 'INR',
      payFrequency: 'MONTHLY',
      items: components.slice(0, 4).map((c) => ({
        salaryComponentId: c.id,
        monthlyAmount: c.code === 'BASIC' ? 25000 : c.code === 'HRA' ? 12500 : 5000,
        annualAmount: (c.code === 'BASIC' ? 25000 : c.code === 'HRA' ? 12500 : 5000) * 12,
      })),
    });
    setTemplateDialogOpen(true);
  };

  const handleSelectTemplateForAssignment = (templateId: string) => {
    const selectedTmpl = templates.find((t: any) => t.id === templateId);
    if (!selectedTmpl) return;

    const annualCtc = assignForm.getValues('annualCtc') || 600000;
    const monthlyCtc = Math.round(annualCtc / 12);
    assignForm.setValue('monthlyCtc', monthlyCtc);

    if (selectedTmpl.items && selectedTmpl.items.length > 0) {
      const usedNames = new Set<string>();
      const standardNames = [
        'Basic Salary',
        'House Rent Allowance (HRA)',
        'Special Allowance',
        'Employer PF Contribution',
        'Conveyance Allowance',
        'Medical Allowance',
      ];

      const details = selectedTmpl.items.map((item: any, idx: number) => {
        const comp = components.find((c: any) => c.id === item.salaryComponentId);
        const compCode = (item.salaryComponent?.code || comp?.code || '').toUpperCase();
        
        let compName = item.salaryComponent?.name || comp?.name || '';
        
        // Prevent duplicate component names by falling back to distinct standard names
        if (!compName || compName === 'Salary Component' || usedNames.has(compName.toLowerCase())) {
          compName = standardNames[idx] || `Salary Component ${idx + 1}`;
        }
        usedNames.add(compName.toLowerCase());

        let monthly = item.monthlyAmount || 0;
        if (compCode === 'BASIC' || (compName.toLowerCase().includes('basic') && idx === 0)) {
          monthly = Math.round(monthlyCtc * 0.50);
        } else if (compCode === 'HRA' || compName.toLowerCase().includes('hra') || compName.toLowerCase().includes('house')) {
          monthly = Math.round(monthlyCtc * 0.25);
        } else if (compCode === 'SA' || compCode === 'SPECIAL' || compName.toLowerCase().includes('special')) {
          monthly = Math.round(monthlyCtc * 0.15);
        } else {
          monthly = Math.round(monthlyCtc * 0.10);
        }

        return {
          salaryComponentId: item.salaryComponentId,
          name: compName,
          type: item.salaryComponent?.type || comp?.type || 'EARNING',
          monthlyAmount: monthly,
          annualAmount: monthly * 12,
        };
      });
      assignForm.setValue('details', details);
    }
  };

  const handleAnnualCtcChange = (annualVal: number) => {
    const monthlyVal = annualVal > 0 ? Math.round(annualVal / 12) : 0;
    assignForm.setValue('annualCtc', annualVal);
    assignForm.setValue('monthlyCtc', monthlyVal);

    const currentDetails = assignForm.getValues('details');
    if (currentDetails && currentDetails.length > 0) {
      const totalItems = currentDetails.length;
      const updatedDetails = currentDetails.map((d: any, idx: number) => {
        const nameLower = (d.name || '').toLowerCase();
        let monthly = d.monthlyAmount;
        if (annualVal === 0) {
          monthly = 0;
        } else if (nameLower.includes('basic') && idx === 0) {
          monthly = Math.round(monthlyVal * 0.50);
        } else if ((nameLower.includes('hra') || nameLower.includes('house')) && idx === 1) {
          monthly = Math.round(monthlyVal * 0.25);
        } else if ((nameLower.includes('special') || nameLower.includes('allowance')) && idx === 2) {
          monthly = Math.round(monthlyVal * 0.15);
        } else if (totalItems > 3 && idx === 3) {
          monthly = Math.round(monthlyVal * 0.10);
        } else {
          monthly = Math.round(monthlyVal * (1 / totalItems));
        }
        return { ...d, monthlyAmount: monthly, annualAmount: monthly * 12 };
      });
      assignForm.setValue('details', updatedDetails);
    }
  };

  // Filtered lists
  const filteredEmployeesWithAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter((a: any) => {
      const emp = a.employee;
      const empName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
      const empCode = emp?.employeeCode?.toLowerCase() || '';
      return empName.includes(employeeSearch.toLowerCase()) || empCode.includes(employeeSearch.toLowerCase());
    });
  }, [assignments, employeeSearch]);

  const activeAssignmentsCount = assignments.filter((a: any) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payroll <span className="text-border">/</span> Salary Structure
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Salary Structure
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage salary components, compensation structure templates, employee salaries, and revision history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleOpenAddComponent}
            variant="outline"
            className="text-xs font-bold gap-1.5 h-9 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          >
            <Plus className="h-4 w-4" /> Add Component
          </Button>
          <Button
            onClick={handleOpenCreateTemplate}
            variant="outline"
            className="text-xs font-bold gap-1.5 h-9 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50"
          >
            <Layers className="h-4 w-4" /> Create Structure
          </Button>
          <Button
            onClick={() => setAssignDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm font-semibold text-xs gap-1.5 h-9 cursor-pointer"
          >
            <IndianRupee className="h-4 w-4" /> Assign / Revise Salary
          </Button>
        </div>
      </div>

      {/* ── TOP SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Salary Components</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{components.length}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Master Components Configured</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Structure Templates</p>
              <p className="text-2xl font-bold text-purple-600 mt-0.5">{templates.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Grade CTC Templates</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Employees Assigned</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeAssignmentsCount}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Active Payroll Structures</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Salary Revisions</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{revisions.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Audit Log History</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/60">
          <TabsTrigger value="components" className="rounded-lg text-xs font-bold px-4 h-9 gap-2">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Salary Components ({components.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg text-xs font-bold px-4 h-9 gap-2">
            <Layers className="h-3.5 w-3.5" /> Structure Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg text-xs font-bold px-4 h-9 gap-2">
            <Users className="h-3.5 w-3.5" /> Employee Salaries ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="revisions" className="rounded-lg text-xs font-bold px-4 h-9 gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Salary Revisions ({revisions.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: SALARY COMPONENTS ── */}
        <TabsContent value="components" className="space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Salary Components Master</CardTitle>
                <CardDescription className="text-xs">
                  Master list of earnings, deductions, statutory rules, and tax treatments.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search component code or name..."
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                <Select value={componentTypeFilter} onValueChange={setComponentTypeFilter}>
                  <SelectTrigger className="w-36 text-xs h-9">
                    <SelectValue placeholder="Filter Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="EARNING">Earnings</SelectItem>
                    <SelectItem value="DEDUCTION">Deductions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground pl-6">Code</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Component Name</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Type</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Category</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Calculation Rule</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Taxable</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                    <TableHead className="text-right text-xs font-bold text-foreground pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingComponents ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                        Loading salary components from database...
                      </TableCell>
                    </TableRow>
                  ) : components.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                        No salary components configured yet. Click "+ Add Component" to configure master earnings and deductions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    components.map((comp: any) => (
                      <TableRow key={comp.id} className="hover:bg-accent/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 pl-6">
                          {comp.code}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground">
                          {comp.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              comp.type === 'EARNING'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[11px]'
                            }
                          >
                            {comp.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {comp.category || 'General'}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {comp.calculationType === 'PERCENTAGE'
                            ? `${comp.calculationValue}% of ${comp.calculationBase || 'Basic'}`
                            : 'Fixed Amount'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={comp.isTaxable ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]' : 'text-[10px]'}>
                            {comp.isTaxable ? 'Taxable' : 'Tax Exempt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={comp.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]' : 'bg-slate-500/10 text-slate-600 text-[10px]'}>
                            {comp.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => handleOpenEditComponent(comp)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                              onClick={() => deleteComponentMutation.mutate(comp.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: STRUCTURE TEMPLATES ── */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Salary Structure Templates</CardTitle>
                <CardDescription className="text-xs">
                  Corporate grade CTC breakdown templates available for assigning to employees.
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenCreateTemplate}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 h-9"
              >
                <Plus className="h-4 w-4" /> Create Template
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {loadingTemplates ? (
                <p className="text-xs text-muted-foreground text-center py-8">Loading salary templates from database...</p>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/80 rounded-2xl p-6">
                  <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                  <h4 className="text-sm font-bold text-foreground">No Salary Structure Templates Found</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Create reusable corporate salary structure templates (e.g. Software Engineer CTC, Manager Grade CTC) with pre-configured earning and deduction rules.
                  </p>
                  <Button onClick={handleOpenCreateTemplate} size="sm" className="mt-4 bg-purple-600 text-white text-xs font-bold">
                    + Create First Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((tmpl: any) => (
                    <Card key={tmpl.id} className="border border-border/80 bg-card hover:shadow-md transition-all">
                      <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 font-mono text-[10px] font-bold">
                              {tmpl.code}
                            </Badge>
                            <CardTitle className="text-sm font-bold text-foreground">{tmpl.name}</CardTitle>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{tmpl.description || 'Corporate CTC Structure Template'}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          {tmpl.payFrequency || 'MONTHLY'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs">
                        <div className="space-y-1.5">
                          <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Components in Template:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {tmpl.items?.map((item: any) => (
                              <Badge key={item.id} variant="secondary" className="text-[10px] font-semibold">
                                {item.salaryComponent?.name || 'Component'}: ₹{item.monthlyAmount?.toLocaleString('en-IN') || 0}/mo
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: EMPLOYEE SALARIES ── */}
        <TabsContent value="assignments" className="space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Employee Salary Assignments</CardTitle>
                <CardDescription className="text-xs">
                  Active salary structures and CTC breakdowns assigned to database employees.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employee name or code..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                <Button
                  onClick={() => setAssignDialogOpen(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 h-9"
                >
                  <Plus className="h-4 w-4" /> Assign Structure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground pl-6">Employee ID</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Employee Name</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Department / Role</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Monthly CTC</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Annual CTC</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Effective From</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                    <TableHead className="text-right text-xs font-bold text-foreground pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAssignments ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                        Loading employee salary assignments...
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployeesWithAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                        No active employee salary structures assigned yet. Click "+ Assign Structure" to assign CTC to an employee.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployeesWithAssignments.map((asgn: any) => (
                      <TableRow key={asgn.id} className="hover:bg-accent/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-purple-600 pl-6">
                          {asgn.employee?.employeeCode || 'EMP-001'}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground">
                          {asgn.employee ? `${asgn.employee.firstName} ${asgn.employee.lastName}` : 'Employee'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {asgn.employee?.department?.name || 'General'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-600">
                          ₹{asgn.monthlyCtc?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          ₹{asgn.annualCtc?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(asgn.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={asgn.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]' : 'bg-slate-500/10 text-slate-600 text-[10px]'}>
                            {asgn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              assignForm.reset({
                                employeeId: asgn.employeeId,
                                templateId: asgn.templateId || '',
                                annualCtc: asgn.annualCtc * 1.1,
                                monthlyCtc: Math.round((asgn.annualCtc * 1.1) / 12),
                                effectiveFrom: new Date().toISOString().slice(0, 10),
                                revisionReason: 'Annual Compensation Increment & Appraisal',
                                details: asgn.details?.map((d: any) => ({
                                  salaryComponentId: d.salaryComponentId,
                                  name: d.salaryComponent?.name || 'Component',
                                  type: d.salaryComponent?.type || 'EARNING',
                                  monthlyAmount: Math.round(d.monthlyAmount * 1.1),
                                  annualAmount: Math.round(d.monthlyAmount * 1.1 * 12),
                                })),
                              });
                              setAssignDialogOpen(true);
                            }}
                          >
                            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Revise Salary
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: SALARY REVISIONS ── */}
        <TabsContent value="revisions" className="space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Salary Revision & Version History</CardTitle>
                <CardDescription className="text-xs">
                  Complete historical audit log of salary revisions and CTC increases.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground pl-6">Employee</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Previous CTC</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">New CTC</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Increase %</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Effective Date</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Reason for Revision</TableHead>
                    <TableHead className="text-right text-xs font-bold text-foreground pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRevisions ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                        Loading salary revision history...
                      </TableCell>
                    </TableRow>
                  ) : revisions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                        No salary revisions recorded in history. When an employee's salary is revised, previous historical versions are preserved here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revisions.map((rev: any) => (
                      <TableRow key={rev.id} className="hover:bg-accent/40 transition-colors">
                        <TableCell className="font-bold text-xs text-foreground pl-6">
                          {rev.employee ? `${rev.employee.firstName} ${rev.employee.lastName}` : 'Employee'} ({rev.employee?.employeeCode})
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                          ₹{rev.previousCtc?.toLocaleString('en-IN') || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-600">
                          ₹{rev.newCtc?.toLocaleString('en-IN') || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] font-bold">
                            +{rev.increasePercentage || 0}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(rev.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {rev.revisionReason || 'Appraisal Revision'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge variant="outline" className={rev.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 text-[10px]' : 'bg-slate-500/10 text-slate-600 text-[10px]'}>
                            {rev.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── MODAL 1: ADD / EDIT SALARY COMPONENT ── */}
      <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-indigo-950/20 via-background to-purple-950/20">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              {editingComponent ? 'Edit Salary Component' : 'Add Corporate Salary Component'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Define component code, calculation rules, statutory PF/ESI/PT applicability, and tax treatment.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={componentForm.handleSubmit((values) => createComponentMutation.mutate(values))}
            className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto"
          >
            {/* Basic Information */}
            <div className="space-y-3">
              <h4 className="font-bold text-foreground border-b border-border/60 pb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-600" /> Basic Information
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Component Code *</Label>
                  <Input
                    {...componentForm.register('code')}
                    placeholder="e.g. BASIC, HRA, BONUS"
                    className="font-mono uppercase text-xs"
                  />
                  {componentForm.formState.errors.code && (
                    <p className="text-[10px] text-rose-500 font-medium">{componentForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Component Name *</Label>
                  <Input {...componentForm.register('name')} placeholder="e.g. Basic Salary" className="text-xs" />
                  {componentForm.formState.errors.name && (
                    <p className="text-[10px] text-rose-500 font-medium">{componentForm.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Component Type *</Label>
                  <Select
                    value={componentForm.watch('type')}
                    onValueChange={(v) => componentForm.setValue('type', v as any)}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EARNING">Earning</SelectItem>
                      <SelectItem value="DEDUCTION">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Input {...componentForm.register('category')} placeholder="e.g. Basic, Allowance, Tax" className="text-xs" />
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-foreground border-b border-border/60 pb-1 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-purple-600" /> Calculation Rules
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Calculation Type</Label>
                  <Select
                    value={componentForm.watch('calculationType')}
                    onValueChange={(v) => componentForm.setValue('calculationType', v)}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {componentForm.watch('calculationType') === 'PERCENTAGE' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Percentage Value (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...componentForm.register('calculationValue')}
                      placeholder="e.g. 50"
                      className="text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payroll & Tax Treatment */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-foreground border-b border-border/60 pb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Payroll & Tax Treatment
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 border border-border/60 p-2 rounded-lg cursor-pointer hover:bg-accent/40">
                  <Checkbox
                    checked={componentForm.watch('isTaxable')}
                    onCheckedChange={(c) => componentForm.setValue('isTaxable', Boolean(c))}
                  />
                  <span className="font-semibold">Taxable Component</span>
                </label>

                <label className="flex items-center gap-2 border border-border/60 p-2 rounded-lg cursor-pointer hover:bg-accent/40">
                  <Checkbox
                    checked={componentForm.watch('includeInGross')}
                    onCheckedChange={(c) => componentForm.setValue('includeInGross', Boolean(c))}
                  />
                  <span className="font-semibold">Include in Gross Salary</span>
                </label>

                <label className="flex items-center gap-2 border border-border/60 p-2 rounded-lg cursor-pointer hover:bg-accent/40">
                  <Checkbox
                    checked={componentForm.watch('isPfApplicable')}
                    onCheckedChange={(c) => componentForm.setValue('isPfApplicable', Boolean(c))}
                  />
                  <span className="font-semibold">PF Applicable</span>
                </label>

                <label className="flex items-center gap-2 border border-border/60 p-2 rounded-lg cursor-pointer hover:bg-accent/40">
                  <Checkbox
                    checked={componentForm.watch('showOnPayslip')}
                    onCheckedChange={(c) => componentForm.setValue('showOnPayslip', Boolean(c))}
                  />
                  <span className="font-semibold">Show on Payslip</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setComponentDialogOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createComponentMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
              >
                {createComponentMutation.isPending ? 'Saving...' : editingComponent ? 'Update Component' : 'Create Component'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: CREATE / EDIT SALARY STRUCTURE TEMPLATE ── */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-xl border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-purple-950/20 via-background to-indigo-950/20">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Create Salary Structure Template
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Configure reusable CTC grade structure with earning & deduction components.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={templateForm.handleSubmit((values) => saveTemplateMutation.mutate(values))}
            className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Template Code *</Label>
                <Input {...templateForm.register('code')} placeholder="e.g. DEV-SENIOR-CTC" className="font-mono uppercase text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Template Name *</Label>
                <Input {...templateForm.register('name')} placeholder="e.g. Senior Software Engineer Grade" className="text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea {...templateForm.register('description')} placeholder="Description of compensation grade..." className="text-xs h-16" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-1">
                <h4 className="font-bold text-foreground">Components & Monthly Amounts</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTemplateItem({ salaryComponentId: components[0]?.id || '', monthlyAmount: 5000, annualAmount: 60000 })}
                  className="text-[11px] h-7 text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Component Line
                </Button>
              </div>

              <div className="space-y-2">
                {templateFields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border border-border/60">
                    <div className="col-span-6">
                      <Select
                        value={templateForm.watch(`items.${idx}.salaryComponentId`)}
                        onValueChange={(v) => templateForm.setValue(`items.${idx}.salaryComponentId`, v)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select component" />
                        </SelectTrigger>
                        <SelectContent>
                          {components.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.code} - {c.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-5">
                      <Input
                        type="number"
                        placeholder="Monthly Amount (₹)"
                        {...templateForm.register(`items.${idx}.monthlyAmount`, { valueAsNumber: true })}
                        className="text-xs h-8 font-mono"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => removeTemplateItem(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={saveTemplateMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9">
                {saveTemplateMutation.isPending ? 'Saving...' : 'Save Structure Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: ASSIGN / REVISE EMPLOYEE SALARY STRUCTURE ── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-xl border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-emerald-950/20 via-background to-indigo-950/20">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              Assign & Revise Employee Salary Structure
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Assign or revise salary structure for database employees. Creates new historical revision version automatically.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={assignForm.handleSubmit((values) => saveAssignmentMutation.mutate(values))}
            className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto"
          >
            {/* Employee Selector */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Employee *</Label>
              <Select value={assignForm.watch('employeeId')} onValueChange={(v) => assignForm.setValue('employeeId', v)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Choose employee from database..." />
                </SelectTrigger>
                <SelectContent>
                  {realEmployees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode || 'EMP'}) — {e.department?.name || 'HR'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CTC Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Annual CTC (₹) *</Label>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    {((assignForm.watch('annualCtc') || 0) / 100000).toFixed(2)} LPA
                  </span>
                </div>
                <Input
                  type="number"
                  value={assignForm.watch('annualCtc') === 0 ? '' : (assignForm.watch('annualCtc') ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const num = raw === '' ? 0 : Number(raw);
                    handleAnnualCtcChange(num);
                  }}
                  placeholder="e.g. 600000"
                  className="text-xs font-mono font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Monthly CTC (₹)</Label>
                  <span className="text-[10px] font-bold text-slate-500">
                    ₹{((assignForm.watch('monthlyCtc') || 0)).toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <Input
                  type="number"
                  value={assignForm.watch('monthlyCtc') === 0 ? '' : (assignForm.watch('monthlyCtc') ?? '')}
                  readOnly
                  placeholder="e.g. 50000"
                  className="text-xs font-mono bg-muted/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Structure Template</Label>
                <Select
                  value={assignForm.watch('templateId')}
                  onValueChange={(v) => {
                    assignForm.setValue('templateId', v);
                    handleSelectTemplateForAssignment(v);
                  }}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select structure template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Effective From Date *</Label>
                <Input type="date" {...assignForm.register('effectiveFrom')} className="text-xs h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reason for Revision / Assignment</Label>
              <Input {...assignForm.register('revisionReason')} placeholder="e.g. Annual Appraisal & Increment" className="text-xs" />
            </div>

            {/* Component Amounts Breakdown */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-foreground border-b border-border/60 pb-1">Salary Components Breakdown</h4>

              {assignForm.watch('details')?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Select a Structure Template above to populate components.</p>
              ) : (
                <div className="space-y-2">
                  {assignForm.watch('details')?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/20 p-2.5 rounded-lg border border-border/60 text-xs">
                      <span className="font-bold text-foreground">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-600 font-bold">₹{item.monthlyAmount?.toLocaleString('en-IN')}/mo</span>
                        <span className="font-mono text-slate-500 font-semibold">₹{item.annualAmount?.toLocaleString('en-IN')}/yr</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={saveAssignmentMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9">
                {saveAssignmentMutation.isPending ? 'Saving to Database...' : 'Save & Activate Salary Structure'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
