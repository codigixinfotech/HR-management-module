import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Users,
  Search,
  Grid,
  List,
  CheckCircle2,
  Award,
  Building2,
  Calendar,
  Lock,
  GitFork,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { companiesApi, branchesApi, departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { costCentersApi, payGradesApi, type CostCenter, type PayGrade } from '@/api/cost-grades';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser } from '@/lib/modules';

import { useCompany } from '@/context/CompanyContext';

export function CostCentersTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;
  const queryClient = useQueryClient();
  const [searchCcQuery, setSearchCcQuery] = useState('');
  const [searchGradeQuery, setSearchGradeQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // ── User scope detection ──
  const authUser = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(authUser);
  // A Branch Admin is anyone with a branchId that is not a super admin
  const isBranchAdmin = !isSuperAdmin && Boolean(authUser?.branchId || authUser?.employee?.branchId);
  const userBranchId = authUser?.branchId || authUser?.employee?.branchId || undefined;
  const userCompanyId = authUser?.companyId || undefined;
  const userCompanyName = authUser?.companyName || undefined;

  // ── Real API queries ──
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const companyIdForLists = (activeCompanyId || companies?.[0]?.id) ?? '';

  const { data: employees } = useQuery({ queryKey: ['employees', companyIdForLists], queryFn: () => employeesApi.list({ page: 1, pageSize: 500, companyId: companyIdForLists }) });

  const { data: branches } = useQuery({
    queryKey: ['branches', companyIdForLists],
    queryFn: () => branchesApi.list(companyIdForLists),
    enabled: !!companyIdForLists,
  });
  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches-all'],
    queryFn: () => branchesApi.list(),
  });

  const userBranchName =
    authUser?.branchName ||
    authUser?.employee?.branchName ||
    allBranches?.find((b: any) => b.id === userBranchId)?.name ||
    branches?.find((b: any) => b.id === userBranchId)?.name ||
    'Branch';

  // ── Departments — scoped by branch for Branch Admins ──
  const { data: departments } = useQuery({
    queryKey: ['departments', companyIdForLists, userBranchId],
    queryFn: () => departmentsApi.list(companyIdForLists, isBranchAdmin ? userBranchId : undefined),
    enabled: !!companyIdForLists,
  });

  const validBranches = useMemo(() => {
    const list = allBranches.length > 0 ? allBranches : (branches || []);
    return list.filter((b: any) => {
      if (!companyIdForLists || b.companyId === companyIdForLists) {
        const bName = (b.name || '').trim().toLowerCase();
        if (
          bName === 'parent office/company' ||
          bName === 'parent company' ||
          bName === 'parent office' ||
          bName === 'head office / company' ||
          bName === 'cravita technology pvt ltd'
        ) return false;
        return true;
      }
      return false;
    });
  }, [allBranches, branches, companyIdForLists]);

  const [selectedGradeBranchFilter, setSelectedGradeBranchFilter] = useState<string>(() => {
    return isBranchAdmin && userBranchId ? userBranchId : 'ALL';
  });

  useEffect(() => {
    if (isBranchAdmin && userBranchId && userBranchId !== selectedGradeBranchFilter) {
      setSelectedGradeBranchFilter(userBranchId);
    }
  }, [isBranchAdmin, userBranchId, selectedGradeBranchFilter]);

  const effectiveGradeBranchForQuery = isBranchAdmin && userBranchId
    ? userBranchId
    : (selectedGradeBranchFilter !== 'ALL' ? selectedGradeBranchFilter : undefined);

  // Real cost centers and pay grades from DB
  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers', companyIdForLists],
    queryFn: () => costCentersApi.list(companyIdForLists),
    enabled: !!companyIdForLists,
  });
  const { data: payGrades = [] } = useQuery({
    queryKey: ['pay-grades', companyIdForLists, effectiveGradeBranchForQuery],
    queryFn: () => payGradesApi.list(companyIdForLists, effectiveGradeBranchForQuery),
    enabled: !!companyIdForLists,
  });

  // ── Mutations ──
  const ccUpsertMutation = useMutation({
    mutationFn: (payload: { id?: string; data: Partial<CostCenter> }) =>
      payload.id ? costCentersApi.update(payload.id, payload.data) : costCentersApi.create(payload.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success(vars.id ? 'Cost Center updated' : 'Cost Center created');
      setIsCcOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save Cost Center'),
  });

  const ccDeleteMutation = useMutation({
    mutationFn: (id: string) => costCentersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Cost Center deleted permanently');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete Cost Center'),
  });

  const gradeUpsertMutation = useMutation({
    mutationFn: (payload: { id?: string; data: Partial<PayGrade> }) =>
      payload.id ? payGradesApi.update(payload.id, payload.data) : payGradesApi.create(payload.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pay-grades'] });
      toast.success(vars.id ? 'Pay Grade updated' : 'Pay Grade created');
      setIsGradeOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save Pay Grade'),
  });

  const gradeDeleteMutation = useMutation({
    mutationFn: (id: string) => payGradesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-grades'] });
      toast.success('Pay Grade deleted permanently');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete Pay Grade'),
  });

  // Headcount calculation dynamically mapped from real Employee Master list
  const headcountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!employees?.items) return counts;
    employees.items.forEach((emp: any) => {
      if (emp.costCenter) {
        counts[emp.costCenter] = (counts[emp.costCenter] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  // Employee count matching job grades dynamically
  const gradeCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!employees?.items) return counts;
    employees.items.forEach((emp: any) => {
      if (emp.grade) {
        counts[emp.grade] = (counts[emp.grade] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  // Cost Center Dialog Form State
  const [isCcOpen, setIsCcOpen] = useState(false);
  const [editingCc, setEditingCc] = useState<CostCenter | null>(null);

  const [ccCompanyId, setCcCompanyId] = useState('');
  const [ccCode, setCcCode] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccType, setCcType] = useState('Department');
  const [ccDeptId, setCcDeptId] = useState('');
  const [ccBranchId, setCcBranchId] = useState('');
  const [ccManagerId, setCcManagerId] = useState('');
  const [ccManagerName, setCcManagerName] = useState('');
  const [ccBudgetValue, setCcBudgetValue] = useState<string | number>(25);
  const [ccBudgetUnit, setCcBudgetUnit] = useState<'Lakh' | 'Crore'>('Lakh');
  const [ccCapacity, setCcCapacity] = useState(15);
  const [ccEffectiveFrom, setCcEffectiveFrom] = useState('');
  const [ccStatus, setCcStatus] = useState<'Active' | 'Inactive'>('Active');
  const [ccDescription, setCcDescription] = useState('');

  const targetCcCompanyId = ccCompanyId || companyIdForLists;
  const selectedCompForCc = useMemo(() => {
    return companies?.find((c: any) => c.id === targetCcCompanyId);
  }, [companies, targetCcCompanyId]);

  const filteredBranchesForCc = useMemo(() => {
    if (!targetCcCompanyId) return [];
    const sourceBranches = allBranches.length > 0 ? allBranches : (branches || []);
    return sourceBranches.filter((b: any) => {
      // Must belong strictly to this company
      if (!b.companyId || b.companyId !== targetCcCompanyId) return false;
      const bName = (b.name || '').trim().toLowerCase();
      if (selectedCompForCc) {
        const cName = (selectedCompForCc.name || '').trim().toLowerCase();
        const cCode = (selectedCompForCc.code || '').trim().toLowerCase();
        // Do NOT show company name or code as branch
        if (bName === cName || bName === cCode) return false;
      }
      // Exclude generic fake company/parent office branch entries
      if (
        bName === 'parent office/company' ||
        bName === 'parent company' ||
        bName === 'parent office' ||
        bName === 'head office / company' ||
        bName === 'cravita technology pvt ltd'
      ) {
        return false;
      }
      return true;
    });
  }, [allBranches, branches, targetCcCompanyId, selectedCompForCc]);

  // Grade Dialog Form State
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<PayGrade | null>(null);

  const [gradeCompanyId, setGradeCompanyId] = useState('');
  const [gradeBranchId, setGradeBranchId] = useState('');
  const [gradeBusinessUnit, setGradeBusinessUnit] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [gradeName, setGradeName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('L1');
  const [gradeCategory, setGradeCategory] = useState('Professional');
  const [gradeDepartmentId, setGradeDepartmentId] = useState('');
  const [gradeSalaryMode, setGradeSalaryMode] = useState<'monthly' | 'annual'>('monthly');

  const targetGradeCompanyId = gradeCompanyId || companyIdForLists;
  const filteredBranchesForGrade = useMemo(() => {
    if (!targetGradeCompanyId) return [];
    const sourceBranches = allBranches.length > 0 ? allBranches : (branches || []);
    return sourceBranches.filter((b: any) => {
      if (!b.companyId || b.companyId !== targetGradeCompanyId) return false;
      const bName = (b.name || '').trim().toLowerCase();
      if (
        bName === 'parent office/company' ||
        bName === 'parent company' ||
        bName === 'parent office' ||
        bName === 'head office / company' ||
        bName === 'cravita technology pvt ltd'
      ) {
        return false;
      }
      return true;
    });
  }, [allBranches, branches, targetGradeCompanyId]);

  // Monthly Values
  const [gradeMinSalary, setGradeMinSalary] = useState<number | string>(20000);
  const [gradeMaxSalary, setGradeMaxSalary] = useState<number | string>(27000);

  // Annual Values & Units
  type SalaryUnit = '₹' | 'Thousand' | 'Lakh' | 'Crore';
  const [gradeMinAnnualVal, setGradeMinAnnualVal] = useState<number | string>(2.40);
  const [gradeMinAnnualUnit, setGradeMinAnnualUnit] = useState<SalaryUnit>('Lakh');
  const [gradeMaxAnnualVal, setGradeMaxAnnualVal] = useState<number | string>(3.24);
  const [gradeMaxAnnualUnit, setGradeMaxAnnualUnit] = useState<SalaryUnit>('Lakh');

  const [gradeCurrency, setGradeCurrency] = useState('INR');
  const [gradeEffectiveFrom, setGradeEffectiveFrom] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'Active' | 'Inactive'>('Active');
  const [gradeDescription, setGradeDescription] = useState('');

  // Currency Formatter (displays in ₹ Crore or ₹ Lakh)
  const formatCurrency = (val: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) {
      const cr = val / 10000000;
      const formatted = cr % 1 === 0 ? cr.toString() : cr.toFixed(2).replace(/\.?0+$/, '');
      return `₹${formatted} Crore`;
    }
    if (val >= 100000) {
      const lakh = val / 100000;
      const formatted = lakh % 1 === 0 ? lakh.toString() : lakh.toFixed(2).replace(/\.?0+$/, '');
      return `₹${formatted} Lakh`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Salary scale formatting (e.g. ₹25K–₹40K)
  const formatSalaryRange = (min: number, max: number) => {
    const formatK = (val: number) => {
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(2).replace(/\.?0+$/, '')}L`;
      }
      if (val >= 1000) {
        return `₹${(val / 1000).toFixed(0)}K`;
      }
      return `₹${val}`;
    };
    return `${formatK(min)}–${formatK(max)}`;
  };

  // Annual CTC Formatter (e.g. ₹2.40 Lakh, ₹1.50 Crore)
  const formatCtc = (annualAmount: number) => {
    if (!annualAmount || isNaN(annualAmount)) return '₹0.00';
    if (annualAmount >= 10000000) {
      const cr = annualAmount / 10000000;
      return `₹${cr.toFixed(2)} Crore`;
    }
    if (annualAmount >= 100000) {
      const lakh = annualAmount / 100000;
      return `₹${lakh.toFixed(2)} Lakh`;
    }
    return `₹${annualAmount.toLocaleString('en-IN')}`;
  };

  const getSalaryUnitMultiplier = (u: '₹' | 'Thousand' | 'Lakh' | 'Crore') => {
    switch (u) {
      case 'Thousand': return 1000;
      case 'Lakh': return 100000;
      case 'Crore': return 10000000;
      default: return 1;
    }
  };

  // Cross-sync helper handlers
  const handleMinMonthlyChange = (val: string) => {
    setGradeMinSalary(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      const annualInr = num * 12;
      if (annualInr >= 10000000) {
        setGradeMinAnnualUnit('Crore');
        setGradeMinAnnualVal(Number((annualInr / 10000000).toFixed(2)));
      } else if (annualInr >= 100000) {
        setGradeMinAnnualUnit('Lakh');
        setGradeMinAnnualVal(Number((annualInr / 100000).toFixed(2)));
      } else if (annualInr >= 1000) {
        setGradeMinAnnualUnit('Thousand');
        setGradeMinAnnualVal(Number((annualInr / 1000).toFixed(2)));
      } else {
        setGradeMinAnnualUnit('₹');
        setGradeMinAnnualVal(annualInr);
      }
    }
  };

  const handleMaxMonthlyChange = (val: string) => {
    setGradeMaxSalary(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      const annualInr = num * 12;
      if (annualInr >= 10000000) {
        setGradeMaxAnnualUnit('Crore');
        setGradeMaxAnnualVal(Number((annualInr / 10000000).toFixed(2)));
      } else if (annualInr >= 100000) {
        setGradeMaxAnnualUnit('Lakh');
        setGradeMaxAnnualVal(Number((annualInr / 100000).toFixed(2)));
      } else if (annualInr >= 1000) {
        setGradeMaxAnnualUnit('Thousand');
        setGradeMaxAnnualVal(Number((annualInr / 1000).toFixed(2)));
      } else {
        setGradeMaxAnnualUnit('₹');
        setGradeMaxAnnualVal(annualInr);
      }
    }
  };

  const handleMinAnnualChange = (val: string, unit = gradeMinAnnualUnit) => {
    setGradeMinAnnualVal(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      const mult = getSalaryUnitMultiplier(unit);
      const annualInr = num * mult;
      setGradeMinSalary(Math.round(annualInr / 12));
    }
  };

  const handleMinAnnualUnitChange = (unit: '₹' | 'Thousand' | 'Lakh' | 'Crore') => {
    setGradeMinAnnualUnit(unit);
    const num = Number(gradeMinAnnualVal);
    if (!isNaN(num) && num > 0) {
      const mult = getSalaryUnitMultiplier(unit);
      const annualInr = num * mult;
      setGradeMinSalary(Math.round(annualInr / 12));
    }
  };

  const handleMaxAnnualChange = (val: string, unit = gradeMaxAnnualUnit) => {
    setGradeMaxAnnualVal(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      const mult = getSalaryUnitMultiplier(unit);
      const annualInr = num * mult;
      setGradeMaxSalary(Math.round(annualInr / 12));
    }
  };

  const handleMaxAnnualUnitChange = (unit: '₹' | 'Thousand' | 'Lakh' | 'Crore') => {
    setGradeMaxAnnualUnit(unit);
    const num = Number(gradeMaxAnnualVal);
    if (!isNaN(num) && num > 0) {
      const mult = getSalaryUnitMultiplier(unit);
      const annualInr = num * mult;
      setGradeMaxSalary(Math.round(annualInr / 12));
    }
  };

  // Fetch all cost centers across companies for global code uniqueness
  const { data: allCostCentersForCodes = [] } = useQuery({
    queryKey: ['cost-centers-all-codes'],
    queryFn: () => costCentersApi.list(),
  });

  const generateUniqueCcCode = () => {
    const existingCodes = new Set(allCostCentersForCodes.map((cc) => cc.code));
    let count = allCostCentersForCodes.length + 101;
    let code = `CC-${count}`;
    while (existingCodes.has(code)) {
      count++;
      code = `CC-${count}`;
    }
    return code;
  };

  const fetchAndSetNextGradeCode = async (branchId?: string, companyId?: string) => {
    try {
      const res = await payGradesApi.getNextCode(branchId, companyId);
      if (res?.nextCode) {
        setGradeCode(res.nextCode);
        return res.nextCode;
      }
    } catch (e) {
      console.error('Failed to fetch next grade code from API', e);
    }

    // Client-side fallback if backend call fails
    const targetBranch = (allBranches.length > 0 ? allBranches : (branches || [])).find(
      (b: any) => b.id === branchId
    );
    let branchCode = 'BR';
    if (targetBranch?.code) {
      const raw = targetBranch.code.trim();
      const brMatch = raw.match(/^BR-?0*([0-9]+)$/i);
      const brNumMatch = raw.match(/^Br0*([0-9]+)$/i);
      if (brMatch) branchCode = `Br${brMatch[1]}`;
      else if (brNumMatch) branchCode = `Br${brNumMatch[1]}`;
      else if (/^BR-/i.test(raw)) branchCode = raw.replace(/^BR-/i, 'Br').replace(/[^a-zA-Z0-9]/g, '');
      else branchCode = raw.replace(/[^a-zA-Z0-9]/g, '') || 'BR';
    }
    const prefix = `GR-${branchCode}-`;
    const seqRegex = new RegExp(`^GR-${branchCode}-(\\d+)$`, 'i');
    const existing = payGrades
      .filter((g: any) => g.branchId === branchId || (g.gradeCode && g.gradeCode.startsWith(prefix)))
      .map((g: any) => {
        const m = (g.gradeCode || '').match(seqRegex);
        return m ? parseInt(m[1], 10) : 0;
      });
    const maxSeq = existing.length > 0 ? Math.max(...existing) : 0;
    const fallbackCode = `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
    setGradeCode(fallbackCode);
    return fallbackCode;
  };

  // Auto-generate branch-isolated Grade Code if empty when modal opens or in create mode
  useEffect(() => {
    if (isGradeOpen && !editingGrade) {
      const effectiveBranchId = isBranchAdmin && userBranchId ? userBranchId : gradeBranchId;
      const effectiveCompId = gradeCompanyId || companyIdForLists;
      if (!gradeCode || /^GR-\d+$/i.test(gradeCode.trim())) {
        fetchAndSetNextGradeCode(effectiveBranchId, effectiveCompId);
      }
    }
  }, [isGradeOpen, editingGrade, gradeBranchId, gradeCompanyId, isBranchAdmin, userBranchId]);

  // Cost Center Actions
  const openAddCc = () => {
    setEditingCc(null);
    setCcCompanyId(companyIdForLists);
    setCcCode(generateUniqueCcCode());
    setCcName('');
    setCcType('Department');
    setCcDeptId(departments?.[0]?.id ?? '');
    setCcBranchId(isBranchAdmin && userBranchId ? userBranchId : '');
    setCcManagerId('');
    setCcManagerName('');
    setCcBudgetValue(25);
    setCcBudgetUnit('Lakh');
    setCcCapacity(15);
    setCcEffectiveFrom(new Date().toISOString().split('T')[0]);
    setCcStatus('Active');
    setCcDescription('');
    setIsCcOpen(true);
  };

  const openEditCc = (item: CostCenter) => {
    setEditingCc(item);
    setCcCompanyId(item.companyId);
    setCcCode(item.code);
    setCcName(item.name);
    setCcType(item.type);
    setCcDeptId(item.departmentId ?? '');
    setCcBranchId(item.branchId ?? '');
    setCcManagerId(item.managerId ?? '');
    setCcManagerName(item.managerName ?? '');

    const rawBudget = Number(item.budget) || 0;
    if (rawBudget >= 10000000) {
      setCcBudgetUnit('Crore');
      setCcBudgetValue(Number((rawBudget / 10000000).toFixed(2)));
    } else {
      setCcBudgetUnit('Lakh');
      setCcBudgetValue(Number((rawBudget / 100000).toFixed(2)));
    }

    setCcCapacity(item.headcountCapacity);
    setCcEffectiveFrom(item.effectiveFrom?.split('T')[0] ?? '');
    setCcStatus(item.isActive ? 'Active' : 'Inactive');
    setCcDescription(item.description ?? '');
    setIsCcOpen(true);
  };

  const handleSaveCc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccName) { toast.error('Cost Center Name is required'); return; }
    const managerEmployee = employees?.items?.find((emp: any) => emp.id === ccManagerId);
    
    const multiplier = ccBudgetUnit === 'Crore' ? 10000000 : 100000;
    const computedBudgetInr = Math.round((Number(ccBudgetValue) || 0) * multiplier);

    const payloadData: any = {
      name:              ccName,
      type:              ccType,
      branchId:          ccBranchId || undefined,
      departmentId:      ccDeptId || undefined,
      managerId:         ccManagerId || undefined,
      managerName:       managerEmployee ? `${managerEmployee.firstName} ${managerEmployee.lastName}` : ccManagerName || undefined,
      budget:            computedBudgetInr,
      headcountCapacity: Number(ccCapacity),
      effectiveFrom:     ccEffectiveFrom || new Date().toISOString().split('T')[0],
      description:       ccDescription,
      isActive:          ccStatus === 'Active',
    };

    if (!editingCc?.id) {
      payloadData.companyId = isBranchAdmin ? (userCompanyId || ccCompanyId || companyIdForLists) : (ccCompanyId || companyIdForLists);
      payloadData.code = ccCode || generateUniqueCcCode();
      // Branch Admin: always include their branch in the cost center
      if (isBranchAdmin && userBranchId) {
        payloadData.branchId = userBranchId;
      }
    }

    ccUpsertMutation.mutate({
      id: editingCc?.id,
      data: payloadData,
    });
  };

  const handleDeleteCc = (id: string) => {
    if (window.confirm('Permanently delete this Cost Center?')) {
      ccDeleteMutation.mutate(id);
    }
  };

  // Grade Actions
  const openAddGrade = async () => {
    setEditingGrade(null);
    const targetCompId = isBranchAdmin ? (userCompanyId || companyIdForLists) : companyIdForLists;
    const initialBranchId = isBranchAdmin && userBranchId
      ? userBranchId
      : (selectedGradeBranchFilter !== 'ALL' && selectedGradeBranchFilter !== 'HEAD_OFFICE'
          ? selectedGradeBranchFilter
          : (selectedGradeBranchFilter === 'HEAD_OFFICE' ? '' : (filteredBranchesForGrade?.[0]?.id || '')));

    setGradeCompanyId(targetCompId);
    setGradeBranchId(initialBranchId);
    setGradeBusinessUnit(companies?.find((c: any) => c.id === targetCompId)?.businessUnit ?? '');
    setGradeCode('');
    setGradeName('');
    setGradeLevel('L1');
    setGradeCategory('Worker');
    setGradeDepartmentId(departments?.[0]?.id ?? '');
    setGradeSalaryMode('monthly');
    setGradeMinSalary(20000);
    setGradeMaxSalary(27000);
    setGradeMinAnnualVal(2.40);
    setGradeMinAnnualUnit('Lakh');
    setGradeMaxAnnualVal(3.24);
    setGradeMaxAnnualUnit('Lakh');
    setGradeCurrency(companies?.find((c: any) => c.id === targetCompId)?.currency ?? 'INR');
    setGradeEffectiveFrom(new Date().toISOString().split('T')[0]);
    setGradeStatus('Active');
    setGradeDescription('');
    setIsGradeOpen(true);

    fetchAndSetNextGradeCode(initialBranchId, targetCompId);
  };

  const openEditGrade = (item: PayGrade) => {
    setEditingGrade(item);
    setGradeCompanyId(item.companyId);
    setGradeBranchId(item.branchId || (isBranchAdmin ? (userBranchId || '') : ''));
    setGradeBusinessUnit(item.businessUnit ?? '');
    setGradeCode(item.gradeCode);
    setGradeName(item.gradeName);
    setGradeLevel(item.level);
    setGradeCategory(item.category ?? 'Professional');
    setGradeDepartmentId(item.departmentId ?? '');
    setGradeSalaryMode('monthly');

    const rawMin = Number(item.minSalary) || 0;
    const rawMax = Number(item.maxSalary) || 0;
    const monthlyMin = rawMin >= 500000 ? Math.round(rawMin / 12) : rawMin;
    const monthlyMax = rawMax >= 500000 ? Math.round(rawMax / 12) : rawMax;

    setGradeMinSalary(monthlyMin);
    setGradeMaxSalary(monthlyMax);

    const annualMin = monthlyMin * 12;
    const annualMax = monthlyMax * 12;

    if (annualMin >= 10000000) {
      setGradeMinAnnualUnit('Crore');
      setGradeMinAnnualVal(Number((annualMin / 10000000).toFixed(2)));
    } else if (annualMin >= 100000) {
      setGradeMinAnnualUnit('Lakh');
      setGradeMinAnnualVal(Number((annualMin / 100000).toFixed(2)));
    } else if (annualMin >= 1000) {
      setGradeMinAnnualUnit('Thousand');
      setGradeMinAnnualVal(Number((annualMin / 1000).toFixed(2)));
    } else {
      setGradeMinAnnualUnit('₹');
      setGradeMinAnnualVal(annualMin);
    }

    if (annualMax >= 10000000) {
      setGradeMaxAnnualUnit('Crore');
      setGradeMaxAnnualVal(Number((annualMax / 10000000).toFixed(2)));
    } else if (annualMax >= 100000) {
      setGradeMaxAnnualUnit('Lakh');
      setGradeMaxAnnualVal(Number((annualMax / 100000).toFixed(2)));
    } else if (annualMax >= 1000) {
      setGradeMaxAnnualUnit('Thousand');
      setGradeMaxAnnualVal(Number((annualMax / 1000).toFixed(2)));
    } else {
      setGradeMaxAnnualUnit('₹');
      setGradeMaxAnnualVal(annualMax);
    }

    setGradeCurrency(item.currency ?? 'INR');
    setGradeEffectiveFrom(item.effectiveFrom?.split('T')[0] ?? '');
    setGradeStatus(item.isActive ? 'Active' : 'Inactive');
    setGradeDescription(item.description ?? '');
    setIsGradeOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeCode || !gradeName) { toast.error('Grade Code and Grade Name are required'); return; }
    
    // Automatically match L1/E2 etc. if E2 is L2, otherwise maintain consistency
    let finalLevel = gradeLevel;
    if (gradeCode.toUpperCase().startsWith('E2') && gradeLevel === 'L1') {
      finalLevel = 'L2';
    }

    const payloadData: any = {
      businessUnit:  gradeBusinessUnit || undefined,
      gradeName,
      level:         finalLevel,
      category:      gradeCategory,
      departmentId:  gradeDepartmentId && gradeDepartmentId !== '__none__' ? gradeDepartmentId : undefined,
      minSalary:     Number(gradeMinSalary),
      maxSalary:     Number(gradeMaxSalary),
      currency:      gradeCurrency,
      effectiveFrom: gradeEffectiveFrom || new Date().toISOString().split('T')[0],
      description:   gradeDescription,
      isActive:      gradeStatus === 'Active',
    };

    const effectiveBranchId = isBranchAdmin ? (userBranchId || gradeBranchId) : (gradeBranchId || undefined);
    if (!editingGrade?.id) {
      // Branch Admin: always use their own company + branch (backend enforces too)
      payloadData.companyId = isBranchAdmin ? (userCompanyId || gradeCompanyId) : gradeCompanyId;
      payloadData.gradeCode = gradeCode;
      if (effectiveBranchId) {
        payloadData.branchId = effectiveBranchId;
      }
    } else {
      payloadData.branchId = effectiveBranchId || null;
    }

    gradeUpsertMutation.mutate({
      id: editingGrade?.id,
      data: payloadData,
    });
  };

  const handleDeleteGrade = (id: string) => {
    if (window.confirm('Permanently delete this Pay Grade?')) {
      gradeDeleteMutation.mutate(id);
    }
  };

  // Search/Filter calculations
  const filteredCostCenters = useMemo(() => {
    if (!searchCcQuery.trim()) return costCenters;
    const q = searchCcQuery.toLowerCase();
    return costCenters.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    );
  }, [costCenters, searchCcQuery]);

  const filteredPayGrades = useMemo(() => {
    let list = payGrades;

    if (selectedGradeBranchFilter === 'HEAD_OFFICE') {
      list = list.filter(g => !g.branchId);
    } else if (selectedGradeBranchFilter !== 'ALL') {
      list = list.filter(g => g.branchId === selectedGradeBranchFilter || g.branch?.id === selectedGradeBranchFilter);
    }

    if (!searchGradeQuery.trim()) return list;
    const q = searchGradeQuery.toLowerCase();
    return list.filter(
      g =>
        g.gradeName.toLowerCase().includes(q) ||
        g.gradeCode.toLowerCase().includes(q) ||
        g.level.toLowerCase().includes(q) ||
        (g.jobFamily?.toLowerCase() ?? '').includes(q) ||
        (g.category?.toLowerCase() ?? '').includes(q) ||
        (g.branch?.name?.toLowerCase() ?? '').includes(q) ||
        (branches?.find((b: any) => b.id === g.branchId)?.name?.toLowerCase() ?? '').includes(q) ||
        (!g.branchId && ('head office'.includes(q) || 'no branch'.includes(q)))
    );
  }, [payGrades, selectedGradeBranchFilter, searchGradeQuery, branches]);

  // Dashboard Stats Calculations
  const totalBudget = useMemo(() => {
    return costCenters.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  }, [costCenters]);

  const formattedTotalBudget = useMemo(() => {
    return formatCurrency(totalBudget);
  }, [totalBudget]);

  return (
    <div className="space-y-6">
      {/* ── Top Performance & Financial KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Cost Centers</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{costCenters.length} Accounts</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Fully Allocated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Budget</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{formattedTotalBudget}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Approved & Verified</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Grade Bands</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{payGrades.length} Tiers</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">E1 - L4 Levels Configured</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Budget Variance</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">-2.8%</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Under Operating Budget</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 1. Cost Centers Management Panel ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Financial Cost Centers
              </CardTitle>
              <CardDescription className="text-xs">
                Allocate departmental budgets, cost center managers, headcount limits and financial accountability
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter cost centers..."
                  value={searchCcQuery}
                  onChange={e => setSearchCcQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Cost Center Dialog */}
              <Dialog open={isCcOpen} onOpenChange={setIsCcOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddCc}>
                    <Plus className="h-3.5 w-3.5" /> Add Cost Center
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCc ? 'Edit Cost Center' : 'Create New Cost Center'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 text-xs" onSubmit={handleSaveCc}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold flex items-center gap-1">
                          {isBranchAdmin ? 'Organization & Branch *' : 'Organization Entity *'}
                          {isBranchAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        {isBranchAdmin ? (
                          <div className="min-h-9 px-3 py-1.5 rounded-md border border-dashed border-border bg-muted/30 text-xs font-medium text-foreground flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-semibold text-foreground truncate">{userBranchName}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate pl-5">
                                {userCompanyName || companies?.find((c: any) => c.id === userCompanyId)?.name || 'Your Company'}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">Branch Locked</Badge>
                          </div>
                        ) : (
                          <Select value={ccCompanyId} onValueChange={(val) => {
                            setCcCompanyId(val);
                            setCcBranchId('');
                          }}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>


                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Cost Center Code (Auto Generated) *</Label>
                        <Input
                          placeholder=""
                          value={ccCode}
                          onChange={e => setCcCode(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Cost Center Name *</Label>
                      <Input
                        placeholder=""
                        value={ccName}
                        onChange={e => setCcName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Mapped Department *</Label>
                        <Select value={ccDeptId} onValueChange={setCcDeptId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments
                              ?.filter((d: any) => !targetCcCompanyId || !d.companyId || d.companyId === targetCcCompanyId)
                              .map((d: any) => (
                                <SelectItem key={d.id} value={d.id} className="text-xs">
                                  {d.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            Branch / Location
                            {isBranchAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                            {!isBranchAdmin && filteredBranchesForCc.length > 0 && (
                              <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                            )}
                          </span>
                        </Label>
                        {isBranchAdmin ? (
                          <div className="h-9 px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 text-xs font-medium text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <GitFork className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold">{userBranchName}</span>
                            </span>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Locked</Badge>
                          </div>
                        ) : filteredBranchesForCc.length === 0 ? (
                          <div className="h-9 px-3 py-2 rounded-md border text-xs bg-muted/20 text-foreground flex items-center justify-between border-dashed">
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Head Office / No Branch
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-background text-emerald-600 border-emerald-500/30">
                              Head Office
                            </Badge>
                          </div>
                        ) : (
                          <Select value={ccBranchId || 'NONE'} onValueChange={(val) => setCcBranchId(val === 'NONE' ? '' : val)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Branch / Location (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE" className="text-xs text-muted-foreground italic">
                                Head Office / No Branch
                              </SelectItem>
                              {filteredBranchesForCc.map((b: any) => (
                                <SelectItem key={b.id} value={b.id} className="text-xs">
                                  {b.name} {b.city ? `(${b.city})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Cost Center Head *</Label>
                        <Select value={ccManagerId} onValueChange={setCcManagerId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Responsible Head" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees?.items?.map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs">
                                {emp.firstName} {emp.lastName} ({emp.designation?.title ?? 'Personnel'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Annual Allocation Budget *</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 25.00"
                            value={ccBudgetValue}
                            onChange={e => setCcBudgetValue(e.target.value)}
                            className="h-9 text-xs font-mono flex-1"
                          />
                          <Select value={ccBudgetUnit} onValueChange={(v: 'Lakh' | 'Crore') => setCcBudgetUnit(v)}>
                            <SelectTrigger className="h-9 text-xs w-[105px] shrink-0 font-semibold bg-muted/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lakh" className="text-xs font-medium">₹ Lakh</SelectItem>
                              <SelectItem value="Crore" className="text-xs font-medium">₹ Crore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Headcount Capacity Limit *</Label>
                        <Input
                          type="number"
                          value={ccCapacity}
                          onChange={e => setCcCapacity(Number(e.target.value))}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Effective From Date *</Label>
                        <Input
                          type="date"
                          value={ccEffectiveFrom}
                          onChange={e => setCcEffectiveFrom(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Status *</Label>
                      <Select value={ccStatus} onValueChange={(v: any) => setCcStatus(v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active" className="text-xs">Active</SelectItem>
                          <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Description / Notes</Label>
                      <textarea
                        rows={2}
                        value={ccDescription}
                        onChange={e => setCcDescription(e.target.value)}
                        placeholder="Provide details about the budget scope..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingCc ? 'Save Changes' : 'Create Cost Center'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {filteredCostCenters.map(cc => {
                const currentStaffCount = headcountMap[cc.code || ''] || 0;
                const percentage = cc.headcountCapacity > 0 ? Math.round((currentStaffCount / cc.headcountCapacity) * 100) : 0;
                
                // Mapped department name
                const deptName = departments?.find((d: any) => d.id === cc.departmentId)?.name ?? cc.type;
                // Mapped manager name
                const head = employees?.items?.find((e: any) => e.id === cc.managerId);
                const headName = head ? `${head.firstName} ${head.lastName}` : 'Unassigned';

                return (
                  <div
                    key={cc.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${cc.isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          <span className="font-mono text-xs font-semibold text-primary">{cc.code}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {deptName}
                          </Badge>
                          {!cc.isActive && (
                            <Badge variant="destructive" className="text-[9px] h-4 py-0 font-medium">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditCc(cc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCc(cc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                        {cc.name}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Head: <strong className="text-foreground">{headName}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Effective: <strong className="text-foreground">{cc.effectiveFrom?.split('T')[0]}</strong></span>
                        </p>
                      </div>
                      
                      {cc.description && (
                        <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2 mt-2.5 italic">
                          {cc.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annual Allocation</span>
                        <span className="font-mono font-semibold text-sm text-foreground">{formatCurrency(cc.budget)}</span>
                      </div>

                      {/* Headcount Consumption Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" /> Staff Allocation
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {currentStaffCount} / {cc.headcountCapacity} Staff ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">CC Code</TableHead>
                  <TableHead className="text-xs">Cost Center Name</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Mapped Department</TableHead>
                  <TableHead className="text-xs">Annual Budget</TableHead>
                  <TableHead className="text-xs">Responsible Head</TableHead>
                  <TableHead className="text-xs">Headcount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCostCenters.map(cc => {
                  const currentStaffCount = headcountMap[cc.code || ''] || 0;
                  const deptName = departments?.find((d: any) => d.id === cc.departmentId)?.name ?? cc.type;
                  const head = employees?.items?.find((e: any) => e.id === cc.managerId);
                  const headName = head ? `${head.firstName} ${head.lastName}` : 'Unassigned';

                  return (
                    <TableRow key={cc.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{cc.code}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">{cc.name}</TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">{cc.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{deptName}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-foreground">{formatCurrency(cc.budget)}</TableCell>
                      <TableCell className="text-xs font-medium">{headName}</TableCell>
                      <TableCell className="text-xs font-mono">{currentStaffCount} / {cc.headcountCapacity} Staff</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={cc.isActive ? 'default' : 'secondary'} className="text-[10px] font-semibold py-0.5">
                          {cc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCc(cc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCc(cc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Job Grades & Level Bands Section ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-500" /> Job Grades & Level Bands
              </CardTitle>
              <CardDescription className="text-xs">
                Standardized salary Scale CTC bands, job level hierarchies, and reporting category assignments
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Branch Filter Dropdown */}
              <div className="w-44 sm:w-52">
                <Select
                  value={selectedGradeBranchFilter}
                  onValueChange={setSelectedGradeBranchFilter}
                  disabled={isBranchAdmin}
                >
                  <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
                      <SelectValue placeholder="All Branches & Offices">
                        {selectedGradeBranchFilter === 'ALL'
                          ? 'All Branches & Offices'
                          : selectedGradeBranchFilter === 'HEAD_OFFICE'
                          ? 'Head Office / No Branch'
                          : (validBranches.find((b: any) => b.id === selectedGradeBranchFilter)?.name || userBranchName)}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {!isBranchAdmin && (
                      <>
                        <SelectItem value="ALL" className="text-xs font-semibold">
                          All Branches &amp; Offices
                        </SelectItem>
                        <SelectItem value="HEAD_OFFICE" className="text-xs font-medium">
                          Head Office / No Branch
                        </SelectItem>
                      </>
                    )}
                    {validBranches.map((br: any) => (
                      <SelectItem key={br.id} value={br.id} className="text-xs">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="truncate">{br.name}</span>
                          {br.code && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {br.code}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-44 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter grades..."
                  value={searchGradeQuery}
                  onChange={e => setSearchGradeQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Grade Dialog */}
              <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddGrade}>
                    <Plus className="h-3.5 w-3.5" /> Add Job Grade
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingGrade ? 'Edit Job Grade' : 'Create New Job Grade'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 text-xs" onSubmit={handleSaveGrade}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold flex items-center gap-1">
                          Organization Entity *
                          {isBranchAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </Label>
                        {isBranchAdmin ? (
                          // Branch Admin: read-only organization display
                          <div className="h-9 px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 text-xs font-medium text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold truncate">
                                {userCompanyName || companies?.find((c: any) => c.id === userCompanyId)?.name || 'Your Company'}
                              </span>
                            </span>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">Locked</Badge>
                          </div>
                        ) : (
                          <Select value={gradeCompanyId} onValueChange={(val) => {
                            setGradeCompanyId(val);
                            const comp = companies?.find(c => c.id === val);
                            if (comp) {
                              setGradeCurrency(comp.currency ?? 'INR');
                            }
                            fetchAndSetNextGradeCode(gradeBranchId, val);
                          }}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            Branch
                            {isBranchAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                            {!isBranchAdmin && filteredBranchesForGrade.length > 0 && (
                              <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                            )}
                          </span>
                        </Label>
                        {isBranchAdmin ? (
                          // Branch Admin: read-only branch display
                          <div className="h-9 px-3 py-2 rounded-md border border-dashed border-border bg-muted/30 text-xs font-medium text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5 truncate">
                              <GitFork className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold truncate">{userBranchName}</span>
                            </span>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">Branch Locked</Badge>
                          </div>
                        ) : filteredBranchesForGrade.length === 0 ? (
                          <div className="h-9 px-3 py-2 rounded-md border text-xs bg-muted/20 text-foreground flex items-center justify-between border-dashed">
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Head Office / No Branch
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-background text-emerald-600 border-emerald-500/30">
                              Head Office
                            </Badge>
                          </div>
                        ) : (
                          <Select value={gradeBranchId || 'NONE'} onValueChange={(val) => {
                            const selected = val === 'NONE' ? '' : val;
                            setGradeBranchId(selected);
                            fetchAndSetNextGradeCode(selected, gradeCompanyId);
                          }}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Branch (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE" className="text-xs text-muted-foreground italic">
                                Head Office / No Branch
                              </SelectItem>
                              {filteredBranchesForGrade?.map((b: any) => (
                                <SelectItem key={b.id} value={b.id} className="text-xs">
                                  {b.name} ({b.code || 'BR'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold flex items-center justify-between">
                          <span>Grade Code (Auto Generated) *</span>
                          <span className="text-[10px] text-muted-foreground font-mono font-normal">GR-Branch-Seq</span>
                        </Label>
                        <Input
                          placeholder="e.g. GR-Br1-01"
                          value={gradeCode}
                          onChange={e => setGradeCode(e.target.value)}
                          className="h-9 text-xs font-mono font-semibold text-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Grade Name *</Label>
                        <Input
                          placeholder=""
                          value={gradeName}
                          onChange={e => setGradeName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Job Level *</Label>
                        <Select value={gradeLevel} onValueChange={setGradeLevel}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L1" className="text-xs font-semibold">Level 1 (L1)</SelectItem>
                            <SelectItem value="L2" className="text-xs font-semibold">Level 2 (L2)</SelectItem>
                            <SelectItem value="L3" className="text-xs font-semibold">Level 3 (L3)</SelectItem>
                            <SelectItem value="L4" className="text-xs font-semibold">Level 4 (L4)</SelectItem>
                            <SelectItem value="L5" className="text-xs font-semibold">Level 5 (L5)</SelectItem>
                            <SelectItem value="L6" className="text-xs font-semibold">Level 6 (L6)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Grade Category *</Label>
                        <Select value={gradeCategory} onValueChange={setGradeCategory}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Executive" className="text-xs">Executive</SelectItem>
                            <SelectItem value="Management" className="text-xs">Management</SelectItem>
                            <SelectItem value="Professional" className="text-xs">Professional</SelectItem>
                            <SelectItem value="Staff" className="text-xs">Staff</SelectItem>
                            <SelectItem value="Worker" className="text-xs">Worker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        Department Mapping
                        {isBranchAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </Label>
                      <Select value={gradeDepartmentId} onValueChange={setGradeDepartmentId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder={isBranchAdmin ? 'Your branch departments' : 'Select Department'} />
                        </SelectTrigger>
                        <SelectContent>
                          {!isBranchAdmin && (
                            <SelectItem value="__none__" className="text-xs text-muted-foreground italic">None (Global)</SelectItem>
                          )}
                          {departments?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name}
                            </SelectItem>
                          ))}
                          {isBranchAdmin && (!departments || departments.length === 0) && (
                            <div className="text-xs text-muted-foreground p-2 text-center">No departments found for your branch</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Salary Configuration Block */}
                    <div className="space-y-3 rounded-xl border border-border/80 p-3 bg-muted/20">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <Label className="text-[11px] font-semibold text-foreground">Salary Input Type *</Label>
                        <div className="flex items-center gap-4 text-xs font-medium">
                          <label className="flex items-center gap-1.5 cursor-pointer text-foreground">
                            <input
                              type="radio"
                              name="salaryMode"
                              value="monthly"
                              checked={gradeSalaryMode === 'monthly'}
                              onChange={() => setGradeSalaryMode('monthly')}
                              className="accent-primary h-3.5 w-3.5"
                            />
                            <span>Monthly Salary</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-foreground">
                            <input
                              type="radio"
                              name="salaryMode"
                              value="annual"
                              checked={gradeSalaryMode === 'annual'}
                              onChange={() => setGradeSalaryMode('annual')}
                              className="accent-primary h-3.5 w-3.5"
                            />
                            <span>Annual CTC</span>
                          </label>
                        </div>
                      </div>

                      {/* MODE 1: Monthly Salary View */}
                      {gradeSalaryMode === 'monthly' && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-semibold flex items-center justify-between">
                            <span>Monthly Salary Range (₹ / Month) *</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Currency: {gradeCurrency}</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground font-medium">Min Monthly Salary</span>
                              <Input
                                type="number"
                                placeholder="e.g. 30000"
                                value={gradeMinSalary}
                                onChange={e => handleMinMonthlyChange(e.target.value)}
                                className="h-9 text-xs font-mono bg-background"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground font-medium">Max Monthly Salary</span>
                              <Input
                                type="number"
                                placeholder="e.g. 60000"
                                value={gradeMaxSalary}
                                onChange={e => handleMaxMonthlyChange(e.target.value)}
                                className="h-9 text-xs font-mono bg-background"
                              />
                            </div>
                          </div>

                          <div className="rounded-lg bg-primary/5 p-2 border border-primary/20 text-xs flex items-center justify-between mt-2">
                            <span className="text-muted-foreground font-medium text-[11px]">Annual CTC Reference:</span>
                            <span className="font-mono font-semibold text-primary">
                              {formatCtc((Number(gradeMinSalary) || 0) * 12)} – {formatCtc((Number(gradeMaxSalary) || 0) * 12)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: Annual CTC View */}
                      {gradeSalaryMode === 'annual' && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-semibold flex items-center justify-between">
                            <span>Annual CTC Range *</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Currency: {gradeCurrency}</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground font-medium">Min Annual CTC</span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="e.g. 4.50"
                                  value={gradeMinAnnualVal}
                                  onChange={e => handleMinAnnualChange(e.target.value)}
                                  className="h-9 text-xs font-mono bg-background flex-1"
                                />
                                <Select
                                  value={gradeMinAnnualUnit}
                                  onValueChange={(v: any) => handleMinAnnualUnitChange(v)}
                                >
                                  <SelectTrigger className="h-9 text-xs w-[95px] shrink-0 font-semibold bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="₹" className="text-xs">₹</SelectItem>
                                    <SelectItem value="Thousand" className="text-xs">Thousand</SelectItem>
                                    <SelectItem value="Lakh" className="text-xs">₹ Lakh</SelectItem>
                                    <SelectItem value="Crore" className="text-xs">₹ Crore</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground font-medium">Max Annual CTC</span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="e.g. 7.50"
                                  value={gradeMaxAnnualVal}
                                  onChange={e => handleMaxAnnualChange(e.target.value)}
                                  className="h-9 text-xs font-mono bg-background flex-1"
                                />
                                <Select
                                  value={gradeMaxAnnualUnit}
                                  onValueChange={(v: any) => handleMaxAnnualUnitChange(v)}
                                >
                                  <SelectTrigger className="h-9 text-xs w-[95px] shrink-0 font-semibold bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="₹" className="text-xs">₹</SelectItem>
                                    <SelectItem value="Thousand" className="text-xs">Thousand</SelectItem>
                                    <SelectItem value="Lakh" className="text-xs">₹ Lakh</SelectItem>
                                    <SelectItem value="Crore" className="text-xs">₹ Crore</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20 text-xs flex items-center justify-between mt-2">
                            <span className="text-muted-foreground font-medium text-[11px]">Monthly Equivalent:</span>
                            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                              ₹{(Number(gradeMinSalary) || 0).toLocaleString('en-IN')} – ₹{(Number(gradeMaxSalary) || 0).toLocaleString('en-IN')} / month
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Effective From *</Label>
                        <Input
                          type="date"
                          value={gradeEffectiveFrom}
                          onChange={e => setGradeEffectiveFrom(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Status *</Label>
                        <Select value={gradeStatus} onValueChange={(v: any) => setGradeStatus(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active" className="text-xs">Active</SelectItem>
                            <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Description</Label>
                      <textarea
                        rows={2}
                        value={gradeDescription}
                        onChange={e => setGradeDescription(e.target.value)}
                        placeholder="Write description about compensation parameters..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingGrade ? 'Save Changes' : 'Create Job Grade'}
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
                <TableHead className="text-xs">Grade Code</TableHead>
                <TableHead className="text-xs">Grade Name</TableHead>
                <TableHead className="text-xs">Level</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">Mapped Dept</TableHead>
                <TableHead className="text-xs">Salary CTC Range</TableHead>
                <TableHead className="text-xs text-center">Active Employees</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayGrades.map(g => {
                const count = gradeCountMap[g.gradeCode] || 0;
                return (
                  <TableRow key={g.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-violet-600">{g.gradeCode}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{g.gradeName}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{g.level}</TableCell>
                    <TableCell className="text-xs font-medium">{g.category ?? '—'}</TableCell>
                    <TableCell className="text-xs">
                      {g.branch?.name || branches?.find((b: any) => b.id === g.branchId)?.name ? (
                        <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary bg-primary/5 flex items-center gap-1 w-fit">
                          <GitFork className="h-3 w-3 shrink-0" />
                          {g.branch?.name || branches?.find((b: any) => b.id === g.branchId)?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1 w-fit">
                          <Building2 className="h-3 w-3 shrink-0" />
                          Head Office
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {departments?.find((d: any) => d.id === g.departmentId)?.name ?? 'Global'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {formatSalaryRange(g.minSalary, g.maxSalary)} / mo
                        </span>
                        <span className="text-[10px] text-primary font-medium">
                          CTC: {formatCtc(g.minSalary >= 100000 ? g.minSalary : g.minSalary * 12)} – {formatCtc(g.maxSalary >= 100000 ? g.maxSalary : g.maxSalary * 12)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-center text-muted-foreground">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-foreground font-semibold">
                        {count}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={g.isActive ? 'default' : 'secondary'} className="text-[10px] font-semibold py-0.5">
                        {g.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditGrade(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteGrade(g.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
