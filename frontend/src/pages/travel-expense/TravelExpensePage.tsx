import { useSearchParams } from 'react-router-dom';
import { Plane, Receipt, CreditCard, Plus, Building2, Route, Banknote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const EXPENSES = [
  { id: 'EXP-9001', traveler: 'Admin User', dest: 'Mumbai - Client Onboarding', date: '02 Aug 2026', category: 'Flight & Hotel', amount: '₹24,800', status: 'APPROVED' },
  { id: 'EXP-9002', traveler: 'Rajesh Sharma', dest: 'Bangalore - Tech Conference', date: '05 Aug 2026', category: 'Meals & Transport', amount: '₹12,400', status: 'APPROVED' },
  { id: 'EXP-9003', traveler: 'Priya Verma', dest: 'Delhi - Govt Compliance Visit', date: '10 Aug 2026', category: 'Hotel Stay', amount: '₹18,500', status: 'PENDING' },
];

const BOOKINGS = [
  { id: 'TRV-501', traveler: 'Amit Patel', route: 'Pune → Chennai', mode: 'Flight (IndiGo)', travelDate: '12 Aug 2026', status: 'SCHEDULED' },
  { id: 'TRV-502', traveler: 'Sneha Iyer', route: 'Pune → Hyderabad', mode: 'Flight (Air India)', travelDate: '14 Aug 2026', status: 'SCHEDULED' },
  { id: 'TRV-503', traveler: 'Vikram Singh', route: 'Mumbai Hotel - Taj Vivanta', mode: 'Hotel Stay', travelDate: '15-17 Aug 2026', status: 'APPROVED' },
  { id: 'TRV-504', traveler: 'Neha Kapoor', route: 'Pune → Delhi', mode: 'Flight (Vistara)', travelDate: '09 Aug 2026', status: 'CANCELLED' },
];

const REIMBURSEMENTS = [
  { id: 'RMB-701', employee: 'Rajesh Sharma', amount: '₹12,400', bankRef: 'UTR2608051123', date: '03 Aug 2026', status: 'PAID' },
  { id: 'RMB-702', employee: 'Admin User', amount: '₹24,800', bankRef: 'UTR2608041987', date: '02 Aug 2026', status: 'PAID' },
  { id: 'RMB-703', employee: 'Priya Verma', amount: '₹18,500', bankRef: 'Pending Bank Batch', date: '—', status: 'PENDING' },
];

export default function TravelExpensePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Plane}
        title="Business Travel & Expense Management"
        description="Travel pre-approval requests, OCR receipt scanner, per diem allowance calculations & automated reimbursements"
        badge="Per Diem Rates: Updated 2026"
        badgeVariant="info"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Submit Expense Claim
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Plane} label="YTD Travel Budget Spent" value="₹12.4 Lakhs" hint="Budget Utilization: 62%" accent="info" />
        <StatCard icon={Receipt} label="Pending Claims Queue" value="₹55,700" hint="3 Claims Awaiting Audit" accent="warning" />
        <StatCard icon={CreditCard} label="Reimbursed This Month" value="₹37,200" hint="Direct Bank Credit Done" accent="success" />
        <StatCard icon={Building2} label="Corporate Card Sync" value="100% Matched" hint="Zero Out-of-Policy Flags" accent="primary" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="travel" className="text-xs px-3 py-1.5">Travel Bookings</TabsTrigger>
          <TabsTrigger value="claims" className="text-xs px-3 py-1.5">Expense Claims</TabsTrigger>
          <TabsTrigger value="reimbursements" className="text-xs px-3 py-1.5">Reimbursements</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Travel & Expense Claims Register</CardTitle>
              <CardDescription>Verified claims with receipt OCR verification & policy compliance checks</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Claim ID</TableHead>
                    <TableHead className="text-xs">Traveler</TableHead>
                    <TableHead className="text-xs">Destination & Purpose</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Expense Type</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EXPENSES.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs font-semibold">{e.id}</TableCell>
                      <TableCell className="font-medium text-xs">{e.traveler}</TableCell>
                      <TableCell className="text-xs">{e.dest}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{e.date}</TableCell>
                      <TableCell className="text-xs">{e.category}</TableCell>
                      <TableCell className="text-xs font-semibold">{e.amount}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={e.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Upcoming Travel Bookings</CardTitle>
                <CardDescription>Pre-approved flight, rail and hotel bookings for business travel</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Route className="h-3.5 w-3.5" /> New Travel Request
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Booking ID</TableHead>
                    <TableHead className="text-xs">Traveler</TableHead>
                    <TableHead className="text-xs">Route / Property</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Travel Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BOOKINGS.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs font-semibold">{b.id}</TableCell>
                      <TableCell className="text-xs font-medium">{b.traveler}</TableCell>
                      <TableCell className="text-xs">{b.route}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.mode}</TableCell>
                      <TableCell className="text-xs font-mono">{b.travelDate}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={b.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="mt-4">
          <EmptyState
            icon={Receipt}
            title="Full Expense Claims Ledger"
            description="Complete claims history with OCR receipt review, line-item audit and policy-violation flags. See the Overview tab for the latest claims."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="reimbursements" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Reimbursement Payout Register</CardTitle>
              <CardDescription>Bank transfer status for approved expense reimbursements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Txn ID</TableHead>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Bank Reference</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REIMBURSEMENTS.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">{r.id}</TableCell>
                      <TableCell className="text-xs font-medium">{r.employee}</TableCell>
                      <TableCell className="text-xs font-semibold">{r.amount}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Banknote className="h-3 w-3" /> {r.bankRef}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.date}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={r.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
