export interface MockEmployee {
  id: string;
  name: string;
  department: string;
  designation?: string;
  email?: string;
  employeeCode?: string;
}

export interface MarketplaceCourse {
  id: string;
  code: string;
  title: string;
  provider: string;
  instructor?: string;
  category: string;
  durationHours: number;
  pricePerSeat: number;
  rating: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  certificateIncluded: boolean;
  assessmentIncluded?: boolean;
  description: string;
  modules?: Array<{ title: string; duration: string }>;
}

export interface CompanyCourse {
  id?: string;
  courseId: string;
  courseCode: string;
  title: string;
  provider: string;
  category: string;
  purchasedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  inProgressCount?: number;
  completedCount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  courseUrl?: string;
  accessInstructions?: string;
  subscriptionType?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  accessUsername?: string;
  accessPassword?: string;
  externalReference?: string;
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
  moduleProgress?: any;
  assessmentScore?: number;
  assessmentPassed?: boolean;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
  certificateIssued: boolean;
  courseAccess?: {
    provider: string;
    courseUrl: string;
    subscriptionType: string;
    subscriptionEndDate?: string;
    accessInstructions: string;
    accessUsername?: string;
    accessPassword?: string;
  } | null;
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
  priority: 'Low' | 'Medium' | 'High';
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedSeatType?: 'New Purchase' | 'Existing Seat';
  courseUrl?: string;
  url?: string;
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
  status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
}

export interface TrainingBatch {
  batchId: string;
  batchName: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  enrolledCount: number;
  venueOrLink: string;
  trainer: string;
}

export interface TrainingProgram {
  id: string;
  programCode: string;
  title: string;
  name?: string;
  category: string;
  department: string;
  deliveryMode: string;
  durationHours: number;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
  creationType?: string;
  skillsAddressed?: string[];
  prerequisites?: string[];
  targetAudience?: string[];
  learningObjectives?: string[];
  syllabusModules?: Array<{ moduleTitle: string; moduleDuration: string; moduleDescription?: string }>;
  trainerName?: string;
  vendorName?: string;
  employeeCount?: number;
  costPerParticipant?: number;
  totalBudget?: number;
  approvalStatus?: string;
  batches?: TrainingBatch[];
}

export interface CertificateTemplate {
  id: string;
  title: string;
  name: string;
  issuedCount: number;
  issuedTo?: string;
  issueDate?: string;
  type: string;
  category?: string;
  relatedCourse?: string;
}

export interface IssuedCertificate {
  id: string;
  certificateNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  courseId: string;
  courseTitle: string;
  credentialTitle?: string;
  issueDate: string;
  expiryDate?: string;
  verificationCode: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'VERIFIED' | 'EXPIRING_SOON';
  downloadUrl?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string;
  relatedCoursesCount: number;
}

export interface EmployeeSkillScore {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  skillName: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  sourceCourse: string;
  lastUpdated: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface AssessmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  attemptsAllowed: number;
  questions: QuestionItem[];
}

export interface CourseModule {
  id?: string;
  title: string;
  duration: string;
  description?: string;
}

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  provider: string;
  category: string;
  durationHours: number;
  pricePerSeat: number;
  description: string;
  modules?: CourseModule[];
}

export interface EmployeeProgramStatus {
  employeeId: string;
  employeeName: string;
  department: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

export interface LearningReimbursement {
  id: string;
  employeeId: string;
  courseId: string;
  courseTitle: string;
  provider: string;
  courseUrl?: string;
  purchaseDate: string;
  purchaseAmount: number;
  currency: string;
  invoiceNumber?: string;
  invoiceFileUrl?: string;
  certificateFileUrl?: string;
  certificateNumber?: string;
  certificateIssueDate?: string;
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  paidDate?: string;
  paymentReference?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAYMENT_PENDING' | 'PAID';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
}
