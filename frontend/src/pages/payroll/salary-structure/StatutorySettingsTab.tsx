import { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Percent,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  MapPin,
  RefreshCw,
  Coins,
  RotateCcw,
  HeartPulse,
  Landmark,
  HeartHandshake,
  Award,
  Scale,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { INITIAL_STATUTORY_SETTINGS, type StatutorySettingsData, type ProfessionalTaxSlab } from './mock-data';

// Preset Indian States with standard official PT rules
const PRESET_INDIAN_STATES = [
  {
    name: 'Kerala',
    code: 'KL',
    slabs: [
      { min: 0, max: 11999, monthlyTax: 0, febTax: 0 },
      { min: 12000, max: 17999, monthlyTax: 120, febTax: 120 },
      { min: 18000, max: 29999, monthlyTax: 180, febTax: 180 },
      { min: 30000, max: 44999, monthlyTax: 300, febTax: 300 },
      { min: 45000, max: 59999, monthlyTax: 450, febTax: 450 },
      { min: 60000, max: 99999999, monthlyTax: 600, febTax: 600 },
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    slabs: [
      { min: 0, max: 15000, monthlyTax: 0, febTax: 0 },
      { min: 15001, max: 20000, monthlyTax: 150, febTax: 150 },
      { min: 20001, max: 99999999, monthlyTax: 200, febTax: 200 },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    slabs: [
      { min: 0, max: 18750, monthlyTax: 0, febTax: 0 },
      { min: 18751, max: 25000, monthlyTax: 125, febTax: 125 },
      { min: 25001, max: 33333, monthlyTax: 167, febTax: 167 },
      { min: 33334, max: 99999999, monthlyTax: 208, febTax: 212 },
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    slabs: [
      { min: 0, max: 13333, monthlyTax: 0, febTax: 0 },
      { min: 13334, max: 25000, monthlyTax: 125, febTax: 125 },
      { min: 25001, max: 99999999, monthlyTax: 200, febTax: 300 },
    ],
  },
  {
    name: 'Assam',
    code: 'AS',
    slabs: [
      { min: 0, max: 10000, monthlyTax: 0, febTax: 0 },
      { min: 10001, max: 15000, monthlyTax: 150, febTax: 150 },
      { min: 15001, max: 25000, monthlyTax: 180, febTax: 180 },
      { min: 25001, max: 99999999, monthlyTax: 208, febTax: 208 },
    ],
  },
  {
    name: 'Punjab',
    code: 'PB',
    slabs: [
      { min: 0, max: 20833, monthlyTax: 0, febTax: 0 },
      { min: 20834, max: 99999999, monthlyTax: 200, febTax: 200 },
    ],
  },
  {
    name: 'Bihar',
    code: 'BR',
    slabs: [
      { min: 0, max: 25000, monthlyTax: 0, febTax: 0 },
      { min: 25001, max: 41666, monthlyTax: 83, febTax: 83 },
      { min: 41667, max: 83333, monthlyTax: 166, febTax: 166 },
      { min: 83334, max: 99999999, monthlyTax: 208, febTax: 208 },
    ],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    slabs: [
      { min: 0, max: 25000, monthlyTax: 0, febTax: 0 },
      { min: 25001, max: 41666, monthlyTax: 100, febTax: 100 },
      { min: 41667, max: 66666, monthlyTax: 150, febTax: 150 },
      { min: 66667, max: 83333, monthlyTax: 175, febTax: 175 },
      { min: 83334, max: 99999999, monthlyTax: 208, febTax: 208 },
    ],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    slabs: [
      { min: 0, max: 16666, monthlyTax: 0, febTax: 0 },
      { min: 16667, max: 25000, monthlyTax: 130, febTax: 130 },
      { min: 25001, max: 33333, monthlyTax: 175, febTax: 175 },
      { min: 33334, max: 99999999, monthlyTax: 208, febTax: 208 },
    ],
  },
  {
    name: 'Goa',
    code: 'GA',
    slabs: [
      { min: 0, max: 15000, monthlyTax: 0, febTax: 0 },
      { min: 15001, max: 25000, monthlyTax: 100, febTax: 100 },
      { min: 25001, max: 99999999, monthlyTax: 200, febTax: 200 },
    ],
  },
];

export function StatutorySettingsTab() {
  // Load persisted settings or fallback to initial defaults
  const [settings, setSettings] = useState<StatutorySettingsData>(() => {
    try {
      const saved = localStorage.getItem('company_statutory_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STATUTORY_SETTINGS;
  });

  const [selectedPtState, setSelectedPtState] = useState<string>('MH');

  // Add State Dialog State
  const [isAddStateDialogOpen, setIsAddStateDialogOpen] = useState<boolean>(false);
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>('KL');
  const [customStateName, setCustomStateName] = useState<string>('Kerala');
  const [customStateCode, setCustomStateCode] = useState<string>('KL');

  // Open/Close collapsible state for each section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pf: true,
    esi: false,
    pt: true,
    lwf: false,
    gratuity: false,
    minWage: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    setOpenSections({
      pf: true,
      esi: true,
      pt: true,
      lwf: true,
      gratuity: true,
      minWage: true,
    });
  };

  const handleCollapseAll = () => {
    setOpenSections({
      pf: false,
      esi: false,
      pt: false,
      lwf: false,
      gratuity: false,
      minWage: false,
    });
  };

  const activePtStateConfig =
    settings.professionalTax.states.find((s) => s.code === selectedPtState) || settings.professionalTax.states[0];

  const handleSave = () => {
    try {
      localStorage.setItem('company_statutory_settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('statutory_settings_updated'));
    } catch {
      // ignore
    }
    toast.success('Statutory settings successfully updated and saved for active entity.');
  };

  const handleResetDefaults = () => {
    setSettings(INITIAL_STATUTORY_SETTINGS);
    try {
      localStorage.setItem('company_statutory_settings', JSON.stringify(INITIAL_STATUTORY_SETTINGS));
      window.dispatchEvent(new Event('statutory_settings_updated'));
    } catch {
      // ignore
    }
    toast.info('Restored statutory settings to government standard defaults.');
  };

  // Helper to update PT slabs for selected state
  const handleUpdatePtSlabField = (index: number, field: keyof ProfessionalTaxSlab, val: number) => {
    const updatedStates = settings.professionalTax.states.map((state) => {
      if (state.code !== selectedPtState) return state;
      const updatedSlabs = [...state.slabs];
      updatedSlabs[index] = { ...updatedSlabs[index], [field]: val };
      return { ...state, slabs: updatedSlabs };
    });
    setSettings({
      ...settings,
      professionalTax: { ...settings.professionalTax, states: updatedStates },
    });
  };

  // Helper to add a new slab bracket for current state
  const handleAddPtSlabBracket = () => {
    const currentSlabs = activePtStateConfig.slabs;
    const lastSlab = currentSlabs[currentSlabs.length - 1];
    const newMin = lastSlab ? (lastSlab.max < 90000000 ? lastSlab.max + 1 : lastSlab.min + 5000) : 0;
    const newSlab: ProfessionalTaxSlab = {
      min: newMin,
      max: 99999999,
      monthlyTax: 200,
      febTax: 200,
    };

    const updatedStates = settings.professionalTax.states.map((state) => {
      if (state.code !== selectedPtState) return state;
      return { ...state, slabs: [...state.slabs, newSlab] };
    });

    setSettings({
      ...settings,
      professionalTax: { ...settings.professionalTax, states: updatedStates },
    });
    toast.success('New PT slab bracket added.');
  };

  // Helper to delete a slab bracket
  const handleDeletePtSlabBracket = (index: number) => {
    if (activePtStateConfig.slabs.length <= 1) {
      toast.error('State must have at least one tax bracket.');
      return;
    }

    const updatedStates = settings.professionalTax.states.map((state) => {
      if (state.code !== selectedPtState) return state;
      const updatedSlabs = state.slabs.filter((_, idx) => idx !== index);
      return { ...state, slabs: updatedSlabs };
    });

    setSettings({
      ...settings,
      professionalTax: { ...settings.professionalTax, states: updatedStates },
    });
    toast.info('Slab bracket deleted.');
  };

  // Helper to add a new State to PT
  const handleConfirmAddState = () => {
    const name = customStateName.trim();
    const code = customStateCode.trim().toUpperCase();

    if (!name || !code) {
      toast.error('Please provide both State Name and State Code.');
      return;
    }

    const alreadyExists = settings.professionalTax.states.some((s) => s.code === code);
    if (alreadyExists) {
      toast.error(`State code ${code} is already configured in Professional Tax.`);
      return;
    }

    // Find default slabs from preset if available
    const preset = PRESET_INDIAN_STATES.find((p) => p.code === code);
    const initialSlabs = preset?.slabs ?? [
      { min: 0, max: 15000, monthlyTax: 0, febTax: 0 },
      { min: 15001, max: 20000, monthlyTax: 150, febTax: 150 },
      { min: 20001, max: 99999999, monthlyTax: 200, febTax: 200 },
    ];

    const newState = {
      code,
      name,
      slabs: initialSlabs,
    };

    const updatedStates = [...settings.professionalTax.states, newState];
    setSettings({
      ...settings,
      professionalTax: { ...settings.professionalTax, states: updatedStates },
    });
    setSelectedPtState(code);
    setIsAddStateDialogOpen(false);
    toast.success(`State ${name} (${code}) added with official PT slabs.`);
  };

  // Helper to delete a State from PT
  const handleDeleteState = (code: string) => {
    if (settings.professionalTax.states.length <= 1) {
      toast.error('You cannot delete the only configured state.');
      return;
    }

    const updatedStates = settings.professionalTax.states.filter((s) => s.code !== code);
    setSettings({
      ...settings,
      professionalTax: { ...settings.professionalTax, states: updatedStates },
    });

    if (selectedPtState === code) {
      setSelectedPtState(updatedStates[0].code);
    }
    toast.info(`State ${code} removed from Professional Tax.`);
  };

  // Preset selection handler in Add State Dialog
  const handlePresetSelect = (code: string) => {
    setSelectedPresetCode(code);
    if (code === 'CUSTOM') {
      setCustomStateName('');
      setCustomStateCode('');
    } else {
      const preset = PRESET_INDIAN_STATES.find((p) => p.code === code);
      if (preset) {
        setCustomStateName(preset.name);
        setCustomStateCode(preset.code);
      }
    }
  };

  // Helper to update LWF shares
  const handleUpdateLwf = (stateCode: string, field: 'employeeShare' | 'employerShare', val: number) => {
    const updatedStates = settings.lwf.states.map((st) => {
      if (st.code !== stateCode) return st;
      return { ...st, [field]: val };
    });
    setSettings({
      ...settings,
      lwf: { ...settings.lwf, states: updatedStates },
    });
  };

  // Helper to update Minimum wages
  const handleUpdateMinWage = (
    index: number,
    field: 'unskilled' | 'semiSkilled' | 'skilled' | 'highlySkilled',
    val: number
  ) => {
    const updated = [...settings.minimumWages];
    updated[index] = { ...updated[index], [field]: val };
    setSettings({ ...settings, minimumWages: updated });
  };

  return (
    <div className="space-y-4">
      {/* ── HEADER BANNER (CLEAN & NON-STICKY) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Indian Statutory Compliance & State Labor Rules
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click on any section to open or close its configuration. Use Expand / Collapse All for easy management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            className="h-8 text-xs font-medium"
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            className="h-8 text-xs font-medium"
          >
            Collapse All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="h-8 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" /> Save Statutory Settings
          </Button>
        </div>
      </div>

      {/* ── COLLAPSIBLE SECTION LIST ── */}
      <div className="space-y-3.5">
        {/* ══════════════════════════════════════════════════════════════════
            1. PROVIDENT FUND (PF)
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-border/80 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('pf')}
            className="bg-indigo-50/50 dark:bg-indigo-950/30 px-5 py-3.5 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-indigo-100/40 dark:hover:bg-indigo-950/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 shrink-0">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">1. Employees' Provident Fund (EPFO) Rules</span>
                  <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                    {settings.pf.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    • Rate: {settings.pf.employeeRate}% • Ceiling: ₹{settings.pf.wageCeiling.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Governed by the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-semibold text-muted-foreground">Enable:</span>
                <Switch
                  checked={settings.pf.enabled}
                  onCheckedChange={(val) => setSettings({ ...settings, pf: { ...settings.pf, enabled: val } })}
                />
              </div>
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground bg-muted/60">
                {openSections.pf ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {openSections.pf && (
            <CardContent className="p-5 space-y-5 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee PF Rate (%)</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={settings.pf.employeeRate}
                    onChange={(e) =>
                      setSettings({ ...settings, pf: { ...settings.pf, employeeRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard statutory contribution: 12%</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Statutory Wage Ceiling (₹)</Label>
                  <Input
                    type="number"
                    step={100}
                    value={settings.pf.wageCeiling}
                    onChange={(e) =>
                      setSettings({ ...settings, pf: { ...settings.pf, wageCeiling: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono text-indigo-600"
                  />
                  <p className="text-[10px] text-muted-foreground">EPFO ceiling cap is standard ₹15,000/month</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Admin Charges Rate (%)</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={settings.pf.adminRate}
                    onChange={(e) =>
                      setSettings({ ...settings, pf: { ...settings.pf, adminRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">EPFO administrative charge: 0.50%</p>
                </div>
              </div>

              {/* Employer Split Editable Inputs */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Employer PF Contribution Split (Total:{' '}
                    {(Number(settings.pf.employerEpfRate || 0) + Number(settings.pf.employerEpsRate || 0)).toFixed(2)}%)
                  </Label>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Standard Total: 12%
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">EPF (Provident Fund Rate %):</Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={settings.pf.employerEpfRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pf: { ...settings.pf, employerEpfRate: Number(e.target.value) },
                        })
                      }
                      className="h-8 text-xs font-bold font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Standard: 3.67%</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">EPS (Pension Scheme Rate %):</Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={settings.pf.employerEpsRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pf: { ...settings.pf, employerEpsRate: Number(e.target.value) },
                        })
                      }
                      className="h-8 text-xs font-bold font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Standard: 8.33% (Max ₹1,250)</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">EDLI (Insurance Rate %):</Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={settings.pf.edliRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pf: { ...settings.pf, edliRate: Number(e.target.value) },
                        })
                      }
                      className="h-8 text-xs font-bold font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Standard: 0.50% (Max ₹75)</p>
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Restrict PF Contribution to Statutory Ceiling</p>
                    <p className="text-[11px] text-muted-foreground">
                      Cap employer and employee PF to ₹{Math.round(settings.pf.wageCeiling * (settings.pf.employeeRate / 100))}/mo even if Basic exceeds ₹{settings.pf.wageCeiling.toLocaleString('en-IN')}.
                    </p>
                  </div>
                  <Switch
                    checked={settings.pf.restrictToWageCeiling}
                    onCheckedChange={(val) =>
                      setSettings({ ...settings, pf: { ...settings.pf, restrictToWageCeiling: val } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Allow Voluntary Provident Fund (VPF)</p>
                    <p className="text-[11px] text-muted-foreground">Permit employees to contribute beyond 12% towards their PF.</p>
                  </div>
                  <Switch
                    checked={settings.pf.allowVpf}
                    onCheckedChange={(val) => setSettings({ ...settings, pf: { ...settings.pf, allowVpf: val } })}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Auto-enroll Employees Earning Over Wage Ceiling</p>
                    <p className="text-[11px] text-muted-foreground">Enroll new joiners into PF even if their starting basic exceeds ₹{settings.pf.wageCeiling.toLocaleString('en-IN')}.</p>
                  </div>
                  <Switch
                    checked={settings.pf.autoEnrollOverCeiling}
                    onCheckedChange={(val) =>
                      setSettings({ ...settings, pf: { ...settings.pf, autoEnrollOverCeiling: val } })
                    }
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            2. ESIC
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-border/80 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('esi')}
            className="bg-rose-50/50 dark:bg-rose-950/30 px-5 py-3.5 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-rose-100/40 dark:hover:bg-rose-950/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 shrink-0">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">2. Employees' State Insurance (ESIC)</span>
                  <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                    {settings.esi.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    • Threshold: ≤ ₹{settings.esi.wageCeiling.toLocaleString('en-IN')}/mo • EE: {settings.esi.employeeRate}% | ER: {settings.esi.employerRate}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Statutory healthcare and social security for employees earning Gross Wages ≤ ₹21,000/mo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-semibold text-muted-foreground">Enable:</span>
                <Switch
                  checked={settings.esi.enabled}
                  onCheckedChange={(val) => setSettings({ ...settings, esi: { ...settings.esi, enabled: val } })}
                />
              </div>
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground bg-muted/60">
                {openSections.esi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {openSections.esi && (
            <CardContent className="p-5 space-y-5 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee Rate (%)</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={settings.esi.employeeRate}
                    onChange={(e) =>
                      setSettings({ ...settings, esi: { ...settings.esi, employeeRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Statutory: 0.75% of Gross Wages</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employer Rate (%)</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={settings.esi.employerRate}
                    onChange={(e) =>
                      setSettings({ ...settings, esi: { ...settings.esi, employerRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Statutory: 3.25% of Gross Wages</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Gross Wage Ceiling (₹)</Label>
                  <Input
                    type="number"
                    step={500}
                    value={settings.esi.wageCeiling}
                    onChange={(e) =>
                      setSettings({ ...settings, esi: { ...settings.esi, wageCeiling: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono text-indigo-600"
                  />
                  <p className="text-[10px] text-muted-foreground">Gross above ₹21,000/mo is exempt</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Disability Wage Ceiling (₹)</Label>
                  <Input
                    type="number"
                    step={500}
                    value={settings.esi.disabilityWageCeiling}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        esi: { ...settings.esi, disabilityWageCeiling: Number(e.target.value) },
                      })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Special ceiling: ₹25,000/mo</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            3. PROFESSIONAL TAX (PT) - WITH ADD STATE & ADD SLABS
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-border/80 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('pt')}
            className="bg-amber-50/50 dark:bg-amber-950/30 px-5 py-3.5 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-950/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">3. State-wise Professional Tax (PT) Slabs</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Active: {activePtStateConfig.name} ({activePtStateConfig.code})
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                    {settings.professionalTax.states.length} States Configured
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Configure state-specific tax slabs, add new states, or customize monthly and February tax rates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground bg-muted/60">
                {openSections.pt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {openSections.pt && (
            <CardContent className="p-0 animate-in fade-in-50 duration-200">
              {/* State Controls Bar */}
              <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold">Select State:</Label>
                  <Select value={selectedPtState} onValueChange={setSelectedPtState}>
                    <SelectTrigger className="h-8 w-52 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.professionalTax.states.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name} ({s.code}) — {s.slabs.length} Slabs
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Delete State Button */}
                  {settings.professionalTax.states.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteState(selectedPtState)}
                      className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                      title="Delete this state from Professional Tax"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddStateDialogOpen(true)}
                    className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New State
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPtSlabBracket}
                    className="h-8 text-xs font-semibold gap-1.5 border-amber-200 text-amber-800 hover:bg-amber-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Slab Bracket
                  </Button>
                </div>
              </div>

              {/* Slabs Table */}
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold pl-6">Min Wage (₹)</TableHead>
                    <TableHead className="text-xs font-bold">Max Wage (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Monthly Tax (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold">February Adjustment (₹)</TableHead>
                    <TableHead className="text-center text-xs font-bold pr-6 w-16">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePtStateConfig.slabs.map((slab, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6 text-xs font-medium">
                        <Input
                          type="number"
                          value={slab.min}
                          onChange={(e) => handleUpdatePtSlabField(idx, 'min', Number(e.target.value))}
                          className="h-7 w-28 text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={slab.max}
                            onChange={(e) => handleUpdatePtSlabField(idx, 'max', Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono"
                          />
                          {slab.max >= 50000000 && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">(And Above)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        <Input
                          type="number"
                          value={slab.monthlyTax}
                          onChange={(e) => handleUpdatePtSlabField(idx, 'monthlyTax', Number(e.target.value))}
                          className="h-7 w-28 text-right text-xs font-bold font-mono ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        <Input
                          type="number"
                          value={slab.febTax ?? slab.monthlyTax}
                          onChange={(e) => handleUpdatePtSlabField(idx, 'febTax', Number(e.target.value))}
                          className="h-7 w-28 text-right text-xs font-bold font-mono ml-auto text-amber-600"
                        />
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePtSlabBracket(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                          title="Delete this bracket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            4. LABOUR WELFARE FUND (LWF)
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-border/80 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('lwf')}
            className="bg-blue-50/50 dark:bg-blue-950/30 px-5 py-3.5 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-blue-100/40 dark:hover:bg-blue-950/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 shrink-0">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">4. Labour Welfare Fund (LWF) Rates</span>
                  <Badge variant="outline" className="text-[10px]">
                    {settings.lwf.states.length} States
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  State-specific employee & employer sharing ratios and remittance frequency cycles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground bg-muted/60">
                {openSections.lwf ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {openSections.lwf && (
            <CardContent className="p-0 animate-in fade-in-50 duration-200">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold pl-6">State</TableHead>
                    <TableHead className="text-xs font-bold">Deduction Frequency</TableHead>
                    <TableHead className="text-right text-xs font-bold">Employee Share (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold pr-6">Employer Share (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.lwf.states.map((st) => (
                    <TableRow key={st.code}>
                      <TableCell className="pl-6 font-semibold text-xs text-foreground">
                        {st.name} ({st.code})
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{st.frequency}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        <Input
                          type="number"
                          step={0.5}
                          value={st.employeeShare}
                          onChange={(e) => handleUpdateLwf(st.code, 'employeeShare', Number(e.target.value))}
                          className="h-7 w-24 text-right text-xs font-bold font-mono ml-auto text-rose-600"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold pr-6">
                        <Input
                          type="number"
                          step={0.5}
                          value={st.employerShare}
                          onChange={(e) => handleUpdateLwf(st.code, 'employerShare', Number(e.target.value))}
                          className="h-7 w-24 text-right text-xs font-bold font-mono ml-auto text-indigo-600"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            5. GRATUITY & BONUS
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-border/80 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('gratuity')}
            className="bg-emerald-50/50 dark:bg-emerald-950/30 px-5 py-3.5 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-emerald-100/40 dark:hover:bg-emerald-950/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">5. Payment of Gratuity Act Rules</span>
                  <Badge variant="outline" className="text-[10px]">
                    Ceiling: ₹{(settings.gratuity.statutoryCeiling / 100000).toFixed(0)} Lakhs • 5 Yrs Vesting
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Standard statutory formula: (15 × Last Drawn Basic × Tenure in Years) ÷ 26
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground bg-muted/60">
                {openSections.gratuity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {openSections.gratuity && (
            <CardContent className="p-5 space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Statutory Maximum Ceiling (₹)</Label>
                  <Input
                    type="number"
                    step={100000}
                    value={settings.gratuity.statutoryCeiling}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        gratuity: { ...settings.gratuity, statutoryCeiling: Number(e.target.value) },
                      })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Government statutory ceiling: ₹20,00,000</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Vesting Tenure Requirement (Years)</Label>
                  <Input
                    type="number"
                    value={settings.gratuity.minYearsRequired}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        gratuity: { ...settings.gratuity, minYearsRequired: Number(e.target.value) },
                      })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard 5 continuous years of service</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Monthly CTC Provision Factor</Label>
                  <div className="h-8 flex items-center text-xs font-bold text-indigo-600 font-mono">
                    4.81% of Monthly Basic ((15/26)/12)
                  </div>
                  <p className="text-[10px] text-muted-foreground">Employer CTC cost factor</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            6. MINIMUM WAGES
        ══════════════════════════════════════════════════════════════════ */}
        <Card className="border-border/80 shadow-2xs overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('minWage')}
            className="bg-purple-50/50 dark:bg-purple-950/30 px-5 py-3.5 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-purple-100/40 dark:hover:bg-purple-950/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">6. Minimum Wages Floors by State & Skill Level</span>
                  <Badge variant="outline" className="text-[10px]">
                    {settings.minimumWages.length} States/Zones
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Under the Minimum Wages Act & Code on Wages. System prevents saving basic salaries below these floors.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground bg-muted/60">
                {openSections.minWage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {openSections.minWage && (
            <CardContent className="p-0 animate-in fade-in-50 duration-200">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold pl-6">State / Zone</TableHead>
                    <TableHead className="text-right text-xs font-bold">Unskilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Semi-Skilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Skilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold pr-6">Highly Skilled (₹/mo)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.minimumWages.map((mw, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6 font-semibold text-xs text-foreground">
                        {mw.state}
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          Revised: {mw.lastRevised}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <Input
                          type="number"
                          value={mw.unskilled}
                          onChange={(e) => handleUpdateMinWage(idx, 'unskilled', Number(e.target.value))}
                          className="h-7 w-24 text-right text-xs font-mono ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <Input
                          type="number"
                          value={mw.semiSkilled}
                          onChange={(e) => handleUpdateMinWage(idx, 'semiSkilled', Number(e.target.value))}
                          className="h-7 w-24 text-right text-xs font-mono ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <Input
                          type="number"
                          value={mw.skilled}
                          onChange={(e) => handleUpdateMinWage(idx, 'skilled', Number(e.target.value))}
                          className="h-7 w-24 text-right text-xs font-mono font-semibold ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs pr-6">
                        <Input
                          type="number"
                          value={mw.highlySkilled}
                          onChange={(e) => handleUpdateMinWage(idx, 'highlySkilled', Number(e.target.value))}
                          className="h-7 w-24 text-right text-xs font-mono font-bold text-emerald-600 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      </div>

      {/* ── DIALOG: ADD NEW STATE TO PROFESSIONAL TAX ── */}
      <Dialog open={isAddStateDialogOpen} onOpenChange={setIsAddStateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" /> Add State to Professional Tax (PT)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an Indian state with standard PT rules or configure custom state parameters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Choose State Preset:</Label>
              <Select value={selectedPresetCode} onValueChange={handlePresetSelect}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_INDIAN_STATES.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name} ({p.code}) — {p.slabs.length} standard slabs
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM">+ Custom State (Other)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">State Name</Label>
                <Input
                  value={customStateName}
                  onChange={(e) => setCustomStateName(e.target.value)}
                  placeholder="e.g. Kerala"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">State Code (2 letters)</Label>
                <Input
                  value={customStateCode}
                  onChange={(e) => setCustomStateCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="e.g. KL"
                  className="h-8 text-xs uppercase font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Preset Slabs Included:</span>
              <p>
                When added, the state will automatically include its official statutory wage brackets. You can edit, add, or delete any slab after creation.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddStateDialogOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAddState}
              className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Add State & Configure Slabs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
