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
  Eye,
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
  Sparkles,
  Award,
} from 'lucide-react';
import { salaryComponentsApi, salaryTemplatesApi, salaryAssignmentsApi } from '@/api/payroll';
import { payGradesApi } from '@/api/cost-grades';
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

export const generateTemplateCode = (name: string) => {
  if (!name || !name.trim()) return '';
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const keywords = words.filter(
    (w) => !['GRADE', 'STRUCTURE', 'COMPENSATION', 'SALARY', 'TEMPLATE', 'PLAN', 'BAND', 'LEVEL'].includes(w),
  );

  const core = keywords.length > 0 ? keywords.join('-') : words.join('-');
  return core.endsWith('-CTC') || core === 'CTC' ? core : `${core}-CTC`;
};

export function SalaryStructureTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('components');

  // Dialog Controls
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any | null>(null);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<any | null>(null);
  const [templateDetailsDialogOpen, setTemplateDetailsDialogOpen] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<any | null>(null);
  const [assignmentDetailsDialogOpen, setAssignmentDetailsDialogOpen] = useState(false);

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

  const { data: dbPayGrades = [] } = useQuery({
    queryKey: ['pay-grades', companyId],
    queryFn: () => payGradesApi.list(companyId),
    enabled: !!companyId,
  });

  const DEFAULT_JOB_GRADES = [
    { id: 'grade-g1', gradeCode: 'G1', gradeName: 'Executive Grade', level: 'L1', category: 'Executive', minSalary: 1500000, maxSalary: 3000000 },
    { id: 'grade-l6', gradeCode: 'L6', gradeName: 'Associate', level: 'L1', category: 'Professional', minSalary: 200000, maxSalary: 300000 },
    { id: 'grade-i1', gradeCode: 'i1', gradeName: 'i1', level: 'L1', category: 'Professional', minSalary: 360000, maxSalary: 720000 },
    { id: 'grade-g2', gradeCode: 'G2', gradeName: 'Managerial Grade', level: 'L2', category: 'Management', minSalary: 800000, maxSalary: 1800000 },
    { id: 'grade-e2', gradeCode: 'e2', gradeName: 'exct e2', level: 'L2', category: 'Professional', minSalary: 300000, maxSalary: 600000 },
    { id: 'grade-g3', gradeCode: 'G3', gradeName: 'Senior Professional', level: 'L3', category: 'Professional', minSalary: 500000, maxSalary: 1200000 },
    { id: 'grade-g4', gradeCode: 'G4', gradeName: 'Professional', level: 'L4', category: 'Professional', minSalary: 300000, maxSalary: 700000 },
    { id: 'grade-g5', gradeCode: 'G5', gradeName: 'Junior Professional', level: 'L5', category: 'Professional', minSalary: 200000, maxSalary: 400000 },
  ];

  const allGrades = dbPayGrades.length > 0 ? dbPayGrades : DEFAULT_JOB_GRADES;

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
      gradeId: 'grade-g3',
      gradeCode: 'G3',
      gradeName: 'Senior Professional',
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

  // Template Delete
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => salaryTemplatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-templates'] });
      toast.success('Salary structure template deleted successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Cannot delete salary template'),
  });

  // Assignment Save / Revise / Edit
  const saveAssignmentMutation = useMutation({
    mutationFn: (values: any) => {
      const cleanDetails = values.details?.map((d: any) => ({
        salaryComponentId: d.salaryComponentId,
        monthlyAmount: Number(d.monthlyAmount) || 0,
        annualAmount: Number(d.annualAmount) || (Number(d.monthlyAmount) || 0) * 12,
        calculationType: d.calculationType || 'FIXED',
        calculationValue: Number(d.calculationValue) || 0,
      }));
      const payload = {
        ...values,
        companyId,
        annualCtc: Number(values.annualCtc),
        monthlyCtc: Number(values.monthlyCtc),
        details: cleanDetails,
      };

      if (editingAssignment) {
        return salaryAssignmentsApi.update(editingAssignment.id, payload);
      }
      return salaryAssignmentsApi.assign(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['salary-revisions'] });
      toast.success(editingAssignment ? 'Salary assignment updated successfully!' : 'Employee salary structure assigned and saved to database!');
      setAssignDialogOpen(false);
      setEditingAssignment(null);
      assignForm.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save salary assignment'),
  });

  // Assignment Delete
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) => salaryAssignmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['salary-revisions'] });
      toast.success('Salary assignment deleted successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Cannot delete salary assignment'),
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
      gradeId: 'grade-g3',
      gradeCode: 'G3',
      gradeName: 'Senior Professional',
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

  const handleViewTemplate = (tmpl: any) => {
    setViewingTemplate(tmpl);
    setTemplateDetailsDialogOpen(true);
  };

  const handleEditTemplate = (tmpl: any) => {
    setEditingTemplate(tmpl);
    templateForm.reset({
      name: tmpl.name,
      code: tmpl.code,
      gradeId: tmpl.gradeId || 'grade-g3',
      gradeCode: tmpl.gradeCode || 'G3',
      gradeName: tmpl.gradeName || 'Senior Professional',
      description: tmpl.description || '',
      currency: tmpl.currency || 'INR',
      payFrequency: tmpl.payFrequency || 'MONTHLY',
      items:
        tmpl.items && tmpl.items.length > 0
          ? tmpl.items.map((i: any) => ({
              salaryComponentId: i.salaryComponentId,
              monthlyAmount: i.monthlyAmount || 0,
              annualAmount: i.annualAmount || (i.monthlyAmount || 0) * 12,
            }))
          : components.slice(0, 4).map((c) => ({
              salaryComponentId: c.id,
              monthlyAmount: c.code === 'BASIC' ? 25000 : c.code === 'HRA' ? 12500 : 5000,
              annualAmount: (c.code === 'BASIC' ? 25000 : c.code === 'HRA' ? 12500 : 5000) * 12,
            })),
    });
    setTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (tmpl: any) => {
    if (window.confirm(`Are you sure you want to delete template "${tmpl.name}" (${tmpl.code})?`)) {
      deleteTemplateMutation.mutate(tmpl.id);
    }
  };

  const handleSelectTemplateForAssignment = (templateId: string) => {
    const selectedTmpl = templates.find((t: any) => t.id === templateId);
    if (!selectedTmpl) return;

    if (selectedTmpl.items && selectedTmpl.items.length > 0) {
      // Calculate total earnings from template items as the template's monthly CTC
      const templateMonthlyCtc = selectedTmpl.items.reduce((sum: number, it: any) => {
        const comp = components.find((c: any) => c.id === it.salaryComponentId);
        const compType = it.salaryComponent?.type || comp?.type || 'EARNING';
        return compType === 'EARNING' ? sum + (Number(it.monthlyAmount) || 0) : sum;
      }, 0);

      const templateTotalMonthly = selectedTmpl.items.reduce((sum: number, it: any) => sum + (Number(it.monthlyAmount) || 0), 0);
      const monthlyToUse = templateMonthlyCtc > 0 ? templateMonthlyCtc : (templateTotalMonthly > 0 ? templateTotalMonthly : Math.round((assignForm.getValues('annualCtc') || 600000) / 12));
      const annualToUse = monthlyToUse * 12;

      assignForm.setValue('monthlyCtc', monthlyToUse);
      assignForm.setValue('annualCtc', annualToUse);

      const details = selectedTmpl.items.map((item: any, idx: number) => {
        const comp = components.find((c: any) => c.id === item.salaryComponentId);
        const compName = item.salaryComponent?.name || comp?.name || `Component ${idx + 1}`;
        const compType = item.salaryComponent?.type || comp?.type || 'EARNING';
        
        // Exact monthly amount configured in the structure template!
        const monthly = Number(item.monthlyAmount) || 0;

        return {
          salaryComponentId: item.salaryComponentId,
          name: compName,
          type: compType,
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

  const handleViewAssignment = (asgn: any) => {
    setViewingAssignment(asgn);
    setAssignmentDetailsDialogOpen(true);
  };

  const handleEditAssignment = (asgn: any) => {
    setEditingAssignment(asgn);
    assignForm.reset({
      employeeId: asgn.employeeId,
      templateId: asgn.templateId || '',
      annualCtc: asgn.annualCtc,
      monthlyCtc: asgn.monthlyCtc || Math.round(asgn.annualCtc / 12),
      effectiveFrom: asgn.effectiveFrom ? new Date(asgn.effectiveFrom).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      revisionReason: asgn.revisionReason || 'Salary Structure Adjustment',
      details: asgn.details?.map((d: any) => ({
        salaryComponentId: d.salaryComponentId,
        name: d.salaryComponent?.name || 'Component',
        type: d.salaryComponent?.type || 'EARNING',
        monthlyAmount: d.monthlyAmount,
        annualAmount: d.annualAmount || d.monthlyAmount * 12,
      })) || [],
    });
    setAssignDialogOpen(true);
  };

  const handleDeleteAssignment = (asgn: any) => {
    const empName = asgn.employee ? `${asgn.employee.firstName} ${asgn.employee.lastName}` : asgn.employeeId;
    if (window.confirm(`Are you sure you want to delete the salary structure assignment for ${empName} (₹${asgn.annualCtc?.toLocaleString('en-IN')} Annual CTC)?`)) {
      deleteAssignmentMutation.mutate(asgn.id);
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
                            : comp.calculationValue ? `₹${Number(comp.calculationValue).toLocaleString('en-IN')}` : 'Fixed Amount'}
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
                      <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 font-mono text-[10px] font-bold">
                              {tmpl.code}
                            </Badge>
                            <CardTitle className="text-sm font-bold text-foreground">{tmpl.name}</CardTitle>
                            <Badge variant="outline" className="bg-violet-500/10 text-violet-700 border-violet-300 font-bold text-[10px]">
                              Grade {tmpl.gradeCode || 'G3'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{tmpl.description || 'Corporate CTC Structure Template'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                            {tmpl.payFrequency || 'MONTHLY'}
                          </Badge>
                          <div className="flex items-center gap-0.5 border border-border/60 rounded-lg p-0.5 bg-background shadow-xs">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewTemplate(tmpl)}
                              className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                              title="View Template Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTemplate(tmpl)}
                              className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                              title="Edit Template"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTemplate(tmpl)}
                              disabled={deleteTemplateMutation.isPending}
                              className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete Template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Components in Template ({tmpl.items?.length || 0}):</p>
                            <span className="font-mono text-[11px] font-bold text-emerald-600">
                              Total: ₹{(tmpl.items?.reduce((sum: number, it: any) => sum + (Number(it.monthlyAmount) || 0), 0) || 0).toLocaleString('en-IN')}/mo
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tmpl.items?.map((item: any) => (
                              <Badge key={item.id} variant="secondary" className="text-[10px] font-semibold bg-muted/60">
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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewAssignment(asgn)}
                              className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                              title="View Salary Assignment Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAssignment(asgn)}
                              className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                              title="Edit Salary Assignment"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 cursor-pointer"
                              onClick={() => {
                                setEditingAssignment(null);
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
                              title="Revise with Increment"
                            >
                              <TrendingUp className="h-3 w-3 mr-1" /> Revise
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAssignment(asgn)}
                              disabled={deleteAssignmentMutation.isPending}
                              className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete Salary Assignment"
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
                <Brain className="h-3.5 w-3.5 text-purple-600" /> Calculation Rules &amp; Base
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Calculation Type *</Label>
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
                      <SelectItem value="FORMULA">Custom Formula</SelectItem>
                      <SelectItem value="SLAB">Statutory Tax Slab</SelectItem>
                      <SelectItem value="PER_DAY">Per Day Rate (LOP)</SelectItem>
                      <SelectItem value="FIXED_SCHEDULE">Fixed Schedule (Loan/Advance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Calculation Base *</Label>
                  <Select
                    value={componentForm.watch('calculationBase') || 'BASIC'}
                    onValueChange={(v) => componentForm.setValue('calculationBase', v)}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic Salary</SelectItem>
                      <SelectItem value="GROSS">Gross Salary</SelectItem>
                      <SelectItem value="PF_WAGE">PF Wage</SelectItem>
                      <SelectItem value="ESI_WAGE">ESI Wage</SelectItem>
                      <SelectItem value="ATTENDANCE">Attendance Days (LOP)</SelectItem>
                      <SelectItem value="SCHEDULE">Active Loan/Advance Schedule</SelectItem>
                      <SelectItem value="NONE">Manual / None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {componentForm.watch('calculationType') === 'PERCENTAGE' ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Percentage Value (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...componentForm.register('calculationValue')}
                      placeholder="e.g. 3.75"
                      className="text-xs font-mono"
                    />
                  </div>
                ) : componentForm.watch('calculationType') === 'FIXED' ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Fixed Amount (₹) *</Label>
                    <Input
                      type="number"
                      step="1"
                      {...componentForm.register('calculationValue')}
                      placeholder="e.g. 3000"
                      className="text-xs font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold">Formula / Calculation Rule</Label>
                    <Input
                      {...componentForm.register('description')}
                      placeholder="e.g. Salary / Payroll Days * LOP Days or Statutory Tax Slab"
                      className="text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Circular Dependency Warning */}
              {componentForm.watch('code') &&
                componentForm.watch('calculationBase') === componentForm.watch('code') && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Invalid circular salary component dependency. Component cannot calculate based on itself.
                  </div>
                )}

              {/* Live Calculation Preview Box */}
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600" /> Live Calculation Preview
                </div>
                {componentForm.watch('calculationType') === 'PERCENTAGE' ? (
                  <div className="text-xs space-y-1 font-mono text-muted-foreground">
                    <div>Base (Basic Salary) = ₹40,000</div>
                    <div>Formula = ₹40,000 × {componentForm.watch('calculationValue') || 0}%</div>
                    <div className="font-bold text-foreground">
                      Calculated {componentForm.watch('name') || 'Component'} = ₹
                      {(
                        (40000 * Number(componentForm.watch('calculationValue') || 0)) /
                        100
                      ).toLocaleString('en-IN')}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs space-y-1 font-mono text-muted-foreground">
                    <div>
                      Fixed {componentForm.watch('name') || 'Component'} = ₹
                      {Number(componentForm.watch('calculationValue') || 0).toLocaleString('en-IN')}
                    </div>
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
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Template Code *</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const name = templateForm.getValues('name');
                      const autoCode = generateTemplateCode(name);
                      if (autoCode) templateForm.setValue('code', autoCode);
                    }}
                    className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 cursor-pointer bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800"
                    title="Auto-generate code from template name"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <Input
                  {...templateForm.register('code')}
                  placeholder="e.g. QA-LEAD-CTC"
                  className="font-mono uppercase text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Template Name *</Label>
                <Input
                  {...templateForm.register('name')}
                  onChange={(e) => {
                    const newName = e.target.value;
                    templateForm.setValue('name', newName);
                    // Automatically generate code like QA-LEAD-CTC as the user types
                    const currentCode = templateForm.getValues('code');
                    if (!currentCode || currentCode.endsWith('-CTC') || currentCode.includes('DEV-SENIOR')) {
                      templateForm.setValue('code', generateTemplateCode(newName));
                    }
                  }}
                  placeholder="e.g. QA Lead Compensation Structure"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Grade Selector Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-violet-600" /> Grade *
                </Label>
                {(() => {
                  const selG = allGrades.find(
                    (g: any) =>
                      g.id === templateForm.watch('gradeId') ||
                      g.gradeCode === templateForm.watch('gradeCode'),
                  );
                  return selG ? (
                    <Badge
                      variant="outline"
                      className="text-[10.5px] font-mono font-bold text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/40"
                    >
                      CTC Range: ₹{(selG.minSalary / 100000).toFixed(0)}L – ₹{(selG.maxSalary / 100000).toFixed(0)}L
                    </Badge>
                  ) : null;
                })()}
              </div>
              <Select
                value={templateForm.watch('gradeId') || templateForm.watch('gradeCode') || 'grade-g3'}
                onValueChange={(val) => {
                  templateForm.setValue('gradeId', val);
                  const g = allGrades.find((gr: any) => gr.id === val || gr.gradeCode === val);
                  if (g) {
                    templateForm.setValue('gradeCode', g.gradeCode);
                    templateForm.setValue('gradeName', g.gradeName);
                  }
                }}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select Job Grade (e.g. G3 - Senior Professional)..." />
                </SelectTrigger>
                <SelectContent>
                  {allGrades.map((g: any) => (
                    <SelectItem key={g.id || g.gradeCode} value={g.id || g.gradeCode} className="text-xs">
                      <span className="font-bold font-mono text-purple-600 mr-1.5">{g.gradeCode}</span> – {g.gradeName} ({g.level || 'L3'}) • ₹{((g.minSalary || 500000)/100000).toFixed(0)}L – ₹{((g.maxSalary || 1200000)/100000).toFixed(0)}L CTC
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* ── MODAL 2B: VIEW SALARY STRUCTURE TEMPLATE DETAILS ── */}
      <Dialog open={templateDetailsDialogOpen} onOpenChange={setTemplateDetailsDialogOpen}>
        <DialogContent className="max-w-2xl border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-indigo-950/20 via-background to-purple-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 font-mono text-[10px] font-bold">
                      {viewingTemplate?.code}
                    </Badge>
                    <DialogTitle className="text-base font-bold text-foreground">
                      {viewingTemplate?.name}
                    </DialogTitle>
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-700 border-violet-300 font-bold text-[10px]">
                      Grade {viewingTemplate?.gradeCode || 'G3'}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {viewingTemplate?.description || 'Corporate CTC compensation breakdown template'}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                {viewingTemplate?.payFrequency || 'MONTHLY'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Template Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Grade</span>
                <div className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                  {viewingTemplate?.gradeCode || 'G3'} – {viewingTemplate?.gradeName || 'Senior Professional'}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Components</span>
                <div className="text-lg font-extrabold text-foreground font-mono">
                  {viewingTemplate?.items?.length || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly CTC</span>
                <div className="text-lg font-extrabold text-emerald-600 font-mono">
                  ₹{(viewingTemplate?.items?.reduce((sum: number, it: any) => sum + (Number(it.monthlyAmount) || 0), 0) || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Annual CTC</span>
                <div className="text-lg font-extrabold text-indigo-600 font-mono">
                  ₹{((viewingTemplate?.items?.reduce((sum: number, it: any) => sum + (Number(it.monthlyAmount) || 0), 0) || 0) * 12).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Components Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Components Breakdown</h4>
              <div className="border border-border/60 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40 text-[10.5px]">
                    <TableRow>
                      <TableHead className="py-2.5 px-3">Component</TableHead>
                      <TableHead className="py-2.5 px-3">Type</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Monthly (₹)</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Annual (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {viewingTemplate?.items?.map((item: any, idx: number) => {
                      const comp = components.find((c: any) => c.id === item.salaryComponentId);
                      const compName = item.salaryComponent?.name || comp?.name || 'Salary Component';
                      const compCode = item.salaryComponent?.code || comp?.code || '';
                      const compType = item.salaryComponent?.type || comp?.type || 'EARNING';
                      return (
                        <TableRow key={idx} className="hover:bg-muted/20">
                          <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                            {compName} {compCode && <span className="text-muted-foreground font-mono text-[10px]">({compCode})</span>}
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            <Badge variant="outline" className={compType === 'EARNING' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]' : 'bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]'}>
                              {compType}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            ₹{Number(item.monthlyAmount || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            ₹{(Number(item.monthlyAmount || 0) * 12).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTemplateDetailsDialogOpen(false);
                handleEditTemplate(viewingTemplate);
              }}
              className="text-xs h-9 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTemplateDetailsDialogOpen(false)}
              className="text-xs h-9"
            >
              Close
            </Button>
          </DialogFooter>
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

            {/* Employee Job Grade Card */}
            {(() => {
              const selectedEmp = realEmployees.find((e: any) => e.id === assignForm.watch('employeeId'));
              if (!selectedEmp) return null;
              const empGrade =
                allGrades.find(
                  (g: any) =>
                    g.id === (selectedEmp as any)?.payGradeId ||
                    g.gradeCode === (selectedEmp as any)?.grade ||
                    g.gradeCode === 'G3',
                ) || allGrades[0];

              return (
                <div className="p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 border border-violet-500/20">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>Job Grade:</span>
                        <span className="text-purple-600 font-extrabold">{empGrade.gradeCode} – {empGrade.gradeName}</span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700">
                          {empGrade.level || 'L3'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        CTC Scale Range: <span className="font-mono font-bold text-foreground">₹{(empGrade.minSalary / 100000).toFixed(0)}L – ₹{(empGrade.maxSalary / 100000).toFixed(0)}L</span> ({empGrade.category || 'Professional'})
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white font-mono text-[10.5px] font-extrabold">
                    {empGrade.gradeCode}
                  </Badge>
                </div>
              );
            })()}

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

            {/* Grade CTC Range Validation Alert */}
            {(() => {
              const selectedEmp = realEmployees.find((e: any) => e.id === assignForm.watch('employeeId'));
              if (!selectedEmp) return null;
              const empGrade =
                allGrades.find(
                  (g: any) =>
                    g.id === (selectedEmp as any)?.payGradeId ||
                    g.gradeCode === (selectedEmp as any)?.grade ||
                    g.gradeCode === 'G3',
                ) || allGrades[0];

              const annualCtc = Number(assignForm.watch('annualCtc')) || 0;
              const minSalary = empGrade.minSalary || 500000;
              const maxSalary = empGrade.maxSalary || 1200000;
              const isWithinRange = annualCtc >= minSalary && annualCtc <= maxSalary;
              const isAboveRange = annualCtc > maxSalary;
              const isBelowRange = annualCtc > 0 && annualCtc < minSalary;

              if (isAboveRange) {
                return (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="text-amber-800 dark:text-amber-300">
                        <span className="font-bold">⚠ Salary exceeds {empGrade.gradeCode} CTC range</span>
                        <div className="text-[11px] text-muted-foreground">
                          Assigned ₹{(annualCtc / 100000).toFixed(2)}L vs Grade Band ₹{(minSalary / 100000).toFixed(0)}L – ₹{(maxSalary / 100000).toFixed(0)}L
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer">
                        Request Approval
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnnualCtcChange(maxSalary)}
                        className="h-6 text-[10px] px-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        Cap at Max
                      </Button>
                    </div>
                  </div>
                );
              }

              if (isWithinRange && annualCtc > 0) {
                return (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ Annual CTC is Within {empGrade.gradeCode} Grade Range (₹{(minSalary / 100000).toFixed(0)}L – ₹{(maxSalary / 100000).toFixed(0)}L)</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">✓ Within Range</Badge>
                  </div>
                );
              }

              if (isBelowRange) {
                return (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Annual CTC is below {empGrade.gradeCode} minimum standard (₹{(minSalary / 100000).toFixed(0)}L)</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">Below Min</Badge>
                  </div>
                );
              }

              return null;
            })()}

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
                        {t.name} ({t.code}) {t.gradeCode ? `— Grade ${t.gradeCode}` : ''}
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
              <Button type="button" variant="outline" onClick={() => {
                setAssignDialogOpen(false);
                setEditingAssignment(null);
              }} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={saveAssignmentMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9">
                {saveAssignmentMutation.isPending ? 'Saving to Database...' : editingAssignment ? 'Update Salary Assignment' : 'Save & Activate Salary Structure'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 4: VIEW EMPLOYEE SALARY ASSIGNMENT DETAILS ── */}
      <Dialog open={assignmentDetailsDialogOpen} onOpenChange={setAssignmentDetailsDialogOpen}>
        <DialogContent className="max-w-2xl border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-emerald-950/20 via-background to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base font-bold text-foreground">
                      {viewingAssignment?.employee ? `${viewingAssignment.employee.firstName} ${viewingAssignment.employee.lastName}` : 'Employee'}
                    </DialogTitle>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 font-mono text-[10px] font-bold">
                      {viewingAssignment?.employee?.employeeCode || 'EMP'}
                    </Badge>
                    <Badge variant="outline" className={viewingAssignment?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold' : 'bg-slate-500/10 text-slate-600 text-[10px] font-bold'}>
                      {viewingAssignment?.status || 'ACTIVE'}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {viewingAssignment?.employee?.department?.name || 'Department'} • Effective from {viewingAssignment?.effectiveFrom ? new Date(viewingAssignment.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </DialogDescription>
                </div>
              </div>
              {viewingAssignment?.template && (
                <Badge variant="outline" className="bg-violet-500/10 text-violet-700 border-violet-300 text-[10px] font-bold">
                  {viewingAssignment.template.name || viewingAssignment.template.code}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Compensation Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Annual CTC</span>
                <div className="text-lg font-extrabold text-primary font-mono">
                  ₹{Number(viewingAssignment?.annualCtc || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-semibold text-purple-600">
                  {((Number(viewingAssignment?.annualCtc || 0)) / 100000).toFixed(2)} LPA
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly CTC</span>
                <div className="text-lg font-extrabold text-emerald-600 font-mono">
                  ₹{Number(viewingAssignment?.monthlyCtc || Math.round((viewingAssignment?.annualCtc || 0) / 12)).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-muted-foreground">Standard monthly payout</span>
              </div>
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revision Reason</span>
                <div className="text-xs font-bold text-foreground line-clamp-1 mt-1">
                  {viewingAssignment?.revisionReason || 'Initial Compensation Structure Assignment'}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {viewingAssignment?.previousCtc ? `Prev: ₹${Number(viewingAssignment.previousCtc).toLocaleString('en-IN')}` : 'Base Structure'}
                </span>
              </div>
            </div>

            {/* Component Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Salary Components Breakdown ({viewingAssignment?.details?.length || 0})
                </h4>
              </div>
              <div className="border border-border/60 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40 text-[10.5px]">
                    <TableRow>
                      <TableHead className="py-2.5 px-3">Component</TableHead>
                      <TableHead className="py-2.5 px-3">Type</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Monthly (₹)</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Annual (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {viewingAssignment?.details?.map((item: any, idx: number) => {
                      const compName = item.salaryComponent?.name || item.name || 'Component';
                      const compCode = item.salaryComponent?.code || '';
                      const compType = item.salaryComponent?.type || item.type || 'EARNING';
                      return (
                        <TableRow key={idx} className="hover:bg-muted/20">
                          <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                            {compName} {compCode && <span className="text-muted-foreground font-mono text-[10px]">({compCode})</span>}
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            <Badge variant="outline" className={compType === 'EARNING' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]' : 'bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]'}>
                              {compType}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            ₹{Number(item.monthlyAmount || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            ₹{(Number(item.annualAmount) || Number(item.monthlyAmount || 0) * 12).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAssignmentDetailsDialogOpen(false);
                handleEditAssignment(viewingAssignment);
              }}
              className="text-xs h-9 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit / Revise Salary
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignmentDetailsDialogOpen(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
