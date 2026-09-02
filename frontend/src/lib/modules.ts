import {
  LayoutDashboard,
  Building2,
  UserSearch,
  Users,
  CalendarClock,
  Clock,
  Wallet,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  Smile,
  Boxes,
  Plane,
  HeartPulse,
  Sparkles,
  Radio,
  BarChart3,
  Workflow,
  Settings,
  Network,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react';

export interface SubModuleItem {
  key: string;
  label: string;
  path: string;
  badge?: string;
}

export interface HcmModule {
  key: string;
  label: string;
  path: string;
  phase: number;
  status: 'active' | 'stub';
  icon: LucideIcon;
  subItems?: SubModuleItem[];
}

export const HCM_MODULES: HcmModule[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    phase: 1,
    status: 'active',
    icon: LayoutDashboard,
    subItems: [
      { key: 'overview', label: 'Executive Overview', path: '/dashboard' },
      { key: 'analytics', label: 'Real-time Metrics', path: '/dashboard/metrics' },
    ],
  },
  {
    key: 'organization',
    label: 'Organization',
    path: '/organization',
    phase: 1,
    status: 'active',
    icon: Building2,
    subItems: [
      { key: 'structure', label: 'Organization Structure', path: '/organization/structure' },
      { key: 'departments', label: 'Departments & Designations', path: '/organization/departments' },
      { key: 'branches', label: 'Branches & Locations', path: '/organization/branches' },
      { key: 'cost-centers', label: 'Cost Centers & Grades', path: '/organization/cost-centers' },
      { key: 'holidays', label: 'Work Calendar & Holidays', path: '/organization/holidays' },
      { key: 'policies', label: 'HR Policies', path: '/organization/policies' },
      { key: 'reports', label: 'Organization Reports', path: '/organization/reports' },
    ],
  },
  {
    key: 'recruitment',
    label: 'Recruitment',
    path: '/recruitment',
    phase: 2,
    status: 'active',
    icon: UserSearch,
    subItems: [
      { key: 'planning', label: 'Manpower Planning', path: '/recruitment/planning' },
      { key: 'requisitions', label: 'Job Requisitions', path: '/recruitment/requisitions' },
      { key: 'portal', label: 'Job Portal', path: '/recruitment/portal' },
      { key: 'candidates', label: 'Candidate ATS & Resume Screening', path: '/recruitment/candidates' },
      { key: 'communication', label: 'Teams Video Interview Sync', path: '/recruitment/communication' },
      { key: 'interviews', label: 'Interview Schedules & Feedback', path: '/recruitment/interviews' },
      { key: 'assessments', label: 'Assessments & Question Bank', path: '/recruitment/assessments' },
      { key: 'offers', label: 'Offers & Digital Onboarding', path: '/recruitment/offers' },
      { key: 'reports', label: 'Recruitment Analytics Reports', path: '/recruitment/reports' },
    ],
  },
  {
    key: 'employees',
    label: 'Employees',
    path: '/employees',
    phase: 2,
    status: 'active',
    icon: Users,
    subItems: [
      { key: 'directory', label: 'Employee Directory', path: '/employees/directory' },
      { key: 'master', label: 'Employee Master', path: '/employees/master' },
      { key: 'documents', label: 'Documents', path: '/employees/documents' },
      { key: 'skills', label: 'Skills & Certifications', path: '/employees/skills' },
      { key: 'transfers', label: 'Transfers & Promotions', path: '/employees/transfers' },
      { key: 'exit', label: 'Exit Management', path: '/employees/exit' },
      { key: 'reports', label: 'Employee Reports', path: '/employees/reports' },
    ],
  },
  {
    key: 'tasks',
    label: 'Task Management',
    path: '/tasks',
    phase: 2,
    status: 'active',
    icon: CheckSquare,
    subItems: [
      { key: 'dashboard', label: 'Task Dashboard', path: '/tasks/dashboard' },
      { key: 'my-tasks', label: 'My Tasks', path: '/tasks/my-tasks' },
      { key: 'all-tasks', label: 'All Tasks & Allocation', path: '/tasks/all-tasks' },
      { key: 'requests', label: 'Task Requests', path: '/tasks/requests' },
      { key: 'reports', label: 'Task Reports', path: '/tasks/reports' },
    ],
  },
  {
    key: 'attendance-leave',
    label: 'Attendance & Leave',
    path: '/attendance-leave',
    phase: 3,
    status: 'active',
    icon: Clock,
    subItems: [
      { key: 'live', label: 'Live Attendance', path: '/attendance-leave/live' },
      { key: 'register', label: 'Attendance Register', path: '/attendance-leave/register' },
      { key: 'leave', label: 'Leave Management', path: '/attendance-leave/leave' },
      { key: 'roster', label: 'Shift & Roster', path: '/attendance-leave/roster' },
      { key: 'overtime', label: 'Overtime', path: '/attendance-leave/overtime' },
      { key: 'policies', label: 'Attendance Policies', path: '/attendance-leave/policies' },
      { key: 'reports', label: 'Reports', path: '/attendance-leave/reports' },
    ],
  },
  {
    key: 'payroll',
    label: 'Payroll',
    path: '/payroll',
    phase: 4,
    status: 'active',
    icon: Wallet,
    subItems: [
      { key: 'structure', label: 'Salary Structure', path: '/payroll/structure' },
      { key: 'processing', label: 'Payroll Processing', path: '/payroll/processing' },
      { key: 'revision', label: 'Salary Revision', path: '/payroll/revision' },
      { key: 'loans', label: 'Loans & Advances', path: '/payroll/loans' },
      { key: 'reimbursements', label: 'Reimbursements', path: '/payroll/reimbursements' },
      { key: 'payslips', label: 'Payslips', path: '/payroll/payslips' },
      { key: 'bank-transfer', label: 'Bank Transfer', path: '/payroll/bank-transfer' },
      { key: 'reports', label: 'Payroll Reports', path: '/payroll/reports' },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    path: '/compliance',
    phase: 4,
    status: 'active',
    icon: ShieldCheck,
    subItems: [
      { key: 'setup', label: 'Compliance Setup', path: '/compliance/setup' },
      { key: 'pf', label: 'PF (Provident Fund)', path: '/compliance/pf' },
      { key: 'esic', label: 'ESIC', path: '/compliance/esic' },
      { key: 'ptax', label: 'Professional Tax', path: '/compliance/ptax' },
      { key: 'itax', label: 'Income Tax (TDS)', path: '/compliance/itax' },
      { key: 'labour', label: 'Labour Compliance', path: '/compliance/labour' },
      { key: 'returns', label: 'Government Returns', path: '/compliance/returns' },
      { key: 'reports', label: 'Compliance Reports', path: '/compliance/reports' },
    ],
  },
  {
    key: 'performance',
    label: 'Performance',
    path: '/performance',
    phase: 5,
    status: 'active',
    icon: TrendingUp,
    subItems: [
      { key: 'goals', label: 'Goals (KPI / KRA / OKR)', path: '/performance/goals' },
      { key: 'appraisals', label: 'Appraisals & Reviews', path: '/performance/appraisals' },
      { key: 'competencies', label: 'Competencies', path: '/performance/competencies' },
      { key: 'succession', label: 'Succession Planning', path: '/performance/succession' },
      { key: 'reports', label: 'Performance Reports', path: '/performance/reports' },
    ],
  },
  {
    key: 'learning',
    label: 'Learning (LMS)',
    path: '/learning',
    phase: 5,
    status: 'active',
    icon: GraduationCap,
    subItems: [
      { key: 'training', label: 'Training Programs', path: '/learning/training' },
      { key: 'courses', label: 'Course Catalog', path: '/learning/courses' },
      { key: 'assessments', label: 'Assessments & Quizzes', path: '/learning/assessments' },
      { key: 'certifications', label: 'Certifications', path: '/learning/certifications' },
      { key: 'skill-matrix', label: 'Skill Matrix', path: '/learning/skill-matrix' },
      { key: 'reports', label: 'LMS Reports', path: '/learning/reports' },
    ],
  },
  {
    key: 'workforce',
    label: 'Workforce',
    path: '/workforce',
    phase: 3,
    status: 'active',
    icon: CalendarClock,
    subItems: [
      { key: 'planning', label: 'Workforce Planning', path: '/workforce/planning' },
      { key: 'shift-planning', label: 'Shift Planning', path: '/workforce/shift-planning' },
      { key: 'machine-allocation', label: 'Machine Allocation', path: '/workforce/machine-allocation' },
      { key: 'contractors', label: 'Contractor Management', path: '/workforce/contractors' },
      { key: 'labour', label: 'Labour Management', path: '/workforce/labour' },
      { key: 'reports', label: 'Workforce Reports', path: '/workforce/reports' },
    ],
  },
  {
    key: 'asset-management',
    label: 'Assets',
    path: '/asset-management',
    phase: 3,
    status: 'active',
    icon: Boxes,
    subItems: [
      { key: 'master', label: 'Asset Master', path: '/asset-management/master' },
      { key: 'allocation', label: 'Asset Allocation', path: '/asset-management/allocation' },
      { key: 'return', label: 'Asset Return', path: '/asset-management/return' },
      { key: 'maintenance', label: 'Maintenance & Repairs', path: '/asset-management/maintenance' },
      { key: 'reports', label: 'Asset Reports', path: '/asset-management/reports' },
    ],
  },
  {
    key: 'travel-expense',
    label: 'Travel & Expense',
    path: '/travel-expense',
    phase: 5,
    status: 'active',
    icon: Plane,
    subItems: [
      { key: 'travel', label: 'Travel Bookings', path: '/travel-expense/travel' },
      { key: 'pending', label: 'Pending Approvals', path: '/travel-expense/pending' },
      { key: 'claims', label: 'Expense Claims', path: '/travel-expense/claims' },
      { key: 'reimbursements', label: 'Reimbursements', path: '/travel-expense/reimbursements' },
      { key: 'reports', label: 'Travel Reports', path: '/travel-expense/reports' },
    ],
  },
  {
    key: 'ehs',
    label: 'Safety (EHS)',
    path: '/ehs',
    phase: 3,
    status: 'active',
    icon: HeartPulse,
    subItems: [
      { key: 'ppe', label: 'PPE Management', path: '/ehs/ppe' },
      { key: 'incidents', label: 'Incident Reporting', path: '/ehs/incidents' },
      { key: 'safety-training', label: 'Safety Training', path: '/ehs/safety-training' },
      { key: 'audits', label: 'Safety Audits', path: '/ehs/audits' },
      { key: 'reports', label: 'EHS Reports', path: '/ehs/reports' },
    ],
  },
  {
    key: 'employee-experience',
    label: 'Employee Experience',
    path: '/employee-experience',
    phase: 5,
    status: 'active',
    icon: Smile,
    subItems: [
      { key: 'ess', label: 'Employee Self Service (ESS)', path: '/employee-experience/ess' },
      { key: 'mss', label: 'Manager Self Service (MSS)', path: '/employee-experience/mss' },
      { key: 'surveys', label: 'Pulse Surveys', path: '/employee-experience/surveys' },
      { key: 'rewards', label: 'Rewards & Recognition', path: '/employee-experience/rewards' },
      { key: 'announcements', label: 'Company Announcements', path: '/employee-experience/announcements' },
      { key: 'helpdesk', label: 'HR Help Desk', path: '/employee-experience/helpdesk' },
    ],
  },
  {
    key: 'ai-intelligence',
    label: 'AI Center',
    path: '/ai-intelligence',
    phase: 6,
    status: 'active',
    icon: Sparkles,
    subItems: [
      { key: 'recruitment-ai', label: 'Recruitment AI (Resume Parser)', path: '/ai-intelligence/recruitment-ai' },
      { key: 'attendance-ai', label: 'Attendance AI (Anomaly Detection)', path: '/ai-intelligence/attendance-ai' },
      { key: 'payroll-ai', label: 'Payroll AI (Audit & Forecasting)', path: '/ai-intelligence/payroll-ai' },
      { key: 'hr-assistant', label: 'HR Conversational Assistant', path: '/ai-intelligence/hr-assistant' },
      { key: 'predictive', label: 'Predictive Churn Analytics', path: '/ai-intelligence/predictive' },
      { key: 'automation', label: 'AI Process Automation', path: '/ai-intelligence/automation' },
    ],
  },
  {
    key: 'iot-devices',
    label: 'IoT Center',
    path: '/iot-devices',
    phase: 6,
    status: 'active',
    icon: Radio,
    subItems: [
      { key: 'devices', label: 'Device Inventory', path: '/iot-devices/devices' },
      { key: 'biometric', label: 'Biometric Machines', path: '/iot-devices/biometric' },
      { key: 'face-recognition', label: 'Face Recognition Terminals', path: '/iot-devices/face-recognition' },
      { key: 'access-control', label: 'Access Control Gates', path: '/iot-devices/access-control' },
      { key: 'logs', label: 'Real-time Telemetry Logs', path: '/iot-devices/logs' },
      { key: 'analytics', label: 'Device Analytics', path: '/iot-devices/analytics' },
    ],
  },
  {
    key: 'reports-analytics',
    label: 'Reports & Analytics',
    path: '/reports-analytics',
    phase: 7,
    status: 'active',
    icon: BarChart3,
    subItems: [
      { key: 'executive', label: 'Executive Reports', path: '/reports-analytics/executive' },
      { key: 'hr-reports', label: 'HR Reports', path: '/reports-analytics/hr-reports' },
      { key: 'payroll-reports', label: 'Payroll Reports', path: '/reports-analytics/payroll-reports' },
      { key: 'compliance-reports', label: 'Compliance Reports', path: '/reports-analytics/compliance-reports' },
      { key: 'workforce-analytics', label: 'Workforce Analytics', path: '/reports-analytics/workforce-analytics' },
      { key: 'ai-insights', label: 'AI Strategic Insights', path: '/reports-analytics/ai-insights' },
      { key: 'custom-reports', label: 'Custom Report Builder', path: '/reports-analytics/custom-reports' },
    ],
  },
  {
    key: 'workflow-automation',
    label: 'Workflow',
    path: '/workflow-automation',
    phase: 1,
    status: 'active',
    icon: Workflow,
    subItems: [
      { key: 'designer', label: 'Workflow Designer', path: '/workflow-automation/designer' },
      { key: 'approval-matrix', label: 'Approval Matrix', path: '/workflow-automation/approval-matrix' },
      { key: 'notifications', label: 'Trigger Notifications', path: '/workflow-automation/notifications' },
      { key: 'templates', label: 'Email / SMS Templates', path: '/workflow-automation/templates' },
      { key: 'audit-logs', label: 'Audit Trail Logs', path: '/workflow-automation/audit-logs' },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    path: '/integrations',
    phase: 1,
    status: 'active',
    icon: Network,
    subItems: [
      { key: 'erp', label: 'ERP Connectors (SAP/Oracle)', path: '/integrations/erp' },
      { key: 'finance', label: 'Finance & Accounting (Tally/Zoho)', path: '/integrations/finance' },
      { key: 'production', label: 'Production / MES Sync', path: '/integrations/production' },
      { key: 'crm', label: 'CRM Systems', path: '/integrations/crm' },
      { key: 'email-sms', label: 'Email & SMS Gateways', path: '/integrations/email-sms' },
      { key: 'whatsapp', label: 'WhatsApp Business API', path: '/integrations/whatsapp' },
      { key: 'api', label: 'REST API & Tokens', path: '/integrations/api' },
      { key: 'webhooks', label: 'Webhooks Config', path: '/integrations/webhooks' },
    ],
  },
  {
    key: 'administration',
    label: 'Settings',
    path: '/administration',
    phase: 1,
    status: 'active',
    icon: Settings,
    subItems: [
      { key: 'users', label: 'Users', path: '/administration/users' },
      { key: 'roles', label: 'Roles & Permissions', path: '/administration/roles' },
      { key: 'masters', label: 'System Masters', path: '/administration/masters' },
      { key: 'number-series', label: 'Number Series Config', path: '/administration/number-series' },
      { key: 'company-settings', label: 'Company Settings', path: '/administration/company-settings' },
      { key: 'localization', label: 'Localization & Currency', path: '/administration/localization' },
      {key: 'templates', label: 'Document Templates', path: '/administration/templates' },
      { key: 'config', label: 'System Configuration', path: '/administration/config' },
      { key: 'landing', label: 'Landing Page & Demo', path: '/landing', badge: 'Demo' },
    ],
  },
  {
    key: 'landing-page',
    label: 'Landing Page & Demo',
    path: '/landing',
    phase: 1,
    status: 'active',
    icon: Sparkles,
    badge: 'Demo',
    subItems: [
      { key: 'overview', label: 'Product Landing Page', path: '/landing' },
      { key: 'workflow', label: 'System Workflow Analysis', path: '/landing?tab=workflow' },
      { key: 'demo-simulators', label: 'Interactive Demo Suite', path: '/landing?tab=demo' },
      { key: 'pricing-plans', label: 'Plans & Pricing', path: '/landing?tab=pricing' },
    ],
  },
];

export const EMPLOYEE_MODULES: HcmModule[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    phase: 1,
    status: 'active',
    icon: LayoutDashboard,
    subItems: [
      { key: 'my-dashboard', label: 'My Dashboard', path: '/dashboard' },
    ],
  },
  {
    key: 'my-attendance',
    label: 'My Attendance',
    path: '/attendance-leave/live',
    phase: 1,
    status: 'active',
    icon: Clock,
    subItems: [
      { key: 'attendance', label: 'Attendance', path: '/attendance-leave/live' },
      { key: 'attendance-history', label: 'Attendance History', path: '/attendance-leave/register' },
      { key: 'my-attendance-details', label: 'My Attendance Details', path: '/attendance-leave/live?details=me' },
    ],
  },
  {
    key: 'my-leave',
    label: 'My Leave',
    path: '/attendance-leave/leave',
    phase: 1,
    status: 'active',
    icon: CalendarClock,
    subItems: [
      { key: 'apply-leave', label: 'Apply Leave', path: '/attendance-leave/leave?tab=apply' },
      { key: 'my-leave-requests', label: 'My Leave Requests', path: '/attendance-leave/leave?tab=requests' },
      { key: 'leave-balance', label: 'Leave Balance', path: '/attendance-leave/leave?tab=balance' },
    ],
  },
  {
    key: 'my-tasks',
    label: 'My Tasks',
    path: '/tasks/my-tasks',
    phase: 1,
    status: 'active',
    icon: CheckSquare,
    subItems: [
      { key: 'my-tasks-list', label: 'My Tasks', path: '/tasks/my-tasks' },
      { key: 'task-requests', label: 'Task Requests', path: '/tasks/requests' },
      { key: 'task-history', label: 'Task History', path: '/tasks/my-tasks?tab=history' },
    ],
  },
  {
    key: 'my-profile',
    label: 'My Profile',
    path: '/employees/detail/me',
    phase: 1,
    status: 'active',
    icon: Users,
    subItems: [
      { key: 'personal-info', label: 'Personal Information', path: '/employees/detail/me' },
      { key: 'documents', label: 'Documents', path: '/employees/detail/me?tab=documents' },
      { key: 'biometric', label: 'Attendance & Biometric', path: '/employees/detail/me?tab=biometric' },
    ],
  },
  {
    key: 'my-travel-expense',
    label: 'My Travel & Expense',
    path: '/travel-expense/travel',
    phase: 1,
    status: 'active',
    icon: Plane,
    subItems: [
      { key: 'my-travel-bookings', label: 'My Travel Bookings', path: '/travel-expense/travel' },
      { key: 'my-expense-claims', label: 'My Expense Claims', path: '/travel-expense/claims' },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    path: '/workflow-automation/notifications',
    phase: 1,
    status: 'active',
    icon: Workflow,
  },
];

export function isHrOrAdminUser(user?: any): boolean {
  if (!user) return true;
  if (user.permissions?.includes('*')) return true;
  const isRoleAdmin = user.roles?.some((r: string) => {
    const u = r.toUpperCase();
    return u.includes('ADMIN') || u.includes('HR');
  });
  const isPrimaryAdmin =
    user.primaryRole?.toUpperCase().includes('ADMIN') ||
    user.primaryRole?.toUpperCase().includes('HR');
  return Boolean(isRoleAdmin || isPrimaryAdmin);
}

export function getModulesForRole(user?: any): HcmModule[] {
  if (isHrOrAdminUser(user)) {
    return HCM_MODULES;
  }
  return EMPLOYEE_MODULES;
}
