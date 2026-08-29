import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Video, Plus, CheckCircle2, XCircle, Trash2, ExternalLink, RefreshCw } from 'lucide-react';

interface TeamsLinkPoolItem {
  id: string;
  linkNumber: number;
  title: string;
  meetingUrl: string;
  active: boolean;
  status: 'AVAILABLE' | 'ASSIGNED' | 'DISABLED';
  assignedCandidate?: string | null;
  assignedPosition?: string | null;
  assignedTime?: string | null;
  createdAt: string;
}

interface TeamsLinkPoolManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamsLinkPoolManagementModal({ isOpen, onClose }: TeamsLinkPoolManagementModalProps) {
  const queryClient = useQueryClient();

  const [newTitle, setNewTitle] = useState('');
  const [newMeetingUrl, setNewMeetingUrl] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Fetch Pool Links from API
  const { data: poolLinks = [], isLoading, isRefetching, refetch } = useQuery<TeamsLinkPoolItem[]>({
    queryKey: ['teams-link-pool'],
    queryFn: async () => {
      const res = await fetch('/api/recruitment/teams-links');
      if (!res.ok) throw new Error('Failed to load Teams meeting links pool');
      return res.json();
    },
    enabled: isOpen,
  });

  // Add Link Mutation
  const addLinkMutation = useMutation({
    mutationFn: async (payload: { title?: string; meetingUrl: string }) => {
      const res = await fetch('/api/recruitment/teams-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to add Teams link');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-link-pool'] });
      toast.success('New Teams meeting link added to pool!');
      setNewTitle('');
      setNewMeetingUrl('');
      setIsAddFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recruitment/teams-links/${id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-link-pool'] });
      toast.success('Teams link status updated');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Delete Link Mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recruitment/teams-links/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete link');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-link-pool'] });
      toast.success('Teams meeting link removed');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingUrl.trim() || !newMeetingUrl.includes('teams.')) {
      toast.error('Please enter a valid Microsoft Teams meeting URL');
      return;
    }
    addLinkMutation.mutate({
      title: newTitle.trim() || undefined,
      meetingUrl: newMeetingUrl.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 border border-indigo-100 dark:border-indigo-900">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Teams Meeting Link Management
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Manage reusable Microsoft Teams meeting links for automatic non-overlapping slot allocation.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Add New Link Section Toggle */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Meeting Link Pool ({poolLinks.length})
            </h4>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Teams Link
            </Button>
          </div>

          {/* Add Link Collapsible Form */}
          {isAddFormOpen && (
            <form onSubmit={handleAddSubmit} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Add New Teams Meeting Link</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Link Title (Optional)</Label>
                  <Input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Teams Room 6"
                    className="h-9 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs font-semibold">Microsoft Teams Meeting URL *</Label>
                  <Input
                    type="text"
                    value={newMeetingUrl}
                    onChange={(e) => setNewMeetingUrl(e.target.value)}
                    placeholder="https://teams.live.com/meet/..."
                    className="h-9 text-xs font-mono bg-background"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddFormOpen(false)} className="h-8 text-xs">
                  Cancel
                </Button>

                <Button type="submit" size="sm" disabled={addLinkMutation.isPending} className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                  {addLinkMutation.isPending ? 'Saving...' : 'Save Link to Pool'}
                </Button>
              </div>
            </form>
          )}

          {/* Link Pool Table */}
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading Teams links pool...</div>
          ) : poolLinks.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed rounded-xl">
              <p className="text-xs text-slate-500 font-medium">No Teams meeting links found in pool.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddFormOpen(true)} className="h-8 text-xs">
                Add First Teams Link
              </Button>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4">Title & Meeting URL</th>
                    <th className="py-3 px-3 text-center">Pool Status</th>
                    <th className="py-3 px-4">Current / Next Assignment</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {poolLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {link.linkNumber}
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {link.title}
                        </div>
                        <a
                          href={link.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[280px]"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{link.meetingUrl}</span>
                        </a>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            link.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : link.status === 'ASSIGNED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {link.status === 'AVAILABLE' && <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />}
                          {link.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {link.assignedCandidate ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-white">{link.assignedCandidate}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {link.assignedPosition} • {link.assignedTime}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned / Ready for slot</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate(link.id)}
                            className={`h-7 px-2 text-[11px] font-semibold ${
                              link.active ? 'text-slate-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                          >
                            {link.active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove ${link.title} from meeting pool?`)) {
                                deleteLinkMutation.mutate(link.id);
                              }
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Link Pool prevents overlapping interview bookings automatically.
          </p>
          <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
            Done / Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
