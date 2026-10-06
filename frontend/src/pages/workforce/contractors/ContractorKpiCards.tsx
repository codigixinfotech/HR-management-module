import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  ShieldCheck,
  Building2,
  FileText,
  UserCheck,
  Briefcase,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { ContractorDashboard } from '@/api/contractor-management';

interface ContractorKpiCardsProps {
  data: ContractorDashboard | null;
  loading?: boolean;
}

export function ContractorKpiCards({ data, loading }: ContractorKpiCardsProps) {
  const cards = [
    {
      title: 'Total Plant Workforce',
      value: loading ? '...' : String(data?.totalPlantWorkforce || 0),
      subtitle: `${data?.permanentWorkforce || 0} Perm / ${data?.contractWorkforce || 0} Contract`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-900/50',
    },
    {
      title: 'Permanent Workforce',
      value: loading ? '...' : String(data?.permanentWorkforce || 0),
      subtitle: 'On-roll company employees',
      icon: Briefcase,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-900/50',
    },
    {
      title: 'Contract Workforce',
      value: loading ? '...' : String(data?.contractWorkforce || 0),
      subtitle: `${data?.activeWorkers || 0} active external workers`,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-900/50',
    },
    {
      title: 'Active Staffing Vendors',
      value: loading ? '...' : String(data?.activeVendors || 0),
      subtitle: `${data?.activeContracts || 0} active manpower contracts`,
      icon: Building2,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      border: 'border-cyan-200 dark:border-cyan-900/50',
    },
    {
      title: 'Active Contractor Workers',
      value: loading ? '...' : String(data?.activeWorkers || 0),
      subtitle: 'Enrolled under active vendors',
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      border: 'border-violet-200 dark:border-violet-900/50',
    },
    {
      title: 'Workers Deployed',
      value: loading ? '...' : String(data?.deployedWorkers || 0),
      subtitle: `${data?.availableWorkerCapacity || 0} available capacity`,
      icon: Briefcase,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      title: 'Compliance SLA Score',
      value: loading ? '...' : data?.complianceScore || '100%',
      subtitle: `${data?.validComplianceCount || 0} Valid / ${data?.expiringComplianceCount || 0} Expiring`,
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-900/50',
    },
    {
      title: 'Contracts Expiring Soon',
      value: loading ? '...' : String(data?.expiringContracts || 0),
      subtitle: `${data?.expiredContracts || 0} expired contracts`,
      icon: AlertTriangle,
      color: (data?.expiringContracts || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400',
      bg: (data?.expiringContracts || 0) > 0 ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-slate-50 dark:bg-slate-900/40',
      border: (data?.expiringContracts || 0) > 0 ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={`shadow-xs border transition-all duration-150 hover:shadow-sm ${card.border}`}>
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <div className="text-xl font-bold tracking-tight text-foreground">{card.value}</div>
                <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
