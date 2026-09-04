import { useParams, useSearchParams } from 'react-router-dom';
import { TrainingProgramsTab } from './TrainingProgramsTab';
import { CourseCatalogTab } from './CourseCatalogTab';
import { EmployeeLearningHubTab } from './EmployeeLearningHubTab';
import { EmployeeCourseRequestsTab } from './EmployeeCourseRequestsTab';
import { CertificationsTab } from './CertificationsTab';
import { SkillMatrixTab } from './SkillMatrixTab';
import { LmsReportsTab } from './LmsReportsTab';
import { LearningReimbursementsTab } from './LearningReimbursementsTab';

export default function LearningPage() {
  const { tab: pathTab } = useParams<{ tab?: string }>();
  const [searchParams] = useSearchParams();
  
  const currentTab = pathTab || searchParams.get('tab') || 'employee-learning';

  if (currentTab === 'employee-learning' || currentTab === 'my-learning') {
    return <EmployeeLearningHubTab />;
  }

  if (currentTab === 'course-catalog' || currentTab === 'courses') {
    return <CourseCatalogTab />;
  }

  if (currentTab === 'course-requests') {
    return <EmployeeCourseRequestsTab />;
  }

  if (currentTab === 'reimbursements') {
    return <LearningReimbursementsTab />;
  }

  if (currentTab === 'training-programs') {
    return <TrainingProgramsTab />;
  }

  if (currentTab === 'certifications') {
    return <CertificationsTab />;
  }

  if (currentTab === 'skill-matrix') {
    return <SkillMatrixTab />;
  }

  if (currentTab === 'reports') {
    return <LmsReportsTab />;
  }

  // Default page: Employee Learning Hub
  return <EmployeeLearningHubTab />;
}
