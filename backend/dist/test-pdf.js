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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateOfferPdfContent(dto) {
    const sanitize = (text) => text.replace(/[\(\)\\]/g, ' ');
    const dateStr = new Date().toLocaleDateString('en-GB');
    const candName = sanitize(dto.candidateName || 'Sanu Mote');
    const pos = sanitize(dto.position || 'Product Designer');
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
const samplePdf = generateOfferPdfContent({
    offerId: 'OFR-2026-001',
    candidateName: 'Sanu Mote',
    candidateEmail: 'motesanika@gmail.com',
    position: 'Product Designer',
    ctc: 'Rs. 24,00,000 / yr',
});
fs.writeFileSync(path.join(__dirname, 'sample_offer.pdf'), samplePdf);
console.log('PDF generated successfully! Magic bytes:', samplePdf.subarray(0, 8).toString('utf-8'));
//# sourceMappingURL=test-pdf.js.map