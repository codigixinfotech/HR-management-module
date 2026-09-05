import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Video, Clock, BellRing, Calendar, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { interviewsApi } from '@/api/interviews';
import type { InterviewReminderItem } from '@/api/types';

interface InterviewReminderNotifierProps {
  activeEmployeeId?: string;
  activeEmployeeName?: string;
  onOpenDetails?: (interviewId: string) => void;
}

/**
 * Helper to parse interview Date & startTime string into a JavaScript Date object.
 * e.g. date: "2026-08-19" or ISO string, startTime: "11:00 AM" or "11:00"
 */
export function parseInterviewDateTime(interviewDate: string | Date, startTimeStr?: string): Date {
  const d = new Date(interviewDate);
  if (isNaN(d.getTime())) return new Date();
  if (!startTimeStr) return d;

  const timeMatch = String(startTimeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return d;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function InterviewReminderNotifier({
  activeEmployeeId,
  activeEmployeeName,
  onOpenDetails,
}: InterviewReminderNotifierProps) {
  // Track fired alerts to avoid duplicate toasts during polling
  const fired15MinRef = useRef<Set<string>>(new Set());
  const firedStartRef = useRef<Set<string>>(new Set());

  // Fetch reminders for the active interviewer persona
  const { data: reminders = [] } = useQuery({
    queryKey: ['interview-reminders', activeEmployeeId],
    queryFn: () => (activeEmployeeId ? interviewsApi.getReminders(activeEmployeeId) : []),
    enabled: Boolean(activeEmployeeId),
    refetchInterval: 15000, // Poll every 15s to guarantee timely reminders
  });

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    const now = new Date();

    reminders.forEach((rem) => {
      // Ignore if status is not SCHEDULED or IN_PROGRESS
      if (rem.status === 'COMPLETED' || rem.status === 'EVALUATED' || rem.status === 'CANCELLED') {
        return;
      }

      const scheduledTime = parseInterviewDateTime(rem.interviewDate, rem.startTime);
      const diffMs = scheduledTime.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);

      const reminderKey15 = `${rem.id}-15min-${scheduledTime.getTime()}`;
      const reminderKeyStart = `${rem.id}-start-${scheduledTime.getTime()}`;

      // 1. Trigger 15-minute prior reminder alert (between 0 and 15 mins before start)
      if (diffMins > 0 && diffMins <= 15 && !fired15MinRef.current.has(reminderKey15)) {
        fired15MinRef.current.add(reminderKey15);

        const formattedDate = scheduledTime.toLocaleDateString('en-GB');

        toast.custom(
          (t) => (
            <div className="w-full max-w-md bg-card border-2 border-primary/40 rounded-xl p-4 shadow-xl space-y-3 font-sans select-none">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <BellRing className="h-4 w-4 animate-bounce text-primary" />
                  <span>Interview Reminder (In {Math.ceil(diffMins)} Mins)</span>
                </div>
                <Badge className="bg-primary/15 text-primary text-[10px] font-mono">
                  {rem.interviewFormat}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Candidate: {rem.candidateName}
                </h4>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>Target Position: <strong>{rem.position}</strong></span>
                  <span>•</span>
                  <span>Role: <strong>{rem.panelRole}</strong></span>
                </p>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 font-mono">
                  <Calendar className="h-3 w-3 text-primary" /> {formattedDate} at {rem.startTime}
                </div>
              </div>

              {activeEmployeeName && (
                <div className="text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-emerald-600" />
                  Assigned Panelist: <strong>{activeEmployeeName}</strong>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {rem.meetingLink ? (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-primary hover:bg-primary/90 font-semibold gap-1.5 flex-1"
                    onClick={() => {
                      toast.dismiss(t);
                      window.open(
                        rem.meetingLink?.startsWith('http')
                          ? rem.meetingLink
                          : `https://${rem.meetingLink}`,
                        '_blank',
                      );
                    }}
                  >
                    <Video className="h-3.5 w-3.5" /> Join Interview Meeting
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold gap-1.5 flex-1"
                    onClick={() => {
                      toast.dismiss(t);
                      if (onOpenDetails) onOpenDetails(rem.id);
                    }}
                  >
                    View Interview Details
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => toast.dismiss(t)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ),
          { duration: 15000 },
        );
      }

      // 2. Trigger "Interview Starting Now" alert (between 0 and 30 mins after start time)
      if (diffMins <= 0 && diffMins >= -30 && !firedStartRef.current.has(reminderKeyStart)) {
        firedStartRef.current.add(reminderKeyStart);

        toast.custom(
          (t) => (
            <div className="w-full max-w-md bg-emerald-950/90 border-2 border-emerald-500 text-white rounded-xl p-4 shadow-2xl space-y-3 font-sans select-none animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Clock className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Interview Starting Now!</span>
                </div>
                <Badge className="bg-emerald-500/30 text-emerald-200 text-[10px] font-mono border-emerald-400/40">
                  LIVE NOW
                </Badge>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white">
                  Candidate: {rem.candidateName}
                </h4>
                <p className="text-xs text-emerald-200/90 flex items-center gap-2 mt-0.5">
                  <span>Position: <strong>{rem.position}</strong></span>
                  <span>•</span>
                  <span>Format: <strong>{rem.interviewFormat}</strong></span>
                </p>
                <div className="text-[11px] text-emerald-300/80 mt-1 font-mono">
                  Scheduled Time: {rem.startTime} ({rem.panelRole})
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {rem.meetingLink && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-1.5 flex-1 shadow-md"
                    onClick={() => {
                      toast.dismiss(t);
                      window.open(
                        rem.meetingLink?.startsWith('http')
                          ? rem.meetingLink
                          : `https://${rem.meetingLink}`,
                        '_blank',
                      );
                    }}
                  >
                    <Video className="h-3.5 w-3.5" /> Join Interview Meeting
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-transparent border-emerald-400/50 text-emerald-200 hover:bg-emerald-900/50"
                  onClick={() => {
                    toast.dismiss(t);
                    if (onOpenDetails) onOpenDetails(rem.id);
                  }}
                >
                  View Details
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-emerald-300/70 hover:text-white"
                  onClick={() => toast.dismiss(t)}
                >
                  Close
                </Button>
              </div>
            </div>
          ),
          { duration: 25000 },
        );
      }
    });
  }, [reminders, activeEmployeeName, onOpenDetails]);

  return null;
}

/**
 * Banner component to display active upcoming/starting-now interview reminders at top of page
 */
export function InterviewReminderBanner({
  reminders,
  activeEmployeeName,
  onOpenDetails,
}: {
  reminders: InterviewReminderItem[];
  activeEmployeeName?: string;
  onOpenDetails: (id: string) => void;
}) {
  if (!reminders || reminders.length === 0) return null;

  const now = new Date();

  // Find active reminders for today/upcoming
  const activeReminders = reminders.filter((rem) => {
    if (rem.status === 'COMPLETED' || rem.status === 'EVALUATED' || rem.status === 'CANCELLED') {
      return false;
    }
    const scheduledTime = parseInterviewDateTime(rem.interviewDate, rem.startTime);
    const diffMins = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    // Show banner if within next 60 mins or starting within last 30 mins
    return diffMins >= -30 && diffMins <= 60;
  });

  if (activeReminders.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {activeReminders.map((rem) => {
        const scheduledTime = parseInterviewDateTime(rem.interviewDate, rem.startTime);
        const diffMins = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
        const isStartingNow = diffMins <= 0 && diffMins >= -30;
        const isWithin15Mins = diffMins > 0 && diffMins <= 15;

        return (
          <div
            key={rem.id}
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
              isStartingNow
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 shadow-sm'
                : isWithin15Mins
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-200 shadow-sm'
                : 'bg-primary/10 border-primary/30 text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isStartingNow
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : isWithin15Mins
                    ? 'bg-amber-600 text-white'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <BellRing className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold">
                    {isStartingNow
                      ? '⚡ INTERVIEW STARTING NOW'
                      : isWithin15Mins
                      ? `🔔 INTERVIEW IN ${Math.ceil(diffMins)} MINS`
                      : 'UPCOMING SCHEDULED INTERVIEW'}
                  </strong>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {rem.interviewFormat}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidate: <strong className="text-foreground">{rem.candidateName}</strong> ({rem.position}) • Date & Time: <strong>{new Date(rem.interviewDate).toLocaleDateString('en-GB')}, {rem.startTime}</strong>
                </p>

                {activeEmployeeName && (
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Your Assigned Panel Role: <strong className="text-primary">{rem.panelRole}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {rem.meetingLink && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                  onClick={() =>
                    window.open(
                      rem.meetingLink?.startsWith('http')
                        ? rem.meetingLink
                        : `https://${rem.meetingLink}`,
                      '_blank',
                    )
                  }
                >
                  <Video className="h-3.5 w-3.5" /> Join Interview Meeting
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold"
                onClick={() => onOpenDetails(rem.id)}
              >
                Evaluate / View Specs
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
