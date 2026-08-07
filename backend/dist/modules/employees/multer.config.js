"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeDocumentStorage = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
exports.employeeDocumentStorage = (0, multer_1.diskStorage)({
    destination: './uploads/employee-documents',
    filename: (_req, file, callback) => {
        callback(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname)}`);
    },
});
//# sourceMappingURL=multer.config.js.map