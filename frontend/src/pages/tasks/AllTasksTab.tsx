import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Briefcase,
  AlertCircle,
  FileText,
  Eye,
  RotateCcw,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { tasksApi } from '@/api/tasks';
import { employeesApi } from '@/api/employees';
import type { EmployeeTask } from '@/api/types';

export function AllTasksTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('ALL');

  // Task Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('TASK');
  const [projectName, setProjectName] = useState('E-HCM Recruitment Core');
  const [priority, setPriority] = useState('HIGH');
  const [assignedToId, setAssignedToId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState('12');
  const [attachments, setAttachments] = useState('');
  const [instructions, setInstructions] = useState('');
  const [managerRemarks, setManagerRemarks] = useState('');

  // Manager Review Modal State
  const [reviewTask, setReviewTask] = useState<EmployeeTask | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'SEND_BACK' | 'REOPEN'>('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Detail Drawer State
  const [detailTask, setDetailTask] = useState<EmployeeTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch real employee list for assignment dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-master-list'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeesList = useMemo(() => {
    return employeesData?.items || [];
  }, [employeesData]);

  // Selected employee detail for Task Creation display
  const selectedEmployeeDetail = useMemo(() => {
    if (!assignedToId) return null;
    return employeesList.find((e) => e.id === assignedToId) || null;
  }, [assignedToId, employeesList]);

  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['all-tasks', search, statusFilter, priorityFilter, selectedEmployeeFilter],
    queryFn: () =>
      tasksApi.list({
        search: search.trim() ? search.trim() : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        assignedToId: selectedEmployeeFilter !== 'ALL' ? selectedEmployeeFilter : undefined,
      }),
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: (payload: any) => tasksApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Task created and assigned successfully!');
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
          ? msg.join(', ')
          : 'Failed to assign task. Please check form inputs.',
      );
    },
  });

  // Review Task Mutation
  const reviewTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => tasksApi.reviewTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Task review updated successfully!');
      setIsReviewOpen(false);
      setReviewTask(null);
    },
    onError: () => {
      toast.error('Failed to submit task review.');
    },
  });

  const resetCreateForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskType('TASK');
    setProjectName('E-HCM Recruitment Core');
    setPriority('HIGH');
    setAssignedToId('');
    setEstimatedHours('12');
    setAttachments('');
    setInstructions('');
    setManagerRemarks('');
  };

  const handleOpenCreateModal = () => {
    // Default to Sanika Mote if available
    const sanika = employeesList.find((e) => e.firstName.toLowerCase().includes('sanika'));
    if (sanika) {
      setAssignedToId(sanika.id);
    } else if (employeesList.length > 0) {
      setAssignedToId(employeesList[0].id);
    }
    setIsCreateOpen(true);
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!assignedToId) {
      toast.error('Please select an employee to assign this task');
      return;
    }

    createTaskMutation.mutate({
      title: taskTitle,
      description: taskDescription,
      taskType,
      projectName,
      priority,
      assignedToId,
      startDate,
      dueDate,
      estimatedHours: parseFloat(estimatedHours) || 8,
      attachments,
      instructions,
      managerRemarks,
    });
  };

  const handleOpenReviewModal = (task: EmployeeTask, action: 'APPROVE' | 'SEND_BACK' | 'REOPEN') => {
    setReviewTask(task);
    setReviewAction(action);
    setReviewRemarks(
      action === 'APPROVE'
        ? 'Task completion approved cleanly.'
        : action === 'SEND_BACK'
        ? 'Please refine recruitment screening fields and re-verify ratings.'
        : 'Task reopened for additional workflow testing.',
    );
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = () => {
    if (!reviewTask) return;
    reviewTaskMutation.mutate({
      id: reviewTask.id,
      payload: {
        action: reviewAction,
        remarks: reviewRemarks,
        reviewedBy: 'Aishwarya Roy (Director HR)',
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
        return <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-300 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Completed (Review)</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'REOPENED':
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reopened</Badge>;
      case 'ON_HOLD':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300">On Hold</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">Assigned</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Task Allocation & Management Overview
          </h3>
          <p className="text-xs text-muted-foreground">
            Assign tasks to employees, set priority and deadlines, and review completed work.
          </p>
        </div>

        <Button onClick={handleOpenCreateModal} className="h-9 gap-2 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4" /> Create & Assign Task
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border border-border/60 bg-card/50">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Task Title, ID (e.g. TSK-2026-001), or description..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
              <SelectTrigger className="h-9 text-xs w-[180px]">
                <SelectValue placeholder="Assigned Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Employees</SelectItem>
                {employeesList.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-xs">
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="ASSIGNED" className="text-xs">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
                <SelectItem value="CLOSED" className="text-xs">Closed</SelectItem>
                <SelectItem value="REOPENED" className="text-xs">Reopened</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Priorities</SelectItem>
                <SelectItem value="LOW" className="text-xs">Low</SelectItem>
                <SelectItem value="MEDIUM" className="text-xs">Medium</SelectItem>
                <SelectItem value="HIGH" className="text-xs">High</SelectItem>
                <SelectItem value="URGENT" className="text-xs">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task List Table */}
      <Card className="border border-border/60 bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Task Code</th>
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{task.taskCode}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-foreground">{task.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{task.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {task.assignedTo?.firstName?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <span className="block font-semibold text-foreground">
                            {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {task.departmentName || 'General'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{priorityBadge(task.priority)}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 w-28">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1.5" />
                      </div>
                    </td>
                    <td className="py-3 px-4">{statusBadge(task.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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

                        {task.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenReviewModal(task, 'APPROVE')}
                            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}

                        {task.status === 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviewModal(task, 'SEND_BACK')}
                            className="h-7 px-2 text-xs border-amber-300 text-amber-700 dark:text-amber-400 gap-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Send Back
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {tasks.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                      No tasks found matching your filters. Click <strong>Create & Assign Task</strong> to assign a new task.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE & ASSIGN TASK MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Create & Assign Task
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a new task to an employee. The task will instantly appear on their dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTaskSubmit} className="space-y-4 py-2 text-xs">
            {/* Employee Selection */}
            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-3">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" /> 1. Assign To Employee *
              </Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Search & Select Employee from Master Roster" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {employeesList.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.firstName} {emp.lastName} ({emp.designation?.title || emp.department?.name || 'Employee'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Dynamically loaded Employee Details Card */}
              {selectedEmployeeDetail && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Employee Name</span>
                    <strong className="text-foreground font-semibold">
                      {selectedEmployeeDetail.firstName} {selectedEmployeeDetail.lastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Employee ID</span>
                    <strong className="text-primary font-mono">{selectedEmployeeDetail.employeeCode}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Department</span>
                    <strong className="text-foreground">{selectedEmployeeDetail.department?.name || 'HR'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Designation</span>
                    <strong className="text-foreground">{selectedEmployeeDetail.designation?.title || 'Engineer'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Task Information */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Task Title *</Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Update Employee Recruitment Workflow"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Task Type</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECRUITMENT">Recruitment</SelectItem>
                      <SelectItem value="FEATURE">Feature Update</SelectItem>
                      <SelectItem value="BUG">Bug Fix</SelectItem>
                      <SelectItem value="WORKFLOW">Workflow</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="HR_REQUEST">HR Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Project</Label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="Project Name"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Task Description</Label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Detailed description of task goals, requirements, and deliverables..."
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>

            {/* Dates & Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Due Date *</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estimated Hours</Label>
                <Input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Instructions & Manager Remarks */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Instructions & Guidelines</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step-by-step instructions or checklist for the employee..."
                  className="text-xs min-h-[60px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Manager Remarks</Label>
                <Input
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  placeholder="e.g. High priority item requested by HR Director."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending} className="h-9 text-xs gap-1 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Assign Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGER REVIEW MODAL */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Manager Task Review
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review completed work submitted by employee.
            </DialogDescription>
          </DialogHeader>

          {reviewTask && (
            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-muted/30 rounded-xl border space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>{reviewTask.taskCode}</span>
                  {statusBadge(reviewTask.status)}
                </div>
                <h4 className="text-sm font-bold">{reviewTask.title}</h4>
                <p className="text-muted-foreground">{reviewTask.description}</p>
                <div className="text-[11px] pt-1">
                  <strong>Employee Remarks:</strong> {reviewTask.completionRemarks || 'No remarks added'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Review Action</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={reviewAction === 'APPROVE' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('APPROVE')}
                    className="h-8 text-xs font-semibold"
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={reviewAction === 'SEND_BACK' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('SEND_BACK')}
                    className="h-8 text-xs font-semibold"
                  >
                    Send Back
                  </Button>
                  <Button
                    type="button"
                    variant={reviewAction === 'REOPEN' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('REOPEN')}
                    className="h-8 text-xs font-semibold"
                  >
                    Reopen
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reviewer Remarks / Feedback</Label>
                <Textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button onClick={handleReviewSubmit} disabled={reviewTaskMutation.isPending} className="h-9 text-xs font-semibold">
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
