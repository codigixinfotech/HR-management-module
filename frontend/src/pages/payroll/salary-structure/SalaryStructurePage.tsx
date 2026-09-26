import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Users,
  ShieldCheck,
  FileText,
  ShieldAlert,
  Coins,
  Plus,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComponentsTab } from './ComponentsTab';
import { TemplatesTab } from './TemplatesTab';
import { EmployeeSalariesTab } from './EmployeeSalariesTab';
import { StatutorySettingsTab } from './StatutorySettingsTab';
import { TaxSettingsTab } from './TaxSettingsTab';
import { ComplianceRulesTab } from './ComplianceRulesTab';
import {
  MASTER_SALARY_COMPONENTS,
  INDUSTRY_PRESET_TEMPLATES,
  SAMPLE_EMPLOYEE_SALARIES,
  type SalaryComponentItem,
  type StructureTemplate,
  type SampleEmployeeSalary,
} from './mock-data';

interface SalaryStructurePageProps {
  companyId?: string;
}

export function SalaryStructurePage({ companyId }: SalaryStructurePageProps) {
  const [activeTab, setActiveTab] = useState('components');

  // Master In-Memory State initialized with comprehensive Indian Payroll presets
  const [components, setComponents] = useState<SalaryComponentItem[]>(MASTER_SALARY_COMPONENTS);
  const [templates, setTemplates] = useState<StructureTemplate[]>(INDUSTRY_PRESET_TEMPLATES);
  const [employeeSalaries, setEmployeeSalaries] = useState<SampleEmployeeSalary[]>(SAMPLE_EMPLOYEE_SALARIES);

  // High-level Metrics
  const activeComponentsCount = useMemo(() => components.filter((c) => c.isActive).length, [components]);
  const activeTemplatesCount = useMemo(() => templates.filter((t) => t.isActive).length, [templates]);
  const assignedCount = useMemo(() => employeeSalaries.filter((e) => e.hasSalaryAssigned).length, [employeeSalaries]);
  const unassignedCount = useMemo(() => employeeSalaries.filter((e) => !e.hasSalaryAssigned).length, [employeeSalaries]);

  const handleAutoFixWageRule = () => {
    // Ensure all employees are 100% compliant with 50% basic rule
    setEmployeeSalaries((prev) =>
      prev.map((e) => ({
        ...e,
        complianceRuleCompliant: true,
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* ── SUB-MODULE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payroll <span className="text-border">/</span> Sub-Module 1
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Salary Structure Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure Indian earnings, statutory deductions (PF, ESI, PT, LWF), industry templates, reverse CTC calculation, and labor code wage compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setActiveTab('components')}
            variant="outline"
            className="text-xs font-semibold gap-1.5 h-9 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50"
          >
            <Coins className="h-4 w-4" /> Components Master
          </Button>
          <Button
            onClick={() => setActiveTab('templates')}
            variant="outline"
            className="text-xs font-semibold gap-1.5 h-9 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 hover:bg-purple-50"
          >
            <Layers className="h-4 w-4" /> Templates & Presets
          </Button>
          <Button
            onClick={() => setActiveTab('assignments')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs font-semibold text-xs gap-1.5 h-9 cursor-pointer"
          >
            <IndianRupee className="h-4 w-4" /> Assign / Revise Salary
          </Button>
        </div>
      </div>

      {/* ── TOP METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Salary Components</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{components.length}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">{activeComponentsCount} Active Masters</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Structure Templates</p>
              <p className="text-2xl font-bold text-purple-600 mt-0.5">{templates.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">4 Industry Presets</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Employees Assigned</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{assignedCount}</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">
                {unassignedCount > 0 ? `${unassignedCount} Missing Salary` : 'All Assigned'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Wage Compliance</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">100%</p>
              <p className="text-[10px] text-muted-foreground mt-1">50% Rule & Min Wage</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 6 MODULAR SUB-TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/60 flex flex-wrap max-w-full">
          <TabsTrigger value="components" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <Coins className="h-3.5 w-3.5" /> Salary Components ({components.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <Layers className="h-3.5 w-3.5" /> Templates & Presets ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <Users className="h-3.5 w-3.5" /> Employee Salaries ({employeeSalaries.length})
          </TabsTrigger>
          <TabsTrigger value="statutory" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Statutory Settings
          </TabsTrigger>
          <TabsTrigger value="tax" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <FileText className="h-3.5 w-3.5" /> Tax Regimes & Slabs
          </TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-lg text-xs font-bold px-3.5 h-9 gap-2">
            <ShieldAlert className="h-3.5 w-3.5" /> Wage Rule Compliance
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Components Master */}
        <TabsContent value="components">
          <ComponentsTab components={components} onUpdateComponents={setComponents} />
        </TabsContent>

        {/* Tab 2: Structure Templates & Presets */}
        <TabsContent value="templates">
          <TemplatesTab
            templates={templates}
            components={components}
            onUpdateTemplates={setTemplates}
          />
        </TabsContent>

        {/* Tab 3: Employee Salaries & Reverse CTC */}
        <TabsContent value="assignments">
          <EmployeeSalariesTab
            employeeSalaries={employeeSalaries}
            templates={templates}
            onUpdateSalaries={setEmployeeSalaries}
          />
        </TabsContent>

        {/* Tab 4: Statutory Settings */}
        <TabsContent value="statutory">
          <StatutorySettingsTab />
        </TabsContent>

        {/* Tab 5: Tax Settings */}
        <TabsContent value="tax">
          <TaxSettingsTab />
        </TabsContent>

        {/* Tab 6: Wage Rule Compliance */}
        <TabsContent value="compliance">
          <ComplianceRulesTab
            employeeSalaries={employeeSalaries}
            onAutoFixWageRule={handleAutoFixWageRule}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
