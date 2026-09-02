import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  Users, FileText, Download, ClipboardCheck,
  Send, BadgeCheck, Loader2, ArrowRight, Hash, TrendingUp,
  Info, History, Eye, ChevronDown, ChevronUp, Building2,
  Plus, Calendar, CheckSquare, Search, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────── */
interface LabourTask {
  id: string;
  name: string;
  category: string;
  act: string;
  frequency: string;
  period: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  applicability: string;
  employeesCount: number;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  evidenceFile?: string;
}

interface WorkflowStep {
  id: number;
  label: string;
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
}

interface LabourData {
  period: string;
  financialYear: string;
  state: string;
  establishmentType: string;
  registrationNumber: string;
  totalEmployees: number;
  summary: {
    totalEmployees: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    complianceScore: number;
  };
  tasks: LabourTask[];
  workflowSteps: WorkflowStep[];
}

/* ─── Helpers ─────────────────────────────────────────────── */
const FY_LIST = ['2026-2027', '2025-2026'];

function periodLabel(p: string): string {
  const [y, m] = p.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function fyMonths(fy: string): string[] {
  const [startY] = fy.split('-').map(Number);
  const months: string[] = [];
  for (let m = 4; m <= 12; m++) months.push(`${startY}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 3; m++) months.push(`${startY + 1}-${String(m).padStart(2, '0')}`);
  return months;
}

function statusBadge(s: LabourTask['status']) {
  switch (s) {
    case 'COMPLETED':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">✓ Completed</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">In Progress</Badge>;
    case 'OVERDUE':
      return <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-semibold">⚠ Overdue</Badge>;
    default:
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">Pending</Badge>;
  }
}

function priorityBadge(p: LabourTask['priority']) {
  switch (p) {
    case 'HIGH':
      return <span className="text-[10.5px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">High</span>;
    case 'MEDIUM':
      return <span className="text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Medium</span>;
    default:
      return <span className="text-[10.5px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Low</span>;
  }
}

/* ─── Component ──────────────────────────────────────────── */
export interface LabourComplianceProps {
  companyId?: string;
  companies?: any[];
}

export function LabourComplianceModule({ companyId, companies = [] }: LabourComplianceProps) {
  const [activeFy, setActiveFy] = useState('2026-2027');
  const [period, setPeriod] = useState('2026-09');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [historyFy, setHistoryFy] = useState('2026-2027');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'HIGH'>('ALL');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<LabourTask | null>(null);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [taskNotes, setTaskNotes] = useState('');

  // Local state for newly created custom tasks & overrides
  const [customTasks, setCustomTasks] = useState<LabourTask[]>([]);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, Partial<LabourTask>>>({});

  // New task form
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    category: 'Wages',
    act: 'Code on Wages, 2019',
    frequency: 'Monthly',
    priority: 'HIGH' as 'HIGH' | 'MEDIUM' | 'LOW',
    dueDate: '2026-09-30',
    applicability: 'All Establishments in Maharashtra',
    notes: '',
  });

  // Fetch Labour dashboard data
  const { data, isLoading, isRefetching, refetch } = useQuery<LabourData>({
    queryKey: ['labour-dashboard', selectedCompany, period, activeFy],
    queryFn: async () => {
      const r = await apiClient.get('/compliance/labour/dashboard', {
        params: { companyId: selectedCompany || 'all', period, fy: activeFy },
      });
      return r.data;
    },
  });

  const periodMonths = useMemo(() => fyMonths(activeFy), [activeFy]);

  // Merge backend tasks with custom tasks and overrides
  const tasks: LabourTask[] = useMemo(() => {
    const baseList = [...customTasks, ...(data?.tasks || [])];
    return baseList.map(t => {
      const ov = taskOverrides[t.id];
      return ov ? { ...t, ...ov } : t;
    });
  }, [data?.tasks, customTasks, taskOverrides]);

  // Compute live counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE').length;
  const employeesCount = data?.summary?.totalEmployees ?? 44;

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.act.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (filterTab === 'PENDING') return t.status === 'PENDING' || t.status === 'IN_PROGRESS';
    if (filterTab === 'COMPLETED') return t.status === 'COMPLETED';
    if (filterTab === 'OVERDUE') return t.status === 'OVERDUE';
    if (filterTab === 'HIGH') return t.priority === 'HIGH';
    return true;
  });

  const handleOpenTask = (task: LabourTask) => {
    setSelectedTask(task);
    setTaskNotes(task.notes || '');
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;
    setTaskOverrides(prev => ({
      ...prev,
      [selectedTask.id]: {
        status: 'COMPLETED',
        completedAt: new Date().toISOString().split('T')[0],
        completedBy: 'Admin User (HR Manager)',
        notes: taskNotes,
      },
    }));
    setSelectedTask(null);
    toast.success(`Compliance task '${selectedTask.name}' marked as Completed`);
  };

  const handleMarkInProgress = () => {
    if (!selectedTask) return;
    setTaskOverrides(prev => ({
      ...prev,
      [selectedTask.id]: {
        status: 'IN_PROGRESS',
        notes: taskNotes,
      },
    }));
    setSelectedTask(null);
    toast.info(`Compliance task '${selectedTask.name}' marked as In Progress`);
  };

  const handleCreateNewTask = () => {
    if (!newTaskForm.name.trim()) {
      toast.error('Task Name is required');
      return;
    }
    const newId = `LAB-TASK-${period.replace('-', '')}-${Date.now().toString().slice(-4)}`;
    const created: LabourTask = {
      id: newId,
      name: newTaskForm.name.trim(),
      category: newTaskForm.category,
      act: newTaskForm.act,
      frequency: newTaskForm.frequency,
      period,
      dueDate: newTaskForm.dueDate,
      priority: newTaskForm.priority,
      status: 'PENDING',
      applicability: newTaskForm.applicability,
      employeesCount,
      notes: newTaskForm.notes,
    };
    setCustomTasks(prev => [created, ...prev]);
    setNewTaskModalOpen(false);
    setNewTaskForm({
      name: '',
      category: 'Wages',
      act: 'Code on Wages, 2019',
      frequency: 'Monthly',
      priority: 'HIGH',
      dueDate: '2026-09-30',
      applicability: 'All Establishments in Maharashtra',
      notes: '',
    });
    toast.success(`New compliance task "${created.name}" created and added to the register`);
  };

  return (
    <div className="space-y-6">

      {/* ── BREADCRUMB + PAGE HEADER ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <span>Compliance</span><ArrowRight className="w-3 h-3" /><span className="text-slate-500">Labour Compliance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">Labour Compliance & Statutory Registers</h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                    Shops & Factories Acts
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                    Maharashtra
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Reg: {data?.registrationNumber || 'MH/PUN/SHOPS/2024/098124'}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />Commercial & IT Establishment</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />FY {activeFy}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Company selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Companies</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {/* FY selector */}
            <select
              value={activeFy}
              onChange={e => setActiveFy(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {FY_LIST.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
            {/* Period selector */}
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium"
            >
              {periodMonths.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(h => !h)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              {showHistory ? 'Hide History' : 'View History'}
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer font-medium"
              onClick={() => setNewTaskModalOpen(true)}
            >
              <Plus className="w-4 h-4" />New Task
            </Button>
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS (4 DYNAMIC STAT CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Employees', value: isLoading ? '…' : String(employeesCount), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Total Tasks', value: isLoading ? '…' : String(totalTasks), icon: CheckSquare, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Pending', value: isLoading ? '…' : String(pendingTasks), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Overdue', value: isLoading ? '…' : String(overdueTasks), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map(c => (
          <Card key={c.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 11-STEP LABOUR COMPLIANCE STEPPER PIPELINE ── */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50/40 to-slate-50">
        <CardContent className="py-4 px-6">
          <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            Labour Law Governance Pipeline — {periodLabel(period)} (FY {activeFy})
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading pipeline…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 text-center text-xs">
              {(data?.workflowSteps || []).map(st => (
                <div
                  key={st.id}
                  className={`p-2 rounded-md font-semibold flex items-center justify-center gap-1 ${
                    st.status === 'COMPLETED'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : st.status === 'IN_PROGRESS'
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-800'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {st.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                  <span className="truncate">{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── COMPLIANCE REGISTER TABLE ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Compliance Register & Statutory Tasks</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Task-based labour governance for POSH, Minimum Wages, Contract Labour, Registers & Audits
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search compliance tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-48"
                />
              </div>
              {/* Filter tabs */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                {[
                  { id: 'ALL', label: `All (${totalTasks})` },
                  { id: 'PENDING', label: `Pending (${pendingTasks})` },
                  { id: 'COMPLETED', label: `Completed (${completedTasks})` },
                  { id: 'OVERDUE', label: `Overdue (${overdueTasks})` },
                  { id: 'HIGH', label: 'High Priority' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      filterTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center gap-2 p-8 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading tasks…</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No labour compliance tasks match the current filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    {['Compliance Task', 'Applicable Act / Law', 'Category', 'Frequency', 'Period', 'Due Date', 'Priority', 'Status', 'Action'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task, i) => (
                    <tr key={task.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/20 transition-colors`}>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">{task.name}</span>
                          <span className="text-[10.5px] text-slate-400">{task.applicability}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">{task.act}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                          {task.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">{task.frequency}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{task.period}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">{task.dueDate}</td>
                      <td className="py-3.5 px-4">{priorityBadge(task.priority)}</td>
                      <td className="py-3.5 px-4">{statusBadge(task.status)}</td>
                      <td className="py-3.5 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer font-medium"
                          onClick={() => handleOpenTask(task)}
                        >
                          <Eye className="w-3 h-3" />View / Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3-COLUMN LABOUR LAW GOVERNANCE GUIDE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 1. Core Labour Acts Covered */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Key Statutory Acts Covered</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {[
              { act: 'Code on Wages / Minimum Wages Act', desc: 'Wage registers, minimum rates & overtime' },
              { act: 'POSH Act, 2013', desc: 'ICC constitution, annual report & employee awareness' },
              { act: 'Contract Labour (R&A) Act, 1970', desc: 'Contractor licenses, muster & safety' },
              { act: 'Maha Shops & Establishments Act', desc: 'Working hours, weekly off & holiday muster' },
              { act: 'Maternity Benefit & Gratuity Acts', desc: 'Statutory employee welfare & nominations' },
            ].map(item => (
              <div key={item.act} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <p className="font-semibold text-slate-800">{item.act}</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2. Mandatory Registers Checklist */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Mandatory Registers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {[
              { reg: 'Form B / X — Wage Register', status: '✓ Maintained & Up to date' },
              { reg: 'Form D — Muster Roll / Attendance', status: '✓ Automated with biometric' },
              { reg: 'Form C — Bonus Register', status: 'Annual calculation ready' },
              { reg: 'Form H — Leave with Wages', status: '✓ Monthly sync with leave records' },
              { reg: 'Form F — Gratuity Nominations', status: 'Employee file archive' },
            ].map(item => (
              <div key={item.reg} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <span className="font-medium text-slate-800">{item.reg}</span>
                <span className="text-[10.5px] text-emerald-700 font-semibold">{item.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3. Inspection & Audit Readiness */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Audit & Inspection Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="text-2xl font-extrabold text-emerald-700">
                {Math.round((completedTasks / (totalTasks || 1)) * 100)}%
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">Compliance Health Score</p>
                <p className="text-[10.5px] text-emerald-700">
                  {completedTasks} of {totalTasks} statutory requirements verified for {periodLabel(period)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Establishment Code:</span>
                <span className="font-mono font-semibold text-slate-800">MH-PUN-098124</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Auditor Status:</span>
                <span className="font-semibold text-emerald-700">Audit Ready</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Last Inspection:</span>
                <span className="text-slate-700 font-mono">15-Jan-2026 (Passed)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ INTERACTIVE MODALS ═════════════════════════════════════ */}

      {/* 1. Task Details & Completion Modal */}
      <Dialog open={!!selectedTask} onOpenChange={open => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              Compliance Details — {selectedTask?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="py-2 space-y-4">
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
                {[
                  { label: 'Compliance Task', value: selectedTask.name },
                  { label: 'Applicable Act / Law', value: selectedTask.act },
                  { label: 'Category', value: selectedTask.category },
                  { label: 'Period', value: periodLabel(selectedTask.period) },
                  { label: 'Statutory Due Date', value: selectedTask.dueDate },
                  { label: 'Applicability / Jurisdiction', value: selectedTask.applicability },
                  { label: 'Employees Covered', value: String(selectedTask.employeesCount) },
                  { label: 'Priority', value: selectedTask.priority },
                  { label: 'Current Status', value: selectedTask.status },
                ].map(r => (
                  <div key={r.label} className="flex justify-between px-4 py-2 text-xs">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-semibold text-slate-800">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Statutory verification checklist */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Statutory Verification Checklist</p>
                <div className="space-y-1.5">
                  {[
                    '✓ Employee data verified against active master',
                    '✓ Salary and wage structure cross-checked',
                    '✓ Attendance & biometric muster verified',
                    '✓ Overtime hours compliant with statutory caps',
                    '✓ Statutory wage rate & deduction validation passed',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence / Document upload */}
              <div>
                <Label className="text-xs text-slate-700 font-semibold block mb-1.5">Evidence & Supporting Documents</Label>
                <Input
                  type="file"
                  className="h-9 text-xs border-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-slate-700 font-semibold block mb-1.5">Notes & Compliance Officer Remarks</Label>
                <textarea
                  rows={3}
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  placeholder="Enter audit remarks, verification notes, or external inspector comments..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
            {selectedTask?.status !== 'COMPLETED' && (
              <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 cursor-pointer" onClick={handleMarkInProgress}>
                Mark in Progress
              </Button>
            )}
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px] cursor-pointer" onClick={handleCompleteTask}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />Complete Compliance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Create New Task Modal */}
      <Dialog open={newTaskModalOpen} onOpenChange={setNewTaskModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Plus className="w-5 h-5 text-indigo-600" />
              Create Labour Compliance Task
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <Label className="text-xs text-slate-600 font-medium">Compliance Task Name *</Label>
              <Input
                type="text"
                placeholder="e.g. Half-Yearly Safety & Welfare Audit"
                value={newTaskForm.name}
                onChange={e => setNewTaskForm(p => ({ ...p, name: e.target.value }))}
                className="h-8 text-xs border-slate-300 focus:border-indigo-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-600 font-medium">Category</Label>
                <select
                  value={newTaskForm.category}
                  onChange={e => setNewTaskForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white focus:outline-none focus:border-indigo-500 mt-1"
                >
                  <option value="Wages">Wages</option>
                  <option value="POSH">POSH</option>
                  <option value="Contract Labour">Contract Labour</option>
                  <option value="Working Hours">Working Hours</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Leave">Leave & Holidays</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Gratuity">Gratuity</option>
                  <option value="Inspection">Inspection</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-slate-600 font-medium">Priority</Label>
                <select
                  value={newTaskForm.priority}
                  onChange={e => setNewTaskForm(p => ({ ...p, priority: e.target.value as any }))}
                  className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white focus:outline-none focus:border-indigo-500 mt-1"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600 font-medium">Applicable Act / Law</Label>
              <Input
                type="text"
                value={newTaskForm.act}
                onChange={e => setNewTaskForm(p => ({ ...p, act: e.target.value }))}
                className="h-8 text-xs border-slate-300 focus:border-indigo-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-600 font-medium">Frequency</Label>
                <select
                  value={newTaskForm.frequency}
                  onChange={e => setNewTaskForm(p => ({ ...p, frequency: e.target.value }))}
                  className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white focus:outline-none focus:border-indigo-500 mt-1"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annual">Annual</option>
                  <option value="Event-based">Event-based</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-slate-600 font-medium">Statutory Due Date</Label>
                <Input
                  type="date"
                  value={newTaskForm.dueDate}
                  onChange={e => setNewTaskForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="h-8 text-xs border-slate-300 focus:border-indigo-500 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600 font-medium">Applicability Scope</Label>
              <Input
                type="text"
                value={newTaskForm.applicability}
                onChange={e => setNewTaskForm(p => ({ ...p, applicability: e.target.value }))}
                className="h-8 text-xs border-slate-300 focus:border-indigo-500 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600 font-medium">Notes & Description</Label>
              <textarea
                rows={2}
                value={newTaskForm.notes}
                onChange={e => setNewTaskForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional task notes..."
                className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setNewTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px] cursor-pointer" onClick={handleCreateNewTask}>
              <Plus className="w-4 h-4 mr-1.5" />Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LabourComplianceModule;
