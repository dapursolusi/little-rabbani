'use client';

import { useState } from 'react';

import { demoLoginAction } from '@/features/auth/demo-login';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

/**
 * One-click demo (Owner) login card for the login page.
 * Rendered only when NEXT_PUBLIC_DEMO_MODE=1 (development only).
 */
export function DemoLoginCard() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const result = await demoLoginAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const res = await fetch('/api/auth/dev-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.data.email }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error('Gagal masuk sebagai demo', {
          description: body?.error,
        });
        return;
      }

      toast.success('Masuk sebagai demo Owner');
      // Deliberate full reload, not router.push(): the session cookie was just
      // minted by dev-session, and the proxy must re-read it for role dispatch.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/dashboard';
    } catch {
      toast.error('Gagal masuk sebagai demo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">Demo</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        disabled={isLoading}
        onClick={handleDemoLogin}
      >
        {isLoading ? 'Memproses...' : 'Masuk Demo (Owner)'}
      </Button>
    </div>
  );
}
