import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Mail,
  Send,
  Sparkles,
  Cake,
  Award,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Briefcase,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { employeesApi } from '@/api/employees';
import type { MilestoneItem } from './EmployeeReportsTab';

interface SendMilestoneWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: MilestoneItem | null;
}

type TemplateKey = 'friendly' | 'formal' | 'festive' | 'inspirational';

export function SendMilestoneWishModal({
  isOpen,
  onClose,
  milestone,
}: SendMilestoneWishModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('friendly');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to generate template texts based on milestone type
  const getTemplateContent = (key: TemplateKey, item: MilestoneItem): { subject: string; message: string } => {
    const isBday = item.type === 'birthday';
    const first = item.firstName || item.fullName || 'Colleague';
    const full = item.fullName || first;
    const years = item.yearsCount || 1;

    if (isBday) {
      switch (key) {
        case 'friendly':
          return {
            subject: `🎉 Happy Birthday, ${first}! Wishing you a wonderful day!`,
            message: `Dear ${first},\n\nWishing you a very Happy Birthday! 🎉 May your special day be filled with happiness, laughter, and great moments. We are so lucky to have you on our team!\n\nHave a fantastic celebration and a rewarding year ahead!`,
          };
        case 'formal':
          return {
            subject: `Warm Birthday Wishes on Behalf of Management & Team`,
            message: `Dear ${full},\n\nOn behalf of the entire management and colleagues at the organization, I would like to extend our warmest wishes on your birthday. May this coming year bring you continued professional success, good health, and personal fulfillment.\n\nWarm regards,\nManagement & HR Team`,
          };
        case 'festive':
          return {
            subject: `🎂 Happy Birthday, ${first}! Cheers to another great year! ✨`,
            message: `Happy Birthday, ${first}! 🎂🎈✨\n\nMay this year bring you endless opportunities, joy, and memorable milestones! Hope you take some time today to celebrate and treat yourself to something special!\n\nCheers to another wonderful trip around the sun! 🥳🥂`,
          };
        case 'inspirational':
          return {
            subject: `🌟 Happy Birthday, ${first}! Keep shining bright!`,
            message: `Dear ${first},\n\nYour passion, drive, and commitment inspire everyone around you. As you celebrate this milestone, may you continue to reach even greater heights in your journey ahead.\n\nWishing you an extraordinary birthday filled with inspiration and joy! 🚀`,
          };
      }
    } else {
      // Work Anniversary
      const tenureTitle = item.milestoneTitle;
      switch (key) {
        case 'friendly':
          return {
            subject: `🏆 Happy ${tenureTitle}, ${first}! Thank you for being wonderful!`,
            message: `Dear ${first},\n\nCongratulations on completing ${years} incredible year${years > 1 ? 's' : ''} with us! 🏆 Thank you for your continued dedication, positivity, and wonderful contributions to our team. Here's to many more milestones and shared triumphs together!`,
          };
        case 'formal':
          return {
            subject: `Congratulations on your ${tenureTitle} with the Organization`,
            message: `Dear ${full},\n\nCongratulations on reaching your ${tenureTitle}. On behalf of the leadership team, we want to express our sincere appreciation for your valuable service, professionalism, and dedication to the organization's growth. We look forward to your continued success with us.\n\nWarm regards,\nExecutive Leadership & HR Team`,
          };
        case 'festive':
          return {
            subject: `🎊 Celebrating Your ${tenureTitle}, ${first}! Cheers! 🥂`,
            message: `Happy Work Anniversary, ${first}! 🎊🥂✨\n\n${years} milestone year${years > 1 ? 's' : ''} of bringing your best energy and making great things happen! Thank you for being such an essential and wonderful part of our workplace family. Time to celebrate your remarkable journey!`,
          };
        case 'inspirational':
          return {
            subject: `🚀 Honoring Your ${tenureTitle} & Continued Impact, ${first}!`,
            message: `Dear ${first},\n\nReflecting on your journey with us on your ${tenureTitle}, your achievements, resilience, and growth have made a lasting impact across our team. Thank you for setting an inspiring benchmark of excellence and loyalty!\n\nHere's to conquering even bigger horizons together! 🌟`,
          };
      }
    }
  };

  // Synchronize initial state whenever modal opens or selected milestone changes
  useEffect(() => {
    if (milestone && isOpen) {
      const email = milestone.workEmail || (milestone as any).personalEmail || '';
      setRecipientEmail(email);
      const initialTemplate = getTemplateContent('friendly', milestone);
      setSelectedTemplate('friendly');
      setSubject(initialTemplate.subject);
      setMessage(initialTemplate.message);
      setCopied(false);
    }
  }, [milestone, isOpen]);

  // Handle switching preset template
  const handleSelectTemplate = (templateKey: TemplateKey) => {
    if (!milestone) return;
    setSelectedTemplate(templateKey);
    const t = getTemplateContent(templateKey, milestone);
    setSubject(t.subject);
    setMessage(t.message);
  };

  if (!milestone) return null;

  const isBday = milestone.type === 'birthday';
  const initials = ((milestone.firstName?.[0] || '') + (milestone.lastName?.[0] || '')).toUpperCase() || 'EMP';

  // 1. Send via System SMTP
  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject line cannot be empty.');
      return;
    }
    if (!message.trim()) {
      toast.error('Celebration message cannot be empty.');
      return;
    }

    try {
      setIsSending(true);
      const res = await employeesApi.sendMilestoneWish({
        employeeId: milestone.employeeId,
        recipientEmail: recipientEmail.trim(),
        recipientName: milestone.fullName,
        milestoneType: milestone.type,
        milestoneTitle: milestone.milestoneTitle,
        subject: subject.trim(),
        message: message.trim(),
      });

      toast.success(res?.message || `Celebration email sent to ${recipientEmail}!`, {
        description: `${milestone.milestoneTitle} greeting delivered via SMTP mailer.`,
      });
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to dispatch email';
      toast.error('Email Dispatch Failed', {
        description: errMsg,
      });
    } finally {
      setIsSending(false);
    }
  };

  // 2. Open via Mail Client (mailto:)
  const handleOpenMailClient = () => {
    if (!recipientEmail) {
      toast.error('Recipient email is missing.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, '_blank');
    toast.info('Opened in your email client');
  };

  // 3. Copy to Clipboard
  const handleCopyGreeting = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`${subject}\n\n${message}`);
      setCopied(true);
      toast.success('Celebration greeting copied to clipboard!', {
        description: 'Ready to paste into MS Teams, Slack, or WhatsApp.',
      });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border shadow-2xl">
        {/* Festive Header Banner */}
        <div
          className={`p-5 text-white relative overflow-hidden ${
            isBday
              ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600'
              : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
          }`}
        >
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 shadow-xs">
                {isBday ? <Cake className="h-6 w-6" /> : <Award className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  Send Celebration Wish
                  <Sparkles className="h-4 w-4 text-amber-200" />
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs mt-0.5">
                  Send a personalized email greeting for {milestone.fullName}'s {milestone.milestoneTitle}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="bg-white/20 text-white border-white/30 text-xs font-semibold px-2.5 py-1 whitespace-nowrap"
            >
              {milestone.formattedDate}
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Employee Recipient Summary Card */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/70">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs ${
                  isBday
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-foreground truncate">{milestone.fullName}</p>
                <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground mt-0.5">
                  <span className="font-mono">{milestone.employeeCode}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 text-muted-foreground/70" />
                    {milestone.departmentName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <Briefcase className="h-3 w-3 text-muted-foreground/70" />
                    {milestone.designationTitle}
                  </span>
                </div>
              </div>
            </div>

            <Badge
              className={`text-[10.5px] font-bold shrink-0 ${
                isBday
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
              variant="outline"
            >
              {milestone.milestoneTitle}
            </Badge>
          </div>

          {/* Recipient Email Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipientEmail" className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Recipient Email
              </Label>
              {!recipientEmail && (
                <span className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3 w-3" /> No email saved on profile
                </span>
              )}
            </div>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="e.g. employee@company.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="h-8.5 text-xs font-mono"
            />
          </div>

          {/* Preset Greeting Templates Pills */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Templates
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { key: 'friendly', label: '🌟 Friendly', desc: 'Warm & Casual' },
                { key: 'formal', label: '👔 Formal', desc: 'Executive / HR' },
                { key: 'festive', label: '🎉 Festive', desc: 'High Energy' },
                { key: 'inspirational', label: '🚀 Inspired', desc: 'Growth & Impact' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleSelectTemplate(t.key as TemplateKey)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedTemplate === t.key
                      ? isBday
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold shadow-2xs'
                        : 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold shadow-2xs'
                      : 'border-border/80 hover:border-border hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className="text-[9.5px] opacity-75 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Line Input */}
          <div className="space-y-1.5">
            <Label htmlFor="wishSubject" className="text-xs font-semibold">
              Subject Line
            </Label>
            <Input
              id="wishSubject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-8.5 text-xs font-medium"
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="wishMessage" className="text-xs font-semibold">
                Celebration Message Body
              </Label>
              <button
                type="button"
                onClick={handleCopyGreeting}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <Textarea
              id="wishMessage"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs leading-relaxed resize-none font-sans"
              placeholder="Type celebration wishes..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenMailClient}
              className="h-8 text-xs font-semibold gap-1.5 flex-1 sm:flex-initial"
              title="Open draft in Outlook or your desktop email client"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mail Client</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyGreeting}
              className="h-8 text-xs font-semibold gap-1.5 flex-1 sm:flex-initial"
              title="Copy message to paste in Microsoft Teams, Slack, or WhatsApp"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSending}
              className="h-8 text-xs font-medium"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSendEmail}
              disabled={isSending || !recipientEmail}
              className={`h-8 text-xs font-bold gap-1.5 shadow-xs transition-all ${
                isBday
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending via SMTP...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Email Wish</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
