import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Briefcase,
  AlertCircle,
  RotateCcw,
  Check,
  Sparkles,
  Calendar,
  User,
  Paperclip,
  Activity,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import type { EmployeeTask } from '@/api/types';

interface TaskDetailModalProps {
  task: EmployeeTask | null;
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (action: 'START' | 'UPDATE' | 'COMPLETE' | 'APPROVE' | 'SEND_BACK') => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onActionClick }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!task) return null;

  const priorityBadge = (pri: string) => {
    switch (pri?.toUpperCase()) {
      case 'URGENT':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300">Urgent Priority</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300">High Priority</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300">Medium Priority</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">Low Priority</Badge>;
    }
  };

  const statusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'CLOSED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 flex items-center gap-1">
            <Check className="h-3 w-3" /> Closed
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-300 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Completed (In Review)
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 flex items-center gap-1">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        );
      case 'REOPENED':
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Reopened
          </Badge>
        );
      case 'ON_HOLD':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300">On Hold</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">Assigned</Badge>;
    }
  };

  // Due Date calculation
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CLOSED';

  // Hours calculation
  const estHours = task.estimatedHours || 0;
  const actHours = task.actualHours || 0;
  const hoursVariance = actHours > 0 ? actHours - estHours : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border/80">
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-primary/15 text-primary rounded-md border border-primary/20">
                {task.taskCode}
              </span>
              <Badge variant="outline" className="text-xs font-medium uppercase tracking-wide">
                {task.taskType || 'TASK'}
              </Badge>
              {priorityBadge(task.priority)}
            </div>

            <div>{statusBadge(task.status)}</div>
          </div>

          <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">{task.title}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-primary" /> Project: <strong>{task.projectName || 'General HR Core'}</strong>
            <span>•</span>
            <Building2 className="h-3.5 w-3.5 text-primary" /> Dept: <strong>{task.departmentName || 'HR Operations'}</strong>
          </p>

          {/* Task Progress Bar */}
          <div className="mt-4 space-y-1.5 bg-background/80 p-3 rounded-lg border border-border/40">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" /> Overall Task Progress
              </span>
              <span className="text-primary font-mono">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        </div>

        {/* Quick KPI Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20 border-b border-border/50 text-xs">
          <div className="p-2.5 bg-background rounded-lg border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Assigned Employee</span>
            <strong className="font-semibold text-foreground truncate block">
              {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
            </strong>
          </div>

          <div className="p-2.5 bg-background rounded-lg border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Target Due Date</span>
            <div className="flex items-center gap-1 font-mono font-semibold">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A'}</span>
            </div>
            {isOverdue && (
              <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5 mt-0.5">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </span>
            )}
          </div>

          <div className="p-2.5 bg-background rounded-lg border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Estimated Hours</span>
            <strong className="font-mono text-foreground font-semibold">{estHours} hrs</strong>
          </div>

          <div className="p-2.5 bg-background rounded-lg border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Actual Hours Logged</span>
            <strong className="font-mono text-foreground font-semibold">{actHours} hrs</strong>
            {hoursVariance > 0 && (
              <span className="text-[10px] text-amber-600 block">(+{hoursVariance}h over)</span>
            )}
          </div>
        </div>

        {/* Tabbed Detailed View */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview" className="text-xs">
                Overview & Specs
              </TabsTrigger>
              <TabsTrigger value="personnel" className="text-xs">
                Personnel & Dates
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="text-xs">
                Deliverables & Review
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                Audit Log ({task.activities?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW & SPECS */}
            <TabsContent value="overview" className="space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                  Task Description & Requirements
                </h4>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/60 text-foreground whitespace-pre-wrap leading-relaxed">
                  {task.description || 'No detailed description provided.'}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                  Instructions & Guidelines for Employee
                </h4>
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-foreground whitespace-pre-wrap leading-relaxed">
                  {task.instructions || 'Standard operational guidelines apply for this task.'}
                </div>
              </div>

              {task.managerRemarks && (
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                    Initial Manager Remarks
                  </h4>
                  <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-foreground">
                    {task.managerRemarks}
                  </div>
                </div>
              )}

              {task.attachments && (
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                    Task References & Attachments
                  </h4>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-primary" />
                      <span className="font-mono text-xs text-foreground">{task.attachments}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <a href={`#`} onClick={(e) => e.preventDefault()}>
                        <ExternalLink className="h-3.5 w-3.5" /> View Reference
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: PERSONNEL & DATES */}
            <TabsContent value="personnel" className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assigned To Employee Card */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">Assigned Employee (Assignee)</span>
                  </div>

                  {task.assignedTo ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {task.assignedTo.firstName.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-sm font-semibold text-foreground block">
                            {task.assignedTo.firstName} {task.assignedTo.lastName}
                          </strong>
                          <span className="font-mono text-[11px] text-primary block">
                            ID: {task.assignedTo.employeeCode}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                        <div>
                          <span className="text-muted-foreground block">Department</span>
                          <strong className="text-foreground">{task.assignedTo.department?.name || task.departmentName || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Designation</span>
                          <strong className="text-foreground">{task.assignedTo.designation?.title || 'Team Member'}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">No employee currently assigned</div>
                  )}
                </div>

                {/* Assigned By (Manager) Card */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">Assigned By (Manager / Lead)</span>
                  </div>

                  {task.assignedBy ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                          {task.assignedBy.firstName.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-sm font-semibold text-foreground block">
                            {task.assignedBy.firstName} {task.assignedBy.lastName}
                          </strong>
                          <span className="font-mono text-[11px] text-muted-foreground block">
                            Code: {task.assignedBy.employeeCode}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t text-[11px]">
                        <span className="text-muted-foreground block">Role / Title</span>
                        <strong className="text-foreground">{task.assignedBy.designation?.title || 'Manager / HR Admin'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">System / HR Administrator</div>
                  )}
                </div>
              </div>

              {/* Schedule & Milestones */}
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Task Timeline & Key Milestones
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground block">Start Date</span>
                    <strong className="font-mono text-foreground">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB') : 'N/A'}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground block">Due Date</span>
                    <strong className="font-mono text-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground block">Started At</span>
                    <strong className="font-mono text-foreground">
                      {task.startedAt ? new Date(task.startedAt).toLocaleString('en-GB') : 'Not Started'}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground block">Completed / Closed At</span>
                    <strong className="font-mono text-foreground">
                      {task.completedAt
                        ? new Date(task.completedAt).toLocaleString('en-GB')
                        : task.closedAt
                        ? new Date(task.closedAt).toLocaleString('en-GB')
                        : 'Pending'}
                    </strong>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: DELIVERABLES & REVIEW */}
            <TabsContent value="deliverables" className="space-y-4 text-xs">
              {/* Employee Completion Submission */}
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Employee Completion Submission
                  </h4>
                  {task.completedAt && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Submitted on {new Date(task.completedAt).toLocaleDateString('en-GB')}
                    </Badge>
                  )}
                </div>

                {task.completionRemarks ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-semibold">Completion Summary / Remarks:</span>
                      <p className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-foreground whitespace-pre-wrap leading-relaxed mt-1">
                        {task.completionRemarks}
                      </p>
                    </div>

                    {task.completionAttachment && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-semibold">Supporting Deliverable File:</span>
                        <div className="p-2.5 bg-muted/30 rounded-lg border border-border/60 flex items-center justify-between mt-1 font-mono">
                          <span className="truncate">{task.completionAttachment}</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                            <a href={`#`} onClick={(e) => e.preventDefault()}>
                              <ExternalLink className="h-3.5 w-3.5" /> Open Deliverable
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground italic bg-muted/20 rounded-lg">
                    Task completion has not been submitted yet.
                  </div>
                )}
              </div>

              {/* Reviewer / Rejection Notes */}
              {task.rejectionReason && (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-500/5 space-y-2">
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Manager Feedback / Refinement Reason
                  </h4>
                  <p className="text-foreground">{task.rejectionReason}</p>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: AUDIT LOG & ACTIVITY TIMELINE */}
            <TabsContent value="activity" className="space-y-3 text-xs">
              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {task.activities && task.activities.length > 0 ? (
                  task.activities.map((act) => (
                    <div key={act.id} className="p-3 rounded-lg border border-border/60 bg-card space-y-1 text-xs relative pl-8">
                      <div className="absolute left-3 top-3.5 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">{act.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(act.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      {act.remarks && <p className="text-muted-foreground text-[11px] mt-0.5">{act.remarks}</p>}
                      <div className="text-[10px] font-semibold text-foreground/80 pt-1 border-t border-border/40 mt-1 flex justify-between">
                        <span>Performed By: <strong>{act.performedBy}</strong></span>
                        {act.progress !== undefined && act.progress !== null && (
                          <span className="font-mono text-primary">Progress: {act.progress}%</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
                    Task created and assigned. No further activity recorded yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/30 border-t border-border/60 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {task.status === 'COMPLETED' && onActionClick && (
              <>
                <Button
                  size="sm"
                  onClick={() => onActionClick('APPROVE')}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick('SEND_BACK')}
                  className="h-8 text-xs border-amber-300 text-amber-700 dark:text-amber-400 gap-1 font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Send Back
                </Button>
              </>
            )}

            {task.status === 'ASSIGNED' && onActionClick && (
              <Button
                size="sm"
                onClick={() => onActionClick('START')}
                className="h-8 text-xs bg-primary text-primary-foreground gap-1 font-semibold"
              >
                <Clock className="h-3.5 w-3.5" /> Start Task
              </Button>
            )}

            {(task.status === 'IN_PROGRESS' || task.status === 'REOPENED') && onActionClick && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick('UPDATE')}
                  className="h-8 text-xs gap-1 font-semibold"
                >
                  <Clock className="h-3.5 w-3.5" /> Update Progress
                </Button>
                <Button
                  size="sm"
                  onClick={() => onActionClick('COMPLETE')}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Submit Completion
                </Button>
              </>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={onClose} className="h-8 text-xs">
            Close Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
