import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CandidateDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (candidateId: string) => void;
  candidate: any | null;
  isDeleting?: boolean;
}

export const CandidateDeleteModal: React.FC<CandidateDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  candidate,
  isDeleting = false,
}) => {
  if (!candidate) return null;

  const candidateIdShort = candidate.id ? candidate.id.substring(0, 8) : 'CMT-2026';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xl bg-white dark:bg-slate-900 space-y-4">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-slate-900 dark:text-white">
            Confirm Candidate Deletion
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500 leading-relaxed">
            Are you sure you want to permanently delete candidate profile{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{candidate.name || `${candidate.firstName} ${candidate.lastName}`}</strong>{' '}
            (<span className="font-mono font-bold text-rose-600">{candidateIdShort}</span>)?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
          <p className="font-semibold">⚠️ Action Warning:</p>
          <p>
            Deleting this candidate will remove their job application, screening history, and evaluation records from the database. This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting} className="h-9 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => onConfirm(candidate.id)}
            className="h-9 px-5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {isDeleting ? 'Deleting...' : 'Delete Candidate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
