import Link from 'next/link';

import { isIconSvgElement } from '@/utils/icon-checker';
import {
  Add02Icon,
  Alert01Icon,
  ArrowUpRight01Icon,
  Database01Icon,
  LinkSquare02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';

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
  icon?: IconSvgElement | React.ReactNode;
  description?: string;
  action?: EmptyDataAction;
  learnMore?: {
    href: string;
    label: string;
  };
}

type EmptyDataAction = EmptyDataHrefAction | EmptyDataCustomAction;

interface EmptyDataHrefAction {
  type: 'href';
  label: string;
  href: string;
}

interface EmptyDataCustomAction {
  type: 'custom';
  children: React.ReactNode;
}

export function EmptyState({
  title,
  icon,
  description,
  action,
  learnMore,
}: EmptyDataProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon ? (
            isIconSvgElement(icon) ? (
              <HugeiconsIcon icon={icon} size={60} />
            ) : (
              icon
            )
          ) : (
            <HugeiconsIcon icon={Alert01Icon} size={60} />
          )}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        {action && action.type === 'href' ? (
          <Button render={<a href={action.href} />}>
            <HugeiconsIcon icon={Add02Icon} /> {action.label}
          </Button>
        ) : (
          action?.children
        )}
      </EmptyContent>
      {learnMore && (
        <Button
          variant="link"
          className="text-muted-foreground"
          size="sm"
          nativeButton={false}
          render={
            <Link href="learnMore.href">
              {learnMore?.label}{' '}
              <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
            </Link>
          }
        />
      )}
    </Empty>
  );
}
