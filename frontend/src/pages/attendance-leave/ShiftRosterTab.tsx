import { useState } from 'react';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Users,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface RosterItem {
  id: string;
  shift: string;
  timing: string;
  dept: string;
  headcount: string;
  lead: string;
  rotationPattern: 'Weekly' | 'Bi-Weekly' | 'Permanent';
}

const INITIAL_ROSTERS: RosterItem[] = [
  { id: 'RST-01', shift: 'Morning Shift (A)', timing: '08:00 AM - 04:30 PM', dept: 'Plant Operations & Assembly', headcount: '48 Staff', lead: 'Amit Patel', rotationPattern: 'Weekly' },
  { id: 'RST-02', shift: 'General Day Shift (G)', timing: '09:00 AM - 05:30 PM', dept: 'HQ Corporate & Tech', headcount: '85 Staff', lead: 'Admin User', rotationPattern: 'Permanent' },
  { id: 'RST-03', shift: 'Evening Shift (B)', timing: '04:00 PM - 12:30 AM', dept: '24/7 IT Infrastructure Support', headcount: '12 Staff', lead: 'Rajesh Sharma', rotationPattern: 'Weekly' },
  { id: 'RST-04', shift: 'Night Shift (C)', timing: '12:00 AM - 08:30 AM', dept: 'Security & Maintenance', headcount: '8 Staff', lead: 'Karan Malhotra', rotationPattern: 'Bi-Weekly' },
];

export function ShiftRosterTab() {
  const [rosters, setRosters] = useState<RosterItem[]>(INITIAL_ROSTERS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formShift, setFormShift] = useState('General Day Shift (G)');
  const [formTiming, setFormTiming] = useState('09:00 AM - 05:30 PM');
  const [formDept, setFormDept] = useState('');
  const [formHeadcount, setFormHeadcount] = useState('10 Staff');
  const [formLead, setFormLead] = useState('');
  const [formRotation, setFormRotation] = useState<'Weekly' | 'Bi-Weekly' | 'Permanent'>('Weekly');

  const openAddModal = () => {
    setFormShift('General Day Shift (G)');
    setFormTiming('09:00 AM - 05:30 PM');
    setFormDept('');
    setFormHeadcount('10 Staff');
    setFormLead('');
    setFormRotation('Weekly');
    setIsOpen(true);
  };

  const handleAddRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDept || !formLead) {
      toast.error('All fields are required to allocate a shift roster');
      return;
    }

    const newRoster: RosterItem = {
      id: `RST-0${rosters.length + 1}`,
      shift: formShift,
      timing: formTiming,
      dept: formDept,
      headcount: formHeadcount,
      lead: formLead,
      rotationPattern: formRotation,
    };

    setRosters(prev => [...prev, newRoster]);
    toast.success('Roster schedule allocated successfully');
    setIsOpen(false);
  };

  const filteredRosters = rosters.filter(r =>
    r.shift.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.lead.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* ── 1. Roster Telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Shifts</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{rosters.length} Cycles</p>
              <p className="text-[10px] text-primary font-semibold mt-1">24/7 Operations cover</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Staff Scheduled</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">153 Personnel</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% headcount coverage</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Roster Supervisors</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{new Set(rosters.map(r => r.lead)).size} Leads</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Duty handovers monitored</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rotation Pattern</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">Weekly</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Next rotation: Sunday</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Roster Allocation Schedule Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Shift Roster Schedule & Allocation Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Configured shift timings, rotation patterns and operational department lead allocations
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter rosters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Assign Shift Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                  <Plus className="h-3.5 w-3.5" /> Assign Shift Roster
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign Shift Roster</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddRoster}>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Select Shift Type</Label>
                    <Select value={formShift} onValueChange={setFormShift}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning Shift (A)" className="text-xs">Morning Shift (A)</SelectItem>
                        <SelectItem value="General Day Shift (G)" className="text-xs">General Day Shift (G)</SelectItem>
                        <SelectItem value="Evening Shift (B)" className="text-xs">Evening Shift (B)</SelectItem>
                        <SelectItem value="Night Shift (C)" className="text-xs">Night Shift (C)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Allocated Department</Label>
                      <Input
                        placeholder="e.g. SalesHQ"
                        value={formDept}
                        onChange={e => setFormDept(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Shift supervisor</Label>
                      <Input
                        placeholder="e.g. Priya Verma"
                        value={formLead}
                        onChange={e => setFormLead(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Shift Timings</Label>
                      <Input
                        placeholder="e.g. 09:00 AM - 05:30 PM"
                        value={formTiming}
                        onChange={e => setFormTiming(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Assigned Headcount</Label>
                      <Input
                        placeholder="e.g. 15 Staff"
                        value={formHeadcount}
                        onChange={e => setFormHeadcount(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rotation Schedule Pattern</Label>
                    <Select value={formRotation} onValueChange={v => setFormRotation(v as any)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select rotation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly" className="text-xs">Weekly Rotation</SelectItem>
                        <SelectItem value="Bi-Weekly" className="text-xs">Bi-Weekly Rotation</SelectItem>
                        <SelectItem value="Permanent" className="text-xs">Permanent Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs">
                      Publish Schedule
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Shift Pattern</TableHead>
                <TableHead className="text-xs">Shift Timing</TableHead>
                <TableHead className="text-xs">Allocated Department</TableHead>
                <TableHead className="text-xs">Assigned Headcount</TableHead>
                <TableHead className="text-xs">Shift Supervisor</TableHead>
                <TableHead className="text-right text-xs">Rotation Cycle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRosters.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-xs text-foreground">{r.shift}</TableCell>
                  <TableCell className="font-mono text-xs font-medium">{r.timing}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {r.dept}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-primary">{r.headcount}</TableCell>
                  <TableCell className="text-xs font-medium text-foreground">{r.lead}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {r.rotationPattern}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
