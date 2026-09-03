import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  ShieldCheck,
  Save,
  History,
  Building2,
  FileCode,
  Loader2,
  Sparkles,
  Trash2,
  Edit3,
  AlertCircle,
  X,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { companiesApi } from '@/api/organization';

export interface PfConfigurationTabProps {
  selectedCompany?: string;
  onCompanyChange?: (company: string) => void;
  companies?: any[];
}

export function PfConfigurationTab({
  selectedCompany,
  onCompanyChange,
  companies: passedCompanies = [],
}: PfConfigurationTabProps) {
  const [companiesList, setCompaniesList] = useState<any[]>(passedCompanies);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');

  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pfApplicable, setPfApplicable] = useState(true);
  const [establishmentId, setEstablishmentId] = useState('');
  const [pfRegNumber, setPfRegNumber] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  // Number fields allowing empty string when user backspaces/clears
  const [wageCeiling, setWageCeiling] = useState<number | string>(15000);
  const [employeePfRate, setEmployeePfRate] = useState<number | string>(12);
  const [employerPfRate, setEmployerPfRate] = useState<number | string>(3.67);
  const [epsRate, setEpsRate] = useState<number | string>(8.33);
  const [edliRate, setEdliRate] = useState<number | string>(0.5);
  const [adminChargeRate, setAdminChargeRate] = useState<number | string>(0.5);
  const [minAdminCharge, setMinAdminCharge] = useState<number | string>(500);

  const [allowHigherWage, setAllowHigherWage] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  // Loaded version name indicator
  const [loadedVersionName, setLoadedVersionName] = useState<string | null>(null);

  // Wage Components Selection
  const [selectedComponents, setSelectedComponents] = useState({
    basic: true,
    da: true,
    retainingAllowance: true,
    specialAllowance: false,
    hra: false,
  });

  const [historyVersionLogs, setHistoryVersionLogs] = useState<any[]>([]);

  // Fetch company list if not provided
  useEffect(() => {
    if (passedCompanies && passedCompanies.length > 0) {
      setCompaniesList(passedCompanies);
    } else {
      companiesApi
        .list()
        .then((data) => {
          if (data && data.length > 0) {
            setCompaniesList(data);
          }
        })
        .catch((err) => {
          console.warn('Failed to load companies list', err);
        });
    }
  }, [passedCompanies]);

  // Set default active company ID
  useEffect(() => {
    if (selectedCompany && selectedCompany !== 'all') {
      setActiveCompanyId(selectedCompany);
    } else if (companiesList.length > 0 && (!activeCompanyId || activeCompanyId === 'all')) {
      setActiveCompanyId(companiesList[0].id);
    }
  }, [selectedCompany, companiesList]);

  // Fetch PF Configuration from DB whenever activeCompanyId changes
  useEffect(() => {
    if (!activeCompanyId || activeCompanyId === 'all') return;

    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      setErrorMessage(null);
      setLoadedVersionName(null);
      try {
        const res = await apiClient.get('/compliance/pf/configuration', {
          params: { companyId: activeCompanyId },
        });
        if (res.data) {
          const d = res.data;
          setEstablishmentId(d.establishmentCode || '');
          setWageCeiling(d.pfWageCeiling !== undefined ? Number(d.pfWageCeiling) : 15000);
          setEmployeePfRate(d.employeePfRate !== undefined ? Number(d.employeePfRate) : 12);
          setEpsRate(d.employerEpsRate !== undefined ? Number(d.employerEpsRate) : 8.33);
          setEmployerPfRate(d.employerEpfRate !== undefined ? Number(d.employerEpfRate) : 3.67);
          setEdliRate(d.edliRate !== undefined ? Number(d.edliRate) : 0.5);
          setAdminChargeRate(d.adminRate !== undefined ? Number(d.adminRate) : 0.5);
          setMinAdminCharge(d.minAdminCharge !== undefined ? Number(d.minAdminCharge) : 500);
          setAllowHigherWage(d.allowHigherWage !== undefined ? d.allowHigherWage : true);

          try {
            const storedLogs = localStorage.getItem(`pf_history_${activeCompanyId}`);
            if (storedLogs) {
              setHistoryVersionLogs(JSON.parse(storedLogs));
            } else if (d.historyVersionLogs && d.historyVersionLogs.length > 0) {
              setHistoryVersionLogs(d.historyVersionLogs);
            } else {
              setHistoryVersionLogs([]);
            }

            const storedExtras = localStorage.getItem(`pf_extra_${activeCompanyId}`);
            if (storedExtras) {
              const ext = JSON.parse(storedExtras);
              if (ext.pfRegNumber) setPfRegNumber(ext.pfRegNumber);
              if (ext.pfApplicable !== undefined) setPfApplicable(ext.pfApplicable);
              if (ext.effectiveFrom) setEffectiveFrom(ext.effectiveFrom);
            } else if (d.effectiveFrom) {
              const dateStr = new Date(d.effectiveFrom).toISOString().split('T')[0];
              setEffectiveFrom(dateStr);
            }
          } catch (e) {
            // ignore storage errors
          }
        }
      } catch (e) {
        console.warn('Failed to fetch PF configuration from database', e);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [activeCompanyId]);

  const handleCompanySelectChange = (newCompanyId: string) => {
    setActiveCompanyId(newCompanyId);
    setErrorMessage(null);
    setLoadedVersionName(null);
    if (onCompanyChange) {
      onCompanyChange(newCompanyId);
    }
  };

  const handleClearData = async () => {
    if (!activeCompanyId || activeCompanyId === 'all') return;
    setErrorMessage(null);
    setLoadedVersionName(null);

    setIsClearing(true);
    try {
      await apiClient.delete('/compliance/pf/configuration', {
        params: { companyId: activeCompanyId },
      });
    } catch (e) {
      console.warn('Backend delete reset notification', e);
    } finally {
      // Clear form inputs completely & wipe version logs
      setEstablishmentId('');
      setPfRegNumber('');
      setEffectiveFrom('');
      setWageCeiling('');
      setEmployeePfRate('');
      setEmployerPfRate('');
      setEpsRate('');
      setEdliRate('');
      setAdminChargeRate('');
      setMinAdminCharge('');
      setAllowHigherWage(true);
      setHistoryVersionLogs([]);

      try {
        localStorage.removeItem(`pf_history_${activeCompanyId}`);
        localStorage.removeItem(`pf_extra_${activeCompanyId}`);
      } catch (e) {}

      setIsCleared(true);
      setTimeout(() => setIsCleared(false), 3500);
      setIsClearing(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!activeCompanyId) return;

    try {
      await apiClient.delete(`/compliance/pf/configuration/versions/${versionId}`, {
        params: { companyId: activeCompanyId },
      });
    } catch (e) {
      // ignore server version delete fallback
    }

    const updatedLogs = historyVersionLogs.filter((v) => v.id !== versionId);
    setHistoryVersionLogs(updatedLogs);

    try {
      localStorage.setItem(`pf_history_${activeCompanyId}`, JSON.stringify(updatedLogs));
    } catch (e) {}
  };

  const handleLoadVersion = (log: any) => {
    if (!log) return;
    setLoadedVersionName(log.version);
    setErrorMessage(null);

    const snap = log.configSnapshot || log.snapshot || {};

    // 1. Establishment Code / ID
    const estCode =
      snap.establishmentId ||
      snap.establishmentCode ||
      log.establishmentCode ||
      log.establishmentId;

    if (estCode) {
      setEstablishmentId(estCode);
    } else if (log.notes) {
      const match = log.notes.match(/(?:Est ID:|Establishment ID:?)\s*([^\s\)]+)/i);
      if (match && match[1]) {
        setEstablishmentId(match[1].trim());
      }
    }

    // 2. PF Registration Number
    const regNum =
      snap.pfRegNumber ||
      log.pfRegNumber ||
      snap.registrationNumber ||
      log.registrationNumber;
    if (regNum !== undefined && regNum !== '') {
      setPfRegNumber(regNum);
    }

    // 3. Effective From Date
    const effDate = snap.effectiveFrom || snap.effectiveDate || log.effectiveDate || log.effectiveFrom;
    if (effDate) {
      const dateStr = typeof effDate === 'string' && effDate.includes('T') ? effDate.split('T')[0] : effDate;
      setEffectiveFrom(dateStr);
    }

    // 4. Statutory Wage Ceiling
    const wageCap = snap.wageCeiling ?? snap.pfWageCeiling ?? log.pfWageCeiling ?? log.wageCeiling;
    if (wageCap !== undefined) setWageCeiling(Number(wageCap));

    // 5. Contribution Rates
    const eeRate = snap.employeePfRate ?? log.employeePfRate;
    if (eeRate !== undefined) setEmployeePfRate(Number(eeRate));

    const erRate = snap.employerPfRate ?? snap.employerEpfRate ?? log.employerEpfRate ?? log.employerPfRate;
    if (erRate !== undefined) setEmployerPfRate(Number(erRate));

    const epsR = snap.epsRate ?? snap.employerEpsRate ?? log.employerEpsRate ?? log.epsRate;
    if (epsR !== undefined) setEpsRate(Number(epsR));

    const edliR = snap.edliRate ?? log.edliRate;
    if (edliR !== undefined) setEdliRate(Number(edliR));

    const admR = snap.adminChargeRate ?? snap.adminRate ?? log.adminRate ?? log.adminChargeRate;
    if (admR !== undefined) setAdminChargeRate(Number(admR));

    const minAdm = snap.minAdminCharge ?? log.minAdminCharge;
    if (minAdm !== undefined) setMinAdminCharge(Number(minAdm));

    const allowHigher = snap.allowHigherWage ?? log.allowHigherWage;
    if (allowHigher !== undefined) setAllowHigherWage(Boolean(allowHigher));

    const pfApp = snap.pfApplicable ?? log.pfApplicable;
    if (pfApp !== undefined) setPfApplicable(Boolean(pfApp));

    if (snap.selectedComponents) {
      setSelectedComponents(snap.selectedComponents);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);

    if (!activeCompanyId || activeCompanyId === 'all') {
      setErrorMessage('Please select an active company to save PF configuration.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        companyId: activeCompanyId,
        establishmentCode: establishmentId || 'PU/PUN/0012345/000',
        pfWageCeiling: wageCeiling === '' ? 15000 : Number(wageCeiling),
        employeePfRate: employeePfRate === '' ? 12 : Number(employeePfRate),
        employerEpsRate: epsRate === '' ? 8.33 : Number(epsRate),
        employerEpfRate: employerPfRate === '' ? 3.67 : Number(employerPfRate),
        edliRate: edliRate === '' ? 0.5 : Number(edliRate),
        adminRate: adminChargeRate === '' ? 0.5 : Number(adminChargeRate),
        minAdminCharge: minAdminCharge === '' ? 500 : Number(minAdminCharge),
        allowHigherWage: Boolean(allowHigherWage),
      };

      const res = await apiClient.put('/compliance/pf/configuration', payload);

      const compObj = companiesList.find((c) => c.id === activeCompanyId);
      const compName = compObj?.name || 'Selected Company';
      const newVersionNum = (1.0 + historyVersionLogs.length * 0.1).toFixed(1);

      const configSnapshot = {
        establishmentId: establishmentId || 'PU/PUN/0012345/000',
        pfRegNumber: pfRegNumber || '',
        effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
        wageCeiling,
        employeePfRate,
        employerPfRate,
        epsRate,
        edliRate,
        adminChargeRate,
        minAdminCharge,
        allowHigherWage,
        pfApplicable,
        selectedComponents: { ...selectedComponents },
      };

      const newLog = {
        id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        version: `v${newVersionNum}`,
        effectiveDate: effectiveFrom || new Date().toISOString().split('T')[0],
        updatedBy: 'Admin User',
        notes: `Saved configuration for ${compName} (Est ID: ${establishmentId || 'PU/PUN/0012345/000'})`,
        configSnapshot,
      };

      let updatedLogs = [newLog, ...historyVersionLogs];
      if (res.data && res.data.historyVersionLogs && res.data.historyVersionLogs.length > 0) {
        updatedLogs = res.data.historyVersionLogs;
      }
      setHistoryVersionLogs(updatedLogs);
      setLoadedVersionName(null);

      try {
        localStorage.setItem(`pf_history_${activeCompanyId}`, JSON.stringify(updatedLogs));
        localStorage.setItem(`pf_extra_${activeCompanyId}`, JSON.stringify({ pfRegNumber, pfApplicable, effectiveFrom }));
      } catch (e) {}

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (e: any) {
      console.error('Failed to save PF configuration via API', e);
      const rawErr = e.response?.data?.message || e.message || 'Error saving PF configuration.';
      const formattedErr = Array.isArray(rawErr) ? rawErr.join(', ') : String(rawErr);
      setErrorMessage(`Save Exception: ${formattedErr}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentCompanyObj = companiesList.find((c) => c.id === activeCompanyId);

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION BAR & COMPANY SELECTION ── */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" /> Company Statutory PF Policy Setup
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure Establishment IDs, statutory wage ceilings, EPS/EDLI rates & effective date versioning
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Company Selection Field */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/5 text-xs font-semibold">
            <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-muted-foreground hidden sm:inline">Company:</span>
            <select
              value={activeCompanyId}
              onChange={(e) => handleCompanySelectChange(e.target.value)}
              className="bg-transparent text-foreground font-extrabold focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {companiesList.length === 0 ? (
                <option value="">No Companies Available</option>
              ) : (
                companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {loadedVersionName && (
            <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs font-bold flex items-center gap-1.5">
              <Edit3 className="w-3 h-3 text-purple-600" />
              Viewing/Editing {loadedVersionName}
              <button
                type="button"
                onClick={() => setLoadedVersionName(null)}
                className="ml-1 p-0.5 rounded hover:bg-purple-500/20 cursor-pointer"
                title="Clear loaded version"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {isSaved && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-bold animate-in fade-in">
              ✓ Configuration Saved to DB
            </Badge>
          )}

          {isCleared && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs font-bold animate-in fade-in">
              ✓ Registration Deleted & Cleared
            </Badge>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearData}
            disabled={isClearing || isLoadingConfig || !activeCompanyId}
            className="h-9 text-xs font-bold border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 gap-1.5 cursor-pointer shadow-xs"
          >
            {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            Delete Registration
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoadingConfig || !activeCompanyId}
            className="h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 cursor-pointer shadow-xs"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save & Create Version
          </Button>
        </div>
      </div>

      {/* ── IN-PAGE ERROR BANNER (No browser popup dialogs) ── */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 pr-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="break-all">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-500/20 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      )}

      {isLoadingConfig && (
        <div className="flex items-center justify-center p-8 rounded-2xl border border-border/80 bg-card text-muted-foreground gap-2 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          Loading prefilled DB PF registration details for {currentCompanyObj?.name || 'Selected Company'}...
        </div>
      )}

      {!isLoadingConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Main Policy Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Company PF Registration */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" /> Company PF Registration & Setup
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Prefilled details loaded from DB for{' '}
                    <span className="font-bold text-foreground">{currentCompanyObj?.name || 'Selected Company'}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[11px] font-bold border-purple-500/30 text-purple-600 bg-purple-500/5">
                    <Edit3 className="w-3 h-3 mr-1" /> Prefilled & Editable
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20">
                  <div>
                    <span className="font-bold text-foreground">PF Statutory Applicability</span>
                    <p className="text-[11px] text-muted-foreground">
                      Enable mandatory PF deductions for eligible employees in this company
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pfApplicable}
                      onChange={(e) => setPfApplicable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">
                      Establishment ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={establishmentId}
                      onChange={(e) => setEstablishmentId(e.target.value)}
                      placeholder="e.g. PU/PUN/0012345/000"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground">Official EPFO Establishment ID</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">PF Registration No.</label>
                    <input
                      type="text"
                      value={pfRegNumber}
                      onChange={(e) => setPfRegNumber(e.target.value)}
                      placeholder="e.g. REG-PF-2024-8899"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground">Company PF Reference Number</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">
                      Effective From Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">Policy activation date</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Eligible Wage Components */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" /> Eligible PF Wage Component Selection
                </CardTitle>
                <CardDescription className="text-xs">
                  Statutory components included in PF Wage calculation (Basic + DA + Retaining)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/10 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedComponents.basic}
                      onChange={(e) => setSelectedComponents({ ...selectedComponents, basic: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Basic Salary</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/10 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedComponents.da}
                      onChange={(e) => setSelectedComponents({ ...selectedComponents, da: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Dearness Allowance (DA)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/10 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedComponents.retainingAllowance}
                      onChange={(e) =>
                        setSelectedComponents({ ...selectedComponents, retainingAllowance: e.target.checked })
                      }
                      className="rounded text-purple-600"
                    />
                    <span>Retaining Allowance</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/10 cursor-pointer font-bold opacity-75">
                    <input
                      type="checkbox"
                      checked={selectedComponents.specialAllowance}
                      onChange={(e) =>
                        setSelectedComponents({ ...selectedComponents, specialAllowance: e.target.checked })
                      }
                      className="rounded text-purple-600"
                    />
                    <span>Special Allowance (Optional)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/10 cursor-pointer font-bold opacity-50">
                    <input
                      type="checkbox"
                      checked={selectedComponents.hra}
                      disabled
                      className="rounded text-purple-600"
                    />
                    <span>HRA (Exempt by Law)</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Statutory Contribution Rates & Capping */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Contribution Rates & EPFO Statutory Limits
                </CardTitle>
                <CardDescription className="text-xs">
                  EPF 12%, EPS 8.33% (Max ₹1,250), EDLI 0.5% (Max ₹75) & Admin Charges
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">PF Wage Ceiling</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={wageCeiling}
                      onChange={(e) => setWageCeiling(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">Statutory Cap: ₹15,000</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Employee PF Rate (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={employeePfRate}
                      onChange={(e) => setEmployeePfRate(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">Standard: 12%</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Employer EPF Rate (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={employerPfRate}
                      onChange={(e) => setEmployerPfRate(e.target.value)}
                      placeholder="e.g. 3.67"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">EPF Balance: 3.67%</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Employer EPS Rate (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={epsRate}
                      onChange={(e) => setEpsRate(e.target.value)}
                      placeholder="e.g. 8.33"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">8.33% (Max ₹1,250)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">EDLI Insurance Rate (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={edliRate}
                      onChange={(e) => setEdliRate(e.target.value)}
                      placeholder="e.g. 0.5"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">0.50% (Max ₹75)</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">EPF Admin Charge Rate (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={adminChargeRate}
                      onChange={(e) => setAdminChargeRate(e.target.value)}
                      placeholder="e.g. 0.5"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">0.50% of Total PF Wage</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Minimum Admin Charge (₹)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={minAdminCharge}
                      onChange={(e) => setMinAdminCharge(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-1.5 rounded-xl bg-background border border-border/80 font-mono font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">₹500 / month min</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-purple-500/30 bg-purple-500/10">
                  <div>
                    <span className="font-bold text-purple-900 dark:text-purple-200">Voluntary Higher Wage PF Option</span>
                    <p className="text-[11px] text-muted-foreground">Allow employees to contribute 12% on actual basic wage exceeding ₹15,000</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowHigherWage}
                    onChange={(e) => setAllowHigherWage(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Column: Versioning & Audit History */}
          <div className="space-y-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" /> Configuration Version History
                </CardTitle>
                <CardDescription className="text-xs">
                  Effective date versioning prevents altering historical payroll filings for{' '}
                  <span className="font-bold text-foreground">{currentCompanyObj?.name || 'this company'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {historyVersionLogs.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border/80 rounded-xl space-y-1 bg-muted/10">
                    <History className="w-6 h-6 mx-auto text-muted-foreground/50" />
                    <p className="font-bold text-xs text-foreground">No Version History</p>
                    <p className="text-[11px] text-muted-foreground">
                      Save a configuration to log version history for this company.
                    </p>
                  </div>
                ) : (
                  historyVersionLogs.map((log) => {
                    const isCurrentLoaded = loadedVersionName === log.version;
                    return (
                      <div
                        key={log.id || log.version}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          isCurrentLoaded
                            ? 'border-purple-500 bg-purple-500/10 shadow-xs'
                            : 'border-border/80 bg-muted/20 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-purple-600 dark:text-purple-400 font-mono text-sm flex items-center gap-1.5">
                            {log.version}
                            {isCurrentLoaded && (
                              <Badge className="text-[9px] px-1 py-0 bg-purple-600 text-white font-sans">Active in Form</Badge>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                              Effective: {log.effectiveDate}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => handleDeleteVersion(log.id)}
                              title="Delete this version"
                              className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-[11px] font-medium">{log.notes}</p>
                        
                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <span className="text-[10px] text-slate-400">By {log.updatedBy || 'Admin User'}</span>
                          <Button
                            size="xs"
                            variant={isCurrentLoaded ? 'default' : 'outline'}
                            onClick={() => handleLoadVersion(log)}
                            className={`h-6 text-[10px] font-bold px-2 gap-1 cursor-pointer rounded-lg ${
                              isCurrentLoaded
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'border-purple-500/30 text-purple-600 hover:bg-purple-500/10'
                            }`}
                          >
                            {isCurrentLoaded ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Loaded
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" /> View & Edit
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default PfConfigurationTab;
