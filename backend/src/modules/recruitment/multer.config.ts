import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { getUploadSubdir } from '../../common/utils/upload-path.util';

export const candidateResumeStorage = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, getUploadSubdir('resumes'));
  },
  filename: (_req, file, callback) => {
    callback(null, `resume-${randomUUID()}${extname(file.originalname)}`);
  },
});
