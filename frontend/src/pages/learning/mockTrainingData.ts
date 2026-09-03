export interface CourseModule {
  id: string;
  title: string;
  type: 'Video' | 'PDF' | 'Document' | 'Interactive';
  url: string;
  durationMinutes: number;
}

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  category: string;
  type: 'Mandatory' | 'Elective' | 'Executive' | 'Technical' | 'Compliance';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  hours: number;
  language: string;
  trainer: string;
  provider: string;
  deliveryMode: 'Online' | 'Classroom' | 'Hybrid';
  modules: CourseModule[];
  requiredCompletion: number;
  assessmentRequired: boolean;
  certificateRequired: boolean;
  passingScore: number;
  mappedSkill: string;
  level: string;
  status: 'Published' | 'Draft' | 'Archived';
  enrolledCount: number;
  rating: number;
}

export interface QuestionItem {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

export interface AssessmentItem {
  id: string;
  code: string;
  name: string;
  courseId: string;
  courseTitle: string;
  type: 'Quiz' | 'Final Exam' | 'Practical' | 'Evaluation';
  durationMinutes: number;
  attemptsAllowed: number;
  passingScore: number;
  randomizeQuestions: boolean;
  showResultImmediately: boolean;
  allowRetake: boolean;
  questions: QuestionItem[];
  status: 'Published' | 'Draft' | 'Completed';
}

export interface CertificateTemplate {
  id: string;
  code: string;
  name: string;
  relatedCourse: string;
  relatedProgram: string;
  issuingAuthority: string;
  validityYears: number;
  expiryPeriodMonths: number;
  reqCourseCompleted: boolean;
  reqAssessmentPassed: boolean;
  reqAttendance: boolean;
  signatureName: string;
  status: 'Active' | 'Draft';
}

export interface IssuedCertificate {
  id: string;
  employeeId: string;
  employeeName: string;
  credentialTitle: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  verificationCode: string;
  status: 'VERIFIED' | 'ELIGIBLE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface SkillItem {
  id: string;
  code: string;
  name: string;
  category: 'Technical' | 'Soft Skill' | 'Leadership' | 'Compliance' | 'Safety';
  description: string;
  levels: {
    level: number;
    title: string;
    description: string;
  }[];
  mappedCourses: string[];
  thresholds: {
    beginner: string;
    intermediate: string;
    advanced: string;
    expert: string;
  };
}

export interface EmployeeSkillScore {
  employeeId: string;
  employeeName: string;
  skills: { [skillName: string]: number };
}

export interface EmployeeItem {
  id: string;
  name: string;
  department: string;
  designation: string;
  grade: string;
  location: string;
  selected?: boolean;
}

export interface TrainingBatch {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  trainer: string;
  capacity: number;
  assignedCount: number;
}

export interface EmployeeProgramStatus {
  employeeId: string;
  employeeName: string;
  department: string;
  grade: string;
  status: 'Assigned' | 'Enrolled' | 'Started' | 'In Progress' | 'Assessment' | 'Passed' | 'Failed' | 'Completed' | 'Certified';
  attendancePercent: number;
  assessmentScore?: number;
  passed?: boolean;
  certificateIssued?: boolean;
}

// Fully Independent HR Activity Training Program Model (Zero Course Catalog Dependency)
export interface TrainingProgram {
  id: string;
  code: string;
  name: string;
  category: string;
  type: 'Mandatory' | 'Optional' | 'Recommended' | 'Remedial' | 'Development' | 'Technical' | 'Compliance';
  description: string;
  objective: string;
  
  // Trainer / Provider
  trainerType: 'Internal' | 'External';
  trainer: string;
  provider: string;
  contactEmail?: string;
  contactNumber?: string;
  
  // Schedule & Venue
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  deliveryMode: 'Classroom' | 'Online' | 'Hybrid';
  location: string;
  capacity: number;
  batches: TrainingBatch[];
  
  // Target Workforce
  assignBy: string;
  targetDepartment: string;
  targetDesignation: string;
  targetGrade: string;
  targetLocation: string;
  employeeCount: number;
  
  // Attendance & Completion Rules
  attendanceRequired: boolean;
  minAttendance: number;
  attendanceMethod: 'Manual' | 'QR Check-in' | 'Employee Check-in';
  completionBasis: 'Attendance' | 'Trainer Confirmation' | 'Attendance + Trainer Confirmation';
  trainerConfirmationReq: boolean;

  // Assessment (Optional)
  assessmentRequired: boolean;
  assessmentType?: 'Quiz' | 'Written Test' | 'Practical Evaluation';
  assessmentName?: string;
  passingScore?: number;
  attemptsAllowed?: number;

  // Certification (Optional)
  certificateRequired: boolean;
  certificateType?: string;

  // Skill Matrix Update (Optional)
  updateSkillMatrix: boolean;
  skillName?: string;
  skillLevel?: string;
  skillImprovement?: string;

  // Notifications
  notifyAssigned: boolean;
  notifyReminder: boolean;
  notifyTrainer: boolean;
  notifyManager: boolean;
  reminderTiming: string;

  // Attachments / Documents
  documents: { name: string; size: string; type: string; url?: string }[];

  // Progress & Status
  progress: number;
  status: 'Draft' | 'Upcoming' | 'Active' | 'Complete' | 'Cancelled';
  employeeStatuses: EmployeeProgramStatus[];
}

export const CATALOG_COURSES: CourseItem[] = [
  {
    id: 'CRS-101',
    code: 'CRS-101',
    title: 'Workplace Safety Fundamentals',
    category: 'Safety',
    type: 'Mandatory',
    difficulty: 'Beginner',
    description: 'Core OSHA compliance course covering fire hazards, personal protective equipment (PPE), hazard reporting, and emergency evacuation protocols.',
    hours: 2,
    language: 'English',
    trainer: 'SafetyFirst Corp',
    provider: 'Global Safety Institute',
    deliveryMode: 'Hybrid',
    modules: [
      { id: 'M-1', title: 'Module 1: Introduction to Workplace Hazards', type: 'Video', url: 'https://lms.corp/m1.mp4', durationMinutes: 30 },
      { id: 'M-2', title: 'Module 2: PPE Protocols & Standards', type: 'PDF', url: 'https://lms.corp/m2.pdf', durationMinutes: 45 },
    ],
    requiredCompletion: 100,
    assessmentRequired: true,
    certificateRequired: true,
    passingScore: 60,
    mappedSkill: 'Workplace Safety & EHS',
    level: 'Mandatory',
    status: 'Published',
    enrolledCount: 68,
    rating: 4.8,
  },
];

export const INITIAL_ASSESSMENTS: AssessmentItem[] = [
  {
    id: 'ASM-01',
    code: 'ASM-2026-001',
    name: 'Workplace Safety & Fire Hazards Assessment',
    courseId: 'CRS-101',
    courseTitle: 'Workplace Safety Fundamentals',
    type: 'Quiz',
    durationMinutes: 30,
    attemptsAllowed: 2,
    passingScore: 60,
    randomizeQuestions: true,
    showResultImmediately: true,
    allowRetake: true,
    status: 'Published',
    questions: [
      {
        id: 'Q1',
        question: 'What is the primary action during a Type-A electrical fire outbreak?',
        optionA: 'Pour water over electrical panels',
        optionB: 'Disconnect power source & use CO2 fire extinguisher',
        optionC: 'Open all windows immediately',
        optionD: 'Ignore alarm and call maintenance',
        correctAnswer: 'B',
        marks: 5,
      },
    ],
  },
];

export const INITIAL_CERTIFICATES: IssuedCertificate[] = [
  { id: 'CERT-001', employeeId: 'EMP-001', employeeName: 'Priya Verma', credentialTitle: 'Workplace Safety & Emergency Specialist', courseName: 'Annual Workplace Safety Training 2026', issueDate: '2026-01-10', expiryDate: '2028-01-10', verificationCode: 'CRT-2026-9011', status: 'VERIFIED' },
  { id: 'CERT-002', employeeId: 'EMP-002', employeeName: 'Rajesh Sharma', credentialTitle: 'Industrial Safety & EHS Protocol', courseName: 'Annual Workplace Safety Training 2026', issueDate: '2026-02-02', expiryDate: '2027-02-02', verificationCode: 'CRT-2026-9012', status: 'VERIFIED' },
];

export const INITIAL_CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'TPL-01',
    code: 'TPL-OSHA-2026',
    name: 'Workplace Safety Certified Specialist',
    relatedCourse: 'Workplace Safety Fundamentals',
    relatedProgram: 'Annual Workplace Safety Training 2026',
    issuingAuthority: 'Codigix HR & Global Safety Council',
    validityYears: 2,
    expiryPeriodMonths: 24,
    reqCourseCompleted: true,
    reqAssessmentPassed: true,
    reqAttendance: true,
    signatureName: 'Dr. Vikram Malhotra (VP EHS)',
    status: 'Active',
  },
];

export const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'SKL-01',
    code: 'SKL-SAFETY',
    name: 'Workplace Safety',
    category: 'Safety',
    description: 'Deep knowledge of plant safety protocols, OSHA compliance, fire prevention, and emergency response.',
    levels: [
      { level: 1, title: 'Beginner', description: 'Basic hazard recognition.' },
      { level: 2, title: 'Basic', description: 'PPE compliance and extinguisher operation.' },
      { level: 3, title: 'Intermediate', description: 'Incident investigation and audit preparation.' },
      { level: 4, title: 'Advanced', description: 'EHS policy design and plant hazard mitigation.' },
      { level: 5, title: 'Expert', description: 'Certified Chief Safety Auditor.' },
    ],
    mappedCourses: ['Annual Workplace Safety Training 2026'],
    thresholds: {
      beginner: '0–59%',
      intermediate: '60–74%',
      advanced: '75–89%',
      expert: '90–100%',
    },
  },
];

export const MOCK_EMPLOYEE_SKILLS: EmployeeSkillScore[] = [
  { employeeId: 'EMP-001', employeeName: 'Priya Verma', skills: { 'Advanced Excel & Data Analytics': 4, 'Strategic Leadership': 3, 'Workplace Safety': 5 } },
  { employeeId: 'EMP-002', employeeName: 'Rajesh Sharma', skills: { 'Advanced Excel & Data Analytics': 3, 'Strategic Leadership': 4, 'Workplace Safety': 5 } },
];

export interface EmployeeItem {
  id: string;
  name: string;
  department: string;
  designation: string;
  grade: string;
  location: string;
  company?: string;
  selected?: boolean;
}

export const MOCK_EMPLOYEES: EmployeeItem[] = [
  { id: 'EMP-1483', name: 'Sanika Shelke', department: 'HR', designation: 'HR Executive', grade: 'G4', location: 'HQ Tech Park', company: 'Codigix Infotech Pvt Ltd' },
  { id: 'EMP0055', name: 'Casey Stone', department: 'IT', designation: 'Senior Software Engineer', grade: 'G5', location: 'HQ Tech Park', company: 'Codigix Infotech Pvt Ltd' },
  { id: 'EMP0025', name: 'Rowan Ortiz', department: 'IT', designation: 'DevOps Architect', grade: 'G6', location: 'HQ Tech Park', company: 'Codigix Infotech Pvt Ltd' },
  { id: 'EMP-016', name: 'Aditya Deshpande', department: 'Manufacturing', designation: 'Safety Engineer', grade: 'G4', location: 'Plant A', company: 'Codigix Manufacturing Ltd' },
  { id: 'EMP-008', name: 'Sneha More', department: 'QA', designation: 'Quality Specialist', grade: 'G3', location: 'Plant A', company: 'Codigix Manufacturing Ltd' },
  { id: 'EMP-007', name: 'Karan Verma', department: 'Production', designation: 'Shift Supervisor', grade: 'G5', location: 'Plant A', company: 'Codigix Manufacturing Ltd' },
  { id: 'EMP-006', name: 'Rahul Deshmukh', department: 'EHS', designation: 'Safety Inspector', grade: 'G4', location: 'Plant B', company: 'Codigix Tech Services' },
  { id: 'EMP-004', name: 'Pooja Shah', department: 'Finance', designation: 'Accounts Manager', grade: 'G5', location: 'HQ Tech Park', company: 'Codigix Tech Services' },
  { id: 'EMP-005', name: 'Arjun Patil', department: 'Manufacturing', designation: 'Plant Technician', grade: 'G3', location: 'Plant A', company: 'Codigix Manufacturing Ltd' },
  { id: 'EMP-003', name: 'Neha Joshi', department: 'HR', designation: 'HR Business Partner', grade: 'G4', location: 'HQ Tech Park', company: 'Codigix Infotech Pvt Ltd' },
  { id: 'EMP-002', name: 'Rohan Mehta', department: 'Manufacturing', designation: 'Operator Lead', grade: 'G3', location: 'Plant A', company: 'Codigix Infotech Pvt Ltd' },
  { id: 'EMP-001', name: 'Amit Kulkarni', department: 'Safety', designation: 'Head of Safety & EHS', grade: 'G6', location: 'Plant A', company: 'Codigix Infotech Pvt Ltd' },
  { id: 'EMP-009', name: 'Priya Verma', department: 'QA', designation: 'Senior QA Analyst', grade: 'G4', location: 'Plant A', company: 'Codigix Manufacturing Ltd' },
  { id: 'EMP-010', name: 'Rajesh Sharma', department: 'Production', designation: 'Production Manager', grade: 'G6', location: 'Plant A', company: 'Codigix Manufacturing Ltd' },
];

export const INITIAL_PROGRAMS: TrainingProgram[] = [
  {
    id: 'PRG-001',
    code: 'TRN-2026-001',
    name: 'Annual Workplace Safety Training 2026',
    category: 'Safety',
    type: 'Mandatory',
    description: 'Annual workplace safety training covering fire safety, hazard prevention and emergency response for factory and plant staff.',
    objective: 'Improve employee awareness of workplace hazards, emergency procedures and safe working practices.',
    trainerType: 'External',
    trainer: 'Rajesh Sharma',
    provider: 'SafetyFirst Corp & Internal EHS',
    contactEmail: 'trainer@safetyfirst.example',
    contactNumber: '+91 98765 43210',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    durationHours: 3,
    deliveryMode: 'Classroom',
    location: 'Training Room 1',
    capacity: 100,
    assignBy: 'Department',
    targetDepartment: 'Manufacturing',
    targetDesignation: 'All',
    targetGrade: 'G3 - G6',
    targetLocation: 'Plant A',
    employeeCount: 85,
    attendanceRequired: true,
    minAttendance: 80,
    attendanceMethod: 'QR Check-in',
    completionBasis: 'Attendance + Trainer Confirmation',
    trainerConfirmationReq: true,
    assessmentRequired: true,
    assessmentType: 'Quiz',
    assessmentName: 'Workplace Safety Final Assessment',
    passingScore: 60,
    attemptsAllowed: 2,
    certificateRequired: true,
    certificateType: 'Training Completion Certificate',
    updateSkillMatrix: true,
    skillName: 'Workplace Safety',
    skillLevel: 'Intermediate',
    skillImprovement: '+1 Level',
    notifyAssigned: true,
    notifyReminder: true,
    notifyTrainer: true,
    notifyManager: true,
    reminderTiming: '1 Day Before',
    documents: [
      { name: 'Safety_Training_Agenda_2026.pdf', size: '1.2 MB', type: 'PDF' },
      { name: 'OSHA_Emergency_Response_SOP.docx', size: '850 KB', type: 'DOC' },
    ],
    progress: 89,
    status: 'Active',
    batches: [
      { id: 'BCH-A', name: 'Safety Batch A', date: '10-Sep-2026', time: '10:00 AM – 01:00 PM', location: 'Training Room 1', trainer: 'Rajesh Sharma', capacity: 30, assignedCount: 30 },
      { id: 'BCH-B', name: 'Safety Batch B', date: '12-Sep-2026', time: '10:00 AM – 01:00 PM', location: 'Training Room 2', trainer: 'Rajesh Sharma', capacity: 30, assignedCount: 30 },
      { id: 'BCH-C', name: 'Safety Batch C', date: '15-Sep-2026', time: '10:00 AM – 01:00 PM', location: 'Training Room 1', trainer: 'EHS Specialist', capacity: 25, assignedCount: 25 },
    ],
    employeeStatuses: [
      { employeeId: 'EMP-001', employeeName: 'Priya Verma', department: 'QA', grade: 'G4', status: 'Completed', attendancePercent: 100, assessmentScore: 92, passed: true, certificateIssued: true },
      { employeeId: 'EMP-002', employeeName: 'Rajesh Sharma', department: 'Production', grade: 'G5', status: 'Certified', attendancePercent: 100, assessmentScore: 88, passed: true, certificateIssued: true },
      { employeeId: 'EMP-003', employeeName: 'Amit Patel', department: 'Production', grade: 'G5', status: 'Completed', attendancePercent: 90, assessmentScore: 85, passed: true, certificateIssued: true },
      { employeeId: 'EMP-005', employeeName: 'Vikas Kumar', department: 'Manufacturing', grade: 'G3', status: 'In Progress', attendancePercent: 85, assessmentScore: undefined, passed: undefined, certificateIssued: false },
    ],
  },
  {
    id: 'PRG-002',
    code: 'TRN-2026-002',
    name: 'Leadership & Strategic Management Workshop',
    category: 'Leadership',
    type: 'Development',
    description: 'Executive upskilling workshop for mid-level managers on team dynamics and strategic communication.',
    objective: 'Develop strategic manager leadership capabilities and conflict resolution skills.',
    trainerType: 'External',
    trainer: 'Dr. Aris Thorne',
    provider: 'L&D Leadership Academy',
    contactEmail: 'thorne@leadership.example',
    contactNumber: '+91 98111 22233',
    startDate: '2026-09-15',
    endDate: '2026-09-25',
    startTime: '09:00 AM',
    endTime: '04:00 PM',
    durationHours: 7,
    deliveryMode: 'Classroom',
    location: 'Executive Boardroom',
    capacity: 40,
    assignBy: 'Grade',
    targetDepartment: 'All',
    targetDesignation: 'Manager / Lead',
    targetGrade: 'G5 - G6',
    targetLocation: 'HQ Tech Park',
    employeeCount: 32,
    attendanceRequired: true,
    minAttendance: 90,
    attendanceMethod: 'Manual',
    completionBasis: 'Attendance + Trainer Confirmation',
    trainerConfirmationReq: true,
    assessmentRequired: true,
    assessmentType: 'Practical Evaluation',
    assessmentName: 'Leadership Case Study Evaluation',
    passingScore: 70,
    attemptsAllowed: 1,
    certificateRequired: true,
    certificateType: 'Leadership Certificate',
    updateSkillMatrix: true,
    skillName: 'Strategic Leadership',
    skillLevel: 'Advanced',
    skillImprovement: '+1 Level',
    notifyAssigned: true,
    notifyReminder: true,
    notifyTrainer: true,
    notifyManager: true,
    reminderTiming: '2 Days Before',
    documents: [
      { name: 'Leadership_Workshop_Handout.pdf', size: '2.4 MB', type: 'PDF' },
    ],
    progress: 61,
    status: 'Active',
    batches: [
      { id: 'BCH-L1', name: 'Batch 1 - Group A', date: '15-Sep-2026', time: '09:00 AM – 04:00 PM', location: 'Executive Boardroom', trainer: 'Dr. Aris Thorne', capacity: 20, assignedCount: 18 },
      { id: 'BCH-L2', name: 'Batch 2 - Group B', date: '18-Sep-2026', time: '09:00 AM – 04:00 PM', location: 'Executive Boardroom', trainer: 'Dr. Aris Thorne', capacity: 20, assignedCount: 14 },
    ],
    employeeStatuses: [
      { employeeId: 'EMP-002', employeeName: 'Rajesh Sharma', department: 'Production', grade: 'G5', status: 'In Progress', attendancePercent: 85 },
      { employeeId: 'EMP-003', employeeName: 'Amit Patel', department: 'Production', grade: 'G5', status: 'In Progress', attendancePercent: 90 },
    ],
  },
  {
    id: 'PRG-003',
    code: 'TRN-2026-003',
    name: 'Excel Advanced & Business Analytics',
    category: 'Technical',
    type: 'Technical',
    description: 'Mastering Power Query, pivot modeling, complex formulas, and financial dashboarding for corporate teams.',
    objective: 'Enable corporate staff to build automated financial dashboards and analytical models.',
    trainerType: 'Internal',
    trainer: 'Amit Patel',
    provider: 'Internal Data Team',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    durationHours: 3,
    deliveryMode: 'Online',
    location: 'https://meeting.example/excel-advanced',
    capacity: 50,
    assignBy: 'Department',
    targetDepartment: 'Finance',
    targetDesignation: 'Analyst',
    targetGrade: 'G3',
    targetLocation: 'HQ Tech Park',
    employeeCount: 24,
    attendanceRequired: true,
    minAttendance: 75,
    attendanceMethod: 'Employee Check-in',
    completionBasis: 'Attendance',
    trainerConfirmationReq: false,
    assessmentRequired: false,
    certificateRequired: false,
    updateSkillMatrix: true,
    skillName: 'Advanced Excel',
    skillLevel: 'Intermediate',
    skillImprovement: '+1 Level',
    notifyAssigned: true,
    notifyReminder: true,
    notifyTrainer: true,
    notifyManager: false,
    reminderTiming: '1 Day Before',
    documents: [],
    progress: 0,
    status: 'Draft',
    batches: [
      { id: 'BCH-E1', name: 'Online Batch 1', date: '01-Oct-2026', time: '02:00 PM – 05:00 PM', location: 'MS Teams', trainer: 'Amit Patel', capacity: 30, assignedCount: 24 },
    ],
    employeeStatuses: [
      { employeeId: 'EMP-004', employeeName: 'Sunita Rao', department: 'HR', grade: 'G3', status: 'Assigned', attendancePercent: 0 },
    ],
  },
  {
    id: 'PRG-004',
    code: 'TRN-2026-004',
    name: 'POSH Training & Workplace Ethics',
    category: 'Compliance',
    type: 'Compliance',
    description: 'Mandatory annual Prevention of Sexual Harassment awareness, statutory rules, and code of conduct.',
    objective: 'Ensure zero-tolerance statutory compliance and safe workplace culture.',
    trainerType: 'Internal',
    trainer: 'Sunita Rao',
    provider: 'POSH Internal Committee',
    startDate: '2026-10-05',
    endDate: '2026-10-10',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    durationHours: 1.5,
    deliveryMode: 'Online',
    location: 'LMS Portal',
    capacity: 500,
    assignBy: 'All Employees',
    targetDepartment: 'All',
    targetDesignation: 'All',
    targetGrade: 'All',
    targetLocation: 'All',
    employeeCount: 120,
    attendanceRequired: true,
    minAttendance: 100,
    attendanceMethod: 'Employee Check-in',
    completionBasis: 'Attendance + Trainer Confirmation',
    trainerConfirmationReq: true,
    assessmentRequired: true,
    assessmentType: 'Quiz',
    assessmentName: 'POSH Compliance Test',
    passingScore: 80,
    attemptsAllowed: 3,
    certificateRequired: true,
    certificateType: 'POSH Compliance Certificate',
    updateSkillMatrix: true,
    skillName: 'POSH Compliance',
    skillLevel: 'Basic',
    skillImprovement: '+1 Level',
    notifyAssigned: true,
    notifyReminder: true,
    notifyTrainer: true,
    notifyManager: true,
    reminderTiming: '1 Day Before',
    documents: [
      { name: 'POSH_Act_Guidelines_2026.pdf', size: '1.8 MB', type: 'PDF' },
    ],
    progress: 100,
    status: 'Complete',
    batches: [
      { id: 'BCH-P1', name: 'Self-Paced E-Learning', date: '05-Oct-2026', time: 'All Day', location: 'LMS Portal', trainer: 'Sunita Rao', capacity: 500, assignedCount: 120 },
    ],
    employeeStatuses: [
      { employeeId: 'EMP-001', employeeName: 'Priya Verma', department: 'QA', grade: 'G4', status: 'Certified', attendancePercent: 100, assessmentScore: 100, passed: true, certificateIssued: true },
      { employeeId: 'EMP-004', employeeName: 'Sunita Rao', department: 'HR', grade: 'G3', status: 'Certified', attendancePercent: 100, assessmentScore: 95, passed: true, certificateIssued: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// COURSE CATALOG DEEP HRM WORKFLOW INTERFACES & INITIAL DATA
// ─────────────────────────────────────────────────────────────

export interface MarketplaceCourse {
  id: string;
  code: string;
  title: string;
  provider: string;
  instructor: string;
  category: 'Safety' | 'Technical' | 'Leadership' | 'Compliance' | 'Operations';
  durationHours: number;
  pricePerSeat: number;
  rating: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  certificateIncluded: boolean;
  assessmentIncluded: boolean;
  description: string;
  modules: { title: string; duration: string }[];
}

export interface CompanyCourse {
  courseId: string;
  courseCode: string;
  title: string;
  provider: string;
  category: string;
  purchasedSeats: number;
  assignedSeats: number;
  availableSeats: number; // Rule: purchasedSeats = assignedSeats + availableSeats
  inProgressCount: number;
  completedCount: number;
  status: 'ACTIVE' | 'ARCHIVED';
  purchasedAt: string;
}

export interface CourseEnrollment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  assignedDate: string;
  progress: number;
  assessmentScore?: number;
  assessmentPassed?: boolean;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
  certificateIssued: boolean;
}

export interface CourseRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  courseId: string;
  courseTitle: string;
  provider: string;
  pricePerSeat: number;
  reason: string;
  businessBenefit: string;
  priority: 'High' | 'Medium' | 'Low';
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedSeatType?: 'New Purchase' | 'Existing Seat';
}

export interface PurchaseHistoryRecord {
  orderId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  provider: string;
  seatsPurchased: number;
  pricePerSeat: number;
  subtotal: number;
  gst: number;
  totalAmount: number;
  billingEntity: string;
  costCenter: string;
  purchasedAt: string;
  status: 'PAID';
}

export const MARKETPLACE_COURSES: MarketplaceCourse[] = [
  {
    id: 'CRS-101',
    code: 'CRS-101',
    title: 'Workplace Safety Fundamentals',
    provider: 'SafetyFirst Academy',
    instructor: 'Dr. Rajesh Sharma',
    category: 'Safety',
    durationHours: 2,
    pricePerSeat: 1500,
    rating: 4.8,
    difficulty: 'Beginner',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Core OSHA compliance course covering fire safety, PPE standards, hazard reporting, and emergency response.',
    modules: [
      { title: '1. Introduction to Workplace Hazards', duration: '30 mins' },
      { title: '2. PPE Protocols & Safety Gear', duration: '45 mins' },
      { title: '3. Emergency Evacuation Procedures', duration: '45 mins' },
    ],
  },
  {
    id: 'CRS-102',
    code: 'CRS-102',
    title: 'Advanced Excel for Business',
    provider: 'SkillPro Academy',
    instructor: 'Ananya Mehta',
    category: 'Technical',
    durationHours: 12,
    pricePerSeat: 2500,
    rating: 4.9,
    difficulty: 'Advanced',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Master lookup formulas, dynamic array functions, pivot tables, Power Query, and interactive executive dashboards.',
    modules: [
      { title: '1. Excel Fundamentals & Keyboard Shortcuts', duration: '2 Hours' },
      { title: '2. Advanced Formulas & XLOOKUP/INDEX-MATCH', duration: '3 Hours' },
      { title: '3. Pivot Tables & Data Modeling', duration: '3 Hours' },
      { title: '4. Power Query & Data Cleansing', duration: '2 Hours' },
      { title: '5. Executive Dashboard Creation', duration: '2 Hours' },
    ],
  },
  {
    id: 'CRS-103',
    code: 'CRS-103',
    title: 'Leadership Essentials & Communication',
    provider: 'LeadPro Learning',
    instructor: 'Vikramaditya Sen',
    category: 'Leadership',
    durationHours: 8,
    pricePerSeat: 3000,
    rating: 4.7,
    difficulty: 'Intermediate',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Empower first-time managers with delegation skills, constructive feedback techniques, and team motivation strategies.',
    modules: [
      { title: '1. Transitioning to Management', duration: '2 Hours' },
      { title: '2. High-Impact Communication', duration: '2 Hours' },
      { title: '3. Delegation & Accountability', duration: '2 Hours' },
      { title: '4. Performance Coaching & Feedback', duration: '2 Hours' },
    ],
  },
  {
    id: 'CRS-104',
    code: 'CRS-104',
    title: 'AWS Solutions Architect Associate',
    provider: 'Cloud Academy',
    instructor: 'David Miller',
    category: 'Technical',
    durationHours: 24,
    pricePerSeat: 8000,
    rating: 4.9,
    difficulty: 'Advanced',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Comprehensive AWS cloud architectural design covering IAM, EC2, S3, VPC, Serverless, and high availability systems.',
    modules: [
      { title: '1. AWS Cloud Infrastructure Fundamentals', duration: '4 Hours' },
      { title: '2. IAM, Security & VPC Networking', duration: '6 Hours' },
      { title: '3. EC2, Auto Scaling & Load Balancers', duration: '6 Hours' },
      { title: '4. Serverless & S3 Storage Systems', duration: '4 Hours' },
      { title: '5. Architecture Exam Simulation', duration: '4 Hours' },
    ],
  },
  {
    id: 'CRS-105',
    code: 'CRS-105',
    title: 'Power BI & Advanced Data Analytics',
    provider: 'DataSkill Institute',
    instructor: 'Sneha Deshmukh',
    category: 'Technical',
    durationHours: 16,
    pricePerSeat: 4000,
    rating: 4.8,
    difficulty: 'Intermediate',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Transform raw enterprise data into automated interactive Power BI reports and DAX analytical models.',
    modules: [
      { title: '1. Power BI Desktop & Data Connections', duration: '4 Hours' },
      { title: '2. Data Transformations in Power Query', duration: '4 Hours' },
      { title: '3. DAX Formulas & Measures', duration: '4 Hours' },
      { title: '4. Report Publishing & Workspace Sync', duration: '4 Hours' },
    ],
  },
  {
    id: 'CRS-106',
    code: 'CRS-106',
    title: 'Certified Scrum Master (CSM)',
    provider: 'Agile Alliance',
    instructor: 'Michael Chang',
    category: 'Operations',
    durationHours: 14,
    pricePerSeat: 5500,
    rating: 4.7,
    difficulty: 'Intermediate',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Official Scrum Master certification path covering Agile principles, sprint planning, retrospective facilitation, and backlog grooming.',
    modules: [
      { title: '1. Agile Principles & Scrum Framework', duration: '3 Hours' },
      { title: '2. Sprint Ceremonies & Backlog Grooming', duration: '4 Hours' },
      { title: '3. Impediment Removal & Servant Leadership', duration: '4 Hours' },
      { title: '4. CSM Certification Exam Prep', duration: '3 Hours' },
    ],
  },
  {
    id: 'CRS-107',
    code: 'CRS-107',
    title: 'ISO 9001:2015 Quality Management Systems',
    provider: 'TUV Rhineland',
    instructor: 'Karan Malhotra',
    category: 'Compliance',
    durationHours: 10,
    pricePerSeat: 3500,
    rating: 4.8,
    difficulty: 'Intermediate',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Quality audit protocols, risk-based thinking, clause analysis, and internal audit documentation for manufacturing plants.',
    modules: [
      { title: '1. ISO 9001:2015 Clause Breakdown', duration: '3 Hours' },
      { title: '2. Risk-Based Auditing & Quality Manuals', duration: '3 Hours' },
      { title: '3. Internal Auditor Execution', duration: '4 Hours' },
    ],
  },
  {
    id: 'CRS-108',
    code: 'CRS-108',
    title: 'POSH & Workplace Harassment Prevention',
    provider: 'HR Compliance Hub',
    instructor: 'Sunita Rao',
    category: 'Compliance',
    durationHours: 3,
    pricePerSeat: 1200,
    rating: 4.9,
    difficulty: 'Beginner',
    language: 'English',
    certificateIncluded: true,
    assessmentIncluded: true,
    description: 'Statutory compliance course detailing ICC reporting procedures, employee rights, and respectful workplace norms.',
    modules: [
      { title: '1. Statutory Rights & Legal Definitions', duration: '1 Hour' },
      { title: '2. ICC Grievance Mechanism & Inquiries', duration: '1 Hour' },
      { title: '3. Respectful Workplace Ethics', duration: '1 Hour' },
    ],
  },
];

export const INITIAL_COMPANY_COURSES: CompanyCourse[] = [
  {
    courseId: 'CRS-101',
    courseCode: 'CRS-101',
    title: 'Workplace Safety Fundamentals',
    provider: 'SafetyFirst Academy',
    category: 'Safety',
    purchasedSeats: 50,
    assignedSeats: 35,
    availableSeats: 15,
    inProgressCount: 15,
    completedCount: 20,
    status: 'ACTIVE',
    purchasedAt: '2026-01-15',
  },
  {
    courseId: 'CRS-102',
    courseCode: 'CRS-102',
    title: 'Advanced Excel for Business',
    provider: 'SkillPro Academy',
    category: 'Technical',
    purchasedSeats: 25,
    assignedSeats: 10,
    availableSeats: 15,
    inProgressCount: 6,
    completedCount: 4,
    status: 'ACTIVE',
    purchasedAt: '2026-02-10',
  },
  {
    courseId: 'CRS-103',
    courseCode: 'CRS-103',
    title: 'Leadership Essentials & Communication',
    provider: 'LeadPro Learning',
    category: 'Leadership',
    purchasedSeats: 15,
    assignedSeats: 10,
    availableSeats: 5,
    inProgressCount: 5,
    completedCount: 5,
    status: 'ACTIVE',
    purchasedAt: '2026-02-20',
  },
  {
    courseId: 'CRS-105',
    courseCode: 'CRS-105',
    title: 'Power BI & Advanced Data Analytics',
    provider: 'DataSkill Institute',
    category: 'Technical',
    purchasedSeats: 20,
    assignedSeats: 12,
    availableSeats: 8,
    inProgressCount: 8,
    completedCount: 4,
    status: 'ACTIVE',
    purchasedAt: '2026-03-01',
  },
];

export const INITIAL_COURSE_ENROLLMENTS: CourseEnrollment[] = [
  {
    id: 'ENR-2001',
    employeeId: 'EMP-1483',
    employeeName: 'Sanika Shelke',
    department: 'Administration',
    courseId: 'CRS-102',
    courseCode: 'CRS-102',
    courseTitle: 'Advanced Excel for Business',
    assignedDate: '2026-02-12',
    progress: 100,
    assessmentScore: 86,
    assessmentPassed: true,
    status: 'Completed',
    certificateIssued: true,
  },
  {
    id: 'ENR-2002',
    employeeId: 'EMP-011',
    employeeName: 'Amit Kulkarni',
    department: 'IT',
    courseId: 'CRS-102',
    courseCode: 'CRS-102',
    courseTitle: 'Advanced Excel for Business',
    assignedDate: '2026-02-15',
    progress: 40,
    status: 'In Progress',
    certificateIssued: false,
  },
  {
    id: 'ENR-2003',
    employeeId: 'EMP-001',
    employeeName: 'Priya Verma',
    department: 'Finance',
    courseId: 'CRS-102',
    courseCode: 'CRS-102',
    courseTitle: 'Advanced Excel for Business',
    assignedDate: '2026-02-18',
    progress: 0,
    status: 'Not Started',
    certificateIssued: false,
  },
  {
    id: 'ENR-2004',
    employeeId: 'EMP-006',
    employeeName: 'Karan Verma',
    department: 'Operations',
    courseId: 'CRS-101',
    courseCode: 'CRS-101',
    courseTitle: 'Workplace Safety Fundamentals',
    assignedDate: '2026-01-20',
    progress: 100,
    assessmentScore: 92,
    assessmentPassed: true,
    status: 'Completed',
    certificateIssued: true,
  },
  {
    id: 'ENR-2005',
    employeeId: 'EMP-1484',
    employeeName: 'Casey Stone',
    department: 'HR',
    courseId: 'CRS-103',
    courseCode: 'CRS-103',
    courseTitle: 'Leadership Essentials & Communication',
    assignedDate: '2026-02-22',
    progress: 60,
    status: 'In Progress',
    certificateIssued: false,
  },
  {
    id: 'ENR-2006',
    employeeId: 'EMP-1485',
    employeeName: 'Rowan Ortiz',
    department: 'QA',
    courseId: 'CRS-105',
    courseCode: 'CRS-105',
    courseTitle: 'Power BI & Advanced Data Analytics',
    assignedDate: '2026-03-02',
    progress: 100,
    assessmentScore: 48,
    assessmentPassed: false,
    status: 'Failed',
    certificateIssued: false,
  },
];

export const INITIAL_COURSE_REQUESTS: CourseRequest[] = [
  {
    id: 'REQ-101',
    employeeId: 'EMP-1483',
    employeeName: 'Sanika Shelke',
    department: 'Administration',
    courseId: 'CRS-104',
    courseTitle: 'AWS Solutions Architect Associate',
    provider: 'Cloud Academy',
    pricePerSeat: 8000,
    reason: 'Required for upcoming enterprise AWS cloud migration project and cloud governance.',
    businessBenefit: 'Improve cloud architecture skills and ensure zero-downtime server migration.',
    priority: 'High',
    requestedAt: '2026-03-02',
    status: 'Pending',
  },
  {
    id: 'REQ-102',
    employeeId: 'EMP-006',
    employeeName: 'Karan Verma',
    department: 'Operations',
    courseId: 'CRS-105',
    courseTitle: 'Power BI & Advanced Data Analytics',
    provider: 'DataSkill Institute',
    pricePerSeat: 4000,
    reason: 'Need Power BI for monthly operational KPI tracking and automated plant dashboard creation.',
    businessBenefit: 'Automate weekly Excel reporting and reduce operational prep time.',
    priority: 'Medium',
    requestedAt: '2026-03-03',
    status: 'Pending',
  },
  {
    id: 'REQ-103',
    employeeId: 'EMP-005',
    employeeName: 'Sneha More',
    department: 'Manufacturing',
    courseId: 'CRS-106',
    courseTitle: 'Certified Scrum Master (CSM)',
    provider: 'Agile Alliance',
    pricePerSeat: 5500,
    reason: 'Sprint master role for Q4 product release and lean manufacturing execution.',
    businessBenefit: 'Facilitate agile sprint planning and daily standups.',
    priority: 'High',
    requestedAt: '2026-03-03',
    status: 'Pending',
  },
];

export const INITIAL_PURCHASE_HISTORY: PurchaseHistoryRecord[] = [
  {
    orderId: 'ORD-2026-0025',
    courseId: 'CRS-102',
    courseCode: 'CRS-102',
    courseTitle: 'Advanced Excel for Business',
    provider: 'SkillPro Academy',
    seatsPurchased: 25,
    pricePerSeat: 2500,
    subtotal: 62500,
    gst: 11250,
    totalAmount: 73750,
    billingEntity: 'EHCM Technologies Pvt Ltd',
    costCenter: 'HR-L&D',
    purchasedAt: '2026-02-10 11:30 AM',
    status: 'PAID',
  },
  {
    orderId: 'ORD-2026-0024',
    courseId: 'CRS-101',
    courseCode: 'CRS-101',
    courseTitle: 'Workplace Safety Fundamentals',
    provider: 'SafetyFirst Academy',
    seatsPurchased: 50,
    pricePerSeat: 1500,
    subtotal: 75000,
    gst: 13500,
    totalAmount: 88500,
    billingEntity: 'Codigix Manufacturing Ltd',
    costCenter: 'Manufacturing-EHS',
    purchasedAt: '2026-01-15 02:15 PM',
    status: 'PAID',
  },
];

