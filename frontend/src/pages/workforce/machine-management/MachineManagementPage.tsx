import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkforcePageLayout } from '../WorkforcePageLayout';
import { MachineManagementKpiCards } from './MachineManagementKpiCards';
import { MachinesTab } from './MachinesTab';
import { ProductionLinesTab } from './ProductionLinesTab';
import { OperatorsTab } from './OperatorsTab';
import { AllocationsTab } from './AllocationsTab';
import { MaintenanceTab } from './MaintenanceTab';
import { AddEditMachineModal } from './AddEditMachineModal';
import { AddEditLineModal } from './AddEditLineModal';
import { AssignOperatorModal } from './AssignOperatorModal';
import { StartMaintenanceModal } from './StartMaintenanceModal';
import { CompleteMaintenanceModal } from './CompleteMaintenanceModal';
import { MachineDetailsDrawer } from './MachineDetailsDrawer';
import { OperatorDetailsDrawer } from './OperatorDetailsDrawer';
import { AddOperatorModal } from './AddOperatorModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Cpu, GitFork, Users, CalendarCheck, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import {
  machineManagementApi,
  type Machine,
  type ProductionLine,
  type MachineOperator,
  type MachineAllocation,
  type MachineMaintenance,
  type MachineKPIs,
} from '@/api/machine-management';
import { employeesApi } from '@/api/employees';
import { departmentsApi, branchesApi } from '@/api/organization';
import type { Company, Branch, Department, Employee } from '@/api/types';

export default function MachineManagementPage() {
  return (
    <WorkforcePageLayout
      title="Machine Management"
      description="Manage machines, production lines, operators and maintenance"
      badge="Shop Floor Machinery"
      badgeVariant="warning"
      hideMetrics={true}
    >
      {({ companyId, companies, branchId }) => (
        <MachineManagementContent
          companyId={companyId}
          companies={companies}
          branchId={branchId}
        />
      )}
    </WorkforcePageLayout>
  );
}

function MachineManagementContent({
  companyId,
  companies,
  branchId,
}: {
  companyId?: string;
  companies: Company[];
  branchId: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'machines';

  const setTab = (tab: string) => {
    setSearchParams((prev) => {
      prev.set('tab', tab);
      return prev;
    });
  };

  // Live Database States
  const [kpis, setKpis] = useState<MachineKPIs | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [operators, setOperators] = useState<MachineOperator[]>([]);
  const [allocations, setAllocations] = useState<MachineAllocation[]>([]);
  const [maintenances, setMaintenances] = useState<MachineMaintenance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & Drawers States
  const [openAddMachine, setOpenAddMachine] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const [openAddLine, setOpenAddLine] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);

  const [openAssignOperator, setOpenAssignOperator] = useState(false);
  const [assigningMachine, setAssigningMachine] = useState<Machine | null>(null);

  const [openStartMaintenance, setOpenStartMaintenance] = useState(false);
  const [maintenancingMachine, setMaintenancingMachine] = useState<Machine | null>(null);

  const [openCompleteMaintenance, setOpenCompleteMaintenance] = useState(false);
  const [completingMaintenance, setCompletingMaintenance] = useState<MachineMaintenance | null>(null);

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [openAddOperator, setOpenAddOperator] = useState(false);

  // Load KPIs
  const loadKpis = useCallback(async () => {
    try {
      setLoadingKpis(true);
      const res = await machineManagementApi.getKpis(companyId, branchId);
      setKpis(res);
    } catch (err) {
      console.error('Failed to load machine KPIs', err);
    } finally {
      setLoadingKpis(false);
    }
  }, [companyId, branchId]);

  // Load all Master & Tab Data
  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [mRes, plRes, opRes, allocRes, maintRes, deptRes, branchRes, empRes] =
        await Promise.all([
          machineManagementApi.listMachines({ companyId, branchId }),
          machineManagementApi.listProductionLines({ companyId, branchId }),
          machineManagementApi.listOperators({ companyId, branchId }),
          machineManagementApi.listAllocations({ companyId, branchId }),
          machineManagementApi.listMaintenances({ companyId, branchId }),
          departmentsApi.list(companyId, branchId).catch(() => []),
          branchesApi.list(companyId).catch(() => []),
          employeesApi.list({ companyId, branchId, pageSize: 100 }).catch(() => ({ items: [] })),
        ]);

      setMachines(mRes);
      setProductionLines(plRes);
      setOperators(opRes);
      setAllocations(allocRes);
      setMaintenances(mRes && maintRes ? maintRes : []);
      setDepartments(deptRes || []);
      setBranches(branchRes || []);
      setEmployees((empRes as any)?.items || []);
    } catch (err) {
      console.error('Failed to load machine management data', err);
      toast.error('Failed to load machinery data from database');
    } finally {
      setLoadingData(false);
    }
  }, [companyId, branchId]);

  useEffect(() => {
    loadKpis();
    loadData();
  }, [loadKpis, loadData]);

  const handleRefresh = () => {
    loadKpis();
    loadData();
  };

  // Toggle machine active/inactive
  const handleToggleMachineStatus = async (m: Machine) => {
    const nextStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await machineManagementApi.updateMachine(m.id, { status: nextStatus });
      toast.success(`Machine ${m.machineCode} status set to ${nextStatus}`);
      handleRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update machine status');
    }
  };

  // Complete allocation
  const handleCompleteAllocation = async (a: MachineAllocation) => {
    try {
      await machineManagementApi.completeAllocation(a.id);
      toast.success(`Allocation for machine ${a.machineCode || 'unit'} marked as completed`);
      handleRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete allocation');
    }
  };

  // Cancel allocation
  const handleCancelAllocation = async (a: MachineAllocation) => {
    try {
      await machineManagementApi.cancelAllocation(a.id);
      toast.info(`Allocation for machine ${a.machineCode || 'unit'} cancelled`);
      handleRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel allocation');
    }
  };

  // Delete production line
  const handleDeleteLine = async (line: ProductionLine) => {
    if (!confirm(`Are you sure you want to delete production line ${line.lineCode}?`)) return;
    try {
      await machineManagementApi.deleteProductionLine(line.id);
      toast.success(`Production Line ${line.lineCode} deleted successfully`);
      handleRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete production line');
    }
  };

  return (
    <div className="space-y-6">
      {/* Real Database KPI Dashboard (2 Rows of 4 Cards) */}
      <MachineManagementKpiCards kpis={kpis} loading={loadingKpis} />

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <Tabs value={currentTab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-5 w-full sm:w-auto h-11 bg-muted/60 p-1">
            <TabsTrigger value="machines" className="text-xs gap-1.5 px-3 py-1.5">
              <Cpu className="h-3.5 w-3.5 text-blue-600" />
              <span>Machines</span>
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                {machines.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="lines" className="text-xs gap-1.5 px-3 py-1.5">
              <GitFork className="h-3.5 w-3.5 text-purple-600" />
              <span>Production Lines</span>
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                {productionLines.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="operators" className="text-xs gap-1.5 px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-teal-600" />
              <span>Operators</span>
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                {operators.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="allocations" className="text-xs gap-1.5 px-3 py-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Allocations</span>
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                {allocations.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="maintenance" className="text-xs gap-1.5 px-3 py-1.5">
              <Wrench className="h-3.5 w-3.5 text-amber-600" />
              <span>Maintenance</span>
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                {maintenances.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Global Quick Action button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {currentTab === 'machines' && (
            <Button
              size="sm"
              className="gap-1.5 shadow-2xs font-medium text-xs"
              onClick={() => {
                setEditingMachine(null);
                setOpenAddMachine(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Machine
            </Button>
          )}

          {currentTab === 'lines' && (
            <Button
              size="sm"
              className="gap-1.5 shadow-2xs font-medium text-xs"
              onClick={() => {
                setEditingLine(null);
                setOpenAddLine(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Production Line
            </Button>
          )}

          {currentTab === 'operators' && (
            <Button
              size="sm"
              className="gap-1.5 shadow-2xs font-medium text-xs"
              onClick={() => setOpenAddOperator(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Operator
            </Button>
          )}

          {currentTab === 'allocations' && (
            <Button
              size="sm"
              className="gap-1.5 shadow-2xs font-medium text-xs"
              onClick={() => {
                setAssigningMachine(null);
                setOpenAssignOperator(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Assign Line Operator
            </Button>
          )}

          {currentTab === 'maintenance' && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 shadow-2xs font-medium text-xs"
              onClick={() => {
                setMaintenancingMachine(null);
                setOpenStartMaintenance(true);
              }}
            >
              <Wrench className="h-3.5 w-3.5" />
              Start Maintenance
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Machines */}
      {currentTab === 'machines' && (
        <MachinesTab
          machines={machines}
          productionLines={productionLines}
          branches={branches}
          departments={departments}
          loading={loadingData}
          onViewDetails={(m) => setSelectedMachineId(m.id)}
          onEditMachine={(m) => {
            setEditingMachine(m);
            setOpenAddMachine(true);
          }}
          onAssignOperator={(m) => {
            setAssigningMachine(m);
            setOpenAssignOperator(true);
          }}
          onStartMaintenance={(m) => {
            setMaintenancingMachine(m);
            setOpenStartMaintenance(true);
          }}
          onToggleStatus={handleToggleMachineStatus}
          onOpenAddMachine={() => {
            setEditingMachine(null);
            setOpenAddMachine(true);
          }}
        />
      )}

      {/* Tab 2: Production Lines */}
      {currentTab === 'lines' && (
        <ProductionLinesTab
          productionLines={productionLines}
          branches={branches}
          departments={departments}
          loading={loadingData}
          onAddLine={() => {
            setEditingLine(null);
            setOpenAddLine(true);
          }}
          onEditLine={(line) => {
            setEditingLine(line);
            setOpenAddLine(true);
          }}
          onDeleteLine={handleDeleteLine}
        />
      )}

      {/* Tab 3: Operators */}
      {currentTab === 'operators' && (
        <OperatorsTab
          operators={operators}
          branches={branches}
          loading={loadingData}
          onViewOperator={(op) => setSelectedOperatorId(op.id)}
          onAddOperator={() => setOpenAddOperator(true)}
          onAssignToMachine={(op) => {
            setAssigningMachine(null);
            setOpenAssignOperator(true);
          }}
        />
      )}

      {/* Tab 4: Allocations */}
      {currentTab === 'allocations' && (
        <AllocationsTab
          allocations={allocations}
          productionLines={productionLines}
          machines={machines}
          operators={operators}
          branches={branches}
          loading={loadingData}
          onAssignOperator={() => {
            setAssigningMachine(null);
            setOpenAssignOperator(true);
          }}
          onCompleteAllocation={handleCompleteAllocation}
          onCancelAllocation={handleCancelAllocation}
          onStartMaintenance={(mId) => {
            const m = machines.find((item) => item.id === mId) || null;
            setMaintenancingMachine(m);
            setOpenStartMaintenance(true);
          }}
          onViewMachine={(mId) => setSelectedMachineId(mId)}
        />
      )}

      {/* Tab 5: Maintenance */}
      {currentTab === 'maintenance' && (
        <MaintenanceTab
          maintenances={maintenances}
          machines={machines}
          branches={branches}
          loading={loadingData}
          onStartMaintenance={() => {
            setMaintenancingMachine(null);
            setOpenStartMaintenance(true);
          }}
          onCompleteMaintenance={(maint) => {
            setCompletingMaintenance(maint);
            setOpenCompleteMaintenance(true);
          }}
          onViewMachine={(mId) => setSelectedMachineId(mId)}
        />
      )}

      {/* MODALS & DRAWERS */}
      <AddEditMachineModal
        open={openAddMachine}
        onOpenChange={setOpenAddMachine}
        machine={editingMachine}
        companies={companies}
        branches={branches}
        departments={departments}
        productionLines={productionLines}
        activeCompanyId={companyId}
        activeBranchId={branchId}
        onSuccess={handleRefresh}
      />

      <AddEditLineModal
        open={openAddLine}
        onOpenChange={setOpenAddLine}
        line={editingLine}
        companies={companies}
        branches={branches}
        departments={departments}
        employees={employees}
        activeCompanyId={companyId}
        activeBranchId={branchId}
        onSuccess={handleRefresh}
      />

      <AssignOperatorModal
        open={openAssignOperator}
        onOpenChange={setOpenAssignOperator}
        preselectedMachine={assigningMachine}
        machines={machines}
        productionLines={productionLines}
        operators={operators}
        employees={employees}
        companies={companies}
        branches={branches}
        departments={departments}
        activeCompanyId={companyId}
        activeBranchId={branchId}
        onSuccess={handleRefresh}
      />

      <StartMaintenanceModal
        open={openStartMaintenance}
        onOpenChange={setOpenStartMaintenance}
        preselectedMachine={maintenancingMachine}
        machines={machines}
        productionLines={productionLines}
        onSuccess={handleRefresh}
      />

      <CompleteMaintenanceModal
        open={openCompleteMaintenance}
        onOpenChange={setOpenCompleteMaintenance}
        maintenance={completingMaintenance}
        onSuccess={handleRefresh}
      />

      <MachineDetailsDrawer
        machineId={selectedMachineId}
        open={Boolean(selectedMachineId)}
        onClose={() => setSelectedMachineId(null)}
        onAssignOperator={(m) => {
          setSelectedMachineId(null);
          setAssigningMachine(m);
          setOpenAssignOperator(true);
        }}
        onStartMaintenance={(m) => {
          setSelectedMachineId(null);
          setMaintenancingMachine(m);
          setOpenStartMaintenance(true);
        }}
      />

      <OperatorDetailsDrawer
        operatorId={selectedOperatorId}
        open={Boolean(selectedOperatorId)}
        onClose={() => setSelectedOperatorId(null)}
        onAssignToMachine={(op) => {
          setSelectedOperatorId(null);
          setAssigningMachine(null);
          setOpenAssignOperator(true);
        }}
      />

      <AddOperatorModal
        open={openAddOperator}
        onOpenChange={setOpenAddOperator}
        employees={employees}
        companies={companies}
        branches={branches}
        activeCompanyId={companyId}
        activeBranchId={branchId}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
