import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Download,
  CheckCircle2,
  ShieldCheck,
  Search,
  Grid,
  List,
  AlertCircle,
  FileCheck,
  Users,
  Eye,
  Send,
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

interface PolicyItem {
  id: string;
  code: string;
  title: string;
  category: 'Conduct' | 'POSH' | 'Workplace' | 'IT Security' | 'Financial';
  version: string;
  effectiveDate: string;
  signedCount: number;
  totalEmployees: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  mandatorySignoff: boolean;
  fileSize: string;
  color: string;
}

const INITIAL_POLICIES: PolicyItem[] = [
  {
    id: 'p1',
    code: 'POL-01',
    title: 'Code of Corporate Conduct & Business Ethics',
    category: 'Conduct',
    version: 'v4.0',
    effectiveDate: '01 Jan 2026',
    signedCount: 248,
    totalEmployees: 248,
    status: 'ACTIVE',
    mandatorySignoff: true,
    fileSize: '1.4 MB PDF',
    color: 'bg-primary',
  },
  {
    id: 'p2',
    code: 'POL-02',
    title: 'Prevention of Sexual Harassment (POSH) Policy',
    category: 'POSH',
    version: 'v3.1',
    effectiveDate: '15 Feb 2026',
    signedCount: 248,
    totalEmployees: 248,
    status: 'ACTIVE',
    mandatorySignoff: true,
    fileSize: '2.1 MB PDF',
    color: 'bg-rose-500',
  },
  {
    id: 'p3',
    code: 'POL-03',
    title: 'Hybrid Work & Flexible Remote Policy',
    category: 'Workplace',
    version: 'v2.0',
    effectiveDate: '10 Mar 2026',
    signedCount: 242,
    totalEmployees: 248,
    status: 'ACTIVE',
    mandatorySignoff: true,
    fileSize: '950 KB PDF',
    color: 'bg-violet-500',
  },
  {
    id: 'p4',
    code: 'POL-04',
    title: 'IT & Information Security ISO 27001 Protocol',
    category: 'IT Security',
    version: 'v5.0',
    effectiveDate: '01 Jun 2026',
    signedCount: 248,
    totalEmployees: 248,
    status: 'ACTIVE',
    mandatorySignoff: true,
    fileSize: '3.4 MB PDF',
    color: 'bg-emerald-500',
  },
  {
    id: 'p5',
    code: 'POL-05',
    title: 'Anti-Bribery & Whistleblower Protection Guidelines',
    category: 'Conduct',
    version: 'v1.2',
    effectiveDate: '01 Apr 2026',
    signedCount: 236,
    totalEmployees: 248,
    status: 'ACTIVE',
    mandatorySignoff: true,
    fileSize: '1.8 MB PDF',
    color: 'bg-amber-500',
  },
  {
    id: 'p6',
    code: 'POL-06',
    title: 'Travel & Business Expense Reimbursement Policy',
    category: 'Financial',
    version: 'v2.4',
    effectiveDate: '01 May 2026',
    signedCount: 220,
    totalEmployees: 248,
    status: 'ACTIVE',
    mandatorySignoff: false,
    fileSize: '1.1 MB PDF',
    color: 'bg-cyan-500',
  },
];

export function PoliciesTab() {
  const [policies, setPolicies] = useState<PolicyItem[]>(INITIAL_POLICIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Conduct' | 'POSH' | 'Workplace' | 'IT Security' | 'Financial'>('Conduct');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formMandatory, setFormMandatory] = useState(true);

  const openAddModal = () => {
    setEditingPolicy(null);
    setFormCode(`POL-0${policies.length + 1}`);
    setFormTitle('');
    setFormCategory('Conduct');
    setFormVersion('v1.0');
    setFormMandatory(true);
    setIsOpen(true);
  };

  const openEditModal = (p: PolicyItem) => {
    setEditingPolicy(p);
    setFormCode(p.code);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormVersion(p.version);
    setFormMandatory(p.mandatorySignoff);
    setIsOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCode) {
      toast.error('Code and Title are required');
      return;
    }

    if (editingPolicy) {
      setPolicies(prev =>
        prev.map(item =>
          item.id === editingPolicy.id
            ? { ...item, code: formCode, title: formTitle, category: formCategory, version: formVersion, mandatorySignoff: formMandatory }
            : item,
        ),
      );
      toast.success('Policy document updated');
    } else {
      const newPolicy: PolicyItem = {
        id: `p_${Date.now()}`,
        code: formCode,
        title: formTitle,
        category: formCategory,
        version: formVersion,
        effectiveDate: '05 Aug 2026',
        signedCount: 0,
        totalEmployees: 248,
        status: 'ACTIVE',
        mandatorySignoff: formMandatory,
        fileSize: '1.5 MB PDF',
        color: 'bg-primary',
      };
      setPolicies(prev => [...prev, newPolicy]);
      toast.success('Policy published successfully');
    }
    setIsOpen(false);
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    toast.success('Policy archived');
  };

  const handleSendReminder = (title: string) => {
    toast.success(`Compliance reminder sent to un-signed staff for "${title}"`);
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ? true : p.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [policies, searchQuery, selectedCategory]);

  const totalSigned = policies.reduce((acc, curr) => acc + curr.signedCount, 0);
  const totalPossible = policies.reduce((acc, curr) => acc + curr.totalEmployees, 0);
  const overallRate = Math.round((totalSigned / totalPossible) * 100);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Governance & Compliance KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Published Governance Policies</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{policies.length} Manuals</p>
              <p className="text-[10px] text-primary font-semibold mt-1">v4.0 ISO 27001 Audited</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance Sign-off Rate</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{overallRate}%</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Mandatory E-Signatures Active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Sign-offs</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">14 Staff</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Reminders Queued</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Audit Compliance Health</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">100% Green</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">POSH & Legal Verified</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Policy Document Repository Panel ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Corporate HR Policies & Compliance Library
              </CardTitle>
              <CardDescription className="text-xs">
                Published employee handbooks, POSH rules, IT security standards & digital sign-off matrices
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'conduct', label: 'Conduct' },
                  { id: 'posh', label: 'POSH' },
                  { id: 'workplace', label: 'Workplace' },
                  { id: 'it security', label: 'IT Security' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedCategory === cat.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {cat.label}
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
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Publish Policy Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Publish New Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingPolicy ? 'Edit Policy Manual' : 'Publish New Policy Manual'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSavePolicy}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Policy Code</Label>
                        <Input
                          placeholder="e.g. POL-07"
                          value={formCode}
                          onChange={e => setFormCode(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Conduct" className="text-xs">Corporate Conduct</SelectItem>
                            <SelectItem value="POSH" className="text-xs">POSH Compliance</SelectItem>
                            <SelectItem value="Workplace" className="text-xs">Workplace & Remote</SelectItem>
                            <SelectItem value="IT Security" className="text-xs">IT & Data Security</SelectItem>
                            <SelectItem value="Financial" className="text-xs">Financial & Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Policy Document Title</Label>
                      <Input
                        placeholder="e.g. Environmental Sustainability & Social Responsibility"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Version Tag</Label>
                        <Input
                          placeholder="e.g. v1.0"
                          value={formVersion}
                          onChange={e => setFormVersion(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">E-Sign Requirement</Label>
                        <Select value={formMandatory ? 'yes' : 'no'} onValueChange={v => setFormMandatory(v === 'yes')}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select sign-off" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes" className="text-xs">Mandatory Sign-off</SelectItem>
                            <SelectItem value="no" className="text-xs">Optional / Informational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingPolicy ? 'Save Changes' : 'Publish Policy'}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPolicies.map(p => {
                const percentage = Math.round((p.signedCount / p.totalEmployees) * 100);

                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                          <span className="font-mono text-xs font-semibold text-primary">{p.code}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {p.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="View Document">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditModal(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeletePolicy(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h3 className=" text-base font-semibold text-foreground mt-2.5 leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span>Updated: <strong className="text-foreground font-mono">{p.effectiveDate}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{p.fileSize}</span>
                      </p>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                      {/* E-Signature Acknowledgment Meter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" /> Digital Sign-offs
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {p.signedCount} / {p.totalEmployees} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-500' : p.color}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] px-2 text-primary hover:text-primary gap-1"
                          onClick={() => toast.success(`Downloading PDF for ${p.code}...`)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </Button>

                        {percentage < 100 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                            onClick={() => handleSendReminder(p.title)}
                          >
                            <Send className="h-3 w-3" /> Send Reminder
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Policy Manual Title</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Version</TableHead>
                  <TableHead className="text-xs">E-Sign Progress</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map(p => (
                  <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.code}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{p.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{p.version}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{p.signedCount} / {p.totalEmployees} Signed</TableCell>
                    <TableCell className="text-xs">
                      <StatusBadge status="ACTIVE" label={p.status} className="text-[10px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePolicy(p.id)}>
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
    </div>
  );
}
