import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, HardHat, HeartPulse, ShieldAlert } from 'lucide-react';
import { companiesApi } from '@/api/organization';
import { incidentsApi, ppeApi, safetyAuditsApi } from '@/api/ehs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComingSoonCard } from '@/components/ComingSoonCard';
import { IncidentsTab } from './IncidentsTab';
import { PpeTab } from './PpeTab';
import { SafetyAuditsTab } from './SafetyAuditsTab';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function SafetyEhsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const companyId = companies?.[0]?.id;

  const { data: incidents } = useQuery({
    queryKey: ['safety-incidents', companyId],
    queryFn: () => incidentsApi.list(companyId),
    enabled: !!companyId,
  });
  const { data: ppeItems } = useQuery({
    queryKey: ['ppe-items', companyId],
    queryFn: () => ppeApi.list(companyId),
    enabled: !!companyId,
  });
  const { data: audits } = useQuery({
    queryKey: ['safety-audits', companyId],
    queryFn: () => safetyAuditsApi.list(companyId),
    enabled: !!companyId,
  });

  const seriousIncidents = (incidents ?? []).filter((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL');
  const lastSeriousIncident = seriousIncidents.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
  const daysSinceLti = lastSeriousIncident
    ? Math.floor((Date.now() - new Date(lastSeriousIncident.occurredAt).getTime()) / MS_PER_DAY)
    : null;

  const openIncidents = (incidents ?? []).filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  const totalPpeStock = (ppeItems ?? []).reduce((sum, i) => sum + i.stockQuantity, 0);
  const latestAudit = audits?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldAlert}
        title="Environmental Health & Safety (EHS)"
        description="Workplace safety audits, PPE issuance tracking and incident reporting"
        badge={openIncidents > 0 ? `${openIncidents} open incident(s)` : 'No open incidents'}
        badgeVariant={openIncidents > 0 ? 'warning' : 'success'}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={HeartPulse}
          label="Days Since Last Serious Incident"
          value={daysSinceLti === null ? 'No incidents' : `${daysSinceLti} Days`}
          accent="success"
        />
        <StatCard icon={HardHat} label="Total PPE Stock" value={`${totalPpeStock} Units`} accent="warning" />
        <StatCard
          icon={FileText}
          label="Latest Safety Audit Score"
          value={latestAudit ? `${latestAudit.score}%` : 'None yet'}
          accent="info"
        />
        <StatCard
          icon={ShieldAlert}
          label="Incidents Open"
          value={`${openIncidents} Active`}
          accent={openIncidents > 0 ? 'destructive' : 'success'}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="ppe" className="text-xs px-3 py-1.5">PPE Inventory</TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs px-3 py-1.5">Incident Log</TabsTrigger>
          <TabsTrigger value="safety-training" className="text-xs px-3 py-1.5">Safety Training</TabsTrigger>
          <TabsTrigger value="audits" className="text-xs px-3 py-1.5">Safety Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            A snapshot of your organization&apos;s safety posture — incident history, protective equipment coverage
            and audit performance.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ShieldAlert} label="Total Incidents Logged" value={incidents?.length ?? 0} accent="info" />
            <StatCard
              icon={HeartPulse}
              label="High / Critical Incidents"
              value={seriousIncidents.length}
              accent={seriousIncidents.length > 0 ? 'destructive' : 'success'}
            />
            <StatCard
              icon={HardHat}
              label="PPE Categories Tracked"
              value={new Set((ppeItems ?? []).map((i) => i.category)).size}
              accent="warning"
            />
            <StatCard
              icon={FileText}
              label="Audits Conducted"
              value={audits?.length ?? 0}
              hint={latestAudit ? `Latest score: ${latestAudit.score}%` : undefined}
              accent="primary"
            />
          </div>
        </TabsContent>
        <TabsContent value="ppe" className="mt-4">
          <PpeTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <IncidentsTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="safety-training" className="mt-4">
          <ComingSoonCard
            title="Safety Training"
            description="Safety training programs will be tracked once the Learning module's training-program infrastructure is built, to avoid duplicating that system here."
          />
        </TabsContent>
        <TabsContent value="audits" className="mt-4">
          <SafetyAuditsTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
