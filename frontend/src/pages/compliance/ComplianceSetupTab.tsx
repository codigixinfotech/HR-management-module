import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCompany } from '@/context/CompanyContext';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Save,
  RotateCcw,
  Sliders,
  FileText,
  HeartPulse,
  Receipt,
  Calculator,
  Scale,
  Lock,
  Info,
  Clock,
  UserCheck,
  Check,
  HelpCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';

import { complianceSetupApi } from '@/api/compliance';
import type { Company, ComplianceSetupRecord } from '@/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ComplianceSetupTabProps {
  companyId?: string;
  companies?: Company[];
}

const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Delhi',
  'Telangana',
  'Gujarat',
  'West Bengal',
  'Haryana',
  'Uttar Pradesh',
  'Rajasthan',
  'Kerala',
  'Andhra Pradesh',
  'Punjab',
  'Madhya Pradesh',
  'Odisha',
];

const ESTABLISHMENT_TYPES = [
  'Commercial Establishment',
  'Factory & Manufacturing Unit',
  'IT / ITES Software Park',
  'Branch & Divisional Office',
  'Headquarters / Corporate Office',
  'Shops & Retail Establishment',
];

const FINANCIAL_YEARS = ['2026-2027', '2025-2026', '2024-2025'];

export function ComplianceSetupTab({ companyId, companies = [] }: ComplianceSetupTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { activeCompanyId, setActiveCompanyId, companies: contextCompanies } = useCompany();

  const availableCompanies = companies.length > 0 ? companies : contextCompanies;
  const urlCompanyId = searchParams.get('companyId');
  const selectedCompanyId = urlCompanyId || companyId || activeCompanyId || availableCompanies[0]?.id || 'default-company';

  const handleCompanySelect = (newId: string) => {
    setActiveCompanyId(newId);
    setSearchParams({ companyId: newId });
  };

  // Fetch current setup
  const {
    data: setupData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['compliance-setup', selectedCompanyId],
    queryFn: () => complianceSetupApi.get(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  // Fetch version history
  const { data: historyData = [] } = useQuery({
    queryKey: ['compliance-setup-history', selectedCompanyId],
    queryFn: () => complianceSetupApi.getHistory(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  // Form State
  const [formData, setFormData] = useState<Partial<ComplianceSetupRecord>>({
    state: 'Maharashtra',
    establishmentType: 'Commercial Establishment',
    financialYear: '2026-2027',
    effectiveFrom: '2026-04-01',
    pfApplicable: true,
    esicApplicable: true,
    ptApplicable: true,
    tdsApplicable: true,
    labourComplianceApplicable: true,
    payrollComplianceFrequency: 'Monthly',
    complianceCalendarEnabled: true,
    dueDateNotificationsEnabled: true,
    complianceValidationEnabled: true,
    requireComplianceBeforePayroll: true,
  });

  const [initialData, setInitialData] = useState<Partial<ComplianceSetupRecord>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Modals state
  const [deactivateTarget, setDeactivateTarget] = useState<{ key: string; label: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ComplianceSetupRecord | null>(null);

  // Sync data when loaded
  useEffect(() => {
    if (setupData) {
      const formattedData: Partial<ComplianceSetupRecord> = {
        ...setupData,
        effectiveFrom: setupData.effectiveFrom ? setupData.effectiveFrom.split('T')[0] : '2026-04-01',
      };
      setFormData(formattedData);
      setInitialData(formattedData);
      setIsDirty(false);
    }
  }, [setupData]);

  // Check form dirtiness
  const updateFormField = (key: keyof ComplianceSetupRecord, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      const dirty = JSON.stringify(updated) !== JSON.stringify(initialData);
      setIsDirty(dirty);
      return updated;
    });
  };

  // Toggle compliance card applicability with confirmation if turning off
  const handleComplianceToggle = (key: keyof ComplianceSetupRecord, label: string, currentVal: boolean) => {
    if (currentVal) {
      // Turning off -> Prompt confirmation modal
      setDeactivateTarget({ key: key as string, label });
    } else {
      // Turning on directly
      updateFormField(key, true);
    }
  };

  const confirmDeactivation = () => {
    if (deactivateTarget) {
      updateFormField(deactivateTarget.key as keyof ComplianceSetupRecord, false);
      toast.warning(`${deactivateTarget.label} set to Inactive for this entity`);
      setDeactivateTarget(null);
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, createdAt, updatedAt, ...cleanData } = formData as any;
      const payload = {
        ...cleanData,
        companyId: selectedCompanyId,
        entityId: selectedCompanyId,
        effectiveFrom: formData.effectiveFrom ? formData.effectiveFrom.split('T')[0] : '2026-04-01',
      };

      return await complianceSetupApi.save(payload);
    },
    onSuccess: (data) => {
      toast.success('Compliance Setup saved successfully!', {
        description: `Version ${data.version || 'COMPLIANCE-2026-V1'} is now active.`,
      });
      queryClient.invalidateQueries({ queryKey: ['compliance-setup', selectedCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-setup-history', selectedCompanyId] });
      setIsDirty(false);
    },
    onError: (err: any) => {
      toast.error('Failed to save Compliance Setup', {
        description: err?.message || 'Please check your connection and input values.',
      });
    },
  });

  const handleReset = () => {
    if (isDirty) {
      setShowCancelConfirmModal(true);
    }
  };

  const confirmCancel = () => {
    setFormData(initialData);
    setIsDirty(false);
    setShowCancelConfirmModal(false);
    toast.info('Form changes discarded');
  };

  // Compliance Card item definition
  const complianceCards = [
    {
      id: 'pf',
      key: 'pfApplicable' as keyof ComplianceSetupRecord,
      name: 'PF (Provident Fund)',
      shortDesc: "Employees' Provident Fund & MP Act compliance (EPFO)",
      icon: Building2,
      activeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      configurePath: '/compliance/pf',
    },
    {
      id: 'esic',
      key: 'esicApplicable' as keyof ComplianceSetupRecord,
      name: 'ESIC',
      shortDesc: "Employees' State Insurance Corporation medical health compliance",
      icon: HeartPulse,
      activeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      configurePath: '/compliance/esic',
    },
    {
      id: 'ptax',
      key: 'ptApplicable' as keyof ComplianceSetupRecord,
      name: 'Professional Tax',
      shortDesc: 'State-wise Professional Tax statutory compliance & returns',
      icon: Receipt,
      activeColor: 'text-purple-600 bg-purple-50 border-purple-200',
      configurePath: '/compliance/ptax',
    },
    {
      id: 'itax',
      key: 'tdsApplicable' as keyof ComplianceSetupRecord,
      name: 'Income Tax (TDS)',
      shortDesc: 'Tax Deducted at Source compliance & Form 24Q under IT Act',
      icon: Calculator,
      activeColor: 'text-blue-600 bg-blue-50 border-blue-200',
      configurePath: '/compliance/itax',
    },
    {
      id: 'labour',
      key: 'labourComplianceApplicable' as keyof ComplianceSetupRecord,
      name: 'Labour Compliance',
      shortDesc: 'Shops & Establishments, LWF (Labour Welfare), Factory Acts',
      icon: Scale,
      activeColor: 'text-amber-600 bg-amber-50 border-amber-200',
      configurePath: '/compliance/labour',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600">Loading statutory compliance setup...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-red-900">Failed to load Compliance Setup</h3>
          <p className="text-sm text-red-600">Could not retrieve statutory setup settings for the selected company.</p>
          <Button variant="outline" onClick={() => refetch()} className="border-red-300 text-red-700">
            <RotateCcw className="w-4 h-4 mr-2" /> Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="sticky top-4 z-30 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              You have unsaved changes in statutory compliance setup. Remember to click &quot;Save Configuration&quot;.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="bg-amber-600 border-amber-400 text-white hover:bg-amber-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-white text-amber-900 hover:bg-amber-100 font-semibold"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span>Compliance</span>
            <span>&rarr;</span>
            <span className="text-slate-700">Compliance Setup</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Compliance Setup</h1>
              <p className="text-sm text-slate-500">
                Configure statutory compliances applicable to your company before payroll processing.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <History className="w-4 h-4 mr-2 text-slate-500" />
            Version History ({historyData.length})
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isDirty || saveMutation.isPending}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm min-w-[160px]"
          >
            {saveMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ERP Compliance Workflow Stepper Diagram */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50">
        <CardContent className="py-4 px-6">
          <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Statutory Architecture Workflow Pipeline
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 text-center text-xs">
            <div className="p-2 bg-indigo-600 text-white rounded-md font-semibold shadow-sm flex items-center justify-center">
              1. Compliance Setup ⭐
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              2. Entity &amp; State
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              3. Applicable Rules
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              4. Save Policy
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              5. Detailed Modules
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              6. Components
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              7. Structure
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              8. Payroll Run
            </div>
            <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium flex items-center justify-center">
              9. Returns &amp; ECR
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Company / Entity Selection */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">1. Company / Legal Entity</CardTitle>
              </div>
              <CardDescription>
                Select the legal entity, state jurisdiction, and financial year for statutory applicability.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Company / Legal Entity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanySelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    {availableCompanies.length > 0 ? (
                      availableCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.code ? `(${c.code})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="default-company">EHCM Platform Enterprise Entity</option>
                    )}
                  </select>
                </div>

                {/* State Jurisdiction Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    State Jurisdiction <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state || 'Maharashtra'}
                    onChange={(e) => updateFormField('state', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Establishment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Establishment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.establishmentType || 'Commercial Establishment'}
                    onChange={(e) => updateFormField('establishmentType', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {ESTABLISHMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Financial Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.financialYear || '2026-2027'}
                    onChange={(e) => updateFormField('financialYear', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {FINANCIAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        {fy}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Effective From */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Effective From Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveFrom || '2026-04-01'}
                    onChange={(e) => updateFormField('effectiveFrom', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This date defines the statutory starting cutoff for payroll computation rules.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Applicable Compliances Cards */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-base font-semibold text-slate-900">2. Applicable Compliances</CardTitle>
                </div>
                <CardDescription>
                  Toggle statutory applicability for this company entity. Details &amp; rates are stored in individual modules.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                Master Entry Layer
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {complianceCards.map((item) => {
                  const Icon = item.icon;
                  const isApplicable = Boolean(formData[item.key]);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isApplicable
                          ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                          : 'bg-slate-50/70 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2.5 rounded-lg border flex-shrink-0 ${item.activeColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                            {isApplicable ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{item.shortDesc}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        {/* Switch toggle */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 font-medium">{isApplicable ? 'ON' : 'OFF'}</span>
                          <Switch
                            checked={isApplicable}
                            onCheckedChange={() => handleComplianceToggle(item.key, item.name, isApplicable)}
                          />
                        </div>

                        {/* Configure button navigating to module */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(item.configurePath)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium text-xs"
                        >
                          Configure <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Architecture disclaimer notice */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start space-x-2">
                <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">Strict HRMS Statutory Architecture: </span>
                  Compliance Setup controls entity applicability. Detailed contribution rates (e.g. EPF 12%, ESIC 3.25%,
                  PT slabs, TDS slabs) remain managed inside their respective detailed configuration modules.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Compliance Policy Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">3. Compliance Policy</CardTitle>
              </div>
              <CardDescription>
                Configure statutory validation rules, filing calendar settings, and payroll pre-checks.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Frequency Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Payroll Compliance Filing Frequency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Monthly', 'Quarterly', 'Annual'].map((freq) => (
                    <button
                      type="button"
                      key={freq}
                      onClick={() => updateFormField('payrollComplianceFrequency', freq)}
                      className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                        formData.payrollComplianceFrequency === freq
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                {/* Compliance Calendar */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Compliance Calendar</h5>
                    <p className="text-xs text-slate-500">
                      Enable automated deadline tracking &amp; filing schedules in the compliance dashboard calendar.
                    </p>
                  </div>
                  <Switch
                    checked={formData.complianceCalendarEnabled ?? true}
                    onCheckedChange={(val) => updateFormField('complianceCalendarEnabled', val)}
                  />
                </div>

                {/* Due Date Notifications */}
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Due Date Notifications</h5>
                    <p className="text-xs text-slate-500">
                      Send automated email/system notifications to HR admins 7 days prior to filing deadlines.
                    </p>
                  </div>
                  <Switch
                    checked={formData.dueDateNotificationsEnabled ?? true}
                    onCheckedChange={(val) => updateFormField('dueDateNotificationsEnabled', val)}
                  />
                </div>

                {/* Compliance Validation */}
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Compliance Validation</h5>
                    <p className="text-xs text-slate-500">
                      Perform statutory rule validation (UAN format, ESIC eligibility ceiling, PT state rules) during employee updates.
                    </p>
                  </div>
                  <Switch
                    checked={formData.complianceValidationEnabled ?? true}
                    onCheckedChange={(val) => updateFormField('complianceValidationEnabled', val)}
                  />
                </div>

                {/* Require Compliance Validation Before Payroll */}
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Require Validation Before Payroll Lock</h5>
                    <p className="text-xs text-slate-500">
                      Block monthly payroll processing approval if statutory compliance validations contain critical errors.
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireComplianceBeforePayroll ?? true}
                    onCheckedChange={(val) => updateFormField('requireComplianceBeforePayroll', val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col wide) - Versioning & Overview Card */}
        <div className="space-y-6">
          {/* Section 4: Version & Effective Date */}
          <Card className="border-slate-200 shadow-sm sticky top-6">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">4. Version &amp; Effective Date</CardTitle>
              </div>
              <CardDescription>Version snapshot control prevents overwriting historical statutory audits.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Effective From:</span>
                  <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formData.effectiveFrom ? formData.effectiveFrom.split('T')[0] : '2026-04-01'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Configuration Version:</span>
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {setupData?.version || 'COMPLIANCE-2026-V1'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Status:</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Active Version
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Created By:</span>
                  <span className="text-slate-700 font-medium">{setupData?.createdBy || 'Admin User'}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="text-slate-600">
                    {setupData?.updatedAt ? new Date(setupData.updatedAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Version History Button */}
              <Button
                variant="outline"
                onClick={() => setShowHistoryModal(true)}
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
              >
                <History className="w-3.5 h-3.5 mr-2 text-indigo-600" /> View Version History Timeline
              </Button>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Statutory Summary</h6>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>PF (Provident Fund):</span>
                    <span className={formData.pfApplicable ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {formData.pfApplicable ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ESIC:</span>
                    <span className={formData.esicApplicable ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {formData.esicApplicable ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Professional Tax:</span>
                    <span className={formData.ptApplicable ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {formData.ptApplicable ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Income Tax (TDS):</span>
                    <span className={formData.tdsApplicable ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {formData.tdsApplicable ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Labour Compliance:</span>
                    <span
                      className={
                        formData.labourComplianceApplicable ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                      }
                    >
                      {formData.labourComplianceApplicable ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deactivation Confirmation Modal */}
      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Confirm Statutory Deactivation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1">
              Deactivating <strong className="text-slate-900">{deactivateTarget?.label}</strong> for this entity will
              turn off default applicability rules in Employee Salary Assignments and Payroll calculation runs. Processed
              historical payroll data will remain intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex space-x-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmDeactivation}>
              Confirm Deactivation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Cancel Confirmation Modal */}
      <Dialog open={showCancelConfirmModal} onOpenChange={setShowCancelConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Discard Unsaved Changes?</DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1">
              You have modified statutory setup parameters. If you cancel, your changes will be reset to the last saved
              configuration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex space-x-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowCancelConfirmModal(false)}>
              Continue Editing
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-600" />
              <DialogTitle className="text-lg font-bold text-slate-900">Statutory Configuration History</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Audit log of all historical compliance setup versions for this entity.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[350px] overflow-y-auto space-y-3 pr-2">
            {historyData.length > 0 ? (
              historyData.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.status === 'Active' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-indigo-700">{item.version}</span>
                      {item.status === 'Active' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 text-[10px]">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600">
                      State: <strong>{item.state}</strong> | FY: <strong>{item.financialYear}</strong> | Effective:{' '}
                      <strong>{new Date(item.effectiveFrom).toLocaleDateString()}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      By: {item.createdBy || 'Admin User'} on {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDetailItem(item)}
                      className="text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-indigo-600" /> View Details
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(item);
                        setIsDirty(true);
                        setShowHistoryModal(false);
                        toast.info(`Loaded version ${item.version} settings into editor`);
                      }}
                      className="text-xs bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" /> Restore
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">No version history records found.</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Details Snapshot Dialog */}
      <Dialog open={Boolean(selectedDetailItem)} onOpenChange={(open) => !open && setSelectedDetailItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDetailItem && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                        <span>Version Details:</span>
                        <span className="font-mono text-indigo-600">{selectedDetailItem.version}</span>
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">
                        Complete statutory compliance configuration snapshot record.
                      </DialogDescription>
                    </div>
                  </div>
                  {selectedDetailItem.status === 'Active' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Active Version
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 text-xs">
                      Archived Version
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="py-4 space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {/* 1. Entity & Jurisdiction */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Entity &amp; Jurisdiction
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">State Jurisdiction:</span>
                      <span className="font-semibold text-slate-900">{selectedDetailItem.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Establishment Type:</span>
                      <span className="font-semibold text-slate-900">{selectedDetailItem.establishmentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Financial Year:</span>
                      <span className="font-semibold text-slate-900">{selectedDetailItem.financialYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Effective From:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(selectedDetailItem.effectiveFrom).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Statutory Applicability */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Statutory Applicability Status
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border bg-white flex items-center justify-between">
                      <span className="font-medium text-slate-800">PF (Provident Fund)</span>
                      <Badge
                        className={
                          selectedDetailItem.pfApplicable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {selectedDetailItem.pfApplicable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-white flex items-center justify-between">
                      <span className="font-medium text-slate-800">ESIC</span>
                      <Badge
                        className={
                          selectedDetailItem.esicApplicable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {selectedDetailItem.esicApplicable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-white flex items-center justify-between">
                      <span className="font-medium text-slate-800">Professional Tax (PT)</span>
                      <Badge
                        className={
                          selectedDetailItem.ptApplicable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {selectedDetailItem.ptApplicable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-white flex items-center justify-between">
                      <span className="font-medium text-slate-800">Income Tax (TDS)</span>
                      <Badge
                        className={
                          selectedDetailItem.tdsApplicable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {selectedDetailItem.tdsApplicable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-white flex items-center justify-between sm:col-span-2">
                      <span className="font-medium text-slate-800">Labour Compliance</span>
                      <Badge
                        className={
                          selectedDetailItem.labourComplianceApplicable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {selectedDetailItem.labourComplianceApplicable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 3. Policy Settings */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Sliders className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Policy &amp; Validation Settings
                  </h5>
                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span>Filing Frequency:</span>
                      <span className="font-semibold">{selectedDetailItem.payrollComplianceFrequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance Calendar Enabled:</span>
                      <span className="font-semibold">
                        {selectedDetailItem.complianceCalendarEnabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date Notifications Enabled:</span>
                      <span className="font-semibold">
                        {selectedDetailItem.dueDateNotificationsEnabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance Validation Enabled:</span>
                      <span className="font-semibold">
                        {selectedDetailItem.complianceValidationEnabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Require Validation Before Payroll Lock:</span>
                      <span className="font-semibold">
                        {selectedDetailItem.requireComplianceBeforePayroll ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Audit Info */}
                <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>Created By: {selectedDetailItem.createdBy || 'Admin User'}</span>
                  <span>
                    Created: {new Date(selectedDetailItem.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(selectedDetailItem);
                    setIsDirty(true);
                    setSelectedDetailItem(null);
                    setShowHistoryModal(false);
                    toast.info(`Restored version ${selectedDetailItem.version} settings into editor`);
                  }}
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore This Version to Editor
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDetailItem(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
