import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ClipboardCheck,
  Clock,
  Coins,
  FileText,
  UserMinus,
  Wallet,
  Building,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunManagementTab } from './RunManagementTab';
import { PreRunChecklistTab } from './PreRunChecklistTab';
import { AttendanceLopTab } from './AttendanceLopTab';
import { VariableInputsTab } from './VariableInputsTab';
import { ReviewApprovalTab } from './ReviewApprovalTab';
import { FnfSettlementTab } from './FnfSettlementTab';
import {
  SAMPLE_PAYROLL_RUNS,
  SAMPLE_PRE_RUN_CHECKLIST,
  SAMPLE_ATTENDANCE_LOP,
  SAMPLE_VARIABLE_INPUTS,
  SAMPLE_REVIEW_RECORDS,
  SAMPLE_FNF_RECORDS,
} from './mock-data';
import type {
  PayrollRunItem,
  PreRunCheckItem,
  AttendanceLopRecord,
  VariableInputRecord,
  EmployeePayrollReviewRecord,
  FnfSettlementRecord,
} from './types';
import { toast } from 'sonner';

interface PayrollProcessingPageProps {
  companyId?: string;
}

export function PayrollProcessingPage({ companyId }: PayrollProcessingPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('runs');

  // Master State
  const [runs, setRuns] = useState<PayrollRunItem[]>(SAMPLE_PAYROLL_RUNS);
  const [selectedRun, setSelectedRun] = useState<PayrollRunItem>(SAMPLE_PAYROLL_RUNS[0]);
  const [checklist, setChecklist] = useState<PreRunCheckItem[]>(SAMPLE_PRE_RUN_CHECKLIST);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLopRecord[]>(SAMPLE_ATTENDANCE_LOP);
  const [variableRecords, setVariableRecords] = useState<VariableInputRecord[]>(SAMPLE_VARIABLE_INPUTS);
  const [reviewRecords, setReviewRecords] = useState<EmployeePayrollReviewRecord[]>(SAMPLE_REVIEW_RECORDS);
  const [fnfRecords, setFnfRecords] = useState<FnfSettlementRecord[]>(SAMPLE_FNF_RECORDS);

  const handleExecuteCalculation = () => {
    // Check if there are unresolved critical blockers
    const hasCritical = checklist.some((c) => c.severity === 'CRITICAL' && !c.isResolved);
    if (hasCritical) {
      toast.error('Cannot calculate payroll: critical pre-run items must be resolved first in the Pre-Run Checklist.');
      setActiveTab('checklist');
      return;
    }

    const updatedRuns = runs.map((r) => {
      if (r.id === selectedRun.id) {
        return {
          ...r,
          status: 'CALCULATED' as const,
          calculatedAt: new Date().toISOString(),
          calculatedBy: 'ppurvesh503 (Payroll Admin)',
        };
      }
      return r;
    });

    setRuns(updatedRuns);
    const updatedSelected = updatedRuns.find((r) => r.id === selectedRun.id);
    if (updatedSelected) setSelectedRun(updatedSelected);

    toast.success('Payroll calculation engine executed. Pro-rata earnings and statutory deductions updated.');
    setActiveTab('review');
  };

  const handleResolveCheck = (checkId: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === checkId ? { ...c, isResolved: true, affectedCount: 0 } : c))
    );
    toast.success('Diagnostic check resolved.');
  };

  const handleApproveRun = () => {
    const updatedRuns = runs.map((r) => {
      if (r.id === selectedRun.id) {
        return {
          ...r,
          status: 'APPROVED' as const,
          approvedAt: new Date().toISOString(),
          approvedBy: 'Finance Controller (Checker)',
        };
      }
      return r;
    });
    setRuns(updatedRuns);
    const current = updatedRuns.find((r) => r.id === selectedRun.id);
    if (current) setSelectedRun(current);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payroll <span className="text-border">/</span> Sub-Module 2
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Payroll Processing Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-stage payroll execution: calendar runs, diagnostic checklist, attendance LOP, variable pay, maker-checker sign-off, and F&F settlement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setActiveTab('runs')}
            variant="outline"
            className="text-xs font-semibold gap-1.5 h-9 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Calendar className="h-4 w-4" /> Run Lifecycle
          </Button>
          <Button
            onClick={() => setActiveTab('review')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs font-semibold text-xs gap-1.5 h-9 cursor-pointer"
          >
            <FileText className="h-4 w-4" /> Review Salary Register
          </Button>
        </div>
      </div>

      {/* ── TOP FINANCIAL METRICS CARDS ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Period Run</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{selectedRun.monthName} {selectedRun.year}</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-1">Status: {selectedRun.status}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Gross Wages</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                ₹{selectedRun.totalGross.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Headcount: {selectedRun.headcount} Staff</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Deductions</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">
                -₹{selectedRun.totalDeductions.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">PF, ESIC, PT, TDS, Loan</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Net Payout</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                ₹{selectedRun.totalNet.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Ready for Bank Transfer</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 6 OPERATIONAL WORKFLOW SUB-TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/60 flex flex-wrap max-w-full">
          <TabsTrigger value="runs" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <Calendar className="h-3.5 w-3.5" /> Payroll Runs ({runs.length})
          </TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <ClipboardCheck className="h-3.5 w-3.5" /> Pre-Run Checklist ({checklist.filter((c) => !c.isResolved).length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <Clock className="h-3.5 w-3.5" /> Attendance & LOP ({attendanceRecords.length})
          </TabsTrigger>
          <TabsTrigger value="variable" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <Coins className="h-3.5 w-3.5" /> Variable Pay & Claims
          </TabsTrigger>
          <TabsTrigger value="review" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <FileText className="h-3.5 w-3.5" /> Review & Approvals
          </TabsTrigger>
          <TabsTrigger value="fnf" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <UserMinus className="h-3.5 w-3.5" /> F&F Settlement ({fnfRecords.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Run Management */}
        <TabsContent value="runs">
          <RunManagementTab
            runs={runs}
            selectedRun={selectedRun}
            onSelectRun={setSelectedRun}
            onUpdateRuns={setRuns}
            onExecuteCalculation={handleExecuteCalculation}
            onGoToReview={() => setActiveTab('review')}
          />
        </TabsContent>

        {/* Tab 2: Pre-Run Checklist */}
        <TabsContent value="checklist">
          <PreRunChecklistTab
            checklist={checklist}
            onResolveCheck={handleResolveCheck}
            onGoToStructure={() => navigate('/payroll/structure')}
          />
        </TabsContent>

        {/* Tab 3: Attendance & LOP */}
        <TabsContent value="attendance">
          <AttendanceLopTab
            attendanceRecords={attendanceRecords}
            onUpdateRecords={setAttendanceRecords}
          />
        </TabsContent>

        {/* Tab 4: Variable Pay Inputs */}
        <TabsContent value="variable">
          <VariableInputsTab
            variableRecords={variableRecords}
            onUpdateRecords={setVariableRecords}
          />
        </TabsContent>

        {/* Tab 5: Review & Maker-Checker Approvals */}
        <TabsContent value="review">
          <ReviewApprovalTab
            reviewRecords={reviewRecords}
            onUpdateRecords={setReviewRecords}
            onApproveRun={handleApproveRun}
          />
        </TabsContent>

        {/* Tab 6: Full & Final Settlement */}
        <TabsContent value="fnf">
          <FnfSettlementTab
            fnfRecords={fnfRecords}
            onUpdateRecords={setFnfRecords}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
