import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LmsReportsTab() {
  const [dateRange, setDateRange] = useState('Q3-2026');
  const [deptFilter, setDeptFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const reportPresets = [
    { title: 'Training Completion Report', desc: 'Detailed program completion rates across departments & teams.' },
    { title: 'Employee Training History Report', desc: 'Complete training record, enrolled courses, and credits per employee.' },
    { title: 'Attendance & Batch Register Report', desc: 'Session-wise attendance logs, present/absent counts, and room capacity.' },
    { title: 'Assessment & Quiz Marks Report', desc: 'Test scores, pass/fail ratios, retake logs, and question difficulty analytics.' },
    { title: 'Certification & Credentials Register', desc: 'Verifiable certificate issuance ledger with expiration audit dates.' },
    { title: 'Skill Gap & Competency Matrix Report', desc: 'Employee proficiency level benchmarks vs role target levels.' },
    { title: 'Department Training Budget & Hours Report', desc: 'Training hours delivered and L&D cost utilization per department.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> LMS Reports & Executive Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-functional learning metrics, department compliance scores, assessment pass rates, and report exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export Excel
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Download className="h-3.5 w-3.5" /> Export PDF Summary
          </Button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">Total Programs</span>
            <span className="text-2xl font-extrabold text-foreground">24</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">Active Enrollments</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">149</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Completion Rate</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">89%</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Certificates Issued</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">312</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="text-xs h-8 w-[140px] bg-background">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q3-2026">Q3 2026 (Current)</SelectItem>
              <SelectItem value="Q2-2026">Q2 2026</SelectItem>
              <SelectItem value="FY-2026">Full Year 2026</SelectItem>
            </SelectContent>
          </Select>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="text-xs h-8 w-[140px] bg-background">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
              <SelectItem value="QA">QA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="text-xs h-8 w-[140px] bg-background">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Locations</SelectItem>
              <SelectItem value="Plant A">Plant A</SelectItem>
              <SelectItem value="Plant B">Plant B</SelectItem>
              <SelectItem value="HQ Tech Park">HQ Tech Park</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Completion */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Training Completion</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">89%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={89} className="h-3 bg-muted" />
            <p className="text-[11px] text-muted-foreground">
              133 out of 149 active enrolled employees have completed all mandatory course modules.
            </p>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card className="shadow-2xs md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Department Compliance Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>QA Department</span>
                <span className="font-mono">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>HR & Compliance</span>
                <span className="font-mono">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>IT & Engineering</span>
                <span className="font-mono">86%</span>
              </div>
              <Progress value={86} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Production & Manufacturing</span>
                <span className="font-mono">81%</span>
              </div>
              <Progress value={81} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloadable Reports Presets */}
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Downloadable LMS Reports Ledger</CardTitle>
          <CardDescription className="text-xs">Generate instant Excel audit sheets or PDF executive summaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportPresets.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-card text-xs hover:border-primary/40 transition-colors">
                <div className="space-y-0.5 max-w-sm">
                  <p className="font-semibold text-foreground">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                    <Download className="h-3 w-3" /> Excel
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] gap-1 bg-primary text-primary-foreground">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
