import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Layers,
  Sparkles,
  Calculator,
  ArrowRight,
  Send,
  Building2,
  UserCheck,
  FileText,
  ShieldCheck,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { formatSalaryInLakhs } from '@/lib/utils';
import { manpowerPlansApi, manpowerRequisitionsApi } from '@/api/recruitment';
import { companiesApi, departmentsApi, designationsApi, branchesApi } from '@/api/organization';
import { costCentersApi, type CostCenter } from '@/api/cost-grades';
import { employeesApi } from '@/api/employees';
import type { ManpowerPlan, Department, Designation, Branch, Company, ManpowerRequisition } from '@/api/types';

const HIRING_QUARTERS = [
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
  'Q4 2026',
  'Q1 2027',
  'Q2 2027',
  'Q3 2027',
  'Q4 2027',
];

export function ManpowerPlanningTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableDept, setSelectedTableDept] = useState<string>('all');

  // Modal State - Forecast Plan
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ManpowerPlan | null>(null);

  // Selected Forecast Form Fields
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedCostCenterCode, setSelectedCostCenterCode] = useState<string>('');
  const [selectedDesignationId, setSelectedDesignationId] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('');
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] = useState<boolean>(false);
  const designationComboboxRef = useRef<HTMLDivElement>(null);
  const [formBudgeted, setFormBudgeted] = useState<number>(5);
  const [formActive, setFormActive] = useState<number>(0);
  const [formQuarter, setFormQuarter] = useState<string>('Q3 2026');
  const [formReason, setFormReason] = useState<string>('');

  // Raise MR Modal State
  const [isMrOpen, setIsMrOpen] = useState(false);
  const [raisingPlan, setRaisingPlan] = useState<ManpowerPlan | null>(null);
  const [mrNumber, setMrNumber] = useState('MR-2026-001');
  const [mrJoiningDate, setMrJoiningDate] = useState('');
  const [mrEmploymentType, setMrEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'>('FULL_TIME');
  const [mrPriority, setMrPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [mrExperienceLevel, setMrExperienceLevel] = useState<'Fresher' | 'Experienced'>('Experienced');
  const [mrMinSalaryLakh, setMrMinSalaryLakh] = useState<number>(8);
  const [mrMaxSalaryLakh, setMrMaxSalaryLakh] = useState<number>(12);
  const [mrQualification, setMrQualification] = useState('B.Tech / M.Tech / MBA / Graduate');
  const [mrExperience, setMrExperience] = useState('3 - 5 Years');
  const [mrRequiredSkills, setMrRequiredSkills] = useState('Technical leadership, domain expertise, team coordination');
  const [mrWorkLocation, setMrWorkLocation] = useState('');
  const [mrReportingManagerId, setMrReportingManagerId] = useState('');
  const [mrReason, setMrReason] = useState('');
  const [mrComments, setMrComments] = useState('');
  const [mrRequestorName, setMrRequestorName] = useState('HR Admin');

  // 1. Fetch Real Master Data from APIs
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['manpower-plans'],
    queryFn: () => manpowerPlansApi.list(),
  });

  const { data: companies = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
  });

  const { data: rawBranches = [], isLoading: isBranchesLoading } = useQuery({
    queryKey: ['all-master-branches'],
    queryFn: () => branchesApi.list(),
  });

  const { data: rawDepartments = [], isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ['all-master-departments'],
    queryFn: () => departmentsApi.list(),
  });

  const { data: rawCostCenters = [], isLoading: isCostCentersLoading } = useQuery({
    queryKey: ['all-master-cost-centers'],
    queryFn: () => costCentersApi.list(),
  });

  const { data: rawDesignations = [], isLoading: isDesignationsLoading } = useQuery({
    queryKey: ['all-master-designations'],
    queryFn: () => designationsApi.list(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 'all-active'],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const activeEmployees = useMemo(() => {
    if (!employeesData?.items) return [];
    return employeesData.items.filter((emp: any) => emp.status === 'ACTIVE');
  }, [employeesData]);

  // Clean & Deduplicate Master Branches List for Selected Company
  const branches = useMemo(() => {
    if (!rawBranches) return [];
    if (!selectedCompanyId) return rawBranches;
    return rawBranches.filter((b) => b.companyId === selectedCompanyId);
  }, [rawBranches, selectedCompanyId]);

  // Clean & Deduplicate Master Departments List for Selected Company + Branch
  const departments = useMemo(() => {
    if (!rawDepartments) return [];
    const map = new Map<string, Department>();
    rawDepartments.forEach((d) => {
      if (selectedCompanyId && d.companyId !== selectedCompanyId) return;
      if (selectedBranchId && d.branchId && d.branchId !== selectedBranchId) return;

      const cleanName = d.name ? d.name.trim() : '';
      const key = `${d.id}_${cleanName.toLowerCase()}`;
      if (cleanName && !map.has(key)) {
        map.set(key, { ...d, name: cleanName });
      }
    });
    return Array.from(map.values());
  }, [rawDepartments, selectedCompanyId, selectedBranchId]);

  // Active selected company object
  const currentCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  // Active selected branch object
  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Active selected department object
  const currentDept = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId);
  }, [departments, selectedDeptId]);

  // Clean & Deduplicate Master Cost Centers List for Selected Company + Branch + Department
  const costCenters = useMemo(() => {
    if (!rawCostCenters) return [];
    const map = new Map<string, CostCenter>();
    rawCostCenters.forEach((cc) => {
      if (selectedCompanyId && cc.companyId && cc.companyId !== selectedCompanyId) return;
      if (selectedBranchId && cc.branchId && cc.branchId !== selectedBranchId) return;

      if (selectedDeptId) {
        const matchesDeptId = cc.departmentId === selectedDeptId;
        const targetDeptName = currentDept?.name ? currentDept.name.trim().toLowerCase() : '';
        const ccDeptName = cc.department?.name ? cc.department.name.trim().toLowerCase() : '';
        const ccName = cc.name ? cc.name.trim().toLowerCase() : '';

        const matchesDeptName = targetDeptName && ccDeptName && (ccDeptName.includes(targetDeptName) || targetDeptName.includes(ccDeptName));
        const matchesCcName = targetDeptName && ccName && (ccName.includes(targetDeptName) || targetDeptName.includes(ccName));

        if (!matchesDeptId && !matchesDeptName && !matchesCcName) {
          return;
        }
      }

      const codeKey = cc.code ? cc.code.trim().toUpperCase() : '';
      if (codeKey && !map.has(codeKey)) {
        map.set(codeKey, cc);
      }
    });
    return Array.from(map.values());
  }, [rawCostCenters, selectedCompanyId, selectedBranchId, selectedDeptId, currentDept]);

  // Clean & Deduplicate Master Designations List for Selected Department
  const designations = useMemo(() => {
    if (!rawDesignations) return [];
    const map = new Map<string, Designation>();
    rawDesignations.forEach((des) => {
      if (selectedCompanyId && des.companyId !== selectedCompanyId) return;
      if (selectedDeptId && des.departmentId && des.departmentId !== selectedDeptId) return;

      const cleanTitle = des.title ? des.title.trim() : '';
      const key = `${des.id}_${cleanTitle.toLowerCase()}`;
      if (cleanTitle && !map.has(key)) {
        map.set(key, { ...des, title: cleanTitle });
      }
    });
    return Array.from(map.values());
  }, [rawDesignations, selectedCompanyId, selectedDeptId]);

  // Active selected designation object (or matched from typed title)
  const currentDesignation = useMemo(() => {
    if (selectedDesignationId) {
      const match = designations.find((d) => d.id === selectedDesignationId);
      if (match) return match;
    }
    if (roleInput.trim()) {
      return designations.find((d) => d.title.trim().toLowerCase() === roleInput.trim().toLowerCase());
    }
    return undefined;
  }, [designations, selectedDesignationId, roleInput]);

  // Filter master designations dynamically based on roleInput
  const filteredDesignations = useMemo(() => {
    if (!designations) return [];
    if (!roleInput.trim()) return designations;
    const q = roleInput.trim().toLowerCase();
    return designations.filter(
      (des) =>
        des.title.toLowerCase().includes(q) ||
        (des.code && des.code.toLowerCase().includes(q))
    );
  }, [designations, roleInput]);

  // Click outside listener for Designation Combobox Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (designationComboboxRef.current && !designationComboboxRef.current.contains(event.target as Node)) {
        setIsDesignationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active plan company object for MR Modal
  const planCompany = useMemo(() => {
    if (!raisingPlan) return null;
    if (raisingPlan.company) return raisingPlan.company;
    return companies.find((c) => c.id === raisingPlan.companyId);
  }, [raisingPlan, companies]);

  // Active plan branch object for MR Modal
  const planBranch = useMemo(() => {
    if (!raisingPlan) return null;
    if (raisingPlan.branch) return raisingPlan.branch;
    return rawBranches.find((b) => b.id === raisingPlan.branchId);
  }, [raisingPlan, rawBranches]);

  // MR Branches/Locations filtered strictly by selected Company + Branch of the Forecast Plan
  const mrBranches = useMemo(() => {
    if (!raisingPlan || !rawBranches) return [];
    return rawBranches.filter((b: Branch) => {
      const matchesCompany = !raisingPlan.companyId || b.companyId === raisingPlan.companyId;
      const matchesBranch = !raisingPlan.branchId || b.id === raisingPlan.branchId;
      return matchesCompany && matchesBranch;
    });
  }, [raisingPlan, rawBranches]);

  // MR Reporting Managers filtered strictly by Company + Branch (+ Department) of the Forecast Plan
  const mrReportingManagers = useMemo(() => {
    if (!raisingPlan || !activeEmployees.length) return [];

    const planCompId = raisingPlan.companyId;
    const planCompName = planCompany?.name ? planCompany.name.trim().toLowerCase() : '';

    const planBranchId = raisingPlan.branchId || planBranch?.id;
    const planBranchName = planBranch?.name ? planBranch.name.trim().toLowerCase() : '';

    const planDeptId = raisingPlan.departmentId;
    const planDeptName = raisingPlan.departmentName ? raisingPlan.departmentName.trim().toLowerCase() : '';

    // 1. Branch level employees matching Company & Branch
    const branchEmployees = activeEmployees.filter((emp: any) => {
      let matchesCompany = true;
      if (planCompId) {
        matchesCompany = emp.companyId === planCompId || emp.company?.id === planCompId;
      } else if (planCompName) {
        const empCompName = emp.company?.name ? emp.company.name.trim().toLowerCase() : '';
        matchesCompany = !empCompName || empCompName === planCompName;
      }

      let matchesBranch = true;
      if (planBranchId) {
        matchesBranch = emp.branchId === planBranchId || emp.branch?.id === planBranchId;
      } else if (planBranchName) {
        const empBranchName = emp.branch?.name ? emp.branch.name.trim().toLowerCase() : '';
        matchesBranch = !empBranchName || empBranchName.includes(planBranchName) || planBranchName.includes(empBranchName);
      }

      return matchesCompany && matchesBranch;
    });

    if (branchEmployees.length === 0) {
      // Fallback to Company level employees if branch ID is not assigned on employee records
      return activeEmployees.filter((emp: any) => {
        return !planCompId || emp.companyId === planCompId || emp.company?.id === planCompId;
      });
    }

    // 2. Department level employees matching Department
    const deptEmployees = branchEmployees.filter((emp: any) => {
      if (planDeptId && (emp.departmentId === planDeptId || emp.department?.id === planDeptId)) return true;
      const empDeptName = emp.department?.name ? emp.department.name.trim().toLowerCase() : (emp.departmentName ? emp.departmentName.trim().toLowerCase() : '');
      return planDeptName && empDeptName && (empDeptName.includes(planDeptName) || planDeptName.includes(empDeptName));
    });

    return deptEmployees.length > 0 ? deptEmployees : branchEmployees;
  }, [raisingPlan, activeEmployees, planCompany, planBranch]);

  // Handle Cascading Company Change
  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    setSelectedBranchId('');
    setSelectedDeptId('');
    setSelectedCostCenterCode('');
    setSelectedDesignationId('');
    setRoleInput('');
    setIsDesignationDropdownOpen(false);
    setFormActive(0);
  };

  // Handle Cascading Branch Change
  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    setSelectedDeptId('');
    setSelectedCostCenterCode('');
    setSelectedDesignationId('');
    setRoleInput('');
    setIsDesignationDropdownOpen(false);
    setFormActive(0);
  };

  // Handle Cascading Department Change
  const handleDepartmentChange = (newDeptId: string) => {
    setSelectedDeptId(newDeptId);
    setSelectedCostCenterCode('');
    setSelectedDesignationId('');
    setRoleInput('');
    setIsDesignationDropdownOpen(false);
    setFormActive(0);
  };

  // Handle Cost Center Change
  const handleCostCenterChange = (newCcCode: string) => {
    setSelectedCostCenterCode(newCcCode);
  };

  // Handle Designation Selection from Combobox
  const handleDesignationSelect = (des: Designation) => {
    setSelectedDesignationId(des.id);
    setRoleInput(des.title);
    setIsDesignationDropdownOpen(false);
  };

  // Dynamic Active Staff Count from Employee Management
  useEffect(() => {
    const searchRole = roleInput.trim().toLowerCase();
    if (!activeEmployees || !selectedCompanyId || !selectedBranchId || !selectedDeptId || (!selectedDesignationId && !searchRole)) {
      setFormActive(0);
      return;
    }

    const targetDeptName = currentDept?.name?.toLowerCase().trim() || '';
    const targetRoleTitle = currentDesignation?.title?.toLowerCase().trim() || searchRole;

    const count = activeEmployees.filter((emp: any) => {
      if (selectedCompanyId && emp.companyId && emp.companyId !== selectedCompanyId) return false;
      if (selectedBranchId && emp.branchId && emp.branchId !== selectedBranchId) return false;

      const empDeptId = emp.departmentId;
      const empDeptName = (emp.department?.name || '').toLowerCase().trim();
      const matchesDept = empDeptId === selectedDeptId || (targetDeptName && empDeptName.includes(targetDeptName));

      if (!matchesDept) return false;

      const empDesigId = emp.designationId;
      const empDesigTitle = (emp.designation?.title || '').toLowerCase().trim();
      const prevTitle = (emp.prevJobTitle || '').toLowerCase().trim();

      const matchesRole =
        (selectedDesignationId && empDesigId === selectedDesignationId) ||
        (targetRoleTitle && (empDesigTitle.includes(targetRoleTitle) || targetRoleTitle.includes(empDesigTitle) || prevTitle.includes(targetRoleTitle)));

      return matchesRole;
    }).length;

    setFormActive(count);
  }, [activeEmployees, selectedCompanyId, selectedBranchId, selectedDeptId, selectedDesignationId, roleInput, currentDept, currentDesignation]);

  // Planned Hires calculation
  const plannedHiresCount = useMemo(() => {
    return Math.max(0, formBudgeted - formActive);
  }, [formBudgeted, formActive]);

  // Open Modal for Add Forecast Plan
  const openAddModal = () => {
    setEditingPlan(null);
    const initialCompanyId = companies[0]?.id || '';
    setSelectedCompanyId(initialCompanyId);

    const companyBranches = rawBranches.filter((b) => !initialCompanyId || b.companyId === initialCompanyId);
    const initialBranchId = companyBranches[0]?.id || '';
    setSelectedBranchId(initialBranchId);

    setSelectedDeptId('');
    setSelectedDesignationId('');
    setRoleInput('');
    setIsDesignationDropdownOpen(false);
    setSelectedCostCenterCode('');
    setFormBudgeted(5);
    setFormQuarter('Q3 2026');
    setFormReason('');
    setIsOpen(true);
  };

  // Open Modal for Edit Forecast Plan
  const openEditModal = (plan: ManpowerPlan) => {
    setEditingPlan(plan);

    setSelectedCompanyId(plan.companyId || companies[0]?.id || '');
    setSelectedBranchId(plan.branchId || '');
    setSelectedDeptId(plan.departmentId || '');
    setSelectedDesignationId(plan.designationId || '');
    setRoleInput(plan.role || '');
    setIsDesignationDropdownOpen(false);
    setSelectedCostCenterCode(plan.costCenter);

    setFormBudgeted(plan.budgeted);
    setFormQuarter(plan.quarter);
    setFormReason(plan.reason || '');
    setIsOpen(true);
  };

  // Open Raise MR Modal (Populate all MR defaults with strict isolation)
  const openRaiseMrModal = async (plan: ManpowerPlan) => {
    setRaisingPlan(plan);
    try {
      const nextNum = await manpowerRequisitionsApi.getNextNumber();
      setMrNumber(nextNum || 'MR-2026-001');
    } catch {
      setMrNumber('MR-2026-001');
    }

    // Determine Work Location strictly from Forecast Plan's Branch & Company
    const targetBranch = rawBranches.find((b: Branch) => b.id === plan.branchId) ||
                         rawBranches.find((b: Branch) => b.companyId === plan.companyId);

    const defaultLoc = targetBranch
      ? `${targetBranch.name} (${targetBranch.city || 'Nashik'})`
      : 'NASHIK DEVELOPMENT (Nashik)';

    // Determine Reporting Manager strictly from Forecast Plan's Company, Branch & Department
    const planCompId = plan.companyId;
    const targetBranchId = plan.branchId || targetBranch?.id;

    const branchMgrs = activeEmployees.filter((emp: any) => {
      const matchesCompany = !planCompId || emp.companyId === planCompId || emp.company?.id === planCompId;
      const matchesBranch = !targetBranchId || emp.branchId === targetBranchId || emp.branch?.id === targetBranchId;
      return matchesCompany && matchesBranch;
    });

    const deptMgrs = branchMgrs.filter((emp: any) => {
      if (plan.departmentId && (emp.departmentId === plan.departmentId || emp.department?.id === plan.departmentId)) return true;
      const empDeptName = emp.department?.name ? emp.department.name.trim().toLowerCase() : (emp.departmentName ? emp.departmentName.trim().toLowerCase() : '');
      const planDeptName = plan.departmentName ? plan.departmentName.trim().toLowerCase() : '';
      return planDeptName && empDeptName && (empDeptName.includes(planDeptName) || planDeptName.includes(empDeptName));
    });

    const companyMgrs = activeEmployees.filter((emp: any) => !planCompId || emp.companyId === planCompId || emp.company?.id === planCompId);

    const defaultMgr = deptMgrs[0]?.id || branchMgrs[0]?.id || companyMgrs[0]?.id || activeEmployees[0]?.id || '';

    // Look up Designation master object for salary budget, qualification, and skills
    const desigObj = rawDesignations.find((d: Designation) => d.id === plan.designationId || d.title.toLowerCase() === plan.role.toLowerCase());

    const minSalaryLakh = desigObj?.minSalary ? Math.round(desigObj.minSalary / 100000) : 0;
    const maxSalaryLakh = desigObj?.maxSalary ? Math.round(desigObj.maxSalary / 100000) : 0;

    // Date default: 30 days from today
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setMrJoiningDate(futureDate.toISOString().split('T')[0]);

    setMrEmploymentType('FULL_TIME');
    setMrPriority('NORMAL');
    setMrExperienceLevel('Experienced');
    setMrExperience('');
    setMrMinSalaryLakh(minSalaryLakh);
    setMrMaxSalaryLakh(maxSalaryLakh);
    setMrQualification('');
    setMrRequiredSkills('');
    setMrWorkLocation(defaultLoc);
    setMrReportingManagerId(defaultMgr);
    setMrReason('');
    setMrComments('');
    setMrRequestorName('HR Admin');
    setIsMrOpen(true);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Partial<ManpowerPlan>) => manpowerPlansApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      toast.success('Forecast Plan added successfully');
      setIsOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save forecast plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ManpowerPlan> }) => manpowerPlansApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      toast.success('Manpower Forecast updated');
      setIsOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update forecast plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manpowerPlansApi.remove(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['manpower-plans'], (old: ManpowerPlan[] | undefined) =>
        old ? old.filter((p) => p.id !== deletedId) : []
      );
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      toast.success('Manpower plan removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove plan'),
  });

  // Submit MR Mutation
  const submitMrMutation = useMutation({
    mutationFn: (payload: Partial<ManpowerRequisition>) => manpowerRequisitionsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      queryClient.invalidateQueries({ queryKey: ['manpower-requisitions'] });
      toast.success(`Manpower Requisition ${data.mrNumber} submitted successfully for approval.`);
      setIsMrOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to submit Manpower Requisition'),
  });

  // Handle Form Submit (Forecast Plan)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error('Please select a company.');
      return;
    }
    if (!selectedBranchId) {
      toast.error('Please select a branch.');
      return;
    }
    if (!selectedDeptId || !currentDept) {
      if (departments.length === 0) {
        toast.error('No departments found for the selected company and branch.');
      } else {
        toast.error('Please select a department.');
      }
      return;
    }
    if (!selectedCostCenterCode) {
      if (costCenters.length === 0) {
        toast.error('No cost centers found for the selected company, branch and department.');
      } else {
        toast.error('Please select a cost center.');
      }
      return;
    }
    if (!roleInput.trim()) {
      toast.error('Please enter or select a target job designation/role.');
      return;
    }
    if (formBudgeted <= 0) {
      toast.error('Budgeted headcount must be greater than 0.');
      return;
    }
    if (!formQuarter) {
      toast.error('Please select a hiring quarter.');
      return;
    }
    if (!formReason.trim()) {
      toast.error('Please provide a hiring reason/justification.');
      return;
    }

    const isCcValid = costCenters.some((cc) => cc.code === selectedCostCenterCode);
    if (!isCcValid) {
      toast.error('Selected Cost Center does not belong to the selected company, branch and department.');
      return;
    }

    const matchedDesig = currentDesignation || designations.find((d) => d.title.trim().toLowerCase() === roleInput.trim().toLowerCase());

    const payload: Partial<ManpowerPlan> = {
      companyId: selectedCompanyId,
      branchId: selectedBranchId,
      departmentId: currentDept.id,
      departmentName: currentDept.name,
      costCenter: selectedCostCenterCode,
      designationId: selectedDesignationId || matchedDesig?.id || undefined,
      role: roleInput.trim(),
      budgeted: formBudgeted,
      quarter: formQuarter,
      reason: formReason,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Handle Submit Manpower Requisition (MR)
  const handleSubmitMr = (e: React.FormEvent) => {
    e.preventDefault();

    if (!raisingPlan) return;

    // Work Location mismatch validation
    if (mrWorkLocation && raisingPlan.branchId) {
      const targetBranch = rawBranches.find((b) => b.id === raisingPlan.branchId);
      if (targetBranch) {
        const branchNamePart = targetBranch.name.toLowerCase();
        const locLower = mrWorkLocation.toLowerCase();
        if (locLower.includes('bengaluru') && !branchNamePart.includes('bengaluru')) {
          toast.error('Selected Work Location does not match the Forecast Plan branch.');
          return;
        }
      }
    }

    if (!mrJoiningDate) {
      toast.error('Required Joining Date is required');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (mrJoiningDate < todayStr) {
      toast.error('Required Joining Date cannot be in the past.');
      return;
    }

    if (!mrEmploymentType) {
      toast.error('Employment Type is required');
      return;
    }
    if (!mrPriority) {
      toast.error('Priority is required');
      return;
    }
    if (mrMinSalaryLakh <= 0) {
      toast.error('Minimum Annual CTC must be a positive number');
      return;
    }
    if (mrMaxSalaryLakh <= 0) {
      toast.error('Maximum Annual CTC must be a positive number');
      return;
    }
    if (mrMinSalaryLakh > mrMaxSalaryLakh) {
      toast.error('Minimum CTC cannot be greater than Maximum CTC.');
      return;
    }
    if (!mrQualification.trim()) {
      toast.error('Qualification is required');
      return;
    }
    if (mrExperienceLevel === 'Experienced' && !mrExperience.trim()) {
      toast.error('Please specify required experience range');
      return;
    }
    if (!mrWorkLocation.trim()) {
      toast.error('Work Location is required');
      return;
    }
    if (!mrReportingManagerId) {
      toast.error('Reporting Manager is required');
      return;
    }
    if (!mrReason.trim()) {
      toast.error('Hiring Reason / Justification is required');
      return;
    }

    const minSalaryRupees = mrMinSalaryLakh >= 1000 ? mrMinSalaryLakh : Math.round(mrMinSalaryLakh * 100000);
    const maxSalaryRupees = mrMaxSalaryLakh >= 1000 ? mrMaxSalaryLakh : Math.round(mrMaxSalaryLakh * 100000);

    const formattedExperience = mrExperienceLevel === 'Fresher'
      ? 'Fresher (0 - 1 Years)'
      : (mrExperience.toLowerCase().includes('year') ? mrExperience : `${mrExperience} Years`);

    const payload: Partial<ManpowerRequisition> = {
      mrNumber,
      manpowerPlanId: raisingPlan.id,
      companyId: raisingPlan.companyId || null,
      branchId: raisingPlan.branchId || null,
      departmentId: raisingPlan.departmentId || null,
      departmentName: raisingPlan.departmentName,
      costCenter: raisingPlan.costCenter,
      designationId: raisingPlan.designationId || null,
      role: raisingPlan.role,
      numOpenings: Math.max(1, Math.max(0, raisingPlan.budgeted - raisingPlan.active) || raisingPlan.plannedHires),
      joiningDate: mrJoiningDate,
      employmentType: mrEmploymentType,
      priority: mrPriority,
      minSalary: minSalaryRupees,
      maxSalary: maxSalaryRupees,
      qualification: mrQualification,
      experience: formattedExperience,
      requiredSkills: mrRequiredSkills,
      workLocation: mrWorkLocation,
      reportingManagerId: mrReportingManagerId,
      requestorName: mrRequestorName,
      reason: mrReason,
      comments: mrComments,
      status: 'PENDING_APPROVAL',
    };

    submitMrMutation.mutate(payload);
  };

  const handleDeletePlan = (id: string, role: string) => {
    if (confirm(`Are you sure you want to remove the manpower forecast plan for "${role}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filtered Table Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.costCenter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        selectedTableDept === 'all' ? true : p.departmentName.toLowerCase() === selectedTableDept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [plans, searchQuery, selectedTableDept]);

  // Aggregate KPI Stats
  const totalBudgeted = plans.reduce((acc, curr) => acc + curr.budgeted, 0);
  const totalActive = plans.reduce((acc, curr) => acc + curr.active, 0);
  const totalPlanned = plans.reduce((acc, curr) => acc + curr.plannedHires, 0);
  const remainingBudgetCap = Math.max(0, totalBudgeted - totalActive);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Manpower Planning KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Budgeted Roles</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{totalBudgeted} Positions</p>
              <p className="text-[10px] text-primary font-semibold mt-1">FY 2026-27 Approved</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Filled Roles</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{totalActive} Staff</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                {totalBudgeted > 0 ? `${Math.round((totalActive / totalBudgeted) * 100)}%` : '0%'} Occupancy Rate
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planned Hires</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">+{totalPlanned} Openings</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Recruitment Forecast</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining Budget Cap</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{remainingBudgetCap} Positions</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Available Headcount</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Manpower Planning Master Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Departmental Manpower Planning & Forecast
              </CardTitle>
              <CardDescription className="text-xs">
                Headcount forecasting, position budgets, cost center mapping and requisition controls
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Department Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setSelectedTableDept('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                    selectedTableDept === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {departments.slice(0, 4).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedTableDept(d.name)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedTableDept.toLowerCase() === d.name.toLowerCase()
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d.name.length > 15 ? `${d.name.substring(0, 12)}...` : d.name}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter forecasted roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Forecast Plan Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Add Forecast Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      {editingPlan ? 'Edit Headcount Forecast Plan' : 'Add Headcount Forecast Plan'}
                    </DialogTitle>
                  </DialogHeader>

                  <form className="space-y-4 text-xs pt-1" onSubmit={handleSavePlan}>
                    {/* 1. Company & Branch Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Company Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Company *</Label>
                        <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Branch Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Branch *</Label>
                        <Select
                          value={selectedBranchId}
                          onValueChange={handleBranchChange}
                          disabled={!selectedCompanyId}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue
                              placeholder={
                                !selectedCompanyId
                                  ? 'Please select a company.'
                                  : isBranchesLoading
                                  ? 'Loading branches...'
                                  : branches.length === 0
                                  ? 'No branches found'
                                  : 'Select Branch'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.length === 0 ? (
                              <div className="p-2 text-xs text-muted-foreground text-center">
                                No branches found for the selected company.
                              </div>
                            ) : (
                              branches.map((b) => (
                                <SelectItem key={b.id} value={b.id} className="text-xs">
                                  {b.name} ({b.code})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 2. Department & Cost Center Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Department Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Department *</Label>
                        <Select
                          value={selectedDeptId}
                          onValueChange={handleDepartmentChange}
                          disabled={!selectedBranchId}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue
                              placeholder={
                                !selectedCompanyId
                                  ? 'Please select a company.'
                                  : !selectedBranchId
                                  ? 'Please select a branch.'
                                  : isDepartmentsLoading
                                  ? 'Loading departments...'
                                  : departments.length === 0
                                  ? 'No departments found for the selected company and branch.'
                                  : 'Select Department'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.length === 0 ? (
                              <div className="p-2 text-xs text-muted-foreground text-center">
                                No departments found for the selected company and branch.
                              </div>
                            ) : (
                              departments.map((d) => (
                                <SelectItem key={d.id} value={d.id} className="text-xs">
                                  {d.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Cost Center Dropdown - Filtered by Company + Branch + Department */}
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Cost Center *</Label>
                        <Select
                          value={selectedCostCenterCode}
                          onValueChange={handleCostCenterChange}
                          disabled={!selectedDeptId}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue
                              placeholder={
                                !selectedCompanyId
                                  ? 'Please select a company.'
                                  : !selectedBranchId
                                  ? 'Please select a branch.'
                                  : !selectedDeptId
                                  ? 'Please select a department.'
                                  : isCostCentersLoading
                                  ? 'Loading cost centers...'
                                  : costCenters.length === 0
                                  ? 'No cost centers found for the selected company, branch and department.'
                                  : 'Select Cost Center'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {costCenters.length === 0 ? (
                              <div className="p-2 text-xs text-muted-foreground text-center">
                                No cost centers found for the selected company, branch and department.
                              </div>
                            ) : (
                              costCenters.map((cc: CostCenter) => (
                                <SelectItem key={cc.id} value={cc.code} className="text-xs">
                                  {cc.code} - {cc.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 3. Target Job Designation / Role - Searchable + Editable Single Combobox */}
                    <div className="space-y-1.5 relative" ref={designationComboboxRef}>
                      <Label className="font-semibold flex items-center justify-between">
                        <span>Target Job Designation / Role *</span>
                        {roleInput.trim() && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {selectedDesignationId && designations.some((d) => d.id === selectedDesignationId) ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 inline" /> Master Role Selected
                              </span>
                            ) : (
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3 inline" /> Custom Manual Role
                              </span>
                            )}
                          </span>
                        )}
                      </Label>

                      <div className="relative">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          <Search className="w-3.5 h-3.5" />
                        </div>

                        <Input
                          type="text"
                          placeholder={
                            !selectedDeptId
                              ? 'Please select a department first...'
                              : isDesignationsLoading
                              ? 'Loading designations...'
                              : 'Search or enter job role...'
                          }
                          value={roleInput}
                          disabled={!selectedDeptId}
                          onFocus={() => {
                            if (selectedDeptId) setIsDesignationDropdownOpen(true);
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRoleInput(val);
                            setIsDesignationDropdownOpen(true);

                            // Check if matching master designation exists
                            const exactMatch = designations.find(
                              (d) => d.title.trim().toLowerCase() === val.trim().toLowerCase()
                            );
                            if (exactMatch) {
                              setSelectedDesignationId(exactMatch.id);
                            } else {
                              setSelectedDesignationId('');
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setIsDesignationDropdownOpen(false);
                            }
                          }}
                          className="pl-8 pr-16 h-9 text-xs focus-visible:ring-1 bg-background"
                        />

                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                          {roleInput.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setRoleInput('');
                                setSelectedDesignationId('');
                              }}
                              title="Clear text"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!selectedDeptId}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              if (selectedDeptId) {
                                setIsDesignationDropdownOpen((prev) => !prev);
                              }
                            }}
                            title="Toggle dropdown"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDesignationDropdownOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {isDesignationDropdownOpen && selectedDeptId && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                          {/* Existing filtered master designations */}
                          {filteredDesignations.length > 0 ? (
                            <div className="p-1">
                              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground bg-muted/30 rounded mb-1">
                                Master Job Roles ({filteredDesignations.length})
                              </div>
                              {filteredDesignations.map((des: Designation) => {
                                const isSelected = selectedDesignationId === des.id || roleInput.trim().toLowerCase() === des.title.trim().toLowerCase();
                                return (
                                  <div
                                    key={des.id}
                                    onClick={() => handleDesignationSelect(des)}
                                    className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                                      isSelected
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>{des.title}</span>
                                      {des.code && <span className="text-[10px] text-muted-foreground">({des.code})</span>}
                                    </div>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 text-xs text-muted-foreground text-center">
                              No matching master job roles found.
                            </div>
                          )}

                          {/* Manual entry selection option */}
                          {roleInput.trim().length > 0 && (
                            <div className="border-t border-border p-1 bg-muted/20">
                              <div
                                onClick={() => setIsDesignationDropdownOpen(false)}
                                className="px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between bg-primary/5 hover:bg-primary/10 text-primary font-medium border border-primary/20 transition-colors"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">
                                    Use entered role: <strong className="font-semibold text-foreground">"{roleInput.trim()}"</strong>
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-background text-primary shrink-0 ml-2">
                                  Select
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. Budgeted & Active & Planned Hires Calculation */}
                    <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                      <div className="space-y-1">
                        <Label className="font-semibold text-[11px]">Budgeted Headcount *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formBudgeted}
                          onChange={(e) => setFormBudgeted(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-9 text-xs font-mono bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-[11px] text-muted-foreground flex items-center gap-1">
                          Current Active Staff
                          <span className="text-[9px] text-primary">(Auto)</span>
                        </Label>
                        <Input
                          type="number"
                          value={formActive}
                          readOnly
                          disabled
                          className="h-9 text-xs font-mono bg-muted text-muted-foreground font-bold cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-[11px] text-primary flex items-center gap-1">
                          Planned Hires
                          <span className="text-[9px] text-primary font-bold">(Auto)</span>
                        </Label>
                        <Input
                          type="number"
                          value={plannedHiresCount}
                          readOnly
                          disabled
                          className="h-9 text-xs font-mono bg-primary/10 text-primary font-bold cursor-not-allowed border-primary/30"
                        />
                      </div>
                    </div>

                    {/* Formula helper indicator */}
                    <div className="flex items-center gap-2 text-xs bg-primary/5 p-2 rounded-lg border border-primary/20 text-primary">
                      <Calculator className="h-4 w-4 shrink-0" />
                      <span className="font-medium">
                        Planned Hires = {formBudgeted} (Budgeted) - {formActive} (Active Staff) ={' '}
                        <strong className="font-bold underline">{plannedHiresCount} Planned Hires</strong>
                      </span>
                    </div>

                    {/* Target Hiring Quarter */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Target Hiring Quarter *</Label>
                      <Select value={formQuarter} onValueChange={setFormQuarter}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {HIRING_QUARTERS.map((q) => (
                            <SelectItem key={q} value={q} className="text-xs">
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hiring Reason / Justification */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Hiring Reason / Justification *</Label>
                      <Textarea
                        placeholder="Provide detailed justification for the manpower forecast..."
                        value={formReason}
                        onChange={(e) => setFormReason(e.target.value)}
                        className="text-xs min-h-[70px]"
                        rows={3}
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="text-xs font-semibold"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        Save Forecast Plan
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isPlansLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading manpower forecast plans...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Target Position Role</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Cost Center</TableHead>
                  <TableHead className="text-xs">Budgeted Headcount</TableHead>
                  <TableHead className="text-xs">Active Staff</TableHead>
                  <TableHead className="text-xs">Planned Hires</TableHead>
                  <TableHead className="text-xs">Hiring Quarter</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                      No manpower forecast plans found. Click "+ Add Forecast Plan" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((p, idx) => {
                    const codeLabel = p.code || `MP-0${idx + 1}`;
                    const isUnderStaffed = p.status === 'UNDER-STAFFED' || p.plannedHires > 0;
                    const isCapReached = p.status === 'CAP-REACHED' || p.plannedHires === 0;

                    return (
                      <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-primary">{codeLabel}</TableCell>
                        <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {p.role}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{p.departmentName}</TableCell>
                        <TableCell className="text-xs font-mono font-medium">{p.costCenter}</TableCell>
                        <TableCell className="text-xs font-mono font-semibold">{p.budgeted} Staff</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-emerald-600">{p.active} Staff</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-primary">
                          +{p.plannedHires} Hires
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{p.quarter}</TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              isCapReached
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : isUnderStaffed
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}
                          >
                            {isCapReached ? 'CAP-REACHED' : isUnderStaffed ? 'UNDER-STAFFED' : 'ON-TRACK'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.plannedHires > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10.5px] px-2.5 text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                                onClick={() => openRaiseMrModal(p)}
                              >
                                Raise MR <ArrowRight className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border text-[9.5px]">
                                CAP REACHED
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditModal(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePlan(p.id, p.role)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Independent Raise Manpower Requisition (MR) Dialog ── */}
      <Dialog open={isMrOpen} onOpenChange={setIsMrOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Create Manpower Requisition (MR)
              </span>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                Status: DRAFT / PENDING APPROVAL
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {raisingPlan && (
            <form className="space-y-5 text-xs pt-2" onSubmit={handleSubmitMr}>
              {/* Section 1: Manpower Requisition Details (Read-Only Auto-Filled Card) */}
              <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 space-y-2.5">
                <h4 className="font-semibold text-xs text-primary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> 1. Manpower Requisition Details (Auto-Filled & Locked)
                  </span>
                  <Badge variant="outline" className="bg-background text-[10px] text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                    <ShieldCheck className="h-3 w-3" /> Single Source of Truth
                  </Badge>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">MR Number (Auto)</Label>
                    <p className="font-mono font-bold text-xs text-primary mt-0.5">{mrNumber}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Manpower Plan Ref</Label>
                    <p className="font-mono font-bold text-xs text-foreground mt-0.5">{raisingPlan.code || 'MP-06'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Company (Locked)</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5 truncate flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                      {planCompany?.name || 'CODIGIX_A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Branch (Locked)</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5 truncate flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                      {planBranch?.name ? `${planBranch.name} (${planBranch.city || 'Nashik'})` : 'NASHIK DEVELOPMENT'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Department (Locked)</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{raisingPlan.departmentName}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Cost Center (Locked)</Label>
                    <p className="font-mono font-semibold text-xs text-foreground mt-0.5">{raisingPlan.costCenter}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Designation / Role (Locked)</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{raisingPlan.role}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Number of Openings (Available)</Label>
                    <div className="mt-0.5">
                      <Badge className="bg-primary/10 text-primary border-primary/30 font-mono font-bold text-xs">
                        {raisingPlan.plannedHires} Openings Auto-filled
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Hiring Requirements */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" /> 2. Hiring Requirements
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="font-semibold text-xs flex items-center justify-between">
                      <span>Experience Type *</span>
                    </Label>
                    <Select
                      value={mrExperienceLevel}
                      onValueChange={(val: 'Fresher' | 'Experienced') => {
                        setMrExperienceLevel(val);
                        if (val === 'Fresher') {
                          setMrExperience('0 - 1 Years');
                        } else {
                          setMrExperience('');
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-primary/5 font-semibold border-primary/30">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fresher" className="text-xs font-medium">
                          Fresher
                        </SelectItem>
                        <SelectItem value="Experienced" className="text-xs font-medium">
                          Experienced
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label className="font-semibold">Required Joining Date *</Label>
                    <Input
                      type="date"
                      value={mrJoiningDate}
                      onChange={(e) => setMrJoiningDate(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label className="font-semibold">Employment Type *</Label>
                    <Select value={mrEmploymentType} onValueChange={(val: any) => setMrEmploymentType(val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME" className="text-xs">Full Time</SelectItem>
                        <SelectItem value="PART_TIME" className="text-xs">Part Time</SelectItem>
                        <SelectItem value="CONTRACT" className="text-xs">Contract</SelectItem>
                        <SelectItem value="INTERN" className="text-xs">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label className="font-semibold">Priority *</Label>
                    <Select value={mrPriority} onValueChange={(val: any) => setMrPriority(val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW" className="text-xs">Low</SelectItem>
                        <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
                        <SelectItem value="HIGH" className="text-xs">High</SelectItem>
                        <SelectItem value="URGENT" className="text-xs">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs">Minimum Annual CTC (₹ Lakh) *</Label>
                      <span className="text-[10.5px] font-mono text-primary font-bold">
                        {formatSalaryInLakhs(mrMinSalaryLakh >= 1000 ? mrMinSalaryLakh : mrMinSalaryLakh * 100000)}
                      </span>
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={mrMinSalaryLakh || ''}
                      onChange={(e) => setMrMinSalaryLakh(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="e.g. 8"
                    />
                    <p className="text-[9.5px] text-muted-foreground">
                      Stored: ₹{(mrMinSalaryLakh >= 1000 ? mrMinSalaryLakh : Math.round(mrMinSalaryLakh * 100000)).toLocaleString('en-IN')} / year
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs">Maximum Annual CTC (₹ Lakh) *</Label>
                      <span className="text-[10.5px] font-mono text-primary font-bold">
                        {formatSalaryInLakhs(mrMaxSalaryLakh >= 1000 ? mrMaxSalaryLakh : mrMaxSalaryLakh * 100000)}
                      </span>
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={mrMaxSalaryLakh || ''}
                      onChange={(e) => setMrMaxSalaryLakh(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="e.g. 12"
                    />
                    <p className="text-[9.5px] text-muted-foreground">
                      Stored: ₹{(mrMaxSalaryLakh >= 1000 ? mrMaxSalaryLakh : Math.round(mrMaxSalaryLakh * 100000)).toLocaleString('en-IN')} / year
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Qualification *</Label>
                    <Input
                      type="text"
                      value={mrQualification}
                      onChange={(e) => setMrQualification(e.target.value)}
                      className="h-8 text-xs bg-background"
                      placeholder="e.g. B.Tech / M.Tech / MBA / Graduate / Diploma"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Required Experience *</Label>
                      {mrExperienceLevel === 'Fresher' && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3" /> Auto-locked for Freshers
                        </span>
                      )}
                    </div>

                    {mrExperienceLevel === 'Fresher' ? (
                      <Input
                        type="text"
                        readOnly
                        value="0 - 1 Years"
                        className="h-8 text-xs bg-muted/60 font-semibold cursor-not-allowed text-foreground"
                      />
                    ) : (
                      <Select value={mrExperience} onValueChange={setMrExperience}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select experience range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 - 3 Years" className="text-xs">1 - 3 Years</SelectItem>
                          <SelectItem value="3 - 5 Years" className="text-xs">3 - 5 Years</SelectItem>
                          <SelectItem value="5 - 8 Years" className="text-xs">5 - 8 Years</SelectItem>
                          <SelectItem value="8 - 12 Years" className="text-xs">8 - 12 Years</SelectItem>
                          <SelectItem value="12+ Years" className="text-xs">12+ Years</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Required Skills</Label>
                  <Input
                    type="text"
                    value={mrRequiredSkills}
                    onChange={(e) => setMrRequiredSkills(e.target.value)}
                    className="h-8 text-xs bg-background"
                    placeholder={mrExperienceLevel === 'Fresher' ? "e.g. Problem solving, Basic Programming, Quick Learner" : "e.g. React, Node.js, Cloud Architecture"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold flex items-center justify-between text-xs">
                      <span>Work Location *</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Branch Filtered)</span>
                    </Label>
                    <Select value={mrWorkLocation} onValueChange={setMrWorkLocation}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select work location" />
                      </SelectTrigger>
                      <SelectContent>
                        {mrBranches.length > 0 ? (
                          mrBranches.map((b: Branch) => (
                            <SelectItem key={b.id} value={`${b.name} (${b.city || 'Nashik'})`} className="text-xs font-medium">
                              {b.name} ({b.city || 'Nashik'})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem
                            value={planBranch?.name ? `${planBranch.name} (${planBranch.city || 'Nashik'})` : 'NASHIK DEVELOPMENT (Nashik)'}
                            className="text-xs font-medium"
                          >
                            {planBranch?.name ? `${planBranch.name} (${planBranch.city || 'Nashik'})` : 'NASHIK DEVELOPMENT (Nashik)'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold flex items-center justify-between text-xs">
                      <span>Reporting Manager *</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Dept Filtered)</span>
                    </Label>
                    <Select value={mrReportingManagerId} onValueChange={setMrReportingManagerId}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select reporting manager" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {mrReportingManagers.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            No active employees found for the selected company, branch and department.
                          </div>
                        ) : (
                          mrReportingManagers.map((emp: any) => {
                            const empDesignation = emp.designationTitle || emp.designation?.title || emp.role || 'Lead / Manager';
                            return (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium">
                                {emp.firstName} {emp.lastName} ({empDesignation})
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 3: Justification */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <FileText className="h-3.5 w-3.5 text-primary" /> 3. Justification & Comments
                </h4>

                <div className="space-y-1">
                  <Label className="font-semibold">Hiring Reason / Justification *</Label>
                  <Textarea
                    value={mrReason}
                    onChange={(e) => setMrReason(e.target.value)}
                    className="text-xs min-h-[60px]"
                    rows={2}
                    placeholder="Provide a detailed hiring reason / justification for this requisition..."
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Additional Comments</Label>
                  <Textarea
                    value={mrComments}
                    onChange={(e) => setMrComments(e.target.value)}
                    className="text-xs min-h-[50px]"
                    rows={2}
                    placeholder="Any special instructions or hiring budget notes..."
                  />
                </div>
              </div>

              {/* Section 4: Request Information Footer */}
              <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] text-muted-foreground">Requestor Name: <strong className="text-foreground">{mrRequestorName}</strong></p>
                  <p className="text-[10.5px] text-muted-foreground">Request Date: <strong className="text-foreground">{new Date().toISOString().split('T')[0]}</strong></p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                  Target Status: PENDING_APPROVAL
                </Badge>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsMrOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold gap-1.5"
                  disabled={submitMrMutation.isPending}
                >
                  <Send className="h-3.5 w-3.5" /> Submit MR
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
