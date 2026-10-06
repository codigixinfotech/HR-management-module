import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  Layers,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Building2,
  MapPin,
  Barcode,
  Tag,
  Box,
  Factory,
  FolderGit2,
  HelpCircle,
  Eye,
  CheckCircle2,
  X,
  Cuboid,
  Camera,
  Move,
  Scan,
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
}: Machine360ViewerModalProps) {
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

  // Extract unified images dictionary
  const resolvedAnglesMap: { [key: string]: string } = {
    ...DEFAULT_STUDIO_IMAGES,
    ...(angles || {}),
    ...(angleImages || {}),
  };

  // If a mainPhoto is provided, default it for front if front is missing
  const effectiveMainPhoto = mainPhoto || machine?.mainPhoto;
  if (effectiveMainPhoto) {
    resolvedAnglesMap.front = resolvedAnglesMap.front || effectiveMainPhoto;
  }

  // Interactive Viewer State
  const [rotationDegrees, setRotationDegrees] = useState(289);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTopViewActive, setIsTopViewActive] = useState(false);

  const dragStartX = useRef(0);
  const startRotation = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    // Drag left or right rotates 360
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
  const zoomOut = () => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))));
  const resetZoom = () => setZoomLevel(1);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[1420px] w-[97vw] h-[94vh] p-0 overflow-hidden rounded-3xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl flex flex-col select-none"
      >
        {/* ─────────────────────────────────────────────────────────────
            TOP HEADER BAR (Matching Reference Screenshot 1)
        ───────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
          {/* Left Title & Breadcrumb */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <RotateCcw className="h-5 w-5 animate-spin-slow" />
            </div>
            <div className="truncate">
              <DialogTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>360° Equipment Interactive Viewer</span>
              </DialogTitle>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                <span className="font-mono text-indigo-300 font-semibold">{resolvedCode}</span>
                <span className="mx-1.5 opacity-40">•</span>
                <span>{resolvedName}</span>
                <span className="mx-1.5 opacity-40">•</span>
                <span className="text-slate-400">{resolvedDept}</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Live Angle Badge, 3D / Real Photos Mode Toggle & Close Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Angle Indicator Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-inner">
              <Compass className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isTopViewActive ? 'Top View' : `${Math.round(rotationDegrees)}° Angle`}</span>
            </div>

            {/* Mode Switcher: 3D View vs Real Photos */}
            <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === '3d'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
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
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Real Photos</span>
              </button>
            </div>

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
              title="Close 360 viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MAIN VIEWER STAGE (Left Spec Card + Center Studio + Right Thumbnails)
        ───────────────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0 bg-radial from-slate-900 via-slate-950 to-black overflow-hidden flex items-stretch">
          {/* Subtle Ambient Radial Lighting & Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.08),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

          {/* ─────────────────────────────────────────────────────────
              LEFT COLUMN: Floating Frosted Equipment Card
          ───────────────────────────────────────────────────────── */}
          <div className="hidden lg:block z-20 p-6 pointer-events-none">
            <div className="w-80 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 p-5 shadow-2xl pointer-events-auto flex flex-col gap-4">
              {/* Header Title & Tag */}
              <div className="space-y-1.5 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight truncate pr-2">
                    {resolvedName}
                  </h3>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                    {viewMode === '3d' ? '3D MODEL' : 'REAL ASSET'}
                  </Badge>
                </div>
                <p className="text-[11px] font-mono text-indigo-400 font-semibold">
                  {resolvedCode}
                </p>
              </div>

              {/* Equipment Specifications Rows */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Factory className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Manufacturer</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedManufacturer}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Box className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Model</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedModel}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Barcode className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Serial Number</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedSerial}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Tag className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Asset Number</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedAsset}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Department</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedDept}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <FolderGit2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Operational Unit</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedLine}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Location</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{resolvedLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              CENTER STAGE: Large Interactive Rotational Canvas
          ───────────────────────────────────────────────────────── */}
          <div
            ref={containerRef}
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
              <div className="px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
                <Move className="h-3.5 w-3.5 text-indigo-400" />
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
                className="h-8 w-8 rounded-xl bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800 shadow-md"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={zoomOut}
                className="h-8 w-8 rounded-xl bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800 shadow-md"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resetZoom}
                className="h-8 w-8 rounded-xl bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800 shadow-md"
                title="Reset View"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Central Rotating Equipment Studio */}
            <div className="relative w-full max-w-3xl h-[62vh] flex items-center justify-center">
              {/* Floor Pedestal & Circular 360 Ring */}
              <div className="absolute bottom-6 w-[85%] h-36 rounded-full border border-indigo-500/30 bg-radial from-indigo-500/10 via-slate-900/30 to-transparent pointer-events-none flex items-center justify-center">
                {/* Concentric Rotation Ring */}
                <div
                  className="w-[92%] h-[85%] rounded-full border border-dashed border-indigo-400/25 transition-transform duration-75"
                  style={{
                    transform: `rotate(${rotationDegrees}deg)`,
                  }}
                />
                {/* 360 Center Ring Label */}
                <div className="absolute bottom-2 px-3 py-0.5 rounded-full bg-slate-950/80 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 tracking-widest uppercase">
                  360° Studio
                </div>
              </div>

              {/* Equipment Main Visual Render */}
              <div
                className="relative z-10 max-h-[85%] max-w-[85%] transition-transform duration-100 ease-out flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel})`,
                }}
              >
                <img
                  src={displayedPhoto}
                  alt={`${currentFace} view of ${resolvedName}`}
                  className="max-h-[50vh] max-w-full object-contain pointer-events-none drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)] filter contrast-105"
                />

                {/* Perspective Face Label Badge */}
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-xs text-white text-[11px] font-bold tracking-wide shadow-xl flex items-center gap-1.5 pointer-events-none border border-indigo-400/40">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="capitalize">
                    {isTopViewActive ? 'Top View' : `${currentFace} View`}
                  </span>
                </div>
              </div>
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
                  className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all p-1 flex flex-col items-center bg-slate-900/80 backdrop-blur-md shadow-md ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-102 bg-slate-900'
                      : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="h-16 w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center p-1">
                    <img
                      src={thumbImg}
                      alt={angleItem.label}
                      className="h-full w-full object-contain pointer-events-none transition-transform group-hover:scale-105"
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-1 tracking-tight truncate ${
                      isSelected ? 'text-indigo-400 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
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
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Continuous Angle Slider 0° to 360° */}
          <div className="flex items-center gap-3 w-full sm:w-80">
            <span className="text-xs font-bold text-slate-400">0°</span>
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
            <span className="text-xs font-bold text-slate-400">360°</span>
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
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${active ? 'bg-white' : 'bg-indigo-400'}`} />
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
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isTopViewActive ? 'bg-white' : 'bg-emerald-400'}`} />
              Top View
            </Button>

            {/* Auto Rotate Button */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsAutoSpin((s) => !s)}
              className={`h-8 px-3.5 text-xs font-bold rounded-xl gap-1.5 border-slate-700 bg-slate-900 hover:bg-slate-800 transition-all ${
                isAutoSpin ? 'text-indigo-400 border-indigo-500' : 'text-slate-200'
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
            BOTTOM FEATURE BADGES FOOTER (Matching Reference Screenshot 1)
        ───────────────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-slate-400 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Cuboid className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">Interactive 3D Model</p>
              <p className="text-[10px] text-slate-400">Drag to rotate and explore</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">Multiple Viewing Angles</p>
              <p className="text-[10px] text-slate-400">Front, Right, Back, Left, Top</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">Zoom In / Out</p>
              <p className="text-[10px] text-slate-400">Get a closer look</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">Auto Rotate</p>
              <p className="text-[10px] text-slate-400">Continuous 360° rotation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">High Quality 3D Render</p>
              <p className="text-[10px] text-slate-400">Realistic equipment view</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
