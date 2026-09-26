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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { SampleEmployeeSalary, StructureTemplate } from './mock-data';
import { calculateSalaryBreakdown, reverseCalculateCtcFromNet } from './formula-engine';

interface EmployeeSalariesTabProps {
  employeeSalaries: SampleEmployeeSalary[];
  templates: StructureTemplate[];
  onUpdateSalaries: (salaries: SampleEmployeeSalary[]) => void;
}

export function EmployeeSalariesTab({ employeeSalaries, templates, onUpdateSalaries }: EmployeeSalariesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Assign Salary Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SampleEmployeeSalary | null>(null);

  // Input Calculation Mode: Annual CTC, Monthly Gross, Target Net (Reverse), Daily Rate
  const [inputMode, setInputMode] = useState<'ANNUAL_CTC' | 'MONTHLY_GROSS' | 'TARGET_NET' | 'DAILY_RATE'>('ANNUAL_CTC');
  const [inputValue, setInputValue] = useState<number>(600000);
  const [dailyDaysWorked, setDailyDaysWorked] = useState<number>(26);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(templates[0]?.code || 'IT-ENG-CTC');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedTaxRegime, setSelectedTaxRegime] = useState<'NEW' | 'OLD'>('NEW');

  // Excel Bulk Upload Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Salary History Drawer Modal
  const [historyEmployee, setHistoryEmployee] = useState<SampleEmployeeSalary | null>(null);

  // Find currently selected template
  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.code === selectedTemplateCode) || templates[0];
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
    if (emp) {
      setSelectedEmployee(emp);
      setInputMode('ANNUAL_CTC');
      setInputValue(emp.annualCtc > 0 ? emp.annualCtc : 600000);
      setSelectedTemplateCode(emp.templateCode || templates[0]?.code || 'IT-ENG-CTC');
      setSelectedTaxRegime(emp.taxRegime || 'NEW');
      setEffectiveFrom(emp.effectiveFrom || new Date().toISOString().slice(0, 10));
    } else {
      const firstUnassigned = employeeSalaries.find((e) => !e.hasSalaryAssigned) || employeeSalaries[0];
      setSelectedEmployee(firstUnassigned);
      setInputMode('ANNUAL_CTC');
      setInputValue(600000);
      setSelectedTemplateCode(templates[0]?.code || 'IT-ENG-CTC');
      setSelectedTaxRegime('NEW');
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!selectedEmployee || !assignmentPreview) return;

    const updated = employeeSalaries.map((emp) => {
      if (emp.id === selectedEmployee.id) {
        return {
          ...emp,
          templateCode: selectedTemplateCode,
          templateName: currentTemplate?.name || 'Assigned Template',
          annualCtc: assignmentPreview.annualCtc,
          monthlyCtc: assignmentPreview.monthlyCtc,
          grossSalary: assignmentPreview.grossEarnings,
          netSalary: assignmentPreview.netTakeHome,
          effectiveFrom,
          taxRegime: selectedTaxRegime,
          status: 'ACTIVE' as const,
          hasSalaryAssigned: true,
          complianceRuleCompliant: assignmentPreview.compliance.is50PercentWageRuleCompliant,
        };
      }
      return emp;
    });

    onUpdateSalaries(updated);
    toast.success(`Salary structure assigned to ${selectedEmployee.name} (₹${assignmentPreview.annualCtc.toLocaleString('en-IN')} CTC)`);
    setIsAssignModalOpen(false);
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
              <Select value={filterView} onValueChange={(val: any) => setFilterView(val)}>
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Employees ({employeeSalaries.length})</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned Only ({assignedCount})</SelectItem>
                  <SelectItem value="UNASSIGNED">Unassigned Only ({unassignedCount})</SelectItem>
                </SelectContent>
              </Select>

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
                    <div className="text-xs text-foreground font-medium">{emp.department}</div>
                    <div className="text-[11px] text-muted-foreground">{emp.designation}</div>
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
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Employee</Label>
                <Select
                  value={selectedEmployee?.id}
                  onValueChange={(id) => {
                    const emp = employeeSalaries.find((e) => e.id === id);
                    if (emp) setSelectedEmployee(emp);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeSalaries.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.employeeCode}) • {e.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Salary Structure Template</Label>
                <Select
                  value={selectedTemplateCode}
                  onValueChange={setSelectedTemplateCode}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.name} ({t.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      if (mode.id === 'ANNUAL_CTC') setInputValue(600000);
                      if (mode.id === 'MONTHLY_GROSS') setInputValue(50000);
                      if (mode.id === 'TARGET_NET') setInputValue(45000);
                      if (mode.id === 'DAILY_RATE') setInputValue(750);
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
                  <Label className="text-xs font-semibold text-foreground">
                    {inputMode === 'ANNUAL_CTC' && 'Enter Annual CTC (₹)'}
                    {inputMode === 'MONTHLY_GROSS' && 'Enter Monthly Gross Pay (₹)'}
                    {inputMode === 'TARGET_NET' && 'Enter Desired In-Hand Monthly Take-Home (₹)'}
                    {inputMode === 'DAILY_RATE' && 'Enter Per-Day Rate (₹)'}
                  </Label>
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(Number(e.target.value))}
                    className="h-8 text-xs font-bold text-indigo-600 bg-card mt-1 font-mono"
                  />
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

              {inputMode === 'TARGET_NET' && (
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
                    Gross: ₹{assignmentPreview?.grossEarnings.toLocaleString('en-IN')}/mo
                  </span>
                  <span className="font-bold text-emerald-600">
                    Net Take-Home: ₹{assignmentPreview?.netTakeHome.toLocaleString('en-IN')}/mo
                  </span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-border/80">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold py-2">Component</TableHead>
                      <TableHead className="text-[11px] font-bold py-2">Type</TableHead>
                      <TableHead className="text-right text-[11px] font-bold py-2">Monthly (₹)</TableHead>
                      <TableHead className="text-right text-[11px] font-bold py-2 pr-4">Annual (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentPreview?.items.map((item) => (
                      <TableRow key={item.componentCode} className="text-xs">
                        <TableCell className="py-1.5 font-medium">
                          {item.componentName}
                          {item.isBalancing && (
                            <Badge className="ml-1.5 text-[8px] bg-purple-100 text-purple-700 py-0 px-1">
                              Balancing
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{item.type}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono font-semibold">
                          ₹{item.monthlyAmount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-muted-foreground pr-4">
                          ₹{item.annualAmount.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAssignment} className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              Confirm & Save Structure
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
