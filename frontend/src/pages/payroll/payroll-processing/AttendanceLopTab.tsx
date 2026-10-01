import { useState } from 'react';
import {
  Clock,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  RefreshCw,
  Percent,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { AttendanceLopRecord } from './types';

interface AttendanceLopTabProps {
  attendanceRecords: AttendanceLopRecord[];
  onUpdateRecords: (records: AttendanceLopRecord[]) => void;
}

export function AttendanceLopTab({ attendanceRecords, onUpdateRecords }: AttendanceLopTabProps) {
  const [syncSource, setSyncSource] = useState<'AUTO_ATTENDANCE' | 'MANUAL_EXCEL'>('AUTO_ATTENDANCE');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLopChange = (recordId: string, newLop: number) => {
    const updated = attendanceRecords.map((r) => {
      if (r.id === recordId) {
        const lop = Math.max(0, Math.min(r.totalCalendarDays, newLop));
        const payableDays = Math.max(0, r.totalCalendarDays - lop);
        const proRataFactor = Math.round((payableDays / r.totalCalendarDays) * 1000) / 1000;
        return {
          ...r,
          lopDays: lop,
          payableDays,
          proRataFactor,
        };
      }
      return r;
    });

    onUpdateRecords(updated);
    toast.success('LOP days updated. Pro-rata wage factors recalculated.');
  };

  const handleSyncAttendance = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Synced live biometric attendance and approved leave balances for September 2026.');
    }, 600);
  };

  const totalLopDays = attendanceRecords.reduce((sum, r) => sum + r.lopDays, 0);

  return (
    <div className="space-y-4">
      {/* ── SYNC CONTROLS BAR ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Attendance & Loss of Pay (LOP) Configuration</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pro-rata salary computations directly depend on Payable Days (Total Days - LOP Days).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Select value={syncSource} onValueChange={(val: any) => setSyncSource(val)}>
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO_ATTENDANCE">Auto-Sync Attendance Module</SelectItem>
                <SelectItem value="MANUAL_EXCEL">Manual Entry & Excel Input</SelectItem>
              </SelectContent>
            </Select>

            {syncSource === 'AUTO_ATTENDANCE' ? (
              <Button
                size="sm"
                onClick={handleSyncAttendance}
                disabled={isSyncing}
                className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Biometrics
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Excel template downloaded: ehcm_lop_register.xlsx')}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Upload LOP Sheet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── ATTENDANCE / LOP TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold text-foreground">September 2026 Working Days Register</CardTitle>
            <CardDescription className="text-[11px]">
              Total calendar days: 30 • Total LOP deduction days flagged: {totalLopDays} days
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300">
            {attendanceRecords.length} Active Records
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Employee</TableHead>
                <TableHead className="text-xs font-bold">Department</TableHead>
                <TableHead className="text-center text-xs font-bold">Calendar Days</TableHead>
                <TableHead className="text-center text-xs font-bold">Present</TableHead>
                <TableHead className="text-center text-xs font-bold">Paid Leave</TableHead>
                <TableHead className="text-center text-xs font-bold">Loss of Pay (LOP)</TableHead>
                <TableHead className="text-center text-xs font-bold">Payable Days</TableHead>
                <TableHead className="text-center text-xs font-bold">Pro-Rata Factor</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20">
                  <TableCell className="pl-6">
                    <div className="font-semibold text-xs text-foreground">{r.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{r.employeeCode}</div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">{r.department}</TableCell>

                  <TableCell className="text-center font-mono text-xs">{r.totalCalendarDays}</TableCell>

                  <TableCell className="text-center font-mono text-xs text-emerald-600 font-semibold">
                    {r.presentDays}
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs text-blue-600">{r.paidLeaves}</TableCell>

                  {/* LOP Editable Cell */}
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center">
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={r.lopDays}
                        onChange={(e) => handleLopChange(r.id, Number(e.target.value))}
                        className={`h-7 w-16 text-center text-xs font-mono font-bold ${
                          r.lopDays > 0 ? 'text-rose-600 border-rose-300 bg-rose-50/50' : 'text-foreground'
                        }`}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                    {r.payableDays}
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs font-semibold text-indigo-600">
                    {(r.proRataFactor * 100).toFixed(1)}%
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-300 text-[10px] font-semibold">
                      Finalized
                    </Badge>
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
