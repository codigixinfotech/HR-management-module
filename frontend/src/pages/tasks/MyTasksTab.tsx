import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  Play,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Check,
  History,
  ListTodo,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { tasksApi } from '@/api/tasks';
import { employeesApi } from '@/api/employees';
import type { EmployeeTask } from '@/api/types';
import { TaskDetailModal } from './TaskDetailModal';

export function MyTasksTab() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [updateTask, setUpdateTask] = useState<EmployeeTask | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [workRemarks, setWorkRemarks] = useState('');
  const [actualHours, setActualHours] = useState('4');

  // Complete Modal state
  const [completeTask, setCompleteTask] = useState<EmployeeTask | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionAttachment, setCompletionAttachment] = useState('');

  // History Drawer State
  const [historyTask, setHistoryTask] = useState<EmployeeTask | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Task Details Modal State
  const [detailTask, setDetailTask] = useState<EmployeeTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch real employee list to select active employee persona
  const { data: employeesData } = useQuery({
    queryKey: ['employees-master-list'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeesList = useMemo(() => {
    return employeesData?.items || [];
  }, [employeesData]);

  // Determine active employee persona dynamically based on logged in user or manual selection
  const activeEmployee = useMemo(() => {
    if (selectedEmpId) {
      const found = employeesList.find((e) => e.id === selectedEmpId);
      if (found) return found;
    }
    // Match logged in user by employeeCode or code
    const empCode = (user as any)?.employeeCode || (user as any)?.code;
    if (empCode) {
      const foundByCode = employeesList.find((e) => e.employeeCode === empCode || (e as any).code === empCode);
      if (foundByCode) return foundByCode;
    }
    // Match logged in user by userId first
    const uAny = user as any;
    if (uAny?.id) {
      const foundByUserId = employeesList.find((e) => (e as any).userId === uAny.id);
      if (foundByUserId) return foundByUserId;
    }
    // Match logged in user by email
    if (user?.email) {
      const emailLower = user.email.toLowerCase();
      const foundByWorkEmail = employeesList.find(
        (e) => e.workEmail?.toLowerCase() === emailLower || (e as any).email?.toLowerCase() === emailLower,
      );
      if (foundByWorkEmail) return foundByWorkEmail;
      const foundByPersonalEmail = employeesList.find((e) => e.personalEmail?.toLowerCase() === emailLower);
      if (foundByPersonalEmail) return foundByPersonalEmail;
    }
    // Match by name
    if (uAny?.name) {
      const nameLower = uAny.name.trim().toLowerCase();
      const foundByName = employeesList.find(
        (e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(nameLower) || nameLower.includes(e.firstName.toLowerCase()),
      );
      if (foundByName) return foundByName;
    }
    return employeesList.find((e) => e.employeeCode === 'EMP-8265' || e.employeeCode === 'EMP-SANIKA') || employeesList[0] || null;
  }, [selectedEmpId, employeesList, user]);

  const activeEmployeeName = activeEmployee ? `${activeEmployee.firstName} ${activeEmployee.lastName}` : (user as any)?.name || 'Current Employee';

  // Fetch tasks assigned strictly to active employee
  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', activeEmployee?.id, activeEmployeeName],
    queryFn: () =>
      tasksApi.list({
        assignedToId: activeEmployee?.id,
        assignedToName: activeEmployee?.id ? undefined : activeEmployeeName,
      }),
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = myTasks.length;
    const pending = myTasks.filter((t) => t.status === 'ASSIGNED').length;
    const inProgress = myTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REOPENED').length;
    const completed = myTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
    const now = new Date();
    const dueToday = myTasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString() && t.status !== 'CLOSED').length;
    const overdue = myTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CLOSED').length;

    return { total, pending, inProgress, completed, dueToday, overdue };
  }, [myTasks]);

  // Filtered Tasks list
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'ALL') return myTasks;
    if (statusFilter === 'PENDING') return myTasks.filter((t) => t.status === 'ASSIGNED');
    if (statusFilter === 'IN_PROGRESS') return myTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REOPENED');
    if (statusFilter === 'COMPLETED') return myTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED');
    return myTasks;
  }, [myTasks, statusFilter]);

  // Mutations
  const startTaskMutation = useMutation({
    mutationFn: ({ id, startedBy }: { id: string; startedBy: string }) => tasksApi.startTask(id, startedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      toast.success('Task started! Status changed to IN PROGRESS.');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => tasksApi.updateProgress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      toast.success('Task progress updated successfully!');
      setIsUpdateOpen(false);
      setUpdateTask(null);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => tasksApi.completeTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      toast.success('Task marked as COMPLETED! Manager notified for review.');
      setIsCompleteOpen(false);
      setCompleteTask(null);
    },
  });

  // Handlers
  const handleStartTask = (task: EmployeeTask) => {
    startTaskMutation.mutate({
      id: task.id,
      startedBy: activeEmployeeName,
    });
  };

  const handleOpenUpdateModal = (task: EmployeeTask) => {
    setUpdateTask(task);
    setProgressVal(task.progress || 0);
    setWorkRemarks(task.completionRemarks || 'Working on requirement updates.');
    setActualHours(String(task.actualHours || 4));
    setIsUpdateOpen(true);
  };

  const handleUpdateProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTask) return;

    updateProgressMutation.mutate({
      id: updateTask.id,
      payload: {
        progress: progressVal,
        remarks: workRemarks,
        actualHours: parseFloat(actualHours) || 4,
        updatedBy: activeEmployeeName,
      },
    });
  };

  const handleOpenCompleteModal = (task: EmployeeTask) => {
    setCompleteTask(task);
    setCompletionRemarks('Completed task testing and verified workflow requirements.');
    setCompletionAttachment('workflow-test-report.pdf');
    setIsCompleteOpen(true);
  };

  const handleCompleteTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTask) return;
    if (!completionRemarks.trim()) {
      toast.error('Completion remarks are required before submitting task completion');
      return;
    }

    completeTaskMutation.mutate({
      id: completeTask.id,
      payload: {
        completionRemarks,
        actualHours: parseFloat(actualHours) || 8,
        completionAttachment,
        completedBy: activeEmployeeName,
      },
    });
  };

  const priorityBadge = (pri: string) => {
    switch (pri?.toUpperCase()) {
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

  const statusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'CLOSED':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 flex items-center gap-1"><Check className="h-3 w-3" /> Closed</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-300 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'REOPENED':
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reopened</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">Assigned</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Employee Persona Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            {activeEmployeeName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">{activeEmployeeName}</h3>
              <Badge className="bg-primary/15 text-primary text-[10px]">Logged-In Persona</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeEmployee?.designation?.title || 'Personnel'} • {activeEmployee?.department?.name || 'Operations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Active Persona Persona:</Label>
          <Select
            value={activeEmployee?.id || ''}
            onValueChange={(val) => setSelectedEmpId(val)}
          >
            <SelectTrigger className="h-9 text-xs w-[240px] bg-background">
              <SelectValue placeholder="Select Employee Persona" />
            </SelectTrigger>
            <SelectContent>
              {employeesList.map((emp) => (
                <SelectItem key={emp.id} value={emp.id} className="text-xs">
                  {emp.firstName} {emp.lastName} ({emp.department?.name || 'Employee'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards for My Tasks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">My Tasks</span>
          <strong className="text-xl font-bold text-foreground">{metrics.total}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Pending</span>
          <strong className="text-xl font-bold text-slate-600 dark:text-slate-400">{metrics.pending}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">In Progress</span>
          <strong className="text-xl font-bold text-blue-600 dark:text-blue-400">{metrics.inProgress}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Due Today</span>
          <strong className="text-xl font-bold text-amber-600 dark:text-amber-400">{metrics.dueToday}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Overdue</span>
          <strong className="text-xl font-bold text-rose-600 dark:text-rose-400">{metrics.overdue}</strong>
        </Card>

        <Card className="border border-border/60 bg-card p-3">
          <span className="text-[11px] text-muted-foreground block font-medium">Completed</span>
          <strong className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.completed}</strong>
        </Card>
      </div>

      {/* Task List & Filter */}
      <Card className="border border-border/60 bg-card">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" /> My Assigned Tasks Dashboard ({activeEmployeeName})
            </CardTitle>
            <CardDescription className="text-xs">
              Tasks assigned strictly to {activeEmployeeName}. Start work, update progress %, and submit completions.
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5 rounded-lg"
                onClick={() => setStatusFilter(st)}
              >
                {st.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{task.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {task.taskCode} • {task.description}
                      </div>
                    </td>
                    <td className="py-3 px-4">{priorityBadge(task.priority)}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 w-32">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1.5" />
                      </div>
                    </td>
                    <td className="py-3 px-4">{statusBadge(task.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Start Task Button */}
                        {task.status === 'ASSIGNED' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartTask(task)}
                            className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                          >
                            <Play className="h-3.5 w-3.5" /> Start Task
                          </Button>
                        )}

                        {/* Update Progress Button */}
                        {(task.status === 'IN_PROGRESS' || task.status === 'REOPENED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUpdateModal(task)}
                            className="h-7 text-xs gap-1"
                          >
                            <Clock className="h-3.5 w-3.5" /> Update Progress
                          </Button>
                        )}

                        {/* Mark Completed Button */}
                        {(task.status === 'IN_PROGRESS' || task.status === 'REOPENED') && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCompleteModal(task)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                          </Button>
                        )}

                        {/* View Details Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDetailTask(task);
                            setIsDetailOpen(true);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>

                        {/* View History Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setHistoryTask(task);
                            setIsHistoryOpen(true);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <History className="h-3.5 w-3.5 mr-1" /> History
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTasks.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      No tasks assigned under this filter for {activeEmployeeName}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* UPDATE PROGRESS MODAL */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Update Task Progress
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update completion percentage, log actual hours spent, and describe progress made.
            </DialogDescription>
          </DialogHeader>

          {updateTask && (
            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4 py-2">
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                <span className="text-xs font-semibold text-foreground block">{updateTask.title}</span>
                <span className="text-[11px] text-muted-foreground block">{updateTask.taskCode}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Label className="font-semibold">Progress Percentage:</Label>
                  <span className="font-bold text-primary font-mono">{progressVal}%</span>
                </div>
                <Slider
                  value={[progressVal]}
                  onValueChange={(val) => setProgressVal(val[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Actual Hours Spent (Total):</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="e.g. 6.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Accomplished / Activity Remarks:</Label>
                <Textarea
                  value={workRemarks}
                  onChange={(e) => setWorkRemarks(e.target.value)}
                  placeholder="Describe progress updates or work done..."
                  className="text-xs min-h-[80px]"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsUpdateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateProgressMutation.isPending}>
                  {updateProgressMutation.isPending ? 'Saving...' : 'Save Progress'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MARK COMPLETED MODAL */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Complete Task & Submit for Review
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm task completion, enter final actual hours logged, and provide completion remarks.
            </DialogDescription>
          </DialogHeader>

          {completeTask && (
            <form onSubmit={handleCompleteTaskSubmit} className="space-y-4 py-2">
              <div className="space-y-2 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">{completeTask.title}</span>
                <span className="text-[11px] text-muted-foreground block">{completeTask.taskCode} • Target Progress: 100%</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Final Actual Hours Logged *:</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Completion Summary Remarks *:</Label>
                <Textarea
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  placeholder="Summarize deliverables, test outputs, or results achieved..."
                  className="text-xs min-h-[90px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Supporting File / Document Link:</Label>
                <Input
                  type="text"
                  value={completionAttachment}
                  onChange={(e) => setCompletionAttachment(e.target.value)}
                  placeholder="e.g. documentation-link.pdf or report URL"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCompleteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={completeTaskMutation.isPending}>
                  {completeTaskMutation.isPending ? 'Submitting...' : 'Submit Completion'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* TASK ACTIVITY HISTORY DRAWER / MODAL */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Task Activity & Audit Timeline
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete history log of status changes, progress updates, and reviewer remarks.
            </DialogDescription>
          </DialogHeader>

          {historyTask && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="font-bold text-xs text-foreground">{historyTask.title}</div>
                <div className="text-[11px] text-muted-foreground">{historyTask.taskCode} • Priority: {historyTask.priority}</div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {historyTask.activities && historyTask.activities.length > 0 ? (
                  historyTask.activities.map((act) => (
                    <div key={act.id} className="p-3 rounded-lg border border-border/60 bg-card space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-primary">{act.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(act.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{act.remarks || 'Status update logged.'}</p>
                      <div className="text-[10px] font-semibold text-foreground/80">
                        Performed By: {act.performedBy} {act.progress !== undefined && act.progress !== null ? `• Progress: ${act.progress}%` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
                    Task created and assigned to {historyTask.assignedTo ? `${historyTask.assignedTo.firstName} ${historyTask.assignedTo.lastName}` : 'Employee'}.
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button size="sm" variant="outline" onClick={() => setIsHistoryOpen(false)}>
                  Close Audit Log
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* COMPREHENSIVE TASK DETAIL MODAL FOR EMPLOYEE */}
      <TaskDetailModal
        task={detailTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTask(null);
        }}
        onActionClick={(action) => {
          if (!detailTask) return;
          setIsDetailOpen(false);
          if (action === 'START') {
            handleStartTask(detailTask);
          } else if (action === 'UPDATE') {
            handleOpenUpdateModal(detailTask);
          } else if (action === 'COMPLETE') {
            handleOpenCompleteModal(detailTask);
          }
        }}
      />
    </div>
  );
}
