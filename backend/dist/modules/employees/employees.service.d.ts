import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
export declare class EmployeesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(query: PaginationQueryDto, companyId?: string): Promise<{
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
    findById(id: string): Promise<{
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
    addDocument(employeeId: string, docType: string, fileName: string, filePath: string): Promise<{
        id: string;
        docType: string;
        fileName: string;
        filePath: string;
        uploadedAt: Date;
        employeeId: string;
    }>;
    listDocuments(employeeId: string): Promise<{
        id: string;
        docType: string;
        fileName: string;
        filePath: string;
        uploadedAt: Date;
        employeeId: string;
    }[]>;
    removeDocument(employeeId: string, documentId: string): Promise<{
        success: boolean;
    }>;
}
