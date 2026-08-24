import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Grid,
  List,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

interface HolidayItem {
  id: string;
  date: string;
  month: string;
  year: string;
  fullDate: string;
  title: string;
  day: string;
  type: 'Mandatory' | 'Optional' | 'Regional';
  locations: string;
  daysRemaining?: number;
  color: string;
}

const INITIAL_HOLIDAYS: HolidayItem[] = [
  { id: 'h1', date: '26', month: 'JAN', year: '2026', fullDate: '26 Jan 2026', title: 'Republic Day', day: 'Monday', type: 'Mandatory', locations: 'All India & Global Branches', color: 'bg-primary' },
  { id: 'h2', date: '15', month: 'AUG', year: '2026', fullDate: '15 Aug 2026', title: 'Independence Day', day: 'Saturday', type: 'Mandatory', locations: 'All India Facilities', daysRemaining: 10, color: 'bg-emerald-500' },
  { id: 'h3', date: '02', month: 'OCT', year: '2026', fullDate: '02 Oct 2026', title: 'Gandhi Jayanti', day: 'Friday', type: 'Mandatory', locations: 'All India Facilities', daysRemaining: 58, color: 'bg-amber-500' },
  { id: 'h4', date: '01', month: 'NOV', year: '2026', fullDate: '01 Nov 2026', title: 'Diwali (Laxmi Pujan)', day: 'Sunday', type: 'Mandatory', locations: 'All India & Pune Plant', daysRemaining: 88, color: 'bg-violet-500' },
  { id: 'h5', date: '25', month: 'DEC', year: '2026', fullDate: '25 Dec 2026', title: 'Christmas Day', day: 'Friday', type: 'Mandatory', locations: 'All Global Branches', daysRemaining: 142, color: 'bg-rose-500' },
  { id: 'h6', date: '14', month: 'JAN', year: '2026', fullDate: '14 Jan 2026', title: 'Makar Sankranti / Pongal', day: 'Wednesday', type: 'Optional', locations: 'Restricted Festival Leave', color: 'bg-cyan-500' },
  { id: 'h7', date: '27', month: 'MAR', year: '2026', fullDate: '27 Mar 2026', title: 'Holi (Rangwali Holi)', day: 'Friday', type: 'Optional', locations: 'Restricted Festival Leave', color: 'bg-indigo-500' },
  { id: 'h8', date: '01', month: 'MAY', year: '2026', fullDate: '01 May 2026', title: 'International Labour Day', day: 'Friday', type: 'Regional', locations: 'Pune Manufacturing Plant', color: 'bg-blue-500' },
];

import { useCompany } from '@/context/CompanyContext';

export function WorkCalendarTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // Add/Edit Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDay, setFormDay] = useState('Monday');
  const [formType, setFormType] = useState<'Mandatory' | 'Optional' | 'Regional'>('Mandatory');
  const [formLocations, setFormLocations] = useState('All Facilities');

  const openAddModal = () => {
    setEditingHoliday(null);
    setFormTitle('');
    setFormDate('2026-09-05');
    setFormDay('Saturday');
    setFormType('Mandatory');
    setFormLocations('All Facilities');
    setIsOpen(true);
  };

  const openEditModal = (h: HolidayItem) => {
    setEditingHoliday(h);
    setFormTitle(h.title);
    setFormDate(h.fullDate);
    setFormDay(h.day);
    setFormType(h.type);
    setFormLocations(h.locations);
    setIsOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) {
      toast.error('Holiday event title is required');
      return;
    }

    if (editingHoliday) {
      setHolidays(prev =>
        prev.map(item =>
          item.id === editingHoliday.id
            ? { ...item, title: formTitle, day: formDay, type: formType, locations: formLocations }
            : item,
        ),
      );
      toast.success('Holiday event updated successfully');
    } else {
      const newHoliday: HolidayItem = {
        id: `h_${Date.now()}`,
        date: '05',
        month: 'SEP',
        year: '2026',
        fullDate: formDate || '05 Sep 2026',
        title: formTitle,
        day: formDay,
        type: formType,
        locations: formLocations,
        daysRemaining: 30,
        color: 'bg-primary',
      };
      setHolidays(prev => [...prev, newHoliday]);
      toast.success('Holiday declared successfully');
    }
    setIsOpen(false);
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
    toast.success('Holiday removed from calendar');
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const matchesSearch =
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.fullDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.locations.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === 'all' ? true : h.type.toLowerCase() === selectedType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [holidays, searchQuery, selectedType]);

  const mandatoryCount = holidays.filter(h => h.type === 'Mandatory').length;
  const optionalCount = holidays.filter(h => h.type === 'Optional').length;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Key Metric Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Declared Holidays</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{holidays.length} Days</p>
              <p className="text-[10px] text-primary font-semibold mt-1">2026 Work Calendar</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mandatory Paid Leaves</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{mandatoryCount} Days</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Paid Statutory</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Restricted / Optional</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{optionalCount} Days</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Employee Selectable</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next Upcoming Holiday</p>
              <p className=" text-lg font-semibold text-foreground mt-0.5">Aug 15 (Indep.)</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">In 10 Days • Mandatory</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Holiday Calendar Section ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Declared Holiday Calendar
              </CardTitle>
              <CardDescription className="text-xs">
                Statutory national, festival, and branch restricted holidays
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Type Category Tabs */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'mandatory', label: 'Mandatory' },
                  { id: 'optional', label: 'Restricted' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedType === type.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search holiday..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Declare Holiday Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Declare Holiday
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingHoliday ? 'Edit Holiday Event' : 'Declare New Holiday'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSaveHoliday}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Holiday Event Title</Label>
                      <Input
                        placeholder="e.g. Independence Day"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="text"
                          placeholder="e.g. 15 Aug 2026"
                          value={formDate}
                          onChange={e => setFormDate(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Day of Week</Label>
                        <Select value={formDay} onValueChange={setFormDay}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday" className="text-xs">Monday</SelectItem>
                            <SelectItem value="Tuesday" className="text-xs">Tuesday</SelectItem>
                            <SelectItem value="Wednesday" className="text-xs">Wednesday</SelectItem>
                            <SelectItem value="Thursday" className="text-xs">Thursday</SelectItem>
                            <SelectItem value="Friday" className="text-xs">Friday</SelectItem>
                            <SelectItem value="Saturday" className="text-xs">Saturday</SelectItem>
                            <SelectItem value="Sunday" className="text-xs">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Holiday Type</Label>
                        <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mandatory" className="text-xs">Mandatory National</SelectItem>
                            <SelectItem value="Optional" className="text-xs">Restricted / Optional</SelectItem>
                            <SelectItem value="Regional" className="text-xs">Regional Festival</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Applicable Locations</Label>
                        <Input
                          placeholder="e.g. All India Facilities"
                          value={formLocations}
                          onChange={e => setFormLocations(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingHoliday ? 'Save Changes' : 'Declare Holiday'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredHolidays.map(h => (
                <div
                  key={h.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary font-semibold text-center border border-primary/20 shrink-0">
                        <span className="font-mono text-base font-semibold leading-none">{h.date}</span>
                        <span className="text-[9.5px] uppercase font-semibold tracking-wider leading-none mt-0.5">{h.month}</span>
                      </div>
                      <div className="truncate">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                          {h.day}
                        </Badge>
                        {h.daysRemaining && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-semibold block mt-1">
                            In {h.daysRemaining} days
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditModal(h)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteHoliday(h.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className=" text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {h.title}
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      {h.locations}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                    <span className="text-muted-foreground font-mono">{h.fullDate}</span>
                    <Badge className={`text-[9.5px] font-semibold ${h.type === 'Mandatory' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-foreground'}`}>
                      {h.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Holiday Event</TableHead>
                  <TableHead className="text-xs">Day of Week</TableHead>
                  <TableHead className="text-xs">Leave Type</TableHead>
                  <TableHead className="text-xs">Applicable Locations</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.map(h => (
                  <TableRow key={h.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{h.fullDate}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{h.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.day}</TableCell>
                    <TableCell className="text-xs">
                      {h.type === 'Mandatory' ? (
                        <StatusBadge status="ACTIVE" label="Mandatory" className="text-[10px]" />
                      ) : (
                        <Badge variant="outline" className="text-[10px]">{h.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{h.locations}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(h)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteHoliday(h.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Corporate Workweek Shift Policy Banner ── */}
      <Card className="shadow-2xs bg-muted/20 border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" /> Standard Workweek & Biometric Sync Policy
          </CardTitle>
          <CardDescription className="text-xs">
            Standard corporate shift hours, weekend policy & automatic biometric machine holiday overrides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border/60">
              <span className="font-semibold text-foreground block">5-Day Workweek Policy</span>
              <p className="text-muted-foreground mt-0.5">Monday to Friday (40 Hours/Week) • Saturdays & Sundays Off</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/60">
              <span className="font-semibold text-foreground block">Standard General Shift</span>
              <p className="text-muted-foreground mt-0.5">09:00 AM – 06:00 PM (1 Hour Paid Break included)</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/60">
              <span className="font-semibold text-foreground block">Biometric IoT Machine Override</span>
              <p className="text-emerald-600 font-semibold mt-0.5">Biometric check-in auto-suppressed on declared holidays</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
