import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  CheckSquare,
  ListTodo,
  TrendingUp,
  UserCheck,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { tasksApi } from '@/api/tasks';

interface TaskDashboardTabProps {
  onSelectTab: (tab: string) => void;
}

export function TaskDashboardTab({ onSelectTab }: TaskDashboardTabProps) {
  const { data: summary } = useQuery({
    queryKey: ['task-summary'],
    queryFn: () => tasksApi.getSummary(),
  });

  const { data: recentTasks = [] } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => tasksApi.list({ search: '' }),
  });

  const stats = useMemo(() => {
    const total = summary?.total || recentTasks.length;
    const assigned = summary?.assigned || recentTasks.filter((t) => t.status === 'ASSIGNED').length;
    const inProgress = summary?.inProgress || recentTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REOPENED').length;
    const completed = summary?.completed || recentTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
    const dueToday = summary?.dueToday || 0;
    const overdue = summary?.overdue || 0;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, assigned, inProgress, completed, dueToday, overdue, completionRate };
  }, [summary, recentTasks]);

  const priorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300">Medium</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">Low</Badge>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CLOSED':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300">Closed</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-300">Completed (Awaiting Review)</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300">In Progress</Badge>;
      case 'REOPENED':
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300">Reopened</Badge>;
      case 'ON_HOLD':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300">On Hold</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">Assigned</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60 bg-card/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Assigned Tasks</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckSquare className="h-3 w-3 text-primary" /> Active System Roster
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ListTodo className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <h3 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.inProgress}</h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" /> Active Employee Work
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Completed / Closed</p>
              <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.completed}</h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {stats.completionRate}% Completion Rate
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Due Today / Overdue</p>
              <h3 className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.dueToday} <span className="text-xs text-rose-500 font-normal">({stats.overdue} overdue)</span>
              </h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> Requires Attention
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          onClick={() => onSelectTab('my-tasks')}
          className="border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> My Assigned Tasks Dashboard
              </h4>
              <p className="text-xs text-muted-foreground">
                View assigned tasks, update progress %, log actual hours, and submit completions.
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </CardContent>
        </Card>

        <Card
          onClick={() => onSelectTab('all-tasks')}
          className="border border-border/60 bg-card/50 hover:bg-muted/30 transition-all cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> All Tasks & Task Allocation (Manager View)
              </h4>
              <p className="text-xs text-muted-foreground">
                Create new tasks, search employees, set priority/due dates, and approve completed work.
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks List */}
      <Card className="border border-border/60 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" /> Recent Task Allocations & Status
          </CardTitle>
          <CardDescription className="text-xs">
            Live stream of employee tasks across departments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {recentTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-primary">{task.taskCode}</span>
                    <h5 className="text-xs font-semibold text-foreground truncate">{task.title}</h5>
                    {priorityBadge(task.priority)}
                    {statusBadge(task.status)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span>
                      <strong>Assigned To:</strong> {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                    </span>
                    <span>
                      <strong>Department:</strong> {task.departmentName || 'General'}
                    </span>
                    <span>
                      <strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="w-32 space-y-1 text-right">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Progress</span>
                    <strong className="text-foreground">{task.progress}%</strong>
                  </div>
                  <Progress value={task.progress} className="h-1.5" />
                </div>
              </div>
            ))}

            {recentTasks.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active tasks found in the system. Click <strong>All Tasks</strong> to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
