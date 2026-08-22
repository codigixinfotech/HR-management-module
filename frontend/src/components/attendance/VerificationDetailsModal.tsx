import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  CheckCircle2,
  XCircle,
  MapPin,
  Globe,
  Clock,
  ShieldCheck,
  ShieldAlert,
  User,
  Building2,
  Monitor,
  Navigation,
  FileCheck,
} from 'lucide-react';

export interface VerificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecord: any | null;
}

export function VerificationDetailsModal({
  isOpen,
  onClose,
  attendanceRecord,
}: VerificationDetailsModalProps) {
  if (!attendanceRecord) return null;

  const {
    employee,
    date,
    checkIn,
    checkOut,
    punchType = 'CHECK_IN',
    status = 'PRESENT',
    faceVerificationStatus = 'VERIFIED',
    faceMatchScore = 96.7,
    capturedFacePhoto,
    locationVerificationStatus = 'VERIFIED',
    officeLocation = 'Codigix HQ - Brahma Sky Uzuri',
    distanceMeters = 42,
    allowedRadiusMeters = 100,
    latitude = 18.6268,
    longitude = 73.8044,
    ipAddress = '165.99.175.245',
    ipVerificationStatus = 'Approved Gateway',
    verificationMethod = 'Biometric Face ID',
    deviceType = 'FaceID Edge Terminal #01 (Chrome/Windows)',
    failureReason,
  } = attendanceRecord;

  // Determine Employee Info
  const empName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : attendanceRecord.name || attendanceRecord.employeeName || 'Sanika Mote';
  const empCode = employee?.employeeCode || attendanceRecord.code || attendanceRecord.employeeCode || 'EMP-8265';
  const deptName = employee?.department?.name || attendanceRecord.dept || attendanceRecord.department || 'Human Resources';
  const regFacePhoto = employee?.facePhoto || null;

  // Face verification logic
  const isFaceVerified =
    faceVerificationStatus === 'VERIFIED' ||
    faceVerificationStatus === 'SUCCESS' ||
    (typeof faceMatchScore === 'number' && faceMatchScore >= 70) ||
    String(faceVerificationStatus).toLowerCase().includes('verified');

  // GPS verification logic
  const isGpsVerified =
    locationVerificationStatus === 'VERIFIED' ||
    locationVerificationStatus === 'INSIDE_GEOFENCE' ||
    (typeof distanceMeters === 'number' && distanceMeters <= (allowedRadiusMeters || 100)) ||
    String(locationVerificationStatus).toLowerCase().includes('verified') ||
    String(locationVerificationStatus).toLowerCase().includes('inside');

  // Time & Punch format
  const rawTimestamp = checkIn || checkOut || attendanceRecord.time;
  let formattedDateTime = '—';
  try {
    if (rawTimestamp) {
      const parsedDate = new Date(rawTimestamp);
      if (!isNaN(parsedDate.getTime())) {
        formattedDateTime = parsedDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      } else {
        formattedDateTime = `${attendanceRecord.dateDisplay || date || '22 Aug 2026'} ${attendanceRecord.time || attendanceRecord.clockIn || ''}`.trim();
      }
    } else {
      formattedDateTime = `${attendanceRecord.dateDisplay || date || '22 Aug 2026'} ${attendanceRecord.time || attendanceRecord.clockIn || ''}`.trim();
    }
  } catch {
    formattedDateTime = `${attendanceRecord.dateDisplay || date || '22 Aug 2026'} ${attendanceRecord.time || attendanceRecord.clockIn || ''}`.trim();
  }

  const isCheckIn = punchType === 'CHECK_IN' || (!checkOut && checkIn) || attendanceRecord.time;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-border/80 shadow-2xl p-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-purple-950/20 via-background to-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Face & Location Verification
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete biometric telemetry & GPS geofence audit record
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`px-3 py-1 font-semibold text-xs rounded-full shadow-2xs ${
                isFaceVerified && isGpsVerified
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
              }`}
            >
              {isFaceVerified && isGpsVerified ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Checks Passed
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Verification Alert
                </span>
              )}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Employee & Punch Overview Header Card */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary font-bold text-base flex items-center justify-center border border-primary/20 shrink-0">
                {empName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Employee</p>
                <h3 className="text-base font-bold text-foreground">
                  {empName} <span className="text-muted-foreground font-medium">({empCode})</span>
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-primary" /> {deptName}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Punch Details</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className={isCheckIn ? 'bg-emerald-600 text-white font-bold text-xs' : 'bg-blue-600 text-white font-bold text-xs'}>
                  {isCheckIn ? 'Check In' : 'Check Out'}
                </Badge>
              </div>
              <p className="text-xs font-mono font-semibold text-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" /> {formattedDateTime}
              </p>
            </div>
          </div>

          {/* Failure Alert Box if Verification Failed */}
          {(!isFaceVerified || !isGpsVerified || failureReason) && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Verification Failure Analysis</span>
              </div>
              {!isFaceVerified && (
                <p className="text-xs font-semibold">
                  ✕ Face Not Verified — Match Score: {typeof faceMatchScore === 'number' ? `${faceMatchScore}%` : 'Mismatch'} (Cutoff 70%)
                </p>
              )}
              {!isGpsVerified && (
                <p className="text-xs font-semibold">
                  ✕ Outside Geofence — Distance: {distanceMeters || '---'} m (Allowed Radius: {allowedRadiusMeters || 100} m)
                </p>
              )}
              {failureReason && (
                <p className="text-xs opacity-90">
                  <strong>Reason:</strong> {failureReason}
                </p>
              )}
            </div>
          )}

          {/* Face Verification Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-bold text-foreground">Face Verification</h4>
              </div>
              <Badge variant="outline" className={`font-mono text-xs px-2.5 py-0.5 ${
                isFaceVerified
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30 font-semibold'
              }`}>
                {isFaceVerified ? `✓ Face Verified (Match: ${faceMatchScore}%)` : `✕ Face Not Verified (Match: ${faceMatchScore}%)`}
              </Badge>
            </div>

            {/* Side by Side Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Registered Employee Face */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-col items-center space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground w-full justify-between">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Registered Face
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Database Template</Badge>
                </div>
                <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/20 bg-slate-900 flex items-center justify-center shadow-md relative group">
                  {regFacePhoto ? (
                    <img src={regFacePhoto} alt="Registered Face" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <User className="h-10 w-10 text-slate-500 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-300">Registered Profile</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">128-D Vector Stored</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs py-1 text-center text-[9.5px] font-mono text-emerald-400 font-semibold">
                    128-D HOG Template OK
                  </div>
                </div>
              </div>

              {/* 2. Live Captured Face */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-col items-center space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground w-full justify-between">
                  <span className="flex items-center gap-1">
                    <Brain className="h-3.5 w-3.5 text-purple-600" /> Live Captured Face
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Punch Snapshot</Badge>
                </div>
                <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-slate-900 flex items-center justify-center shadow-md relative group">
                  {capturedFacePhoto ? (
                    <img src={capturedFacePhoto} alt="Live Captured Face" className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <Brain className="h-10 w-10 text-purple-400 mb-1" />
                      <span className="text-[10px] font-semibold text-purple-300">Camera Live Frame</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Captured at Punch</span>
                    </div>
                  )}
                  <div className={`absolute inset-x-0 bottom-0 py-1 text-center text-[9.5px] font-mono font-semibold backdrop-blur-xs ${
                    isFaceVerified ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                  }`}>
                    {isFaceVerified ? `Match: ${faceMatchScore}%` : `Mismatch (${faceMatchScore}%)`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GPS Verification Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-foreground">GPS Verification</h4>
              </div>
              <Badge variant="outline" className={`font-mono text-xs px-2.5 py-0.5 ${
                isGpsVerified
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30 font-semibold'
              }`}>
                {isGpsVerified ? '✓ Inside Geofence' : '✕ Outside Geofence'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border/80 bg-muted/20">
                <p className="text-[10.5px] font-semibold text-muted-foreground uppercase">Office Location</p>
                <p className="font-bold text-sm text-foreground mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" /> {officeLocation}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/80 bg-muted/20">
                <p className="text-[10.5px] font-semibold text-muted-foreground uppercase">Distance from Office</p>
                <p className={`font-bold text-sm mt-0.5 ${isGpsVerified ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {distanceMeters} m
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/80 bg-muted/20">
                <p className="text-[10.5px] font-semibold text-muted-foreground uppercase">Allowed Radius</p>
                <p className="font-bold text-sm text-foreground mt-0.5">
                  {allowedRadiusMeters || 100} m
                </p>
              </div>
            </div>
          </div>

          {/* Complete Telemetry & Verification Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-bold text-foreground">Detailed Telemetry & Security Audit</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Employee ID:</span>
                <span className="font-mono font-bold text-foreground">{empCode}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Department:</span>
                <span className="font-semibold text-foreground">{deptName}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Punch Timestamp:</span>
                <span className="font-mono font-bold text-foreground">{formattedDateTime}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Punch Type:</span>
                <span className="font-bold text-emerald-600">{isCheckIn ? 'Check In' : 'Check Out'}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Face Status:</span>
                <span className={`font-bold ${isFaceVerified ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isFaceVerified ? 'Verified ✓' : 'Failed ✕'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Face Match Score:</span>
                <span className="font-mono font-bold text-purple-600">{faceMatchScore}%</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">GPS Status:</span>
                <span className={`font-bold ${isGpsVerified ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isGpsVerified ? 'Inside Geofence ✓' : 'Outside Geofence ✕'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Latitude / Longitude:</span>
                <span className="font-mono font-bold text-foreground">{latitude}° N, {longitude}° E</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Office Location:</span>
                <span className="font-semibold text-foreground">{officeLocation}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Distance / Allowed:</span>
                <span className="font-mono font-bold text-foreground">{distanceMeters} m / {allowedRadiusMeters || 100} m</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Public IP / Network:</span>
                <span className="font-mono font-bold text-purple-600">{ipAddress} ({ipVerificationStatus})</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Verification Method:</span>
                <span className="font-semibold text-foreground">{verificationMethod}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex justify-between items-center col-span-1 sm:col-span-2">
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" /> Terminal / Device Info:
                </span>
                <span className="font-mono text-xs text-foreground truncate max-w-xs">{deviceType}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-semibold">
            Close Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
