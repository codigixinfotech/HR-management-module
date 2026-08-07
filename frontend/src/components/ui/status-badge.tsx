import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'info' | 'destructive' | 'secondary';

const POSITIVE = [
  'ACTIVE',
  'APPROVED',
  'COMPLETED',
  'COMPLETE',
  'OPERATIONAL',
  'RESOLVED',
  'ON_TRACK',
  'EXCEEDED',
  'IN_TIME',
  'PAID',
  'PUBLISHED',
  'CONNECTED',
  'PASSED',
  'SUCCESS',
  'AVAILABLE',
  'PRESENT',
  'VERIFIED',
  'FILED',
];

const WARNING = [
  'PENDING',
  'PENDING_VERIFICATION',
  'NEEDS_ATTENTION',
  'IN_PROGRESS',
  'ON_HOLD',
  'ON_LEAVE',
  'HALF_DAY',
  'LATE',
  'LATE_ARRIVING',
  'DUE',
  'PARTIAL',
  'AWAITING',
  'UNDER_REVIEW',
  'DRAFT',
  'ISSUED',
  'LOW_STOCK',
];

const NEGATIVE = [
  'REJECTED',
  'FAILED',
  'CANCELLED',
  'CANCELED',
  'OVERDUE',
  'EXPIRED',
  'INACTIVE',
  'BLOCKED',
  'CRITICAL',
  'ABSENT',
  'TERMINATED',
  'DISCONNECTED',
];

const INFO = ['SCHEDULED', 'PLANNED', 'NEW', 'OPEN', 'INVITED', 'ASSIGNED'];

function toneFor(status: string): StatusTone {
  const key = status.trim().toUpperCase().replace(/\s+/g, '_');
  if (POSITIVE.includes(key)) return 'success';
  if (WARNING.includes(key)) return 'warning';
  if (NEGATIVE.includes(key)) return 'destructive';
  if (INFO.includes(key)) return 'info';
  return 'secondary';
}

const toneToVariant: Record<StatusTone, BadgeProps['variant']> = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  destructive: 'destructive',
  secondary: 'secondary',
};

const toneToDot: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
  secondary: 'bg-muted-foreground',
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
  label?: string;
  dot?: boolean;
}

export function StatusBadge({ status, label, dot = true, className, ...props }: StatusBadgeProps) {
  const tone = toneFor(status);
  return (
    <Badge variant={toneToVariant[tone]} className={cn('font-medium', className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', toneToDot[tone])} />}
      {label ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
