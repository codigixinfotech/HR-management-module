import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = './uploads/resumes';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export const candidateResumeStorage = diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    callback(null, `resume-${randomUUID()}${extname(file.originalname)}`);
  },
});
