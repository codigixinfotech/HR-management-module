import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  Calculator,
  FileSpreadsheet,
  CreditCard,
  Scale,
  FileBarChart,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';

export type PfTabType =
  | 'dashboard'
  | 'employees'
  | 'configuration'
  | 'calculation'
  | 'ecr'
  | 'challan'
  | 'reconciliation'
  | 'reports';

export interface PfSubNavProps {
  activeSubTab: PfTabType;
  onSubTabChange: (tab: PfTabType) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedCompany: string;
  onCompanyChange: (company: string) => void;
  companies?: any[];
}

const TABS: { id: PfTabType; label: string; icon: any; badge?: string }[] = [
  { id: 'dashboard', label: 'PF Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employee PF', icon: Users },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'calculation', label: 'Calculation Engine', icon: Calculator, badge: 'Step 4' },
  { id: 'ecr', label: 'ECR Return', icon: FileSpreadsheet, badge: 'EPFO' },
  { id: 'challan', label: 'Challan & Payment', icon: CreditCard },
  { id: 'reconciliation', label: 'Reconciliation', icon: Scale },
  { id: 'reports', label: 'PF Reports', icon: FileBarChart },
];

export function PfSubNav({
  activeSubTab,
  onSubTabChange,
  selectedPeriod,
  onPeriodChange,
  selectedCompany,
  onCompanyChange,
  companies = [],
}: PfSubNavProps) {
  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="p-4 rounded-2xl border border-border/80 bg-gradient-to-r from-purple-950/20 via-background to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-foreground">Provident Fund (PF) Compliance Suite</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                EPFO 2.0 Compliant
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              End-to-end statutory EPF, EPS & EDLI calculation, ECR generation, TRRN payment & 3-way reconciliation
            </p>
          </div>
        </div>

        {/* Filter Pickers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Company Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedCompany}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-muted-foreground">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* 8-Tab Sub Navigation Bar */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-2xl border border-border/80 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSubTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0',
                isActive
                  ? 'bg-background text-primary shadow-xs border border-border/80 font-extrabold scale-[1.01]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-md text-[9.5px] font-extrabold uppercase',
                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
