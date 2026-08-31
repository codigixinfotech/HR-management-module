import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AttendanceEditRequest {
  id: string;
  attendanceRecordId?: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  attendanceDate: string;
  originalClockIn: string;
  originalClockOut: string;
  requestedClockIn: string;
  requestedClockOut: string;
  originalTotalHours: string;
  requestedTotalHours: string;
  reason: string;
  requestedBy: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface ApprovedCorrection {
  clockIn: string;
  clockOut: string;
  totalHours: string;
  approvedBy: string;
  approvedAt: string;
  originalClockIn: string;
  originalClockOut: string;
  originalTotalHours: string;
}

interface AttendanceRequestsState {
  requests: AttendanceEditRequest[];
  approvedCorrections: Record<string, ApprovedCorrection>;
  addRequest: (request: Omit<AttendanceEditRequest, 'id' | 'status' | 'requestDate'>) => AttendanceEditRequest;
  updateRequest: (id: string, updatedFields: Partial<AttendanceEditRequest>) => void;
  deleteRequest: (id: string) => void;
  approveRequest: (targetId: string, approvedBy?: string) => void;
  rejectRequest: (targetId: string, rejectedBy?: string, reason?: string) => void;
  getRequestsForEmployee: (empCode: string) => AttendanceEditRequest[];
  getPendingCount: (empCode?: string) => number;
  clearAllRequests: () => void;
}

const DEMO_REQUEST_IDS = new Set(['ATT-REQ-8823', 'ATT-REQ-8822', 'ATT-REQ-8821']);

const DEFAULT_INITIAL_REQUESTS: AttendanceEditRequest[] = [];

// Keys are ONLY request IDs — never employee+date combos.
const INITIAL_APPROVED_CORRECTIONS: Record<string, ApprovedCorrection> = {};

// STABLE key — never version this. Versioning caused cross-tab key mismatches.
const STABLE_KEY = 'attendance-requests-store';

// BroadcastChannel for real-time cross-tab notification
const requestChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('attendance-requests-channel')
    : null;

const notifyTabs = () => {
  try {
    requestChannel?.postMessage('sync');
  } catch (e) {
    console.error('BroadcastChannel postMessage error:', e);
  }
};

export const useAttendanceRequestsStore = create<AttendanceRequestsState>()(
  persist(
    (set, get) => ({
      requests: DEFAULT_INITIAL_REQUESTS,
      approvedCorrections: INITIAL_APPROVED_CORRECTIONS,

      addRequest: (newReqData) => {
        const newReq: AttendanceEditRequest = {
          ...newReqData,
          id: `ATT-REQ-${Date.now()}`,
          requestDate: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'PENDING',
        };
        set((state) => ({ requests: [newReq, ...state.requests] }));
        notifyTabs();
        return newReq;
      },

      updateRequest: (id, updatedFields) => {
        set((state) => ({
          requests: state.requests.map((r) => (r.id === id ? { ...r, ...updatedFields } : r)),
        }));
        notifyTabs();
      },

      deleteRequest: (id) => {
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        }));
        notifyTabs();
      },

      approveRequest: (targetId, approvedBy = 'Admin/HR') => {
        set((state) => {
          const approvedAt = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const target = state.requests.find((r) => r.id === targetId || r.attendanceDate === targetId);
          if (!target) return state;

          const updatedRequests = state.requests.map((r) =>
            r.id === target.id ? { ...r, status: 'APPROVED' as const, approvedBy, approvedAt } : r
          );

          const correction: ApprovedCorrection = {
            clockIn: target.requestedClockIn,
            clockOut: target.requestedClockOut,
            totalHours: target.requestedTotalHours,
            approvedBy,
            approvedAt,
            originalClockIn: target.originalClockIn,
            originalClockOut: target.originalClockOut,
            originalTotalHours: target.originalTotalHours,
          };

          // Key ONLY by request ID — date-based keys auto-approve future requests for the same date.
          return {
            requests: updatedRequests,
            approvedCorrections: { ...state.approvedCorrections, [target.id]: correction },
          };
        });
        notifyTabs();
      },

      rejectRequest: (targetId, rejectedBy = 'Admin/HR', reason?: string) => {
        const rejectedAt = new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === targetId || r.attendanceDate === targetId
              ? { ...r, status: 'REJECTED' as const, rejectedBy, rejectedAt, rejectionReason: reason || r.rejectionReason }
              : r
          ),
        }));
        notifyTabs();
      },

      getRequestsForEmployee: (empCode: string) => {
        const state = get();
        if (!empCode) return state.requests;
        return state.requests.filter((r) => r.employeeCode === empCode || r.requestedBy === empCode);
      },

      getPendingCount: (empCode?: string) => {
        const state = get();
        const reqs = empCode
          ? state.requests.filter((r) => r.employeeCode === empCode || r.requestedBy === empCode)
          : state.requests;
        return reqs.filter((r) => r.status === 'PENDING').length;
      },

      clearAllRequests: () => set({ requests: [], approvedCorrections: {} }),
    }),
    { name: STABLE_KEY }
  )
);

// ─── Cross-tab sync ───────────────────────────────────────────────────────────

// Read directly from localStorage and push into Zustand — no async gaps.
export const syncAttendanceStoreFromStorage = () => {
  try {
    const raw = localStorage.getItem(STABLE_KEY);
    if (!raw) return;
    const { requests: stored, approvedCorrections: storedAC } = JSON.parse(raw)?.state ?? {};
    if (Array.isArray(stored)) {
      const cleaned = stored.filter((r: any) => !DEMO_REQUEST_IDS.has(r.id) && r.employeeCode !== 'EMP0002');
      const current = useAttendanceRequestsStore.getState().requests;
      if (cleaned.length !== current.length || JSON.stringify(cleaned) !== JSON.stringify(current)) {
        useAttendanceRequestsStore.setState({
          requests: [...cleaned],
          approvedCorrections: { ...(storedAC ?? {}) },
        });
      }
    }
  } catch (e) {
    console.error('[AttendanceStore] syncFromStorage error:', e);
  }
};

// ─── Startup: migrate requests from ALL previous versioned keys ───────────────
// Old keys (v12, v13, v14) may contain pending requests that were never seen
// by the Admin tab because they were stored under a different key.
if (typeof window !== 'undefined') {
  const OLD_KEYS = [
    'attendance-edit-requests-storage-v14',
    'attendance-edit-requests-storage-v13',
    'attendance-edit-requests-storage-v12',
    'attendance-edit-requests-storage-v11',
  ];

  const migrateOldKeys = () => {
    const currentState = useAttendanceRequestsStore.getState();
    const existingIds = new Set(currentState.requests.map((r) => r.id));
    const incoming: AttendanceEditRequest[] = [];

    for (const key of OLD_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const { requests: oldReqs } = JSON.parse(raw)?.state ?? {};
        if (Array.isArray(oldReqs)) {
          for (const req of oldReqs) {
            if (req.id && !existingIds.has(req.id)) {
              incoming.push(req as AttendanceEditRequest);
              existingIds.add(req.id);
            }
          }
        }
        localStorage.removeItem(key); // clean up old key
      } catch { /* ignore */ }
    }

    if (incoming.length > 0) {
      useAttendanceRequestsStore.setState((state) => ({
        requests: [...incoming, ...state.requests],
      }));
      console.info(`[AttendanceStore] Migrated ${incoming.length} request(s) from old storage keys.`);
      notifyTabs(); // notify other open tabs
    }
  };

  // Delay slightly so Zustand persist can finish initializing first
  setTimeout(migrateOldKeys, 50);

  // storage event fires in OTHER tabs when localStorage changes (no-op in sender tab)
  window.addEventListener('storage', (e) => {
    if (e.key === STABLE_KEY) syncAttendanceStoreFromStorage();
  });

  // BroadcastChannel fires across all tabs including the sender
  if (requestChannel) {
    requestChannel.onmessage = () => syncAttendanceStoreFromStorage();
  }
}
