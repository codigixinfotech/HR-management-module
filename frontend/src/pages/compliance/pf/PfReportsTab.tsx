import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileBarChart,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export interface PfReportsTabProps {
  selectedPeriod: string;
}

export function PfReportsTab({ selectedPeriod }: PfReportsTabProps) {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const handleExport = (reportName: string, format: 'CSV' | 'EXCEL' | 'PDF') => {
    setDownloadingReport(`${reportName}-${format}`);
    setTimeout(() => setDownloadingReport(null), 1000);
  };

  const reportsList = [
    {
      id: 'emp-statement',
      title: 'Employee-wise Monthly PF Statement',
      description: 'Individual employee UAN numbers, PF Member IDs, Basic+DA wage, 12% employee deduction & employer split',
      format: 'CSV / Excel / PDF',
      category: 'Monthly Return',
    },
    {
      id: 'monthly-summary',
      title: 'Monthly Statutory PF Return Summary',
      description: 'Consolidated company-wide EPF, EPS, EDLI, admin charges & total statutory liability for EPFO filing',
      format: 'CSV / Excel / PDF',
      category: 'Compliance Summary',
    },
    {
      id: 'dept-breakup',
      title: 'Department-wise PF Liability Register',
      description: 'Departmental breakdown of PF eligible headcount, total PF wages, employee deductions & employer liability',
      format: 'Excel / PDF',
      category: 'Management Audit',
    },
    {
      id: 'eps-edli-register',
      title: 'EPS Pension & EDLI Contribution Register',
      description: 'Specific allocation breakdown of 8.33% EPS pension fund & 0.50% EDLI insurance contributions',
      format: 'CSV / Excel',
      category: 'Pension Audit',
    },
    {
      id: 'form-3a-6a',
      title: 'Annual Form 3A & Form 6A PF Summary',
      description: 'Annual statutory PF member contribution cards and consolidated annual return summary for EPFO audits',
      format: 'PDF / Excel',
      category: 'Annual Filing',
    },
    {
      id: 'reconciliation-audit',
      title: 'PF Statutory Reconciliation & Audit Log',
      description: 'Financial 3-way reconciliation report comparing Payroll, PF calculation engine, ECR text file & TRRN bank clearing',
      format: 'PDF / Excel',
      category: 'Financial Audit',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER BANNER ── */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-purple-600" /> Statutory Provident Fund Reports Suite
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download EPFO compliant monthly registers, Form 3A/6A statements, and statutory audit reports for {selectedPeriod}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('All-PF-Reports', 'PDF')}
            className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print All Statements
          </Button>
        </div>
      </div>

      {/* ── REPORTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((report) => (
          <Card key={report.id} className="border-border/80 shadow-xs hover:border-purple-500/40 transition-all">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0">
                  {report.category}
                </Badge>
                <span className="text-[10.5px] text-muted-foreground font-semibold">{report.format}</span>
              </div>
              <CardTitle className="text-sm font-bold mt-1.5 text-foreground">{report.title}</CardTitle>
              <CardDescription className="text-xs">{report.description}</CardDescription>
            </CardHeader>

            <CardContent className="p-4 flex items-center justify-end gap-2 bg-muted/10">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport(report.id, 'CSV')}
                disabled={downloadingReport === `${report.id}-CSV`}
                className="h-7 text-[11px] font-bold gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-purple-600" /> CSV
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport(report.id, 'EXCEL')}
                disabled={downloadingReport === `${report.id}-EXCEL`}
                className="h-7 text-[11px] font-bold gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Excel
              </Button>

              <Button
                size="sm"
                onClick={() => handleExport(report.id, 'PDF')}
                disabled={downloadingReport === `${report.id}-PDF`}
                className="h-7 text-[11px] font-bold bg-primary hover:bg-primary/90 text-white gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3" /> PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
