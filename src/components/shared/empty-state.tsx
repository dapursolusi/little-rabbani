import { ArrowUpRight01Icon, DatabaseIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

interface EmptyDataProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  icon,
  description,
  actionLabel,
  actionHref,
  action,
}: EmptyDataProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon ? icon : <HugeiconsIcon icon={DatabaseIcon} size={60} />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        {actionLabel && actionHref ? (
          <Button render={<a href={actionHref} />}>{actionLabel}</Button>
        ) : action ? (
          action
        ) : null}
      </EmptyContent>
      <Button
        variant="link"
        className="text-muted-foreground"
        size="sm"
        nativeButton={false}
        render={
          <a href="#">
            Learn More{' '}
            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
          </a>
        }
      />
    </Empty>
  );
}
