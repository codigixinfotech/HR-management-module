import { create } from 'zustand';

export type LeaveSubTab = 'requests' | 'approvals' | 'balances' | 'policies' | 'calendar';
export type EmployeeLeaveSubTab = 'overview' | 'balance' | 'apply' | 'requests' | 'history' | 'calendar';

interface LeaveStoreState {
  viewMode: 'admin' | 'employee';
  setViewMode: (mode: 'admin' | 'employee') => void;

  activeSubTab: LeaveSubTab;
  setActiveSubTab: (tab: LeaveSubTab) => void;

  activeEmployeeSubTab: EmployeeLeaveSubTab;
  setActiveEmployeeSubTab: (tab: EmployeeLeaveSubTab) => void;

  // Search & Filter states
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (dept: string) => void;
  leaveTypeFilter: string;
  setLeaveTypeFilter: (typeId: string) => void;
  yearFilter: number;
  setYearFilter: (year: number) => void;

  // Selection for bulk approvals
  selectedRequestIds: string[];
  toggleSelectRequest: (id: string) => void;
  selectAllRequests: (ids: string[]) => void;
  clearSelectedRequests: () => void;
}

export const useLeaveStore = create<LeaveStoreState>((set) => ({
  viewMode: 'admin',
  setViewMode: (mode) => set({ viewMode: mode }),

  activeSubTab: 'requests',
  setActiveSubTab: (tab) => set({ activeSubTab: tab }),

  activeEmployeeSubTab: 'overview',
  setActiveEmployeeSubTab: (tab) => set({ activeEmployeeSubTab: tab }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  statusFilter: 'ALL',
  setStatusFilter: (status) => set({ statusFilter: status }),
  departmentFilter: 'ALL',
  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),
  leaveTypeFilter: 'ALL',
  setLeaveTypeFilter: (typeId) => set({ leaveTypeFilter: typeId }),
  yearFilter: new Date().getFullYear(),
  setYearFilter: (year) => set({ yearFilter: year }),

  selectedRequestIds: [],
  toggleSelectRequest: (id) =>
    set((state) => ({
      selectedRequestIds: state.selectedRequestIds.includes(id)
        ? state.selectedRequestIds.filter((item) => item !== id)
        : [...state.selectedRequestIds, id],
    })),
  selectAllRequests: (ids) => set({ selectedRequestIds: ids }),
  clearSelectedRequests: () => set({ selectedRequestIds: [] }),
}));
