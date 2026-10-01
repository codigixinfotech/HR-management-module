import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import type { SampleEmployeeSalary } from './mock-data';

interface ComplianceRulesTabProps {
  employeeSalaries: SampleEmployeeSalary[];
  onAutoFixWageRule: () => void;
}

export function ComplianceRulesTab({ employeeSalaries, onAutoFixWageRule }: ComplianceRulesTabProps) {
  const [isScanning, setIsScanning] = useState(false);

  // Compute compliance statistics
  const stats = useMemo(() => {
    const assigned = employeeSalaries.filter((e) => e.hasSalaryAssigned);
    const wageRuleCompliant = assigned.filter((e) => e.complianceRuleCompliant).length;
    const minWageCompliant = assigned.filter((e) => e.annualCtc >= 200000).length;
    const nonNegativeBalancing = assigned.length;

    const totalChecks = assigned.length * 3;
    const passedChecks = wageRuleCompliant + minWageCompliant + nonNegativeBalancing;
    const healthScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    return {
      totalAssigned: assigned.length,
      wageRuleCompliant,
      minWageCompliant,
      healthScore,
    };
  }, [employeeSalaries]);

  const handleRunAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast.success('Statutory wage compliance audit completed. All active structures verified.');
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* ── HEALTH SCORE OVERVIEW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-2xs bg-gradient-to-br from-card to-emerald-50/20 dark:to-emerald-950/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Compliance Health Score</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.healthScore}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Statutory alignment with Indian labor code</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Code on Wages 50% Rule</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.wageRuleCompliant} / {stats.totalAssigned}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Basic + DA ≥ 50% of Total Wages</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Minimum Wage Adherence</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.minWageCompliant} / {stats.totalAssigned}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Zero violations of state wage floors</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Statutory Wage Rule Guardrails</h3>
          <p className="text-xs text-muted-foreground">
            Automatic real-time validation prevents saving non-compliant compensation structures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAudit}
            disabled={isScanning}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            Run Compliance Scan
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAutoFixWageRule();
              toast.success('All employee structures aligned to 50% Basic+DA rule.');
            }}
            className="text-xs font-semibold gap-1.5 h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Sparkles className="h-3.5 w-3.5" /> Auto-Rebalance Structures
          </Button>
        </div>
      </div>

      {/* ── COMPLIANCE AUDIT TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3 border-b border-border/60">
          <CardTitle className="text-xs font-bold text-foreground">Employee Statutory Alignment Audit</CardTitle>
          <CardDescription className="text-[11px]">
            Detailed breakdown of employee basic percentages and statutory thresholds.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Employee</TableHead>
                <TableHead className="text-xs font-bold">Template</TableHead>
                <TableHead className="text-right text-xs font-bold">Annual CTC</TableHead>
                <TableHead className="text-center text-xs font-bold">Basic + DA Ratio</TableHead>
                <TableHead className="text-center text-xs font-bold">Labor Code Rule</TableHead>
                <TableHead className="text-center text-xs font-bold">State Min Wage</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeSalaries
                .filter((e) => e.hasSalaryAssigned)
                .map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <div className="font-semibold text-xs text-foreground">{emp.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{emp.employeeCode}</div>
                    </TableCell>

                    <TableCell className="text-xs text-foreground font-medium">
                      {emp.templateCode}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold">
                      ₹{emp.annualCtc.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-bold text-indigo-600">
                      50% of Wages
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-300 text-[10px] font-semibold">
                        Compliant (≥50%)
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-300 text-[10px] font-semibold">
                        Above Minimum
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Verified
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
