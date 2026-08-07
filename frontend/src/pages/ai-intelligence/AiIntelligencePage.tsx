import { useSearchParams } from 'react-router-dom';
import { Sparkles, Brain, Cpu, Bot, LineChart, MessageSquare, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const AI_INSIGHTS = [
  { id: 'AI-01', module: 'Recruitment AI', title: 'Resume Matching Engine', output: 'Matched 14 Candidates with 92%+ Job Requisition Fit', confidence: '98%' },
  { id: 'AI-02', module: 'Predictive HR', title: 'Flight Risk / Churn Alert', output: '2 High-Performing Engineers identified with elevated attrition probability', confidence: '89%' },
  { id: 'AI-03', module: 'Payroll AI', title: 'Anomaly Audit Scanner', output: '0 Fraudulent Overtime / Duplicate Account Anomalies Detected', confidence: '99.9%' },
];

const CANDIDATE_MATCHES = [
  { candidate: 'Rohan Deshpande', role: 'Senior Backend Engineer', score: '96%', status: 'SHORTLISTED' },
  { candidate: 'Ananya Krishnan', role: 'HR Business Partner', score: '93%', status: 'SHORTLISTED' },
  { candidate: 'Farhan Sheikh', role: 'DevOps Engineer', score: '88%', status: 'UNDER_REVIEW' },
  { candidate: 'Meera Nair', role: 'Talent Acquisition Lead', score: '81%', status: 'UNDER_REVIEW' },
];

const PAYROLL_AUDITS = [
  { check: 'Duplicate Bank Account Detection', scanned: '148 Employees', anomalies: 0, status: 'PASSED' },
  { check: 'Overtime Hours Outlier Detection', scanned: '148 Employees', anomalies: 2, status: 'NEEDS_ATTENTION' },
  { check: 'Statutory Deduction Cross-Check', scanned: '148 Employees', anomalies: 0, status: 'PASSED' },
  { check: 'Ghost Employee Pattern Scan', scanned: '148 Employees', anomalies: 0, status: 'PASSED' },
];

const ATTRITION_WATCHLIST = [
  { employee: 'Karan Mehta', dept: 'Engineering', risk: '82%', factor: 'Below-market compensation band', status: 'CRITICAL' },
  { employee: 'Divya Menon', dept: 'Sales', risk: '74%', factor: 'No promotion in 3+ years', status: 'NEEDS_ATTENTION' },
  { employee: 'Suresh Iyer', dept: 'Operations', risk: '61%', factor: 'Declining engagement survey score', status: 'NEEDS_ATTENTION' },
];

export default function AiIntelligencePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title="AI Center & Predictive Intelligence"
        description="Automated resume parsing, predictive turnover risk models, automated payroll fraud audits & AI conversational assistant"
        badge="Gemini 1.5 Flash Model Active"
        badgeVariant="success"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Trigger AI Diagnostic Run
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Brain} label="AI Resume Matching Accuracy" value="94.8%" hint="128 Resumes Scanned" accent="primary" />
        <StatCard icon={LineChart} label="Predictive Churn Model" value="89% Precision" hint="Early Retention Warnings" accent="success" />
        <StatCard icon={Bot} label="AI HR Bot Queries Answered" value="1,420 Prompts" hint="Zero HR Ticket Escalation" accent="info" />
        <StatCard icon={Cpu} label="Payroll Audit Anomaly Check" value="Clean Audit" hint="Automated Compliance Guard" accent="warning" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">AI Dashboard</TabsTrigger>
          <TabsTrigger value="recruitment-ai" className="text-xs px-3 py-1.5">Recruitment AI</TabsTrigger>
          <TabsTrigger value="attendance-ai" className="text-xs px-3 py-1.5">Attendance AI</TabsTrigger>
          <TabsTrigger value="payroll-ai" className="text-xs px-3 py-1.5">Payroll AI Audit</TabsTrigger>
          <TabsTrigger value="hr-assistant" className="text-xs px-3 py-1.5">Conversational Bot</TabsTrigger>
          <TabsTrigger value="predictive" className="text-xs px-3 py-1.5">Predictive Churn</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {AI_INSIGHTS.map((item) => (
              <Card key={item.id} className="shadow-2xs border">
                <CardHeader className="pb-2">
                  <Badge variant="info" className="text-[10px] w-fit mb-1">
                    {item.module}
                  </Badge>
                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3">
                  <p className="text-foreground font-medium">{item.output}</p>
                  <div className="flex items-center justify-between text-muted-foreground border-t pt-2">
                    <span>Model Confidence:</span>
                    <span className="font-semibold text-primary">{item.confidence}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recruitment-ai" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">AI Resume Matching Results</CardTitle>
              <CardDescription>Candidates ranked by job requisition fit score</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Candidate</TableHead>
                    <TableHead className="text-xs">Applied Role</TableHead>
                    <TableHead className="text-xs">Match Score</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CANDIDATE_MATCHES.map((c) => (
                    <TableRow key={c.candidate}>
                      <TableCell className="text-xs font-medium">{c.candidate}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.role}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">{c.score}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={c.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance-ai" className="mt-4">
          <EmptyState
            icon={Cpu}
            title="Attendance Anomaly Detection"
            description="AI-powered biometric anomaly detection for buddy-punching, geofence violations and irregular shift patterns."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="payroll-ai" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payroll Fraud & Anomaly Audit</CardTitle>
              <CardDescription>Automated compliance scans run before every payroll cycle</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Audit Check</TableHead>
                    <TableHead className="text-xs">Employees Scanned</TableHead>
                    <TableHead className="text-xs">Anomalies Found</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PAYROLL_AUDITS.map((p) => (
                    <TableRow key={p.check}>
                      <TableCell className="text-xs font-medium">{p.check}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.scanned}</TableCell>
                      <TableCell className="text-xs font-mono">{p.anomalies}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={p.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr-assistant" className="mt-4">
          <EmptyState
            icon={MessageSquare}
            title="Conversational HR Assistant"
            description="Chat-based AI assistant that answers employee HR, payroll and policy queries in natural language."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="predictive" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Attrition Risk Watchlist</CardTitle>
              <CardDescription>Employees flagged by the predictive churn model for proactive retention action</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-xs">Risk Score</TableHead>
                    <TableHead className="text-xs">Key Factor</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ATTRITION_WATCHLIST.map((w) => (
                    <TableRow key={w.employee}>
                      <TableCell className="text-xs font-medium">{w.employee}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.dept}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-destructive" /> {w.risk}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{w.factor}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={w.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
