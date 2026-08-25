import { apiClient } from '@/lib/api-client';

export interface TravelApprovalHistory {
  id: string;
  travelBookingId: string;
  userId?: string;
  userName: string;
  action: string;
  remarks?: string;
  createdAt: string;
}

export interface ExpenseClaim {
  id: string;
  claimCode: string;
  travelBookingId?: string;
  companyId: string;
  employeeId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  receiptUrl?: string;
  remarks?: string;
  createdAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  travelBooking?: {
    id: string;
    bookingCode: string;
    purpose: string;
  };
}

export interface TravelBooking {
  id: string;
  bookingCode: string;
  companyId: string;
  employeeId: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  costCenterId?: string;
  gradeId?: string;
  reportingManagerId?: string;

  purpose: string;
  travelType: string;
  fromLocation: string;
  toLocation: string;
  startDate: string;
  endDate: string;
  travelMode: string;

  accommodationRequired: boolean;
  hotelDetails?: string;

  estimatedTravelCost: number;
  estimatedHotelCost: number;
  estimatedFoodCost: number;
  estimatedLocalTransport: number;
  otherCost: number;
  totalEstimatedCost: number;

  advanceRequired: boolean;
  advanceAmount?: number;
  advanceRemarks?: string;
  remarks?: string;
  attachments?: any;

  status: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  company?: { id: string; name: string; code: string };
  employee?: { id: string; employeeCode: string; firstName: string; lastName: string; email?: string };
  department?: { id: string; name: string; code: string };
  designation?: { id: string; title: string; code: string };
  branch?: { id: string; name: string; code: string };
  approvalHistory?: TravelApprovalHistory[];
  expenseClaims?: ExpenseClaim[];
}

export interface TravelDashboardStats {
  ytdBudgetSpent: number;
  pendingClaimsCount: number;
  pendingClaimsAmount: number;
  reimbursedThisMonth: number;
  corporateCardSync: {
    connected: boolean;
    statusText: string;
    description: string;
  };
}

export const travelExpenseApi = {
  getDashboardStats: async (companyId?: string): Promise<TravelDashboardStats> => {
    const res = await apiClient.get<TravelDashboardStats>('/travel-expense/dashboard-stats', { params: { companyId } });
    return res.data;
  },

  listBookings: async (params?: {
    companyId?: string;
    search?: string;
    status?: string;
    travelType?: string;
    departmentId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TravelBooking[]> => {
    const res = await apiClient.get<TravelBooking[]>('/travel-expense/bookings', { params });
    return res.data;
  },

  getBooking: async (id: string): Promise<TravelBooking> => {
    const res = await apiClient.get<TravelBooking>(`/travel-expense/bookings/${id}`);
    return res.data;
  },

  createBooking: async (data: any): Promise<TravelBooking> => {
    const res = await apiClient.post<TravelBooking>('/travel-expense/bookings', data);
    return res.data;
  },

  updateBooking: async (id: string, data: any): Promise<TravelBooking> => {
    const res = await apiClient.patch<TravelBooking>(`/travel-expense/bookings/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, data: { action: string; remarks?: string; rejectionReason?: string }): Promise<TravelBooking> => {
    const res = await apiClient.post<TravelBooking>(`/travel-expense/bookings/${id}/status`, data);
    return res.data;
  },

  createExpenseClaimFromBooking: async (id: string, data?: any): Promise<ExpenseClaim> => {
    const res = await apiClient.post<ExpenseClaim>(`/travel-expense/bookings/${id}/create-expense-claim`, data);
    return res.data;
  },

  listClaims: async (companyId?: string): Promise<ExpenseClaim[]> => {
    const res = await apiClient.get<ExpenseClaim[]>('/travel-expense/claims', { params: { companyId } });
    return res.data;
  },

  createClaimDirect: async (data: any): Promise<ExpenseClaim> => {
    const res = await apiClient.post<ExpenseClaim>('/travel-expense/claims', data);
    return res.data;
  },

  updateClaimStatus: async (id: string, data: { status: string; remarks?: string }): Promise<ExpenseClaim> => {
    const res = await apiClient.post<ExpenseClaim>(`/travel-expense/claims/${id}/status`, data);
    return res.data;
  },
};
