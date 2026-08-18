import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ArrowRight,
  Building2,
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
import { tasksApi } from '@/api/tasks';
import { employeesApi } from '@/api/employees';
import type { TaskRequest } from '@/api/types';

export function TaskRequestsTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestType, setRequestType] = useState('RECRUITMENT');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');

  // Convert / Review Modal
  const [reviewReq, setReviewReq] = useState<TaskRequest | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'CONVERT_TO_TASK'>('CONVERT_TO_TASK');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Fetch Requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['task-requests'],
    queryFn: () => tasksApi.listRequests(),
  });

  // Fetch Employees for Requestor & Conversion
  const { data: employeesData } = useQuery({
    queryKey: ['employees-master-list'],
    queryFn: () => employeesApi.list({ pageSize: 100 }),
  });

  const employeesList = employeesData?.items || [];
  const sanika = employeesList.find((e) => e.firstName.toLowerCase().includes('sanika')) || employeesList[0];

  // Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: (payload: any) => tasksApi.createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-requests'] });
      toast.success('Task request submitted successfully!');
      setIsCreateOpen(false);
      setRequestTitle('');
      setDescription('');
    },
  });

  // Review / Convert Request Mutation
  const reviewRequestMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => tasksApi.reviewRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Request converted to assigned task!');
      setIsReviewOpen(false);
      setReviewReq(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle.trim()) {
      toast.error('Request title is required');
      return;
    }
    if (!sanika) {
      toast.error('No valid employee found for request submission');
      return;
    }

    createRequestMutation.mutate({
      requestTitle,
      requestType,
      description,
      priority,
      requestedById: sanika.id,
    });
  };

  const handleReviewSubmit = () => {
    if (!reviewReq) return;
    reviewRequestMutation.mutate({
      id: reviewReq.id,
      payload: {
        action: reviewAction,
        remarks: reviewRemarks,
        assignedToId: reviewReq.requestedById,
        reviewedBy: 'Aishwarya Roy (Director HR)',
      },
    });
  };

  const statusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'CONVERTED_TO_TASK':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 gap-1"><Sparkles className="h-3 w-3" /> Converted to Task</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 gap-1"><Clock className="h-3 w-3" /> Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Request-Based Task Management
          </h3>
          <p className="text-xs text-muted-foreground">
            Employees submit requests $\rightarrow$ Manager approves and converts requests into assigned tasks.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="h-9 gap-2 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4" /> New Employee Request
        </Button>
      </div>

      {/* Request Roster Table */}
      <Card className="border border-border/60 bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Request Code</th>
                  <th className="py-3 px-4">Request Title & Type</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{req.requestCode}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-foreground">{req.requestTitle}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{req.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      {req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : 'Requested Personnel'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300">{req.priority}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : ''}
                    </td>
                    <td className="py-3 px-4">{statusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'SUBMITTED' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewReq(req);
                            setReviewRemarks('Approved and converted to assigned Task.');
                            setIsReviewOpen(true);
                          }}
                          className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Convert to Task
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}

                {requests.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                      No task requests found. Click <strong>New Employee Request</strong> to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE REQUEST MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Submit Employee Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submit a work request to your manager for review and task assignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Request Title *</Label>
              <Input
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="e.g. Request for recruitment dashboard update"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECRUITMENT">Recruitment</SelectItem>
                    <SelectItem value="WORKFLOW">Workflow</SelectItem>
                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                    <SelectItem value="ACCESS">Access & IT</SelectItem>
                    <SelectItem value="HR_SUPPORT">HR Support</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label className="text-xs font-semibold">Request Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the background and requirement details..."
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createRequestMutation.isPending} className="h-9 text-xs font-semibold gap-1">
                <Send className="h-4 w-4" /> Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONVERT REQUEST TO TASK MODAL */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" /> Convert Request To Task
            </DialogTitle>
          </DialogHeader>

          {reviewReq && (
            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                <span className="font-mono text-primary font-bold">{reviewReq.requestCode}</span>
                <h4 className="font-bold text-foreground text-sm">{reviewReq.requestTitle}</h4>
                <p className="text-muted-foreground">{reviewReq.description}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Manager Remarks</Label>
                <Textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewOpen(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewSubmit}
                  disabled={reviewRequestMutation.isPending}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                >
                  <ArrowRight className="h-4 w-4" /> Approve & Convert
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
