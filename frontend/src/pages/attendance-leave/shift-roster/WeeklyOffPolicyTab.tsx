import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  CalendarCheck,
  RefreshCw,
  Clock,
  Pencil,
  Trash2,
  CheckCircle2,
  Building2,
  Shield,
  Layers,
  ArrowRight,
  Info,
  SunMedium,
  Check,
  Users,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCompany } from '@/context/CompanyContext';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { departmentsApi, designationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import {
  useWeeklyOffPolicyStore,
  getOffPatternSummary,
  getDefaultSchedulePattern,
  type WeeklyOffPolicyItem,
  type WeeklyOffType,
  type WeeklySchedulePattern,
  type DayScheduleStatus,
  type ApplicableScope,
  type HolidayInteraction,
} from './weeklyOffPolicyStore';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';

const DAYS_OF_WEEK: (keyof WeeklySchedulePattern)[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function WeeklyOffPolicyTab() {
  const user = useAuthStore((s) => s.user);
  const canManagePolicies = isManagerOrHrOrAdmin(user);
  const { policies, addPolicy, updatePolicy, deletePolicy, getNextCode } = useWeeklyOffPolicyStore();
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    isBranchAdmin,
    isSuperOrCompanyAdmin,
    isHeadOfficeUser,
    isBranchUser,
    userAssignedBranchId,
    assignedBranchName,
  } = useWorkforceBranch();

  // Resolve the branchId to use when creating a new policy (Head Office treated as first-class branch)
  const resolvedCreateBranchId: string | null = isBranchUser && userAssignedBranchId
    ? userAssignedBranchId
    : isHeadOfficeUser
    ? 'HEAD_OFFICE'
    : selectedBranch === 'ALL' || selectedBranch === 'HEAD_OFFICE'
    ? 'HEAD_OFFICE'
    : (selectedBranch || null);

  const { activeCompanyId, activeCompany } = useCompany();
  const effectiveCompanyId = activeCompanyId || user?.companyId;

  // Query departments
  const { data: rawDepartments = [] } = useQuery({
    queryKey: ['departments', effectiveCompanyId],
    queryFn: () => departmentsApi.list(effectiveCompanyId || undefined),
    enabled: Boolean(effectiveCompanyId),
  });

  // Query designations
  const { data: rawDesignations = [] } = useQuery({
    queryKey: ['designations', effectiveCompanyId],
    queryFn: () => designationsApi.list(effectiveCompanyId || undefined),
    enabled: Boolean(effectiveCompanyId),
  });

  // Query employees
  const { data: rawEmployeesData } = useQuery({
    queryKey: ['employees-for-weekly-off-scope', effectiveCompanyId],
    queryFn: async () => {
      try {
        const res: any = await employeesApi.list({
          page: 1,
          pageSize: 500,
          companyId: effectiveCompanyId || undefined,
        });
        if (res?.items && res.items.length > 0) return res;
        return await employeesApi.list({ page: 1, pageSize: 500 });
      } catch {
        return await employeesApi.list({ page: 1, pageSize: 500 });
      }
    },
  });

  const directoryEmployees = useMemo(() => {
    let rawList: any[] = [];
    if (Array.isArray(rawEmployeesData?.items)) {
      rawList = rawEmployeesData.items;
    } else if (Array.isArray(rawEmployeesData?.data)) {
      rawList = rawEmployeesData.data;
    } else if (Array.isArray(rawEmployeesData)) {
      rawList = rawEmployeesData;
    }

    if (rawList.length > 0) {
      return rawList.map((e: any) => ({
        id: e.id,
        code: e.employeeCode || e.code || 'EMP',
        name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || e.employeeCode,
        departmentName: e.department?.name || e.departmentName || 'General',
        departmentId: e.departmentId || e.department?.id,
        designationTitle: e.designation?.title || e.designation?.name || e.designationTitle || 'Staff Member',
        branchName: e.branch?.name || e.branchName || (e.branchId === 'HEAD_OFFICE' || !e.branchId ? 'Head Office' : 'Branch'),
        branchId: e.branchId || e.branch?.id || 'HEAD_OFFICE',
        companyId: e.companyId,
      }));
    }

    return [
      {
        id: 'cmtwjbecd00zuj7op138ul3f5',
        code: 'C-0034-001',
        name: 'prashant patil',
        departmentName: 'Administration',
        designationTitle: 'Company Administrator',
        branchName: 'Head Office',
        branchId: 'HEAD_OFFICE',
      },
      {
        id: 'cmu5be8im0076j7fnte7g79nm',
        code: 'EMP-001',
        name: 'sanika mote',
        departmentName: 'Administration head',
        designationTitle: 'Hospital Administrator',
        branchName: 'Head Office',
        branchId: 'HEAD_OFFICE',
      },
      {
        id: 'cmul98gnt007bj7irx8ozqy5t',
        code: 'EMP-0010',
        name: 'Harshal Patil',
        departmentName: 'Cardiology',
        designationTitle: 'Ward Boy',
        branchName: 'Head Office',
        branchId: 'HEAD_OFFICE',
      },
      {
        id: 'cmu5bj3s6007cj7fn7wjsm4j2',
        code: 'EMP0006',
        name: 'pratham patil',
        departmentName: 'Administration head',
        designationTitle: 'Hospital Administrator',
        branchName: 'Head Office',
        branchId: 'HEAD_OFFICE',
      },
      {
        id: 'cmu5fc9nh0086j7py36bk3lei',
        code: 'EMP0007',
        name: 'Purvesh Warude',
        departmentName: 'Administration head',
        designationTitle: 'Hospital Administrator',
        branchName: 'Head Office',
        branchId: 'HEAD_OFFICE',
      },
      {
        id: 'cmul3pnuk0078j719shrajrgx',
        code: 'EMP0009',
        name: 'Nishant Shinde',
        departmentName: 'Nursing',
        designationTitle: 'nurse',
        branchName: 'Head Office',
        branchId: 'HEAD_OFFICE',
      },
      {
        id: 'cmuf7kfgw007fipzk661dgt32',
        code: 'EMP-00001',
        name: 'krnati gade',
        departmentName: 'Nursing',
        designationTitle: 'Nursing Manager',
        branchName: 'Cravita B',
        branchId: 'cmty5i0j50078j79ddagb7bkz',
      },
      {
        id: 'cmuf7wqxr007pipzk9nbgwvzk',
        code: 'EMP-002',
        name: 'raj LTD.',
        departmentName: 'Nursing',
        designationTitle: 'nurse',
        branchName: 'Cravita B',
        branchId: 'cmty5i0j50078j79ddagb7bkz',
      },
    ];
  }, [rawEmployeesData]);

  // Head Office treated as an actual selectable Branch
  const allSelectableBranches = useMemo(() => {
    const list: { id: string; name: string }[] = [{ id: 'HEAD_OFFICE', name: 'Head Office' }];
    branches.forEach((b) => {
      const bName = b.name.trim();
      const lower = bName.toLowerCase();
      if (!lower.includes('head office') && !lower.includes('corporate') && lower !== 'hq') {
        list.push({ id: b.id, name: b.name });
      }
    });
    return list;
  }, [branches]);

  // Context-aware Branch Filtered Employees (Strictly respects Head Office / Branch context)
  const branchFilteredEmployees = useMemo(() => {
    return directoryEmployees.filter((emp) => {
      if (selectedBranch === 'ALL') return true;
      if (selectedBranch === 'HEAD_OFFICE') {
        const bName = (emp.branchName || '').toLowerCase();
        const bId = emp.branchId;
        return (
          bId === 'HEAD_OFFICE' ||
          !bId ||
          bId === 'NONE' ||
          bName.includes('head office') ||
          bName.includes('corporate') ||
          bName.includes('hq') ||
          bName.includes('headquarters') ||
          bName.includes('main')
        );
      }
      return (
        emp.branchId === selectedBranch ||
        (emp.branchName && branches.find((b) => b.id === selectedBranch)?.name === emp.branchName)
      );
    });
  }, [directoryEmployees, selectedBranch, branches]);

  // Filtered Departments respecting Company + Branch context
  const filteredDepartments = useMemo(() => {
    const list =
      rawDepartments && rawDepartments.length > 0
        ? rawDepartments
        : [
            { id: 'd-hr', name: 'Human Resources' },
            { id: 'd-it', name: 'Information Technology' },
            { id: 'd-prod', name: 'Production & Manufacturing' },
            { id: 'd-qa', name: 'Quality Assurance' },
            { id: 'd-nurse', name: 'Nursing & Patient Care' },
            { id: 'd-icu', name: 'ICU & Critical Care' },
            { id: 'd-er', name: 'Emergency Medicine' },
            { id: 'd-ops', name: 'Operations & Logistics' },
            { id: 'd-fin', name: 'Finance & Accounts' },
            { id: 'd-exec', name: 'Executive Management' },
          ];

    if (selectedBranch !== 'ALL') {
      return list.filter((d: any) => {
        if (!d.branchId) return true;
        if (selectedBranch === 'HEAD_OFFICE') {
          return d.branchId === 'HEAD_OFFICE' || !d.branchId;
        }
        return d.branchId === selectedBranch;
      });
    }
    return list;
  }, [rawDepartments, selectedBranch]);

  // Company & Branch Context-Aware Designations (Accurately resolves d.title & d.name)
  const designationsList = useMemo(() => {
    let rawList: any[] = [];
    if (Array.isArray(rawDesignations)) {
      rawList = rawDesignations;
    } else if (Array.isArray((rawDesignations as any)?.data)) {
      rawList = (rawDesignations as any).data;
    } else if (Array.isArray((rawDesignations as any)?.items)) {
      rawList = (rawDesignations as any).items;
    }

    if (rawList.length > 0) {
      // Filter by active branch context if selected
      const filtered = rawList.filter((d: any) => {
        if (selectedBranch === 'ALL') return true;
        if (selectedBranch === 'HEAD_OFFICE') {
          // In Head Office, show company-wide / Head Office designations (branchId is null or HEAD_OFFICE or NONE)
          return !d.branchId || d.branchId === 'HEAD_OFFICE' || d.branchId === 'NONE';
        }
        return d.branchId === selectedBranch || !d.branchId;
      });

      // If branch has no specific designations, show all company designations
      const sourceList = filtered.length > 0 ? filtered : rawList;

      return sourceList.map((d: any) => {
        const titleName = d.title || d.name || d.code || 'Designation';
        return {
          id: d.id,
          name: titleName,
          title: titleName,
          code: d.code,
          branchId: d.branchId,
          branchName: !d.branchId || d.branchId === 'HEAD_OFFICE' ? 'Head Office' : (d.branch?.name || 'Branch'),
          departmentName: d.department?.name || '',
        };
      });
    }

    // Cravita & Multi-industry Fallback Designations
    return [
      { id: 'desig-adm', name: 'Hospital Administrator', title: 'Hospital Administrator', code: 'DESG-HOSPITAL-ADMINISTRATOR' },
      { id: 'desig-ba', name: 'Branch Administrator', title: 'Branch Administrator', code: 'BA-BR27' },
      { id: 'desig-wb', name: 'Ward Boy', title: 'Ward Boy', code: 'DESG-WARD-BOY' },
      { id: 'desig-ca', name: 'Company Administrator', title: 'Company Administrator', code: 'CA-C0034' },
      { id: 'desig-hr', name: 'HR Manager', title: 'HR Manager', code: 'DESG-C0034-BR27-HR-MANAGER' },
      { id: 'desig-fam', name: 'Finance & Accounts Manager', title: 'Finance & Accounts Manager', code: 'DESG-C0034-BR27-FINANCE-ACCOUNTS-MANAGER' },
      { id: 'desig-ms', name: 'Medical Superintendent', title: 'Medical Superintendent', code: 'DESG-C0034-BR27-MEDICAL-SUPERINTENDENT' },
      { id: 'desig-nurse', name: 'nurse', title: 'nurse', code: 'DESG-C0034-BR27-NURSE' },
      { id: 'desig-nm', name: 'Nursing Manager', title: 'Nursing Manager', code: 'DESG-C0034-BR27-NURSING-MANAGER' },
    ];
  }, [rawDesignations, selectedBranch]);

  // Standard employee groups
  const standardEmployeeGroups = [
    'Factory Workers & Shop Floor',
    'Clinical & Nursing Staff',
    'Doctors & Medical Specialists',
    'Administrative & Office Staff',
    'IT & Technical Support',
    'Contract & Seasonal Labour',
    'Security & Facilities Team',
    'Field Operations & Logistics',
    'Senior Leadership & Executives',
    'Rotational Shift Personnel',
  ];

  // Specific employee selection states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const displayedFilteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return branchFilteredEmployees;
    const q = employeeSearch.toLowerCase();
    return branchFilteredEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q) ||
        e.designationTitle.toLowerCase().includes(q)
    );
  }, [branchFilteredEmployees, employeeSearch]);

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId];
      const names = next
        .map((id) => {
          const emp = branchFilteredEmployees.find((e) => e.id === id);
          return emp ? `${emp.name} (${emp.code})` : id;
        })
        .join(', ');
      setApplicableTarget(names);
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedForRules, setSelectedForRules] = useState<WeeklyOffPolicyItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Form states - Section 1: Basic Information
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');

  // Section 2: Weekly Schedule Pattern & Type
  const [type, setType] = useState<WeeklyOffType>('Fixed (Single Full Day)');
  const [schedulePattern, setSchedulePattern] = useState<WeeklySchedulePattern>(
    getDefaultSchedulePattern('Fixed (Single Full Day)')
  );

  // Sub-settings for specific patterns
  const [fixedDay, setFixedDay] = useState('Sunday');
  const [halfDay, setHalfDay] = useState('Saturday');
  const [halfDaySession, setHalfDaySession] = useState<'Morning' | 'Afternoon'>('Morning');

  const [rotationPattern, setRotationPattern] = useState<'Weekly' | 'Bi-Weekly' | 'Monthly'>('Weekly');
  const [rotationOffRule, setRotationOffRule] = useState<'1 day per week' | '2 days per week' | '1.5 days per week' | 'Rotational 6-1 cycle'>('1 day per week');
  const [assignmentSource, setAssignmentSource] = useState<'Roster' | 'Pattern Cycle'>('Roster');

  const [alternatePrimaryDay, setAlternatePrimaryDay] = useState('Saturday');
  const [alternatePattern, setAlternatePattern] = useState<'2nd & 4th Week' | '1st & 3rd Week' | '1st, 3rd & 5th Week' | 'Custom'>('2nd & 4th Week');
  const [alternateSecondaryDay, setAlternateSecondaryDay] = useState('Sunday');
  const [alternateAction, setAlternateAction] = useState<'Full Off' | 'Half Day'>('Full Off');

  const [customDeterminedBy, setCustomDeterminedBy] = useState('Employee Roster');

  // Section 3: Applicable Scope
  const [applicableTo, setApplicableTo] = useState<ApplicableScope>('Entire Company');
  const [applicableTarget, setApplicableTarget] = useState('Corporate');

  // Section 4: Roster Constraints
  const [minWorkingDaysPerWeek, setMinWorkingDaysPerWeek] = useState(6);
  const [maxConsecutiveWorkingDays, setMaxConsecutiveWorkingDays] = useState(6);
  const [minWeeklyOffDays, setMinWeeklyOffDays] = useState(1);
  const [allowOffDaySwap, setAllowOffDaySwap] = useState(true);
  const [requireApprovalForSwap, setRequireApprovalForSwap] = useState(true);

  // Section 5: Holiday Interaction
  const [holidayInteraction, setHolidayInteraction] = useState<HolidayInteraction>('No additional off');

  // Section 6: Override Governance
  const [allowOverride, setAllowOverride] = useState(true);
  const [reasonRequired, setReasonRequired] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [auditTrail, setAuditTrail] = useState(true);

  // Metrics
  const totalCount = policies.length;
  const activeCount = policies.filter((p) => p.status === 'Active').length;
  const halfDayCount = policies.filter((p) => {
    if (p.type === 'Fixed Half Day' || p.type === 'Multiple Half Days') return true;
    if (p.schedulePattern) {
      return Object.values(p.schedulePattern).some((d) => d.status === 'Half Day');
    }
    return false;
  }).length;
  const rotationalCount = policies.filter((p) => p.type === 'Rotational' || p.type === 'Custom / Roster Based').length;

  const handleTypeChange = (newType: WeeklyOffType) => {
    setType(newType);
    setSchedulePattern(getDefaultSchedulePattern(newType));
  };

  const handleDayStatusChange = (day: keyof WeeklySchedulePattern, newStatus: DayScheduleStatus) => {
    setSchedulePattern((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        status: newStatus,
        session: newStatus === 'Half Day' ? (prev[day]?.session || 'Morning') : undefined,
      },
    }));
  };

  const handleDaySessionChange = (day: keyof WeeklySchedulePattern, newSession: 'Morning' | 'Afternoon') => {
    setSchedulePattern((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        session: newSession,
      },
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode(getNextCode());
    setDescription('');
    setStatus('Active');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEffectiveTo('');

    setType('Fixed (Single Full Day)');
    setSchedulePattern(getDefaultSchedulePattern('Fixed (Single Full Day)'));
    setFixedDay('Sunday');
    setHalfDay('Saturday');
    setHalfDaySession('Morning');

    setRotationPattern('Weekly');
    setRotationOffRule('1 day per week');
    setAssignmentSource('Roster');
    setAlternatePrimaryDay('Saturday');
    setAlternatePattern('2nd & 4th Week');
    setAlternateSecondaryDay('Sunday');
    setAlternateAction('Full Off');
    setCustomDeterminedBy('Employee Roster');

    setApplicableTo('Entire Company');
    setApplicableTarget('Corporate');

    setMinWorkingDaysPerWeek(6);
    setMaxConsecutiveWorkingDays(6);
    setMinWeeklyOffDays(1);
    setAllowOffDaySwap(true);
    setRequireApprovalForSwap(true);

    setHolidayInteraction('No additional off');

    setAllowOverride(true);
    setReasonRequired(true);
    setApprovalRequired(true);
    setAuditTrail(true);
  };

  const handleScopeChange = (newScope: ApplicableScope) => {
    setApplicableTo(newScope);
    if (newScope === 'Entire Company') {
      setApplicableTarget(activeCompany?.name || 'Entire Company');
      setSelectedEmployeeIds([]);
    } else if (newScope === 'Branch') {
      setSelectedEmployeeIds([]);
      if (selectedBranch === 'HEAD_OFFICE' || isHeadOfficeUser) {
        setApplicableTarget('Head Office');
      } else if (selectedBranch && selectedBranch !== 'ALL') {
        const found = branches.find((b) => b.id === selectedBranch);
        setApplicableTarget(found?.name || 'Head Office');
      } else {
        setApplicableTarget('Head Office');
      }
    } else if (newScope === 'Department') {
      setSelectedEmployeeIds([]);
      const defaultDept = filteredDepartments[0]?.name || 'Human Resources';
      setApplicableTarget(defaultDept);
    } else if (newScope === 'Designation') {
      setSelectedEmployeeIds([]);
      const defaultDesig = designationsList[0]?.name || designationsList[0]?.title || 'Hospital Administrator';
      setApplicableTarget(defaultDesig);
    } else if (newScope === 'Specific Employees') {
      setSelectedEmployeeIds([]);
      setApplicableTarget('');
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    if (selectedBranch === 'HEAD_OFFICE' || isHeadOfficeUser) {
      setApplicableTo('Entire Company');
      setApplicableTarget(activeCompany?.name || 'Entire Company');
    } else if (selectedBranch && selectedBranch !== 'ALL') {
      const branchObj = branches.find((b) => b.id === selectedBranch);
      setApplicableTo('Branch');
      setApplicableTarget(branchObj?.name || 'Branch');
    } else {
      setApplicableTo('Entire Company');
      setApplicableTarget(activeCompany?.name || 'Entire Company');
    }
    setSelectedEmployeeIds([]);
    setIsModalOpen(true);
  };

  const handleEdit = (p: WeeklyOffPolicyItem) => {
    setEditingId(p.id);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description || '');
    setStatus(p.status || 'Active');
    setEffectiveFrom(p.effectiveFrom || '');
    setEffectiveTo(p.effectiveTo || '');

    setType(p.type);
    setSchedulePattern(p.schedulePattern || getDefaultSchedulePattern(p.type));
    setFixedDay(p.fixedDay || 'Sunday');
    setHalfDay(p.halfDay || 'Saturday');
    setHalfDaySession(p.halfDaySession || 'Morning');

    setRotationPattern(p.rotationPattern || 'Weekly');
    setRotationOffRule(p.rotationOffRule || '1 day per week');
    setAssignmentSource(p.assignmentSource || 'Roster');
    setAlternatePrimaryDay(p.alternatePrimaryDay || 'Saturday');
    setAlternatePattern(p.alternatePattern || '2nd & 4th Week');
    setAlternateSecondaryDay(p.alternateSecondaryDay || 'Sunday');
    setAlternateAction(p.alternateAction || 'Full Off');
    setCustomDeterminedBy(p.customDeterminedBy || 'Employee Roster');

    setApplicableTo(p.applicableTo || 'Entire Company');
    setApplicableTarget(p.applicableTarget || '');

    if (p.applicableTo === 'Specific Employees') {
      const targetStr = p.applicableTarget || '';
      const matchedIds = directoryEmployees
        .filter((emp) => targetStr.includes(emp.name) || targetStr.includes(emp.code))
        .map((emp) => emp.id);
      setSelectedEmployeeIds(matchedIds);
    } else {
      setSelectedEmployeeIds([]);
    }

    setMinWorkingDaysPerWeek(p.minWorkingDaysPerWeek ?? 6);
    setMaxConsecutiveWorkingDays(p.maxConsecutiveWorkingDays ?? 6);
    setMinWeeklyOffDays(p.minWeeklyOffDays ?? 1);
    setAllowOffDaySwap(p.allowOffDaySwap ?? true);
    setRequireApprovalForSwap(p.requireApprovalForSwap ?? true);

    setHolidayInteraction(p.holidayInteraction || 'No additional off');

    setAllowOverride(p.allowOverride ?? true);
    setReasonRequired(p.reasonRequired ?? true);
    setApprovalRequired(p.approvalRequired ?? true);
    setAuditTrail(p.auditTrail ?? true);

    setIsModalOpen(true);
  };

  const handleOpenRules = (p: WeeklyOffPolicyItem) => {
    setSelectedForRules(p);
    setIsRulesModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !effectiveFrom) return;

    if (applicableTo === 'Specific Employees' && selectedEmployeeIds.length === 0 && !applicableTarget.trim()) {
      toast.error('Please select at least one employee for Specific Employees scope');
      return;
    }

    let targetBranchId: string | null = null;
    let targetBranchName: string | undefined = undefined;

    if (applicableTo === 'Branch') {
      if (applicableTarget === 'Head Office' || applicableTarget.toLowerCase().includes('head office')) {
        targetBranchId = 'HEAD_OFFICE';
        targetBranchName = 'Head Office';
      } else {
        const found = branches.find((b) => b.name === applicableTarget);
        targetBranchId = found?.id || null;
        targetBranchName = found?.name || applicableTarget;
      }
    } else if (applicableTo === 'Entire Company') {
      targetBranchId = null;
      targetBranchName = undefined;
    } else {
      // Department, Employee Group, Designation, Specific Employees
      if (selectedBranch === 'HEAD_OFFICE') {
        targetBranchId = 'HEAD_OFFICE';
        targetBranchName = 'Head Office';
      } else if (selectedBranch !== 'ALL') {
        const found = branches.find((b) => b.id === selectedBranch);
        targetBranchId = selectedBranch;
        targetBranchName = found?.name;
      }
    }

    const finalTarget =
      applicableTo === 'Specific Employees' && selectedEmployeeIds.length > 0
        ? selectedEmployeeIds
            .map((id) => {
              const emp = branchFilteredEmployees.find((e) => e.id === id);
              return emp ? `${emp.name} (${emp.code})` : id;
            })
            .join(', ')
        : applicableTarget.trim();

    const payload: Omit<WeeklyOffPolicyItem, 'id'> = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      status,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      type,
      schedulePattern,
      fixedDay: type === 'Fixed (Single Full Day)' ? fixedDay : undefined,
      halfDay: type === 'Fixed Half Day' ? halfDay : undefined,
      halfDaySession: type === 'Fixed Half Day' ? halfDaySession : undefined,
      rotationPattern: type === 'Rotational' ? rotationPattern : undefined,
      rotationOffRule: type === 'Rotational' ? rotationOffRule : undefined,
      assignmentSource: type === 'Rotational' ? assignmentSource : undefined,
      alternatePrimaryDay: type === 'Alternate Week' ? alternatePrimaryDay : undefined,
      alternatePattern: type === 'Alternate Week' ? alternatePattern : undefined,
      alternateSecondaryDay: type === 'Alternate Week' ? alternateSecondaryDay : undefined,
      alternateAction: type === 'Alternate Week' ? alternateAction : undefined,
      customDeterminedBy: type === 'Custom / Roster Based' ? customDeterminedBy : undefined,
      applicableTo,
      applicableTarget: finalTarget,
      branchId: targetBranchId,
      branchName: targetBranchName,
      minWorkingDaysPerWeek: Number(minWorkingDaysPerWeek),
      maxConsecutiveWorkingDays: Number(maxConsecutiveWorkingDays),
      minWeeklyOffDays: Number(minWeeklyOffDays),
      allowOffDaySwap,
      requireApprovalForSwap,
      holidayInteraction,
      allowOverride,
      reasonRequired,
      approvalRequired,
      auditTrail,
    };

    if (editingId) {
      updatePolicy(editingId, payload);
    } else {
      addPolicy(payload, targetBranchId);
    }
    setIsModalOpen(false);
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.applicableTarget && p.applicableTarget.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getOffPatternSummary(p).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

      // Branch Filtering matching Employee Master Page
      let matchesBranch = true;
      if (selectedBranch !== 'ALL') {
        if (selectedBranch === 'HEAD_OFFICE') {
          const target = (p.applicableTarget || '').toLowerCase();
          const pBranch = (p.branchId || '').toUpperCase();
          matchesBranch =
            p.applicableTo === 'Entire Company' ||
            p.applicableTo === 'Company' ||
            p.applicableTo === 'Employee Group' ||
            pBranch === 'HEAD_OFFICE' ||
            !p.branchId ||
            target.includes('head office') ||
            target.includes('corporate') ||
            target.includes('main') ||
            target.includes('hq');
        } else {
          const branchObj = branches.find((b) => b.id === selectedBranch);
          const bName = (branchObj?.name || '').toLowerCase();
          const target = (p.applicableTarget || '').toLowerCase();
          matchesBranch =
            p.applicableTo === 'Entire Company' ||
            p.applicableTo === 'Company' ||
            (p.branchId && p.branchId === selectedBranch) ||
            (bName && target.includes(bName.slice(0, 4))) ||
            target.includes(selectedBranch.toLowerCase());
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesBranch;
    });
  }, [policies, searchQuery, typeFilter, statusFilter, selectedBranch, branches]);

  const getTypeBadgeClass = (t: WeeklyOffType) => {
    switch (t) {
      case 'Fixed (Single Full Day)':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
      case 'Multiple Fixed Days':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
      case 'Fixed Half Day':
      case 'Multiple Half Days':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'Rotational':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900';
      case 'Alternate Week':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900';
      case 'Custom / Roster Based':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-5">
      {/* Informational Guidance Callout */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Weekly Off & Half Day Schedule Policy
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-4xl leading-relaxed">
              Decides <strong>which day(s) employees have Full Off or Half Day work</strong> every week. Supports corporate 5-day, Saturday half-day (5.5 days), alternate Saturdays, rotational manufacturing & healthcare rosters, BPO 24x7 coverage, and retail schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground shrink-0 bg-background/80 px-3 py-1.5 rounded-lg border border-border/60">
          <span>Shift (Working Hours)</span>
          <ArrowRight className="h-3 w-3 text-primary" />
          <span className="text-primary font-bold">Weekly Schedule (Full/Half/Off)</span>
          <ArrowRight className="h-3 w-3 text-primary" />
          <span>Roster Plan</span>
        </div>
      </div>

      {/* Top 4 Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Policies</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totalCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Multi-industry definitions</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCount}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Currently enforced</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Half Day Policies</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{halfDayCount}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Saturday / Mid-week half day</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <SunMedium className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rotational / Roster</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{rotationalCount}</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">Plant, Hospital, BPO, Security</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 space-y-3">
          {/* Line 1: Title, Description & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 whitespace-nowrap">
                <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
                Weekly Schedule & Off Policy Registry
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Configured rest patterns, Saturday half-days, rotational roster rules, and applicability scopes
              </CardDescription>
            </div>

            {/* Create Policy Button */}
            {canManagePolicies && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 font-semibold shrink-0"
                onClick={handleOpenCreate}
              >
                <Plus className="h-3.5 w-3.5" /> Create Policy
              </Button>
            )}
          </div>

          {/* Line 2: Filter Toolbar (Search, Branch, Type, Status) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/40">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search policy name/code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Branch Filter (Matching Employee Master Page) */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
            />

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-36 text-xs bg-background">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
                <SelectItem value="Fixed (Single Full Day)" className="text-xs">Fixed (Full Day)</SelectItem>
                <SelectItem value="Multiple Fixed Days" className="text-xs">Multiple Fixed Days</SelectItem>
                <SelectItem value="Fixed Half Day" className="text-xs">Fixed Half Day</SelectItem>
                <SelectItem value="Multiple Half Days" className="text-xs">Multiple Half Days</SelectItem>
                <SelectItem value="Rotational" className="text-xs">Rotational</SelectItem>
                <SelectItem value="Alternate Week" className="text-xs">Alternate Week</SelectItem>
                <SelectItem value="Custom / Roster Based" className="text-xs">Custom / Roster</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-28 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Status</SelectItem>
                <SelectItem value="Active" className="text-xs">Active</SelectItem>
                <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {filteredPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 border border-primary/20">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No Weekly Off Policies Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                No policy matches your search criteria. Click &quot;Create Policy&quot; to configure a new fixed, half-day, rotational, or alternate weekly rest rule.
              </p>
              {canManagePolicies && (
                <Button size="sm" className="mt-4 h-8 text-xs gap-1.5" onClick={handleOpenCreate}>
                  <Plus className="h-3.5 w-3.5" /> Create Policy
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border/80 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold w-24">Code</TableHead>
                    <TableHead className="text-xs font-semibold">Policy Name</TableHead>
                    <TableHead className="text-xs font-semibold">Off / Half Day Pattern</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Effective From</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((p) => {
                    const patternSummary = getOffPatternSummary(p);
                    const hasHalfDay = patternSummary.includes('Half');

                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-md font-mono text-xs font-bold border border-border/80 bg-muted/60 text-foreground">
                            {p.code}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div>
                            <span className="font-semibold text-xs text-foreground">{p.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 h-4 bg-muted/50 font-normal text-muted-foreground border-border/80">
                                {p.applicableTo}: <span className="font-medium text-foreground ml-1">{p.applicableTarget || 'Company'}</span>
                              </Badge>
                              {p.branchName && p.applicableTo !== 'Branch' && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                                  {p.branchName}
                                </Badge>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              "font-mono text-xs font-semibold",
                              hasHalfDay ? "text-amber-600 dark:text-amber-400" : "text-primary"
                            )}>
                              {patternSummary}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px] font-semibold', getTypeBadgeClass(p.type))}>
                            {p.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.effectiveFrom}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-semibold',
                              p.status === 'Active'
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30'
                                : 'text-muted-foreground bg-muted/60 border-border'
                            )}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 gap-1 text-primary hover:text-primary"
                              onClick={() => handleOpenRules(p)}
                            >
                              <SlidersHorizontal className="h-3 w-3" /> View / Rules
                            </Button>
                            {canManagePolicies && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                  title="Edit Policy"
                                  onClick={() => handleEdit(p)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  title="Delete Policy"
                                  onClick={() => deletePolicy(p.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit Policy Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {editingId ? `Edit Policy: ${name || code}` : 'Create Weekly Off / Half Day Policy'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure 7-day weekly schedule pattern (Working / Half Day / Full Off), rotational rules, and roster constraints.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Section 1: Basic Information */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" /> 1. Basic Information
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Policy Name *</Label>
                  <Input
                    placeholder="e.g. Standard 5.5-Day (Saturday Half Day)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Policy Code *</Label>
                  <Input
                    placeholder="WO-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-8 text-xs font-mono uppercase bg-background"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="e.g. Monday-Friday full work, Saturday morning half-day, Sunday weekly off..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs bg-background min-h-[45px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={status} onValueChange={(v: 'Active' | 'Inactive') => setStatus(v)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active" className="text-xs text-emerald-600 font-semibold">Active</SelectItem>
                      <SelectItem value="Inactive" className="text-xs text-muted-foreground">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Effective From *</Label>
                  <Input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Effective To (Optional)</Label>
                  <Input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Weekly Schedule Pattern & Type */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> 2. Weekly Schedule Pattern
                </p>
                <Badge variant="outline" className="text-[10px] text-primary bg-primary/5">
                  Full Off & Half Day Supported
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Weekly Off Preset Type *</Label>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed (Single Full Day)" className="text-xs font-medium">Fixed (Single Full Day)</SelectItem>
                      <SelectItem value="Multiple Fixed Days" className="text-xs font-medium">Multiple Fixed Days (e.g. 5-Day Week)</SelectItem>
                      <SelectItem value="Fixed Half Day" className="text-xs font-medium">Fixed Half Day (e.g. Saturday Half Day)</SelectItem>
                      <SelectItem value="Multiple Half Days" className="text-xs font-medium">Multiple Half Days</SelectItem>
                      <SelectItem value="Rotational" className="text-xs font-medium">Rotational (Hospital, Manufacturing, BPO)</SelectItem>
                      <SelectItem value="Alternate Week" className="text-xs font-medium">Alternate Week (e.g. 2nd & 4th Saturday)</SelectItem>
                      <SelectItem value="Custom / Roster Based" className="text-xs font-medium">Custom / Roster Based (Security, Flexible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === 'Rotational' && (
                  <div className="text-[11px] text-muted-foreground p-2 rounded bg-purple-50/50 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-900">
                    Rotational duty roster overrides weekdays dynamically.
                  </div>
                )}
                {type === 'Custom / Roster Based' && (
                  <div className="text-[11px] text-muted-foreground p-2 rounded bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                    Employee Roster Planner controls exact dates and rest days.
                  </div>
                )}
              </div>

              {/* 7-Day Visual Weekday Pattern Matrix */}
              <div className="rounded-lg border bg-background overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 border-b text-[11px] font-semibold text-muted-foreground grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-3">Day of Week</span>
                  <span className="col-span-5">Schedule Status</span>
                  <span className="col-span-4">Session / Notes</span>
                </div>

                <div className="divide-y divide-border/60">
                  {DAYS_OF_WEEK.map((day) => {
                    const entry = schedulePattern[day] || { status: 'Working' };
                    const isFullOff = entry.status === 'Full Off';
                    const isHalfDay = entry.status === 'Half Day';

                    return (
                      <div
                        key={day}
                        className={cn(
                          'px-3 py-2 grid grid-cols-12 gap-2 items-center text-xs transition-colors',
                          isFullOff && 'bg-emerald-50/30 dark:bg-emerald-950/10',
                          isHalfDay && 'bg-amber-50/30 dark:bg-amber-950/10'
                        )}
                      >
                        {/* Day Name */}
                        <div className="col-span-3 flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{day}</span>
                          {isFullOff && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                              OFF
                            </Badge>
                          )}
                          {isHalfDay && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                              HALF
                            </Badge>
                          )}
                        </div>

                        {/* Status Select */}
                        <div className="col-span-5">
                          <Select
                            value={entry.status}
                            onValueChange={(val: DayScheduleStatus) => handleDayStatusChange(day, val)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Working" className="text-xs">Working (Full Day)</SelectItem>
                              <SelectItem value="Half Day" className="text-xs font-semibold text-amber-600">Half Day</SelectItem>
                              <SelectItem value="Full Off" className="text-xs font-semibold text-emerald-600">Full Off (Weekly Rest)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Session / Additional configuration */}
                        <div className="col-span-4">
                          {isHalfDay ? (
                            <Select
                              value={entry.session || 'Morning'}
                              onValueChange={(val: 'Morning' | 'Afternoon') => handleDaySessionChange(day, val)}
                            >
                              <SelectTrigger className="h-7 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Morning" className="text-xs">Morning Session</SelectItem>
                                <SelectItem value="Afternoon" className="text-xs">Afternoon Session</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : isFullOff ? (
                            <span className="text-[11px] text-muted-foreground font-mono">Rest Day</span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono">Standard Shift</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sub-settings for Alternate Week */}
              {type === 'Alternate Week' && (
                <div className="p-3 rounded-lg bg-background border space-y-2.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Alternate Week Pattern Settings
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Primary Target Day</Label>
                      <Select value={alternatePrimaryDay} onValueChange={setAlternatePrimaryDay}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((d) => (
                            <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Pattern Rule</Label>
                      <Select value={alternatePattern} onValueChange={(v: any) => setAlternatePattern(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2nd & 4th Week" className="text-xs">2nd & 4th Week</SelectItem>
                          <SelectItem value="1st & 3rd Week" className="text-xs">1st & 3rd Week</SelectItem>
                          <SelectItem value="1st, 3rd & 5th Week" className="text-xs">1st, 3rd & 5th Week</SelectItem>
                          <SelectItem value="Custom" className="text-xs">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Alternate Week Action</Label>
                      <Select value={alternateAction} onValueChange={(v: any) => setAlternateAction(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full Off" className="text-xs">Full Off</SelectItem>
                          <SelectItem value="Half Day" className="text-xs">Half Day (Morning)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-settings for Rotational */}
              {type === 'Rotational' && (
                <div className="p-3 rounded-lg bg-background border space-y-2.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" /> Rotational Roster Off Settings
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Frequency</Label>
                      <Select value={rotationPattern} onValueChange={(v: any) => setRotationPattern(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weekly" className="text-xs">Weekly</SelectItem>
                          <SelectItem value="Bi-Weekly" className="text-xs">Bi-Weekly</SelectItem>
                          <SelectItem value="Monthly" className="text-xs">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Off Rule</Label>
                      <Select value={rotationOffRule} onValueChange={(v: any) => setRotationOffRule(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 day per week" className="text-xs">1 day per week</SelectItem>
                          <SelectItem value="2 days per week" className="text-xs">2 days per week</SelectItem>
                          <SelectItem value="1.5 days per week" className="text-xs">1.5 days (1 Full + 1 Half)</SelectItem>
                          <SelectItem value="Rotational 6-1 cycle" className="text-xs">Rotational 6-1 cycle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Assignment Source</Label>
                      <Select value={assignmentSource} onValueChange={(v: any) => setAssignmentSource(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Roster" className="text-xs">Roster Assigned</SelectItem>
                          <SelectItem value="Pattern Cycle" className="text-xs">Pattern Cycle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Applicable Scope & Dynamic Target */}
            <div className="border rounded-lg p-3.5 bg-muted/20 space-y-3.5 border-border/80">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> 3. Applicable Scope & Target
                </p>
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground bg-background">
                  Context: {selectedBranch === 'HEAD_OFFICE' ? 'Head Office' : selectedBranch === 'ALL' ? 'All Branches' : assignedBranchName || 'Branch'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Apply Policy To *</Label>
                  <Select value={applicableTo} onValueChange={(v: ApplicableScope) => handleScopeChange(v)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entire Company" className="text-xs">Entire Company</SelectItem>
                      <SelectItem value="Branch" className="text-xs">Branch</SelectItem>
                      <SelectItem value="Department" className="text-xs">Department</SelectItem>
                      <SelectItem value="Designation" className="text-xs">Designation</SelectItem>
                      <SelectItem value="Specific Employees" className="text-xs">Specific Employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scope 1: Entire Company */}
                {applicableTo === 'Entire Company' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Target Company</Label>
                    <div className="h-8 px-2.5 rounded-md border border-border/70 bg-muted/40 text-xs flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{activeCompany?.name || 'Entire Company'}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary">All Branches</Badge>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground">Applies universally across all branches, locations, and departments.</p>
                  </div>
                )}

                {/* Scope 2: Branch (Includes Head Office as explicit selectable Branch) */}
                {applicableTo === 'Branch' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Target Branch *</Label>
                    <Select value={applicableTarget} onValueChange={(val) => setApplicableTarget(val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSelectableBranches.map((b) => (
                          <SelectItem key={b.id} value={b.name} className="text-xs">
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10.5px] text-muted-foreground">Applies to all staff located at {applicableTarget || 'the selected branch'}.</p>
                  </div>
                )}

                {/* Scope 3: Department (Respects Company + Branch context) */}
                {applicableTo === 'Department' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Target Department *</Label>
                    <Select value={applicableTarget} onValueChange={(val) => setApplicableTarget(val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDepartments.map((dept: any) => (
                          <SelectItem key={dept.id || dept.name} value={dept.name} className="text-xs">
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10.5px] text-muted-foreground">Applies to all personnel within this department ({selectedBranch === 'HEAD_OFFICE' ? 'Head Office' : 'Branch Scope'}).</p>
                  </div>
                )}


                {/* Scope 5: Designation */}
                {applicableTo === 'Designation' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Target Designation *</Label>
                    <Select value={applicableTarget} onValueChange={(val) => setApplicableTarget(val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationsList.map((d: any) => {
                          const val = d.name || d.title || d.code;
                          return (
                            <SelectItem key={d.id || val} value={val} className="text-xs">
                              {val} {d.code ? `(${d.code})` : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-[10.5px] text-muted-foreground">Applies to employees holding this professional designation.</p>
                  </div>
                )}
              </div>

              {/* Scope 6: Specific Employees (Context-aware Multi-Select with Search & Badges) */}
              {applicableTo === 'Specific Employees' && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Select Employees ({branchFilteredEmployees.length} available in {selectedBranch === 'HEAD_OFFICE' ? 'Head Office' : 'Active Branch'})
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono font-semibold">
                        {selectedEmployeeIds.length} Selected
                      </Badge>
                      {selectedEmployeeIds.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-muted-foreground hover:text-destructive px-1.5"
                          onClick={() => {
                            setSelectedEmployeeIds([]);
                            setApplicableTarget('');
                          }}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Selected Employee Badges */}
                  {selectedEmployeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-background rounded-md border border-border/70">
                      {selectedEmployeeIds.map((id) => {
                        const emp = branchFilteredEmployees.find((e) => e.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5 gap-1 bg-primary/10 text-primary border border-primary/20 inline-flex items-center"
                          >
                            <span>{emp?.name || id} ({emp?.code || 'EMP'})</span>
                            <button
                              type="button"
                              onClick={() => toggleEmployee(id)}
                              className="hover:text-destructive text-muted-foreground ml-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Search inside employee selector */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${selectedBranch === 'HEAD_OFFICE' ? 'Head Office' : 'branch'} employees by name, code or department...`}
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="h-7.5 pl-8 text-xs bg-background"
                    />
                  </div>

                  {/* Employee Checkbox List */}
                  <div className="rounded-md border border-border/70 max-h-44 overflow-y-auto divide-y divide-border/50 bg-background">
                    {displayedFilteredEmployees.length === 0 ? (
                      <p className="text-center py-4 text-xs text-muted-foreground">
                        No employees found matching &quot;{employeeSearch}&quot; in {selectedBranch === 'HEAD_OFFICE' ? 'Head Office' : 'this branch'}.
                      </p>
                    ) : (
                      displayedFilteredEmployees.map((emp) => {
                        const isChecked = selectedEmployeeIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            className={`flex items-center justify-between p-2 hover:bg-muted/40 cursor-pointer transition-colors text-xs ${
                              isChecked ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleEmployee(emp.id)}
                              />
                              <div>
                                <span className="font-semibold text-foreground">{emp.name}</span>
                                <span className="font-mono text-[10px] text-muted-foreground ml-1.5 font-normal">
                                  ({emp.code})
                                </span>
                                <p className="text-[10px] text-muted-foreground">
                                  {emp.departmentName} • {emp.designationTitle}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-normal">
                              {emp.branchName || 'Head Office'}
                            </Badge>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Roster Constraints */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> 4. Roster Constraints
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Min Working Days / Wk</Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={minWorkingDaysPerWeek}
                    onChange={(e) => setMinWorkingDaysPerWeek(Number(e.target.value))}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max Consecutive Days</Label>
                  <Input
                    type="number"
                    min={1}
                    max={14}
                    value={maxConsecutiveWorkingDays}
                    onChange={(e) => setMaxConsecutiveWorkingDays(Number(e.target.value))}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Min Weekly Offs</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3}
                    value={minWeeklyOffDays}
                    onChange={(e) => setMinWeeklyOffDays(Number(e.target.value))}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-md border bg-background flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Allow Off-Day Swap</Label>
                    <p className="text-[10px] text-muted-foreground">Employees can request swapping off day</p>
                  </div>
                  <Switch checked={allowOffDaySwap} onCheckedChange={setAllowOffDaySwap} />
                </div>

                <div className="p-2.5 rounded-md border bg-background flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Require Approval for Swap</Label>
                    <p className="text-[10px] text-muted-foreground">Manager approval needed before publish</p>
                  </div>
                  <Switch checked={requireApprovalForSwap} onCheckedChange={setRequireApprovalForSwap} />
                </div>
              </div>
            </div>

            {/* Section 5: Holiday Interaction */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-primary" /> 5. Holiday Interaction
              </p>

              <div className="space-y-1">
                <Label className="text-xs font-medium">If Holiday falls on Weekly Off *</Label>
                <Select
                  value={holidayInteraction}
                  onValueChange={(v: HolidayInteraction) => setHolidayInteraction(v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No additional off" className="text-xs">No additional off (Default)</SelectItem>
                    <SelectItem value="Compensatory Off" className="text-xs">Compensatory Off Credit</SelectItem>
                    <SelectItem value="Move Off to another day" className="text-xs">Move Off to another day</SelectItem>
                    <SelectItem value="As per Company Policy" className="text-xs">As per Company Policy</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Example: If Christmas (25-Dec) falls on a weekly rest day, system applies this rule instead of blind double leave crediting.
                </p>
              </div>
            </div>

            {/* Section 6: Override Rules */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> 6. Roster Override & Governance
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-md border bg-background flex flex-col justify-between gap-2">
                  <span className="text-xs font-medium">Manager/HR Override</span>
                  <Switch checked={allowOverride} onCheckedChange={setAllowOverride} />
                </div>

                <div className="p-2 rounded-md border bg-background flex flex-col justify-between gap-2">
                  <span className="text-xs font-medium">Reason Required</span>
                  <Switch checked={reasonRequired} onCheckedChange={setReasonRequired} />
                </div>

                <div className="p-2 rounded-md border bg-background flex flex-col justify-between gap-2">
                  <span className="text-xs font-medium">Approval Required</span>
                  <Switch checked={approvalRequired} onCheckedChange={setApprovalRequired} />
                </div>

                <div className="p-2 rounded-md border bg-background flex flex-col justify-between gap-2">
                  <span className="text-xs font-medium">Automatic Audit Trail</span>
                  <Switch checked={auditTrail} onCheckedChange={setAuditTrail} />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> {editingId ? 'Save Changes' : 'Save Weekly Schedule Policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Policy Rules Modal ── */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Policy Details: {selectedForRules?.name} ({selectedForRules?.code})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete 7-day schedule breakdown, half-day sessions, roster constraints, and holiday collision logic.
            </DialogDescription>
          </DialogHeader>

          {selectedForRules && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-3">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Policy Type:</span>
                  <Badge variant="outline" className={cn('text-[10px] font-semibold', getTypeBadgeClass(selectedForRules.type))}>
                    {selectedForRules.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Pattern Summary:</span>
                  <span className="font-mono font-bold text-primary">
                    {getOffPatternSummary(selectedForRules)}
                  </span>
                </div>

                {/* 7-Day Matrix in View Modal */}
                {selectedForRules.schedulePattern && (
                  <div className="py-2 border-b border-border/50 space-y-1.5">
                    <span className="text-muted-foreground font-medium block">7-Day Weekly Schedule Breakdown:</span>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DAYS_OF_WEEK.map((d) => {
                        const entry = selectedForRules.schedulePattern?.[d] || { status: 'Working' };
                        const isOff = entry.status === 'Full Off';
                        const isHalf = entry.status === 'Half Day';
                        return (
                          <div
                            key={d}
                            className={cn(
                              'p-1.5 rounded border text-[10px]',
                              isOff && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
                              isHalf && 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
                              !isOff && !isHalf && 'bg-background text-foreground border-border'
                            )}
                          >
                            <span className="font-bold block">{d.slice(0, 3)}</span>
                            <span className="text-[9px] block mt-0.5">
                              {isOff ? 'OFF' : isHalf ? `${entry.session === 'Afternoon' ? 'Aft' : 'Morn'}` : 'Full'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Applicable Target:</span>
                  <span className="font-semibold text-foreground">
                    {selectedForRules.applicableTarget} ({selectedForRules.applicableTo})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Max Consecutive Working Days:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {selectedForRules.maxConsecutiveWorkingDays} days
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Min Weekly Off Days:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {selectedForRules.minWeeklyOffDays} day(s) / week
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Holiday on Off-Day Rule:</span>
                  <span className="font-semibold text-foreground">
                    {selectedForRules.holidayInteraction}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium">Override Governance:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedForRules.allowOverride ? 'Manager Override + Audit Trail' : 'Strict Policy Enforcement'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-[11px] text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  The Roster Planner applies this weekly schedule to calculate planned hours, Saturday half-day timings, and rest day entitlements.
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsRulesModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
