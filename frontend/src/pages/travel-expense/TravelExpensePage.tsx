import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plane,
  Receipt,
  CreditCard,
  Plus,
  Building2,
  Route,
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Send,
  Building,
  MapPin,
  AlertCircle,
  Link2,
  ChevronDown,
  Check,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { travelExpenseApi, type TravelBooking, type ExpenseClaim } from '@/api/travel-expense';
import { employeesApi } from '@/api/employees';
import { departmentsApi } from '@/api/organization';

// ---------------------------------------------------------------------------
// Searchable Employee Select Component
// ---------------------------------------------------------------------------
function SearchableEmployeeSelect({
  employees,
  value,
  onSelect,
  placeholder = 'Choose employee...',
}: {
  employees: any[];
  value: string;
  onSelect: (empId: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEmp = employees.find((e) => e.id === value);

  const sortedEmployees = [...employees].sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );

  const filteredEmployees = sortedEmployees.filter((e) => {
    const text = `${e.firstName} ${e.lastName} ${e.employeeCode}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className="truncate">
          {selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName} (${selectedEmp.employeeCode})` : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute top-full left-0 mt-1 z-50 w-full min-w-[260px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-80">
            <div className="p-1 border-b pb-1.5 mb-1">
              <div className="relative flex items-center">
                <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-muted/40 rounded border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
              {filteredEmployees.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onSelect(e.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-accent hover:text-accent-foreground ${
                    value === e.id ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  <span>
                    {e.firstName} {e.lastName}{' '}
                    <span className="text-[10px] text-muted-foreground font-mono">({e.employeeCode})</span>
                  </span>
                  {value === e.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              ))}

              {filteredEmployees.length === 0 && (
                <p className="p-3 text-center text-xs text-muted-foreground">No matching employees found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TravelExpensePage() {
  const navigate = useNavigate();
  const routeParams = useParams<{ tab?: string }>();
  const [searchParams] = useSearchParams();

  const { activeCompanyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Role Scopes
  const isHrOrAdmin = isHrOrAdminUser(user);
  const isEmployeeMode = !isHrOrAdmin && !!user?.employee?.id;
  const currentEmployee = user?.employee;

  const defaultTab = isHrOrAdmin ? 'pending' : 'dashboard';
  const activeTab = routeParams.tab || searchParams.get('tab') || defaultTab;

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClaimCreateOpen, setIsClaimCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TravelBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Approval & Rejection Confirmation Modals
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [bookingToApprove, setBookingToApprove] = useState<TravelBooking | null>(null);

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<TravelBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data: dashboardStats } = useQuery({
    queryKey: ['travel-dashboard-stats', activeCompanyId],
    queryFn: () => travelExpenseApi.getDashboardStats(activeCompanyId),
  });

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['travel-bookings', activeCompanyId, searchTerm, statusFilter, typeFilter, deptFilter, isEmployeeMode, currentEmployee?.id],
    queryFn: () =>
      travelExpenseApi.listBookings({
        companyId: isEmployeeMode ? undefined : activeCompanyId,
        search: searchTerm,
        status: statusFilter,
        travelType: typeFilter,
        departmentId: isEmployeeMode ? undefined : deptFilter,
        employeeId: isEmployeeMode ? currentEmployee?.id : undefined,
      }),
  });

  const { data: claimsData = [] } = useQuery({
    queryKey: ['expense-claims', activeCompanyId, isEmployeeMode],
    queryFn: () => travelExpenseApi.listClaims(isEmployeeMode ? undefined : activeCompanyId),
  });

  // Filter claims for employee mode
  const claims = isEmployeeMode && currentEmployee?.id
    ? claimsData.filter((c) => c.employeeId === currentEmployee.id)
    : claimsData;

  const { data: employeesData } = useQuery({
    queryKey: ['company-employees-travel', activeCompanyId],
    queryFn: () => employeesApi.list({ companyId: activeCompanyId, pageSize: 1000 }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['company-departments-travel', activeCompanyId],
    queryFn: () => departmentsApi.list(activeCompanyId),
  });

  const employees = employeesData?.items || [];

  // Filter ONLY SUBMITTED requests for Pending Approvals Queue
  const pendingApprovals = bookings.filter((b) => b.status === 'SUBMITTED');
  const pendingClaimsList = claimsData.filter((c) => c.status === 'PENDING' || c.status === 'SUBMITTED');
  const totalPendingCount = pendingApprovals.length + pendingClaimsList.length;

  const approvedClaimsList = claimsData.filter(
    (c) => c.status === 'APPROVED' || c.status === 'PAYMENT_PENDING' || c.status === 'REIMBURSED' || c.status === 'CLOSED'
  );

  // Payment Modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [claimToPay, setClaimToPay] = useState<ExpenseClaim | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Direct Bank Transfer (NEFT/RTGS)');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const triggerPaymentModal = (claim: ExpenseClaim) => {
    setClaimToPay(claim);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReference(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setPaymentMethod('Direct Bank Transfer (NEFT/RTGS)');
    setPaymentRemarks('Net reimbursement settlement disbursed to employee bank account');
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!claimToPay) return;
    if (!paymentReference.trim()) {
      toast.error('Payment reference / UTR number is required');
      return;
    }

    updateClaimStatusMutation.mutate({
      id: claimToPay.id,
      data: {
        status: 'REIMBURSED',
        remarks: `Reimbursed via ${paymentMethod} | Ref: ${paymentReference.trim()} | Note: ${paymentRemarks.trim()}`,
      },
    });

    setIsPaymentOpen(false);
    setClaimToPay(null);
  };

  // ---------------------------------------------------------------------------
  // Travel Booking Form State
  // ---------------------------------------------------------------------------
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const [purpose, setPurpose] = useState('');
  const [travelType, setTravelType] = useState('Domestic');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelMode, setTravelMode] = useState('Flight');

  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [hotelDetails, setHotelDetails] = useState('');

  // Cost breakdowns
  const [estTravel, setEstTravel] = useState<number | string>(0);
  const [estHotel, setEstHotel] = useState<number | string>(0);
  const [estFood, setEstFood] = useState<number | string>(0);
  const [estLocal, setEstLocal] = useState<number | string>(0);
  const [otherCost, setOtherCost] = useState<number | string>(0);

  // Advance
  const [advanceRequired, setAdvanceRequired] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number | string>(0);
  const [advanceRemarks, setAdvanceRemarks] = useState('');
  const [remarks, setRemarks] = useState('');

  // Computed total cost
  const totalEstimatedCost =
    (Number(estTravel) || 0) +
    (Number(estHotel) || 0) +
    (Number(estFood) || 0) +
    (Number(estLocal) || 0) +
    (Number(otherCost) || 0);

  const handleSelectEmployee = (empId: string) => {
    setFormEmployeeId(empId);
    const emp = employees.find((e: any) => e.id === empId);
    setSelectedEmp(emp || null);
  };

  // Auto-set employee on initialization if in employee mode
  useEffect(() => {
    if (isEmployeeMode && currentEmployee?.id) {
      setFormEmployeeId(currentEmployee.id);
      const emp = employees.find((e: any) => e.id === currentEmployee.id);
      if (emp) {
        setSelectedEmp(emp);
      }
    }
  }, [isEmployeeMode, currentEmployee, employees]);

  const resetTravelForm = () => {
    if (isEmployeeMode && currentEmployee?.id) {
      setFormEmployeeId(currentEmployee.id);
      const emp = employees.find((e: any) => e.id === currentEmployee.id);
      setSelectedEmp(emp || null);
    } else {
      setFormEmployeeId('');
      setSelectedEmp(null);
    }
    setPurpose('');
    setTravelType('Domestic');
    setFromLocation('');
    setToLocation('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setTravelMode('Flight');
    setAccommodationRequired(false);
    setHotelDetails('');
    setEstTravel(0);
    setEstHotel(0);
    setEstFood(0);
    setEstLocal(0);
    setOtherCost(0);
    setAdvanceRequired(false);
    setAdvanceAmount(0);
    setAdvanceRemarks('');
    setRemarks('');
  };

  // ---------------------------------------------------------------------------
  // Expense Claim Form State
  // ---------------------------------------------------------------------------
  const [claimEmpId, setClaimEmpId] = useState('');
  const [claimTitle, setClaimTitle] = useState('');
  const [claimCategory, setClaimCategory] = useState('Flight & Hotel');
  const [claimAmount, setClaimAmount] = useState<number | string>(0);
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [claimTravelBookingId, setClaimTravelBookingId] = useState('');
  const [claimReceiptUrl, setClaimReceiptUrl] = useState('');
  const [claimRemarks, setClaimRemarks] = useState('');

  const resetClaimForm = () => {
    if (isEmployeeMode && currentEmployee?.id) {
      setClaimEmpId(currentEmployee.id);
    } else {
      setClaimEmpId('');
    }
    setClaimTitle('');
    setClaimCategory('Flight & Hotel');
    setClaimAmount(0);
    setClaimDate(new Date().toISOString().split('T')[0]);
    setClaimTravelBookingId('');
    setClaimReceiptUrl('');
    setClaimRemarks('');
  };

  // Auto-populate when linking a travel booking in Expense Claim form
  const handleSelectTravelBookingInClaim = (bookingId: string) => {
    setClaimTravelBookingId(bookingId);
    if (bookingId && bookingId !== 'NONE') {
      const b = bookings.find((item) => item.id === bookingId);
      if (b) {
        setClaimTitle(`Expense Claim for ${b.purpose} (${b.bookingCode})`);
        setClaimAmount(b.totalEstimatedCost);
        if (!isEmployeeMode && b.employeeId) {
          setClaimEmpId(b.employeeId);
        }
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createBookingMutation = useMutation({
    mutationFn: (payload: any) => travelExpenseApi.createBooking(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['travel-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['travel-dashboard-stats'] });
      const empName = selectedEmp
        ? `${selectedEmp.firstName} ${selectedEmp.lastName}`
        : currentEmployee
        ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
        : 'Employee';
      const isDraft = variables.status === 'DRAFT';
      toast.success(
        `Travel Booking ${data.bookingCode} ${isDraft ? 'saved as Draft' : 'submitted'} successfully!`,
        {
          description: `Travel ID: ${data.bookingCode} | Employee: ${empName} | Department: ${selectedEmp?.department?.name || currentEmployee?.departmentName || 'HR'}`,
        }
      );
      setIsCreateOpen(false);
      resetTravelForm();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save travel booking';
      toast.error('Travel Request Save Error', { description: Array.isArray(msg) ? msg.join(', ') : msg });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: string; remarks?: string; rejectionReason?: string } }) =>
      travelExpenseApi.updateStatus(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['travel-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['travel-dashboard-stats'] });
      if (updated.status === 'REJECTED') {
        toast.error(`Travel Booking ${updated.bookingCode} rejected.`, {
          description: `Reason: ${updated.rejectionReason || 'No reason provided'}`,
        });
      } else {
        toast.success(`Travel Booking ${updated.bookingCode} approved successfully!`, {
          description: `Status: ${updated.status}`,
        });
      }
      setSelectedBooking(updated);
      setIsApproveConfirmOpen(false);
      setIsRejectOpen(false);
      setBookingToApprove(null);
      setBookingToReject(null);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update booking status');
    },
  });

  const createExpenseClaimMutation = useMutation({
    mutationFn: (payload: any) => travelExpenseApi.createClaimDirect(payload),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['travel-dashboard-stats'] });
      toast.success(`Expense Claim ${claim.claimCode} submitted successfully!`);
      setIsClaimCreateOpen(false);
      resetClaimForm();
      navigate('/travel-expense/claims');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create expense claim';
      toast.error('Expense Claim Error', { description: Array.isArray(msg) ? msg.join(', ') : msg });
    },
  });

  const updateClaimStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; remarks?: string } }) =>
      travelExpenseApi.updateClaimStatus(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['travel-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['travel-dashboard-stats'] });
      if (updated.status === 'REJECTED') {
        toast.error(`Expense Claim ${updated.claimCode} rejected.`);
      } else {
        toast.success(`Expense Claim ${updated.claimCode} approved & reimbursed successfully!`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update expense claim status');
    },
  });

  const handleSaveTravelBooking = (statusPayload: 'DRAFT' | 'SUBMITTED') => {
    const targetEmpId = isEmployeeMode && currentEmployee?.id ? currentEmployee.id : formEmployeeId;

    if (!targetEmpId) {
      toast.error('Please select an employee');
      return;
    }
    if (!purpose.trim()) {
      toast.error('Travel Purpose is required');
      return;
    }
    if (!fromLocation.trim() || !toLocation.trim()) {
      toast.error('From and To locations are required');
      return;
    }

    createBookingMutation.mutate({
      companyId: activeCompanyId,
      employeeId: targetEmpId,
      departmentId: selectedEmp?.departmentId || currentEmployee?.departmentId || undefined,
      designationId: selectedEmp?.designationId || currentEmployee?.designationId || undefined,
      branchId: selectedEmp?.branchId || undefined,
      costCenterId: selectedEmp?.costCenterId || undefined,
      gradeId: selectedEmp?.gradeId || undefined,
      reportingManagerId: selectedEmp?.reportingManagerId || undefined,
      purpose: purpose.trim(),
      travelType,
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      travelMode,
      accommodationRequired,
      hotelDetails: accommodationRequired ? hotelDetails.trim() : undefined,
      estimatedTravelCost: Number(estTravel) || 0,
      estimatedHotelCost: Number(estHotel) || 0,
      estimatedFoodCost: Number(estFood) || 0,
      estimatedLocalTransport: Number(estLocal) || 0,
      otherCost: Number(otherCost) || 0,
      advanceRequired,
      advanceAmount: advanceRequired ? Number(advanceAmount) || 0 : 0,
      advanceRemarks: advanceRequired ? advanceRemarks.trim() : undefined,
      remarks: remarks.trim() || undefined,
      status: statusPayload,
    });
  };

  const handleSaveExpenseClaim = () => {
    const targetEmpId = isEmployeeMode && currentEmployee?.id ? currentEmployee.id : claimEmpId;

    if (!targetEmpId) {
      toast.error('Please select an employee for the claim');
      return;
    }
    if (!claimTitle.trim()) {
      toast.error('Expense Title is required');
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      toast.error('Please enter a valid Claim Amount');
      return;
    }

    createExpenseClaimMutation.mutate({
      companyId: activeCompanyId,
      employeeId: targetEmpId,
      travelBookingId: claimTravelBookingId || undefined,
      title: claimTitle.trim(),
      category: claimCategory,
      amount: Number(claimAmount),
      date: new Date(claimDate).toISOString(),
      receiptUrl: claimReceiptUrl.trim() || undefined,
      remarks: claimRemarks.trim() || undefined,
    });
  };

  const openBookingDetails = async (booking: TravelBooking) => {
    try {
      const fullData = await travelExpenseApi.getBooking(booking.id);
      setSelectedBooking(fullData);
    } catch {
      setSelectedBooking(booking);
    }
    setIsDetailOpen(true);
  };

  const triggerApproveModal = (booking: TravelBooking) => {
    setBookingToApprove(booking);
    setIsApproveConfirmOpen(true);
  };

  const triggerRejectModal = (booking: TravelBooking) => {
    setBookingToReject(booking);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  const formatCurrency = (val?: number | string) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Plane}
        title={isEmployeeMode ? "My Travel & Expense Management" : "Business Travel & Expense Management"}
        description={
          isEmployeeMode
            ? `Logged in as ${currentEmployee?.firstName} ${currentEmployee?.lastName} (${currentEmployee?.employeeCode || ''}) • Department: ${selectedEmp?.department?.name || currentEmployee?.departmentName || 'Human Resources'}`
            : "Company-isolated travel requests, multi-stage approval workflows, and independent Expense Claims management"
        }
        badge="Live System Connected"
        badgeVariant="info"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'claims' ? (
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                onClick={() => {
                  resetClaimForm();
                  setIsClaimCreateOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Create Expense Claim
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                onClick={() => {
                  resetTravelForm();
                  setIsCreateOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Create Travel Booking
              </Button>
            )}
          </div>
        }
      />

      {/* ── KPI STAT CARDS ── */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Plane}
          label={isEmployeeMode ? "My YTD Travel Budget Spent" : "YTD Travel Budget Spent"}
          value={formatCurrency(dashboardStats?.ytdBudgetSpent)}
          hint="System Approved Travel Spend"
          accent="info"
        />
        <StatCard
          icon={Receipt}
          label={isEmployeeMode ? "My Pending Claims Queue" : "Pending Approvals Queue"}
          value={formatCurrency(
            isHrOrAdmin && pendingApprovals.length > 0
              ? pendingApprovals.reduce((s, b) => s + (b.advanceRequired ? Number(b.advanceAmount || 0) : Number(b.totalEstimatedCost || 0)), 0)
              : dashboardStats?.pendingClaimsAmount
          )}
          hint={
            isHrOrAdmin
              ? `${pendingApprovals.length} Travel Approvals Pending`
              : `${dashboardStats?.pendingClaimsCount || 0} Requests Awaiting Audit`
          }
          accent="warning"
          onClick={() => {
            if (isHrOrAdmin) navigate('/travel-expense/pending');
          }}
          className={isHrOrAdmin ? 'cursor-pointer hover:border-amber-500/50 transition-all' : ''}
        />
        <StatCard
          icon={CreditCard}
          label="Reimbursed This Month"
          value={formatCurrency(dashboardStats?.reimbursedThisMonth)}
          hint="Direct Bank Payouts"
          accent="success"
        />
        <StatCard
          icon={Building2}
          label="Corporate Card Sync"
          value={dashboardStats?.corporateCardSync?.statusText || 'Not Connected'}
          hint={dashboardStats?.corporateCardSync?.description || 'Integration Disabled'}
          accent="primary"
        />
      </div>

      {/* ── TABS ── */}
      <Tabs value={activeTab} onValueChange={(val) => navigate(`/travel-expense/${val}`)} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>

          {isHrOrAdmin ? (
            <>
              <TabsTrigger value="pending" className="text-xs px-3 py-1.5 font-semibold text-amber-700 dark:text-amber-400">
                Pending Approvals ({totalPendingCount})
              </TabsTrigger>
              <TabsTrigger value="travel" className="text-xs px-3 py-1.5">
                Company Travel Register ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="claims" className="text-xs px-3 py-1.5">
                Expense Claims ({claims.length})
              </TabsTrigger>
              <TabsTrigger value="reimbursements" className="text-xs px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                Reimbursements ({approvedClaimsList.length})
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="travel" className="text-xs px-3 py-1.5">
                My Travel Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="claims" className="text-xs px-3 py-1.5">
                My Expense Claims ({claims.length})
              </TabsTrigger>
              <TabsTrigger value="reimbursements" className="text-xs px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                My Reimbursements ({approvedClaimsList.filter((c) => c.employeeId === currentEmployee?.id).length})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="dashboard" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {isEmployeeMode ? "My Recent Travel & Expense Register" : "Recent Travel & Expense Register"}
              </CardTitle>
              <CardDescription>Verified claims and company travel requests with workflow tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Traveler</TableHead>
                    <TableHead className="text-xs">Destination & Purpose</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Mode / Category</TableHead>
                    <TableHead className="text-xs">Total Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.slice(0, 5).map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{b.bookingCode}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {b.employee ? `${b.employee.firstName} ${b.employee.lastName}` : 'Unassigned'}
                        <span className="block text-[10px] text-muted-foreground">{b.employee?.employeeCode}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {b.fromLocation} → {b.toLocation}
                        <span className="block text-[10px] text-muted-foreground truncate max-w-[200px]">{b.purpose}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </TableCell>
                      <TableCell className="text-xs">{b.travelMode}</TableCell>
                      <TableCell className="text-xs font-semibold">{formatCurrency(b.totalEstimatedCost)}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge
                          status={b.status}
                          label={['MANAGER_APPROVED', 'HR_APPROVED', 'FINANCE_APPROVED'].includes(b.status) ? 'APPROVED' : undefined}
                          className="text-[10px]"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Button size="xs" variant="outline" onClick={() => openBookingDetails(b)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                        No travel bookings found for the selected company entity.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ADMIN PENDING APPROVALS QUEUE TAB ── */}
        {isHrOrAdmin && (
          <TabsContent value="pending" className="mt-4 space-y-4">
            <Card className="shadow-2xs border-amber-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Pending Travel Approvals Queue
                  </CardTitle>
                  <CardDescription>Employee travel requests awaiting Admin / Reporting Manager review</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-bold font-mono bg-amber-500/10 text-amber-700 border-amber-500/30">
                  {pendingApprovals.length} Pending Approvals
                </Badge>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Booking ID</TableHead>
                      <TableHead className="text-xs">Traveler</TableHead>
                      <TableHead className="text-xs">Department</TableHead>
                      <TableHead className="text-xs">Route & Purpose</TableHead>
                      <TableHead className="text-xs">Mode</TableHead>
                      <TableHead className="text-xs">Dates</TableHead>
                      <TableHead className="text-xs">Estimated Cost</TableHead>
                      <TableHead className="text-xs">Advance Requested</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((b) => (
                      <TableRow key={b.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-bold text-primary">{b.bookingCode}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {b.employee ? `${b.employee.firstName} ${b.employee.lastName}` : 'Unassigned'}
                          <span className="block text-[10px] text-muted-foreground font-mono">{b.employee?.employeeCode}</span>
                        </TableCell>
                        <TableCell className="text-xs">{b.department?.name || 'Human Resources'}</TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">{b.fromLocation} → {b.toLocation}</span>
                          <span className="block text-[10px] text-muted-foreground truncate max-w-[180px]">{b.purpose}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.travelMode}</TableCell>
                        <TableCell className="text-xs font-mono">
                          {new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} –{' '}
                          {new Date(b.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{formatCurrency(b.totalEstimatedCost)}</TableCell>
                        <TableCell className="text-xs font-bold font-mono text-amber-600">
                          {b.advanceRequired ? formatCurrency(b.advanceAmount) : '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge status={b.status} className="text-[10px]" />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="xs" variant="outline" onClick={() => openBookingDetails(b)}>
                              View Details
                            </Button>
                            <Button
                              size="xs"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => triggerApproveModal(b)}
                            >
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => triggerRejectModal(b)}
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {pendingApprovals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10">
                          <EmptyState
                            icon={CheckCircle2}
                            title="No Pending Approvals"
                            description="All travel booking requests for your company have been reviewed and processed."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* PENDING EXPENSE CLAIMS QUEUE CARD */}
            <Card className="shadow-2xs border-blue-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Pending Expense Claims Queue
                  </CardTitle>
                  <CardDescription>Employee out-of-pocket expense claims awaiting Finance / Admin reimbursement audit</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-bold font-mono bg-blue-500/10 text-blue-700 border-blue-500/30">
                  {pendingClaimsList.length} Claims Awaiting Audit
                </Badge>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Claim ID</TableHead>
                      <TableHead className="text-xs">Traveler / Employee</TableHead>
                      <TableHead className="text-xs">Title & Category</TableHead>
                      <TableHead className="text-xs">Related Booking</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Claim Amount</TableHead>
                      <TableHead className="text-xs">Advance Deducted</TableHead>
                      <TableHead className="text-xs">Net Balance</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingClaimsList.map((c) => {
                      const relatedBooking = c.travelBookingId ? bookings.find((b) => b.id === c.travelBookingId) : null;
                      const advDeducted = relatedBooking?.advanceRequired ? Number(relatedBooking.advanceAmount || 0) : 0;
                      const netBalance = Math.max(0, Number(c.amount || 0) - advDeducted);

                      return (
                        <TableRow key={c.id} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-xs font-bold text-primary">{c.claimCode}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'Unassigned'}
                            <span className="block text-[10px] text-muted-foreground font-mono">{c.employee?.employeeCode}</span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium">{c.title}</span>
                            <span className="block text-[10px] text-muted-foreground">{c.category}</span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-primary">
                            {c.travelBooking?.bookingCode ? (
                              <span className="inline-flex items-center gap-1">
                                <Link2 className="h-3 w-3" /> {c.travelBooking.bookingCode}
                              </span>
                            ) : (
                              '— (Direct)'
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{formatCurrency(c.amount)}</TableCell>
                          <TableCell className="text-xs font-mono text-amber-600">
                            {advDeducted > 0 ? formatCurrency(advDeducted) : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(netBalance)}
                          </TableCell>
                          <TableCell className="text-xs">
                            <StatusBadge status={c.status} className="text-[10px]" />
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="xs"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => updateClaimStatusMutation.mutate({ id: c.id, data: { status: 'APPROVED', remarks: 'Claim approved and reimbursed by Admin/Finance' } })}
                                disabled={updateClaimStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve Claim
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => updateClaimStatusMutation.mutate({ id: c.id, data: { status: 'REJECTED', remarks: 'Claim rejected' } })}
                                disabled={updateClaimStatusMutation.isPending}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {pendingClaimsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <EmptyState
                            icon={Receipt}
                            title="No Pending Expense Claims"
                            description="All submitted out-of-pocket expense claims have been audited and reimbursed."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── TRAVEL BOOKINGS TAB (REGISTER / MY BOOKINGS) ── */}
        <TabsContent value="travel" className="mt-4 space-y-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {isEmployeeMode ? "My Travel Requests & Bookings" : "Company Travel Register"}
                </CardTitle>
                <CardDescription>
                  {isEmployeeMode ? "Track your personal travel pre-approval requests and status" : "All company travel pre-approval records and audit logs"}
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  resetTravelForm();
                  setIsCreateOpen(true);
                }}
              >
                <Route className="h-3.5 w-3.5" /> New Travel Request
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* FILTERS TOOLBAR */}
              <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, traveler, purpose, destination..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="MANAGER_APPROVED">Manager Approved</SelectItem>
                      <SelectItem value="HR_APPROVED">HR Approved</SelectItem>
                      <SelectItem value="FINANCE_APPROVED">Finance Approved</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                      <SelectValue placeholder="Travel Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="Domestic">Domestic</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                      <SelectItem value="Local">Local</SelectItem>
                    </SelectContent>
                  </Select>

                  {!isEmployeeMode && (
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Departments</SelectItem>
                        {departments.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* BOOKINGS TABLE */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Booking ID</TableHead>
                    <TableHead className="text-xs">Traveler</TableHead>
                    <TableHead className="text-xs">Route & Purpose</TableHead>
                    <TableHead className="text-xs">Travel Type</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Dates</TableHead>
                    <TableHead className="text-xs">Estimated Cost</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{b.bookingCode}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {b.employee ? `${b.employee.firstName} ${b.employee.lastName}` : 'Unassigned'}
                        <span className="block text-[10px] text-muted-foreground">{b.department?.name || 'Department'}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{b.fromLocation} → {b.toLocation}</span>
                        <span className="block text-[10px] text-muted-foreground truncate max-w-[180px]">{b.purpose}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{b.travelType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.travelMode}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} –{' '}
                        {new Date(b.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {formatCurrency(b.totalEstimatedCost)}
                        {b.advanceRequired && (
                          <span className="block text-[9px] text-amber-600 font-normal">
                            Advance: {formatCurrency(b.advanceAmount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge
                          status={b.status}
                          label={['MANAGER_APPROVED', 'HR_APPROVED', 'FINANCE_APPROVED'].includes(b.status) ? 'APPROVED' : undefined}
                          className="text-[10px]"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="xs" variant="outline" onClick={() => openBookingDetails(b)}>
                            View Details
                          </Button>

                          {/* ADMIN ONLY QUICK APPROVE / REJECT ACTIONS */}
                          {isHrOrAdmin && b.status === 'SUBMITTED' && (
                            <>
                              <Button
                                size="xs"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => triggerApproveModal(b)}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => triggerRejectModal(b)}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {bookings.length === 0 && !isBookingsLoading && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <EmptyState
                          icon={Plane}
                          title="No Travel Bookings Found"
                          description={
                            isEmployeeMode
                              ? "You have not created any travel requests yet. Click 'New Travel Request' to create one."
                              : "No travel pre-approval requests match your current filters or selected company."
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXPENSE CLAIMS TAB ── */}
        <TabsContent value="claims" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {isEmployeeMode ? "My Expense Claims Ledger" : "Expense Claims Ledger"}
                </CardTitle>
                <CardDescription>Expense claims with receipts, policy verification, and reimbursement status</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                onClick={() => {
                  resetClaimForm();
                  setIsClaimCreateOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Create Expense Claim
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Claim ID</TableHead>
                    <TableHead className="text-xs">Traveler / Employee</TableHead>
                    <TableHead className="text-xs">Title & Category</TableHead>
                    <TableHead className="text-xs">Related Travel Booking</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Claim Amount</TableHead>
                    <TableHead className="text-xs">Advance Deducted</TableHead>
                    <TableHead className="text-xs">Net Balance</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((c) => {
                    const relatedBooking = c.travelBookingId ? bookings.find((b) => b.id === c.travelBookingId) : null;
                    const advDeducted = relatedBooking?.advanceRequired ? Number(relatedBooking.advanceAmount || 0) : 0;
                    const netBalance = Math.max(0, Number(c.amount || 0) - advDeducted);

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs font-semibold">{c.claimCode}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'Unassigned'}
                          <span className="block text-[10px] text-muted-foreground">{c.employee?.employeeCode}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">{c.title}</span>
                          <span className="block text-[10px] text-muted-foreground">{c.category}</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-primary">
                          {c.travelBooking?.bookingCode ? (
                            <span className="inline-flex items-center gap-1">
                              <Link2 className="h-3 w-3" /> {c.travelBooking.bookingCode}
                            </span>
                          ) : (
                            '— (Direct Claim)'
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{formatCurrency(c.amount)}</TableCell>
                        <TableCell className="text-xs font-mono text-amber-600">
                          {advDeducted > 0 ? formatCurrency(advDeducted) : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(netBalance)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge status={c.status} className="text-[10px]" />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEmployeeMode && (c.status === 'PENDING' || c.status === 'DRAFT') && (
                            <Button
                              size="xs"
                              className="bg-primary hover:bg-primary/90 gap-1 text-[11px]"
                              onClick={() => updateClaimStatusMutation.mutate({ id: c.id, data: { status: 'SUBMITTED', remarks: 'Submitted for manager approval' } })}
                              disabled={updateClaimStatusMutation.isPending}
                            >
                              <Send className="h-3 w-3" /> Submit Claim
                            </Button>
                          )}

                          {isHrOrAdmin && (c.status === 'PENDING' || c.status === 'SUBMITTED') && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="xs"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => updateClaimStatusMutation.mutate({ id: c.id, data: { status: 'APPROVED', remarks: 'Claim approved and reimbursed by Admin/Finance' } })}
                                disabled={updateClaimStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => updateClaimStatusMutation.mutate({ id: c.id, data: { status: 'REJECTED', remarks: 'Claim rejected' } })}
                                disabled={updateClaimStatusMutation.isPending}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          )}

                          {(c.status === 'APPROVED' || c.status === 'REIMBURSED' || c.status === 'COMPLETED') && (
                            <span className="text-[10px] text-emerald-600 font-semibold font-mono">Approved & Settled</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {claims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                        No expense claims found. Click "Create Expense Claim" to submit a new claim.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REIMBURSEMENTS TAB ── */}
        <TabsContent value="reimbursements" className="mt-4 space-y-4">
          <Card className="shadow-2xs border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Finance Reimbursements & Direct Bank Payouts
                </CardTitle>
                <CardDescription>Approved expense claims settlement queue, UTR payment tracking, and reimbursement history</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-bold font-mono bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                {approvedClaimsList.length} Reimbursement Records
              </Badge>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Claim ID</TableHead>
                    <TableHead className="text-xs">Traveler / Employee</TableHead>
                    <TableHead className="text-xs">Title & Category</TableHead>
                    <TableHead className="text-xs">Related Booking</TableHead>
                    <TableHead className="text-xs">Claim Amount</TableHead>
                    <TableHead className="text-xs">Advance Paid</TableHead>
                    <TableHead className="text-xs">Net Payable Reimbursement</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Action / Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedClaimsList.map((c) => {
                    const relatedBooking = c.travelBookingId ? bookings.find((b) => b.id === c.travelBookingId) : null;
                    const advDeducted = relatedBooking?.advanceRequired ? Number(relatedBooking.advanceAmount || 0) : 0;
                    const netBalance = Math.max(0, Number(c.amount || 0) - advDeducted);
                    const isPaid = c.status === 'REIMBURSED' || c.status === 'CLOSED';

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-bold text-primary">{c.claimCode}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'Unassigned'}
                          <span className="block text-[10px] text-muted-foreground font-mono">{c.employee?.employeeCode}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">{c.title}</span>
                          <span className="block text-[10px] text-muted-foreground">{c.category}</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-primary">
                          {c.travelBooking?.bookingCode ? (
                            <span className="inline-flex items-center gap-1">
                              <Link2 className="h-3 w-3" /> {c.travelBooking.bookingCode}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{formatCurrency(c.amount)}</TableCell>
                        <TableCell className="text-xs font-mono text-amber-600">
                          {advDeducted > 0 ? formatCurrency(advDeducted) : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(netBalance)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge
                            status={isPaid ? 'REIMBURSED' : 'APPROVED'}
                            label={isPaid ? 'REIMBURSED' : 'APPROVED - PAYABLE'}
                            className="text-[10px]"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isHrOrAdmin && !isPaid ? (
                            <Button
                              size="xs"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]"
                              onClick={() => triggerPaymentModal(c)}
                            >
                              <CreditCard className="h-3 w-3" /> Process Payment
                            </Button>
                          ) : isPaid ? (
                            <span className="text-[10px] text-emerald-600 font-bold font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              ✓ Paid & Closed
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-medium">Awaiting Finance Payout</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {approvedClaimsList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <EmptyState
                          icon={Banknote}
                          title="No Reimbursement Records"
                          description="No approved expense claims currently awaiting payment or reimbursement."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================================== */}
      {/* ── MODAL 1: CREATE TRAVEL BOOKING ── */}
      {/* =========================================================================== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" /> Create New Travel Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill out traveler itinerary details, estimated costs, and advance requests for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            {/* 1. EMPLOYEE & ORG CONTEXT */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
              <Label className="font-semibold text-xs text-primary flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Traveler Profile & Organizational Scope
              </Label>

              {isEmployeeMode && currentEmployee ? (
                /* READ-ONLY PROFILE FOR LOGGED-IN EMPLOYEE */
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Employee Name</Label>
                      <Input
                        value={`${selectedEmp?.firstName || currentEmployee.firstName || ''} ${selectedEmp?.lastName || currentEmployee.lastName || ''}`}
                        readOnly
                        className="h-8 text-xs bg-muted/50 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Employee Code</Label>
                      <Input
                        value={selectedEmp?.employeeCode || currentEmployee.employeeCode || '—'}
                        readOnly
                        className="h-8 text-xs bg-muted/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                    <div>Department: <span className="font-semibold text-foreground">{selectedEmp?.department?.name || currentEmployee.departmentName || 'Human Resources'}</span></div>
                    <div>Designation: <span className="font-semibold text-foreground">{selectedEmp?.designation?.title || currentEmployee.designationTitle || '—'}</span></div>
                    <div>Branch: <span className="font-semibold text-foreground">{selectedEmp?.branch?.name || '—'}</span></div>
                  </div>
                </div>
              ) : (
                /* ADMIN SEARCHABLE SELECT */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Select Employee *</Label>
                      <SearchableEmployeeSelect
                        employees={employees}
                        value={formEmployeeId}
                        onSelect={handleSelectEmployee}
                        placeholder="Choose employee..."
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Employee Code</Label>
                      <Input value={selectedEmp?.employeeCode || '—'} readOnly className="h-8 text-xs bg-muted/50 font-mono" />
                    </div>
                  </div>

                  {selectedEmp && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                      <div>Department: <span className="font-semibold text-foreground">{selectedEmp.department?.name || '—'}</span></div>
                      <div>Designation: <span className="font-semibold text-foreground">{selectedEmp.designation?.title || '—'}</span></div>
                      <div>Branch: <span className="font-semibold text-foreground">{selectedEmp.branch?.name || '—'}</span></div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 2. ITINERARY & DATES */}
            <div className="space-y-2">
              <Label className="font-semibold text-xs flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Trip Details & Itinerary
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px]">Travel Purpose *</Label>
                  <Input
                    placeholder="e.g. Client Onboarding Meeting / Annual Tech Conference"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Travel Type</Label>
                  <Select value={travelType} onValueChange={setTravelType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Domestic">Domestic</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                      <SelectItem value="Local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Travel Mode</Label>
                  <Select value={travelMode} onValueChange={setTravelMode}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flight">Flight</SelectItem>
                      <SelectItem value="Train">Train</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Taxi">Taxi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">From Location *</Label>
                  <Input placeholder="e.g. Mumbai" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} className="h-8 text-xs" />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">To Location *</Label>
                  <Input placeholder="e.g. Bangalore" value={toLocation} onChange={(e) => setToLocation(e.target.value)} className="h-8 text-xs" />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Start Date *</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs font-mono" />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">End Date *</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
              </div>
            </div>

            {/* 3. ACCOMMODATION */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Hotel Accommodation Required
                </Label>
                <input
                  type="checkbox"
                  checked={accommodationRequired}
                  onChange={(e) => setAccommodationRequired(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              {accommodationRequired && (
                <div className="space-y-1 pt-2">
                  <Label className="text-[11px]">Hotel Details / Property Preference</Label>
                  <Input
                    placeholder="e.g. Taj Vivanta, Bangalore (2 Nights, Single Room)"
                    value={hotelDetails}
                    onChange={(e) => setHotelDetails(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* 4. COST BREAKDOWN */}
            <div className="space-y-2">
              <Label className="font-semibold text-xs flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-primary" /> Estimated Travel Costs & Budgeting (INR)
              </Label>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Flight / Travel Cost</Label>
                  <Input type="number" value={estTravel} onChange={(e) => setEstTravel(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Hotel Cost</Label>
                  <Input type="number" value={estHotel} onChange={(e) => setEstHotel(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Food / Daily Allowance</Label>
                  <Input type="number" value={estFood} onChange={(e) => setEstFood(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Local Transport</Label>
                  <Input type="number" value={estLocal} onChange={(e) => setEstLocal(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Other Expenses</Label>
                  <Input type="number" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} className="h-8 text-xs font-mono" />
                </div>

                <div className="space-y-1 bg-primary/10 p-1.5 rounded border border-primary/20">
                  <Label className="text-[11px] font-bold text-primary">Total Estimated Cost</Label>
                  <div className="text-sm font-bold font-mono text-primary">{formatCurrency(totalEstimatedCost)}</div>
                </div>
              </div>
            </div>

            {/* 5. ADVANCE REQUEST */}
            <div className="space-y-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Request Cash Advance
                </Label>
                <input
                  type="checkbox"
                  checked={advanceRequired}
                  onChange={(e) => setAdvanceRequired(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              {advanceRequired && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Advance Amount (INR) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Advance Justification</Label>
                    <Input
                      placeholder="Reason for advance"
                      value={advanceRemarks}
                      onChange={(e) => setAdvanceRemarks(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6. REMARKS */}
            <div className="space-y-2">
              <Label className="text-[11px]">Remarks / Special Instructions</Label>
              <Textarea
                placeholder="Additional notes for manager approval..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => handleSaveTravelBooking('DRAFT')}
                disabled={createBookingMutation.isPending}
              >
                <FileText className="h-3.5 w-3.5" /> Save Draft
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary"
                onClick={() => handleSaveTravelBooking('SUBMITTED')}
                disabled={createBookingMutation.isPending}
              >
                <Send className="h-3.5 w-3.5" /> Submit for Approval
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================== */}
      {/* ── MODAL 2: CREATE EXPENSE CLAIM ── */}
      {/* =========================================================================== */}
      <Dialog open={isClaimCreateOpen} onOpenChange={setIsClaimCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Create New Expense Claim
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submit an out-of-pocket expense claim or link it to a pre-approved travel booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            {isEmployeeMode && currentEmployee ? (
              <div className="space-y-2 bg-muted/30 p-2.5 rounded border">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground">{currentEmployee.firstName} {currentEmployee.lastName}</span>
                    <span className="ml-2 font-mono text-muted-foreground">({currentEmployee.employeeCode})</span>
                  </div>
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {selectedEmp?.department?.name || currentEmployee.departmentName || 'Human Resources'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-[11px]">Select Employee *</Label>
                <SearchableEmployeeSelect
                  employees={employees}
                  value={claimEmpId}
                  onSelect={setClaimEmpId}
                  placeholder="Choose claimant employee..."
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[11px]">Related Travel Booking (Optional)</Label>
              <Select value={claimTravelBookingId} onValueChange={handleSelectTravelBookingInClaim}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None (Direct Expense Claim)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (Direct Expense Claim)</SelectItem>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bookingCode} – {b.purpose} ({b.fromLocation} → {b.toLocation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Claim Title / Description *</Label>
              <Input
                placeholder="e.g. Bangalore Client Onboarding Hotel & Meals"
                value={claimTitle}
                onChange={(e) => setClaimTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Expense Category</Label>
                <Select value={claimCategory} onValueChange={setClaimCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flight & Hotel">Flight & Hotel</SelectItem>
                    <SelectItem value="Meals & Transport">Meals & Transport</SelectItem>
                    <SelectItem value="Hotel Stay">Hotel Stay</SelectItem>
                    <SelectItem value="Fuel & Mileage">Fuel & Mileage</SelectItem>
                    <SelectItem value="Client Entertainment">Client Entertainment</SelectItem>
                    <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Expense Date *</Label>
                <Input
                  type="date"
                  value={claimDate}
                  onChange={(e) => setClaimDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Claim Amount (INR) *</Label>
              <Input
                type="number"
                placeholder="e.g. 24800"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Receipt URL / Attachment Link</Label>
              <Input
                placeholder="https://... receipt image or doc link"
                value={claimReceiptUrl}
                onChange={(e) => setClaimReceiptUrl(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Claim Remarks</Label>
              <Textarea
                placeholder="Additional audit notes or receipt breakdown..."
                value={claimRemarks}
                onChange={(e) => setClaimRemarks(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsClaimCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-primary"
              onClick={handleSaveExpenseClaim}
              disabled={createExpenseClaimMutation.isPending}
            >
              <Send className="h-3.5 w-3.5" /> Submit Expense Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================== */}
      {/* ── MODAL 3: TRAVEL BOOKING DETAILS & WORKFLOW APPROVAL ── */}
      {/* =========================================================================== */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                      <Plane className="h-4 w-4 text-primary" /> {selectedBooking.bookingCode} – {selectedBooking.purpose}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Submitted on {new Date(selectedBooking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </DialogDescription>
                  </div>
                  <StatusBadge
                    status={selectedBooking.status}
                    label={['MANAGER_APPROVED', 'HR_APPROVED', 'FINANCE_APPROVED'].includes(selectedBooking.status) ? 'APPROVED' : undefined}
                    className="text-xs"
                  />
                </div>
              </DialogHeader>

              <div className="space-y-4 text-xs py-2">
                {/* NEXT PROCESS DYNAMIC BANNER */}
                <div className="bg-muted/30 border rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={selectedBooking.status}
                      label={['MANAGER_APPROVED', 'HR_APPROVED', 'FINANCE_APPROVED'].includes(selectedBooking.status) ? 'APPROVED' : undefined}
                      className="text-xs"
                    />
                    <div>
                      <span className="font-semibold text-foreground">
                        Next Process:{' '}
                        {selectedBooking.status === 'SUBMITTED' && 'Awaiting Manager / Admin Approval'}
                        {selectedBooking.status === 'MANAGER_APPROVED' && (selectedBooking.advanceRequired ? 'Travel Advance Disbursement / Start Trip' : 'Start Trip')}
                        {selectedBooking.status === 'ADVANCE_DISBURSED' && 'Start Trip / Trip In Progress'}
                        {selectedBooking.status === 'IN_PROGRESS' && 'Complete Trip & Submit Expense Claim'}
                        {selectedBooking.status === 'TRIP_COMPLETED' && 'Submit Expense Claim for Reimbursement'}
                        {selectedBooking.status === 'COMPLETED' && 'Reimbursement & Settlement Complete'}
                        {selectedBooking.status === 'REJECTED' && 'Request Rejected'}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedBooking.status === 'SUBMITTED' && 'Submitted by traveler. Awaiting pre-approval.'}
                        {selectedBooking.status === 'MANAGER_APPROVED' && 'Pre-approval granted. Ready for travel execution.'}
                        {selectedBooking.status === 'ADVANCE_DISBURSED' && 'Cash advance disbursed to employee bank account.'}
                        {selectedBooking.status === 'IN_PROGRESS' && 'Traveler is currently on trip.'}
                        {selectedBooking.status === 'TRIP_COMPLETED' && 'Trip finished. Submit out-of-pocket expenses.'}
                        {selectedBooking.status === 'COMPLETED' && 'All travel claims settled and archived.'}
                        {selectedBooking.status === 'REJECTED' && `Reason: ${selectedBooking.rejectionReason || 'Not approved'}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TRAVELER PROFILE */}
                <div className="grid grid-cols-4 gap-2 bg-muted/40 p-3 rounded-lg border">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Traveler</span>
                    <p className="font-semibold text-xs">
                      {selectedBooking.employee ? `${selectedBooking.employee.firstName} ${selectedBooking.employee.lastName}` : 'Unassigned'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedBooking.employee?.employeeCode}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Department</span>
                    <p className="font-medium text-xs">{selectedBooking.department?.name || 'Human Resources'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Designation</span>
                    <p className="font-medium text-xs">{selectedBooking.designation?.title || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Branch</span>
                    <p className="font-medium text-xs">{selectedBooking.branch?.name || '—'}</p>
                  </div>
                </div>

                {/* ITINERARY */}
                <div className="space-y-2 border rounded-lg p-3">
                  <Label className="font-semibold text-xs text-primary flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5" /> Trip Itinerary & Schedule
                  </Label>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Route</span>
                      <p className="font-bold text-xs">{selectedBooking.fromLocation} → {selectedBooking.toLocation}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Travel Dates</span>
                      <p className="font-medium text-xs font-mono">
                        {new Date(selectedBooking.startDate).toLocaleDateString()} to {new Date(selectedBooking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Travel Mode</span>
                      <p className="font-medium text-xs">{selectedBooking.travelMode} ({selectedBooking.travelType})</p>
                    </div>
                  </div>

                  {selectedBooking.accommodationRequired && (
                    <div className="mt-2 bg-muted/40 p-2 rounded text-[11px]">
                      <span className="font-semibold">Hotel Accommodation: </span>
                      {selectedBooking.hotelDetails || 'Requested'}
                    </div>
                  )}
                </div>

                {/* COST & ADVANCE */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-2">
                    <Label className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5" /> Estimated Expenses
                    </Label>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between"><span>Flight / Travel:</span> <span className="font-mono">{formatCurrency(selectedBooking.estimatedTravelCost)}</span></div>
                      <div className="flex justify-between"><span>Hotel:</span> <span className="font-mono">{formatCurrency(selectedBooking.estimatedHotelCost)}</span></div>
                      <div className="flex justify-between"><span>Food / Per Diem:</span> <span className="font-mono">{formatCurrency(selectedBooking.estimatedFoodCost)}</span></div>
                      <div className="flex justify-between"><span>Local Transport:</span> <span className="font-mono">{formatCurrency(selectedBooking.estimatedLocalTransport)}</span></div>
                      <div className="flex justify-between"><span>Other:</span> <span className="font-mono">{formatCurrency(selectedBooking.otherCost)}</span></div>
                      <div className="flex justify-between border-t pt-1 font-bold text-xs text-primary">
                        <span>Total Estimated:</span> <span className="font-mono">{formatCurrency(selectedBooking.totalEstimatedCost)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 space-y-2 bg-amber-500/5">
                    <Label className="font-semibold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Advance Cash Request
                    </Label>
                    {selectedBooking.advanceRequired ? (
                      <div className="space-y-1 text-[11px]">
                        <div>Requested Amount: <span className="font-bold font-mono text-amber-600">{formatCurrency(selectedBooking.advanceAmount)}</span></div>
                        <div>Remarks: <span className="text-muted-foreground">{selectedBooking.advanceRemarks || 'None'}</span></div>
                        <div className="pt-1 border-t text-[10px]">
                          Advance Status: {' '}
                          <span className={`font-semibold ${selectedBooking.status === 'ADVANCE_DISBURSED' || selectedBooking.status === 'IN_PROGRESS' || selectedBooking.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {selectedBooking.status === 'ADVANCE_DISBURSED' || selectedBooking.status === 'IN_PROGRESS' || selectedBooking.status === 'COMPLETED' ? 'Disbursed / Paid' : 'Approved for Disbursement'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No advance cash was requested for this trip.</p>
                    )}
                  </div>
                </div>

                {/* REJECTION REASON DISPLAY */}
                {selectedBooking.status === 'REJECTED' && selectedBooking.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-700 dark:text-red-400 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" /> Rejection Remarks
                    </div>
                    <p>{selectedBooking.rejectionReason}</p>
                  </div>
                )}

                {/* WORKFLOW STEPPER TIMELINE */}
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  <Label className="font-semibold text-xs text-primary flex items-center gap-1.5">
                    <Workflow className="h-3.5 w-3.5" /> Travel & Expense Workflow Lifecycle
                  </Label>
                  <div className="grid grid-cols-6 gap-1 pt-2">
                    {/* Step 1: Created */}
                    <div className="flex flex-col items-center text-center">
                      <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                      <span className="text-[10px] font-semibold mt-1">1. Request</span>
                      <span className="text-[9px] text-muted-foreground">{selectedBooking.status === 'DRAFT' ? 'Draft Saved' : 'Submitted'}</span>
                    </div>

                    {/* Step 2: Approved */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        ['MANAGER_APPROVED', 'ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                          ? 'bg-emerald-500 text-white'
                          : selectedBooking.status === 'REJECTED'
                          ? 'bg-red-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {['MANAGER_APPROVED', 'ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                          ? '✓'
                          : selectedBooking.status === 'REJECTED'
                          ? '✕'
                          : '2'}
                      </div>
                      <span className="text-[10px] font-semibold mt-1">2. Approval</span>
                      <span className="text-[9px] text-muted-foreground">
                        {selectedBooking.status === 'REJECTED' ? 'Rejected' : ['MANAGER_APPROVED', 'ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status) ? 'Manager Approved' : 'Pending'}
                      </span>
                    </div>

                    {/* Step 3: Advance */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        ['ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                          ? 'bg-emerald-500 text-white'
                          : selectedBooking.status === 'MANAGER_APPROVED' && selectedBooking.advanceRequired
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {['ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                          ? '✓'
                          : selectedBooking.advanceRequired
                          ? '3'
                          : '—'}
                      </div>
                      <span className="text-[10px] font-semibold mt-1">3. Advance</span>
                      <span className="text-[9px] text-muted-foreground">
                        {selectedBooking.advanceRequired
                          ? ['ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                            ? 'Disbursed'
                            : 'Pending Payout'
                          : 'Not Requested'}
                      </span>
                    </div>

                    {/* Step 4: Trip Execution */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        ['TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                          ? 'bg-emerald-500 text-white'
                          : selectedBooking.status === 'IN_PROGRESS'
                          ? 'bg-indigo-500 text-white animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {['TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status) ? '✓' : '4'}
                      </div>
                      <span className="text-[10px] font-semibold mt-1">4. Trip Execution</span>
                      <span className="text-[9px] text-muted-foreground">
                        {selectedBooking.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : ['TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status)
                          ? 'Completed'
                          : 'Upcoming'}
                      </span>
                    </div>

                    {/* Step 5: Expense Claim */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        (selectedBooking.expenseClaims && selectedBooking.expenseClaims.length > 0) || selectedBooking.status === 'COMPLETED'
                          ? 'bg-emerald-500 text-white'
                          : selectedBooking.status === 'TRIP_COMPLETED'
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {(selectedBooking.expenseClaims && selectedBooking.expenseClaims.length > 0) || selectedBooking.status === 'COMPLETED' ? '✓' : '5'}
                      </div>
                      <span className="text-[10px] font-semibold mt-1">5. Expense Claim</span>
                      <span className="text-[9px] text-muted-foreground">
                        {selectedBooking.expenseClaims && selectedBooking.expenseClaims.length > 0
                          ? `${selectedBooking.expenseClaims.length} Linked`
                          : selectedBooking.status === 'TRIP_COMPLETED'
                          ? 'Available Now'
                          : 'Post-Trip'}
                      </span>
                    </div>

                    {/* Step 6: Settlement & Closed */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        selectedBooking.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {selectedBooking.status === 'COMPLETED' ? '✓' : '6'}
                      </div>
                      <span className="text-[10px] font-semibold mt-1">6. Closed</span>
                      <span className="text-[9px] text-muted-foreground">
                        {selectedBooking.status === 'COMPLETED' ? 'Reimbursed & Closed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* APPROVAL HISTORY TIMELINE */}
                <div className="space-y-2 border rounded-lg p-3">
                  <Label className="font-semibold text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Approval History & Audit Trail
                  </Label>

                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {selectedBooking.approvalHistory?.map((log) => (
                      <div key={log.id} className="flex items-start justify-between text-[11px] border-b pb-1.5">
                        <div>
                          <span className="font-semibold">{log.userName}</span>
                          <span className="ml-2 text-muted-foreground">({log.action})</span>
                          {log.remarks && <p className="text-[10px] text-muted-foreground mt-0.5">{log.remarks}</p>}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                    {(!selectedBooking.approvalHistory || selectedBooking.approvalHistory.length === 0) && (
                      <p className="text-[11px] text-muted-foreground">No approval history logs recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <DialogFooter className="gap-2 sm:justify-between border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>

                <div className="flex flex-wrap gap-2">
                  {/* WORKFLOW LIFECYCLE ACTION BUTTONS */}
                  {['MANAGER_APPROVED', 'ADVANCE_DISBURSED'].includes(selectedBooking.status) && (
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, data: { action: 'IN_PROGRESS', remarks: 'Trip started by traveler' } })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Plane className="h-3.5 w-3.5" /> Start Trip
                    </Button>
                  )}

                  {selectedBooking.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, data: { action: 'TRIP_COMPLETED', remarks: 'Trip marked completed by traveler' } })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Trip Completed
                    </Button>
                  )}

                  {/* ADMIN DISBURSE CASH ADVANCE ACTION */}
                  {isHrOrAdmin && selectedBooking.status === 'MANAGER_APPROVED' && selectedBooking.advanceRequired && (
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, data: { action: 'ADVANCE_DISBURSED', remarks: `Disbursed advance cash ₹${selectedBooking.advanceAmount}` } })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Disburse Advance Cash
                    </Button>
                  )}

                  {/* SUBMIT EXPENSE CLAIM LINK BUTTON */}
                  {['MANAGER_APPROVED', 'ADVANCE_DISBURSED', 'IN_PROGRESS', 'TRIP_COMPLETED', 'COMPLETED'].includes(selectedBooking.status) && (
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                      onClick={() => {
                        setIsDetailOpen(false);
                        resetClaimForm();
                        setClaimEmpId(selectedBooking.employeeId);
                        handleSelectTravelBookingInClaim(selectedBooking.id);
                        setIsClaimCreateOpen(true);
                      }}
                    >
                      <Receipt className="h-3.5 w-3.5" /> Submit Expense Claim for Trip
                    </Button>
                  )}

                  {/* DRAFT OR REJECTED ACTION */}
                  {(selectedBooking.status === 'DRAFT' || selectedBooking.status === 'REJECTED') && (
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-primary"
                      onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, data: { action: 'SUBMITTED', remarks: 'Resubmitted for approval' } })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Send className="h-3.5 w-3.5" /> Submit for Approval
                    </Button>
                  )}

                  {/* ADMIN ONLY APPROVAL / REJECTION ACTIONS */}
                  {isHrOrAdmin && selectedBooking.status === 'SUBMITTED' && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5 text-xs"
                        onClick={() => triggerRejectModal(selectedBooking)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Request
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => triggerApproveModal(selectedBooking)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve Request
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================== */}
      {/* ── MODAL 4: APPROVE CONFIRMATION DIALOG ── */}
      {/* =========================================================================== */}
      <Dialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Approve Travel Booking?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review travel request details before approving. Status will change to MANAGER_APPROVED.
            </DialogDescription>
          </DialogHeader>

          {bookingToApprove && (
            <div className="space-y-2 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-xs py-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Travel ID:</span>
                <span className="font-mono font-bold text-primary">{bookingToApprove.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee:</span>
                <span className="font-semibold">
                  {bookingToApprove.employee ? `${bookingToApprove.employee.firstName} ${bookingToApprove.employee.lastName}` : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route:</span>
                <span className="font-medium">{bookingToApprove.fromLocation} → {bookingToApprove.toLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Estimated Cost:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(bookingToApprove.totalEstimatedCost)}
                </span>
              </div>
              {bookingToApprove.advanceRequired && (
                <div className="flex justify-between border-t border-emerald-500/20 pt-1.5">
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">Advance Requested:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {formatCurrency(bookingToApprove.advanceAmount)}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsApproveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => {
                if (bookingToApprove) {
                  updateStatusMutation.mutate({
                    id: bookingToApprove.id,
                    data: { action: 'MANAGER_APPROVED', remarks: 'Approved by Admin User' },
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================== */}
      {/* ── MODAL 5: REJECTION REASON PROMPT ── */}
      {/* =========================================================================== */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" /> Reject Travel Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a reason for rejecting travel booking {bookingToReject?.bookingCode || ''}.
            </DialogDescription>
          </DialogHeader>

          {bookingToReject && (
            <div className="text-xs bg-muted/40 p-2.5 rounded border space-y-1">
              <div className="font-semibold">{bookingToReject.bookingCode} – {bookingToReject.purpose}</div>
              <div className="text-muted-foreground">
                Traveler: {bookingToReject.employee ? `${bookingToReject.employee.firstName} ${bookingToReject.employee.lastName}` : 'Unassigned'}
              </div>
            </div>
          )}

          <div className="space-y-2 py-2 text-xs">
            <Label className="text-[11px]">Rejection Reason *</Label>
            <Textarea
              placeholder="e.g. Travel dates are not approved by the department / Budget limit exceeded..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast.error('Rejection reason is required');
                  return;
                }
                if (bookingToReject) {
                  updateStatusMutation.mutate({
                    id: bookingToReject.id,
                    data: { action: 'REJECTED', rejectionReason: rejectionReason.trim() },
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================== */}
      {/* ── MODAL 6: PROCESS REIMBURSEMENT PAYMENT DIALOG ── */}
      {/* =========================================================================== */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600">
              <CreditCard className="h-5 w-5 text-emerald-600" /> Process Reimbursement Payout
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record bank transfer details and settle expense claim {claimToPay?.claimCode}.
            </DialogDescription>
          </DialogHeader>

          {claimToPay && (
            <div className="space-y-2 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claim ID:</span>
                <span className="font-mono font-bold text-primary">{claimToPay.claimCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee:</span>
                <span className="font-semibold">
                  {claimToPay.employee ? `${claimToPay.employee.firstName} ${claimToPay.employee.lastName}` : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claim Amount:</span>
                <span className="font-mono">{formatCurrency(claimToPay.amount)}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-500/20 pt-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Net Balance Payable:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatCurrency(
                    Math.max(
                      0,
                      Number(claimToPay.amount || 0) -
                        (claimToPay.travelBookingId
                          ? Number(bookings.find((b) => b.id === claimToPay.travelBookingId)?.advanceAmount || 0)
                          : 0)
                    )
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px]">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct Bank Transfer (NEFT/RTGS)">Direct Bank Transfer (NEFT/RTGS)</SelectItem>
                  <SelectItem value="Corporate Card Reimbursement">Corporate Card Reimbursement</SelectItem>
                  <SelectItem value="Company UPI Payout">Company UPI Payout</SelectItem>
                  <SelectItem value="Payroll Reimbursement">Add to Next Payroll</SelectItem>
                  <SelectItem value="Cash Settlement">Cash Settlement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">UTR / Transaction Ref *</Label>
                <Input
                  placeholder="e.g. UTR-98421039"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Payment Remarks</Label>
              <Textarea
                placeholder="Finance payment reference notes..."
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                className="text-xs min-h-[50px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={handleConfirmPayment}
              disabled={updateClaimStatusMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Payment & Close Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
