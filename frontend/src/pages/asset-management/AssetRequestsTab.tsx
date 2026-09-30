import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Boxes,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Send,
  Eye,
  Check,
  X,
  Undo2,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  User,
  Info,
} from 'lucide-react';
import { assetRequestsApi, assetsApi } from '@/api/asset-management';
import { branchesApi } from '@/api/organization';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser, isSuperAdminUser, isCompanyAdminUser, isHrOrAdminUser } from '@/lib/modules';
import { AssetBranchFilter, matchAssetBranch } from './AssetBranchFilter';
import { INDUSTRY_SECTOR_PRESETS } from './assetCategoryConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/stat-card';
import type { Asset, AssetRequest, AssetRequestPriority, AssetRequestStatus } from '@/api/types';

export function AssetRequestsTab({ companyId, branchId: propBranchId }: { companyId?: string; branchId?: string }) {
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompany();
  const user = useAuthStore((s) => s.user);

  const isBranchAdmin = isBranchAdminUser(user);
  const isSuperOrCompanyAdmin = isSuperAdminUser(user) || isCompanyAdminUser(user);
  const isHrOrAdmin = isHrOrAdminUser(user) || isSuperOrCompanyAdmin || isBranchAdmin;

  const userAssignedBranchId = propBranchId || user?.branchId || user?.employee?.branchId;
  const userAssignedCompanyId = user?.companyId || (user?.employee as any)?.companyId;
  const effectiveCompanyId = companyId || (isBranchAdmin && userAssignedCompanyId ? userAssignedCompanyId : activeCompanyId);

  // Filter States
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(() =>
    isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'HEAD_OFFICE'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Employee View Tab (My Requests vs My Assets)
  const [employeeSubTab, setEmployeeSubTab] = useState<'requests' | 'my-assets'>('requests');

  // Modals State
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);

  // New Request Form State
  const [newCategory, setNewCategory] = useState(INDUSTRY_SECTOR_PRESETS[0].categories[0]);
  const [newSpecification, setNewSpecification] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newRequiredDate, setNewRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [newPriority, setNewPriority] = useState<AssetRequestPriority>('NORMAL');
  const [newReason, setNewReason] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  // Review Form State
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'SENT_BACK'>('APPROVE');
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Allocate Form State
  const [targetAssetId, setTargetAssetId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  // Queries
  const { data: branches = [] } = useQuery({
    queryKey: ['branches', effectiveCompanyId],
    queryFn: () => branchesApi.list(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
  });

  // Admin: List all requests for active tenant
  const { data: allRequests = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['asset-requests', effectiveCompanyId, isBranchAdmin ? userAssignedBranchId : undefined],
    queryFn: () =>
      assetRequestsApi.list({
        companyId: effectiveCompanyId,
        branchId: isBranchAdmin ? userAssignedBranchId : undefined,
      }),
    enabled: isHrOrAdmin,
  });

  // Employee: List own requests
  const { data: myRequests = [], isLoading: isLoadingMyRequests } = useQuery({
    queryKey: ['my-asset-requests'],
    queryFn: () => assetRequestsApi.getMyRequests(),
    enabled: !isHrOrAdmin,
  });

  // Employee: List own allocated assets
  const { data: myAssets = [], isLoading: isLoadingMyAssets } = useQuery({
    queryKey: ['my-allocated-assets'],
    queryFn: () => assetRequestsApi.getMyAssets(),
    enabled: !isHrOrAdmin,
  });

  // Available assets for allocation modal (only when modal is open)
  const { data: availableStock = [] } = useQuery({
    queryKey: ['available-assets-for-request', selectedRequest?.companyId, selectedRequest?.branchId],
    queryFn: () => assetsApi.list(selectedRequest?.companyId, selectedRequest?.branchId || undefined),
    enabled: isAllocateOpen && !!selectedRequest,
  });

  // Eligible assets in stock
  const matchingAssetsInStock = useMemo(() => {
    if (!selectedRequest) return [];
    return availableStock.filter(
      (a) =>
        (a.status === 'IN_STOCK' || a.status === 'AVAILABLE') &&
        (!selectedRequest.category || a.category.toLowerCase() === selectedRequest.category.toLowerCase())
    );
  }, [availableStock, selectedRequest]);

  // Categories list
  const allCategories = useMemo(() => {
    const list: string[] = [];
    INDUSTRY_SECTOR_PRESETS.forEach((preset) => {
      preset.categories.forEach((cat) => {
        if (!list.includes(cat)) list.push(cat);
      });
    });
    return list;
  }, []);

  // Filtered requests for Admin View
  const filteredAdminRequests = useMemo(() => {
    return allRequests.filter((req) => {
      // 1. Branch scoping
      if (!matchAssetBranch(req, selectedBranchFilter, isBranchAdmin, userAssignedBranchId, branches)) {
        return false;
      }
      // 2. Status filter
      if (selectedStatus !== 'ALL' && req.status !== selectedStatus) {
        return false;
      }
      // 3. Category filter
      if (selectedCategory !== 'ALL' && req.category !== selectedCategory) {
        return false;
      }
      // 4. Priority filter
      if (selectedPriority !== 'ALL' && req.priority !== selectedPriority) {
        return false;
      }
      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = req.employee
          ? `${req.employee.firstName} ${req.employee.lastName || ''} ${req.employee.employeeCode || ''}`.toLowerCase()
          : '';
        const match =
          req.requestNumber.toLowerCase().includes(q) ||
          req.category.toLowerCase().includes(q) ||
          (req.specification && req.specification.toLowerCase().includes(q)) ||
          req.reason.toLowerCase().includes(q) ||
          empName.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    allRequests,
    selectedBranchFilter,
    isBranchAdmin,
    userAssignedBranchId,
    branches,
    selectedStatus,
    selectedCategory,
    selectedPriority,
    searchQuery,
  ]);

  // KPI Metrics for Admin
  const metrics = useMemo(() => {
    const total = filteredAdminRequests.length;
    const pendingApproval = filteredAdminRequests.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'PENDING_APPROVAL'
    ).length;
    const readyForAllocation = filteredAdminRequests.filter((r) => r.status === 'APPROVED').length;
    const waitingProcurement = filteredAdminRequests.filter((r) => r.status === 'WAITING_PROCUREMENT').length;
    const allocated = filteredAdminRequests.filter((r) => r.status === 'ALLOCATED').length;

    return { total, pendingApproval, readyForAllocation, waitingProcurement, allocated };
  }, [filteredAdminRequests]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedBranchFilter !== (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'HEAD_OFFICE') ||
    selectedStatus !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedPriority !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBranchFilter(isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'HEAD_OFFICE');
    setSelectedStatus('ALL');
    setSelectedCategory('ALL');
    setSelectedPriority('ALL');
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => assetRequestsApi.create(payload),
    onSuccess: () => {
      toast.success('Asset request submitted successfully.');
      setIsNewRequestOpen(false);
      resetNewRequestForm();
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-asset-requests'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit asset request.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload, reqNumber }: { id: string; payload: any; reqNumber?: string }) =>
      assetRequestsApi.review(id, payload).then((res) => ({ ...res, _reqNumber: reqNumber })),
    onSuccess: (_, vars) => {
      const isApproved = vars.payload.action === 'APPROVE';
      const verb = isApproved ? 'approved' : vars.payload.action === 'REJECT' ? 'rejected' : 'sent back';
      const num = vars.reqNumber || selectedRequest?.requestNumber || '';
      if (isApproved) {
        toast.success(`Request ${num ? '#' + num : ''} approved! Moved to Asset Allocation stage.`);
      } else {
        toast.success(`Request ${num ? '#' + num : ''} has been ${verb}.`);
      }
      setIsReviewOpen(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-asset-requests'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to review asset request.');
    },
  });

  const handleQuickApprove = (req: AssetRequest) => {
    setSelectedRequest(req);
    reviewMutation.mutate({
      id: req.id,
      reqNumber: req.requestNumber,
      payload: {
        action: 'APPROVE',
        remarks: 'Approved by manager / admin',
      },
    });
  };

  const submitReview = (action: 'APPROVE' | 'REJECT' | 'SENT_BACK') => {
    if (!selectedRequest) return;
    if (action === 'REJECT' && !reviewFeedback.trim()) {
      toast.error('Please specify a rejection reason in the notes field.');
      return;
    }
    if (action === 'SENT_BACK' && !reviewFeedback.trim()) {
      toast.error('Please specify modification notes for the employee.');
      return;
    }

    reviewMutation.mutate({
      id: selectedRequest.id,
      reqNumber: selectedRequest.requestNumber,
      payload: {
        action,
        rejectionReason: reviewFeedback,
        remarks: reviewFeedback || (action === 'APPROVE' ? 'Approved by manager / admin' : undefined),
      },
    });
  };

  const procurementMutation = useMutation({
    mutationFn: (id: string) => assetRequestsApi.markWaitingProcurement(id),
    onSuccess: () => {
      toast.success('Request marked as waiting procurement / stock.');
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update request.');
    },
  });

  const allocateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => assetRequestsApi.allocate(id, payload),
    onSuccess: () => {
      toast.success(`Asset successfully allocated to employee against request #${selectedRequest?.requestNumber}.`);
      setIsAllocateOpen(false);
      setSelectedRequest(null);
      setTargetAssetId('');
      setExpectedReturnDate('');
      setAllocationNotes('');
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['my-asset-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-allocated-assets'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to allocate asset.');
    },
  });

  const resetNewRequestForm = () => {
    setNewCategory(INDUSTRY_SECTOR_PRESETS[0].categories[0]);
    setNewSpecification('');
    setNewQuantity(1);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNewRequiredDate(d.toISOString().split('T')[0]);
    setNewPriority('NORMAL');
    setNewReason('');
    setNewRemarks('');
  };

  const handleOpenReview = (req: AssetRequest) => {
    setSelectedRequest(req);
    setReviewAction('APPROVE');
    setReviewFeedback('');
    setIsReviewOpen(true);
  };

  const handleOpenAllocate = (req: AssetRequest) => {
    setSelectedRequest(req);
    setTargetAssetId('');
    setExpectedReturnDate('');
    setAllocationNotes('');
    setIsAllocateOpen(true);
  };

  const handleNewRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) {
      toast.error('Please provide a reason for the asset request.');
      return;
    }

    createMutation.mutate({
      companyId: effectiveCompanyId,
      category: newCategory,
      specification: newSpecification,
      quantity: Number(newQuantity),
      requiredDate: newRequiredDate,
      priority: newPriority,
      reason: newReason,
      remarks: newRemarks,
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview(reviewAction);
  };

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!targetAssetId) {
      toast.error('Please select an asset from Asset Master to allocate.');
      return;
    }

    allocateMutation.mutate({
      id: selectedRequest.id,
      payload: {
        assetId: targetAssetId,
        allocationDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: expectedReturnDate || undefined,
        allocationNotes: allocationNotes || undefined,
      },
    });
  };

  const renderStatusBadge = (status: AssetRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">Approved (Ready)</Badge>;
      case 'ALLOCATED':
        return <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] font-semibold">Allocated</Badge>;
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold">Pending Approval</Badge>;
      case 'WAITING_PROCUREMENT':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] font-semibold">Waiting Stock</Badge>;
      case 'SENT_BACK':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] font-semibold">Sent Back</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. ADMIN VIEW
  // ─────────────────────────────────────────────────────────────
  if (isHrOrAdmin) {
    return (
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={Boxes}
            label="Total Requests"
            value={metrics.total.toString()}
            hint="Across active branches"
            accent="info"
          />
          <StatCard
            icon={Clock}
            label="Pending Approval"
            value={metrics.pendingApproval.toString()}
            hint="Requires Manager review"
            accent="warning"
          />
          <StatCard
            icon={PackageCheck}
            label="Ready for Allocation"
            value={metrics.readyForAllocation.toString()}
            hint="Approved requests"
            accent="success"
          />
          <StatCard
            icon={ShoppingCart}
            label="Waiting Stock / Procurement"
            value={metrics.waitingProcurement.toString()}
            hint="Unavailable in stock"
            accent="primary"
          />
        </div>

        {/* Requests Management Card */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Asset Requests & Allocation Queue</CardTitle>
                <CardDescription className="text-xs">
                  Review employee hardware and equipment requests, verify stock in Asset Master, and issue allocations.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => {
                  resetNewRequestForm();
                  setIsNewRequestOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Create Request on Behalf
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* ── Search & Filter Controls Bar (Same as Master & Employee Module) ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/60">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search Request #, Employee, Category, Reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Branch Filter */}
                <AssetBranchFilter
                  isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
                  isBranchAdmin={isBranchAdmin}
                  selectedBranch={selectedBranchFilter}
                  onBranchChange={setSelectedBranchFilter}
                  branches={branches}
                  assignedBranchName={branches.find((b) => b.id === userAssignedBranchId)?.name}
                />

                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="APPROVED">Approved (Ready)</SelectItem>
                    <SelectItem value="WAITING_PROCUREMENT">Waiting Stock</SelectItem>
                    <SelectItem value="ALLOCATED">Allocated</SelectItem>
                    <SelectItem value="SENT_BACK">Sent Back</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Request #</TableHead>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Branch & Department</TableHead>
                  <TableHead className="text-xs">Category & Specs</TableHead>
                  <TableHead className="text-xs">Qty / Required Date</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAll ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      Loading asset requests...
                    </TableCell>
                  </TableRow>
                ) : filteredAdminRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      No asset requests matching selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdminRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {req.requestNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground block">
                          {req.employee?.firstName} {req.employee?.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {req.employee?.employeeCode || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="block font-medium text-foreground">
                          {req.branch?.name || 'Head Office'}
                        </span>
                        <span className="text-[10px]">{req.department?.name || 'General'}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground block">{req.category}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px] block" title={req.specification || req.reason}>
                          {req.specification || req.reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <span className="font-bold text-foreground">Qty: {req.quantity}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          Due: {new Date(req.requiredDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {req.priority === 'URGENT' ? (
                          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold">
                            URGENT
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            NORMAL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {renderStatusBadge(req.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manager Review Action */}
                          {(req.status === 'SUBMITTED' || req.status === 'PENDING_APPROVAL') && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                disabled={reviewMutation.isPending}
                                onClick={() => handleQuickApprove(req)}
                                title="1-Click Approve (moves request to Approved for Asset Allocation)"
                              >
                                <Check className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-medium gap-1 text-primary border-primary/30 hover:bg-primary/5"
                                onClick={() => handleOpenReview(req)}
                                title="Review with optional notes, send back, or reject"
                              >
                                <ShieldCheck className="h-3 w-3" /> Review
                              </Button>
                            </>
                          )}

                          {/* Allocation Actions */}
                          {(req.status === 'APPROVED' || req.status === 'WAITING_PROCUREMENT') && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleOpenAllocate(req)}
                              >
                                <PackageCheck className="h-3 w-3" /> Allocate Asset
                              </Button>
                              {req.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => procurementMutation.mutate(req.id)}
                                  title="Mark as Waiting Stock / Procurement"
                                >
                                  Stock Out
                                </Button>
                              )}
                            </>
                          )}

                          {req.status === 'ALLOCATED' && req.allocatedAsset && (
                            <Badge variant="outline" className="text-[10px] gap-1 font-mono text-emerald-600 border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" /> {req.allocatedAsset.assetTag}
                            </Badge>
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

        {/* ── MODALS (Admin) ── */}
        {/* 1. Manager Review Modal */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Review Asset Request</DialogTitle>
              <DialogDescription className="text-xs">
                Request #{selectedRequest?.requestNumber} for {selectedRequest?.employee?.firstName} {selectedRequest?.employee?.lastName} ({selectedRequest?.category})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1">
                <div><strong>Requested Category:</strong> {selectedRequest?.category}</div>
                <div><strong>Specifications:</strong> {selectedRequest?.specification || 'Standard specification'}</div>
                <div><strong>Reason:</strong> {selectedRequest?.reason}</div>
                <div><strong>Required By:</strong> {selectedRequest?.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString() : 'N/A'}</div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Review Decision</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={reviewAction === 'APPROVE' ? 'default' : 'outline'}
                    className={`h-8 text-xs font-semibold ${reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => setReviewAction('APPROVE')}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    type="button"
                    variant={reviewAction === 'SENT_BACK' ? 'default' : 'outline'}
                    className={`h-8 text-xs font-semibold ${reviewAction === 'SENT_BACK' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    onClick={() => setReviewAction('SENT_BACK')}
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-1" /> Send Back
                  </Button>
                  <Button
                    type="button"
                    variant={reviewAction === 'REJECT' ? 'default' : 'outline'}
                    className={`h-8 text-xs font-semibold ${reviewAction === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                    onClick={() => setReviewAction('REJECT')}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  {reviewAction === 'REJECT' ? 'Rejection Reason (Required)' : reviewAction === 'SENT_BACK' ? 'Modification Notes (Required)' : 'Approval Notes (Optional)'}
                </Label>
                <Textarea
                  placeholder="Provide remarks or instructions for the employee..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>

              <DialogFooter className="gap-2 sm:justify-between pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsReviewOpen(false)}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {reviewAction === 'APPROVE' && (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={reviewMutation.isPending}
                      className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {reviewMutation.isPending ? 'Approving...' : 'Confirm & Approve'}
                    </Button>
                  )}
                  {reviewAction === 'SENT_BACK' && (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={reviewMutation.isPending}
                      className="h-8 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      {reviewMutation.isPending ? 'Sending back...' : 'Confirm Send Back'}
                    </Button>
                  )}
                  {reviewAction === 'REJECT' && (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={reviewMutation.isPending}
                      className="h-8 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      {reviewMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 2. Stock Check & Allocate Modal */}
        <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Allocate Asset from Inventory</DialogTitle>
              <DialogDescription className="text-xs">
                Select an available asset from Asset Master to assign to {selectedRequest?.employee?.firstName} {selectedRequest?.employee?.lastName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between">
                  <span><strong>Employee:</strong> {selectedRequest?.employee?.firstName} {selectedRequest?.employee?.lastName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{selectedRequest?.employee?.employeeCode}</span>
                </div>
                <div><strong>Requested Category:</strong> {selectedRequest?.category}</div>
                <div><strong>Specifications:</strong> {selectedRequest?.specification || 'None'}</div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Select Available Asset from Master</Label>
                  <Badge variant="outline" className="text-[10px]">
                    {matchingAssetsInStock.length} In-Stock Matches
                  </Badge>
                </div>

                {matchingAssetsInStock.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 text-xs">
                    No "{selectedRequest?.category}" currently available in stock for this branch. You can register one in Asset Master or mark this request as "Waiting Stock".
                  </div>
                ) : (
                  <Select value={targetAssetId} onValueChange={setTargetAssetId}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="-- Choose an in-stock asset --" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchingAssetsInStock.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id} className="text-xs">
                          {asset.assetTag} — {asset.name} {asset.serialNumber ? `(S/N: ${asset.serialNumber})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Expected Return Date (Optional)</Label>
                <Input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Allocation Remarks</Label>
                <Textarea
                  placeholder="e.g., Delivered with original charger and mouse pad."
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAllocateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={allocateMutation.isPending || !targetAssetId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {allocateMutation.isPending ? 'Allocating...' : 'Complete Allocation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 3. New Request Dialog (Admin on behalf) */}
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">New Asset Request</DialogTitle>
              <DialogDescription className="text-xs">
                Submit an organizational asset requisition.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleNewRequestSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Asset Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Specifications / Model Preference</Label>
                <Input
                  type="text"
                  placeholder="e.g. 16GB RAM, M2/M3, 15-inch screen"
                  value={newSpecification}
                  onChange={(e) => setNewSpecification(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={newPriority} onValueChange={(val: any) => setNewPriority(val)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Required By Date</Label>
                <Input
                  type="date"
                  value={newRequiredDate}
                  onChange={(e) => setNewRequiredDate(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Business Reason / Purpose (Required)</Label>
                <Textarea
                  placeholder="State the project, role requirement, or replacement reason..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNewRequestOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. EMPLOYEE SELF-SERVICE VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">My Asset Self-Service</h2>
          <p className="text-xs text-muted-foreground">
            Request organizational hardware and equipment, track approvals, and view your active asset custody.
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => {
            resetNewRequestForm();
            setIsNewRequestOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New Asset Request
        </Button>
      </div>

      <Tabs value={employeeSubTab} onValueChange={(val: any) => setEmployeeSubTab(val)} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="requests" className="text-xs font-medium gap-1.5">
            <Clock className="h-3.5 w-3.5" /> My Asset Requests ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="my-assets" className="text-xs font-medium gap-1.5">
            <Laptop className="h-3.5 w-3.5" /> My Assets in Custody ({myAssets.length})
          </TabsTrigger>
        </TabsList>

        {/* SUBTAB 1: MY ASSET REQUESTS */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Request #</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Specifications</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Required Date</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Remarks / Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingMyRequests ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                        Loading your asset requests...
                      </TableCell>
                    </TableRow>
                  ) : myRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                        <div className="space-y-2">
                          <p>You have not raised any asset requests yet.</p>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsNewRequestOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Raise First Request
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    myRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {req.requestNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{req.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={req.specification || req.reason}>
                          {req.specification || req.reason}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold">{req.quantity}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(req.requiredDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {req.priority === 'URGENT' ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold">URGENT</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">NORMAL</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {renderStatusBadge(req.status)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {req.rejectionReason || req.remarks || (req.allocatedAsset ? `Allocated: ${req.allocatedAsset.assetTag}` : '-')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBTAB 2: MY ASSETS IN CUSTODY */}
        <TabsContent value="my-assets" className="space-y-4">
          {isLoadingMyAssets ? (
            <div className="text-center py-8 text-xs text-muted-foreground">Loading your assigned assets...</div>
          ) : myAssets.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Laptop className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold">No Assets Assigned</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                You currently do not have any company hardware or devices allocated to your employee profile.
              </p>
              <Button size="sm" className="mt-4 text-xs font-semibold gap-1.5" onClick={() => setIsNewRequestOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Request an Asset
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAssets.map((asset) => {
                const activeAlloc = asset.allocations?.[0];
                return (
                  <Card key={asset.id} className="shadow-xs border-border/80 hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Laptop className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{asset.name}</CardTitle>
                            <span className="font-mono text-[10px] text-primary font-bold">{asset.assetTag}</span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                          In Use
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-xs space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium text-foreground">{asset.category}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Serial Number:</span>
                        <span className="font-mono font-medium text-foreground">{asset.serialNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Allocated Date:</span>
                        <span className="font-mono font-medium text-foreground">
                          {activeAlloc?.allocatedAt ? new Date(activeAlloc.allocatedAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground">{asset.physicalLocation || asset.branch?.name || 'Assigned'}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Request Modal for Employee */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Submit Asset Request</DialogTitle>
            <DialogDescription className="text-xs">
              Request organizational equipment. Your department manager will review the request before stock allocation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleNewRequestSubmit} className="space-y-3.5 text-xs">
            {/* Auto-filled details info box */}
            <div className="bg-muted/40 p-2.5 rounded-lg border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester:</span>
                <span className="font-semibold text-foreground">
                  {user?.employee?.firstName || user?.name || 'Current User'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company & Branch:</span>
                <span className="font-medium text-foreground">
                  {user?.branch?.name || 'Head Office'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Asset Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Specification / Configuration</Label>
              <Input
                type="text"
                placeholder="e.g. 16GB RAM, M2/M3, 15-inch display"
                value={newSpecification}
                onChange={(e) => setNewSpecification(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={newPriority} onValueChange={(val: any) => setNewPriority(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Required By Date</Label>
              <Input
                type="date"
                value={newRequiredDate}
                onChange={(e) => setNewRequiredDate(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Business Reason / Purpose</Label>
              <Textarea
                placeholder="Explain why you require this equipment (project work, new onboarding, replacement)..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewRequestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending} className="bg-primary text-primary-foreground">
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
