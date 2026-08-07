import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  className?: string;
}

export function EmptyState({ icon: Icon = Sparkles, title, description, badge, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed bg-muted/20 shadow-none', className)}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h3 className=" text-base font-semibold text-foreground">{title}</h3>
            {badge && (
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
