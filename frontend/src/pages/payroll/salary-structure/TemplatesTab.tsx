import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Factory,
  ShoppingBag,
  Stethoscope,
  Laptop,
  ArrowRight,
  TrendingUp,
  Percent,
  Calculator,
  Sliders,
  Eye,
  Info,
  Trash2,
  Edit2,
  Search,
  Lock,
  Briefcase,
  Users,
  ChevronRight,
  ChevronDown,
  Award,
  Building,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { payGradesApi } from '@/api/cost-grades';
import { designationsApi, departmentsApi, branchesApi } from '@/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCompany } from '@/context/CompanyContext';
import { salaryTemplatesApi } from '@/api/payroll';
import type { StructureTemplate, SalaryComponentItem } from './mock-data';
import { calculateSalaryBreakdown } from './formula-engine';

interface TemplatesTabProps {
  templates: StructureTemplate[];
  components: SalaryComponentItem[];
  onUpdateTemplates: (templates: StructureTemplate[]) => void;
  companyId?: string;
}

export function TemplatesTab({ templates, components, onUpdateTemplates, companyId }: TemplatesTabProps) {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<StructureTemplate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Live Simulator CTC input
  const [simulatedAnnualCtc, setSimulatedAnnualCtc] = useState<number>(1200000);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const { activeCompanyId } = useCompany();
  const effectiveCompanyId = activeCompanyId || companyId;

  // Master Organization Data Queries - strictly scoped to active selected company
  const { data: apiBranches = [] } = useQuery({
    queryKey: ['branches', effectiveCompanyId],
    queryFn: () => branchesApi.list(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
  });

  const { data: apiDepartments = [] } = useQuery({
    queryKey: ['departments', effectiveCompanyId],
    queryFn: () => departmentsApi.list(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
  });

  const { data: apiPayGrades = [] } = useQuery({
    queryKey: ['pay-grades', effectiveCompanyId],
    queryFn: () => payGradesApi.list(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
  });

  const { data: apiDesignations = [] } = useQuery({
    queryKey: ['designations', effectiveCompanyId],
    queryFn: () => designationsApi.list(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
  });

  const availableBranches = useMemo(() => {
    if (apiBranches && Array.isArray(apiBranches) && apiBranches.length > 0) {
      return apiBranches.filter((b: any) => !b.companyId || !effectiveCompanyId || b.companyId === effectiveCompanyId);
    }
    return [];
  }, [apiBranches, effectiveCompanyId]);

  const availableDepartments = useMemo(() => {
    if (apiDepartments && Array.isArray(apiDepartments) && apiDepartments.length > 0) {
      return apiDepartments.filter((d: any) => !d.companyId || !effectiveCompanyId || d.companyId === effectiveCompanyId);
    }
    return [];
  }, [apiDepartments, effectiveCompanyId]);

  const availablePayGrades = useMemo(() => {
    if (apiPayGrades && Array.isArray(apiPayGrades) && apiPayGrades.length > 0) {
      return apiPayGrades.filter((g: any) => !g.companyId || !effectiveCompanyId || g.companyId === effectiveCompanyId);
    }
    return [];
  }, [apiPayGrades, effectiveCompanyId]);

  const availableDesignations = useMemo(() => {
    if (apiDesignations && Array.isArray(apiDesignations) && apiDesignations.length > 0) {
      return apiDesignations.filter((d: any) => !d.companyId || !effectiveCompanyId || d.companyId === effectiveCompanyId);
    }
    return [];
  }, [apiDesignations, effectiveCompanyId]);

  // Create / Edit Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StructureTemplate | null>(null);
  const [componentSearch, setComponentSearch] = useState<string>('');
  const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState<boolean>(false);

  // Template Form State: Aligned to 4-step Hierarchy (Branch -> Department -> Designation -> Level / Grade)
  const [formData, setFormData] = useState<Partial<StructureTemplate>>({
    name: '',
    code: '',
    branchId: 'ALL',
    branchName: 'All Branches',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Technology',
    designationId: 'des-eng-3',
    designationTitle: 'Senior Software Engineer',
    level: 'L3',
    gradeCode: 'G3',
    gradeName: 'Senior Software Engineer / Specialist',
    gradeId: 'grade-g3',
    employmentType: 'PERMANENT',
    category: 'Corporate & Tech',
    industry: 'IT',
    description: '',
    balancingComponentCode: 'SPECIAL_ALLOW',
    version: 1,
    minCtc: 600000,
    maxCtc: 1500000,
    items: [],
  });

  // Helper to ensure CTC is represented as annual amount (if database has monthly numbers < 100,000, multiply by 12)
  const toAnnualCtc = (val: number | string | null | undefined): number => {
    if (!val) return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    return num < 100000 ? Math.round(num * 12) : Math.round(num);
  };

  // Helper to generate concise abbreviation without raw database prefixes
  const getCleanShortCode = (text: string, maxLen = 4): string => {
    if (!text) return 'ROLE';
    const stripped = text.replace(/^(DEPT|DESG|BR)[-_0-9A-Z]*/i, '').trim();
    const words = (stripped || text).split(/[\s_&/\\-]+/).filter(Boolean);
    if (words.length >= 2) {
      return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
    }
    return (stripped || text).replace(/[^A-Za-z0-9]/g, '').substring(0, maxLen).toUpperCase() || 'ROLE';
  };

  // Step 1 -> Step 2: Filter departments strictly by selected branch (or HEAD_OFFICE)
  const filteredDepartmentsForBranch = useMemo(() => {
    const branchId = formData.branchId;
    if (!branchId || branchId === 'ALL') {
      return availableDepartments;
    }
    if (branchId === 'HEAD_OFFICE') {
      return availableDepartments.filter((d: any) => !d.branchId || d.branchId === 'HEAD_OFFICE');
    }
    // Strict branch filtering: only departments belonging to the selected branch
    return availableDepartments.filter(
      (d: any) => d.branchId === branchId || d.branch?.id === branchId
    );
  }, [availableDepartments, formData.branchId]);

  // Step 2 -> Step 3: Filter designations strictly by currently selected department
  const filteredDesignationsForDepartment = useMemo(() => {
    const deptId = formData.departmentId;
    if (!deptId) return [];

    const deptObj = availableDepartments.find((d: any) => d.id === deptId || d.code === deptId);
    const deptName = deptObj?.name?.trim().toLowerCase() || '';
    const deptCode = deptObj?.code?.trim().toLowerCase() || '';

    const matches = availableDesignations.filter((d: any) => {
      // 1. Direct ID match
      if (d.departmentId && d.departmentId === deptId) return true;
      if (d.department?.id && d.department.id === deptId) return true;
      // 2. Department code match
      if (deptCode && d.department?.code && d.department.code.trim().toLowerCase() === deptCode) return true;
      // 3. Department name match
      if (deptName) {
        if (typeof d.department === 'string' && d.department.trim().toLowerCase() === deptName) return true;
        if (d.department?.name && d.department.name.trim().toLowerCase() === deptName) return true;
      }
      return false;
    });

    return matches; // Strict: Never fallback to all designations!
  }, [availableDesignations, availableDepartments, formData.departmentId]);

  // Helper to compute levels belonging strictly to a particular designation (Step 2 -> Step 3)
  const getLevelsForDesignation = (matchedDesig: any, deptId?: string) => {
    if (!matchedDesig) return [];

    const desigTitle = (matchedDesig.title || '').trim().toLowerCase();
    const desigCode = (matchedDesig.code || '').trim().toLowerCase();
    const desigGradeCode = (matchedDesig.gradeCode || matchedDesig.grade || '').trim().toLowerCase();
    const desigLevel = (matchedDesig.level || '').trim().toUpperCase();

    // 1. Direct matches in availablePayGrades
    const directMatches = availablePayGrades.filter((g: any) => {
      // 1a. Direct FK match
      if (matchedDesig.gradeId && (g.id === matchedDesig.gradeId || g.gradeCode === matchedDesig.gradeId)) return true;
      if (matchedDesig.payGrade?.id && g.id === matchedDesig.payGrade.id) return true;
      // 1b. Direct gradeCode / grade text match
      if (desigGradeCode && (g.gradeCode.trim().toLowerCase() === desigGradeCode || g.id === desigGradeCode)) return true;
      // 1c. PayGrade gradeName matches designation title (e.g. "Hospital Administrator", "Ward Boy", "nurse")
      if (g.gradeName && desigTitle && g.gradeName.trim().toLowerCase() === desigTitle) return true;
      // 1d. PayGrade in same department whose gradeName contains designation title or vice versa
      if (deptId && (g.departmentId === deptId || g.department?.id === deptId)) {
        const gName = (g.gradeName || '').toLowerCase();
        if (desigTitle && (gName.includes(desigTitle) || desigTitle.includes(gName))) return true;
      }
      return false;
    });

    if (directMatches.length > 0) {
      return directMatches;
    }

    // 2. If designation has a designated level (e.g. "L1", "L4", "L6") or grade code text:
    if (desigLevel) {
      const levelMatches = availablePayGrades.filter(
        (g: any) => g.level && g.level.toUpperCase() === desigLevel
      );
      if (levelMatches.length > 0) return levelMatches;
    }

    // 3. If payGrades exist specifically in this same department
    if (deptId) {
      const deptGrades = availablePayGrades.filter(
        (g: any) => g.departmentId === deptId || g.department?.id === deptId
      );
      if (deptGrades.length > 0) return deptGrades;
    }

    // 4. Default structured career levels tailored for this specific role
    const codePrefix = matchedDesig.code ? matchedDesig.code.replace(/[^A-Za-z0-9]/g, '').substring(0, 5).toUpperCase() : 'ROLE';
    return [
      {
        id: `lvl-${matchedDesig.id}-l1`,
        gradeCode: `${codePrefix}-L1`,
        gradeName: `${matchedDesig.title} (Junior / Level 1)`,
        level: 'L1',
        category: 'Junior & Entry',
        minSalary: 250000,
        maxSalary: 450000,
      },
      {
        id: `lvl-${matchedDesig.id}-l2`,
        gradeCode: `${codePrefix}-L2`,
        gradeName: `${matchedDesig.title} (Associate / Level 2)`,
        level: 'L2',
        category: 'Associate',
        minSalary: 400000,
        maxSalary: 750000,
      },
      {
        id: `lvl-${matchedDesig.id}-l3`,
        gradeCode: `${codePrefix}-L3`,
        gradeName: `${matchedDesig.title} (Senior / Level 3)`,
        level: 'L3',
        category: 'Senior Professional',
        minSalary: 600000,
        maxSalary: 1200000,
      },
      {
        id: `lvl-${matchedDesig.id}-l4`,
        gradeCode: `${codePrefix}-L4`,
        gradeName: `${matchedDesig.title} (Lead / Level 4)`,
        level: 'L4',
        category: 'Lead Specialist',
        minSalary: 1000000,
        maxSalary: 1800000,
      },
      {
        id: `lvl-${matchedDesig.id}-l5`,
        gradeCode: `${codePrefix}-L5`,
        gradeName: `${matchedDesig.title} (Principal / Level 5)`,
        level: 'L5',
        category: 'Executive & Leadership',
        minSalary: 1600000,
        maxSalary: 3000000,
      },
    ];
  };

  // Filter levels strictly belonging to the currently selected designation (Step 2 -> Step 3)
  const filteredLevelsForDesignation = useMemo(() => {
    const desigId = formData.designationId;
    if (!desigId || desigId === 'NONE') return [];
    const matchedDesig = availableDesignations.find((d: any) => d.id === desigId);
    if (!matchedDesig) return [];
    return getLevelsForDesignation(matchedDesig, formData.departmentId);
  }, [availableDesignations, availablePayGrades, formData.designationId, formData.departmentId]);

  // ── 4-STEP HIERARCHY SELECTION HANDLERS ──

  // STEP 1: Branch Selection Handler
  const handleSelectBranch = (branchId: string) => {
    let branchName = 'All Branches';
    if (branchId === 'HEAD_OFFICE') {
      branchName = 'Corporate / Head Office';
    } else if (branchId !== 'ALL') {
      const branchObj = availableBranches.find((b: any) => b.id === branchId);
      branchName = branchObj ? branchObj.name : 'Branch';
    }

    const depts =
      branchId === 'ALL'
        ? availableDepartments
        : branchId === 'HEAD_OFFICE'
          ? availableDepartments.filter((d: any) => !d.branchId || d.branchId === 'HEAD_OFFICE')
          : availableDepartments.filter((d: any) => d.branchId === branchId || d.branch?.id === branchId);

    const firstDept =
      depts.find((d: any) =>
        availableDesignations.some(
          (des: any) =>
            des.departmentId === d.id ||
            des.department?.id === d.id ||
            (typeof des.department === 'string' && des.department.trim().toLowerCase() === d.name.trim().toLowerCase()) ||
            (des.department?.name && des.department.name.trim().toLowerCase() === d.name.trim().toLowerCase())
        )
      ) ||
      depts[0] ||
      null;

    if (firstDept) {
      handleSelectDepartment(firstDept.id, branchId, branchName);
    } else {
      setFormData((prev) => ({
        ...prev,
        branchId,
        branchName,
        departmentId: '',
        departmentName: '',
        designationId: '',
        designationTitle: '',
        gradeCode: '',
        gradeName: '',
        gradeId: '',
        level: '',
        name: '',
        code: '',
        minCtc: 300000,
        maxCtc: 1200000,
      }));
    }
  };

  // STEP 2: Department Selection Handler
  const handleSelectDepartment = (deptId: string, overrideBranchId?: string, overrideBranchName?: string) => {
    const matchedDept = availableDepartments.find((d: any) => d.id === deptId || d.code === deptId);
    if (!matchedDept) return;

    const deptName = matchedDept.name?.trim() || '';

    const matchingDesigs = availableDesignations.filter((d: any) => {
      if (d.departmentId && d.departmentId === matchedDept.id) return true;
      if (d.department?.id && d.department.id === matchedDept.id) return true;
      if (typeof d.department === 'string' && d.department.trim().toLowerCase() === deptName.toLowerCase()) return true;
      if (d.department?.name && d.department.name.trim().toLowerCase() === deptName.toLowerCase()) return true;
      return false;
    });

    const branchId = overrideBranchId !== undefined ? overrideBranchId : (formData.branchId || 'ALL');
    const branchName = overrideBranchName !== undefined ? overrideBranchName : (formData.branchName || 'All Branches');

    if (matchingDesigs.length > 0) {
      const firstDesig = matchingDesigs[0];
      const levels = getLevelsForDesignation(firstDesig, matchedDept.id);
      const cleanDeptShort = getCleanShortCode(deptName, 4);
      const cleanDesigShort = getCleanShortCode(firstDesig.title, 4);

      let overallMin = 240000;
      let overallMax = 1500000;
      if (levels.length > 0) {
        const mins = levels.map((l: any) => toAnnualCtc(l.minSalary)).filter(Boolean);
        const maxs = levels.map((l: any) => toAnnualCtc(l.maxSalary)).filter(Boolean);
        if (mins.length > 0) overallMin = Math.min(...mins);
        if (maxs.length > 0) overallMax = Math.max(...maxs);
      }

      setFormData((prev) => {
        const isCreate = !editingTemplate;
        return {
          ...prev,
          branchId,
          branchName,
          departmentId: matchedDept.id,
          departmentName: deptName,
          designationId: firstDesig.id,
          designationTitle: firstDesig.title,
          gradeCode: 'ALL',
          gradeName: 'All Seniority Levels',
          gradeId: 'ALL_LEVELS',
          level: 'ALL',
          category: levels[0]?.category || prev.category || 'Corporate & Tech',
          minCtc: overallMin || prev.minCtc,
          maxCtc: overallMax || prev.maxCtc,
          name: isCreate ? `${deptName} - ${firstDesig.title} Template` : prev.name,
          code: isCreate ? `${cleanDeptShort}-${cleanDesigShort}-CTC` : prev.code,
        };
      });
    } else {
      const cleanDeptShort = getCleanShortCode(deptName, 4);
      setFormData((prev) => {
        const isCreate = !editingTemplate;
        return {
          ...prev,
          branchId,
          branchName,
          departmentId: matchedDept.id,
          departmentName: deptName,
          designationId: '',
          designationTitle: '',
          gradeCode: '',
          gradeName: '',
          gradeId: '',
          level: '',
          name: isCreate ? `${deptName} Template` : prev.name,
          code: isCreate ? `${cleanDeptShort}-CTC` : prev.code,
          minCtc: 300000,
          maxCtc: 1200000,
        };
      });
    }
  };

  // STEP 3: Designation Selection Handler (Under the selected Department)
  const handleSelectDesignation = (desigId: string) => {
    if (!desigId || desigId === 'NONE') return;
    const matchedDesig = availableDesignations.find((d: any) => d.id === desigId);
    if (!matchedDesig) return;

    const levels = getLevelsForDesignation(matchedDesig, formData.departmentId);
    const deptName = formData.departmentName || 'Department';

    const cleanDeptShort = getCleanShortCode(deptName, 4);
    const cleanDesigShort = getCleanShortCode(matchedDesig.title, 4);

    // Calculate full grade band covering all levels for this role
    let overallMin = 240000;
    let overallMax = 1500000;
    if (levels.length > 0) {
      const mins = levels.map((l: any) => toAnnualCtc(l.minSalary)).filter(Boolean);
      const maxs = levels.map((l: any) => toAnnualCtc(l.maxSalary)).filter(Boolean);
      if (mins.length > 0) overallMin = Math.min(...mins);
      if (maxs.length > 0) overallMax = Math.max(...maxs);
    }

    setFormData((prev) => {
      const isCreate = !editingTemplate;
      return {
        ...prev,
        designationId: matchedDesig.id,
        designationTitle: matchedDesig.title,
        gradeCode: 'ALL',
        gradeName: 'All Seniority Levels',
        gradeId: 'ALL_LEVELS',
        level: 'ALL',
        category: levels[0]?.category || prev.category || 'Corporate & Tech',
        minCtc: overallMin || prev.minCtc,
        maxCtc: overallMax || prev.maxCtc,
        name: isCreate ? `${deptName} - ${matchedDesig.title} Template` : prev.name,
        code: isCreate ? `${cleanDeptShort}-${cleanDesigShort}-CTC` : prev.code,
      };
    });
  };

  // STEP 4: Level / Pay Grade Selection Handler (Under the selected Designation)
  const handleSelectLevelGrade = (gradeCodeOrId: string) => {
    const deptName = formData.departmentName || 'Department';
    const desigTitle = formData.designationTitle || 'Role';
    const cleanDeptShort = getCleanShortCode(deptName, 4);
    const cleanDesigShort = getCleanShortCode(desigTitle, 4);

    if (gradeCodeOrId === 'ALL_LEVELS' || gradeCodeOrId === 'ALL') {
      let overallMin = 240000;
      let overallMax = 1500000;
      if (filteredLevelsForDesignation.length > 0) {
        const mins = filteredLevelsForDesignation.map((l: any) => toAnnualCtc(l.minSalary)).filter(Boolean);
        const maxs = filteredLevelsForDesignation.map((l: any) => toAnnualCtc(l.maxSalary)).filter(Boolean);
        if (mins.length > 0) overallMin = Math.min(...mins);
        if (maxs.length > 0) overallMax = Math.max(...maxs);
      }
      setFormData((prev) => {
        const isCreate = !editingTemplate;
        return {
          ...prev,
          gradeCode: 'ALL',
          gradeName: 'All Seniority Levels',
          gradeId: 'ALL_LEVELS',
          level: 'ALL',
          minCtc: overallMin,
          maxCtc: overallMax,
          name: isCreate ? `${deptName} - ${desigTitle} Template` : prev.name,
          code: isCreate ? `${cleanDeptShort}-${cleanDesigShort}-CTC` : prev.code,
        };
      });
      return;
    }

    const matchedGrade =
      filteredLevelsForDesignation.find((g: any) => g.id === gradeCodeOrId || g.gradeCode === gradeCodeOrId) ||
      availablePayGrades.find((g: any) => g.id === gradeCodeOrId || g.gradeCode === gradeCodeOrId);

    if (!matchedGrade) return;

    const level = matchedGrade.level || matchedGrade.gradeCode || 'L1';
    const annualMin = toAnnualCtc(matchedGrade.minSalary);
    const annualMax = toAnnualCtc(matchedGrade.maxSalary);

    setFormData((prev) => {
      const isCreate = !editingTemplate;
      return {
        ...prev,
        gradeCode: matchedGrade.gradeCode,
        gradeName: typeof matchedGrade.gradeName === 'string' ? matchedGrade.gradeName : desigTitle,
        gradeId: matchedGrade.id,
        level: level,
        category: matchedGrade.category || prev.category || 'Corporate & Tech',
        minCtc: annualMin || prev.minCtc,
        maxCtc: annualMax || prev.maxCtc,
        name: isCreate ? `${deptName} - ${desigTitle} (Level ${level}) Template` : prev.name,
        code: isCreate ? `${cleanDeptShort}-${cleanDesigShort}-${level}-CTC` : prev.code,
      };
    });
  };

  // All master components for template dropdown: shows available components first, with already-added ones disabled & clearly badged
  const masterComponentOptions = useMemo(() => {
    const currentCodes = new Set((formData.items || []).map((i) => i.componentCode));

    // Sort unadded components first (alphabetical), then already added components at the bottom
    const sorted = [...components].sort((a, b) => {
      const aAdded = currentCodes.has(a.code) ? 1 : 0;
      const bAdded = currentCodes.has(b.code) ? 1 : 0;
      if (aAdded !== bAdded) return aAdded - bAdded;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((c) => {
      const isAlreadyAdded = currentCodes.has(c.code);
      return {
        value: c.code,
        label: c.name,
        sublabel: isAlreadyAdded
          ? '✓ Already added in this template'
          : `${c.type === 'EARNING' ? 'Earning' : c.type === 'DEDUCTION' ? 'Deduction' : 'Employer Cost'} • ${c.calculationType || 'FIXED'}`,
        badge: isAlreadyAdded ? 'Added' : c.code,
        disabled: isAlreadyAdded,
        icon: (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              isAlreadyAdded
                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                : c.type === 'EARNING'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60'
                  : c.type === 'DEDUCTION'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60'
            }`}
          >
            {c.type === 'EARNING' ? 'EARN' : c.type === 'DEDUCTION' ? 'DEDU' : 'COST'}
          </span>
        ),
      };
    });
  }, [components, formData.items]);

  // Helper to build the universal industry-standard salary component structure
  // compliant with Indian Code on Wages (50% Basic), HRA (40% Basic), Conveyance, Special Balancing,
  // Employee PF (12% of Basic), Professional Tax (₹200/mo), and Employee ESI (0.75% of Gross)
  const getDefaultUniversalPack = (allComponents: SalaryComponentItem[]) => {
    const findComp = (codes: string[]) => {
      const upperCodes = codes.map((c) => c.toUpperCase());
      return allComponents.find((c) => upperCodes.includes((c.code || '').toUpperCase()));
    };

    const basicComp = findComp(['BASIC']);
    const hraComp = findComp(['HRA']);
    const convComp = findComp(['CONVEYANCE', 'CONV']);
    const specialComp = findComp(['SPECIAL', 'SPECIAL_ALLOW', 'SPL_ALLOW']);
    const pfComp = findComp(['PF', 'PF_EE', 'EPF']);
    const ptComp = findComp(['PT', 'PROF_TAX']);
    const esiComp = findComp(['ESI', 'ESI_EE', 'ESIC']);
    const pfErComp = findComp(['PF_ER', 'EPF_ER']);

    const pack: any[] = [];
    let order = 1;

    // 1. Basic Salary (50% of CTC - Mandatory Indian Labour Code compliance)
    if (basicComp) {
      pack.push({
        salaryComponentId: basicComp.id,
        componentCode: basicComp.code,
        componentName: basicComp.name || 'Basic Salary',
        type: 'EARNING' as const,
        calculationType: 'PERCENTAGE',
        calculationValue: 50,
        calculationBase: 'CTC',
        order: order++,
      });
    }

    // 2. House Rent Allowance (40% of Basic - Standard Income Tax Section 10(13A) Exemption)
    if (hraComp) {
      pack.push({
        salaryComponentId: hraComp.id,
        componentCode: hraComp.code,
        componentName: hraComp.name || 'House Rent Allowance',
        type: 'EARNING' as const,
        calculationType: 'PERCENTAGE',
        calculationValue: 40,
        calculationBase: 'BASIC',
        order: order++,
      });
    }

    // 3. Conveyance Allowance (Fixed ₹1,600 / mo - Standard transport allowance across all industries)
    if (convComp) {
      pack.push({
        salaryComponentId: convComp.id,
        componentCode: convComp.code,
        componentName: convComp.name || 'Conveyance Allowance',
        type: 'EARNING' as const,
        calculationType: 'FIXED',
        calculationValue: convComp.calculationValue || 1600,
        calculationBase: 'NONE',
        order: order++,
      });
    }

    // 4. Special Allowance (Residual Balancing Figure - Auto absorbs remaining CTC)
    if (specialComp) {
      pack.push({
        salaryComponentId: specialComp.id,
        componentCode: specialComp.code,
        componentName: specialComp.name || 'Special Allowance',
        type: 'EARNING' as const,
        calculationType: 'BALANCING',
        calculationValue: 0,
        isBalancing: true,
        order: order++,
      });
    }

    // 5. Employee PF (12% of Basic - EPFO statutory employee deduction)
    if (pfComp) {
      pack.push({
        salaryComponentId: pfComp.id,
        componentCode: pfComp.code,
        componentName: pfComp.name || 'Employee PF',
        type: 'DEDUCTION' as const,
        calculationType: 'PERCENTAGE',
        calculationValue: 12,
        calculationBase: 'BASIC',
        order: order++,
      });
    }

    // 6. Professional Tax (Fixed ₹200 / mo - State statutory slab)
    if (ptComp) {
      pack.push({
        salaryComponentId: ptComp.id,
        componentCode: ptComp.code,
        componentName: ptComp.name || 'Professional Tax',
        type: 'DEDUCTION' as const,
        calculationType: 'FIXED',
        calculationValue: 200,
        calculationBase: 'NONE',
        order: order++,
      });
    }

    // 7. Employee ESI (0.75% of Gross - ESIC statutory deduction for gross <= 21k)
    if (esiComp) {
      pack.push({
        salaryComponentId: esiComp.id,
        componentCode: esiComp.code,
        componentName: esiComp.name || 'Employee ESI',
        type: 'DEDUCTION' as const,
        calculationType: 'PERCENTAGE',
        calculationValue: 0.75,
        calculationBase: 'GROSS',
        order: order++,
      });
    }

    // 8. Employer PF (12% of Basic - Company statutory contribution in CTC)
    if (pfErComp) {
      pack.push({
        salaryComponentId: pfErComp.id,
        componentCode: pfErComp.code,
        componentName: pfErComp.name || 'Provident Fund (Employer)',
        type: 'EMPLOYER_CONTRIBUTION' as const,
        calculationType: 'PERCENTAGE',
        calculationValue: 12,
        calculationBase: 'BASIC',
        order: order++,
      });
    }

    return {
      pack,
      balancingCode: specialComp?.code || 'SPECIAL',
    };
  };

  const handleSelectAndAddComponent = (master: SalaryComponentItem) => {
    const currentItems = formData.items || [];
    const isBalancing =
      master.calculationType === 'BALANCING' ||
      master.code === 'SPECIAL_ALLOW' ||
      master.code === 'SPECIAL';

    // Inherit directly from master component rule
    const newItem = {
      salaryComponentId: master.id,
      componentCode: master.code,
      componentName: master.name,
      type: master.type as any,
      calculationType: master.calculationType || 'FIXED',
      calculationValue: master.calculationValue,
      calculationBase: (master as any).calculationBase || (master.code === 'HRA' ? 'BASIC' : 'CTC'),
      formula: master.formula,
      isBalancing,
      order: currentItems.length + 1,
    };

    const newItems = [...currentItems, newItem];
    const newBalancing =
      formData.balancingComponentCode && formData.balancingComponentCode !== ''
        ? formData.balancingComponentCode
        : isBalancing
          ? master.code
          : 'SPECIAL';

    setFormData({
      ...formData,
      balancingComponentCode: newBalancing,
      items: newItems,
    });
    setComponentSearch('');
    setIsComponentDropdownOpen(false);
    toast.success(`Added "${master.name}" with its master rule`);
  };

  const getComponentRuleDisplay = (item: any) => {
    const master = components.find((c) => c.code === item.componentCode);
    if (
      item.componentCode === 'SPECIAL_ALLOW' ||
      item.componentCode === 'SPECIAL' ||
      item.isBalancing ||
      item.calculationType === 'BALANCING'
    ) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
          <Sparkles className="h-3 w-3" /> Residual Balancing Figure
        </span>
      );
    }
    const calculationType = item.calculationType || master?.calculationType;
    if (calculationType === 'PERCENTAGE') {
      const val = item.calculationValue ?? master?.calculationValue ?? 50;
      const base = item.calculationBase ?? (master as any)?.calculationBase ?? 'CTC';
      return (
        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
          {val}% of {base}
        </span>
      );
    }
    if (calculationType === 'FIXED') {
      const val = item.calculationValue ?? master?.calculationValue ?? 0;
      return (
        <span className="font-mono font-semibold text-foreground">
          Fixed ₹{val.toLocaleString('en-IN')}
        </span>
      );
    }
    if (calculationType === 'FORMULA') {
      return (
        <span className="font-mono text-muted-foreground text-[11px]">
          {master?.calculationRule || master?.formula || 'Statutory Formula'}
        </span>
      );
    }
    return <span className="text-muted-foreground text-xs">Standard Master Rule</span>;
  };

  const handleAddDefaultCompliantPack = () => {
    const { pack, balancingCode } = getDefaultUniversalPack(components);
    setFormData((prev) => ({
      ...prev,
      balancingComponentCode: balancingCode,
      items: pack,
    }));
    toast.success('Loaded universal components (Basic, HRA, Conveyance, Special, Employee PF, PT, ESI, Employer PF)');
  };

  const handleRemoveComponentFromTemplate = (code: string) => {
    const currentItems = formData.items || [];
    const remaining = currentItems.filter((i) => i.componentCode !== code);
    setFormData({
      ...formData,
      balancingComponentCode:
        formData.balancingComponentCode === code
          ? remaining.find((i) => i.isBalancing)?.componentCode || remaining[0]?.componentCode || ''
          : formData.balancingComponentCode,
      items: remaining,
    });
  };

  const handleUpdateItemInTemplate = (index: number, updates: any) => {
    const currentItems = [...(formData.items || [])];
    currentItems[index] = { ...currentItems[index], ...updates };
    setFormData({
      ...formData,
      items: currentItems,
    });
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.gradeCode && tpl.gradeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tpl.category && tpl.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' ||
        (tpl.industry && tpl.industry.toUpperCase() === categoryFilter.toUpperCase()) ||
        (tpl.category && tpl.category.toLowerCase().includes(categoryFilter.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  // Calculate live breakdown for simulated CTC in modal
  const liveBreakdown = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.items) return null;
    return calculateSalaryBreakdown({
      annualCtc: simulatedAnnualCtc,
      templateItems: selectedTemplate.items,
    });
  }, [selectedTemplate, simulatedAnnualCtc]);

  const handleOpenDetailModal = (tpl: StructureTemplate) => {
    setSelectedTemplate(tpl);
    const mid = Math.round((tpl.minCtc + tpl.maxCtc) / 2 / 50000) * 50000;
    setSimulatedAnnualCtc(mid);
    setIsDetailModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setComponentSearch('');
    setIsComponentDropdownOpen(false);

    // Default to Corporate / Head Office so user immediately sees real hierarchy
    const branchId = 'HEAD_OFFICE';
    const branchName = 'Corporate / Head Office';

    const branchDepts = availableDepartments.filter((d: any) => !d.branchId || d.branchId === 'HEAD_OFFICE');
    const deptsToSearch = branchDepts.length > 0 ? branchDepts : availableDepartments;

    // Pick first department in this branch that actually has designations configured
    const defaultDept =
      deptsToSearch.find((d: any) => {
        const matches = availableDesignations.filter(
          (des: any) =>
            des.departmentId === d.id ||
            des.department?.id === d.id ||
            (typeof des.department === 'string' && des.department.trim().toLowerCase() === d.name.trim().toLowerCase()) ||
            (des.department?.name && des.department.name.trim().toLowerCase() === d.name.trim().toLowerCase())
        );
        return matches.length > 0;
      }) ||
      deptsToSearch[0] ||
      null;

    const deptDesigs = defaultDept
      ? availableDesignations.filter(
          (d: any) =>
            d.departmentId === defaultDept.id ||
            d.department?.id === defaultDept.id ||
            (d.department &&
              (typeof d.department === 'string'
                ? d.department.trim().toLowerCase() === defaultDept.name.trim().toLowerCase()
                : d.department.name?.trim().toLowerCase() === defaultDept.name.trim().toLowerCase()))
        )
      : [];

    const defaultDesig = deptDesigs[0] || null;
    const levels = defaultDesig && defaultDept ? getLevelsForDesignation(defaultDesig, defaultDept.id) : [];
    const cleanDeptShort = defaultDept ? getCleanShortCode(defaultDept.name, 4) : 'DEPT';
    const cleanDesigShort = defaultDesig ? getCleanShortCode(defaultDesig.title, 4) : 'ROLE';

    let overallMin = 240000;
    let overallMax = 1500000;
    if (levels.length > 0) {
      const mins = levels.map((l: any) => toAnnualCtc(l.minSalary)).filter(Boolean);
      const maxs = levels.map((l: any) => toAnnualCtc(l.maxSalary)).filter(Boolean);
      if (mins.length > 0) overallMin = Math.min(...mins);
      if (maxs.length > 0) overallMax = Math.max(...maxs);
    }

    const { pack, balancingCode } = getDefaultUniversalPack(components);

    setFormData({
      name: defaultDesig && defaultDept ? `${defaultDept.name} - ${defaultDesig.title} Template` : (defaultDept ? `${defaultDept.name} Template` : ''),
      code: defaultDesig ? `${cleanDeptShort}-${cleanDesigShort}-CTC` : (defaultDept ? `${cleanDeptShort}-CTC` : ''),
      branchId,
      branchName,
      departmentId: defaultDept?.id || '',
      departmentName: defaultDept?.name || '',
      designationId: defaultDesig ? defaultDesig.id : '',
      designationTitle: defaultDesig ? defaultDesig.title : '',
      gradeCode: 'ALL',
      gradeName: 'All Seniority Levels',
      gradeId: 'ALL_LEVELS',
      level: 'ALL',
      employmentType: 'ALL',
      category: 'Corporate & Tech',
      industry: 'IT',
      description: '',
      balancingComponentCode: balancingCode,
      version: 1,
      minCtc: overallMin,
      maxCtc: overallMax,
      items: pack,
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEdit = (tpl: StructureTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTemplate(tpl);
    setComponentSearch('');
    setIsComponentDropdownOpen(false);

    let deptId = tpl.departmentId;
    let deptName = tpl.departmentName;
    if (!deptId) {
      const foundDept = availableDepartments.find(
        (d: any) =>
          tpl.name.toLowerCase().includes(d.name.toLowerCase()) ||
          (tpl.description && tpl.description.toLowerCase().includes(d.name.toLowerCase()))
      );
      if (foundDept) {
        deptId = foundDept.id;
        deptName = foundDept.name;
      } else {
        deptId = availableDepartments[0]?.id || '';
        deptName = availableDepartments[0]?.name || 'Department';
      }
    }

    setFormData({
      name: tpl.name,
      code: tpl.code,
      branchId: tpl.branchId || 'ALL',
      branchName: tpl.branchName || 'All Branches',
      departmentId: deptId,
      departmentName: deptName,
      designationId: tpl.designationId || availableDesignations[0]?.id || '',
      designationTitle: tpl.designationTitle || tpl.gradeName || 'Role',
      gradeCode: tpl.gradeCode,
      gradeName: tpl.gradeName,
      gradeId: tpl.gradeId || '',
      level: tpl.level || (tpl.gradeCode.startsWith('L') ? tpl.gradeCode : 'L3'),
      employmentType: tpl.employmentType || 'PERMANENT',
      category: tpl.category,
      industry: tpl.industry,
      description: tpl.description,
      balancingComponentCode: tpl.balancingComponentCode,
      version: tpl.version,
      minCtc: tpl.minCtc,
      maxCtc: tpl.maxCtc,
      items: tpl.items || [],
    });
    setIsTemplateModalOpen(true);
  };

  const handleCloneTemplate = async (tpl: StructureTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clone: StructureTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      code: `${tpl.code}-V${tpl.version + 1}`,
      version: tpl.version + 1,
    };

    try {
      if (effectiveCompanyId) {
        const metadataTag = `[BRANCH:${clone.branchId || 'ALL'}:${clone.branchName || 'All Branches'}][DEPT:${clone.departmentId || ''}:${clone.departmentName || ''}][DESG:${clone.designationId || ''}:${clone.designationTitle || ''}][GRADE:${clone.gradeCode}:${clone.gradeName}:${clone.gradeId || ''}][BALANCING:${clone.balancingComponentCode || 'SPECIAL_ALLOW'}][MIN:${clone.minCtc || 300000}][MAX:${clone.maxCtc || 1500000}][LEVEL:${clone.level || 'L1'}][EMP:${clone.employmentType || 'PERMANENT'}][CAT:${clone.category || 'Corporate & Tech'}][IND:${clone.industry || 'IT'}]`;
        const res = await salaryTemplatesApi.create({
          companyId: effectiveCompanyId,
          name: clone.name,
          code: clone.code,
          description: `${metadataTag} ${clone.description || ''}`.trim(),
          currency: 'INR',
          payFrequency: 'MONTHLY',
          isActive: true,
          items: clone.items.map((it, idx) => {
            const master = components.find((c) => c.code === it.componentCode || c.id === it.salaryComponentId);
            return {
              salaryComponentId: it.salaryComponentId || master?.id || it.componentCode,
              calculationType: it.calculationType || 'PERCENTAGE',
              calculationValue: it.calculationValue || 0,
              calculationBase: it.calculationBase || 'BASIC',
              monthlyAmount: it.monthlyAmount || 0,
              annualAmount: it.annualAmount || (it.monthlyAmount || 0) * 12,
              order: it.order ?? idx,
            };
          }),
        });
        if (res?.id) clone.id = res.id;
        await queryClient.invalidateQueries({ queryKey: ['payroll-templates-live'] });
      }
    } catch (err: any) {
      console.warn('Backend clone notice:', err?.response?.data?.message || err.message);
    }

    onUpdateTemplates([...templates, clone]);
    toast.success(`Template cloned as "${clone.name}"`);
  };

  const handleDeleteTemplate = async (tplId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const tplToDelete = templates.find((t) => t.id === tplId);
    const tplName = tplToDelete?.name || 'this template';

    if (!window.confirm(`Are you sure you want to delete template "${tplName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (!tplId.startsWith('tpl-')) {
        await salaryTemplatesApi.remove(tplId);
      }
      await queryClient.invalidateQueries({ queryKey: ['payroll-templates-live'] });
    } catch (err: any) {
      console.warn('Backend template delete notice:', err?.response?.data?.message || err.message);
    }

    const updated = templates.filter((t) => t.id !== tplId);
    onUpdateTemplates(updated);
    if (selectedTemplate?.id === tplId) {
      setSelectedTemplate(null);
      setIsDetailModalOpen(false);
    }
    toast.success(`Template "${tplName}" deleted successfully`);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name?.trim() || !formData.code?.trim()) {
      toast.error('Template Name and Code are required');
      return;
    }

    const tpl: StructureTemplate = {
      id: editingTemplate ? editingTemplate.id : `tpl-${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      branchId: formData.branchId || 'ALL',
      branchName: formData.branchName || 'All Branches',
      departmentId: formData.departmentId,
      departmentName: formData.departmentName,
      designationId: formData.designationId || '',
      designationTitle: formData.designationTitle || '',
      gradeCode: formData.gradeCode || 'G3',
      gradeName: formData.gradeName || 'General Staff',
      gradeId: formData.gradeId,
      level: formData.level || 'L3',
      employmentType: formData.employmentType || 'PERMANENT',
      category: formData.category || 'General',
      industry: (formData.industry as any) || 'IT',
      description: formData.description || '',
      balancingComponentCode: formData.balancingComponentCode || 'SPECIAL_ALLOW',
      version: formData.version || 1,
      isActive: true,
      minCtc: Number(formData.minCtc) || 300000,
      maxCtc: Number(formData.maxCtc) || 1500000,
      items: formData.items || [],
    };

    // Save or update in backend database if effectiveCompanyId is available
    try {
      if (effectiveCompanyId) {
        const metadataTag = `[BRANCH:${tpl.branchId || 'ALL'}:${tpl.branchName || 'All Branches'}][DEPT:${tpl.departmentId || ''}:${tpl.departmentName || ''}][DESG:${tpl.designationId || ''}:${tpl.designationTitle || ''}][GRADE:${tpl.gradeCode}:${tpl.gradeName}:${tpl.gradeId || ''}][BALANCING:${tpl.balancingComponentCode || 'SPECIAL_ALLOW'}][MIN:${tpl.minCtc || 300000}][MAX:${tpl.maxCtc || 1500000}][LEVEL:${tpl.level || 'L1'}][EMP:${tpl.employmentType || 'PERMANENT'}][CAT:${tpl.category || 'Corporate & Tech'}][IND:${tpl.industry || 'IT'}]`;
        const payload: any = {
          companyId: effectiveCompanyId,
          name: tpl.name,
          code: tpl.code,
          gradeId: tpl.gradeId || undefined,
          gradeCode: tpl.gradeCode || undefined,
          gradeName: tpl.gradeName || undefined,
          description: `${metadataTag} ${tpl.description || ''}`.trim(),
          currency: 'INR',
          payFrequency: 'MONTHLY',
          isActive: true,
          items: tpl.items.map((it, idx) => {
            const master = components.find((c) => c.code === it.componentCode || c.id === it.salaryComponentId);
            return {
              salaryComponentId: it.salaryComponentId || master?.id || it.componentCode,
              calculationType: it.calculationType || 'PERCENTAGE',
              calculationValue: it.calculationValue || 0,
              calculationBase: it.calculationBase || 'BASIC',
              monthlyAmount: it.monthlyAmount || 0,
              annualAmount: it.annualAmount || (it.monthlyAmount || 0) * 12,
              order: it.order ?? idx,
            };
          }),
        };

        if (editingTemplate && !editingTemplate.id.startsWith('tpl-')) {
          await salaryTemplatesApi.update(editingTemplate.id, payload);
        } else {
          const res = await salaryTemplatesApi.create(payload);
          if (res?.id) {
            tpl.id = res.id;
          }
        }
        await queryClient.invalidateQueries({ queryKey: ['payroll-templates-live'] });
      }

      if (editingTemplate) {
        onUpdateTemplates(templates.map((t) => (t.id === editingTemplate.id ? tpl : t)));
        toast.success(`Template "${tpl.name}" updated successfully in database`);
      } else {
        onUpdateTemplates([...templates, tpl]);
        toast.success(`Template "${tpl.name}" saved to database successfully`);
      }

      setIsTemplateModalOpen(false);
    } catch (err: any) {
      console.error('Backend salary template persistence error:', err);
      toast.error(`Database save error: ${err?.response?.data?.message || err.message || 'Failed to save template to database'}`);
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'IT':
        return <Laptop className="h-4 w-4 text-indigo-500" />;
      case 'MANUFACTURING':
        return <Factory className="h-4 w-4 text-amber-500" />;
      case 'RETAIL':
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case 'HEALTHCARE':
        return <Stethoscope className="h-4 w-4 text-rose-500" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── SEARCH & FILTER CONTROLS BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search templates by code, name, category, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs pl-3 pr-8"
            />
          </div>

          <SearchableSelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            options={[
              { value: 'ALL', label: 'All Categories & Sections' },
              { value: 'IT', label: 'Corporate & Tech', badge: 'Tech' },
              { value: 'MANUFACTURING', label: 'Plant & Factory Floor', badge: 'Plant' },
              { value: 'RETAIL', label: 'Retail & Frontline', badge: 'Retail' },
              { value: 'HEALTHCARE', label: 'Healthcare & Clinical', badge: 'Health' },
            ]}
            placeholder="All Categories"
            searchPlaceholder="Search category..."
            triggerClassName="w-52 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge variant="outline" className="text-xs py-1 px-2.5 font-medium border-border/70">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'}
          </Badge>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs font-semibold gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" /> Create New Template
          </Button>
        </div>
      </div>

      {/* ── TEMPLATES DATA TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-5 py-3.5 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Structure Templates Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Pre-configured compensation blueprints by workforce section. Click any template to view its full component mapping and live CTC simulator.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground pl-5">Template Details</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Grade Band</TableHead>
                <TableHead className="text-xs font-bold text-foreground">CTC Range (Annual)</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Components</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                    No structure templates match your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((tpl) => (
                  <TableRow
                    key={tpl.id}
                    onClick={() => handleOpenDetailModal(tpl)}
                    className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors group"
                  >
                    {/* Template Details */}
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                          {getIndustryIcon(tpl.industry || 'IT')}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            {tpl.name}
                            <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-4 border-indigo-200 text-indigo-700 bg-indigo-50/50">
                              {tpl.code}
                            </Badge>
                          </div>

                          {/* Role Hierarchy Path: Branch -> Department -> Designation -> Level */}
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground flex-wrap">
                            {tpl.branchName && (
                              <>
                                <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                  <Building className="h-3 w-3 text-sky-500" />
                                  {tpl.branchName}
                                </span>
                                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/60" />
                              </>
                            )}
                            <span className="font-semibold text-foreground/80 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-indigo-500" />
                              {typeof tpl.departmentName === 'object' ? (tpl.departmentName as any)?.name : (tpl.departmentName || (tpl.industry === 'IT' ? 'Engineering' : tpl.industry === 'MANUFACTURING' ? 'Operations' : 'Sales'))}
                            </span>
                            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/60" />
                            <span className="font-semibold text-foreground/80 flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-purple-500" />
                              {typeof tpl.designationTitle === 'object' ? (tpl.designationTitle as any)?.title : (tpl.designationTitle || (typeof tpl.gradeName === 'object' ? (tpl.gradeName as any)?.name : tpl.gradeName))}
                            </span>
                            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/60" />
                            <span className="font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded text-[9px] border border-emerald-200">
                              {tpl.level === 'ALL' || !tpl.level
                                ? 'All Levels (L1 – L5)'
                                : tpl.level.startsWith('L') || !isNaN(Number(tpl.level))
                                  ? `Level ${tpl.level}`
                                  : tpl.level}
                            </span>
                          </div>

                          {tpl.description ? (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-md mt-0.5">
                              {tpl.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    {/* Grade Band */}
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-foreground">
                        {tpl.gradeCode === 'ALL' || tpl.level === 'ALL'
                          ? 'Standard (All Levels)'
                          : `Grade ${typeof tpl.gradeCode === 'string' ? tpl.gradeCode : (tpl.gradeCode as any)?.gradeCode || 'Standard'}`}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {tpl.gradeName === 'All Seniority Levels'
                          ? 'Unified Grade Band'
                          : typeof tpl.gradeName === 'string'
                            ? tpl.gradeName
                            : (tpl.gradeName as any)?.name || ''}
                      </div>
                      {tpl.employmentType && tpl.employmentType !== 'ALL' && (
                        <span className="inline-block text-[9px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1 py-0.5 rounded mt-0.5 border border-indigo-200">
                          {tpl.employmentType === 'PERMANENT' ? 'Permanent' : tpl.employmentType === 'CONTRACT' ? 'Contract / Retainer' : 'Intern'}
                        </span>
                      )}
                    </TableCell>

                    {/* CTC Range */}
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground font-mono">
                        ₹{(tpl.minCtc / 100000).toFixed(1)}L – ₹{(tpl.maxCtc / 100000).toFixed(1)}L
                      </div>
                      <div className="text-[10px] text-muted-foreground">Annual Band</div>
                    </TableCell>

                    {/* Components Count */}
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {tpl.items?.length || 0} Components
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-bold">
                        Active (v{tpl.version})
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetailModal(tpl)}
                          className="h-7 px-2 text-xs font-semibold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> View / Simulate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenEdit(tpl, e)}
                          title="Edit Template"
                          className="h-7 px-2 text-xs font-semibold gap-1 text-slate-700 hover:text-indigo-600 border-border hover:bg-muted"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-indigo-600" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleCloneTemplate(tpl, e)}
                          title="Clone Template"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                          title="Delete Template"
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ── MODAL: SALARY BREAKUP ENGINE & LIVE CTC SIMULATOR ── */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                    {getIndustryIcon(selectedTemplate?.industry || 'IT')}
                  </div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {selectedTemplate?.name}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-xs text-indigo-600 border-indigo-300">
                    {selectedTemplate?.code}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Active (v{selectedTemplate?.version})
                  </Badge>
                </div>

                {/* Organizational Hierarchy Breadcrumbs */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTemplate?.branchName && (
                    <>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200">
                        <Building className="h-3 w-3 text-sky-500" />
                        {selectedTemplate.branchName}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    </>
                  )}
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">
                    <Building2 className="h-3 w-3 text-indigo-500" />
                    {typeof selectedTemplate?.departmentName === 'object' ? (selectedTemplate.departmentName as any)?.name : (selectedTemplate?.departmentName || 'Engineering & Technology')}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200">
                    <Briefcase className="h-3 w-3 text-purple-500" />
                    {typeof selectedTemplate?.designationTitle === 'object' ? (selectedTemplate.designationTitle as any)?.title : (selectedTemplate?.designationTitle || (typeof selectedTemplate?.gradeName === 'object' ? (selectedTemplate.gradeName as any)?.name : selectedTemplate?.gradeName))}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                    <Award className="h-3 w-3 text-emerald-600" />
                    {selectedTemplate?.level ? `Level ${selectedTemplate.level}` : (typeof selectedTemplate?.gradeCode === 'string' && !selectedTemplate.gradeCode.startsWith('GR-') ? selectedTemplate.gradeCode : 'Level 1')}
                  </span>
                </div>

                <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                  {selectedTemplate?.description || 'Standard compensation structure mapped to organizational grade and role hierarchy.'}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedTemplate && handleCloneTemplate(selectedTemplate)}
                  className="text-xs font-semibold gap-1.5 h-8"
                >
                  <Copy className="h-3.5 w-3.5" /> Clone
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedTemplate && handleOpenEdit(selectedTemplate)}
                  className="text-xs font-semibold gap-1.5 h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Sliders className="h-3.5 w-3.5" /> Edit Template
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Modal Body: Split view of Component Mapping & Live Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            {/* Left Column: Component Structure Mapping Table (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <Card className="border-border/80 shadow-2xs overflow-hidden">
                <CardHeader className="bg-muted/30 px-4 py-2.5 border-b border-border/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">Component Structure Mapping</CardTitle>
                    <CardDescription className="text-[11px]">
                      Configured formula dependencies and computation logic.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {selectedTemplate?.items?.length || 0} Components
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold text-foreground pl-4">Component</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Type</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Computation Rule</TableHead>
                        <TableHead className="text-right text-xs font-bold text-foreground">Monthly (₹)</TableHead>
                        <TableHead className="text-right text-xs font-bold text-foreground pr-4">Annual (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liveBreakdown?.items.map((item) => (
                        <TableRow key={item.componentCode} className="hover:bg-muted/20">
                          <TableCell className="pl-4 py-2.5">
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {item.componentName}
                              {item.isBalancing && (
                                <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] px-1 py-0 h-4 border-purple-200">
                                  Balancing
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">{item.componentCode}</div>
                          </TableCell>

                          <TableCell className="py-2.5">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                item.type === 'EARNING'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                                  : item.type === 'DEDUCTION'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40'
                              }`}
                            >
                              {item.type === 'EARNING' ? 'Earning' : item.type === 'DEDUCTION' ? 'Deduction' : 'Employer Cost'}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground py-2.5">
                            {item.calculationType === 'PERCENTAGE' && `${item.calculationValue}% of ${item.calculationBase || 'Basic'}`}
                            {item.calculationType === 'FIXED' && 'Fixed Amount'}
                            {item.calculationType === 'FORMULA' && 'Statutory Rule / Formula'}
                            {item.calculationType === 'BALANCING' && 'Residual Balancing Figure'}
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs font-semibold py-2.5">
                            ₹{item.monthlyAmount.toLocaleString('en-IN')}
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs font-semibold pr-4 text-muted-foreground py-2.5">
                            ₹{item.annualAmount.toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Live Interactive Salary Simulator (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-md bg-gradient-to-b from-card to-indigo-50/20 dark:to-indigo-950/10">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-indigo-600" />
                      Live CTC Salary Simulator
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300">
                      Instant Recalculation
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Adjust annual CTC to observe real-time balancing allowance, taxes, and net take-home pay.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Annual CTC Input & Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">Annual CTC Package</Label>
                      <div className="relative w-36">
                        <span className="absolute left-2 top-1.5 text-xs text-muted-foreground font-semibold">₹</span>
                        <Input
                          type="number"
                          value={simulatedAnnualCtc}
                          onChange={(e) => setSimulatedAnnualCtc(Number(e.target.value))}
                          step={25000}
                          className="pl-6 h-8 text-xs font-bold text-indigo-600 text-right font-mono"
                        />
                      </div>
                    </div>

                    <Slider
                      value={[simulatedAnnualCtc]}
                      min={selectedTemplate?.minCtc || 200000}
                      max={selectedTemplate?.maxCtc || 3000000}
                      step={25000}
                      onValueChange={(val) => setSimulatedAnnualCtc(val[0])}
                      className="py-2 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Min: ₹{(selectedTemplate?.minCtc || 200000).toLocaleString('en-IN')}</span>
                      <span>Max: ₹{(selectedTemplate?.maxCtc || 3000000).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* High-Level Financial Breakdown Cards */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 bg-card rounded-lg border border-border/80 shadow-2xs space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Gross Pay</p>
                      <p className="text-base font-bold text-foreground font-mono">
                        ₹{(liveBreakdown?.grossEarnings ?? 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Annual: ₹{(liveBreakdown?.annualGross ?? (liveBreakdown?.grossEarnings ? liveBreakdown.grossEarnings * 12 : 0)).toLocaleString('en-IN')}</p>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-0.5">
                      <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Net Monthly In-Hand</p>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{(liveBreakdown?.netTakeHome ?? 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                        ~{Math.round(((liveBreakdown?.netTakeHome || 0) / (liveBreakdown?.monthlyCtc || 1)) * 100)}% of CTC
                      </p>
                    </div>
                  </div>

                  {/* Deductions & Employer Costs Breakdown */}
                  <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                      <span>Employee Statutory Deductions (PF/ESI/PT):</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        -₹{(liveBreakdown?.employeeDeductions ?? liveBreakdown?.totalDeductions ?? 0).toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                      <span>Employer Contributions (PF/ESI/Gratuity):</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        ₹{(liveBreakdown?.employerCost ?? liveBreakdown?.employerContributions ?? 0).toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                      <span>Balancing Allowance (Special Allowance):</span>
                      <span
                        className={`font-semibold font-mono ${
                          liveBreakdown?.compliance?.isBalancingNegative ? 'text-rose-600' : 'text-purple-600'
                        }`}
                      >
                        ₹{(liveBreakdown?.compliance?.balancingAmount ?? 0).toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                  </div>

                  {/* Compliance & Wage Rule Guardrail Checkers */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Statutory Compliance Check
                    </div>

                    {/* 50% Rule */}
                    <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/80 text-xs">
                      <div className="flex items-center gap-2">
                        {liveBreakdown?.compliance.is50PercentWageRuleCompliant ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-xs">Labour Code 50% Rule</span>
                          <p className="text-[10px] text-muted-foreground">Basic + DA must be ≥ 50% of Total Wages</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          liveBreakdown?.compliance.is50PercentWageRuleCompliant
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : 'border-amber-300 text-amber-700 bg-amber-50'
                        }`}
                      >
                        {liveBreakdown?.compliance.wageRuleRatio}% of Pay
                      </Badge>
                    </div>

                    {/* Balancing Figure Guard */}
                    <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/80 text-xs">
                      <div className="flex items-center gap-2">
                        {!liveBreakdown?.compliance.isBalancingNegative ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-xs">Non-Negative Balancing Figure</span>
                          <p className="text-[10px] text-muted-foreground">Special Allowance must remain ≥ ₹0</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          !liveBreakdown?.compliance.isBalancingNegative
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : 'border-rose-300 text-rose-700 bg-rose-50'
                        }`}
                      >
                        {!liveBreakdown?.compliance.isBalancingNegative ? 'Healthy' : 'Deficit'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 mt-4 flex flex-row items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                if (selectedTemplate) {
                  handleDeleteTemplate(selectedTemplate.id, e);
                }
              }}
              className="text-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Template
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedTemplate) {
                    const tpl = selectedTemplate;
                    setIsDetailModalOpen(false);
                    handleOpenEdit(tpl);
                  }
                }}
                className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Template
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE / EDIT TEMPLATE MODAL ── */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-7">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Layers className="h-5 w-5" />
              </div>
              {editingTemplate ? `Edit Template (${editingTemplate.code})` : 'Create Salary Structure Template'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure grade level compensation templates, add/remove salary components, set calculation rules, and pick the balancing figure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* ── 4-STEP ROLE HIERARCHY ALIGNMENT CARD ── */}
            <div className="p-4 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-sky-50/30 via-indigo-50/20 to-purple-50/30 dark:from-sky-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 space-y-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-600 text-white shadow-xs">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Role Hierarchy & Compensation Alignment
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                        4-Step Workflow
                      </Badge>
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Branch → Department → Designation under Department → Level / Pay Grade
                    </p>
                  </div>
                </div>

                {/* Live Hierarchy Path Indicator */}
                <div className="flex items-center gap-1.5 text-[10px] bg-background/95 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-2xs self-start sm:self-auto flex-wrap max-w-full">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                    <Building className="h-2.5 w-2.5" />
                    {formData.branchName || 'All Branches'}
                  </span>
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />
                  <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    <Building2 className="h-2.5 w-2.5" />
                    {typeof formData.departmentName === 'object' ? (formData.departmentName as any)?.name : (formData.departmentName || 'Department')}
                  </span>
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />
                  <span className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                    <Briefcase className="h-2.5 w-2.5" />
                    {typeof formData.designationTitle === 'object' ? (formData.designationTitle as any)?.title : (formData.designationTitle || 'Designation')}
                  </span>
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Award className="h-2.5 w-2.5" />
                    {formData.level === 'ALL' || !formData.level || formData.level === 'ALL_LEVELS' ? 'All Levels (L1 – L5)' : `Level ${formData.level}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* STEP 1: Branch Selection */}
                <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1 text-sky-700 dark:text-sky-400">
                      <span className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[10px] flex items-center justify-center font-bold">1</span>
                      Branch *
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-sky-200">
                      {availableBranches.length > 0 ? `${availableBranches.length} Branches` : 'Head Office'}
                    </Badge>
                  </div>
                  <SearchableSelect
                    value={formData.branchId || 'ALL'}
                    onValueChange={handleSelectBranch}
                    options={[
                      {
                        value: 'ALL',
                        label: 'All Branches (Company-wide)',
                        icon: <Building className="h-3.5 w-3.5 text-sky-500" />,
                      },
                      {
                        value: 'HEAD_OFFICE',
                        label: 'Corporate / Head Office',
                        icon: <Building2 className="h-3.5 w-3.5 text-indigo-500" />,
                      },
                      ...availableBranches.map((b: any) => ({
                        value: b.id,
                        label: b.name,
                        icon: <Building className="h-3.5 w-3.5 text-sky-500" />,
                      })),
                    ]}
                    placeholder="Select Branch"
                    searchPlaceholder="Search branch..."
                    triggerClassName="h-8 text-xs bg-card border-sky-200/80 font-medium"
                    contentClassName="left-0 w-full min-w-[220px] max-w-[280px]"
                  />
                </div>

                {/* STEP 2: Department Selection (Filtered strictly by selected Branch) */}
                <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-bold">2</span>
                      Department *
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-indigo-200">
                      {filteredDepartmentsForBranch.length} Depts
                    </Badge>
                  </div>
                  <SearchableSelect
                    value={formData.departmentId}
                    onValueChange={(val) => handleSelectDepartment(val)}
                    disabled={filteredDepartmentsForBranch.length === 0}
                    options={filteredDepartmentsForBranch.map((d: any) => {
                      const roleCount = availableDesignations.filter(
                        (des: any) =>
                          des.departmentId === d.id ||
                          des.department?.id === d.id ||
                          (typeof des.department === 'string' && des.department.trim().toLowerCase() === d.name.trim().toLowerCase()) ||
                          (des.department?.name && des.department.name.trim().toLowerCase() === d.name.trim().toLowerCase())
                      ).length;
                      return {
                        value: d.id,
                        label: d.name,
                        sublabel: roleCount > 0 ? `${roleCount} ${roleCount === 1 ? 'role' : 'roles'}` : '0 roles linked',
                        icon: <Building2 className="h-3.5 w-3.5 text-indigo-500" />,
                      };
                    })}
                    placeholder={filteredDepartmentsForBranch.length === 0 ? "No departments in this branch" : "Select Department"}
                    searchPlaceholder="Search departments..."
                    triggerClassName="h-8 text-xs bg-card border-indigo-200/80 font-medium"
                    contentClassName="left-0 w-full min-w-[230px] max-w-[290px]"
                    emptyText="No departments found for this branch"
                  />
                </div>

                {/* STEP 3: Designation Selection (Filtered strictly by selected Department) */}
                <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1 text-purple-700 dark:text-purple-400">
                      <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] flex items-center justify-center font-bold">3</span>
                      Designation *
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-200">
                      {filteredDesignationsForDepartment.length} Roles
                    </Badge>
                  </div>
                  <SearchableSelect
                    value={formData.designationId || ''}
                    onValueChange={handleSelectDesignation}
                    disabled={filteredDesignationsForDepartment.length === 0}
                    options={filteredDesignationsForDepartment.map((d: any) => ({
                      value: d.id,
                      label: d.title,
                      sublabel: typeof d.department === 'string' ? d.department : (d.department?.name || undefined),
                      badge: d.level ? `Level ${d.level}` : undefined,
                      icon: <Briefcase className="h-3.5 w-3.5 text-purple-500" />,
                    }))}
                    placeholder={
                      !formData.departmentId
                        ? "Select department first"
                        : filteredDesignationsForDepartment.length === 0
                          ? "No roles in this department"
                          : "Select Designation"
                    }
                    searchPlaceholder="Search designations..."
                    triggerClassName="h-8 text-xs bg-card border-purple-200/80 font-medium"
                    contentClassName="left-0 sm:left-auto sm:right-0 w-full min-w-[240px] max-w-[300px]"
                    emptyText="No designations found for this department"
                  />
                  {formData.departmentId && filteredDesignationsForDepartment.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Note: &quot;{typeof formData.departmentName === 'object' ? (formData.departmentName as any)?.name : (formData.departmentName || 'This department')}&quot; has no designations linked yet.
                    </p>
                  )}
                </div>

                {/* STEP 4: Level / Pay Grade Selection */}
                <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-bold">4</span>
                      Level / Pay Grade *
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-200">
                      {filteredLevelsForDesignation.length > 0 ? `${filteredLevelsForDesignation.length} Levels` : 'All Levels'}
                    </Badge>
                  </div>
                  <SearchableSelect
                    value={formData.level === 'ALL' || !formData.gradeId || formData.gradeId === 'ALL_LEVELS' ? 'ALL_LEVELS' : (formData.gradeId || formData.gradeCode || '')}
                    onValueChange={handleSelectLevelGrade}
                    disabled={!formData.designationId}
                    options={[
                      {
                        value: 'ALL_LEVELS',
                        label: 'All Levels (L1 – L5)',
                        sublabel: 'Single unified template covering all levels for this role',
                        icon: <Layers className="h-3.5 w-3.5 text-indigo-600" />,
                      },
                      ...filteredLevelsForDesignation.map((g: any) => {
                        const annualMin = toAnnualCtc(g.minSalary);
                        const annualMax = toAnnualCtc(g.maxSalary);
                        const rangeText = annualMin && annualMax ? `₹${(annualMin / 100000).toFixed(1)}L - ₹${(annualMax / 100000).toFixed(1)}L / yr` : '';
                        const levelTitle = g.level ? `Level ${g.level}` : 'Level 1';
                        return {
                          value: g.id || g.gradeCode,
                          label: levelTitle,
                          sublabel: rangeText || (g.gradeName && !g.gradeName.startsWith('GR-') ? g.gradeName : undefined),
                          icon: <Award className="h-3.5 w-3.5 text-emerald-600" />,
                        };
                      }),
                    ]}
                    placeholder={!formData.designationId ? "Select designation first" : "All Levels (L1 - L5)"}
                    searchPlaceholder="Search levels..."
                    triggerClassName="h-8 text-xs bg-card border-emerald-200/80 font-medium"
                    contentClassName="right-0 left-auto w-full min-w-[260px] sm:min-w-[280px] max-w-[320px]"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Template Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nursing - Nurse (Level L1) Template"
                  className="h-8 text-xs bg-card"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Template Code *</Label>
                  {editingTemplate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Lock className="h-3 w-3 text-amber-500" /> Locked ID
                    </span>
                  )}
                </div>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editingTemplate}
                  placeholder="e.g. NURS-NURS-L1-CTC"
                  className="h-8 text-xs font-mono uppercase bg-card disabled:bg-muted/70 disabled:text-muted-foreground"
                />
              </div>
            </div>

            {/* Row 3: CTC Bands */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Min CTC Band (₹)</Label>
                  <span className="text-[10px] text-indigo-600 font-medium">From Grade</span>
                </div>
                <Input
                  type="number"
                  value={formData.minCtc}
                  onChange={(e) => setFormData({ ...formData, minCtc: Number(e.target.value) })}
                  className="h-8 text-xs bg-card"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Max CTC Band (₹)</Label>
                  <span className="text-[10px] text-indigo-600 font-medium">From Grade</span>
                </div>
                <Input
                  type="number"
                  value={formData.maxCtc}
                  onChange={(e) => setFormData({ ...formData, maxCtc: Number(e.target.value) })}
                  className="h-8 text-xs bg-card"
                />
              </div>
            </div>

            {/* ── SALARY COMPONENTS IN THIS TEMPLATE ── */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    Salary Components in this Template
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {formData.items?.length || 0} Components
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Calculation formulas and percentages are automatically inherited from Master Components (Tab 1).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDefaultCompliantPack}
                    className="h-8 text-xs font-semibold gap-1.5 text-indigo-700 bg-indigo-50/60 border-indigo-200 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-2xs"
                    title="Reset to 7 universal components (Basic, HRA, Conveyance, Special Allowance, PF, PT, ESI)"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Load Universal Pack
                  </Button>

                  {/* Add Component to List Action Button with Searchable Select */}
                  <SearchableSelect
                    value=""
                    onValueChange={(compCode) => {
                      const master = components.find((c) => c.code === compCode);
                      if (master) handleSelectAndAddComponent(master);
                    }}
                    options={masterComponentOptions}
                    placeholder="Select component..."
                    searchPlaceholder="Search components..."
                    emptyText="No components found"
                    className="w-auto"
                    contentClassName="right-0 left-auto w-80 sm:w-96"
                    customTrigger={({ isOpen }) => (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Component to List
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
                      </Button>
                    )}
                  />
                </div>
              </div>

              {/* Components Table or Clean Empty State */}
              {(formData.items || []).length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-border/80 rounded-lg bg-muted/10 space-y-3">
                  <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 w-fit mx-auto">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-foreground">No Salary Components Added Yet</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md mx-auto">
                      Click &quot;Load Universal Industry Pack&quot; or pick individual components from the master catalog.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <SearchableSelect
                      value=""
                      onValueChange={(compCode) => {
                        const master = components.find((c) => c.code === compCode);
                        if (master) handleSelectAndAddComponent(master);
                      }}
                      options={masterComponentOptions}
                      placeholder="Select component..."
                      searchPlaceholder="Search components..."
                      emptyText="No components found"
                      className="w-auto"
                      contentClassName="w-80 sm:w-96"
                      customTrigger={({ isOpen }) => (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Component to List
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
                        </Button>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddDefaultCompliantPack}
                      className="text-xs h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Load Universal Industry Pack (Basic, HRA, Conveyance, Special, Employee PF, PT, ESI, Employer PF)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-border/80 rounded-md overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold text-foreground pl-3 w-10">#</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Component Details</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Type</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Master Calculation Rule (Inherited)</TableHead>
                        <TableHead className="text-center text-xs font-bold text-foreground">Balancing</TableHead>
                        <TableHead className="text-right text-xs font-bold text-foreground pr-3">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(formData.items || []).map((item, idx) => (
                        <TableRow key={item.componentCode} className="hover:bg-muted/20">
                          <TableCell className="pl-3 py-2 text-xs font-mono text-muted-foreground">
                            {idx + 1}
                          </TableCell>

                          <TableCell className="py-2">
                            <div className="font-semibold text-xs text-foreground">{item.componentName}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">{item.componentCode}</div>
                          </TableCell>

                          <TableCell className="py-2">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                item.type === 'EARNING'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                                  : item.type === 'DEDUCTION'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40'
                              }`}
                            >
                              {item.type === 'EARNING' ? 'Earning' : item.type === 'DEDUCTION' ? 'Deduction' : 'Employer Cost'}
                            </span>
                          </TableCell>

                          <TableCell className="py-2 text-xs">
                            {getComponentRuleDisplay(item)}
                          </TableCell>

                          <TableCell className="text-center py-2">
                            {item.isBalancing || formData.balancingComponentCode === item.componentCode ? (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 text-[10px] border-purple-200">
                                Balancing
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right pr-3 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveComponentFromTemplate(item.componentCode)}
                              disabled={item.componentCode === 'BASIC'}
                              className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                              title={item.componentCode === 'BASIC' ? 'Basic is mandatory under Indian Wage Code' : 'Remove from template'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTemplate} className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

