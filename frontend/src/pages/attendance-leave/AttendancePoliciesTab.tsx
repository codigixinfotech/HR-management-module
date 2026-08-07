import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { HolidaysTab } from './HolidaysTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export function AttendancePoliciesTab() {
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  const gracePeriod = '15 Minutes';
  const geofencing = '200 Meters Radius';

  const handleUpdatePolicy = () => {
    toast.success('Attendance parameters updated in real-time edge devices');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Policies Parameter Cards ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Shift Clocking Policy Parameters
            </CardTitle>
            <CardDescription className="text-xs">
              Manage late arrival tolerance and biometric clocking settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Late Arrival Grace Window</span>
                <Badge variant="outline" className="font-mono">{gracePeriod}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Half-Day Auto Trigger</span>
                <Badge variant="outline" className="font-mono">After 120 Mins Late</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Overtime Base Rate</span>
                <Badge variant="outline" className="font-mono">Approved after +30 Mins Shift</Badge>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50">
              <Button size="sm" className="w-full text-xs font-semibold" onClick={handleUpdatePolicy}>
                Save Clocking Rules
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" /> Geofencing & GPS Punch Controls
            </CardTitle>
            <CardDescription className="text-xs">
              Configure coordinates and tolerances for field employees using mobile punch-in
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Punch Geofence Radius Limit</span>
                <Badge variant="outline" className="font-mono">{geofencing}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">HQ Coordinates (Latitude/Longitude)</span>
                <Badge variant="outline" className="font-mono">18.5204° N, 73.8567° E</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Biometric CCTV Face Sync</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">Enabled</Badge>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50">
              <Button size="sm" variant="outline" className="w-full text-xs font-semibold" onClick={handleUpdatePolicy}>
                Re-calibrate GPS Edge Terminals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Holidays Sub-tab ── */}
      <HolidaysTab companyId={undefined} companies={companies ?? []} />
    </div>
  );
}
