import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  Tag,
  Calendar,
  DollarSign,
  ShieldCheck,
  Package,
  Layers,
  Laptop,
  History,
  FileText,
  User,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Info,
  ShoppingCart,
  SlidersHorizontal,
  Lock,
  Sparkles,
  X,
  RotateCcw,
  Settings,
  GitFork,
  Loader2,
} from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { branchesApi, departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser, isSuperAdminUser, isCompanyAdminUser } from '@/lib/modules';
import { AssetBranchFilter, matchAssetBranch } from './AssetBranchFilter';
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
import type { Asset } from '@/api/types';
import {
  INDUSTRY_SECTOR_PRESETS,
  getCompanyCategoryConfig,
  saveCompanyCategoryConfig,
} from './assetCategoryConfig';

const CONDITION_OPTIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED', 'UNDER_REPAIR', 'RETIRED'];

const STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'ALLOCATED', label: 'Allocated' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'DAMAGED', label: 'Lost / Damaged' },
];

const parseUsefulLife = (val?: string | null) => {
  if (!val) return { years: '5', months: '0' };
  const str = val.trim();
  const yearMatch = str.match(/(\d+)\s*(?:year|yr)/i);
  const monthMatch = str.match(/(\d+)\s*(?:month|mo)/i);

  if (yearMatch) {
    return {
      years: yearMatch[1],
      months: monthMatch ? monthMatch[1] : '0',
    };
  } else if (monthMatch) {
    const totalMonths = parseInt(monthMatch[1], 10);
    return {
      years: String(Math.floor(totalMonths / 12)),
      months: String(totalMonths % 12),
    };
  } else if (!isNaN(Number(str))) {
    return { years: str, months: '0' };
  }
  return { years: '5', months: '0' };
};

const formatUsefulLife = (years: string, months: string) => {
  const y = parseInt(years || '0', 10);
  const m = parseInt(months || '0', 10);
  if (y > 0 && m > 0) return `${y} Years ${m} Months`;
  if (y > 0) return `${y} Year${y > 1 ? 's' : ''}`;
  if (m > 0) return `${m} Month${m > 1 ? 's' : ''}`;
  return '5 Years';
};

const getEffectiveAssetStatus = (a: Asset) => {
  if (a.status === 'UNDER_MAINTENANCE' || a.status === 'RETIRED' || a.status === 'DAMAGED') {
    return a.status;
  }
  const assignType = a.assignmentType || a.assetType;
  if (assignType === 'UNASSIGNED') {
    return 'IN_STOCK';
  }
  if (a.currentEmployeeId || (a as any).currentEmployee || a.status === 'ALLOCATED' || assignType === 'EMPLOYEE') {
    return 'ALLOCATED';
  }
  if (
    assignType === 'LOCATION' ||
    assignType === 'DEPARTMENT' ||
    (!a.currentEmployeeId && (a.branchId || a.physicalLocation || a.departmentId))
  ) {
    return 'IN_USE';
  }
  return 'IN_STOCK';
};

const getAssetAssignmentSummary = (a: Asset) => {
  const assignType = a.assignmentType || a.assetType;

  // Unassigned / In Stock check takes top priority when explicit
  if (assignType === 'UNASSIGNED') {
    return {
      type: 'UNASSIGNED' as const,
      title: 'In Stock / Spares',
      subtitle: a.physicalLocation
        ? `Storage: ${a.physicalLocation}`
        : a.branch?.name
        ? `Warehouse: ${a.branch.name}`
        : 'Head Office Store',
    };
  }

  const emp = (a as any).currentEmployee;
  if (emp) {
    const code = emp.employeeCode || emp.employeeId ? ` (${emp.employeeCode || emp.employeeId})` : '';
    return {
      type: 'EMPLOYEE' as const,
      title: `${emp.firstName} ${emp.lastName || ''}${code}`.trim(),
      subtitle: a.branch?.name ? `Branch: ${a.branch.name}` : 'Head Office',
    };
  }
  if (a.currentEmployeeId || assignType === 'EMPLOYEE') {
    return {
      type: 'EMPLOYEE' as const,
      title: a.currentEmployeeId ? `Employee (${a.currentEmployeeId.substring(0, 8)})` : 'Employee Custody',
      subtitle: a.branch?.name ? `Branch: ${a.branch.name}` : 'Head Office',
    };
  }
  if (assignType === 'LOCATION' || a.branch || a.branchId || a.physicalLocation) {
    return {
      type: 'LOCATION' as const,
      title: a.branch?.name || 'Head Office',
      subtitle: `${a.department?.name ? `${a.department.name} · ` : ''}${a.physicalLocation || 'Corporate HQ'}`,
    };
  }
  if (assignType === 'DEPARTMENT' || a.department || a.departmentId) {
    return {
      type: 'DEPARTMENT' as const,
      title: a.department?.name || 'Department',
      subtitle: a.physicalLocation || 'Shared Dept Resource',
    };
  }
  return {
    type: 'UNASSIGNED' as const,
    title: 'In Stock / Spares',
    subtitle: a.branch?.name ? `Warehouse: ${a.branch.name}` : 'Head Office Store',
  };
};

export function AssetsTab({ companyId, branchId: propBranchId }: { companyId?: string; branchId?: string }) {
  const queryClient = useQueryClient();
  const { activeCompanyId, setActiveCompanyId, companies } = useCompany();
  const user = useAuthStore((s) => s.user);
  const isBranchAdmin = isBranchAdminUser(user);
  const userAssignedBranchId = propBranchId || user?.branchId || user?.employee?.branchId;
  const userAssignedCompanyId = user?.companyId || (user?.employee as any)?.companyId;

  const selectableCompanies = useMemo(() => {
    if (isBranchAdmin && userAssignedCompanyId) {
      const match = companies.filter((c) => c.id === userAssignedCompanyId);
      return match.length > 0 ? match : companies;
    }
    return companies;
  }, [companies, isBranchAdmin, userAssignedCompanyId]);

  const effectiveCompanyId = (isBranchAdmin && userAssignedCompanyId)
    ? userAssignedCompanyId
    : (companyId || activeCompanyId || selectableCompanies[0]?.id);

  const isSuperOrCompanyAdmin = useMemo(
    () => isSuperAdminUser(user) || isCompanyAdminUser(user),
    [user]
  );

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(() => {
    if (isBranchAdmin && userAssignedBranchId) {
      return userAssignedBranchId;
    }
    return 'HEAD_OFFICE';
  });

  useEffect(() => {
    if (isBranchAdmin && userAssignedBranchId) {
      setSelectedBranchFilter(userAssignedBranchId);
    }
  }, [isBranchAdmin, userAssignedBranchId]);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Modal Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // 3-Tab Wizard Navigation State
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'purchase' | 'status'>('basic');

  // Inline Form Field Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Company-Configurable Categories State
  const [isCategoryConfigOpen, setIsCategoryConfigOpen] = useState(false);
  const [activeSectorPreset, setActiveSectorPreset] = useState<string>('MANUFACTURING');
  const [activeSectorName, setActiveSectorName] = useState<string>('Manufacturing & Industrial');
  const [companyCategories, setCompanyCategories] = useState<string[]>(INDUSTRY_SECTOR_PRESETS[1].categories);
  const [deactivatedCategories, setDeactivatedCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingDeactivated, setPendingDeactivated] = useState<string[]>([]);
  const [pendingSector, setPendingSector] = useState<string>('MANUFACTURING');

  // Form Fields
  const [targetCompanyId, setTargetCompanyId] = useState(
    () => (isBranchAdmin && userAssignedCompanyId ? userAssignedCompanyId : (companyId || ''))
  );
  const [assignmentType, setAssignmentType] = useState<'LOCATION' | 'DEPARTMENT' | 'EMPLOYEE' | 'UNASSIGNED'>('LOCATION');
  const [currentEmployeeId, setCurrentEmployeeId] = useState('');
  const [branchId, setBranchId] = useState(() => (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE'));
  const [departmentId, setDepartmentId] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('Physical Asset');
  const [category, setCategory] = useState(INDUSTRY_SECTOR_PRESETS[1].categories[0]);
  const [physicalLocation, setPhysicalLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');

  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [warrantyStart, setWarrantyStart] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');

  const [status, setStatus] = useState('IN_STOCK');
  const [condition, setCondition] = useState('NEW');

  const [usefulLifeYears, setUsefulLifeYears] = useState('5');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const activeCompId =
    (isBranchAdmin && userAssignedCompanyId)
      ? userAssignedCompanyId
      : (targetCompanyId || effectiveCompanyId || (selectableCompanies[0]?.id ?? ''));

  // Queries
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', activeCompId, isBranchAdmin ? userAssignedBranchId : 'ALL'],
    queryFn: () =>
      assetsApi.list(
        activeCompId || undefined,
        isBranchAdmin ? userAssignedBranchId || undefined : undefined,
      ),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', activeCompId],
    queryFn: () => branchesApi.list(activeCompId),
    enabled: !!activeCompId,
  });

  const selectableBranches = useMemo(() => {
    if (isBranchAdmin && userAssignedBranchId) {
      const match = branches.filter((b) => b.id === userAssignedBranchId);
      return match.length > 0 ? match : branches;
    }
    return branches;
  }, [branches, isBranchAdmin, userAssignedBranchId]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeCompId],
    queryFn: () => departmentsApi.list(activeCompId),
    enabled: !!activeCompId,
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'asset-master-picker', activeCompId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 300, companyId: activeCompId || undefined }),
    enabled: !!activeCompId,
  });
  const employees = employeesPage?.items ?? [];

  // Filter departments by active company and selected branchId (Head Office vs specific branch)
  const availableDepartments = useMemo(() => {
    if (!departments || departments.length === 0) return [];
    const activeBranchFilter = (isBranchAdmin && userAssignedBranchId) ? userAssignedBranchId : branchId;
    const filtered = departments.filter((d: any) => {
      // 1. Strictly match active company context
      if (d.companyId && activeCompId && d.companyId !== activeCompId) return false;

      // 2. Head Office / No Branch selected:
      if (!isBranchAdmin && (activeBranchFilter === 'NONE' || !activeBranchFilter || activeBranchFilter === 'HEAD_OFFICE')) {
        return !d.branchId || d.branchId === 'NONE' || d.branchId === 'HEAD_OFFICE';
      }

      // 3. Specific Branch selected (e.g. Cravita B or Branch D):
      return d.branchId === activeBranchFilter;
    });

    // If editing existing asset and it has an assigned department, ensure it is preserved
    if (isEditOpen && selectedAsset?.departmentId) {
      const currentDept = departments.find((d: any) => d.id === selectedAsset.departmentId);
      if (currentDept && !filtered.some((d: any) => d.id === currentDept.id)) {
        filtered.push(currentDept);
      }
    }

    return filtered;
  }, [departments, activeCompId, branchId, isEditOpen, selectedAsset, isBranchAdmin, userAssignedBranchId]);

  // Filter employees by active company and selected branchId (Head Office vs specific branch)
  const availableEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    const activeBranchFilter = (isBranchAdmin && userAssignedBranchId) ? userAssignedBranchId : branchId;
    const filtered = employees.filter((emp: any) => {
      // 1. Strictly match active company context
      if (emp.companyId && activeCompId && emp.companyId !== activeCompId) return false;

      // 2. Active status check (cannot allocate new asset to exited employee)
      if (emp.status && emp.status !== 'ACTIVE' && emp.dateOfExit) return false;

      // 3. Head Office / No Branch selected:
      if (!isBranchAdmin && (activeBranchFilter === 'NONE' || !activeBranchFilter || activeBranchFilter === 'HEAD_OFFICE')) {
        return !emp.branchId || emp.branchId === 'NONE' || emp.branchId === 'HEAD_OFFICE';
      }

      // 4. Specific Branch selected (e.g. Cravita C, Cravita B, or Branch D):
      return emp.branchId === activeBranchFilter;
    });

    // If editing existing asset and it has an assigned employee, ensure it is preserved
    if (isEditOpen && selectedAsset?.currentEmployeeId) {
      const currentEmp = employees.find((e: any) => e.id === selectedAsset.currentEmployeeId);
      if (currentEmp && !filtered.some((e: any) => e.id === currentEmp.id)) {
        filtered.push(currentEmp);
      }
    }

    return filtered;
  }, [employees, activeCompId, branchId, isEditOpen, selectedAsset, isBranchAdmin, userAssignedBranchId]);

  const handleAssignmentTypeChange = (newType: 'LOCATION' | 'DEPARTMENT' | 'EMPLOYEE' | 'UNASSIGNED') => {
    setAssignmentType(newType);
    if (newType === 'LOCATION' || newType === 'DEPARTMENT') {
      setStatus('IN_USE');
      setCurrentEmployeeId('');
    } else if (newType === 'EMPLOYEE') {
      setStatus('ALLOCATED');
    } else if (newType === 'UNASSIGNED') {
      setStatus('IN_STOCK');
      setCurrentEmployeeId('');
      setDepartmentId('');
    }
  };

  // Load Company Category Configuration
  useEffect(() => {
    if (!activeCompId) return;
    const comp = companies.find((c) => c.id === activeCompId);
    const cfg = getCompanyCategoryConfig(activeCompId, comp?.entityType);
    setCompanyCategories(cfg.categories);
    setDeactivatedCategories(cfg.deactivatedCategories || []);
    setActiveSectorPreset(cfg.sector);
    setActiveSectorName(cfg.sectorName);

    const onUpdate = (e: any) => {
      if (e.detail?.companyId === activeCompId) {
        setCompanyCategories(e.detail.config.categories);
        setDeactivatedCategories(e.detail.config.deactivatedCategories || []);
        setActiveSectorPreset(e.detail.config.sector);
        setActiveSectorName(e.detail.config.sectorName);
      }
    };
    window.addEventListener('ehcm_asset_category_updated', onUpdate);
    return () => window.removeEventListener('ehcm_asset_category_updated', onUpdate);
  }, [activeCompId, companies]);

  // Category Configuration Modal Handlers
  const openCategoryConfig = () => {
    setPendingSector(activeSectorPreset);
    setPendingCategories([...companyCategories]);
    setPendingDeactivated([...deactivatedCategories]);
    setCustomCategoryInput('');
    setIsCategoryConfigOpen(true);
  };

  const handleApplyPreset = (presetId: string) => {
    const found = INDUSTRY_SECTOR_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setPendingSector(found.id);
      setPendingCategories([...found.categories]);
      setPendingDeactivated([]);
    }
  };

  const handleResetToPreset = () => {
    const found = INDUSTRY_SECTOR_PRESETS.find((p) => p.id === pendingSector) || INDUSTRY_SECTOR_PRESETS[1];
    setPendingCategories([...found.categories]);
    setPendingDeactivated([]);
    toast.info(`Categories reset to ${found.name} standard preset.`);
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    if (pendingCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('This category is already added.');
      return;
    }
    setPendingCategories([...pendingCategories, trimmed]);
    setCustomCategoryInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    // Check if category is currently in use by any registered asset
    const inUseCount = assets.filter(
      (a) => a.category && a.category.trim().toLowerCase() === catToRemove.trim().toLowerCase()
    ).length;

    if (inUseCount > 0) {
      toast.error(
        `"${catToRemove}" is currently in use by ${inUseCount} registered asset(s) and cannot be removed. You can deactivate it instead.`
      );
      return;
    }

    if (pendingCategories.length <= 1) {
      toast.error('Company must have at least one asset category configured.');
      return;
    }
    setPendingCategories(pendingCategories.filter((c) => c !== catToRemove));
  };

  const handleToggleDeactivate = (cat: string) => {
    if (pendingDeactivated.includes(cat)) {
      setPendingDeactivated(pendingDeactivated.filter((c) => c !== cat));
      toast.success(`"${cat}" reactivated for new asset registrations.`);
    } else {
      setPendingDeactivated([...pendingDeactivated, cat]);
      toast.info(`"${cat}" deactivated. Existing assets remain valid, but new assets cannot use this category.`);
    }
  };

  const handleSaveCategoryConfig = () => {
    if (pendingCategories.length === 0) {
      toast.error('Please configure at least one category.');
      return;
    }
    const matchingPreset = INDUSTRY_SECTOR_PRESETS.find((p) => p.id === pendingSector);
    const sectorName = matchingPreset?.name || (pendingSector === 'CUSTOM' ? 'Custom Sector' : pendingSector);

    saveCompanyCategoryConfig(activeCompId, {
      sector: pendingSector,
      sectorName,
      categories: pendingCategories,
      deactivatedCategories: pendingDeactivated,
    });

    setCompanyCategories(pendingCategories);
    setDeactivatedCategories(pendingDeactivated);
    setActiveSectorPreset(pendingSector);
    setActiveSectorName(sectorName);
    toast.success(`Asset categories saved for ${sectorName}.`);
    setIsCategoryConfigOpen(false);
  };

  // Available Categories for Form and Filters
  const availableFilterCategories = useMemo(() => {
    const existingAssetCategories = (assets || []).map((a) => a.category).filter(Boolean);
    return Array.from(new Set([...companyCategories, ...existingAssetCategories]));
  }, [companyCategories, assets]);

  // Form options only include ACTIVE (non-deactivated) categories, plus current asset category if editing
  const availableFormCategories = useMemo(() => {
    const activeCats = companyCategories.filter((c) => !deactivatedCategories.includes(c));
    if (isEditOpen && selectedAsset?.category && !activeCats.includes(selectedAsset.category)) {
      return [...activeCats, selectedAsset.category];
    }
    return activeCats.length > 0 ? activeCats : companyCategories;
  }, [companyCategories, deactivatedCategories, isEditOpen, selectedAsset]);

  // Auto-select Head Office or Assigned Branch when opening add modal if unassigned
  useEffect(() => {
    if (!branchId && isAddOpen) {
      setBranchId(isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE');
    }
  }, [branchId, isAddOpen, isBranchAdmin, userAssignedBranchId]);

  // Handle Company change -> reset Branch & Department
  const handleCompanyChange = (newCompId: string) => {
    if (isBranchAdmin) return;
    setTargetCompanyId(newCompId);
    setBranchId('NONE');
    setDepartmentId('');
    if (formErrors.companyId || formErrors.branchId) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.companyId;
        delete next.branchId;
        return next;
      });
    }
  };

  const generateUniqueSerial = () => {
    const prefix = 'SN-' + new Date().getFullYear() + '-';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
  };

  const resetForm = () => {
    setActiveFormTab('basic');
    setFormErrors({});
    const defaultCompId = (isBranchAdmin && userAssignedCompanyId)
      ? userAssignedCompanyId
      : ((selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : '') || effectiveCompanyId || (selectableCompanies[0]?.id ?? ''));
    setTargetCompanyId(defaultCompId);
    setBranchId(isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE');
    setDepartmentId('');
    setAssetTag('');
    setName('');
    setAssetType('Physical Asset');
    setCategory(companyCategories[0] || 'General Asset');
    setPhysicalLocation('');
    setNotes('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseCost('');
    setVendor('');
    setInvoiceNumber('');
    setPoNumber('');
    setSerialNumber(generateUniqueSerial());
    setManufacturer('');
    setModelNumber('');
    setWarrantyStart('');
    setWarrantyExpiry('');
    setStatus('IN_STOCK');
    setCondition('NEW');
    setUsefulLifeYears('5');
    setUsefulLifeMonths('0');
    setRemarks('');
    setPhotoUrl('');
    setAssignmentType('LOCATION');
    setCurrentEmployeeId('');
  };

  const openAddDialog = () => {
    resetForm();
    const defaultCompId = (isBranchAdmin && userAssignedCompanyId)
      ? userAssignedCompanyId
      : ((selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : '') || effectiveCompanyId || (selectableCompanies[0]?.id ?? ''));
    setTargetCompanyId(defaultCompId);
    setCategory(companyCategories[0] || 'General Asset');
    setSerialNumber(generateUniqueSerial());
    setBranchId(isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE');
    setIsAddOpen(true);
  };

  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setActiveFormTab('basic');
    setFormErrors({});
    const compId = (isBranchAdmin && userAssignedCompanyId)
      ? userAssignedCompanyId
      : (asset.companyId || companyId || (selectableCompanies[0]?.id ?? ''));
    setTargetCompanyId(compId);
    const brId = (isBranchAdmin && userAssignedBranchId)
      ? userAssignedBranchId
      : (asset.branchId || 'NONE');
    setBranchId(brId);
    setDepartmentId(asset.departmentId || '');
    setAssetTag(asset.assetTag || '');
    setName(asset.name || '');
    const loadedType = asset.assetType || 'Physical Asset';
    setAssetType(loadedType);
    setCategory(asset.category || companyCategories[0] || 'General Asset');
    setPhysicalLocation(asset.physicalLocation || '');
    setNotes(asset.notes || '');
    setPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '');
    setPurchaseCost(asset.value !== undefined && asset.value !== null ? String(asset.value) : '');
    setVendor(asset.vendor || '');
    setInvoiceNumber(asset.invoiceNumber || '');
    setPoNumber(asset.poNumber || '');
    setSerialNumber(asset.serialNumber || '');
    setManufacturer(asset.manufacturer || '');
    setModelNumber(asset.modelNumber || '');
    setWarrantyStart(asset.warrantyStart ? asset.warrantyStart.split('T')[0] : '');
    setWarrantyExpiry(asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '');

    // Detect Assignment Type:
    let detectedType: 'LOCATION' | 'DEPARTMENT' | 'EMPLOYEE' | 'UNASSIGNED' = 'LOCATION';
    const explicitAssignType = asset.assignmentType || asset.assetType;
    if (explicitAssignType === 'UNASSIGNED') {
      detectedType = 'UNASSIGNED';
    } else if (explicitAssignType === 'EMPLOYEE') {
      detectedType = 'EMPLOYEE';
    } else if (explicitAssignType === 'DEPARTMENT') {
      detectedType = 'DEPARTMENT';
    } else if (explicitAssignType === 'LOCATION') {
      detectedType = 'LOCATION';
    } else {
      const hasEmployee = Boolean(asset.currentEmployeeId || (asset as any).currentEmployee);
      if (hasEmployee || asset.status === 'ALLOCATED') {
        detectedType = 'EMPLOYEE';
      } else if (asset.departmentId && !asset.branchId) {
        detectedType = 'DEPARTMENT';
      } else if (asset.branchId || asset.physicalLocation) {
        detectedType = 'LOCATION';
      } else {
        detectedType = 'UNASSIGNED';
      }
    }
    setAssignmentType(detectedType);
    setCurrentEmployeeId(asset.currentEmployeeId || (asset as any).currentEmployee?.id || '');

    // Operational status:
    let initialStatus = asset.status || 'IN_STOCK';
    if (detectedType === 'LOCATION' || detectedType === 'DEPARTMENT') {
      if (initialStatus === 'ALLOCATED' || initialStatus === 'IN_STOCK' || !initialStatus) {
        initialStatus = 'IN_USE';
      }
    } else if (detectedType === 'EMPLOYEE') {
      initialStatus = 'ALLOCATED';
    } else if (detectedType === 'UNASSIGNED') {
      initialStatus = initialStatus === 'UNDER_MAINTENANCE' || initialStatus === 'RETIRED' || initialStatus === 'DAMAGED' ? initialStatus : 'IN_STOCK';
    }
    setStatus(initialStatus);

    setCondition(asset.condition || 'NEW');
    const parsedUL = parseUsefulLife(asset.usefulLife);
    setUsefulLifeYears(parsedUL.years);
    setUsefulLifeMonths(parsedUL.months);
    setRemarks(asset.remarks || asset.notes || '');
    setPhotoUrl(asset.photoUrl || '');
    setIsEditOpen(true);
  };

  const openDetailDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailOpen(true);
  };

  // Tab 1 Validation with Standard ERP Messages
  const validateTab1 = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Asset Name is required.';
    } else if (name.trim().length < 3 || name.trim().length > 100) {
      errors.name = 'Asset Name must be between 3 and 100 characters.';
    }

    if (!category.trim()) {
      errors.category = 'Asset Category is required.';
    }
    if (!activeCompId) {
      errors.companyId = 'Company / Entity is required.';
    }

    if (assignmentType === 'LOCATION') {
      const activeBr = (isBranchAdmin && userAssignedBranchId) ? userAssignedBranchId : branchId;
      if (!activeBr || (isBranchAdmin && activeBr === 'NONE')) {
        errors.branchId = 'Branch / Location is required for Location Assignment.';
      } else if (activeBr !== 'NONE' && branches.length > 0 && !branches.some((b) => b.id === activeBr)) {
        errors.branchId = 'Selected branch does not belong to the selected company.';
      }
    }

    if (assignmentType === 'DEPARTMENT' && (!departmentId || departmentId === 'NONE') && departments.length > 0) {
      errors.departmentId = 'Department is required for Department Assignment.';
    }

    if (assignmentType === 'EMPLOYEE' && !currentEmployeeId && employees.length > 0) {
      errors.currentEmployeeId = 'Assigned Employee is required for Employee Allocation.';
    }

    if (physicalLocation.length > 200) {
      errors.physicalLocation = 'Physical Location cannot exceed 200 characters.';
    }

    if (notes.length > 500) {
      errors.notes = 'Description cannot exceed 500 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.name;
      delete next.category;
      delete next.companyId;
      delete next.branchId;
      delete next.departmentId;
      delete next.currentEmployeeId;
      delete next.physicalLocation;
      delete next.notes;
      return next;
    });
    return true;
  };

  // Tab 2 Validation with Standard ERP Messages
  const validateTab2 = () => {
    const errors: Record<string, string> = {};
    if (!purchaseDate) {
      errors.purchaseDate = 'Purchase Date is required.';
    } else {
      const pDate = new Date(purchaseDate);
      const today = new Date();
      if (pDate > today) {
        errors.purchaseDate = 'Purchase Date cannot be in the future.';
      }
    }

    if (!purchaseCost || purchaseCost.trim() === '') {
      errors.purchaseCost = 'Purchase Cost is required.';
    } else if (isNaN(Number(purchaseCost)) || Number(purchaseCost) <= 0) {
      errors.purchaseCost = 'Purchase Cost must be greater than 0.';
    }

    if (warrantyStart && warrantyExpiry) {
      if (new Date(warrantyExpiry) < new Date(warrantyStart)) {
        errors.warrantyExpiry = 'Warranty End Date cannot be before Warranty Start Date.';
      }
    }

    // Serial number uniqueness check
    if (serialNumber && serialNumber.trim()) {
      const trimmedSerial = serialNumber.trim().toLowerCase();
      const duplicateSerial = assets.find(
        (a) =>
          a.serialNumber &&
          a.serialNumber.trim().toLowerCase() === trimmedSerial &&
          (isAddOpen ? true : a.id !== selectedAsset?.id)
      );
      if (duplicateSerial) {
        errors.serialNumber = 'This Serial Number is already registered.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.purchaseDate;
      delete next.purchaseCost;
      delete next.warrantyExpiry;
      delete next.serialNumber;
      return next;
    });
    return true;
  };

  // Tab 3 Validation with Standard ERP Messages
  const validateTab3 = () => {
    const errors: Record<string, string> = {};
    if (!status.trim()) {
      errors.status = 'Asset Status is required.';
    }
    if (!condition.trim()) {
      errors.condition = 'Asset Condition is required.';
    }

    const y = Number(usefulLifeYears);
    const m = Number(usefulLifeMonths);
    if (isNaN(y) || y < 0) {
      errors.usefulLifeYears = 'Useful Life Years must be 0 or greater.';
    }
    if (isNaN(m) || m < 0 || m > 11) {
      errors.usefulLifeMonths = 'Useful Life Months must be between 0 and 11.';
    }
    if (y === 0 && m === 0) {
      errors.usefulLifeYears = 'Useful Life must be at least 1 month or 1 year.';
    }

    if (remarks.length > 500) {
      errors.remarks = 'Remarks cannot exceed 500 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.status;
      delete next.condition;
      delete next.usefulLifeYears;
      delete next.usefulLifeMonths;
      delete next.remarks;
      return next;
    });
    return true;
  };

  const handleNextFromTab1 = () => {
    if (validateTab1()) {
      setActiveFormTab('purchase');
    }
  };

  const handleNextFromTab2 = () => {
    if (validateTab2()) {
      setActiveFormTab('status');
    }
  };

  const handleSaveAsset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSubmitting || isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    if (!validateTab1()) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setActiveFormTab('basic');
      return;
    }
    if (!validateTab2()) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setActiveFormTab('purchase');
      return;
    }
    if (!validateTab3()) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setActiveFormTab('status');
      return;
    }

    let isSuccess = false;
    let createdAsset: any = null;

    try {
      const targetStatus =
        assignmentType === 'UNASSIGNED'
          ? status === 'UNDER_MAINTENANCE' || status === 'RETIRED' || status === 'DAMAGED'
            ? status
            : 'IN_STOCK'
          : status;

      const targetBranchId = (isBranchAdmin && userAssignedBranchId)
        ? userAssignedBranchId
        : (branchId === 'NONE' || !branchId ? null : branchId);
      const targetCompId = (isBranchAdmin && userAssignedCompanyId)
        ? userAssignedCompanyId
        : activeCompId;
      const targetDeptId = assignmentType === 'UNASSIGNED' ? null : (departmentId === 'NONE' || !departmentId ? null : departmentId);

      const payload = {
        companyId: targetCompId,
        branchId: targetBranchId,
        departmentId: targetDeptId,
        assetTag: assetTag.trim() || undefined,
        name: name.trim(),
        category: category.trim(),
        assetType: assignmentType,
        assignmentType,
        currentEmployeeId: assignmentType === 'EMPLOYEE' ? (currentEmployeeId || undefined) : null,
        physicalLocation: physicalLocation.trim() || (targetBranchId === null && !isBranchAdmin ? 'Head Office' : undefined),
        notes: notes.trim() || undefined,
        purchaseDate,
        value: Number(purchaseCost),
        vendor: vendor.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        poNumber: poNumber.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        modelNumber: modelNumber.trim() || undefined,
        warrantyStart: warrantyStart || undefined,
        warrantyExpiry: warrantyExpiry || undefined,
        status: targetStatus,
        condition,
        usefulLife: formatUsefulLife(usefulLifeYears, usefulLifeMonths),
        remarks: remarks.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
      };

      if (isEditOpen && selectedAsset) {
        await assetsApi.update(selectedAsset.id, payload);
        toast.dismiss();
        toast.success('Asset Master updated successfully.');
        setIsEditOpen(false);
        setSelectedAsset(null);
        isSuccess = true;
      } else {
        createdAsset = await assetsApi.create(payload);
        toast.dismiss();
        toast.success('Asset registered successfully.');
        setIsAddOpen(false);
        resetForm();
        isSuccess = true;
      }
    } catch (err: any) {
      console.error('Failed to save asset:', err);
      toast.dismiss();
      const rawMsg = err?.response?.data?.message;
      const errorText = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : (typeof rawMsg === 'string' && rawMsg.trim().length > 0 ? rawMsg : 'Failed to register asset');
      toast.error(errorText);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }

    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['assets'] }).catch(() => {});
      if (isSuperOrCompanyAdmin && selectedCompanyFilter !== 'ALL' && createdAsset?.companyId && createdAsset.companyId !== selectedCompanyFilter) {
        setSelectedCompanyFilter(createdAsset.companyId);
      }
    }
  };

  // Filtered Assets using Effective Status and Branch Filter
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (!matchAssetBranch(a, selectedBranchFilter, isBranchAdmin, userAssignedBranchId, branches)) {
        return false;
      }

      const effectiveSts = getEffectiveAssetStatus(a);
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.manufacturer && a.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.physicalLocation && a.physicalLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' ? true : a.category === selectedCategory;
      const matchesSts =
        selectedStatus === 'ALL'
          ? true
          : selectedStatus === 'IN_STOCK'
          ? effectiveSts === 'IN_STOCK' || effectiveSts === 'AVAILABLE'
          : effectiveSts === selectedStatus;
      const matchesCnd = selectedCondition === 'ALL' ? true : a.condition === selectedCondition;

      return matchesSearch && matchesCat && matchesSts && matchesCnd;
    });
  }, [
    assets,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedCondition,
    isBranchAdmin,
    userAssignedBranchId,
    isSuperOrCompanyAdmin,
    selectedBranchFilter,
    branches,
  ]);

  const currentBranchName = useMemo(() => {
    if (branchId === 'NONE' || !branchId) {
      return isBranchAdmin ? 'Assigned Branch' : 'Head Office / No Branch';
    }
    const b = branches.find((item) => item.id === branchId);
    return b?.name || (isBranchAdmin ? 'Assigned Branch' : 'Head Office / No Branch');
  }, [branches, branchId, isBranchAdmin]);

  const currentDeptName = useMemo(() => {
    if (!departmentId || departmentId === 'NONE') return 'General / None';
    const d = departments.find((item) => item.id === departmentId);
    return d?.name || 'Department';
  }, [departments, departmentId]);

  const currentEmployeeName = useMemo(() => {
    if (!currentEmployeeId) return '';
    const emp = employees.find((e) => e.id === currentEmployeeId);
    if (emp) {
      const code = emp.employeeCode || emp.id ? ` (${emp.employeeCode || emp.id.substring(0, 6)})` : '';
      return `${emp.firstName} ${emp.lastName || ''}${code}`.trim();
    }
    return `Employee (${currentEmployeeId.substring(0, 6)})`;
  }, [employees, currentEmployeeId]);

  const currentAssignedTo = useMemo(() => {
    if (assignmentType === 'EMPLOYEE') return currentEmployeeName || 'Select Employee';
    if (assignmentType === 'LOCATION') return currentBranchName || 'Select Facility / Plant';
    if (assignmentType === 'DEPARTMENT') return currentDeptName || 'Select Department';
    return 'In Storage / Spares Stock';
  }, [assignmentType, currentEmployeeName, currentBranchName, currentDeptName]);

  return (
    <div className="space-y-6">
      {/* ── Asset Master Header & Actions ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Permanent Asset Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Single source of truth for registering organizational assets, equipment, software licenses & operational records
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-border whitespace-nowrap"
                onClick={openCategoryConfig}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                <span>Configure Categories</span>
              </Button>
              <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 whitespace-nowrap" onClick={openAddDialog}>
                <Plus className="h-3.5 w-3.5" /> Register Asset
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
                type="text"
                placeholder="Search Asset Tag, Name, Serial No, Manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter (Same as Employee Module) */}
              <AssetBranchFilter
                isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
                isBranchAdmin={isBranchAdmin}
                selectedBranch={selectedBranchFilter}
                onBranchChange={setSelectedBranchFilter}
                branches={branches}
                assignedBranchName={branches.find((b) => b.id === userAssignedBranchId)?.name}
              />

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {availableFilterCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="IN_STOCK">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="ALLOCATED">Allocated</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                  <SelectItem value="DAMAGED">Lost / Damaged</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Conditions</SelectItem>
                  {CONDITION_OPTIONS.map((cnd) => (
                    <SelectItem key={cnd} value={cnd} className="text-xs">
                      {cnd}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Asset Master Directory Table ── */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Asset ID</TableHead>
                <TableHead className="text-xs">Asset Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Assignment & Location</TableHead>
                <TableHead className="text-xs">Serial Number</TableHead>
                <TableHead className="text-xs">Purchase Cost</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Condition</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    Loading asset master records...
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    No registered assets found. Click <strong>"Register Asset"</strong> to add an asset record.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((a) => {
                  const effectiveSts = getEffectiveAssetStatus(a);
                  const assignSummary = getAssetAssignmentSummary(a);

                  return (
                    <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{a.assetTag}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground block">{a.name}</span>
                        <span className="text-[10px] text-muted-foreground">{a.manufacturer || 'General'} {a.modelNumber ? `(${a.modelNumber})` : ''}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{a.category}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          {assignSummary.type === 'LOCATION' && <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                          {assignSummary.type === 'EMPLOYEE' && <User className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                          {assignSummary.type === 'DEPARTMENT' && <Layers className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                          {assignSummary.type === 'UNASSIGNED' && <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          <span className="font-semibold text-foreground truncate max-w-[150px]" title={assignSummary.title}>
                            {assignSummary.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]" title={assignSummary.subtitle}>
                          {assignSummary.subtitle}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground font-medium">{a.serialNumber || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {a.value !== null && a.value !== undefined ? `₹${a.value.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            effectiveSts === 'ALLOCATED'
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                              : effectiveSts === 'IN_USE'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : effectiveSts === 'IN_STOCK' || effectiveSts === 'AVAILABLE'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : effectiveSts === 'UNDER_MAINTENANCE'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : effectiveSts === 'DAMAGED'
                              ? 'bg-red-500/10 text-red-600 border-red-500/20'
                              : 'bg-slate-500/10 text-slate-600 border-slate-300'
                          }`}
                        >
                          {effectiveSts === 'IN_STOCK'
                            ? 'Available'
                            : effectiveSts === 'IN_USE'
                            ? 'In Use'
                            : effectiveSts === 'DAMAGED'
                            ? 'Damaged'
                            : effectiveSts.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{a.condition || 'NEW'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Full Specs" onClick={() => openDetailDialog(a)}>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit Master Record" onClick={() => openEditDialog(a)}>
                            <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── ENTERPRISE 3-TAB ASSET MASTER DIALOG ── */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(v) => { if (!v) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> {isEditOpen ? 'Edit Asset Master Record' : 'Register New Asset'}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {assetTag || 'Auto-Code: AST-XXXXXX'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {isEditOpen && (
            <div className="bg-primary/5 border border-primary/20 text-foreground p-2.5 rounded-lg text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {assignmentType === 'LOCATION' && <Building2 className="h-4 w-4 text-blue-600 shrink-0" />}
                {assignmentType === 'EMPLOYEE' && <User className="h-4 w-4 text-purple-600 shrink-0" />}
                {assignmentType === 'DEPARTMENT' && <Layers className="h-4 w-4 text-indigo-600 shrink-0" />}
                {assignmentType === 'UNASSIGNED' && <Package className="h-4 w-4 text-slate-500 shrink-0" />}
                <div>
                  <span className="font-semibold text-foreground">
                    {assignmentType === 'LOCATION'
                      ? 'Location Asset (Plant & Facility Machinery)'
                      : assignmentType === 'DEPARTMENT'
                      ? 'Department Shared Resource'
                      : assignmentType === 'EMPLOYEE'
                      ? 'Employee Allocated Device'
                      : 'Unassigned Spares & Warehouse Stock'}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {assignmentType === 'LOCATION'
                      ? `Assigned to: ${currentBranchName}. Operational status is In Use and separated from employee exit clearance.`
                      : assignmentType === 'DEPARTMENT'
                      ? `Assigned to: ${currentDeptName}. Operational status is In Use.`
                      : assignmentType === 'EMPLOYEE'
                      ? `Allocated to: ${currentEmployeeName || 'Employee'}. Tracked in employee return workflows.`
                      : 'Maintained in stock inventory ready for future allocation or location deployment.'}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[10.5px] uppercase font-semibold shrink-0">
                {status === 'IN_USE' ? 'In Use' : status === 'IN_STOCK' ? 'Available' : status}
              </Badge>
            </div>
          )}

          <form
            onSubmit={handleSaveAsset}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                if (activeFormTab === 'basic') {
                  e.preventDefault();
                  handleNextFromTab1();
                } else if (activeFormTab === 'purchase') {
                  e.preventDefault();
                  handleNextFromTab2();
                }
              }
            }}
            className="space-y-4 text-xs pt-2"
          >
            <Tabs value={activeFormTab} onValueChange={(val: any) => setActiveFormTab(val)} className="w-full">
              <TabsList className="grid grid-cols-3 h-9 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="basic" className="text-xs font-semibold gap-1.5">
                  <Info className="h-3.5 w-3.5" /> 1. Basic Info
                  {(formErrors.name || formErrors.category || formErrors.companyId || formErrors.branchId) && (
                    <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="purchase" className="text-xs font-semibold gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" /> 2. Purchase & Identity
                  {(formErrors.purchaseDate || formErrors.purchaseCost || formErrors.serialNumber || formErrors.warrantyExpiry) && (
                    <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="status" className="text-xs font-semibold gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> 3. Status & Additional
                </TabsTrigger>
              </TabsList>

              {/* ── TAB 1 — BASIC INFO ── */}
              <TabsContent value="basic" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Asset ID / Code</Label>
                    <Input
                      type="text"
                      disabled
                      placeholder="Auto-generated (e.g. AST-000001)"
                      value={assetTag}
                      className="h-8 text-xs font-mono bg-muted/40 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Asset Name *</Label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. MacBook Pro 16 M3 Max / Industrial Generator"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formErrors.name) setFormErrors((p) => { const n = { ...p }; delete n.name; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.name ? 'border-destructive' : ''}`}
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Asset Category *</Label>
                      <button
                        type="button"
                        onClick={openCategoryConfig}
                        className="text-[10.5px] text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        <SlidersHorizontal className="h-3 w-3" /> Configure
                      </button>
                    </div>
                    <Select value={category} onValueChange={(val) => {
                      setCategory(val);
                      if (formErrors.category) setFormErrors((p) => { const n = { ...p }; delete n.category; return n; });
                    }}>
                      <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.category ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Company / Entity Context *</Label>
                    <Select value={targetCompanyId} onValueChange={handleCompanyChange} disabled={isBranchAdmin}>
                      <SelectTrigger className={`h-8 text-xs bg-background overflow-hidden ${formErrors.companyId ? 'border-destructive' : ''} ${isBranchAdmin ? 'opacity-90 cursor-not-allowed' : ''}`}>
                        <div className="truncate max-w-[240px] text-left">
                          <SelectValue placeholder="Select Company" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {selectableCompanies.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.companyId && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.companyId}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── ASSIGNMENT TYPE SELECTION & CONFIGURATION ── */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Assignment Type *
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Select operational ownership model
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAssignmentTypeChange('LOCATION')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        assignmentType === 'LOCATION'
                          ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 font-semibold ring-1 ring-blue-500/30'
                          : 'bg-background border-border/70 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span>Location</span>
                      </div>
                      <span className="text-[9.5px] block mt-0.5 opacity-80 leading-tight">
                        Machinery, plant & facility
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignmentTypeChange('DEPARTMENT')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        assignmentType === 'DEPARTMENT'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-semibold ring-1 ring-indigo-500/30'
                          : 'bg-background border-border/70 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                        <span>Department</span>
                      </div>
                      <span className="text-[9.5px] block mt-0.5 opacity-80 leading-tight">
                        Shared dept / lab kits
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignmentTypeChange('EMPLOYEE')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        assignmentType === 'EMPLOYEE'
                          ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400 font-semibold ring-1 ring-purple-500/30'
                          : 'bg-background border-border/70 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <User className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                        <span>Employee</span>
                      </div>
                      <span className="text-[9.5px] block mt-0.5 opacity-80 leading-tight">
                        Personal laptops & badges
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignmentTypeChange('UNASSIGNED')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        assignmentType === 'UNASSIGNED'
                          ? 'bg-slate-500/10 border-slate-500 text-slate-700 dark:text-slate-300 font-semibold ring-1 ring-slate-500/30'
                          : 'bg-background border-border/70 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <Package className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span>In Stock</span>
                      </div>
                      <span className="text-[9.5px] block mt-0.5 opacity-80 leading-tight">
                        Unassigned spares in store
                      </span>
                    </button>
                  </div>

                  {/* ── DYNAMIC ASSIGNMENT TARGETS ── */}
                  {assignmentType === 'LOCATION' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="font-semibold">Branch / Plant Facility *</Label>
                        <Select
                          value={branchId || (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE')}
                          disabled={isBranchAdmin}
                          onValueChange={(val) => {
                            if (isBranchAdmin) return;
                            setBranchId(val);
                            if (val === 'NONE' && !physicalLocation) {
                              setPhysicalLocation('Head Office');
                            }
                            if (formErrors.branchId) setFormErrors((p) => { const n = { ...p }; delete n.branchId; return n; });
                            // Auto-reset departmentId if current department doesn't belong to the newly selected branch
                            if (departmentId && departmentId !== 'NONE') {
                              const dept = departments.find((d) => d.id === departmentId);
                              const isValid = val === 'NONE'
                                ? (!dept?.branchId || dept.branchId === 'NONE' || dept.branchId === 'HEAD_OFFICE')
                                : dept?.branchId === val;
                              if (!isValid) setDepartmentId('');
                            }
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.branchId ? 'border-destructive' : ''} ${isBranchAdmin ? 'opacity-90 cursor-not-allowed' : ''}`}>
                            <SelectValue placeholder="Select Branch / Plant" />
                          </SelectTrigger>
                          <SelectContent>
                            {!isBranchAdmin && (
                              <SelectItem value="NONE" className="text-xs text-muted-foreground italic font-medium">
                                Head Office / No Branch
                              </SelectItem>
                            )}
                            {selectableBranches.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name} ({b.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.branchId && (
                          <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3 inline" /> {formErrors.branchId}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold">Department Context</Label>
                        <Select value={departmentId} onValueChange={setDepartmentId}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder={availableDepartments.length === 0 ? "No departments available" : "Select Department"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None / General Plant</SelectItem>
                            {availableDepartments.map((d) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name} ({d.code})
                              </SelectItem>
                            ))}
                            {availableDepartments.length === 0 && (
                              <SelectItem value="__none_avail__" disabled className="text-xs text-muted-foreground italic">
                                No departments in this {branchId === 'NONE' || !branchId ? 'Head Office' : 'Branch'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {assignmentType === 'DEPARTMENT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="font-semibold">Assigned Department *</Label>
                        <Select
                          value={departmentId}
                          onValueChange={(val) => {
                            setDepartmentId(val);
                            if (formErrors.departmentId) setFormErrors((p) => { const n = { ...p }; delete n.departmentId; return n; });
                            // If a department is selected and is tied to a specific branch, auto-sync branchId
                            const matched = departments.find((d) => d.id === val);
                            if (matched) {
                              if (matched.branchId) {
                                setBranchId(matched.branchId);
                              } else {
                                setBranchId('NONE');
                              }
                            }
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.departmentId ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder={availableDepartments.length === 0 ? "No departments available" : "Select Department"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDepartments.map((d) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name} ({d.code})
                              </SelectItem>
                            ))}
                            {availableDepartments.length === 0 && (
                              <SelectItem value="__none_avail__" disabled className="text-xs text-muted-foreground italic">
                                No departments in this {branchId === 'NONE' || !branchId ? 'Head Office' : 'Branch'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.departmentId && (
                          <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3 inline" /> {formErrors.departmentId}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold">Branch / Facility Context</Label>
                        <Select
                          value={branchId || (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE')}
                          disabled={isBranchAdmin}
                          onValueChange={(val) => {
                            if (isBranchAdmin) return;
                            setBranchId(val);
                            // Auto-reset departmentId if current department doesn't belong to the newly selected branch
                            if (departmentId && departmentId !== 'NONE') {
                              const dept = departments.find((d) => d.id === departmentId);
                              const isValid = val === 'NONE'
                                ? (!dept?.branchId || dept.branchId === 'NONE' || dept.branchId === 'HEAD_OFFICE')
                                : dept?.branchId === val;
                              if (!isValid) setDepartmentId('');
                            }
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs bg-background ${isBranchAdmin ? 'opacity-90 cursor-not-allowed' : ''}`}>
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {!isBranchAdmin && (
                              <SelectItem value="NONE" className="text-xs text-muted-foreground italic font-medium">
                                Head Office / Corporate
                              </SelectItem>
                            )}
                            {selectableBranches.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name} ({b.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {assignmentType === 'EMPLOYEE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="font-semibold">Assigned Employee *</Label>
                        <Select
                          value={currentEmployeeId}
                          onValueChange={(val) => {
                            setCurrentEmployeeId(val);
                            if (formErrors.currentEmployeeId) setFormErrors((p) => { const n = { ...p }; delete n.currentEmployeeId; return n; });
                            // Auto-sync branchId if selected employee belongs to a branch
                            const matched = employees.find((e) => e.id === val);
                            if (matched) {
                              if (matched.branchId) {
                                setBranchId(matched.branchId);
                              } else {
                                setBranchId('NONE');
                              }
                            }
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.currentEmployeeId ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder={availableEmployees.length === 0 ? "No employees for this branch" : "Select Employee"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableEmployees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs font-semibold">
                                {emp.firstName} {emp.lastName || ''} ({emp.employeeCode || emp.id.substring(0, 6)})
                              </SelectItem>
                            ))}
                            {availableEmployees.length === 0 && (
                              <SelectItem value="__none_emp__" disabled className="text-xs text-muted-foreground italic">
                                No employees in this {branchId === 'NONE' || !branchId ? 'Head Office' : 'Branch'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.currentEmployeeId && (
                          <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3 inline" /> {formErrors.currentEmployeeId}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold">Branch / Office Context</Label>
                        <Select
                          value={branchId || (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE')}
                          disabled={isBranchAdmin}
                          onValueChange={(val) => {
                            if (isBranchAdmin) return;
                            setBranchId(val);
                            // Auto-reset currentEmployeeId if current employee doesn't belong to the newly selected branch
                            if (currentEmployeeId) {
                              const emp = employees.find((e) => e.id === currentEmployeeId);
                              const isValid = val === 'NONE'
                                ? (!emp?.branchId || emp.branchId === 'NONE' || emp.branchId === 'HEAD_OFFICE')
                                : emp?.branchId === val;
                              if (!isValid) setCurrentEmployeeId('');
                            }
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs bg-background ${isBranchAdmin ? 'opacity-90 cursor-not-allowed' : ''}`}>
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {!isBranchAdmin && (
                              <SelectItem value="NONE" className="text-xs text-muted-foreground italic font-medium">
                                Head Office / Corporate
                              </SelectItem>
                            )}
                            {selectableBranches.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name} ({b.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {assignmentType === 'UNASSIGNED' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="font-semibold">Storage Branch / Warehouse</Label>
                        <Select
                          value={branchId || (isBranchAdmin && userAssignedBranchId ? userAssignedBranchId : 'NONE')}
                          disabled={isBranchAdmin}
                          onValueChange={(val) => {
                            if (isBranchAdmin) return;
                            setBranchId(val);
                          }}
                        >
                          <SelectTrigger className={`h-8 text-xs bg-background ${isBranchAdmin ? 'opacity-90 cursor-not-allowed' : ''}`}>
                            <SelectValue placeholder="Select Warehouse / Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {!isBranchAdmin && (
                              <SelectItem value="NONE" className="text-xs text-muted-foreground italic font-medium">
                                Head Office / Central Store
                              </SelectItem>
                            )}
                            {selectableBranches.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name} ({b.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 flex items-end">
                        <span className="text-[11px] text-muted-foreground pb-2 italic">
                          Asset will remain in Available stock ready for allocation or deployment.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    <Label className="font-semibold">
                      {assignmentType === 'LOCATION'
                        ? 'Shop Floor / Bay / Production Area / Room'
                        : assignmentType === 'EMPLOYEE'
                        ? 'Desk / Workstation Location'
                        : assignmentType === 'DEPARTMENT'
                        ? 'Department Lab / Facility Area'
                        : 'Warehouse Storage Rack / Shelf'}
                    </Label>
                    <Input
                      type="text"
                      maxLength={200}
                      placeholder={
                        assignmentType === 'LOCATION'
                          ? 'e.g. Production Shop Floor – Bay 01, Heavy Press Line A'
                          : assignmentType === 'EMPLOYEE'
                          ? 'e.g. Floor 3, Desk 42, Remote'
                          : assignmentType === 'DEPARTMENT'
                          ? 'e.g. Quality Control Lab Room 102'
                          : 'e.g. Central Warehouse Shelf B-4'
                      }
                      value={physicalLocation}
                      onChange={(e) => setPhysicalLocation(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Description / Notes</Label>
                  <Textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Enter basic summary or description..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs min-h-[50px]"
                  />
                </div>
              </TabsContent>

              {/* ── TAB 2 — PURCHASE & IDENTITY ── */}
              <TabsContent value="purchase" className="space-y-4 pt-3">
                {/* Section A — Purchase Information */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                    <ShoppingCart className="h-3.5 w-3.5" /> Section A — Purchase Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Purchase Date * (Cannot be future date)</Label>
                      <Input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={purchaseDate}
                        onChange={(e) => {
                          setPurchaseDate(e.target.value);
                          if (formErrors.purchaseDate) setFormErrors((p) => { const n = { ...p }; delete n.purchaseDate; return n; });
                        }}
                        className={`h-8 text-xs bg-background ${formErrors.purchaseDate ? 'border-destructive' : ''}`}
                      />
                      {formErrors.purchaseDate && (
                        <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3 inline" /> {formErrors.purchaseDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">Purchase Cost (₹) * (Must be &gt; 0)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        required
                        placeholder="e.g. 185000"
                        value={purchaseCost}
                        onChange={(e) => {
                          setPurchaseCost(e.target.value);
                          if (formErrors.purchaseCost) setFormErrors((p) => { const n = { ...p }; delete n.purchaseCost; return n; });
                        }}
                        className={`h-8 text-xs font-mono bg-background ${formErrors.purchaseCost ? 'border-destructive' : ''}`}
                      />
                      {formErrors.purchaseCost && (
                        <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3 inline" /> {formErrors.purchaseCost}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Vendor / Supplier</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Apple India / Reliance Digital"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">Invoice Number</Label>
                      <Input
                        type="text"
                        placeholder="e.g. INV-2026-8891"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">PO Number</Label>
                      <Input
                        type="text"
                        placeholder="e.g. PO-90812"
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B — Asset Identification */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                    <Tag className="h-3.5 w-3.5" /> Section B — Asset Identification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Serial Number (Must be unique)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSerial = generateUniqueSerial();
                            setSerialNumber(newSerial);
                            if (formErrors.serialNumber) setFormErrors((p) => { const n = { ...p }; delete n.serialNumber; return n; });
                          }}
                          className="h-5 text-[10px] px-1.5 py-0 gap-1 text-primary hover:bg-primary/10 font-semibold"
                          title="Generate fresh unique serial number"
                        >
                          <Sparkles className="h-3 w-3" /> Auto-Generate
                        </Button>
                      </div>
                      <Input
                        type="text"
                        placeholder="e.g. C02GL01XMD6N"
                        value={serialNumber}
                        onChange={(e) => {
                          setSerialNumber(e.target.value);
                          if (formErrors.serialNumber) setFormErrors((p) => { const n = { ...p }; delete n.serialNumber; return n; });
                        }}
                        className={`h-8 text-xs font-mono bg-background ${formErrors.serialNumber ? 'border-destructive' : ''}`}
                      />
                      {formErrors.serialNumber && (
                        <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3 inline" /> {formErrors.serialNumber}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">Manufacturer</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Apple / Dell / HP"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">Model Number</Label>
                      <Input
                        type="text"
                        placeholder="e.g. A2485 / Latitude 5440"
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Warranty Start Date</Label>
                      <Input
                        type="date"
                        value={warrantyStart}
                        onChange={(e) => setWarrantyStart(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">Warranty End Date (≥ Start Date)</Label>
                      <Input
                        type="date"
                        value={warrantyExpiry}
                        onChange={(e) => {
                          setWarrantyExpiry(e.target.value);
                          if (formErrors.warrantyExpiry) setFormErrors((p) => { const n = { ...p }; delete n.warrantyExpiry; return n; });
                        }}
                        className={`h-8 text-xs bg-background ${formErrors.warrantyExpiry ? 'border-destructive' : ''}`}
                      />
                      {formErrors.warrantyExpiry && (
                        <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3 inline" /> {formErrors.warrantyExpiry}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB 3 — STATUS & ADDITIONAL ── */}
              <TabsContent value="status" className="space-y-4 pt-3">
                {/* Section A — Status & Useful Life */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Section A — Lifecycle Status & Condition
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Asset Status *</Label>
                      <Select
                        value={status}
                        onValueChange={setStatus}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter((st) => {
                            if ((assignmentType === 'LOCATION' || assignmentType === 'DEPARTMENT') && st.value === 'ALLOCATED') {
                              return false;
                            }
                            return true;
                          }).map((st) => (
                            <SelectItem key={st.value} value={st.value} className="text-xs font-semibold">
                              {st.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold">Condition *</Label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select Condition" />
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
                    <div className="space-y-1">
                      <Label className="font-semibold">Useful Life</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="5"
                            value={usefulLifeYears}
                            onChange={(e) => setUsefulLifeYears(e.target.value)}
                            className="h-8 text-xs bg-background"
                          />
                          <span className="text-[11px] text-muted-foreground font-semibold">Years</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={11}
                            placeholder="0"
                            value={usefulLifeMonths}
                            onChange={(e) => setUsefulLifeMonths(e.target.value)}
                            className="h-8 text-xs bg-background"
                          />
                          <span className="text-[11px] text-muted-foreground font-semibold">Months</span>
                        </div>
                      </div>
                      {formErrors.usefulLifeYears && (
                        <p className="text-[10px] text-destructive font-semibold mt-0.5">
                          {formErrors.usefulLifeYears}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section B — Current Assignment Configuration */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Section B — Current Assignment Configuration
                    </h4>
                    <Badge variant="outline" className="text-[9.5px] py-0 px-1.5 font-mono">
                      {assignmentType === 'EMPLOYEE'
                        ? 'Employee Allocated'
                        : assignmentType === 'LOCATION'
                        ? 'Location Assigned'
                        : assignmentType === 'DEPARTMENT'
                        ? 'Department Assigned'
                        : 'In Stock / Spares'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-background/50 p-2.5 rounded-lg border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Assignment Type</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold mt-0.5 ${
                          assignmentType === 'EMPLOYEE'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            : assignmentType === 'LOCATION'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : assignmentType === 'DEPARTMENT'
                            ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                            : 'bg-slate-500/10 text-slate-600'
                        }`}
                      >
                        {assignmentType === 'LOCATION'
                          ? 'Location'
                          : assignmentType === 'EMPLOYEE'
                          ? 'Employee'
                          : assignmentType === 'DEPARTMENT'
                          ? 'Department'
                          : 'In Stock'}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Assigned To</span>
                      <span className="font-semibold text-foreground block truncate mt-0.5" title={currentAssignedTo}>
                        {currentAssignedTo}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Department</span>
                      <span className="font-semibold text-foreground block truncate mt-0.5" title={currentDeptName}>
                        {currentDeptName}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Physical Location</span>
                      <span className="font-semibold text-foreground block truncate mt-0.5" title={physicalLocation || 'Not specified'}>
                        {physicalLocation || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1">
                    <p className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 inline shrink-0 text-primary" />
                      {assignmentType === 'LOCATION'
                        ? 'Location asset: Fixed machinery operates at this facility and is separated from employee exit clearance.'
                        : assignmentType === 'DEPARTMENT'
                        ? 'Department asset: Shared departmental equipment operates within this department.'
                        : assignmentType === 'EMPLOYEE'
                        ? 'Employee asset: Allocated to personal custody and triggers return upon exit.'
                        : 'In Stock: Available for future assignment or transfer.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('basic')}
                      className="text-[10.5px] text-primary hover:underline font-semibold shrink-0"
                    >
                      Change Assignment ➔
                    </button>
                  </div>
                </div>

                {/* Section C — Additional Notes & Remarks */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                    <FileText className="h-3.5 w-3.5" /> Section C — Additional Notes & Remarks
                  </h4>

                  <div className="space-y-1">
                    <Label className="font-semibold">Remarks / Operational Notes</Label>
                    <Textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Enter additional technical details or compliance notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="text-xs min-h-[70px]"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* ── BOTTOM ACTIONS & WIZARD NAVIGATION ── */}
            <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                {activeFormTab !== 'basic' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setActiveFormTab(activeFormTab === 'status' ? 'purchase' : 'basic')}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                >
                  Cancel
                </Button>

                {isEditOpen ? (
                  <>
                    {activeFormTab !== 'status' && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs font-semibold gap-1"
                        onClick={activeFormTab === 'basic' ? handleNextFromTab1 : handleNextFromTab2}
                      >
                        Next Tab <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      className="text-xs font-semibold gap-1.5"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Update Asset
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {activeFormTab === 'basic' && (
                      <Button type="button" size="sm" className="text-xs font-semibold gap-1" onClick={handleNextFromTab1}>
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {activeFormTab === 'purchase' && (
                      <Button type="button" size="sm" className="text-xs font-semibold gap-1" onClick={handleNextFromTab2}>
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {activeFormTab === 'status' && (
                      <Button
                        type="submit"
                        size="sm"
                        className="text-xs font-semibold gap-1.5"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> REGISTER ASSET
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ASSET DETAIL VIEW MODAL ── */}
      {selectedAsset && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-bold">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> {selectedAsset.name}
                </span>
                <Badge className="font-mono text-xs">{selectedAsset.assetTag}</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Permanent Asset Master Record & Historical Lifecycle Logs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-xs pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Category</span>
                  <strong className="text-foreground font-semibold">{selectedAsset.category}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Company</span>
                  <strong className="text-foreground font-semibold">{selectedAsset.company?.name || 'Company'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Purchase Cost</span>
                  <strong className="text-primary font-mono font-bold">
                    {selectedAsset.value ? `₹${selectedAsset.value.toLocaleString('en-IN')}` : '-'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Status & Condition</span>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {selectedAsset.status} ({selectedAsset.condition || 'NEW'})
                  </Badge>
                </div>
              </div>

              {/* Identification Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Technical & Asset Identification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Serial Number:</span> <strong className="font-mono">{selectedAsset.serialNumber || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground">Manufacturer:</span> <strong>{selectedAsset.manufacturer || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground">Model Number:</span> <strong>{selectedAsset.modelNumber || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground">Vendor:</span> <strong>{selectedAsset.vendor || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground">Invoice No:</span> <strong className="font-mono">{selectedAsset.invoiceNumber || 'N/A'}</strong></div>
                  <div><span className="text-muted-foreground">PO Number:</span> <strong className="font-mono">{selectedAsset.poNumber || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Lifecycle History Timeline */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <History className="h-3.5 w-3.5 text-primary" /> Lifecycle & Allocation History Logs
                </h4>
                {selectedAsset.allocations && selectedAsset.allocations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAsset.allocations.map((al) => (
                      <div key={al.id} className="bg-muted/20 p-2.5 rounded-lg border border-border/50 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <strong className="text-foreground">{al.employee ? `${al.employee.firstName} ${al.employee.lastName} (${al.employee.employeeCode})` : 'Employee'}</strong>
                            <span className="text-muted-foreground block text-[10px]">
                              Allocated on: {new Date(al.allocatedAt).toLocaleDateString()} {al.returnedAt ? `| Returned on: ${new Date(al.returnedAt).toLocaleDateString()}` : '| Currently Active'}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9.5px]">
                          {al.returnedAt ? 'RETURNED' : 'ACTIVE ALLOCATION'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-[11px] py-2">
                    No employee allocation transactions recorded yet. Asset is currently in available stock.
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* ── COMPANY-CONFIGURABLE ASSET CATEGORIES MODAL ── */}
      <Dialog open={isCategoryConfigOpen} onOpenChange={setIsCategoryConfigOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Company Asset Category Configuration
            </DialogTitle>
            <div className="text-xs text-muted-foreground mt-1">
              Company: <strong className="text-foreground">{companies.find((c) => c.id === activeCompId)?.name || 'Active Entity'}</strong>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <Label className="font-semibold text-xs text-foreground block mb-2">
                1. Industry Sector Preset
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INDUSTRY_SECTOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-2.5 rounded-lg text-left border transition-all ${
                      pendingSector === preset.id
                        ? 'border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary/30'
                        : 'border-border/70 hover:border-border hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{preset.name}</span>
                      {pendingSector === preset.id && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1 line-clamp-1">
                      {preset.categories.slice(0, 3).join(', ')}...
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-xs text-foreground">
                  2. Configured Categories ({pendingCategories.length})
                </Label>
                <span className="text-[10px] text-muted-foreground">Click &times; to remove &middot; in-use categories can be deactivated</span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-muted/30 border border-border/60 min-h-[80px] max-h-[160px] overflow-y-auto">
                {pendingCategories.map((cat) => {
                  const inUseCount = assets.filter(
                    (a) => a.category && a.category.trim().toLowerCase() === cat.trim().toLowerCase()
                  ).length;
                  const isDeactivated = pendingDeactivated.includes(cat);

                  return (
                    <Badge
                      key={cat}
                      variant="outline"
                      className={`pl-2 pr-1.5 py-1 text-xs flex items-center gap-1.5 shadow-2xs transition-all ${
                        isDeactivated
                          ? 'bg-muted/60 text-muted-foreground border-dashed line-through opacity-70'
                          : inUseCount > 0
                          ? 'bg-primary/5 text-foreground border-primary/30 font-medium'
                          : 'bg-background text-foreground border-border/80'
                      }`}
                    >
                      <span>{cat}</span>
                      {inUseCount > 0 && (
                        <span
                          className="text-[9.5px] px-1 py-0 rounded bg-primary/10 text-primary font-mono font-semibold"
                          title={`${inUseCount} asset(s) currently registered under this category`}
                        >
                          {inUseCount} in use
                        </span>
                      )}
                      {isDeactivated ? (
                        <button
                          type="button"
                          onClick={() => handleToggleDeactivate(cat)}
                          className="h-4 px-1 rounded hover:bg-emerald-500/20 text-emerald-600 text-[10px] font-semibold flex items-center gap-0.5 ml-1"
                          title="Reactivate this category for new asset registrations"
                        >
                          Activate
                        </button>
                      ) : inUseCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleToggleDeactivate(cat)}
                          className="h-4 px-1 rounded hover:bg-amber-500/20 text-amber-700 text-[9.5px] font-medium flex items-center gap-0.5 ml-0.5"
                          title="Category is in use. Click to deactivate so existing assets stay valid, but new assets cannot use it."
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="h-3.5 w-3.5 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors ml-0.5"
                          title="Remove category"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="font-semibold text-xs text-foreground">
                3. Add Custom Category
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="e.g. Diagnostic Device, Lab Instrument, Safety Tool..."
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCategory();
                    }
                  }}
                  className="h-8 text-xs bg-background"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs px-3 shrink-0 font-semibold"
                  onClick={handleAddCustomCategory}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={handleResetToPreset}
                title="Restore standard categories for the selected sector preset"
              >
                <RotateCcw className="h-3 w-3" /> Reset to Preset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setIsCategoryConfigOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs font-semibold gap-1.5"
                onClick={handleSaveCategoryConfig}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Save Categories
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
