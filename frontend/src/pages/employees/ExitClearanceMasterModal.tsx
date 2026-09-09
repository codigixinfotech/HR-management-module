import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Settings2,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
  Filter,
  Info,
  Check,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { exitsApi, type ClearanceMasterRule } from '@/api/exits';

interface ExitClearanceMasterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
}

const SECTOR_OPTIONS = [
  { id: 'MANUFACTURING', label: 'Manufacturing & Industrial Plant' },
  { id: 'HEALTHCARE', label: 'Healthcare, Clinical & Hospitals' },
  { id: 'IT_TECH', label: 'IT, Software & Cloud Technology' },
  { id: 'BANKING_FINANCE', label: 'Banking, Financial Services & Insurance' },
  { id: 'RETAIL', label: 'Retail, Stores & Commercial Chains' },
  { id: 'CORPORATE', label: 'Corporate, Consulting & Professional Services' },
];

const TRIGGER_OPTIONS = [
  { id: 'NONE', label: 'None (Universal / Department-based)' },
  { id: 'HAS_ALLOCATED_ASSET', label: 'Employee Has Any Personal Asset Allocated' },
  { id: 'HAS_ALLOCATED_LAPTOP', label: 'Employee Has Allocated Laptop / Notebook' },
  { id: 'HAS_ALLOCATED_TOOLS', label: 'Employee Has Allocated Tools / Gauges' },
  { id: 'HAS_ALLOCATED_PPE', label: 'Employee Has Allocated PPE / Safety Gear' },
  { id: 'HAS_ALLOCATED_MOBILE', label: 'Employee Has Corporate Mobile / SIM' },
  { id: 'HAS_ACCESS_ACCOUNT', label: 'Employee Has System / Cloud Account' },
  { id: 'HAS_PHYSICAL_ACCESS', label: 'Employee Has Physical Access Card / Locker' },
  { id: 'HAS_OUTSTANDING_LOANS', label: 'Employee Has Active Company Loan' },
  { id: 'HAS_PENDING_EXPENSE_CLAIMS', label: 'Employee Has Pending Expense Claims' },
  { id: 'HAS_ADVANCE_BALANCE', label: 'Employee Has Travel / Salary Advance' },
  { id: 'HAS_PENDING_HANDOVER', label: 'Role Requires Project / Task Handover' },
  { id: 'EXIT_TYPE_INVOLUNTARY', label: 'Exit Type is Involuntary (Termination/Absconding)' },
  { id: 'EXIT_TYPE_CONTRACT_EXPIRY', label: 'Exit Type is Contract Expiry' },
];

export function ExitClearanceMasterModal({
  open,
  onOpenChange,
  companyId,
}: ExitClearanceMasterModalProps) {
  const queryClient = useQueryClient();
  const [selectedSector, setSelectedSector] = useState('MANUFACTURING');
  const [rules, setRules] = useState<ClearanceMasterRule[]>([]);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Rule Form State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleKey, setNewRuleKey] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newDept, setNewDept] = useState('Production & Operations');
  const [newMandatoryType, setNewMandatoryType] = useState<'MANDATORY' | 'CONDITIONAL' | 'OPTIONAL'>('CONDITIONAL');
  const [newScope, setNewScope] = useState<'ALL' | 'DEPARTMENT' | 'ROLE' | 'CONDITION_DRIVEN' | 'EXIT_TYPE_DRIVEN'>('CONDITION_DRIVEN');
  const [newTrigger, setNewTrigger] = useState('HAS_ALLOCATED_ASSET');

  const { data: clearanceMasterData, isLoading, refetch } = useQuery({
    queryKey: ['clearance-master', companyId],
    queryFn: () => exitsApi.getClearanceMaster(companyId),
    enabled: open,
  });

  useEffect(() => {
    if (clearanceMasterData) {
      setSelectedSector(clearanceMasterData.sector || 'MANUFACTURING');
      setRules(clearanceMasterData.rules || []);
    }
  }, [clearanceMasterData]);

  const saveMutation = useMutation({
    mutationFn: (payload: { sector: string; rules: ClearanceMasterRule[] }) =>
      exitsApi.saveClearanceMaster({ companyId, sector: payload.sector, rules: payload.rules }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clearance-master'] });
      toast.success('Clearance Master configuration updated successfully!');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save clearance rules');
    },
  });

  const resetMutation = useMutation({
    mutationFn: (sector: string) =>
      exitsApi.resetClearanceMasterToPreset({ companyId, sector }),
    onSuccess: (data) => {
      setRules(data.rules || []);
      setSelectedSector(data.sector);
      toast.success(`Reset rules to ${data.sector} industry standard preset!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reset rules');
    },
  });

  const handleSectorChange = (newSector: string) => {
    setSelectedSector(newSector);
    resetMutation.mutate(newSector);
  };

  const handleToggleRule = (index: number) => {
    const updated = [...rules];
    updated[index].isActive = !updated[index].isActive;
    setRules(updated);
  };

  const handleTypeChange = (index: number, type: 'MANDATORY' | 'CONDITIONAL' | 'OPTIONAL') => {
    const updated = [...rules];
    updated[index].mandatoryType = type;
    setRules(updated);
  };

  const handleTriggerChange = (index: number, trigger: string) => {
    const updated = [...rules];
    updated[index].conditionTrigger = trigger;
    setRules(updated);
  };

  const handleAddRule = () => {
    if (!newRuleKey.trim() || !newItemLabel.trim()) {
      toast.error('Rule Key and Task Description are required');
      return;
    }

    const formattedKey = newRuleKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = rules.some((r) => r.ruleKey === formattedKey);
    if (existing) {
      toast.error('Rule Key must be unique');
      return;
    }

    const newRule: ClearanceMasterRule = {
      ruleKey: formattedKey,
      itemLabel: newItemLabel.trim(),
      department: newDept.trim(),
      taskCategory: 'GENERAL',
      mandatoryType: newMandatoryType,
      applicableScope: newScope,
      conditionTrigger: newTrigger,
      isActive: true,
    };

    setRules([...rules, newRule]);
    setIsAddingRule(false);
    setNewRuleKey('');
    setNewItemLabel('');
    toast.success(`Task rule "${formattedKey}" added to configuration!`);
  };

  const handleDeleteRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
    toast.info('Rule removed from local configuration. Click "Save Configuration" to persist.');
  };

  // Filtered Rules
  const uniqueDepartments = Array.from(new Set(rules.map((r) => r.department))).filter(Boolean);

  const filteredRules = rules.filter((r) => {
    const matchesDept = deptFilter === 'ALL' || r.department === deptFilter;
    const matchesSearch =
      searchQuery === '' ||
      r.itemLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ruleKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Settings2 className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-bold">
                  Exit Clearance Master Configuration
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/5 text-primary border-primary/20">
                  {selectedSector} Preset
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure company-wide dynamic clearance rules. Personal equipment generates employee return tasks; fixed plant machinery is strictly excluded.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Top Control Bar: Industry Preset Selector & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-muted/40 rounded-xl border border-border/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Industry Sector Blueprint
                </Label>
                <Select value={selectedSector} onValueChange={handleSectorChange}>
                  <SelectTrigger className="h-8 w-72 text-xs font-semibold">
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetMutation.mutate(selectedSector)}
                disabled={resetMutation.isPending}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Preset
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddingRule(!isAddingRule)}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Rule
              </Button>
            </div>
          </div>

          {/* Add New Rule Accordion */}
          {isAddingRule && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-primary" /> Create New Clearance Master Rule
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground"
                  onClick={() => setIsAddingRule(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Stable Rule Key (Uppercase)</Label>
                  <Input
                    placeholder="e.g. LAB_SAFETY_CLEARANCE"
                    value={newRuleKey}
                    onChange={(e) => setNewRuleKey(e.target.value)}
                    className="h-8 text-xs font-mono font-semibold"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-[11px] font-medium">Clearance Task Description / Item Label</Label>
                  <Input
                    placeholder="e.g. Return of Hazardous Chemical Key & Lab Notebook"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Responsible Department</Label>
                  <Input
                    placeholder="e.g. Quality Assurance"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Master Classification</Label>
                  <Select
                    value={newMandatoryType}
                    onValueChange={(val: any) => setNewMandatoryType(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANDATORY" className="text-xs">
                        MANDATORY (Always blocks exit)
                      </SelectItem>
                      <SelectItem value="CONDITIONAL" className="text-xs">
                        CONDITIONAL (Blocks when required)
                      </SelectItem>
                      <SelectItem value="OPTIONAL" className="text-xs">
                        OPTIONAL (Never blocks exit)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Condition Trigger</Label>
                  <Select value={newTrigger} onValueChange={setNewTrigger}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setIsAddingRule(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
                  Add Rule to Matrix
                </Button>
              </div>
            </div>
          )}

          {/* Filtering & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setDeptFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  deptFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Departments ({rules.length})
              </button>
              {uniqueDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg whitespace-nowrap transition-all ${
                    deptFilter === dept
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dept} ({rules.filter((r) => r.department === dept).length})
                </button>
              ))}
            </div>

            <Input
              placeholder="Search tasks or rule keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs w-full sm:w-60"
            />
          </div>

          {/* Rules List / Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="p-3 bg-muted/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">
                  {deptFilter === 'ALL' && !searchQuery
                    ? `Configured Tasks Matrix (${rules.length} Rules)`
                    : `Showing ${filteredRules.length} of ${rules.length} Rules ${
                        deptFilter !== 'ALL' ? `• Department: ${deptFilter}` : ''
                      }`}
                </span>
                {(deptFilter !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setDeptFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold bg-primary/10 px-1.5 py-0.5 rounded"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Legend dynamically reflects the current filtered view for 100% mathematical consistency */}
              <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground font-mono flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> Mandatory:{' '}
                  {filteredRules.filter((r) => r.mandatoryType === 'MANDATORY').length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Conditional:{' '}
                  {filteredRules.filter((r) => r.mandatoryType === 'CONDITIONAL').length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" /> Optional:{' '}
                  {filteredRules.filter((r) => r.mandatoryType === 'OPTIONAL').length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border/80 max-h-[440px] overflow-y-auto">
              {filteredRules.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <p>No configured clearance rules match the selected filter.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      setDeptFilter('ALL');
                      setSearchQuery('');
                    }}
                  >
                    View All {rules.length} Rules
                  </Button>
                </div>
              ) : (
                filteredRules.map((rule) => {
                  const actualIndex = rules.findIndex((r) => r.ruleKey === rule.ruleKey);
                  return (
                    <div
                      key={rule.ruleKey}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                        rule.isActive ? 'hover:bg-muted/20' : 'bg-muted/30 opacity-60'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[10px] bg-background">
                            {rule.ruleKey}
                          </Badge>
                          <Badge className="text-[9.5px] font-semibold bg-muted text-foreground border-border/80">
                            Owner Dept: {rule.department}
                          </Badge>
                          {rule.mandatoryType === 'MANDATORY' && (
                            <Badge className="bg-rose-600 hover:bg-rose-700 text-[9.5px] text-white">
                              MANDATORY (BLOCKS EXIT)
                            </Badge>
                          )}
                          {rule.mandatoryType === 'CONDITIONAL' && (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-[9.5px] text-white">
                              CONDITIONAL
                            </Badge>
                          )}
                          {rule.mandatoryType === 'OPTIONAL' && (
                            <Badge className="bg-slate-600 hover:bg-slate-700 text-[9.5px] text-white">
                              OPTIONAL (NO BLOCK)
                            </Badge>
                          )}
                        </div>

                        <p className="font-semibold text-foreground text-xs">{rule.itemLabel}</p>

                        <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground flex-wrap">
                          <span className="text-primary/80 font-medium">Industry: {selectedSector}</span>
                          <span>•</span>
                          <span>Scope: <strong>{rule.applicableScope}</strong></span>
                          <span>•</span>
                          <span>
                            Trigger: <strong className="font-mono text-foreground">{rule.conditionTrigger}</strong>
                          </span>
                        </div>
                      </div>

                    {/* Inline Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={rule.mandatoryType}
                        onValueChange={(val: any) => handleTypeChange(actualIndex, val)}
                      >
                        <SelectTrigger className="h-7 w-28 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANDATORY" className="text-xs">
                            Mandatory
                          </SelectItem>
                          <SelectItem value="CONDITIONAL" className="text-xs">
                            Conditional
                          </SelectItem>
                          <SelectItem value="OPTIONAL" className="text-xs">
                            Optional
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant={rule.isActive ? 'default' : 'secondary'}
                        className={`h-7 text-[10px] font-mono px-2 ${
                          rule.isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        onClick={() => handleToggleRule(actualIndex)}
                      >
                        {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => handleDeleteRule(actualIndex)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate({ sector: selectedSector, rules })}
            disabled={saveMutation.isPending}
            className="text-xs gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
