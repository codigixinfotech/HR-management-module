import { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Download,
  ShieldCheck,
  Eye,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { INITIAL_CERTIFICATES, type IssuedCertificate, type CertificateTemplate } from './mockTrainingData';
import { CreateCertificateModal } from './CreateCertificateModal';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';

export function CertificationsTab() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  const [certificates, setCertificates] = useState<IssuedCertificate[]>(INITIAL_CERTIFICATES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter for employee view vs admin view
  const myCertificates = useMemo(() => {
    if (isHrOrAdmin) return certificates;
    return certificates.filter(
      (c) => c.employeeId === user?.id || c.employeeId === 'EMP-001' || c.employeeName.toLowerCase().includes('sanika') || c.employeeName.toLowerCase().includes('priya')
    );
  }, [certificates, isHrOrAdmin, user]);

  const totalIssued = myCertificates.filter((c) => c.status === 'VERIFIED').length;
  const eligibleCount = isHrOrAdmin ? 14 : 1;
  const expiringSoonCount = myCertificates.filter((c) => c.status === 'EXPIRING_SOON').length;
  const expiredCount = myCertificates.filter((c) => c.status === 'EXPIRED').length;

  const filteredCertificates = useMemo(() => {
    return myCertificates.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.employeeName.toLowerCase().includes(q) && !c.credentialTitle.toLowerCase().includes(q) && !c.verificationCode.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      return true;
    });
  }, [myCertificates, searchQuery, statusFilter]);

  const handleRevoke = (id: string) => {
    setCertificates(certificates.filter((c) => c.id !== id));
  };

  const handleSaveTemplate = (tpl: CertificateTemplate) => {
    // Add mock issued certificate derived from new template
    const newCert: IssuedCertificate = {
      id: `CERT-${Date.now().toString().slice(-4)}`,
      employeeId: 'EMP-005',
      employeeName: 'Vikas Kumar',
      credentialTitle: tpl.name,
      courseName: tpl.relatedCourse,
      issueDate: '2026-09-03',
      expiryDate: '2028-09-03',
      verificationCode: `CRT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'VERIFIED',
    };
    setCertificates([newCert, ...certificates]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" /> Issued Certifications & Digital Credentials
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage verifiable workforce certifications, issue digital badges, and track credential expiration registers
          </p>
        </div>

        {isHrOrAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Create Certificate Template
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Total Issued</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{totalIssued}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">Eligible Employees</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">{eligibleCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Expiring Soon</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{expiringSoonCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-destructive font-medium block">Expired Credentials</span>
            <span className="text-2xl font-extrabold text-destructive">{expiredCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search employee or credential code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs h-8 w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Download className="h-3.5 w-3.5" /> Export Register
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Employee</TableHead>
                <TableHead className="text-xs font-bold">Credential Title</TableHead>
                <TableHead className="text-xs font-bold">Issue Date</TableHead>
                <TableHead className="text-xs font-bold">Expiry Date</TableHead>
                <TableHead className="text-xs font-bold">Verification Code</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-semibold text-foreground">{c.employeeName}</TableCell>
                  <TableCell className="text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> {c.credentialTitle}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.issueDate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.expiryDate}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold">{c.verificationCode}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={c.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                        <Eye className="h-3 w-3" /> Preview
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(c.id)} className="h-6 text-[10px] gap-1 text-destructive">
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <CreateCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
