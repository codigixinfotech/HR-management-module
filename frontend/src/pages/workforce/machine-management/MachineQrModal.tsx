import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
import { Download, Printer, Copy, RefreshCw, Cpu, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { machineManagementApi, type Machine } from '@/api/machine-management';

interface MachineQrModalProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMachineUpdated?: (updated: Machine) => void;
}

export function MachineQrModal({
  machine,
  open,
  onOpenChange,
  onMachineUpdated,
}: MachineQrModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!machine) return null;

  const scanUrl = `${window.location.origin}/workforce/machine-management?qr=${encodeURIComponent(
    machine.qrToken || machine.id
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    toast.success('Machine scan link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svgElement = printRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 360, 360);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${machine.machineCode}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success(`Downloaded QR code for ${machine.machineCode}`);
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=600,height=700');
    if (!printWindow) {
      toast.error('Unable to open print preview');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Asset Tag - ${machine.machineCode}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px;
              background: #fff;
            }
            .tag-card {
              border: 2px solid #111;
              border-radius: 12px;
              padding: 24px;
              width: 320px;
              text-align: center;
            }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #555; margin-bottom: 16px; }
            .meta { font-size: 12px; margin-top: 14px; color: #333; line-height: 1.5; }
            .badge {
              display: inline-block;
              background: #111;
              color: #fff;
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 4px;
              margin-bottom: 12px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="badge">SHOP FLOOR MACHINERY</div>
            <div class="title">${machine.machineName}</div>
            <div class="subtitle">Code: <b>${machine.machineCode}</b></div>
            ${printContent.querySelector('.qr-wrapper')?.innerHTML || ''}
            <div class="meta">
              <div>Type: ${machine.machineType}</div>
              ${machine.productionLineName ? `<div>Line: ${machine.productionLineName}</div>` : ''}
              ${machine.serialNumber ? `<div>S/N: ${machine.serialNumber}</div>` : ''}
              <div style="margin-top: 8px; font-size: 10px; color: #777;">Scan QR for live status, operator & maintenance</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate this QR code? Any previously printed stickers will no longer open this machine.')) return;
    try {
      setRegenerating(true);
      const updated = await machineManagementApi.regenerateQrToken(machine.id);
      toast.success('Generated new QR code token');
      if (onMachineUpdated) onMachineUpdated(updated);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            Machine QR Asset Tag
          </DialogTitle>
          <DialogDescription className="text-xs">
            Scan to instantly view machine details, current running shift, active operator, and maintenance health.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4" ref={printRef}>
          <div className="w-full bg-muted/40 rounded-xl p-5 border border-border flex flex-col items-center text-center shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">{machine.machineName}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {machine.machineCode}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {machine.machineType} • {machine.productionLineName || 'Shop Floor'}
            </p>

            <div className="qr-wrapper bg-white p-3.5 rounded-lg shadow-sm border border-border inline-block">
              <QRCodeSVG
                value={scanUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 font-mono">
              Token: {machine.qrToken ? `${machine.qrToken.slice(0, 12)}...` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            className="text-xs gap-1.5 col-span-2 shadow-2xs font-medium"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5" />
            Print Asset Sticker
          </Button>
        </div>

        <DialogFooter className="sm:justify-between items-center pt-2 border-t mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs gap-1 h-8 px-2"
            disabled={regenerating}
            onClick={handleRegenerate}
          >
            <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate Token
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
