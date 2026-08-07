import { useSearchParams } from 'react-router-dom';
import { Gift, Heart, Sparkles, DollarSign, Download, Smile } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const BENEFITS = [
  { title: 'Group Health Insurance (GHI)', coverage: '₹5,000,000 / Family', provider: 'HDFC ERGO', status: 'ACTIVE', enrolled: '100%' },
  { title: 'Group Personal Accident (GPA)', coverage: '₹10,000,000 / Member', provider: 'Star Health', status: 'ACTIVE', enrolled: '100%' },
  { title: 'Flexi Allowance Basket', coverage: 'Gym / Wellness / Broadband', provider: 'EHCM Flexi', status: 'OPEN', enrolled: '88%' },
  { title: 'Employee Stock Options (ESOP)', coverage: 'Vesting over 4 Years', provider: 'Carta / EHCM', status: 'ACTIVE', enrolled: '35%' },
];

const INSURANCE_BENEFITS = BENEFITS.filter((b) => b.title.includes('Insurance') || b.title.includes('Accident'));
const FLEXI_BENEFITS = BENEFITS.filter((b) => b.title.includes('Flexi'));
const ESOP_BENEFITS = BENEFITS.filter((b) => b.title.includes('Stock') || b.title.includes('ESOP'));

function BenefitTable({ rows }: { rows: typeof BENEFITS }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Benefit</TableHead>
          <TableHead className="text-xs">Coverage / Details</TableHead>
          <TableHead className="text-xs">Provider</TableHead>
          <TableHead className="text-xs">Enrollment</TableHead>
          <TableHead className="text-xs">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((b, i) => (
          <TableRow key={i}>
            <TableCell className="text-xs font-medium">{b.title}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{b.coverage}</TableCell>
            <TableCell className="text-xs">{b.provider}</TableCell>
            <TableCell className="text-xs font-mono">{b.enrolled}</TableCell>
            <TableCell className="text-xs">
              <StatusBadge status={b.status} className="text-[10px]" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function CompensationBenefitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DollarSign}
        title="Compensation & Benefits Administration"
        description="Group insurance policies, flexible benefit baskets, ESOP vesting schedules & wellness perks"
        badge="FY26 Benefits Enrollment Open"
        badgeVariant="warning"
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={DollarSign} label="Annual Benefits Spend" value="₹42.8 Lakhs" hint="Per Employee Average: ₹85k" accent="success" />
        <StatCard icon={Heart} label="Insurance Covered Lives" value="184 Dependents" hint="100% Policy Cashless Sync" accent="destructive" />
        <StatCard icon={Gift} label="Flexi Claim Approvals" value="₹3.4 Lakhs" hint="August Reimbursement Queue" accent="primary" />
        <StatCard icon={Sparkles} label="ESOP Pool Vested" value="42,500 Shares" hint="2026 Vesting Cliff Reached" accent="warning" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="insurance" className="text-xs px-3 py-1.5">Health Insurance</TabsTrigger>
          <TabsTrigger value="flexi" className="text-xs px-3 py-1.5">Flexi Basket</TabsTrigger>
          <TabsTrigger value="esops" className="text-xs px-3 py-1.5">Equity & ESOPs</TabsTrigger>
          <TabsTrigger value="perks" className="text-xs px-3 py-1.5">Perks & Wellness</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <Card key={i} className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{b.title}</CardTitle>
                    <StatusBadge status={b.status} className="text-xs" />
                  </div>
                  <CardDescription>Provider: {b.provider}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Coverage Details:</span>
                    <span className="font-semibold">{b.coverage}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Enrollment Status:</span>
                    <span className="text-success font-semibold">{b.enrolled}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insurance" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Group Health & Accident Insurance</CardTitle>
                <CardDescription>Cashless hospitalization and personal accident coverage for employees & dependents</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Download Policy Docs
              </Button>
            </CardHeader>
            <CardContent>
              <BenefitTable rows={INSURANCE_BENEFITS} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flexi" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Flexible Benefit Basket</CardTitle>
                <CardDescription>Monthly allowance basket covering gym, wellness and broadband reimbursements</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Reimbursement Window Open
              </Badge>
            </CardHeader>
            <CardContent>
              <BenefitTable rows={FLEXI_BENEFITS} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esops" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Equity & ESOP Vesting</CardTitle>
                <CardDescription>Stock option grants and vesting schedules administered via Carta</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Export Vesting Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <BenefitTable rows={ESOP_BENEFITS} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perks" className="mt-4">
          <EmptyState
            icon={Smile}
            title="Perks & Wellness Programs"
            description="Curated wellness stipends, mental health support and lifestyle perks are being catalogued here."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
