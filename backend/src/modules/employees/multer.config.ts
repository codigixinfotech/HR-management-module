import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import { getUploadSubdir } from '../../common/utils/upload-path.util';

export const employeeDocumentStorage = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, getUploadSubdir('employee-documents'));
  },
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});
