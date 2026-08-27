import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
  Building2,
  Tag,
  Clock,
  ShieldAlert,
  FileText,
  User,
  Info,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  History,
  FileSpreadsheet,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { assetMaintenanceApi, assetsApi } from '@/api/asset-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Asset, AssetMaintenanceRecord } from '@/api/types';

const MAINTENANCE_TYPES = ['Repair', 'Preventive Maintenance', 'Warranty Claim', 'Inspection'];
const PRIORITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'];
const CONDITION_OPTIONS = ['GOOD', 'EXCELLENT', 'FAIR', 'DAMAGED'];

export function MaintenanceTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();

  // Navigation Sub-Tab State inside Maintenance Page
  const [activeSubTab, setActiveSubTab] = useState<'work-orders' | 'requests' | 'history'>('work-orders');

  // Create Work Order Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Complete Maintenance Modal State
  const [selectedAssetForCompletion, setSelectedAssetForCompletion] = useState<Asset | null>(null);
  const [activeRecordForCompletion, setActiveRecordForCompletion] = useState<AssetMaintenanceRecord | null>(null);

  // Send to Maintenance / Work Order Form Fields
  const [targetAssetId, setTargetAssetId] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [maintenanceType, setMaintenanceType] = useState('Repair');
  const [vendor, setVendor] = useState('');
  const [warrantyClaim, setWarrantyClaim] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  // Complete Maintenance & QC Form Fields
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalCondition, setFinalCondition] = useState('GOOD');
  const [actualCost, setActualCost] = useState('');
  const [completionVendor, setCompletionVendor] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [qcStatus, setQcStatus] = useState('PASS');
  const [repairNotes, setRepairNotes] = useState('');

  // Queries
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
  });

  const { data: records = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['asset-maintenance'],
    queryFn: () => assetMaintenanceApi.list(),
  });

  // Selected Target Asset for Create Modal
  const selectedTargetAsset = useMemo(() => {
    return assets.find((a) => a.id === targetAssetId) || null;
  }, [assets, targetAssetId]);

  // Assets currently in UNDER_MAINTENANCE status
  const assetsUnderMaintenance = assets.filter((a) => a.status === 'UNDER_MAINTENANCE');

  // Eligible assets for sending to maintenance (IN_STOCK or ALLOCATED)
  const eligibleAssets = assets.filter((a) => a.status === 'IN_STOCK' || a.status === 'AVAILABLE' || a.status === 'ALLOCATED');

  // Active records undergoing maintenance
  const activeRecords = useMemo(() => {
    return records.filter((r) => !r.endDate);
  }, [records]);

  // Completed records
  const completedRecords = useMemo(() => {
    return records.filter((r) => !!r.endDate);
  }, [records]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const pendingRequestsCount = activeRecords.filter((r) => r.qcStatus === 'PENDING' || !r.qcStatus).length;
    const activeWorkOrdersCount = assetsUnderMaintenance.length;
    const underInspectionCount = activeRecords.filter((r) => r.maintenanceType === 'Inspection' || r.qcStatus === 'PENDING').length;
    const completedCount = completedRecords.length;
    const totalCostSum = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      pendingRequests: pendingRequestsCount,
      activeWorkOrders: activeWorkOrdersCount,
      underInspection: underInspectionCount,
      completed: completedCount,
      totalCost: totalCostSum,
    };
  }, [activeRecords, assetsUnderMaintenance, completedRecords, records]);

  // Create Maintenance Record Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => assetMaintenanceApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Work order created & asset sent to maintenance.');
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create work order'),
  });

  // Complete Maintenance Mutation
  const completeMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (activeRecordForCompletion) {
        return assetMaintenanceApi.complete(activeRecordForCompletion.id, payload);
      }
      // If no active record existed for this asset, create a record first then complete it so history is saved
      const createdRec = await assetMaintenanceApi.create({
        assetId: selectedAssetForCompletion!.id,
        issue: selectedAssetForCompletion!.remarks || 'Hardware Repair & Service',
        startDate: selectedAssetForCompletion!.updatedAt ? new Date(selectedAssetForCompletion!.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        cost: payload.actualCost,
      });
      return assetMaintenanceApi.complete(createdRec.id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      if (variables.qcStatus === 'PASS') {
        toast.success('Quality Check PASSED — Asset is now back in Available Stock (IN STOCK).');
        setActiveSubTab('history');
      } else {
        toast.warning('Quality Check FAILED — Asset remains Under Maintenance for rework.');
      }

      setSelectedAssetForCompletion(null);
      setActiveRecordForCompletion(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to process maintenance completion'),
  });

  const resetCreateForm = () => {
    setTargetAssetId('');
    setIssue('');
    setPriority('MEDIUM');
    setMaintenanceType('Repair');
    setVendor('');
    setWarrantyClaim(false);
    setStartDate(new Date().toISOString().split('T')[0]);
    setCost('');
    setNotes('');
  };

  const handleOpenCompletionModal = (asset: Asset) => {
    const activeRec = records.find((r) => r.assetId === asset.id && !r.endDate) || null;
    setSelectedAssetForCompletion(asset);
    setActiveRecordForCompletion(activeRec);
    setCompletionDate(new Date().toISOString().split('T')[0]);
    setFinalCondition('GOOD');
    setActualCost(activeRec?.cost !== undefined && activeRec?.cost !== null ? String(activeRec.cost) : '4500');
    setCompletionVendor(activeRec?.vendor || asset.vendor || 'Apple Authorized Care');
    setWorkPerformed('Hardware diagnostic, component replacement and testing');
    setPartsUsed('Display Cable & Battery Module');
    setQcStatus('PASS');
    setRepairNotes('');
  };

  const handleSendToMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssetId) {
      toast.error('Asset selection is required.');
      return;
    }
    if (!issue.trim()) {
      toast.error('Issue / Problem description is required.');
      return;
    }
    if (!startDate) {
      toast.error('Start Date is required.');
      return;
    }

    createMutation.mutate({
      assetId: targetAssetId,
      issue: issue.trim(),
      priority,
      maintenanceType,
      vendor: vendor.trim() || undefined,
      warrantyClaim,
      startDate,
      cost: cost ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionDate) {
      toast.error('Completion Date is required.');
      return;
    }

    completeMutation.mutate({
      completionDate,
      finalCondition,
      actualCost: actualCost ? Number(actualCost) : undefined,
      vendor: completionVendor.trim() || undefined,
      workPerformed: workPerformed.trim() || undefined,
      partsUsed: partsUsed.trim() || undefined,
      qcStatus,
      repairNotes: repairNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── 1. MAINTENANCE KPI METRICS BANNER ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card
          className="shadow-2xs p-3 border-border/80 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setActiveSubTab('requests')}
        >
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Pending Requests</span>
          <div className="flex items-center justify-between mt-1">
            <strong className="text-xl font-extrabold text-foreground">{metrics.pendingRequests}</strong>
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Requests</Badge>
          </div>
        </Card>

        <Card
          className="shadow-2xs p-3 border-border/80 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setActiveSubTab('work-orders')}
        >
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Active Work Orders</span>
          <div className="flex items-center justify-between mt-1">
            <strong className="text-xl font-extrabold text-amber-600">{metrics.activeWorkOrders}</strong>
            <Wrench className="h-4 w-4 text-amber-600" />
          </div>
        </Card>

        <Card
          className="shadow-2xs p-3 border-border/80 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setActiveSubTab('requests')}
        >
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Under Inspection</span>
          <div className="flex items-center justify-between mt-1">
            <strong className="text-xl font-extrabold text-blue-600">{metrics.underInspection}</strong>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </div>
        </Card>

        <Card
          className="shadow-2xs p-3 border-border/80 cursor-pointer hover:bg-emerald-500/5 transition-colors border-emerald-500/30"
          onClick={() => setActiveSubTab('history')}
        >
          <span className="text-muted-foreground block text-[10px] uppercase font-bold text-emerald-700">Completed Repairs</span>
          <div className="flex items-center justify-between mt-1">
            <strong className="text-xl font-extrabold text-emerald-600">{metrics.completed}</strong>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
        </Card>

        <Card
          className="shadow-2xs p-3 border-border/80 col-span-2 sm:col-span-1 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setActiveSubTab('history')}
        >
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Maintenance Cost</span>
          <div className="flex items-center justify-between mt-1">
            <strong className="text-lg font-bold text-foreground">₹{metrics.totalCost.toLocaleString('en-IN')}</strong>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        </Card>
      </div>

      {/* ── 2. SUB-NAVIGATION TABS ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-0 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Sub-Tab Switcher */}
            <div className="flex items-center gap-2 border-b sm:border-b-0 pb-2 sm:pb-0">
              <Button
                variant={activeSubTab === 'work-orders' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => setActiveSubTab('work-orders')}
              >
                <Wrench className="h-3.5 w-3.5" /> Active Work Orders & Repairs
                <Badge variant="secondary" className="ml-1 text-[10px] font-mono">
                  {assetsUnderMaintenance.length}
                </Badge>
              </Button>

              <Button
                variant={activeSubTab === 'requests' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => setActiveSubTab('requests')}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Requests & Inspection
                <Badge variant="secondary" className="ml-1 text-[10px] font-mono">
                  {metrics.pendingRequests}
                </Badge>
              </Button>

              <Button
                variant={activeSubTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 text-xs font-semibold gap-1.5 ${activeSubTab === 'history' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-emerald-700 hover:bg-emerald-500/10'}`}
                onClick={() => setActiveSubTab('history')}
              >
                <History className="h-3.5 w-3.5" /> Maintenance History
                <Badge className="ml-1 text-[10px] font-mono bg-white/20 text-current">
                  {completedRecords.length}
                </Badge>
              </Button>
            </div>

            {/* Header Action Button */}
            <Button
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" /> Create Work Order
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* SUB-TAB 1 — ACTIVE WORK ORDERS */}
          {activeSubTab === 'work-orders' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">WO Number</TableHead>
                  <TableHead className="text-xs">Asset ID & Name</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Technician / Vendor</TableHead>
                  <TableHead className="text-xs">Issue Description</TableHead>
                  <TableHead className="text-xs">Start Date</TableHead>
                  <TableHead className="text-xs">Est. Cost</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAssets || isLoadingRecords ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-xs text-muted-foreground">
                      Loading active work orders...
                    </TableCell>
                  </TableRow>
                ) : assetsUnderMaintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                      <div className="space-y-3">
                        <p>No active work orders. All corporate assets are operational in stock or allocated.</p>
                        {completedRecords.length > 0 && (
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10"
                              onClick={() => setActiveSubTab('history')}
                            >
                              <History className="h-3.5 w-3.5" /> View {completedRecords.length} Completed Repair(s) in Maintenance History →
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assetsUnderMaintenance.map((a) => {
                    const activeRecord = records.find((r) => r.assetId === a.id && !r.endDate);
                    const priorityVal = activeRecord?.priority || 'MEDIUM';
                    return (
                      <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {activeRecord?.workOrderNumber || `WO-${a.assetTag}`}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          <span>{a.assetTag} — {a.name}</span>
                          <span className="text-[10px] text-muted-foreground block">S/N: {a.serialNumber || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {priorityVal === 'HIGH' ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold">HIGH</Badge>
                          ) : priorityVal === 'LOW' ? (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold">LOW</Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold">MEDIUM</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-semibold">
                          {activeRecord?.vendor || a.vendor || 'In-House Tech'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {activeRecord?.issue || a.remarks || 'Hardware Repair & Service'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {activeRecord?.startDate ? new Date(activeRecord.startDate).toLocaleDateString() : 'Active'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {activeRecord?.cost !== undefined && activeRecord?.cost !== null ? `₹${activeRecord.cost.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold">
                            In Repair
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => handleOpenCompletionModal(a)}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Complete Repair & QC
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* SUB-TAB 2 — MAINTENANCE REQUESTS & INSPECTION */}
          {activeSubTab === 'requests' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Request ID</TableHead>
                  <TableHead className="text-xs">Asset Tag & Name</TableHead>
                  <TableHead className="text-xs">Reported Issue</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Inspection Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                      No pending inspection requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRecords.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{r.workOrderNumber || 'REQ-TICKET'}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{r.asset?.assetTag} — {r.asset?.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.issue}</TableCell>
                      <TableCell className="text-xs font-semibold">
                        <Badge variant="outline" className="text-[10px] font-bold">{r.priority || 'MEDIUM'}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.maintenanceType || 'Repair'}</TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold">
                          Under Inspection
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-semibold gap-1"
                          onClick={() => {
                            const ast = assets.find((a) => a.id === r.assetId);
                            if (ast) handleOpenCompletionModal(ast);
                          }}
                        >
                          Process Ticket & QC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* SUB-TAB 3 — MAINTENANCE HISTORY & AUDIT LOG */}
          {activeSubTab === 'history' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">WO Number</TableHead>
                  <TableHead className="text-xs">Asset Tag & Name</TableHead>
                  <TableHead className="text-xs">Completion Date</TableHead>
                  <TableHead className="text-xs">Issue & Work Performed</TableHead>
                  <TableHead className="text-xs">Parts Used</TableHead>
                  <TableHead className="text-xs">Actual Cost</TableHead>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs">QC Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                      No completed maintenance history recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  completedRecords.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{r.workOrderNumber || 'WO-COMPLETED'}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        <span>{r.asset?.assetTag || 'AST'} — {r.asset?.name || 'Asset'}</span>
                        <span className="text-[10px] text-muted-foreground block">S/N: {r.asset?.serialNumber || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                        {r.endDate ? new Date(r.endDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                        <span className="font-semibold text-foreground block">{r.issue}</span>
                        <span className="text-[10px] text-muted-foreground block">{r.workPerformed || 'Repair & Diagnostics'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{r.partsUsed || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {r.cost ? `₹${r.cost.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.vendor || 'Service Vendor'}</TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold gap-1">
                          <CheckCircle2 className="h-3 w-3" /> QC PASS
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── CREATE WORK ORDER / SEND TO MAINTENANCE MODAL ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Wrench className="h-4 w-4 text-amber-600" /> Create Work Order / Send to Maintenance
            </DialogTitle>
            <DialogDescription className="text-xs">
              Issue an official maintenance work order for hardware repair, warranty claim, or routine service
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendToMaintenance} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-semibold">Target Asset *</Label>
              <Select value={targetAssetId} onValueChange={setTargetAssetId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select asset to repair..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {eligibleAssets.length === 0 ? (
                    <SelectItem value="none" disabled className="text-xs italic text-muted-foreground">
                      No assets available to send to maintenance
                    </SelectItem>
                  ) : (
                    eligibleAssets.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.assetTag} - {a.name} ({a.category})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Read-Only Asset Details Summary Banner */}
            {selectedTargetAsset && (
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Serial Number</span>
                  <strong className="text-foreground font-mono font-semibold">{selectedTargetAsset.serialNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Company</span>
                  <strong className="text-foreground font-semibold">{selectedTargetAsset.company?.name || 'Company'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Branch & Dept</span>
                  <strong className="text-foreground font-semibold">
                    {selectedTargetAsset.branch?.name || 'Branch'} / {selectedTargetAsset.department?.name || 'Dept'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Current Holder</span>
                  <strong className="text-foreground font-semibold">
                    {selectedTargetAsset.currentEmployee ? `${selectedTargetAsset.currentEmployee.firstName} ${selectedTargetAsset.currentEmployee.lastName}` : 'Stock'}
                  </strong>
                </div>
              </div>
            )}

            {/* Work Order Details */}
            <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
              <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                <FileText className="h-3.5 w-3.5" /> Maintenance & Work Order Specification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Issue / Problem Description *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Screen damage / Battery replacement / Damaged port"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Priority *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p} className="text-xs font-semibold">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Maintenance Type *</Label>
                  <Select value={maintenanceType} onValueChange={setMaintenanceType}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs font-semibold">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Technician / Vendor</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Apple Authorized Care / IT Tech Desk"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Start Date *</Label>
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Estimated Cost (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <Checkbox
                    id="warrantyClaim"
                    checked={warrantyClaim}
                    onCheckedChange={(c: boolean) => setWarrantyClaim(c)}
                  />
                  <label htmlFor="warrantyClaim" className="text-xs font-medium cursor-pointer">
                    Covered under official manufacturer warranty claim
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Remarks & Work Order Notes</Label>
                <Textarea
                  rows={2}
                  placeholder="Enter diagnostic details or service center instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs min-h-[50px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" disabled={createMutation.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Generate Work Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── COMPLETE REPAIR & QUALITY CHECK (QC) CONFIRMATION MODAL ── */}
      {selectedAssetForCompletion && (
        <Dialog open={!!selectedAssetForCompletion} onOpenChange={(v) => !v && setSelectedAssetForCompletion(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-semibold">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Complete Repair & Quality Check
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeRecordForCompletion?.workOrderNumber || selectedAssetForCompletion.assetTag}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Perform quality inspection, record parts used, actual cost, and restore asset to Available Stock
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmCompletion} className="space-y-4 text-xs pt-2">
              {/* Ticket Summary Banner */}
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Work Order Target</span>
                    <strong className="text-foreground text-sm font-bold">{selectedAssetForCompletion.name}</strong>
                    <span className="text-muted-foreground block text-[11px]">S/N: {selectedAssetForCompletion.serialNumber || 'N/A'}</span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-semibold">
                    In Repair
                  </Badge>
                </div>
                <div className="text-[11px] flex items-center justify-between">
                  <span><strong>Issue:</strong> {activeRecordForCompletion?.issue || selectedAssetForCompletion.remarks || 'Hardware Repair'}</span>
                  <span><strong>Start Date:</strong> {activeRecordForCompletion?.startDate ? new Date(activeRecordForCompletion.startDate).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>

              {/* Work Order Execution & Repair Details */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                  <Wrench className="h-3.5 w-3.5" /> Repair Work Performed & Parts Used
                </h4>

                <div className="space-y-1">
                  <Label className="font-semibold">Work Performed / Diagnosis *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Replaced battery module, display ribbon cable, and ran diagnostics"
                    value={workPerformed}
                    onChange={(e) => setWorkPerformed(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Parts Used / Replacement Components</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 56Wh Battery Module, 16GB DDR4 RAM, Display Assembly"
                    value={partsUsed}
                    onChange={(e) => setPartsUsed(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Actual Repair Cost (₹) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 4500"
                      value={actualCost}
                      onChange={(e) => setActualCost(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Service Vendor / Repair Center</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Apple Care India / Reliance Digital"
                      value={completionVendor}
                      onChange={(e) => setCompletionVendor(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Completion Date *</Label>
                    <Input
                      type="date"
                      required
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Final Inspected Condition *</Label>
                    <Select value={finalCondition} onValueChange={setFinalCondition}>
                      <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((cnd) => (
                          <SelectItem key={cnd} value={cnd} className="text-xs font-semibold">
                            {cnd}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quality Check (QC) Decision */}
                <div className="space-y-1 border-t pt-2">
                  <Label className="font-semibold">Quality Check (QC) Decision *</Label>
                  <Select value={qcStatus} onValueChange={setQcStatus}>
                    <SelectTrigger className="h-8 text-xs bg-background font-bold">
                      <SelectValue placeholder="Select QC status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASS" className="text-xs font-bold text-emerald-600">
                        PASS — Quality Inspection Approved (Return to Stock)
                      </SelectItem>
                      <SelectItem value="FAIL" className="text-xs font-bold text-rose-600">
                        FAIL — Needs Rework / Continue Maintenance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Impact Preview Banner */}
              <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${qcStatus === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
                <span className="flex items-center gap-1.5 font-semibold">
                  {qcStatus === 'PASS' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  Target Lifecycle Impact:
                </span>
                <Badge className={qcStatus === 'PASS' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs font-bold' : 'bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-bold'}>
                  {qcStatus === 'PASS' ? 'IN STOCK (Available Stock +1)' : 'REWORK (Under Maintenance)'}
                </Badge>
              </div>

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setSelectedAssetForCompletion(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={completeMutation.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Submit QC & Complete
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
