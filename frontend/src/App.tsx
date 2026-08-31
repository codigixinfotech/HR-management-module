import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
import AttendanceLeavePage from '@/pages/attendance-leave/AttendanceLeavePage';
import PayrollPage from '@/pages/payroll/PayrollPage';
import CompliancePage from '@/pages/compliance/CompliancePage';
import PerformancePage from '@/pages/performance/PerformancePage';
import LearningPage from '@/pages/learning/LearningPage';
import CompensationBenefitsPage from '@/pages/compensation-benefits/CompensationBenefitsPage';
import EmployeeExperiencePage from '@/pages/employee-experience/EmployeeExperiencePage';
import AssetManagementPage from '@/pages/asset-management/AssetManagementPage';
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

import { CompanyProvider } from '@/context/CompanyContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/careers/*" element={<CareersPage />} />
          <Route path="/careers/job/:id" element={<CareersJobDetailPage />} />
          <Route path="/candidate-assessment/:token" element={<CandidateAssessmentPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
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
              <Route path="/workforce" element={<WorkforcePage />} />
              <Route path="/workforce/:tab" element={<WorkforcePage />} />

              {/* Attendance & Leave Routes */}
              <Route path="/attendance-leave" element={<AttendanceLeavePage />} />
              <Route path="/attendance-leave/:tab" element={<AttendanceLeavePage />} />

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
              <Route path="/asset-management" element={<AssetManagementPage />} />
              <Route path="/asset-management/:tab" element={<AssetManagementPage />} />

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

              {/* Landing Page & Product Showcase Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/landing/:tab" element={<LandingPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </CompanyProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
