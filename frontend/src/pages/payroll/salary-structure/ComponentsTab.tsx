import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Lock,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Calculator,
  Percent,
  Coins,
  RefreshCw,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { SalaryComponentItem } from './mock-data';
import { evaluateFormula } from './formula-engine';

interface ComponentsTabProps {
  components: SalaryComponentItem[];
  onUpdateComponents: (components: SalaryComponentItem[]) => void;
}

export function ComponentsTab({ components, onUpdateComponents }: ComponentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponentItem | null>(null);

  // Formula Builder Modal
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [formulaDraft, setFormulaDraft] = useState('');
  const [formulaTestCtc, setFormulaTestCtc] = useState(600000);
  const [formulaTestBasic, setFormulaTestBasic] = useState(25000);
  const [formulaPreviewResult, setFormulaPreviewResult] = useState<{ result: number; error?: string }>({ result: 0 });

  // Form State
  const [formData, setFormData] = useState<Partial<SalaryComponentItem>>({
    code: '',
    name: '',
    type: 'EARNING',
    category: 'Allowance',
    description: '',
    calculationType: 'FIXED',
    calculationValue: 0,
    calculationBase: 'BASIC',
    formula: '',
    frequency: 'MONTHLY',
    displayOrder: 1,
    roundingRule: 'NEAREST_1',
    isStatutory: false,
    isSystem: false,
    isTaxable: true,
    includeInGross: true,
    includeInCtc: true,
    showOnPayslip: true,
    proRateOnLop: true,
    isPfApplicable: false,
    isEsiApplicable: false,
    isPtApplicable: false,
    isLwfApplicable: false,
    isGratuityApplicable: false,
    isTdsApplicable: false,
    isActive: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });

  const filteredComponents = useMemo(() => {
    return components.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive) ||
        (statusFilter === 'SYSTEM' && item.isSystem);
      return matchSearch && matchType && matchStatus;
    });
  }, [components, searchTerm, typeFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingComponent(null);
    setFormData({
      code: '',
      name: '',
      type: 'EARNING',
      category: 'Allowance',
      description: '',
      calculationType: 'FIXED',
      calculationValue: 0,
      calculationBase: 'BASIC',
      formula: '',
      frequency: 'MONTHLY',
      displayOrder: components.length + 1,
      roundingRule: 'NEAREST_1',
      isStatutory: false,
      isSystem: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      showOnPayslip: true,
      proRateOnLop: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: false,
      isLwfApplicable: false,
      isGratuityApplicable: false,
      isTdsApplicable: false,
      isActive: true,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: SalaryComponentItem) => {
    setEditingComponent(comp);
    setFormData({ ...comp });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.code?.trim()) {
      toast.error('Component Name and Code are required');
      return;
    }

    const codeUpper = formData.code.toUpperCase().replace(/\s+/g, '_');

    if (!editingComponent) {
      // Check code uniqueness
      if (components.some((c) => c.code === codeUpper)) {
        toast.error(`Component code "${codeUpper}" already exists`);
        return;
      }

      const newComp: SalaryComponentItem = {
        id: `comp-${Date.now()}`,
        code: codeUpper,
        name: formData.name,
        type: formData.type || 'EARNING',
        category: formData.category || 'General',
        description: formData.description || '',
        calculationType: formData.calculationType || 'FIXED',
        calculationValue: Number(formData.calculationValue) || 0,
        calculationBase: formData.calculationBase,
        formula: formData.formula,
        frequency: formData.frequency || 'MONTHLY',
        displayOrder: Number(formData.displayOrder) || components.length + 1,
        roundingRule: formData.roundingRule || 'NEAREST_1',
        isStatutory: Boolean(formData.isStatutory),
        isSystem: false,
        isTaxable: Boolean(formData.isTaxable),
        includeInGross: Boolean(formData.includeInGross),
        includeInCtc: Boolean(formData.includeInCtc),
        showOnPayslip: Boolean(formData.showOnPayslip),
        proRateOnLop: Boolean(formData.proRateOnLop),
        isPfApplicable: Boolean(formData.isPfApplicable),
        isEsiApplicable: Boolean(formData.isEsiApplicable),
        isPtApplicable: Boolean(formData.isPtApplicable),
        isLwfApplicable: Boolean(formData.isLwfApplicable),
        isGratuityApplicable: Boolean(formData.isGratuityApplicable),
        isTdsApplicable: Boolean(formData.isTdsApplicable),
        isActive: Boolean(formData.isActive),
        effectiveFrom: formData.effectiveFrom || new Date().toISOString().slice(0, 10),
      };

      onUpdateComponents([...components, newComp]);
      toast.success(`Component ${newComp.name} (${newComp.code}) created successfully`);
    } else {
      const updated = components.map((c) => (c.id === editingComponent.id ? ({ ...c, ...formData, code: codeUpper } as SalaryComponentItem) : c));
      onUpdateComponents(updated);
      toast.success(`Component ${formData.name} updated successfully`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (comp: SalaryComponentItem) => {
    if (comp.isSystem) {
      toast.error('System statutory components cannot be deleted to preserve payroll calculations.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete component "${comp.name}" (${comp.code})?`)) {
      onUpdateComponents(components.filter((c) => c.id !== comp.id));
      toast.success(`Component ${comp.name} deleted.`);
    }
  };

  const handleToggleStatus = (comp: SalaryComponentItem) => {
    const updated = components.map((c) => (c.id === comp.id ? { ...c, isActive: !c.isActive } : c));
    onUpdateComponents(updated);
    toast.info(`${comp.name} marked as ${!comp.isActive ? 'Active' : 'Inactive'}`);
  };

  // Formula Builder helpers
  const handleOpenFormulaBuilder = () => {
    setFormulaDraft(formData.formula || '');
    testFormula(formData.formula || '', formulaTestCtc, formulaTestBasic);
    setIsFormulaModalOpen(true);
  };

  const testFormula = (expr: string, ctc: number, basic: number) => {
    const res = evaluateFormula(expr, {
      ctc: Math.round(ctc / 12),
      annual_ctc: ctc,
      basic: basic,
      da: Math.round(basic * 0.1),
      gross: basic * 2,
    });
    setFormulaPreviewResult(res);
  };

  const handleInsertToken = (token: string) => {
    const updated = formulaDraft ? `${formulaDraft} ${token}` : token;
    setFormulaDraft(updated);
    testFormula(updated, formulaTestCtc, formulaTestBasic);
  };

  const handleApplyFormula = () => {
    setFormData((prev) => ({ ...prev, formula: formulaDraft, calculationType: 'FORMULA' }));
    setIsFormulaModalOpen(false);
    toast.success('Formula applied to component definition');
  };

  return (
    <div className="space-y-4">
      {/* ── SEARCH & FILTER CONTROLS ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search salary components by code, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="All Component Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="EARNING">Earnings</SelectItem>
                  <SelectItem value="DEDUCTION">Deductions</SelectItem>
                  <SelectItem value="EMPLOYER_CONTRIBUTION">Employer Cost</SelectItem>
                  <SelectItem value="REIMBURSEMENT">Reimbursements</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  <SelectItem value="SYSTEM">System Locked</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleOpenAdd}
                className="h-9 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" /> Add Component
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── COMPONENTS TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Coins className="h-4 w-4 text-indigo-600" />
              Master Salary Components ({filteredComponents.length})
            </CardTitle>
            <CardDescription className="text-xs">
              System & custom wage components, computation bases, statutory tags, and tax flags.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-medium text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
              {components.filter((c) => c.isActive).length} Active
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40">
              {components.filter((c) => c.isSystem).length} System Locked
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground pl-6">Code</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Name & Category</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Type</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Calculation Rule</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Statutory & Compliance Flags</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Tax Treatment</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs font-medium">
                    No salary components match your search filters. Click "+ Add Component" to configure one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredComponents.map((comp) => {
                  const isEarning = comp.type === 'EARNING';
                  const isDeduction = comp.type === 'DEDUCTION';
                  const isEmployer = comp.type === 'EMPLOYER_CONTRIBUTION';
                  const isReimb = comp.type === 'REIMBURSEMENT';

                  return (
                    <TableRow key={comp.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="pl-6 font-mono text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          {comp.isSystem && (
                            <span title="System Protected Component">
                              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                          <span className="text-foreground">{comp.code}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs text-foreground">{comp.name}</div>
                        <div className="text-[11px] text-muted-foreground">{comp.category} • {comp.frequency}</div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold tracking-wide ${
                            isEarning
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                              : isDeduction
                                ? 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40'
                                : isEmployer
                                  ? 'border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40'
                                  : 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40'
                          }`}
                        >
                          {isEarning && 'Earning'}
                          {isDeduction && 'Deduction'}
                          {isEmployer && 'Employer Cost'}
                          {isReimb && 'Reimbursement'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-foreground">
                          {comp.calculationType === 'PERCENTAGE' && (
                            <span className="inline-flex items-center gap-1">
                              <Percent className="h-3 w-3 text-indigo-600" />
                              {comp.calculationValue}% of {comp.calculationBase || 'Basic'}
                            </span>
                          )}
                          {comp.calculationType === 'FIXED' && `₹${comp.calculationValue.toLocaleString('en-IN')} Fixed`}
                          {comp.calculationType === 'BALANCING' && (
                            <span className="inline-flex items-center gap-1 text-purple-600 font-semibold">
                              <Sparkles className="h-3 w-3" /> Balancing Figure
                            </span>
                          )}
                          {comp.calculationType === 'FORMULA' && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              <Code2 className="h-3 w-3" /> {comp.formula?.slice(0, 24)}...
                            </span>
                          )}
                          {comp.calculationType === 'MANUAL' && <span className="text-muted-foreground">Manual Variable Entry</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Order: #{comp.displayOrder} • {comp.proRateOnLop ? 'Pro-rated on LOP' : 'Non-prorated'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {comp.isPfApplicable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded">
                              PF
                            </span>
                          )}
                          {comp.isEsiApplicable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                              ESI
                            </span>
                          )}
                          {comp.isPtApplicable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded">
                              PT
                            </span>
                          )}
                          {comp.isGratuityApplicable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded">
                              Gratuity
                            </span>
                          )}
                          {comp.showOnPayslip && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                              Payslip
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {comp.isTaxable ? (
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Taxable</span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Tax Exempt</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(comp)}
                          className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                        >
                          {comp.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-3.5 w-3.5" /> Inactive
                            </span>
                          )}
                        </button>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(comp)}
                            title="Edit Component"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${comp.isSystem ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'}`}
                            onClick={() => handleDelete(comp)}
                            disabled={comp.isSystem}
                            title={comp.isSystem ? 'System component cannot be deleted' : 'Delete Component'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── ADD / EDIT COMPONENT MODAL ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-indigo-600" />
              {editingComponent ? `Edit Salary Component (${editingComponent.code})` : 'Create Salary Component'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure component attributes, calculation formulas, statutory applicability, and tax flags.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Row 1: Code & Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Component Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. HRA, SPECIAL_ALLOW"
                  className="h-8 text-xs font-mono uppercase"
                  disabled={editingComponent?.isSystem}
                />
                {editingComponent?.isSystem && (
                  <p className="text-[10px] text-amber-600">System component code cannot be altered.</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Component Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. House Rent Allowance"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Row 2: Type & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Component Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                  disabled={editingComponent?.isSystem}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EARNING">Earning</SelectItem>
                    <SelectItem value="DEDUCTION">Deduction</SelectItem>
                    <SelectItem value="EMPLOYER_CONTRIBUTION">Employer Contribution</SelectItem>
                    <SelectItem value="REIMBURSEMENT">Reimbursement (Claim)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Allowance, Basic, Statutory"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Row 3: Calculation Method */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border/80 space-y-3">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-indigo-600" />
                Calculation Method & Value
              </Label>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Method</Label>
                  <Select
                    value={formData.calculationType}
                    onValueChange={(val: any) => setFormData({ ...formData, calculationType: val })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">% of Component / CTC</SelectItem>
                      <SelectItem value="FORMULA">Formula Expression</SelectItem>
                      <SelectItem value="BALANCING">Balancing Figure (Residual)</SelectItem>
                      <SelectItem value="MANUAL">Manual Input</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.calculationType === 'PERCENTAGE' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Percentage (%)</Label>
                      <Input
                        type="number"
                        value={formData.calculationValue}
                        onChange={(e) => setFormData({ ...formData, calculationValue: Number(e.target.value) })}
                        placeholder="e.g. 50"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Percentage Of</Label>
                      <Select
                        value={formData.calculationBase || 'BASIC'}
                        onValueChange={(val) => setFormData({ ...formData, calculationBase: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASIC">Basic Salary</SelectItem>
                          <SelectItem value="BASIC_DA">Basic + DA</SelectItem>
                          <SelectItem value="CTC">Monthly CTC</SelectItem>
                          <SelectItem value="GROSS">Monthly Gross</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {formData.calculationType === 'FIXED' && (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-[11px] text-muted-foreground">Fixed Monthly Amount (₹)</Label>
                    <Input
                      type="number"
                      value={formData.calculationValue}
                      onChange={(e) => setFormData({ ...formData, calculationValue: Number(e.target.value) })}
                      placeholder="e.g. 1600"
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {formData.calculationType === 'FORMULA' && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground">Mathematical Expression</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-5 p-0 text-indigo-600 text-[11px] font-semibold"
                        onClick={handleOpenFormulaBuilder}
                      >
                        Open Visual Formula Builder ↗
                      </Button>
                    </div>
                    <Input
                      value={formData.formula}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      placeholder="e.g. MIN(BASIC * 0.5, 15000)"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Statutory & Compliance Applicability */}
            <div className="p-3 bg-muted/20 rounded-lg border border-border/80 space-y-2">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Statutory & Wage Applicability
              </Label>
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPfApplicable"
                    checked={formData.isPfApplicable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPfApplicable: Boolean(checked) })}
                  />
                  <Label htmlFor="isPfApplicable" className="text-xs font-normal cursor-pointer">
                    Part of PF Wages
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isEsiApplicable"
                    checked={formData.isEsiApplicable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEsiApplicable: Boolean(checked) })}
                  />
                  <Label htmlFor="isEsiApplicable" className="text-xs font-normal cursor-pointer">
                    Part of ESI Wages
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPtApplicable"
                    checked={formData.isPtApplicable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPtApplicable: Boolean(checked) })}
                  />
                  <Label htmlFor="isPtApplicable" className="text-xs font-normal cursor-pointer">
                    Part of PT Wages
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isGratuityApplicable"
                    checked={formData.isGratuityApplicable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isGratuityApplicable: Boolean(checked) })}
                  />
                  <Label htmlFor="isGratuityApplicable" className="text-xs font-normal cursor-pointer">
                    Part of Gratuity Wages
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="proRateOnLop"
                    checked={formData.proRateOnLop}
                    onCheckedChange={(checked) => setFormData({ ...formData, proRateOnLop: Boolean(checked) })}
                  />
                  <Label htmlFor="proRateOnLop" className="text-xs font-normal cursor-pointer">
                    Pro-rate on LOP / Leave
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTaxable"
                    checked={formData.isTaxable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isTaxable: Boolean(checked) })}
                  />
                  <Label htmlFor="isTaxable" className="text-xs font-normal cursor-pointer text-rose-600 font-semibold">
                    Taxable (TDS)
                  </Label>
                </div>
              </div>
            </div>

            {/* Row 5: Packaging & Presentation */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="includeInCtc"
                  checked={formData.includeInCtc}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeInCtc: Boolean(checked) })}
                />
                <Label htmlFor="includeInCtc" className="text-xs cursor-pointer">
                  Part of Annual CTC
                </Label>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="showOnPayslip"
                  checked={formData.showOnPayslip}
                  onCheckedChange={(checked) => setFormData({ ...formData, showOnPayslip: Boolean(checked) })}
                />
                <Label htmlFor="showOnPayslip" className="text-xs cursor-pointer">
                  Show on Payslip
                </Label>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Rounding Rule</Label>
                <Select
                  value={formData.roundingRule}
                  onValueChange={(val: any) => setFormData({ ...formData, roundingRule: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEAREST_1">Nearest ₹1</SelectItem>
                    <SelectItem value="NEAREST_10">Nearest ₹10</SelectItem>
                    <SelectItem value="CEIL">Round Up (Ceil)</SelectItem>
                    <SelectItem value="FLOOR">Round Down (Floor)</SelectItem>
                    <SelectItem value="NONE">Exact Paise (None)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              {editingComponent ? 'Save Changes' : 'Create Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VISUAL FORMULA BUILDER MODAL ── */}
      <Dialog open={isFormulaModalOpen} onOpenChange={setIsFormulaModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-600" /> Formula Builder & Test Preview
            </DialogTitle>
            <DialogDescription className="text-xs">
              Construct multi-variable calculation formulas with live preview and syntax verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Formula Expression</Label>
              <Input
                value={formulaDraft}
                onChange={(e) => {
                  setFormulaDraft(e.target.value);
                  testFormula(e.target.value, formulaTestCtc, formulaTestBasic);
                }}
                placeholder="e.g. MIN(BASIC * 0.5, 15000)"
                className="font-mono text-xs h-9 bg-slate-950 text-emerald-400 border-slate-800"
              />
            </div>

            {/* Quick Variable Chips */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold">Variables (Click to insert):</Label>
              <div className="flex flex-wrap gap-1.5">
                {['BASIC', 'DA', 'HRA', 'CTC', 'GROSS', 'ANNUAL_CTC', 'WORK_DAYS', 'LOP_DAYS'].map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] font-mono font-bold px-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
                    onClick={() => handleInsertToken(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* Math Operator Chips */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold">Math Operators:</Label>
              <div className="flex flex-wrap gap-1.5">
                {['+', '-', '*', '/', '(', ')', 'MIN(', 'MAX(', 'ROUND('].map((op) => (
                  <Button
                    key={op}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 text-[11px] font-mono font-bold px-2"
                    onClick={() => handleInsertToken(op)}
                  >
                    {op}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-rose-500 hover:bg-rose-50"
                  onClick={() => {
                    setFormulaDraft('');
                    testFormula('', formulaTestCtc, formulaTestBasic);
                  }}
                >
                  Clear Formula
                </Button>
              </div>
            </div>

            {/* Live Test Preview Box */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border/80 space-y-2 mt-2">
              <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                <span>Live Calculator Sandbox</span>
                <RefreshCw
                  className="h-3 w-3 text-muted-foreground cursor-pointer"
                  onClick={() => testFormula(formulaDraft, formulaTestCtc, formulaTestBasic)}
                />
              </Label>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Test Annual CTC:</span>
                  <Input
                    type="number"
                    value={formulaTestCtc}
                    onChange={(e) => {
                      const ctc = Number(e.target.value);
                      setFormulaTestCtc(ctc);
                      testFormula(formulaDraft, ctc, formulaTestBasic);
                    }}
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">Test Monthly Basic:</span>
                  <Input
                    type="number"
                    value={formulaTestBasic}
                    onChange={(e) => {
                      const basic = Number(e.target.value);
                      setFormulaTestBasic(basic);
                      testFormula(formulaDraft, formulaTestCtc, basic);
                    }}
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-xs font-semibold">Calculated Test Output:</span>
                {formulaPreviewResult.error ? (
                  <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> {formulaPreviewResult.error}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    ₹{formulaPreviewResult.result.toLocaleString('en-IN')} / month
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsFormulaModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFormula}
              disabled={Boolean(formulaPreviewResult.error)}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Apply to Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
