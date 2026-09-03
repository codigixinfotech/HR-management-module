import { useState } from 'react';
import {
  Bell,
  Mail,
  Send,
  Eye,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MOCK_EMPLOYEES, type TrainingProgram } from './mockTrainingData';
import { notificationStore } from '@/utils/notificationStore';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: TrainingProgram;
  onSuccess?: () => void;
}

export function SendNotificationModal({
  isOpen,
  onClose,
  program,
  onSuccess,
}: SendNotificationModalProps) {
  const existingHistory = notificationStore.getProgramNotificationHistory(program.id);
  const isAlreadySent = existingHistory.length > 0;

  const assignedEmployees = program.employeeStatuses?.length
    ? program.employeeStatuses
    : MOCK_EMPLOYEES.slice(0, program.employeeCount || 4).map((e) => ({
        employeeId: e.id,
        employeeName: e.name,
        department: e.department,
        grade: e.grade,
        status: 'Assigned' as const,
        attendancePercent: 0,
      }));

  const defaultMsg = `You have been assigned to ${program.name} (${program.code}).\nDate: ${program.startDate}\nTime: ${program.startTime} – ${program.endTime}\nMode: ${program.deliveryMode}\nTrainer: ${program.trainer}\n\nPlease open your Learning Portal to view training details and complete assigned activity.`;

  const [message, setMessage] = useState(defaultMsg);

  const handleSendNotification = () => {
    const notifs = assignedEmployees.map((emp) => ({
      type: 'TRAINING' as const,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      title: `New Training Assigned: ${program.name}`,
      message: message.trim(),
      programId: program.id,
      programCode: program.code,
      actionUrl: '/learning/training-programs',
      sender: 'EHCM L&D HR Team',
    }));

    notificationStore.addNotifications(notifs);

    toast.success(`🔔 Portal Notification Sent! ${assignedEmployees.length} assigned employees notified on Employee Portal.`, {
      duration: 5000,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> SEND PORTAL NOTIFICATION
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send an in-app portal alert to all assigned employees' bell notification center and dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Duplicate Check Warning */}
          {isAlreadySent && (
            <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-1 text-amber-800 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Notification Already Sent
              </p>
              <p className="text-[11px]">
                {existingHistory.length} employee notifications were dispatched on{' '}
                <strong>{new Date(existingHistory[0].createdAt).toLocaleString()}</strong>.
              </p>
            </div>
          )}

          {/* Program Header */}
          <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{program.name}</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {program.code}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span>Recipients: <strong className="text-foreground">{assignedEmployees.length} Assigned Employees</strong></span>
              <span>•</span>
              <span>Mode: <strong className="text-foreground">{program.deliveryMode}</strong></span>
            </div>
          </div>

          {/* Assigned Roster Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Target Roster ({assignedEmployees.length})</span>
              <span className="text-[10px] text-muted-foreground font-normal">Auto-assigned</span>
            </Label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-muted/20 border rounded-md">
              {assignedEmployees.map((emp) => (
                <Badge key={emp.employeeId} variant="secondary" className="text-[10px] bg-background border">
                  {emp.employeeName} ({emp.employeeId})
                </Badge>
              ))}
            </div>
          </div>

          {/* Notification Message Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Notification Message *</Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs font-sans"
              placeholder="Enter training notification message..."
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSendNotification} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Bell className="h-3.5 w-3.5" />
            {isAlreadySent ? 'Send Again' : 'Send Notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: TrainingProgram;
  onSuccess?: () => void;
}

export function SendEmailModal({
  isOpen,
  onClose,
  program,
  onSuccess,
}: SendEmailModalProps) {
  const existingEmailLogs = notificationStore.getProgramEmailLogs(program.id);
  const isAlreadySent = existingEmailLogs.length > 0;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const assignedEmployees = program.employeeStatuses?.length
    ? program.employeeStatuses
    : MOCK_EMPLOYEES.slice(0, program.employeeCount || 4).map((e) => ({
        employeeId: e.id,
        employeeName: e.name,
        department: e.department,
        grade: e.grade,
        status: 'Assigned' as const,
        attendancePercent: 0,
      }));

  const recipientEmails = assignedEmployees.map((emp) => {
    const cleanName = emp.employeeName.toLowerCase().replace(/\s+/g, '.');
    return {
      name: emp.employeeName,
      email: `${cleanName}@codigix.com`,
    };
  });

  const [subject, setSubject] = useState(`Training Assignment – ${program.name}`);

  const handleSendEmail = () => {
    const bodyContent = `Hello Employee,\n\nYou have been assigned to ${program.name} (${program.code}).\nDate: ${program.startDate}\nTime: ${program.startTime} – ${program.endTime}\nMode: ${program.deliveryMode}\nTrainer: ${program.trainer}\n\nPlease log in to your Employee Portal to view details.`;

    notificationStore.addEmailDispatchLog({
      programId: program.id,
      programCode: program.code,
      programName: program.name,
      recipientCount: recipientEmails.length,
      recipients: recipientEmails,
      subject,
      body: bodyContent,
      status: 'SENT',
      senderName: 'EHCM L&D HR Team',
    });

    toast.success(`✓ Email Sent Successfully! ${recipientEmails.length} training assignment emails dispatched.`, {
      duration: 5000,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> EMAIL DISPATCH
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send training assignment emails directly to all assigned employees' official email inboxes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Duplicate Email Alert */}
            {isAlreadySent && (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-1 text-amber-800 dark:text-amber-300">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Email Already Dispatched
                </p>
                <p className="text-[11px]">
                  Email was already dispatched to <strong>{existingEmailLogs[0].recipientCount} employees</strong> on{' '}
                  <strong>{new Date(existingEmailLogs[0].sentAt).toLocaleString()}</strong>.
                </p>
              </div>
            )}

            {/* Program Brief */}
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{program.name}</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {program.code}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Recipients: <strong className="text-foreground">{recipientEmails.length} Assigned Employees</strong>
              </p>
            </div>

            {/* To Email Recipients List */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">To (Recipients)</Label>
              <div className="p-2.5 bg-muted/30 border rounded-md max-h-24 overflow-y-auto space-y-1 font-mono text-[11px]">
                {recipientEmails.map((r, i) => (
                  <p key={i} className="text-foreground flex items-center justify-between">
                    <span>{r.name}</span>
                    <span className="text-muted-foreground">&lt;{r.email}&gt;</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Email Subject Line */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject Line *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="gap-1.5 text-xs text-primary border-primary/30"
            >
              <Eye className="h-3.5 w-3.5" /> Preview Email
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendEmail} className="gap-1.5 text-xs bg-primary text-primary-foreground">
                <Send className="h-3.5 w-3.5" />
                {isAlreadySent ? 'Send Again' : 'Send Email'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Preview Popup Modal */}
      <EmailPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        program={program}
        recipientName={recipientEmails[0]?.name || 'Sanika Shelke'}
        recipientEmail={recipientEmails[0]?.email || 'sanika.shelke@codigix.com'}
        subject={subject}
        onSendEmail={() => {
          setIsPreviewOpen(false);
          handleSendEmail();
        }}
      />
    </>
  );
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: TrainingProgram;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  onSendEmail: () => void;
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  program,
  recipientName,
  recipientEmail,
  subject,
  onSendEmail,
}: EmailPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> EMAIL PREVIEW
          </DialogTitle>
          <DialogDescription className="text-xs">
            Live sample preview of the email rendered for {recipientName}.
          </DialogDescription>
        </DialogHeader>

        {/* Email Template Box */}
        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-4 text-xs font-sans">
          {/* Email Header */}
          <div className="space-y-1.5 border-b pb-3 text-[11px] text-muted-foreground font-mono">
            <p><strong>From:</strong> EHCM L&D HR Team &lt;hr@codigix.com&gt;</p>
            <p><strong>To:</strong> {recipientName} &lt;{recipientEmail}&gt;</p>
            <p><strong>Subject:</strong> {subject}</p>
          </div>

          {/* Email Body Card */}
          <div className="space-y-3 pt-1 text-foreground leading-relaxed">
            <p className="font-semibold text-sm">Hello {recipientName},</p>
            <p>You have been assigned to the following employee training program:</p>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> {program.name}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                <p>📅 <strong>Date:</strong> {program.startDate}</p>
                <p>⏰ <strong>Time:</strong> {program.startTime} – {program.endTime}</p>
                <p>📍 <strong>Mode:</strong> {program.deliveryMode} ({program.location})</p>
                <p>👤 <strong>Trainer:</strong> {program.trainer}</p>
              </div>
            </div>

            <p className="text-muted-foreground text-[11px]">
              Please log in to your EHCM Employee Self-Service Portal to access full training materials and schedule information.
            </p>

            <div className="pt-2">
              <span className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                Open My Training →
              </span>
            </div>

            <div className="border-t pt-3 text-[11px] text-muted-foreground">
              <p>Regards,</p>
              <p className="font-bold text-foreground">EHCM HR / Learning & Development Team</p>
              <p>Codigix Infotech Pvt Ltd</p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Preview
          </Button>
          <Button size="sm" onClick={onSendEmail} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Send className="h-3.5 w-3.5" /> Send Email Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
