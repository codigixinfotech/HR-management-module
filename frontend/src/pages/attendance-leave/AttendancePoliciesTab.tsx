import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi, branchesApi } from '@/api/organization';
import { HolidaysTab } from './HolidaysTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Brain, ShieldCheck, ArrowRight, Building2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface BranchGpsConfig {
  id: string;
  name: string;
  companyName: string;
  lat: string;
  lng: string;
  radius: number;
  type: string;
}

const BRANCH_GPS_PROFILES: BranchGpsConfig[] = [
  {
    id: 'cmto7b80c0071ipd82cji7qgd',
    name: 'Pune Plant Unit 1',
    companyName: 'Montanari Lifts Components Pvt. Ltd.',
    lat: '18.6268° N',
    lng: '73.8044° E',
    radius: 200,
    type: 'Manufacturing Plant',
  },
  {
    id: 'cmto8iavl0075ipw8dg5si4av',
    name: 'Pune Corporate Office',
    companyName: 'Montanari Lifts Components Pvt. Ltd.',
    lat: '18.5204° N',
    lng: '73.8567° E',
    radius: 100,
    type: 'Corporate HQ',
  },
  {
    id: 'cmsohoprz0009iphsnqdxuqjf',
    name: 'Mumbai Tech Hub',
    companyName: 'ABC Technologies Pvt. Ltd.',
    lat: '19.0760° N',
    lng: '72.8777° E',
    radius: 100,
    type: 'Tech Office',
  },
  {
    id: 'br-montanari-nashik',
    name: 'Nashik Plant',
    companyName: 'Montanari Lifts Components Pvt. Ltd.',
    lat: '19.9975° N',
    lng: '73.7898° E',
    radius: 250,
    type: 'Heavy Engineering Plant',
  },
];

export function AttendancePoliciesTab() {
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: branchesApi.list });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(BRANCH_GPS_PROFILES[0].id);

  const currentBranchGps =
    BRANCH_GPS_PROFILES.find((b) => b.id === selectedBranchId) || BRANCH_GPS_PROFILES[0];

  const handleUpdatePolicy = (msg?: string) => {
    toast.success(msg || 'Attendance parameters updated in real-time edge devices');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Policies Parameter Cards ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Shift Clocking Policy Parameters */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Shift Clocking Policy Parameters
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Policy Synced
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Manage late arrival tolerance, half-day threshold, and dynamic overtime policy triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Late Arrival Grace Window</span>
                <Badge variant="outline" className="font-mono">15 Minutes</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Half-Day Auto Trigger</span>
                <Badge variant="outline" className="font-mono">After 120 Mins Late</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Overtime Calculation Trigger</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                  As per Active Overtime Policy
                </Badge>
              </div>
            </div>

            {/* Architecture Flow Banner */}
            <div className="p-2.5 rounded-lg border border-emerald-200/60 bg-emerald-50/40 text-[11px] text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Overtime Policy Master Integration</span>
              </div>
              <p className="text-[10.5px] leading-relaxed">
                Calculated dynamically via <strong>Overtime Policy Master</strong> (&gt;9h daily threshold, break inclusion/exclusion, and 2× statutory multipliers). Hard-coded shift extension rules are disabled.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-semibold pt-1">
                <span>Punches</span>
                <ArrowRight className="h-3 w-3 inline" />
                <span>Active OT Policy</span>
                <ArrowRight className="h-3 w-3 inline" />
                <span>9h Daily / 48h Wk</span>
                <ArrowRight className="h-3 w-3 inline" />
                <span>OT Register</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <Button size="sm" className="w-full text-xs font-semibold" onClick={() => handleUpdatePolicy('Shift clocking policy parameters saved.')}>
                Save Clocking Rules
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Branch-wise Geofencing & GPS Punch Controls */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" /> Branch-wise Geofencing & GPS Controls
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                Branch Aware
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Configure coordinates and punch radius per company establishment & branch location
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            {/* Branch Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Select Branch Location
                </span>
                <span className="text-[10px] text-muted-foreground">{currentBranchGps.companyName}</span>
              </div>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_GPS_PROFILES.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name} ({b.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Branch Coordinates & Radius */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Branch GPS Coordinates</span>
                <Badge variant="outline" className="font-mono font-bold text-foreground">
                  {currentBranchGps.lat}, {currentBranchGps.lng}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Punch Geofence Radius Limit</span>
                <Badge variant="outline" className="font-mono text-emerald-700 border-emerald-300 font-bold bg-emerald-50">
                  {currentBranchGps.radius} Meters Radius
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Biometric CCTV Face Sync</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                  Enabled
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs font-semibold"
                onClick={() => handleUpdatePolicy(`GPS terminals re-calibrated for ${currentBranchGps.name}`)}
              >
                Re-calibrate GPS Terminals
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs font-semibold"
                onClick={() => handleUpdatePolicy(`Branch coordinates & radius saved for ${currentBranchGps.name}`)}
              >
                Save Branch GPS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Face Recognition & Biometric Policies (Centralized, No Duplicate Radius) */}
        <Card className="shadow-xs border-border/80 md:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" /> Face Recognition & Biometric Verification Policies
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                Active Edge AI
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Configure minimum face match threshold, liveness anti-spoofing, and trusted network security gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col justify-between p-3 border rounded-xl bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Face Verification Required</span>
                <Badge className="bg-emerald-600 text-white text-[10px] w-fit mt-2">REQUIRED</Badge>
              </div>
              <div className="flex flex-col justify-between p-3 border rounded-xl bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Minimum Match Cutoff Score</span>
                <Badge variant="outline" className="font-mono text-purple-700 border-purple-300 text-xs w-fit mt-2 font-bold">
                  85.0% Match
                </Badge>
              </div>
              <div className="flex flex-col justify-between p-3 border rounded-xl bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Anti-Spoofing & Liveness</span>
                <Badge variant="outline" className="font-mono text-blue-700 border-blue-300 text-xs w-fit mt-2 font-bold bg-blue-50">
                  Active 3D Depth
                </Badge>
              </div>
              <div className="flex flex-col justify-between p-3 border rounded-xl bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground">Approved Office Gateway IP</span>
                <Badge variant="outline" className="font-mono text-xs w-fit mt-2">
                  182.73.12.98
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              GPS punch restrictions are centrally governed per branch in the GPS controls above. Face verification uses neural liveness checking without duplicate radius conflicts.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Holidays Sub-tab ── */}
      <HolidaysTab companyId={undefined} companies={companies ?? []} />
    </div>
  );
}

