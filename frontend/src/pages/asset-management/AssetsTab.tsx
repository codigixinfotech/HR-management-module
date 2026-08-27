import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { companiesApi, branchesApi, departmentsApi } from '@/api/organization';
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

const ASSET_TYPES = ['Hardware', 'Software', 'Furniture', 'Vehicle', 'Equipment', 'Other'];

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  Hardware: [
    'Laptop / Workstation',
    'Desktop / All-in-One',
    'Server / Networking',
    'Mobile / Tablet',
    'Monitor / Display',
    'Peripheral / Accessory',
  ],
  Software: ['Software License', 'Cloud Subscription', 'Enterprise Application'],
  Furniture: ['Office Desk / Chair', 'Conference Table', 'Storage Cabinet', 'Office Fixture'],
  Vehicle: ['Corporate Car', 'Transport Truck', 'Two-Wheeler'],
  Equipment: ['Generator / UPS', 'Industrial Tool', 'Lab Equipment', 'Printing / Scanning Device'],
  Other: ['General Corporate Asset'],
};

const ALL_CATEGORIES = Array.from(new Set(Object.values(CATEGORIES_BY_TYPE).flat()));

const CONDITION_OPTIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED', 'UNDER_REPAIR', 'RETIRED'];

const STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'Available (In Stock)' },
  { value: 'ALLOCATED', label: 'Allocated' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'DISPOSED', label: 'Disposed' },
];

export function AssetsTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Modal Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // 3-Tab Wizard Navigation State
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'purchase' | 'status'>('basic');

  // Inline Form Field Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [targetCompanyId, setTargetCompanyId] = useState(companyId || '');
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('Hardware');
  const [category, setCategory] = useState('Laptop / Workstation');
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

  const [usefulLife, setUsefulLife] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Queries
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
  });

  const activeCompId = targetCompanyId || companyId || (companies[0]?.id ?? '');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', activeCompId],
    queryFn: () => branchesApi.list(activeCompId),
    enabled: !!activeCompId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeCompId],
    queryFn: () => departmentsApi.list(activeCompId),
    enabled: !!activeCompId,
  });

  // Handle Asset Type change -> update Category default
  const handleAssetTypeChange = (newType: string) => {
    setAssetType(newType);
    const availableCategories = CATEGORIES_BY_TYPE[newType] || ['General Corporate Asset'];
    setCategory(availableCategories[0]);
    if (formErrors.assetType || formErrors.category) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.assetType;
        delete next.category;
        return next;
      });
    }
  };

  // Handle Company change -> reset Branch & Department
  const handleCompanyChange = (newCompId: string) => {
    setTargetCompanyId(newCompId);
    setBranchId('');
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
    setTargetCompanyId(companyId || (companies[0]?.id ?? ''));
    setBranchId('');
    setDepartmentId('');
    setAssetTag('');
    setName('');
    setAssetType('Hardware');
    setCategory('Laptop / Workstation');
    setPhysicalLocation('');
    setNotes('');
    setPurchaseDate('');
    setPurchaseCost('');
    setVendor('');
    setInvoiceNumber('');
    setPoNumber('');
    setSerialNumber('');
    setManufacturer('');
    setModelNumber('');
    setWarrantyStart('');
    setWarrantyExpiry('');
    setStatus('IN_STOCK');
    setCondition('NEW');
    setUsefulLife('');
    setRemarks('');
    setPhotoUrl('');
  };

  const openAddDialog = () => {
    resetForm();
    setSerialNumber(generateUniqueSerial());
    setIsAddOpen(true);
  };

  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setActiveFormTab('basic');
    setFormErrors({});
    setTargetCompanyId(asset.companyId || companyId || (companies[0]?.id ?? ''));
    setBranchId(asset.branchId || '');
    setDepartmentId(asset.departmentId || '');
    setAssetTag(asset.assetTag || '');
    setName(asset.name || '');
    const loadedType = asset.assetType || 'Hardware';
    setAssetType(loadedType);
    setCategory(asset.category || (CATEGORIES_BY_TYPE[loadedType]?.[0] ?? 'Laptop / Workstation'));
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
    setStatus(asset.status || 'IN_STOCK');
    setCondition(asset.condition || 'NEW');
    setUsefulLife(asset.usefulLife || '');
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

    if (!assetType.trim()) {
      errors.assetType = 'Asset Type is required.';
    }
    if (!category.trim()) {
      errors.category = 'Asset Category is required.';
    }
    if (!activeCompId) {
      errors.companyId = 'Company / Entity is required.';
    }
    if (!branchId) {
      errors.branchId = 'Branch / Location is required.';
    } else if (branches.length > 0 && !branches.some((b) => b.id === branchId)) {
      errors.branchId = 'Selected branch does not belong to the selected company.';
    }

    if (departmentId && departments.length > 0 && !departments.some((d) => d.id === departmentId)) {
      errors.departmentId = 'Selected department does not belong to the selected company or branch.';
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
      delete next.assetType;
      delete next.category;
      delete next.companyId;
      delete next.branchId;
      delete next.departmentId;
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

    if ((assetType === 'Hardware' || assetType === 'Equipment') && !serialNumber.trim()) {
      errors.serialNumber = 'Serial Number is required for this asset type.';
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

    if (usefulLife.trim() && (isNaN(Number(usefulLife)) || Number(usefulLife) <= 0)) {
      errors.usefulLife = 'Useful Life must be greater than 0.';
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
      delete next.usefulLife;
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

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => assetsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset registered successfully.');
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to register asset'),
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => assetsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset Master updated successfully.');
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update asset master'),
  });

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTab1()) {
      setActiveFormTab('basic');
      return;
    }
    if (!validateTab2()) {
      setActiveFormTab('purchase');
      return;
    }
    if (!validateTab3()) {
      setActiveFormTab('status');
      return;
    }

    const payload = {
      companyId: activeCompId,
      branchId: branchId || undefined,
      departmentId: departmentId || undefined,
      assetTag: assetTag.trim() || undefined,
      name: name.trim(),
      category: category.trim(),
      assetType,
      physicalLocation: physicalLocation.trim() || undefined,
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
      status,
      condition,
      usefulLife: usefulLife.trim() || undefined,
      remarks: remarks.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
    };

    if (isEditOpen && selectedAsset) {
      updateMutation.mutate({ id: selectedAsset.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.manufacturer && a.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' ? true : a.category === selectedCategory;
      const matchesSts = selectedStatus === 'ALL' ? true : a.status === selectedStatus;
      const matchesCnd = selectedCondition === 'ALL' ? true : a.condition === selectedCondition;

      return matchesSearch && matchesCat && matchesSts && matchesCnd;
    });
  }, [assets, searchQuery, selectedCategory, selectedStatus, selectedCondition]);

  const isAllocatedInEdit = isEditOpen && selectedAsset?.status === 'ALLOCATED';

  return (
    <div className="space-y-6">
      {/* ── Asset Master Header & Actions ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Permanent Corporate Asset Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Single source of truth for registering hardware, equipment, software licenses & physical asset records
              </CardDescription>
            </div>

            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5" onClick={openAddDialog}>
              <Plus className="h-3.5 w-3.5" /> Register Asset
            </Button>
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {ALL_CATEGORIES.map((cat) => (
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
                  <SelectItem value="IN_STOCK">Available (In Stock)</SelectItem>
                  <SelectItem value="ALLOCATED">Allocated</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                  <SelectItem value="DISPOSED">Disposed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
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
                <TableHead className="text-xs">Branch & Department</TableHead>
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
                filteredAssets.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">{a.assetTag}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground block">{a.name}</span>
                      <span className="text-[10px] text-muted-foreground">{a.manufacturer || 'General'} {a.modelNumber ? `(${a.modelNumber})` : ''}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{a.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground block">{a.branch?.name || 'Main Branch'}</span>
                      <span className="text-[10px]">{a.department?.name || 'General Dept'}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-medium">{a.serialNumber || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {a.value !== null && a.value !== undefined ? `₹${a.value.toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        className={`text-[10px] font-semibold ${
                          a.status === 'ALLOCATED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : a.status === 'IN_STOCK' || a.status === 'AVAILABLE'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : a.status === 'UNDER_MAINTENANCE'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 border-slate-300'
                        }`}
                      >
                        {a.status.replace('_', ' ')}
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
                ))
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

          {isAllocatedInEdit && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-2.5 rounded-lg text-xs flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Allocated Asset Protection:</strong> This asset is currently allocated to an employee. Ownership, Location, and Status fields are read-only. Please use the Asset Allocation/Transfer module to reassign or return.
              </div>
            </div>
          )}

          <form onSubmit={handleSaveAsset} className="space-y-4 text-xs pt-2">
            <Tabs value={activeFormTab} onValueChange={(val: any) => setActiveFormTab(val)} className="w-full">
              <TabsList className="grid grid-cols-3 h-9 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="basic" className="text-xs font-semibold gap-1.5">
                  <Info className="h-3.5 w-3.5" /> 1. Basic Info
                  {(formErrors.name || formErrors.assetType || formErrors.category || formErrors.companyId || formErrors.branchId) && (
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
                    <Label className="font-semibold">Asset Type *</Label>
                    <Select value={assetType} onValueChange={handleAssetTypeChange}>
                      <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.assetType ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs font-semibold">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.assetType && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.assetType}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Asset Name *</Label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. MacBook Pro 16 M3 Max / Dell Latitude 5440"
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

                  <div className="space-y-1">
                    <Label className="font-semibold">Asset Category * (Filtered by Type)</Label>
                    <Select value={category} onValueChange={(val) => {
                      setCategory(val);
                      if (formErrors.category) setFormErrors((p) => { const n = { ...p }; delete n.category; return n; });
                    }}>
                      <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.category ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(CATEGORIES_BY_TYPE[assetType] || ALL_CATEGORIES).map((cat) => (
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
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Company / Entity Context *</Label>
                  <Select value={targetCompanyId} onValueChange={handleCompanyChange}>
                    <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.companyId ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Branch / Location *</Label>
                    <Select
                      value={branchId}
                      onValueChange={(val) => {
                        setBranchId(val);
                        if (formErrors.branchId) setFormErrors((p) => { const n = { ...p }; delete n.branchId; return n; });
                      }}
                      disabled={isAllocatedInEdit}
                    >
                      <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.branchId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
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
                    <Label className="font-semibold">Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId} disabled={isAllocatedInEdit}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">
                            {d.name} ({d.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Physical Location / Desk / Room</Label>
                  <Input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Server Room A, Floor 3 Desk 42, Pune HQ"
                    value={physicalLocation}
                    onChange={(e) => setPhysicalLocation(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
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
                {/* Section A — Status */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Section A — Lifecycle Status & Condition
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Asset Status *</Label>
                      <Select value={status} onValueChange={setStatus} disabled={isAllocatedInEdit}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((st) => (
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
                      <Label className="font-semibold">Useful Life (Years/Months)</Label>
                      <Input
                        type="text"
                        placeholder="e.g. 3 Years / 36 Months"
                        value={usefulLife}
                        onChange={(e) => setUsefulLife(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B — Additional */}
                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                    <FileText className="h-3.5 w-3.5" /> Section B — Additional Notes & Attachments
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {isEditOpen ? 'Save Changes' : 'SAVE ASSET'}
                  </Button>
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
                  <Tag className="h-3.5 w-3.5 text-primary" /> Technical & Hardware Identification
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
    </div>
  );
}
