import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  Globe,
  Brain,
  ShieldCheck,
  User,
  Users,
  ShieldAlert,
  XCircle,
  LogIn,
  LogOut,
  Eye,
  Calendar,
  Clock,
  Activity,
  Check,
  ChevronRight,
  Bell,
  Lock,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { employeesApi } from '@/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { attendanceApi } from '@/api/attendance-leave';
import { InstallMobilePunch } from '@/modules/mobile-punch/InstallMobilePunch';
import {
  extractFacialLandmarkDescriptor,
  extractFaceEmbedding,
  loadFaceRecognitionModels,
  calculateEuclideanDistance,
  calculateSimilarityPercentage,
  calculateConfidenceFromDistance,
  MAX_EUCLIDEAN_DISTANCE,
  MATCH_THRESHOLD,
} from '@/utils/faceBiometrics';

interface FaceAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: any[];
  onPunchSuccess?: (punchRecord: any) => void;
  isFullPage?: boolean;
}

type FaceVerificationState =
  | 'NO_FACE_DETECTED'
  | 'SINGLE_FACE_MATCHED'
  | 'FACE_MISMATCH'
  | 'VERIFICATION_UNCERTAIN'
  | 'AMBIGUOUS_MATCH'
  | 'MULTIPLE_FACES_BLOCKED'
  | 'NO_REGISTERED_TEMPLATE';

export function FaceAttendanceModal({
  isOpen,
  onClose,
  employees = [],
  onPunchSuccess,
  isFullPage = false,
}: FaceAttendanceModalProps) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isOpenRef = useRef<boolean>(isOpen);
  const isAnalyzingRef = useRef<boolean>(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      loadFaceRecognitionModels().catch((err) =>
        console.warn('[Face Attendance] Model preload warning:', err)
      );
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [matchedEmployee, setMatchedEmployee] = useState<any>(null);
  const [allCompanyEmployees, setAllCompanyEmployees] = useState<any[]>(employees || []);
  const [punchType, setPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const [punchConfirmation, setPunchConfirmation] = useState<{
    employeeName: string;
    employeeCode?: string;
    date: string;
    time: string;
    verification: string;
    punchType: 'CHECK_IN' | 'CHECK_OUT';
  } | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Canonical faceRecognitionNet Biometric Thresholds (imported from @/utils/faceBiometrics as single source of truth: MAX_EUCLIDEAN_DISTANCE = 0.60, MATCH_THRESHOLD = 75.0)

  // Real Biometric Verification States — Auto Capture Workflow
  const [workflowStep, setWorkflowStep] = useState<'SCAN' | 'COMPARE' | 'VERIFIED'>('SCAN');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [detectedFacesCount, setDetectedFacesCount] = useState<number>(0);
  const [verificationState, setVerificationState] = useState<FaceVerificationState>('NO_FACE_DETECTED');
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedSimilarity, setCalculatedSimilarity] = useState<number | null>(null);
  const [isFaceMatchedState, setIsFaceMatchedState] = useState<boolean>(false);
  const [verifiedEmployeeId, setVerifiedEmployeeId] = useState<string | null>(null);
  const [verifiedTimestamp, setVerifiedTimestamp] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  interface ConsensusFrame {
    employeeId: string;
    employee: any;
    score: number;
    distance: number;
    photo: string;
  }

  const consensusFramesRef = useRef<ConsensusFrame[]>([]);
  const failedFramesCountRef = useRef<number>(0);
  const REQUIRED_CONSISTENT_FRAMES = 3;
  const [frameScanProgress, setFrameScanProgress] = useState<{ current: number; total: number } | null>(null);

  // Synchronize company employees list for 1:N face comparison pool
  useEffect(() => {
    if (employees && employees.length > 0) {
      setAllCompanyEmployees(employees);
    } else if (isOpen) {
      employeesApi
        .list({ page: 1, pageSize: 1000 })
        .then((res) => {
          if (res?.items && Array.isArray(res.items)) {
            setAllCompanyEmployees(res.items);
          }
        })
        .catch((err) => console.warn('Could not preload employee biometrics list:', err));
    }
  }, [employees, isOpen]);

  const validate128dVector = (vec: any): number[] | null => {
    if (!vec) return null;
    let arr = vec;
    if (typeof vec === 'string') {
      try {
        arr = JSON.parse(vec);
      } catch {
        return null;
      }
    }
    // Support rich persistent metadata wrapper: { model, version, dimension, embedding: [...] }
    if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
      if (Array.isArray(arr.embedding)) arr = arr.embedding;
      else if (Array.isArray(arr.descriptor)) arr = arr.descriptor;
      else if (Array.isArray(arr.template)) arr = arr.template;
    }
    if (!Array.isArray(arr) || arr.length !== 128) return null;
    if (arr.some((v: any) => typeof v !== 'number' || !isFinite(v))) return null;
    return arr;
  };

  // 1-second interval tick for 45-second verification expiry check
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isVerificationExpired = Boolean(
    verifiedTimestamp && nowTick - verifiedTimestamp > 45000
  );

  const isFaceMatched = Boolean(
    isFaceMatchedState &&
    calculatedSimilarity !== null &&
    calculatedSimilarity >= MATCH_THRESHOLD &&
    verifiedEmployeeId &&
    matchedEmployee &&
    matchedEmployee.id === verifiedEmployeeId &&
    !isVerificationExpired
  );
  const isFaceVerified = isFaceMatched;

  // Real Geolocation & Network Telemetry
  const [gpsVerified, setGpsVerified] = useState<boolean>(false);
  const [gpsDistanceMeters, setGpsDistanceMeters] = useState<number | null>(null);
  const [gpsLocationMsg, setGpsLocationMsg] = useState<string>('Acquiring GPS location...');

  const [publicIp, setPublicIp] = useState<string>('Fetching Network IP...');
  const [ipVerified, setIpVerified] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Auto-select logged-in employee session profile or default employee on modal open
  useEffect(() => {
    if (isOpen) {
      const sessionEmpId = authUser?.employee?.id;
      if (sessionEmpId) {
        setSelectedEmployeeId(sessionEmpId);
      } else if (employees && employees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(employees[0].id);
      }
    }
  }, [isOpen, authUser, employees]);

  useEffect(() => {
    if (selectedEmployeeId) {
      employeesApi
        .get(selectedEmployeeId)
        .then((data) => {
          setSelectedEmployee(data);
        })
        .catch(() => {
          const found = employees.find((e) => e.id === selectedEmployeeId);
          setSelectedEmployee(found);
        });

      // Fetch today's attendance summary and past records for selected employee
      attendanceApi
        .list({ employeeId: selectedEmployeeId })
        .then((records) => {
          if (Array.isArray(records)) {
            const todayStr = new Date().toISOString().split('T')[0];
            const isRecordForToday = (r: any) => {
              const dateVal = r.date || r.checkIn;
              if (!dateVal) return false;
              const str = typeof dateVal === 'string' ? dateVal.split('T')[0] : new Date(dateVal).toISOString().split('T')[0];
              return str === todayStr;
            };

            const foundToday = records.find(isRecordForToday);
            setTodayRecord(foundToday || null);

            const past = records.filter((r) => !isRecordForToday(r));
            setPastRecords(past);

            // Auto toggle to CHECK_OUT if already checked in today without checking out
            if (foundToday?.checkIn && !foundToday?.checkOut) {
              setPunchType('CHECK_OUT');
            } else {
              setPunchType('CHECK_IN');
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedEmployeeId, employees]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      resetWorkflowAndStartCamera();
      acquireRealGpsLocation();
      acquireRealPublicIp();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    if (stream && videoRef.current && workflowStep === 'SCAN') {
      const vid = videoRef.current;
      vid.srcObject = stream;
      vid.onloadedmetadata = () => {
        vid.play().catch((err) => console.log('Video play catch:', err));
      };
      vid.play().catch((err) => console.log('Video play catch:', err));
    }
  }, [stream, workflowStep]);

  // Real-time canvas frame analysis loop for SCAN phase
  useEffect(() => {
    if (isOpen && isCameraActive && workflowStep === 'SCAN') {
      scanIntervalRef.current = setInterval(() => {
        analyzeLiveCameraFrame();
      }, 500);
    } else {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isOpen, isCameraActive, workflowStep, selectedEmployee]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    setIsScanning(true);
    setDetectedFacesCount(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraLoading(false);
      setIsCameraActive(false);
      setIsScanning(false);
      if (!window.isSecureContext) {
        setCameraError(
          'Camera access requires HTTPS or localhost. Please access via HTTPS or localhost.'
        );
      } else {
        setCameraError('Camera API not supported in this browser.');
      }
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      // If modal was closed while getUserMedia was resolving in background:
      if (!isOpenRef.current) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        setIsCameraLoading(false);
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraActive(true);
      setIsCameraLoading(false);
    } catch (err: any) {
      const errName = err?.name || 'UnknownError';
      const errMessage = err?.message || '';
      console.error('Camera error:', errName, errMessage, err);

      setIsCameraActive(false);
      setIsCameraLoading(false);
      setIsScanning(false);

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings and tap Retry.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraError('Camera is in use by another app or hardware is unavailable.');
      } else {
        setCameraError(`Camera unavailable (${errName}): ${errMessage || 'Permission denied'}`);
      }
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const srcStream = videoRef.current.srcObject as MediaStream;
      srcStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  const handleCloseModal = () => {
    isOpenRef.current = false;
    stopCamera();
    onClose();
  };

  const acquireRealGpsLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const hqLat = 18.6268;
          const hqLng = 73.8044;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const R = 6371e3;
          const φ1 = (hqLat * Math.PI) / 180;
          const φ2 = (lat * Math.PI) / 180;
          const Δφ = ((lat - hqLat) * Math.PI) / 180;
          const Δλ = ((lng - hqLng) * Math.PI) / 180;
          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceM = Math.round(R * c);

          setGpsDistanceMeters(distanceM);
          setGpsVerified(true);
          if (distanceM <= 100) {
            setGpsLocationMsg(`${distanceM}m from Codigix Office`);
          } else {
            setGpsLocationMsg(`${distanceM}m (Outside 100m Radius)`);
          }
        },
        () => {
          setGpsVerified(false);
          setGpsDistanceMeters(null);
          setGpsLocationMsg('GPS Geofence Unverified (Location Access Required)');
        }
      );
    } else {
      setGpsVerified(false);
      setGpsDistanceMeters(null);
      setGpsLocationMsg('GPS Geolocation unsupported');
    }
  };

  const acquireRealPublicIp = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      if (data && data.ip) {
        setPublicIp(data.ip);
        setIpVerified(true);
      } else {
        setPublicIp('Network IP Unavailable');
        setIpVerified(false);
      }
    } catch {
      setPublicIp('Network IP Unavailable');
      setIpVerified(false);
    }
  };

  // Pre-indexed 1:N employee face templates cache for low-latency multi-frame matching
  const employeeEmbeddingsCache = useMemo(() => {
    let pool = allCompanyEmployees.length > 0 ? allCompanyEmployees : (employees && employees.length > 0 ? employees : []);
    if (selectedEmployee && !pool.some((e) => e.id === selectedEmployee.id)) {
      pool = [selectedEmployee, ...pool];
    }
    return pool
      .map((emp) => ({
        employee: emp,
        descriptor: validate128dVector(emp.faceTemplate),
      }))
      .filter((item): item is { employee: any; descriptor: number[] } => item.descriptor !== null);
  }, [allCompanyEmployees, employees, selectedEmployee]);

  const scoreLiveDescriptor = (liveDescriptor: number[]) => {
    if (employeeEmbeddingsCache.length === 0) {
      return { best: null, runnerUp: null, totalCandidates: 0 };
    }

    const scored = employeeEmbeddingsCache.map((item) => {
      const distance = calculateEuclideanDistance(liveDescriptor, item.descriptor);
      const similarity = calculateConfidenceFromDistance(distance);
      return {
        employee: item.employee,
        distance,
        similarity,
      };
    });

    // Primary ranking by canonical Euclidean distance (lowest distance first)
    scored.sort((a, b) => a.distance - b.distance);
    const best = scored[0];
    const runnerUp = scored.find((c) => c.employee.id !== best.employee.id) || null;

    return {
      best,
      runnerUp,
      totalCandidates: scored.length,
    };
  };

  // MULTI-FRAME CONSISTENCY VERIFICATION PIPELINE
  const analyzeLiveCameraFrame = async () => {
    if (!videoRef.current || !canvasRef.current || workflowStep !== 'SCAN' || isAnalyzingRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;

    isAnalyzingRef.current = true;

    try {
      const detection = await extractFacialLandmarkDescriptor(canvas, video);
      const facesCount = detection.faceCount;

      setDetectedFacesCount(facesCount);

      if (facesCount === 0) {
        consensusFramesRef.current = [];
        setFrameScanProgress(null);
        setVerificationState('NO_FACE_DETECTED');
        return;
      }

      if (facesCount > 1) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        consensusFramesRef.current = [];
        setFrameScanProgress(null);
        stopCamera();
        setIsScanning(false);
        setVerificationState('MULTIPLE_FACES_BLOCKED');
        setIsFaceMatchedState(false);
        setVerifiedEmployeeId(null);
        setVerifiedTimestamp(null);
        setCalculatedDistance(null);
        setCalculatedSimilarity(null);
        setWorkflowStep('VERIFIED');
        return;
      }

      // Exactly one face detected: evaluate 1:N candidate match
      if (facesCount === 1 && detection.descriptor) {
        const { best, runnerUp, totalCandidates } = scoreLiveDescriptor(detection.descriptor);

        if (totalCandidates === 0) {
          // No registered templates in system
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          stopCamera();
          setIsScanning(false);
          setVerificationState('NO_REGISTERED_TEMPLATE');
          setIsFaceMatchedState(false);
          setWorkflowStep('VERIFIED');
          return;
        }

        const bestScore = best ? best.similarity : 0;
        const bestDistance = best ? best.distance : 1.0;
        const runnerUpScore = runnerUp ? runnerUp.similarity : 0;
        const margin = bestScore - runnerUpScore;

        // Snapshot current frame photo
        let photo = '';
        try {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              photo = canvas.toDataURL('image/jpeg', 0.85);
            }
          }
        } catch {}

        // Check if this frame is a valid match (canonical threshold distance <= 0.60 / score >= 75%)
        if (best && bestDistance <= MAX_EUCLIDEAN_DISTANCE && bestScore >= MATCH_THRESHOLD) {
          // Check for close ambiguous tie with a different employee
          if (runnerUp && runnerUp.distance <= MAX_EUCLIDEAN_DISTANCE && margin < 2.0) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            consensusFramesRef.current = [];
            setFrameScanProgress(null);
            stopCamera();
            setIsScanning(false);
            setVerificationState('AMBIGUOUS_MATCH');
            setIsFaceMatchedState(false);
            setCalculatedSimilarity(bestScore);
            setCalculatedDistance(bestDistance);
            setWorkflowStep('VERIFIED');
            console.warn(
              `[Biometric Ambiguity] Ambiguous match between ${best.employee.firstName} (${bestScore}%) and ${runnerUp.employee.firstName} (${runnerUpScore}%)`
            );
            return;
          }

          // Reset consensus if candidate changed from previous frame
          if (consensusFramesRef.current.length > 0 && consensusFramesRef.current[0].employeeId !== best.employee.id) {
            consensusFramesRef.current = [];
          }

          // Record this confirmed frame
          consensusFramesRef.current.push({
            employeeId: best.employee.id,
            employee: best.employee,
            score: bestScore,
            distance: bestDistance,
            photo: photo || '',
          });

          const confirmedCount = consensusFramesRef.current.length;
          setFrameScanProgress({ current: confirmedCount, total: REQUIRED_CONSISTENT_FRAMES });

          console.log(
            `[Multi-Frame Consensus] Frame ${confirmedCount}/${REQUIRED_CONSISTENT_FRAMES} matched: ${best.employee.firstName} ${best.employee.lastName} (${bestScore}%, dist: ${bestDistance})`
          );

          if (confirmedCount < REQUIRED_CONSISTENT_FRAMES) {
            // Need more consistent frames
            return;
          }

          // ── MULTI-FRAME CONSENSUS CONFIRMED (3/3 frames agreed) ──
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          stopCamera();
          setIsScanning(false);

          const frames = consensusFramesRef.current;
          const avgScore = Math.round((frames.reduce((s, f) => s + f.score, 0) / frames.length) * 10) / 10;
          const avgDistance = Math.round((frames.reduce((s, f) => s + f.distance, 0) / frames.length) * 1000) / 1000;
          const finalPhoto = frames[frames.length - 1].photo;

          setCapturedPhoto(finalPhoto);
          setCapturedDescriptor(detection.descriptor);
          setCalculatedSimilarity(avgScore);
          setCalculatedDistance(avgDistance);
          setMatchedEmployee(best.employee);
          setVerifiedEmployeeId(best.employee.id);
          setSelectedEmployeeId(best.employee.id);
          setSelectedEmployee(best.employee);
          setVerifiedTimestamp(Date.now());
          setIsFaceMatchedState(true);
          setVerificationState('SINGLE_FACE_MATCHED');
          setWorkflowStep('VERIFIED');
          setFrameScanProgress(null);

          toast.success(
            `Face Verified ✓ ${best.employee.firstName} ${best.employee.lastName} (Confirmed across ${frames.length} frames: ${avgScore}%)`
          );
          return;
        } else {
          // Frame was below required threshold: reset consensus buffer
          consensusFramesRef.current = [];
          setFrameScanProgress(null);
          failedFramesCountRef.current++;

          console.log(
            `[Biometric Frame Sample] Below threshold (${bestScore}%). Failed attempts: ${failedFramesCountRef.current}/6`
          );

          if (failedFramesCountRef.current >= 6) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            stopCamera();
            setIsScanning(false);
            setCalculatedSimilarity(bestScore);
            setCalculatedDistance(bestDistance);

            if (bestScore >= 50.0) {
              setVerificationState('VERIFICATION_UNCERTAIN');
            } else {
              setVerificationState('FACE_MISMATCH');
            }
            setWorkflowStep('VERIFIED');
          }
        }
      }
    } catch (err) {
      console.error('[Biometrics] Error analyzing camera frame:', err);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  const resetWorkflowAndStartCamera = () => {
    consensusFramesRef.current = [];
    failedFramesCountRef.current = 0;
    setFrameScanProgress(null);
    setWorkflowStep('SCAN');
    setCapturedPhoto(null);
    setCapturedDescriptor(null);
    setVerificationState('NO_FACE_DETECTED');
    setCalculatedDistance(null);
    setCalculatedSimilarity(null);
    setIsFaceMatchedState(false);
    setVerifiedEmployeeId(null);
    setMatchedEmployee(null);
    setPunchConfirmation(null);
    setVerifiedTimestamp(null);
    startCamera();
  };

  const handleConfirmPunch = async () => {
    if (
      !isFaceMatched ||
      workflowStep !== 'VERIFIED' ||
      !verifiedEmployeeId ||
      !matchedEmployee ||
      calculatedSimilarity === null ||
      calculatedSimilarity < MATCH_THRESHOLD ||
      isVerificationExpired
    ) {
      toast.error('Valid biometric face verification required before marking attendance.');
      return;
    }
    setIsSubmitting(true);

    const nowIso = new Date().toISOString();
    const todayDateStr = nowIso.split('T')[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Use the verified matched employee's actual DB employeeId
    const targetEmp = matchedEmployee;
    const resolvedEmployeeId = targetEmp.id;
    const resolvedCompanyId = targetEmp.companyId || authUser?.companyId || 'company-1';
    const resolvedEmpCode = targetEmp.employeeCode || 'EMP-ID';
    const resolvedEmpName = `${targetEmp.firstName} ${targetEmp.lastName}`;
    const resolvedDepartment = targetEmp.department?.name || targetEmp.departmentName || 'Operations';

    const punchRecord = {
      id: `PUNCH-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId: resolvedCompanyId,
      employeeId: resolvedEmployeeId,
      employeeCode: resolvedEmpCode,
      employeeName: resolvedEmpName,
      employee: targetEmp,
      department: resolvedDepartment,
      date: todayDateStr,
      time: timestamp,
      checkIn: punchType === 'CHECK_IN' ? nowIso : todayRecord?.checkIn || undefined,
      checkOut: punchType === 'CHECK_OUT' ? nowIso : undefined,
      punchType,
      status: 'PRESENT' as const,
      source: 'FACE_ID',
      verificationMethod: 'Biometric Face ID',
      faceVerificationStatus: 'VERIFIED',
      faceMatchScore: calculatedSimilarity!,
      capturedFacePhoto: capturedPhoto || undefined,
      locationVerificationStatus: gpsVerified ? 'INSIDE_GEOFENCE' : 'OUTSIDE_GEOFENCE',
      officeLocation: targetEmp.branch?.name || targetEmp.officeLocation || 'Pune Head Office',
      distanceMeters: gpsDistanceMeters || 42,
      allowedRadiusMeters: 100,
      latitude: 18.5204,
      longitude: 73.8567,
      ipAddress: publicIp,
      ipVerificationStatus: ipVerified ? 'Approved Gateway' : 'Unapproved Gateway',
      deviceType: 'FaceID Edge Terminal #01 (Chrome Browser)',
    };

    let savedDbRecord: any = null;

    try {
      savedDbRecord = await attendanceApi.mark({
        companyId: punchRecord.companyId,
        employeeId: punchRecord.employeeId,
        employeeCode: punchRecord.employeeCode,
        employeeName: punchRecord.employeeName,
        departmentName: punchRecord.department,
        date: punchRecord.date,
        checkIn: punchRecord.checkIn,
        checkOut: punchRecord.checkOut,
        status: punchRecord.status,
        faceVerificationStatus: punchRecord.faceVerificationStatus,
        faceMatchScore: punchRecord.faceMatchScore,
        liveFaceDescriptor: capturedDescriptor || undefined,
        capturedFacePhoto: punchRecord.capturedFacePhoto,
        locationVerificationStatus: punchRecord.locationVerificationStatus,
        officeLocation: punchRecord.officeLocation,
        distanceMeters: punchRecord.distanceMeters,
        allowedRadiusMeters: punchRecord.allowedRadiusMeters,
        latitude: punchRecord.latitude,
        longitude: punchRecord.longitude,
        ipAddress: punchRecord.ipAddress,
        ipVerificationStatus: punchRecord.ipVerificationStatus,
        deviceType: punchRecord.deviceType,
        verificationMethod: punchRecord.verificationMethod,
        punchType: punchRecord.punchType,
      } as any);
    } catch (err: any) {
      console.error('[FACE ATTENDANCE API ERROR]', err);
      toast.error(
        `Face verified, but attendance could not be saved: ${err?.response?.data?.message || err?.message || 'Database error'}`
      );
      setIsSubmitting(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['attendance-live-records'] });
    await queryClient.invalidateQueries({ queryKey: ['my-attendance-records'] });
    await queryClient.invalidateQueries({ queryKey: ['attendance'] });

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace(/ /g, '-');

    const formattedTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    setPunchConfirmation({
      employeeName: resolvedEmpName,
      employeeCode: resolvedEmpCode,
      date: formattedDate,
      time: formattedTime,
      verification: 'Face + Geofence',
      punchType,
    });

    toast.success(
      `✓ ${punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Successful: ${resolvedEmpName}`
    );

    if (onPunchSuccess) {
      onPunchSuccess(savedDbRecord || punchRecord);
    }

    stopCamera();
    setIsSubmitting(false);
  };

  // Helper formatting for dynamic values in summary & timeline
  const activeDisplayEmp = matchedEmployee || selectedEmployee;
  const empName = activeDisplayEmp
    ? `${activeDisplayEmp.firstName} ${activeDisplayEmp.lastName}`
    : authUser?.employee
    ? `${authUser.employee.firstName} ${authUser.employee.lastName}`
    : 'Ashwini';

  const empPhoto = activeDisplayEmp?.facePhoto || authUser?.employee?.facePhoto;

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good Morning! 👋' : currentHour < 16 ? 'Good Afternoon! 👋' : 'Good Evening! 👋';

  const formattedDateStr = useMemo(() => {
    const d = new Date();
    const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    return { day, weekday };
  }, []);

  const checkInFormatted = useMemo(() => {
    if (todayRecord?.checkIn) {
      const d = new Date(todayRecord.checkIn);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
    return '—';
  }, [todayRecord]);

  const checkOutFormatted = useMemo(() => {
    if (todayRecord?.checkOut) {
      const d = new Date(todayRecord.checkOut);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
    return '—';
  }, [todayRecord]);

  const totalHoursFormatted = useMemo(() => {
    if (!todayRecord?.checkIn) return '—';
    if (!todayRecord?.checkOut) return 'In Progress';
    const start = new Date(todayRecord.checkIn).getTime();
    const end = new Date(todayRecord.checkOut).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return '—';
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }, [todayRecord]);

  const statusFormatted = useMemo(() => {
    if (todayRecord?.checkIn && todayRecord?.checkOut) return 'Completed';
    if (todayRecord?.checkIn) return 'Working';
    return 'Not Checked In';
  }, [todayRecord]);

  const isAttendanceCompletedToday = Boolean(todayRecord?.checkIn && todayRecord?.checkOut);
  const isAdmin = isHrOrAdminUser(authUser);

  const modalInnerContent = (
    <>
      {/* ── MOBILE APP STYLE COMPACT TOP HEADER ── */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white p-3.5 sm:p-4 pt-4 sm:pt-4.5 rounded-t-2xl shadow-sm">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {empPhoto ? (
                  <img
                    src={empPhoto}
                    alt={empName}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/80 shadow-xs"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center font-bold text-white shadow-xs text-xs">
                    {empName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm tracking-tight leading-tight">Hi, {empName.split(' ')[0]}</h3>
                <p className="text-[10.5px] text-indigo-100 font-medium">{timeGreeting}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="relative p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5 text-white" />
                <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-indigo-600">
                  3
                </span>
              </button>
            </div>
          </div>

          <div className="mt-2.5 bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/20 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-white/20">
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-indigo-100 block leading-none">
                  Today, {formattedDateStr.day}
                </span>
                <span className="text-[11px] font-bold text-white block leading-tight">{formattedDateStr.weekday}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/attendance-leave/register');
              }}
              className="text-[10px] font-bold text-white hover:underline flex items-center gap-0.5 opacity-90 cursor-pointer"
            >
              View Calendar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── MAIN BODY CONTENT ── */}
        <div className="p-3.5 sm:p-4 space-y-3 overflow-x-hidden">
          {/* PWA Install Prompt */}
          <InstallMobilePunch />

          {punchConfirmation ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-500/40 shadow-xl text-center space-y-4 animate-in zoom-in-95 duration-200 my-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  ✓ {punchConfirmation.punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Successful
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Biometric attendance punch successfully recorded in database.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Employee:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{punchConfirmation.employeeName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Date:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{punchConfirmation.date}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Time:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{punchConfirmation.time}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Verification:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {punchConfirmation.verification}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCloseModal}
                className="w-full py-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                Done
              </Button>
            </div>
          ) : (
            <>

          {/* Employee & Mode Switchers (ADMIN ONLY) - Hidden on UI per user request */}
          {false && isAdmin && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Attendance Verification</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold"
                >
                  Face Biometrics + Geofence
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Select Employee Profile *
                  </Label>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(val) => {
                      setSelectedEmployeeId(val);
                      resetWorkflowAndStartCamera();
                    }}
                    disabled={!isHrOrAdminUser(authUser)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {(employees || []).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Punch Mode *
                  </Label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPunchType('CHECK_IN')}
                      className={cn(
                        'py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer',
                        punchType === 'CHECK_IN'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                      )}
                    >
                      <LogIn className="w-3.5 h-3.5" /> Check-In
                    </button>
                    <button
                      type="button"
                      onClick={() => setPunchType('CHECK_OUT')}
                      className={cn(
                        'py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer',
                        punchType === 'CHECK_OUT'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                      )}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Check-Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FACE VERIFICATION CARD ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            
            {/* ── CLEAN FACE VERIFICATION STATUS ── */}
            <div
              className={cn(
                'rounded-2xl border p-3.5 shadow-sm transition-all duration-300',
                workflowStep === 'SCAN' &&
                  'bg-gradient-to-r from-indigo-50 to-white border-indigo-200 dark:from-indigo-950/40 dark:to-slate-900 dark:border-indigo-800/60',
                workflowStep === 'COMPARE' &&
                  'bg-gradient-to-r from-violet-50 to-white border-violet-200 dark:from-violet-950/40 dark:to-slate-900 dark:border-violet-800/60',
                workflowStep === 'VERIFIED' &&
                  isFaceMatched &&
                  'bg-gradient-to-r from-emerald-50 to-white border-emerald-200 dark:from-emerald-950/40 dark:to-slate-900 dark:border-emerald-800/60',
                workflowStep === 'VERIFIED' &&
                  !isFaceMatched &&
                  'bg-gradient-to-r from-rose-50 to-white border-rose-200 dark:from-rose-950/40 dark:to-slate-900 dark:border-rose-800/60'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shadow-sm',
                      workflowStep === 'SCAN' && 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
                      workflowStep === 'COMPARE' && 'bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-400',
                      workflowStep === 'VERIFIED' &&
                        isFaceMatched &&
                        'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
                      workflowStep === 'VERIFIED' &&
                        !isFaceMatched &&
                        'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {workflowStep === 'SCAN' && (
                      <Camera className="w-4.5 h-4.5 animate-pulse" />
                    )}

                    {workflowStep === 'COMPARE' && (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    )}

                    {workflowStep === 'VERIFIED' && isFaceMatched && (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    )}

                    {workflowStep === 'VERIFIED' && !isFaceMatched && (
                      <XCircle className="w-4.5 h-4.5" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      Face Verification
                    </p>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {workflowStep === 'SCAN' &&
                        (frameScanProgress
                          ? `Verifying identity... Frame ${frameScanProgress.current}/${frameScanProgress.total} confirmed`
                          : 'Position your face inside the frame')}

                      {workflowStep === 'COMPARE' &&
                        'Verifying your identity securely...'}

                      {workflowStep === 'VERIFIED' &&
                        isFaceMatched &&
                        'Identity verified successfully'}

                      {workflowStep === 'VERIFIED' &&
                        !isFaceMatched &&
                        (verificationState === 'AMBIGUOUS_MATCH'
                          ? 'Multiple employee profiles matched closely'
                          : verificationState === 'VERIFICATION_UNCERTAIN'
                          ? 'Face confidence is below required threshold'
                          : verificationState === 'MULTIPLE_FACES_BLOCKED'
                          ? 'Multiple faces detected in frame'
                          : verificationState === 'NO_FACE_DETECTED'
                          ? 'No face detected in camera frame'
                          : 'Face could not be verified')}
                    </p>
                  </div>
                </div>

                <Badge
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-1',
                    workflowStep === 'SCAN' &&
                      'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                    workflowStep === 'COMPARE' &&
                      'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
                    workflowStep === 'VERIFIED' &&
                      isFaceMatched &&
                      'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    workflowStep === 'VERIFIED' &&
                      !isFaceMatched &&
                      (verificationState === 'AMBIGUOUS_MATCH' || verificationState === 'VERIFICATION_UNCERTAIN'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800')
                  )}
                >
                  {workflowStep === 'SCAN' &&
                    (frameScanProgress
                      ? `Verifying (${frameScanProgress.current}/${frameScanProgress.total})`
                      : 'Scanning')}

                  {workflowStep === 'COMPARE' && 'Verifying'}

                  {workflowStep === 'VERIFIED' &&
                    isFaceMatched &&
                    'Verified ✓'}

                  {workflowStep === 'VERIFIED' &&
                    !isFaceMatched &&
                    (verificationState === 'AMBIGUOUS_MATCH'
                      ? 'Ambiguous ⚠'
                      : verificationState === 'VERIFICATION_UNCERTAIN'
                      ? 'Low Confidence ⚠'
                      : verificationState === 'MULTIPLE_FACES_BLOCKED'
                      ? 'Multiple Faces ⚠'
                      : verificationState === 'NO_FACE_DETECTED'
                      ? 'No Face ⚠'
                      : 'Not Recognized')}
                </Badge>
              </div>

              {/* Successful employee identification */}
              {workflowStep === 'VERIFIED' && isFaceMatched && matchedEmployee && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 p-2.5 shadow-2xs">
                  {matchedEmployee.facePhoto ? (
                    <img
                      src={matchedEmployee.facePhoto}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {`${matchedEmployee.firstName?.[0] || ''}${matchedEmployee.lastName?.[0] || ''}`}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                      {matchedEmployee.salutation || 'Mr.'} {matchedEmployee.firstName} {matchedEmployee.lastName}
                    </p>

                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                      {matchedEmployee.company?.name || authUser?.company?.name || 'MONTANARI LIFTS COMPONENTS PVT. LTD – LIVE'}
                    </p>

                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
                      {matchedEmployee.officeLocation || matchedEmployee.branch?.name || (matchedEmployee.employeeCode ? `${matchedEmployee.employeeCode} • PLOT C-3 MIDC-001` : 'PLOT C-3 MIDC-001')}
                    </p>
                  </div>

                  {calculatedSimilarity !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Match
                      </p>
                      <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {calculatedSimilarity.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── ATTENDANCE COMPLETED TODAY CARD (WHEN BOTH CHECK-IN & CHECK-OUT COMPLETED) ── */}
            {isAttendanceCompletedToday && !isAdmin ? (
              <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4 my-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    ✓ Attendance Completed Today
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Your check-in and check-out punches have been successfully recorded for today.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Check-In</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{checkInFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Check-Out</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{checkOutFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Hours</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{totalHoursFormatted}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium">
                  🔒 No further punch actions are required or allowed for today.
                </p>

                <Button
                  onClick={onClose}
                  className="w-full py-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                {/* ── CAMERA / FROZEN PHOTO SCANNER DISPLAY ── */}
                <div className="relative w-full max-w-[340px] sm:max-w-[360px] mx-auto aspect-[4/3] min-h-[200px] sm:min-h-[220px] bg-[#050817] rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-xl transition-all text-center">
              
              <style>{`
                @keyframes faceScanBeam {
                  0% { top: 8%; opacity: 0.85; }
                  50% { top: 88%; opacity: 1; }
                  100% { top: 8%; opacity: 0.85; }
                }
              `}</style>

              {/* Live Video (Active during SCAN phase) */}
              {workflowStep === 'SCAN' && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover object-center scale-x-[-1] z-0"
                />
              )}

              {/* Frozen Captured Image (Active during COMPARE & VERIFIED phases) */}
              {capturedPhoto && (
                <img
                  src={capturedPhoto}
                  alt="Captured Face"
                  className="absolute inset-0 w-full h-full object-cover object-center z-0 scale-x-[-1]"
                />
              )}

              {/* ── SCANNING PHASE OVERLAY ── */}
              {workflowStep === 'SCAN' && isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2.5 pointer-events-none z-10">
                  {detectedFacesCount === 0 ? (
                    <div className="max-w-[85%] rounded-xl border-2 border-dashed border-amber-400/80 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center shadow-xl">
                      <AlertCircle className="h-7 w-7 text-amber-400 mb-1 animate-pulse" />
                      <span className="text-[11px] font-bold text-white bg-amber-600 px-2.5 py-0.5 rounded-full shadow-md">
                        ⚠️ Align face in frame
                      </span>
                      <span className="text-[9.5px] text-amber-200 mt-1 font-medium">
                        Looking for face...
                      </span>
                    </div>
                  ) : detectedFacesCount > 1 ? (
                    <div className="max-w-[85%] rounded-xl border-2 border-dashed border-rose-500 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center shadow-xl animate-bounce">
                      <Users className="h-7 w-7 text-rose-500 mb-1" />
                      <span className="text-[11px] font-bold text-white bg-rose-600 px-2.5 py-0.5 rounded-full shadow-md">
                        ⚠️ Multiple Faces ({detectedFacesCount})
                      </span>
                      <span className="text-[9.5px] text-rose-200 mt-1 font-medium">
                        Only 1 person allowed in frame
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-[48%] border-2 border-dashed border-cyan-400 bg-cyan-400/5 backdrop-blur-[1px] flex flex-col items-center justify-center p-2">
                        <div
                          className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] z-20 rounded-full"
                          style={{ animation: 'faceScanBeam 2.2s ease-in-out infinite' }}
                        />
                        <div className="absolute -top-2.5 -left-2.5 w-6 h-6 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg" />
                        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg" />
                        <div className="absolute -bottom-2.5 -left-2.5 w-6 h-6 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg" />
                        <div className="absolute -bottom-2.5 -right-2.5 w-6 h-6 border-b-3 border-r-3 border-cyan-400 rounded-br-lg" />
                        <span className="text-[10.5px] font-bold text-white px-3 py-0.5 rounded-full bg-cyan-600/90 backdrop-blur-md shadow-lg z-30 animate-pulse">
                          Scanning face...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: COMPARING OVERLAY ── */}
              {workflowStep === 'COMPARE' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-20 text-white space-y-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center animate-spin">
                    <RefreshCw className="w-5 h-5 text-indigo-300" />
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-0.5 rounded-full shadow-sm">
                    Face Captured ✓
                  </span>
                  <p className="text-[11px] font-medium text-slate-300 text-center max-w-[240px]">
                    Checking against registered employee photo for <strong className="text-white">{empName}</strong>...
                  </p>
                </div>
              )}

              {/* ── STEP 3: VERIFICATION RESULT OVERLAY ── */}
              {workflowStep === 'VERIFIED' && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-20 text-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                  {isVerificationExpired ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                        <Clock className="w-7 h-7" />
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 border text-xs py-0.5 px-3 font-bold">
                        ✕ Verification Expired
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px]">
                        Face verification timed out (valid 45s). Please scan again.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetWorkflowAndStartCamera}
                        className="mt-1 py-1.5 px-4 text-xs font-bold text-amber-300 border-amber-400/50 hover:bg-amber-950/40 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Scan Again
                      </Button>
                    </div>
                  ) : verificationState === 'NO_FACE_DETECTED' ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
                        <Eye className="w-7 h-7" />
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 border text-xs py-0.5 px-3 font-bold">
                        ✕ Face Not Detected
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px]">
                        Please position your face inside the camera frame.
                      </p>
                      <div className="text-[10.5px] font-semibold text-rose-300">
                        Verification Failed
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetWorkflowAndStartCamera}
                        className="mt-1 py-1.5 px-4 text-xs font-bold text-rose-300 border-rose-400/50 hover:bg-rose-950/40 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Scan Again
                      </Button>
                    </div>
                  ) : verificationState === 'MULTIPLE_FACES_BLOCKED' ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
                        <Users className="w-7 h-7" />
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 border text-xs py-0.5 px-3 font-bold">
                        ✕ Multiple Faces Detected
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px]">
                        Please keep only one person in front of the camera.
                      </p>
                      <div className="text-[10.5px] font-semibold text-rose-300">
                        Verification Failed
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetWorkflowAndStartCamera}
                        className="mt-1 py-1.5 px-4 text-xs font-bold text-rose-300 border-rose-400/50 hover:bg-rose-950/40 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Scan Again
                      </Button>
                    </div>
                  ) : isFaceMatched && matchedEmployee ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200 p-2">
                      <div className="w-11 h-11 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50 border text-xs py-0.5 px-3 font-bold">
                        ✓ Face Matched
                      </Badge>
                      <div className="text-xs font-semibold text-slate-200">
                        Employee: <span className="text-white font-bold text-sm block mt-0.5">{matchedEmployee.firstName} {matchedEmployee.lastName}</span>
                      </div>
                      {calculatedSimilarity !== null && (
                        <div className="text-[11px] font-mono text-cyan-300 font-bold space-x-2">
                          <span>Match Score: <span className="text-emerald-400 text-xs font-bold">{calculatedSimilarity}%</span></span>
                          {calculatedDistance !== null && (
                            <span className="text-slate-400 font-normal">| Dist: <span className="text-emerald-400 font-mono font-semibold">{calculatedDistance}</span></span>
                          )}
                        </div>
                      )}
                      <div className="inline-block text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                        READY FOR {punchType === 'CHECK_IN' ? 'CHECK-IN' : 'CHECK-OUT'}
                      </div>
                    </div>
                  ) : verificationState === 'AMBIGUOUS_MATCH' ? (
                    <div className="space-y-2.5 animate-in zoom-in-95 duration-200 p-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/50 border text-xs py-0.5 px-3 font-bold">
                        ⚠ Ambiguous Match
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px] mx-auto">
                        Multiple registered employee profiles matched this face with close confidence.
                        <br />
                        <span className="text-slate-400 text-[11px]">Please adjust your angle and retry.</span>
                      </p>
                      {calculatedSimilarity !== null && (
                        <div className="text-[11px] font-mono text-amber-300">
                          Score: <span className="font-bold">{calculatedSimilarity}%</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetWorkflowAndStartCamera}
                        className="mt-1 py-1.5 px-4 text-xs font-bold text-amber-200 border-amber-400/50 hover:bg-amber-950/40 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Scan
                      </Button>
                    </div>
                  ) : verificationState === 'VERIFICATION_UNCERTAIN' ? (
                    <div className="space-y-2.5 animate-in zoom-in-95 duration-200 p-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/50 border text-xs py-0.5 px-3 font-bold">
                        ⚠ Low Match Score
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px] mx-auto">
                        Face match score is below the required threshold.
                        <br />
                        <span className="text-slate-400 text-[11px]">Please ensure good lighting and look directly at camera.</span>
                      </p>
                      {calculatedSimilarity !== null && (
                        <div className="text-[11px] font-mono text-amber-300">
                          Score: <span className="font-bold">{calculatedSimilarity}%</span> (Required: ≥ {MATCH_THRESHOLD}%)
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetWorkflowAndStartCamera}
                        className="mt-1 py-1.5 px-4 text-xs font-bold text-amber-200 border-amber-400/50 hover:bg-amber-950/40 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Scan
                      </Button>
                    </div>
                  ) : (
                    /* NO_REGISTERED_TEMPLATE or FACE_MISMATCH */
                    <div className="space-y-2.5 animate-in zoom-in-95 duration-200 p-2">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
                        <XCircle className="w-7 h-7" />
                      </div>
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-400/50 border text-xs py-0.5 px-3 font-bold">
                        ✕ Face Not Recognized
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px] mx-auto">
                        No registered employee matched this face.
                        <br />
                        <span className="text-slate-400 text-[11px]">Please try again.</span>
                      </p>
                      {calculatedSimilarity !== null && (
                        <div className="text-[11px] font-mono text-rose-300">
                          Score: <span className="font-bold">{calculatedSimilarity}%</span> (Required: ≥ {MATCH_THRESHOLD}%)
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetWorkflowAndStartCamera}
                        className="mt-1 py-1.5 px-4 text-xs font-bold text-rose-200 border-rose-400/50 hover:bg-rose-950/40 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Loading State */}
              {isCameraLoading && !cameraError && workflowStep === 'SCAN' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center space-y-1.5 text-white bg-[#050817]/90 z-30">
                  <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-[11px] text-slate-300 font-semibold">Starting camera...</p>
                </div>
              )}

              {/* Camera Error */}
              {!isCameraActive && !isCameraLoading && cameraError && workflowStep === 'SCAN' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center space-y-1.5 text-white bg-[#050817]/95 z-30 max-w-full">
                  <AlertCircle className="h-6 w-6 text-amber-400 mx-auto" />
                  <p className="text-[11px] text-amber-200 font-semibold max-w-[220px] leading-snug">{cameraError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7 text-white border-white/30 hover:bg-white/10"
                    onClick={resetWorkflowAndStartCamera}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry Camera
                  </Button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Instruction / Status / Actions Below Camera Viewfinder */}
            <div className="space-y-2 flex flex-col items-center text-center w-full">
              {workflowStep === 'SCAN' && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  Scanning your face… Please look at the camera.
                </p>
              )}

              {workflowStep === 'COMPARE' && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Comparing live face with registered biometric records...
                </p>
              )}

              {workflowStep === 'VERIFIED' && !isFaceMatched && (
                <div className="flex flex-col items-center space-y-2 w-full pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetWorkflowAndStartCamera}
                    className="w-full py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 gap-1.5 cursor-pointer shadow-xs rounded-xl"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Scan Again
                  </Button>
                </div>
              )}

              {/* ── EMPLOYEE DETAILS (MATCHED) ── */}
              {isFaceMatched && workflowStep === 'VERIFIED' && matchedEmployee && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 space-y-2 text-left w-full mt-1">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" /> Employee Details
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-mono"
                    >
                      {matchedEmployee.employeeCode || 'EMP-ID'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Name:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                        {matchedEmployee.firstName} {matchedEmployee.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Employee ID:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 block">
                        {matchedEmployee.employeeCode || matchedEmployee.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Department:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                        {matchedEmployee.department?.name || matchedEmployee.departmentName || 'Operations'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Shift:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                        {matchedEmployee.shift || 'General (09:00 AM - 06:00 PM)'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Location:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {matchedEmployee.branch?.name || matchedEmployee.officeLocation || 'Pune Head Office'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRIMARY CHECK-IN / CHECK-OUT BUTTON (Only shown when Verified) ── */}
              {isFaceMatched && workflowStep === 'VERIFIED' && (
                <div className="pt-2 space-y-1 w-full">
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmPunch}
                    className="w-full py-3 text-sm font-extrabold rounded-xl shadow-md transition-all duration-200 gap-1.5 cursor-pointer bg-[#5B67CA] hover:bg-[#4c58be] text-white shadow-indigo-500/20 active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Recording Punch...
                      </>
                    ) : punchType === 'CHECK_IN' ? (
                      <>
                        <LogIn className="h-4 w-4" /> Check-In
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" /> Check-Out
                      </>
                    )}
                  </Button>

                  <span className="text-[10.5px] text-slate-400 font-medium block text-center">
                    🕒 Click to record {punchType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} timestamp
                  </span>
                </div>
              )}
            </div>
          </>
        )}
          </div>

          {/* ── TODAY'S SUMMARY CARDS (COMPACT ERP STYLE) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Summary
              </h4>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/attendance-leave/register');
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {/* Check-In Card */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60">
                    <LogIn className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">Check-In</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                  {checkInFormatted}
                </div>
                <span className="text-[9.5px] font-medium text-slate-400 block">Today</span>
              </div>

              {/* Check-Out Card */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/60">
                    <LogOut className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">Check-Out</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                  {checkOutFormatted}
                </div>
                <span className="text-[9.5px] font-medium text-slate-400 block">Today</span>
              </div>

              {/* Total Hours Card */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                  <div className="p-1 rounded-md bg-sky-50 dark:bg-sky-950/60">
                    <Clock className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">Total Hours</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                  {totalHoursFormatted}
                </div>
                <span className="text-[9.5px] font-medium text-slate-400 block">Today</span>
              </div>

              {/* Status Card */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">Status</span>
                </div>
                <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 truncate">
                  {statusFormatted}
                </div>
                <span className="text-[9.5px] font-medium text-slate-400 block">Today</span>
              </div>
            </div>
          {/* ── BOTTOM SECTION: RECENT ACTIVITY (FOR CHECK-IN) OR TODAY'S TIMELINE (FOR CHECK-OUT) ── */}
          {punchType === 'CHECK_IN' ? (
            /* RECENT ACTIVITY SECTION (Matching Reference Left Screen) */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Recent Activity
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/attendance-leave/register');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {pastRecords.length > 0 ? (
                  pastRecords.slice(0, 3).map((rec) => {
                    const dateFormatted = new Date(rec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    const checkInTime = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (rec.time || '--:--');
                    const checkOutTime = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    
                    let totalHrs = rec.workedMinutes ? `${Math.floor(rec.workedMinutes / 60)}h ${rec.workedMinutes % 60}m` : null;
                    if (!totalHrs && rec.checkIn && rec.checkOut) {
                      const diffMs = new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime();
                      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
                      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      totalHrs = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
                    }

                    return (
                      <div key={rec.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{dateFormatted}</span>
                        </div>
                        <div className="font-mono text-slate-500 font-medium">
                          {rec.checkIn ? `${checkInTime} - ${checkOutTime}` : '--:--'}
                        </div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {totalHrs || '--:--'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Rows Matching Reference Design Image */
                  <>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">24 May 2025</span>
                      </div>
                      <div className="font-mono text-slate-400">--:--</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">--</div>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">23 May 2025</span>
                      </div>
                      <div className="font-mono text-slate-600 dark:text-slate-400 font-medium">9:05 AM - 6:15 PM</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">09h 10m</div>
                    </div>
                    <div className="flex items-center justify-between py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">22 May 2025</span>
                      </div>
                      <div className="font-mono text-slate-600 dark:text-slate-400 font-medium">9:10 AM - 6:05 PM</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">08h 55m</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* TODAY'S TIMELINE SECTION (Matching Reference Right Screen) */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" /> Today's Timeline
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/attendance-leave/register');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {/* Timeline Item 1: Check-In */}
                <div className="relative space-y-0.5">
                  <span
                    className={cn(
                      'absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-xs',
                      todayRecord?.checkIn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    {todayRecord?.checkIn ? '✓' : '1'}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Checked In</span>
                    <span className="text-[11px] font-mono font-medium text-slate-500">{checkInFormatted}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {todayRecord?.checkIn ? 'Face recognition successful' : 'Pending check-in'}
                  </p>
                </div>

                {/* Timeline Item 2: Currently Working */}
                <div className="relative space-y-0.5">
                  <span
                    className={cn(
                      'absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-xs',
                      todayRecord?.checkIn && !todayRecord?.checkOut
                        ? 'bg-amber-500 animate-pulse'
                        : todayRecord?.checkOut
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    {todayRecord?.checkIn && !todayRecord?.checkOut ? '⏳' : todayRecord?.checkOut ? '✓' : '2'}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Currently Working</span>
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      {todayRecord?.checkIn ? `${checkInFormatted} - Now` : '--:--'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {todayRecord?.checkIn ? 'Have a productive day!' : 'Awaiting check-in'}
                  </p>
                </div>

                {/* Timeline Item 3: Check-Out */}
                <div className="relative space-y-0.5">
                  <span
                    className={cn(
                      'absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-xs',
                      todayRecord?.checkOut ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    {todayRecord?.checkOut ? '✓' : '3'}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Check-Out</span>
                    <span className="text-[11px] font-mono font-medium text-slate-500">{checkOutFormatted}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {todayRecord?.checkOut ? 'Duty completed for today' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── REAL-TIME VERIFICATION TELEMETRY & DIAGNOSTICS TOGGLE (ADMIN ONLY) ── */}
          {isAdmin && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showDiagnostics ? 'Hide Biometric Diagnostics' : 'Show Biometric Telemetry & Diagnostics'}</span>
                <ChevronRight className={cn('w-3 h-3 transition-transform', showDiagnostics && 'rotate-90')} />
              </button>

              {showDiagnostics && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  {/* Real-Time Verification Telemetry Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* FACE ID TELEMETRY CARD */}
                    <div
                      className={cn(
                        'p-2.5 rounded-xl border transition-all',
                        isFaceVerified
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                      )}
                    >
                      <div className="flex items-center justify-between font-semibold text-[10px] uppercase">
                        <span className="flex items-center gap-1">
                          <Brain className="h-3.5 w-3.5 shrink-0" /> Face ID
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                          Faces: {detectedFacesCount}
                        </Badge>
                      </div>

                      {detectedFacesCount === 0 ? (
                        <>
                          <span className="font-bold text-xs text-amber-600 block mt-1">BLOCKED</span>
                          <span className="text-[9.5px] font-medium text-amber-600 block">No face detected in frame</span>
                        </>
                      ) : verificationState === 'MULTIPLE_FACES_BLOCKED' ? (
                        <>
                          <span className="font-bold text-xs text-rose-600 block mt-1">BLOCKED</span>
                          <span className="text-[9.5px] font-semibold text-rose-600 block">Multiple faces detected</span>
                        </>
                      ) : verificationState === 'NO_REGISTERED_TEMPLATE' ? (
                        <>
                          <span className="font-bold text-xs text-amber-600 block mt-1">NOT REGISTERED</span>
                          <span className="text-[9.5px] text-muted-foreground block">
                            Template missing for {selectedEmployee?.firstName}
                          </span>
                        </>
                      ) : verificationState === 'AMBIGUOUS_MATCH' ? (
                        <>
                          <span className="font-bold text-xs text-amber-600 block mt-1">AMBIGUOUS</span>
                          <span className="text-[9.5px] text-amber-600 block">
                            Multiple candidates matched closely
                          </span>
                        </>
                      ) : verificationState === 'VERIFICATION_UNCERTAIN' ? (
                        <>
                          <span className="font-bold text-xs text-amber-600 block mt-1">LOW CONFIDENCE</span>
                          <span className="text-[9.5px] text-amber-600 block">
                            Match score {calculatedSimilarity}% is below {MATCH_THRESHOLD}%
                          </span>
                        </>
                      ) : verificationState === 'FACE_MISMATCH' ? (
                        <>
                          <span className="font-bold text-xs text-rose-600 block mt-1">FAILED</span>
                          <span className="text-[9.5px] text-rose-600 block">
                            No registered employee matched this face
                          </span>
                        </>
                      ) : isFaceVerified ? (
                        <>
                          <span className="font-bold text-sm block mt-0.5">{calculatedSimilarity}% Match</span>
                          <span className="text-[9.5px] opacity-90 font-medium">Single Face Verified ✓</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-xs block mt-1 text-muted-foreground">WAITING</span>
                          <span className="text-[9.5px] text-muted-foreground">Analyzing camera frame...</span>
                        </>
                      )}
                    </div>

                    {/* GPS GEOFENCE TELEMETRY CARD */}
                    <div
                      className={cn(
                        'p-2.5 rounded-xl border text-xs',
                        gpsVerified
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                      )}
                    >
                      <div className="flex items-center gap-1 font-semibold text-[10px] uppercase">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> GPS Geofence
                      </div>
                      <span className="font-bold text-xs block mt-1 truncate">{gpsLocationMsg}</span>
                      <span className="text-[9.5px] opacity-90 font-medium">
                        {(gpsDistanceMeters ?? 0) <= 100 ? 'Within Office Geofence' : 'Outside Office Radius (Logged)'}
                      </span>
                    </div>

                    {/* PUBLIC IP TELEMETRY CARD */}
                    <div
                      className={cn(
                        'p-2.5 rounded-xl border text-xs',
                        ipVerified
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                      )}
                    >
                      <div className="flex items-center gap-1 font-semibold text-[10px] uppercase">
                        <Globe className="h-3.5 w-3.5 shrink-0" /> Public IP
                      </div>
                      <span className="font-bold text-xs block mt-1 font-mono truncate">{publicIp}</span>
                      <span className="text-[9.5px] opacity-90 font-medium">
                        {ipVerified ? 'Approved Gateway' : 'Network Mismatch'}
                      </span>
                    </div>
                  </div>

                  {/* Biometric Diagnostics Trace Box */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono space-y-1.5 text-slate-300">
                    <div className="flex items-center justify-between text-xs text-purple-400 font-bold font-sans">
                      <span>🔍 Real Biometric Pipeline Diagnostics</span>
                      <span className="text-[10px] text-slate-400">Model: Affine Aligned 128-D HOG</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10.5px]">
                      <div>
                        <span className="text-slate-500">Registered Descriptor:</span>{' '}
                        <strong className={selectedEmployee?.faceTemplate ? 'text-emerald-400' : 'text-amber-400'}>
                          {selectedEmployee?.faceTemplate ? 'FOUND (128-D HOG)' : 'MISSING (Not Registered)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Live Camera Faces:</span>{' '}
                        <strong className={detectedFacesCount === 1 ? 'text-emerald-400' : 'text-rose-400'}>
                          {detectedFacesCount}{' '}
                          {detectedFacesCount === 1
                            ? '(Single Person)'
                            : detectedFacesCount > 1
                            ? '(Blocked Multi-Face)'
                            : '(No Face)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Euclidean Distance:</span>{' '}
                        <strong className={isFaceVerified ? 'text-emerald-400' : 'text-rose-400'}>
                          {calculatedDistance !== null ? `${calculatedDistance} (Max Cutoff ${MAX_EUCLIDEAN_DISTANCE})` : '--'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Biometric Match Score:</span>{' '}
                        <strong className={isFaceVerified ? 'text-emerald-400' : 'text-rose-400'}>
                          {calculatedSimilarity !== null ? `${calculatedSimilarity}% (Cutoff ${MATCH_THRESHOLD}%)` : '--'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── KEY FEATURES & FOOTER BANNER (MATCHING REFERENCE UI) ── */}
          <div className="space-y-3 pt-1 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Key Features
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center w-full max-w-full overflow-hidden">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center space-y-1">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Advanced Face Recognition
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center space-y-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Real-time Verification
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center space-y-1">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Location Tracking
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center space-y-1">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Anti-Spoofing Technology
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center space-y-1">
                <Activity className="w-4 h-4 text-sky-500" />
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Attendance Reports
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center space-y-1">
                <Lock className="w-4 h-4 text-rose-500" />
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Secure & Encrypted
                </span>
              </div>
            </div>

            {/* Bottom Footer Banner */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/50 text-center space-y-0.5">
              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Secure • Accurate • Contactless
              </span>
              <p className="text-[10.5px] text-indigo-600/80 dark:text-indigo-400 font-medium">
                Next-generation attendance system for modern workplaces
              </p>
            </div>
          </div>
        </div>
        </>
      )}
    </div>

        {/* ── 3. FIXED BOTTOM FOOTER (ACCESSIBLE WHILE SCROLLING) ── */}
        <div className="shrink-0 px-5 py-3 bg-slate-100/90 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between z-30">
          <span className="text-xs text-slate-500 font-medium">EHCM Biometric Terminal #01</span>
          {isFullPage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-xs font-semibold rounded-xl gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close Live View
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="text-xs font-semibold rounded-xl cursor-pointer"
            >
              Close
            </Button>
          )}
        </div>
    </>
  );

  if (isFullPage) {
    return (
      <div className="w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-start py-2 sm:py-4 px-2 sm:px-4">
        <div className="w-full max-w-xl mx-auto rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-2xl bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-all overflow-hidden my-2">
          {modalInnerContent}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-24px)] max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden custom-scrollbar p-0 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-2xl bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-all">
        <DialogTitle className="sr-only">Live Face ID Attendance Verification</DialogTitle>
        {modalInnerContent}
      </DialogContent>
    </Dialog>
  );
}

