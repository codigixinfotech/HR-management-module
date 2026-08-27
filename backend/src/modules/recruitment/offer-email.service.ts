import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
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

@Injectable()
export class OfferEmailService {
  private readonly logger = new Logger(OfferEmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly auditLogs: EmailAuditLog[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10);
    const user = this.configService.get<string>('SMTP_USER', 'reactjscodigix@gmail.com');
    const passRaw = this.configService.get<string>('SMTP_PASSWORD', 'sano ezdn gqta tkfv');
    const pass = passRaw ? passRaw.replace(/\s+/g, '') : '';
    const secure = this.configService.get<string>('SMTP_SECURE', 'false') === 'true';

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(`SMTP Transporter initialized for ${host}:${port} (${user})`);
    } catch (err) {
      this.logger.error('Failed to initialize SMTP transporter', err);
    }
  }

  private sanitizeErrorMessage(msg: string): string {
    if (!msg) return 'SMTP Email Delivery Failure';
    const passRaw = this.configService.get<string>('SMTP_PASSWORD', '');
    let clean = msg;
    if (passRaw) {
      clean = clean.replace(new RegExp(passRaw, 'gi'), '***');
      clean = clean.replace(new RegExp(passRaw.replace(/\s+/g, ''), 'gi'), '***');
    }
    return clean;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate Valid Binary %PDF-1.4 Document Buffer
  private generateOfferPdfContent(dto: SendOfferEmailDto): Buffer {
    const sanitize = (text: string) => text.replace(/[\(\)\\]/g, ' ');

    const dateStr = new Date().toLocaleDateString('en-GB');
    const candName = sanitize(dto.candidateName || 'Candidate');
    const pos = sanitize(dto.position || 'Position');
    const ctc = sanitize(dto.ctc || 'Rs. 24,00,000 / yr');
    const joiningDate = sanitize(dto.joiningDate || '20 Sep 2026');
    const reqCode = sanitize(dto.requisitionCode || 'JR-2026-001');
    const intCode = sanitize(dto.interviewCode || 'INT-2026-005');
    const offerId = sanitize(dto.offerId || 'OFR-2026-001');
    const loc = sanitize(dto.location || 'Pune HQ - Executive Suite');
    const mgr = sanitize(dto.manager || 'Rajesh Sharma (CTO)');

    const streamText = `BT
/F1 16 Tf
50 740 Td
(EHCM PLATFORM - ENTERPRISE SUITE) Tj
/F1 10 Tf
0 -16 Td
(Codigix Infotech Private Limited - Global HR Operations) Tj
0 -24 Td
/F1 10 Tf
(Ref No: ${offerId}                                   Date: ${dateStr}) Tj
0 -24 Td
/F1 12 Tf
(SUBJECT: OFFICIAL LETTER OF EMPLOYMENT OFFER - ${pos.toUpperCase()}) Tj
0 -24 Td
/F1 10 Tf
(Dear ${candName},) Tj
0 -16 Td
(We are pleased to offer you the position of ${pos} at EHCM Platform.) Tj
0 -16 Td
(Interview Ref: ${intCode} | Job Requisition: ${reqCode}) Tj
0 -24 Td
/F1 11 Tf
(KEY EMPLOYMENT TERMS & SALARY DETAILS:) Tj
/F1 10 Tf
0 -16 Td
(- Designation: ${pos}) Tj
0 -14 Td
(- Total Annual CTC: ${ctc}) Tj
0 -14 Td
(- Proposed Joining Date: ${joiningDate}) Tj
0 -14 Td
(- Work Location: ${loc}) Tj
0 -14 Td
(- Reporting Manager: ${mgr}) Tj
0 -14 Td
(- Probation Period: 3 Months | Notice Period: 30 Days) Tj
0 -24 Td
/F1 11 Tf
(SALARY COMPENSATION BREAKDOWN:) Tj
/F1 10 Tf
0 -16 Td
(- Basic Salary: 50% of CTC) Tj
0 -14 Td
(- House Rent Allowance HRA: 20% of CTC) Tj
0 -14 Td
(- Special & Performance Allowance: 20% of CTC) Tj
0 -14 Td
(- Employer PF Contribution: 10% of CTC) Tj
0 -28 Td
(This offer is contingent upon successful background verification.) Tj
0 -24 Td
(Authorized HR Operations Signatory - EHCM Platform) Tj
ET`;

    const streamBuf = Buffer.from(streamText, 'utf-8');
    const streamLength = streamBuf.length;

    const headerObj = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
`;

    const footerObj = `
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000315 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${315 + streamLength + 30}
%%EOF`;

    return Buffer.concat([
      Buffer.from(headerObj, 'utf-8'),
      streamBuf,
      Buffer.from(footerObj, 'utf-8'),
    ]);
  }

  // 1. Send Offer Email via Configured Gmail SMTP
  async sendOfferEmail(dto: SendOfferEmailDto) {
    if (!dto.candidateEmail || !this.validateEmail(dto.candidateEmail)) {
      throw new BadRequestException(`Invalid candidate recipient email address: '${dto.candidateEmail}'`);
    }

    if (!dto.offerId || !dto.position) {
      throw new BadRequestException('Offer ID and Position are required to send offer letter.');
    }

    // Always re-initialize transporter with current .env credentials
    this.initTransporter();

    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'reactjscodigix@gmail.com');
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'E-HCM Platform');
    const subject = `Job Offer – ${dto.position} – E-HCM Platform`;
    const sanitizedCandName = dto.candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const attachmentFilename = `Offer_Letter_${sanitizedCandName}.pdf`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
        <h2 style="color: #2563eb;">E-HCM Platform — Enterprise Suite</h2>
        <p>Dear <strong>${dto.candidateName}</strong>,</p>
        <p>We are pleased to offer you the position of <strong>${dto.position}</strong> at <strong>E-HCM Platform</strong>.</p>
        <p>Please find your official Offer Letter attached to this email (<code>${attachmentFilename}</code>).</p>
        <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0;">
          <strong>Offer Summary:</strong><br/>
          • Position: <strong>${dto.position}</strong><br/>
          • Annual CTC: <strong>${dto.ctc}</strong><br/>
          • Joining Date: <strong>${dto.joiningDate || '20 Sep 2026'}</strong><br/>
          • Offer ID: <code>${dto.offerId}</code>
        </div>
        <p>Kindly review the offer details and respond before the offer expiry date.</p>
        <br/>
        <p>Regards,<br/>
        <strong>HR Team</strong><br/>
        E-HCM Platform</p>
      </div>
    `;

    const pdfBuffer = this.generateOfferPdfContent(dto);

    let attempts = 0;
    let lastError = '';
    let smtpResponse = '';
    let success = false;

    try {
      attempts++;
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: dto.candidateEmail,
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: attachmentFilename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      success = true;
      smtpResponse = info.response || '250 2.0.0 OK (Accepted by Gmail SMTP)';
      this.logger.log(`Offer letter email successfully delivered to ${dto.candidateEmail} via Gmail SMTP! Response: ${smtpResponse}`);
    } catch (err: any) {
      lastError = this.sanitizeErrorMessage(err?.message || 'SMTP Email Sending Failed');
      this.logger.error(`Gmail SMTP send failed for ${dto.candidateEmail}: ${lastError}`);
    }

    // Record Audit Log
    const auditRecord: EmailAuditLog = {
      id: `AUD-${Date.now()}`,
      offerId: dto.offerId,
      recipientEmail: dto.candidateEmail,
      sentDate: new Date().toISOString(),
      senderEmail: fromEmail,
      subject,
      status: success ? 'SENT' : 'FAILED',
      attempts,
      lastError: success ? undefined : lastError,
      smtpResponse: success ? smtpResponse : undefined,
    };
    this.auditLogs.unshift(auditRecord);

    if (!success) {
      throw new InternalServerErrorException(
        `SMTP Email Delivery Failed for ${dto.candidateEmail}: ${lastError}. Offer status kept as GENERATED. Click Retry Send.`,
      );
    }

    return {
      success: true,
      offerId: dto.offerId,
      candidateEmail: dto.candidateEmail,
      status: 'SENT',
      sentAt: auditRecord.sentDate,
      attachmentFilename,
      smtpResponse,
      audit: auditRecord,
    };
  }

  // 2. Test SMTP Configuration Endpoint
  async testSmtpConnection(targetEmail?: string) {
    this.initTransporter();

    const testEmail = targetEmail || this.configService.get<string>('SMTP_FROM_EMAIL', 'reactjscodigix@gmail.com');
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<string>('SMTP_PORT', '587');

    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter is null');
      }

      await this.transporter.verify();

      return {
        success: true,
        message: 'SMTP Connection Successful',
        smtpHost: host,
        smtpPort: port,
        testedEmail: testEmail,
      };
    } catch (err: any) {
      const cleanErr = this.sanitizeErrorMessage(err?.message || 'Unable to connect to SMTP server');
      this.logger.error('SMTP Connection Test Failed', cleanErr);

      return {
        success: false,
        message: 'SMTP Connection Failed',
        error: cleanErr,
        smtpHost: host,
        smtpPort: port,
      };
    }
  }

  // Fetch Audit Logs
  getAuditLogs(offerId?: string) {
    if (offerId) {
      return this.auditLogs.filter((l) => l.offerId === offerId);
    }
    return this.auditLogs;
  }

  // Automatic Candidate Application Received Confirmation Email
  async sendApplicationConfirmationEmail(dto: SendApplicationConfirmationDto) {
    if (!dto.candidateEmail || !this.validateEmail(dto.candidateEmail)) {
      this.logger.warn(`Invalid candidate email for application confirmation: ${dto.candidateEmail}`);
      return;
    }

    this.initTransporter();

    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'reactjscodigix@gmail.com');
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Codigix HR Team');

    const subject = `Application Received – ${dto.jobTitle} | ${dto.applicationId}`;

    const textContent = `Dear ${dto.candidateName},

Thank you for applying for the ${dto.jobTitle} position at Codigix Infotech Pvt. Ltd.

Your application has been successfully received.

Application Details
────────────────────────────
Application ID: ${dto.applicationId}
Position: ${dto.jobTitle}
Requisition Code: ${dto.requisitionCode}
Status: Application Received
Application Date: ${dto.applicationDate}

Our recruitment team will review your application. If your profile matches the requirements, we will contact you regarding the next steps.

Please keep your Application ID for future reference.

Regards,
HR / Recruitment Team
Codigix Infotech Pvt. Ltd.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Codigix Infotech Pvt. Ltd.</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Candidate Application Received Confirmation</p>
        </div>
        <div style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <p>Dear <strong>${dto.candidateName}</strong>,</p>
          <p>Thank you for applying for the <strong>${dto.jobTitle}</strong> position at Codigix Infotech Pvt. Ltd.</p>
          <p>Your application has been successfully received and registered in our HR portal.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px 0; color: #4f46e5; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Application Details</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Application ID:</td><td style="font-family: monospace; font-weight: bold; color: #4f46e5;">${dto.applicationId}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Position:</td><td style="font-weight: 600;">${dto.jobTitle}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Requisition Code:</td><td style="font-family: monospace;">${dto.requisitionCode}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Status:</td><td><span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 11px;">Application Received</span></td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Application Date:</td><td>${dto.applicationDate}</td></tr>
            </table>
          </div>

          <p>Our recruitment team will review your application. If your profile matches the job requirements, we will contact you regarding the next steps.</p>
          <p style="font-size: 12px; color: #64748b;">Please keep your Application ID for future reference.</p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="margin: 0; color: #475569; font-weight: 600;">Regards,</p>
          <p style="margin: 2px 0 0 0; color: #64748b;">HR / Recruitment Team<br /><strong>Codigix Infotech Pvt. Ltd.</strong></p>
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: dto.candidateEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
        this.logger.log(`Application confirmation email successfully sent to ${dto.candidateEmail} (App ID: ${dto.applicationId}) via SMTP`);
      } else {
        this.logger.warn(`SMTP Transporter unavailable. Logged confirmation email trigger for ${dto.candidateEmail}`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to send application confirmation email to ${dto.candidateEmail}: ${err.message}`);
    }
  }
}
