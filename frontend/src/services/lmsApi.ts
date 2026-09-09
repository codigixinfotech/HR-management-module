import { apiClient } from '@/lib/api-client';
import type {
  MarketplaceCourse,
  CompanyCourse,
  CourseEnrollment,
  CourseRequest,
  PurchaseHistoryRecord,
  IssuedCertificate,
  SkillItem,
  EmployeeSkillScore,
  TrainingProgram,
  LearningReimbursement,
} from '@/pages/learning/types';

export const lmsApi = {
  // --- Catalog Courses ---
  getCatalogCourses: async () => {
    const res = await apiClient.get<MarketplaceCourse[]>('/learning/catalog-courses');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  createCatalogCourse: async (data: Partial<MarketplaceCourse>) => {
    return await apiClient.post<MarketplaceCourse>('/learning/catalog-courses', data);
  },

  deleteCatalogCourse: async (id: string) => {
    return await apiClient.delete(`/learning/catalog-courses/${id}`);
  },

  // --- Company Courses & Seats ---
  getCompanyCourses: async () => {
    const res = await apiClient.get<CompanyCourse[]>('/learning/company-courses');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  addCompanyCourse: async (data: Partial<CompanyCourse> & { pricePerSeat?: number }) => {
    return await apiClient.post<CompanyCourse>('/learning/company-courses', data);
  },

  deleteCompanyCourse: async (id: string) => {
    return await apiClient.delete(`/learning/company-courses/${id}`);
  },

  enrollEmployees: async (
    courseId: string,
    employeeIds: string[],
    notifyPortal: boolean = true,
    notifyEmail: boolean = false
  ) => {
    return await apiClient.post(`/learning/company-courses/${courseId}/enrollments`, {
      employeeIds,
      notifyPortal,
      notifyEmail,
    });
  },

  purchaseAdditionalSeats: async (
    courseId: string,
    data: { additionalSeats: number; pricePerSeat?: number; billingEntity?: string; costCenter?: string }
  ) => {
    return await apiClient.post(
      `/learning/company-courses/${courseId}/purchase-seats`,
      data
    );
  },

  // --- Enrollments ---
  getEnrollments: async () => {
    const res = await apiClient.get<CourseEnrollment[]>('/learning/enrollments');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  releaseSeat: async (enrollmentId: string) => {
    return await apiClient.post(`/learning/enrollments/${enrollmentId}/release`);
  },

  deleteEnrollment: async (id: string) => {
    return await apiClient.delete(`/learning/enrollments/${id}`);
  },

  // --- Employee Learning Hub (My Learning) ---
  getMyLearning: async () => {
    const res = await apiClient.get<CourseEnrollment[]>('/learning/my-learning');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  startEnrollment: async (id: string) => {
    return await apiClient.patch<CourseEnrollment>(`/learning/enrollments/${id}/start`);
  },

  updateEnrollmentProgress: async (
    id: string,
    data: {
      progress: number;
      moduleProgress?: any;
      status?: string;
      assessmentScore?: number;
      assessmentPassed?: boolean;
    }
  ) => {
    return await apiClient.patch<CourseEnrollment>(`/learning/enrollments/${id}/progress`, data);
  },

  // --- Assessments Engine ---
  getCourseAssessment: async (courseId: string) => {
    return await apiClient.get<any>(`/learning/courses/${courseId}/assessment`);
  },

  submitAssessmentAttempt: async (
    assessmentId: string,
    data: { answers: Record<string, number>; enrollmentId?: string }
  ) => {
    return await apiClient.post<{
      attemptId: string;
      score: number;
      passed: boolean;
      passingScore: number;
    }>(`/learning/assessments/${assessmentId}/attempts`, data);
  },

  saveCourseAssessment: async (data: any) => {
    return await apiClient.post('/learning/assessments', data);
  },

  // --- Certificates ---
  getCertificates: async () => {
    const res = await apiClient.get<IssuedCertificate[]>('/learning/certificates');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  getMyCertificates: async () => {
    const res = await apiClient.get<IssuedCertificate[]>('/learning/my-certificates');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  createCertificate: async (data: Partial<IssuedCertificate>) => {
    return await apiClient.post<IssuedCertificate>('/learning/certificates', data);
  },

  deleteCertificate: async (id: string) => {
    return await apiClient.delete(`/learning/certificates/${id}`);
  },

  // --- Skills & Skill Matrix ---
  getSkills: async () => {
    const res = await apiClient.get<SkillItem[]>('/learning/skills');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  createSkill: async (data: { name: string; category?: string; description?: string }) => {
    return await apiClient.post<SkillItem>('/learning/skills', data);
  },

  updateSkill: async (id: string, data: Partial<SkillItem>) => {
    return await apiClient.patch<SkillItem>(`/learning/skills/${id}`, data);
  },

  deleteSkill: async (id: string) => {
    return await apiClient.delete(`/learning/skills/${id}`);
  },

  getEmployeeSkills: async () => {
    const res = await apiClient.get<EmployeeSkillScore[]>('/learning/employee-skills');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  // --- Employee Course Requests ---
  getCourseRequests: async () => {
    const res = await apiClient.get<CourseRequest[]>('/learning/course-requests');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  getMyCourseRequests: async () => {
    const res = await apiClient.get<CourseRequest[]>('/learning/my-course-requests');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  submitCourseRequest: async (data: Partial<CourseRequest>) => {
    return await apiClient.post<CourseRequest>('/learning/course-requests', data);
  },

  approveCourseRequest: async (id: string, approvedSeatType: string = 'Existing Seat') => {
    return await apiClient.patch<CourseRequest>(`/learning/course-requests/${id}/approve`, { approvedSeatType });
  },

  approvePurchaseCourseRequest: async (id: string, purchaseData: any) => {
    return await apiClient.post<{ success: boolean; companyCourse: any; enrollment: any; request: any }>(
      `/learning/course-requests/${id}/approve-purchase`,
      purchaseData
    );
  },

  approveExistingSeatCourseRequest: async (id: string, data?: { companyCourseId?: string }) => {
    return await apiClient.post<{ success: boolean; companyCourse: any; enrollment: any; request: any }>(
      `/learning/course-requests/${id}/approve-existing-seat`,
      data
    );
  },

  rejectCourseRequest: async (id: string, rejectionReason: string) => {
    return await apiClient.patch<CourseRequest>(`/learning/course-requests/${id}/reject`, { rejectionReason });
  },

  updateCourseRequest: async (
    id: string,
    data: { status: string; approvedSeatType?: string; rejectionReason?: string }
  ) => {
    return await apiClient.patch<CourseRequest>(`/learning/course-requests/${id}`, data);
  },

  deleteCourseRequest: async (id: string) => {
    return await apiClient.delete(`/learning/course-requests/${id}`);
  },

  // --- Employee Reimbursements (Part 4, 5, 6) ---
  submitReimbursement: async (data: Partial<LearningReimbursement>) => {
    return await apiClient.post<LearningReimbursement>('/learning/reimbursements', data);
  },

  getReimbursements: async () => {
    const res = await apiClient.get<LearningReimbursement[]>('/learning/reimbursements');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  getMyReimbursements: async () => {
    const res = await apiClient.get<LearningReimbursement[]>('/learning/my-reimbursements');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  approveReimbursement: async (id: string, approvedAmount?: number) => {
    return await apiClient.patch<LearningReimbursement>(`/learning/reimbursements/${id}/approve`, {
      approvedAmount,
    });
  },

  rejectReimbursement: async (id: string, rejectionReason: string) => {
    return await apiClient.patch<LearningReimbursement>(`/learning/reimbursements/${id}/reject`, {
      rejectionReason,
    });
  },

  markReimbursementPaymentPending: async (id: string) => {
    return await apiClient.patch<LearningReimbursement>(
      `/learning/reimbursements/${id}/mark-payment-pending`
    );
  },

  markReimbursementPaid: async (id: string, data: { paidAmount?: number; paymentReference?: string }) => {
    return await apiClient.patch<LearningReimbursement>(
      `/learning/reimbursements/${id}/mark-paid`,
      data
    );
  },

  // --- Training Programs (Part 16) ---
  getPrograms: async () => {
    const res = await apiClient.get<TrainingProgram[]>('/learning/programs');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  createProgram: async (data: Partial<TrainingProgram>) => {
    return await apiClient.post<TrainingProgram>('/learning/programs', data);
  },

  updateProgram: async (id: string, data: Partial<TrainingProgram>) => {
    return await apiClient.patch<TrainingProgram>(`/learning/programs/${id}`, data);
  },

  deleteProgram: async (id: string) => {
    return await apiClient.delete(`/learning/programs/${id}`);
  },

  // --- Purchase History ---
  getPurchaseHistory: async () => {
    const res = await apiClient.get<PurchaseHistoryRecord[]>('/learning/purchase-history');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  deletePurchaseHistory: async (orderId: string) => {
    return await apiClient.delete(`/learning/purchase-history/${orderId}`);
  },

  // --- Notifications ---
  getNotifications: async () => {
    const res = await apiClient.get<any[]>('/learning/notifications');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  markNotificationRead: async (id: string) => {
    return await apiClient.patch(`/learning/notifications/${id}/read`);
  },

  markAllNotificationsRead: async () => {
    return await apiClient.patch('/learning/notifications/read-all');
  },

  // --- Reports & Exports ---
  getReportsSummary: async () => {
    return await apiClient.get<any>('/learning/reports/summary');
  },

  exportCompletionsCsv: async () => {
    const res = await apiClient.get('/learning/reports/export/completions', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lms_completions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportCertificatesCsv: async () => {
    const res = await apiClient.get('/learning/reports/export/certificates', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lms_certificates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportReimbursementsCsv: async () => {
    const res = await apiClient.get('/learning/reports/export/reimbursements', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lms_reimbursements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
