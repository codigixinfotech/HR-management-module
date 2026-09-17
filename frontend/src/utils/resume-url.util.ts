import { toast } from 'sonner';

/**
 * Returns the backend base server URL dynamically resolved from .env or window.location
 */
export function getBackendServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

/**
 * Resolves a full, clickable URL for viewing/downloading a candidate resume document
 */
export function getFullResumeUrl(resumePath?: string | null, candidateName?: string): string | null {
  if (!resumePath || typeof resumePath !== 'string') return null;
  const cleanPath = resumePath.trim();
  if (!cleanPath) return null;

  // Check for dead or local session blobs
  if (cleanPath.startsWith('blob:')) {
    if (typeof window !== 'undefined' && cleanPath.startsWith(`blob:${window.location.origin}`)) {
      return cleanPath;
    }
    return null;
  }

  if (cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  const safeName = encodeURIComponent((candidateName || 'Candidate').replace(/\s+/g, '_'));
  const serverBase = getBackendServerUrl();

  // If already full web URL
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    if (cleanPath.includes('/recruitment/portal') || cleanPath.includes('/careers')) {
      return null;
    }
    return cleanPath;
  }

  // If direct /api/recruitment/job-openings/resumes/download/...
  if (cleanPath.startsWith('/api/recruitment/job-openings/resumes/download/')) {
    const withName = cleanPath.includes('?') ? `${cleanPath}&name=${safeName}` : `${cleanPath}?name=${safeName}`;
    return `${serverBase}${withName}`;
  }

  // If general /api or /uploads
  if (cleanPath.startsWith('/api') || cleanPath.startsWith('/uploads')) {
    return `${serverBase}${cleanPath}`;
  }

  // If filename only
  const filename = cleanPath.split('/').pop() || cleanPath;
  return `${serverBase}/api/recruitment/job-openings/resumes/download/${filename}?name=${safeName}`;
}

/**
 * Directly opens the candidate resume PDF in a new browser tab.
 */
export function openResumeInNewTab(
  resumePath?: string | null,
  candidateName?: string,
  onFallback?: () => void,
): void {
  const url = getFullResumeUrl(resumePath, candidateName);

  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else if (onFallback) {
    onFallback();
  } else {
    toast.error('No attached resume document found for this candidate.');
  }
}
