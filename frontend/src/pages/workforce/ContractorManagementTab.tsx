import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Building2, ShieldCheck, FileText, Users, RefreshCw,
  Pencil, MoreHorizontal, UserCheck, Briefcase, AlertTriangle, Eye,
  CheckCircle2, XCircle, Clock, MapPin, Phone, Mail,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { contractorApi, type ContractorVendor, type ContractorContract, type ContractorWorker, type WorkerDeployment, type ContractorCompliance } from '@/api/contractor-management';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';
import { ContractorKpiCards } from '@/pages/workforce/contractors/ContractorKpiCards';
import { AddEditVendorModal } from '@/pages/workforce/contractors/AddEditVendorModal';
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
    isBranchUser, userAssignedBranchId,
  } = useWorkforceBranch();

  const queryClient = useQueryClient();

  // Determine branch param for API
  const branchIdParam =
    isBranchUser && userAssignedBranchId ? userAssignedBranchId :
    selectedBranch !== 'HEAD_OFFICE' && selectedBranch !== 'ALL' ? selectedBranch : undefined;

  const [tab, setTab] = useState('vendors');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Vendor modal state
  const [vendorModal, setVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<ContractorVendor | null>(null);

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
    enabled: !!companyId && tab === 'vendors',
  });

  const contractsQuery = useQuery({
    queryKey: ['contractor-contracts', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getContracts({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId && tab === 'contracts',
  });

  const workersQuery = useQuery({
    queryKey: ['contractor-workers', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getWorkers({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId && tab === 'workers',
  });

  const deploymentsQuery = useQuery({
    queryKey: ['contractor-deployments', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getDeployments({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId && tab === 'deployments',
  });

  const complianceQuery = useQuery({
    queryKey: ['contractor-compliance', companyId, branchIdParam, statusFilter, search],
    queryFn: () => contractorApi.getCompliance({
      companyId,
      branchId: branchIdParam,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined,
    }),
    enabled: !!companyId && tab === 'compliance',
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

  const completeDeploymentMutation = useMutation({
    mutationFn: (id: string) => contractorApi.completeDeployment(id),
    onSuccess: () => {
      toast.success('Deployment completed');
      queryClient.invalidateQueries({ queryKey: ['contractor-deployments'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to complete deployment'),
  });

  const verifyComplianceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      contractorApi.verifyCompliance(id, { status }),
    onSuccess: () => {
      toast.success('Compliance record updated');
      queryClient.invalidateQueries({ queryKey: ['contractor-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update compliance'),
  });

  const onVendorSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contractor-vendors'] });
    queryClient.invalidateQueries({ queryKey: ['contractor-dashboard'] });
  }, [queryClient]);

  const handleTabChange = (t: string) => {
    setTab(t);
    setSearch('');
    setStatusFilter('ALL');
  };

  // ── Status options per tab ────────────────────────────────────────────────────
  const vendorStatusOptions = ['ALL', 'ACTIVE', 'DRAFT', 'EXPIRING', 'SUSPENDED', 'EXPIRED', 'TERMINATED'];
  const contractStatusOptions = ['ALL', 'ACTIVE', 'DRAFT', 'EXPIRING', 'EXPIRED', 'SUSPENDED', 'RENEWED', 'TERMINATED'];
  const workerStatusOptions = ['ALL', 'ACTIVE', 'INACTIVE', 'ON_LEAVE', 'EXITED', 'SUSPENDED'];
  const deploymentStatusOptions = ['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED', 'TRANSFERRED', 'CANCELLED'];
  const complianceStatusOptions = ['ALL', 'VALID', 'EXPIRING', 'EXPIRED', 'PENDING_VERIFICATION', 'REJECTED'];

  const statusOptions =
    tab === 'vendors' ? vendorStatusOptions :
    tab === 'contracts' ? contractStatusOptions :
    tab === 'workers' ? workerStatusOptions :
    tab === 'deployments' ? deploymentStatusOptions :
    complianceStatusOptions;

  const vendors: ContractorVendor[] = vendorsQuery.data || [];
  const contracts: ContractorContract[] = contractsQuery.data || [];
  const workers: ContractorWorker[] = workersQuery.data || [];
  const deployments: WorkerDeployment[] = deploymentsQuery.data || [];
  const compliance: ContractorCompliance[] = complianceQuery.data || [];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <ContractorKpiCards
        data={dashboardQuery.data || null}
        loading={dashboardQuery.isLoading}
      />

      {/* Main Card */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Contractor Management</CardTitle>
            <CardDescription>
              Manage staffing vendors, contracts, contractor workers, deployments &amp; statutory compliance
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-32">
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
            />

            {/* Refresh */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['contractor-'] })}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            {/* Add Vendor (vendors tab only) */}
            {tab === 'vendors' && (
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => { setEditingVendor(null); setVendorModal(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Vendor
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="mb-4 h-8 text-xs">
              <TabsTrigger value="vendors" className="text-xs gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Vendors
                {vendors.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{vendors.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Contracts
                {contracts.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{contracts.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="workers" className="text-xs gap-1.5">
                <UserCheck className="h-3.5 w-3.5" /> Workers
                {workers.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{workers.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="deployments" className="text-xs gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Deployments
                {deployments.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{deployments.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="compliance" className="text-xs gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Compliance
                {compliance.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{compliance.length}</Badge>}
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
                      <TableHead className="text-xs">Type</TableHead>
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
                      <EmptyRow colSpan={9} message="Loading vendors..." />
                    ) : vendors.length === 0 ? (
                      <EmptyRow colSpan={9} message="No staffing vendors found. Click 'Add Vendor' to register one." />
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
                          <TableCell className="text-xs text-muted-foreground">
                            {v.vendor_type.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {v.branch_name || '—'}
                            </span>
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
                                  className="text-xs gap-1.5"
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractsQuery.isLoading ? (
                      <EmptyRow colSpan={8} message="Loading contracts..." />
                    ) : contracts.length === 0 ? (
                      <EmptyRow colSpan={8} message="No contracts found for the selected filters." />
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
                          <TableCell className="text-xs">{c.branch_name || '—'}</TableCell>
                          <TableCell>
                            <div className="text-xs">{fmtDate(c.contract_start_date)}</div>
                            <div className="text-[10px] text-muted-foreground">to {fmtDate(c.contract_end_date)}</div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-center">{c.maximum_headcount}</TableCell>
                          <TableCell className="text-xs font-mono text-center">{c.deployed_headcount ?? 0}</TableCell>
                          <TableCell><StatusBadgeInline status={c.status} /></TableCell>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workersQuery.isLoading ? (
                      <EmptyRow colSpan={8} message="Loading workers..." />
                    ) : workers.length === 0 ? (
                      <EmptyRow colSpan={8} message="No contractor workers found for the selected filters." />
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
                      <TableHead className="text-xs">Production Line</TableHead>
                      <TableHead className="text-xs">Machine</TableHead>
                      <TableHead className="text-xs">Shift</TableHead>
                      <TableHead className="text-xs">Start Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
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
                          <TableCell className="text-xs">{d.line_name || '—'}</TableCell>
                          <TableCell className="text-xs">{d.machine_name || '—'}</TableCell>
                          <TableCell>
                            <div className="text-xs">{d.shift_name || '—'}</div>
                            {d.shift_start_time && (
                              <div className="text-[10px] text-muted-foreground">{d.shift_start_time} – {d.shift_end_time}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{fmtDate(d.start_date)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{d.deployment_type}</TableCell>
                          <TableCell><StatusBadgeInline status={d.status} /></TableCell>
                          <TableCell>
                            {d.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => completeDeploymentMutation.mutate(d.id)}
                              >
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── COMPLIANCE TAB ───────────────────────────────────────────────── */}
            <TabsContent value="compliance">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">License No.</TableHead>
                      <TableHead className="text-xs">Issuing Authority</TableHead>
                      <TableHead className="text-xs">Issue Date</TableHead>
                      <TableHead className="text-xs">Expiry Date</TableHead>
                      <TableHead className="text-xs">Days Left</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceQuery.isLoading ? (
                      <EmptyRow colSpan={9} message="Loading compliance records..." />
                    ) : compliance.length === 0 ? (
                      <EmptyRow colSpan={9} message="No compliance records found." />
                    ) : (
                      compliance.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="text-xs font-semibold">{c.vendor_name}</div>
                            <div className="text-[10px] text-muted-foreground">{c.vendor_code}</div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{c.compliance_type}</TableCell>
                          <TableCell className="text-xs font-mono">{c.license_number}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.issuing_authority || '—'}</TableCell>
                          <TableCell className="text-xs">{fmtDate(c.issue_date)}</TableCell>
                          <TableCell className="text-xs">{fmtDate(c.expiry_date)}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-mono font-semibold ${
                              (c.days_remaining ?? 999) <= 30 ? 'text-rose-600' :
                              (c.days_remaining ?? 999) <= 90 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {c.days_remaining != null ? `${c.days_remaining}d` : '—'}
                            </span>
                          </TableCell>
                          <TableCell><StatusBadgeInline status={c.status} /></TableCell>
                          <TableCell>
                            {c.status === 'PENDING_VERIFICATION' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-xs gap-1.5 text-emerald-600"
                                    onClick={() => verifyComplianceMutation.mutate({ id: c.id, status: 'VALID' })}
                                  >
                                    <CheckCircle2 className="h-3 w-3" /> Verify
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-xs gap-1.5 text-rose-600"
                                    onClick={() => verifyComplianceMutation.mutate({ id: c.id, status: 'REJECTED' })}
                                  >
                                    <XCircle className="h-3 w-3" /> Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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
    </div>
  );
}
