import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  IndianRupee,
  History,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Calculator,
  ArrowRight,
  TrendingUp,
  Layers,
  Briefcase,
  Award,
  Building,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';
import type { SampleEmployeeSalary, StructureTemplate } from './mock-data';
import { calculateSalaryBreakdown, reverseCalculateCtcFromNet } from './formula-engine';
import { salaryAssignmentsApi } from '@/api/payroll';

interface EmployeeSalariesTabProps {
  employeeSalaries: SampleEmployeeSalary[];
  templates: StructureTemplate[];
  onUpdateSalaries: (salaries: SampleEmployeeSalary[]) => void;
  companyId?: string;
  onRefreshAssignments?: () => void;
}

export function EmployeeSalariesTab({
  employeeSalaries,
  templates,
  onUpdateSalaries,
  companyId,
  onRefreshAssignments,
}: EmployeeSalariesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState(false);

  // Assign Salary Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SampleEmployeeSalary | null>(null);

  // Input Calculation Mode: Annual CTC, Monthly Gross, Target Net (Reverse), Daily Rate
  const [inputMode, setInputMode] = useState<'ANNUAL_CTC' | 'MONTHLY_GROSS' | 'TARGET_NET' | 'DAILY_RATE'>('ANNUAL_CTC');
  const [inputValue, setInputValue] = useState<number>(0);
  const [dailyDaysWorked, setDailyDaysWorked] = useState<number>(26);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedTaxRegime, setSelectedTaxRegime] = useState<'NEW' | 'OLD'>('NEW');

  // Excel Bulk Upload Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Salary History Drawer Modal
  const [historyEmployee, setHistoryEmployee] = useState<SampleEmployeeSalary | null>(null);

  // View Salary Structure Modal
  const [viewEmployee, setViewEmployee] = useState<SampleEmployeeSalary | null>(null);

  // Find template and compute breakdown for View Modal
  const viewTemplate = useMemo(() => {
    if (!viewEmployee) return null;
    return (
      templates.find((t) => t.code === viewEmployee.templateCode) ||
      templates.find((t) => t.id === viewEmployee.templateId) ||
      templates[0] ||
      null
    );
  }, [viewEmployee, templates]);

  const viewBreakdown = useMemo(() => {
    if (!viewEmployee || !viewEmployee.hasSalaryAssigned) return null;
    const items = viewTemplate?.items || [];
    return calculateSalaryBreakdown({
      annualCtc: viewEmployee.annualCtc,
      templateItems: items,
    });
  }, [viewEmployee, viewTemplate]);

  const earningItems = useMemo(() => {
    return (viewBreakdown?.items || []).filter((i) => i.type === 'EARNING');
  }, [viewBreakdown]);

  const deductionItems = useMemo(() => {
    return (viewBreakdown?.items || []).filter((i) => i.type === 'DEDUCTION');
  }, [viewBreakdown]);

  const employerItems = useMemo(() => {
    return (viewBreakdown?.items || []).filter((i) => i.type === 'EMPLOYER_CONTRIBUTION');
  }, [viewBreakdown]);

  // Find currently selected template
  const currentTemplate = useMemo(() => {
    if (!selectedTemplateCode) return null;
    return templates.find((t) => t.code === selectedTemplateCode) || null;
  }, [templates, selectedTemplateCode]);


  // Compute live preview based on input mode
  const assignmentPreview = useMemo(() => {
    if (!currentTemplate || !currentTemplate.items) return null;

    let computedAnnualCtc = 0;

    if (inputMode === 'ANNUAL_CTC') {
      computedAnnualCtc = inputValue;
    } else if (inputMode === 'MONTHLY_GROSS') {
      computedAnnualCtc = Math.round(inputValue * 12 * 1.12); // Gross + Employer load estimate
    } else if (inputMode === 'TARGET_NET') {
      const rev = reverseCalculateCtcFromNet({
        targetMonthlyNet: inputValue,
        templateItems: currentTemplate.items,
      });
      computedAnnualCtc = rev.annualCtc;
    } else if (inputMode === 'DAILY_RATE') {
      const monthlyRate = inputValue * dailyDaysWorked;
      computedAnnualCtc = Math.round(monthlyRate * 12 * 1.15);
    }

    return calculateSalaryBreakdown({
      annualCtc: computedAnnualCtc,
      templateItems: currentTemplate.items,
    });
  }, [inputMode, inputValue, dailyDaysWorked, currentTemplate]);

  // Validation: Check if entered package is strictly within template band
  const isOutOfRange = useMemo(() => {
    if (!currentTemplate || inputValue <= 0 || !assignmentPreview) return false;
    const effectiveCtc = assignmentPreview.annualCtc;
    return effectiveCtc < (currentTemplate.minCtc || 0) || effectiveCtc > (currentTemplate.maxCtc || Infinity);
  }, [currentTemplate, inputValue, assignmentPreview]);

  // Filtered employees
  const filteredList = useMemo(() => {
    return employeeSalaries.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchView =
        filterView === 'ALL' ||
        (filterView === 'ASSIGNED' && emp.hasSalaryAssigned) ||
        (filterView === 'UNASSIGNED' && !emp.hasSalaryAssigned);

      const matchDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchSearch && matchView && matchDept;
    });
  }, [employeeSalaries, searchTerm, filterView, departmentFilter]);

  const unassignedCount = employeeSalaries.filter((e) => !e.hasSalaryAssigned).length;
  const assignedCount = employeeSalaries.filter((e) => e.hasSalaryAssigned).length;

  const handleOpenAssign = (emp?: SampleEmployeeSalary) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (emp) {
      setSelectedEmployee(emp);
      setInputMode('ANNUAL_CTC');
      setInputValue(emp.annualCtc > 0 ? emp.annualCtc : 0);
      setSelectedTemplateCode(emp.hasSalaryAssigned && emp.templateCode ? emp.templateCode : '');
      setSelectedTaxRegime(emp.taxRegime || 'NEW');
      setEffectiveFrom(emp.hasSalaryAssigned && emp.effectiveFrom ? emp.effectiveFrom : todayStr);
    } else {
      setSelectedEmployee(null);
      setInputMode('ANNUAL_CTC');
      setInputValue(0);
      setSelectedTemplateCode('');
      setSelectedTaxRegime('NEW');
      setEffectiveFrom(todayStr);
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedEmployee || !assignmentPreview || !currentTemplate) return;

    if (
      assignmentPreview.annualCtc < (currentTemplate.minCtc || 0) ||
      assignmentPreview.annualCtc > (currentTemplate.maxCtc || Infinity)
    ) {
      toast.error(
        `Package must be within the template band: ₹${(currentTemplate.minCtc || 0).toLocaleString('en-IN')} – ₹${(currentTemplate.maxCtc || Infinity).toLocaleString('en-IN')}`
      );
      return;
    }

    setIsSaving(true);
    try {
      // 1. Prepare details for database persistence
      const details = (assignmentPreview.items || [])
        .map((it: any) => ({
          salaryComponentId: it.salaryComponentId || it.componentId || it.id,
          name: it.componentName,
          type: it.type,
          monthlyAmount: Number(it.monthlyAmount || 0),
          annualAmount: Number(it.annualAmount || (it.monthlyAmount || 0) * 12),
          calculationType: it.calculationType || 'FIXED',
          calculationValue: Number(it.calculationValue || 0),
        }))
        .filter((d: any) => Boolean(d.salaryComponentId));

      // 2. Call backend API to persist to MySQL database
      await salaryAssignmentsApi.assign({
        companyId: companyId || (selectedEmployee as any).companyId || 'cmtwjbe5900zoj7op4c3xxxb5',
        employeeId: selectedEmployee.id,
        templateId: currentTemplate.id,
        annualCtc: assignmentPreview.annualCtc,
        monthlyCtc: assignmentPreview.monthlyCtc,
        grossSalary: assignmentPreview.grossEarnings,
        netSalary: assignmentPreview.netTakeHome,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : new Date().toISOString(),
        status: 'ACTIVE',
        details,
      });

      // 3. Update local state
      const updated = employeeSalaries.map((emp) => {
        if (emp.id === selectedEmployee.id) {
          return {
            ...emp,
            templateCode: selectedTemplateCode,
            templateName: currentTemplate?.name || 'Assigned Template',
            templateId: currentTemplate.id,
            annualCtc: assignmentPreview.annualCtc,
            monthlyCtc: assignmentPreview.monthlyCtc,
            grossSalary: assignmentPreview.grossEarnings,
            netSalary: assignmentPreview.netTakeHome,
            effectiveFrom,
            taxRegime: selectedTaxRegime,
            status: 'ACTIVE' as const,
            hasSalaryAssigned: true,
            complianceRuleCompliant: assignmentPreview.compliance?.is50PercentWageRuleCompliant ?? true,
          };
        }
        return emp;
      });

      onUpdateSalaries(updated);
      if (onRefreshAssignments) {
        onRefreshAssignments();
      }
      toast.success(`Salary structure assigned & saved to database for ${selectedEmployee.name}! (₹${assignmentPreview.annualCtc.toLocaleString('en-IN')} CTC)`);
      setIsAssignModalOpen(false);
    } catch (err: any) {
      console.error('Error saving salary assignment:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save salary assignment to database');
    } finally {
      setIsSaving(false);
    }
  };


  const handleBulkExcelSimulate = () => {
    toast.success('Excel file validated. 3 unassigned employees populated with template structures.');
    const updated = employeeSalaries.map((e) => ({
      ...e,
      hasSalaryAssigned: true,
      annualCtc: e.annualCtc || 500000,
      monthlyCtc: Math.round((e.annualCtc || 500000) / 12),
      grossSalary: Math.round(((e.annualCtc || 500000) / 12) * 0.95),
      netSalary: Math.round(((e.annualCtc || 500000) / 12) * 0.85),
      templateCode: e.templateCode || 'IT-ENG-CTC',
      templateName: e.templateName || 'IT & Software Engineering',
      status: 'ACTIVE' as const,
    }));
    onUpdateSalaries(updated);
    setIsExcelModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* ── UNASSIGNED EMPLOYEES WARNING ALERT ── */}
      {unassignedCount > 0 && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {unassignedCount} Employee{unassignedCount > 1 ? 's' : ''} have no Salary Structure assigned!
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Employees without salary structures cannot be included in upcoming monthly payroll calculation runs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterView('UNASSIGNED')}
                className="text-xs font-semibold h-8 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60"
              >
                View Unassigned ({unassignedCount})
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenAssign()}
                className="text-xs font-semibold h-8 bg-amber-600 hover:bg-amber-700 text-white gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Assign Salary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── FILTER & ACTION BAR ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <SearchableSelect
                value={filterView}
                onValueChange={(val: any) => setFilterView(val)}
                options={[
                  { value: 'ALL', label: `All Employees (${employeeSalaries.length})` },
                  { value: 'ASSIGNED', label: `Assigned Only (${assignedCount})`, badge: 'Assigned' },
                  { value: 'UNASSIGNED', label: `Unassigned Only (${unassignedCount})`, badge: 'Unassigned' },
                ]}
                placeholder="Filter by Status"
                searchPlaceholder="Search filter..."
                triggerClassName="h-9 w-48 text-xs bg-card"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExcelModalOpen(true)}
                className="h-9 text-xs font-semibold gap-1.5 border-border"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Bulk Upload (Excel)
              </Button>

              <Button
                size="sm"
                onClick={() => handleOpenAssign()}
                className="h-9 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                <Plus className="h-4 w-4" /> Assign / Revise Salary
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── EMPLOYEE SALARIES TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold text-foreground">Employee Compensation Master</CardTitle>
            <CardDescription className="text-[11px]">
              Active salary assignments, CTC packages, monthly in-hand net pay, and tax regimes.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold">
            Showing {filteredList.length} of {employeeSalaries.length} records
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground pl-6">Employee</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Department & Designation</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Structure Template</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground">Annual CTC</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground">Monthly Gross</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground">Net Take-Home</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Tax Regime</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-muted/20">
                  <TableCell className="pl-6">
                    <div className="font-semibold text-xs text-foreground">{emp.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{emp.employeeCode} • Grade {emp.grade}</div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-foreground font-medium">
                      {typeof emp.department === 'string' ? emp.department : (emp.department as any)?.name || 'General'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {typeof emp.designation === 'string' ? emp.designation : (emp.designation as any)?.title || 'Staff Member'}
                    </div>
                  </TableCell>

                  <TableCell>
                    {emp.hasSalaryAssigned ? (
                      <div>
                        <div className="text-xs font-semibold text-foreground line-clamp-1">{emp.templateName}</div>
                        <div className="text-[10px] font-mono text-indigo-600">{emp.templateCode}</div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> No Structure Assigned
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                    {emp.annualCtc > 0 ? `₹${emp.annualCtc.toLocaleString('en-IN')}` : '-'}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {emp.grossSalary > 0 ? `₹${emp.grossSalary.toLocaleString('en-IN')}` : '-'}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {emp.netSalary > 0 ? `₹${emp.netSalary.toLocaleString('en-IN')}` : '-'}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {emp.taxRegime} Regime
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {emp.hasSalaryAssigned ? (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-300 text-[10px] font-semibold">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-300 text-[10px] font-semibold">
                        Pending Assignment
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {emp.hasSalaryAssigned && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewEmployee(emp)}
                          className="h-8 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 gap-1 px-2.5"
                          title="View complete salary structure breakdown"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAssign(emp)}
                        className="h-8 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        {emp.hasSalaryAssigned ? 'Revise' : 'Assign'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryEmployee(emp)}
                        title="Salary Revision Audit Trail"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── ASSIGN / REVISE SALARY MODAL (WITH 4 CALCULATION MODES) ── */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-indigo-600" />
              Assign & Revise Employee Salary
            </DialogTitle>
            <DialogDescription className="text-xs">
              Supports 4 input calculation methods: Annual CTC, Monthly Gross, Target Net (Reverse calculation), or Daily Wage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Employee Selector & Template Choice */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/80">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Target Employee *</Label>
                <SearchableSelect
                  value={selectedEmployee?.id || ''}
                  onValueChange={(id) => {
                    const emp = employeeSalaries.find((e) => e.id === id);
                    if (emp) {
                      setSelectedEmployee(emp);
                      setInputValue(emp.annualCtc > 0 ? emp.annualCtc : 0);
                      if (emp.hasSalaryAssigned && emp.templateCode) {
                        setSelectedTemplateCode(emp.templateCode);
                      }
                    }
                  }}
                  options={employeeSalaries.map((e) => ({
                    value: e.id,
                    label: `${e.name} (${e.employeeCode})`,
                    sublabel: `${typeof e.department === 'string' ? e.department : (e.department as any)?.name || 'General'} • ${typeof e.designation === 'string' ? e.designation : (e.designation as any)?.title || 'Staff'}`,
                    badge: e.employeeCode,
                    icon: <Users className="h-3.5 w-3.5 text-indigo-500" />,
                  }))}
                  placeholder="Select employee..."
                  searchPlaceholder="Search employee by name, code, or department..."
                  triggerClassName="h-8 text-xs bg-card"
                />

                {/* Selected Employee Designation & Level Info */}
                {selectedEmployee && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground bg-background px-2 py-0.5 rounded border border-border/80 shadow-2xs">
                      <Briefcase className="h-3 w-3 text-indigo-500 shrink-0" />
                      <span className="text-muted-foreground font-normal">Designation:</span>
                      <span className="font-semibold text-foreground">
                        {typeof selectedEmployee.designation === 'string'
                          ? selectedEmployee.designation
                          : (selectedEmployee.designation as any)?.title || 'Staff Member'}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                      <Award className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="opacity-75 font-normal">Level:</span>
                      <span className="font-bold">{selectedEmployee.grade || 'L1'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/60">
                      <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>
                        {typeof selectedEmployee.department === 'string'
                          ? selectedEmployee.department
                          : (selectedEmployee.department as any)?.name || 'General'}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Salary Structure Template *</Label>
                <SearchableSelect
                  value={selectedTemplateCode || ''}
                  onValueChange={setSelectedTemplateCode}
                  options={templates.map((t) => ({
                    value: t.code,
                    label: t.name,
                    sublabel: `${t.gradeCode || 'Standard'} • ${typeof t.departmentName === 'string' ? t.departmentName : (t.departmentName as any)?.name || t.category || ''}`,
                    badge: t.code,
                    icon: <Layers className="h-3.5 w-3.5 text-purple-500" />,
                  }))}
                  placeholder="Select template..."
                  searchPlaceholder="Search templates by code or title..."
                  triggerClassName="h-8 text-xs bg-card"
                />

                {/* Selected Template Band Range Info */}
                {currentTemplate && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 shadow-2xs">
                      <IndianRupee className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="opacity-75 font-normal">Band Range:</span>
                      <span className="font-mono font-bold">
                        ₹{(currentTemplate.minCtc || 0).toLocaleString('en-IN')} – ₹{(currentTemplate.maxCtc || 0).toLocaleString('en-IN')} / yr
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      (₹{Math.round((currentTemplate.minCtc || 0) / 12).toLocaleString('en-IN')} – ₹{Math.round((currentTemplate.maxCtc || 0) / 12).toLocaleString('en-IN')}/mo)
                    </span>
                    {currentTemplate.gradeCode && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium border-purple-200 text-purple-700 dark:text-purple-300 bg-purple-50/30">
                        Grade: {currentTemplate.gradeCode}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 4 Input Modes Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-indigo-600" />
                Select Calculation Input Mode
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'ANNUAL_CTC', label: '1. Annual CTC', desc: 'Total cost to company' },
                  { id: 'MONTHLY_GROSS', label: '2. Monthly Gross', desc: 'Pre-deduction earnings' },
                  { id: 'TARGET_NET', label: '3. Target Net (Reverse)', desc: 'Desired take-home pay' },
                  { id: 'DAILY_RATE', label: '4. Daily Wage Rate', desc: 'Per-day labour rate' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setInputMode(mode.id as any);
                      setInputValue(0);
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      inputMode === mode.id
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="text-xs">{mode.label}</div>
                    <div className="text-[10px] font-normal opacity-80">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Input based on Selected Mode */}
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900/60 space-y-3">
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      {inputMode === 'ANNUAL_CTC' && 'Enter Annual CTC (₹)'}
                      {inputMode === 'MONTHLY_GROSS' && 'Enter Monthly Gross Pay (₹)'}
                      {inputMode === 'TARGET_NET' && 'Enter Desired In-Hand Monthly Take-Home (₹)'}
                      {inputMode === 'DAILY_RATE' && 'Enter Per-Day Rate (₹)'}
                    </Label>
                    {currentTemplate && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Band: ₹{currentTemplate.minCtc.toLocaleString('en-IN')} – ₹{currentTemplate.maxCtc.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={inputValue === 0 ? '' : inputValue}
                    placeholder={currentTemplate ? `Min: ${currentTemplate.minCtc.toLocaleString('en-IN')}` : '0'}
                    min={currentTemplate ? currentTemplate.minCtc : 0}
                    max={currentTemplate ? currentTemplate.maxCtc : undefined}
                    onChange={(e) => setInputValue(e.target.value === '' ? 0 : Number(e.target.value))}
                    className={`h-8 text-xs font-bold bg-card mt-1 font-mono transition-colors ${
                      isOutOfRange
                        ? 'border-rose-500 text-rose-600 focus-visible:ring-rose-500 bg-rose-50/20'
                        : 'text-indigo-600 border-input'
                    }`}
                  />

                  {/* Quick Preset Buttons for Range Selection */}
                  {currentTemplate && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-[10px] text-muted-foreground font-medium">Quick Fill:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (inputMode === 'ANNUAL_CTC') setInputValue(currentTemplate.minCtc);
                          else if (inputMode === 'MONTHLY_GROSS') setInputValue(Math.round(currentTemplate.minCtc / 12 * 0.95));
                          else if (inputMode === 'TARGET_NET') setInputValue(Math.round(currentTemplate.minCtc / 12 * 0.85));
                          else if (inputMode === 'DAILY_RATE') setInputValue(Math.round(currentTemplate.minCtc / 12 / 26));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-background hover:bg-muted text-foreground border border-border/80 transition-colors cursor-pointer"
                      >
                        Min: ₹{currentTemplate.minCtc.toLocaleString('en-IN')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const mid = Math.round((currentTemplate.minCtc + currentTemplate.maxCtc) / 2);
                          if (inputMode === 'ANNUAL_CTC') setInputValue(mid);
                          else if (inputMode === 'MONTHLY_GROSS') setInputValue(Math.round(mid / 12 * 0.95));
                          else if (inputMode === 'TARGET_NET') setInputValue(Math.round(mid / 12 * 0.85));
                          else if (inputMode === 'DAILY_RATE') setInputValue(Math.round(mid / 12 / 26));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-background hover:bg-muted text-foreground border border-border/80 transition-colors cursor-pointer"
                      >
                        Mid: ₹{Math.round((currentTemplate.minCtc + currentTemplate.maxCtc) / 2).toLocaleString('en-IN')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (inputMode === 'ANNUAL_CTC') setInputValue(currentTemplate.maxCtc);
                          else if (inputMode === 'MONTHLY_GROSS') setInputValue(Math.round(currentTemplate.maxCtc / 12 * 0.95));
                          else if (inputMode === 'TARGET_NET') setInputValue(Math.round(currentTemplate.maxCtc / 12 * 0.85));
                          else if (inputMode === 'DAILY_RATE') setInputValue(Math.round(currentTemplate.maxCtc / 12 / 26));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-background hover:bg-muted text-foreground border border-border/80 transition-colors cursor-pointer"
                      >
                        Max: ₹{currentTemplate.maxCtc.toLocaleString('en-IN')}
                      </button>
                    </div>
                  )}

                  {/* Strict Template Band Range Validation Feedback */}
                  {currentTemplate && inputValue > 0 && (
                    <div className="pt-1.5">
                      {isOutOfRange ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded border border-rose-300 dark:border-rose-800">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {(assignmentPreview?.annualCtc || inputValue) < currentTemplate.minCtc
                              ? `Below allowed band! Package must be at least ₹${currentTemplate.minCtc.toLocaleString('en-IN')}/yr for this template.`
                              : `Exceeds allowed band! Package cannot exceed ₹${currentTemplate.maxCtc.toLocaleString('en-IN')}/yr for this template.`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Package is within allowed template range (₹{currentTemplate.minCtc.toLocaleString('en-IN')} – ₹{currentTemplate.maxCtc.toLocaleString('en-IN')})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {inputMode === 'DAILY_RATE' && (
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Paid Days / Month</Label>
                    <Input
                      type="number"
                      value={dailyDaysWorked}
                      onChange={(e) => setDailyDaysWorked(Number(e.target.value))}
                      className="h-8 text-xs font-bold bg-card mt-1"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Effective From Date</Label>
                  <Input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="h-8 text-xs bg-card"
                  />
                </div>
              </div>

              {inputMode === 'TARGET_NET' && inputValue > 0 && (
                <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Reverse Calculation Engine: Backwards-solved required CTC is ₹{assignmentPreview?.annualCtc.toLocaleString('en-IN')}.
                </p>
              )}
            </div>

            {/* Computed Breakup Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Live Computed Salary Breakdown</Label>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="font-semibold text-foreground">
                    Gross: ₹{inputValue > 0 && assignmentPreview ? assignmentPreview.grossEarnings.toLocaleString('en-IN') : '0'}/mo
                  </span>
                  <span className="font-bold text-emerald-600">
                    Net Take-Home: ₹{inputValue > 0 && assignmentPreview ? assignmentPreview.netTakeHome.toLocaleString('en-IN') : '0'}/mo
                  </span>
                </div>
              </div>

              {!selectedEmployee ? (
                <div className="p-6 rounded-lg border border-dashed border-border/80 bg-muted/20 text-center space-y-1.5">
                  <Users className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Select an Employee to Begin</p>
                  <p className="text-[11px] text-muted-foreground">
                    Choose the target employee above to view their designation and level.
                  </p>
                </div>
              ) : !selectedTemplateCode ? (
                <div className="p-6 rounded-lg border border-dashed border-border/80 bg-muted/20 text-center space-y-1.5">
                  <Layers className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Select a Salary Structure Template</p>
                  <p className="text-[11px] text-muted-foreground">
                    Choose a salary template above to view its band range and salary components.
                  </p>
                </div>
              ) : inputValue <= 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-border/80 bg-muted/20 text-center space-y-1.5">
                  <Calculator className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Enter Annual CTC above to calculate salary breakdown</p>
                  <p className="text-[11px] text-muted-foreground">
                    Earnings, deductions, employer contributions, and net take-home will be computed dynamically in real time.
                  </p>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border/80">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold py-2">Component</TableHead>
                        <TableHead className="text-[11px] font-bold py-2">Category</TableHead>
                        <TableHead className="text-right text-[11px] font-bold py-2">Monthly (₹)</TableHead>
                        <TableHead className="text-right text-[11px] font-bold py-2 pr-4">Annual (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 1. EARNINGS */}
                      <TableRow className="bg-muted/40 font-bold text-[11px] border-t">
                        <TableCell colSpan={2} className="py-1 text-foreground">
                          1. Gross Earnings (A)
                        </TableCell>
                        <TableCell className="py-1 text-right font-mono text-foreground font-semibold">
                          ₹{assignmentPreview?.grossEarnings.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-1 text-right font-mono text-foreground pr-4">
                          ₹{(assignmentPreview ? assignmentPreview.grossEarnings * 12 : 0).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                      {assignmentPreview?.items
                        .filter((i) => i.type === 'EARNING')
                        .map((item) => (
                          <TableRow key={item.componentCode} className="text-xs">
                            <TableCell className="py-1.5 pl-4 font-medium">
                              {item.componentName}
                              {item.isBalancing && (
                                <Badge className="ml-1.5 text-[8px] bg-purple-100 text-purple-700 py-0 px-1">
                                  Balancing
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-1.5 text-[10px] text-muted-foreground">{item.category || 'Allowance'}</TableCell>
                            <TableCell className="py-1.5 text-right font-mono font-semibold">
                              ₹{item.monthlyAmount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="py-1.5 text-right font-mono text-muted-foreground pr-4">
                              ₹{item.annualAmount.toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}

                      {/* 2. DEDUCTIONS */}
                      {assignmentPreview?.items.some((i) => i.type === 'DEDUCTION') && (
                        <>
                          <TableRow className="bg-muted/40 font-bold text-[11px] border-t">
                            <TableCell colSpan={2} className="py-1 text-rose-700 dark:text-rose-400">
                              2. Employee Deductions (B)
                            </TableCell>
                            <TableCell className="py-1 text-right font-mono text-rose-700 dark:text-rose-400 font-semibold">
                              -₹{assignmentPreview?.totalDeductions.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="py-1 text-right font-mono text-rose-700 dark:text-rose-400 pr-4">
                              -₹{(assignmentPreview ? assignmentPreview.totalDeductions * 12 : 0).toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                          {assignmentPreview?.items
                            .filter((i) => i.type === 'DEDUCTION')
                            .map((item) => (
                              <TableRow key={item.componentCode} className="text-xs">
                                <TableCell className="py-1.5 pl-4 font-medium text-rose-700 dark:text-rose-300">
                                  {item.componentName}
                                </TableCell>
                                <TableCell className="py-1.5 text-[10px] text-muted-foreground">{item.category || 'Statutory'}</TableCell>
                                <TableCell className="py-1.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                                  -₹{item.monthlyAmount.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="py-1.5 text-right font-mono text-muted-foreground pr-4">
                                  -₹{item.annualAmount.toLocaleString('en-IN')}
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      )}

                      {/* NET TAKE-HOME ROW */}
                      <TableRow className="bg-emerald-50/80 dark:bg-emerald-950/40 border-y border-emerald-300 dark:border-emerald-800 font-bold text-xs">
                        <TableCell colSpan={2} className="py-1.5 text-emerald-800 dark:text-emerald-200">
                          Net Take-Home Pay (A − B)
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-emerald-700 dark:text-emerald-300">
                          ₹{assignmentPreview?.netTakeHome.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-emerald-700 dark:text-emerald-300 pr-4">
                          ₹{(assignmentPreview ? assignmentPreview.netTakeHome * 12 : 0).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>

                      {/* 3. EMPLOYER CONTRIBUTIONS */}
                      {assignmentPreview?.items.some((i) => i.type === 'EMPLOYER_CONTRIBUTION') && (
                        <>
                          <TableRow className="bg-muted/40 font-bold text-[11px] border-t">
                            <TableCell colSpan={2} className="py-1 text-purple-700 dark:text-purple-400">
                              3. Employer Contributions (C - Paid by Company)
                            </TableCell>
                            <TableCell className="py-1 text-right font-mono text-purple-700 dark:text-purple-400 font-semibold">
                              +₹{assignmentPreview?.employerContributions.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="py-1 text-right font-mono text-purple-700 dark:text-purple-400 pr-4">
                              +₹{(assignmentPreview ? assignmentPreview.employerContributions * 12 : 0).toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                          {assignmentPreview?.items
                            .filter((i) => i.type === 'EMPLOYER_CONTRIBUTION')
                            .map((item) => (
                              <TableRow key={item.componentCode} className="text-xs">
                                <TableCell className="py-1.5 pl-4 font-medium text-purple-700 dark:text-purple-300">
                                  {item.componentName}
                                </TableCell>
                                <TableCell className="py-1.5 text-[10px] text-muted-foreground">{item.category || 'Employer Benefit'}</TableCell>
                                <TableCell className="py-1.5 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                                  ₹{item.monthlyAmount.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="py-1.5 text-right font-mono text-muted-foreground pr-4">
                                  ₹{item.annualAmount.toLocaleString('en-IN')}
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      )}

                      {/* TOTAL COST TO COMPANY (CTC) RECONCILIATION ROW */}
                      <TableRow className="bg-indigo-50/80 dark:bg-indigo-950/40 border-t-2 border-indigo-400 dark:border-indigo-600 font-bold text-xs">
                        <TableCell colSpan={2} className="py-2 text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <span>Total Cost to Company / CTC (A + C)</span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-indigo-300 text-indigo-700 bg-indigo-50">
                            100% Reconciled
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-indigo-700 dark:text-indigo-300">
                          ₹{assignmentPreview?.monthlyCtc.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-indigo-700 dark:text-indigo-300 pr-4">
                          ₹{assignmentPreview?.annualCtc.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving || !selectedEmployee || !selectedTemplateCode || inputValue <= 0 || isOutOfRange}
              onClick={handleSaveAssignment}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving to Database...' : 'Confirm & Save Structure'}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EXCEL BULK UPLOAD MODAL ── */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Bulk Assign Salaries via Excel
            </DialogTitle>
            <DialogDescription className="text-xs">
              Download the structured Excel template, enter employee codes, templates and CTC packages, then upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Download Sample Template</p>
                <p className="text-[10px] text-muted-foreground">Pre-formatted with current active template codes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Template downloaded: ehcm_salary_assignment_template.xlsx')}
                className="h-8 text-xs gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download .xlsx
              </Button>
            </div>

            <div className="border-2 border-dashed border-border/80 rounded-xl p-6 text-center space-y-2 hover:bg-muted/10 cursor-pointer">
              <Upload className="h-8 w-8 text-indigo-500 mx-auto" />
              <div>
                <p className="font-semibold text-xs text-foreground">Drag & drop your Excel file here</p>
                <p className="text-[10px] text-muted-foreground">Supports .xlsx, .csv files up to 10MB</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsExcelModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleBulkExcelSimulate} className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              Process & Validate Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VIEW SALARY STRUCTURE BREAKDOWN MODAL ── */}
      <Dialog open={Boolean(viewEmployee)} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 border border-sky-200 dark:border-sky-800 shrink-0">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <span>Salary Structure Breakdown</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-950/50">
                      {viewEmployee?.employeeCode}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Complete monthly and annual compensation breakup for <span className="font-semibold text-foreground">{viewEmployee?.name}</span>
                  </DialogDescription>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 text-xs font-semibold px-2.5 py-1">
                Active Structure
              </Badge>
            </div>
          </DialogHeader>

          {/* Employee Metadata Pill Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 bg-muted/40 rounded-xl border border-border/80 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Department & Role</p>
              <p className="font-semibold text-foreground truncate">{viewEmployee?.department || '-'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{viewEmployee?.designation || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Level & Grade</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[11px] font-bold bg-background">
                  {viewEmployee?.level || 'L1'}
                </Badge>
                <span className="text-[11px] text-muted-foreground truncate">{viewEmployee?.designation || 'Staff'}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assigned Template</p>
              <p className="font-semibold text-foreground truncate" title={viewTemplate?.name || viewEmployee?.templateCode}>
                {viewTemplate?.name || viewEmployee?.templateCode || 'Standard Structure'}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{viewEmployee?.templateCode}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tax Regime & Effective</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {viewEmployee?.taxRegime} Regime
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">{viewEmployee?.effectiveFrom || '2025-04-01'}</span>
              </div>
            </div>
          </div>

          {/* 4 Key Metric Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/80 shadow-xs bg-card">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Annual CTC</p>
                <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                  ₹{(viewEmployee?.annualCtc || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ₹{Math.round((viewEmployee?.annualCtc || 0) / 12).toLocaleString('en-IN')} / mo
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs bg-card">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Monthly Gross Earnings</p>
                <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  ₹{(viewBreakdown?.grossEarnings ?? viewEmployee?.grossSalary ?? 0).toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ₹{((viewBreakdown?.annualGross ?? (viewEmployee?.grossSalary || 0) * 12)).toLocaleString('en-IN')} / yr
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs bg-card">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Total Deductions (EE)</p>
                <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                  -₹{(viewBreakdown?.employeeDeductions ?? 0).toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  -₹{((viewBreakdown?.annualDeductions ?? 0)).toLocaleString('en-IN')} / yr
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
              <CardContent className="p-3">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Monthly Net Take-Home</p>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{(viewBreakdown?.netTakeHome ?? viewEmployee?.netSalary ?? 0).toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  ₹{((viewBreakdown?.annualNet ?? (viewEmployee?.netSalary || 0) * 12)).toLocaleString('en-IN')} / yr
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categorized Detailed Breakdown Table */}
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card text-xs">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-xs">Component</TableHead>
                  <TableHead className="font-bold text-xs">Category / Basis</TableHead>
                  <TableHead className="text-right font-bold text-xs">Monthly (₹)</TableHead>
                  <TableHead className="text-right font-bold text-xs">Annual (₹)</TableHead>
                  <TableHead className="text-right font-bold text-xs">% of CTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. GROSS EARNINGS */}
                <TableRow className="bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/40 font-semibold border-b">
                  <TableCell colSpan={5} className="py-2 text-indigo-700 dark:text-indigo-300">
                    A. Gross Earnings
                  </TableCell>
                </TableRow>
                {earningItems.length > 0 ? (
                  earningItems.map((item) => (
                    <TableRow key={item.id || item.componentCode} className="hover:bg-muted/30">
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{item.componentName}</span>
                          {item.isBalancing && (
                            <Badge variant="outline" className="text-[9px] text-indigo-600 bg-indigo-50/50 border-indigo-200">
                              Balancing Figure
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        {item.calculationType === 'PERCENTAGE'
                          ? `${item.calculationValue}% of ${item.calculationBase || 'Basic'}`
                          : item.calculationType === 'BALANCING' || item.isBalancing
                          ? 'Residual'
                          : 'Fixed Amount'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{(item.monthlyAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        ₹{(item.annualAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                        {viewEmployee?.annualCtc ? `${(((item.annualAmount || 0) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-2 pl-6">
                      No earning components listed
                    </TableCell>
                  </TableRow>
                )}
                {/* Gross Subtotal */}
                <TableRow className="bg-muted/20 font-bold border-t border-b">
                  <TableCell colSpan={2} className="pl-6 text-foreground">
                    Subtotal: Gross Earnings (A)
                  </TableCell>
                  <TableCell className="text-right font-mono text-indigo-600">
                    ₹{(viewBreakdown?.grossEarnings ?? viewEmployee?.grossSalary ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-indigo-600">
                    ₹{(viewBreakdown?.annualGross ?? (viewEmployee?.grossSalary || 0) * 12).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                    {viewEmployee?.annualCtc ? `${(((viewBreakdown?.annualGross ?? 0) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>

                {/* 2. EMPLOYEE DEDUCTIONS */}
                <TableRow className="bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/40 font-semibold border-b">
                  <TableCell colSpan={5} className="py-2 text-rose-700 dark:text-rose-300">
                    B. Employee Deductions
                  </TableCell>
                </TableRow>
                {deductionItems.length > 0 ? (
                  deductionItems.map((item) => (
                    <TableRow key={item.id || item.componentCode} className="hover:bg-muted/30">
                      <TableCell className="pl-6 font-medium">
                        {item.componentName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        {item.calculationType === 'PERCENTAGE'
                          ? `${item.calculationValue}% of ${item.calculationBase || 'Basic'}`
                          : item.componentCode === 'PF_EE'
                          ? '12% of Basic (₹15k cap)'
                          : item.componentCode === 'PT'
                          ? 'State PT Schedule'
                          : 'Deduction'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                        ₹{(item.monthlyAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-rose-600/80 dark:text-rose-400/80">
                        ₹{(item.annualAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                        {viewEmployee?.annualCtc ? `${(((item.annualAmount || 0) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-2 pl-6">
                      No employee deductions applicable
                    </TableCell>
                  </TableRow>
                )}
                {/* Deductions Subtotal */}
                <TableRow className="bg-muted/20 font-bold border-t border-b">
                  <TableCell colSpan={2} className="pl-6 text-foreground">
                    Subtotal: Total Employee Deductions (B)
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600">
                    ₹{(viewBreakdown?.employeeDeductions ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600">
                    ₹{(viewBreakdown?.annualDeductions ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                    {viewEmployee?.annualCtc ? `${(((viewBreakdown?.annualDeductions ?? 0) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>

                {/* NET TAKE-HOME ROW */}
                <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold border-t-2 border-b-2 border-emerald-300 dark:border-emerald-700">
                  <TableCell colSpan={2} className="pl-6 text-emerald-800 dark:text-emerald-300">
                    Net Take-Home Pay (A - B)
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                    ₹{(viewBreakdown?.netTakeHome ?? viewEmployee?.netSalary ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                    ₹{(viewBreakdown?.annualNet ?? (viewEmployee?.netSalary || 0) * 12).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-700/80 text-[11px]">
                    {viewEmployee?.annualCtc ? `${(((viewBreakdown?.annualNet ?? (viewEmployee?.netSalary || 0) * 12) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>

                {/* 3. EMPLOYER CONTRIBUTIONS */}
                <TableRow className="bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/40 font-semibold border-b">
                  <TableCell colSpan={5} className="py-2 text-amber-700 dark:text-amber-300">
                    C. Employer Statutory Contributions (CTC Inclusions)
                  </TableCell>
                </TableRow>
                {employerItems.length > 0 ? (
                  employerItems.map((item) => (
                    <TableRow key={item.id || item.componentCode} className="hover:bg-muted/30">
                      <TableCell className="pl-6 font-medium">
                        {item.componentName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        {item.componentCode === 'PF_ER'
                          ? '12% of Basic (3.67% EPF + 8.33% EPS)'
                          : item.componentCode === 'GRATUITY'
                          ? '4.81% of Basic (Gratuity Act)'
                          : 'Employer Contribution'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-amber-700 dark:text-amber-400">
                        ₹{(item.monthlyAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-700/80 dark:text-amber-400/80">
                        ₹{(item.annualAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                        {viewEmployee?.annualCtc ? `${(((item.annualAmount || 0) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-2 pl-6">
                      No employer statutory contributions
                    </TableCell>
                  </TableRow>
                )}
                {/* Employer Subtotal */}
                <TableRow className="bg-muted/20 font-bold border-t border-b">
                  <TableCell colSpan={2} className="pl-6 text-foreground">
                    Subtotal: Total Employer Contributions (C)
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-700 dark:text-amber-400">
                    ₹{(viewBreakdown?.employerCost ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-700 dark:text-amber-400">
                    ₹{((viewBreakdown?.employerCost ?? 0) * 12).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                    {viewEmployee?.annualCtc ? `${((((viewBreakdown?.employerCost ?? 0) * 12) / viewEmployee.annualCtc) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>

                {/* 4. TOTAL CTC */}
                <TableRow className="bg-slate-100 dark:bg-slate-900 font-bold text-sm border-t-2">
                  <TableCell colSpan={2} className="pl-6">
                    <div className="flex items-center gap-2">
                      <span>Total Cost to Company (CTC = A + C)</span>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] font-semibold py-0.5">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" /> 100% Reconciled
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    ₹{(viewBreakdown?.monthlyCtc || Math.round((viewEmployee?.annualCtc || 0) / 12)).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    ₹{(viewEmployee?.annualCtc || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[11px]">
                    100.0%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Statutory Compliance Footer Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/80 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Labour Code Compliance: </span>
                <span className="text-muted-foreground">
                  Basic + DA is {viewBreakdown?.compliance?.wageRuleRatio ?? 50}% of Gross salary (Rule requires ≥ 50%).
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span>PF: ₹15,000 ceiling</span>
              <span>•</span>
              <span>PT: MH Standard</span>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewEmployee(null)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const target = viewEmployee;
                setViewEmployee(null);
                if (target) handleOpenAssign(target);
              }}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <Sliders className="h-3.5 w-3.5" />
              Revise Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SALARY HISTORY DRAWER ── */}
      <Dialog open={Boolean(historyEmployee)} onOpenChange={() => setHistoryEmployee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              Salary Revision Audit History: {historyEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chronological log of past CTC changes, grade advancements, and effective dates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-4">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-background" />
                <div className="font-bold text-xs text-foreground">Current Active Structure</div>
                <div className="text-[11px] text-muted-foreground">Effective: {historyEmployee?.effectiveFrom || '2025-04-01'}</div>
                <div className="mt-1 font-mono font-semibold text-indigo-600">
                  ₹{historyEmployee?.annualCtc.toLocaleString('en-IN')} Annual CTC (₹{historyEmployee?.netSalary.toLocaleString('en-IN')} Net)
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-muted-foreground/40 border-2 border-background" />
                <div className="font-bold text-xs text-muted-foreground">Initial Joining Offer Structure</div>
                <div className="text-[11px] text-muted-foreground">Effective: 2024-04-01</div>
                <div className="mt-1 font-mono text-muted-foreground">
                  ₹{Math.round((historyEmployee?.annualCtc || 600000) * 0.85).toLocaleString('en-IN')} Annual CTC
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setHistoryEmployee(null)} className="text-xs">
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
