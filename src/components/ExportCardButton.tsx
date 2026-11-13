import { useState } from 'react';
import { toPng } from 'html-to-image';
import { Image, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportCardButtonProps {
  targetElementId: string;
  filename?: string;
  label?: string;
  className?: string;
}

export function ExportCardButton({
  targetElementId,
  filename = 'finlens_verdict_card.png',
  label = 'Export Card (PNG)',
  className,
}: ExportCardButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    const node = document.getElementById(targetElementId);
    if (!node) {
      alert(`Export target #${targetElementId} not found`);
      return;
    }

    try {
      setIsExporting(true);

      // Ensure fonts and icons have rendered
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        filter: (domNode: HTMLElement) => {
          // Exclude buttons or interactive elements from the exported screenshot if marked with data-export-ignore
          if (domNode.classList && domNode.classList.contains('export-ignore')) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Could not export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className={`h-8 gap-1.5 text-xs font-semibold rounded-xl border-border/70 text-muted-foreground hover:text-foreground transition-all ${className}`}
      title="Export high-resolution comparison snapshot with watermark"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Generating PNG...</span>
        </>
      ) : copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Card Saved!</span>
        </>
      ) : (
        <>
          <Image className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
