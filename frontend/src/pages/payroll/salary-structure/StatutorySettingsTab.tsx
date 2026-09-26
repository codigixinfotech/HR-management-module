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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { INITIAL_STATUTORY_SETTINGS, type StatutorySettingsData } from './mock-data';

export function StatutorySettingsTab() {
  const [settings, setSettings] = useState<StatutorySettingsData>(INITIAL_STATUTORY_SETTINGS);
  const [selectedPtState, setSelectedPtState] = useState<string>('MH');

  const activePtStateConfig = settings.professionalTax.states.find((s) => s.code === selectedPtState) || settings.professionalTax.states[0];

  const handleSave = () => {
    toast.success('Statutory settings successfully updated for active entity.');
  };

  return (
    <div className="space-y-4">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Indian Statutory Compliance & State Labor Rules
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure entity-specific Provident Fund (PF), ESIC, Professional Tax (PT), LWF, Gratuity, and State Minimum Wage floors.
          </p>
        </div>
        <Button onClick={handleSave} className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="h-4 w-4" /> Save Statutory Settings
        </Button>
      </div>

      <Tabs defaultValue="pf" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
          <TabsTrigger value="pf" className="text-xs font-bold px-3.5 h-8 gap-1.5">
            Provident Fund (PF)
          </TabsTrigger>
          <TabsTrigger value="esi" className="text-xs font-bold px-3.5 h-8 gap-1.5">
            ESIC
          </TabsTrigger>
          <TabsTrigger value="pt" className="text-xs font-bold px-3.5 h-8 gap-1.5">
            Professional Tax (PT)
          </TabsTrigger>
          <TabsTrigger value="lwf" className="text-xs font-bold px-3.5 h-8 gap-1.5">
            Labour Welfare Fund (LWF)
          </TabsTrigger>
          <TabsTrigger value="gratuity" className="text-xs font-bold px-3.5 h-8 gap-1.5">
            Gratuity & Bonus
          </TabsTrigger>
          <TabsTrigger value="min-wage" className="text-xs font-bold px-3.5 h-8 gap-1.5">
            Minimum Wages
          </TabsTrigger>
        </TabsList>

        {/* ── 1. PROVIDENT FUND (PF) ── */}
        <TabsContent value="pf" className="space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-6 py-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Employees' Provident Fund (EPFO) Rules</CardTitle>
                  <CardDescription className="text-xs">
                    Governed by the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Enable PF:</span>
                  <Switch
                    checked={settings.pf.enabled}
                    onCheckedChange={(val) => setSettings({ ...settings, pf: { ...settings.pf, enabled: val } })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee PF Rate (%)</Label>
                  <Input
                    type="number"
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
                    value={settings.pf.wageCeiling}
                    onChange={(e) =>
                      setSettings({ ...settings, pf: { ...settings.pf, wageCeiling: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">EPFO ceiling cap is currently ₹15,000/month</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Admin Charges Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.pf.adminRate}
                    onChange={(e) =>
                      setSettings({ ...settings, pf: { ...settings.pf, adminRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">EPFO administrative charge: 0.50%</p>
                </div>
              </div>

              {/* Employer Split */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/80 space-y-3">
                <Label className="text-xs font-bold text-foreground">Employer PF Contribution Split (Total 12%)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">EPF (Provident Fund):</span>
                    <p className="font-bold text-sm text-foreground mt-0.5">{settings.pf.employerEpfRate}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">EPS (Pension Scheme):</span>
                    <p className="font-bold text-sm text-foreground mt-0.5">{settings.pf.employerEpsRate}% (Max ₹1,250)</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">EDLI (Insurance):</span>
                    <p className="font-bold text-sm text-foreground mt-0.5">{settings.pf.edliRate}% (Max ₹75)</p>
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Restrict PF Contribution to ₹15,000 Wage Ceiling</p>
                    <p className="text-[11px] text-muted-foreground">Cap employer and employee PF to ₹1,800/mo even if Basic exceeds ₹15,000.</p>
                  </div>
                  <Switch
                    checked={settings.pf.restrictToWageCeiling}
                    onCheckedChange={(val) =>
                      setSettings({ ...settings, pf: { ...settings.pf, restrictToWageCeiling: val } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Allow Voluntary Provident Fund (VPF)</p>
                    <p className="text-[11px] text-muted-foreground">Permit employees to contribute beyond 12% towards their PF.</p>
                  </div>
                  <Switch
                    checked={settings.pf.allowVpf}
                    onCheckedChange={(val) =>
                      setSettings({ ...settings, pf: { ...settings.pf, allowVpf: val } })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. ESIC ── */}
        <TabsContent value="esi" className="space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-6 py-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Employees' State Insurance (ESIC)</CardTitle>
                  <CardDescription className="text-xs">
                    Statutory healthcare and social security for employees with Gross Wages ≤ ₹21,000/mo.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Enable ESI:</span>
                  <Switch
                    checked={settings.esi.enabled}
                    onCheckedChange={(val) => setSettings({ ...settings, esi: { ...settings.esi, enabled: val } })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee Contribution Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.esi.employeeRate}
                    onChange={(e) =>
                      setSettings({ ...settings, esi: { ...settings.esi, employeeRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Statutory: 0.75% of Gross Wages</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employer Contribution Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.esi.employerRate}
                    onChange={(e) =>
                      setSettings({ ...settings, esi: { ...settings.esi, employerRate: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Statutory: 3.25% of Gross Wages</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Gross Wage Eligibility Threshold (₹)</Label>
                  <Input
                    type="number"
                    value={settings.esi.wageCeiling}
                    onChange={(e) =>
                      setSettings({ ...settings, esi: { ...settings.esi, wageCeiling: Number(e.target.value) } })
                    }
                    className="h-8 text-xs font-bold font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Employees earning above ₹21,000/mo are exempt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. PROFESSIONAL TAX (PT) ── */}
        <TabsContent value="pt" className="space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-6 py-4 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold">State-wise Professional Tax (PT) Slabs</CardTitle>
                  <CardDescription className="text-xs">
                    Configured state slab deductions (including February higher adjustment e.g. ₹300 in Maharashtra).
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold">Select State:</Label>
                  <Select value={selectedPtState} onValueChange={setSelectedPtState}>
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.professionalTax.states.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold pl-6">Monthly Gross Wage Slabs</TableHead>
                    <TableHead className="text-right text-xs font-bold">Monthly Deduction (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold pr-6">February Adjustment (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePtStateConfig.slabs.map((slab, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6 text-xs font-medium">
                        ₹{slab.min.toLocaleString('en-IN')} -{' '}
                        {slab.max > 1000000 ? 'And Above' : `₹${slab.max.toLocaleString('en-IN')}`}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        ₹{slab.monthlyTax}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold pr-6 text-amber-600">
                        {slab.febTax ? `₹${slab.febTax}` : `₹${slab.monthlyTax}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 4. LABOUR WELFARE FUND (LWF) ── */}
        <TabsContent value="lwf" className="space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-6 py-4 border-b border-border/60">
              <CardTitle className="text-sm font-bold">Labour Welfare Fund (LWF) Rates</CardTitle>
              <CardDescription className="text-xs">
                State-specific employee & employer sharing ratios and remittance frequency cycles.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
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
                      <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                        ₹{st.employeeShare}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-indigo-600 pr-6">
                        ₹{st.employerShare}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 5. GRATUITY & BONUS ── */}
        <TabsContent value="gratuity" className="space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-6 py-4 border-b border-border/60">
              <CardTitle className="text-sm font-bold">Payment of Gratuity Act Rules</CardTitle>
              <CardDescription className="text-xs">
                Standard formula: (15 × Last Drawn Basic × Tenure in Years) ÷ 26
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Statutory Maximum Ceiling (₹)</Label>
                  <Input
                    type="number"
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
                  <Label className="text-xs font-semibold">Vesting Tenure Requirement</Label>
                  <Input
                    type="number"
                    value={settings.gratuity.minYearsRequired}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        gratuity: { ...settings.gratuity, minYearsRequired: Number(e.target.value) },
                      })
                    }
                    className="h-8 text-xs font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard 5 continuous years of service</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Monthly CTC Provision Factor</Label>
                  <div className="h-8 flex items-center text-xs font-bold text-indigo-600 font-mono">
                    4.81% of Monthly Basic ((15/26)/12)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 6. MINIMUM WAGES ── */}
        <TabsContent value="min-wage" className="space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="bg-muted/20 px-6 py-4 border-b border-border/60">
              <CardTitle className="text-sm font-bold">Minimum Wages Floors by State & Skill Level</CardTitle>
              <CardDescription className="text-xs">
                Under the Minimum Wages Act & Code on Wages. System prevents saving basic salaries below these floors.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold pl-6">State / Zone</TableHead>
                    <TableHead className="text-right text-xs font-bold">Unskilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Semi-Skilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Skilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Highly Skilled (₹/mo)</TableHead>
                    <TableHead className="text-right text-xs font-bold pr-6">Last Revised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.minimumWages.map((mw, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6 font-semibold text-xs text-foreground">{mw.state}</TableCell>
                      <TableCell className="text-right font-mono text-xs">₹{mw.unskilled.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono text-xs">₹{mw.semiSkilled.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">₹{mw.skilled.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">₹{mw.highlySkilled.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-[11px] text-muted-foreground pr-6">{mw.lastRevised}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
