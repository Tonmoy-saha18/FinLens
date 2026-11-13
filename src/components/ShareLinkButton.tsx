import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareLinkButtonProps {
  getShareUrl?: () => string;
  label?: string;
  className?: string;
}

export function ShareLinkButton({
  getShareUrl,
  label = 'Share Plan',
  className,
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = getShareUrl ? getShareUrl() : window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy share link:', e);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={`h-8 gap-1.5 text-xs font-semibold rounded-xl border-border/70 text-muted-foreground hover:text-foreground transition-all ${className}`}
      title="Copy shareable link with live parameters encoded"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
