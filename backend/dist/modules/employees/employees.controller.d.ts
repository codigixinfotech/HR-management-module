import { ApprovalStatus } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { OnboardingService } from './onboarding.service';
import { CreateEmployeeDto, ListEmployeesQueryDto, UpdateEmployeeDto } from './dto/employee.dto';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
export declare class EmployeesController {
    private readonly employeesService;
    private readonly onboardingService;
    constructor(employeesService: EmployeesService, onboardingService: OnboardingService);
    list(query: ListEmployeesQueryDto): Promise<{
        items: ({
            company: {
                id: string;
                name: string;
            };
            branch: {
                id: string;
                name: string;
            } | null;
            department: {
                id: string;
                name: string;
            } | null;
            designation: {
                id: string;
                title: string;
            } | null;
            reportingManager: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            location: string | null;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            shift: string | null;
            country: string | null;
            state: string | null;
            city: string | null;
            pincode: string | null;
            phone: string | null;
            businessUnit: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            branchId: string | null;
            costCenter: string | null;
            departmentId: string | null;
            grade: string | null;
            employmentType: import("@prisma/client").$Enums.EmploymentType;
            designationId: string | null;
            reportingManagerId: string | null;
            employeeCode: string;
            firstName: string;
            middleName: string | null;
            lastName: string;
            gender: import("@prisma/client").$Enums.Gender | null;
            dateOfBirth: Date | null;
            personalEmail: string | null;
            workEmail: string | null;
            dateOfJoining: Date | null;
            status: import("@prisma/client").$Enums.EmployeeStatus;
            level: string | null;
            employeeCategory: string | null;
            workPhone: string | null;
            workMode: string | null;
            probationPeriod: string | null;
            confirmationDate: Date | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            emergencyContactRelationship: string | null;
            dateOfExit: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        company: {
            id: string;
            name: string;
        };
        branch: {
            id: string;
            name: string;
        } | null;
        department: {
            id: string;
            name: string;
        } | null;
        designation: {
            id: string;
            title: string;
        } | null;
        reportingManager: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        directReports: {
            id: string;
            firstName: string;
            lastName: string;
        }[];
        documents: {
            id: string;
            docType: string;
            fileName: string;
            filePath: string;
            uploadedAt: Date;
            employeeId: string;
        }[];
        onboardingTasks: {
            id: string;
            createdAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            employeeId: string;
            ownerType: string;
            dueDate: Date | null;
            completedAt: Date | null;
        }[];
    } & {
        location: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        shift: string | null;
        country: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        phone: string | null;
        businessUnit: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        branchId: string | null;
        costCenter: string | null;
        departmentId: string | null;
        grade: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        designationId: string | null;
        reportingManagerId: string | null;
        employeeCode: string;
        firstName: string;
        middleName: string | null;
        lastName: string;
        gender: import("@prisma/client").$Enums.Gender | null;
        dateOfBirth: Date | null;
        personalEmail: string | null;
        workEmail: string | null;
        dateOfJoining: Date | null;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        level: string | null;
        employeeCategory: string | null;
        workPhone: string | null;
        workMode: string | null;
        probationPeriod: string | null;
        confirmationDate: Date | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelationship: string | null;
        dateOfExit: Date | null;
    }>;
    create(dto: CreateEmployeeDto): Promise<{
        company: {
            id: string;
            name: string;
        };
        branch: {
            id: string;
            name: string;
        } | null;
        department: {
            id: string;
            name: string;
        } | null;
        designation: {
            id: string;
            title: string;
        } | null;
        reportingManager: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        shift: string | null;
        country: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        phone: string | null;
        businessUnit: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        branchId: string | null;
        costCenter: string | null;
        departmentId: string | null;
        grade: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        designationId: string | null;
        reportingManagerId: string | null;
        employeeCode: string;
        firstName: string;
        middleName: string | null;
        lastName: string;
        gender: import("@prisma/client").$Enums.Gender | null;
        dateOfBirth: Date | null;
        personalEmail: string | null;
        workEmail: string | null;
        dateOfJoining: Date | null;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        level: string | null;
        employeeCategory: string | null;
        workPhone: string | null;
        workMode: string | null;
        probationPeriod: string | null;
        confirmationDate: Date | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelationship: string | null;
        dateOfExit: Date | null;
    }>;
    update(id: string, dto: UpdateEmployeeDto): Promise<{
        company: {
            id: string;
            name: string;
        };
        branch: {
            id: string;
            name: string;
        } | null;
        department: {
            id: string;
            name: string;
        } | null;
        designation: {
            id: string;
            title: string;
        } | null;
        reportingManager: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        shift: string | null;
        country: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        phone: string | null;
        businessUnit: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        branchId: string | null;
        costCenter: string | null;
        departmentId: string | null;
        grade: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        designationId: string | null;
        reportingManagerId: string | null;
        employeeCode: string;
        firstName: string;
        middleName: string | null;
        lastName: string;
        gender: import("@prisma/client").$Enums.Gender | null;
        dateOfBirth: Date | null;
        personalEmail: string | null;
        workEmail: string | null;
        dateOfJoining: Date | null;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        level: string | null;
        employeeCategory: string | null;
        workPhone: string | null;
        workMode: string | null;
        probationPeriod: string | null;
        confirmationDate: Date | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelationship: string | null;
        dateOfExit: Date | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    listDocuments(id: string): Promise<{
        id: string;
        docType: string;
        fileName: string;
        filePath: string;
        uploadedAt: Date;
        employeeId: string;
    }[]>;
    uploadDocument(id: string, file: Express.Multer.File, docType: string): Promise<{
        id: string;
        docType: string;
        fileName: string;
        filePath: string;
        uploadedAt: Date;
        employeeId: string;
    }>;
    removeDocument(id: string, documentId: string): Promise<{
        success: boolean;
    }>;
    listOnboardingTasks(id: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        employeeId: string;
        ownerType: string;
        dueDate: Date | null;
        completedAt: Date | null;
    }[]>;
    createOnboardingTask(id: string, dto: CreateOnboardingTaskDto): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        employeeId: string;
        ownerType: string;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
    updateOnboardingTaskStatus(taskId: string, status: ApprovalStatus): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        employeeId: string;
        ownerType: string;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
}
