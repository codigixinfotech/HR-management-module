import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import {
  extractFaceDescriptor,
  loadFaceRecognitionModels,
  calculateEuclideanDistance,
  calculateConfidenceFromDistance,
  MAX_EUCLIDEAN_DISTANCE,
  MATCH_THRESHOLD,
} from '@/utils/faceBiometrics';

interface MobilePunchCameraProps {
  targetDescriptor: number[] | null;
  employeeName: string;
  onVerificationSuccess: (result: {
    photo: string;
    descriptor: number[];
    score: number;
    distance: number;
  }) => void;
  onVerificationReset?: () => void;
}

export function MobilePunchCamera({
  targetDescriptor,
  employeeName,
  onVerificationSuccess,
  onVerificationReset,
}: MobilePunchCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanStatus, setScanStatus] = useState<
    'LOADING' | 'POSITIONING' | 'ANALYZING' | 'MATCHED' | 'NOT_MATCHED' | 'NO_FACE' | 'MULTIPLE_FACES'
  >('LOADING');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Initializing deep biometric engine...');
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [consensusCount, setConsensusCount] = useState<number>(0);

  const isAnalyzingRef = useRef(false);
  const scanIntervalRef = useRef<any>(null);
  const consensusFramesRef = useRef<{ score: number; distance: number; photo: string }[]>([]);
  const REQUIRED_CONSENSUS = 3;

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraActive(false);

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setScanStatus('POSITIONING');
      setFeedbackMessage('Position your face inside the circle');
    } catch (err: any) {
      console.error('[MobilePunchCamera] Camera access failed:', err);
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in your mobile browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      }
      setCameraError(msg);
      setScanStatus('NO_FACE');
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Load models on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsModelLoading(true);
        await loadFaceRecognitionModels();
        if (isMounted) {
          setIsModelLoading(false);
          await startCamera();
        }
      } catch (err) {
        if (isMounted) {
          setIsModelLoading(false);
          setCameraError('Failed to load face recognition neural models. Please check network connection.');
        }
      }
    })();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Frame Analysis Pipeline
  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzingRef.current || scanStatus === 'MATCHED') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;

    isAnalyzingRef.current = true;

    try {
      const result = await extractFaceDescriptor(canvas, video);

      if (result.faceCount === 0) {
        setScanStatus('NO_FACE');
        setFeedbackMessage('No face detected. Look directly into camera.');
        consensusFramesRef.current = [];
        setConsensusCount(0);
        return;
      }

      if (result.faceCount > 1) {
        setScanStatus('MULTIPLE_FACES');
        setFeedbackMessage(`Multiple faces detected (${result.faceCount}). Only 1 person allowed.`);
        consensusFramesRef.current = [];
        setConsensusCount(0);
        return;
      }

      if (!result.descriptor || !targetDescriptor || targetDescriptor.length !== 128) {
        setScanStatus('ANALYZING');
        setFeedbackMessage('Processing biometric vectors...');
        return;
      }

      // Calculate Canonical Metrics
      const distance = calculateEuclideanDistance(result.descriptor, targetDescriptor);
      const score = calculateConfidenceFromDistance(distance);

      setLiveDistance(distance);
      setLiveScore(score);

      // Snapshot photo
      let photoData = '';
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            photoData = canvas.toDataURL('image/jpeg', 0.85);
          }
        }
      } catch {}

      // Threshold check: Distance <= 0.60 ⟺ Score >= 75.0%
      if (distance <= MAX_EUCLIDEAN_DISTANCE && score >= MATCH_THRESHOLD) {
        consensusFramesRef.current.push({
          score,
          distance,
          photo: photoData,
        });

        const currentConsensus = consensusFramesRef.current.length;
        setConsensusCount(currentConsensus);
        setScanStatus('ANALYZING');
        setFeedbackMessage(`Verifying identity... Frame ${currentConsensus}/${REQUIRED_CONSENSUS}`);

        if (currentConsensus >= REQUIRED_CONSENSUS) {
          // Consensus reached!
          setScanStatus('MATCHED');
          setFeedbackMessage(`✓ Face Verified: ${employeeName}`);
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          stopCamera();

          const frames = consensusFramesRef.current;
          const avgScore = Math.round((frames.reduce((s, f) => s + f.score, 0) / frames.length) * 10) / 10;
          const avgDistance = parseFloat((frames.reduce((s, f) => s + f.distance, 0) / frames.length).toFixed(4));
          const bestPhoto = frames[frames.length - 1]?.photo || photoData;

          onVerificationSuccess({
            photo: bestPhoto,
            descriptor: result.descriptor,
            score: avgScore,
            distance: avgDistance,
          });
        }
      } else {
        // Distance > 0.60 -> Non-match
        consensusFramesRef.current = [];
        setConsensusCount(0);
        setScanStatus('NOT_MATCHED');
        setFeedbackMessage(`Face does not match registered profile (${score}% Match Score).`);
      }
    } catch (err) {
      console.error('[MobilePunchCamera] Frame analysis error:', err);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  // Scan interval timer
  useEffect(() => {
    if (isCameraActive && !isModelLoading && scanStatus !== 'MATCHED') {
      scanIntervalRef.current = setInterval(analyzeFrame, 450);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isCameraActive, isModelLoading, scanStatus, targetDescriptor]);

  const handleRetry = () => {
    consensusFramesRef.current = [];
    setConsensusCount(0);
    setLiveScore(null);
    setLiveDistance(null);
    setScanStatus('POSITIONING');
    if (onVerificationReset) onVerificationReset();
    startCamera();
  };

  return (
    <div className="relative w-full aspect-4/5 max-w-sm mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-indigo-500/30 shadow-2xl flex items-center justify-center">
      {/* Hidden Canvas for computation & snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Video Viewport */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
          isCameraActive && !isModelLoading ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading overlay */}
      {isModelLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-white space-y-3">
          <div className="w-12 h-12 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold tracking-wide">Loading Face Recognition Engine</p>
          <p className="text-[11px] text-slate-400">Initializing deep neural network models...</p>
        </div>
      )}

      {/* Error state overlay */}
      {cameraError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-rose-300">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {/* Biometric Face Target Oval & Scanning Radar */}
      {isCameraActive && !isModelLoading && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
          {/* Subtle darkened backdrop mask with oval cutout */}
          <div className="relative w-56 h-72 rounded-[48%] border-2 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-2xl ${
            scanStatus === 'MATCHED'
              ? 'border-emerald-400 bg-emerald-500/10 ring-8 ring-emerald-500/20'
              : scanStatus === 'NOT_MATCHED'
              ? 'border-rose-400 bg-rose-500/10'
              : consensusCount > 0
              ? 'border-cyan-400 ring-4 ring-cyan-500/30'
              : 'border-white/60'
          }">
            {/* Animated Laser Scanning Line */}
            {scanStatus !== 'MATCHED' && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-bounce duration-1000" />
            )}

            {/* Corner Alignment Brackets */}
            <div className="absolute top-2 left-4 w-4 h-4 border-t-2 border-l-2 border-white/80 rounded-tl" />
            <div className="absolute top-2 right-4 w-4 h-4 border-t-2 border-r-2 border-white/80 rounded-tr" />
            <div className="absolute bottom-2 left-4 w-4 h-4 border-b-2 border-l-2 border-white/80 rounded-bl" />
            <div className="absolute bottom-2 right-4 w-4 h-4 border-b-2 border-r-2 border-white/80 rounded-br" />

            {/* Status Icons in center if done */}
            {scanStatus === 'MATCHED' && (
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Real-Time Consensus Indicator Dots */}
          <div className="mt-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  consensusCount >= step
                    ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-white/20'
                }`}
              />
            ))}
            <span className="text-[10px] font-mono text-slate-300 ml-1">
              {consensusCount}/{REQUIRED_CONSENSUS} Frames
            </span>
          </div>

          {/* Feedback message pill */}
          <div className="mt-2.5 max-w-[85%] text-center">
            <div
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-tight shadow-md backdrop-blur-md transition-all duration-200 inline-flex items-center gap-1.5 ${
                scanStatus === 'MATCHED'
                  ? 'bg-emerald-500/90 text-white border border-emerald-300/40'
                  : scanStatus === 'NOT_MATCHED'
                  ? 'bg-rose-500/90 text-white border border-rose-300/40'
                  : 'bg-slate-900/80 text-white border border-white/15'
              }`}
            >
              {scanStatus === 'MATCHED' && <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
              {scanStatus === 'NOT_MATCHED' && <AlertCircle className="w-3.5 h-3.5 text-white" />}
              {feedbackMessage}
            </div>

            {/* Telemetry pill */}
            {liveScore !== null && liveDistance !== null && (
              <p className="text-[10px] font-mono text-slate-300 mt-1 drop-shadow-md">
                Match Score: <strong className={liveScore >= MATCH_THRESHOLD ? 'text-emerald-400' : 'text-amber-400'}>{liveScore}%</strong> | Dist: <span className="text-cyan-300">{liveDistance}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Retry button if verification finished */}
      {scanStatus === 'MATCHED' && (
        <button
          type="button"
          onClick={handleRetry}
          className="absolute bottom-3 right-3 z-30 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white p-2 rounded-xl text-[10px] font-semibold flex items-center gap-1 border border-white/10 backdrop-blur-md shadow-md cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Rescan
        </button>
      )}
    </div>
  );
}
