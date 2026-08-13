import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  History,
  Info,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { hrPoliciesApi, type HrPolicy } from '@/api/hr-policies';

export function PoliciesTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [activePolicy, setActivePolicy] = useState<HrPolicy | null>(null);
  const [viewPolicyDetail, setViewPolicyDetail] = useState<HrPolicy | null>(null);
  const [isNewVersionMode, setIsNewVersionMode] = useState(false);

  // Form States
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Conduct');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formMandatory, setFormMandatory] = useState(true);
  const [formDescription, setFormDescription] = useState('');

  // Document Upload State
  const [uploadedDocument, setUploadedDocument] = useState<{
    documentUrl: string;
    fileSize: string;
    filename: string;
    originalName: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Queries ──
  const { data: policies = [], isLoading: isPoliciesLoading } = useQuery({
    queryKey: ['hr-policies', searchQuery, selectedCategory],
    queryFn: () => hrPoliciesApi.list({ search: searchQuery, category: selectedCategory }),
  });

  const { data: kpis } = useQuery({
    queryKey: ['hr-policies-kpis'],
    queryFn: () => hrPoliciesApi.getKpis(),
  });

  // ── Upload Mutation ──
  const uploadMutation = useMutation({
    mutationFn: (file: File) => hrPoliciesApi.uploadDocument(file),
    onSuccess: (data) => {
      setUploadedDocument(data);
      toast.success(`Policy document uploaded: ${data.originalName}`);
      setIsUploading(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to upload document file');
      setIsUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: Partial<HrPolicy>) => hrPoliciesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr-policies-kpis'] });
      toast.success('Policy published successfully to library');
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to publish policy');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HrPolicy> }) => hrPoliciesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr-policies-kpis'] });
      toast.success('Policy record updated successfully');
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update policy');
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { version: string; title?: string; description?: string; documentUrl?: string; fileSize?: string } }) =>
      hrPoliciesApi.createVersion(id, payload),
    onSuccess: (newPolicy) => {
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr-policies-kpis'] });
      toast.success(`New version ${newPolicy.version} created and published`);
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create new policy version');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrPoliciesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr-policies-kpis'] });
      toast.success('Policy manual deleted from database');
      setIsDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete policy');
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: (id: string) => hrPoliciesApi.sendReminder(id),
    onSuccess: (res) => {
      toast.success(res.message);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send reminder');
    },
  });

  // ── Modal Actions ──
  const openAddModal = () => {
    setActivePolicy(null);
    setIsNewVersionMode(false);
    setUploadedDocument(null);
    setFormCode(`POL-0${policies.length + 1}`);
    setFormTitle('');
    setFormCategory('Conduct');
    setFormVersion('v1.0');
    setFormMandatory(true);
    setFormDescription('');
    setIsOpen(true);
  };

  const openEditModal = (p: HrPolicy) => {
    setActivePolicy(p);
    setIsNewVersionMode(false);
    if (p.documentUrl) {
      setUploadedDocument({
        documentUrl: p.documentUrl,
        fileSize: p.fileSize || '1.5 MB PDF',
        filename: p.documentUrl.split('/').pop() || 'policy.pdf',
        originalName: `${p.policyCode}_${p.version}.pdf`,
      });
    } else {
      setUploadedDocument(null);
    }
    setFormCode(p.policyCode);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormVersion(p.version);
    setFormMandatory(p.esignRequirement);
    setFormDescription(p.description || '');
    setIsOpen(true);
  };

  const openNewVersionModal = (p: HrPolicy) => {
    setActivePolicy(p);
    setIsNewVersionMode(true);
    if (p.documentUrl) {
      setUploadedDocument({
        documentUrl: p.documentUrl,
        fileSize: p.fileSize || '1.5 MB PDF',
        filename: p.documentUrl.split('/').pop() || 'policy.pdf',
        originalName: `${p.policyCode}_${p.version}.pdf`,
      });
    } else {
      setUploadedDocument(null);
    }
    setFormCode(p.policyCode);
    setFormTitle(p.title);
    setFormCategory(p.category);
    const verNum = parseFloat(p.version.replace('v', '')) || 1.0;
    setFormVersion(`v${(verNum + 1.0).toFixed(1)}`);
    setFormMandatory(p.esignRequirement);
    setFormDescription(p.description || '');
    setIsOpen(true);
  };

  const openViewModal = async (p: HrPolicy) => {
    try {
      const fullDetail = await hrPoliciesApi.get(p.id);
      setViewPolicyDetail(fullDetail);
      setIsViewOpen(true);
    } catch {
      setViewPolicyDetail(p);
      setIsViewOpen(true);
    }
  };

  const openDeleteModal = (p: HrPolicy) => {
    setActivePolicy(p);
    setIsDeleteOpen(true);
  };

  const handleDownloadPdf = (p: HrPolicy) => {
    const docUrl = p.documentUrl || `/api/organization/hr-policies/download/${p.policyCode}.pdf`;
    window.open(docUrl, '_blank');
    toast.success(`Opening official policy document for ${p.policyCode}...`);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCode) {
      toast.error('Policy Code and Title are required');
      return;
    }

    if (!uploadedDocument && !activePolicy) {
      toast.error('Policy document file is required before publishing');
      return;
    }

    const docUrl = uploadedDocument?.documentUrl || activePolicy?.documentUrl || null;
    const docSize = uploadedDocument?.fileSize || activePolicy?.fileSize || '1.5 MB PDF';

    if (isNewVersionMode && activePolicy) {
      createVersionMutation.mutate({
        id: activePolicy.id,
        payload: {
          version: formVersion,
          title: formTitle,
          description: formDescription,
          documentUrl: docUrl || undefined,
          fileSize: docSize,
        },
      });
    } else if (activePolicy) {
      updateMutation.mutate({
        id: activePolicy.id,
        data: {
          policyCode: formCode,
          title: formTitle,
          category: formCategory,
          version: formVersion,
          esignRequirement: formMandatory,
          description: formDescription,
          documentUrl: docUrl || undefined,
          fileSize: docSize,
        },
      });
    } else {
      createMutation.mutate({
        policyCode: formCode,
        title: formTitle,
        category: formCategory,
        version: formVersion,
        esignRequirement: formMandatory,
        description: formDescription,
        documentUrl: docUrl || undefined,
        fileSize: docSize,
        status: 'PUBLISHED',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Governance & Compliance KPI Cards (Backend Driven) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Published Governance Policies</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{kpis?.publishedCount ?? 0} Manuals</p>
              <p className="text-[10px] text-primary font-semibold mt-1">{kpis?.auditedStandard ?? 'v4.0 ISO 27001 Audited'}</p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">{kpis?.overallRate ?? 100}%</p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">{kpis?.pendingSignoffs ?? 0} Staff</p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">{kpis?.auditHealth ?? '100% Green'}</p>
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
                  { id: 'Conduct', label: 'Conduct' },
                  { id: 'POSH', label: 'POSH' },
                  { id: 'Workplace', label: 'Workplace' },
                  { id: 'IT Security', label: 'IT Security' },
                  { id: 'Financial', label: 'Financial' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      selectedCategory.toLowerCase() === cat.id.toLowerCase()
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
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Publish New Policy Button */}
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                <Plus className="h-3.5 w-3.5" /> Publish New Policy
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isPoliciesLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Loading corporate policies from database...
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-xl space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No HR Policies Found</p>
              <p className="text-xs text-muted-foreground">There are no published policies matching your filter criteria.</p>
              <Button size="sm" variant="outline" className="text-xs mt-2" onClick={openAddModal}>
                Publish First Policy
              </Button>
            </div>
          ) : displayMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {policies.map((p) => {
                const totalEmp = p.totalEmployees || 248;
                const signed = p.signedCount || 0;
                const percentage = Math.round((signed / totalEmp) * 100);
                const pubDate = p.publishedAt
                  ? new Date(p.publishedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                  : '01 Jan 2026';
                const cardColor = p.color || 'bg-primary';

                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${cardColor}`} />
                          <span className="font-mono text-xs font-semibold text-primary">{p.policyCode}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {p.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="View Details"
                            onClick={() => openViewModal(p)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit Policy"
                            onClick={() => openEditModal(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary hover:text-primary"
                            title="Release New Version"
                            onClick={() => openNewVersionModal(p)}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete Policy"
                            onClick={() => openDeleteModal(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h3
                        className="text-base font-semibold text-foreground mt-2.5 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => openViewModal(p)}
                      >
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span>
                          Updated: <strong className="text-foreground font-mono">{pubDate}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{p.fileSize || '1.5 MB PDF'}</span>
                      </p>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                      {/* E-Signature Meter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" /> Digital Sign-offs
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {signed} / {totalEmp} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-500' : cardColor}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] px-2 text-primary hover:text-primary gap-1"
                          onClick={() => handleDownloadPdf(p)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </Button>

                        {percentage < 100 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                            onClick={() => sendReminderMutation.mutate(p.id)}
                            disabled={sendReminderMutation.isPending}
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
          ) : (
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
                {policies.map((p) => {
                  const totalEmp = p.totalEmployees || 248;
                  const signed = p.signedCount || 0;
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{p.policyCode}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground cursor-pointer hover:underline" onClick={() => openViewModal(p)}>
                        {p.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">{p.version}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        {signed} / {totalEmp} Signed
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={p.status === 'PUBLISHED' ? 'ACTIVE' : p.status} label={p.status} className="text-[10px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadPdf(p)} title="Download Document">
                          <Download className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openViewModal(p)} title="View Details">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(p)} title="Edit Policy">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => openNewVersionModal(p)} title="New Version">
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDeleteModal(p)} title="Delete Policy">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Create / Edit / New Version Dialog ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isNewVersionMode
                ? `Release New Version for ${activePolicy?.policyCode}`
                : activePolicy
                ? 'Edit Policy Manual'
                : 'Publish New Policy Manual'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSavePolicy}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Policy Code *</Label>
                <Input
                  placeholder="e.g. POL-07"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-9 text-xs font-mono"
                  disabled={isNewVersionMode}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category *</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v)} disabled={isNewVersionMode}>
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
              <Label className="text-xs font-medium">Policy Document Title *</Label>
              <Input
                placeholder="e.g. Environmental Sustainability & Social Responsibility"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Version Tag *</Label>
                <Input
                  placeholder="e.g. v1.0"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">E-Sign Requirement</Label>
                <Select value={formMandatory ? 'yes' : 'no'} onValueChange={(v) => setFormMandatory(v === 'yes')}>
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Policy Summary / Description</Label>
              <Input
                placeholder="Brief summary of governance rules and guidelines..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* ── Policy Document Upload Field ── */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Policy Document *</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="policy-file-input"
              />

              {!uploadedDocument ? (
                <div className="border-2 border-dashed border-border/80 rounded-xl p-4 text-center hover:bg-muted/30 transition-colors bg-muted/10">
                  <label htmlFor="policy-file-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-primary">📎 Choose Policy Document</span>
                    <span className="text-[10px] text-muted-foreground">PDF / DOC / DOCX • Max file size: 10MB</span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-muted/40 border border-border/80 rounded-xl">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-foreground truncate">{uploadedDocument.originalName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{uploadedDocument.fileSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10.5px] px-2.5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10.5px] px-2 text-primary hover:text-primary gap-1"
                      onClick={() => window.open(uploadedDocument.documentUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </Button>
                  </div>
                </div>
              )}

              {isUploading && (
                <p className="text-[10.5px] text-primary font-medium animate-pulse flex items-center gap-1 mt-1">
                  Uploading document file to backend storage...
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs"
                disabled={isUploading || createMutation.isPending || updateMutation.isPending || createVersionMutation.isPending}
              >
                {isNewVersionMode
                  ? 'Publish New Version'
                  : activePolicy
                  ? 'Save Changes'
                  : 'Publish Policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. View Policy Details & Version Log Modal ── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{viewPolicyDetail?.policyCode}</Badge>
                <span>{viewPolicyDetail?.title}</span>
              </span>
              <Badge className="font-mono text-[10.5px]">{viewPolicyDetail?.version}</Badge>
            </DialogTitle>
          </DialogHeader>

          {viewPolicyDetail && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10.5px]">Category:</span>
                  <span className="font-semibold text-foreground">{viewPolicyDetail.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10.5px]">Status:</span>
                  <StatusBadge status={viewPolicyDetail.status === 'PUBLISHED' ? 'ACTIVE' : viewPolicyDetail.status} label={viewPolicyDetail.status} className="text-[10px]" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10.5px]">Published Date:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {new Date(viewPolicyDetail.publishedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10.5px]">E-Sign Requirement:</span>
                  <span className="font-semibold text-foreground">{viewPolicyDetail.esignRequirement ? 'Mandatory Sign-off' : 'Optional / Informational'}</span>
                </div>
              </div>

              {viewPolicyDetail.description && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-primary" /> Overview & Summary
                  </span>
                  <p className="text-muted-foreground leading-relaxed p-2.5 bg-card border rounded-lg">
                    {viewPolicyDetail.description}
                  </p>
                </div>
              )}

              {/* Document Download & Preview Panel */}
              <div className="space-y-2 border-t pt-3">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Official Policy Document
                </span>
                <div className="flex items-center justify-between p-3 bg-card border rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-xs">{viewPolicyDetail.policyCode}_{viewPolicyDetail.version}.pdf</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{viewPolicyDetail.fileSize || '1.5 MB PDF'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => handleDownloadPdf(viewPolicyDetail)}
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                    {viewPolicyDetail.documentUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] text-primary gap-1"
                        onClick={() => window.open(viewPolicyDetail.documentUrl, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> Sign-off Compliance Matrix
                  </span>
                  <span className="font-mono text-foreground font-semibold">
                    {viewPolicyDetail.signedCount} / {viewPolicyDetail.totalEmployees} ({Math.round((viewPolicyDetail.signedCount / viewPolicyDetail.totalEmployees) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round((viewPolicyDetail.signedCount / viewPolicyDetail.totalEmployees) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Version History */}
              {viewPolicyDetail.versionHistory && viewPolicyDetail.versionHistory.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <History className="h-3.5 w-3.5 text-primary" /> Version Audit Trail ({viewPolicyDetail.versionHistory.length} Releases)
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {viewPolicyDetail.versionHistory.map((vh) => (
                      <div key={vh.id} className="flex items-center justify-between p-2 rounded-lg border bg-background text-[11px]">
                        <div className="flex items-center gap-2">
                          <Badge variant={vh.id === viewPolicyDetail.id ? 'default' : 'outline'} className="text-[10px] font-mono">
                            {vh.version}
                          </Badge>
                          <span className="font-medium text-foreground">{vh.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground text-[10px]">
                            {new Date(vh.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-primary"
                            title="Download Version Document"
                            onClick={() => handleDownloadPdf(vh)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1"
              onClick={() => {
                setIsViewOpen(false);
                if (viewPolicyDetail) openEditModal(viewPolicyDetail);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 5. Delete Confirmation Dialog ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              Are you sure you want to delete policy manual <strong className="text-foreground font-mono">{activePolicy?.policyCode}</strong> ({activePolicy?.title})?
            </p>
            <p className="text-[11px] text-destructive font-medium">This action will remove the record from the corporate database.</p>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={() => activePolicy && deleteMutation.mutate(activePolicy.id)}
              disabled={deleteMutation.isPending}
            >
              Delete Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
