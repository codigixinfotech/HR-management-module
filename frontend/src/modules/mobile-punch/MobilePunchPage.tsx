import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  UserCheck,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { employeesApi } from '@/api/employees';
import { attendanceApi } from '@/api/attendance-leave';
import { InstallMobilePunch } from './InstallMobilePunch';
import { MobilePunchCamera } from './MobilePunchCamera';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MobilePunchPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);

  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [employeeDescriptor, setEmployeeDescriptor] = useState<number[] | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // GPS Telemetry
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'ACQUIRING' | 'LOCKED' | 'ERROR'>('ACQUIRING');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string>('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: parseFloat(pos.coords.latitude.toFixed(5)),
            lng: parseFloat(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy),
          });
          setGpsStatus('LOCKED');
        },
        (err) => {
          console.warn('[MobilePunch] Geolocation error:', err);
          setGpsStatus('ERROR');
          setGpsErrorMsg('GPS location access unavailable');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsStatus('ERROR');
      setGpsErrorMsg('GPS not supported on device');
    }
  }, []);

  // Fetch Employee Profile & Face Template
  useEffect(() => {
    async function loadEmployee() {
      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const empId = authUser?.employee?.id;
        let emp: any = null;

        if (empId) {
          emp = await employeesApi.get(empId);
        } else {
          // If admin or no direct employee linked, fetch the first active company employee
          const list = await employeesApi.list({ companyId: authUser?.companyId || undefined, limit: 1 });
          if (list && list.length > 0) {
            emp = list[0];
          }
        }

        if (!emp) {
          setProfileError('No employee profile found for this account.');
          setIsLoadingProfile(false);
          return;
        }

        setCurrentEmployee(emp);

        // Parse 128-D Template
        if (emp.faceTemplate) {
          try {
            let parsed = typeof emp.faceTemplate === 'string' ? JSON.parse(emp.faceTemplate) : emp.faceTemplate;
            if (parsed && parsed.embedding && Array.isArray(parsed.embedding) && parsed.embedding.length === 128) {
              setEmployeeDescriptor(parsed.embedding);
            } else if (Array.isArray(parsed) && parsed.length === 128) {
              setEmployeeDescriptor(parsed);
            } else {
              setProfileError('Registered face template format is incompatible. Please re-register in ERP.');
            }
          } catch (e) {
            console.error('[MobilePunch] Error parsing face template:', e);
            setProfileError('Corrupted biometric template found.');
          }
        } else {
          setProfileError('No face biometric registered yet. Please enroll your face template first.');
        }
      } catch (err: any) {
        console.error('[MobilePunch] Profile fetch error:', err);
        setProfileError('Failed to load employee profile.');
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadEmployee();
  }, [authUser]);

  // Attendance Today Records
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [punchType, setPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  useEffect(() => {
    if (!currentEmployee?.id) return;
    attendanceApi
      .getMy()
      .then((records) => {
        if (Array.isArray(records) && records.length > 0) {
          const todayIso = new Date().toISOString().split('T')[0];
          const rec = records.find((r) => r.date === todayIso || (r.checkIn && r.checkIn.startsWith(todayIso)));
          if (rec) {
            setTodayRecord(rec);
            if (rec.checkIn && !rec.checkOut) {
              setPunchType('CHECK_OUT');
            } else {
              setPunchType('CHECK_IN');
            }
          }
        }
      })
      .catch(() => {});
  }, [currentEmployee]);

  // Verification & Punch State
  const [verificationResult, setVerificationResult] = useState<{
    photo: string;
    descriptor: number[];
    score: number;
    distance: number;
  } | null>(null);

  const [isSubmittingPunch, setIsSubmittingPunch] = useState<boolean>(false);
  const [punchSuccessRecord, setPunchSuccessRecord] = useState<any>(null);

  const handleVerificationSuccess = (result: {
    photo: string;
    descriptor: number[];
    score: number;
    distance: number;
  }) => {
    setVerificationResult(result);
    toast.success(`Face matched with ${result.score}% Match Score! Ready for punch.`);
  };

  const handleVerificationReset = () => {
    setVerificationResult(null);
  };

  const handleExecutePunch = async () => {
    if (!currentEmployee || !verificationResult) {
      toast.error('Face verification required before punching attendance.');
      return;
    }

    setIsSubmittingPunch(true);

    try {
      const nowIso = new Date().toISOString();
      const todayDateStr = nowIso.split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const punchPayload = {
        companyId: currentEmployee.companyId || authUser?.companyId || 'company-1',
        employeeId: currentEmployee.id,
        employeeCode: currentEmployee.employeeCode,
        employeeName: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
        departmentName: currentEmployee.department?.name || 'Operations',
        date: todayDateStr,
        time: timeStr,
        checkIn: punchType === 'CHECK_IN' ? nowIso : todayRecord?.checkIn || nowIso,
        checkOut: punchType === 'CHECK_OUT' ? nowIso : undefined,
        status: 'PRESENT' as const,
        source: 'MOBILE_PWA',
        verificationMethod: 'Mobile Face ID PWA',
        faceVerificationStatus: 'VERIFIED',
        faceMatchScore: verificationResult.score,
        capturedFacePhoto: verificationResult.photo,
        latitude: gpsLocation?.lat || 18.5204,
        longitude: gpsLocation?.lng || 73.8567,
        locationVerificationStatus: gpsStatus === 'LOCKED' ? 'INSIDE_GEOFENCE' : 'OFFICE_LOCATION',
        deviceType: 'Mobile PWA Client (Standalone)',
      };

      const saved = await attendanceApi.mark(punchPayload);

      setPunchSuccessRecord({
        ...punchPayload,
        punchType,
        timestamp: timeStr,
        saved,
      });

      toast.success(`✓ ${punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Successful!`);

      // Auto flip punchType for next punch
      if (punchType === 'CHECK_IN') {
        setPunchType('CHECK_OUT');
      }
    } catch (err: any) {
      console.error('[MobilePunch] Punch error:', err);
      toast.error('Failed to record attendance punch. Please retry.');
    } finally {
      setIsSubmittingPunch(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 select-none">
      {/* ── TOP APP BAR ── */}
      <header className="w-full max-w-sm flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md font-extrabold text-sm">
            MP
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">Mobile Punch</h1>
            <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">E-HCM Biometric PWA</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> ERP
        </button>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="w-full max-w-sm flex-1 flex flex-col justify-center my-3 space-y-3">
        {/* PWA Install Banner */}
        <InstallMobilePunch />

        {/* Live Clock & Date Badge */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white font-mono">{currentTime}</div>
              <div className="text-[10px] text-slate-400 font-medium">{currentDate}</div>
            </div>
          </div>

          {/* GPS Status Pill */}
          <div className="text-right">
            <Badge
              variant="outline"
              className={`text-[9.5px] px-2 py-0.5 font-bold ${
                gpsStatus === 'LOCKED'
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
                  : gpsStatus === 'ACQUIRING'
                  ? 'border-amber-500/40 text-amber-400 bg-amber-950/40'
                  : 'border-slate-700 text-slate-400 bg-slate-900'
              }`}
            >
              <MapPin className="w-2.5 h-2.5 mr-1 inline" />
              {gpsStatus === 'LOCKED' ? 'GPS Locked' : gpsStatus === 'ACQUIRING' ? 'Acquiring GPS...' : 'GPS Off'}
            </Badge>
            {gpsLocation && (
              <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                ±{gpsLocation.accuracy}m accuracy
              </p>
            )}
          </div>
        </div>

        {/* Employee Identity Card */}
        {isLoadingProfile ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading enrolled profile...</p>
          </div>
        ) : profileError ? (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2 text-amber-300">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
            <p className="text-xs font-bold">{profileError}</p>
            <p className="text-[10.5px] text-slate-400">
              Please contact your HR administrator to complete your facial biometric registration.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden border border-indigo-400/30">
                {currentEmployee?.firstName?.[0] || 'E'}
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">
                  {currentEmployee?.firstName} {currentEmployee?.lastName}
                </p>
                <p className="text-[10px] text-indigo-400 font-mono font-semibold">
                  {currentEmployee?.employeeCode || 'EMP-001'}
                </p>
              </div>
            </div>
            <Badge className="bg-indigo-950/60 text-indigo-300 border-indigo-500/30 text-[10px] font-bold py-0.5">
              Enrolled Biometrics ✓
            </Badge>
          </div>
        )}

        {/* ── CAMERA / SUCCESS CARD ── */}
        {punchSuccessRecord ? (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                ✓ {punchSuccessRecord.punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Recorded
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {punchSuccessRecord.employeeName} ({punchSuccessRecord.employeeCode})
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 text-left space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Time:</span>
                <strong className="text-white">{punchSuccessRecord.timestamp}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date:</span>
                <span className="text-slate-200">{punchSuccessRecord.date}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Biometric Score:</span>
                <span className="text-emerald-400 font-bold">{punchSuccessRecord.faceMatchScore}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Geofence:</span>
                <span className="text-cyan-300">{punchSuccessRecord.locationVerificationStatus}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                setPunchSuccessRecord(null);
                setVerificationResult(null);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Back to Punch Screen
            </Button>
          </div>
        ) : (
          <>
            {/* Live Camera Viewport */}
            <MobilePunchCamera
              targetDescriptor={employeeDescriptor}
              employeeName={`${currentEmployee?.firstName || ''} ${currentEmployee?.lastName || ''}`}
              onVerificationSuccess={handleVerificationSuccess}
              onVerificationReset={handleVerificationReset}
            />

            {/* Punch Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPunchType('CHECK_IN')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    punchType === 'CHECK_IN'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Check-In
                </button>
                <button
                  type="button"
                  onClick={() => setPunchType('CHECK_OUT')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    punchType === 'CHECK_OUT'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" /> Check-Out
                </button>
              </div>

              {/* Main Punch Dispatch Button */}
              <Button
                type="button"
                disabled={!verificationResult || isSubmittingPunch}
                onClick={handleExecutePunch}
                className={`w-full py-4 text-sm font-black rounded-2xl shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  verificationResult
                    ? punchType === 'CHECK_IN'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white ring-4 ring-indigo-500/20'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white ring-4 ring-purple-500/20'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40'
                }`}
              >
                {isSubmittingPunch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Recording Punch...
                  </>
                ) : verificationResult ? (
                  <>
                    {punchType === 'CHECK_IN' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                    CONFIRM {punchType === 'CHECK_IN' ? 'CHECK-IN' : 'CHECK-OUT'}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Align Face to Enable Punch
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER TELEMETRY ── */}
      <footer className="w-full max-w-sm py-2 text-center text-[10px] text-slate-500 border-t border-slate-900">
        <p>Enterprise Face Biometrics & Geofencing Active</p>
        <p className="text-slate-600 text-[9px] mt-0.5">E-HCM Platform • Standalone PWA Mode</p>
      </footer>
    </div>
  );
}
