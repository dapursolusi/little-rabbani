import type { ReactNode } from 'react';

import Link from 'next/link';

import { Button, buttonVariants } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface IEmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title = 'Belum ada data',
  description,
  actionLabel,
  actionHref,
  onAction,
}: IEmptyStateProps) {
  const actionButton = actionHref ? (
    <Link
      href={actionHref}
      className={cn(buttonVariants({ variant: 'default' }), 'mt-4')}
    >
      {actionLabel}
    </Link>
  ) : onAction && actionLabel ? (
    <Button onClick={onAction} className="mt-4">
      {actionLabel}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border bg-muted py-16">
      {icon && <div className="mb-2 text-muted-foreground">{icon}</div>}
      <p className="text-muted-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {actionButton}
    </div>
  );
}
