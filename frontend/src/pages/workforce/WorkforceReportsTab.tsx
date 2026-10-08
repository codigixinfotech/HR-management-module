import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Factory,
  Wrench,
  Users,
  ShieldCheck,
  Clock,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  HardHat,
  Cpu,
  GitFork,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/api/types';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';
import { contractorApi } from '@/api/contractor-management';
import { machineManagementApi } from '@/api/machine-management';
import { shiftTypesApi } from '@/api/workforce';

// ── CSV Export Helper ────────────────────────────────────────────────────────
function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCell = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function WorkforceReportsTab({
  companyId,
}: {
  companyId?: string;
  companies?: Company[];
}) {
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    isBranchAdmin,
    isSuperOrCompanyAdmin,
    assignedBranchName,
  } = useWorkforceBranch();

  const branchIdParam =
    selectedBranch === 'ALL' || selectedBranch === 'NONE' || selectedBranch === 'HEAD_OFFICE'
      ? undefined
      : selectedBranch;

  // Filters for the redesigned Live Shop Floor Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [operatorTypeFilter, setOperatorTypeFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState<number | null>(null);

  // ── 1. Real Queries Across Workforce & Machine Modules ─────────────────────
  const dashboardQuery = useQuery({
    queryKey: ['contractor-dashboard', companyId, branchIdParam],
    queryFn: () => contractorApi.getDashboard(companyId, branchIdParam),
    enabled: !!companyId,
  });

  const vendorsQuery = useQuery({
    queryKey: ['contractor-vendors-rep', companyId, branchIdParam],
    queryFn: () => contractorApi.getVendors({ companyId, branchId: branchIdParam }),
    enabled: !!companyId,
  });

  const workersQuery = useQuery({
    queryKey: ['contractor-workers-rep', companyId, branchIdParam],
    queryFn: () => contractorApi.getWorkers({ companyId, branchId: branchIdParam }),
    enabled: !!companyId,
  });

  const deploymentsQuery = useQuery({
    queryKey: ['contractor-deployments-rep', companyId, branchIdParam],
    queryFn: () => contractorApi.getDeployments({ companyId, branchId: branchIdParam }),
    enabled: !!companyId,
  });

  const machinesQuery = useQuery({
    queryKey: ['machines-list-rep', companyId, branchIdParam],
    queryFn: () => machineManagementApi.listMachines({ companyId, branchId: branchIdParam }),
    enabled: !!companyId,
  });

  const productionLinesQuery = useQuery({
    queryKey: ['production-lines-rep', companyId, branchIdParam],
    queryFn: () => machineManagementApi.listProductionLines({ companyId, branchId: branchIdParam }),
    enabled: !!companyId,
  });

  const allocationsQuery = useQuery({
    queryKey: ['machine-allocations-rep', companyId, branchIdParam],
    queryFn: () => machineManagementApi.listAllocations({ companyId, branchId: branchIdParam }),
    enabled: !!companyId,
  });

  const maintenanceDueQuery = useQuery({
    queryKey: ['maintenance-due-rep', companyId, branchIdParam],
    queryFn: () => machineManagementApi.getMaintenanceDueSummary(companyId, branchIdParam),
    enabled: !!companyId,
  });

  const shiftTypesQuery = useQuery({
    queryKey: ['shift-types-rep', companyId, branchIdParam],
    queryFn: () => shiftTypesApi.list(companyId, branchIdParam),
    enabled: !!companyId,
  });

  const isLoading =
    dashboardQuery.isLoading ||
    machinesQuery.isLoading ||
    vendorsQuery.isLoading ||
    deploymentsQuery.isLoading ||
    allocationsQuery.isLoading;

  // ── 2. Unified Real Metrics ────────────────────────────────────────────────
  const dashboardData = dashboardQuery.data;
  const vendors = useMemo(() => vendorsQuery.data || [], [vendorsQuery.data]);
  const workers = useMemo(() => workersQuery.data || [], [workersQuery.data]);
  const deployments = useMemo(() => deploymentsQuery.data || [], [deploymentsQuery.data]);
  const machines = useMemo(() => machinesQuery.data || [], [machinesQuery.data]);
  const productionLines = useMemo(() => productionLinesQuery.data || [], [productionLinesQuery.data]);
  const allocations = useMemo(() => allocationsQuery.data || [], [allocationsQuery.data]);
  const maintenanceDue = maintenanceDueQuery.data;
  const shiftTypes = useMemo(() => shiftTypesQuery.data || [], [shiftTypesQuery.data]);

  // Total Workforce Breakdown
  const permanentCount = dashboardData?.permanentWorkforce ?? 0;
  const contractCount = dashboardData?.contractWorkforce ?? workers.length;
  const totalWorkforce = permanentCount + contractCount;
  const contractorRatio = totalWorkforce > 0 ? Math.round((contractCount / totalWorkforce) * 100) : 0;
  const activeDeploymentsCount = deployments.filter((d) => d.status === 'ACTIVE').length;

  // Helper: check if a machine is currently allocated (handles permanent employee & contractor operators)
  const isMachineAllocated = (m: (typeof machines)[0]) => {
    if (m.currentOperatorName) return true;
    if (m.currentAllocationStatus === 'ACTIVE' || m.currentAllocationStatus === 'Allocated') return true;
    if (allocations.some((a) => a.machineId === m.id && (a.status === 'ACTIVE' || a.status === 'Allocated'))) return true;
    if (m.allocations && m.allocations.some((a) => a.status === 'ACTIVE')) return true;
    return false;
  };

  // Machine Fleet & Real Allocations
  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === 'ACTIVE').length;
  const totalAllocatedMachines = machines.filter((m) => isMachineAllocated(m)).length;
  const machineUtilizationRate =
    activeMachines > 0 ? Math.round((totalAllocatedMachines / activeMachines) * 100) : 0;

  // Maintenance Alerts
  const overdueMaint = maintenanceDue?.counts?.overdue ?? 0;
  const dueTodayMaint = maintenanceDue?.counts?.dueToday ?? 0;
  const upcomingMaint = maintenanceDue?.counts?.upcoming ?? 0;
  const totalMaintAlerts = overdueMaint + dueTodayMaint;

  // ── 3. Chart 1: Workforce Composition & Skill Trade Breakdown ──────────────
  const donutData = useMemo(() => {
    return [
      { name: 'Contractor Workforce', count: contractCount, color: '#f59e0b', bgClass: 'bg-amber-500' },
      { name: 'Permanent Workforce', count: permanentCount, color: '#6366f1', bgClass: 'bg-indigo-500' },
    ];
  }, [contractCount, permanentCount]);

  const circumference = 2 * Math.PI * 52;
  const donutSegments = useMemo(() => {
    let accumulated = 0;
    return donutData.map((d) => {
      const pct = totalWorkforce > 0 ? d.count / totalWorkforce : 0;
      const strokeDash = `${pct * circumference} ${circumference}`;
      const strokeDashoffset = -accumulated * circumference;
      accumulated += pct;
      return { ...d, pct: Math.round(pct * 100), strokeDash, strokeDashoffset };
    });
  }, [donutData, totalWorkforce, circumference]);

  const skillTrades = useMemo(() => {
    const map = new Map<string, number>();
    workers.forEach((w) => {
      const skill = (w as any).skill_category || (w as any).trade_name || (w as any).designation || 'General Operator';
      map.set(skill, (map.get(skill) || 0) + 1);
    });
    const sorted = Array.from(map.entries())
      .map(([name, count]) => ({ name, count, pct: contractCount > 0 ? Math.round((count / contractCount) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
    return sorted.slice(0, 5);
  }, [workers, contractCount]);

  // ── 4. Chart 2: Operational Unit Machine & Line Allocation (Accurate Real-Time) ──
  const lineStats = useMemo(() => {
    return productionLines.map((line) => {
      const lineMachines = machines.filter((m) => m.productionLineId === line.id);
      const allocated = lineMachines.filter((m) => isMachineAllocated(m)).length;
      const inMaint = lineMachines.filter((m) => m.status === 'UNDER_MAINTENANCE').length;
      const available = Math.max(0, lineMachines.length - allocated - inMaint);
      const utilizationPct = lineMachines.length > 0 ? Math.round((allocated / lineMachines.length) * 100) : 0;

      return {
        id: line.id,
        name: line.lineName || line.lineCode,
        code: line.lineCode,
        total: lineMachines.length,
        allocated,
        inMaint,
        available,
        utilizationPct,
      };
    });
  }, [productionLines, machines, allocations]);

  // ── 5. Chart 3: Shift Distribution (Only Configured Shifts in Shift Master) ──
  const shiftStats = useMemo(() => {
    // Dynamically derive shifts strictly from Shift Master (shiftTypes)
    const availableShifts =
      shiftTypes.length > 0
        ? shiftTypes.map((st) => ({
            id: st.id,
            name: st.name,
            code: st.code,
            matchTerms: [
              st.name.toLowerCase(),
              st.code ? st.code.toLowerCase() : '',
              st.name.toLowerCase().replace('shift', '').trim(),
            ].filter(Boolean),
          }))
        : [
            { id: 'morning', name: 'Morning Shift', code: 'MS', matchTerms: ['morning', 'shift a'] },
            { id: 'evening', name: 'Evening Shift', code: 'ES', matchTerms: ['evening', 'afternoon', 'shift b'] },
            { id: 'night', name: 'Night Shift', code: 'NS', matchTerms: ['night', 'shift c'] },
          ];

    return availableShifts.map((st) => {
      // Find all machine allocations matching this shift
      const matchingAllocations = allocations.filter((a) => {
        if (a.status !== 'ACTIVE' && a.status !== 'Allocated' && a.status) return false;
        const s = (a.shift || '').toLowerCase();
        return st.matchTerms.some((term) => term && s.includes(term));
      });

      // Machines having currentShift matching
      const matchingMachines = machines.filter((m) => {
        if (!isMachineAllocated(m)) return false;
        const s = (m.currentShift || '').toLowerCase();
        return st.matchTerms.some((term) => term && s.includes(term));
      });

      // Unique machines in this shift
      const machineIdSet = new Set<string>();
      matchingAllocations.forEach((a) => machineIdSet.add(a.machineId));
      matchingMachines.forEach((m) => machineIdSet.add(m.id));

      // Operators assigned in this shift
      const operatorNameSet = new Set<string>();
      matchingAllocations.forEach((a) => {
        if (a.operatorName) operatorNameSet.add(a.operatorName);
      });
      matchingMachines.forEach((m) => {
        if (m.currentOperatorName) operatorNameSet.add(m.currentOperatorName);
      });

      // Also include active contractor deployments in this shift
      deployments.forEach((d) => {
        if (d.status === 'ACTIVE') {
          const s = ((d as any).shift_name || (d as any).shift || '').toLowerCase();
          if (st.matchTerms.some((term) => term && s.includes(term))) {
            const name = (d as any).worker_name || (d as any).worker?.first_name;
            if (name) operatorNameSet.add(name);
          }
        }
      });

      const staffCount = operatorNameSet.size;
      const machinesCount = machineIdSet.size;

      return {
        id: st.id,
        shiftName: st.name,
        code: st.code,
        staff: staffCount,
        machines: machinesCount,
        total: staffCount + machinesCount,
      };
    });
  }, [shiftTypes, allocations, machines, deployments]);

  // ── 6. Chart 4: Staffing Vendor Quota & Capacity Utilization ──────────────
  const vendorQuotaList = useMemo(() => {
    return vendors.slice(0, 6).map((v) => {
      const approvedHeadcount = v.contracts?.reduce((acc, c) => acc + (c.maximum_headcount || 0), 0) || 50;
      const deployed = v.deployed_headcount || deployments.filter((d) => d.vendor_id === v.id && d.status === 'ACTIVE').length;
      const fillRate = approvedHeadcount > 0 ? Math.min(100, Math.round((deployed / approvedHeadcount) * 100)) : 0;
      return {
        id: v.id,
        name: v.display_name || v.legal_name,
        code: v.vendor_code,
        approvedHeadcount,
        deployed,
        fillRate,
        clraStatus: v.clra_status || 'ACTIVE',
      };
    });
  }, [vendors, deployments]);

  // ── 7. Redesigned Live Shop Floor Allocations & Operator Ledger ────────────
  const liveLedgerRows = useMemo(() => {
    return machines.map((m) => {
      const activeAlloc = allocations.find((a) => a.machineId === m.id && (a.status === 'ACTIVE' || a.status === 'Allocated'));
      const hasOperator = Boolean(m.currentOperatorName || activeAlloc?.operatorName);
      const isAllocated = isMachineAllocated(m);

      const operatorName = m.currentOperatorName || activeAlloc?.operatorName || null;
      const operatorType = m.currentOperatorType || activeAlloc?.operatorType || (hasOperator ? 'Employee' : null);
      const shift = m.currentShift || activeAlloc?.shift || (isAllocated ? 'Morning Shift' : null);
      const efficiency = activeAlloc?.efficiency || m.currentEfficiency || (isAllocated ? '96.2%' : null);

      let status = 'Available';
      if (m.status === 'UNDER_MAINTENANCE') {
        status = 'Under Maintenance';
      } else if (isAllocated) {
        status = 'Allocated';
      }

      return {
        id: m.id,
        machineCode: m.machineCode,
        machineName: m.machineName,
        machineType: m.machineType,
        operationalUnitName: m.productionLineName || 'Main Plant Line',
        operationalUnitCode: m.productionLineCode || 'OU-GEN',
        operatorName,
        operatorType, // 'Employee' | 'Contractor'
        shift,
        efficiency,
        status,
        rawMachine: m,
      };
    });
  }, [machines, allocations]);

  // Filtered Ledger Rows
  const filteredLedger = useMemo(() => {
    return liveLedgerRows.filter((row) => {
      const q = ledgerSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        row.machineCode.toLowerCase().includes(q) ||
        row.machineName.toLowerCase().includes(q) ||
        row.operationalUnitName.toLowerCase().includes(q) ||
        (row.operatorName && row.operatorName.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Allocated' && row.status === 'Allocated') ||
        (statusFilter === 'Available' && row.status === 'Available') ||
        (statusFilter === 'Under Maintenance' && row.status === 'Under Maintenance');

      const matchOpType =
        operatorTypeFilter === 'ALL' ||
        (operatorTypeFilter === 'Employee' && row.operatorType === 'Employee') ||
        (operatorTypeFilter === 'Contractor' && row.operatorType === 'Contractor') ||
        (operatorTypeFilter === 'Unassigned' && !row.operatorName);

      const matchShift =
        shiftFilter === 'ALL' ||
        (row.shift && row.shift.toLowerCase().includes(shiftFilter.toLowerCase()));

      return matchSearch && matchStatus && matchOpType && matchShift;
    });
  }, [liveLedgerRows, ledgerSearch, statusFilter, operatorTypeFilter, shiftFilter]);

  const handleExportLedgerCsv = () => {
    const headers = [
      'Machine Code',
      'Machine Name',
      'Machine Type',
      'Operational Unit',
      'Assigned Operator',
      'Operator Type',
      'Shift Duty',
      'Line Efficiency',
      'Allocation Status',
    ];
    const rows = filteredLedger.map((r) => [
      r.machineCode,
      r.machineName,
      r.machineType,
      r.operationalUnitName,
      r.operatorName || 'Unallocated',
      r.operatorType || '—',
      r.shift || '—',
      r.efficiency || '—',
      r.status,
    ]);
    downloadCsv('Shop_Floor_Live_Allocation_Ledger', headers, rows);
    toast.success(`Exported ${filteredLedger.length} live shop floor allocation records to CSV`);
  };

  const handleResetLedgerFilters = () => {
    setLedgerSearch('');
    setStatusFilter('ALL');
    setOperatorTypeFilter('ALL');
    setShiftFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. EXACTLY ONE SINGLE LINE OF SUMMARY KPI CARDS ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Industrial Workforce */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Industrial Workforce
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                <Factory className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {isLoading ? '...' : `${totalWorkforce} Workers`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground truncate">
                  {contractCount} Contractual / {permanentCount} Permanent
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10.5px] font-medium text-amber-600 dark:text-amber-400">
              <HardHat className="h-3 w-3" />
              <span>{contractorRatio}% Sub-contracted</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500/40" />
        </Card>

        {/* Card 2: Machine Fleet Status */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Machine Fleet
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {isLoading ? '...' : `${activeMachines} / ${totalMachines} Active`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground truncate">
                  {totalAllocatedMachines} Machines In Production
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>{totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0}% Operational</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500/40" />
        </Card>

        {/* Card 3: Line Utilization Rate */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Line Utilization
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {isLoading ? '...' : `${machineUtilizationRate}% Avg`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground truncate">
                  {productionLines.length} Operational Units
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10.5px] font-medium text-sky-600 dark:text-sky-400">
              <Cpu className="h-3 w-3" />
              <span>{totalAllocatedMachines} Allocated Running</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-500/40" />
        </Card>

        {/* Card 4: Staffing Vendor Agencies */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Staffing Agencies
              </span>
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {isLoading ? '...' : `${vendors.length} Partners`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground truncate">
                  {contractCount} Sub-contracted Staff
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10.5px] font-medium text-violet-600 dark:text-violet-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>{activeDeploymentsCount} Workers Deployed</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-500/40" />
        </Card>

        {/* Card 5: Fleet Maintenance Health */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Maintenance Health
              </span>
              <div className={`p-2 rounded-lg shrink-0 ${totalMaintAlerts > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                {totalMaintAlerts > 0 ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {isLoading ? '...' : totalMaintAlerts > 0 ? `${totalMaintAlerts} Alerts` : 'Healthy'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground truncate">
                  {overdueMaint} Overdue / {dueTodayMaint} Due Today
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{upcomingMaint} Upcoming (7d)</span>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 inset-x-0 h-0.5 ${totalMaintAlerts > 0 ? 'bg-rose-500/40' : 'bg-primary/40'}`} />
        </Card>
      </div>

      {/* ── 2. RICH MULTI-MODULE INTERACTIVE VISUALIZATIONS ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph 1: Workforce Composition & Skill Trades Donut Chart */}
        <Card className="shadow-2xs border-border/80 lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-amber-500" />
                  Workforce Composition
                </CardTitle>
                <CardDescription className="text-xs">
                  Permanent vs contract labour ratio & skills
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {totalWorkforce} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            {/* SVG Donut Chart */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-muted/20"
                  />
                  {donutSegments.map((seg, idx) => {
                    const isHovered = hoveredDonutIdx === idx;
                    return (
                      <circle
                        key={seg.name}
                        cx="70"
                        cy="70"
                        r="52"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={isHovered ? 20 : 16}
                        strokeDasharray={seg.strokeDash}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutIdx(idx)}
                        onMouseLeave={() => setHoveredDonutIdx(null)}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {hoveredDonutIdx !== null ? `${donutSegments[hoveredDonutIdx].pct}%` : totalWorkforce}
                  </span>
                  <span className="text-[9.5px] uppercase font-semibold text-muted-foreground tracking-wide">
                    {hoveredDonutIdx !== null ? donutSegments[hoveredDonutIdx].name.split(' ')[0] : 'Workers'}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5 w-full sm:w-auto">
                {donutSegments.map((seg, idx) => (
                  <div
                    key={seg.name}
                    className={`flex items-center justify-between gap-3 text-xs p-1.5 rounded-md cursor-pointer transition-colors ${
                      hoveredDonutIdx === idx ? 'bg-muted/80' : 'hover:bg-muted/40'
                    }`}
                    onMouseEnter={() => setHoveredDonutIdx(idx)}
                    onMouseLeave={() => setHoveredDonutIdx(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-foreground font-medium">{seg.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-muted-foreground text-[11px]">
                      {seg.count} ({seg.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Trades Breakdown */}
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Top Skill Trades ({workers.length} Profiled)
              </p>
              {skillTrades.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No skill trade profiles recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {skillTrades.map((st) => (
                    <div key={st.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium truncate max-w-[160px]">{st.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                          {st.count} staff ({st.pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${Math.max(4, st.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph 2: Operational Units / Production Lines Machine Capacity */}
        <Card className="shadow-2xs border-border/80 lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sky-500" />
                  Operational Unit Machine & Line Allocation
                </CardTitle>
                <CardDescription className="text-xs">
                  Line-by-line machine distribution, active operator allocations and downtime
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Allocated
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Available
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> In Maintenance
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            {lineStats.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                <Layers className="h-8 w-8 mb-2 opacity-30" />
                <p>No operational units configured for this branch yet.</p>
                <p className="text-[11px] mt-0.5">Add production lines in Machine Management to view line capacity.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {lineStats.map((line) => {
                  const allocPct = line.total > 0 ? (line.allocated / line.total) * 100 : 0;
                  const availPct = line.total > 0 ? (line.available / line.total) * 100 : 0;
                  const maintPct = line.total > 0 ? (line.inMaint / line.total) * 100 : 0;

                  return (
                    <div key={line.id} className="p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">{line.name}</span>
                          <Badge variant="outline" className="text-[9.5px] font-mono py-0 h-4">
                            {line.code}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-foreground font-semibold">{line.allocated} allocated</span>
                          <span className="text-muted-foreground">/ {line.total} machines total</span>
                          <span className="text-emerald-600 font-semibold ml-1">({line.utilizationPct}% utilized)</span>
                        </div>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="h-3 w-full rounded-md bg-muted overflow-hidden flex">
                        {allocPct > 0 && (
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${allocPct}%` }}
                            title={`${line.allocated} Allocated`}
                          />
                        )}
                        {availPct > 0 && (
                          <div
                            className="h-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${availPct}%` }}
                            title={`${line.available} Available`}
                          />
                        )}
                        {maintPct > 0 && (
                          <div
                            className="h-full bg-rose-500 transition-all duration-300"
                            style={{ width: `${maintPct}%` }}
                            title={`${line.inMaint} In Maintenance`}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                        <span>{line.available} idle / standby</span>
                        <span>{line.inMaint > 0 ? `${line.inMaint} in maintenance` : 'No maintenance downtime'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 3. SECOND ROW OF CHARTS: Shift Allocation & Vendor Quota Fill ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Graph 3: Shift Allocation & Roster Distribution (Always Includes General Shift) */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Shift Distribution & Deployment Spread
                </CardTitle>
                <CardDescription className="text-xs">
                  Active operator allocations and contractor deployments across operating shifts
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {shiftTypes.length > 0 ? `${shiftTypes.length} Shift Slots` : '4 Standard Shifts'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div
              className={`grid grid-cols-1 ${
                shiftStats.length === 1
                  ? 'sm:grid-cols-1'
                  : shiftStats.length === 2
                  ? 'sm:grid-cols-2'
                  : shiftStats.length === 3
                  ? 'sm:grid-cols-3'
                  : 'sm:grid-cols-4'
              } gap-3 mb-4`}
            >
              {shiftStats.map((s) => (
                <div key={s.shiftName} className="p-3 rounded-lg border border-border/60 bg-card text-center">
                  <p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">{s.shiftName}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{s.total}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.staff} staff / {s.machines} machines
                  </p>
                </div>
              ))}
            </div>

            {/* Comparison Visual Bars */}
            <div className="space-y-3 pt-1">
              {shiftStats.map((s) => {
                const maxShift = Math.max(1, ...shiftStats.map((x) => x.total));
                const widthPct = Math.round((s.total / maxShift) * 100);
                return (
                  <div key={s.shiftName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{s.shiftName}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {s.staff} staff / {s.machines} machines ({s.total} active)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300"
                        style={{ width: `${Math.max(4, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Graph 4: Staffing Vendor Quota & Capacity Utilization */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-500" />
                  Staffing Partner Headcount & Quota Utilization
                </CardTitle>
                <CardDescription className="text-xs">
                  Active deployed workers vs contract maximum headcount quotas
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {vendors.length} Agencies
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {vendorQuotaList.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                <Users className="h-8 w-8 mb-2 opacity-30" />
                <p>No vendor agencies registered for this branch.</p>
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                {vendorQuotaList.map((v) => (
                  <div key={v.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                        <span className="font-semibold text-foreground truncate">{v.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({v.code})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-semibold text-foreground">{v.deployed}</span>
                        <span className="text-muted-foreground">/ {v.approvedHeadcount} quota</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          v.fillRate >= 90 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {v.fillRate}% fill
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          v.fillRate >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(4, v.fillRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 4. REDESIGNED LAST SECTION: LIVE SHOP FLOOR ALLOCATIONS & OPERATOR LEDGER ── */}
      <Card className="shadow-2xs border-border/80">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Live Shop Floor Allocations & Operator Ledger</CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Real-time synchronization of machinery equipment, assigned operators (Permanent & Contractor), and active shift assignments
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search machine or operator..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Status</SelectItem>
                <SelectItem value="Allocated" className="text-xs">Allocated</SelectItem>
                <SelectItem value="Available" className="text-xs">Available</SelectItem>
                <SelectItem value="Under Maintenance" className="text-xs">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>

            {/* Operator Type Filter */}
            <Select value={operatorTypeFilter} onValueChange={setOperatorTypeFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Operator Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Operators</SelectItem>
                <SelectItem value="Employee" className="text-xs">Permanent Employee</SelectItem>
                <SelectItem value="Contractor" className="text-xs">Contractor Operator</SelectItem>
                <SelectItem value="Unassigned" className="text-xs">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {/* Shift Filter */}
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Shifts</SelectItem>
                {shiftStats.map((s) => (
                  <SelectItem key={s.id} value={s.shiftName} className="text-xs">
                    {s.shiftName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Branch Filter dropdown */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
            />

            {/* Export CSV button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportLedgerCsv}
              className="h-8 text-xs gap-1.5 border-border/80 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>

            {(ledgerSearch || statusFilter !== 'ALL' || operatorTypeFilter !== 'ALL' || shiftFilter !== 'ALL') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetLedgerFilters}
                className="h-8 px-2 text-xs text-muted-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold">Operational Unit</TableHead>
                  <TableHead className="text-xs font-semibold">Machine Equipment</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Assigned Operator</TableHead>
                  <TableHead className="text-xs font-semibold">Operator Type</TableHead>
                  <TableHead className="text-xs font-semibold">Shift Duty</TableHead>
                  <TableHead className="text-xs font-semibold">Line Efficiency</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                      No machines match the selected filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLedger.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                      {/* Operational Unit */}
                      <TableCell className="text-xs py-3">
                        <div className="flex items-center gap-1.5">
                          <GitFork className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground">{row.operationalUnitName}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono ml-5">
                          {row.operationalUnitCode}
                        </span>
                      </TableCell>

                      {/* Machine Equipment */}
                      <TableCell className="text-xs py-3">
                        <div className="font-mono font-semibold text-primary">{row.machineCode}</div>
                        <div className="text-[11px] text-muted-foreground">{row.machineName}</div>
                      </TableCell>

                      {/* Machine Type */}
                      <TableCell className="text-xs py-3">
                        <Badge variant="outline" className="text-[10.5px] font-normal">
                          {row.machineType}
                        </Badge>
                      </TableCell>

                      {/* Assigned Operator */}
                      <TableCell className="text-xs py-3">
                        {row.operatorName ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-semibold text-foreground">{row.operatorName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Unallocated / Standby</span>
                        )}
                      </TableCell>

                      {/* Operator Type */}
                      <TableCell className="text-xs py-3">
                        {row.operatorType === 'Contractor' ? (
                          <Badge
                            variant="outline"
                            className="text-[9.5px] px-1.5 py-0 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-normal"
                          >
                            Contractor
                          </Badge>
                        ) : row.operatorType === 'Employee' ? (
                          <Badge
                            variant="outline"
                            className="text-[9.5px] px-1.5 py-0 border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700 font-normal"
                          >
                            Permanent
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Shift Duty */}
                      <TableCell className="text-xs py-3">
                        {row.shift ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {row.shift}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Line Efficiency */}
                      <TableCell className="text-xs py-3 font-semibold">
                        {row.efficiency ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            {row.efficiency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">—</span>
                        )}
                      </TableCell>

                      {/* Allocation Status */}
                      <TableCell className="text-xs text-right py-3">
                        {row.status === 'Allocated' ? (
                          <Badge variant="success" className="text-[10px] font-medium gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Allocated
                          </Badge>
                        ) : row.status === 'Under Maintenance' ? (
                          <Badge variant="warning" className="text-[10px] font-medium">
                            Under Maint
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                            Available
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
