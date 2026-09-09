import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi, rolesApi } from '@/api/administration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { UsersTab } from './UsersTab';
import { RolesTab } from './RolesTab';
import { PlansPackagesTab } from './PlansPackagesTab';
import { CompanySubscriptionTab } from './CompanySubscriptionTab';
import {
  Settings,
  Shield,
  Users,
  UserCheck,
  Globe,
  Plus,
  CheckCircle2,
  Package,
  Layers,
  FileCode,
  Database
} from 'lucide-react';

const MOCK_NUMBER_SERIES = [
  { module: 'Employee Master', prefix: 'EMP-', currentNumber: '0048', format: 'EMP-{0000}', sample: 'EMP-0049' },
  { module: 'Payroll Run', prefix: 'PAY-2026-', currentNumber: '0008', format: 'PAY-{YYYY}-{0000}', sample: 'PAY-2026-0009' },
  { module: 'Helpdesk Ticket', prefix: 'TKT-', currentNumber: '1004', format: 'TKT-{0000}', sample: 'TKT-1005' },
  { module: 'Asset Register', prefix: 'AST-2026-', currentNumber: '0004', format: 'AST-{YYYY}-{0000}', sample: 'AST-2026-0005' },
];

export default function AdministrationPage() {
  const { tab: pathTab } = useParams<{ tab?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab precedence: URL path tab -> URL query search tab -> default 'users'
  const activeTab = pathTab || searchParams.get('tab') || 'users';

  const handleTabChange = (val: string) => {
    navigate(`/administration/${val}`);
    setSearchParams({ tab: val });
  };

  // Reuses the same query keys as UsersTab / RolesTab so react-query dedupes the request
  const { data: usersPage } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ page: 1, pageSize: 50 }),
  });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });

  const totalUsers = usersPage?.total ?? 0;
  const activeUsers = usersPage?.items.filter((u) => u.isActive).length ?? 0;
  const totalRoles = roles?.length ?? 0;
  const systemRoles = roles?.filter((r) => r.isSystem).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="System Settings & Administration"
        description="Role-Based Access Control (RBAC), commercial subscription packages, auto-numbering series & corporate configuration"
        badge="System Admin Active"
        badgeVariant="success"
      />

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} hint="Registered system accounts" accent="primary" />
        <StatCard icon={UserCheck} label="Active Users" value={activeUsers} hint="Currently enabled" accent="success" />
        <StatCard icon={Shield} label="Configured Roles" value={totalRoles} hint="RBAC role definitions" accent="info" />
        <StatCard icon={Settings} label="System Roles" value={systemRoles} hint="Built-in, non-deletable" accent="warning" />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="users" className="text-xs px-3 py-1.5">Users</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs px-3 py-1.5">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs px-3 py-1.5 font-semibold text-primary">Plans & Packages</TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs px-3 py-1.5 font-semibold text-primary">Company Subscription</TabsTrigger>
          <TabsTrigger value="masters" className="text-xs px-3 py-1.5">System Masters</TabsTrigger>
          <TabsTrigger value="number-series" className="text-xs px-3 py-1.5">Number Series</TabsTrigger>
          <TabsTrigger value="company-settings" className="text-xs px-3 py-1.5">Company Settings</TabsTrigger>
          <TabsTrigger value="localization" className="text-xs px-3 py-1.5">Localization & Currency</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs px-3 py-1.5">Document Templates</TabsTrigger>
          <TabsTrigger value="config" className="text-xs px-3 py-1.5">System Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <RolesTab />
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <PlansPackagesTab />
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <CompanySubscriptionTab />
        </TabsContent>

        <TabsContent value="masters" className="mt-4">
          <EmptyState
            icon={Database}
            title="System Masters Configuration"
            description="Manage central master tables including bank codes, statutory tax categories, IFSC masters, and global classifications."
            badge="Masters Active"
          />
        </TabsContent>

        <TabsContent value="number-series" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Document Auto-Numbering Series</CardTitle>
                <CardDescription>Custom prefix, suffix and padding rules for employee codes, payroll runs & helpdesk tickets</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Series Rule
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Module Scope</TableHead>
                    <TableHead className="text-xs">Prefix</TableHead>
                    <TableHead className="text-xs">Current Counter</TableHead>
                    <TableHead className="text-xs">Format Mask</TableHead>
                    <TableHead className="text-xs">Next Generated Code</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_NUMBER_SERIES.map((ns, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold text-xs">{ns.module}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{ns.prefix}</TableCell>
                      <TableCell className="font-mono text-xs">{ns.currentNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{ns.format}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-emerald-600">{ns.sample}</TableCell>
                      <TableCell className="text-xs">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Edit Mask
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company-settings" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Corporate Tax & Statutory Registration Credentials</CardTitle>
              <CardDescription>Legal company registration numbers, EPFO code, ESIC code, TAN & GSTIN</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Permanent Account Number (PAN)</Label>
                  <Input className="h-9 text-xs font-mono" defaultValue="AAACE1234F" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax Deduction Account Number (TAN)</Label>
                  <Input className="h-9 text-xs font-mono" defaultValue="PUNE12345A" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">EPFO Establishment Code</Label>
                  <Input className="h-9 text-xs font-mono" defaultValue="MH/PUN/0091823/000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ESIC Employer Code</Label>
                  <Input className="h-9 text-xs font-mono" defaultValue="31000998822000101" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Goods & Services Tax Identification Number (GSTIN)</Label>
                <Input className="h-9 text-xs font-mono" defaultValue="27AAACE1234F1Z5" />
              </div>
              <Button
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => toast.info('Corporate credentials saved')}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Save Corporate Credentials
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="mt-4">
          <EmptyState
            icon={Globe}
            title="Localization & Currency Settings"
            description="Multi-language support, regional date/number formatting, timezones, and base reporting currency configuration."
            badge="Locale Active"
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <EmptyState
            icon={FileCode}
            title="Document Templates"
            description="Manage corporate print templates, appointment letters, promotion letters, experience certificates, and email alerts."
            badge="Templates Active"
          />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <EmptyState
            icon={Settings}
            title="System Configuration"
            description="Global system-wide preferences, feature toggles, and security policies."
            badge="Config Active"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
