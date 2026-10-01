import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, ShieldCheck, Phone } from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/api/types';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';

export interface ContractorVendor {
  id: string;
  vendor: string;
  type: string;
  headcount: string;
  contact: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  contractExpiry: string;
  clraLicense?: string;
  branchName?: string;
}

const INITIAL_CONTRACTORS: ContractorVendor[] = [
  { id: 'ho-v1', vendor: 'CBRE Head Office Corporate Facility Mgmt', type: 'Executive Facility Staffing & Concierge', headcount: '8 Staff', contact: 'Anjali Verma (+91 98111 22334)', status: 'ACTIVE', contractExpiry: '31 Dec 2026', clraLicense: 'CLRA-DL-2024-112', branchName: 'Head Office' },
  { id: 'ho-v2', vendor: 'G4S Corporate Secure Logistics', type: 'HQ Executive Security & Access Control', headcount: '10 Guards', contact: 'Vikram Seth (+91 98222 33445)', status: 'ACTIVE', contractExpiry: '30 Jun 2027', clraLicense: 'CLRA-DL-2023-789', branchName: 'Head Office' },
  { id: '1', vendor: 'TeamLease Manpower Services', type: 'Assembly Skilled Labour', headcount: '32 Workers', contact: 'Ramesh K. (+91 98234 11223)', status: 'ACTIVE', contractExpiry: '31 Dec 2026', clraLicense: 'CLRA-MH-2024-889', branchName: 'Pune Manufacturing Plant' },
  { id: '2', vendor: 'Quess Corp Facility Staffing', type: 'Housekeeping & Sanitation', headcount: '14 Workers', contact: 'Sanjay M. (+91 97654 44321)', status: 'ACTIVE', contractExpiry: '15 Nov 2026', clraLicense: 'CLRA-MH-2023-412', branchName: 'Pune Manufacturing Plant' },
  { id: '3', vendor: 'SIS Security Guard Agency', type: 'Industrial Security', headcount: '18 Guards', contact: 'Col. Jaswant (+91 94220 88712)', status: 'ACTIVE', contractExpiry: '31 Mar 2027', clraLicense: 'CLRA-MH-2022-901', branchName: 'Pune Manufacturing Plant' },
  { id: '4', vendor: 'Adecco Industrial Workforce', type: 'Packaging & Warehouse Logistics', headcount: '20 Workers', contact: 'Deepak Verma (+91 91234 56780)', status: 'ACTIVE', contractExpiry: '28 Feb 2027', clraLicense: 'CLRA-MH-2025-104', branchName: 'Pune Manufacturing Plant' },
];

export function ContractorManagementTab({ companyId, companies }: { companyId?: string; companies?: Company[] }) {
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    isBranchAdmin,
    isSuperOrCompanyAdmin,
    assignedBranchName,
    matchBranch,
  } = useWorkforceBranch();

  const [contractors, setContractors] = useState<ContractorVendor[]>(INITIAL_CONTRACTORS);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const [formData, setFormData] = useState({
    vendor: '',
    type: '',
    headcount: '',
    contact: '',
    contractExpiry: '',
    clraLicense: '',
  });

  const filtered = contractors.filter((c) => {
    const matchesSearch =
      c.vendor.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = matchBranch({
      branchName: c.branchName || c.vendor,
      location: c.branchName,
    });
    return matchesSearch && matchesBranch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor || !formData.type || !formData.headcount) {
      toast.error('Please enter agency name, deployment scope, and headcount');
      return;
    }

    const newVendor: ContractorVendor = {
      id: String(Date.now()),
      vendor: formData.vendor,
      type: formData.type,
      headcount: formData.headcount.includes('Worker') ? formData.headcount : `${formData.headcount} Workers`,
      contact: formData.contact || 'Operations Lead',
      contractExpiry: formData.contractExpiry || '31 Dec 2027',
      status: 'ACTIVE',
      clraLicense: formData.clraLicense || 'CLRA-VERIFIED',
    };

    setContractors([newVendor, ...contractors]);
    toast.success('Contractor vendor registered successfully');
    setOpenModal(false);
    setFormData({
      vendor: '',
      type: '',
      headcount: '',
      contact: '',
      contractExpiry: '',
      clraLicense: '',
    });
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Contract Labour Staffing Vendors</CardTitle>
            <CardDescription>Manpower supply agency contracts, deployed headcount & statutory CLRA compliance</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search vendor or scope..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Branch Filter (Matching Employee Master Page) */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
            />

            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Staffing Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Staffing Vendor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Agency / Vendor Name</Label>
                    <Input
                      placeholder="e.g. Apex Industrial Labour Ltd"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Deployment Scope</Label>
                    <Input
                      placeholder="e.g. Maintenance & Line Fitters"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Deployed Headcount</Label>
                      <Input
                        placeholder="e.g. 25"
                        value={formData.headcount}
                        onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                        className="text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Contract Expiry</Label>
                      <Input
                        type="date"
                        value={formData.contractExpiry}
                        onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contact Person & Phone</Label>
                    <Input
                      placeholder="e.g. Rajesh Patil (+91 98200 12345)"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CLRA License / Reg No.</Label>
                    <Input
                      placeholder="e.g. CLRA-MH-2026-904"
                      value={formData.clraLicense}
                      onChange={(e) => setFormData({ ...formData, clraLicense: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpenModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Register Vendor
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vendor Agency</TableHead>
                  <TableHead className="text-xs">Deployment Scope</TableHead>
                  <TableHead className="text-xs">Deployed Headcount</TableHead>
                  <TableHead className="text-xs">Vendor Contact</TableHead>
                  <TableHead className="text-xs">CLRA License</TableHead>
                  <TableHead className="text-xs">Contract Expiry</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                      No staffing vendors found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-xs">{c.vendor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.type}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">{c.headcount}</TableCell>
                      <TableCell className="text-xs">{c.contact}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{c.clraLicense || 'CLRA-VERIFIED'}</TableCell>
                      <TableCell className="text-xs font-mono">{c.contractExpiry}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={c.status} className="text-[10px]" />
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
