import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  UserCheck,
  Building2,
  GitFork,
  Eye,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser, isCompanyAdminUser, isBranchAdminUser } from '@/lib/modules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';
import { branchesApi } from '@/api/organization';

interface FlatDocRecord {
  employeeId: string;
  code: string;
  name: string;
  docType: string;
  docNumber: string;
  status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  fileId?: string;
  filePath?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  employeeBranchId?: string | null;
  employeeCompanyId?: string | null;
}

export function DocumentVaultTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');

  // Company filter — defaults to the globally active company
  const { activeCompanyId, companies } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(activeCompanyId);

  const user = useAuthStore((s) => s.user);
  const isSuperOrCompanyAdmin = useMemo(() => isSuperAdminUser(user) || isCompanyAdminUser(user), [user]);
  const isBranchAdmin = useMemo(() => {
    if (!user) return false;
    if (isSuperOrCompanyAdmin) return false;
    return isBranchAdminUser(user);
  }, [user, isSuperOrCompanyAdmin]);

  const assignedBranchId = user?.branchId || user?.employee?.branchId;
  const effectiveBranchId = isBranchAdmin && assignedBranchId ? assignedBranchId : undefined;

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('HEAD_OFFICE');

  const { data: apiBranches = [] } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => (selectedCompanyId ? branchesApi.list(selectedCompanyId) : branchesApi.list()),
    enabled: Boolean(selectedCompanyId && isSuperOrCompanyAdmin),
  });

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formType, setFormType] = useState<'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Resume' | 'Offer Letter' | 'Joining Letter'>('Aadhaar Card');
  const [formNumber, setFormNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load database employees filtered by selected company and branch
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', 1, '', selectedCompanyId, effectiveBranchId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000, companyId: selectedCompanyId, branchId: effectiveBranchId }),
  });

  const employees = employeesData?.items ?? [];

  const branchScopedEmployees = useMemo(() => {
    if (!isSuperOrCompanyAdmin) return employees;

    if (selectedBranchFilter === 'HEAD_OFFICE') {
      return employees.filter((e: any) => {
        if (e.branchId && e.branchId !== 'NONE') {
          const branchObj = apiBranches.find((b: any) => b.id === e.branchId) || e.branch;
          const bName = (branchObj?.name || '').toLowerCase();
          return bName.includes('head') || bName.includes('corporate') || bName.includes('main');
        }
        return (
          !e.branchId ||
          e.branchId === 'NONE' ||
          (e.location && (e.location.toLowerCase().includes('head office') || e.location.toLowerCase().includes('corporate')))
        );
      });
    }

    if (selectedBranchFilter !== 'ALL') {
      return employees.filter((e: any) =>
        (e.branchId && e.branchId === selectedBranchFilter) ||
        (e.branch?.id && e.branch.id === selectedBranchFilter)
      );
    }

    return employees;
  }, [employees, isSuperOrCompanyAdmin, selectedBranchFilter, apiBranches]);

  // Confirmation dialog state for document verification
  const [docToVerify, setDocToVerify] = useState<FlatDocRecord | null>(null);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<FlatDocRecord | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Check if current user is authorized to verify a specific document
  const canVerifyDoc = (doc: FlatDocRecord) => {
    if (!user) return false;
    // Super Admin & Company Admin can verify documents in company
    if (isSuperOrCompanyAdmin) return true;
    // Branch Admin can strictly verify documents only for their assigned branch
    if (isBranchAdmin) {
      if (!assignedBranchId) return false;
      return doc.employeeBranchId === assignedBranchId;
    }
    return false;
  };

  const formatVerificationDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch {
      return isoString;
    }
  };

  // Flatten database employees and their documents into single records (Only documents with actual uploaded files)
  const flatDocs = useMemo<FlatDocRecord[]>(() => {
    const list: FlatDocRecord[] = [];
    branchScopedEmployees.forEach(emp => {
      const name = `${emp.firstName} ${emp.lastName}`;
      const code = emp.employeeCode;

      // Only iterate over actual uploaded documents in emp.documents
      if (emp.documents && Array.isArray(emp.documents)) {
        emp.documents.forEach((doc: any) => {
          let friendlyType = doc.docType;
          let docNum = doc.fileName;

          if (doc.docType === 'ID_PROOF') {
            friendlyType = 'Aadhaar Card';
            docNum = emp.aadhaarNumber || doc.fileName;
          } else if (doc.docType === 'ADDRESS_PROOF') {
            friendlyType = 'PAN Card';
            docNum = emp.panNumber || doc.fileName;
          } else if (doc.docType === 'PASSPORT' || doc.docType === 'Passport') {
            friendlyType = 'Passport';
            docNum = emp.passportNumber || doc.fileName;
          } else if (doc.docType === 'EDUCATION') {
            friendlyType = 'Degree Certificate';
          } else if (doc.docType === 'OFFER_LETTER') {
            friendlyType = 'Offer Letter';
          } else if (doc.docType === 'JOINING_LETTER') {
            friendlyType = 'Joining Letter';
          }

          let docStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED' = 'PENDING_VERIFICATION';
          if (doc.verificationStatus === 'VERIFIED') {
            docStatus = 'VERIFIED';
          } else if (doc.verificationStatus === 'REJECTED') {
            docStatus = 'REJECTED';
          } else {
            docStatus = 'PENDING_VERIFICATION';
          }

          const verifiedByName = doc.verifiedByUser?.employee
            ? `${doc.verifiedByUser.employee.firstName} ${doc.verifiedByUser.employee.lastName}`
            : (doc.verifiedByUser?.email || (doc.verifiedBy ? 'Admin' : null));

          list.push({
            employeeId: emp.id,
            code,
            name,
            docType: friendlyType,
            docNumber: docNum,
            status: docStatus,
            fileId: doc.id,
            filePath: doc.filePath,
            verifiedBy: doc.verifiedBy,
            verifiedAt: doc.verifiedAt,
            verifiedByName,
            employeeBranchId: emp.branchId,
            employeeCompanyId: emp.companyId,
          });
        });
      }
    });
    return list;
  }, [branchScopedEmployees]);

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: ({
      employeeId,
      documentId,
      status,
    }: {
      employeeId: string;
      documentId: string;
      status?: 'VERIFIED' | 'REJECTED';
    }) => employeesApi.verifyDocument(employeeId, documentId, status || 'VERIFIED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Document successfully verified!');
      setDocToVerify(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Verification failed');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployeeId || !selectedFile) return;

      // 1. Upload file if selected
      let docTypeMapping = 'OTHER';
      if (formType === 'Aadhaar Card') docTypeMapping = 'ID_PROOF';
      else if (formType === 'PAN Card') docTypeMapping = 'ADDRESS_PROOF';
      else if (formType === 'Passport') docTypeMapping = 'PASSPORT';
      else if (formType === 'Resume') docTypeMapping = 'EDUCATION';
      else if (formType === 'Offer Letter') docTypeMapping = 'OFFER_LETTER';
      else if (formType === 'Joining Letter') docTypeMapping = 'JOINING_LETTER';

      await employeesApi.uploadDocument(selectedEmployeeId, selectedFile, docTypeMapping);

      // 2. Update reference number if provided
      const updatePayload: any = {};
      if (formType === 'Aadhaar Card' && formNumber) updatePayload.aadhaarNumber = formNumber;
      if (formType === 'PAN Card' && formNumber) updatePayload.panNumber = formNumber;
      if (formType === 'Passport' && formNumber) updatePayload.passportNumber = formNumber;

      if (Object.keys(updatePayload).length > 0) {
        await employeesApi.update(selectedEmployeeId, updatePayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Document uploaded and linked successfully');
      setIsOpen(false);
      setSelectedEmployeeId('');
      setFormNumber('');
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Upload failed');
    },
  });

  const getServerUrl = () => {
    if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:3001`;
    }
    return 'http://localhost:3001';
  };

  const getDocumentViewUrl = (doc: FlatDocRecord) => {
    const serverBase = getServerUrl();
    if (doc.fileId) {
      return `${serverBase}/api/employees/documents/${doc.fileId}/view`;
    }
    if (doc.filePath) {
      return `${serverBase}/${(doc.filePath || '').replace(/\\/g, '/').replace(/^\.?\/?/, '')}`;
    }
    return '';
  };

  // Convert document to local blob URL to bypass cross-origin / CSP iframe restrictions
  useEffect(() => {
    if (!previewDoc) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setIsLoadingPreview(false);
      setPreviewError(null);
      return;
    }

    let active = true;
    setIsLoadingPreview(true);
    setPreviewError(null);

    const url = getDocumentViewUrl(previewDoc);
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (active) {
          const objUrl = URL.createObjectURL(blob);
          setBlobUrl(objUrl);
          setIsLoadingPreview(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Preview load failed:', err);
          setPreviewError('Failed to load document content');
          setIsLoadingPreview(false);
        }
      });

    return () => {
      active = false;
    };
  }, [previewDoc]);

  const triggerBlobDownload = (blob: Blob, doc: FlatDocRecord) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let fileName = doc.docNumber || `${doc.docType.replace(/\s+/g, '_')}_${doc.code}`;
    if (!fileName.includes('.') && doc.filePath) {
      const ext = doc.filePath.split('.').pop();
      if (ext && ext.length <= 5) {
        fileName = `${fileName}.${ext}`;
      }
    }
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (doc: FlatDocRecord) => {
    if (!doc.filePath && !doc.fileId) {
      toast.error('No attached document file found');
      return;
    }

    const toastId = toast.loading(`Downloading ${doc.docNumber || doc.docType}...`);

    try {
      const serverBase = getServerUrl();
      const directApiUrl = doc.fileId
        ? `${serverBase}/api/employees/documents/${doc.fileId}/download`
        : `${serverBase}/${(doc.filePath || '').replace(/\\/g, '/').replace(/^\.?\/?/, '')}`;

      const res = await fetch(directApiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      triggerBlobDownload(blob, doc);
      toast.success('Document downloaded successfully!', { id: toastId });
    } catch (err) {
      console.warn('Direct fetch failed, trying direct browser navigation:', err);
      const serverBase = getServerUrl();
      const directUrl = doc.fileId
        ? `${serverBase}/api/employees/documents/${doc.fileId}/download`
        : `${serverBase}/${(doc.filePath || '').replace(/\\/g, '/').replace(/^\.?\/?/, '')}`;

      const link = document.createElement('a');
      link.href = directUrl;
      link.target = '_blank';
      link.download = doc.docNumber || `${doc.docType}_${doc.code}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss(toastId);
    }
  };

  const handleVerify = (employeeId: string) => {
    verifyMutation.mutate(employeeId);
  };

  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    uploadMutation.mutate();
  };

  const filteredDocs = useMemo(() => {
    return flatDocs.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedDocType === 'all'
          ? true
          : d.docType.toLowerCase().includes(selectedDocType.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [flatDocs, searchQuery, selectedDocType]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Document Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{flatDocs.length} Uploaded</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Digital copies stored</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Verified Vault</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {flatDocs.filter(d => d.status === 'VERIFIED').length} Verified
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">96.8% Audit Compliance</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Audit</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {flatDocs.filter(d => d.status === 'PENDING_VERIFICATION').length} Awaiting
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Requires manual audit</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance Rating</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">Grade A</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">External auditor ready</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Statutory Documents Verification Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="py-3 px-4 sm:px-6 border-b border-border/60 space-y-2.5">
          {/* 1. Header Title & Subtitle */}
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" /> Employee statutory verification vault
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Aadhaar, PAN, Passport, Education Degree Certificates &amp; Verification Auditing Statuses
            </CardDescription>
          </div>

          {/* 2. Controls Toolbar: Left Filters + Right Search/Upload (All in One Line, No Scroller) */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-hidden">
            {/* Left Controls: Company + Category Pills + Branch */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Company Selector */}
              {companies.length > 1 ? (
                <Select
                  value={selectedCompanyId ?? ''}
                  onValueChange={val => setSelectedCompanyId(val || undefined)}
                >
                  <SelectTrigger className="h-8 w-48 text-xs font-medium gap-1.5 px-2 bg-background whitespace-nowrap">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Select company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : companies.length === 1 ? (
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg bg-muted/40 border border-border text-xs font-medium text-foreground whitespace-nowrap">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[200px]">{companies[0].name}</span>
                </div>
              ) : null}

              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'aadhaar', label: 'Aadhaar' },
                  { id: 'pan', label: 'PAN' },
                  { id: 'passport', label: 'Passport' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedDocType(type.id)}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md capitalize transition-all ${
                      selectedDocType === type.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Branch Filter (Only for Super Admin / Company Admin) */}
              {isSuperOrCompanyAdmin && (
                <div className="relative">
                  <Select
                    value={selectedBranchFilter}
                    onValueChange={(val) => setSelectedBranchFilter(val)}
                  >
                    <SelectTrigger className="h-8 px-2 text-xs rounded-lg bg-background border-border/80 font-medium shadow-2xs hover:bg-muted/40 gap-1 w-auto whitespace-nowrap">
                      <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-muted-foreground text-[11px]">Branch:</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEAD_OFFICE" className="text-xs font-semibold">
                        Head Office
                      </SelectItem>
                      <SelectItem value="ALL" className="text-xs">
                        All Branches
                      </SelectItem>
                      {apiBranches
                        .filter((b: any) => !b.name?.toLowerCase().includes('head office'))
                        .map((b: any) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Right Controls: Search Bar + Upload Document Button */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <div className="relative w-28 sm:w-32">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-xs bg-background"
                />
              </div>

              {/* Upload Document Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs px-2.5 gap-1 shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Statutory Document</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 text-xs" onSubmit={handleAddDocSubmit}>
                    <div className="space-y-1.5">
                      <Label>Select Employee *</Label>
                      <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Choose employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id} className="text-xs">
                              {emp.firstName} {emp.lastName} ({emp.employeeCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Document Category Type *</Label>
                        <Select value={formType} onValueChange={v => setFormType(v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aadhaar Card" className="text-xs">Aadhaar Card</SelectItem>
                            <SelectItem value="PAN Card" className="text-xs">PAN Card</SelectItem>
                            <SelectItem value="Passport" className="text-xs">Passport</SelectItem>
                            <SelectItem value="Resume" className="text-xs">Resume / CV</SelectItem>
                            <SelectItem value="Offer Letter" className="text-xs">Offer Letter</SelectItem>
                            <SelectItem value="Joining Letter" className="text-xs">Joining Letter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Document Ref ID Number</Label>
                        <Input
                          placeholder="e.g. XXXX-XXXX-1234"
                          value={formNumber}
                          onChange={e => setFormNumber(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Attach File *</Label>
                      <Input
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs" disabled={uploadMutation.isPending}>
                        Publish & Submit Copy
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Emp Code</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Document Type</TableHead>
                <TableHead className="text-xs">Document Ref Number</TableHead>
                <TableHead className="text-xs">Verification Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    Loading statutory verification records...
                  </TableCell>
                </TableRow>
              ) : filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    No documents found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <TableRow key={`${doc.code}-${idx}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{doc.code}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{doc.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{doc.docType}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{doc.docNumber}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant="outline"
                          className={`text-[9.5px] font-semibold ${doc.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : doc.status === 'PENDING_VERIFICATION'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}
                        >
                          {doc.status === 'PENDING_VERIFICATION' ? 'PENDING' : doc.status}
                        </Badge>
                        {doc.status === 'VERIFIED' && (doc.verifiedByName || doc.verifiedAt) && (
                          <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                            {doc.verifiedByName && (
                              <p>
                                Verified by: <span className="font-medium text-foreground">{doc.verifiedByName}</span>
                              </p>
                            )}
                            {doc.verifiedAt && (
                              <p className="font-mono text-[9px] text-muted-foreground/80">
                                Verified at: {formatVerificationDate(doc.verifiedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === 'PENDING_VERIFICATION' && canVerifyDoc(doc) && doc.fileId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold transition-colors"
                            onClick={() => setDocToVerify(doc)}
                            disabled={verifyMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Verify
                          </Button>
                        )}
                        {doc.status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            ✓ Verified
                          </span>
                        )}
                        {(doc.filePath || doc.fileId) ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-500/10 transition-colors"
                              title={`View / Preview ${doc.docNumber || doc.docType}`}
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                              title={`Download ${doc.docNumber || doc.docType}`}
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic px-1">No file</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Confirmation Modal for Document Verification ── */}
      <Dialog open={Boolean(docToVerify)} onOpenChange={(open) => !open && setDocToVerify(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Confirm Document Verification
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to verify this document?
            </DialogDescription>
          </DialogHeader>

          {docToVerify && (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                <span className="text-muted-foreground">Employee:</span>
                <span className="font-semibold text-foreground">{docToVerify.name} ({docToVerify.code})</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                <span className="text-muted-foreground">Document Type:</span>
                <span className="font-semibold text-foreground">{docToVerify.docType}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted-foreground">Ref / File:</span>
                <span className="font-mono text-foreground font-medium">{docToVerify.docNumber}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setDocToVerify(null)}
              disabled={verifyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
              onClick={() => {
                if (docToVerify?.fileId) {
                  verifyMutation.mutate({
                    employeeId: docToVerify.employeeId,
                    documentId: docToVerify.fileId,
                    status: 'VERIFIED',
                  });
                }
              }}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Document Preview Modal ── */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="h-4 w-4 text-primary" /> {previewDoc?.docType}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                  {previewDoc?.name} ({previewDoc?.code}) &bull; Ref: {previewDoc?.docNumber}
                </DialogDescription>
              </div>
              {previewDoc && (
                <Badge
                  variant="outline"
                  className={`w-fit text-[10px] font-semibold ${
                    previewDoc.status === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : previewDoc.status === 'PENDING_VERIFICATION'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}
                >
                  {previewDoc.status === 'PENDING_VERIFICATION' ? 'PENDING' : previewDoc.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Preview Viewport */}
          <div className="flex-1 my-3 overflow-hidden rounded-lg border border-border/80 bg-muted/20 flex items-center justify-center min-h-[50vh] relative">
            {isLoadingPreview && (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-medium">Loading document preview...</p>
              </div>
            )}

            {previewError && !isLoadingPreview && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-xs font-medium text-foreground">{previewError}</p>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (previewDoc) {
                        const url = getDocumentViewUrl(previewDoc);
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Direct Link
                  </Button>
                </div>
              </div>
            )}

            {blobUrl && !isLoadingPreview && (
              (() => {
                const isImage = (previewDoc?.filePath || previewDoc?.docNumber || '')
                  .match(/\.(jpeg|jpg|png|webp|gif|svg)$/i);

                if (isImage) {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto max-h-[68vh]">
                      <img
                        src={blobUrl}
                        alt={previewDoc?.docType}
                        className="max-h-[64vh] max-w-full object-contain rounded-md shadow-sm border bg-white"
                      />
                    </div>
                  );
                }

                return (
                  <iframe
                    src={blobUrl}
                    title={previewDoc?.docType}
                    className="w-full h-[68vh] rounded-md border-0 bg-white"
                  />
                );
              })()
            )}
          </div>

          {/* Preview Footer */}
          <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              {previewDoc?.status === 'PENDING_VERIFICATION' && canVerifyDoc(previewDoc) && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                  onClick={() => {
                    setDocToVerify(previewDoc);
                    setPreviewDoc(null);
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verify This Document
                </Button>
              )}
              {previewDoc && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const url = getDocumentViewUrl(previewDoc);
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                </Button>
              )}
              {previewDoc && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleDownload(previewDoc)}
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPreviewDoc(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
