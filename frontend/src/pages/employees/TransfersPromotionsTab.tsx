import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  TrendingUp,
  Clock,
  Eye,
  Check,
  X,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { employeesApi } from '@/api/employees';
import { departmentsApi, designationsApi, branchesApi } from '@/api/organization';
import { payGradesApi } from '@/api/cost-grades';

export function TransfersPromotionsTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal States
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Selected Transfer Item for action
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);

  // Approve/Reject form states
  const [approveComments, setApproveComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Queue Movement Form States
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [movementType, setMovementType] = useState('PROMOTION');
  
  // Target States
  const [newDeptId, setNewDeptId] = useState('');
  const [newDesgId, setNewDesgId] = useState('');
  const [newGradeId, setNewGradeId] = useState('');
  const [newBranchId, setNewBranchId] = useState('');
  const [newReportingManagerId, setNewReportingManagerId] = useState('');
  
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  // Queries
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });
  const employees = employeesData?.items ?? [];

  const { data: transfers = [], isLoading: isTransfersLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: employeesApi.listTransfers,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list(),
  });

  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => designationsApi.list(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => payGradesApi.list(),
  });

  // Selected Employee Details lookup
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId);
  }, [selectedEmpId, employees]);

  const activeTransfer = useMemo(() => {
    return transfers.find(t => t.id === activeTransferId);
  }, [activeTransferId, transfers]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: employeesApi.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Workforce transfer movement queued successfully');
      setIsQueueOpen(false);
      resetQueueForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to queue transfer');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      employeesApi.approveTransfer(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Transfer movement approved');
      setIsApproveOpen(false);
      setApproveComments('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason, comments }: { id: string; reason: string; comments: string }) =>
      employeesApi.rejectTransfer(id, { reason, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Transfer movement rejected');
      setIsRejectOpen(false);
      setRejectReason('');
    },
  });

  const effectiveMutation = useMutation({
    mutationFn: employeesApi.makeTransferEffective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Transfer executed successfully! Employee master updated.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to apply movement');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: employeesApi.cancelTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Transfer cancelled');
    },
  });

  const resetQueueForm = () => {
    setSelectedEmpId('');
    setMovementType('PROMOTION');
    setNewDeptId('');
    setNewDesgId('');
    setNewGradeId('');
    setNewBranchId('');
    setNewReportingManagerId('');
    setEffectiveDate('');
    setReason('');
    setRemarks('');
  };

  const handleQueueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !effectiveDate || !reason) {
      toast.error('Please complete all required fields');
      return;
    }

    createMutation.mutate({
      employeeId: selectedEmpId,
      movementType,
      newDepartmentId: newDeptId || undefined,
      newDesignationId: newDesgId || undefined,
      newGradeId: newGradeId || undefined,
      newBranchId: newBranchId || undefined,
      newReportingManagerId: newReportingManagerId || undefined,
      effectiveDate,
      reason,
      remarks,
    });
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchesSearch =
        t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === 'all' ? true : t.movementType.toLowerCase() === selectedType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [transfers, searchQuery, selectedType]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Mobility Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workforce Shifts</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{transfers.length} Movements</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Total movements tracked</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved Shifts</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {transfers.filter(t => t.status === 'EFFECTIVE' || t.status === 'APPROVED').length} Executed
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">HR payroll updated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Approvals</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {transfers.filter(t => t.status === 'PENDING').length} Queued
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Requires unit manager sign-off</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Internal Mobility</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">12.4% Yield</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">High retention contributor</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Transfers Directory Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" /> Transfers & Promotion Mobility Movement Log
              </CardTitle>
              <CardDescription className="text-xs">
                Log and monitor employee promotions, department reallocations, and inter-branch relocations
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Movements' },
                  { id: 'promotion', label: 'Promotion' },
                  { id: 'branch_transfer', label: 'Branch Move' },
                  { id: 'department_shift', label: 'Dept Shift' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedType === type.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter candidate or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Queue Movement Dialog */}
              <Dialog open={isQueueOpen} onOpenChange={setIsQueueOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={resetQueueForm}>
                    <Plus className="h-3.5 w-3.5" /> Queue Movement
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Queue Workforce Movement</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 text-xs" onSubmit={handleQueueSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Employee Search/Select */}
                      <div className="space-y-1.5 col-span-2">
                        <Label>Employee Name *</Label>
                        <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Choose employee to transfer/promote..." />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs">
                                {emp.firstName} {emp.lastName} ({emp.employeeCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Display Current states */}
                      {selectedEmployee && (
                        <div className="col-span-2 bg-muted/40 border rounded-xl p-3.5 space-y-2 grid grid-cols-2 gap-x-4 text-[10.5px] text-muted-foreground">
                          <div className="col-span-2 font-semibold text-primary mb-1">
                            CURRENT POSITION DETAILS:
                          </div>
                          <div>• <strong>Code:</strong> {selectedEmployee.employeeCode}</div>
                          <div>• <strong>Branch/Location:</strong> {selectedEmployee.branch?.name ?? selectedEmployee.location ?? '-'}</div>
                          <div>• <strong>Department:</strong> {selectedEmployee.department?.name ?? '-'}</div>
                          <div>• <strong>Designation:</strong> {selectedEmployee.designation?.title ?? '-'}</div>
                          <div>• <strong>Grade/Level:</strong> {selectedEmployee.grade ?? '-'}</div>
                          <div>• <strong>Manager:</strong> {selectedEmployee.reportingManager ? `${selectedEmployee.reportingManager.firstName} ${selectedEmployee.reportingManager.lastName}` : 'None'}</div>
                        </div>
                      )}

                      {/* Movement Type */}
                      <div className="space-y-1.5">
                        <Label>Movement Category Type *</Label>
                        <Select value={movementType} onValueChange={setMovementType}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PROMOTION" className="text-xs">Promotion</SelectItem>
                            <SelectItem value="DEPARTMENT_SHIFT" className="text-xs">Department Shift</SelectItem>
                            <SelectItem value="BRANCH_TRANSFER" className="text-xs">Branch Transfer</SelectItem>
                            <SelectItem value="PROMOTION_TRANSFER" className="text-xs">Promotion & Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Effective Date */}
                      <div className="space-y-1.5">
                        <Label>Effective Date *</Label>
                        <Input
                          type="date"
                          value={effectiveDate}
                          onChange={e => setEffectiveDate(e.target.value)}
                          className="h-9 text-xs"
                          required
                        />
                      </div>
                    </div>

                    {/* DYNAMIC TARGET FIELDS */}
                    <div className="border-t pt-3 space-y-3">
                      <div className="font-semibold text-primary text-[10.5px]">TARGET ORGANIZATION PARAMETERS:</div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* New Department Shift / Promotion & Transfer */}
                        {(movementType === 'DEPARTMENT_SHIFT' || movementType === 'PROMOTION_TRANSFER') && (
                          <div className="space-y-1.5">
                            <Label>New Department *</Label>
                            <Select value={newDeptId} onValueChange={setNewDeptId}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Choose target dept..." />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map(d => (
                                  <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* New Designation Promotion / Promotion & Transfer */}
                        {(movementType === 'PROMOTION' || movementType === 'PROMOTION_TRANSFER') && (
                          <div className="space-y-1.5">
                            <Label>New Designation *</Label>
                            <Select value={newDesgId} onValueChange={setNewDesgId}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Choose target designation..." />
                              </SelectTrigger>
                              <SelectContent>
                                {designations.map(dg => (
                                  <SelectItem key={dg.id} value={dg.id} className="text-xs">{dg.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* New Grade Promotion / Promotion & Transfer */}
                        {(movementType === 'PROMOTION' || movementType === 'PROMOTION_TRANSFER') && (
                          <div className="space-y-1.5">
                            <Label>New Grade *</Label>
                            <Select value={newGradeId} onValueChange={setNewGradeId}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Choose target grade..." />
                              </SelectTrigger>
                              <SelectContent>
                                {grades.map(g => (
                                  <SelectItem key={g.id} value={g.id} className="text-xs">{g.gradeCode} ({g.level})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* New Branch/Location Branch Transfer / Promotion & Transfer */}
                        {(movementType === 'BRANCH_TRANSFER' || movementType === 'PROMOTION_TRANSFER') && (
                          <div className="space-y-1.5">
                            <Label>New Branch / Location *</Label>
                            <Select value={newBranchId} onValueChange={setNewBranchId}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Choose target branch..." />
                              </SelectTrigger>
                              <SelectContent>
                                {branches.map(b => (
                                  <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* New Reporting Manager */}
                        {(movementType !== 'PROMOTION') && (
                          <div className="space-y-1.5">
                            <Label>New Reporting Manager</Label>
                            <Select value={newReportingManagerId} onValueChange={setNewReportingManagerId}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Choose manager..." />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map(emp => (
                                  <SelectItem key={emp.id} value={emp.id} className="text-xs">
                                    {emp.firstName} {emp.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Reason *</Label>
                      <Input
                        placeholder="e.g. Annual Promotion cycle or Relocation request"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Remarks / Comments</Label>
                      <Input
                        placeholder="Internal notes..."
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs" disabled={createMutation.isPending}>
                        Queue Transfer
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Transfer ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Previous Unit</TableHead>
                <TableHead className="text-xs">New Target Unit</TableHead>
                <TableHead className="text-xs">Effective Date</TableHead>
                <TableHead className="text-xs">Movement Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTransfersLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                    Loading mobility transfer records...
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                    No movements found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{t.id.toUpperCase()}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {t.employeeName}
                      <span className="block text-[9.5px] text-muted-foreground font-mono mt-0.5">{t.employeeCode}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">
                      {t.prevDeptName || t.prevBranchName || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">
                      &gt; {t.targetDeptName || t.targetBranchName || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {new Date(t.effectiveDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-xs font-semibold uppercase">{t.movementType.replace('_', ' ')}</TableCell>
                    <TableCell className="text-xs">
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Action */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setActiveTransferId(t.id);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {/* Approve/Reject for PENDING status */}
                        {t.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              onClick={() => {
                                setActiveTransferId(t.id);
                                setIsApproveOpen(true);
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => {
                                setActiveTransferId(t.id);
                                setIsRejectOpen(true);
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}

                        {/* Execute / Apply for APPROVED status */}
                        {t.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 font-semibold text-primary border-primary/30 hover:bg-primary/5"
                            onClick={() => effectiveMutation.mutate(t.id)}
                            disabled={effectiveMutation.isPending}
                          >
                            Apply Effective
                          </Button>
                        )}

                        {/* Cancel for PENDING status */}
                        {t.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              if (confirm('Cancel this queued movement?')) {
                                cancelMutation.mutate(t.id);
                              }
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Workforce Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <p className="text-muted-foreground">Provide optional comments to sign-off and approve this workforce shift.</p>
            <div className="space-y-1.5">
              <Label>Comments / Sign-off Remarks</Label>
              <Input
                placeholder="Approved. Ready for execution."
                value={approveComments}
                onChange={e => setApproveComments(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (activeTransferId) {
                    approveMutation.mutate({ id: activeTransferId, comments: approveComments });
                  }
                }}
                disabled={approveMutation.isPending}
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Sign & Approve
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Workforce Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <p className="text-muted-foreground">Rejection requires a documented reason for corporate audit trails.</p>
            <div className="space-y-1.5">
              <Label>Rejection Reason *</Label>
              <Input
                placeholder="Reason for rejecting..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (activeTransferId && rejectReason) {
                    rejectMutation.mutate({
                      id: activeTransferId,
                      reason: rejectReason,
                      comments: rejectReason,
                    });
                  } else {
                    toast.error('Rejection reason is required');
                  }
                }}
                disabled={rejectMutation.isPending}
                size="sm"
                className="text-xs"
                variant="destructive"
              >
                Submit Rejection
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      {activeTransfer && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Movement Audit Detail ({activeTransfer.id.toUpperCase()})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/20">
                <div>
                  <Label className="text-muted-foreground">Employee Name</Label>
                  <p className="font-semibold text-foreground mt-0.5">{activeTransfer.employeeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee Code</Label>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{activeTransfer.employeeCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Movement Type</Label>
                  <p className="font-semibold text-foreground mt-0.5 uppercase">{activeTransfer.movementType.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Effective Date</Label>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(activeTransfer.effectiveDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-primary">Organizational Shift Diffs:</div>
                <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 bg-background">
                  <div>
                    <Label className="text-muted-foreground">Previous Unit</Label>
                    <p className="font-semibold mt-0.5">{activeTransfer.prevDeptName || activeTransfer.prevBranchName || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">New Target Unit</Label>
                    <p className="font-semibold text-primary mt-0.5">&gt; {activeTransfer.targetDeptName || activeTransfer.targetBranchName || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Reason for movement</Label>
                <p className="font-medium text-foreground bg-muted/40 p-2.5 rounded-lg border">{activeTransfer.reason}</p>
              </div>

              {activeTransfer.remarks && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Internal Remarks</Label>
                  <p className="font-medium text-foreground bg-muted/40 p-2.5 rounded-lg border">{activeTransfer.remarks}</p>
                </div>
              )}

              {activeTransfer.approvedBy && (
                <div className="grid grid-cols-2 gap-4 border-t pt-3 text-[10.5px] text-muted-foreground">
                  <div>• <strong>Sign-off By:</strong> {activeTransfer.approvedBy}</div>
                  <div>• <strong>Sign-off Date:</strong> {new Date(activeTransfer.approvedDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewOpen(false)} size="sm" className="text-xs" variant="outline">
                Close Audit Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
