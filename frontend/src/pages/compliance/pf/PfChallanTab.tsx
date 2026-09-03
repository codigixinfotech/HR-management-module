import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileCheck,
  Building2,
  AlertTriangle,
  Download,
  Plus,
  Eye,
  IndianRupee,
  Loader2,
  FileText,
} from 'lucide-react';
import type { PfTabType } from './PfSubNav';
import { apiClient } from '@/lib/api-client';

export interface PfChallanTabProps {
  selectedPeriod: string;
  selectedCompany?: string;
  onNavigateTab: (tab: PfTabType) => void;
}

export interface ChallanRecord {
  period: string;
  internalChallanId: string;
  trrnNumber: string;
  epfAmount: number;
  epsAmount: number;
  edliAmount: number;
  adminAmount: number;
  totalAmount: number;
  dueDate: string;
  paymentDate: string | null;
  paymentRef: string | null;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export function PfChallanTab({ selectedPeriod, selectedCompany, onNavigateTab }: PfChallanTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trrnInput, setTrrnInput] = useState('1012409123456');
  const [utrInput, setUtrInput] = useState('HDFCN26245123456');
  const [paymentDateInput, setPaymentDateInput] = useState('2026-09-01');
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [pfRunId, setPfRunId] = useState<string>('');

  const [challanList, setChallanList] = useState<ChallanRecord[]>([
    {
      period: 'Sep 2026',
      internalChallanId: 'PFC-2026-09-001',
      trrnNumber: '1012409123456',
      epfAmount: 214680,
      epsAmount: 114122,
      edliAmount: 6850,
      adminAmount: 6850,
      totalAmount: 336327,
      dueDate: '2026-09-15',
      paymentDate: '2026-09-01',
      paymentRef: 'HDFCN26245123456',
      status: 'PAID',
    },
  ]);

  useEffect(() => {
    const fetchRunData = async () => {
      try {
        const res = await apiClient.get('/compliance/pf/dashboard', {
          params: { period: selectedPeriod, companyId: selectedCompany || '' },
        });
        if (res.data?.run) {
          const run = res.data.run;
          setPfRunId(run.id);
          if (run.totalLiability) {
            const tot = run.totalLiability;
            const ee = run.totalEePf || Math.round(tot * 0.488);
            const erEpf = run.totalErEpf || Math.round(tot * 0.149);
            const erEps = run.totalErEps || Math.round(tot * 0.339);
            const edli = Math.round(run.totalEdli || tot * 0.012);
            const admin = Math.round(run.totalAdminCharge || tot * 0.012);

            setChallanList((prev) =>
              prev.map((c, i) =>
                i === 0
                  ? {
                      ...c,
                      epfAmount: ee + erEpf,
                      epsAmount: erEps,
                      edliAmount: edli,
                      adminAmount: admin,
                      totalAmount: tot,
                    }
                  : c
              )
            );
          }
        }
      } catch (e) {
        console.warn('Dashboard run fetch failed', e);
      }
    };
    fetchRunData();
  }, [selectedPeriod, selectedCompany]);

  const handleRecordPayment = async () => {
    setIsSavingPayment(true);
    try {
      if (pfRunId) {
        // Record TRRN
        const trrnRes = await apiClient.post('/compliance/pf/runs/challan', {
          pfRunId,
          trrnNumber: trrnInput,
        });

        // Record Bank Payment UTR
        if (trrnRes.data?.id) {
          await apiClient.post('/compliance/pf/runs/payment', {
            pfChallanId: trrnRes.data.id,
            utrNumber: utrInput,
            paidAmount: 409600,
            paymentDate: paymentDateInput,
            bankName: 'HDFC Bank',
          });
        }
      }

      // Add record to UI
      const newRecord: ChallanRecord = {
        period: selectedPeriod,
        internalChallanId: `PFC-${selectedPeriod}-001`,
        trrnNumber: trrnInput,
        epfAmount: 230400,
        epsAmount: 160000,
        edliAmount: 9600,
        adminAmount: 9600,
        totalAmount: 409600,
        dueDate: `${selectedPeriod}-15`,
        paymentDate: paymentDateInput,
        paymentRef: utrInput,
        status: 'PAID',
      };

      setChallanList([newRecord, ...challanList]);
      setIsModalOpen(false);
    } catch (e) {
      console.warn('Failed to record payment on backend', e);
      setIsModalOpen(false);
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── CHALLAN WORKFLOW HEADER ── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" /> Statutory PF Challan & Payment Management
              </CardTitle>
              <CardDescription className="text-xs">
                Manage internal Challan IDs (`PFC-2026-09-001`), official EPFO TRRN entry, and bank payment UTR tracking
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('ecr')}
                className="h-8 text-xs font-bold gap-1 cursor-pointer"
              >
                ← Back to ECR Page
              </Button>

              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Log Official TRRN & Bank UTR
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Internal vs External References Notice */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-extrabold text-foreground">Official Government Reference Entry Rule</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ERP generates internal IDs (`PFC-2026-09-001`). Official 13-digit TRRN & Bank UTR are entered manually from the EPFO portal & bank receipt.
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-mono text-[10.5px]">
              Internal Challan: PFC-2026-09-001
            </Badge>
          </div>

          {/* Challan Pipeline Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>1. ECR Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">ECR-2026-09-001</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>2. Official TRRN Entry</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-mono font-bold text-foreground">1012409123456</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>3. Statutory Due Date</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-mono font-bold text-foreground">15th Sep 2026</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>4. Bank UTR Entry</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-mono font-medium text-foreground">HDFCN26245123456</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>5. Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ PAID & Verified</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CHALLANS TABLE ── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">EPFO Challan & Bank Payment Register</CardTitle>
              <CardDescription className="text-xs">
                Internal Challan IDs, official EPFO TRRN numbers, statutory due dates, and bank transaction UTR numbers
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateTab('reconciliation')}
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              Go to Reconciliation <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4 font-mono">Internal Challan ID</th>
                  <th className="py-3.5 px-4 font-mono">Official TRRN (EPFO)</th>
                  <th className="py-3.5 px-4 text-right">EPF Contribution</th>
                  <th className="py-3.5 px-4 text-right">EPS Contribution</th>
                  <th className="py-3.5 px-4 text-right">EDLI & Admin</th>
                  <th className="py-3.5 px-4 text-right">Total Challan Amount</th>
                  <th className="py-3.5 px-4 font-mono">Payment UTR (Bank)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {challanList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground font-mono">{row.period}</td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground font-semibold">
                      {row.internalChallanId}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {row.trrnNumber}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                      ₹{row.epfAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                      ₹{row.epsAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                      ₹{(row.edliAmount + row.adminAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{row.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-foreground font-bold">
                      {row.paymentRef || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10.5px]">
                        ✓ Paid & Logged
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── LOG OFFICIAL TRRN & BANK UTR MODAL ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-amber-950/20 via-background to-purple-950/20">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" /> Log Official TRRN & Bank UTR Payment
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-1">
              <span className="font-bold text-purple-900 dark:text-purple-200">Internal Reference</span>
              <p className="font-mono text-purple-700 dark:text-purple-300 font-bold">Internal Challan ID: PFC-{selectedPeriod}-001</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">
                Official TRRN (From EPFO Unified Portal) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={trrnInput}
                onChange={(e) => setTrrnInput(e.target.value)}
                placeholder="e.g. 1012409123456"
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground">Enter 13-digit TRRN issued by EPFO portal after ECR upload</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">
                Bank Payment UTR Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="e.g. HDFCN26245123456"
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground">Enter unique UTR reference from bank net banking receipt</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Payment Date</label>
              <input
                type="date"
                value={paymentDateInput}
                onChange={(e) => setPaymentDateInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-bold text-xs"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20">
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)} className="font-semibold">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRecordPayment}
              disabled={isSavingPayment}
              className="font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              {isSavingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {isSavingPayment ? 'Recording...' : 'Record TRRN & Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
