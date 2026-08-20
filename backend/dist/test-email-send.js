"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = __importStar(require("nodemailer"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '.env') });
async function runTest() {
    console.log('--- STARTING GMAIL SMTP END-TO-END TEST ---');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'reactjscodigix@gmail.com';
    const passRaw = process.env.SMTP_PASSWORD || 'sano ezdn gqta tkfv';
    const pass = passRaw.replace(/\s+/g, '');
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'reactjscodigix@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || 'E-HCM Platform';
    const recipient = 'motesanika@gmail.com';
    console.log(`SMTP Host: ${host}:${port}`);
    console.log(`SMTP User: ${user}`);
    console.log(`SMTP App Password Length: ${pass.length} chars (Sanitized)`);
    console.log(`Target Recipient: ${recipient}`);
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });
    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('✓ SMTP Connection & App Password Authentication Successful!');
        const pdfBuffer = Buffer.from(`
================================================================================
                      EHCM PLATFORM - ENTERPRISE SUITE
                  Codigix Infotech Global HR Operations
================================================================================
Ref No: OFR-2026-TEST
Date: ${new Date().toLocaleDateString('en-GB')}

To:
Candidate Name: Sanu Mote
Email: ${recipient}
Position: Product Designer
Requisition Code: JR-2026-001
Interview Code: INT-2026-005

--------------------------------------------------------------------------------
                     OFFICIAL LETTER OF EMPLOYMENT OFFER
--------------------------------------------------------------------------------

Dear Sanu Mote,

We are pleased to extend this formal offer of employment for the position of
Product Designer at EHCM Platform (Codigix Infotech).

Offered Annual CTC: ₹24,00,000 / yr
Proposed Joining Date: 20 Sep 2026
Work Location: Pune HQ - Executive Suite

Authorized HR Signatory
Codigix Infotech Enterprise Suite
================================================================================
`, 'utf-8');
        console.log('Sending real email with Offer_Letter_Sanu_Mote.pdf attachment...');
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient,
            subject: 'Job Offer – Product Designer – E-HCM Platform (Verification Test)',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">E-HCM Platform — Offer Verification Test</h2>
          <p>Dear <strong>Sanu Mote</strong>,</p>
          <p>This is a real live verification email sent from E-HCM Platform via Gmail SMTP.</p>
          <p>Please find your attached official Offer Letter PDF (<code>Offer_Letter_Sanu_Mote.pdf</code>).</p>
          <br/>
          <p>Regards,<br/><strong>HR Operations Team</strong></p>
        </div>
      `,
            attachments: [
                {
                    filename: 'Offer_Letter_Sanu_Mote.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });
        console.log('--------------------------------------------------');
        console.log('EMAIL SENT: YES');
        console.log('SMTP Response:', info.response);
        console.log('Message ID:', info.messageId);
        console.log('Offer Status -> SENT');
        console.log('--------------------------------------------------');
    }
    catch (err) {
        console.error('--------------------------------------------------');
        console.error('EMAIL SENT: NO');
        console.error('Technical Reason:', err.message);
        console.error('--------------------------------------------------');
    }
}
runTest();
//# sourceMappingURL=test-email-send.js.map