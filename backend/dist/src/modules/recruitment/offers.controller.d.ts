import { OfferEmailService, SendOfferEmailDto } from './offer-email.service';
export declare class OffersController {
    private readonly offerEmailService;
    constructor(offerEmailService: OfferEmailService);
    sendOfferEmail(dto: SendOfferEmailDto): Promise<{
        success: boolean;
        offerId: string;
        candidateEmail: string;
        status: string;
        sentAt: string;
        attachmentFilename: string;
        smtpResponse: string;
        audit: import("./offer-email.service").EmailAuditLog;
    }>;
    testSmtpConnection(email?: string): Promise<{
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
    getAuditLogs(offerId?: string): Promise<import("./offer-email.service").EmailAuditLog[]>;
}
