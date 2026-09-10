import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { holidaysApi } from '@/api/attendance-leave';
import {
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Grid,
  List,
  MapPin,
  MoreVertical,
  Eye,
  Copy,
  Power,
  SlidersHorizontal,
  Info,
  Building,
  Briefcase,
  Users,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCompany } from '@/context/CompanyContext';
import { branchesApi, departmentsApi } from '@/api/organization';

export type HolidayScopeType = 'Company' | 'Branch' | 'Department' | 'Employee Group';
export type HolidayDurationType = 'Full Day' | 'Half Day';
export type HolidaySessionType = 'Morning' | 'Afternoon';

export interface HolidayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'Mandatory' | 'Restricted / Optional' | 'Regional' | 'Company Holiday' | 'Special Holiday';
  category: 'National' | 'Festival' | 'Regional' | 'Religious' | 'Company Event' | 'Government Declared' | 'Other';
  
  // Standardized Scope & Target
  applicableTo: HolidayScopeType;
  applicableTarget: string; // e.g., 'All Company Entities', 'Pune Manufacturing Plant', 'Operations & Production', 'Plant Workers'
  applicableLocations?: string[]; // Backwards compatibility for filtering

  // Duration & Session
  duration: HolidayDurationType;
  session?: HolidaySessionType; // Only when duration === 'Half Day'

  // Restricted / Optional Holiday Controls
  allowEmployeeSelection?: boolean;
  approvalRequired?: boolean;
  maxOptionalHolidays?: number;

  isPaid: boolean;
  isOptional: boolean;
  attendanceOverride: boolean; // Suppress biometric punch requirement
  payrollImpact: 'Paid Holiday' | 'Unpaid' | 'Half Day Paid';
  description: string;
  isActive: boolean;
  referencedInAttendance?: boolean;
}

const DEFAULT_EMPLOYEE_GROUPS = [
  'All Plant & Factory Workers',
  'Corporate & Office Staff',
  'Field Service Engineers',
  'Shift Technicians & Operators',
  'Contract & Security Staff',
];

const INITIAL_HOLIDAYS: HolidayItem[] = [
  {
    id: 'h1',
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'Mandatory',
    category: 'National',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
    applicableLocations: ['Company-wide'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday for all company employees.',
    isActive: true,
    referencedInAttendance: true,
  },
  {
    id: 'h2',
    name: 'Ambedkar Jayanti',
    date: '2026-04-14',
    type: 'Regional',
    category: 'Regional',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Dr. B. R. Ambedkar.',
    isActive: true,
    referencedInAttendance: false,
  },
  {
    id: 'h3',
    name: 'Maharashtra Day',
    date: '2026-05-01',
    type: 'Regional',
    category: 'Regional',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Statehood day celebrating Maharashtra state formation.',
    isActive: true,
    referencedInAttendance: true,
  },
  {
    id: 'h4',
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'Mandatory',
    category: 'National',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
    applicableLocations: ['Company-wide'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday celebrating Indian Independence.',
    isActive: true,
    referencedInAttendance: true,
  },
  {
    id: 'h5',
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    type: 'Mandatory',
    category: 'National',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
    applicableLocations: ['Company-wide'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Mahatma Gandhi (National statutory holiday).',
    isActive: true,
    referencedInAttendance: false,
  },
  {
    id: 'h6',
    name: 'Dussehra (Vijayadashami)',
    date: '2026-10-20',
    type: 'Restricted / Optional',
    category: 'Festival',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
    applicableLocations: ['Pune Manufacturing Plant'],
    duration: 'Full Day',
    allowEmployeeSelection: true,
    approvalRequired: true,
    maxOptionalHolidays: 2,
    isPaid: true,
    isOptional: true,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Restricted festival holiday selectable by employees.',
    isActive: true,
    referencedInAttendance: false,
  },
  {
    id: 'h7',
    name: 'Diwali (Laxmi Pujan)',
    date: '2026-11-08',
    type: 'Mandatory',
    category: 'Festival',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
    applicableLocations: ['Company-wide'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Major national festival of lights.',
    isActive: true,
    referencedInAttendance: false,
  },
  {
    id: 'h8',
    name: 'Christmas Day',
    date: '2026-12-25',
    type: 'Mandatory',
    category: 'Festival',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
    applicableLocations: ['Company-wide'],
    duration: 'Full Day',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Annual festival celebrating Christmas across all branches.',
    isActive: true,
    referencedInAttendance: false,
  },
  {
    id: 'h9',
    name: 'Year-End Saturday Half-Day',
    date: '2026-12-26',
    type: 'Company Holiday',
    category: 'Company Event',
    applicableTo: 'Employee Group',
    applicableTarget: 'Corporate & Office Staff',
    applicableLocations: ['Mumbai Office', 'Pune Manufacturing Plant'],
    duration: 'Half Day',
    session: 'Afternoon',
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Half Day Paid',
    description: 'Company-declared Saturday afternoon holiday for corporate teams.',
    isActive: true,
    referencedInAttendance: false,
  },
];

export function WorkCalendarTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;

  // Fetch branches dynamically
  const { data: branchesData } = useQuery({
    queryKey: ['branches', activeCompanyId],
    queryFn: () => branchesApi.list(activeCompanyId),
    enabled: !!activeCompanyId,
  });

  const availableBranchNames = useMemo(() => {
    if (branchesData && branchesData.length > 0) {
      return branchesData.map(b => b.name);
    }
    return ['Pune Manufacturing Plant', 'Mumbai Office', 'Stores & Warehouse'];
  }, [branchesData]);

  // Fetch departments dynamically
  const { data: departmentsData } = useQuery({
    queryKey: ['departments', activeCompanyId],
    queryFn: () => departmentsApi.list(activeCompanyId),
    enabled: !!activeCompanyId,
  });

  const availableDepartmentNames = useMemo(() => {
    if (departmentsData && departmentsData.length > 0) {
      return departmentsData.map((d: any) => d.name);
    }
    return ['Operations & Production', 'Engineering & Maintenance', 'Human Resources', 'Supply Chain & Logistics', 'Finance & Accounts', 'Sales & Marketing'];
  }, [departmentsData]);

  const queryClient = useQueryClient();

  // Holidays state backed by database
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);

  // Fetch holidays dynamically from MySQL database via API
  const { data: dbHolidays } = useQuery({
    queryKey: ['holidays', activeCompanyId],
    queryFn: () => holidaysApi.list(activeCompanyId),
    enabled: !!activeCompanyId,
  });

  // Sync DB holidays to state
  useEffect(() => {
    if (dbHolidays && dbHolidays.length > 0) {
      setHolidays(dbHolidays as any);
    }
  }, [dbHolidays]);

  // Create Holiday in Database
  const createMutation = useMutation({
    mutationFn: (payload: any) => holidaysApi.create(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success(`Holiday "${saved.name}" declared and saved to database! Attendance synced.`);
      setIsDeclareOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save holiday to database');
    },
  });

  // Update Holiday in Database
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => holidaysApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success(`Holiday "${updated.name}" updated in database and attendance synced!`);
      setIsDeclareOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update holiday in database');
    },
  });

  // Delete Holiday from Database
  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidaysApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success('Holiday deleted from database and attendance schedule updated.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete holiday');
    },
  });

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selected holiday for Edit / View
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [viewingHoliday, setViewingHoliday] = useState<HolidayItem | null>(null);

  // Declare Form State
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('2026-01-01');
  const [formType, setFormType] = useState<HolidayItem['type']>('Mandatory');
  const [formCategory, setFormCategory] = useState<HolidayItem['category']>('National');
  
  // Standardized Scope & Target
  const [formApplicableTo, setFormApplicableTo] = useState<HolidayScopeType>('Company');
  const [formApplicableTarget, setFormApplicableTarget] = useState('All Company Entities');

  // Duration & Session
  const [formDuration, setFormDuration] = useState<HolidayDurationType>('Full Day');
  const [formSession, setFormSession] = useState<HolidaySessionType>('Morning');

  // Restricted / Optional Holiday Controls
  const [formAllowEmployeeSelection, setFormAllowEmployeeSelection] = useState(true);
  const [formApprovalRequired, setFormApprovalRequired] = useState(true);
  const [formMaxOptionalHolidays, setFormMaxOptionalHolidays] = useState(2);

  const [formIsPaid, setFormIsPaid] = useState(true);
  const [formAttendanceOverride, setFormAttendanceOverride] = useState(true);
  const [formPayrollImpact, setFormPayrollImpact] = useState<'Paid Holiday' | 'Unpaid' | 'Half Day Paid'>('Paid Holiday');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState(true);

  // ── Open Modals Handlers ──
  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormName('');
    setFormDate('2026-09-15');
    setFormType('Mandatory');
    setFormCategory('National');
    setFormApplicableTo('Company');
    setFormApplicableTarget('All Company Entities');
    setFormDuration('Full Day');
    setFormSession('Morning');
    setFormAllowEmployeeSelection(true);
    setFormApprovalRequired(true);
    setFormMaxOptionalHolidays(2);
    setFormIsPaid(true);
    setFormAttendanceOverride(true);
    setFormPayrollImpact('Paid Holiday');
    setFormDescription('');
    setFormStatus(true);
    setIsDeclareOpen(true);
  };

  const openEditModal = (h: HolidayItem) => {
    setEditingHoliday(h);
    setFormName(h.name);
    setFormDate(h.date);
    setFormType(h.type);
    setFormCategory(h.category);
    setFormApplicableTo(h.applicableTo || 'Company');
    setFormApplicableTarget(h.applicableTarget || (h.applicableLocations?.[0] || 'All Company Entities'));
    setFormDuration(h.duration || 'Full Day');
    setFormSession(h.session || 'Morning');
    setFormAllowEmployeeSelection(h.allowEmployeeSelection ?? true);
    setFormApprovalRequired(h.approvalRequired ?? true);
    setFormMaxOptionalHolidays(h.maxOptionalHolidays || 2);
    setFormIsPaid(h.isPaid);
    setFormAttendanceOverride(h.attendanceOverride);
    setFormPayrollImpact(h.payrollImpact);
    setFormDescription(h.description);
    setFormStatus(h.isActive);
    setIsDeclareOpen(true);
  };

  const openViewModal = (h: HolidayItem) => {
    setViewingHoliday(h);
    setIsDetailsOpen(true);
  };

  // ── Action Handlers ──
  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Holiday name is required');
      return;
    }
    if (!formDate) {
      toast.error('Holiday date is required');
      return;
    }

    const isOptional = formType === 'Restricted / Optional';
    const payload = {
      companyId: activeCompanyId || 'cmto136wt01ibipkgbon2sw9s',
      name: formName.trim(),
      date: formDate,
      type: formType,
      category: formCategory,
      scope: formApplicableTo,
      applicableTo: formApplicableTo,
      applicableTarget: formApplicableTarget,
      applicableLocations: [formApplicableTarget],
      duration: formDuration,
      session: formDuration === 'Half Day' ? formSession : undefined,
      allowEmployeeSelection: isOptional ? formAllowEmployeeSelection : undefined,
      approvalRequired: isOptional ? formApprovalRequired : undefined,
      maxOptionalHolidays: isOptional ? formMaxOptionalHolidays : undefined,
      isPaid: formIsPaid,
      isOptional: isOptional,
      attendanceOverride: formAttendanceOverride,
      payrollImpact: formPayrollImpact,
      description: formDescription || 'Declared holiday for organization.',
      isActive: formStatus,
    };

    if (editingHoliday) {
      updateMutation.mutate({ id: editingHoliday.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDuplicateHoliday = (h: HolidayItem) => {
    const payload = {
      companyId: activeCompanyId || 'cmto136wt01ibipkgbon2sw9s',
      name: `Copy of ${h.name}`,
      date: h.date,
      type: h.type,
      category: h.category,
      scope: h.applicableTo || h.scope || 'Company',
      applicableTo: h.applicableTo || h.scope || 'Company',
      applicableTarget: h.applicableTarget || (h.applicableLocations?.[0] || 'All Company Entities'),
      applicableLocations: h.applicableLocations || ['All Company Entities'],
      duration: h.duration || 'Full Day',
      session: h.session,
      allowEmployeeSelection: h.allowEmployeeSelection,
      approvalRequired: h.approvalRequired,
      maxOptionalHolidays: h.maxOptionalHolidays,
      isPaid: h.isPaid,
      isOptional: h.isOptional,
      attendanceOverride: h.attendanceOverride,
      payrollImpact: h.payrollImpact,
      description: h.description,
      isActive: true,
    };
    createMutation.mutate(payload);
  };

  const handleToggleActive = (h: HolidayItem) => {
    updateMutation.mutate({
      id: h.id,
      payload: { isActive: !h.isActive },
    });
  };

  const handleDeleteHoliday = (h: HolidayItem) => {
    deleteMutation.mutate(h.id);
  };

  // ── Filtered Holidays Computation ──
  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const holidayYear = h.date.split('-')[0];
      if (selectedYear !== 'all' && holidayYear !== selectedYear) return false;

      // Status
      if (selectedStatus === 'active' && !h.isActive) return false;
      if (selectedStatus === 'inactive' && h.isActive) return false;

      // Type Tab & Type Select Filter
      if (selectedType !== 'all') {
        if (selectedType === 'mandatory' && h.type !== 'Mandatory') return false;
        if (selectedType === 'optional' && h.type !== 'Restricted / Optional') return false;
        if (selectedType === 'regional' && h.type !== 'Regional') return false;
        if (selectedType === 'company' && h.type !== 'Company Holiday') return false;
        if (selectedType === 'special' && h.type !== 'Special Holiday') return false;
      }

      // Category Filter
      if (selectedCategory !== 'all' && h.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Location / Scope Target Filter
      if (selectedLocation !== 'all') {
        const targetStr = (h.applicableTarget || '').toLowerCase();
        const locStr = (h.applicableLocations || []).join(' ').toLowerCase();
        const filterStr = selectedLocation.toLowerCase();
        const matchesTarget = targetStr.includes(filterStr) || targetStr.includes('all') || targetStr.includes('company');
        const matchesLoc = locStr.includes(filterStr) || locStr.includes('all') || locStr.includes('company');
        if (!matchesTarget && !matchesLoc) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesDate = h.date.toLowerCase().includes(q);
        const matchesType = h.type.toLowerCase().includes(q);
        const matchesCat = h.category.toLowerCase().includes(q);
        const matchesTarget = (h.applicableTarget || '').toLowerCase().includes(q);
        const matchesScope = (h.applicableTo || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDate && !matchesType && !matchesCat && !matchesTarget && !matchesScope) return false;
      }

      return true;
    });
  }, [holidays, selectedYear, selectedStatus, selectedType, selectedCategory, selectedLocation, searchQuery]);

  // ── Dynamic Summary Calculations ──
  const totalDeclaredHolidays = useMemo(() => {
    return holidays.filter(h => h.isActive && h.date.startsWith(selectedYear === 'all' ? '2026' : selectedYear)).length;
  }, [holidays, selectedYear]);

  const mandatoryPaidLeaves = useMemo(() => {
    return holidays.filter(
      h => h.isActive && h.type === 'Mandatory' && h.isPaid && h.date.startsWith(selectedYear === 'all' ? '2026' : selectedYear),
    ).length;
  }, [holidays, selectedYear]);

  const restrictedOptionalCount = useMemo(() => {
    return holidays.filter(
      h => h.isActive && h.type === 'Restricted / Optional' && h.date.startsWith(selectedYear === 'all' ? '2026' : selectedYear),
    ).length;
  }, [holidays, selectedYear]);

  const nextUpcomingHoliday = useMemo(() => {
    const todayStr = '2026-09-07';
    const upcoming = holidays
      .filter(h => h.isActive && h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    if (!upcoming) return null;

    const d1 = new Date(todayStr);
    const d2 = new Date(upcoming.date);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateObj = new Date(upcoming.date);
    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = dateObj.getDate();

    return {
      name: upcoming.name,
      formattedDate: `${monthStr} ${dayNum}`,
      daysRemaining: diffDays,
      type: upcoming.type,
      duration: upcoming.duration,
    };
  }, [holidays]);

  // Helper date formatter
  const formatDateBadge = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    const year = d.getFullYear();
    return { dayNum, monthStr, dayOfWeek, year, full: `${dayNum} ${monthStr} ${year}` };
  };

  const getDaysRemaining = (dateStr: string) => {
    const todayStr = '2026-09-07';
    const d1 = new Date(todayStr);
    const d2 = new Date(dateStr);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderScopeIcon = (scope: HolidayScopeType) => {
    switch (scope) {
      case 'Company':
        return <Building className="h-3 w-3 text-primary shrink-0" />;
      case 'Branch':
        return <MapPin className="h-3 w-3 text-blue-500 shrink-0" />;
      case 'Department':
        return <Briefcase className="h-3 w-3 text-purple-500 shrink-0" />;
      case 'Employee Group':
        return <Users className="h-3 w-3 text-amber-500 shrink-0" />;
      default:
        return <Building className="h-3 w-3 text-primary shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Dynamic Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Declared Holidays</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totalDeclaredHolidays} Days</p>
              <p className="text-[10px] text-primary font-semibold mt-1">{selectedYear} Work Calendar</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mandatory Paid Leaves</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{mandatoryPaidLeaves} Days</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Paid Statutory</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Restricted / Optional</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{restrictedOptionalCount} Days</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Employee Selectable</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next Upcoming Holiday</p>
              <p className="text-base font-bold text-foreground mt-0.5 truncate max-w-[130px]" title={nextUpcomingHoliday?.name}>
                {nextUpcomingHoliday ? `${nextUpcomingHoliday.formattedDate} (${nextUpcomingHoliday.name.slice(0, 8)}...)` : 'None Scheduled'}
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">
                {nextUpcomingHoliday ? `In ${nextUpcomingHoliday.daysRemaining} Days • ${nextUpcomingHoliday.type}` : 'No upcoming holiday'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Declared Holiday Calendar Section & Filters ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Declared Holiday Calendar
              </CardTitle>
              <CardDescription className="text-xs">
                Statutory national, festival, and branch restricted holidays across company locations
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Type Category Quick Tabs */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'mandatory', label: 'Mandatory' },
                  { id: 'optional', label: 'Restricted' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedType === type.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search holiday..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* + Declare Holiday Button */}
              <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold" onClick={openCreateModal}>
                <Plus className="h-3.5 w-3.5" /> Declare Holiday
              </Button>
            </div>
          </div>

          {/* ── Advanced Filters Row ── */}
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-border/40 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" /> Filters:
            </span>

            {/* Year Filter */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-7 w-[100px] text-xs bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Years</SelectItem>
                <SelectItem value="2025" className="text-xs">2025</SelectItem>
                <SelectItem value="2026" className="text-xs">2026</SelectItem>
                <SelectItem value="2027" className="text-xs">2027</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-7 w-[130px] text-xs bg-background">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="mandatory" className="text-xs">Mandatory</SelectItem>
                <SelectItem value="optional" className="text-xs">Restricted / Optional</SelectItem>
                <SelectItem value="regional" className="text-xs">Regional</SelectItem>
                <SelectItem value="company" className="text-xs">Company Holiday</SelectItem>
                <SelectItem value="special" className="text-xs">Special Holiday</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-7 w-[130px] text-xs bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                <SelectItem value="national" className="text-xs">National</SelectItem>
                <SelectItem value="festival" className="text-xs">Festival</SelectItem>
                <SelectItem value="regional" className="text-xs">Regional</SelectItem>
                <SelectItem value="religious" className="text-xs">Religious</SelectItem>
                <SelectItem value="company event" className="text-xs">Company Event</SelectItem>
                <SelectItem value="government declared" className="text-xs">Government Declared</SelectItem>
                <SelectItem value="other" className="text-xs">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Location / Scope Filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-7 w-[150px] text-xs bg-background">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Scopes & Locations</SelectItem>
                <SelectItem value="company" className="text-xs">Company-wide</SelectItem>
                {availableBranchNames.map(bName => (
                  <SelectItem key={bName} value={bName.toLowerCase()} className="text-xs">
                    {bName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-7 w-[110px] text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Status</SelectItem>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {(selectedYear !== '2026' || selectedType !== 'all' || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedStatus !== 'active' || searchQuery !== '') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedYear('2026');
                  setSelectedType('all');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSelectedStatus('active');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Grid View */}
          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredHolidays.map(h => {
                const dateMeta = formatDateBadge(h.date);
                const daysRem = getDaysRemaining(h.date);
                const isUpcoming = daysRem >= 0 && daysRem <= 180;
                const isHalfDay = h.duration === 'Half Day';

                return (
                  <div
                    key={h.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative overflow-hidden ${
                      !h.isActive ? 'opacity-60 border-dashed border-border' : 'border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary font-semibold text-center border border-primary/20 shrink-0">
                          <span className="font-mono text-base font-bold leading-none">{dateMeta.dayNum}</span>
                          <span className="text-[9.5px] uppercase font-bold tracking-wider leading-none mt-0.5">{dateMeta.monthStr}</span>
                        </div>
                        <div className="truncate">
                          <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 font-mono">
                            {dateMeta.dayOfWeek}
                          </Badge>
                          {isUpcoming && h.isActive && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-semibold block mt-1">
                              {daysRem === 0 ? 'Today!' : `In ${daysRem} days`}
                            </Badge>
                          )}
                          {!h.isActive && (
                            <Badge variant="destructive" className="text-[9px] px-1 mt-1 block">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem onClick={() => openViewModal(h)}>
                            <Eye className="h-3.5 w-3.5 mr-2 text-primary" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(h)}>
                            <Pencil className="h-3.5 w-3.5 mr-2 text-amber-500" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateHoliday(h)}>
                            <Copy className="h-3.5 w-3.5 mr-2 text-blue-500" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(h)}>
                            <Power className="h-3.5 w-3.5 mr-2 text-slate-500" /> {h.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteHoliday(h)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate cursor-pointer"
                          onClick={() => openViewModal(h)}
                        >
                          {h.name}
                        </h3>
                      </div>

                      {/* Duration Tag */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {isHalfDay ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9.5px] font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Half Day ({h.session || 'Morning'})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9.5px] text-muted-foreground font-normal">
                            Full Day
                          </Badge>
                        )}

                        {h.type === 'Restricted / Optional' && (
                          <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[9px]">
                            Max: {h.maxOptionalHolidays || 2}
                          </Badge>
                        )}
                      </div>

                      {/* Applicable To & Target */}
                      <p className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 mt-2 truncate font-medium">
                        {renderScopeIcon(h.applicableTo)}
                        <span className="text-foreground/80 font-semibold">{h.applicableTo}:</span>
                        <span className="truncate">{h.applicableTarget}</span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                      <span className="text-muted-foreground font-mono">{dateMeta.full}</span>
                      <Badge
                        className={`text-[9.5px] font-semibold ${
                          h.type === 'Mandatory'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : h.type === 'Regional'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                        }`}
                      >
                        {h.type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {filteredHolidays.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                  No holidays match the specified filter criteria.
                </div>
              )}
            </div>
          )}

          {/* List / Table View */}
          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Holiday Name</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Applicable Scope & Target</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Paid</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.map(h => {
                  const dateMeta = formatDateBadge(h.date);
                  return (
                    <TableRow key={h.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{dateMeta.full}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">{h.name}</TableCell>
                      <TableCell className="text-xs">
                        {h.duration === 'Half Day' ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-medium">
                            Half Day ({h.session || 'Morning'})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Full Day</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <Badge
                          className={`text-[10px] ${
                            h.type === 'Mandatory'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : h.type === 'Regional'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                          }`}
                        >
                          {h.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          {renderScopeIcon(h.applicableTo)}
                          <span className="font-semibold text-foreground/80">{h.applicableTo}:</span>
                          <span className="text-muted-foreground">{h.applicableTarget}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.category}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={h.isPaid ? 'secondary' : 'outline'} className="text-[10px]">
                          {h.isPaid ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={h.isActive ? 'secondary' : 'destructive'} className="text-[10px]">
                          {h.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 text-xs">
                            <DropdownMenuItem onClick={() => openViewModal(h)}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-primary" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(h)}>
                              <Pencil className="h-3.5 w-3.5 mr-2 text-amber-500" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateHoliday(h)}>
                              <Copy className="h-3.5 w-3.5 mr-2 text-blue-500" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(h)}>
                              <Power className="h-3.5 w-3.5 mr-2 text-slate-500" /> {h.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteHoliday(h)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredHolidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                      No holidays match the search or filter query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL 1: Declare / Edit Holiday Dialog ── */}
      <Dialog open={isDeclareOpen} onOpenChange={setIsDeclareOpen}>
        <DialogContent className="sm:max-w-md max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingHoliday ? 'Edit Declared Holiday' : 'Declare Holiday'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3.5 text-xs" onSubmit={handleSaveHoliday}>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Company Entity *</Label>
              <Select defaultValue="c1">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c1" className="text-xs">
                    MONTANARI LIFTS COMPONENTS PVT. LTD — LIVE Plot C-3 MIDC
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Holiday Name *</Label>
                <Input
                  placeholder="e.g. Maharashtra Day"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Holiday Date *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Holiday Type *</Label>
                <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mandatory" className="text-xs">Mandatory (Public Holiday)</SelectItem>
                    <SelectItem value="Restricted / Optional" className="text-xs">Restricted / Optional</SelectItem>
                    <SelectItem value="Regional" className="text-xs">Regional</SelectItem>
                    <SelectItem value="Company Holiday" className="text-xs">Company Holiday</SelectItem>
                    <SelectItem value="Special Holiday" className="text-xs">Special Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Holiday Category *</Label>
                <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National" className="text-xs">National</SelectItem>
                    <SelectItem value="Festival" className="text-xs">Festival</SelectItem>
                    <SelectItem value="Regional" className="text-xs">Regional</SelectItem>
                    <SelectItem value="Religious" className="text-xs">Religious</SelectItem>
                    <SelectItem value="Company Event" className="text-xs">Company Event</SelectItem>
                    <SelectItem value="Government Declared" className="text-xs">Government Declared</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Standardized Applicable Scope Selection ── */}
            <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Applicable To *</Label>
                <span className="text-[10.5px] text-muted-foreground">Select scope & target</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Company', 'Branch', 'Department', 'Employee Group'] as HolidayScopeType[]).map(scope => {
                  const isSelected = formApplicableTo === scope;
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => {
                        setFormApplicableTo(scope);
                        if (scope === 'Company') setFormApplicableTarget('All Company Entities');
                        else if (scope === 'Branch') setFormApplicableTarget(availableBranchNames[0] || 'Pune Manufacturing Plant');
                        else if (scope === 'Department') setFormApplicableTarget(availableDepartmentNames[0] || 'Operations & Production');
                        else if (scope === 'Employee Group') setFormApplicableTarget(DEFAULT_EMPLOYEE_GROUPS[0]);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full shrink-0 ${isSelected ? 'bg-primary' : 'border border-muted-foreground'}`} />
                      <span className="truncate">{scope}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Target Input based on Scope */}
              <div className="pt-2">
                {formApplicableTo === 'Company' && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Target Company Entity</Label>
                    <Select value={formApplicableTarget} onValueChange={setFormApplicableTarget}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Company Entities" className="text-xs font-medium text-primary">All Company Entities (Entire Organization)</SelectItem>
                        <SelectItem value="Montanari Lifts Components Pvt Ltd" className="text-xs">Montanari Lifts Components Pvt Ltd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formApplicableTo === 'Branch' && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Target Branch Location *</Label>
                    <Select value={formApplicableTarget} onValueChange={setFormApplicableTarget}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranchNames.map(bName => (
                          <SelectItem key={bName} value={bName} className="text-xs font-medium">
                            {bName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formApplicableTo === 'Department' && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Target Department *</Label>
                    <Select value={formApplicableTarget} onValueChange={setFormApplicableTarget}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartmentNames.map(dName => (
                          <SelectItem key={dName} value={dName} className="text-xs font-medium">
                            {dName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formApplicableTo === 'Employee Group' && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Target Employee Group *</Label>
                    <Select value={formApplicableTarget} onValueChange={setFormApplicableTarget}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_EMPLOYEE_GROUPS.map(gName => (
                          <SelectItem key={gName} value={gName} className="text-xs font-medium">
                            {gName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* ── Holiday Duration (Full Day vs Half Day) ── */}
            <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
              <Label className="text-xs font-semibold text-foreground">Holiday Duration *</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Full Day', 'Half Day'] as HolidayDurationType[]).map(dur => {
                  const isSelected = formDuration === dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        setFormDuration(dur);
                        if (dur === 'Half Day' && formPayrollImpact === 'Paid Holiday') {
                          setFormPayrollImpact('Half Day Paid');
                        } else if (dur === 'Full Day' && formPayrollImpact === 'Half Day Paid') {
                          setFormPayrollImpact('Paid Holiday');
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full shrink-0 ${isSelected ? 'bg-primary' : 'border border-muted-foreground'}`} />
                      <span>{dur}</span>
                    </button>
                  );
                })}
              </div>

              {/* Half Day Session Selection */}
              {formDuration === 'Half Day' && (
                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600" /> Applicable Session *
                    </Label>
                    <span className="text-[10px] text-muted-foreground">E.g., Saturday afternoon off</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Morning', 'Afternoon'] as HolidaySessionType[]).map(sess => {
                      const isSessSelected = formSession === sess;
                      return (
                        <button
                          key={sess}
                          type="button"
                          onClick={() => setFormSession(sess)}
                          className={`py-1.5 px-3 rounded-md border text-xs transition-all ${
                            isSessSelected
                              ? 'border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {sess} Session
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Optional / Restricted Holiday Settings ── */}
            {formType === 'Restricted / Optional' && (
              <div className="space-y-3 p-3 rounded-xl border border-violet-500/30 bg-violet-500/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-bold text-violet-900 dark:text-violet-200">
                    Restricted / Optional Holiday Rules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Employee Selection</Label>
                    <Select
                      value={formAllowEmployeeSelection ? 'yes' : 'no'}
                      onValueChange={v => setFormAllowEmployeeSelection(v === 'yes')}
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes" className="text-xs">Employee / Group can select</SelectItem>
                        <SelectItem value="no" className="text-xs">Manager assigned only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Approval Required</Label>
                    <Select
                      value={formApprovalRequired ? 'yes' : 'no'}
                      onValueChange={v => setFormApprovalRequired(v === 'yes')}
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes" className="text-xs">Yes (Approval Required)</SelectItem>
                        <SelectItem value="no" className="text-xs">No (Auto-Approved)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Maximum Optional Holidays (Per Employee / Year)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formMaxOptionalHolidays}
                    onChange={e => setFormMaxOptionalHolidays(parseInt(e.target.value) || 2)}
                    className="h-8 text-xs bg-card w-full sm:w-36 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Checkbox Options */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer border rounded-md p-2 bg-background">
                <input
                  type="checkbox"
                  checked={formIsPaid}
                  onChange={e => setFormIsPaid(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <div>
                  <span className="font-semibold block">Paid Holiday</span>
                  <span className="text-[10px] text-muted-foreground">Full compensation entitlement</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer border rounded-md p-2 bg-background">
                <input
                  type="checkbox"
                  checked={formAttendanceOverride}
                  onChange={e => setFormAttendanceOverride(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <div>
                  <span className="font-semibold block">Attendance Override</span>
                  <span className="text-[10px] text-muted-foreground">Holiday — No normal punch required</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Payroll Treatment</Label>
                <Select value={formPayrollImpact} onValueChange={(v: any) => setFormPayrollImpact(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid Holiday" className="text-xs">Paid Holiday</SelectItem>
                    <SelectItem value="Unpaid" className="text-xs">Unpaid</SelectItem>
                    <SelectItem value="Half Day Paid" className="text-xs">Half Day Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={formStatus ? 'active' : 'inactive'} onValueChange={v => setFormStatus(v === 'active')}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <textarea
                placeholder="Holiday details and administrative notes..."
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                className="flex min-h-[55px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDeclareOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                {editingHoliday ? 'Save Changes' : 'Declare Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: View Holiday Details Dialog ── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Holiday Configuration Details
            </DialogTitle>
          </DialogHeader>
          {viewingHoliday && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{viewingHoliday.name}</h4>
                  <p className="text-muted-foreground font-mono mt-0.5">{formatDateBadge(viewingHoliday.date).full}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={`text-xs font-semibold ${
                      viewingHoliday.type === 'Mandatory'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                    }`}
                  >
                    {viewingHoliday.type}
                  </Badge>
                  {viewingHoliday.duration === 'Half Day' ? (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                      Half Day ({viewingHoliday.session})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Full Day
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border rounded-lg">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-foreground">{viewingHoliday.category}</span>
                </div>
                <div className="p-2 border rounded-lg">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Payroll Entitlement</span>
                  <span className="font-semibold text-emerald-600">{viewingHoliday.payrollImpact}</span>
                </div>
              </div>

              {/* Applicable Scope & Target */}
              <div className="space-y-1 p-2.5 border rounded-lg bg-card">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Applicable Scope</span>
                <div className="flex items-center gap-2 pt-0.5">
                  {renderScopeIcon(viewingHoliday.applicableTo)}
                  <span className="font-bold text-foreground">{viewingHoliday.applicableTo}:</span>
                  <span className="text-primary font-medium">{viewingHoliday.applicableTarget}</span>
                </div>
              </div>

              {/* Optional Holiday Rules if applicable */}
              {viewingHoliday.type === 'Restricted / Optional' && (
                <div className="space-y-2 p-2.5 rounded-lg border border-violet-500/30 bg-violet-500/5">
                  <span className="text-violet-900 dark:text-violet-200 text-[10.5px] uppercase font-bold block">
                    Optional Holiday Governance
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Employee Selection</span>
                      <span className="font-semibold text-foreground">
                        {viewingHoliday.allowEmployeeSelection ? 'Employee / Group can select' : 'Manager Assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Approval Required</span>
                      <span className="font-semibold text-foreground">
                        {viewingHoliday.approvalRequired ? 'Yes (Manager)' : 'No (Auto-Approved)'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px]">
                    <span className="text-muted-foreground block text-[10px]">Max Optional per Employee</span>
                    <span className="font-bold text-violet-700 dark:text-violet-300">
                      {viewingHoliday.maxOptionalHolidays || 2} Days / Year
                    </span>
                  </div>
                </div>
              )}

              {/* System Integration Rules */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h5 className="font-semibold text-foreground text-[11px]">System Integration Rules</h5>
                
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Attendance Rule</span>
                    Holiday attendance status published automatically. No absence or late penalty incurred on this date.
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-700 text-[11px] flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Leave Protection Rule</span>
                    Leave balance is protected. Holiday dates are not deducted from casual or earned leave quotas.
                  </div>
                </div>
              </div>

              {viewingHoliday.description && (
                <div className="p-2.5 rounded-lg bg-muted/20 border text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground block">Notes:</span>
                  {viewingHoliday.description}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => { setIsDetailsOpen(false); openEditModal(viewingHoliday); }}>
                  Edit Holiday
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
