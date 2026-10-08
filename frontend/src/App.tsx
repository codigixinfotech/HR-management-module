import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import CareersPage from '@/pages/recruitment/CareersPage';
import CareersJobDetailPage from '@/pages/recruitment/CareersJobDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import OrganizationPage from '@/pages/organization/OrganizationPage';
import EmployeeListPage from '@/pages/employees/EmployeeListPage';
import EmployeeDetailPage from '@/pages/employees/EmployeeDetailPage';
import JobOpeningsPage from '@/pages/recruitment/JobOpeningsPage';
import JobOpeningDetailPage from '@/pages/recruitment/JobOpeningDetailPage';
import CreateJobRequisitionPage from '@/pages/recruitment/CreateJobRequisitionPage';
import TasksPage from '@/pages/tasks/TasksPage';
import WorkforcePage from '@/pages/workforce/WorkforcePage';
import WorkforcePlanningPage from '@/pages/workforce/WorkforcePlanningPage';
import ShiftPlanningPage from '@/pages/workforce/ShiftPlanningPage';
import MachineAllocationPage from '@/pages/workforce/MachineAllocationPage';
import MachineManagementPage from '@/pages/workforce/machine-management/MachineManagementPage';
import ContractorManagementPage from '@/pages/workforce/ContractorManagementPage';
import WorkforceReportsPage from '@/pages/workforce/WorkforceReportsPage';
import AttendanceLeavePage from '@/pages/attendance-leave/AttendanceLeavePage';
import PayrollPage from '@/pages/payroll/PayrollPage';
import CompliancePage from '@/pages/compliance/CompliancePage';
import PerformancePage from '@/pages/performance/PerformancePage';
import LearningPage from '@/pages/learning/LearningPage';
import CompensationBenefitsPage from '@/pages/compensation-benefits/CompensationBenefitsPage';
import EmployeeExperiencePage from '@/pages/employee-experience/EmployeeExperiencePage';
import AssetMasterPage from '@/pages/asset-management/AssetMasterPage';
import AssetRequestPage from '@/pages/asset-management/AssetRequestPage';
import AssetAllocationPage from '@/pages/asset-management/AssetAllocationPage';
import AssetReturnPage from '@/pages/asset-management/AssetReturnPage';
import AssetMaintenancePage from '@/pages/asset-management/AssetMaintenancePage';
import AssetReportsPage from '@/pages/asset-management/AssetReportsPage';
import TravelExpensePage from '@/pages/travel-expense/TravelExpensePage';
import SafetyEhsPage from '@/pages/ehs/SafetyEhsPage';
import AiIntelligencePage from '@/pages/ai-intelligence/AiIntelligencePage';
import IotDevicesPage from '@/pages/iot-devices/IotDevicesPage';
import ReportsAnalyticsPage from '@/pages/reports-analytics/ReportsAnalyticsPage';
import WorkflowAutomationPage from '@/pages/workflow-automation/WorkflowAutomationPage';
import IntegrationsPage from '@/pages/integrations/IntegrationsPage';
import AdministrationPage from '@/pages/administration/AdministrationPage';

import CandidateAssessmentPage from '@/pages/recruitment/CandidateAssessmentPage';
import { LandingPage } from '@/pages/landing/LandingPage';
import SetPasswordPage from '@/pages/auth/SetPasswordPage';

import { CompanyProvider } from '@/context/CompanyContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function UploadsRedirectHandler() {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const rawFilename = pathname.split('/').pop() || '';
    const filename = decodeURIComponent(rawFilename).trim();
    const serverBase =
      import.meta.env.VITE_SERVER_URL &&
      !import.meta.env.VITE_SERVER_URL.includes('localhost') &&
      !import.meta.env.VITE_SERVER_URL.includes('127.0.0.1')
        ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
        : window.location.origin;

    if (filename && !['uploads', 'resumes', 'download'].includes(filename.toLowerCase())) {
      window.location.replace(`${serverBase}/api/recruitment/job-openings/resumes/download/${encodeURIComponent(filename)}`);
    } else {
      window.location.replace('/recruitment');
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm font-medium">Opening candidate document...</p>
      </div>
    </div>
  );
}

/**
 * AuthenticatedLayout wraps CompanyProvider + ProtectedRoute + AppLayout.
 * CompanyProvider MUST only mount for authenticated sessions — placing it here
 * (inside the route tree, not above <Routes>) ensures React Router can freely
 * swap the route matched at /login vs /dashboard without CompanyProvider
 * blocking the re-render propagation.
 */
function AuthenticatedLayout() {
  return (
    <CompanyProvider>
      <ProtectedRoute />
    </CompanyProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── PUBLIC ROUTES ─────────────────────────────────────────── */}
          {/* These render immediately with no auth or CompanyProvider dependency */}

          {/* Root & Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/landing/:tab" element={<LandingPage />} />

          {/* Login Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public Auth Routes */}
          <Route path="/auth/set-password" element={<SetPasswordPage />} />
          <Route path="/auth/verify-invitation" element={<SetPasswordPage />} />

          {/* Public Careers Routes */}
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/careers/*" element={<CareersPage />} />
          <Route path="/careers/job/:id" element={<CareersJobDetailPage />} />
          <Route path="/candidate-assessment/:token" element={<CandidateAssessmentPage />} />

          {/* Uploads & Resume Download Interceptor */}
          <Route path="/uploads/*" element={<UploadsRedirectHandler />} />
          <Route path="/api/uploads/*" element={<UploadsRedirectHandler />} />

          {/* ── PROTECTED ROUTES ──────────────────────────────────────── */}
          {/* CompanyProvider is scoped here — only mounts for authenticated sessions */}
          <Route element={<AuthenticatedLayout />}>

            {/* Legacy redirect */}
            <Route path="/mobile-punch" element={<Navigate to="/attendance-leave" replace />} />

            <Route element={<AppLayout />}>

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/:tab" element={<DashboardPage />} />

              {/* Organization Routes */}
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/organization/:tab" element={<OrganizationPage />} />

              {/* Employees Routes */}
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/:tab" element={<EmployeeListPage />} />
              <Route path="/employees/detail/:id" element={<EmployeeDetailPage />} />
              <Route path="/profile" element={<Navigate to="/employees/detail/me" replace />} />
              <Route path="/my-profile" element={<Navigate to="/employees/detail/me" replace />} />

              {/* Task Management Routes */}
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/:tab" element={<TasksPage />} />

              {/* Recruitment Routes */}
              <Route path="/recruitment" element={<JobOpeningsPage />} />
              <Route path="/recruitment/requisitions/new" element={<CreateJobRequisitionPage />} />
              <Route path="/recruitment/requisitions/create-from-mr/:mrId" element={<CreateJobRequisitionPage />} />
              <Route path="/recruitment/requisitions/edit/:id" element={<CreateJobRequisitionPage />} />
              <Route path="/recruitment/:tab" element={<JobOpeningsPage />} />
              <Route path="/recruitment/detail/:id" element={<JobOpeningDetailPage />} />

              {/* Workforce Routes */}
              <Route path="/workforce" element={<Navigate to="/workforce/shift-planning" replace />} />
              <Route path="/workforce/planning" element={<WorkforcePlanningPage />} />
              <Route path="/workforce/shift-planning" element={<ShiftPlanningPage />} />
              <Route path="/workforce/my-shift-roster" element={<Navigate to="/workforce/shift-planning" replace />} />
              <Route path="/workforce/shift-types" element={<Navigate to="/workforce/shift-planning?subtab=master" replace />} />
              <Route path="/workforce/shift-roster" element={<Navigate to="/workforce/shift-planning?subtab=roster" replace />} />
              <Route path="/workforce/machine-management" element={<MachineManagementPage />} />
              <Route path="/workforce/machine-allocation" element={<MachineManagementPage />} />
              <Route path="/workforce/contractors" element={<ContractorManagementPage />} />
              <Route path="/workforce/labour" element={<Navigate to="/workforce/contractors" replace />} />
              <Route path="/workforce/reports" element={<WorkforceReportsPage />} />
              <Route path="/workforce/:tab" element={<WorkforcePage />} />

              {/* Attendance & Leave Routes */}
              <Route path="/attendance-leave/roster" element={<Navigate to="/workforce/shift-planning" replace />} />
              <Route path="/attendance-leave" element={<AttendanceLeavePage />} />
              <Route path="/attendance-leave/:tab" element={<AttendanceLeavePage />} />
              <Route path="/attendance_leave" element={<Navigate to="/attendance-leave" replace />} />
              <Route path="/attendance_leave/:tab" element={<AttendanceLeavePage />} />

              {/* Payroll Routes */}
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/payroll/:tab" element={<PayrollPage />} />

              {/* Compliance Routes */}
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/compliance/:tab" element={<CompliancePage />} />

              {/* Performance Routes */}
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/performance/:tab" element={<PerformancePage />} />

              {/* Learning LMS Routes */}
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/learning/:tab" element={<LearningPage />} />

              {/* Compensation & Benefits Routes */}
              <Route path="/compensation-benefits" element={<CompensationBenefitsPage />} />
              <Route path="/compensation-benefits/:tab" element={<CompensationBenefitsPage />} />

              {/* Employee Experience Routes */}
              <Route path="/employee-experience" element={<EmployeeExperiencePage />} />
              <Route path="/employee-experience/:tab" element={<EmployeeExperiencePage />} />

              {/* Assets Routes */}
              <Route path="/asset-management" element={<Navigate to="/asset-management/master" replace />} />
              <Route path="/asset-management/master" element={<AssetMasterPage />} />
              <Route path="/asset-management/requests" element={<AssetRequestPage />} />
              <Route path="/asset-management/allocation" element={<AssetAllocationPage />} />
              <Route path="/asset-management/return" element={<AssetReturnPage />} />
              <Route path="/asset-management/maintenance" element={<AssetMaintenancePage />} />
              <Route path="/asset-management/reports" element={<AssetReportsPage />} />

              {/* Travel & Expense Routes */}
              <Route path="/travel-expense" element={<TravelExpensePage />} />
              <Route path="/travel-expense/:tab" element={<TravelExpensePage />} />

              {/* EHS Safety Routes */}
              <Route path="/ehs" element={<SafetyEhsPage />} />
              <Route path="/ehs/:tab" element={<SafetyEhsPage />} />

              {/* AI Intelligence Routes */}
              <Route path="/ai-intelligence" element={<AiIntelligencePage />} />
              <Route path="/ai-intelligence/:tab" element={<AiIntelligencePage />} />

              {/* IoT Devices Routes */}
              <Route path="/iot-devices" element={<IotDevicesPage />} />
              <Route path="/iot-devices/:tab" element={<IotDevicesPage />} />

              {/* Reports & Analytics Routes */}
              <Route path="/reports-analytics" element={<ReportsAnalyticsPage />} />
              <Route path="/reports-analytics/:tab" element={<ReportsAnalyticsPage />} />

              {/* Workflow Automation Routes */}
              <Route path="/workflow-automation" element={<WorkflowAutomationPage />} />
              <Route path="/workflow-automation/:tab" element={<WorkflowAutomationPage />} />

              {/* Integrations Routes */}
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/integrations/:tab" element={<IntegrationsPage />} />

              {/* Administration Settings Routes */}
              <Route path="/administration" element={<AdministrationPage />} />
              <Route path="/administration/:tab" element={<AdministrationPage />} />

            </Route>
          </Route>

          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
