import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Factory,
  ShoppingBag,
  Stethoscope,
  Laptop,
  ArrowRight,
  TrendingUp,
  Percent,
  Calculator,
  Sliders,
  Eye,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import type { StructureTemplate, SalaryComponentItem } from './mock-data';
import { calculateSalaryBreakdown } from './formula-engine';

interface TemplatesTabProps {
  templates: StructureTemplate[];
  components: SalaryComponentItem[];
  onUpdateTemplates: (templates: StructureTemplate[]) => void;
}

export function TemplatesTab({ templates, components, onUpdateTemplates }: TemplatesTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<StructureTemplate>(templates[0] || null);

  // Live Simulator CTC input
  const [simulatedAnnualCtc, setSimulatedAnnualCtc] = useState<number>(1200000);

  // Create / Edit Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StructureTemplate | null>(null);

  // Template Form State
  const [formData, setFormData] = useState<Partial<StructureTemplate>>({
    name: '',
    code: '',
    gradeCode: 'G3',
    gradeName: 'Senior Professional',
    category: 'White Collar',
    industry: 'IT',
    description: '',
    balancingComponentCode: 'SPECIAL_ALLOW',
    version: 1,
    minCtc: 400000,
    maxCtc: 3000000,
    items: [],
  });

  // Calculate live breakdown for simulated CTC
  const liveBreakdown = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.items) return null;
    return calculateSalaryBreakdown({
      annualCtc: simulatedAnnualCtc,
      templateItems: selectedTemplate.items,
    });
  }, [selectedTemplate, simulatedAnnualCtc]);

  const handleSelectTemplate = (tpl: StructureTemplate) => {
    setSelectedTemplate(tpl);
    // Adjust simulator slider to reasonable mid-range of this template
    const mid = Math.round((tpl.minCtc + tpl.maxCtc) / 2 / 50000) * 50000;
    setSimulatedAnnualCtc(mid);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      code: '',
      gradeCode: 'G3',
      gradeName: 'Senior Professional',
      category: 'General Staff',
      industry: 'IT',
      description: '',
      balancingComponentCode: 'SPECIAL_ALLOW',
      version: 1,
      minCtc: 300000,
      maxCtc: 1500000,
      items: [
        { componentCode: 'BASIC', componentName: 'Basic Salary', type: 'EARNING', calculationType: 'PERCENTAGE', calculationValue: 50, calculationBase: 'CTC', order: 1 },
        { componentCode: 'HRA', componentName: 'House Rent Allowance', type: 'EARNING', calculationType: 'PERCENTAGE', calculationValue: 50, calculationBase: 'BASIC', order: 2 },
        { componentCode: 'CONV', componentName: 'Conveyance Allowance', type: 'EARNING', calculationType: 'FIXED', calculationValue: 1600, order: 3 },
        { componentCode: 'SPECIAL_ALLOW', componentName: 'Special Allowance', type: 'EARNING', calculationType: 'BALANCING', isBalancing: true, order: 4 },
        { componentCode: 'PF_EE', componentName: 'Provident Fund (Employee)', type: 'DEDUCTION', calculationType: 'FORMULA', calculationValue: 12, order: 5 },
        { componentCode: 'PT', componentName: 'Professional Tax', type: 'DEDUCTION', calculationType: 'FIXED', calculationValue: 200, order: 6 },
        { componentCode: 'PF_ER', componentName: 'Provident Fund (Employer)', type: 'EMPLOYER_CONTRIBUTION', calculationType: 'FORMULA', calculationValue: 12, order: 7 },
      ],
    });
    setIsTemplateModalOpen(true);
  };

  const handleCloneTemplate = (tpl: StructureTemplate) => {
    const clone: StructureTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      code: `${tpl.code}-V${tpl.version + 1}`,
      version: tpl.version + 1,
    };
    onUpdateTemplates([...templates, clone]);
    setSelectedTemplate(clone);
    toast.success(`Template cloned as "${clone.name}"`);
  };

  const handleSaveTemplate = () => {
    if (!formData.name?.trim() || !formData.code?.trim()) {
      toast.error('Template Name and Code are required');
      return;
    }

    const tpl: StructureTemplate = {
      id: editingTemplate ? editingTemplate.id : `tpl-${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      gradeCode: formData.gradeCode || 'G3',
      gradeName: formData.gradeName || 'General Staff',
      category: formData.category || 'General',
      industry: (formData.industry as any) || 'IT',
      description: formData.description || '',
      balancingComponentCode: formData.balancingComponentCode || 'SPECIAL_ALLOW',
      version: formData.version || 1,
      isActive: true,
      minCtc: Number(formData.minCtc) || 300000,
      maxCtc: Number(formData.maxCtc) || 1500000,
      items: formData.items || [],
    };

    if (editingTemplate) {
      onUpdateTemplates(templates.map((t) => (t.id === editingTemplate.id ? tpl : t)));
      toast.success(`Template "${tpl.name}" updated successfully`);
    } else {
      onUpdateTemplates([...templates, tpl]);
      toast.success(`Template "${tpl.name}" created successfully`);
    }

    setSelectedTemplate(tpl);
    setIsTemplateModalOpen(false);
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'IT':
        return <Laptop className="h-4 w-4 text-indigo-500" />;
      case 'MANUFACTURING':
        return <Factory className="h-4 w-4 text-amber-500" />;
      case 'RETAIL':
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case 'HEALTHCARE':
        return <Stethoscope className="h-4 w-4 text-rose-500" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP PRESETS CAROUSEL / SELECTOR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((tpl) => {
          const isSelected = selectedTemplate?.id === tpl.id;
          return (
            <Card
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`cursor-pointer transition-all border-2 relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                  : 'border-border/70 hover:border-border hover:shadow-2xs bg-card'
              }`}
            >
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-muted flex items-center justify-center">
                      {getIndustryIcon(tpl.industry || 'IT')}
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">{tpl.category || 'Workforce Section'}</span>
                  </div>
                  {isSelected && (
                    <Badge className="bg-indigo-600 text-white text-[10px] h-5 px-1.5 font-bold">Active</Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-1">{tpl.name}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {tpl.code} • Grade {tpl.gradeCode}
                  </p>
                </div>

                <div className="text-[11px] text-muted-foreground line-clamp-2">{tpl.description}</div>

                <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Range:</span>
                  <span className="font-semibold text-foreground">
                    ₹{(tpl.minCtc / 100000).toFixed(1)}L - ₹{(tpl.maxCtc / 100000).toFixed(1)}L
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Salary Breakup Engine: {selectedTemplate?.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Designated balancing component: <span className="font-semibold text-indigo-600">{selectedTemplate?.balancingComponentCode}</span> • Version {selectedTemplate?.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedTemplate && handleCloneTemplate(selectedTemplate)}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <Copy className="h-3.5 w-3.5" /> Clone Template
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs font-semibold gap-1.5 h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create New Template
          </Button>
        </div>
      </div>

      {/* ── SPLIT VIEW: BREAKUP TABLE & LIVE SIMULATOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template Structure Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/80 shadow-2xs overflow-hidden">
            <CardHeader className="bg-muted/30 px-5 py-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-foreground">Component Structure Mapping</CardTitle>
                <CardDescription className="text-[11px]">
                  Configured formula dependencies and computation logic.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {selectedTemplate?.items?.length || 0} Components
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground pl-5">Component</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Type</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Computation Rule</TableHead>
                    <TableHead className="text-right text-xs font-bold text-foreground">Monthly (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold text-foreground pr-5">Annual (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveBreakdown?.items.map((item) => (
                    <TableRow key={item.componentCode} className="hover:bg-muted/20">
                      <TableCell className="pl-5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          {item.componentName}
                          {item.isBalancing && (
                            <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] px-1 py-0 h-4 border-purple-200">
                              Balancing
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.componentCode}</div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.type === 'EARNING'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                              : item.type === 'DEDUCTION'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40'
                          }`}
                        >
                          {item.type === 'EARNING' ? 'Earning' : item.type === 'DEDUCTION' ? 'Deduction' : 'Employer Cost'}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {item.calculationType === 'PERCENTAGE' && `${item.calculationValue}% of ${item.calculationBase || 'Basic'}`}
                        {item.calculationType === 'FIXED' && 'Fixed Amount'}
                        {item.calculationType === 'FORMULA' && 'Statutory Rule / Formula'}
                        {item.calculationType === 'BALANCING' && 'Residual Balancing Figure'}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold">
                        ₹{item.monthlyAmount.toLocaleString('en-IN')}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold pr-5 text-muted-foreground">
                        ₹{item.annualAmount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Interactive Salary Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-md bg-gradient-to-b from-card to-indigo-50/20 dark:to-indigo-950/10">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  Live CTC Salary Simulator
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300">
                  Instant Recalculation
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Adjust annual CTC to observe real-time balancing allowance, taxes, and net take-home pay.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Annual CTC Input & Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Annual CTC Package</Label>
                  <div className="relative w-36">
                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground font-semibold">₹</span>
                    <Input
                      type="number"
                      value={simulatedAnnualCtc}
                      onChange={(e) => setSimulatedAnnualCtc(Number(e.target.value))}
                      step={25000}
                      className="pl-6 h-8 text-xs font-bold text-indigo-600 text-right font-mono"
                    />
                  </div>
                </div>

                <Slider
                  value={[simulatedAnnualCtc]}
                  min={selectedTemplate?.minCtc || 200000}
                  max={selectedTemplate?.maxCtc || 3000000}
                  step={25000}
                  onValueChange={(val) => setSimulatedAnnualCtc(val[0])}
                  className="py-2 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Min: ₹{(selectedTemplate?.minCtc || 200000).toLocaleString('en-IN')}</span>
                  <span>Max: ₹{(selectedTemplate?.maxCtc || 3000000).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* High-Level Financial Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-card rounded-lg border border-border/80 shadow-2xs space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Gross Pay</p>
                  <p className="text-lg font-bold text-foreground font-mono">
                    ₹{liveBreakdown?.grossEarnings.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Annual: ₹{liveBreakdown?.annualGross.toLocaleString('en-IN')}</p>
                </div>

                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-1">
                  <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Net Monthly In-Hand</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{liveBreakdown?.netTakeHome.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    ~{Math.round(((liveBreakdown?.netTakeHome || 0) / (liveBreakdown?.monthlyCtc || 1)) * 100)}% of CTC
                  </p>
                </div>
              </div>

              {/* Deductions & Employer Costs Breakdown */}
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                  <span>Employee Statutory Deductions (PF/ESI/PT):</span>
                  <span className="font-semibold text-rose-600 font-mono">
                    -₹{liveBreakdown?.employeeDeductions.toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                  <span>Employer Contributions (PF/ESI/Gratuity):</span>
                  <span className="font-semibold text-indigo-600 font-mono">
                    ₹{liveBreakdown?.employerCost.toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                  <span>Balancing Allowance (Special Allowance):</span>
                  <span
                    className={`font-semibold font-mono ${
                      liveBreakdown?.compliance.isBalancingNegative ? 'text-rose-600' : 'text-purple-600'
                    }`}
                  >
                    ₹{liveBreakdown?.compliance.balancingAmount.toLocaleString('en-IN')} / mo
                  </span>
                </div>
              </div>

              {/* Compliance & Wage Rule Guardrail Checkers */}
              <div className="space-y-2 pt-1 border-t">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Compliance Check
                </div>

                {/* 50% Rule */}
                <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/80 text-xs">
                  <div className="flex items-center gap-2">
                    {liveBreakdown?.compliance.is50PercentWageRuleCompliant ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold">Labour Code 50% Rule</span>
                      <p className="text-[10px] text-muted-foreground">Basic + DA must be ≥ 50% of Total Wages</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      liveBreakdown?.compliance.is50PercentWageRuleCompliant
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : 'border-amber-300 text-amber-700 bg-amber-50'
                    }`}
                  >
                    {liveBreakdown?.compliance.wageRuleRatio}% of Pay
                  </Badge>
                </div>

                {/* Balancing Figure Guard */}
                <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/80 text-xs">
                  <div className="flex items-center gap-2">
                    {!liveBreakdown?.compliance.isBalancingNegative ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold">Non-Negative Balancing Figure</span>
                      <p className="text-[10px] text-muted-foreground">Special Allowance must remain ≥ ₹0</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      !liveBreakdown?.compliance.isBalancingNegative
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : 'border-rose-300 text-rose-700 bg-rose-50'
                    }`}
                  >
                    {!liveBreakdown?.compliance.isBalancingNegative ? 'Healthy' : 'Deficit'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── CREATE / EDIT TEMPLATE MODAL ── */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              {editingTemplate ? `Edit Template (${editingTemplate.code})` : 'Create Salary Structure Template'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure grade level compensation templates, components order, and designated balancing figure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. IT Software Engineer Band L3"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Template Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. IT-L3-CTC"
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Grade</Label>
                <Input
                  value={formData.gradeCode}
                  onChange={(e) => setFormData({ ...formData, gradeCode: e.target.value })}
                  placeholder="e.g. G3, L4"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Workforce Category / Section</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporate & Tech">Corporate & Tech Staff</SelectItem>
                    <SelectItem value="Plant & Factory Floor">Plant & Factory Floor</SelectItem>
                    <SelectItem value="Retail & Frontline">Retail & Frontline Sales</SelectItem>
                    <SelectItem value="Clinical & Healthcare">Clinical & Healthcare</SelectItem>
                    <SelectItem value="Contractual / Daily Wage">Contractual / Daily Wage</SelectItem>
                    <SelectItem value="Executive & Leadership">Executive & Leadership</SelectItem>
                    <SelectItem value="General Operations">General Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Balancing Component</Label>
                <Select
                  value={formData.balancingComponentCode}
                  onValueChange={(val) => setFormData({ ...formData, balancingComponentCode: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPECIAL_ALLOW">Special Allowance</SelectItem>
                    <SelectItem value="BASIC">Basic (Residual)</SelectItem>
                    <SelectItem value="CONV">Conveyance Allowance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Min CTC Band (₹)</Label>
                <Input
                  type="number"
                  value={formData.minCtc}
                  onChange={(e) => setFormData({ ...formData, minCtc: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Max CTC Band (₹)</Label>
                <Input
                  type="number"
                  value={formData.maxCtc}
                  onChange={(e) => setFormData({ ...formData, maxCtc: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTemplate} className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
