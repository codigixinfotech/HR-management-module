import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import { jobOpeningsApi, candidatesApi } from '@/api/recruitment';
import type { Candidate, CandidateStage } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';

const STAGES: CandidateStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'];

const candidateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});
type CandidateFormValues = z.infer<typeof candidateSchema>;

export default function JobOpeningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: opening, isLoading } = useQuery({
    queryKey: ['job-opening', id],
    queryFn: () => jobOpeningsApi.get(id!),
    enabled: !!id,
  });

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
  });

  const addCandidateMutation = useMutation({
    mutationFn: (values: CandidateFormValues) => jobOpeningsApi.addCandidate(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-opening', id] });
      toast.success('Candidate added');
      setOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const stageMutation = useMutation({
    mutationFn: ({ candidateId, stage }: { candidateId: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(candidateId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-opening', id] });
    },
  });

  if (isLoading || !opening) {
    return <p className="text-sm text-muted-foreground">Loading job opening...</p>;
  }

  const candidatesByStage = (opening.candidates ?? []).reduce<Record<string, Candidate[]>>((acc, c) => {
    acc[c.stage] = acc[c.stage] ?? [];
    acc[c.stage].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/recruitment">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold ">{opening.title}</h1>
          <p className="text-sm text-muted-foreground">
            {opening.department?.name ?? 'Unassigned'} &middot; {opening.numPositions} position(s)
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-1.5 h-4 w-4" /> Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Candidate</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => addCandidateMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input {...form.register('firstName')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input {...form.register('lastName')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...form.register('email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...form.register('phone')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addCandidateMutation.isPending}>
                  Add candidate
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-[220px] space-y-2">
            <div className="flex items-center justify-between">
              <StatusBadge status={stage} className="text-[10px]" />
              <span className="text-xs font-medium text-muted-foreground">{candidatesByStage[stage]?.length ?? 0}</span>
            </div>
            <div className="space-y-2">
              {candidatesByStage[stage]?.map((candidate) => (
                <Card key={candidate.id}>
                  <CardContent className="space-y-2 p-3">
                    <p className="text-sm font-medium">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                    <Select
                      value={candidate.stage}
                      onValueChange={(v) => stageMutation.mutate({ candidateId: candidate.id, stage: v as CandidateStage })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
