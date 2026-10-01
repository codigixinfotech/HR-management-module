import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Receipt,
  UploadCloud,
  Trash2,
  GitFork,
  Search,
  RotateCcw,
  Eye,
  Undo2,
  UserCheck,
  Coins,
  Check,
} from 'lucide-react';
import { assetMaintenanceApi, assetsApi, assetMaintenanceRequestsApi } from '@/api/asset-management';
import { employeesApi } from '@/api/employees';
import { branchesApi } from '@/api/organization';
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
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser, isSuperAdminUser, isCompanyAdminUser } from '@/lib/modules';
import { AssetBranchFilter, matchAssetBranch } from './AssetBranchFilter';
import type { Asset, AssetMaintenanceRecord, AssetMaintenanceRequest } from '@/api/types';

const MAINTENANCE_TYPES = ['Repair', 'Preventive Maintenance', 'Warranty Claim', 'Inspection'];
const PRIORITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'];
const CONDITION_OPTIONS = ['GOOD', 'EXCELLENT', 'FAIR', 'DAMAGED'];
const PAYROLL_MONTH_OPTIONS = [
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027',
  'March 2027',
  'April 2027',
  'May 2027',
  'June 2027',
  'July 2027',
  'August 2027',
  'September 2027',
];

export function MaintenanceTab({ companyId, branchId: propBranchId }: { companyId?: string; branchId?: string }) {
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const isBranchAdmin = isBranchAdminUser(user);
  const isSuperOrCompanyAdmin = useMemo(() => isSuperAdminUser(user) || isCompanyAdminUser(user), [user]);
  const userAssignedBranchId = propBranchId || user?.branchId || user?.employee?.branchId;
  const userAssignedCompanyId = user?.companyId || (user?.employee as any)?.companyId;
  const effectiveCompanyId = (isBranchAdmin && userAssignedCompanyId) ? userAssignedCompanyId : companyId;
  const effectiveBranchId = isBranchAdmin ? userAssignedBranchId : undefined;

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(() =>
    isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'HEAD_OFFICE'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  useEffect(() => {
    if (isBranchAdmin && userAssignedBranchId) {
      setSelectedBranchFilter(userAssignedBranchId);
    }
  }, [isBranchAdmin, userAssignedBranchId]);

  // Navigation Sub-Tab State inside Maintenance Page
  const [activeSubTab, setActiveSubTab] = useState<'work-orders' | 'requests' | 'history'>('work-orders');

  // Maintenance Requests & Inspection States
  const [selectedMaintenanceReq, setSelectedMaintenanceReq] = useState<AssetMaintenanceRequest | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectionRemarks, setInspectionRemarks] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [originatingRequestId, setOriginatingRequestId] = useState<string | null>(null);

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

  // Cost Responsibility & Payroll Recovery Form Fields
  const [costResponsibility, setCostResponsibility] = useState<'COMPANY_EXPENSE' | 'EMPLOYEE_RECOVERY'>('COMPANY_EXPENSE');
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [deductionMethod, setDeductionMethod] = useState<'FULL_DEDUCTION' | 'INSTALLMENT_DEDUCTION'>('FULL_DEDUCTION');
  const [numberOfInstallments, setNumberOfInstallments] = useState('5');
  const [payrollStartMonth, setPayrollStartMonth] = useState('October 2026');
  const [recoveryEmployeeId, setRecoveryEmployeeId] = useState('');

  // Complete Maintenance & QC Form Fields
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalCondition, setFinalCondition] = useState('GOOD');
  const [actualCost, setActualCost] = useState('');
  const [completionVendor, setCompletionVendor] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [qcStatus, setQcStatus] = useState('PASS');
  const [repairNotes, setRepairNotes] = useState('');
  const [returnDestination, setReturnDestination] = useState<'EMPLOYEE' | 'STOCK'>('EMPLOYEE');

  // Invoice Attachment State for Repair Completion
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', effectiveCompanyId, effectiveBranchId],
    queryFn: () => assetsApi.list(effectiveCompanyId, effectiveBranchId),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', effectiveCompanyId],
    queryFn: () => branchesApi.list(effectiveCompanyId || undefined),
    enabled: !!effectiveCompanyId,
  });

  const { data: rawRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['asset-maintenance', effectiveCompanyId, effectiveBranchId],
    queryFn: () => assetMaintenanceApi.list(undefined, effectiveCompanyId, effectiveBranchId),
  });

  const { data: rawMaintenanceRequests = [], isLoading: isLoadingMaintenanceRequests } = useQuery({
    queryKey: ['asset-maintenance-requests', effectiveCompanyId, effectiveBranchId],
    queryFn: () =>
      assetMaintenanceRequestsApi.list({
        companyId: effectiveCompanyId,
        branchId: effectiveBranchId,
      }),
  });

  const maintenanceRequests = useMemo(() => {
    const seen = new Set<string>();
    return rawMaintenanceRequests.filter((r: any) => {
      const key = r.id || r.requestNumber;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawMaintenanceRequests]);

  // Query employees for recovery allocation
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-recovery', effectiveCompanyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 300, companyId: effectiveCompanyId || undefined }),
    enabled: isCreateOpen,
  });
  const employeeList = Array.isArray(employeesData) ? employeesData : (employeesData as any)?.data || [];

  // Computed recovery amounts
  const parsedRecoveryAmount = Number(recoveryAmount || cost) || 0;
  const parsedInstallments = Math.max(1, parseInt(numberOfInstallments, 10) || 1);
  const calculatedMonthlyDeduction = (parsedRecoveryAmount / parsedInstallments).toFixed(2);

  // Strict tenant boundary: only records whose asset belongs to this active company and branch
  const records = useMemo(() => {
    return rawRecords.filter((r) => {
      if (effectiveCompanyId) {
        const recCompId = r.asset?.company?.id || (r.asset as any)?.companyId;
        if (recCompId && recCompId !== effectiveCompanyId) return false;
      }
      const assetObj = r.asset || assets.find((a) => a.id === r.assetId);
      if (assetObj) {
        return matchAssetBranch(assetObj, selectedBranchFilter, isBranchAdmin, userAssignedBranchId, branches);
      }
      return true;
    });
  }, [rawRecords, effectiveCompanyId, selectedBranchFilter, isBranchAdmin, userAssignedBranchId, assets, branches]);

  // Selected Target Asset for Create Modal
  const selectedTargetAsset = useMemo(() => {
    return assets.find((a) => a.id === targetAssetId) || null;
  }, [assets, targetAssetId]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
  }, [assets]);

  // Assets currently in UNDER_MAINTENANCE status
  const assetsUnderMaintenance = useMemo(() => {
    return assets.filter((a) => {
      if (a.status !== 'UNDER_MAINTENANCE') return false;
      if (!matchAssetBranch(a, selectedBranchFilter, isBranchAdmin, userAssignedBranchId, branches)) {
        return false;
      }
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
        return false;
      }
      const activeRecord = records.find((r) => r.assetId === a.id && !r.endDate);
      if (selectedPriority !== 'ALL') {
        const p = activeRecord?.priority || 'MEDIUM';
        if (p !== selectedPriority) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const woNumber = (activeRecord?.workOrderNumber || `WO-${a.assetTag}`).toLowerCase();
        const vendorName = (activeRecord?.vendor || a.vendor || '').toLowerCase();
        const issueDesc = (activeRecord?.issue || a.remarks || '').toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.assetTag.toLowerCase().includes(q) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
          woNumber.includes(q) ||
          vendorName.includes(q) ||
          issueDesc.includes(q)
        );
      }
      return true;
    });
  }, [assets, selectedBranchFilter, isBranchAdmin, userAssignedBranchId, branches, selectedCategory, selectedPriority, searchQuery, records]);

  // Eligible assets for sending to maintenance (IN_STOCK or ALLOCATED)
  const eligibleAssets = assets.filter(
    (a) =>
      (a.status === 'IN_STOCK' || a.status === 'AVAILABLE' || a.status === 'ALLOCATED') &&
      (!isBranchAdmin || !userAssignedBranchId || a.branchId === userAssignedBranchId)
  );

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
    const pendingRequestsCount = maintenanceRequests.filter((r) => r.status === 'PENDING').length;
    const underInspectionCount = maintenanceRequests.filter((r) => r.status === 'IN_INSPECTION').length;
    const inRepairCount = maintenanceRequests.filter((r) => r.status === 'IN_REPAIR').length;
    const activeWorkOrdersCount = assetsUnderMaintenance.length;
    const completedCount = maintenanceRequests.filter((r) => r.status === 'COMPLETED').length + completedRecords.length;
    const totalCostSum = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      pendingRequests: pendingRequestsCount,
      underInspection: underInspectionCount,
      inRepair: inRepairCount,
      activeWorkOrders: activeWorkOrdersCount,
      completed: completedCount,
      totalCost: totalCostSum,
    };
  }, [maintenanceRequests, activeRecords, assetsUnderMaintenance, completedRecords, records]);

  // Create Maintenance Record Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => assetMaintenanceApi.create(payload),
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      if (originatingRequestId && data?.id) {
        try {
          await assetMaintenanceRequestsApi.createWorkOrder(originatingRequestId, { workOrderId: data.id });
          queryClient.invalidateQueries({ queryKey: ['asset-maintenance-requests'] });
          toast.success('Work order created & linked to maintenance request.');
        } catch {
          toast.success('Work order created & asset sent to maintenance.');
        }
        setOriginatingRequestId(null);
      } else {
        toast.success('Work order created & asset sent to maintenance.');
      }

      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create work order'),
  });

  const inspectMutation = useMutation({
    mutationFn: ({ id, remarks, status }: { id: string; remarks?: string; status?: 'IN_INSPECTION' | 'PENDING' }) =>
      assetMaintenanceRequestsApi.inspect(id, { inspectionRemarks: remarks, status }),
    onSuccess: () => {
      toast.success('Inspection record updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance-requests'] });
      setIsInspectModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update inspection.'),
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      assetMaintenanceRequestsApi.updateStatus(id, { status, adminRemarks: remarks }),
    onSuccess: (_, vars) => {
      toast.success(`Request status updated to ${vars.status}.`);
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance-requests'] });
      setIsInspectModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status.'),
  });

  const handleOpenInspectModal = (req: AssetMaintenanceRequest) => {
    setSelectedMaintenanceReq(req);
    setInspectionRemarks(req.inspectionRemarks || '');
    setAdminRemarks(req.adminRemarks || '');
    setIsInspectModalOpen(true);
  };

  const handleCreateWorkOrderFromRequest = (req: AssetMaintenanceRequest) => {
    setOriginatingRequestId(req.id);
    setTargetAssetId(req.assetId);
    setIssue(req.issueTitle);
    setPriority(req.priority || 'MEDIUM');
    setMaintenanceType('Repair');
    setNotes(req.issueDescription || '');
    setStartDate(new Date().toISOString().split('T')[0]);
    setIsInspectModalOpen(false);
    setIsCreateOpen(true);
  };

  const renderMaintenanceRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'IN_INSPECTION':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold gap-1">
            <Search className="h-3 w-3" /> In Inspection
          </Badge>
        );
      case 'IN_REPAIR':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] font-semibold gap-1">
            <Wrench className="h-3 w-3" /> In Repair
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case 'SENT_BACK':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] font-semibold gap-1">
            <Undo2 className="h-3 w-3" /> Sent Back
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const filteredMaintenanceRequests = useMemo(() => {
    return maintenanceRequests.filter((req) => {
      if (selectedBranchFilter && selectedBranchFilter !== 'ALL' && selectedBranchFilter !== 'ALL_BRANCHES') {
        const reqBranchId = req.branchId || req.asset?.branchId;
        if (selectedBranchFilter === 'HEAD_OFFICE' || selectedBranchFilter === 'NONE') {
          if (reqBranchId) return false;
        } else if (reqBranchId !== selectedBranchFilter) {
          return false;
        }
      }
      if (selectedPriority !== 'ALL' && req.priority !== selectedPriority) return false;
      if (selectedCategory !== 'ALL' && req.asset?.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = req.requestNumber?.toLowerCase() || '';
        const tag = req.asset?.assetTag?.toLowerCase() || '';
        const name = req.asset?.name?.toLowerCase() || '';
        const issueText = req.issueTitle?.toLowerCase() || '';
        const empName = `${req.requestedBy?.firstName || ''} ${req.requestedBy?.lastName || ''}`.toLowerCase();
        const empCode = req.requestedBy?.employeeCode?.toLowerCase() || '';
        if (
          !num.includes(q) &&
          !tag.includes(q) &&
          !name.includes(q) &&
          !issueText.includes(q) &&
          !empName.includes(q) &&
          !empCode.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [maintenanceRequests, selectedBranchFilter, selectedPriority, selectedCategory, searchQuery]);

  // Complete Maintenance Mutation
  const completeMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (activeRecordForCompletion) {
        return assetMaintenanceApi.complete(activeRecordForCompletion.id, payload);
      }
      // If no active record existed for this asset, create a record first then complete it so history is saved
      const createdRec = await assetMaintenanceApi.create({
        assetId: selectedAssetForCompletion!.id,
        issue: selectedAssetForCompletion!.remarks || 'Asset Repair & Maintenance',
        startDate: selectedAssetForCompletion!.updatedAt ? new Date(selectedAssetForCompletion!.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        cost: payload.actualCost,
      });
      return assetMaintenanceApi.complete(createdRec.id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-assets'] });

      if (variables.qcStatus === 'PASS') {
        if (variables.returnDestination === 'EMPLOYEE') {
          toast.success('Quality Check PASSED — Asset successfully restored to Employee Custody (In Use).');
        } else {
          toast.success('Quality Check PASSED — Asset returned to Available Stock (IN STOCK).');
        }
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
    setCostResponsibility('COMPANY_EXPENSE');
    setRecoveryAmount('');
    setDeductionMethod('FULL_DEDUCTION');
    setNumberOfInstallments('5');
    setPayrollStartMonth('October 2026');
    setRecoveryEmployeeId('');
  };

  const handleOpenCompletionModal = (asset: Asset) => {
    const activeRec = records.find((r) => r.assetId === asset.id && !r.endDate) || null;
    setSelectedAssetForCompletion(asset);
    setActiveRecordForCompletion(activeRec);
    const hasEmployee = !!(asset.currentEmployeeId || asset.currentEmployee || activeRec?.recoveryEmployeeId);
    setReturnDestination(hasEmployee ? 'EMPLOYEE' : 'STOCK');
    setCompletionDate(new Date().toISOString().split('T')[0]);
    setFinalCondition('GOOD');
    setActualCost(activeRec?.cost !== undefined && activeRec?.cost !== null ? String(activeRec.cost) : '4500');
    setCompletionVendor(activeRec?.vendor || asset.vendor || 'Apple Authorized Care');
    setWorkPerformed('Asset diagnostic, maintenance service and operational testing');
    setPartsUsed('Replacement Components & Consumables');
    setQcStatus('PASS');
    setRepairNotes('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceFile(null);
    if (invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
      setInvoicePreviewUrl(null);
    }
    if (invoiceFileInputRef.current) {
      invoiceFileInputRef.current.value = '';
    }
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Invoice file size exceeds 10MB limit.');
      return;
    }

    if (invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
    }

    setInvoiceFile(file);
    if (file.type.startsWith('image/')) {
      setInvoicePreviewUrl(URL.createObjectURL(file));
    } else {
      setInvoicePreviewUrl(null);
    }
    toast.success(`Attached invoice: ${file.name}`);
  };

  const handleRemoveInvoiceFile = () => {
    if (invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
      setInvoicePreviewUrl(null);
    }
    setInvoiceFile(null);
    if (invoiceFileInputRef.current) {
      invoiceFileInputRef.current.value = '';
    }
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

    const isRecovery = costResponsibility === 'EMPLOYEE_RECOVERY';
    const recAmt = recoveryAmount ? Number(recoveryAmount) : (cost ? Number(cost) : undefined);
    const instCount = deductionMethod === 'INSTALLMENT_DEDUCTION' ? (Number(numberOfInstallments) || 1) : 1;
    const monthlyAmt = isRecovery && recAmt ? Number((recAmt / instCount).toFixed(2)) : undefined;

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
      costResponsibility,
      recoveryEmployeeId: isRecovery ? (recoveryEmployeeId || selectedTargetAsset?.currentEmployeeId || undefined) : undefined,
      recoveryAmount: isRecovery ? recAmt : undefined,
      deductionMethod: isRecovery ? deductionMethod : undefined,
      numberOfInstallments: isRecovery && deductionMethod === 'INSTALLMENT_DEDUCTION' ? instCount : undefined,
      monthlyDeduction: isRecovery && deductionMethod === 'INSTALLMENT_DEDUCTION' ? monthlyAmt : undefined,
      payrollStartMonth: isRecovery ? payrollStartMonth : undefined,
    });
  };

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionDate) {
      toast.error('Completion Date is required.');
      return;
    }

    const invoiceParts: string[] = [];
    if (invoiceNumber.trim()) invoiceParts.push(`Invoice #${invoiceNumber.trim()}`);
    if (invoiceDate) invoiceParts.push(`Date: ${invoiceDate}`);
    if (invoiceFile) invoiceParts.push(`File: ${invoiceFile.name}`);

    const invoicePrefix = invoiceParts.length > 0 ? `[Repair Invoice Attached: ${invoiceParts.join(' | ')}]` : '';
    const combinedRepairNotes = [invoicePrefix, repairNotes.trim()].filter(Boolean).join('\n');

    completeMutation.mutate({
      completionDate,
      finalCondition,
      actualCost: actualCost ? Number(actualCost) : undefined,
      vendor: completionVendor.trim() || undefined,
      workPerformed: workPerformed.trim() || undefined,
      partsUsed: partsUsed.trim() || undefined,
      qcStatus,
      returnDestination,
      repairNotes: combinedRepairNotes ? combinedRepairNotes.slice(0, 500) : undefined,
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
                  {metrics.pendingRequests + metrics.underInspection}
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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Create Work Order
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* ── Search & Filter Controls Bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/60">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search WO #, Asset Tag, Name, S/N, Vendor, Issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AssetBranchFilter
                isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
                isBranchAdmin={isBranchAdmin}
                selectedBranch={selectedBranchFilter}
                onBranchChange={setSelectedBranchFilter}
                branches={branches}
                assignedBranchName={branches.find((b) => b.id === userAssignedBranchId)?.name}
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery !== '' || selectedCategory !== 'ALL' || selectedPriority !== 'ALL' || selectedBranchFilter !== (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'HEAD_OFFICE')) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedPriority('ALL');
                    setSelectedBranchFilter(isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'HEAD_OFFICE');
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>

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
                        <p>No active work orders. All organizational assets are operational in stock or allocated.</p>
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
                          {activeRecord?.issue || a.remarks || 'Asset Repair & Maintenance'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {activeRecord?.startDate ? new Date(activeRecord.startDate).toLocaleDateString() : 'Active'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          <div>{activeRecord?.cost !== undefined && activeRecord?.cost !== null ? `₹${activeRecord.cost.toLocaleString('en-IN')}` : '-'}</div>
                          {activeRecord?.costResponsibility === 'EMPLOYEE_RECOVERY' ? (
                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[9px] font-semibold mt-0.5">
                              👤 Employee Recovery
                            </Badge>
                          ) : activeRecord?.cost !== undefined && activeRecord?.cost !== null ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-semibold mt-0.5">
                              🏢 Company
                            </Badge>
                          ) : null}
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
            <div className="space-y-4">
              {/* Counts row for Requests */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg border bg-amber-500/5 border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending</span>
                    <p className="text-lg font-bold text-amber-600">
                      {maintenanceRequests.filter((r) => r.status === 'PENDING').length}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="p-2.5 rounded-lg border bg-blue-500/5 border-blue-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">In Inspection</span>
                    <p className="text-lg font-bold text-blue-600">
                      {maintenanceRequests.filter((r) => r.status === 'IN_INSPECTION').length}
                    </p>
                  </div>
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div className="p-2.5 rounded-lg border bg-orange-500/5 border-orange-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">In Repair</span>
                    <p className="text-lg font-bold text-orange-600">
                      {maintenanceRequests.filter((r) => r.status === 'IN_REPAIR').length}
                    </p>
                  </div>
                  <Wrench className="h-4 w-4 text-orange-600" />
                </div>
                <div className="p-2.5 rounded-lg border bg-emerald-500/5 border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Completed</span>
                    <p className="text-lg font-bold text-emerald-600">
                      {maintenanceRequests.filter((r) => r.status === 'COMPLETED').length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Request #</TableHead>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Asset Tag & Name</TableHead>
                    <TableHead className="text-xs">Issue / Problem</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Submitted Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingMaintenanceRequests ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                        Loading maintenance requests...
                      </TableCell>
                    </TableRow>
                  ) : filteredMaintenanceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                        No maintenance requests matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaintenanceRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {req.requestNumber}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold text-foreground block">
                            {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {req.requestedBy?.employeeCode || 'N/A'} {req.requestedBy?.department?.name ? `• ${req.requestedBy.department.name}` : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold text-foreground block">
                            {req.asset?.name || 'Asset'}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {req.asset?.assetTag || 'N/A'} {req.asset?.category ? `• ${req.asset.category}` : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px]">
                          <span className="font-medium text-foreground block truncate" title={req.issueTitle}>
                            {req.issueTitle}
                          </span>
                          {req.issueDescription && (
                            <span className="text-[10px] text-muted-foreground block truncate" title={req.issueDescription}>
                              {req.issueDescription}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {req.priority === 'CRITICAL' ? (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold">
                              CRITICAL
                            </Badge>
                          ) : req.priority === 'HIGH' ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold">
                              HIGH
                            </Badge>
                          ) : req.priority === 'LOW' ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              LOW
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                              MEDIUM
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {renderMaintenanceRequestStatusBadge(req.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === 'COMPLETED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-semibold gap-1 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                              onClick={() => handleOpenInspectModal(req)}
                            >
                              <Eye className="h-3 w-3" /> View Details
                            </Button>
                          ) : req.status === 'REJECTED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-semibold gap-1 border-rose-500/30 text-rose-700 hover:bg-rose-500/10"
                              onClick={() => handleOpenInspectModal(req)}
                            >
                              <Eye className="h-3 w-3" /> View Details
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-semibold gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => handleOpenInspectModal(req)}
                            >
                              <ClipboardList className="h-3 w-3" /> Inspect & Action
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
                        <div>{r.cost ? `₹${r.cost.toLocaleString('en-IN')}` : '-'}</div>
                        {r.costResponsibility === 'EMPLOYEE_RECOVERY' ? (
                          <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[9px] font-semibold mt-0.5">
                            👤 Recovery
                          </Badge>
                        ) : r.cost ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] font-semibold mt-0.5">
                            🏢 Company
                          </Badge>
                        ) : null}
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
              Issue an official maintenance work order for asset repair, warranty claim, or routine service
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendToMaintenance} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-semibold">Target Asset *</Label>
              <Select
                value={targetAssetId}
                onValueChange={(val) => {
                  setTargetAssetId(val);
                  const found = assets.find((a) => a.id === val);
                  if (found?.currentEmployeeId) {
                    setRecoveryEmployeeId(found.currentEmployeeId);
                  }
                }}
              >
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
                    {selectedTargetAsset.branch?.name || 'Head Office'} / {selectedTargetAsset.department?.name || 'Dept'}
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
                    placeholder="e.g. 23000"
                    value={cost}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCost(val);
                      if (!recoveryAmount || recoveryAmount === cost) {
                        setRecoveryAmount(val);
                      }
                    }}
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

              {/* ── COST RESPONSIBILITY SECTION ── */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-t border-border/70 pt-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <div>
                      <Label className="text-xs font-bold text-foreground">Cost Responsibility</Label>
                      <p className="text-[10.5px] text-muted-foreground">Select whether maintenance cost is paid by the company or recovered from employee</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    Expense Allocation
                  </Badge>
                </div>

                {/* Responsibility Selector Toggle Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCostResponsibility('COMPANY_EXPENSE')}
                    className={`relative p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      costResponsibility === 'COMPANY_EXPENSE'
                        ? 'border-emerald-500/80 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/30'
                        : 'border-border/70 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-md ${costResponsibility === 'COMPANY_EXPENSE' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-foreground block">Company Expense</span>
                          <span className="text-[10.5px] text-muted-foreground">Default company maintenance cost</span>
                        </div>
                      </div>
                      {costResponsibility === 'COMPANY_EXPENSE' && (
                        <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      &bull; No payroll deduction
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCostResponsibility('EMPLOYEE_RECOVERY');
                      if (!recoveryAmount && cost) {
                        setRecoveryAmount(cost);
                      }
                      if (!recoveryEmployeeId && selectedTargetAsset?.currentEmployeeId) {
                        setRecoveryEmployeeId(selectedTargetAsset.currentEmployeeId);
                      }
                    }}
                    className={`relative p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      costResponsibility === 'EMPLOYEE_RECOVERY'
                        ? 'border-amber-500/80 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/30'
                        : 'border-border/70 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-md ${costResponsibility === 'EMPLOYEE_RECOVERY' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          <UserCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-foreground block">Employee Recovery</span>
                          <span className="text-[10.5px] text-muted-foreground">Recovered via payroll deduction</span>
                        </div>
                      </div>
                      {costResponsibility === 'EMPLOYEE_RECOVERY' && (
                        <div className="h-4 w-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                      &bull; Generates approved recovery record
                    </div>
                  </button>
                </div>

                {/* Sub-view: Company Expense selected */}
                {costResponsibility === 'COMPANY_EXPENSE' ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Estimated Cost:</span>
                      <span className="font-mono font-bold text-foreground">
                        {cost ? `₹${Number(cost).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Cost Responsibility:</span>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-semibold">
                        Company Expense
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>₹{cost ? Number(cost).toLocaleString('en-IN') : '0'}</strong> remains an organizational company maintenance expense &mdash; <strong>No payroll deduction</strong>.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Sub-view: Employee Recovery selected */
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-600" />
                        <span className="font-bold text-xs text-foreground">Payroll Recovery Configuration</span>
                      </div>
                      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] font-semibold">
                        Approved Recovery Record
                      </Badge>
                    </div>

                    {/* Target Employee Selection */}
                    <div className="space-y-1">
                      <Label className="font-semibold text-xs flex items-center justify-between">
                        <span>Recover from Employee *</span>
                        {selectedTargetAsset?.currentEmployee && (
                          <span className="text-[10px] font-normal text-muted-foreground">
                            (Auto-assigned to current custodian)
                          </span>
                        )}
                      </Label>
                      <Select
                        value={recoveryEmployeeId || (selectedTargetAsset?.currentEmployeeId || '')}
                        onValueChange={setRecoveryEmployeeId}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select employee for recovery..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px]">
                          {selectedTargetAsset?.currentEmployee && (
                            <SelectItem
                              key={`current-${selectedTargetAsset.currentEmployee.id}`}
                              value={selectedTargetAsset.currentEmployee.id}
                              className="text-xs font-semibold text-primary"
                            >
                              ⭐ {selectedTargetAsset.currentEmployee.firstName} {selectedTargetAsset.currentEmployee.lastName} ({selectedTargetAsset.currentEmployee.employeeCode || 'Current Holder'})
                            </SelectItem>
                          )}
                          {employeeList
                            .filter((emp: any) => emp.id !== selectedTargetAsset?.currentEmployeeId)
                            .map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs">
                                {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.id})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-background/60 p-2 rounded border border-border/50">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estimated Cost:</span>
                        <span className="font-mono font-bold text-foreground">
                          {cost ? `₹${Number(cost).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Cost Responsibility:</span>
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] font-semibold">
                          Employee Recovery
                        </Badge>
                      </div>
                    </div>

                    {/* Recovery Amount & Deduction Method */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Recovery Amount (₹) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={cost || 'e.g. 23000'}
                          value={recoveryAmount}
                          onChange={(e) => setRecoveryAmount(e.target.value)}
                          className="h-8 text-xs font-mono bg-background font-semibold"
                        />
                        <span className="text-[10px] text-muted-foreground block">
                          Defaults to Estimated Cost: ₹{cost ? Number(cost).toLocaleString('en-IN') : '0'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <Label className="font-semibold text-xs">Deduction Method *</Label>
                        <Select
                          value={deductionMethod}
                          onValueChange={(val: 'FULL_DEDUCTION' | 'INSTALLMENT_DEDUCTION') => setDeductionMethod(val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background font-medium">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL_DEDUCTION" className="text-xs font-semibold">
                              Full Deduction
                            </SelectItem>
                            <SelectItem value="INSTALLMENT_DEDUCTION" className="text-xs font-semibold">
                              Installment Deduction
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-[10px] text-muted-foreground block">
                          {deductionMethod === 'FULL_DEDUCTION'
                            ? 'One-time full payroll deduction'
                            : 'Spread across monthly salary installments'}
                        </span>
                      </div>
                    </div>

                    {/* If Installment Deduction */}
                    {deductionMethod === 'INSTALLMENT_DEDUCTION' && (
                      <div className="p-3 bg-background/80 rounded-md border border-border/70 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="font-semibold text-xs">Number of Installments *</Label>
                            <Input
                              type="number"
                              min="1"
                              max="60"
                              value={numberOfInstallments}
                              onChange={(e) => setNumberOfInstallments(e.target.value)}
                              className="h-8 text-xs font-mono bg-background"
                            />
                            <span className="text-[10px] text-muted-foreground block">e.g. 5</span>
                          </div>

                          <div className="space-y-1">
                            <Label className="font-semibold text-xs">Monthly Deduction</Label>
                            <div className="h-8 px-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 flex items-center font-mono font-bold text-amber-800 dark:text-amber-300 text-xs">
                              ₹{calculatedMonthlyDeduction ? Number(calculatedMonthlyDeduction).toLocaleString('en-IN') : '0'}
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              Monthly deduction
                            </span>
                          </div>

                          <div className="space-y-1">
                            <Label className="font-semibold text-xs">Payroll Start Month *</Label>
                            <Select value={payrollStartMonth} onValueChange={setPayrollStartMonth}>
                              <SelectTrigger className="h-8 text-xs bg-background font-medium">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYROLL_MONTH_OPTIONS.map((m) => (
                                  <SelectItem key={m} value={m} className="text-xs">
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-[10px] text-muted-foreground block">First deduction cycle</span>
                          </div>
                        </div>

                        {/* Breakdown summary */}
                        <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-muted/40 font-medium">
                          <span className="text-muted-foreground">Installment Schedule:</span>
                          <span className="text-foreground">
                            {numberOfInstallments} payments of <strong className="font-mono text-primary">₹{calculatedMonthlyDeduction ? Number(calculatedMonthlyDeduction).toLocaleString('en-IN') : '0'}</strong> starting <strong className="text-foreground">{payrollStartMonth}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Important Payroll Notice Box */}
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Important:</strong> Selecting <strong>Employee Recovery</strong> should not immediately deduct salary. It creates an <strong>approved recovery record</strong> that Payroll uses for the deduction. This keeps the Work Order for maintenance and the Payroll module responsible for the actual salary deduction.
                      </div>
                    </div>
                  </div>
                )}
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
                  <span><strong>Issue:</strong> {activeRecordForCompletion?.issue || selectedAssetForCompletion.remarks || 'Asset Repair & Maintenance'}</span>
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
                        PASS — Quality Inspection Approved
                      </SelectItem>
                      <SelectItem value="FAIL" className="text-xs font-bold text-rose-600">
                        FAIL — Needs Rework / Continue Maintenance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Post-Maintenance Asset Destination if PASS */}
                {qcStatus === 'PASS' && (
                  <div className="space-y-1.5 border-t pt-2">
                    <Label className="font-semibold flex items-center justify-between">
                      <span>Post-Maintenance Asset Destination *</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Where should this asset be moved upon repair completion?
                      </span>
                    </Label>
                    <Select
                      value={returnDestination}
                      onValueChange={(val: 'EMPLOYEE' | 'STOCK') => setReturnDestination(val)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedAssetForCompletion?.currentEmployee ? (
                          <SelectItem value="EMPLOYEE" className="text-xs font-semibold text-emerald-700">
                            👤 Return to Assigned Employee ({selectedAssetForCompletion.currentEmployee.firstName} {selectedAssetForCompletion.currentEmployee.lastName}) — Active Custody
                          </SelectItem>
                        ) : activeRecordForCompletion?.recoveryEmployee ? (
                          <SelectItem value="EMPLOYEE" className="text-xs font-semibold text-emerald-700">
                            👤 Return to Requester ({activeRecordForCompletion.recoveryEmployee.firstName} {activeRecordForCompletion.recoveryEmployee.lastName}) — Active Custody
                          </SelectItem>
                        ) : null}
                        <SelectItem value="STOCK" className="text-xs font-semibold text-foreground">
                          🏢 Return to Available General Stock (IN_STOCK)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Attach Repair Invoice Section */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-primary" /> Attach Repair Invoice
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Vendor Bill & Reimbursement Audit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Invoice / Bill Number</Label>
                    <Input
                      type="text"
                      placeholder="e.g. INV-2026-99201 / BILL-884"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Invoice Date</Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold flex items-center justify-between">
                    <span>Upload Repair Invoice Document (PDF / Image)</span>
                    {invoiceFile && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 1 File Selected
                      </span>
                    )}
                  </Label>

                  {!invoiceFile ? (
                    <div
                      onClick={() => invoiceFileInputRef.current?.click()}
                      className="border border-dashed border-border/80 hover:border-primary/60 bg-background/50 hover:bg-muted/40 rounded-lg p-3 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center gap-1"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="text-[11px] font-medium text-foreground">
                        <span className="text-primary font-semibold underline underline-offset-2">Click to browse</span> or drag invoice file here
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Supports PDF, PNG, JPG, JPEG (Max: 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {invoicePreviewUrl ? (
                          <img
                            src={invoicePreviewUrl}
                            alt="Invoice preview"
                            className="h-9 w-9 rounded object-cover border border-emerald-500/30 shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[240px] sm:max-w-[320px]">
                            {invoiceFile.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(invoiceFile.size / 1024).toFixed(1)} KB • Attached for QC approval
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                          onClick={handleRemoveInvoiceFile}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={invoiceFileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleInvoiceFileChange}
                  />
                </div>
              </div>

              {/* Status Impact Preview Banner */}
              <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${qcStatus === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
                <span className="flex items-center gap-1.5 font-semibold">
                  {qcStatus === 'PASS' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  Target Lifecycle Impact:
                </span>
                <Badge className={qcStatus === 'PASS' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs font-bold' : 'bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-bold'}>
                  {qcStatus === 'PASS'
                    ? (returnDestination === 'EMPLOYEE'
                        ? 'RESTORED TO EMPLOYEE CUSTODY (In Use)'
                        : 'IN STOCK (Available Stock +1)')
                    : 'REWORK (Under Maintenance)'}
                </Badge>
              </div>

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setSelectedAssetForCompletion(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={completeMutation.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {returnDestination === 'EMPLOYEE' ? 'Complete Repair & Return to Employee' : 'Complete Repair & Return to Stock'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Inspect & Action Modal for Maintenance Request */}
      {selectedMaintenanceReq && (
        <Dialog open={isInspectModalOpen} onOpenChange={setIsInspectModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Inspect Maintenance Request #{selectedMaintenanceReq.requestNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review employee reported problem, record inspection remarks, generate a work order, or complete/reject the request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 text-xs">
              {/* Request & Asset Details */}
              <div className="bg-muted/40 p-3 rounded-lg border space-y-1.5">
                <div className="flex justify-between items-center pb-1 border-b border-border/60">
                  <span className="text-muted-foreground">Requester:</span>
                  <span className="font-semibold text-foreground">
                    {selectedMaintenanceReq.requestedBy?.firstName} {selectedMaintenanceReq.requestedBy?.lastName} ({selectedMaintenanceReq.requestedBy?.employeeCode || 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-border/60">
                  <span className="text-muted-foreground">Asset:</span>
                  <span className="font-medium text-foreground">
                    {selectedMaintenanceReq.asset?.name} ({selectedMaintenanceReq.asset?.assetTag})
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-border/60">
                  <span className="text-muted-foreground">Category & S/N:</span>
                  <span className="font-mono text-foreground">
                    {selectedMaintenanceReq.asset?.category} • {selectedMaintenanceReq.asset?.serialNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-border/60">
                  <span className="text-muted-foreground">Issue Title:</span>
                  <span className="font-semibold text-foreground">{selectedMaintenanceReq.issueTitle}</span>
                </div>
                {selectedMaintenanceReq.issueDescription && (
                  <div className="pb-1 border-b border-border/60">
                    <span className="text-muted-foreground block mb-0.5">Description:</span>
                    <p className="text-foreground bg-background/50 p-1.5 rounded border text-[11px]">
                      {selectedMaintenanceReq.issueDescription}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-muted-foreground">Priority & Status:</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono">{selectedMaintenanceReq.priority}</Badge>
                    {renderMaintenanceRequestStatusBadge(selectedMaintenanceReq.status)}
                  </div>
                </div>
              </div>

            {(() => {
              const isReqCompleted = selectedMaintenanceReq.status === 'COMPLETED';
              const isReqRejected = selectedMaintenanceReq.status === 'REJECTED';
              const isReqSentBack = selectedMaintenanceReq.status === 'SENT_BACK';
              const isReqInRepair = selectedMaintenanceReq.status === 'IN_REPAIR';
              const isReqInInspection = selectedMaintenanceReq.status === 'IN_INSPECTION';
              const isReqPending = selectedMaintenanceReq.status === 'PENDING';
              const isReqTerminal = isReqCompleted || isReqRejected;

              return (
                <>
                  {/* Inspection Remarks */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Inspection Remarks / Assessment</Label>
                    <Textarea
                      placeholder="Record technician observations, diagnostic results, or required parts..."
                      value={inspectionRemarks}
                      disabled={isReqTerminal}
                      onChange={(e) => setInspectionRemarks(e.target.value)}
                      className={`text-xs min-h-[70px] ${isReqTerminal ? 'bg-muted/40 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {/* Admin Remarks for Rejection / Send Back */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Feedback / Admin Remarks {isReqTerminal ? '' : '(Required if rejecting or sending back)'}</Label>
                    <Textarea
                      placeholder="Reason for rejection or instructions to employee..."
                      value={adminRemarks}
                      disabled={isReqTerminal}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      className={`text-xs min-h-[60px] ${isReqTerminal ? 'bg-muted/40 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {/* If Request is COMPLETED: Hide all workflow action buttons! */}
                  {isReqCompleted ? (
                    <div className="pt-2 border-t space-y-3">
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <strong className="font-semibold text-xs">Maintenance Completed & Verified</strong>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-[10px] font-semibold">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          This maintenance request has been successfully serviced and finalized. All administrative workflow actions are complete.
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold"
                          onClick={() => setIsInspectModalOpen(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : isReqRejected ? (
                    <div className="pt-2 border-t space-y-3">
                      <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                            <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <strong className="font-semibold text-xs">Maintenance Request Rejected</strong>
                          </div>
                          <Badge className="bg-rose-500/20 text-rose-700 border-rose-500/30 text-[10px] font-semibold">
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {adminRemarks || 'This request has been rejected by administration.'}
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold"
                          onClick={() => setIsInspectModalOpen(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Active Request: Workflow Action Buttons show according to lifecycle */
                    <div className="pt-2 border-t space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase">Workflow Actions</Label>
                        <span className="text-[10px] text-muted-foreground">
                          Current Stage: <strong className="text-foreground">{selectedMaintenanceReq.status}</strong>
                        </span>
                      </div>

                      {/* In Repair Notice Banner: Work Order already created */}
                      {isReqInRepair && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>Work Order is active in repair. Once repair is finished, click <strong>Complete</strong>.</span>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-[10px] font-semibold">
                            In Repair
                          </Badge>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end">
                        {/* 1. Mark In Inspection: Only if PENDING or SENT_BACK (disappears once in inspection) */}
                        {(isReqPending || isReqSentBack) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                            disabled={inspectMutation.isPending}
                            onClick={() =>
                              inspectMutation.mutate({
                                id: selectedMaintenanceReq.id,
                                remarks: inspectionRemarks,
                                status: 'IN_INSPECTION',
                              })
                            }
                          >
                            <Search className="h-3.5 w-3.5" /> Mark In Inspection
                          </Button>
                        )}

                        {/* 2. Create Work Order: Visible in PENDING or IN_INSPECTION (disappears once IN_REPAIR) */}
                        {(isReqPending || isReqInInspection) && (
                          <Button
                            type="button"
                            size="sm"
                            className="text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => handleCreateWorkOrderFromRequest(selectedMaintenanceReq)}
                          >
                            <Wrench className="h-3.5 w-3.5" /> Create Work Order
                          </Button>
                        )}

                        {/* 3. Complete: Visible in IN_INSPECTION or IN_REPAIR */}
                        {(isReqInInspection || isReqInRepair) && (
                          <Button
                            type="button"
                            size="sm"
                            className="text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={updateRequestStatusMutation.isPending}
                            onClick={() =>
                              updateRequestStatusMutation.mutate({
                                id: selectedMaintenanceReq.id,
                                status: 'COMPLETED',
                                remarks: inspectionRemarks || adminRemarks,
                              })
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                          </Button>
                        )}

                        {/* 4. Send Back: Available for PENDING or IN_INSPECTION */}
                        {(isReqPending || isReqInInspection) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold gap-1 text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
                            disabled={updateRequestStatusMutation.isPending}
                            onClick={() => {
                              if (!adminRemarks.trim()) {
                                toast.error('Please enter feedback/remarks before sending back.');
                                return;
                              }
                              updateRequestStatusMutation.mutate({
                                id: selectedMaintenanceReq.id,
                                status: 'SENT_BACK',
                                remarks: adminRemarks.trim(),
                              });
                            }}
                          >
                            <Undo2 className="h-3.5 w-3.5" /> Send Back
                          </Button>
                        )}

                        {/* 5. Reject: Available for PENDING or IN_INSPECTION */}
                        {(isReqPending || isReqInInspection) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                            disabled={updateRequestStatusMutation.isPending}
                            onClick={() => {
                              if (!adminRemarks.trim()) {
                                toast.error('Please enter rejection remarks before rejecting.');
                                return;
                              }
                              updateRequestStatusMutation.mutate({
                                id: selectedMaintenanceReq.id,
                                status: 'REJECTED',
                                remarks: adminRemarks.trim(),
                              });
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setIsInspectModalOpen(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
