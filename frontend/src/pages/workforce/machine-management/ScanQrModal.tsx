import React, { useState } from 'react';
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
import { QrCode, Search, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { machineManagementApi, type Machine } from '@/api/machine-management';

interface ScanQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMachineFound: (machine: Machine) => void;
}

export function ScanQrModal({
  open,
  onOpenChange,
  onMachineFound,
}: ScanQrModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error('Please enter a Machine Code, QR Token, or scan URL');
      return;
    }

    setLoading(true);
    try {
      // 1. If it's a full URL containing ?qr= or /scan/
      let qrToken = trimmed;
      if (trimmed.includes('?qr=')) {
        const urlParams = new URLSearchParams(trimmed.split('?')[1]);
        qrToken = urlParams.get('qr') || trimmed;
      } else if (trimmed.includes('/scan/')) {
        qrToken = trimmed.split('/scan/')[1].split('?')[0];
      }

      // If it looks like a qr token
      if (qrToken.startsWith('qr_')) {
        const machine = await machineManagementApi.scanQrToken(qrToken);
        toast.success(`Found machine: ${machine.machineCode} - ${machine.machineName}`);
        onMachineFound(machine);
        onOpenChange(false);
        setQuery('');
        return;
      }

      // Otherwise try finding by machine code or id
      const all = await machineManagementApi.listMachines({ search: trimmed });
      const matched = all.find(
        (m) =>
          m.machineCode.toLowerCase() === trimmed.toLowerCase() ||
          m.qrToken === trimmed ||
          m.id === trimmed
      );

      if (matched) {
        toast.success(`Found machine: ${matched.machineCode} - ${matched.machineName}`);
        onMachineFound(matched);
        onOpenChange(false);
        setQuery('');
      } else {
        toast.error(`No machine found matching "${trimmed}"`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            Scan / Search Machine QR
          </DialogTitle>
          <DialogDescription className="text-xs">
            Scan with your handheld barcode scanner, paste the QR URL, or type the Machine Code to immediately view operational details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLookup} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="qrInput" className="text-xs font-semibold">
              Machine Code, Token, or Scanned URL
            </Label>
            <div className="relative">
              <Input
                id="qrInput"
                placeholder="e.g. CNC-001 or qr_a8f9c1..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="pl-9 text-xs"
              />
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="bg-muted/30 border border-border/80 rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2.5">
            <Cpu className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              Shop floor devices equipped with physical 2D barcode/QR guns can scan directly into this input box.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !query.trim()}
              className="gap-1.5 shadow-2xs font-medium"
            >
              <Search className="h-3.5 w-3.5" />
              {loading ? 'Searching...' : 'Lookup Machine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
