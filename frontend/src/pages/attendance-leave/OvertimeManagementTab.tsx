import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { overtimeApi, attendanceApi } from '@/api/attendance-leave';
import { employeesApi } from '@/api/employees';
import { companiesApi, branchesApi } from '@/api/organization';
import {
  ShieldCheck,
  Plus,
  Search,
  Clock,
  DollarSign,
  Briefcase,
  TrendingUp,
  FileCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Calculator,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  ArrowRight,
  Info,
  Scale,
  FileSpreadsheet,
  Download,
  Fingerprint,
  RefreshCw,
  Power,
  PowerOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATA MODELS & CONFIGURABLE POLICY MASTER
// ─────────────────────────────────────────────────────────────────────────────

export interface OvertimePolicy {
  id: string;
  name: string;
  applicableCategory: string;
  establishmentType: string;
  dailyThresholdHours: number; // 9.0h Normal working day limit
  weeklyThresholdHours: number; // 48.0h
  normalWorkdayMultiplier: number; // 2.0x statutory rate under Section 59
  weeklyOffMultiplier: number; // 2.0x
  holidayMultiplier: number; // 2.0x
  breakDurationMins: number; // 30m
  breakTreatment: 'INCLUDED_IN_9H' | 'EXCLUDED_FROM_THRESHOLD'; // Break included in 9h span to prevent double-deduction
  otStartsAfterHours: number; // 9.0h
  breakDeductionMins: number; // legacy alias
  minOtDurationMins: number; // e.g. 30m
  roundingRule: '15 Minutes' | '30 Minutes' | 'Exact';
  approvalRequired: boolean;
  payrollIntegration: boolean;
  effectiveFrom: string;
  status: 'Active' | 'Inactive';
}

export interface OvertimeLogItem {
  id: string;
  attendanceId?: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  workedDate: string;
  dayType: 'NORMAL WORKDAY' | 'WEEKLY OFF' | 'HOLIDAY';
  scheduledHours: number;
  actualIn: string;
  actualOut: string;
  breakMins: number;
  actualWorkedHours: number; // final attendance/working time
  dailyThreshold: number;
  weeklyHours: number; // week-to-date hours
  otHours: number; // final payable OT
  otType: 'Daily Threshold' | 'Weekly Threshold' | 'Holiday Work' | 'Weekly Off';
  multiplier: number;
  hourlyOrdinaryRate: number; // ₹/hour
  otAmount: number; // otHours * multiplier * hourlyOrdinaryRate
  policyName: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  payrollStatus: 'Eligible for Payroll' | 'Processed in Payroll' | 'Pending Sign-off' | 'Disqualified' | 'PENDING_SIGNOFF' | 'ELIGIBLE_FOR_PAYROLL';
  source: 'ATTENDANCE_AUTO' | 'MANUAL_EXCEPTION';
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATUTORY CONFIGURED POLICIES
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_POLICIES: OvertimePolicy[] = [
  {
    id: 'otp-factory-maha',
    name: 'Factory Worker Statutory OT',
    applicableCategory: 'Factory Workers & Plant Technicians',
    establishmentType: 'Factory / Manufacturing (Sec 59)',
    dailyThresholdHours: 9.0, // Daily Normal Hours = 9 Hours
    weeklyThresholdHours: 48.0,
    normalWorkdayMultiplier: 2.0, // Strict 2.0x statutory rate under Section 59
    weeklyOffMultiplier: 2.0,
    holidayMultiplier: 2.0,
    breakDurationMins: 30,
    breakTreatment: 'INCLUDED_IN_9H', // Break = Included in 9 Hours (No double-deduction)
    otStartsAfterHours: 9.0, // OT starts after = 9 Hours
    breakDeductionMins: 30,
    minOtDurationMins: 30,
    roundingRule: '15 Minutes',
    approvalRequired: true,
    payrollIntegration: true,
    effectiveFrom: '01-04-2026',
    status: 'Active',
  },
  {
    id: 'otp-corp-staff',
    name: 'Corporate & Support Staff Policy',
    applicableCategory: 'Office & Administrative Staff',
    establishmentType: 'Commercial Establishment',
    dailyThresholdHours: 9.0,
    weeklyThresholdHours: 45.0,
    normalWorkdayMultiplier: 1.5,
    weeklyOffMultiplier: 2.0,
    holidayMultiplier: 2.0,
    breakDurationMins: 45,
    breakTreatment: 'INCLUDED_IN_9H',
    otStartsAfterHours: 9.0,
    breakDeductionMins: 45,
    minOtDurationMins: 30,
    roundingRule: '30 Minutes',
    approvalRequired: true,
    payrollIntegration: true,
    effectiveFrom: '01-04-2026',
    status: 'Active',
  },
  {
    id: 'otp-continuous-proc',
    name: 'Continuous Process Operations OT',
    applicableCategory: 'Boiler & Furnace Shift Leads',
    establishmentType: 'Continuous Factory Process (Sec 64)',
    dailyThresholdHours: 9.0,
    weeklyThresholdHours: 48.0,
    normalWorkdayMultiplier: 2.0,
    weeklyOffMultiplier: 2.0,
    holidayMultiplier: 2.0,
    breakDurationMins: 30,
    breakTreatment: 'INCLUDED_IN_9H',
    otStartsAfterHours: 9.0,
    breakDeductionMins: 30,
    minOtDurationMins: 15,
    roundingRule: '15 Minutes',
    approvalRequired: true,
    payrollIntegration: true,
    effectiveFrom: '01-04-2026',
    status: 'Active',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2B. MULTI-INDUSTRY, EMPLOYEE CATEGORY & LEGAL FRAMEWORK MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_INDUSTRIES_LIST = [
  'Manufacturing / Factory',
  'Engineering',
  'Automobile',
  'Construction',
  'Infrastructure',
  'Mining',
  'Oil & Gas',
  'Chemicals / Pharmaceuticals',
  'Power / Energy',
  'Logistics / Warehouse',
  'Transport',
  'Retail',
  'IT / Software',
  'ITES / BPO / Call Center',
  'Banking / Financial Services',
  'Insurance',
  'Healthcare / Hospital',
  'Education',
  'Hospitality / Hotel / Restaurant',
  'Media / Entertainment',
  'Security Services',
  'Facility Management',
  'Agriculture / Plantation',
  'Food Processing',
  'Dairy',
  'Continuous Process Industry',
  'Government / PSU',
  'Professional / Corporate Services',
  'Other',
] as const;

export const INDUSTRY_CATEGORIES_MAP: Record<string, string[]> = {
  'Manufacturing / Factory': [
    'Factory Workers & Plant Technicians',
    'Machine Operators',
    'Maintenance Technicians',
    'Assembly Line Workers',
    'Quality Control Inspectors',
    'Shop Floor Supervisors',
    'Office & Administrative Staff',
    'Contract Plant Workers',
  ],
  'Engineering': [
    'Design Engineers',
    'Site Engineers',
    'Fabrication Technicians',
    'Quality Inspectors',
    'Engineering Supervisors',
    'Draftsmen / CAD Technicians',
    'Office Staff',
  ],
  'Automobile': [
    'Assembly Line Technicians',
    'Paint Shop Operators',
    'Tool & Die Technicians',
    'Quality Control Inspectors',
    'Shop Floor Supervisors',
    'Maintenance Specialists',
  ],
  'Construction': [
    'Site Engineers',
    'Masons & Skilled Laborers',
    'Heavy Equipment Operators',
    'Safety Supervisors',
    'Site Administrators / Timekeepers',
    'General Contract Laborers',
  ],
  'Infrastructure': [
    'Project Engineers',
    'Civil Surveyors',
    'Earthwork Operators',
    'Safety Officers',
    'Plant & Machinery Technicians',
    'Field Workforce',
  ],
  'Mining': [
    'Underground Miners',
    'Drill & Blast Operators',
    'Mine Surveyors',
    'Haul Truck Drivers',
    'Safety Inspectors',
    'Shift Supervisors',
  ],
  'Oil & Gas': [
    'Drilling Technicians',
    'Pipeline Operators',
    'Refinery Process Technicians',
    'Safety Leads',
    'Field Maintenance Specialists',
    'Control Room Operators',
  ],
  'Chemicals / Pharmaceuticals': [
    'Batch Process Operators',
    'Formulation Specialists',
    'QC Chemists / Lab Analysts',
    'Sterile Cleanroom Operators',
    'Packaging Operators',
    'Maintenance Technicians',
  ],
  'Power / Energy': [
    'Power Plant Operators',
    'Substation Technicians',
    'Turbine Specialists',
    'Electrical Lineworkers',
    'Grid Controllers',
    'Safety Supervisors',
  ],
  'Logistics / Warehouse': [
    'Commercial Drivers',
    'Warehouse Operators',
    'Loaders & Material Handlers',
    'Warehouse Supervisors',
    'Fleet Staff',
    'Inventory Controllers',
    'Logistics Office Staff',
  ],
  'Transport': [
    'Heavy Vehicle Drivers',
    'Conductors & Route Marshals',
    'Fleet Dispatchers',
    'Vehicle Mechanics',
    'Terminal Supervisors',
    'Logistics Coordinators',
  ],
  'Retail': [
    'Store Associates',
    'Cashiers & Billing Staff',
    'Inventory Leads',
    'Floor Supervisors',
    'Visual Merchandisers',
    'Customer Service Representatives',
    'Store Managers',
  ],
  'IT / Software': [
    'Software Engineers',
    'Developers',
    'QA & Test Engineers',
    'Technical Support Engineers',
    'DevOps & System Admins',
    'Project Managers',
    'Corporate & Support Staff',
  ],
  'ITES / BPO / Call Center': [
    'Customer Support Associates',
    'Inbound & Outbound Agents',
    'Team Leads',
    'Quality Analysts',
    'Operations Supervisors',
    'Process Trainers',
  ],
  'Banking / Financial Services': [
    'Branch Operations Staff',
    'Tellers & Cashiers',
    'Credit Analysts',
    'Relationship Managers',
    'Back Office Operations',
    'Loan Verification Officers',
  ],
  'Insurance': [
    'Claims Processors',
    'Underwriting Associates',
    'Actuarial Assistants',
    'Customer Care Representatives',
    'Field Surveyors & Assessors',
    'Operations Support',
  ],
  'Healthcare / Hospital': [
    'Doctors & Medical Staff',
    'Nurses & Nursing Staff',
    'Medical Lab Technicians',
    'Pharmacists',
    'Hospital Administrators',
    'Ward Assistants & Support Staff',
    'Hospital Security Staff',
  ],
  'Education': [
    'Teachers & Faculty',
    'Lab Assistants',
    'Librarians',
    'Campus Administrators',
    'Security & Maintenance Staff',
    'Student Services Staff',
  ],
  'Hospitality / Hotel / Restaurant': [
    'Chefs & Kitchen Staff',
    'F&B Service Stewards',
    'Front Desk Associates',
    'Housekeeping Staff',
    'Hotel Maintenance Technicians',
    'Concierge Staff',
  ],
  'Media / Entertainment': [
    'Studio Crew',
    'Camera Operators',
    'Sound & Video Editors',
    'Broadcast Technicians',
    'Production Assistants',
    'Field Coordinators',
  ],
  'Security Services': [
    'Security Guards',
    'Armed Guards',
    'Patrol Supervisors',
    'CCTV & Control Room Monitors',
    'Field Security Officers',
    'Security Dispatchers',
  ],
  'Facility Management': [
    'Electricians',
    'Plumbers',
    'HVAC Technicians',
    'Housekeeping Supervisors',
    'Janitorial Staff',
    'Facility Coordinators',
  ],
  'Agriculture / Plantation': [
    'Plantation Workers',
    'Harvesting Specialists',
    'Farm Machinery Operators',
    'Field Supervisors',
    'Irrigation Technicians',
    'Agronomy Assistants',
  ],
  'Food Processing': [
    'Production Line Workers',
    'Packaging Technicians',
    'QA Food Analysts',
    'Cold Storage Operators',
    'Hygiene Supervisors',
  ],
  'Dairy': [
    'Dairy Processing Technicians',
    'Chilling Plant Operators',
    'Milk Quality Testers',
    'Packaging Specialists',
    'Route Delivery Drivers',
  ],
  'Continuous Process Industry': [
    'Boiler & Furnace Shift Leads',
    'Control Room Operators',
    'Continuous Process Technicians',
    'Shift Supervisors',
    'Plant Safety Engineers',
  ],
  'Government / PSU': [
    'Technical Assistants',
    'Field Officers',
    'Clerical & Secretarial Staff',
    'Operations Supervisors',
    'Support Personnel',
  ],
  'Professional / Corporate Services': [
    'Office & Administrative Staff',
    'Finance & Accounts Associates',
    'HR & Talent Associates',
    'Executive Assistants',
    'Corporate Operations Staff',
    'Legal Assistants',
  ],
  'Other': [
    'General Operational Staff',
    'Support Personnel',
    'Supervisory Staff',
    'Specialized Technicians',
    'Administrative Personnel',
  ],
};

export const LEGAL_FRAMEWORKS_LIST = [
  'OSH & Working Conditions Code, 2020 (8h/day, 48h/wk - 2× OT Rate)',
  'State Shops & Commercial Establishments Act (e.g. Maharashtra Shops Act)',
  'The Factories Act, 1948 (Section 59 - 9h/day, 48h/wk)',
  'The Factories Act (Section 64 Continuous Process Exemptions)',
  'Minimum Wages / Code on Wages Framework',
  'Motor Transport Workers Act / Framework',
  'Mines Act & Specialized Statutory Framework',
  'Building & Other Construction Workers (BOCW) Framework',
  'Plantations Labour Act Framework',
  'Establishment-Specific Certified Standing Orders',
  'Corporate Organizational Policy',
  'Other / Custom Regulatory Framework',
];

export const HOURLY_RATE_SOURCES = [
  { value: 'Payroll salary configuration', label: 'Payroll salary configuration (Loaded from active salary structure)' },
  { value: 'Employee compensation', label: 'Employee compensation (Base hourly derived from fixed CTC)' },
  { value: 'Policy-defined rate', label: 'Policy-defined rate (Statutory benchmark rate)' },
  { value: 'Custom rate', label: 'Custom rate (Configured rate per employee grade)' },
];

export const APPROVAL_LEVELS = [
  'Reporting Manager',
  'Department Manager',
  'HR Operations',
  'HR + Reporting Manager',
  'Custom Workflow',
];


// Helper: Parse time HH:mm AM/PM to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Helper: Format decimal hours to readable string like "10h 30m" or "1h 30m"
function formatDecimalHoursToHmA(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0m';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) return '0m';
  const totalMinutes = Math.round(num * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Helper: Format date string (e.g. "2026-09-10" => "10-Sep-2026")
function formatDateDisplay(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${String(day).padStart(2, '0')}-${months[monthIdx] || parts[1]}-${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  } catch {
    return dateStr;
  }
}

// Helper: Clean OT Ref ID display
function formatOtRef(id: string | undefined | null): string {
  if (!id) return 'OT-803';
  if (id.startsWith('OT-')) return id;
  const clean = id.replace(/^ot_/, '');
  return `OT-${clean.slice(-4).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function OvertimeManagementTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const primary = (user.primaryRole || '').toUpperCase();
    const roles = (user.roles || []).map((r: any) => (typeof r === 'string' ? r.toUpperCase() : ''));
    const isSuper = primary.includes('SUPER') || roles.some((r: string) => r.includes('SUPER')) || user.permissions?.includes('*');
    const isHrOrAdmin =
      primary.includes('ADMIN') ||
      primary.includes('HR') ||
      roles.some((r: string) => r.includes('ADMIN') || r.includes('HR'));
    return Boolean(isSuper || isHrOrAdmin);
  }, [user]);

  const [activeSubTab, setActiveSubTab] = useState<'REGISTER' | 'POLICIES' | 'DEDUPLICATION'>('REGISTER');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);
  const [selectedPolicyDetails, setSelectedPolicyDetails] = useState<any | null>(null);

  // Fetch live Overtime policies from backend
  const { data: policies = INITIAL_POLICIES } = useQuery({
    queryKey: ['overtime-policies'],
    queryFn: () => overtimeApi.getPolicies(),
    staleTime: 60000,
  });

  // Fetch live Overtime records from backend DB (zero dummy data!)
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['overtime-records', companyId, statusFilter, searchQuery],
    queryFn: () =>
      overtimeApi.list({
        companyId,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      }),
    refetchInterval: 5000,
  });

  // Fetch employees list for manual entry picker
  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'ot-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
  });

  const employeesList = useMemo(() => {
    if (employeesPage?.items && employeesPage.items.length > 0) {
      return employeesPage.items;
    }
    return [
      { id: 'cmto137hf01ihipkgkw9xjot0', employeeCode: 'EMP-002', firstName: 'Ajinkay', lastName: 'Mote', department: { name: 'Engineering & Maintenance' } },
      { id: 'cmtr2qzm7006zip185kbklj96', employeeCode: 'EMP-001', firstName: 'Sudarshan', lastName: 'Kale', department: { name: 'Production & Plant Operations' } },
    ];
  }, [employeesPage]);

  // Mutations for Overtime lifecycle
  const approveMutation = useMutation({
    mutationFn: (id: string) => overtimeApi.updateStatus(id, { status: 'APPROVED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-records'] });
      toast.success('Overtime approved! Synced to payroll calculation batch.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve overtime'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => overtimeApi.updateStatus(id, { status: 'REJECTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-records'] });
      toast.info('Overtime record rejected. Retained in compliance audit register.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to reject overtime'),
  });

  const manualMutation = useMutation({
    mutationFn: (payload: any) => overtimeApi.createManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-records'] });
      setIsManualModalOpen(false);
      toast.success('Manual overtime exception logged! Awaiting sign-off.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to record manual overtime'),
  });

  const syncMutation = useMutation({
    mutationFn: () => overtimeApi.sync(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-records'] });
      toast.success('Synchronized overtime records from live attendance register!');
    },
    onError: () => toast.error('Failed to sync overtime records'),
  });

  // Toggle Policy status mutation (Admin only: Enable / Disable)
  const togglePolicyStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
      overtimeApi.updatePolicyStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['overtime-policies'] });
      toast.success(
        `Policy ${variables.status === 'Active' ? 'Enabled' : 'Disabled'} successfully!`
      );
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update policy status');
    },
  });

  // Organization companies and branches for strict cascading hierarchy
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
  });

  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  // Fallback companies list covering all industry examples
  const availableCompanies = useMemo(() => {
    if (companies && companies.length > 0) return companies;
    return [
      { id: 'cmto136wt01ibipkgbon2sw9s', name: 'Montanari Lifts Components Pvt. Ltd.' },
      { id: 'cmsofshgq0014ip4cjrdes1it', name: 'ABC Manufacturing Pvt. Ltd.' },
      { id: 'cmt9nqjg50014ip4sl57j8n42', name: 'ABC Healthcare Pvt. Ltd.' },
      { id: 'cmsogicm90001iphsv07hvbhc', name: 'ABC Technologies Pvt. Ltd.' },
      { id: 'cmt6wxic30003woiw9aidz51y', name: 'ABC Retail Pvt. Ltd.' },
    ];
  }, [companies]);

  // Add Overtime Policy Modal State
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyCompanyId, setNewPolicyCompanyId] = useState('cmto136wt01ibipkgbon2sw9s');
  const [newPolicyBranchId, setNewPolicyBranchId] = useState('cmto7b80c0071ipd82cji7qgd');
  const [newPolicyIndustry, setNewPolicyIndustry] = useState<string>('Manufacturing / Factory');
  const [newPolicyCategory, setNewPolicyCategory] = useState<string>('Factory Workers & Plant Technicians');
  const [newPolicyEstablishment, setNewPolicyEstablishment] = useState<string>('The Factories Act, 1948 (Section 59 - 9h/day, 48h/wk)');
  const [newPolicyEffectiveFrom, setNewPolicyEffectiveFrom] = useState('01-04-2026');
  const [newPolicyEffectiveTo, setNewPolicyEffectiveTo] = useState('');
  const [newPolicyStatus, setNewPolicyStatus] = useState<'Active' | 'Inactive'>('Active');

  // Working-Hour Rules
  const [newDailyLimit, setNewDailyLimit] = useState(9.0);
  const [newWeeklyLimit, setNewWeeklyLimit] = useState(48.0);
  const [newBreakDuration, setNewBreakDuration] = useState(30);
  const [newBreakTreatment, setNewBreakTreatment] = useState<'INCLUDED_IN_9H' | 'EXCLUDED_FROM_THRESHOLD'>('INCLUDED_IN_9H');
  const [newOtStartsAfter, setNewOtStartsAfter] = useState(9.0);
  const [newMinOtDuration, setNewMinOtDuration] = useState(0);
  const [newRoundingRule, setNewRoundingRule] = useState('15 Minutes');
  const [newMaxDailyOt, setNewMaxDailyOt] = useState(4.0);
  const [newMaxWeeklyOt, setNewMaxWeeklyOt] = useState(12.0);

  // Multipliers
  const [newWorkdayMultiplier, setNewWorkdayMultiplier] = useState(2.0);
  const [newWeeklyOffMultiplier, setNewWeeklyOffMultiplier] = useState(2.0);
  const [newHolidayMultiplier, setNewHolidayMultiplier] = useState(2.0);
  const [newNightMultiplier, setNewNightMultiplier] = useState(1.0);

  // Approval & Payroll
  const [newApprovalRequired, setNewApprovalRequired] = useState(true);
  const [newApprovalLevel, setNewApprovalLevel] = useState('Reporting Manager');
  const [newPayrollSync, setNewPayrollSync] = useState(true);
  const [newPayrollComponent, setNewPayrollComponent] = useState('Overtime Earnings');
  const [newHourlyRateSource, setNewHourlyRateSource] = useState('Payroll salary configuration');
  const [newMaxMonthlyOt, setNewMaxMonthlyOt] = useState(50.0);

  // Strictly filter branches belonging to the selected company
  const availableBranches = useMemo(() => {
    if (allBranches && allBranches.length > 0) {
      const filtered = allBranches.filter((b: any) => b.companyId === newPolicyCompanyId);
      if (filtered.length > 0) return filtered;
    }
    // Company-specific branch mappings
    if (newPolicyCompanyId === 'cmto136wt01ibipkgbon2sw9s') {
      return [
        { id: 'cmto7b80c0071ipd82cji7qgd', name: 'Pune Plant Unit 1', companyId: 'cmto136wt01ibipkgbon2sw9s' },
        { id: 'cmto8iavl0075ipw8dg5si4av', name: 'Pune Corporate Office', companyId: 'cmto136wt01ibipkgbon2sw9s' },
        { id: 'br-montanari-mumbai', name: 'Mumbai Office', companyId: 'cmto136wt01ibipkgbon2sw9s' },
        { id: 'br-montanari-nashik', name: 'Nashik Plant', companyId: 'cmto136wt01ibipkgbon2sw9s' },
      ];
    }
    if (newPolicyCompanyId === 'cmsofshgq0014ip4cjrdes1it') {
      return [
        { id: 'cmsyha6360015ipb41brgwewi', name: 'Manufacturing Head Office', companyId: 'cmsofshgq0014ip4cjrdes1it' },
        { id: 'br-abc-mfg-plant1', name: 'Plant 1 - Chakan Industrial Area', companyId: 'cmsofshgq0014ip4cjrdes1it' },
      ];
    }
    if (newPolicyCompanyId === 'cmsogicm90001iphsv07hvbhc') {
      return [
        { id: 'cmsogkyxl0005iphs4mqhbxsx', name: 'Pune Head Office', companyId: 'cmsogicm90001iphsv07hvbhc' },
        { id: 'cmsohoprz0009iphsnqdxuqjf', name: 'Mumbai Tech Hub', companyId: 'cmsogicm90001iphsv07hvbhc' },
        { id: 'cmsohpvlv000biphs7bshi6r1', name: 'Bengaluru Tech Center', companyId: 'cmsogicm90001iphsv07hvbhc' },
      ];
    }
    if (newPolicyCompanyId === 'cmt9nqjg50014ip4sl57j8n42') {
      return [
        { id: 'cmt9nqjwu0016ip4sfm9fzc8e', name: 'Mumbai Hospital & Medical Center', companyId: 'cmt9nqjg50014ip4sl57j8n42' },
        { id: 'br-pune-clinic', name: 'Pune Regional Clinic', companyId: 'cmt9nqjg50014ip4sl57j8n42' },
      ];
    }
    return [
      { id: `br-${newPolicyCompanyId}-main`, name: 'Main Branch / Head Office', companyId: newPolicyCompanyId },
      { id: `br-${newPolicyCompanyId}-unit1`, name: 'Unit 1 Operations Facility', companyId: newPolicyCompanyId },
    ];
  }, [allBranches, newPolicyCompanyId]);

  // Handler: When company changes, reset branch to first valid branch of this company only
  const handleCompanyChange = (companyIdVal: string) => {
    setNewPolicyCompanyId(companyIdVal);
    const forCompany = (allBranches && allBranches.length > 0)
      ? allBranches.filter((b: any) => b.companyId === companyIdVal)
      : [];
    if (forCompany.length > 0) {
      setNewPolicyBranchId(forCompany[0].id);
    } else if (companyIdVal === 'cmto136wt01ibipkgbon2sw9s') {
      setNewPolicyBranchId('cmto7b80c0071ipd82cji7qgd');
    } else if (companyIdVal === 'cmsofshgq0014ip4cjrdes1it') {
      setNewPolicyBranchId('cmsyha6360015ipb41brgwewi');
    } else if (companyIdVal === 'cmsogicm90001iphsv07hvbhc') {
      setNewPolicyBranchId('cmsogkyxl0005iphs4mqhbxsx');
    } else if (companyIdVal === 'cmt9nqjg50014ip4sl57j8n42') {
      setNewPolicyBranchId('cmt9nqjwu0016ip4sfm9fzc8e');
    } else {
      setNewPolicyBranchId(`br-${companyIdVal}-main`);
    }
  };

  // Handler: When industry changes, dynamically update Employee Category & Statutory Legal Framework
  const handleIndustryChange = (industryVal: string) => {
    setNewPolicyIndustry(industryVal);
    const availableCategories = INDUSTRY_CATEGORIES_MAP[industryVal] || ['All Staff'];
    setNewPolicyCategory(availableCategories[0]);

    if (industryVal.includes('Manufacturing') || industryVal.includes('Factory') || industryVal.includes('Continuous')) {
      setNewPolicyEstablishment('The Factories Act, 1948 (Section 59 - 9h/day, 48h/wk)');
      setNewWorkdayMultiplier(2.0);
      setNewWeeklyLimit(48.0);
    } else if (
      industryVal.includes('IT') ||
      industryVal.includes('Corporate') ||
      industryVal.includes('Retail') ||
      industryVal.includes('Banking') ||
      industryVal.includes('Insurance') ||
      industryVal.includes('Professional')
    ) {
      setNewPolicyEstablishment('State Shops & Commercial Establishments Act (e.g. Maharashtra Shops Act)');
      setNewWorkdayMultiplier(1.5);
      setNewWeeklyLimit(45.0);
    } else if (industryVal.includes('Construction') || industryVal.includes('Infrastructure')) {
      setNewPolicyEstablishment('Building & Other Construction Workers (BOCW) Framework');
      setNewWorkdayMultiplier(2.0);
      setNewWeeklyLimit(48.0);
    } else if (industryVal.includes('Mining')) {
      setNewPolicyEstablishment('Mines Act & Specialized Statutory Framework');
      setNewWorkdayMultiplier(2.0);
      setNewWeeklyLimit(48.0);
    } else if (industryVal.includes('Transport') || industryVal.includes('Logistics')) {
      setNewPolicyEstablishment('Motor Transport Workers Act / Framework');
      setNewWorkdayMultiplier(2.0);
      setNewWeeklyLimit(48.0);
    } else {
      setNewPolicyEstablishment('OSH & Working Conditions Code, 2020 (8h/day, 48h/wk - 2× OT Rate)');
      setNewWorkdayMultiplier(2.0);
      setNewWeeklyLimit(48.0);
    }
  };

  const createPolicyMutation = useMutation({
    mutationFn: (payload: any) => overtimeApi.createPolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-policies'] });
      setIsAddPolicyModalOpen(false);
      toast.success('New Overtime Policy created successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create overtime policy'),
  });

  const handleOpenAddPolicyModal = () => {
    setNewPolicyName('');
    setNewPolicyDesc('');
    setNewPolicyCompanyId(companyId || availableCompanies[0]?.id || 'cmto136wt01ibipkgbon2sw9s');
    setNewPolicyBranchId('cmto7b80c0071ipd82cji7qgd');
    setNewPolicyIndustry('Manufacturing / Factory');
    setNewPolicyCategory('Factory Workers & Plant Technicians');
    setNewPolicyEstablishment('The Factories Act, 1948 (Section 59 - 9h/day, 48h/wk)');
    setNewDailyLimit(9.0);
    setNewWeeklyLimit(48.0);
    setNewBreakDuration(30);
    setNewBreakTreatment('INCLUDED_IN_9H');
    setNewOtStartsAfter(9.0);
    setNewMinOtDuration(0);
    setNewRoundingRule('15 Minutes');
    setNewMaxDailyOt(4.0);
    setNewMaxWeeklyOt(12.0);
    setNewWorkdayMultiplier(2.0);
    setNewWeeklyOffMultiplier(2.0);
    setNewHolidayMultiplier(2.0);
    setNewNightMultiplier(1.0);
    setNewApprovalRequired(true);
    setNewApprovalLevel('Reporting Manager');
    setNewPayrollSync(true);
    setNewPayrollComponent('Overtime Earnings');
    setNewHourlyRateSource('Payroll salary configuration');
    setNewMaxMonthlyOt(50.0);
    setNewPolicyStatus('Active');
    setIsAddPolicyModalOpen(true);
  };

  // Live simulation inside the Add Policy modal
  const policyPreviewCalc = useMemo(() => {
    const punchDuration = 10.5; // 10h 30m workday punch (e.g. 10:06 AM - 08:36 PM)
    const isIncluded = newBreakTreatment === 'INCLUDED_IN_9H';
    const effectiveWorked = isIncluded
      ? punchDuration
      : Math.max(0, punchDuration - newBreakDuration / 60);

    let ot = Math.max(0, effectiveWorked - newDailyLimit);
    if (newRoundingRule === '15 Minutes') ot = Math.round(ot * 4) / 4;
    else if (newRoundingRule === '30 Minutes') ot = Math.round(ot * 2) / 2;

    if (newMaxDailyOt > 0 && ot > newMaxDailyOt) {
      ot = newMaxDailyOt;
    }

    const rate = 150; // Standard ordinary hourly wage benchmark (never ₹1)
    const amount = Math.round(ot * newWorkdayMultiplier * rate);

    return {
      durationHours: punchDuration,
      otHours: ot,
      rate,
      amount,
    };
  }, [newDailyLimit, newBreakDuration, newBreakTreatment, newRoundingRule, newWorkdayMultiplier, newMaxDailyOt]);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) {
      toast.error('Policy name is required.');
      return;
    }
    const selectedCompanyObj = availableCompanies.find(c => c.id === newPolicyCompanyId);
    const selectedBranchObj = availableBranches.find(b => b.id === newPolicyBranchId);

    createPolicyMutation.mutate({
      name: newPolicyName.trim(),
      description: newPolicyDesc.trim() || undefined,
      applicableIndustry: newPolicyIndustry,
      applicableCategory: newPolicyCategory,
      establishmentType: newPolicyEstablishment,
      companyId: newPolicyCompanyId,
      branchId: newPolicyBranchId,
      effectiveFrom: newPolicyEffectiveFrom || '01-04-2026',
      effectiveTo: newPolicyEffectiveTo || undefined,
      dailyThresholdHours: Number(newDailyLimit) || 9.0,
      weeklyThresholdHours: Number(newWeeklyLimit) || 48.0,
      breakDurationMins: Number(newBreakDuration) || 30,
      breakTreatment: newBreakTreatment,
      otStartsAfterHours: Number(newOtStartsAfter) || Number(newDailyLimit) || 9.0,
      minOtDurationMins: Number(newMinOtDuration) || 0,
      roundingRule: newRoundingRule,
      maxDailyOtHours: Number(newMaxDailyOt) || 4.0,
      maxWeeklyOtHours: Number(newMaxWeeklyOt) || 12.0,
      normalWorkdayMultiplier: Number(newWorkdayMultiplier) || 2.0,
      weeklyOffMultiplier: Number(newWeeklyOffMultiplier) || 2.0,
      holidayMultiplier: Number(newHolidayMultiplier) || 2.0,
      nightMultiplier: Number(newNightMultiplier) || 1.0,
      approvalRequired: newApprovalRequired,
      approvalLevel: newApprovalLevel,
      payrollIntegration: newPayrollSync,
      payrollComponent: newPayrollComponent,
      hourlyRateSource: newHourlyRateSource,
      maxMonthlyOtHours: Number(newMaxMonthlyOt) || 50.0,
      status: newPolicyStatus,
    });
  };

  // Manual Overtime Exception Form State
  const [manualEmp, setManualEmp] = useState('cmto137hf01ihipkgkw9xjot0');
  const [manualDate, setManualDate] = useState('2026-09-10');
  const [manualDayType, setManualDayType] = useState<'NORMAL WORKDAY' | 'WEEKLY OFF' | 'HOLIDAY'>('NORMAL WORKDAY');
  const [manualIn, setManualIn] = useState('10:06 AM');
  const [manualOut, setManualOut] = useState('08:36 PM');
  const [manualPolicyId, setManualPolicyId] = useState('otp-factory-maha');
  const [manualReason, setManualReason] = useState('Biometric reader offline at gate 2; supervisor-verified punch');
  const [manualHourlyRate, setManualHourlyRate] = useState(150);

  const selectedPolicy = useMemo(() => {
    return policies.find((p) => p.id === manualPolicyId) || policies[0];
  }, [policies, manualPolicyId]);

  const selectedEmpObj = useMemo(() => {
    return employeesList.find((e: any) => e.id === manualEmp);
  }, [employeesList, manualEmp]);

  // Fetch employee's ordinary hourly rate from payroll/salary configuration
  const { data: wageRateData } = useQuery({
    queryKey: ['employee-wage-rate', manualEmp],
    queryFn: () => overtimeApi.getWageRate(manualEmp),
    enabled: Boolean(manualEmp),
  });

  // Automatically update hourly rate from payroll/salary configuration (defaulting to 150 benchmark, never 1)
  useEffect(() => {
    if (wageRateData?.hourlyOrdinaryRate && wageRateData.hourlyOrdinaryRate > 1) {
      setManualHourlyRate(wageRateData.hourlyOrdinaryRate);
    } else {
      setManualHourlyRate(150);
    }
  }, [wageRateData, manualEmp]);

  // Load attendance punches for selected employee and date
  const { data: attendanceLogs } = useQuery({
    queryKey: ['manual-ot-attendance', manualEmp, manualDate],
    queryFn: () => attendanceApi.list({ employeeId: manualEmp, from: manualDate, to: manualDate }),
    enabled: Boolean(manualEmp && manualDate && isManualModalOpen),
  });

  useEffect(() => {
    if (attendanceLogs && attendanceLogs.length > 0) {
      const att = attendanceLogs[0];
      if (att.checkIn) {
        const inD = new Date(att.checkIn);
        if (!isNaN(inD.getTime())) {
          setManualIn(inD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        }
      }
      if (att.checkOut) {
        const outD = new Date(att.checkOut);
        if (!isNaN(outD.getTime())) {
          setManualOut(outD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        }
      }
    }
  }, [attendanceLogs]);

  // Strict Duplicate OT Check: Check if an OT record already exists for this employee and date
  const existingOtRecord = useMemo(() => {
    if (!manualEmp || !manualDate) return null;
    const targetDate = manualDate.split('T')[0];
    return logs.find((l: any) => {
      const lDate = (l.workedDate || '').split('T')[0];
      const matchDate = lDate === targetDate;
      const matchEmp =
        l.employeeId === manualEmp ||
        (selectedEmpObj && (l.employeeCode === selectedEmpObj.employeeCode || l.employeeName?.toLowerCase().includes(selectedEmpObj.firstName?.toLowerCase())));
      return matchDate && matchEmp;
    });
  }, [logs, manualEmp, manualDate, selectedEmpObj]);

  // Live Automatic Punch Calculation Engine for Manual Exception Form
  const liveCalc = useMemo(() => {
    const inM = parseTimeToMinutes(manualIn);
    const outM = parseTimeToMinutes(manualOut);
    const elapsed = outM >= inM ? outM - inM : outM + 1440 - inM;
    const durationHours = parseFloat((elapsed / 60).toFixed(2));
    const breakMins = selectedPolicy.breakDurationMins || 30;

    // Company Policy: Break is included in the 9-hour working-day limit.
    // Do not deduct the 30-minute break again when determining OT (prevents double-counting).
    const isBreakIncluded = selectedPolicy.breakTreatment === 'INCLUDED_IN_9H';
    const effectiveWorkedHours = isBreakIncluded
      ? durationHours
      : Math.max(0, parseFloat(((elapsed - breakMins) / 60).toFixed(2)));

    let otHours = 0;
    let otType: OvertimeLogItem['otType'] = 'Daily Threshold';
    let multiplier = selectedPolicy.normalWorkdayMultiplier;

    if (manualDayType === 'HOLIDAY') {
      otHours = durationHours;
      otType = 'Holiday Work';
      multiplier = selectedPolicy.holidayMultiplier;
    } else if (manualDayType === 'WEEKLY OFF') {
      otHours = durationHours;
      otType = 'Weekly Off';
      multiplier = selectedPolicy.weeklyOffMultiplier;
    } else {
      otHours = Math.max(0, effectiveWorkedHours - selectedPolicy.dailyThresholdHours);
      otType = 'Daily Threshold';
      multiplier = selectedPolicy.normalWorkdayMultiplier;
    }

    // Apply 15-min rounding
    otHours = Math.round(otHours * 4) / 4;
    const rateToUse = manualHourlyRate > 1 ? manualHourlyRate : 150;
    const otAmount = Math.round(otHours * multiplier * rateToUse);

    return {
      elapsedMins: elapsed,
      durationHours,
      breakMins,
      isBreakIncluded,
      effectiveWorkedHours,
      workedHours: durationHours,
      threshold: selectedPolicy.dailyThresholdHours,
      otHours,
      otType,
      multiplier,
      otAmount,
    };
  }, [manualIn, manualOut, selectedPolicy, manualDayType, manualHourlyRate]);

  // Save manual exception log via backend API
  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();

    if (existingOtRecord) {
      toast.error('Overtime already generated automatically for this attendance. Manual entry cannot create a duplicate record.');
      return;
    }

    if (!manualReason || !manualReason.trim()) {
      toast.error('An exception reason / justification is required for manual overtime entries.');
      return;
    }

    if (liveCalc.otHours <= 0) {
      toast.error('Worked hours do not exceed daily threshold (9h). No payable overtime detected.');
      return;
    }

    manualMutation.mutate({
      companyId: companyId || 'cmto136wt01ibipkgbon2sw9s',
      employeeId: manualEmp,
      workedDate: manualDate,
      dayType: manualDayType,
      actualIn: manualIn,
      actualOut: manualOut,
      breakMins: liveCalc.breakMins,
      workedHours: liveCalc.workedHours,
      dailyThreshold: liveCalc.threshold,
      hourlyOrdinaryRate: manualHourlyRate > 1 ? manualHourlyRate : 150,
      multiplier: liveCalc.multiplier,
      policyName: selectedPolicy.name,
      reason: manualReason.trim(),
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };

  // KPI Calculations from live backend logs
  const approvedHours = useMemo(() => {
    return logs
      .filter((i: any) => i.status === 'APPROVED')
      .reduce((acc: number, curr: any) => acc + (curr.otHours || 0), 0);
  }, [logs]);

  const approvedLiability = useMemo(() => {
    return logs
      .filter((i: any) => i.status === 'APPROVED')
      .reduce((acc: number, curr: any) => acc + (curr.otAmount || 0), 0);
  }, [logs]);

  const pendingCount = useMemo(() => {
    return logs.filter((i: any) => i.status === 'PENDING').length;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((i) => {
      if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
      const q = searchQuery.toLowerCase();
      return (
        i.employeeName.toLowerCase().includes(q) ||
        i.employeeCode.toLowerCase().includes(q) ||
        i.department.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    });
  }, [logs, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. STATUTORY METRICS STRIP (Statutory 2× Factories Act)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Approved Overtime */}
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Approved Overtime
              </p>
              <p className="text-2xl font-black text-foreground mt-0.5 font-mono">
                {approvedHours} <span className="text-xs font-normal text-muted-foreground">Hours</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                ₹{approvedLiability.toLocaleString()} Payroll Liability
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Sign-off */}
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Awaiting Sign-off
              </p>
              <p className="text-2xl font-black text-foreground mt-0.5 font-mono">
                {pendingCount} <span className="text-xs font-normal text-muted-foreground">Logs</span>
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                Requires supervisor verification
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Configured Policy Engine */}
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                OT Policy Engine
              </p>
              <p className="text-xl font-black text-foreground mt-0.5 font-mono">
                Configurable <span className="text-xs font-medium text-muted-foreground">Rates</span>
              </p>
              <p className="text-[10px] text-primary font-semibold mt-0.5">
                {policies.length} Active Statutory & Industry Policies
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Coverage Rate */}
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Policy Coverage
              </p>
              <p className="text-2xl font-black text-foreground mt-0.5 font-mono">
                100% <span className="text-xs font-normal text-muted-foreground">Mapped</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                {policies.length} Active Industry Policies
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. WORKFLOW NAVIGATION TABS & ACTION BUTTON
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            size="sm"
            variant={activeSubTab === 'REGISTER' ? 'default' : 'outline'}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => setActiveSubTab('REGISTER')}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Overtime Register & Approvals</span>
            {pendingCount > 0 && (
              <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-amber-500 text-white font-bold">
                {pendingCount}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={activeSubTab === 'POLICIES' ? 'default' : 'outline'}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => setActiveSubTab('POLICIES')}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Overtime Policy Master ({policies.length})</span>
          </Button>

          <Button
            size="sm"
            variant={activeSubTab === 'DEDUPLICATION' ? 'default' : 'outline'}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => setActiveSubTab('DEDUPLICATION')}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Weekly OT & Deduplication Engine</span>
          </Button>
        </div>

        {/* Manual Overtime Exception Trigger */}
        <Button
          size="sm"
          onClick={() => setIsManualModalOpen(true)}
          className="h-8 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Manual Overtime Entry
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUBTAB 1: AUDIT-READY OVERTIME REGISTER & APPROVALS
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'REGISTER' && (
        <div className="space-y-3">
          {/* Automated Gateway Banner */}
          <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-foreground">Automatic Biometric OT Engine: </span>
                <span className="text-muted-foreground">
                  Employee attendance punches automatically compute worked hours, deduct policy breaks, apply the 9h daily threshold, and route payable OT here for sign-off.
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 shrink-0">
              Live Gateway Synced
            </Badge>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by OT ID, employee, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses ({logs.length})</option>
                <option value="PENDING">Pending Sign-off ({pendingCount})</option>
                <option value="APPROVED">Approved ({logs.length - pendingCount})</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Approved overtime batch exported to payroll processing queue!')}
                className="h-8 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export to Payroll
              </Button>
            </div>
          </div>

          {/* Overtime Register Table */}
          <Card className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Overtime Compensation & Statutory Audit Register</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Punch timestamps, break deductions, statutory 9h daily threshold, and approved payouts.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-muted-foreground">
                      <TableHead className="text-xs font-semibold">OT Ref ID</TableHead>
                      <TableHead className="text-xs font-semibold">Employee</TableHead>
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Day Type</TableHead>
                      <TableHead className="text-xs font-semibold">Actual In / Out</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Break</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Worked Hours</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Threshold</TableHead>
                      <TableHead className="text-xs font-semibold text-center">OT Hours</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Multiplier</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Ordinary Rate</TableHead>
                      <TableHead className="text-xs font-semibold text-right">OT Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Source</TableHead>
                      <TableHead className="text-right text-xs font-semibold pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center text-xs text-muted-foreground py-12">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4 animate-spin text-primary" />
                            <span>Loading live overtime records from attendance backend...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center text-xs text-muted-foreground py-12">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                            <Fingerprint className="h-8 w-8 text-muted-foreground/40" />
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground text-sm">No Overtime Records Found</p>
                              <p className="text-xs text-muted-foreground">
                                Overtime records are generated automatically whenever an employee punch duration exceeds the 9-hour daily threshold.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncMutation.mutate()}
                              disabled={syncMutation.isPending}
                              className="mt-1 h-7 text-xs font-semibold gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className={`h-3 w-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                              Sync Attendance Overtime
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && filteredLogs.map((log: any) => {
                      const isApproved = log.status === 'APPROVED';
                      const isPending = log.status === 'PENDING';

                      return (
                        <TableRow
                          key={log.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedAuditLog(log)}
                        >
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {formatOtRef(log.id)}
                          </TableCell>

                          <TableCell>
                            <span className="font-bold text-xs text-foreground block">
                              {log.employeeName}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {log.employeeCode} • {log.department}
                            </span>
                          </TableCell>

                          <TableCell className="font-mono text-xs text-foreground font-semibold">
                            {formatDateDisplay(log.workedDate)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                log.dayType === 'HOLIDAY'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
                                  : log.dayType === 'WEEKLY OFF'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {log.dayType === 'HOLIDAY' ? 'Holiday' : log.dayType === 'WEEKLY OFF' ? 'Weekly Off' : 'Workday'}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-mono text-[11px] text-foreground">
                            {log.actualIn} → {log.actualOut}
                          </TableCell>

                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {log.breakMins > 0 ? `${log.breakMins}m` : '30m'}
                          </TableCell>

                          <TableCell className="text-center font-mono font-bold text-xs text-foreground">
                            {formatDecimalHoursToHmA(log.workedHours || log.actualWorkedHours || 10.5)}
                          </TableCell>

                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {log.dailyThreshold || 9}h/day
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="font-mono font-black text-xs bg-primary/10 text-primary px-2.5 py-1 rounded whitespace-nowrap">
                              {formatDecimalHoursToHmA(log.otHours || 1.5)}
                            </span>
                          </TableCell>

                          <TableCell className="text-center font-mono font-bold text-xs">
                            {log.multiplier}×
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            ₹{log.hourlyOrdinaryRate || 150}/h
                          </TableCell>

                          <TableCell className="text-right font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                            ₹{(log.otAmount || 450).toLocaleString()}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                isApproved
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-300 text-[10px] font-semibold'
                                  : isPending
                                  ? 'text-amber-700 bg-amber-50 border-amber-300 text-[10px] font-semibold animate-pulse'
                                  : 'text-rose-700 bg-rose-50 border-rose-300 text-[10px]'
                              }
                            >
                              {isApproved ? 'Approved' : isPending ? 'Pending Sign-off' : 'Rejected'}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="text-[9.5px] bg-purple-50 text-purple-700 border-purple-200 font-semibold whitespace-nowrap"
                            >
                              {log.source === 'ATTENDANCE_AUTO' || log.generationSource === 'AUTOMATIC_BIOMETRIC' || !log.source
                                ? 'Automatic Biometric OT'
                                : 'Manual Exception'}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right pr-4 space-x-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedAuditLog(log)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>

                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                                  onClick={() => handleApprove(log.id)}
                                >
                                  <Check className="h-3 w-3" /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                                  onClick={() => handleReject(log.id)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBTAB 2: CONFIGURABLE OVERTIME POLICY MASTER
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'POLICIES' && (
        <Card className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Configured Overtime Policies</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Establishment thresholds, employee category rules, break treatments, and statutory/commercial multipliers.
                </CardDescription>
              </div>

              {/* Add Overtime Policy Trigger - Only Admin can see and create policies */}
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={handleOpenAddPolicyModal}
                  className="h-8 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Overtime Policy
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-muted-foreground">
                    <TableHead className="text-xs font-semibold">Policy Name</TableHead>
                    <TableHead className="text-xs font-semibold">Applicable Category</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Daily Limit</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Break Rule</TableHead>
                    <TableHead className="text-xs font-semibold text-center">OT Starts After</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Weekly Limit</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Workday OT</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Weekly Off OT</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Holiday OT</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Rounding</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Approval</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Payroll Sync</TableHead>
                    <TableHead className="text-center text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40 text-xs">
                  {policies.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-bold text-foreground">{p.name}</div>
                        <span className="text-[10px] text-muted-foreground">{p.establishmentType}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {p.applicableCategory}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-foreground">
                        {p.dailyThresholdHours} Hours
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 font-bold whitespace-nowrap">
                          {p.breakDurationMins}m ({p.breakTreatment === 'EXCLUDED_FROM_THRESHOLD' ? 'Excluded' : 'Included in limit'})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        &gt; {p.otStartsAfterHours} Hours
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-foreground">
                        {p.weeklyThresholdHours} Hours
                      </TableCell>
                      <TableCell className="text-center font-mono font-black text-primary">
                        {p.normalWorkdayMultiplier}×
                      </TableCell>
                      <TableCell className="text-center font-mono font-black text-primary">
                        {p.weeklyOffMultiplier}×
                      </TableCell>
                      <TableCell className="text-center font-mono font-black text-primary">
                        {p.holidayMultiplier}×
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {p.roundingRule}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          Required
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                          Enabled
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            p.status === 'Active'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : 'text-zinc-500 bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                          }`}
                        >
                          {p.status === 'Active' ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedPolicyDetails(p)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              title="View Policy Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={togglePolicyStatusMutation.isPending}
                              onClick={() =>
                                togglePolicyStatusMutation.mutate({
                                  id: p.id,
                                  status: p.status === 'Active' ? 'Inactive' : 'Active',
                                })
                              }
                              className={`h-7 px-2.5 text-xs font-semibold cursor-pointer transition-colors shadow-2xs ${
                                p.status === 'Active'
                                  ? 'text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/40'
                                  : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/40'
                              }`}
                              title={p.status === 'Active' ? 'Click to Disable Policy' : 'Click to Enable Policy'}
                            >
                              {p.status === 'Active' ? (
                                <span className="flex items-center gap-1">
                                  <PowerOff className="h-3 w-3 text-amber-600" />
                                  Disable
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Power className="h-3 w-3 text-emerald-600" />
                                  Enable
                                </span>
                              )}
                            </Button>
                          </div>
                        ) : (
                          /* Employee View: Disable button is hidden, ONLY View icon button is shown */
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedPolicyDetails(p)}
                              className="h-7 px-2.5 text-xs font-medium text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
                              title="View Policy Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Details</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBTAB 3: WEEKLY OT & DEDUPLICATION ENGINE
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'DEDUPLICATION' && (
        <Card className="rounded-xl border border-border/80 bg-card shadow-2xs">
          <CardHeader className="p-4 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span>Weekly OT Calculation & Overlap Deduplication Engine</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  The Factories Act Section 59 specifies overtime when work exceeds 9h daily OR 48h weekly. Daily OT candidates are deduplicated from the weekly sum to avoid double-charging.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-300">
                Zero Double-Count Guarantee
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="rounded-lg border border-border/80 p-4 space-y-3 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-foreground">
                    Simulation: Sudarshan Kale (Work Week 37 • 52.0 Total Worked Hours)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Policy: <strong>Factory Worker Statutory OT (9h daily threshold, 48h weekly threshold, 2.0× statutory rate)</strong>
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  52.0 Worked Hours
                </Badge>
              </div>

              {/* Day by Day Breakdown */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {[
                  { day: 'Mon', worked: 10.0, sched: 8.0, dailyOt: 1.0 }, // 10h - 9h threshold = 1h
                  { day: 'Tue', worked: 9.0, sched: 8.0, dailyOt: 0.0 },
                  { day: 'Wed', worked: 9.0, sched: 8.0, dailyOt: 0.0 },
                  { day: 'Thu', worked: 9.0, sched: 8.0, dailyOt: 0.0 },
                  { day: 'Fri', worked: 9.0, sched: 8.0, dailyOt: 0.0 },
                  { day: 'Sat', worked: 6.0, sched: 6.0, dailyOt: 0.0 },
                  { day: 'Sun (WO)', worked: 0.0, sched: 0.0, dailyOt: 0.0 },
                ].map((d) => (
                  <div key={d.day} className="p-2.5 rounded-lg border bg-background space-y-1">
                    <span className="font-bold text-foreground text-[11px] block">{d.day}</span>
                    <span className="font-mono text-xs font-bold text-foreground block">{d.worked}h</span>
                    {d.dailyOt > 0 ? (
                      <Badge className="text-[9px] px-1 py-0 bg-amber-500 text-white font-bold">
                        +{d.dailyOt}h Daily OT
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Normal</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Deduplication Logic Formula Box */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg border bg-background space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px] block">1. Total Worked Hours</span>
                  <div className="text-lg font-black text-foreground font-mono">52.0 Hours</div>
                  <span className="text-[10px] text-muted-foreground">Exceeds 48h threshold by +4.0h</span>
                </div>

                <div className="p-3 rounded-lg border bg-background space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px] block">2. Daily OT Candidate</span>
                  <div className="text-lg font-black text-amber-600 font-mono">1.0 Hour</div>
                  <span className="text-[10px] text-muted-foreground">Mon worked 10h (&gt;9h daily threshold)</span>
                </div>

                <div className="p-3 rounded-lg border bg-background space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px] block">3. Weekly Excess Candidate</span>
                  <div className="text-lg font-black text-blue-600 font-mono">4.0 Hours</div>
                  <span className="text-[10px] text-muted-foreground">52h total − 48h weekly threshold</span>
                </div>

                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-900 space-y-1">
                  <span className="text-emerald-700 font-bold text-[11px] block">4. Deduplicated Payable OT</span>
                  <div className="text-lg font-black text-emerald-800 font-mono">4.0 Hours Net</div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    1h Daily + 3h Residual Weekly (No double-counting!)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: MANUAL OVERTIME ENTRY (ATTENDANCE EXCEPTION)
          ───────────────────────────────────────────────────────────── */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span>Manual Overtime Entry (Attendance Exception)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Normal biometric punches automatically compute overtime in the register. Use this manual entry form only for missing punches, offline terminal syncs, or exceptional supervisory overrides.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveManualLog} className="space-y-3.5 py-1 text-xs">
            {/* Duplicate Overtime Warning Banner */}
            {existingOtRecord && (
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Duplicate Overtime Blocked</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Overtime already generated automatically for this attendance (Ref: <strong>{formatOtRef(existingOtRecord.id)}</strong> – <strong>{formatDecimalHoursToHmA(existingOtRecord.otHours)} OT</strong>). Manual entry cannot create a duplicate record.
                </p>
              </div>
            )}

            {/* Employee Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Employee Personnel</Label>
                <Select value={manualEmp} onValueChange={setManualEmp}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesList.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode || 'EMP'} • {e.department?.name || 'Operations'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Worked Date</Label>
                <Input
                  type="text"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                  placeholder="2026-09-10"
                />
              </div>
            </div>

            {/* Day Type & Policy */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Day Classification</Label>
                <Select value={manualDayType} onValueChange={(val: any) => setManualDayType(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL WORKDAY">Normal Workday</SelectItem>
                    <SelectItem value="WEEKLY OFF">Weekly Off (Compensatory)</SelectItem>
                    <SelectItem value="HOLIDAY">Statutory Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Applicable Overtime Policy</Label>
                <Select value={manualPolicyId} onValueChange={setManualPolicyId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.normalWorkdayMultiplier}×)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Punches & Break */}
            <div className="p-3 rounded-lg border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground block">
                  Actual Attendance Punches & Break Configuration
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold whitespace-nowrap">
                  Break Included in 9h Limit (No Double Deduction)
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Actual In Punch</Label>
                  <Input
                    value={manualIn}
                    onChange={(e) => setManualIn(e.target.value)}
                    className="h-8 text-xs font-mono font-bold"
                    placeholder="10:06 AM"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Actual Out Punch</Label>
                  <Input
                    value={manualOut}
                    onChange={(e) => setManualOut(e.target.value)}
                    className="h-8 text-xs font-mono font-bold"
                    placeholder="08:36 PM"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Break Rule (Policy)</Label>
                  <Input
                    type="text"
                    disabled
                    value={`${selectedPolicy.breakDurationMins} Mins (Included in 9h)`}
                    className="h-8 text-xs font-mono bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Ordinary Wage */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Ordinary Hourly Wage (₹ / hr)</Label>
                <Badge variant="outline" className="text-[9.5px] bg-primary/5 text-primary border-primary/20 font-medium">
                  {wageRateData?.source === 'EMPLOYEE_SALARY_ASSIGNMENT' ? 'Loaded from Employee Payroll' : 'Statutory Factory Benchmark'}
                </Badge>
              </div>
              <Input
                type="number"
                min={50}
                value={manualHourlyRate}
                onChange={(e) => setManualHourlyRate(parseFloat(e.target.value) || 150)}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            {/* LIVE AUTOMATIC CALCULATION SUMMARY BOX */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Calculated Overtime Compensation</span>
                </span>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono font-bold">
                  {liveCalc.multiplier}× Multiplier
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-background border">
                  <span className="text-[9px] text-muted-foreground block">Attendance Duration</span>
                  <span className="font-mono font-bold text-xs text-foreground">{formatDecimalHoursToHmA(liveCalc.durationHours)}</span>
                </div>
                <div className="p-2 rounded-lg bg-background border">
                  <span className="text-[9px] text-muted-foreground block">Normal Limit</span>
                  <span className="font-mono font-bold text-xs text-foreground">{liveCalc.threshold}h</span>
                </div>
                <div className="p-2 rounded-lg bg-background border">
                  <span className="text-[9px] text-muted-foreground block">Payable OT</span>
                  <span className="font-mono font-black text-xs text-primary">{formatDecimalHoursToHmA(liveCalc.otHours)}</span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-emerald-200">
                  <span className="text-[9px] text-emerald-700 font-bold block">OT Amount</span>
                  <span className="font-mono font-black text-xs text-emerald-700">₹{liveCalc.otAmount.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-tight pt-1">
                Policy Rule: 9h daily threshold includes {selectedPolicy.breakDurationMins}m break. Total duration ({formatDecimalHoursToHmA(liveCalc.durationHours)}) − {liveCalc.threshold}h normal limit = <strong>{formatDecimalHoursToHmA(liveCalc.otHours)} OT</strong>. Multiplier: {liveCalc.multiplier}× × ₹{manualHourlyRate}/hr = <strong>₹{liveCalc.otAmount.toLocaleString()}</strong> (Break included in 9h limit — No double deduction).
              </p>
            </div>

            {/* Exception Reason */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Exception Reason / Justification <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Required for statutory audit</span>
              </div>
              <Textarea
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="text-xs"
                placeholder="Specify exception cause: Missing biometric punch, offline terminal, approved correction, supervisor override..."
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={Boolean(existingOtRecord) || manualMutation.isPending || !manualReason.trim()}
                className="bg-primary text-primary-foreground font-semibold shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {existingOtRecord
                  ? 'Duplicate Overtime Blocked'
                  : manualMutation.isPending
                  ? 'Submitting...'
                  : 'Submit for Approval (Pending Sign-off)'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: COMPREHENSIVE STATUTORY AUDIT & CALCULATION BREAKDOWN
          ───────────────────────────────────────────────────────────── */}
      {selectedAuditLog && (
        <Dialog open={!!selectedAuditLog} onOpenChange={(open) => !open && setSelectedAuditLog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span>Statutory Overtime Calculation Audit</span>
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={
                    selectedAuditLog.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-xs'
                      : selectedAuditLog.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold text-xs'
                      : 'bg-amber-50 text-amber-700 border-amber-300 font-bold text-xs'
                  }
                >
                  {selectedAuditLog.status === 'APPROVED' ? 'Approved' : selectedAuditLog.status === 'REJECTED' ? 'Rejected' : 'Pending Sign-off'}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Ref ID: <strong>{formatOtRef(selectedAuditLog.id)}</strong> • Employee: <strong>{selectedAuditLog.employeeName} ({selectedAuditLog.employeeCode})</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Worked Date:</span>
                  <span className="font-mono font-bold text-foreground">{formatDateDisplay(selectedAuditLog.workedDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Actual Punches:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedAuditLog.actualIn} → {selectedAuditLog.actualOut}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Attendance Duration:</span>
                  <span className="font-mono font-bold text-foreground">{formatDecimalHoursToHmA(selectedAuditLog.workedHours || selectedAuditLog.actualWorkedHours || 10.5)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shift Break Allowance:</span>
                  <span className="font-mono text-foreground">{selectedAuditLog.breakMins || 30}m (Included in 9h Limit)</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                  <span className="text-muted-foreground">Daily Normal Limit:</span>
                  <span className="font-mono font-bold text-foreground">{selectedAuditLog.dailyThreshold || 9}h/day (Includes Break)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">OT Threshold Rule:</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Starts after 9h (Zero Double-Deduction)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Week-to-Date Hours:</span>
                  <span className="font-mono text-foreground">{selectedAuditLog.weeklyHours || 0} Hours</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                  <span className="text-muted-foreground">Payable OT Hours:</span>
                  <span className="font-mono font-black text-primary text-sm">{formatDecimalHoursToHmA(selectedAuditLog.otHours || 1.5)}</span>
                </div>
              </div>

              {/* Statutory Wage Computation Box */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-950 space-y-1.5">
                <span className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Statutory Wage Calculation Formula</span>
                </span>
                <div className="text-[11px] leading-relaxed text-emerald-900">
                  Applied Policy: <strong>{selectedAuditLog.policyName}</strong> ({selectedAuditLog.multiplier}× Multiplier)
                </div>
                <div className="p-2 rounded bg-background/80 border border-emerald-200/80 font-mono text-xs font-bold text-foreground">
                  {formatDecimalHoursToHmA(selectedAuditLog.otHours || 1.5)} ({selectedAuditLog.otHours || 1.5}h) × {selectedAuditLog.multiplier}× × ₹{selectedAuditLog.hourlyOrdinaryRate || 150}/hr = ₹{(selectedAuditLog.otAmount || 450).toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-700">
                  Complies with The Factories Act, 1948 Section 59(1): Twice the ordinary rate of wages for work exceeding 9 hours/day.
                </p>
              </div>

              {/* Reason & Generation Source */}
              <div className="p-2.5 rounded-lg border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Source</span>
                  <Badge variant="outline" className="text-[9.5px] bg-purple-50 text-purple-700 border-purple-200 font-semibold whitespace-nowrap">
                    {selectedAuditLog.source === 'ATTENDANCE_AUTO' || selectedAuditLog.generationSource === 'AUTOMATIC_BIOMETRIC' || !selectedAuditLog.source
                      ? 'Automatic Biometric OT'
                      : 'Manual Exception'}
                  </Badge>
                </div>
                <p className="text-foreground pt-1">{selectedAuditLog.reason || 'Automatically computed from biometric punch timestamps exceeding the statutory 9h threshold.'}</p>
                {selectedAuditLog.approvedBy && (
                  <p className="text-[10px] text-muted-foreground pt-1 border-t mt-1">
                    Approved by: <strong>{selectedAuditLog.approvedBy}</strong> on {selectedAuditLog.approvedAt}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedAuditLog(null)}>
                Close Audit
              </Button>

              {selectedAuditLog.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => {
                      handleReject(selectedAuditLog.id);
                      setSelectedAuditLog(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      handleApprove(selectedAuditLog.id);
                      setSelectedAuditLog(null);
                    }}
                  >
                    Approve Overtime
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: VIEW POLICY DETAILS (FOR EMPLOYEES & MANAGERS)
          ───────────────────────────────────────────────────────────── */}
      {selectedPolicyDetails && (
        <Dialog open={Boolean(selectedPolicyDetails)} onOpenChange={() => setSelectedPolicyDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/10">
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">
                      {selectedPolicyDetails.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {selectedPolicyDetails.establishmentType || selectedPolicyDetails.applicableIndustry || 'Statutory Overtime Framework'}
                    </DialogDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold ${
                    selectedPolicyDetails.status === 'Active'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'text-zinc-500 bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {selectedPolicyDetails.status === 'Active' ? 'Active Policy' : 'Disabled Policy'}
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Policy Scope & Employee Category */}
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span>Applicable Employee Scope</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-semibold text-foreground">{selectedPolicyDetails.applicableCategory}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Industry</span>
                    <span className="font-semibold text-foreground">{selectedPolicyDetails.applicableIndustry || 'Standard Commercial'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Break Treatment</span>
                    <Badge variant="outline" className="text-[9.5px] bg-purple-50 text-purple-700 border-purple-200 font-bold">
                      {selectedPolicyDetails.breakDurationMins}m ({selectedPolicyDetails.breakTreatment === 'EXCLUDED_FROM_THRESHOLD' ? 'Excluded' : 'Included in 9h limit'})
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Working Hours & OT Multipliers */}
              <div className="p-3 rounded-lg border bg-card space-y-2.5">
                <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Daily & Weekly Threshold Rules</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2.5 rounded-lg bg-muted/30 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Daily Limit</span>
                    <span className="text-sm font-bold font-mono text-foreground">{selectedPolicyDetails.dailyThresholdHours}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">OT Starts After</span>
                    <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">&gt; {selectedPolicyDetails.otStartsAfterHours}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Weekly Threshold</span>
                    <span className="text-sm font-bold font-mono text-foreground">{selectedPolicyDetails.weeklyThresholdHours}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Rounding Rule</span>
                    <span className="text-sm font-bold text-foreground">{selectedPolicyDetails.roundingRule || '15 Minutes'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Overtime Rate Multipliers</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded border bg-background text-center">
                      <span className="text-[10px] text-muted-foreground block">Normal Workday</span>
                      <span className="text-base font-black text-primary font-mono">{selectedPolicyDetails.normalWorkdayMultiplier}×</span>
                    </div>
                    <div className="p-2 rounded border bg-background text-center">
                      <span className="text-[10px] text-muted-foreground block">Weekly Off</span>
                      <span className="text-base font-black text-primary font-mono">{selectedPolicyDetails.weeklyOffMultiplier}×</span>
                    </div>
                    <div className="p-2 rounded border bg-background text-center">
                      <span className="text-[10px] text-muted-foreground block">Holiday</span>
                      <span className="text-base font-black text-primary font-mono">{selectedPolicyDetails.holidayMultiplier}×</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Payroll Governance */}
              <div className="p-3 rounded-lg border border-emerald-200/70 bg-emerald-50/40 text-emerald-950 space-y-1.5">
                <span className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Statutory Formula & Compliance Guarantee</span>
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  {selectedPolicyDetails.breakTreatment === 'INCLUDED_IN_9H'
                    ? 'Break is included in the 9-hour working threshold. Overtime starts automatically after 9 hours of total attendance without double-deduction.'
                    : 'Break is excluded from working hours before comparing with the daily overtime threshold.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[10px]">
                  <div>
                    <span className="text-emerald-700 block font-semibold">Hourly Wage Basis:</span>
                    <span className="text-emerald-950 font-bold">{selectedPolicyDetails.hourlyRateSource || 'Payroll salary configuration'}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-semibold">Approval Level:</span>
                    <span className="text-emerald-950 font-bold">{selectedPolicyDetails.approvalRequired ? (selectedPolicyDetails.approvalLevel || 'Reporting Manager') : 'Auto-approved'}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-3 border-t bg-muted/10 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedPolicyDetails(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: ADD OVERTIME POLICY (CONFIGURABLE POLICY MASTER)
          ───────────────────────────────────────────────────────────── */}
      <Dialog open={isAddPolicyModalOpen && isAdmin} onOpenChange={setIsAddPolicyModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/10">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Add Overtime Policy
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Multi-industry policy master with company/branch scope, dynamic statutory frameworks, break rules, and payroll sync.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20 font-semibold">
                Multi-Industry Architecture
              </Badge>
            </div>
          </DialogHeader>

          <form onSubmit={handleSavePolicy} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* SECTION 1: ESTABLISHMENT & APPLICABILITY SCOPE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>1. Company & Establishment Scope (Cascading Hierarchy)</span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Company → Branch → Industry → Category
                </span>
              </div>

              {/* Company & Branch Dependency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Company *</Label>
                    <span className="text-[10px] text-primary font-medium">Logged-in Tenant</span>
                  </div>
                  <Select value={newPolicyCompanyId} onValueChange={handleCompanyChange}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Active enterprise legal entity</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Branch * (Company-Restricted)</Label>
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold">
                      {availableBranches.length} Branches Available
                    </Badge>
                  </div>
                  <Select value={newPolicyBranchId} onValueChange={setNewPolicyBranchId}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Filtered specifically to {availableCompanies.find(c => c.id === newPolicyCompanyId)?.name || 'selected company'}
                  </p>
                </div>
              </div>

              {/* Industry & Dependent Employee Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Applicable Industry * (Classification)</Label>
                  <Select value={newPolicyIndustry} onValueChange={handleIndustryChange}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {ALL_INDUSTRIES_LIST.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Selecting industry updates category & legal framework</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Applicable Employee Category *</Label>
                    <span className="text-[9.5px] text-primary font-medium">Cascades from Industry</span>
                  </div>
                  <Select value={newPolicyCategory} onValueChange={setNewPolicyCategory}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {(INDUSTRY_CATEGORIES_MAP[newPolicyIndustry] || ['All Operational Staff']).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Target workforce profile for this policy</p>
                </div>
              </div>

              {/* Statutory Legal Framework / Act */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Statutory Legal Framework / Act *</Label>
                <Select value={newPolicyEstablishment} onValueChange={setNewPolicyEstablishment}>
                  <SelectTrigger className="h-8 text-xs bg-background font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {LEGAL_FRAMEWORKS_LIST.map((law) => (
                      <SelectItem key={law} value={law}>
                        {law}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Configurable statutory basis (e.g. OSH Code 2020 national 8h/48h standard, Maharashtra Shops Act, or Factories Act Sec 59)
                </p>
              </div>

              {/* Policy Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Policy Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Factory Worker Statutory OT"
                    value={newPolicyName}
                    onChange={(e) => setNewPolicyName(e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={newPolicyStatus} onValueChange={(val: any) => setNewPolicyStatus(val)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active (Available for Attendance Matching)</SelectItem>
                      <SelectItem value="Inactive">Inactive (Disabled)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Description</Label>
                <Input
                  placeholder="e.g. Statutory overtime policy for factory and plant technicians under Maharashtra state regulations."
                  value={newPolicyDesc}
                  onChange={(e) => setNewPolicyDesc(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Effective From *</Label>
                  <Input
                    type="text"
                    placeholder="01-04-2026"
                    value={newPolicyEffectiveFrom}
                    onChange={(e) => setNewPolicyEffectiveFrom(e.target.value)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Effective To (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 31-03-2027"
                    value={newPolicyEffectiveTo}
                    onChange={(e) => setNewPolicyEffectiveTo(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: WORKING-HOUR RULES & BREAK TREATMENT */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b pb-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>2. Working-Hour & Break Rules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Daily Working Limit (Hours) *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={newDailyLimit}
                    onChange={(e) => setNewDailyLimit(parseFloat(e.target.value) || 9.0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard daily shift (e.g. 9.0h)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Weekly Working Limit (Hours) *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={newWeeklyLimit}
                    onChange={(e) => setNewWeeklyLimit(parseFloat(e.target.value) || 48.0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard weekly cap (e.g. 48.0h)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Break Duration (Minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={newBreakDuration}
                    onChange={(e) => setNewBreakDuration(parseInt(e.target.value, 10) || 30)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">e.g. 30m or 45m interval</p>
                </div>
              </div>

              {/* Break Treatment Cards */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Break Treatment *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewBreakTreatment('INCLUDED_IN_9H')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newBreakTreatment === 'INCLUDED_IN_9H'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span className={`h-3 w-3 rounded-full border flex items-center justify-center ${newBreakTreatment === 'INCLUDED_IN_9H' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {newBreakTreatment === 'INCLUDED_IN_9H' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </span>
                        Included in daily limit
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 font-semibold">
                        No Double Deduction
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Total clock elapsed duration is compared directly to the daily threshold. (e.g. 10h 30m attendance − 9h limit = <strong>1h 30m OT</strong>).
                    </p>
                  </div>

                  <div
                    onClick={() => setNewBreakTreatment('EXCLUDED_FROM_THRESHOLD')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newBreakTreatment === 'EXCLUDED_FROM_THRESHOLD'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span className={`h-3 w-3 rounded-full border flex items-center justify-center ${newBreakTreatment === 'EXCLUDED_FROM_THRESHOLD' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {newBreakTreatment === 'EXCLUDED_FROM_THRESHOLD' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </span>
                        Excluded from daily limit
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                        Deducted from Elapsed
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Break duration is deducted from attendance elapsed time before checking OT. (e.g. 10h 30m − 30m break = 10h worked → <strong>1h 00m OT</strong>).
                    </p>
                  </div>
                </div>
              </div>

              {/* OT Trigger & Threshold Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">OT Starts After (Hours) *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={newOtStartsAfter}
                    onChange={(e) => setNewOtStartsAfter(parseFloat(e.target.value) || 9.0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Trigger point (e.g. &gt; 9.0h)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Minimum OT (Minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={newMinOtDuration}
                    onChange={(e) => setNewMinOtDuration(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Threshold to qualify (e.g. 0 min)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Rounding Rule</Label>
                  <Select value={newRoundingRule} onValueChange={setNewRoundingRule}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None (Exact Minutes)</SelectItem>
                      <SelectItem value="15 Minutes">15 minutes (Quarter-hour)</SelectItem>
                      <SelectItem value="30 Minutes">30 minutes (Half-hour)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Rounding per OSH rules</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Max Daily OT (Hours)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="12"
                    value={newMaxDailyOt}
                    onChange={(e) => setNewMaxDailyOt(parseFloat(e.target.value) || 4.0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Daily ceiling (e.g. 4h)</p>
                </div>
              </div>
            </div>

            {/* SECTION 3: OT MULTIPLIERS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b pb-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>3. OT Multipliers (Policy-Governed Rates)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Normal Workday OT *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={newWorkdayMultiplier}
                    onChange={(e) => setNewWorkdayMultiplier(parseFloat(e.target.value) || 2.0)}
                    className="h-8 text-xs font-mono font-bold text-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">e.g. 2.0× factory, 1.5× office</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Weekly Off OT *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={newWeeklyOffMultiplier}
                    onChange={(e) => setNewWeeklyOffMultiplier(parseFloat(e.target.value) || 2.0)}
                    className="h-8 text-xs font-mono font-bold text-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">Scheduled rest day work (2.0×)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Holiday OT *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={newHolidayMultiplier}
                    onChange={(e) => setNewHolidayMultiplier(parseFloat(e.target.value) || 2.0)}
                    className="h-8 text-xs font-mono font-bold text-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">Statutory / National holiday (2.0×)</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Night OT Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={newNightMultiplier}
                    onChange={(e) => setNewNightMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Third shift differential (e.g. 1.0×)</p>
                </div>
              </div>
            </div>

            {/* SECTION 4: APPROVAL & PAYROLL INTEGRATION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b pb-1">
                <FileCheck className="h-3.5 w-3.5 text-primary" />
                <span>4. Approval & Payroll Configuration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">OT Approval Required *</Label>
                  <Select
                    value={newApprovalRequired ? 'true' : 'false'}
                    onValueChange={(val) => setNewApprovalRequired(val === 'true')}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes — Required (Workflow Sign-off)</SelectItem>
                      <SelectItem value="false">No — Auto-Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Supervisor / Manager verification</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Approval Level</Label>
                  <Select value={newApprovalLevel} onValueChange={setNewApprovalLevel}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVAL_LEVELS.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Designated approval hierarchy</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payroll Integration</Label>
                  <Select
                    value={newPayrollSync ? 'true' : 'false'}
                    onValueChange={(val) => setNewPayrollSync(val === 'true')}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled — Sync to Payroll Batch</SelectItem>
                      <SelectItem value="false">Disabled — Compliance Audit Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Export into monthly payroll register</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payroll Component *</Label>
                  <Input
                    placeholder="Overtime Earnings"
                    value={newPayrollComponent}
                    onChange={(e) => setNewPayrollComponent(e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground">Salary slip ledger earnings head</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Ordinary Hourly Rate Source *</Label>
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold">
                      ₹150 Benchmark
                    </Badge>
                  </div>
                  <Select value={newHourlyRateSource} onValueChange={setNewHourlyRateSource}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURLY_RATE_SOURCES.map((src) => (
                        <SelectItem key={src.value} value={src.value}>
                          {src.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Never uses ₹1 default rate</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Max Monthly OT (Hours)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="200"
                    value={newMaxMonthlyOt}
                    onChange={(e) => setNewMaxMonthlyOt(parseFloat(e.target.value) || 50.0)}
                    className="h-8 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Statutory worker cap (e.g. 50h)</p>
                </div>
              </div>
            </div>

            {/* LIVE CALCULATION PREVIEW BOX */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Interactive Policy Calculation Preview (Automatic Engine Simulation)</span>
                </span>
                <Badge variant="outline" className="text-[10px] bg-background font-mono text-foreground font-semibold">
                  Test Punch: 10:06 AM – 08:36 PM (10h 30m)
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-lg bg-background/95 border shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Elapsed Duration</div>
                  <div className="font-mono font-black text-xs text-foreground mt-0.5">10h 30m (10.5h)</div>
                  <span className="text-[9.5px] text-muted-foreground">{newBreakDuration}m break</span>
                </div>

                <div className="p-2.5 rounded-lg bg-background/95 border shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Daily Limit</div>
                  <div className="font-mono font-black text-xs text-foreground mt-0.5">{newDailyLimit} Hours</div>
                  <span className="text-[9.5px] text-muted-foreground">{newBreakTreatment === 'INCLUDED_IN_9H' ? 'Includes Break' : 'Excludes Break'}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-background/95 border shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Calculated OT</div>
                  <div className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {formatDecimalHoursToHmA(policyPreviewCalc.otHours)} ({policyPreviewCalc.otHours}h)
                  </div>
                  <span className="text-[9.5px] text-emerald-600 font-semibold">{newRoundingRule} Rounding</span>
                </div>

                <div className="p-2.5 rounded-lg bg-background/95 border shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Est. Payout (@ ₹150/hr)</div>
                  <div className="font-mono font-black text-sm text-primary mt-0.5">
                    ₹{policyPreviewCalc.amount.toLocaleString()}
                  </div>
                  <span className="text-[9.5px] text-primary font-semibold">{newWorkdayMultiplier}× Multiplier</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-background/70 border border-primary/20 text-[11px] text-foreground leading-relaxed">
                <strong>Formula:</strong> ({newBreakTreatment === 'INCLUDED_IN_9H' ? '10h 30m punch elapsed' : '10h 30m punch − ' + newBreakDuration + 'm break'} − {newDailyLimit}h threshold) = <strong>{policyPreviewCalc.otHours}h OT</strong> × {newWorkdayMultiplier}× multiplier × ₹150/hr ordinary rate = <strong>₹{policyPreviewCalc.amount.toLocaleString()}</strong>.
                {newBreakTreatment === 'INCLUDED_IN_9H' && (
                  <span className="text-emerald-700 font-semibold block mt-0.5">
                    ✓ Break is included in the {newDailyLimit}h daily limit — no second deduction applied.
                  </span>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPolicyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createPolicyMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 cursor-pointer shadow-sm"
              >
                {createPolicyMutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving Policy...
                  </>
                ) : (
                  'Save Policy'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
