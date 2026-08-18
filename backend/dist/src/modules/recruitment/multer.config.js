"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.candidateResumeStorage = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const uploadDir = './uploads/resumes';
if (!(0, fs_1.existsSync)(uploadDir)) {
    (0, fs_1.mkdirSync)(uploadDir, { recursive: true });
}
exports.candidateResumeStorage = (0, multer_1.diskStorage)({
    destination: uploadDir,
    filename: (_req, file, callback) => {
        callback(null, `resume-${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname)}`);
    },
});
//# sourceMappingURL=multer.config.js.map