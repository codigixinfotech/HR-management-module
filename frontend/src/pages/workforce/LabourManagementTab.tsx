import { HardHat, ShieldCheck, FileSpreadsheet, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import type { Company } from '@/api/types';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';

const STATUTORY_REGISTERS = [
  { form: 'Form XVI (Muster Roll)', law: 'Contract Labour (R&A) Act, 1970', frequency: 'Monthly', status: 'COMPLIANT', records: '64 Workers', branch: 'Pune Manufacturing Plant' },
  { form: 'Form XVII (Register of Wages)', law: 'Payment of Wages Act, 1936', frequency: 'Monthly', status: 'COMPLIANT', records: '₹9,84,000 Disbursed', branch: 'Pune Manufacturing Plant' },
  { form: 'Form XIX (Wage Slip Issuance)', law: 'Minimum Wages Act, 1948', frequency: 'Monthly', status: 'VERIFIED', records: '100% Digital Slips', branch: 'Head Office' },
  { form: 'Form XX (Deduction & Fines)', law: 'Statutory Welfare Board', frequency: 'Quarterly', status: 'ZERO_DEFICIT', records: 'Nil Deductions', branch: 'Head Office' },
  { form: 'Form XXIII (Overtime Register)', law: 'Factories Act, 1948 (Sec 59)', frequency: 'Weekly', status: 'AUDITED', records: '38 OT Hours Logged', branch: 'Pune Manufacturing Plant' },
  { form: 'Form A (Annual Return)', law: 'National Shops & Establishments Act', frequency: 'Annual', status: 'COMPLIANT', records: '128 Personnel', branch: 'Head Office' },
];

export function LabourManagementTab({ companyId, companies }: { companyId?: string; companies?: Company[] }) {
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    isBranchAdmin,
    isSuperOrCompanyAdmin,
    assignedBranchName,
    matchBranch,
  } = useWorkforceBranch();

  const handleExport = (formName: string) => {
    toast.success(`Exporting statutory record: ${formName}`);
  };

  const filteredRegisters = STATUTORY_REGISTERS.filter((r) =>
    matchBranch({
      branchName: r.branch,
      location: r.branch,
    })
  );

  return (
    <div className="space-y-6">
      {/* Statutory Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-2xs border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Wage Parity</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">100% Minimum Wage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All contractual & permanent shop floor cadres meet state industrial minimum wage rates.</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Statutory Licenses</span>
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">CLRA Form V Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Principal Employer registration certificate valid with licensed contractor headcount quota.</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Overtime Limits</span>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Factories Act Cap 50h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Daily overtime capped strictly at 2h/day with double standard wage rate compensation.</p>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Muster & Labour Register Table */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-semibold">Statutory Blue-Collar Labour Registers & Compliance</CardTitle>
            </div>
            <CardDescription>
              Blue-collar workforce attendance, wage compliance and statutory labour records
            </CardDescription>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Branch Filter (Matching Employee Master Page) */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
            />

            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs shrink-0">
              100% Audit Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Statutory Form & Register</TableHead>
                  <TableHead className="text-xs">Governing Labour Act</TableHead>
                  <TableHead className="text-xs">Filing Cycle</TableHead>
                  <TableHead className="text-xs">Current Records</TableHead>
                  <TableHead className="text-xs">Compliance State</TableHead>
                  <TableHead className="text-xs text-right">Export Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegisters.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.form}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.law}</TableCell>
                    <TableCell className="text-xs font-mono">{r.frequency}</TableCell>
                    <TableCell className="text-xs font-medium text-foreground">{r.records}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold border-none">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExport(r.form)}
                        className="h-7 text-xs gap-1"
                      >
                        <Download className="h-3 w-3" /> Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
