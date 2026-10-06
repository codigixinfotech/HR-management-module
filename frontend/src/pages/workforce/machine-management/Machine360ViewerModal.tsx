import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  RotateCcw,
  Play,
  Pause,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Building2,
  MapPin,
  Barcode,
  Tag,
  Box,
  Factory,
  FolderGit2,
  X,
  Cuboid,
  Camera,
  Move,
  ShieldCheck,
  UserCheck,
  Calendar,
  FileText,
  Activity,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { Machine } from '@/api/machine-management';

// Realistic sample medical equipment image set fallback (Siemens CT Scanner / Hospital Equipment)
const DEFAULT_STUDIO_IMAGES: { [key: string]: string } = {
  front: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
  right: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  back: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  left: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  top: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
};

interface Machine360ViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine | null;
  machineName?: string;
  machineCode?: string;
  mainPhoto?: string;
  angles?: { [key: string]: string };
  angleImages?: { [key: string]: string };
  departmentName?: string;
  operationalUnitName?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetNumber?: string;
  initialShowProfile?: boolean;
}

export function Machine360ViewerModal({
  open,
  onOpenChange,
  machine,
  machineName,
  machineCode,
  mainPhoto,
  angles,
  angleImages,
  departmentName,
  operationalUnitName,
  location,
  manufacturer,
  model,
  serialNumber,
  assetNumber,
  initialShowProfile = false,
}: Machine360ViewerModalProps) {
  // Parse documentsJson if present
  let parsedDocs: any = {};
  try {
    parsedDocs = typeof machine?.documentsJson === 'string'
      ? JSON.parse(machine.documentsJson)
      : machine?.documentsJson || {};
  } catch {
    parsedDocs = {};
  }

  // Extract unified metadata
  const resolvedName = machine?.machineName || machineName || 'Siemens CT Scanner 128 Slice';
  const resolvedCode = machine?.machineCode || machineCode || 'HSP-MCH-001';
  const resolvedManufacturer = machine?.manufacturer || manufacturer || 'Siemens Healthineers';
  const resolvedModel = machine?.model || model || 'SOMATOM Definition AS+';
  const resolvedSerial = machine?.serialNumber || serialNumber || 'SN-CT-2026-00125';
  const resolvedAsset = machine?.assetNumber || assetNumber || 'HSP-AST-CT-001';
  const resolvedDept = machine?.departmentName || departmentName || 'Radiology Department';
  const resolvedLine = machine?.productionLineName || operationalUnitName || 'Outpatient Department';
  const resolvedLocation = machine?.location || location || '2nd Floor - CT Scan Room 01';
  const resolvedStatus = machine?.status || 'ACTIVE';

  // Extract unified images dictionary
  const rawAngleImages = {
    ...(parsedDocs?.images?.angles || {}),
    ...(angles || {}),
    ...(angleImages || {}),
    ...(machine?.angleImages || {}),
  };

  const resolvedAnglesMap: { [key: string]: string } = {
    ...DEFAULT_STUDIO_IMAGES,
    ...rawAngleImages,
  };

  const effectiveMainPhoto =
    mainPhoto ||
    machine?.mainPhoto ||
    parsedDocs?.images?.mainPhoto ||
    resolvedAnglesMap.front;

  if (effectiveMainPhoto) {
    resolvedAnglesMap.front = resolvedAnglesMap.front || effectiveMainPhoto;
  }

  // Check if true 3D model file (.glb / .gltf) exists
  const model3dUrl = parsedDocs?.model3dUrl || parsedDocs?.docs?.model3d || null;

  // Interactive Viewer State
  const [rotationDegrees, setRotationDegrees] = useState(289);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTopViewActive, setIsTopViewActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullProfileDrawer, setShowFullProfileDrawer] = useState(initialShowProfile);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const startRotation = useRef(0);

  // Synchronize initialShowProfile
  useEffect(() => {
    if (open && initialShowProfile) {
      setShowFullProfileDrawer(true);
    }
  }, [open, initialShowProfile]);

  // Auto-spin interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoSpin && open && !isTopViewActive) {
      interval = setInterval(() => {
        setRotationDegrees((prev) => (prev + 2) % 360);
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isAutoSpin, open, isTopViewActive]);

  // Determine current active perspective face based on rotation degrees
  const getActiveAngleKey = (degrees: number): 'front' | 'right' | 'back' | 'left' => {
    const norm = ((degrees % 360) + 360) % 360;
    if (norm >= 315 || norm < 45) return 'front';
    if (norm >= 45 && norm < 135) return 'right';
    if (norm >= 135 && norm < 225) return 'back';
    return 'left';
  };

  const currentFace = getActiveAngleKey(rotationDegrees);

  // Active displayed image
  const displayedPhoto = isTopViewActive
    ? resolvedAnglesMap.top || resolvedAnglesMap.Top || effectiveMainPhoto || DEFAULT_STUDIO_IMAGES.top
    : resolvedAnglesMap[currentFace] ||
      resolvedAnglesMap[currentFace.charAt(0).toUpperCase() + currentFace.slice(1)] ||
      effectiveMainPhoto ||
      DEFAULT_STUDIO_IMAGES[currentFace];

  // Mouse / Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoSpin(false);
    setIsTopViewActive(false);
    dragStartX.current = e.clientX;
    startRotation.current = rotationDegrees;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const newRot = ((startRotation.current + deltaX * 0.75) % 360 + 360) % 360;
    setRotationDegrees(Math.round(newRot));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event support for tablet/mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setIsAutoSpin(false);
      setIsTopViewActive(false);
      dragStartX.current = e.touches[0].clientX;
      startRotation.current = rotationDegrees;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    const newRot = ((startRotation.current + deltaX * 0.75) % 360 + 360) % 360;
    setRotationDegrees(Math.round(newRot));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Preset angle select handler
  const setPresetAngle = (deg: number) => {
    setIsTopViewActive(false);
    setRotationDegrees(deg);
  };

  const handleSelectTopView = () => {
    setIsTopViewActive(true);
  };

  // Zoom handlers
  const zoomIn = () => setZoomLevel((z) => Math.min(2.2, Number((z + 0.2).toFixed(1))));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.7, Number((z - 0.2).toFixed(1))));
  const resetZoom = () => setZoomLevel(1);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Compute 3D perspective tilt offset for smooth angular interpolation
  const getPerspectiveOffset = () => {
    if (isTopViewActive) return 0;
    const baseDeg = currentFace === 'front' ? 0 : currentFace === 'right' ? 90 : currentFace === 'back' ? 180 : 270;
    let diff = rotationDegrees - baseDeg;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return Math.max(-45, Math.min(45, diff));
  };

  const perspectiveOffset = getPerspectiveOffset();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[1440px] w-[98vw] h-[95vh] p-0 overflow-hidden rounded-3xl bg-[#f8fafd] text-slate-900 border border-slate-200/90 shadow-2xl flex flex-col select-none"
      >
        <div ref={modalContainerRef} className="relative w-full h-full flex flex-col overflow-hidden bg-[#f8fafd]">
          {/* ─────────────────────────────────────────────────────────────
              TOP HEADER BAR (Matching Reference White Studio Image 2)
          ───────────────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-xs z-30">
            {/* Left Title & Breadcrumb */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="truncate">
                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>360° Equipment Interactive Viewer</span>
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  <span className="font-mono text-indigo-600 font-semibold">{resolvedCode}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="text-slate-800 font-semibold">{resolvedName}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="text-slate-500">{resolvedDept}</span>
                </p>
              </div>
            </div>

            {/* Right Controls: Live Angle Badge, 3D / Real Photos Mode Toggle & Close Button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Live Angle Indicator Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
                <Compass className="h-3.5 w-3.5 text-indigo-600" />
                <span>{isTopViewActive ? 'Top View' : `${Math.round(rotationDegrees)}° Angle`}</span>
              </div>

              {/* Mode Switcher: 3D View vs Real Photos */}
              <div className="flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === '3d'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Cuboid className="h-3.5 w-3.5" />
                  <span>3D View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('photos')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'photos'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Real Photos</span>
                </button>
              </div>

              {/* Mobile Info Sheet Toggle Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMobileInfo((prev) => !prev)}
                className="lg:hidden h-9 px-2.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <Info className="h-4 w-4" />
              </Button>

              {/* Close Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                title="Close 360 viewer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              MAIN VIEWER STAGE (Left Spec Card + Center Studio + Right Thumbnails)
          ───────────────────────────────────────────────────────────── */}
          <div className="relative flex-1 min-h-0 bg-[radial-gradient(ellipse_at_50%_65%,_#ffffff_0%,_#f5f8fc_55%,_#e8eef6_100%)] overflow-hidden flex items-stretch">
            {/* Subtle Studio Floor Grid & Lighting */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

            {/* ─────────────────────────────────────────────────────────
                LEFT COLUMN: Floating Frosted Equipment Card
            ───────────────────────────────────────────────────────── */}
            <div className="hidden lg:block z-20 p-6 pointer-events-none">
              <div className="w-80 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 shadow-xl shadow-slate-200/50 pointer-events-auto flex flex-col gap-3.5 max-h-[82vh] overflow-y-auto">
                {/* Header Title & Tag */}
                <div className="space-y-1.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                      {resolvedName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {/* 3D Model Badge */}
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                      {viewMode === '3d' ? (model3dUrl ? '3D GLB MODEL' : '3D MODEL') : 'REAL ASSET'}
                    </span>

                    {/* Machine Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        resolvedStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : resolvedStatus === 'UNDER_MAINTENANCE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : resolvedStatus === 'INACTIVE'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          resolvedStatus === 'ACTIVE'
                            ? 'bg-emerald-500 animate-pulse'
                            : resolvedStatus === 'UNDER_MAINTENANCE'
                            ? 'bg-amber-500'
                            : resolvedStatus === 'INACTIVE'
                            ? 'bg-slate-400'
                            : 'bg-rose-500'
                        }`}
                      />
                      {resolvedStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-indigo-600 font-bold pt-0.5">
                    {resolvedCode}
                  </p>
                </div>

                {/* Equipment Specifications Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <Factory className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Manufacturer</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedManufacturer}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <Box className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Model</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedModel}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <Barcode className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Serial Number</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedSerial}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Asset Number</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedAsset}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Department</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedDept}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <FolderGit2 className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Operational Unit</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedLine}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Location</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{resolvedLocation}</p>
                    </div>
                  </div>
                </div>

                {/* QR Profile Dossier Expand Button */}
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullProfileDrawer(true)}
                    className="w-full h-8 text-xs font-bold rounded-xl gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50/80 shadow-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Complete QR Profile</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-auto text-indigo-400" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                CENTER STAGE: Large Interactive Rotational Canvas
            ───────────────────────────────────────────────────────── */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing p-4 select-none ${
                isDragging ? 'cursor-grabbing' : ''
              }`}
            >
              {/* Top Floating Help Badge */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-md">
                  <Move className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Drag to rotate 360°</span>
                </div>
              </div>

              {/* Top Right Zoom & View Controls */}
              <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={zoomIn}
                  className="h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={zoomOut}
                  className="h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetZoom}
                  className="h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                  title="Reset Zoom"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className={`h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm ${
                    isFullscreen ? 'text-indigo-600 border-indigo-300' : ''
                  }`}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Central Rotating Equipment Studio */}
              <div className="relative w-full max-w-4xl h-[64vh] flex items-center justify-center">
                {/* Floor Pedestal & Circular 360 Ring */}
                <div className="absolute bottom-6 w-[86%] max-w-2xl h-40 rounded-full border border-indigo-200/80 bg-gradient-to-b from-indigo-100/30 via-slate-100/20 to-transparent pointer-events-none flex items-center justify-center">
                  {/* Concentric Rotation Ring */}
                  <div
                    className="w-[94%] h-[88%] rounded-full border-2 border-dashed border-indigo-300/60 transition-transform duration-75"
                    style={{
                      transform: `rotate(${rotationDegrees}deg)`,
                    }}
                  />
                  {/* Floor 360° text mark */}
                  <div className="absolute bottom-2 text-xs font-bold text-slate-400 tracking-wider">
                    360°
                  </div>
                </div>

                {/* Soft ground contact drop shadow */}
                <div className="absolute bottom-12 w-[60%] h-12 bg-[radial-gradient(ellipse,_rgba(30,41,59,0.22)_0%,_rgba(30,41,59,0.08)_50%,_transparent_75%)] pointer-events-none rounded-full" />

                {/* Equipment Main Visual Render */}
                <div
                  className="relative z-10 max-h-[88%] max-w-[88%] transition-transform duration-100 ease-out flex items-center justify-center"
                  style={{
                    transform:
                      viewMode === '3d'
                        ? `scale(${zoomLevel}) perspective(1100px) rotateY(${perspectiveOffset * 0.45}deg)`
                        : `scale(${zoomLevel})`,
                  }}
                >
                  <img
                    src={displayedPhoto}
                    alt={`${currentFace} view of ${resolvedName}`}
                    className="max-h-[52vh] max-w-full object-contain pointer-events-none drop-shadow-[0_28px_35px_rgba(30,41,59,0.20)]"
                  />

                  {/* Perspective Face Label Badge */}
                  <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide shadow-lg flex items-center gap-1.5 pointer-events-none border border-indigo-400/40">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <span className="capitalize">
                      {isTopViewActive ? 'Top View' : `${currentFace} View (${Math.round(rotationDegrees)}°)`}
                    </span>
                  </div>
                </div>

                {/* Mode Fallback Notice / Indicator */}
                {viewMode === '3d' && !model3dUrl && (
                  <div className="absolute top-2 left-6 z-10 pointer-events-none">
                    <span className="text-[10px] font-semibold text-slate-400 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      Multi-Angle Photo Render • Interactive 3D Studio
                    </span>
                  </div>
                )}
                {viewMode === 'photos' && (
                  <div className="absolute top-2 left-6 z-10 pointer-events-none">
                    <span className="text-[10px] font-semibold text-indigo-600 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs">
                      Authentic Real Photo Mode
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                RIGHT COLUMN: Vertical Thumbnail Cards (Front, Right, Back, Left, Top)
            ───────────────────────────────────────────────────────── */}
            <div className="hidden md:flex flex-col gap-2.5 p-6 z-20 justify-center shrink-0 w-48">
              {[
                { key: 'front', label: 'Front View', deg: 0 },
                { key: 'right', label: 'Right View', deg: 90 },
                { key: 'back', label: 'Back View', deg: 180 },
                { key: 'left', label: 'Left View', deg: 270 },
                { key: 'top', label: 'Top View', deg: -1 },
              ].map((angleItem) => {
                const isSelected =
                  angleItem.deg === -1
                    ? isTopViewActive
                    : !isTopViewActive && currentFace === angleItem.key;

                const thumbImg =
                  resolvedAnglesMap[angleItem.key] ||
                  resolvedAnglesMap[angleItem.key.charAt(0).toUpperCase() + angleItem.key.slice(1)] ||
                  DEFAULT_STUDIO_IMAGES[angleItem.key] ||
                  effectiveMainPhoto;

                return (
                  <div
                    key={angleItem.key}
                    onClick={() => {
                      if (angleItem.deg === -1) {
                        handleSelectTopView();
                      } else {
                        setPresetAngle(angleItem.deg);
                      }
                    }}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border transition-all p-1.5 flex flex-col items-center bg-white/95 backdrop-blur-md shadow-xs ${
                      isSelected
                        ? 'border-2 border-indigo-600 ring-4 ring-indigo-500/20 scale-102 bg-white shadow-md'
                        : 'border-slate-200/90 hover:border-slate-300 opacity-90 hover:opacity-100 hover:shadow-xs'
                    }`}
                  >
                    <div className="h-16 w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1 border border-slate-100">
                      <img
                        src={thumbImg}
                        alt={angleItem.label}
                        className="h-full w-full object-contain pointer-events-none transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1 tracking-tight truncate ${
                        isSelected ? 'text-indigo-600 font-extrabold' : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {angleItem.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              BOTTOM CONTROLS BAR: Slider, Quick Angle Pills & Auto-Rotate
          ───────────────────────────────────────────────────────────── */}
          <div className="px-6 py-3.5 bg-white/95 border-t border-slate-200/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xs z-30">
            {/* Continuous Angle Slider 0° to 360° */}
            <div className="flex items-center gap-3 w-full sm:w-80">
              <span className="text-xs font-bold text-slate-500">0°</span>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[rotationDegrees]}
                onValueChange={([val]) => {
                  setIsTopViewActive(false);
                  setRotationDegrees(val);
                }}
                className="flex-1 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-500">360°</span>
            </div>

            {/* Angle Presets Row (Front 0°, Right 90°, Back 180°, Left 270°, Top View) */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'Front (0°)', deg: 0, face: 'front' },
                { label: 'Right (90°)', deg: 90, face: 'right' },
                { label: 'Back (180°)', deg: 180, face: 'back' },
                { label: 'Left (270°)', deg: 270, face: 'left' },
              ].map((p) => {
                const active = !isTopViewActive && currentFace === p.face;
                return (
                  <Button
                    key={p.face}
                    type="button"
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    onClick={() => setPresetAngle(p.deg)}
                    className={`h-8 px-3 text-xs font-bold rounded-xl transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${active ? 'bg-white' : 'bg-emerald-500'}`} />
                    {p.label}
                  </Button>
                );
              })}

              <Button
                type="button"
                size="sm"
                variant={isTopViewActive ? 'default' : 'outline'}
                onClick={handleSelectTopView}
                className={`h-8 px-3 text-xs font-bold rounded-xl transition-all ${
                  isTopViewActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isTopViewActive ? 'bg-white' : 'bg-emerald-500'}`} />
                Top View
              </Button>

              {/* Auto Rotate Button */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsAutoSpin((s) => !s)}
                className={`h-8 px-3.5 text-xs font-bold rounded-xl gap-1.5 border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition-all ${
                  isAutoSpin ? 'text-indigo-600 border-indigo-400 bg-indigo-50/50' : 'text-slate-700'
                }`}
              >
                {isAutoSpin ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Auto Rotate ▷</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              BOTTOM FEATURE BADGES FOOTER (Matching Reference White Studio Image 2)
          ───────────────────────────────────────────────────────────── */}
          <div className="px-6 py-3 border-t border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-3 text-slate-600 text-xs shrink-0 z-30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Cuboid className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Interactive 3D Model</p>
                <p className="text-[10px] text-slate-400">Drag to rotate and explore</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Multiple Viewing Angles</p>
                <p className="text-[10px] text-slate-400">Front, Right, Back, Left, Top</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <ZoomIn className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Zoom In / Out</p>
                <p className="text-[10px] text-slate-400">Get a closer look</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Auto Rotate</p>
                <p className="text-[10px] text-slate-400">Continuous 360° rotation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">High Quality 3D Render</p>
                <p className="text-[10px] text-slate-400">Realistic equipment view</p>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              COMPLETE MACHINE PROFILE DRAWER (QR FLOW: All 13 Sections)
          ───────────────────────────────────────────────────────────── */}
          {showFullProfileDrawer && (
            <div className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
              <div className="w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-250">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                      <h3 className="text-base font-bold text-slate-900">
                        Complete Equipment Dossier (QR)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {resolvedCode} • {resolvedName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFullProfileDrawer(false)}
                    className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* 13-Section Content Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  {/* 1. Identity */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Barcode className="h-3.5 w-3.5 text-indigo-600" /> 1. Equipment Identity
                      </span>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px]">
                        {resolvedCode}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Machine Name</span>
                        <span className="font-semibold text-slate-800">{resolvedName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Manufacturer</span>
                        <span className="font-semibold text-slate-800">{resolvedManufacturer}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Model</span>
                        <span className="font-semibold text-slate-800">{resolvedModel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Serial Number</span>
                        <span className="font-semibold text-slate-800">{resolvedSerial}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Asset Tag</span>
                        <span className="font-semibold text-slate-800">{resolvedAsset}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Organization & 3. Location & 4. Operational Unit */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-indigo-600" /> 2–4. Organization & Operational Unit
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                        <span className="font-semibold text-slate-800">{resolvedDept}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch</span>
                        <span className="font-semibold text-slate-800">{machine?.branchName || 'Head Office'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Operational Unit</span>
                        <span className="font-semibold text-slate-800">{resolvedLine}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Location / Room</span>
                        <span className="font-semibold text-slate-800">{resolvedLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Capacity & Power */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-indigo-600" /> 5. Capacity & Telemetry
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Rated Capacity</span>
                        <span className="font-semibold text-slate-800">
                          {machine?.capacity ? `${machine.capacity} ${machine.capacityUom || ''}` : '128 Slices'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Power Rating</span>
                        <span className="font-semibold text-slate-800">
                          {machine?.powerRating ? `${machine.powerRating} ${machine.powerUom || 'kW'}` : '120 kW'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Operating Hours</span>
                        <span className="font-semibold text-slate-800">{machine?.operatingHours ? `${machine.operatingHours} hrs` : '1,420 hrs'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 6. Status, 7. Current Operator & 8. Shift */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-600" /> 6–8. Live Status, Operator & Shift
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Availability</span>
                        <Badge
                          variant={
                            resolvedStatus === 'ACTIVE'
                              ? 'default'
                              : resolvedStatus === 'UNDER_MAINTENANCE'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="mt-0.5 text-[10px]"
                        >
                          {resolvedStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Operator</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {machine?.currentOperatorName || 'Dr. Sarah Lin (Radiologist)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Shift</span>
                        <span className="font-semibold text-slate-800">{machine?.currentShift || 'Morning Clinical Shift'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 9. Maintenance Health */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> 9. Maintenance Health
                      </span>
                      <Badge variant="outline" className="text-[10px] font-medium border-emerald-300 text-emerald-700 bg-emerald-50">
                        {machine?.maintenanceDueLabel || 'Healthy'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Serviced</span>
                        <span className="font-semibold text-slate-800">
                          {machine?.lastMaintenanceDate ? machine.lastMaintenanceDate.slice(0, 10) : '2026-09-15'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Due Date</span>
                        <span className="font-semibold text-slate-800">
                          {machine?.nextMaintenanceDate ? machine.nextMaintenanceDate.slice(0, 10) : '2026-12-15'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Service Cycle</span>
                        <span className="font-semibold text-slate-800">
                          {machine?.maintenanceFrequencyDays ? `Every ${machine.maintenanceFrequencyDays} days` : 'Every 90 days'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 10. Documents & Manuals */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-600" /> 10. Attached Documents
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {parsedDocs?.docs && Object.entries(parsedDocs.docs).filter(([_, v]) => Boolean(v)).length > 0 ? (
                        Object.entries(parsedDocs.docs)
                          .filter(([_, v]) => Boolean(v))
                          .map(([docKey, docVal]) => (
                            <div
                              key={docKey}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-slate-700 capitalize">{docKey}: {String(docVal)}</span>
                              <Badge variant="outline" className="text-[9px]">Attached</Badge>
                            </div>
                          ))
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                          <span>Operations Manual: SOMATOM_Def_AS_Operation_Guide.pdf</span>
                          <Badge variant="outline" className="text-[9px]">Verified</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 11. Machine Photos Gallery */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-indigo-600" /> 11. Machine Photos (5 Angles)
                    </span>
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {['front', 'right', 'back', 'left', 'top'].map((ang) => (
                        <div key={ang} className="space-y-1 text-center">
                          <div className="h-14 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-1">
                            <img
                              src={resolvedAnglesMap[ang] || DEFAULT_STUDIO_IMAGES[ang]}
                              alt={ang}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">{ang}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Return Button */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
                  <Button
                    type="button"
                    onClick={() => setShowFullProfileDrawer(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md px-4"
                  >
                    Return to 360° Studio
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MOBILE INFO MODAL DRAWER
          ───────────────────────────────────────────────────────────── */}
          {showMobileInfo && (
            <div className="lg:hidden absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-end">
              <div className="w-full bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl max-h-[75vh] overflow-y-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-bold text-sm text-slate-900">{resolvedName}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowMobileInfo(false)} className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-xs">
                  <p><span className="text-slate-400 font-bold">Code:</span> {resolvedCode}</p>
                  <p><span className="text-slate-400 font-bold">Manufacturer:</span> {resolvedManufacturer}</p>
                  <p><span className="text-slate-400 font-bold">Model:</span> {resolvedModel}</p>
                  <p><span className="text-slate-400 font-bold">Serial:</span> {resolvedSerial}</p>
                  <p><span className="text-slate-400 font-bold">Asset:</span> {resolvedAsset}</p>
                  <p><span className="text-slate-400 font-bold">Department:</span> {resolvedDept}</p>
                  <p><span className="text-slate-400 font-bold">Operational Unit:</span> {resolvedLine}</p>
                  <p><span className="text-slate-400 font-bold">Location:</span> {resolvedLocation}</p>
                </div>
                <Button
                  className="w-full bg-indigo-600 text-white font-bold text-xs rounded-xl mt-2"
                  onClick={() => {
                    setShowMobileInfo(false);
                    setShowFullProfileDrawer(true);
                  }}
                >
                  View Full QR Dossier
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
