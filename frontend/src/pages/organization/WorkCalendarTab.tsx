import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  Briefcase,
  AlertCircle,
  Building,
  CheckSquare,
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
import { branchesApi } from '@/api/organization';

export interface HolidayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'Mandatory' | 'Restricted / Optional' | 'Regional' | 'Company Holiday' | 'Special Holiday';
  category: 'National' | 'Festival' | 'Regional' | 'Religious' | 'Company Event' | 'Government Declared' | 'Other';
  scope: 'Company-wide' | 'Branch-specific' | 'Region/State-specific';
  applicableLocations: string[]; // e.g. ['Company-wide'] or ['Pune Manufacturing Plant', 'Mumbai Office']
  isPaid: boolean;
  isOptional: boolean;
  attendanceOverride: boolean; // Suppress biometric punch requirement
  payrollImpact: 'Paid Holiday' | 'Unpaid' | 'Half Day Paid';
  description: string;
  isActive: boolean;
  referencedInAttendance?: boolean;
}

const INITIAL_HOLIDAYS: HolidayItem[] = [
  {
    id: 'h1',
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
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
    scope: 'Region/State-specific',
    applicableLocations: ['Maharashtra State'],
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
    scope: 'Branch-specific',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
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
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
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
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
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
    scope: 'Branch-specific',
    applicableLocations: ['Pune Manufacturing Plant'],
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
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
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
    scope: 'Company-wide',
    applicableLocations: ['Company-wide'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Annual festival celebrating Christmas across all branches.',
    isActive: true,
    referencedInAttendance: false,
  },
];

const AVAILABLE_REGIONS = [
  'Maharashtra State',
  'Karnataka State',
  'Delhi NCR Region',
  'Telangana State',
];

export function WorkCalendarTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;

  // Fetch branches from backend dynamically
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

  // Holidays state
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);

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
  const [isWorkweekOpen, setIsWorkweekOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);

  // Selected holiday for Edit / View / Delete
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [viewingHoliday, setViewingHoliday] = useState<HolidayItem | null>(null);

  // Declare Form State
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('2026-01-01');
  const [formType, setFormType] = useState<HolidayItem['type']>('Mandatory');
  const [formCategory, setFormCategory] = useState<HolidayItem['category']>('National');
  const [formScope, setFormScope] = useState<HolidayItem['scope']>('Company-wide');
  const [formLocations, setFormLocations] = useState<string[]>(['Company-wide']);
  const [formIsPaid, setFormIsPaid] = useState(true);
  const [formIsOptional, setFormIsOptional] = useState(false);
  const [formAttendanceOverride, setFormAttendanceOverride] = useState(true);
  const [formPayrollImpact, setFormPayrollImpact] = useState<'Paid Holiday' | 'Unpaid' | 'Half Day Paid'>('Paid Holiday');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState(true);

  // Workweek Configuration State
  const [workweekType, setWorkweekType] = useState<'5-Day' | '6-Day' | 'Custom'>('5-Day');
  const [workingDays, setWorkingDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [saturdayPolicy, setSaturdayPolicy] = useState('Off');
  const [sundayPolicy, setSundayPolicy] = useState('Weekly Off');

  // Shift Configuration State
  const [shiftName, setShiftName] = useState('General Shift');
  const [shiftStartTime, setShiftStartTime] = useState('09:00 AM');
  const [shiftEndTime, setShiftEndTime] = useState('06:00 PM');
  const [shiftBreakStart, setShiftBreakStart] = useState('01:00 PM');
  const [shiftBreakEnd, setShiftBreakEnd] = useState('02:00 PM');
  const [shiftTotalHours, setShiftTotalHours] = useState('8');
  const [shiftGracePeriod, setShiftGracePeriod] = useState('10');
  const [shiftLocations, setShiftLocations] = useState<string[]>(['Pune Manufacturing Plant', 'Mumbai Office']);
  const [shiftStatus, setShiftStatus] = useState<'Active' | 'Inactive'>('Active');

  // Biometric IoT Override Policy State
  const [holidayAttendancePolicy, setHolidayAttendancePolicy] = useState<'Block Check-In' | 'Allow Check-In' | 'Allow with Holiday OT'>('Allow with Holiday OT');
  const [autoSuppressAttendance, setAutoSuppressAttendance] = useState(true);
  const [recordHolidayAttendance, setRecordHolidayAttendance] = useState(true);
  const [markAsHolidayWork, setMarkAsHolidayWork] = useState(true);
  const [calculateOtIfApproved, setCalculateOtIfApproved] = useState(true);

  // ── Open Modals Handlers ──
  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormName('');
    setFormDate('2026-09-15');
    setFormType('Mandatory');
    setFormCategory('National');
    setFormScope('Company-wide');
    setFormLocations(['Company-wide']);
    setFormIsPaid(true);
    setFormIsOptional(false);
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
    setFormScope(
      h.scope ||
        (h.applicableLocations.some(l => l.includes('All') || l === 'Company-wide')
          ? 'Company-wide'
          : 'Branch-specific'),
    );
    setFormLocations(h.applicableLocations);
    setFormIsPaid(h.isPaid);
    setFormIsOptional(h.isOptional);
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

    const finalLocations =
      formScope === 'Company-wide'
        ? ['Company-wide']
        : formLocations.length
        ? formLocations
        : ['Company-wide'];

    if (editingHoliday) {
      setHolidays(prev =>
        prev.map(item =>
          item.id === editingHoliday.id
            ? {
                ...item,
                name: formName,
                date: formDate,
                type: formType,
                category: formCategory,
                scope: formScope,
                applicableLocations: finalLocations,
                isPaid: formIsPaid,
                isOptional: formIsOptional,
                attendanceOverride: formAttendanceOverride,
                payrollImpact: formPayrollImpact,
                description: formDescription,
                isActive: formStatus,
              }
            : item,
        ),
      );
      toast.success(`Holiday "${formName}" updated successfully`);
    } else {
      const newHoliday: HolidayItem = {
        id: `h_${Date.now()}`,
        name: formName,
        date: formDate,
        type: formType,
        category: formCategory,
        scope: formScope,
        applicableLocations: finalLocations,
        isPaid: formIsPaid,
        isOptional: formIsOptional,
        attendanceOverride: formAttendanceOverride,
        payrollImpact: formPayrollImpact,
        description: formDescription || 'National holiday for all employees.',
        isActive: formStatus,
        referencedInAttendance: false,
      };
      setHolidays(prev => [...prev, newHoliday]);
      toast.success(`Holiday "${formName}" declared successfully`);
    }
    setIsDeclareOpen(false);
  };

  const handleDuplicateHoliday = (h: HolidayItem) => {
    const copy: HolidayItem = {
      ...h,
      id: `h_${Date.now()}`,
      name: `Copy of ${h.name}`,
      referencedInAttendance: false,
    };
    setHolidays(prev => [...prev, copy]);
    toast.success(`Duplicated holiday as "${copy.name}"`);
  };

  const handleToggleActive = (h: HolidayItem) => {
    setHolidays(prev =>
      prev.map(item => (item.id === h.id ? { ...item, isActive: !item.isActive } : item)),
    );
    toast.success(`Holiday "${h.name}" ${h.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleDeleteHoliday = (h: HolidayItem) => {
    if (h.referencedInAttendance) {
      toast.warning('This holiday is already referenced by attendance records. Deactivate it instead of deleting to protect audit history.', {
        duration: 5000,
      });
      return;
    }
    setHolidays(prev => prev.filter(item => item.id !== h.id));
    toast.success(`Holiday "${h.name}" deleted from calendar`);
  };

  const handleSaveWorkweek = (e: React.FormEvent) => {
    e.preventDefault();
    setIsWorkweekOpen(false);
    toast.success('Standard Workweek configuration saved successfully');
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    setIsShiftOpen(false);
    toast.success('Shift configuration saved successfully');
  };

  const handleSaveBiometricPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBiometricOpen(false);
    toast.success('Biometric Machine Holiday Override Policy saved');
  };

  // ── Location Checkbox Toggle ──
  const toggleFormLocation = (loc: string) => {
    if (loc === 'All India Facilities') {
      setFormLocations(['All India Facilities']);
      return;
    }
    setFormLocations(prev => {
      const filtered = prev.filter(l => l !== 'All India Facilities');
      if (filtered.includes(loc)) {
        const next = filtered.filter(l => l !== loc);
        return next.length ? next : ['All India Facilities'];
      }
      return [...filtered, loc];
    });
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

      // Location Filter
      if (selectedLocation !== 'all') {
        const hasLocation = h.applicableLocations.some(
          loc => loc.toLowerCase().includes(selectedLocation.toLowerCase()) || loc.includes('All'),
        );
        if (!hasLocation) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesDate = h.date.toLowerCase().includes(q);
        const matchesType = h.type.toLowerCase().includes(q);
        const matchesCat = h.category.toLowerCase().includes(q);
        const matchesLoc = h.applicableLocations.some(l => l.toLowerCase().includes(q));
        if (!matchesName && !matchesDate && !matchesType && !matchesCat && !matchesLoc) return false;
      }

      return true;
    });
  }, [holidays, selectedYear, selectedStatus, selectedType, selectedCategory, selectedLocation, searchQuery]);

  // ── Dynamic Summary Calculations (Section 16) ──
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

  return (
    <div className="space-y-6">
      {/* ── 1. Dynamic Summary Cards (Section 1 & 16) ── */}
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

      {/* ── 2. Declared Holiday Calendar Section & Filters (Section 2, 7, 8) ── */}
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

          {/* ── Advanced Filters Row (Section 7) ── */}
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

            {/* Location Filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-7 w-[150px] text-xs bg-background">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Locations</SelectItem>
                <SelectItem value="company-wide" className="text-xs">Company-wide</SelectItem>
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

                      {/* Dropdown Menu (Section 6) */}
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
                      <h3
                        className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate cursor-pointer"
                        onClick={() => openViewModal(h)}
                      >
                        {h.name}
                      </h3>
                      <p className="text-[10.5px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        {h.applicableLocations.join(', ')}
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

          {/* List / Table View (Section 8) */}
          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Holiday Name</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Applicable Locations</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground">{h.category}</TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {h.applicableLocations.join(', ')}
                      </TableCell>
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
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      No holidays match the search or filter query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Workweek, Shift & Biometric Policy Banner (Sections 9, 10, 11) ── */}
      <Card className="shadow-2xs bg-muted/20 border-border/80">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" /> Standard Workweek & Biometric Sync Policy
          </CardTitle>
          <CardDescription className="text-xs">
            Standard corporate shift hours, weekend policy & automatic biometric machine holiday overrides (Click any card to configure)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            {/* Workweek Policy Interactive Card (Section 9) */}
            <div
              className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group"
              onClick={() => setIsWorkweekOpen(true)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> {workweekType} Workweek Policy
                </span>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Monday to Friday ({weeklyHours} Hours/Week) • Saturdays & Sundays Off
              </p>
            </div>

            {/* Standard General Shift Interactive Card (Section 10) */}
            <div
              className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group"
              onClick={() => setIsShiftOpen(true)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> {shiftName}
                </span>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {shiftStartTime} – {shiftEndTime} (1 Hour Paid Break included)
              </p>
            </div>

            {/* Biometric IoT Override Interactive Card (Section 11) */}
            <div
              className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer group"
              onClick={() => setIsBiometricOpen(true)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Biometric IoT Machine Override
                </span>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-emerald-600 font-semibold mt-1 text-[11px]">
                Biometric check-in auto-suppressed on declared holidays
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MODAL 1: Declare / Edit Holiday Dialog (Simplified Scope Flow) ── */}
      <Dialog open={isDeclareOpen} onOpenChange={setIsDeclareOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingHoliday ? 'Edit Declared Holiday' : 'Declare Holiday'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3 text-xs" onSubmit={handleSaveHoliday}>
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
                  placeholder="e.g. Republic Day"
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
                    <SelectItem value="Mandatory" className="text-xs">Mandatory</SelectItem>
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

            {/* Holiday Scope Selection (Default Company-wide) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Holiday Scope *</Label>
              <Select
                value={formScope}
                onValueChange={(v: any) => {
                  setFormScope(v);
                  if (v === 'Company-wide') {
                    setFormLocations(['Company-wide']);
                  } else if (v === 'Branch-specific' && (!formLocations.length || formLocations.includes('Company-wide'))) {
                    setFormLocations([availableBranchNames[0] || 'Pune Manufacturing Plant']);
                  } else if (v === 'Region/State-specific' && (!formLocations.length || formLocations.includes('Company-wide'))) {
                    setFormLocations(['Maharashtra State']);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company-wide" className="text-xs font-semibold text-primary">Company-wide (All Employees)</SelectItem>
                  <SelectItem value="Branch-specific" className="text-xs">Branch-specific</SelectItem>
                  <SelectItem value="Region/State-specific" className="text-xs">Region/State-specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Location Checklist (Only shown if Scope !== 'Company-wide') */}
            {formScope !== 'Company-wide' && (
              <div className="space-y-1.5 border rounded-lg p-2.5 bg-muted/20">
                <Label className="text-xs font-semibold block text-foreground">
                  {formScope === 'Branch-specific' ? 'Applicable Branches *' : 'Applicable Regions *'}
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(formScope === 'Branch-specific' ? availableBranchNames : AVAILABLE_REGIONS).map(loc => {
                    const isChecked = formLocations.includes(loc);
                    return (
                      <label key={loc} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setFormLocations(prev => prev.filter(l => l !== loc));
                            } else {
                              setFormLocations(prev => [...prev.filter(l => l !== 'Company-wide'), loc]);
                            }
                          }}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        <span className={isChecked ? 'font-medium text-foreground' : 'text-muted-foreground'}>{loc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checkbox Rows */}
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
                  <span className="text-[10px] text-muted-foreground">Holiday — No normal attendance required</span>
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
                placeholder="National holiday for all employees..."
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

      {/* ── MODAL 2: View Holiday Details Dialog (Section 6, 12, 13, 14, 15) ── */}
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
                <Badge
                  className={`text-xs font-semibold ${
                    viewingHoliday.type === 'Mandatory'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                  }`}
                >
                  {viewingHoliday.type}
                </Badge>
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

              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Applicable Locations</span>
                <div className="flex flex-wrap gap-1">
                  {viewingHoliday.applicableLocations.map(loc => (
                    <Badge key={loc} variant="outline" className="text-[10.5px]">
                      <Building className="h-3 w-3 mr-1 text-primary" /> {loc}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Integrated Workflow Badges (Sections 11 - 15) */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h5 className="font-semibold text-foreground text-[11px]">System Integration Rules</h5>
                
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Biometric IoT Punch Rule</span>
                    Biometric check-in auto-suppressed on this date for employees at applicable branches.
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-700 text-[11px] flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Leave Deduction Rule</span>
                    Leave balance is protected. No leave days will be deducted if employee applies leave spanning this holiday.
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 text-[11px] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Holiday Work & OT Workflow</span>
                    Punches on this holiday will be marked as "Holiday Work". Subject to manager approval for Overtime or Comp-Off.
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

      {/* ── MODAL 3: Workweek Configuration Modal (Section 9) ── */}
      <Dialog open={isWorkweekOpen} onOpenChange={setIsWorkweekOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Workweek Configuration</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 text-xs" onSubmit={handleSaveWorkweek}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Workweek Mode</Label>
              <Select value={workweekType} onValueChange={(v: any) => setWorkweekType(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-Day" className="text-xs">5-Day Workweek (Mon–Fri)</SelectItem>
                  <SelectItem value="6-Day" className="text-xs">6-Day Workweek (Mon–Sat Factory)</SelectItem>
                  <SelectItem value="Custom" className="text-xs">Custom Workweek Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 border rounded-lg p-3 bg-muted/20">
              <Label className="text-xs font-semibold block text-foreground">Working Days</Label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {Object.keys(workingDays).map(day => (
                  <label key={day} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(workingDays as any)[day]}
                      onChange={e => setWorkingDays(prev => ({ ...prev, [day]: e.target.checked }))}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span className={(workingDays as any)[day] ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Weekly Target Hours</Label>
                <Input
                  type="number"
                  value={weeklyHours}
                  onChange={e => setWeeklyHours(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Saturday Policy</Label>
                <Select value={saturdayPolicy} onValueChange={setSaturdayPolicy}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Off" className="text-xs">Saturday: Off</SelectItem>
                    <SelectItem value="Half Day" className="text-xs">Saturday: Half Day</SelectItem>
                    <SelectItem value="Working" className="text-xs">Saturday: Full Working</SelectItem>
                    <SelectItem value="Alternate Off" className="text-xs">2nd & 4th Saturday Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWorkweekOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Save Workweek
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 4: Shift Configuration Modal (Section 10) ── */}
      <Dialog open={isShiftOpen} onOpenChange={setIsShiftOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Shift Configuration</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 text-xs" onSubmit={handleSaveShift}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Shift Name *</Label>
              <Input
                value={shiftName}
                onChange={e => setShiftName(e.target.value)}
                className="h-9 text-xs"
                placeholder="e.g. General Shift"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Time *</Label>
                <Input
                  value={shiftStartTime}
                  onChange={e => setShiftStartTime(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Time *</Label>
                <Input
                  value={shiftEndTime}
                  onChange={e => setShiftEndTime(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Break Window</Label>
                <Input
                  value={`${shiftBreakStart} - ${shiftBreakEnd}`}
                  onChange={e => {
                    const [s, end] = e.target.value.split('-');
                    if (s) setShiftBreakStart(s.trim());
                    if (end) setShiftBreakEnd(end.trim());
                  }}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Grace Period (Mins)</Label>
                <Input
                  type="number"
                  value={shiftGracePeriod}
                  onChange={e => setShiftGracePeriod(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsShiftOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Save Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 5: Biometric Machine Holiday Override Policy (Section 11) ── */}
      <Dialog open={isBiometricOpen} onOpenChange={setIsBiometricOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Holiday Attendance & Biometric Policy</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 text-xs" onSubmit={handleSaveBiometricPolicy}>
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <Label className="text-xs font-semibold block text-foreground">On Declared Holiday Action</Label>
              <div className="space-y-1.5 pt-1">
                {[
                  { id: 'Block Check-In', label: 'Block Check-In', desc: 'Prevent biometric check-in on declared holidays' },
                  { id: 'Allow Check-In', label: 'Allow Check-In', desc: 'Record normal attendance without OT' },
                  { id: 'Allow with Holiday OT', label: 'Allow with Holiday OT', desc: 'Record as Holiday Work and process OT if approved' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-start gap-2 cursor-pointer border rounded-md p-2 bg-background">
                    <input
                      type="radio"
                      name="holidayPolicy"
                      checked={holidayAttendancePolicy === opt.id}
                      onChange={() => setHolidayAttendancePolicy(opt.id as any)}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-semibold block text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 border rounded-lg p-3 bg-card">
              <Label className="text-xs font-semibold block text-foreground">Biometric Machine Rules</Label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSuppressAttendance}
                  onChange={e => setAutoSuppressAttendance(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <span className="font-medium text-foreground">Automatically suppress normal attendance requirement</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={recordHolidayAttendance}
                  onChange={e => setRecordHolidayAttendance(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <span className="font-medium text-foreground">Record attendance if employee punches on holiday</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={markAsHolidayWork}
                  onChange={e => setMarkAsHolidayWork(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <span className="font-medium text-foreground">Mark status as "Present - Holiday Work"</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={calculateOtIfApproved}
                  onChange={e => setCalculateOtIfApproved(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <span className="font-medium text-foreground">Calculate OT / Comp-Off upon manager approval</span>
              </label>
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBiometricOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Save Attendance Policy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
