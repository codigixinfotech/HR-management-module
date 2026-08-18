import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { tasksApi } from '@/api/tasks';

export function TaskReportsTab() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks-reports'],
    queryFn: () => tasksApi.list({ search: '' }),
  });

  const reportMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REOPENED').length;
    const assigned = tasks.filter((t) => t.status === 'ASSIGNED').length;
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'CLOSED').length;

    let totalEstimated = 0;
    let totalActual = 0;

    tasks.forEach((t) => {
      totalEstimated += t.estimatedHours || 0;
      totalActual += t.actualHours || 0;
    });

    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const efficiencyPct = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 100;

    return { total, completed, inProgress, assigned, overdue, totalEstimated, totalActual, completionPct, efficiencyPct };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Task Completion Rate</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{reportMetrics.completionPct}%</h3>
          <Progress value={reportMetrics.completionPct} className="h-1.5 mt-2" />
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Estimated vs Actual Hours</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{reportMetrics.totalActual}h / {reportMetrics.totalEstimated}h</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Efficiency Ratio: {reportMetrics.efficiencyPct}%</p>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Active Tasks</p>
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{reportMetrics.inProgress} In Progress</h3>
          <p className="text-[11px] text-muted-foreground mt-1">{reportMetrics.assigned} Assigned Pending</p>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Overdue Analysis</p>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{reportMetrics.overdue} Tasks Overdue</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Action Needed for On-time Delivery</p>
        </Card>
      </div>

      {/* Task Performance Table */}
      <Card className="border border-border/60 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Employee Work Allocation & Performance Analytics
          </CardTitle>
          <CardDescription className="text-xs">
            Breakdown of task delivery, actual hours logged, and completion percentages.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Est. Hours</th>
                  <th className="py-3 px-4">Actual Hours</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{t.taskCode}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{t.title}</td>
                    <td className="py-3 px-4">
                      {t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 font-mono">{t.estimatedHours || 0}h</td>
                    <td className="py-3 px-4 font-mono">{t.actualHours || 0}h</td>
                    <td className="py-3 px-4 w-28">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold">{t.progress}%</span>
                        <Progress value={t.progress} className="h-1.5" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
