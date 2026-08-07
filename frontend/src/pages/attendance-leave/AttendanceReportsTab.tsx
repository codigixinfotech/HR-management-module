import { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  FileDown,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DeptAttendance {
  dept: string;
  totalPersonnel: number;
  presentToday: number;
  absentToday: number;
  rate: string;
}

const DEPT_ATTENDANCE: DeptAttendance[] = [
  { dept: 'Engineering', totalPersonnel: 45, presentToday: 42, absentToday: 3, rate: '93.3%' },
  { dept: 'Operations & Plant', totalPersonnel: 60, presentToday: 58, absentToday: 2, rate: '96.6%' },
  { dept: 'Human Resources', totalPersonnel: 12, presentToday: 11, absentToday: 1, rate: '91.6%' },
  { dept: 'Customer Support', totalPersonnel: 25, presentToday: 23, absentToday: 2, rate: '92.0%' },
];

export function AttendanceReportsTab() {
  const [reports] = useState<DeptAttendance[]>(DEPT_ATTENDANCE);

  const handleExportPDF = () => {
    toast.success('Compiling monthly muster attendance analytics... Downloading PDF report...');
  };

  const handleExportCSV = () => {
    toast.success('Attendance records and overtime splits exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Attendance Telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Present Rate (Month)</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">94.6%</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Excellent workforce stability</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Late Arrival</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">6 Mins</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Under threshold (15 mins)</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overtime Approved</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">38 Hours</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Weekends & holiday shifts</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled rosters</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">4 Shift types</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Continuous operations</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Department Attendance Summary ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Department Attendance & Muster analytics
            </CardTitle>
            <CardDescription className="text-xs">
              Muster rates and absenteeism tracking logs across corporate departments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
              <FileDown className="h-3 w-3" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportPDF}>
              <FileDown className="h-3 w-3" /> PDF Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Department Name</TableHead>
                <TableHead className="text-xs">Total Headcount</TableHead>
                <TableHead className="text-xs">Present Today</TableHead>
                <TableHead className="text-xs">Absent Today</TableHead>
                <TableHead className="text-right text-xs">Muster Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(r => (
                <TableRow key={r.dept} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-semibold text-foreground">{r.dept}</TableCell>
                  <TableCell className="text-xs font-mono font-medium">{r.totalPersonnel} Staff</TableCell>
                  <TableCell className="text-xs font-mono text-emerald-600 font-semibold">+{r.presentToday}</TableCell>
                  <TableCell className="text-xs font-mono text-rose-600 font-semibold">-{r.absentToday}</TableCell>
                  <TableCell className="text-right text-xs font-mono font-semibold text-primary">{r.rate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
