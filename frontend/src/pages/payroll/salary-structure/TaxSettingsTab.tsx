import { useState, useMemo } from 'react';
import {
  FileText,
  Calculator,
  Percent,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TAX_REGIMES_CONFIG, type TaxRegimeData } from './mock-data';

export function TaxSettingsTab() {
  const [selectedFy, setSelectedFy] = useState<string>('2025-2026');

  // Interactive Tax Sandbox
  const [testSalary, setTestSalary] = useState<number>(1200000);
  const [testOldDeductions, setTestOldDeductions] = useState<number>(150000); // 80C
  const [testHraExemption, setTestHraExemption] = useState<number>(120000); // HRA

  const currentConfig: TaxRegimeData = TAX_REGIMES_CONFIG[selectedFy] || TAX_REGIMES_CONFIG['2025-2026'];

  // Tax computation simulator
  const comparison = useMemo(() => {
    // 1. New Regime Calculation
    const newStdDed = currentConfig.newRegime.standardDeduction;
    const newTaxableIncome = Math.max(0, testSalary - newStdDed);
    let newRawTax = 0;

    for (const slab of currentConfig.newRegime.slabs) {
      if (newTaxableIncome > slab.min) {
        const taxableAmountInSlab = Math.min(newTaxableIncome, slab.max) - slab.min;
        newRawTax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    // Section 87A Rebate in New Regime (up to rebate87ALimit)
    if (newTaxableIncome <= currentConfig.newRegime.rebate87ALimit) {
      newRawTax = 0;
    }
    const newCess = Math.round(newRawTax * 0.04);
    const newTotalTax = newRawTax + newCess;

    // 2. Old Regime Calculation
    const oldStdDed = currentConfig.oldRegime.standardDeduction;
    const totalOldDeductions = oldStdDed + testOldDeductions + testHraExemption;
    const oldTaxableIncome = Math.max(0, testSalary - totalOldDeductions);
    let oldRawTax = 0;

    for (const slab of currentConfig.oldRegime.slabs) {
      if (oldTaxableIncome > slab.min) {
        const taxableAmountInSlab = Math.min(oldTaxableIncome, slab.max) - slab.min;
        oldRawTax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    if (oldTaxableIncome <= currentConfig.oldRegime.rebate87ALimit) {
      oldRawTax = 0;
    }
    const oldCess = Math.round(oldRawTax * 0.04);
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
    };
  }, [testSalary, testOldDeductions, testHraExemption, currentConfig]);

  return (
    <div className="space-y-6">
      {/* ── HEADER & FINANCIAL YEAR SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Indian Income Tax Slabs & Regime Configurations
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Default Section 115BAC (New Regime) and Old Regime tax brackets, standard deductions, Section 87A rebate, and surcharge limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold">Assessment FY:</Label>
          <Select value={selectedFy} onValueChange={setSelectedFy}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026">FY 2025-2026</SelectItem>
              <SelectItem value="2026-2027">FY 2026-2027</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── SIDE-BY-SIDE SLAB COMPARISON TABLES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEW REGIME (SECTION 115BAC) */}
        <Card className="border-indigo-300 dark:border-indigo-900/60 shadow-2xs">
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/30 px-5 py-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                New Tax Regime (Section 115BAC - Default)
              </CardTitle>
              <Badge className="bg-indigo-600 text-white text-[10px] font-bold">Standard Choice</Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground">
              Standard Deduction: ₹{currentConfig.newRegime.standardDeduction.toLocaleString('en-IN')} • 87A Rebate: Income up to ₹{currentConfig.newRegime.rebate87ALimit.toLocaleString('en-IN')} (Zero Tax)
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
              <CardTitle className="text-xs font-bold text-foreground">Old Tax Regime (With Chapter VI-A Exemptions)</CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Opt-in Required</Badge>
            </div>
            <CardDescription className="text-[11px]">
              Standard Deduction: ₹{currentConfig.oldRegime.standardDeduction.toLocaleString('en-IN')} • 80C Cap: ₹{currentConfig.oldRegime.sec80CLimit.toLocaleString('en-IN')} • 80D: ₹{currentConfig.oldRegime.sec80DLimit.toLocaleString('en-IN')}
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

      {/* ── INTERACTIVE TAX COMPARISON SIMULATOR ── */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-md bg-gradient-to-br from-card to-indigo-50/15">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-indigo-600" />
            Live Tax Regime Comparison Calculator
          </CardTitle>
          <CardDescription className="text-xs">
            Test any annual gross package with custom 80C and HRA deductions to compute exact tax liability under both regimes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Annual Gross Salary (₹)</Label>
              <Input
                type="number"
                value={testSalary}
                onChange={(e) => setTestSalary(Number(e.target.value))}
                step={50000}
                className="h-8 text-xs font-bold font-mono text-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Section 80C Deductions (Old Regime)</Label>
              <Input
                type="number"
                value={testOldDeductions}
                onChange={(e) => setTestOldDeductions(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">HRA Exemption Claim (Old Regime)</Label>
              <Input
                type="number"
                value={testHraExemption}
                onChange={(e) => setTestHraExemption(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Results Side-by-Side Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">New Regime (115BAC)</span>
                {comparison.recommendedRegime === 'NEW' && (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Recommended</Badge>
                )}
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                ₹{comparison.newTotalTax.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ year</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly TDS: <span className="font-bold text-foreground font-mono">₹{comparison.newMonthlyTds.toLocaleString('en-IN')}</span> • Taxable: ₹{comparison.newTaxableIncome.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Old Tax Regime</span>
                {comparison.recommendedRegime === 'OLD' && (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Recommended</Badge>
                )}
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                ₹{comparison.oldTotalTax.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ year</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly TDS: <span className="font-bold text-foreground font-mono">₹{comparison.oldMonthlyTds.toLocaleString('en-IN')}</span> • Taxable: ₹{comparison.oldTaxableIncome.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Recommendation Insight:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {comparison.recommendedRegime === 'NEW'
                ? `New Regime saves ₹${comparison.diff.toLocaleString('en-IN')} annually in tax.`
                : `Old Regime saves ₹${comparison.diff.toLocaleString('en-IN')} annually with claimed 80C & HRA exemptions.`}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
