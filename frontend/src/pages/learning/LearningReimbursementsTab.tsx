import { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  Building2,
  Download,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { lmsApi } from '@/services/lmsApi';
import type { LearningReimbursement } from './types';

export function LearningReimbursementsTab() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  const [reimbursements, setReimbursements] = useState<LearningReimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LearningReimbursement | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form State for Employee Submission
  const [formData, setFormData] = useState({
    courseTitle: '',
    provider: '',
    courseUrl: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseAmount: '' as any,
    currency: 'INR',
    invoiceNumber: '',
    invoiceFileUrl: '',
    certificateFileUrl: '',
    certificateNumber: '',
    certificateIssueDate: '',
    requestedAmount: '' as any,
  });

  // Review / Approval Action State
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const data = isHrOrAdmin
        ? await lmsApi.getReimbursements()
        : await lmsApi.getMyReimbursements();
      setReimbursements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load reimbursements:', err);
      toast.error('Failed to load reimbursement records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, [isHrOrAdmin]);

  const filteredItems = reimbursements.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const empName = r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase() : '';
      return (
        r.courseTitle.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        empName.includes(q)
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalCount = reimbursements.length;
  const pendingCount = reimbursements.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length;
  const approvedCount = reimbursements.filter((r) => r.status === 'APPROVED' || r.status === 'PAYMENT_PENDING').length;
  const paidCount = reimbursements.filter((r) => r.status === 'PAID').length;
  const totalPaidAmount = reimbursements
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + (r.paidAmount || 0), 0);

  // Submit Handler
  const handleSubmitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseTitle.trim()) {
      toast.error('Course title is required.');
      return;
    }
    if (formData.purchaseAmount <= 0) {
      toast.error('Valid purchase amount is required.');
      return;
    }

    try {
      await lmsApi.submitReimbursement({
        ...formData,
        requestedAmount: Number(formData.requestedAmount) || Number(formData.purchaseAmount),
        purchaseAmount: Number(formData.purchaseAmount),
      });
      toast.success('Reimbursement claim submitted successfully to HR!');
      setIsSubmitModalOpen(false);
      setFormData({
        courseTitle: '',
        provider: '',
        courseUrl: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseAmount: '' as any,
        currency: 'INR',
        invoiceNumber: '',
        invoiceFileUrl: '',
        certificateFileUrl: '',
        certificateNumber: '',
        certificateIssueDate: '',
        requestedAmount: '' as any,
      });
      fetchReimbursements();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit reimbursement claim.');
    }
  };

  // Approval Handlers
  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      await lmsApi.approveReimbursement(selectedItem.id, approvedAmount || selectedItem.requestedAmount);
      toast.success(`Reimbursement approved for ₹${(approvedAmount || selectedItem.requestedAmount).toLocaleString('en-IN')}.`);
      setIsReviewModalOpen(false);
      fetchReimbursements();
    } catch (err) {
      toast.error('Failed to approve reimbursement.');
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    try {
      await lmsApi.rejectReimbursement(selectedItem.id, rejectionReason);
      toast.info('Reimbursement rejected.');
      setIsReviewModalOpen(false);
      fetchReimbursements();
    } catch (err) {
      toast.error('Failed to reject reimbursement.');
    }
  };

  const handleMarkPaymentPending = async () => {
    if (!selectedItem) return;
    try {
      await lmsApi.markReimbursementPaymentPending(selectedItem.id);
      toast.success('Status updated to Payment Pending.');
      setIsReviewModalOpen(false);
      fetchReimbursements();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedItem) return;
    try {
      await lmsApi.markReimbursementPaid(selectedItem.id, {
        paidAmount: approvedAmount || selectedItem.approvedAmount || selectedItem.requestedAmount,
        paymentReference: paymentReference || `PAY-${Date.now().toString().slice(-6)}`,
      });
      toast.success('Payment completed! Verified certificate and skill progression added to employee profile.');
      setIsReviewModalOpen(false);
      fetchReimbursements();
    } catch (err) {
      toast.error('Failed to record payment.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30">Approved</Badge>;
      case 'PAYMENT_PENDING':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Payment Pending</Badge>;
      case 'PAID':
        return <Badge variant="default" className="bg-emerald-600 text-white">Paid</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" /> Employee Learning Reimbursements
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              Personal Course Claims
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Claim reimbursement for personally purchased external professional courses, certification exams, and learning invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" /> Claim Reimbursement
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3.5 border-l-4 border-l-primary shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Claims</p>
              <h3 className="text-xl font-bold font-mono text-foreground mt-0.5">{totalCount}</h3>
            </div>
            <FileText className="h-7 w-7 text-primary/30" />
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Review</p>
              <h3 className="text-xl font-bold font-mono text-amber-600 mt-0.5">{pendingCount}</h3>
            </div>
            <Clock className="h-7 w-7 text-amber-500/30" />
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-indigo-500 shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approved</p>
              <h3 className="text-xl font-bold font-mono text-indigo-600 mt-0.5">{approvedCount}</h3>
            </div>
            <CheckCircle2 className="h-7 w-7 text-indigo-500/30" />
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-emerald-500 shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Paid</p>
              <h3 className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                ₹{totalPaidAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            <CreditCard className="h-7 w-7 text-emerald-500/30" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search course, provider, employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'SUBMITTED', 'APPROVED', 'PAYMENT_PENDING', 'PAID', 'REJECTED'].map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? 'default' : 'outline'}
              onClick={() => setStatusFilter(st)}
              className="text-xs h-7 px-2.5"
            >
              {st === 'All' ? 'All Claims' : st.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <Card className="shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading reimbursement records from MySQL...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h4 className="text-sm font-semibold text-foreground">No Reimbursement Claims Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isHrOrAdmin
                ? 'No employee reimbursement requests have been submitted.'
                : 'You have not submitted any external learning reimbursement claims yet.'}
            </p>
            <Button size="sm" onClick={() => setIsSubmitModalOpen(true)} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Submit a Reimbursement Claim
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] bg-muted/40">
                <TableHead>COURSE & PROVIDER</TableHead>
                {isHrOrAdmin && <TableHead>EMPLOYEE</TableHead>}
                <TableHead>PURCHASE DATE</TableHead>
                <TableHead className="text-right">CLAIM AMOUNT</TableHead>
                <TableHead className="text-right">APPROVED / PAID</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-semibold text-foreground">{item.courseTitle}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span>{item.provider}</span>
                      {item.courseUrl && (
                        <a href={item.courseUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>

                  {isHrOrAdmin && (
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : item.employeeId}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {item.employee?.employeeCode || item.employeeId}
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-muted-foreground font-mono text-[11px]">
                    {item.purchaseDate ? item.purchaseDate.split('T')[0] : 'N/A'}
                  </TableCell>

                  <TableCell className="text-right font-mono font-semibold">
                    ₹{item.requestedAmount.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell className="text-right font-mono font-semibold">
                    {item.paidAmount ? (
                      <span className="text-emerald-600">₹{item.paidAmount.toLocaleString('en-IN')}</span>
                    ) : item.approvedAmount ? (
                      <span className="text-indigo-600">₹{item.approvedAmount.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setApprovedAmount(item.approvedAmount || item.requestedAmount);
                        setRejectionReason(item.rejectionReason || '');
                        setIsReviewModalOpen(true);
                      }}
                      className="text-xs h-7 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* MODAL 1: EMPLOYEE SUBMIT CLAIM */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmitReimbursement} className="space-y-4 text-xs">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Submit Learning Reimbursement Claim
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upload your external course invoice and certificate to claim reimbursement under company L&D policy.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="courseTitle" className="text-xs font-semibold">Course Title *</Label>
                <Input
                  id="courseTitle"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={formData.courseTitle}
                  onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="provider" className="text-xs font-semibold">Provider / Platform *</Label>
                <Input
                  id="provider"
                  placeholder="e.g. Coursera, Udemy, edX"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="courseUrl" className="text-xs font-semibold">Course URL</Label>
                <Input
                  id="courseUrl"
                  placeholder="https://..."
                  value={formData.courseUrl}
                  onChange={(e) => setFormData({ ...formData, courseUrl: e.target.value })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="purchaseDate" className="text-xs font-semibold">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="purchaseAmount" className="text-xs font-semibold">Amount Paid (₹) *</Label>
                <Input
                  id="purchaseAmount"
                  type="number"
                  min="0"
                  placeholder="e.g. 4500"
                  value={formData.purchaseAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchaseAmount: e.target.value === '' ? ('' as any) : Number(e.target.value),
                      requestedAmount: e.target.value === '' ? ('' as any) : Number(e.target.value),
                    })
                  }
                  required
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="invoiceNumber" className="text-xs font-semibold">Invoice / Order Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-2026-904"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="certificateNumber" className="text-xs font-semibold">Certificate Number (Optional)</Label>
                <Input
                  id="certificateNumber"
                  placeholder="CERT-AWS-12345"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  className="text-xs h-8"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="invoiceFileUrl" className="text-xs font-semibold">Invoice / Payment Proof File URL</Label>
                <Input
                  id="invoiceFileUrl"
                  placeholder="https://storage.example/invoices/my-invoice.pdf"
                  value={formData.invoiceFileUrl}
                  onChange={(e) => setFormData({ ...formData, invoiceFileUrl: e.target.value })}
                  className="text-xs h-8"
                />
                <span className="text-[10px] text-muted-foreground">Attach direct link or cloud receipt URL</span>
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="certificateFileUrl" className="text-xs font-semibold">Completion Certificate File URL</Label>
                <Input
                  id="certificateFileUrl"
                  placeholder="https://storage.example/certs/completion-certificate.pdf"
                  value={formData.certificateFileUrl}
                  onChange={(e) => setFormData({ ...formData, certificateFileUrl: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex items-center justify-between">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" className="bg-primary text-primary-foreground font-semibold px-4">
                Submit Claim (₹{formData.purchaseAmount.toLocaleString('en-IN')})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: INSPECT / APPROVE / PAY CLAIM */}
      {selectedItem && isReviewModalOpen && (
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="space-y-4 text-xs">
              <DialogHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">{selectedItem.id}</Badge>
                  {getStatusBadge(selectedItem.status)}
                </div>
                <DialogTitle className="text-base font-bold text-foreground mt-1.5">
                  {selectedItem.courseTitle}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Provider: <strong>{selectedItem.provider}</strong> | Claimed by:{' '}
                  <strong>
                    {selectedItem.employee
                      ? `${selectedItem.employee.firstName} ${selectedItem.employee.lastName} (${selectedItem.employee.employeeCode})`
                      : selectedItem.employeeId}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-card border text-center font-mono">
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block font-sans">Purchase Price</span>
                  <strong className="text-sm font-bold text-foreground">₹{selectedItem.purchaseAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-[10px] text-muted-foreground block font-sans">Claimed</span>
                  <strong className="text-sm font-extrabold text-primary">₹{selectedItem.requestedAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-muted-foreground block font-sans">Approved / Paid</span>
                  <strong className="text-sm font-extrabold text-emerald-600">
                    ₹{(selectedItem.paidAmount || selectedItem.approvedAmount || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Proof Documents & Verification */}
              <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Submitted Verification Documents
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Invoice No:</span>
                    <strong>{selectedItem.invoiceNumber || 'Not Specified'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Certificate No:</span>
                    <strong>{selectedItem.certificateNumber || 'Not Specified'}</strong>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {selectedItem.invoiceFileUrl ? (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" asChild>
                      <a href={selectedItem.invoiceFileUrl} target="_blank" rel="noreferrer">
                        <FileText className="h-3 w-3" /> View Invoice Proof
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">No Invoice Attached</Badge>
                  )}

                  {selectedItem.certificateFileUrl ? (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" asChild>
                      <a href={selectedItem.certificateFileUrl} target="_blank" rel="noreferrer">
                        <Download className="h-3 w-3" /> View Certificate Proof
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">No Certificate Attached</Badge>
                  )}
                </div>
              </div>

              {/* HR Actions Section */}
              {isHrOrAdmin && (
                <div className="space-y-3 border-t pt-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">HR / Finance Actions</h4>

                  {selectedItem.status === 'SUBMITTED' || selectedItem.status === 'UNDER_REVIEW' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px] font-semibold">Approved Amount (₹)</Label>
                          <Input
                            type="number"
                            value={approvedAmount}
                            onChange={(e) => setApprovedAmount(Number(e.target.value))}
                            className="text-xs h-8 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-semibold">Rejection Reason (If rejecting)</Label>
                          <Input
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="text-xs h-8 mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="destructive" onClick={handleReject} className="text-xs">
                          Reject Claim
                        </Button>
                        <Button size="sm" onClick={handleApprove} className="text-xs bg-primary text-primary-foreground font-semibold">
                          Approve ₹{approvedAmount.toLocaleString('en-IN')}
                        </Button>
                      </div>
                    </div>
                  ) : selectedItem.status === 'APPROVED' ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={handleMarkPaymentPending} className="text-xs">
                        Mark Payment Pending
                      </Button>
                      <Button size="sm" onClick={handleMarkPaid} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        Disburse Payment & Complete
                      </Button>
                    </div>
                  ) : selectedItem.status === 'PAYMENT_PENDING' ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[11px] font-semibold">Bank / Payroll Transaction Reference</Label>
                        <Input
                          placeholder="e.g. TXN-HDFC-948281"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={handleMarkPaid} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                          Confirm Payment Paid
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> This reimbursement has been finalized and paid.
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="border-t pt-3">
                <Button size="sm" variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
