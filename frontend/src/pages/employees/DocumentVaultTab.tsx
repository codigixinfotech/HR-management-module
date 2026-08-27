import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';

interface FlatDocRecord {
  employeeId: string;
  code: string;
  name: string;
  docType: string;
  docNumber: string;
  status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  fileId?: string;
  filePath?: string;
}

export function DocumentVaultTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formType, setFormType] = useState<'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Resume' | 'Offer Letter' | 'Joining Letter'>('Aadhaar Card');
  const [formNumber, setFormNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load database employees
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const employees = employeesData?.items ?? [];

  // Flatten database employees and their documents into single records
  const flatDocs = useMemo<FlatDocRecord[]>(() => {
    const list: FlatDocRecord[] = [];
    employees.forEach(emp => {
      const name = `${emp.firstName} ${emp.lastName}`;
      const code = emp.employeeCode;
      const kycStatus = emp.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING_VERIFICATION';

      // 1. Aadhaar Card
      if (emp.aadhaarNumber) {
        list.push({
          employeeId: emp.id,
          code,
          name,
          docType: 'Aadhaar Card',
          docNumber: emp.aadhaarNumber,
          status: kycStatus,
        });
      }

      // 2. PAN Card
      if (emp.panNumber) {
        list.push({
          employeeId: emp.id,
          code,
          name,
          docType: 'PAN Card',
          docNumber: emp.panNumber,
          status: kycStatus,
        });
      }

      // 3. Passport
      if (emp.passportNumber) {
        list.push({
          employeeId: emp.id,
          code,
          name,
          docType: 'Passport',
          docNumber: emp.passportNumber,
          status: kycStatus,
        });
      }

      // 4. File uploads from vault relation
      if (emp.documents && Array.isArray(emp.documents)) {
        emp.documents.forEach((doc: any) => {
          let friendlyType = doc.docType;
          if (doc.docType === 'ID_PROOF') friendlyType = 'Aadhaar Card';
          else if (doc.docType === 'ADDRESS_PROOF') friendlyType = 'PAN Card';
          else if (doc.docType === 'EDUCATION') friendlyType = 'Degree Certificate';
          else if (doc.docType === 'OFFER_LETTER') friendlyType = 'Offer Letter';

          // Avoid duplicating if we already render the structural placeholder
          if (['Aadhaar Card', 'PAN Card', 'Passport'].includes(friendlyType)) {
            // Find placeholder and associate file path
            const existingPlaceholder = list.find(l => l.employeeId === emp.id && l.docType === friendlyType);
            if (existingPlaceholder) {
              existingPlaceholder.filePath = doc.filePath;
              existingPlaceholder.fileId = doc.id;
              return;
            }
          }

          list.push({
            employeeId: emp.id,
            code,
            name,
            docType: friendlyType,
            docNumber: doc.fileName,
            status: kycStatus,
            fileId: doc.id,
            filePath: doc.filePath,
          });
        });
      }
    });
    return list;
  }, [employees]);

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (employeeId: string) =>
      employeesApi.update(employeeId, {
        kycStatus: 'VERIFIED',
        kycVerificationDate: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Document successfully verified!');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployeeId || !selectedFile) return;
      
      // 1. Upload file if selected
      let docTypeMapping = 'OTHER';
      if (formType === 'Aadhaar Card') docTypeMapping = 'ID_PROOF';
      else if (formType === 'PAN Card') docTypeMapping = 'ADDRESS_PROOF';
      else if (formType === 'Resume') docTypeMapping = 'EDUCATION';
      else if (formType === 'Offer Letter') docTypeMapping = 'OFFER_LETTER';

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
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Employee statutory verification vault
              </CardTitle>
              <CardDescription className="text-xs">
                Aadhaar, PAN, Passport, Education Degree Certificates & Verification Auditing Statuses
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Docs' },
                  { id: 'aadhaar', label: 'Aadhaar' },
                  { id: 'pan', label: 'PAN' },
                  { id: 'passport', label: 'Passport' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedDocType(type.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedDocType === type.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Upload Document Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5">
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
                      <Badge
                        variant="outline"
                        className={`text-[9.5px] font-semibold ${doc.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : doc.status === 'PENDING_VERIFICATION'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === 'PENDING_VERIFICATION' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                            onClick={() => handleVerify(doc.employeeId)}
                            disabled={verifyMutation.isPending}
                          >
                            Verify Doc
                          </Button>
                        )}
                        {doc.filePath && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Download Document"
                            onClick={() => {
                              const serverBaseUrl =
                                import.meta.env.VITE_SERVER_URL ||
                                (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : typeof window !== 'undefined' ? window.location.origin : '');
                              const normalizedPath = doc.filePath.startsWith('/') ? doc.filePath : `/${doc.filePath}`;
                              window.open(`${serverBaseUrl}${normalizedPath}`, '_blank');
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
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
    </div>
  );
}
