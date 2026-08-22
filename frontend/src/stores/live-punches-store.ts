// Deprecated: Live attendance biometric feed is now 100% Database-driven.
// Data flow: Face ID Check-in -> Backend API -> Database Record -> React Query -> UI.
export interface LivePunchRecord {
  id: string;
  time: string;
  code: string;
  name: string;
  dept: string;
  method: string;
  location: string;
  status: string;
}

export const useLivePunchesStore = () => ({
  punches: [] as LivePunchRecord[],
  addPunch: (_punch: any) => { },
  syncFromStorage: () => { },
  clearPunches: () => { },
});

export const syncLivePunchesStoreFromStorage = () => { };
