import { useState, useMemo } from 'react';
import {
  FileText,
  Calculator,
  Percent,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Save,
  ShieldCheck,
  Sliders,
  Lock,
  Unlock,
  Building2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { TAX_REGIMES_CONFIG, type TaxRegimeData } from './mock-data';

interface CompanyTaxPolicy {
  defaultRegime: 'NEW' | 'OLD';
  allowEmployeeRegimeSwitch: boolean;
  regimeSwitchDeadline: string;
  declarationPortalOpen: boolean;
  proofSubmissionDeadline: string;
  autoStandardDeduction: boolean;
  autoRebate87A: boolean;
  cessRate: number;
  tdsRoundingRule: 'NEAREST_1' | 'NEAREST_10' | 'FLOOR' | 'CEIL';
  hraLandlordPanThreshold: number;
  sec80CLimit: number;
  sec80DLimit: number;
  sec80DSeniorLimit: number;
  newRegimeStdDed: number;
  oldRegimeStdDed: number;
}

const DEFAULT_TAX_POLICY: CompanyTaxPolicy = {
  defaultRegime: 'NEW',
  allowEmployeeRegimeSwitch: true,
  regimeSwitchDeadline: '2025-04-30',
  declarationPortalOpen: true,
  proofSubmissionDeadline: '2026-01-15',
  autoStandardDeduction: true,
  autoRebate87A: true,
  cessRate: 4,
  tdsRoundingRule: 'NEAREST_1',
  hraLandlordPanThreshold: 100000,
  sec80CLimit: 150000,
  sec80DLimit: 25000,
  sec80DSeniorLimit: 50000,
  newRegimeStdDed: 75000,
  oldRegimeStdDed: 50000,
};

export function TaxSettingsTab() {
  const [selectedFy, setSelectedFy] = useState<string>('2025-2026');
  const [activeSubTab, setActiveSubTab] = useState<'policy' | 'slabs' | 'simulator'>('policy');

  // Load persisted company tax policy or fallback to defaults
  const [policy, setPolicy] = useState<CompanyTaxPolicy>(() => {
    try {
      const saved = localStorage.getItem('company_tax_policy');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_TAX_POLICY;
  });

  // Interactive Tax Sandbox
  const [testSalary, setTestSalary] = useState<number>(1200000);
  const [testOldDeductions, setTestOldDeductions] = useState<number>(150000); // 80C
  const [testHraExemption, setTestHraExemption] = useState<number>(120000); // HRA
  const [test80DExemption, setTest80DExemption] = useState<number>(25000); // 80D

  const currentConfig: TaxRegimeData = TAX_REGIMES_CONFIG[selectedFy] || TAX_REGIMES_CONFIG['2025-2026'];

  const handleSavePolicy = () => {
    try {
      localStorage.setItem('company_tax_policy', JSON.stringify(policy));
    } catch {
      // ignore
    }
    toast.success('Tax & TDS settings saved successfully for FY ' + selectedFy);
  };

  // Tax computation simulator
  const comparison = useMemo(() => {
    // 1. New Regime Calculation
    const newStdDed = policy.autoStandardDeduction ? policy.newRegimeStdDed : 0;
    const newTaxableIncome = Math.max(0, testSalary - newStdDed);
    let newRawTax = 0;

    for (const slab of currentConfig.newRegime.slabs) {
      if (newTaxableIncome > slab.min) {
        const taxableAmountInSlab = Math.min(newTaxableIncome, slab.max) - slab.min;
        newRawTax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    // Section 87A Rebate in New Regime (up to rebate87ALimit)
    if (policy.autoRebate87A && newTaxableIncome <= currentConfig.newRegime.rebate87ALimit) {
      newRawTax = 0;
    }
    const newCess = Math.round(newRawTax * (policy.cessRate / 100));
    const newTotalTax = newRawTax + newCess;

    // 2. Old Regime Calculation
    const oldStdDed = policy.autoStandardDeduction ? policy.oldRegimeStdDed : 0;
    const capped80C = Math.min(testOldDeductions, policy.sec80CLimit);
    const capped80D = Math.min(test80DExemption, policy.sec80DLimit);
    const totalOldDeductions = oldStdDed + capped80C + testHraExemption + capped80D;
    const oldTaxableIncome = Math.max(0, testSalary - totalOldDeductions);
    let oldRawTax = 0;

    for (const slab of currentConfig.oldRegime.slabs) {
      if (oldTaxableIncome > slab.min) {
        const taxableAmountInSlab = Math.min(oldTaxableIncome, slab.max) - slab.min;
        oldRawTax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    if (policy.autoRebate87A && oldTaxableIncome <= currentConfig.oldRegime.rebate87ALimit) {
      oldRawTax = 0;
    }
    const oldCess = Math.round(oldRawTax * (policy.cessRate / 100));
    const oldTotalTax = oldRawTax + oldCess;

    const diff = Math.abs(oldTotalTax - newTotalTax);
    const recommendedRegime = newTotalTax <= oldTotalTax ? 'NEW' : 'OLD';

    return {
      newTaxableIncome,
      newTotalTax,
      newMonthlyTds: Math.round(newTotalTax / 12),
      oldTaxableIncome,
      oldTotalTax,
      oldMonthlyTds: Math.round(oldTotalTax / 12),
      diff,
      recommendedRegime,
      newEffectiveRate: testSalary > 0 ? ((newTotalTax / testSalary) * 100).toFixed(1) : '0.0',
      oldEffectiveRate: testSalary > 0 ? ((oldTotalTax / testSalary) * 100).toFixed(1) : '0.0',
    };
  }, [testSalary, testOldDeductions, testHraExemption, test80DExemption, currentConfig, policy]);

  return (
    <div className="space-y-5">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Income Tax (TDS) & Tax Regime Settings
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure entity-level Income Tax policies, declaration windows, default tax regime, CBDT slabs, and monthly TDS deduction rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">FY:</span>
            <Select value={selectedFy} onValueChange={setSelectedFy}>
              <SelectTrigger className="h-7 w-28 text-xs font-bold border-0 bg-transparent shadow-none p-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-2026">FY 2025-2026</SelectItem>
                <SelectItem value="2026-2027">FY 2026-2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSavePolicy}
            className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" /> Save Tax Settings
          </Button>
        </div>
      </div>

      {/* ── TOP KPI QUICK-SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Default Regime</span>
            <div className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              {policy.defaultRegime === 'NEW' ? 'New (115BAC)' : 'Old Regime'}
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                Auto-assigned
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Applied to all new joiners</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Standard Deduction</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              ₹{policy.newRegimeStdDed.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-muted-foreground">/ ₹{policy.oldRegimeStdDed.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">New Regime vs Old Regime</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Section 87A Rebate</span>
            <div className="text-base font-bold text-emerald-600 mt-0.5">
              Up to ₹{currentConfig.newRegime.rebate87ALimit.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Zero tax under Section 115BAC</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Declaration Portal</span>
            <div className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              {policy.declarationPortalOpen ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Unlock className="h-3.5 w-3.5" /> Open
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Closed
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Proof Cutoff: {policy.proofSubmissionDeadline}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as any)} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
          <TabsTrigger value="policy" className="text-xs font-bold px-4 h-8 gap-1.5">
            <Sliders className="h-3.5 w-3.5" /> Company Tax & TDS Policy
          </TabsTrigger>
          <TabsTrigger value="slabs" className="text-xs font-bold px-4 h-8 gap-1.5">
            <FileText className="h-3.5 w-3.5" /> CBDT Slabs & Rates ({selectedFy})
          </TabsTrigger>
          <TabsTrigger value="simulator" className="text-xs font-bold px-4 h-8 gap-1.5">
            <Calculator className="h-3.5 w-3.5" /> Live Regime Comparison & TDS Simulator
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: COMPANY TAX & TDS POLICY CONTROLS
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="policy" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* General Policy Card */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="bg-muted/20 px-5 py-3.5 border-b border-border/60">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Default Tax Regime & Employee Election Rules
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Specify entity-wide defaults for newly hired employees and declaration window rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Tax Regime for New Employees</Label>
                  <Select
                    value={policy.defaultRegime}
                    onValueChange={(val: 'NEW' | 'OLD') => setPolicy({ ...policy, defaultRegime: val })}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New Tax Regime (Section 115BAC) — Recommended by CBDT</SelectItem>
                      <SelectItem value="OLD">Old Tax Regime (Allows 80C, 80D, HRA & Home Loan Claims)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    As per the Finance Act, New Tax Regime is the default regime in India unless an employee explicitly elects Old Regime.
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold">Allow Employees to Switch Regime</Label>
                      <p className="text-[11px] text-muted-foreground">Employees can choose between New and Old in their ESS portal</p>
                    </div>
                    <Switch
                      checked={policy.allowEmployeeRegimeSwitch}
                      onCheckedChange={(val) => setPolicy({ ...policy, allowEmployeeRegimeSwitch: val })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Regime Declaration Cutoff Date</Label>
                    <Input
                      type="date"
                      value={policy.regimeSwitchDeadline}
                      onChange={(e) => setPolicy({ ...policy, regimeSwitchDeadline: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">After this date, regime changes are locked until the next Financial Year.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold">Automatic Standard Deduction</Label>
                      <p className="text-[11px] text-muted-foreground">Automatically deduct ₹75,000 (New) or ₹50,000 (Old) when computing annual tax</p>
                    </div>
                    <Switch
                      checked={policy.autoStandardDeduction}
                      onCheckedChange={(val) => setPolicy({ ...policy, autoStandardDeduction: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold">Apply Section 87A Tax Rebate</Label>
                      <p className="text-[11px] text-muted-foreground">Zero tax liability if taxable income is ≤ ₹7,00,000 in New Regime</p>
                    </div>
                    <Switch
                      checked={policy.autoRebate87A}
                      onCheckedChange={(val) => setPolicy({ ...policy, autoRebate87A: val })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Declaration Window & Form 12BB Proofs */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="bg-muted/20 px-5 py-3.5 border-b border-border/60">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Investment Proof Submission & Verification Windows
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Configure employee submission deadlines for Form 12BB investment proofs (80C, 80D, HRA rent receipts).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">IT Declaration Portal Status</Label>
                    <p className="text-[11px] text-muted-foreground">
                      {policy.declarationPortalOpen
                        ? 'Employees can submit and revise planned tax declarations'
                        : 'Portal is currently locked for declarations'}
                    </p>
                  </div>
                  <Switch
                    checked={policy.declarationPortalOpen}
                    onCheckedChange={(val) => setPolicy({ ...policy, declarationPortalOpen: val })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Year-End Proof Submission Cutoff Date</Label>
                  <Input
                    type="date"
                    value={policy.proofSubmissionDeadline}
                    onChange={(e) => setPolicy({ ...policy, proofSubmissionDeadline: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Proofs uploaded after this date will not be considered in Jan/Feb/Mar TDS payroll calculations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Health & Education Cess (%)</Label>
                    <Input
                      type="number"
                      step={0.1}
                      value={policy.cessRate}
                      onChange={(e) => setPolicy({ ...policy, cessRate: Number(e.target.value) })}
                      className="h-8 text-xs font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Standard CBDT cess rate: 4.0%</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Monthly TDS Rounding</Label>
                    <Select
                      value={policy.tdsRoundingRule}
                      onValueChange={(val: any) => setPolicy({ ...policy, tdsRoundingRule: val })}
                    >
                      <SelectTrigger className="h-8 text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEAREST_1">Nearest ₹1 (Standard)</SelectItem>
                        <SelectItem value="NEAREST_10">Nearest ₹10 (EPFO style)</SelectItem>
                        <SelectItem value="CEIL">Round Up (Ceil)</SelectItem>
                        <SelectItem value="FLOOR">Round Down (Floor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <Label className="text-xs font-semibold">Mandatory Landlord PAN Threshold for HRA (₹ / year)</Label>
                  <Input
                    type="number"
                    step={10000}
                    value={policy.hraLandlordPanThreshold}
                    onChange={(e) => setPolicy({ ...policy, hraLandlordPanThreshold: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    CBDT rule requires landlord PAN if annual rent paid by employee exceeds ₹1,00,000.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statutory Threshold Limits */}
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-5 py-3 border-b border-border/60">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <Percent className="h-4 w-4 text-emerald-600" />
                Statutory Exemption Caps & Chapter VI-A Limits (Old Regime)
              </CardTitle>
              <CardDescription className="text-[11px]">
                Maximum allowable deductions under Section 80C, 80D, and Standard Deduction.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Section 80C Maximum Cap (₹)</Label>
                  <Input
                    type="number"
                    value={policy.sec80CLimit}
                    onChange={(e) => setPolicy({ ...policy, sec80CLimit: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">EPF, PPF, ELSS, Life Insurance, Tuition fee</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Section 80D (Self & Family) (₹)</Label>
                  <Input
                    type="number"
                    value={policy.sec80DLimit}
                    onChange={(e) => setPolicy({ ...policy, sec80DLimit: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Health insurance premium (Non-senior)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Section 80D (Senior Parents) (₹)</Label>
                  <Input
                    type="number"
                    value={policy.sec80DSeniorLimit}
                    onChange={(e) => setPolicy({ ...policy, sec80DSeniorLimit: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Health insurance for senior citizen parents</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">New Regime Std Deduction (₹)</Label>
                  <Input
                    type="number"
                    value={policy.newRegimeStdDed}
                    onChange={(e) => setPolicy({ ...policy, newRegimeStdDed: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Budget 2024 revised from ₹50k to ₹75k</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: CBDT TAX SLABS & RATES
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="slabs" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NEW REGIME (SECTION 115BAC) */}
            <Card className="border-indigo-300 dark:border-indigo-900/60 shadow-2xs">
              <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/30 px-5 py-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    New Tax Regime (Section 115BAC - Default)
                  </CardTitle>
                  <Badge className="bg-indigo-600 text-white text-[10px] font-bold">Default Regime</Badge>
                </div>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Standard Deduction: ₹{policy.newRegimeStdDed.toLocaleString('en-IN')} • 87A Rebate: Zero tax on income up to ₹{currentConfig.newRegime.rebate87ALimit.toLocaleString('en-IN')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold pl-5">Taxable Income Bracket</TableHead>
                      <TableHead className="text-right text-xs font-bold pr-5">Tax Rate (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentConfig.newRegime.slabs.map((slab, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-5 text-xs font-medium">
                          ₹{slab.min.toLocaleString('en-IN')} -{' '}
                          {slab.max > 50000000 ? 'Above' : `₹${slab.max.toLocaleString('en-IN')}`}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold pr-5">
                          {slab.rate === 0 ? (
                            <span className="text-emerald-600 font-semibold">Nil (0%)</span>
                          ) : (
                            `${slab.rate}%`
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* OLD TAX REGIME */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="bg-muted/30 px-5 py-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-foreground">Old Tax Regime (With Chapter VI-A Deductions)</CardTitle>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Opt-in Required</Badge>
                </div>
                <CardDescription className="text-[11px]">
                  Standard Deduction: ₹{policy.oldRegimeStdDed.toLocaleString('en-IN')} • 80C Cap: ₹{policy.sec80CLimit.toLocaleString('en-IN')} • 80D: ₹{policy.sec80DLimit.toLocaleString('en-IN')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold pl-5">Taxable Income Bracket</TableHead>
                      <TableHead className="text-right text-xs font-bold pr-5">Tax Rate (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentConfig.oldRegime.slabs.map((slab, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-5 text-xs font-medium">
                          ₹{slab.min.toLocaleString('en-IN')} -{' '}
                          {slab.max > 50000000 ? 'Above' : `₹${slab.max.toLocaleString('en-IN')}`}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold pr-5">
                          {slab.rate === 0 ? (
                            <span className="text-emerald-600 font-semibold">Nil (0%)</span>
                          ) : (
                            `${slab.rate}%`
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-950 dark:text-blue-300">CBDT Statutory Notice:</span>
              <p className="text-muted-foreground leading-relaxed">
                Income tax slabs are legislated by the Central Board of Direct Taxes (CBDT) under the Union Budget. Under the Finance Act, employer organizations deduct TDS under Section 192 based on the employee's chosen regime and annual declared investments verified via Form 12BB.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: LIVE TAX SIMULATOR & TDS CALCULATOR
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="simulator" className="space-y-5">
          <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-md bg-gradient-to-br from-card to-indigo-50/15">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-indigo-600" />
                Live Tax Regime Comparison & Monthly TDS Calculator
              </CardTitle>
              <CardDescription className="text-xs">
                Test any annual gross package with custom 80C, 80D, and HRA exemptions to calculate precise annual tax and monthly TDS.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Annual Gross Salary (₹)</Label>
                  <Input
                    type="number"
                    value={testSalary}
                    onChange={(e) => setTestSalary(Number(e.target.value))}
                    step={50000}
                    className="h-8 text-xs font-bold font-mono text-indigo-600"
                  />
                  <p className="text-[10px] text-muted-foreground">Monthly: ₹{Math.round(testSalary / 12).toLocaleString('en-IN')}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Section 80C Claim (Old Regime)</Label>
                  <Input
                    type="number"
                    value={testOldDeductions}
                    onChange={(e) => setTestOldDeductions(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Max cap: ₹{policy.sec80CLimit.toLocaleString('en-IN')}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">HRA Exemption Claim (Old Regime)</Label>
                  <Input
                    type="number"
                    value={testHraExemption}
                    onChange={(e) => setTestHraExemption(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Rent receipts & agreements</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Section 80D Health Insurance</Label>
                  <Input
                    type="number"
                    value={test80DExemption}
                    onChange={(e) => setTest80DExemption(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Max cap: ₹{policy.sec80DLimit.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Results Side-by-Side Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* NEW REGIME CARD */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    comparison.recommendedRegime === 'NEW'
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
                      : 'border-border/80 bg-card'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-bold text-foreground">New Regime (Section 115BAC)</span>
                    </div>
                    {comparison.recommendedRegime === 'NEW' && (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Recommended</Badge>
                    )}
                  </div>

                  <div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      ₹{comparison.newTotalTax.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-muted-foreground">/ year</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Effective Tax Rate:{' '}
                      <span className="font-bold text-foreground font-mono">{comparison.newEffectiveRate}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Monthly TDS</span>
                      <span className="font-bold font-mono text-foreground text-sm">
                        ₹{comparison.newMonthlyTds.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Net Taxable Income</span>
                      <span className="font-semibold font-mono text-foreground">
                        ₹{comparison.newTaxableIncome.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OLD REGIME CARD */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    comparison.recommendedRegime === 'OLD'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'border-border/80 bg-card'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-foreground">Old Tax Regime</span>
                    </div>
                    {comparison.recommendedRegime === 'OLD' && (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Recommended</Badge>
                    )}
                  </div>

                  <div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      ₹{comparison.oldTotalTax.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-muted-foreground">/ year</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Effective Tax Rate:{' '}
                      <span className="font-bold text-foreground font-mono">{comparison.oldEffectiveRate}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Monthly TDS</span>
                      <span className="font-bold font-mono text-foreground text-sm">
                        ₹{comparison.oldMonthlyTds.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Net Taxable Income</span>
                      <span className="font-semibold font-mono text-foreground">
                        ₹{comparison.oldTaxableIncome.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-foreground">Tax Saving Insight:</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {comparison.recommendedRegime === 'NEW'
                    ? `New Regime saves ₹${comparison.diff.toLocaleString('en-IN')} in taxes annually over the Old Regime.`
                    : `Old Regime saves ₹${comparison.diff.toLocaleString('en-IN')} annually due to high Chapter VI-A deductions.`}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
