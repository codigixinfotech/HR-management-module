import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Trash2, Plus, Check } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ApprovalStatus, EmployeeStatus } from '@/api/types';

const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('ID_PROOF');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('HR');

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.get(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: EmployeeStatus) => employeesApi.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Status updated');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => employeesApi.uploadDocument(id!, file, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document uploaded');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Upload failed'),
  });

  const removeDocMutation = useMutation({
    mutationFn: (documentId: string) => employeesApi.removeDocument(id!, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document removed');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () => employeesApi.createOnboardingTask(id!, { title: taskTitle, ownerType: taskOwner }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Onboarding task added');
      setTaskOpen(false);
      setTaskTitle('');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => employeesApi.updateOnboardingTaskStatus(taskId, 'APPROVED' as ApprovalStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Task marked complete');
    },
  });

  if (isLoading || !employee) {
    return <p className="text-sm text-muted-foreground">Loading employee...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold ">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {employee.employeeCode} &middot; {employee.designation?.title ?? 'No designation'}
          </p>
        </div>
        <div className="ml-auto w-40">
          <Select value={employee.status} onValueChange={(v) => statusMutation.mutate(v as EmployeeStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Company" value={employee.company?.name ?? '-'} />
        <InfoCard label="Department" value={employee.department?.name ?? '-'} />
        <InfoCard label="Work Email" value={employee.workEmail ?? '-'} />
        <InfoCard label="Phone" value={employee.phone ?? '-'} />
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Documents</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ID_PROOF">ID Proof</SelectItem>
                    <SelectItem value="ADDRESS_PROOF">Address Proof</SelectItem>
                    <SelectItem value="EDUCATION">Education Certificate</SelectItem>
                    <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMutation.mutate(file);
                  }}
                />
                <Button size="sm" className="text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                  <Upload className="mr-1.5 h-4 w-4" /> Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {employee.documents && employee.documents.length > 0 ? (
                employee.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.docType}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDocMutation.mutate(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Onboarding Tasks</CardTitle>
              <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs">
                    <Plus className="mr-1.5 h-4 w-4" /> Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Onboarding Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Owner</Label>
                      <Select value={taskOwner} onValueChange={setTaskOwner}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!taskTitle || createTaskMutation.isPending}
                      onClick={() => createTaskMutation.mutate()}
                    >
                      Add task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {employee.onboardingTasks && employee.onboardingTasks.length > 0 ? (
                employee.onboardingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">Owner: {task.ownerType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} className="text-[10px]" />
                      {task.status !== 'APPROVED' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => completeTaskMutation.mutate(task.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No onboarding tasks yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
