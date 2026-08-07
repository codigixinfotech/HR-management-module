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
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            country: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            branchId: string | null;
            departmentId: string | null;
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
            phone: string | null;
            dateOfJoining: Date | null;
            employmentType: import("@prisma/client").$Enums.EmploymentType;
            status: import("@prisma/client").$Enums.EmployeeStatus;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
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
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        country: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        branchId: string | null;
        departmentId: string | null;
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
        phone: string | null;
        dateOfJoining: Date | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
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
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        country: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        branchId: string | null;
        departmentId: string | null;
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
        phone: string | null;
        dateOfJoining: Date | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
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
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        country: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        branchId: string | null;
        departmentId: string | null;
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
        phone: string | null;
        dateOfJoining: Date | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
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
