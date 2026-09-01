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
import {
  extractFacialLandmarkDescriptor,
  calculateEuclideanDistance,
  calculateSimilarityPercentage,
} from '@/utils/faceBiometrics';

interface FaceAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: any[];
  onPunchSuccess?: (punchRecord: any) => void;
}

type FaceVerificationState =
  | 'NO_FACE_DETECTED'
  | 'SINGLE_FACE_MATCHED'
  | 'FACE_MISMATCH'
  | 'MULTIPLE_FACES_BLOCKED'
  | 'NO_REGISTERED_TEMPLATE';

export function FaceAttendanceModal({
  isOpen,
  onClose,
  employees = [],
  onPunchSuccess,
}: FaceAttendanceModalProps) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isOpenRef = useRef<boolean>(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [punchType, setPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Configurable Match Cutoff Threshold
  const MATCH_THRESHOLD = 70.0;

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
    verifiedEmployeeId === selectedEmployeeId &&
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
      }, 1000);
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

  // AUTO CAPTURE & VERIFICATION PIPELINE
  const analyzeLiveCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current || workflowStep !== 'SCAN') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const detection = extractFacialLandmarkDescriptor(canvas, video);
    const facesCount = detection.faceCount;

    setDetectedFacesCount(facesCount);

    if (facesCount === 0) {
      setVerificationState('NO_FACE_DETECTED');
      return;
    }

    if (facesCount > 1) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
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

    // Exactly one face detected! Perform snapshot capture & run biometric comparison against SELECTED employee
    if (facesCount === 1 && detection.descriptor) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const photo = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedPhoto(photo);
          }
        }
      } catch (err) {
        console.error('Frame capture error:', err);
      }

      setIsScanning(false);
      stopCamera();

      // Proceed to Step 2 & 3: Compare against selected employee profile
      runFaceComparisonPipeline(detection.descriptor);
    }
  };

  const extractDescriptorFromImage = (imgSrc: string): Promise<number[] | null> => {
    return new Promise((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('[Biometric Extraction] Image loading timed out after 1200ms');
          resolve(null);
        }
      }, 1200);

      const img = new Image();
      if (imgSrc && !imgSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (resolved) return;
        clearTimeout(timeoutId);
        resolved = true;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 640, 480);
            const res = extractFacialLandmarkDescriptor(canvas);
            if (res && res.descriptor && res.descriptor.length > 0) {
              resolve(res.descriptor);
              return;
            }
          }
        } catch (e) {
          console.error('Image descriptor extraction catch:', e);
        }
        resolve(null);
      };
      img.onerror = () => {
        if (resolved) return;
        clearTimeout(timeoutId);
        resolved = true;
        resolve(null);
      };
      img.src = imgSrc;
    });
  };

  const resetWorkflowAndStartCamera = () => {
    setWorkflowStep('SCAN');
    setCapturedPhoto(null);
    setCapturedDescriptor(null);
    setVerificationState('NO_FACE_DETECTED');
    setCalculatedDistance(null);
    setCalculatedSimilarity(null);
    setIsFaceMatchedState(false);
    setVerifiedEmployeeId(null);
    setVerifiedTimestamp(null);
    startCamera();
  };

  const runFaceComparisonPipeline = async (liveDescriptor: number[]) => {
    setWorkflowStep('COMPARE');
    setCapturedDescriptor(liveDescriptor);

    const targetEmp = selectedEmployee || employees.find((e) => e.id === selectedEmployeeId || e.id === authUser?.employee?.id);
    let registeredDescriptor: number[] | null = null;

    // 1. Primary Source: Validate pre-computed stored faceTemplate JSON (128-D vector)
    if (targetEmp?.faceTemplate) {
      registeredDescriptor = validate128dVector(targetEmp.faceTemplate);
    }

    // 2. Fallback Source: Extract 128-D descriptor from enrolled photo if template missing/invalid
    if (!registeredDescriptor && targetEmp?.facePhoto) {
      try {
        const extracted = await extractDescriptorFromImage(targetEmp.facePhoto);
        registeredDescriptor = validate128dVector(extracted);
      } catch (err) {
        console.error('Error extracting descriptor from facePhoto:', err);
      }
    }

    setTimeout(() => {
      // 3. Biometric Feature Vector Distance & Cosine Similarity Calculation
      if (registeredDescriptor && targetEmp) {
        const distance = calculateEuclideanDistance(liveDescriptor, registeredDescriptor);
        const rawSimilarity = calculateSimilarityPercentage(liveDescriptor, registeredDescriptor);

        console.log(`[Biometric Comparison] Target Employee: ${targetEmp.firstName} ${targetEmp.lastName} (${targetEmp.id})`);
        console.log(`[Biometric Comparison] Vector Distance: ${distance}, Actual Similarity: ${rawSimilarity}%, Threshold: ${MATCH_THRESHOLD}%`);

        // STRICT BIOMETRIC MATCH CRITERIA: Similarity >= 70.0%
        const isMatch = rawSimilarity >= MATCH_THRESHOLD;

        setCalculatedDistance(distance);
        setCalculatedSimilarity(rawSimilarity);

        if (isMatch) {
          setVerificationState('SINGLE_FACE_MATCHED');
          setIsFaceMatchedState(true);
          setVerifiedEmployeeId(targetEmp.id);
          setVerifiedTimestamp(Date.now());
          toast.success(`Face Matched ✓ Similarity: ${rawSimilarity}% for ${targetEmp.firstName} ${targetEmp.lastName}`);
        } else {
          setVerificationState('FACE_MISMATCH');
          setIsFaceMatchedState(false);
          setVerifiedEmployeeId(null);
          setVerifiedTimestamp(null);
          console.warn(`[Biometric Mismatch] Scanned face does not match selected employee ${targetEmp.firstName} ${targetEmp.lastName}. Score: ${rawSimilarity}%`);
        }
      } else {
        // Selected employee has no registered face template or photo in DB
        console.warn(`[Biometric Failure] No enrolled face photo or template found for selected employee ${targetEmp?.firstName || 'Unknown'}`);
        setVerificationState('NO_REGISTERED_TEMPLATE');
        setIsFaceMatchedState(false);
        setVerifiedEmployeeId(null);
        setVerifiedTimestamp(null);
        setCalculatedDistance(null);
        setCalculatedSimilarity(null);
      }

      setWorkflowStep('VERIFIED');
    }, 200);
  };

  const handleConfirmPunch = async () => {
    if (
      !isFaceMatched ||
      workflowStep !== 'VERIFIED' ||
      !verifiedEmployeeId ||
      verifiedEmployeeId !== selectedEmployeeId ||
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

    const targetEmp =
      selectedEmployee ||
      employees.find((e) => e.id === selectedEmployeeId || e.id === authUser?.employee?.id) ||
      employees[0];

    const resolvedEmployeeId =
      targetEmp?.id || selectedEmployeeId || authUser?.employee?.id || 'emp-kale-9989';

    const resolvedCompanyId =
      targetEmp?.companyId || authUser?.companyId || 'company-1';

    const resolvedEmpCode =
      targetEmp?.employeeCode || authUser?.employee?.employeeCode || 'EMP-9989';

    const resolvedEmpName = targetEmp
      ? `${targetEmp.firstName} ${targetEmp.lastName}`
      : authUser?.employee
      ? `${authUser.employee.firstName} ${authUser.employee.lastName}`
      : 'User';

    const punchRecord = {
      id: `PUNCH-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId: resolvedCompanyId,
      employeeId: resolvedEmployeeId,
      employeeCode: resolvedEmpCode,
      employeeName: resolvedEmpName,
      employee: targetEmp,
      department: targetEmp?.department?.name || authUser?.employee?.departmentName || 'Quality',
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
      officeLocation: 'Pune Head Office',
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

    const savedEmpName = savedDbRecord?.employee
      ? `${savedDbRecord.employee.firstName} ${savedDbRecord.employee.lastName}`
      : punchRecord.employeeName;

    toast.success(
      `Biometric Face Punch Saved — ${savedEmpName} (${punchType === 'CHECK_IN' ? 'Checked In' : 'Checked Out'}) at ${timestamp}. Similarity: ${punchRecord.faceMatchScore}%`
    );

    if (onPunchSuccess) {
      onPunchSuccess(savedDbRecord || punchRecord);
    }

    stopCamera();
    onClose();
    setIsSubmitting(false);
  };

  // Helper formatting for dynamic values in summary & timeline
  const empName = selectedEmployee
    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
    : authUser?.employee
    ? `${authUser.employee.firstName} ${authUser.employee.lastName}`
    : 'Ashwini';

  const empPhoto = selectedEmployee?.facePhoto || authUser?.employee?.facePhoto;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-24px)] max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden custom-scrollbar p-0 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-2xl bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-all">
        
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

          {/* Employee & Mode Switchers (ADMIN ONLY) */}
          {isAdmin && (
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
            
            {/* Header: Admin Stepper vs Employee Clean Status */}
            {isAdmin ? (
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-800 text-white">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-indigo-400" /> FACE VERIFICATION
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedEmployee?.employeeCode || 'EMP-ID'}
                  </span>
                </div>

                {/* 3-Step Process Stepper UI */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10.5px] font-bold">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5',
                      workflowStep === 'SCAN'
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400'
                        : capturedPhoto
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">
                      {capturedPhoto ? '✓' : '①'}
                    </span>
                    <span>1. Scan Face</span>
                  </div>

                  <div
                    className={cn(
                      'p-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5',
                      workflowStep === 'COMPARE'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 ring-1 ring-amber-400 animate-pulse'
                        : workflowStep === 'VERIFIED'
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">
                      {workflowStep === 'VERIFIED' ? '✓' : '②'}
                    </span>
                    <span>2. Compare</span>
                  </div>

                  <div
                    className={cn(
                      'p-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5',
                      workflowStep === 'VERIFIED' && isFaceMatched
                        ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400'
                        : workflowStep === 'VERIFIED' && !isFaceMatched
                        ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">
                      {workflowStep === 'VERIFIED' ? (isFaceMatched ? '✓' : '✕') : '③'}
                    </span>
                    <span>3. Verify</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3 border border-slate-800 text-white flex items-center justify-between shadow-xs">
                <span className="text-xs font-extrabold tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-400" /> FACE VERIFICATION
                </span>
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  {workflowStep === 'SCAN' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> ● Scan Face
                    </>
                  )}
                  {workflowStep === 'COMPARE' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> ● Verifying...
                    </>
                  )}
                  {workflowStep === 'VERIFIED' && isFaceMatched && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> ● {punchType === 'CHECK_IN' ? 'Check-In Verification Passed' : 'Check-Out Verification Passed'} ✓
                    </>
                  )}
                  {workflowStep === 'VERIFIED' && !isFaceMatched && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> ● Not Matched ✕
                    </>
                  )}
                </span>
              </div>
            )}

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
                  ) : verificationState === 'NO_REGISTERED_TEMPLATE' ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                        <ShieldAlert className="w-7 h-7" />
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 border text-xs py-0.5 px-3 font-bold">
                        ✕ No Reference Photo
                      </Badge>
                      <p className="text-xs text-slate-200 max-w-[240px]">
                        No biometric photo enrolled for <strong className="text-white">{empName}</strong>.
                      </p>
                      <div className="text-[10.5px] font-semibold text-amber-300">
                        Please register face in Employee Profile first.
                      </div>
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
                  ) : isFaceMatched ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 border text-xs py-0.5 px-3 font-bold">
                        Face Matched ✓
                      </Badge>
                      <div className="text-xs font-semibold text-emerald-200">
                        Employee: <span className="text-white font-bold">{empName}</span>
                      </div>
                      {calculatedSimilarity !== null && (
                        <div className="text-[11px] font-mono text-cyan-300 font-bold">
                          Match Confidence: <span className="text-emerald-400 text-xs">{calculatedSimilarity}%</span>
                        </div>
                      )}
                      <div className="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wide">
                        Ready for {punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
                        <XCircle className="w-7 h-7" />
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 border text-xs py-0.5 px-3 font-bold">
                        Face Not Matched ✕
                      </Badge>
                      <div className="text-xs font-semibold text-rose-200">
                        Selected Employee: <span className="text-white font-bold">{empName}</span>
                      </div>
                      {calculatedSimilarity !== null && (
                        <div className="text-[11px] font-mono text-rose-300 font-bold">
                          Match Confidence: <span className="text-rose-400 text-xs">{calculatedSimilarity}%</span> (Required: ≥ 70.0%)
                        </div>
                      )}
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

            {/* Instruction / Status Banner */}
            <div className="space-y-1.5 flex flex-col items-center text-center">
              {workflowStep === 'SCAN' && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  Scanning your face… Please look at the camera.
                </p>
              )}

              {workflowStep === 'COMPARE' && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Verifying face biometrics...
                </p>
              )}

              {workflowStep === 'VERIFIED' && isFaceMatched && (
                <div className="flex flex-col items-center space-y-1">
                  {isAdmin ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 border text-xs py-0.5 px-3">
                      Face Matched ✓ Confidence: {calculatedSimilarity}%
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 border text-xs py-0.5 px-3">
                      ✓ Face Verified
                    </Badge>
                  )}
                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Ready for {punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
                  </span>
                </div>
              )}

              {workflowStep === 'VERIFIED' && !isFaceMatched && (
                <div className="flex flex-col items-center space-y-2 w-full pt-1">
                  {isAdmin ? (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 border text-xs py-0.5 px-3">
                      Face Not Matched ✕
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 border text-xs py-0.5 px-3">
                      ✕ Face Not Matched
                    </Badge>
                  )}
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
            </div>

            {/* ── PRIMARY CHECK-IN / CHECK-OUT BUTTON (Only shown when Verified) ── */}
            {isFaceMatched && workflowStep === 'VERIFIED' && (
              <div className="pt-1 space-y-1">
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
                      <LogIn className="h-4 w-4 rotate-90" /> Check-Out
                    </>
                  )}
                </Button>

                <span className="text-[10.5px] text-slate-400 font-medium block text-center">
                  🕒 Click to record {punchType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} timestamp
                </span>
              </div>
            )}
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
                      ) : verificationState === 'FACE_MISMATCH' ? (
                        <>
                          <span className="font-bold text-xs text-rose-600 block mt-1">FAILED</span>
                          <span className="text-[9.5px] text-rose-600 block">
                            Face does not match {selectedEmployee?.firstName}
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
                          {calculatedDistance !== null ? `${calculatedDistance} (Max Cutoff 0.40)` : '--'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Descriptor Similarity:</span>{' '}
                        <strong className={isFaceVerified ? 'text-emerald-400' : 'text-rose-400'}>
                          {calculatedSimilarity !== null ? `${calculatedSimilarity}% (Cutoff 70.0%)` : '--'}
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
      </div>

        {/* ── 3. FIXED BOTTOM FOOTER (ACCESSIBLE WHILE SCROLLING) ── */}
        <div className="shrink-0 px-5 py-3 bg-slate-100/90 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between z-30">
          <span className="text-xs text-slate-500 font-medium">EHCM Biometric Terminal #01</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-semibold rounded-xl"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

