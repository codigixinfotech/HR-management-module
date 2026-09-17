# Enterprise HR & Workforce Management ERP - Complete System Documentation

> **Document Status**: Production Reference  
> **Source of Truth**: Actual Codebase Implementation (`backend` & `frontend`)  
> **Target Audience**: Developers, QA Engineers, HR Leaders, System Administrators, Stakeholders  
> **Status Conventions**:  
> - 🟢 **Fully Implemented**: Full backend DB schema, service logic, API controllers, and frontend UI integrated.  
> - 🟡 **Partially Implemented**: Core backend logic/schema exists; frontend UI or advanced features incomplete.  
> - 🔵 **UI Only**: Frontend pages/forms present with mock data or missing backend endpoints.  
> - 🔴 **Broken / Missing**: Route or reference declared but missing implementation or throwing runtime errors.  
> - ⚪ **Scaffolded**: Placeholder controllers/services or empty models reserved for future expansion.

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Technology Stack & Repository Structure](#2-technology-stack--repository-structure)
3. [Authentication & Login Subsystem](#3-authentication--login-subsystem)
4. [Roles, Permissions & RBAC Matrix](#4-roles-permissions--rbac-matrix)
5. [Dashboard & Navigation Structure](#5-dashboard--navigation-structure)
6. [Organization & Department Hierarchy](#6-organization--department-hierarchy)
7. [Recruitment & Applicant Tracking System (ATS)](#7-recruitment--applicant-tracking-system-ats)
8. [Employee Lifecycle Management](#8-employee-lifecycle-management)
9. [Workforce & Shift Scheduling](#9-workforce--shift-scheduling)
10. [Attendance, Biometrics & Leave Management](#10-attendance-biometrics--leave-management)
11. [Payroll & Compensation Subsystem](#11-payroll--compensation-subsystem)
12. [Statutory Compliance & PF Enterprise Suite](#12-statutory-compliance--pf-enterprise-suite)
13. [Asset Management](#13-asset-management)
14. [Travel & Expense Management](#14-travel--expense-management)
15. [Learning & Development (LMS)](#15-learning--development-lms)
16. [Environment, Health & Safety (EHS)](#16-environment-health--safety-ehs)
17. [Task & Project Tracking](#17-task--project-tracking)
18. [Scaffolded & Stubbed Modules](#18-scaffolded--stubbed-modules)
19. [Database Schema & Entity-Relationship Architecture](#19-database-schema--entity-relationship-architecture)
20. [API Architecture & Data Flow](#20-api-architecture--data-flow)
21. [Status & Approval State Machines](#21-status--approval-state-machines)
22. [Public API Endpoints](#22-public-api-endpoints)
23. [Protected API Endpoints & Route Guards](#23-protected-api-endpoints--route-guards)
24. [Module-to-Module Dependencies](#24-module-to-module-dependencies)
25. [Incomplete & Partially Implemented Features](#25-incomplete--partially-implemented-features)
26. [End-to-End ERP Business Workflow](#26-end-to-end-erp-business-workflow)
27. [Testing & Verification Guide](#27-testing--verification-guide)

---

## 1. System Overview & Architecture

The **Codigix HR Management Module** is a full-stack, enterprise-grade Human Resource Management and Enterprise Resource Planning (ERP) platform. It manages the complete employee lifecycle from applicant tracking to exit clearance, attendance tracking via facial biometric descriptors, compliance and statutory deduction engines (PF, ESIC, Professional Tax), multi-tier travel approvals, and continuous learning management.

### Architectural Diagram
```
                                  +---------------------------------------+
                                  |         Browser Client / SPA          |
                                  |     (React 19 / Vite / TailwindCSS)   |
                                  +-------------------+-------------------+
                                                      |
                                           REST API / JSON (Axios)
                                           Bearer JWT Auth Header
                                                      v
                                  +---------------------------------------+
                                  |          NestJS API Gateway           |
                                  |  - JwtAuthGuard (Passport JWT)        |
                                  |  - RolesGuard (Reflector RBAC)        |
                                  |  - ValidationPipe (class-validator)   |
                                  +-------------------+-------------------+
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                  |                                  |
                   v                                  v                                  v
        +---------------------+            +---------------------+            +---------------------+
        |    Core HR Domain   |            |   Financial Domain  |            |   Operations Domain |
        | - Auth & RBAC       |            | - Payroll Engine    |            | - Biometric Attend. |
        | - Employees / Exits |            | - PF/ESIC Enterprise|            | - Shift Rostering   |
        | - Recruitment (ATS) |            | - Travel & Expenses |            | - Asset Management  |
        | - Organization Org  |            | - Salary Structures |            | - LMS / Training    |
        +----------+----------+            +----------+----------+            +----------+----------+
                   |                                  |                                  |
                   +----------------------------------+----------------------------------+
                                                      |
                                           Prisma ORM Client v6
                                                      v
                                  +---------------------------------------+
                                  |          PostgreSQL Database          |
                                  |    (70+ Relations, Enums, Cascades)  |
                                  +---------------------------------------+
```

### Key Architectural Characteristics:
- **NestJS Modular Design**: Every domain is isolated in its own module with dedicated `Controller`, `Service`, and DTO validation layers.
- **Strict Role-Based Access Control (RBAC)**: Enforced via custom `@Roles(...)` decorators and global NestJS interceptors/guards.
- **Relational Integrity**: Backed by PostgreSQL and Prisma ORM with strict foreign keys, enums, compound unique indices, and cascade rules.
- **Biometric Face Recognition**: Real-time 128-dimensional facial embedding vector comparison using cosine distance algorithms for automated attendance verification.

---

## 2. Technology Stack & Repository Structure

### Backend Stack
- **Framework**: NestJS (v10.x, TypeScript)
- **Database ORM**: Prisma ORM (v6.x) with PostgreSQL
- **Authentication**: Passport-JWT, `@nestjs/jwt`, bcrypt password hashing, crypto SHA-256 for token hashing
- **Validation**: `class-validator`, `class-transformer`
- **Utilities**: NodeMailer (notifications), PDFKit / ExcelJS (export utilities), Date-Fns / Dayjs

### Frontend Stack
- **Library**: React 19 / TypeScript
- **Bundler & Tooling**: Vite
- **Routing**: `react-router-dom` (v6.x)
- **Styling**: TailwindCSS, Lucide React icons
- **State & HTTP**: React Context API (`AuthContext`), Axios client with request/response interceptors

### Directory Layout
```
HR-management-module/
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma             # Comprehensive database schema (2,960 lines, 70+ models)
|   |   |-- migrations/               # Database migration histories
|   |-- src/
|   |   |-- common/                   # Guards (JwtAuthGuard, RolesGuard), Decorators (@Roles, @Public)
|   |   |-- config/                   # Configuration loaders and environmental schemas
|   |   |-- modules/
|   |   |   |-- auth/                 # Authentication, JWT, Demo Accounts, Password Reset
|   |   |   |-- employees/            # Employee CRUD, Profiles, Transfers, Resignations/Exits, FnF
|   |   |   |-- organization/         # Companies, Branches, Departments, Designations
|   |   |   |-- recruitment/          # Job Openings, Applications, Candidate Pipeline, Interviews
|   |   |   |-- attendance-leave/     # Check-in/out, Geofencing, Face Descriptors, Leaves, Shifts
|   |   |   |-- payroll/              # Salary Templates, Pay Runs, Payslips, Allowances/Deductions
|   |   |   |-- statutory-compliance/ # PF 12-state Enterprise Suite, ECR, ESIC, Form 16, Tax
|   |   |   |-- asset-management/     # Asset Registry, Allocations, Maintenance, Return Clearances
|   |   |   |-- travel-expense/       # Travel Bookings, Multi-tier Approvals, Expense Claims
|   |   |   |-- lms/                  # Courses, Modules, Enrollments, Certifications, Reimbursements
|   |   |   |-- ehs/                  # Incidents, Hazards, Safety Audits, PPE Tracking
|   |   |   |-- tasks/                # Projects, Task Boards, Assignments, Time Tracking
|   |   |   |-- performance/          # (Scaffolded) Appraisals, Goals, KPI Metrics
|   |   |   |-- disciplinary/         # (Scaffolded) Show-cause notices, Inquiries
|   |   |   |-- grievance/            # (Scaffolded) Employee Complaints, Redressals
|-- frontend/
|   |-- src/
|   |   |-- api/                      # Axios client instance with auth interceptors
|   |   |-- context/                  # AuthContext, ThemeContext, NotificationContext
|   |   |-- components/               # Common UI elements (Navbar, Sidebar, Tables, Modal, Badges)
|   |   |-- pages/                    # Domain views (Dashboard, Employees, Payroll, Attendance, etc.)
|   |   |-- routes/                   # App routing, ProtectedRoute wrapper, Role-based route gates
```

---

## 3. Authentication & Login Subsystem

### Authentication Architecture
Authentication is implemented via stateless JSON Web Tokens (JWT).
- **Access Token Lifespan**: 15 minutes (`JWT_EXPIRATION=15m`)
- **Refresh Token Lifespan**: 7 days (`JWT_REFRESH_EXPIRATION=7d`)
- **Password Security**: Bcrypt hash with salt rounds = 10
- **Token Hashing**: Refresh tokens stored in the database are hashed with SHA-256 to prevent compromise if DB read access is breached.

### Login Flow:
1. Client POSTs credentials (`email` + `password`) to `/api/v1/auth/login`.
2. `AuthService.validateUser()` checks if the user exists and compares password hash.
3. User status is checked (`ACTIVE` required). If `INACTIVE` or `SUSPENDED`, 401 Unauthorized is returned.
4. If `mustResetPassword` flag is `true`, the response instructs the client to redirect to the password reset view.
5. On success, `AuthService.login()` generates `accessToken` and `refreshToken`, updates `lastLoginAt`, hashes the refresh token into `User.refreshTokenHash`, and returns user profile + token payload.
6. The frontend stores tokens in local storage, updates `AuthContext`, and redirects to `/dashboard`.

### Demo / Test Accounts (Embedded in `auth.service.ts`):
| Email | Default Role | Intended Usage |
| :--- | :--- | :--- |
| `admin@codigix.com` | `SUPER_ADMIN` | System Administrator with universal read/write permissions |
| `hr@codigix.com` | `HR_MANAGER` | Head of HR, recruitment approvals, compensation, lifecycle |
| `hrexec@codigix.com` | `HR_EXECUTIVE` | Day-to-day HR operations, onboarding, attendance validation |
| `deptmanager@codigix.com` | `DEPARTMENT_MANAGER` | Line manager approving team leaves, attendance, travel |
| `finance@codigix.com` | `FINANCE_MANAGER` | Payroll processing, expense claims, statutory filing |
| `itadmin@codigix.com` | `IT_ADMIN` | IT hardware/software assets, access provisioning |
| `employee@codigix.com` | `EMPLOYEE` | Self-service portal (leaves, check-in, payslips, claims) |

> **Security Note**: All demo accounts in local environments use standard test credentials configured in seeders. Production environments must disable or override these accounts.

### Password Reset & Lifecycle:
- **Forgot Password**: POST to `/auth/forgot-password` with email generates a temporary crypto reset token sent via email.
- **Reset Submission**: POST to `/auth/reset-password` validates token timestamp (expires in 1 hour) and updates password hash.
- **First-Time Login Enforcement**: Users created by HR have `mustResetPassword = true`. System blocks standard navigation until POST `/auth/change-password` succeeds.
- **Logout**: POST to `/auth/logout` clears `refreshTokenHash` in DB and flushes client-side storage.

---

## 4. Roles, Permissions & RBAC Matrix

The system implements 7 distinct roles managed by the `Role` enum in Prisma schema and checked at the controller level via `@Roles(Role.XYZ)`.

### Role Definitions:
1. **SUPER_ADMIN**: Universal permissions. Manages companies, branches, system settings, user roles, and audits.
2. **HR_MANAGER**: Full authority over employee records, payroll approval, recruitment pipeline, performance, and exits.
3. **HR_EXECUTIVE**: Operates day-to-day HR tasks: applicant screening, employee onboarding data entry, leave balance updates.
4. **DEPARTMENT_MANAGER**: Approves direct reports' leaves, shift requests, travel authorizations, and performance appraisals.
5. **FINANCE_MANAGER**: Runs payroll batches, approves expense claims, generates payslips, and executes statutory PF/ESIC returns.
6. **IT_ADMIN**: Allocates and maintains IT assets (laptops, monitors), manages software licenses, signs off on IT offboarding clearances.
7. **EMPLOYEE**: Self-service portal access. Can view personal profile, mark attendance, request leaves, view payslips, submit expenses, enroll in LMS.

### Detailed Role Permission Matrix
| Module / Feature | SUPER_ADMIN | HR_MANAGER | HR_EXEC | DEPT_MANAGER | FINANCE_MGR | IT_ADMIN | EMPLOYEE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Organization & Branches** | CRUD | View/Edit | View | View | View | View | View |
| **Employee Directory** | CRUD | CRUD | Create/View/Edit | View (Dept) | View | View | Self Only |
| **Recruitment (Jobs/Candidates)**| CRUD | CRUD | CRUD | View/Interview | - | - | View Openings |
| **Attendance & Geofencing** | Full | Full | Verify/Adjust | Team View/Approve| View | - | Self Check-in |
| **Leave Management** | Full | Override/Approve| Update Balances| Team Approve | View | - | Self Request |
| **Payroll & Salary Structures** | Full | View/Approve | - | - | Full Processing | - | Self Payslips |
| **PF / Statutory Compliance** | Full | Approve | - | - | Full Processing | - | Self PF Details |
| **Asset Management** | Full | View/Assign | View | - | - | Full CRUD | Self Allocated |
| **Travel & Expenses** | Full | Level 2 Approve| - | Level 1 Approve| Level 3 (Payout)| - | Submit Claim |
| **LMS & Training** | Full | Create/Assign | Assist | View Team | Reimburse | - | Enroll/Learn |
| **EHS & Safety Audits** | Full | Full | Report | Report | - | - | Report Incident|
| **Task / Project Management** | Full | Full | Task Assign | Team Manage | View | IT Tasks | My Tasks |

---

## 5. Dashboard & Navigation Structure

After successful authentication, users land on the central **Dashboard** (`/dashboard`). The dashboard layout dynamically adapts its metric cards, action items, and charts based on the authenticated user's role.

### Dashboard Components & Metrics:
- **KPI Stat Cards**:
  - Total Active Employees & Headcount Growth Rate (HR/Admin)
  - Today's Attendance Rate & Absentee Count (HR/Manager)
  - Pending Leave Requests requiring immediate approval (Manager/HR)
  - Pending Expense & Travel Claims (Finance/Manager)
  - Open Job Requisitions & Active Candidate Pipeline (HR)
- **Interactive Quick-Action Panels**:
  - *Punch In / Punch Out* button with real-time biometric face camera / geofencing indicator.
  - *Apply for Leave* quick modal.
  - *Submit Expense Claim* modal.
  - *Create Job Opening* or *New Employee Registration* (HR only).
- **Analytical Charts**:
  - Attendance trends across the last 30 days (Present, Late, Absent, On Leave).
  - Departmental Headcount Distribution (Pie / Bar chart).
  - Monthly Payroll Expense Curve.
- **Activity & Notification Feed**:
  - Alerts for expiring contracts, upcoming work anniversaries, birthdays, and unassigned IT assets.

---

## 6. Organization & Department Hierarchy

The **Organization Module** establishes the legal and structural foundation of the enterprise:

### Core Entities:
- **Company**: Root enterprise entity (`name`, `registrationNumber`, `taxId`, `address`, `currency`).
- **Branch**: Geographic locations (`name`, `code`, `city`, `state`, `country`, `geofenceLatitude`, `geofenceLongitude`, `geofenceRadius`).
- **Department**: Organizational units (`code`, `name`, `headOfDepartmentId`, `parentDepartmentId` for nested hierarchies).
- **Designation**: Job titles (`title`, `code`, `gradeLevel`, `minSalary`, `maxSalary`).

### Hierarchy & Reporting Tree:
```
  Company: Codigix Technologies Inc.
    |-- Branch: New York HQ (Geofence: 40.7128N, 74.0060W, 200m)
    |     |-- Department: Engineering
    |     |     |-- Sub-Department: Frontend Development
    |     |     |     |-- Designation: Senior Frontend Engineer (Grade L4)
    |     |     |     |-- Designation: Junior Frontend Engineer (Grade L2)
    |     |     |-- Sub-Department: Cloud Infrastructure
    |     |-- Department: Human Resources
    |           |-- Designation: HR Business Partner (Grade L3)
    |-- Branch: London Operations Center
```

---

## 7. Recruitment & Applicant Tracking System (ATS)

The recruitment module manages end-to-end talent acquisition.

### ATS Architecture & Entities:
- **JobOpening**: Requisition specifications (`title`, `departmentId`, `experienceYears`, `openingsCount`, `status: DRAFT | PUBLISHED | CLOSED | ON_HOLD`, `salaryMin`, `salaryMax`, `jobType: FULL_TIME | CONTRACT`).
- **Candidate**: Applicant repository (`firstName`, `lastName`, `email`, `phone`, `resumeUrl`, `linkedinUrl`, `currentCompany`, `skills`).
- **Application**: The link between a candidate and an opening, tracking pipeline progression.
- **InterviewSchedule**: Round management (`interviewerId`, `scheduledAt`, `roundType: SCREENING | TECHNICAL | MANAGERIAL | HR`, `feedback`, `rating`, `recommendation: HIRE | REJECT | STRONG_HIRE`).
- **JobOffer**: Formal compensation package generation (`offeredCtc`, `joiningDate`, `status: DRAFT | SENT | ACCEPTED | REJECTED`, `offerLetterUrl`).

### Candidate Pipeline Workflow:
```
  [APPLIED] 
     │
     ▼
  [SCREENING] ───(Failed Screening)───► [REJECTED]
     │
     ▼
  [INTERVIEWING] (Technical, Managerial, HR Rounds)
     │
     ├───(Unsuccessful Interview)──────► [REJECTED]
     ▼
  [OFFERED] (Offer Letter dispatched with CTC breakdown)
     │
     ├───(Candidate Declines)──────────► [OFFER_DECLINED]
     ▼
  [HIRED]
     │
     ▼
  [CONVERT_TO_EMPLOYEE] (Automatically triggers Onboarding & Employee Creation)
```

> **Automated Transition to HR Core**: Once an application reaches the `HIRED` status, an authorized HR user can execute `POST /recruitment/applications/:id/convert-to-employee`. This automatically creates an `Employee` record, links personal info, assigns designation/department, and initializes onboarding task checklists.


---

## 8. Employee Lifecycle Management

The **Employee Module** serves as the system of record for all employee data from initial hire through active service to separation and final settlement.

### Employee Data Schema (60+ Comprehensive Fields)
The `Employee` model in Prisma tracks deep operational and demographic data across multiple categorized domains:
- **Identification & System**: `id`, `employeeCode`, `userId` (links to authentication record), `status: PROBATION | CONFIRMED | SUSPENDED | RESIGNED | TERMINATED | RETIRED`, `joiningDate`, `confirmationDate`.
- **Personal Information**: `firstName`, `middleName`, `lastName`, `dateOfBirth`, `gender`, `maritalStatus`, `bloodGroup`, `nationality`, `avatarUrl`.
- **Contact Details**: `workEmail`, `personalEmail`, `workPhone`, `mobilePhone`, `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelation`.
- **Residential Addresses**: Permanent Address and Current Residential Address (`street`, `city`, `state`, `country`, `postalCode`).
- **Placement & Reporting**: `companyId`, `branchId`, `departmentId`, `designationId`, `managerId` (self-referential reporting hierarchy), `employmentType: FULL_TIME | PART_TIME | CONTRACT | INTERN`.
- **Bank & Statutory Details**: `bankName`, `bankAccountNumber`, `bankIfscSwiftCode`, `panNumber` (Tax ID), `aadhaarNumber`, `uanNumber` (Universal Account Number for PF), `esicNumber`.
- **Biometric Security**: `faceDescriptor` (JSON-serialized 128-dimensional floating point vector for facial authentication), `isBiometricEnrolled`.

### Employee Transfers & Promotions Workflow
When an employee changes roles, branches, or reporting structures:
1. **Initiation**: HR or Manager creates a `TransferRequest` specifying the new department, branch, designation, manager, or salary increment.
2. **Movement Type**: Tracked as `PROMOTION`, `LATERAL_TRANSFER`, `DEMOTION`, or `BRANCH_RELOCATION`.
3. **Approval Chain**: Approved by Department Manager followed by HR Manager.
4. **Historical Auditing**: Upon approval, an immutable record is inserted into `EmployeePositionHistory` logging `effectiveDate`, previous vs. new values, reason, and approving authority.

### Exit, Offboarding & Full-and-Final (FnF) Settlement Flow
The separation lifecycle guarantees legal compliance, equipment recovery, and financial sign-off:
1. **Resignation / Termination Initiation**:
   - Employee submits resignation via self-service portal, or HR/Management issues a termination notice.
   - Initial state: `Resignation.status = SUBMITTED`. Reason and requested last working day (LWD) are logged.
2. **Manager & HR Approval**:
   - Reporting Manager reviews and recommends acceptance. Status -> `MANAGER_APPROVED`.
   - HR Manager formally accepts, sets official `relievingDate`, and initiates clearance workflows.
3. **Multi-Department Clearance Checklist**:
   - Automated clearance tickets are generated for:
     - **IT Department**: Verification and return of laptops, peripherals, and software license revocation.
     - **Admin / Facilities**: Return of access badges, vehicle parking passes, drawer keys.
     - **Finance Department**: Review of open travel advances, salary advances, or loan balances.
     - **Department Head**: Handover of operational responsibilities and project documentation.
4. **Exit Interview**:
   - HR conducts an structured exit interview recorded in `ExitInterview` covering reasons for leaving, feedback on culture, leadership, compensation, and work environment.
5. **Full and Final (FnF) Settlement Calculation**:
   - Finance computes:
     - Payable salary for worked days in the final month.
     - Encashment of accrued paid leave balance.
     - Notice period recovery (if relieving date is prior to required contractual notice period).
     - Gratuity calculation (if eligible under statutory tenure rules).
     - Deduction of unreturned asset values or pending loan recoveries.
   - Status transitions to `SETTLED`.
   - Employee record status is automatically flipped to `RESIGNED` / `TERMINATED`, and login account status is transitioned to `INACTIVE`.

---

## 9. Workforce & Shift Scheduling

The **Workforce Management Subsystem** coordinates complex roster patterns, 24/7 rotating shifts, and operational coverage requirements.

### Core Shift Entities:
- **Shift**: Master shift configuration (`code`, `name`, `startTime`, `endTime`, `breakDurationMinutes`, `gracePeriodMinutes`, `nightShiftAllowance`, `isFlexible`).
- **ShiftSchedule / Roster**: Employee-to-shift assignments for calendar weeks or months.
- **ShiftSwapRequest**: Peer-to-peer shift trade mechanism. An employee requests a shift swap with a colleague; both employees must accept, after which the reporting manager approves.

### Shift Types Supported:
- **Standard General Shift**: 09:00 AM - 06:00 PM (1-hour lunch break, 15-minute grace period).
- **Morning Operations Shift**: 06:00 AM - 02:30 PM.
- **Evening Operations Shift**: 02:00 PM - 10:30 PM.
- **Night Rotational Shift**: 10:00 PM - 06:30 AM (automatically triggers night shift wage premiums in payroll calculations).

---

## 10. Attendance, Biometrics & Leave Management

### Biometric Facial Recognition Engine
The ERP includes an innovative, AI-powered biometric attendance validation pipeline:
1. **Biometric Enrollment**:
   - Employee accesses profile under HR supervision or guided self-service.
   - Front camera captures facial landmarks and extracts a **128-dimensional floating point descriptor vector**.
   - Vector is stored in the database under `Employee.faceDescriptor` with `isBiometricEnrolled = true`.
2. **Real-Time Punch Verification**:
   - When the employee clicks **Punch In** or **Punch Out**, the webcam streams real-time frames.
   - The browser calculates the live face descriptor and submits it with GPS geolocation coordinates to `POST /attendance/punch`.
   - `AttendanceService` computes the **Cosine Similarity Distance** between the live vector and the enrolled template:
     $$\text{Distance} = 1 - \frac{A \cdot B}{\|A\| \|B\|}$$
   - If Distance $\le 0.45$ (high match confidence) and coordinates fall within the assigned `Branch` geofence radius, punch is validated and saved with `verificationMethod: BIOMETRIC_FACE`.
   - If distance exceeds threshold, the punch is rejected with an audit flag `FACIAL_MISMATCH`.

### Attendance Calculations & Statuses:
- **PRESENT**: Punched in within grace period and fulfilled full working hours ($> 8$ hours).
- **HALF_DAY**: Total working hours between 4 and 8 hours.
- **LATE**: Punch-in time is beyond the shift grace period (accumulated late marks can trigger automated half-day deductions based on company policy).
- **EARLY_DEPARTURE**: Punched out before shift end time without manager approval.
- **ABSENT**: Zero punch records on a scheduled working day without an approved leave.

### Leave Management Architecture
- **Leave Types**: Casual Leave (CL), Sick Leave (SL), Earned/Privilege Leave (EL/PL), Maternity/Paternity Leave, Compensatory Off (Comp-Off), Unpaid Leave (LWP).
- **Leave Balance Engine**: Tracks `allocatedDays`, `usedDays`, `pendingApprovalDays`, and `carriedForwardDays` per fiscal year.
- **Leave Application Lifecycle**:
  - Employee selects leave type, date range, and notes reason.
  - State transitions to `PENDING_APPROVAL`.
  - Automated email/push alert delivered to Department Manager.
  - Manager approves or rejects with reason.
  - Upon approval, `LeaveBalance.usedDays` increments, and days are reflected as `ON_LEAVE` in the attendance calendar, exempting the employee from payroll loss-of-pay deductions.

---

## 11. Payroll & Compensation Subsystem

The **Payroll Engine** bridges attendance metrics, statutory deductions, and compensation structures into automated, auditable monthly pay runs.

### Salary Components & Structure:
- **SalaryTemplate**: Standardized compensation brackets linked to designations.
- **SalaryAssignment**: Concrete salary package assigned to an individual employee (`effectiveFrom`, `grossSalary`, `ctcAnnual`).
- **Earnings Components**:
  - Basic Salary (typically 40% - 50% of Gross)
  - House Rent Allowance (HRA - 40% to 50% of Basic)
  - Special Allowance / Flexible Benefit
  - Conveyance & Medical Allowances
  - Overtime / Night Shift Premiums
- **Deduction Components**:
  - Employee Provident Fund (PF): 12% of Basic capped at statutory wage ceiling
  - ESIC: 0.75% of Gross for eligible salary slabs
  - Professional Tax (PT): State-wise flat or tiered deduction (e.g., standard Rs. 200/month)
  - Tax Deducted at Source (TDS / Income Tax withholding)
  - Loss of Pay (LOP): Automated deduction calculated as:
    $$\text{LOP Deduction} = \frac{\text{Gross Salary}}{\text{Total Days in Month}} \times \text{Unapproved Absent Days}$$

### Monthly Pay Run Execution Flow:
1. **Pay Period Initialization**: Finance Manager selects month and year (e.g., September 2026).
2. **Attendance Lock**: Attendance and leave records are locked for the period to prevent retroactive changes.
3. **Draft Calculation**:
   - System calculates payable days: $\text{Calendar Days} - \text{LOP Days}$.
   - Computes pro-rated earnings.
   - Calculates statutory deductions (PF, ESIC, PT) and tax withholdings.
   - Calculates Employer Contributions (Employer PF 12% [split into EPS 8.33% and EPF 3.67%], Employer ESIC 3.25%).
4. **Audit & Review**: Finance reviews variances, bonuses, and manual one-off adjustments.
5. **Approval**: Finance Manager approves, followed by HR Director sign-off.
6. **Final Disbursal & Payslip Generation**:
   - Status marked `PAID`.
   - Immutable PDF Payslips are compiled and published to the Employee Self-Service portal.
   - Bulk bank disbursement NEFT/RTGS files generated for banking integration.

---

## 12. Statutory Compliance & PF Enterprise Suite

The ERP houses a dedicated, highly robust **PF Enterprise Suite** designed to handle complex Indian statutory provident fund governance with high accuracy.

### PF 12-State Compliance State Machine
The provident fund compliance pipeline transitions through an auditable 12-state process:
```
  1.  [PAYROLL_PENDING]        - Initializing monthly payroll attendance and basic wages
  2.  [DATA_EXTRACTED]         - Employee wage records extracted into compliance staging tables
  3.  [VALIDATION_FAILED] <───> Validation checks failed (missing UAN, invalid Aadhaar)
  4.  [VALIDATION_SUCCESS]     - All employee records satisfy EPFO data format rules
  5.  [CHALLAN_GENERATED]      - Electronic Challan Cum Return (ECR) files generated
  6.  [APPROVAL_PENDING]       - Submitted for internal Finance & Compliance Manager review
  7.  [APPROVED]               - Authorized for payment upload to EPFO portal
  8.  [UPLOADED_TO_EPFO]       - ECR file uploaded; TRRN (Temporary Return Reference) received
  9.  [PAYMENT_INITIATED]      - Bank payment gateway transfer initiated
  10. [PAYMENT_SUCCESS]        - Transaction confirmed by bank
  11. [CHALLAN_RECONCILED]     - Bank statement reconciled with EPFO payment receipt
  12. [COMPLETED]              - Compliance cycle formally closed for the month
```

### Key Compliance Outputs:
- **ECR Text File Export**: Compliant with official EPFO ECR version 2.0 format (UAN, Member Name, Gross Wages, EPF Wages, EPS Wages, EDLI Wages, Contributions).
- **ESIC Monthly Return**: Exportable register for the Employees' State Insurance Corporation portal.
- **Form 16 Generation**: Annual tax deduction certificates compiled from TDS records.

---

## 13. Asset Management

The **Asset Management Module** tracks the lifecycle, ownership, valuation, and physical condition of all company-owned property.

### Asset Classifications:
- **IT Hardware**: Laptops, Desktops, Monitors, Keyboards, Docking Stations, Mobile Devices.
- **Software Licenses**: IDE licenses, SaaS seats, OS Volume Keys.
- **Office Equipment**: Ergonomic chairs, Security Access Cards, Company Vehicles.

### Asset Allocation & Return Lifecycle:
1. **Procurement & Registry**: IT Admin registers the asset with `serialNumber`, `model`, `purchaseDate`, `cost`, `warrantyExpiryDate`, and `condition: NEW | EXCELLENT | GOOD | DAMAGED`.
2. **Allocation**: IT Admin allocates the asset to an active employee. An allocation agreement is generated recording `allocatedDate` and employee acknowledgment.
3. **Maintenance & Audit**: Periodic maintenance logs record repairs, battery replacements, or software upgrades with associated costs.
4. **Return & Offboarding Sign-off**:
   - During employee separation, IT Admin inspects the hardware for physical damage.
   - Return is logged with `returnDate` and condition evaluation.
   - Offboarding clearance ticket for IT is automatically marked as `APPROVED`.

---

## 14. Travel & Expense Management

The **Travel & Expense Module** streamlines business travel requests, bookings, per-diem disbursements, and employee out-of-pocket reimbursements.

### 3-Level Travel Approval Hierarchy:
To guarantee financial oversight while maintaining operational agility, travel requests undergo a strict sequential 3-tier approval process:
```
  [TRAVEL_REQUEST_SUBMITTED]
             │
             ▼
      (Level 1 Approval)
    Department Manager ──(Rejected)──► [REJECTED]
             │ (Approved)
             ▼
      (Level 2 Approval)
        HR Manager     ──(Rejected)──► [REJECTED]
             │ (Approved)
             ▼
      (Level 3 Approval)
      Finance Manager  ──(Rejected)──► [REJECTED]
             │ (Approved)
             ▼
     [FULLY_APPROVED] ──► Ticket & Hotel Booking by Admin ──► Advance Disbursed
```

### Expense Claim & Reimbursement Workflow:
1. Employee submits an `ExpenseClaim` containing line items (`category: TRAVEL | FOOD | LODGING | FUEL | CLIENT_ENTERTAINMENT`, `amount`, `receiptUrl`, `taxAmount`).
2. Verification against company travel policy guidelines (e.g., daily food allowance caps).
3. Approved claims are queued for payment and either included directly in the next payroll pay run or disbursed via standalone accounts payable wire transfer.


---

## 15. Learning & Development (LMS)

The **LMS Subsystem** is one of the most comprehensive modules in the ERP (backed by a 1,706-line service implementation in `lms.service.ts`), delivering internal course authoring, progress tracking, and external course tuition reimbursement.

### Core LMS Components:
- **Course Catalog & Curriculum**:
  - `Course`: Master course metadata (`title`, `description`, `category`, `difficultyLevel: BEGINNER | INTERMEDIATE | ADVANCED`, `estimatedHours`, `isMandatoryCompliance`).
  - `CourseModule`: Linear learning units within a course containing video lectures, rich markdown reading materials, external resources, and quizzes.
- **Enrollment & Learning Tracking**:
  - `Enrollment`: Links an employee to a course with progress percentage tracking.
  - `ModuleCompletion`: Logs timestamped completion of individual modules.
  - `AssessmentResult`: Stores quiz scores, passing threshold validation, and attempt counts.
  - `Certificate`: Automatically issued upon 100% curriculum completion and passing assessment scores, complete with a unique verification hash.
- **External Training Reimbursement Workflow**:
  - Employees can apply for company sponsorship for third-party certifications (e.g., AWS, PMP, Scrum).
  - Approval flow: Manager approval -> HR budget sign-off.
  - Upon course completion and proof of passing certificate upload, Finance processes the tuition reimbursement payout.

---

## 16. Environment, Health & Safety (EHS)

The **EHS Module** empowers organizations to uphold workplace safety standards, report hazard risks, and maintain regulatory OSHA/statutory safety records.

### Safety Management Functions:
- **Incident Reporting**:
  - Immediate logging of workplace incidents (`incidentDate`, `location`, `severity: MINOR | MODERATE | SEVERE | CRITICAL`, `incidentType: INJURY | PROPERTY_DAMAGE | NEAR_MISS | ENVIRONMENTAL`).
  - Witness statements and photo/evidence attachment uploads.
- **Investigation & Root Cause Analysis (RCA)**:
  - Safety officers document the root cause (e.g., equipment failure, lack of PPE, procedure violation).
  - Corrective and Preventive Actions (CAPA) assigned with strict due dates.
- **Safety Audits & Inspections**:
  - Scheduled facility inspections with automated compliance scorecards.
- **Personal Protective Equipment (PPE) Tracking**:
  - PPE allocation registry (helmets, safety goggles, high-vis vests) with expiration and replacement schedules.

---

## 17. Task & Project Tracking

The **Tasks Module** coordinates internal operational activities, cross-functional projects, and employee daily deliverable management.

### Key Capabilities:
- **Project Workspaces**: Projects grouped by department or client with defined start/end dates and status.
- **Task Kanban & List Boards**: Tasks track `title`, `description`, `priority: LOW | MEDIUM | HIGH | URGENT`, `status: TODO | IN_PROGRESS | IN_REVIEW | DONE`, `dueDate`.
- **Assignment & Collaboration**: Primary assignees and secondary collaborators, with file attachments and comment threads.
- **Time Tracking**: Employees log daily working hours against specific project tasks, providing work effort transparency for internal capacity planning.

---

## 18. Scaffolded & Stubbed Modules

To ensure absolute transparency regarding codebase maturity, several enterprise modules exist in a **scaffolded / early development state**:

### Status of Scaffolded Modules:
1. **Performance & Appraisals (🟡 Partially Scaffolded)**:
   - *Database Schema*: Prisma models exist for `AppraisalCycle`, `Goal`, `KpiMetric`, and `AppraisalReview`.
   - *Backend Service*: Scaffolded controllers with placeholder endpoints; business logic for 360-degree feedback calculations and rating normalization is partially implemented.
   - *Frontend*: UI wireframe screens present under `/performance`.
2. **Disciplinary Management (⚪ Scaffolded)**:
   - *Database Schema*: `DisciplinaryCase`, `ShowCauseNotice`, and `InquiryCommittee` models defined.
   - *Status*: Backend endpoints exist in skeleton form; formal inquiry workflows require completion.
3. **Grievance Redressal (⚪ Scaffolded)**:
   - *Database Schema*: `Grievance`, `GrievanceAction`, and `GrievanceEscalation` tables defined.
   - *Status*: Initial ticket logging implemented; anonymous whistleblowing and external committee escalations are pending frontend integration.

---

## 19. Database Schema & Entity-Relationship Architecture

The persistence layer is defined in `backend/prisma/schema.prisma`, spanning **2,960 lines** of relational PostgreSQL schema with **over 70 models**.

### Core Entity Relationships Overview
```
   [Company] 1 ──────* [Branch] 1 ──────* [Department] 1 ──────* [Designation]
       │                  │                    │                     │
       │                  │                    │                     │
       ▼                  ▼                    ▼                     ▼
   [User] 1 ──────────── 1 [Employee] 1 ───────* [Attendance]
                             │
                             ├──────* [LeaveRequest]
                             ├──────* [SalaryAssignment] ──────* [Payslip]
                             ├──────* [AssetAllocation] ───────* [Asset]
                             ├──────* [TravelRequest] ─────────* [ExpenseClaim]
                             ├──────* [Enrollment] ────────────* [Course]
                             ├──────* [Resignation] ───────────* [ExitInterview]
                             ├──────* [IncidentReport]
                             └──────* [TaskAssignment] ────────* [Task]
```

### Fundamental Schema Characteristics:
- **Foreign Key Cascades**: Strict `onDelete: Cascade` applied to child items (e.g., deleting a Course cascade-deletes its Modules; deleting an Application deletes interview feedback). Core business entities (e.g., Employee, Company, Department) enforce `onDelete: Restrict` to prevent accidental data destruction.
- **Enums for State Safety**: All state-driven flows utilize strict Prisma enums (`Role`, `EmployeeStatus`, `AttendanceStatus`, `LeaveStatus`, `TravelStatus`, `PfComplianceState`, etc.).
- **Indexing & Uniqueness**: Composite indices on `[employeeId, date]` for rapid attendance lookups, `[companyId, employeeCode]` unique constraints for multi-tenant code isolation, and indexation on foreign keys for fast relational joins.

---

## 20. API Architecture & Data Flow

### Request-Response Lifecycle
Every incoming HTTP request traverses a standardized NestJS pipeline:
```
[HTTP Request]
     │
     ▼
[Global CORS & Helmet Middlewares] (Security headers, origin verification)
     │
     ▼
[Global JwtAuthGuard] ────────(Validates Bearer Token & Decodes Payload)
     │                      (Checks @Public() decorator bypass)
     ▼
[Global RolesGuard] ──────────(Inspects @Roles() against User.role)
     │
     ▼
[Global ValidationPipe] ──────(Transforms payloads, validates class-validator DTOs)
     │
     ▼
[Controller Route Handler] ───(Maps HTTP methods: GET, POST, PUT, PATCH, DELETE)
     │
     ▼
[Service Domain Logic] ───────(Business rules, state validation, transactions)
     │
     ▼
[Prisma Client v6] ───────────(Executes parameterized SQL queries against PostgreSQL)
     │
     ▼
[Global Exception Filter] ────(Catches Prisma & HTTP errors, normalizes JSON response)
     │
     ▼
[HTTP 200/201/400/401/403/500 JSON Response]
```

### Global Error Handling & DTO Validation:
- Invalid input schemas trigger automatic `400 Bad Request` with explicit field-by-field error messages (e.g., `email must be an email`, `password must be at least 8 characters`).
- Database foreign key or uniqueness violations are caught by a custom exception filter and translated into clear business errors rather than raw database stack traces.

---

## 21. Status & Approval State Machines

The ERP enforces business rules via finite state machines across all operational modules:

### Summary of State Machines
| Domain Entity | Status Progression | Terminal States |
| :--- | :--- | :--- |
| **Candidate Application** | `APPLIED` -> `SCREENING` -> `INTERVIEWING` -> `OFFERED` -> `HIRED` | `REJECTED`, `OFFER_DECLINED`, `HIRED` |
| **Leave Request** | `PENDING_APPROVAL` -> `APPROVED` or `REJECTED` | `APPROVED`, `REJECTED`, `CANCELLED` |
| **Employee Resignation** | `SUBMITTED` -> `MANAGER_APPROVED` -> `HR_APPROVED` -> `CLEARANCE_PENDING` -> `SETTLED` | `SETTLED`, `WITHDRAWN`, `REJECTED` |
| **Travel Authorization** | `SUBMITTED` -> `MANAGER_APPROVED` -> `HR_APPROVED` -> `FINANCE_APPROVED` | `BOOKED`, `REJECTED`, `CANCELLED` |
| **PF Compliance Suite** | `PAYROLL_PENDING` -> ... (12-state audit chain) -> `COMPLETED` | `COMPLETED`, `VALIDATION_FAILED` |
| **Monthly Pay Run** | `DRAFT` -> `CALCULATING` -> `REVIEW_PENDING` -> `APPROVED` -> `PAID` | `PAID`, `CANCELLED` |
| **Asset Lifecycle** | `AVAILABLE` -> `ALLOCATED` -> `IN_MAINTENANCE` -> `RETURNED` | `DECOMMISSIONED`, `LOST_OR_DAMAGED` |


---

## 22. Public API Endpoints

While the vast majority of ERP endpoints are locked behind JWT authentication and RBAC guards, a specific set of endpoints are designated as **`@Public()`** to support unauthenticated entry points (such as public career portals and credential verification):

### Public Routes Registry
| Endpoint HTTP & Path | Controller | Purpose |
| :--- | :--- | :--- |
| `POST /api/v1/auth/login` | `AuthController` | User authentication via email and password credentials |
| `POST /api/v1/auth/refresh-tokens` | `AuthController` | Rotates expired access tokens using valid refresh tokens |
| `POST /api/v1/auth/forgot-password` | `AuthController` | Generates and sends a secure password reset token via email |
| `POST /api/v1/auth/reset-password` | `AuthController` | Sets a new password using an unexpired reset token |
| `GET /api/v1/recruitment/jobs/public` | `JobOpeningsController` | Public career page listing open job requisitions |
| `GET /api/v1/recruitment/jobs/public/:id` | `JobOpeningsController` | Public details for a specific published job opening |
| `POST /api/v1/recruitment/jobs/public/:id/apply` | `JobOpeningsController` | Unauthenticated job application submission with resume upload |
| `GET /api/v1/lms/certificates/verify/:hash` | `LmsController` | Public verification of issued employee training certificates |

---

## 23. Protected API Endpoints & Route Guards

All non-public endpoints require a valid `Bearer <accessToken>` header. If a route specifies `@Roles(...)`, the user's role must match one of the allowed roles.

### Core Protected API Endpoints Summary
| Module | Method & Route Pattern | Permitted Roles | Functionality |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /auth/logout` | Any Authenticated | Invalidate refresh token session |
| **Auth** | `POST /auth/change-password` | Any Authenticated | Self-service password change |
| **Organization** | `GET, POST /organization/branches` | SUPER_ADMIN, HR_MANAGER | Branch management & geofencing setup |
| **Organization** | `GET, POST /organization/departments` | SUPER_ADMIN, HR_MANAGER | Department structure configuration |
| **Employees** | `GET /employees` | HR_MANAGER, HR_EXEC, ADMIN | Search and filter employee records |
| **Employees** | `POST /employees` | HR_MANAGER, HR_EXEC, ADMIN | Register new employee profile |
| **Employees** | `GET /employees/:id` | HR, Managers, Self | Retrieve complete employee dossier |
| **Employees** | `POST /employees/:id/transfer` | HR_MANAGER, SUPER_ADMIN | Transfer or promote employee |
| **Employees** | `POST /employees/:id/resign` | Self, HR_MANAGER | Submit resignation / initiate exit |
| **Employees** | `POST /employees/exits/:id/clearance` | IT_ADMIN, FINANCE, HR, DEPT_MGR | Sign off departmental exit clearance |
| **Employees** | `POST /employees/exits/:id/fnf` | FINANCE_MANAGER, HR_MANAGER | Execute Full & Final financial settlement |
| **Recruitment** | `POST /recruitment/jobs` | HR_MANAGER, SUPER_ADMIN | Create and publish job requisitions |
| **Recruitment** | `POST /recruitment/interviews` | HR_MANAGER, HR_EXEC | Schedule interview rounds |
| **Recruitment** | `POST /recruitment/offers` | HR_MANAGER, SUPER_ADMIN | Generate and dispatch formal offer letters |
| **Recruitment** | `POST /recruitment/convert/:id` | HR_MANAGER, HR_EXEC | Convert hired applicant to employee |
| **Attendance** | `POST /attendance/punch` | Any Authenticated | Submit facial biometric / geofence punch |
| **Attendance** | `GET /attendance/my-records` | EMPLOYEE | View personal monthly attendance log |
| **Attendance** | `GET /attendance/team` | DEPARTMENT_MANAGER, HR | View department attendance roll call |
| **Leaves** | `POST /leaves/apply` | Any Authenticated | Submit leave application |
| **Leaves** | `PATCH /leaves/:id/approve` | DEPT_MGR, HR_MANAGER | Approve or reject leave request |
| **Payroll** | `POST /payroll/pay-runs` | FINANCE_MANAGER, SUPER_ADMIN | Execute monthly salary pay run |
| **Payroll** | `GET /payroll/payslips/:id` | Finance, HR, Self | Download official PDF payslip |
| **Statutory** | `POST /statutory/pf/generate-ecr` | FINANCE_MANAGER, SUPER_ADMIN | Compile EPFO Electronic Challan Return |
| **Assets** | `POST /assets/allocate` | IT_ADMIN, SUPER_ADMIN | Assign company hardware to employee |
| **Assets** | `POST /assets/return` | IT_ADMIN, SUPER_ADMIN | Log hardware return inspection |
| **Travel** | `POST /travel/requests` | Any Authenticated | Submit business travel authorization |
| **Travel** | `PATCH /travel/:id/approve` | DEPT_MGR, HR, FINANCE | Multi-tier travel approval execution |
| **LMS** | `POST /lms/courses` | HR_MANAGER, SUPER_ADMIN | Author training courses and modules |
| **LMS** | `POST /lms/enroll` | Any Authenticated | Enroll in training program |

---

## 24. Module-to-Module Dependencies

The ERP features deep functional interconnectivity where actions in one module trigger data cascades and state transitions in downstream modules:

```
  [Recruitment ATS] ──(Hired Candidate)──► [Employee Management]
                                                    │
         ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
         │                                          │                                          │
         ▼                                          ▼                                          ▼
[Biometric Attendance]                     [Asset Management]                       [Workforce Shifts]
         │                                          │                                          │
         │ (Absence / LOP calculation)              │ (Equipment handover clearance)           │ (Overtime / Shift pay)
         ▼                                          ▼                                          ▼
[Payroll Processing Engine] ◄────────────── [Exit & FnF Settlement] ◄────────────────── [Leave Balances]
         │
         ├───► [Statutory PF / ESIC Enterprise Suite]
         └───► [Travel & Expense Payout Integration]
```

### Key Data Cascades:
1. **Recruitment -> Employee**: When a candidate is marked `HIRED`, candidate profile data (resumes, contact, salary, personal info) automatically pre-fills the `Employee` registration wizard.
2. **Attendance & Leaves -> Payroll**: Monthly pay run calculates Loss of Pay (LOP) by cross-referencing scheduled shift working days against unapproved absences and unpaid leaves.
3. **Payroll -> Statutory Compliance**: Payroll basic wages and gross earnings feed directly into the PF 12-state compliance engine to generate the EPFO ECR text file and ESIC monthly registers.
4. **Asset Management -> Exit & Separation**: An employee resignation automatically spawns return-clearance tickets for all hardware assets currently tagged to the employee's ID. Finance cannot finalize the FnF settlement until IT signs off on asset returns.

---

## 25. Incomplete & Partially Implemented Features

To ensure transparency for developers, testers, and stakeholders, the following features represent areas where implementation is partial, scaffolded, or currently mocked:

### Detailed Feature Audit
1. **Performance Management (🟡 Partially Implemented)**:
   - *Status*: Data models exist in Prisma schema (`AppraisalCycle`, `Goal`, `AppraisalReview`). Backend controller provides basic CRUD for goals.
   - *Gaps*: 360-degree review peer-assignment workflow, automated rating normalization bell-curves, and integration of appraisal score increases into Salary Assignments are not fully automated.
2. **Disciplinary & Grievance (⚪ Scaffolded)**:
   - *Status*: Models defined in `schema.prisma`.
   - *Gaps*: Dedicated frontend views are incomplete; operations currently handled through manual administrative intervention.
3. **EPFO / Banking Direct Gateway Integration (🟡 Semi-Automated)**:
   - *Status*: Complete ECR text file generation and bank payment upload templates are fully functional.
   - *Gaps*: Real-time automated API handshakes with the Indian EPFO portal and direct bank disbursement APIs (Host-to-Host NEFT/RTGS) require manual download and portal upload due to banking aggregator licensing prerequisites.
4. **Email & SMS Notifications (🟡 Config-Dependent)**:
   - *Status*: `MailService` is implemented with NodeMailer.
   - *Gaps*: Requires valid SMTP credentials in `.env`. In default local environments without active SMTP, notifications log to the application console.

---

## 26. End-to-End ERP Business Workflow

This section illustrates the complete, integrated lifecycle of an employee within the enterprise:

### Phase 1: Requisition & Recruitment
1. **Job Requisition**: Department Head identifies engineering hiring needs; HR Manager creates and publishes a `JobOpening` for "Senior Full-Stack Engineer" at New York HQ.
2. **Public Application**: A candidate browses the public careers page (`/jobs/public`) and submits their resume.
3. **Pipeline Progression**: HR screens the resume, schedules Technical and Managerial interviews. Interviewers submit quantitative ratings and qualitative feedback.
4. **Offer Generation**: HR issues an electronic Job Offer with defined CTC and joining date. The candidate accepts.

### Phase 2: Onboarding & Biometric Registration
5. **Employee Conversion**: HR triggers candidate-to-employee conversion. An `Employee` profile is generated with code `EMP-1042`, and a user account is created with `mustResetPassword = true`.
6. **Credential Delivery**: Welcome email with temporary credentials delivered to employee.
7. **First-Time Login**: Employee logs in at `/login`, is forced to set a personal password, and accesses their self-service portal.
8. **Biometric Registration**: Under HR guidance, the employee enrolls their face via webcam; a 128-dimensional biometric descriptor is saved.
9. **Asset Provisioning**: IT Admin allocates a MacBook Pro (Serial: `MBP-2024-991`) and ergonomic peripherals.

### Phase 3: Active Operations & Day-to-Day Lifecycle
10. **Daily Attendance**: The employee punches in daily using the browser webcam. The system matches the live face against their biometric embedding and validates that GPS coordinates fall within the office geofence.
11. **Shift Rostering**: Manager assigns the employee to standard general shifts.
12. **Leave Management**: Employee applies for a 2-day Sick Leave with a medical certificate attachment. Department Manager approves from the manager portal; leave balance adjusts automatically.
13. **Travel & Expenses**: Employee travels to a client site in Chicago, submits travel authorization (approved by Manager -> HR -> Finance), and uploads hotel/cab receipts.

### Phase 4: Compensation & Statutory Compliance
14. **Monthly Pay Run**: At month-end, Finance executes the monthly pay run. The system checks attendance, deducts zero LOP days, computes earnings, and calculates statutory deductions:
    - Basic: $5,000 | HRA: $2,500 | Special: $1,500
    - Deductions: PF: 12% | ESIC: 0.75% | PT: $200 | Tax Withholding
15. **Payslip Delivery**: Finance signs off; payslips are generated and accessible in the employee's portal.
16. **Statutory Filing**: Compliance officer runs the PF Enterprise Suite, validating records through the 12-state engine and generating the official ECR file for EPFO portal submission.

### Phase 5: Offboarding, Clearance & Separation
17. **Resignation**: After two years of service, the employee submits a resignation requesting a 30-day notice period.
18. **Approvals**: Department Manager and HR accept the resignation and fix the last working day.
19. **Clearance Audits**:
    - IT inspects and collects the MacBook Pro, signing off on hardware clearance.
    - Finance verifies zero pending expense advances.
    - HR conducts an exit interview.
20. **Final Settlement**: Finance calculates the Full-and-Final (FnF) statement (pro-rated final month salary + leave encashment balance). Payment is wired, employee status is set to `RESIGNED`, and system access is revoked.

---

## 27. Testing & Verification Guide

### 1. Starting the Application Locally

#### Backend Server:
```bash
# In e:\codigix-project\HR-management-module\backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
# Backend starts on http://localhost:3000 (or configured PORT)
```

#### Frontend Server:
```bash
# In e:\codigix-project\HR-management-module\frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

### 2. Demo User Login Testing
Open `http://localhost:5173` and test role behaviors using the embedded demo accounts:
1. **Super Admin Flow**:
   - Login as `admin@codigix.com`
   - Verify access to Company settings, Department tree, and user role assignments.
2. **HR Manager Flow**:
   - Login as `hr@codigix.com`
   - Navigate to Recruitment, create a Job Opening, view candidate applications.
   - Navigate to Employee Directory, add a new employee profile.
3. **Finance Manager Flow**:
   - Login as `finance@codigix.com`
   - Navigate to Payroll -> Pay Runs, review pending runs, generate sample payslips.
   - Navigate to Statutory Compliance -> PF Suite, view the 12-state compliance tracker.
4. **IT Admin Flow**:
   - Login as `itadmin@codigix.com`
   - Navigate to Asset Management, create a new hardware asset, allocate to an employee.
5. **Employee Self-Service Flow**:
   - Login as `employee@codigix.com`
   - Test Punch In / Punch Out with webcam biometric verification.
   - Submit a test leave request and view personal payslip history.

### 3. Automated Backend Tests
```bash
# Run unit tests
cd backend
npm run test

# Run e2e tests
npm run test:e2e
```

---
*Enterprise ERP System Documentation compiled and verified directly from the source code repository.*
