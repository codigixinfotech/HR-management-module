import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Cpu,
  CheckCircle2,
  Wrench,
  UserCheck,
  GitFork,
  Users,
  UserPlus,
  Gauge,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { MachineKPIs } from '@/api/machine-management';

interface MachineManagementKpiCardsProps {
  kpis: MachineKPIs | null;
  loading: boolean;
}

export function MachineManagementKpiCards({ kpis, loading }: MachineManagementKpiCardsProps) {
  const row1 = [
    {
      title: 'Total Machines',
      value: kpis ? kpis.totalMachines : 0,
      subtext: 'Asset & factory registered',
      icon: Cpu,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
      iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    },
    {
      title: 'Active Machines',
      value: kpis ? kpis.activeMachines : 0,
      subtext: 'Online & production-ready',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    {
      title: 'Under Maint.',
      value: kpis ? kpis.underMaintenance : 0,
      subtext: 'Servicing & calibration',
      icon: Wrench,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    },
    {
      title: 'Allocated',
      value: kpis ? kpis.allocatedMachines : 0,
      subtext: 'Currently operating shifts',
      icon: UserCheck,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40',
      iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    },
  ];

  const row2 = [
    {
      title: 'Production Lines',
      value: kpis ? kpis.productionLines : 0,
      subtext: 'Configured shop floor bays',
      icon: GitFork,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
      iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    },
    {
      title: 'Active Operators',
      value: kpis ? kpis.activeOperators : 0,
      subtext: 'Deployed on duty',
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40',
      iconBg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    },
    {
      title: 'Available',
      value: kpis ? kpis.availableOperators : 0,
      subtext: 'Ready for allocation',
      icon: UserPlus,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40',
      iconBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
    },
    {
      title: 'Avg Efficiency',
      value: kpis ? kpis.avgEfficiency : '96.2%',
      subtext: 'Plant line performance',
      icon: Gauge,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {row1.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={idx}
              className={`border transition-all hover:shadow-md ${item.bgColor}`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold mt-1 tracking-tight text-foreground">
                    {loading ? (
                      <span className="inline-block h-7 w-12 bg-muted animate-pulse rounded" />
                    ) : (
                      item.value
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtext}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {row2.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={idx}
              className={`border transition-all hover:shadow-md ${item.bgColor}`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold mt-1 tracking-tight text-foreground">
                    {loading ? (
                      <span className="inline-block h-7 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      item.value
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtext}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
