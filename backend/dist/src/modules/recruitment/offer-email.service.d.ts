import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
export interface SendOfferEmailDto {
    offerId: string;
    candidateName: string;
    candidateEmail: string;
    position: string;
    ctc: string;
    joiningDate?: string;
    requisitionCode?: string;
    interviewCode?: string;
    location?: string;
    manager?: string;
}
export interface SendApplicationConfirmationDto {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    requisitionCode: string;
    applicationId: string;
    applicationDate: string;
}
export interface EmailAuditLog {
    id: string;
    offerId: string;
    recipientEmail: string;
    sentDate: string;
    senderEmail: string;
    subject: string;
    status: 'SENT' | 'FAILED';
    attempts: number;
    lastError?: string;
    smtpResponse?: string;
}
export declare class OfferEmailService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private transporter;
    private readonly auditLogs;
    constructor(configService: ConfigService, prisma: PrismaService);
    private initTransporter;
    private sanitizeErrorMessage;
    private validateEmail;
    private generateOfferPdfContent;
    sendOfferEmail(dto: SendOfferEmailDto): Promise<{
        success: boolean;
        offerId: string;
        candidateEmail: string;
        status: string;
        sentAt: string;
        attachmentFilename: string;
        smtpResponse: string;
        audit: EmailAuditLog;
    }>;
    testSmtpConnection(targetEmail?: string): Promise<{
        success: boolean;
        message: string;
        smtpHost: string;
        smtpPort: string;
        testedEmail: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        smtpHost: string;
        smtpPort: string;
        testedEmail?: undefined;
    }>;
    getAuditLogs(offerId?: string): EmailAuditLog[];
    sendApplicationConfirmationEmail(dto: SendApplicationConfirmationDto): Promise<void>;
}
