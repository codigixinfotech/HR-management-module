import { EmptyState } from '@/components/ui/empty-state';

export function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return <EmptyState title={title} description={description} badge="Coming soon" />;
}
