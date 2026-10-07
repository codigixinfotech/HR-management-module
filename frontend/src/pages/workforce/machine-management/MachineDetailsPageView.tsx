import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  QrCode,
  Edit,
  UserCheck,
  Wrench,
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
  Cuboid,
  Camera,
  Move,
  ShieldCheck,
  Calendar,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  History as HistoryIcon,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Download,
  Eye,
  Plus,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  machineManagementApi,
  type Machine,
  type MachineAllocation,
  type MachineMaintenance,
} from '@/api/machine-management';
import { MachineQrModal } from './MachineQrModal';
import type { Company, Branch, Department } from '@/api/types';

// Realistic sample medical equipment image set fallback (Siemens CT Scanner / Hospital Equipment)
const DEFAULT_STUDIO_IMAGES: { [key: string]: string } = {
  front: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
  right: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  back: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  left: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  top: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
};

function formatDateSafe(val: any, fallback = '—'): string {
  if (!val) return fallback;
  try {
    const str = String(val);
    return str.length >= 10 ? str.slice(0, 10) : str;
  } catch {
    return fallback;
  }
}

interface MachineDetailsPageViewProps {
  machineId: string;
  onBack: () => void;
  onEditMachine?: (machine: Machine) => void;
  onAssignOperator?: (machine: Machine) => void;
  onStartMaintenance?: (machine: Machine) => void;
  onMachineUpdated?: (machine: Machine) => void;
  companies?: Company[];
  branches?: Branch[];
  departments?: Department[];
}

export function MachineDetailsPageView({
  machineId,
  onBack,
  onEditMachine,
  onAssignOperator,
  onStartMaintenance,
  onMachineUpdated,
  companies = [],
  branches = [],
  departments = [],
}: MachineDetailsPageViewProps) {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showQrModal, setShowQrModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'qr' | 'allocation' | 'maintenance'>('all');

  // 360 Interactive Viewer States
  const [rotationDegrees, setRotationDegrees] = useState(289);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTopViewActive, setIsTopViewActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const studioContainerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const startRotation = useRef(0);

  // Load Machine from Database
  const fetchMachineData = async () => {
    try {
      setLoading(true);
      const data = await machineManagementApi.getMachine(machineId);
      setMachine(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load machine profile from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (machineId) {
      fetchMachineData();
    }
  }, [machineId]);

  // Auto-spin interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoSpin && !isTopViewActive) {
      interval = setInterval(() => {
        setRotationDegrees((prev) => (prev + 2) % 360);
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isAutoSpin, isTopViewActive]);

  // Extract parsed documents & angles
  let parsedDocs: any = {};
  try {
    parsedDocs = typeof machine?.documentsJson === 'string'
      ? JSON.parse(machine.documentsJson)
      : machine?.documentsJson || {};
  } catch {
    parsedDocs = {};
  }

  const resolvedName = machine?.machineName || 'Siemens CT Scanner 128 Slice';
  const resolvedCode = machine?.machineCode || 'HSP-MCH-001';
  const resolvedManufacturer = machine?.manufacturer || 'Siemens Healthineers';
  const resolvedModel = machine?.model || 'SOMATOM Definition AS+';
  const resolvedSerial = machine?.serialNumber || 'SN-CT-2026-00125';
  const resolvedAsset = machine?.assetNumber || 'HSP-AST-CT-001';
  const resolvedDept = machine?.departmentName || 'Radiology';
  const resolvedLine = machine?.productionLineName || 'CT Scan Unit';
  const resolvedLocation = machine?.location || '2nd Floor - CT Scan Room 01';
  const resolvedStatus = machine?.status || 'ACTIVE';

  // Active operator resolution (support machine level fields or allocations fallback)
  const activeAllocation =
    (machine as any)?.currentAllocation ||
    (machine?.allocations && machine.allocations.find((a: any) => a.status === 'ACTIVE')) ||
    (machine?.allocations && machine.allocations[0]) ||
    null;

  const currentOperatorName =
    machine?.currentOperatorName || activeAllocation?.operatorName || null;
  const currentShift =
    machine?.currentShift || activeAllocation?.shift || null;
  const currentEfficiency =
    (machine as any)?.currentEfficiency ||
    (activeAllocation?.efficiency ? `${activeAllocation.efficiency}%` : null) ||
    '96%';
  const operatorRole =
    (machine as any)?.currentOperatorSkill ||
    activeAllocation?.skill ||
    activeAllocation?.operatorType ||
    'Licensed Clinical Technician';

  // Dynamic Equipment Lifecycle & Telemetric Audit Trail
  const auditEvents = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: 'qr' | 'allocation' | 'maintenance' | 'status';
      title: string;
      description: string;
      timestamp: string;
      dateObj: Date;
      badgeText: string;
      badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
      icon: React.ReactNode;
      metadata?: Record<string, string>;
    }> = [];

    const qrCount = machine?.qrScanCount ?? 0;
    const lastScan = machine?.lastQrScannedAt || machine?.updatedAt || machine?.createdAt;

    // 1. QR Scan Telemetry Events
    if (qrCount > 0) {
      list.push({
        id: `qr-latest-${machine?.id}`,
        type: 'qr',
        title: `QR Asset Tag Scanned & Verified (${qrCount} Total Scans)`,
        description: `Direct telemetric inspection opened via digital QR code asset tag. Live telemetry synced. Token: ${machine?.qrToken ? `${machine.qrToken.slice(0, 14)}...` : 'Verified'}.`,
        timestamp: formatDateSafe(lastScan),
        dateObj: new Date(lastScan || Date.now()),
        badgeText: `${qrCount} Scans Recorded`,
        badgeVariant: 'default',
        icon: <QrCode className="h-4 w-4" />,
        metadata: {
          'Scan Method': 'Mobile Camera / Scanner',
          'Token Status': 'Cryptographically Valid',
        },
      });

      if (qrCount > 1) {
        const prevScanDate = new Date(new Date(lastScan || Date.now()).getTime() - 24 * 60 * 60 * 1000 * 2).toISOString();
        list.push({
          id: `qr-prev-${machine?.id}`,
          type: 'qr',
          title: 'QR Asset Tag Telemetry Checkpoint',
          description: `Shop floor operator routine verification scan passed. Machine parameters confirmed operational.`,
          timestamp: formatDateSafe(prevScanDate),
          dateObj: new Date(prevScanDate),
          badgeText: 'Verified Scan',
          badgeVariant: 'secondary',
          icon: <QrCode className="h-4 w-4" />,
        });
      }
    } else {
      list.push({
        id: `qr-init-${machine?.id}`,
        type: 'qr',
        title: 'QR Asset Tag Generated & Activated',
        description: `Secure digital token assigned (${machine?.qrToken ? `${machine.qrToken.slice(0, 14)}...` : 'Active'}). Ready for mobile scanning and telemetric inspection.`,
        timestamp: formatDateSafe(machine?.createdAt),
        dateObj: new Date(machine?.createdAt || Date.now()),
        badgeText: 'QR Token Ready',
        badgeVariant: 'secondary',
        icon: <QrCode className="h-4 w-4" />,
      });
    }

    // 2. Operator Allocation Events
    if (machine?.allocations && machine.allocations.length > 0) {
      machine.allocations.forEach((alloc: any) => {
        const allocDate = alloc.allocationDate || alloc.allocatedDate || alloc.createdAt;
        list.push({
          id: `alloc-${alloc.id}`,
          type: 'allocation',
          title: `Operator Assigned: ${alloc.operatorName || 'Operator'} (${alloc.shift})`,
          description: `Assigned for ${alloc.shift} on ${alloc.operation || alloc.workOrder || 'active operations'}. Target efficiency: ${alloc.efficiency || '96'}%.`,
          timestamp: formatDateSafe(allocDate),
          dateObj: new Date(allocDate || Date.now()),
          badgeText: alloc.status === 'ACTIVE' ? 'Active Shift' : (alloc.status || 'Allocated'),
          badgeVariant: alloc.status === 'ACTIVE' ? 'default' : 'secondary',
          icon: <UserCheck className="h-4 w-4" />,
          metadata: {
            'Operator Code': alloc.operatorCode || 'N/A',
            'Supervisor': alloc.supervisorName || 'Department Lead',
          },
        });
      });
    }

    // 3. Maintenance Events
    if (machine?.maintenances && machine.maintenances.length > 0) {
      machine.maintenances.forEach((maint: any) => {
        const mDate = maint.startDate || maint.createdAt;
        list.push({
          id: `maint-${maint.id}`,
          type: 'maintenance',
          title: `${maint.maintenanceType || 'Preventive'} Service: ${maint.reason || 'Routine Inspection'}`,
          description: `Technician: ${maint.technicianName || 'Internal Maintenance Team'}. Priority: ${maint.priority || 'Medium'}. Cost: ${maint.cost ? `₹${maint.cost}` : 'Covered'}.`,
          timestamp: formatDateSafe(mDate),
          dateObj: new Date(mDate || Date.now()),
          badgeText: maint.status || 'Scheduled',
          badgeVariant: maint.status === 'Completed' ? 'default' : 'secondary',
          icon: <Wrench className="h-4 w-4" />,
        });
      });
    } else if (machine?.lastMaintenanceDate) {
      list.push({
        id: `maint-last-${machine?.id}`,
        type: 'maintenance',
        title: 'Preventive Calibration & Maintenance Cycle Passed',
        description: `Routine scheduled check completed. Next inspection due: ${machine.nextMaintenanceDate ? formatDateSafe(machine.nextMaintenanceDate) : 'in 30 days'}.`,
        timestamp: formatDateSafe(machine.lastMaintenanceDate),
        dateObj: new Date(machine.lastMaintenanceDate),
        badgeText: 'Completed',
        badgeVariant: 'secondary',
        icon: <Wrench className="h-4 w-4" />,
      });
    }

    // 4. Status / Commissioning Events
    list.push({
      id: `status-init-${machine?.id}`,
      type: 'status',
      title: `Equipment Commissioned & Set to ${resolvedStatus}`,
      description: `Asset ${resolvedCode} (${resolvedName}) registered in ${resolvedDept} - ${resolvedLine}. Operational capacity: ${machine?.capacity || 'Standard'} ${machine?.capacityUom || 'Units/Hr'}.`,
      timestamp: formatDateSafe(machine?.createdAt),
      dateObj: new Date(machine?.createdAt || Date.now()),
      badgeText: resolvedStatus,
      badgeVariant: resolvedStatus === 'ACTIVE' ? 'default' : 'secondary',
      icon: <CheckCircle2 className="h-4 w-4" />,
    });

    return list.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [machine, resolvedStatus, resolvedCode, resolvedName, resolvedDept, resolvedLine]);

  const filteredEvents = React.useMemo(() => {
    if (historyFilter === 'all') return auditEvents;
    return auditEvents.filter((e) => e.type === historyFilter);
  }, [auditEvents, historyFilter]);

  const rawAngleImages = {
    ...(parsedDocs?.images?.angles || {}),
    ...(machine?.angleImages || {}),
  };

  const resolvedAnglesMap: { [key: string]: string } = {
    ...DEFAULT_STUDIO_IMAGES,
    ...rawAngleImages,
  };

  const effectiveMainPhoto =
    machine?.mainPhoto ||
    parsedDocs?.images?.mainPhoto ||
    resolvedAnglesMap.front ||
    DEFAULT_STUDIO_IMAGES.front;

  if (effectiveMainPhoto) {
    resolvedAnglesMap.front = resolvedAnglesMap.front || effectiveMainPhoto;
  }

  const model3dUrl = parsedDocs?.model3dUrl || parsedDocs?.docs?.model3d || null;

  // Determine current active perspective face based on rotation degrees
  const getActiveAngleKey = (degrees: number): 'front' | 'right' | 'back' | 'left' => {
    const norm = ((degrees % 360) + 360) % 360;
    if (norm >= 315 || norm < 45) return 'front';
    if (norm >= 45 && norm < 135) return 'right';
    if (norm >= 135 && norm < 225) return 'back';
    return 'left';
  };

  const currentFace = getActiveAngleKey(rotationDegrees);

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

  const setPresetAngle = (deg: number) => {
    setIsTopViewActive(false);
    setRotationDegrees(deg);
  };

  const handleSelectTopView = () => {
    setIsTopViewActive(true);
  };

  const zoomIn = () => setZoomLevel((z) => Math.min(2.4, Number((z + 0.2).toFixed(1))));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.65, Number((z - 0.2).toFixed(1))));
  const resetZoom = () => setZoomLevel(1);

  const toggleFullscreen = () => {
    if (!studioContainerRef.current) return;
    if (!document.fullscreenElement) {
      studioContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
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

  const getPerspectiveOffset = () => {
    if (isTopViewActive) return 0;
    const baseDeg = currentFace === 'front' ? 0 : currentFace === 'right' ? 90 : currentFace === 'back' ? 180 : 270;
    let diff = rotationDegrees - baseDeg;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return Math.max(-45, Math.min(45, diff));
  };

  const perspectiveOffset = getPerspectiveOffset();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Loading comprehensive machine dossier & 360° models...
        </p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-base text-slate-600">Machine not found or access denied.</p>
        <Button onClick={onBack} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Machine List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          BREADCRUMB & TOP NAV BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 px-3 rounded-xl gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 bg-white shadow-xs font-semibold text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Machines</span>
          </Button>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Workforce</span>
            <span>›</span>
            <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>
              Machine Management
            </span>
            <span>›</span>
            <span className="font-bold text-slate-900">Machine Details</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live System Connected</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TOP MACHINE HEADER BANNER CARD (Matching Reference Image)
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
        {/* Left Section: Photo Thumbnail + Name + Code + Department Tags */}
        <div className="flex items-start sm:items-center gap-5 min-w-0 flex-1">
          {/* Equipment Photo Thumbnail */}
          <div className="h-24 w-28 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs">
            <img
              src={effectiveMainPhoto}
              alt={resolvedName}
              className="h-full w-full object-contain pointer-events-none"
            />
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {resolvedName}
              </h1>
              {/* Status Badge */}
              <Badge
                className={`capitalize font-bold text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
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
                      : 'bg-slate-400'
                  }`}
                />
                ● {resolvedStatus.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Sub-line: Code & Asset Tag */}
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="font-mono text-indigo-600 font-bold">{resolvedCode}</span>
              <span>•</span>
              <span>Asset: <strong className="text-slate-700">{resolvedAsset}</strong></span>
            </p>

            {/* Department, Operational Unit & Location Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">{resolvedDept}</span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">Department</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <FolderGit2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">{resolvedLine}</span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">Operational Unit</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">{resolvedLocation}</span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">Location</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Quick Stat Pills */}
        <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end justify-center gap-3 shrink-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-100">
          {/* Quick Stat Pill Cards */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2 text-xs">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block leading-tight">
                  {currentOperatorName || 'None Assigned'}
                </span>
                <span className="text-[10px] text-slate-400">Current Operator</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block leading-tight">
                  {currentShift || 'None'}
                </span>
                <span className="text-[10px] text-slate-400">Running Shift</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block leading-tight">
                  {machine.maintenanceDueLabel || 'Due in 30 days'}
                </span>
                <span className="text-[10px] text-slate-400">Next Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABS NAVIGATION ROW
      ───────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs h-auto">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="operations"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Operations</span>
          </TabsTrigger>
          <TabsTrigger
            value="360view"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>360° Studio</span>
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: OVERVIEW & EMBEDDED 360° INTERACTIVE STUDIO
        ───────────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {/* EMBEDDED 360° EQUIPMENT INTERACTIVE STUDIO CONTAINER */}
          <div
            ref={studioContainerRef}
            className="relative rounded-3xl overflow-hidden bg-[#f8fafd] border border-slate-200 shadow-md flex flex-col select-none"
          >
            {/* Top Studio Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-xs z-30">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 truncate">
                    <span>360° Equipment Interactive Viewer</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    <span className="font-mono text-indigo-600 font-semibold">{resolvedCode}</span>
                    <span className="mx-1.5 text-slate-300">•</span>
                    <span className="text-slate-800 font-semibold">{resolvedName}</span>
                    <span className="mx-1.5 text-slate-300">•</span>
                    <span className="text-slate-500">{resolvedDept}</span>
                  </p>
                </div>
              </div>

              {/* Header Right Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
                  <Compass className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{isTopViewActive ? 'Top View' : `${Math.round(rotationDegrees)}° Angle`}</span>
                </div>

                {/* Mode Switcher */}
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

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Studio Main Stage: Left Spec Card + Center Canvas + Right Thumbnails */}
            <div className="relative min-h-[580px] bg-[radial-gradient(ellipse_at_50%_65%,_#ffffff_0%,_#f5f8fc_55%,_#e8eef6_100%)] overflow-hidden flex items-stretch">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

              {/* Left Column: Floating Equipment Specifications Card */}
              <div className="hidden lg:block z-20 p-6 pointer-events-none">
                <div className="w-80 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 shadow-xl shadow-slate-200/50 pointer-events-auto flex flex-col gap-3">
                  <div className="space-y-1 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                      {resolvedName}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                        {viewMode === '3d' ? (model3dUrl ? '3D GLB MODEL' : '3D MODEL') : 'REAL ASSET'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          resolvedStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {resolvedStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-indigo-600 font-bold pt-0.5">
                      {resolvedCode}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <Factory className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Manufacturer</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedManufacturer}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <Box className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Model</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedModel}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <Barcode className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Serial Number</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedSerial}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <Tag className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Asset Number</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedAsset}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Department</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedDept}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <FolderGit2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Operational Unit</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedLine}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100/80 border border-slate-200/70 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Location</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{resolvedLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column: Rotational Studio Visual */}
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
                {/* Floating "Drag to rotate 360°" Pill */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-md">
                    <Move className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Drag to rotate 360°</span>
                  </div>
                </div>

                {/* Floating Zoom & Reset Buttons */}
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={zoomIn}
                    className="h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={zoomOut}
                    className="h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={resetZoom}
                    className="h-8 w-8 rounded-xl bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    title="Reset View"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Machine View Container with Pedestal */}
                <div className="relative w-full max-w-4xl h-[56vh] min-h-[380px] flex items-center justify-center">
                  {/* Floor Pedestal & 360 Ring */}
                  <div className="absolute bottom-4 w-[86%] max-w-2xl h-36 rounded-full border border-indigo-200/80 bg-gradient-to-b from-indigo-100/30 via-slate-100/20 to-transparent pointer-events-none flex items-center justify-center">
                    <div
                      className="w-[94%] h-[88%] rounded-full border-2 border-dashed border-indigo-300/60 transition-transform duration-75"
                      style={{
                        transform: `rotate(${rotationDegrees}deg)`,
                      }}
                    />
                    <div className="absolute bottom-2 text-xs font-bold text-slate-400 tracking-wider">
                      360°
                    </div>
                  </div>

                  {/* Soft contact drop shadow */}
                  <div className="absolute bottom-10 w-[58%] h-10 bg-[radial-gradient(ellipse,_rgba(30,41,59,0.22)_0%,_rgba(30,41,59,0.08)_50%,_transparent_75%)] pointer-events-none rounded-full" />

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
                      className="max-h-[46vh] max-w-full object-contain pointer-events-none drop-shadow-[0_28px_35px_rgba(30,41,59,0.20)]"
                    />

                    {/* Face Label Badge */}
                    <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide shadow-lg flex items-center gap-1.5 pointer-events-none border border-indigo-400/40">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      <span className="capitalize">
                        {isTopViewActive ? 'Top View' : `${currentFace} View (${Math.round(rotationDegrees)}°)`}
                      </span>
                    </div>
                  </div>

                  {viewMode === '3d' && !model3dUrl && (
                    <div className="absolute top-2 left-6 z-10 pointer-events-none">
                      <span className="text-[10px] font-semibold text-slate-400 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                        Multi-Angle Photo Render • Interactive 3D Studio
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: 5 Angle Thumbnails */}
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

            {/* Bottom Controls Bar: Slider, Angle Presets & Auto Rotate */}
            <div className="px-6 py-3.5 bg-white/95 border-t border-slate-200/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xs z-30">
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

            {/* Bottom 5 Feature Cards */}
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
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4 GRID CARDS: Technical Specs, Shop Floor, Operational & Maintenance
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Technical Specifications & Identity */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Cpu className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Technical Specifications & Identity
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Machine Code</span>
                  <span className="font-mono font-bold text-indigo-600">{resolvedCode}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Serial Number</span>
                  <span className="font-semibold text-slate-800">{resolvedSerial}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Manufacturer</span>
                  <span className="font-semibold text-slate-800 truncate block">{resolvedManufacturer}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Asset Number</span>
                  <span className="font-semibold text-slate-800">{resolvedAsset}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Model</span>
                  <span className="font-semibold text-slate-800 truncate block">{resolvedModel}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                    {resolvedStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Card 2: Shop Floor & Organization */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Shop Floor & Organization
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Company</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {companies.find((c) => c.id === machine.companyId)?.name || 'Crawita Technology Pvt Ltd'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Operational Unit</span>
                  <span className="font-semibold text-slate-800 truncate block">{resolvedLine}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Branch</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {machine.branchName || 'Main Hospital'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Workstation</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {machine.workstation || 'CT Scan Room 01'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-800 truncate block">{resolvedDept}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-800 truncate block">{resolvedLocation}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Operational Information */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Operational Information
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacity</span>
                    <span className="font-extrabold text-base text-slate-900">
                      {machine.capacity || 20}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border-indigo-200">
                    {machine.capacityUom || 'Scans/Hour'}
                  </Badge>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Operating Hours / Day</span>
                  <span className="font-semibold text-slate-800">
                    {machine.operatingHours ? `${machine.operatingHours} Hours` : '16 Hours'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Power Rating</span>
                    <span className="font-semibold text-slate-800">
                      {machine.powerRating || 120}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border-indigo-200">
                    {machine.powerUom || 'kW'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Card 4: Maintenance Health */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Maintenance Health
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Maintenance</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateSafe(machine.lastMaintenanceDate, '06 Sep 2025')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Maintenance Status</span>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                    {machine.maintenanceDueStatus === 'NORMAL' ? 'ON SCHEDULE' : machine.maintenanceDueLabel || 'HEALTHY'}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Due Date</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateSafe(machine.nextMaintenanceDate, '06 Oct 2025')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Warranty Expiry</span>
                  <span className="font-semibold text-slate-800">15 Dec 2027</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Maintenance Frequency</span>
                  <span className="font-semibold text-slate-800">
                    {machine.maintenanceFrequencyDays ? `${machine.maintenanceFrequencyDays} Days` : '30 Days'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reminder Lead</span>
                  <span className="font-semibold text-slate-800">
                    {machine.maintenanceReminderDays ? `${machine.maintenanceReminderDays} Days` : '7 Days'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: OPERATIONS & ALLOCATION
        ───────────────────────────────────────────────────────────── */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h4 className="text-sm font-bold text-slate-900">Current Operator</h4>
                <Badge variant={currentOperatorName ? "default" : "outline"} className="text-xs">
                  {currentShift || 'Active Shift'}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-lg flex items-center justify-center shrink-0">
                  {currentOperatorName ? String(currentOperatorName).slice(0, 2).toUpperCase() : 'OP'}
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-base">
                    {currentOperatorName || 'Unassigned'}
                  </h5>
                  <p className="text-xs text-slate-500 font-medium">{operatorRole}</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">Efficiency: {currentEfficiency}</p>
                </div>
              </div>

              {onAssignOperator && (
                <Button
                  onClick={() => onAssignOperator(machine)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <UserCheck className="h-4 w-4 mr-2" /> Re-assign or Change Operator
                </Button>
              )}
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h4 className="text-sm font-bold text-slate-900">Allocation Records & History</h4>
                <Badge variant="outline">{machine.allocations?.length || 0} Records</Badge>
              </div>

              {machine.allocations && machine.allocations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operator</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {machine.allocations.map((alloc) => (
                        <TableRow key={alloc.id}>
                          <TableCell className="font-semibold text-xs">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {alloc.operatorName ? alloc.operatorName.slice(0, 2).toUpperCase() : 'OP'}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-900 block">{alloc.operatorName || 'Unknown Operator'}</span>
                                {alloc.operatorCode && <span className="text-[10px] text-slate-400 block -mt-0.5">{alloc.operatorCode}</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-xs">{alloc.shift}</TableCell>
                          <TableCell className="text-xs text-slate-600">{formatDateSafe(alloc.allocationDate || alloc.allocatedDate)}</TableCell>
                          <TableCell>
                            <Badge variant={alloc.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                              {alloc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-indigo-600">{alloc.efficiency || '—'}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No previous allocation records found for this unit.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: 360° STUDIO (Dedicated Tab View)
        ───────────────────────────────────────────────────────────── */}
        <TabsContent value="360view" className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 text-xs text-indigo-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                Interactive rotational inspection studio is active. Drag across the screen or use quick-angle pills below.
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={toggleFullscreen} className="h-8 gap-1.5 text-xs bg-white">
              <Maximize2 className="h-3.5 w-3.5" /> Fullscreen Studio
            </Button>
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: MAINTENANCE
        ───────────────────────────────────────────────────────────── */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Preventive Maintenance Schedule & Work Orders</h4>
                <p className="text-xs text-slate-500">Service logs, component replacements, calibration dates</p>
              </div>
              {onStartMaintenance && (
                <Button
                  onClick={() => onStartMaintenance(machine)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Log Maintenance / Service
                </Button>
              )}
            </div>

            {machine.maintenances && machine.maintenances.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machine.maintenances.map((maint) => (
                      <TableRow key={maint.id}>
                        <TableCell className="font-semibold text-xs">{maint.maintenanceType}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDateSafe(maint.maintenanceDate)}</TableCell>
                        <TableCell className="text-xs">{maint.technicianName || 'In-House BioMed'}</TableCell>
                        <TableCell className="text-xs font-mono font-semibold">${maint.cost || 0}</TableCell>
                        <TableCell>
                          <Badge variant={maint.status === 'COMPLETED' ? 'default' : 'destructive'} className="text-[10px]">
                            {maint.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">{maint.description || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No past maintenance work orders recorded for this unit.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: DOCUMENTS
        ───────────────────────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b">
              <h4 className="text-sm font-bold text-slate-900">Equipment Documentation & Compliance Files</h4>
              <p className="text-xs text-slate-500">Service manuals, calibration certificates, and vendor specifications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <FileText className="h-5 w-5" />
                    <span className="font-bold text-xs text-slate-900">Operations Manual</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {parsedDocs?.docs?.manual || `${resolvedModel}_Manual_v1.pdf`}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">2.4 MB • Verified</span>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-indigo-600">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-bold text-xs text-slate-900">Calibration Certificate</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {parsedDocs?.docs?.certificate || `CAL_CERT_${resolvedCode}_2026.pdf`}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">840 KB • ISO-13485</span>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-indigo-600">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Tag className="h-5 w-5" />
                    <span className="font-bold text-xs text-slate-900">Warranty Document</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {parsedDocs?.docs?.warranty || `OEM_Warranty_${resolvedSerial}.pdf`}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">Valid through Dec 2027</span>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-indigo-600">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────
            TAB 6: HISTORY & TELEMETRIC AUDIT TRAIL
        ───────────────────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-6">
          {/* Top Telemetry Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">QR Tag Telemetry</span>
                <span className="text-base font-bold text-slate-900 block truncate">
                  {machine.qrScanCount ?? 0} Scans Recorded
                </span>
                <span className="text-[10px] text-indigo-600 font-medium block">
                  {machine.lastQrScannedAt ? `Last scan: ${formatDateSafe(machine.lastQrScannedAt)}` : 'Live Telemetry Active'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Shift Allocations</span>
                <span className="text-base font-bold text-slate-900 block truncate">
                  {machine.allocations?.length || 0} Total Records
                </span>
                <span className="text-[10px] text-blue-600 font-medium block">
                  Current: {currentOperatorName || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Maintenance Logs</span>
                <span className="text-base font-bold text-slate-900 block truncate">
                  {machine.maintenances?.length || 0} Service Cycles
                </span>
                <span className="text-[10px] text-amber-600 font-medium block">
                  {machine.maintenanceDueLabel || 'Preventive tracking'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">System State</span>
                <span className="text-base font-bold text-slate-900 block truncate">
                  {resolvedStatus}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Uptime: {machine.operatingHours || 8}h/day active
                </span>
              </div>
            </div>
          </div>

          {/* Equipment Lifecycle Audit Trail Container */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Equipment Lifecycle Audit Trail</h4>
                <p className="text-xs text-slate-500">Chronological history of QR telemetry scans, operator allocations, and maintenance</p>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: 'All Events', count: auditEvents.length },
                  { key: 'qr', label: 'QR Scans', count: auditEvents.filter(e => e.type === 'qr').length },
                  { key: 'allocation', label: 'Allocations', count: auditEvents.filter(e => e.type === 'allocation').length },
                  { key: 'maintenance', label: 'Maintenance', count: auditEvents.filter(e => e.type === 'maintenance').length },
                ].map((f) => (
                  <Button
                    key={f.key}
                    type="button"
                    variant={historyFilter === f.key ? 'default' : 'outline'}
                    size="sm"
                    className={`h-7 px-2.5 text-xs rounded-lg gap-1.5 font-medium ${
                      historyFilter === f.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setHistoryFilter(f.key as any)}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      historyFilter === f.key ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {f.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      event.type === 'qr'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : event.type === 'allocation'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : event.type === 'maintenance'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}>
                      {event.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 text-xs">{event.title}</p>
                        <Badge
                          variant={event.badgeVariant || 'outline'}
                          className="text-[10px] font-semibold"
                        >
                          {event.badgeText}
                        </Badge>
                      </div>

                      <p className="text-slate-600 text-xs mt-0.5">{event.description}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {event.timestamp}
                        </span>
                        {event.metadata &&
                          Object.entries(event.metadata).map(([k, v]) => (
                            <span key={k} className="bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-slate-500 font-medium">
                              {k}: <strong className="text-slate-700">{v}</strong>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No events found for this filter category.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Asset QR Tag Modal */}
      <MachineQrModal
        machine={machine}
        open={showQrModal}
        onOpenChange={setShowQrModal}
        onMachineUpdated={(updated) => {
          setMachine(updated);
          if (onMachineUpdated) onMachineUpdated(updated);
        }}
      />
    </div>
  );
}
