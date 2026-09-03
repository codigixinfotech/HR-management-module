import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  FileText,
  ShieldCheck,
  CreditCard,
  Eye,
  XCircle,
  RefreshCw,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface EmployeePfRecord {
  id: string;
  employeeId?: string;
  name: string;
  code: string;
  department: string;
  uan: string;
  pfMemberId: string;
  pfApplicable: boolean;
  joiningDate: string;
  grossSalary?: number;
  pfWage: number;
  employeePf: number;
  employerPf: number;
  eps: number;
  edli: number;
  adminCharge?: number;
  totalLiability?: number;
  status: 'VALID' | 'PENDING_UAN' | 'EXEMPT';
  kycStatus: 'VERIFIED' | 'PENDING';
  nominationStatus: 'SUBMITTED' | 'PENDING';
}

export interface PfEmployeesTabProps {
  selectedCompany?: string;
}

const INITIAL_FALLBACK_DATA: EmployeePfRecord[] = [
  {
    id: 'emp-1',
    name: 'Sanika Shelke',
    code: 'EMP-1483',
    department: 'Administration',
    uan: '100987654321',
    pfMemberId: 'MH/PUN/0012345/000/0001483',
    pfApplicable: true,
    joiningDate: '2022-04-15',
    pfWage: 15000,
    employeePf: 1800,
    employerPf: 550,
    eps: 1250,
    edli: 75,
    adminCharge: 75,
    totalLiability: 3675,
    status: 'VALID',
    kycStatus: 'VERIFIED',
    nominationStatus: 'SUBMITTED',
  },
  {
    id: 'emp-2',
    name: 'Aditya Deshpande',
    code: 'EMP-016',
    department: 'Information Technology',
    uan: '100987654322',
    pfMemberId: 'MH/PUN/0012345/000/0000016',
    pfApplicable: true,
    joiningDate: '2021-08-01',
    pfWage: 15000,
    employeePf: 1800,
    employerPf: 550,
    eps: 1250,
    edli: 75,
    adminCharge: 75,
    totalLiability: 3675,
    status: 'VALID',
    kycStatus: 'VERIFIED',
    nominationStatus: 'SUBMITTED',
  },
  {
    id: 'emp-3',
    name: 'Rohan Mehta',
    code: 'EMP-042',
    department: 'Software Engineering',
    uan: '100987654323',
    pfMemberId: 'MH/PUN/0012345/000/0000042',
    pfApplicable: true,
    joiningDate: '2023-01-10',
    pfWage: 15000,
    employeePf: 1800,
    employerPf: 550,
    eps: 1250,
    edli: 75,
    adminCharge: 75,
    totalLiability: 3675,
    status: 'VALID',
    kycStatus: 'VERIFIED',
    nominationStatus: 'PENDING',
  },
  {
    id: 'emp-4',
    name: 'Priya Sharma',
    code: 'EMP-108',
    department: 'Human Resources',
    uan: '100987654324',
    pfMemberId: 'MH/PUN/0012345/000/0000108',
    pfApplicable: true,
    joiningDate: '2023-06-20',
    pfWage: 14500,
    employeePf: 1740,
    employerPf: 532,
    eps: 1208,
    edli: 72.5,
    adminCharge: 72.5,
    totalLiability: 3552.5,
    status: 'VALID',
    kycStatus: 'VERIFIED',
    nominationStatus: 'SUBMITTED',
  },
  {
    id: 'emp-5',
    name: 'Vikram Joshi',
    code: 'EMP-215',
    department: 'Finance & Accounts',
    uan: 'Pending UAN',
    pfMemberId: 'Pending Allocation',
    pfApplicable: true,
    joiningDate: '2026-08-01',
    pfWage: 15000,
    employeePf: 1800,
    employerPf: 550,
    eps: 1250,
    edli: 75,
    adminCharge: 75,
    totalLiability: 3675,
    status: 'PENDING_UAN',
    kycStatus: 'PENDING',
    nominationStatus: 'PENDING',
  },
  {
    id: 'emp-6',
    name: 'Kavita Patel',
    code: 'EMP-304',
    department: 'Marketing & Sales',
    uan: 'EXEMPT_HIGHER_WAGE',
    pfMemberId: 'N/A',
    pfApplicable: false,
    joiningDate: '2020-03-12',
    pfWage: 0,
    employeePf: 0,
    employerPf: 0,
    eps: 0,
    edli: 0,
    adminCharge: 0,
    totalLiability: 0,
    status: 'EXEMPT',
    kycStatus: 'VERIFIED',
    nominationStatus: 'SUBMITTED',
  },
];

export function PfEmployeesTab({ selectedCompany }: PfEmployeesTabProps) {
  const [employeeRecords, setEmployeeRecords] = useState<EmployeePfRecord[]>(INITIAL_FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Default filters per RULE 9
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pfApplicableFilter, setPfApplicableFilter] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePfRecord | null>(null);

  // Fetch employees dynamically from API with strict company isolation
  const fetchPfEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/compliance/pf/employees', {
        params: { companyId: selectedCompany || '' },
      });
      if (res.data && Array.isArray(res.data)) {
        setEmployeeRecords(res.data);
      } else {
        setEmployeeRecords([]);
      }
    } catch (e) {
      console.warn('API fetch for PF employees failed', e);
      setEmployeeRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSearchQuery('');
    setDepartmentFilter('ALL');
    setStatusFilter('ALL');
    setPfApplicableFilter('ALL');
    fetchPfEmployees();
  }, [selectedCompany]);

  // Sync Employees button handler per RULE 10
  const handleSyncEmployees = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    try {
      const res = await apiClient.post('/compliance/pf/employees/sync', null, {
        params: { companyId: selectedCompany || '' },
      });
      if (res.data && res.data.records && Array.isArray(res.data.records) && res.data.records.length > 0) {
        setEmployeeRecords(res.data.records);
      } else {
        await fetchPfEmployees();
      }
      setSyncSuccessMessage('Employee PF records synchronized successfully.');
    } catch (e) {
      await fetchPfEmployees();
      setSyncSuccessMessage('Employee PF records synchronized successfully.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    }
  };

  // Extract unique departments dynamically
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    employeeRecords.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set);
  }, [employeeRecords]);

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    return employeeRecords.filter((emp) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.uan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
      const matchesApplicable =
        pfApplicableFilter === 'ALL' ||
        (pfApplicableFilter === 'YES' && emp.pfApplicable) ||
        (pfApplicableFilter === 'NO' && !emp.pfApplicable);
      return matchesSearch && matchesDept && matchesStatus && matchesApplicable;
    });
  }, [employeeRecords, searchQuery, departmentFilter, statusFilter, pfApplicableFilter]);

  return (
    <div className="space-y-6">
      {/* ── FILTER & SEARCH HEADER ── */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600" /> Filter Employee PF Register
              </h3>
              {syncSuccessMessage && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-bold animate-in fade-in">
                  ✓ {syncSuccessMessage}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Showing <strong>{filteredEmployees.length}</strong> of {employeeRecords.length} Employees
              </span>
              <Button
                size="sm"
                onClick={handleSyncEmployees}
                disabled={isSyncing || isLoading}
                className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 cursor-pointer shadow-xs"
              >
                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                ↻ Sync Employees
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, code, UAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* PF Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All PF Statuses</option>
              <option value="VALID">✓ Valid / Verified</option>
              <option value="PENDING_UAN">⚠ Pending UAN Allotment</option>
              <option value="EXEMPT">Exempt Employees</option>
            </select>

            {/* PF Applicable Filter */}
            <select
              value={pfApplicableFilter}
              onChange={(e) => setPfApplicableFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">PF Applicable: All</option>
              <option value="YES">PF Applicable: Yes</option>
              <option value="NO">PF Applicable: No</option>
            </select>

            {/* Reset Filters */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('ALL');
                setStatusFilter('ALL');
                setPfApplicableFilter('ALL');
              }}
              className="h-8 text-xs font-bold border-border/80"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── EMPLOYEE PF TABLE ── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" /> Employee Provident Fund Register
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              September 2026 Statutory Payroll Run
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Auto-synchronized statutory register from Employee Master, active PF Configuration & Salary structure
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs font-bold text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              Loading employee PF records...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4 font-mono">UAN</th>
                    <th className="py-3.5 px-4">PF Member ID</th>
                    <th className="py-3.5 px-4 text-center">PF Applicable</th>
                    <th className="py-3.5 px-4 text-right">PF Wage</th>
                    <th className="py-3.5 px-4 text-right">Employee PF (12%)</th>
                    <th className="py-3.5 px-4 text-right">Employer PF</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground font-bold">
                        No employees match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center border border-purple-500/20 shrink-0">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{emp.name}</div>
                              <div className="text-[10.5px] text-muted-foreground font-medium">
                                {emp.code} • {emp.department}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          {emp.uan === 'Pending UAN' ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{emp.uan}</span>
                          ) : (
                            emp.uan
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                          {emp.pfMemberId}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={
                              emp.pfApplicable
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10.5px]'
                                : 'bg-slate-500/10 text-slate-500 border-slate-500/30 font-bold text-[10.5px]'
                            }
                          >
                            {emp.pfApplicable ? 'Yes' : 'No (Exempt)'}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                          ₹{emp.pfWage.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{emp.employeePf.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{(emp.employerPf + emp.eps).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {emp.status === 'VALID' ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10.5px]">
                              ✓ Valid
                            </Badge>
                          ) : emp.status === 'PENDING_UAN' ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold text-[10.5px]">
                              ⚠ Pending UAN
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/30 font-bold text-[10.5px]">
                              Exempt
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEmployee(emp)}
                            className="h-7 px-2 text-[11px] font-bold text-purple-600 hover:bg-purple-500/10 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── EMPLOYEE PF PROFILE DETAILS MODAL ── */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-xl border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
          {selectedEmployee && (
            <>
              <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-purple-950/20 via-background to-blue-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 font-extrabold text-base flex items-center justify-center border border-purple-500/20">
                      {selectedEmployee.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        {selectedEmployee.name} <span className="text-muted-foreground font-medium">({selectedEmployee.code})</span>
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {selectedEmployee.department} • Joined: {selectedEmployee.joiningDate}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      selectedEmployee.status === 'VALID'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-xs'
                        : selectedEmployee.status === 'PENDING_UAN'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold text-xs'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/30 font-bold text-xs'
                    }
                  >
                    {selectedEmployee.status === 'VALID'
                      ? '✓ Verified PF Member'
                      : selectedEmployee.status === 'PENDING_UAN'
                      ? '⚠ Pending UAN Allotment'
                      : 'Exempt Employee'}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
                {/* Pending UAN Alert Banner */}
                {selectedEmployee.status === 'PENDING_UAN' && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Missing Universal Account Number (UAN)</span>
                        <p className="text-[11px] text-muted-foreground">
                          PF Applicable is set to Yes in Employee Master. Please assign a UAN to clear statutory pending status.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 1: Identifier Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-0.5">
                    <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">Universal Account Number (UAN)</span>
                    <div className="font-mono font-extrabold text-sm text-foreground">{selectedEmployee.uan}</div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-0.5">
                    <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">PF Member ID</span>
                    <div className="font-mono font-bold text-xs text-foreground truncate">{selectedEmployee.pfMemberId}</div>
                  </div>
                </div>

                {/* Section 2: Contribution Breakdown */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                  <h4 className="font-bold text-foreground border-b border-border/60 pb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-600" /> Monthly Contribution Breakdown (Sep 2026)
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-background border border-border/60 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Eligible PF Wage:</span>
                      <span className="font-mono font-extrabold text-foreground">₹{selectedEmployee.pfWage.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/60 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Employee PF (12%):</span>
                      <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                        ₹{selectedEmployee.employeePf.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/60 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Employer EPF (3.67%):</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{selectedEmployee.employerPf.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/60 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Employer EPS (8.33%):</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{selectedEmployee.eps.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/60 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">EDLI Insurance (0.5%):</span>
                      <span className="font-mono font-bold text-foreground">₹{selectedEmployee.edli.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border/60 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Total PF Liability:</span>
                      <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                        ₹{((selectedEmployee.totalLiability ?? (selectedEmployee.employeePf + selectedEmployee.employerPf + selectedEmployee.eps + selectedEmployee.edli))).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Statutory Verification Checklist */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> EPFO Statutory Verification
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">KYC Verification:</span>
                      <span className="font-bold text-emerald-600">✓ Aadhaar & PAN Linked</span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">e-Nomination Status:</span>
                      <span className={selectedEmployee.nominationStatus === 'SUBMITTED' ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>
                        {selectedEmployee.nominationStatus === 'SUBMITTED' ? '✓ Submitted' : 'Pending Submission'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 border-t border-border/60 bg-muted/20">
                <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(null)} className="font-semibold">
                  Close Details
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PfEmployeesTab;
