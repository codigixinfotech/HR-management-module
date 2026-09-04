export interface PortalNotification {
  id: string;
  type: 'TRAINING' | 'INTERVIEW' | 'LEAVE' | 'ATTENDANCE' | 'SYSTEM';
  employeeId: string;
  employeeName: string;
  title: string;
  message: string;
  programId?: string;
  programCode?: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  sender?: string;
}

export interface EmailDispatchLog {
  id: string;
  programId: string;
  programCode: string;
  programName: string;
  recipientCount: number;
  recipients: { name: string; email: string }[];
  subject: string;
  body: string;
  status: 'SENT' | 'FAILED';
  sentAt: string;
  senderName: string;
}

const NOTIF_KEY = 'ehcm_portal_notifications';
const EMAIL_LOG_KEY = 'ehcm_email_dispatches';

export const notificationStore = {
  // Get all portal notifications
  getNotifications(): PortalNotification[] {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Get notifications for a specific employee ID (or all if empty)
  getNotificationsForUser(employeeId?: string): PortalNotification[] {
    const all = this.getNotifications();
    if (!employeeId) return all;
    return all.filter((n) => !n.employeeId || n.employeeId === employeeId);
  },

  // Get unread count for user
  getUnreadCount(employeeId?: string): number {
    const list = this.getNotificationsForUser(employeeId);
    return list.filter((n) => !n.read).length;
  },

  // Check if notification already sent for a program ID
  getProgramNotificationHistory(programId: string): PortalNotification[] {
    return this.getNotifications().filter((n) => n.programId === programId);
  },

  // Add multiple portal notifications (e.g. for employee roster)
  addNotifications(newNotifs: Omit<PortalNotification, 'id' | 'createdAt' | 'read'>[]): PortalNotification[] {
    const current = this.getNotifications();
    const created: PortalNotification[] = newNotifs.map((item, index) => ({
      ...item,
      id: `NOTIF-${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
      read: false,
    }));
    const updated = [...created, ...current];
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    return updated;
  },

  // Mark notification as read
  markAsRead(id: string) {
    const current = this.getNotifications();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  },

  // Mark all notifications as read for a user
  markAllAsRead() {
    const current = this.getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  },

  // Clear all notifications
  clearAll() {
    localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
  },

  // Dispatch Email Logs
  getEmailLogs(): EmailDispatchLog[] {
    const raw = localStorage.getItem(EMAIL_LOG_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Get email logs for a program
  getProgramEmailLogs(programId: string): EmailDispatchLog[] {
    return this.getEmailLogs().filter((l) => l.programId === programId);
  },

  // Record an email dispatch log
  addEmailDispatchLog(log: Omit<EmailDispatchLog, 'id' | 'sentAt'>): EmailDispatchLog {
    const logs = this.getEmailLogs();
    const newLog: EmailDispatchLog = {
      ...log,
      id: `EML-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
    const updated = [newLog, ...logs];
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(updated));
    return newLog;
  },
};
