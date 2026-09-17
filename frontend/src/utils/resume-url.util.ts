import { toast } from 'sonner';

/**
 * Returns the backend base server URL dynamically resolved from .env or window.location
 */
export function getBackendServerUrl(): string {
  // When running in production on a live domain (not localhost/127.0.0.1), use current live origin
  if (typeof window !== 'undefined' && window.location?.hostname && !/^localhost$|^127\.0\.0\.1$/.test(window.location.hostname)) {
    if (import.meta.env.VITE_SERVER_URL && !import.meta.env.VITE_SERVER_URL.includes('localhost') && !import.meta.env.VITE_SERVER_URL.includes('127.0.0.1')) {
      return import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
    }
    return window.location.origin;
  }

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
 * Resolves a full, clickable URL for viewing/downloading a candidate resume document.
 * Crucially routes all uploaded resumes through the backend /api/recruitment/job-openings/resumes/download/:filename
 * endpoint so nginx reverse-proxy serves the real PDF inline instead of falling back to the SPA /dashboard.
 */
export function getFullResumeUrl(resumePath?: string | null, candidateName?: string): string | null {
  if (!resumePath || typeof resumePath !== 'string') return null;
  let cleanPath = resumePath.trim();
  if (!cleanPath) return null;

  // 1. Session or local blobs
  if (cleanPath.startsWith('blob:')) {
    if (typeof window !== 'undefined' && cleanPath.startsWith(`blob:${window.location.origin}`)) {
      return cleanPath;
    }
    return null;
  }

  // 2. Data URIs
  if (cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  // 3. Reject non-resume navigation links
  if (cleanPath.includes('/recruitment/portal') || cleanPath.includes('/careers') || cleanPath.includes('/dashboard')) {
    return null;
  }

  const safeName = encodeURIComponent((candidateName || 'Candidate').replace(/\s+/g, '_'));
  const serverBase = getBackendServerUrl();

  // 4. Handle full web URLs
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    try {
      const parsed = new URL(cleanPath);
      const isLocalhost = /^localhost$|^127\.0\.0\.1$/.test(parsed.hostname);
      const isCurrentHost = typeof window !== 'undefined' && parsed.hostname === window.location.hostname;

      // Real external third-party CDN / cloud storage (AWS S3, Cloudinary, etc.)
      if (!isLocalhost && !isCurrentHost && !parsed.pathname.includes('/uploads/') && !parsed.pathname.includes('/resumes/')) {
        return cleanPath;
      }

      // If pointing to localhost or current domain with uploads/resumes path, extract pathname
      cleanPath = parsed.pathname;
    } catch {
      // Fall through
    }
  }

  // 5. Strip any query params or hashes to extract the clean file name
  const rawPathWithoutQuery = cleanPath.split('?')[0].split('#')[0];

  // 6. If already pointing to the download controller endpoint:
  if (rawPathWithoutQuery.includes('/api/recruitment/job-openings/resumes/download/')) {
    const fn = rawPathWithoutQuery.split('/api/recruitment/job-openings/resumes/download/')[1];
    if (fn) {
      const cleanFn = decodeURIComponent(fn).trim();
      return `${serverBase}/api/recruitment/job-openings/resumes/download/${encodeURIComponent(cleanFn)}?name=${safeName}`;
    }
  }

  // 7. For ANY resume file (/uploads/resumes/..., /uploads/..., /api/uploads/..., or plain filename.pdf)
  // Extract filename and ALWAYS route through the dedicated backend API download controller
  // which works 100% on live without nginx static file /dashboard SPA redirection.
  const rawFilename = rawPathWithoutQuery.split('/').pop() || rawPathWithoutQuery;
  const decodedFilename = decodeURIComponent(rawFilename).trim();

  // Guard against invalid folder names
  if (!decodedFilename || ['uploads', 'resumes', 'download', 'api'].includes(decodedFilename.toLowerCase())) {
    return null;
  }

  return `${serverBase}/api/recruitment/job-openings/resumes/download/${encodeURIComponent(decodedFilename)}?name=${safeName}`;
}

/**
 * Directly opens the candidate resume PDF in a new browser tab using an in-memory blob URL,
 * completely preventing any router/proxy fallback redirection to /dashboard.
 */
export async function openResumeInNewTab(
  resumePath?: string | null,
  candidateName?: string,
  onFallback?: () => void,
): Promise<void> {
  const directUrl = getFullResumeUrl(resumePath, candidateName);

  if (!directUrl) {
    if (onFallback) {
      onFallback();
    } else {
      toast.error('No attached resume document found for this candidate.');
    }
    return;
  }

  // If already a local blob or data URL, open directly
  if (directUrl.startsWith('blob:') || directUrl.startsWith('data:')) {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Synchronously open blank window immediately within the user click event handler
  // to avoid browser popup blockers (Safari, Chrome, Edge, Firefox) from blocking async window.open
  const newTab = window.open('about:blank', '_blank');
  if (newTab) {
    newTab.document.title = `Loading Resume - ${candidateName || 'Candidate'}`;
    newTab.document.body.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #0f172a; color: #f8fafc;">
        <div style="width: 44px; height: 44px; border: 4px solid #334155; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 18px; font-size: 15px; font-weight: 600;">Loading candidate resume document...</p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Opening original PDF inline</p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      </div>
    `;
  }

  const toastId = toast.loading('Opening candidate resume document...');

  try {
    const res = await fetch(directUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    if (newTab && !newTab.closed) {
      newTab.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }
    toast.success('Resume document opened', { id: toastId });
  } catch (err) {
    console.warn('Direct fetch to blob failed, falling back to direct window open:', err);
    toast.dismiss(toastId);
    if (newTab && !newTab.closed) {
      newTab.location.href = directUrl;
    } else {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
