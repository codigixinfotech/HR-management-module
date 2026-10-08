import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Building2, FileText, Users, RefreshCw,
  Pencil, MoreHorizontal, UserCheck, Briefcase, AlertTriangle, Eye,
  CheckCircle2, XCircle, Clock, MapPin, Phone, Mail,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { contractorApi, type ContractorVendor, type ContractorContract, type ContractorWorker, type WorkerDeployment } from '@/api/contractor-management';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';
import { ContractorKpiCards } from '@/pages/workforce/contractors/ContractorKpiCards';
import { AddEditVendorModal } from '@/pages/workforce/contractors/AddEditVendorModal';
import { ViewVendorModal, ViewContractModal, ViewWorkerModal, ViewDeploymentModal } from '@/pages/workforce/contractors/ViewEntityModals';
import { AddEditContractModal } from '@/pages/workforce/contractors/AddEditContractModal';
import { AddEditWorkerModal } from '@/pages/workforce/contractors/AddEditWorkerModal';
import { AddEditDeploymentModal } from '@/pages/workforce/contractors/AddEditDeploymentModal';
import { useCompany } from '@/context/CompanyContext';

// ─── Status badge helper ───────────────────────────────────────────────────────
function StatusBadgeInline({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE:     { label: 'Active',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    DRAFT:      { label: 'Draft',      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    EXPIRING:   { label: 'Expiring',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    EXPIRED:    { label: 'Expired',    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
    SUSPENDED:  { label: 'Suspended',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
    TERMINATED: { label: 'Terminated', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
    RENEWED:    { label: 'Renewed',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    // Worker statuses
    INACTIVE:   { label: 'Inactive',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    ON_LEAVE:   { label: 'On Leave',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    EXITED:     { label: 'Exited',     cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
    // Compliance statuses
    VALID:                  { label: 'Valid',       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    PENDING_VERIFICATION:   { label: 'Pending',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    REJECTED:               { label: 'Rejected',    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
    // Deployment statuses
    SCHEDULED:  { label: 'Scheduled',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    COMPLETED:  { label: 'Completed',  cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    TRANSFERRED:{ label: 'Transferred',cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
    CANCELLED:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatBranchDisplay(branchName?: string | null, branchId?: string | null): string {
  if (!branchName && (!branchId || branchId === 'ALL')) return 'All Branches';
  if (branchId === 'HEAD_OFFICE' || branchName?.toLowerCase().includes('head office')) {
    return 'Head Office';
  }
  if (branchName?.toLowerCase().includes('pune head office')) {
    return 'Head Office';
  }
  return branchName || 'All Branches';
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-10 text-xs text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ContractorManagementTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId } = useCompany();
  const companyId = propCompanyId || activeCompanyId;

  const {
    selectedBranch, setSelectedBranch, branches,
    isBranchAdmin, isSuperOrCompanyAdmin, assignedBranchName,
    isBranchUser, userAssignedBranchId, matchBranch,
  } = useWorkforceBranch();

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Determine branch param for API
  const branchIdParam =
    isBranchUser && userAssignedBranchId ? userAssignedBranchId :
    selectedBranch !== 'HEAD_OFFICE' && selectedBranch !== 'ALL' ? selectedBranch : undefined;

  const initialTab = urlTab && urlTab !== 'compliance' ? urlTab : 'vendors';
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (urlTab) {
      if (urlTab === 'compliance') {
        setTab('vendors');
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('tab');
          return next;
        });
      } else if (urlTab !== tab) {
        setTab(urlTab);
      }
    }
  }, [urlTab, tab, setSearchParams]);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    setSearch('');
    setStatusFilter('ALL');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  // Vendor modal state
  const [vendorModal, setVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<ContractorVendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<ContractorVendor | null>(null);
  const [viewVendorModalOpen, setViewVendorModalOpen] = useState(false);

  // Contract modal state
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractorContract | null>(null);
  const [viewingContract, setViewingContract] = useState<ContractorContract | null>(null);
  const [viewContractModalOpen, setViewContractModalOpen] = useState(false);

  // Worker modal state
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<ContractorWorker | null>(null);
  const [viewingWorker, setViewingWorker] = useState<ContractorWorker | null>(null);
  const [viewWorkerModalOpen, setViewWorkerModalOpen] = useState(false);

  // Deployment modal state
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<WorkerDeployment | null>(null);
  const [viewingDeployment, setViewingDeployment] = useState<WorkerDeployment | null>(null);
  const [viewDeploymentModalOpen, setViewDeploymentModalOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const dashboardQuery = useQuery({
    queryKey: ['contractor-dashboard', companyId, branchIdParam],
    queryFn: () => contractorApi.getDashboard(companyId, branchIdParam),
    enabled: !!companyId,
  });

  const vendorsQuery = useQuery({
    queryKey: ['contractor-vendors', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getVendors({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId,
  });

  const contractsQuery = useQuery({
    queryKey: ['contractor-contracts', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getContracts({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId,
  });

  const workersQuery = useQuery({
    queryKey: ['contractor-workers', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getWorkers({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId,
  });

  const deploymentsQuery = useQuery({
    queryKey: ['contractor-deployments', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getDeployments({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const updateVendorStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      contractorApi.updateVendorStatus(id, status),
    onSuccess: () => {
      toast.success('Vendor status updated');
      queryClient.invalidateQueries({ queryKey: ['contractor-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: string) => contractorApi.deleteVendor(id),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contractor-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete vendor'),
  });

  const deleteContractMutation = useMutation({
    mutationFn: (id: string) => contractorApi.deleteContract(id),
    onSuccess: () => {
      toast.success('Contract deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contractor-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete contract'),
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: (id: string) => contractorApi.deleteWorker(id),
    onSuccess: () => {
      toast.success('Worker deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contractor-workers'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete worker'),
  });

  const completeDeploymentMutation = useMutation({
    mutationFn: (id: string) => contractorApi.completeDeployment(id),
    onSuccess: () => {
      toast.success('Deployment completed');
      queryClient.invalidateQueries({ queryKey: ['contractor-deployments'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machine-operators'] });
      queryClient.invalidateQueries({ queryKey: ['machine-allocations'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to complete deployment'),
  });

  const deleteDeploymentMutation = useMutation({
    mutationFn: (id: string) => contractorApi.deleteDeployment(id),
    onSuccess: () => {
      toast.success('Deployment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contractor-deployments'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machine-operators'] });
      queryClient.invalidateQueries({ queryKey: ['machine-allocations'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete deployment'),
  });

  const onVendorSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contractor-vendors'] });
    queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
  }, [queryClient]);

  const onContractSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contractor-contracts'] });
    queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
  }, [queryClient]);

  const onWorkerSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contractor-workers'] });
    queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
  }, [queryClient]);

  const onDeploymentSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contractor-deployments'] });
    queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
  }, [queryClient]);


  // ── Status options per tab ────────────────────────────────────────────────────
  const vendorStatusOptions = ['ALL', 'ACTIVE', 'DRAFT', 'EXPIRING', 'SUSPENDED', 'EXPIRED', 'TERMINATED'];
  const contractStatusOptions = ['ALL', 'ACTIVE', 'DRAFT', 'EXPIRING', 'EXPIRED', 'SUSPENDED', 'RENEWED', 'TERMINATED'];
  const workerStatusOptions = ['ALL', 'ACTIVE', 'INACTIVE', 'ON_LEAVE', 'EXITED', 'SUSPENDED'];
  const deploymentStatusOptions = ['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED', 'TRANSFERRED', 'CANCELLED'];

  const statusOptions =
    tab === 'vendors' ? vendorStatusOptions :
    tab === 'contracts' ? contractStatusOptions :
    tab === 'workers' ? workerStatusOptions :
    deploymentStatusOptions;

  const allVendorsQuery = useQuery({
    queryKey: ['contractor-all-vendors-lookup', companyId],
    queryFn: () => contractorApi.getVendors({ companyId }),
    enabled: !!companyId,
  });
  const allVendors: ContractorVendor[] =
    allVendorsQuery.data && allVendorsQuery.data.length > 0
      ? allVendorsQuery.data
      : (vendorsQuery.data || []);

  const rawVendors: ContractorVendor[] = vendorsQuery.data || [];
  const rawContracts: ContractorContract[] = contractsQuery.data || [];
  const rawWorkers: ContractorWorker[] = workersQuery.data || [];
  const rawDeployments: WorkerDeployment[] = deploymentsQuery.data || [];

  const vendors = rawVendors.filter((v) =>
    matchBranch({ branchId: v.branch_id, branchName: v.branch_name })
  );
  const contracts = rawContracts.filter((c) =>
    matchBranch({ branchId: c.branch_id, branchName: c.branch_name })
  );
  const workers = rawWorkers.filter((w) =>
    matchBranch({ branchId: w.branch_id, branchName: w.branch_name })
  );
  const deployments = rawDeployments.filter((d) =>
    matchBranch({ branchId: d.branch_id, branchName: d.branch_name })
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <ContractorKpiCards
        data={dashboardQuery.data || null}
        loading={dashboardQuery.isLoading}
      />

      {/* Main Card */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-4 pb-3">
          <div className="shrink min-w-0 pr-2">
            <CardTitle className="text-base font-semibold">Contractor Management</CardTitle>
            <CardDescription className="text-xs truncate sm:whitespace-normal">
              Manage staffing vendors, contracts, contractor workers &amp; deployments
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {/* Search */}
            <div className="relative w-32 xl:w-40 shrink-0">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 pr-2 text-xs"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-24 shrink-0 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Branch Filter */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
              triggerClassName="!h-8 !py-0 !px-2"
              hideLabel={true}
              className="shrink-0"
            />

            {/* Refresh */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['contractor-'] })}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            {/* Add Action Buttons */}
            {tab === 'vendors' && (
              <Button
                size="sm"
                className="gap-1 text-xs h-8 px-2.5 shrink-0 whitespace-nowrap"
                onClick={() => { setEditingVendor(null); setVendorModal(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Vendor
              </Button>
            )}
            {tab === 'contracts' && (
              <Button
                size="sm"
                className="gap-1 text-xs h-8 px-2.5 shrink-0 whitespace-nowrap"
                onClick={() => { setEditingContract(null); setContractModalOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Contract
              </Button>
            )}
            {tab === 'workers' && (
              <Button
                size="sm"
                className="gap-1 text-xs h-8 px-2.5 shrink-0 whitespace-nowrap"
                onClick={() => { setEditingWorker(null); setWorkerModalOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Worker
              </Button>
            )}
            {tab === 'deployments' && (
              <Button
                size="sm"
                className="gap-1 text-xs h-8 px-2.5 shrink-0 whitespace-nowrap"
                onClick={() => { setEditingDeployment(null); setDeploymentModalOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Deploy Worker
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="mb-4 h-9 p-1 inline-flex items-center flex-nowrap overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="vendors" className="text-xs gap-1.5 whitespace-nowrap shrink-0">
                <Building2 className="h-3.5 w-3.5" /> Vendors
                {vendors.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{vendors.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs gap-1.5 whitespace-nowrap shrink-0">
                <FileText className="h-3.5 w-3.5" /> Contracts
                {contracts.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{contracts.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="workers" className="text-xs gap-1.5 whitespace-nowrap shrink-0">
                <UserCheck className="h-3.5 w-3.5" /> Workers
                {workers.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{workers.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="deployments" className="text-xs gap-1.5 whitespace-nowrap shrink-0">
                <Briefcase className="h-3.5 w-3.5" /> Deployments
                {deployments.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{deployments.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* ── VENDORS TAB ─────────────────────────────────────────────────── */}
            <TabsContent value="vendors">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Vendor Code</TableHead>
                      <TableHead className="text-xs">Agency Name</TableHead>
                      <TableHead className="text-xs">Branch</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                      <TableHead className="text-xs">Headcount</TableHead>
                      <TableHead className="text-xs">CLRA</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorsQuery.isLoading ? (
                      <EmptyRow colSpan={8} message="Loading vendors..." />
                    ) : vendors.length === 0 ? (
                      <EmptyRow colSpan={8} message="No staffing vendors found. Click 'Add Vendor' to register one." />
                    ) : (
                      vendors.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground">{v.vendor_code}</TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold">{v.display_name || v.legal_name}</div>
                            {v.display_name && v.display_name !== v.legal_name && (
                              <div className="text-[10px] text-muted-foreground">{v.legal_name}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {formatBranchDisplay(v.branch_name, v.branch_id)}
                            </span>
                            {v.department_name && (
                              <div className="text-[10px] text-muted-foreground pl-4">
                                {v.department_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{v.primary_contact_name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" />{v.primary_contact_phone}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono font-semibold">
                            {v.deployed_headcount ?? v.total_workers_count ?? 0}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {v.clra_license || '—'}
                          </TableCell>
                          <TableCell><StatusBadgeInline status={v.status} /></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setViewingVendor(v); setViewVendorModalOpen(true); }}
                                >
                                  <Eye className="h-3 w-3" /> View Vendor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setEditingVendor(v); setVendorModal(true); }}
                                >
                                  <Pencil className="h-3 w-3" /> Edit Vendor
                                </DropdownMenuItem>
                                {v.status === 'ACTIVE' && (
                                  <DropdownMenuItem
                                    className="text-xs gap-1.5 text-amber-600"
                                    onClick={() => updateVendorStatusMutation.mutate({ id: v.id, status: 'SUSPENDED' })}
                                  >
                                    <XCircle className="h-3 w-3" /> Suspend
                                  </DropdownMenuItem>
                                )}
                                {(v.status === 'SUSPENDED' || v.status === 'DRAFT') && (
                                  <DropdownMenuItem
                                    className="text-xs gap-1.5 text-emerald-600"
                                    onClick={() => updateVendorStatusMutation.mutate({ id: v.id, status: 'ACTIVE' })}
                                  >
                                    <CheckCircle2 className="h-3 w-3" /> Activate
                                  </DropdownMenuItem>
                                )}
                                {v.status !== 'TERMINATED' && (
                                  <DropdownMenuItem
                                    className="text-xs gap-1.5 text-rose-600"
                                    onClick={() => updateVendorStatusMutation.mutate({ id: v.id, status: 'TERMINATED' })}
                                  >
                                    <XCircle className="h-3 w-3" /> Terminate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                                  onClick={() => {
                                    const name = v.display_name || v.legal_name || v.vendor_code;
                                    if (window.confirm(`Are you sure you want to delete vendor "${name}"? This action will remove the vendor from active lists.`)) {
                                      deleteVendorMutation.mutate(v.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" /> Delete Vendor
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── CONTRACTS TAB ────────────────────────────────────────────────── */}
            <TabsContent value="contracts">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Contract #</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Scope of Work</TableHead>
                      <TableHead className="text-xs">Branch</TableHead>
                      <TableHead className="text-xs">Period</TableHead>
                      <TableHead className="text-xs">Max HC</TableHead>
                      <TableHead className="text-xs">Deployed</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractsQuery.isLoading ? (
                      <EmptyRow colSpan={9} message="Loading contracts..." />
                    ) : contracts.length === 0 ? (
                      <EmptyRow colSpan={9} message="No contracts found for the selected filters." />
                    ) : (
                      contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs font-mono">{c.contract_number}</TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold">{c.vendor_name}</div>
                            <div className="text-[10px] text-muted-foreground">{c.vendor_code}</div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate" title={c.scope_of_work}>
                            {c.scope_of_work}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium">{formatBranchDisplay(c.branch_name, c.branch_id)}</span>
                            {c.department_name && (
                              <div className="text-[10px] text-muted-foreground">{c.department_name}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{fmtDate(c.contract_start_date)}</div>
                            <div className="text-[10px] text-muted-foreground">to {fmtDate(c.contract_end_date)}</div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-center">{c.maximum_headcount}</TableCell>
                          <TableCell className="text-xs font-mono text-center">{c.deployed_headcount ?? 0}</TableCell>
                          <TableCell><StatusBadgeInline status={c.status} /></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setViewingContract(c); setViewContractModalOpen(true); }}
                                >
                                  <Eye className="h-3 w-3" /> View Contract
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setEditingContract(c); setContractModalOpen(true); }}
                                >
                                  <Pencil className="h-3 w-3" /> Edit Contract
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete contract "${c.contract_number}"? This action cannot be undone.`)) {
                                      deleteContractMutation.mutate(c.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" /> Delete Contract
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── WORKERS TAB ──────────────────────────────────────────────────── */}
            <TabsContent value="workers">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Worker Code</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Skill</TableHead>
                      <TableHead className="text-xs">Mobile</TableHead>
                      <TableHead className="text-xs">Joining Date</TableHead>
                      <TableHead className="text-xs">Deployment</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workersQuery.isLoading ? (
                      <EmptyRow colSpan={9} message="Loading workers..." />
                    ) : workers.length === 0 ? (
                      <EmptyRow colSpan={9} message="No contractor workers found for the selected filters." />
                    ) : (
                      workers.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="text-xs font-mono">{w.worker_code}</TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold">
                              {[w.first_name, w.middle_name, w.last_name].filter(Boolean).join(' ')}
                            </div>
                            {w.designation && (
                              <div className="text-[10px] text-muted-foreground">{w.designation}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{w.vendor_name || '—'}</TableCell>
                          <TableCell>
                            <div className="text-xs">{w.skill}</div>
                            <div className="text-[10px] text-muted-foreground">{w.skill_level}</div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{w.mobile}</TableCell>
                          <TableCell className="text-xs">{fmtDate(w.joining_date)}</TableCell>
                          <TableCell>
                            {w.current_line_name || w.current_machine_name ? (
                              <div>
                                <div className="text-xs">{w.current_line_name || '—'}</div>
                                <div className="text-[10px] text-muted-foreground">{w.current_machine_name}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not Deployed</span>
                            )}
                          </TableCell>
                          <TableCell><StatusBadgeInline status={w.status} /></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setViewingWorker(w); setViewWorkerModalOpen(true); }}
                                >
                                  <Eye className="h-3 w-3" /> View Worker
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setEditingWorker(w); setWorkerModalOpen(true); }}
                                >
                                  <Pencil className="h-3 w-3" /> Edit Worker
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                                  onClick={() => {
                                    const wName = [w.first_name, w.last_name].filter(Boolean).join(' ') || w.worker_code;
                                    if (window.confirm(`Are you sure you want to delete worker "${wName}" (${w.worker_code})? This action cannot be undone.`)) {
                                      deleteWorkerMutation.mutate(w.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" /> Delete Worker
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── DEPLOYMENTS TAB ──────────────────────────────────────────────── */}
            <TabsContent value="deployments">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Worker</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Operational Unit</TableHead>
                      <TableHead className="text-xs">Assigned Machine</TableHead>
                      <TableHead className="text-xs">Shift</TableHead>
                      <TableHead className="text-xs">Start Date</TableHead>
                      <TableHead className="text-xs">Department</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deploymentsQuery.isLoading ? (
                      <EmptyRow colSpan={9} message="Loading deployments..." />
                    ) : deployments.length === 0 ? (
                      <EmptyRow colSpan={9} message="No worker deployments found." />
                    ) : (
                      deployments.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div className="text-xs font-semibold">
                              {[d.first_name, d.last_name].filter(Boolean).join(' ') || d.worker_code}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{d.worker_code}</div>
                          </TableCell>
                          <TableCell className="text-xs">{d.vendor_name || '—'}</TableCell>
                          <TableCell className="text-xs">
                            {d.line_name ? (
                              <div>
                                <span className="font-medium text-foreground">{d.line_name}</span>
                                {d.line_code && (
                                  <span className="text-[10px] text-muted-foreground block font-mono">{d.line_code}</span>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {d.machine_name ? (
                              <div>
                                <span className="font-medium text-foreground">{d.machine_name}</span>
                                {d.machine_code && (
                                  <span className="text-[10px] text-muted-foreground block font-mono">{d.machine_code}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{d.shift_name || '—'}</div>
                            {d.shift_start_time && (
                              <div className="text-[10px] text-muted-foreground">{d.shift_start_time} – {d.shift_end_time}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{fmtDate(d.start_date)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{d.department_name || 'General'}</TableCell>
                          <TableCell><StatusBadgeInline status={d.status} /></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setViewingDeployment(d); setViewDeploymentModalOpen(true); }}
                                >
                                  <Eye className="h-3 w-3" /> View Deployment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 cursor-pointer"
                                  onClick={() => { setEditingDeployment(d); setDeploymentModalOpen(true); }}
                                >
                                  <Pencil className="h-3 w-3" /> Edit Deployment
                                </DropdownMenuItem>
                                {d.status === 'ACTIVE' && (
                                  <DropdownMenuItem
                                    className="text-xs gap-1.5 text-emerald-600 cursor-pointer"
                                    onClick={() => completeDeploymentMutation.mutate(d.id)}
                                  >
                                    <CheckCircle2 className="h-3 w-3" /> Complete Deployment
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs gap-1.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                                  onClick={() => {
                                    const wName = [d.first_name, d.last_name].filter(Boolean).join(' ') || d.worker_code;
                                    if (window.confirm(`Are you sure you want to delete deployment for "${wName}"?`)) {
                                      deleteDeploymentMutation.mutate(d.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" /> Delete Deployment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Vendor Modal */}
      <AddEditVendorModal
        open={vendorModal}
        onOpenChange={setVendorModal}
        vendor={editingVendor}
        companyId={companyId}
        branches={branches}
        onSuccess={onVendorSuccess}
      />

      {/* View Vendor Modal */}
      <ViewVendorModal
        open={viewVendorModalOpen}
        onOpenChange={setViewVendorModalOpen}
        vendor={viewingVendor}
        onEdit={() => {
          setEditingVendor(viewingVendor);
          setViewVendorModalOpen(false);
          setVendorModal(true);
        }}
        onDelete={() => {
          if (viewingVendor && window.confirm(`Are you sure you want to delete vendor "${viewingVendor.display_name || viewingVendor.legal_name}"?`)) {
            deleteVendorMutation.mutate(viewingVendor.id);
            setViewVendorModalOpen(false);
          }
        }}
      />

      {/* Add/Edit Contract Modal */}
      <AddEditContractModal
        open={contractModalOpen}
        onOpenChange={setContractModalOpen}
        contract={editingContract}
        vendors={allVendors}
        branches={branches}
        companyId={companyId}
        onSuccess={onContractSuccess}
      />

      {/* View Contract Modal */}
      <ViewContractModal
        open={viewContractModalOpen}
        onOpenChange={setViewContractModalOpen}
        contract={viewingContract}
        onEdit={() => {
          setEditingContract(viewingContract);
          setViewContractModalOpen(false);
          setContractModalOpen(true);
        }}
        onDelete={() => {
          if (viewingContract && window.confirm(`Are you sure you want to delete contract "${viewingContract.contract_number}"?`)) {
            deleteContractMutation.mutate(viewingContract.id);
            setViewContractModalOpen(false);
          }
        }}
      />

      {/* Add/Edit Worker Modal */}
      <AddEditWorkerModal
        open={workerModalOpen}
        onOpenChange={setWorkerModalOpen}
        worker={editingWorker}
        vendors={allVendors}
        contracts={contracts}
        branches={branches}
        companyId={companyId}
        onSuccess={onWorkerSuccess}
      />

      {/* View Worker Modal */}
      <ViewWorkerModal
        open={viewWorkerModalOpen}
        onOpenChange={setViewWorkerModalOpen}
        worker={viewingWorker}
        onEdit={() => {
          setEditingWorker(viewingWorker);
          setViewWorkerModalOpen(false);
          setWorkerModalOpen(true);
        }}
        onDelete={() => {
          if (viewingWorker) {
            const wName = [viewingWorker.first_name, viewingWorker.last_name].filter(Boolean).join(' ') || viewingWorker.worker_code;
            if (window.confirm(`Are you sure you want to delete worker "${wName}"?`)) {
              deleteWorkerMutation.mutate(viewingWorker.id);
              setViewWorkerModalOpen(false);
            }
          }
        }}
      />

      {/* Add/Edit Deployment Modal */}
      <AddEditDeploymentModal
        open={deploymentModalOpen}
        onOpenChange={setDeploymentModalOpen}
        deployment={editingDeployment}
        workers={workers}
        vendors={allVendors}
        contracts={contracts}
        branches={branches}
        companyId={companyId}
        onSuccess={onDeploymentSuccess}
      />

      {/* View Deployment Modal */}
      <ViewDeploymentModal
        open={viewDeploymentModalOpen}
        onOpenChange={setViewDeploymentModalOpen}
        deployment={viewingDeployment}
        onEdit={() => {
          setEditingDeployment(viewingDeployment);
          setViewDeploymentModalOpen(false);
          setDeploymentModalOpen(true);
        }}
        onDelete={() => {
          if (viewingDeployment) {
            if (window.confirm(`Are you sure you want to delete this deployment?`)) {
              deleteDeploymentMutation.mutate(viewingDeployment.id);
              setViewDeploymentModalOpen(false);
            }
          }
        }}
      />
    </div>
  );
}
