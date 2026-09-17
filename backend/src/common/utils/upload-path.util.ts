import { existsSync, mkdirSync } from 'fs';
import { isAbsolute, join, basename, resolve } from 'path';

/**
 * Utility for resolving, configuring, and accessing upload storage paths dynamically via .env
 */

/**
 * Returns the normalized root upload directory configured via process.env.UPLOAD_DIR
 * Checks current working directory and common deployment layouts, creating the directory if needed.
 */
export function getUploadsRootDir(): string {
  const envUploadDir = (process.env.UPLOAD_DIR || 'uploads').trim().replace(/^["']|["']$/g, '');

  if (isAbsolute(envUploadDir)) {
    if (!existsSync(envUploadDir)) {
      mkdirSync(envUploadDir, { recursive: true });
    }
    return envUploadDir;
  }

  // 1. Direct path in cwd
  const directCwd = resolve(process.cwd(), envUploadDir);
  if (existsSync(directCwd)) {
    return directCwd;
  }

  // 2. Nested under backend/ in cwd (e.g. monorepo root)
  const nestedBackend = resolve(process.cwd(), 'backend', envUploadDir);
  if (existsSync(nestedBackend)) {
    return nestedBackend;
  }

  // 3. Relative to compiled / src bundle
  const relativeToModule = resolve(__dirname, '..', '..', '..', envUploadDir);
  if (existsSync(relativeToModule)) {
    return relativeToModule;
  }

  // 4. Linux VPS standard deployment directory (/var/www/HR-management-module)
  const vpsBackendDir = resolve('/var/www/HR-management-module/backend', envUploadDir);
  if (existsSync(vpsBackendDir)) {
    return vpsBackendDir;
  }

  // Default target: prefer nested backend folder if in workspace root, otherwise cwd
  const targetDir = existsSync(resolve(process.cwd(), 'backend')) ? nestedBackend : directCwd;
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

/**
 * Returns the resolved path for an upload subdirectory (e.g. resumes, hr-policies, employee-documents).
 * Automatically ensures the subdirectory exists.
 */
export function getUploadSubdir(subfolder: string): string {
  const root = getUploadsRootDir();
  const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_\-]/g, '');
  const subDir = join(root, safeSubfolder);
  if (!existsSync(subDir)) {
    mkdirSync(subDir, { recursive: true });
  }
  return subDir;
}

/**
 * Dynamically resolves a physical file path across the configured upload directory and fallbacks.
 * Returns the verified file path if it exists on disk, or the standard target path.
 */
export function resolveUploadedFile(subfolder: string, filename: string): string | null {
  if (!filename || typeof filename !== 'string') return null;

  const safeFilename = basename(filename.trim());
  const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_\-]/g, '');
  const envUploadDir = (process.env.UPLOAD_DIR || 'uploads').trim().replace(/^["']|["']$/g, '');

  // 1. Check primary configured subfolder
  const primaryPath = join(getUploadSubdir(safeSubfolder), safeFilename);
  if (existsSync(primaryPath)) {
    return primaryPath;
  }

  // 2. Fallback check: cwd/<envUploadDir>/<subfolder>/<filename>
  const fallbackCwd = resolve(process.cwd(), envUploadDir, safeSubfolder, safeFilename);
  if (existsSync(fallbackCwd)) {
    return fallbackCwd;
  }

  // 3. Fallback check: cwd/backend/<envUploadDir>/<subfolder>/<filename>
  const fallbackBackend = resolve(process.cwd(), 'backend', envUploadDir, safeSubfolder, safeFilename);
  if (existsSync(fallbackBackend)) {
    return fallbackBackend;
  }

  // 4. Fallback check: bundle root <envUploadDir>/<subfolder>/<filename>
  const fallbackBundle = resolve(__dirname, '..', '..', '..', envUploadDir, safeSubfolder, safeFilename);
  if (existsSync(fallbackBundle)) {
    return fallbackBundle;
  }

  // 5. Fallback check: directly in uploads root without subfolder
  const rootPath = join(getUploadsRootDir(), safeFilename);
  if (existsSync(rootPath)) {
    return rootPath;
  }

  // 6. Linux VPS deployment paths (/var/www/HR-management-module)
  const vpsBackendFile = resolve('/var/www/HR-management-module/backend', envUploadDir, safeSubfolder, safeFilename);
  if (existsSync(vpsBackendFile)) {
    return vpsBackendFile;
  }
  const vpsRootFile = resolve('/var/www/HR-management-module', envUploadDir, safeSubfolder, safeFilename);
  if (existsSync(vpsRootFile)) {
    return vpsRootFile;
  }

  return primaryPath;
}

/**
 * Returns the public URL path for uploaded assets
 */
export function getUploadBaseUrl(): string {
  return '/uploads';
}
