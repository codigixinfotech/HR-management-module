import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { PreRunCheckItem } from './types';

interface PreRunChecklistTabProps {
  checklist: PreRunCheckItem[];
  onResolveCheck: (checkId: string) => void;
  onGoToStructure: () => void;
}

export function PreRunChecklistTab({ checklist, onResolveCheck, onGoToStructure }: PreRunChecklistTabProps) {
  const [selectedCheck, setSelectedCheck] = useState<PreRunCheckItem | null>(null);

  const criticalIssues = checklist.filter((c) => c.severity === 'CRITICAL' && !c.isResolved);
  const warningIssues = checklist.filter((c) => c.severity === 'WARNING' && !c.isResolved);
  const isReadyToProcess = criticalIssues.length === 0;

  return (
    <div className="space-y-4">
      {/* ── OVERALL READINESS STATUS CARD ── */}
      <Card
        className={`border-2 shadow-2xs ${
          isReadyToProcess
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
        }`}
      >
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                isReadyToProcess
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'
              }`}
            >
              {isReadyToProcess ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground">
                {isReadyToProcess
                  ? 'Pre-Run Diagnostics Passed: Ready for Payroll Calculation'
                  : `Attention Required: ${criticalIssues.length} Critical Issue(s) Block Payroll Calculation`}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isReadyToProcess
                  ? 'All mandatory employee compensation profiles, statutory tags, and attendance inputs are validated.'
                  : 'Resolve missing salary templates and statutory details before triggering calculations.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadyToProcess && (
              <Button
                size="sm"
                onClick={onGoToStructure}
                className="text-xs font-semibold h-8 bg-rose-600 hover:bg-rose-700 text-white gap-1"
              >
                Resolve Missing Salaries <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── DIAGNOSTICS CHECKLIST TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold text-foreground">Pre-Calculation Diagnostics Matrix</CardTitle>
            <CardDescription className="text-[11px]">
              Automated scans across HR master records, bank credentials, PAN cards, and attendance synchronization.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-300">
              {criticalIssues.length} Critical
            </Badge>
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
              {warningIssues.length} Warnings
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Severity</TableHead>
                <TableHead className="text-xs font-bold">Category</TableHead>
                <TableHead className="text-xs font-bold">Diagnostic Item</TableHead>
                <TableHead className="text-center text-xs font-bold">Affected Count</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checklist.map((item) => {
                const isCritical = item.severity === 'CRITICAL';
                const isWarning = item.severity === 'WARNING';

                return (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isCritical
                            ? 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40'
                            : isWarning
                              ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40'
                              : 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40'
                        }`}
                      >
                        {item.severity}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-mono font-medium text-muted-foreground">
                      {item.category}
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground">{item.description}</div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-bold">
                      {item.affectedCount > 0 ? (
                        <span className="text-rose-600">{item.affectedCount} Employees</span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {item.isResolved || item.affectedCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                          <AlertTriangle className="h-3.5 w-3.5" /> Action Needed
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      {item.affectedCount > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCheck(item)}
                          className="h-7 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          Inspect Affected Staff
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Action</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── INSPECT AFFECTED EMPLOYEES MODAL ── */}
      <Dialog open={Boolean(selectedCheck)} onOpenChange={() => setSelectedCheck(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {selectedCheck?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">{selectedCheck?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold pl-4">Employee</TableHead>
                    <TableHead className="text-xs font-bold pr-4">Diagnostic Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCheck?.affectedEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="pl-4">
                        <div className="font-semibold text-xs text-foreground">{emp.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{emp.code}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-rose-600 pr-4">{emp.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setSelectedCheck(null)} className="text-xs">
              Close
            </Button>
            {selectedCheck?.category === 'SALARY' && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedCheck(null);
                  onGoToStructure();
                }}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Go to Salary Structure Tab ↗
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
