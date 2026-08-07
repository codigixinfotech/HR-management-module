import { useState, useMemo } from 'react';
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

interface DocRecord {
  code: string;
  name: string;
  docType: 'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Degree Certificate';
  docNumber: string;
  status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
}

const INITIAL_DOCS: DocRecord[] = [
  { code: 'EMP0001', name: 'Admin User', docType: 'Aadhaar Card', docNumber: 'XXXX-XXXX-8821', status: 'VERIFIED' },
  { code: 'EMP0002', name: 'Rajesh Sharma', docType: 'PAN Card', docNumber: 'ABCDE1234F', status: 'VERIFIED' },
  { code: 'EMP0003', name: 'Priya Verma', docType: 'Passport', docNumber: 'Z-9918231', status: 'VERIFIED' },
  { code: 'EMP0004', name: 'Amit Patel', docType: 'Degree Certificate', docNumber: 'UNI-2022-81', status: 'PENDING_VERIFICATION' },
];

export function DocumentVaultTab() {
  const [docs, setDocs] = useState<DocRecord[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Degree Certificate'>('Aadhaar Card');
  const [formNumber, setFormNumber] = useState('');

  const openAddModal = () => {
    setFormName('');
    setFormType('Aadhaar Card');
    setFormNumber('');
    setIsOpen(true);
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formNumber) {
      toast.error('Name and Document Number are required');
      return;
    }

    const newDoc: DocRecord = {
      code: `EMP000${docs.length + 1}`,
      name: formName,
      docType: formType,
      docNumber: formNumber,
      status: 'PENDING_VERIFICATION',
    };

    setDocs(prev => [...prev, newDoc]);
    toast.success('Document uploaded. Verification pending.');
    setIsOpen(false);
  };

  const handleVerify = (code: string, docType: string) => {
    setDocs(prev =>
      prev.map(d =>
        d.code === code && d.docType === docType ? { ...d, status: 'VERIFIED' } : d,
      ),
    );
    toast.success('Document successfully verified!');
  };

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedDocType === 'all' ? true : d.docType.toLowerCase() === selectedDocType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [docs, searchQuery, selectedDocType]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Document Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Documents</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{docs.length} Uploaded</p>
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {docs.filter(d => d.status === 'VERIFIED').length} Verified
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {docs.filter(d => d.status === 'PENDING_VERIFICATION').length} Awaiting
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
              <p className=" text-2xl font-semibold text-foreground mt-0.5">Grade A</p>
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
                  { id: 'aadhaar card', label: 'Aadhaar' },
                  { id: 'pan card', label: 'PAN' },
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
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Statutory Document</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddDoc}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Employee Name</Label>
                      <Input
                        placeholder="e.g. Amit Patel"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Document Category Type</Label>
                        <Select value={formType} onValueChange={v => setFormType(v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aadhaar Card" className="text-xs">Aadhaar Card</SelectItem>
                            <SelectItem value="PAN Card" className="text-xs">PAN Card</SelectItem>
                            <SelectItem value="Passport" className="text-xs">Passport</SelectItem>
                            <SelectItem value="Degree Certificate" className="text-xs">Degree Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Document Ref ID Number</Label>
                        <Input
                          placeholder="e.g. XXXX-XXXX-1234"
                          value={formNumber}
                          onChange={e => setFormNumber(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
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
              {filteredDocs.map((doc, idx) => (
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
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {doc.status === 'PENDING_VERIFICATION' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleVerify(doc.code, doc.docType)}
                      >
                        Verify Doc
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Download Document">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
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
