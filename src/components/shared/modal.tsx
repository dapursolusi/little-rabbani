import { ReactNode } from 'react';

import Link from 'next/link';

import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';

interface ModalProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  trigger?: {
    href?: string;
    render?: ReactNode;
    text?: string | ReactNode;
    icon?: IconSvgElement;
  };
  content?: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  title,
  description,
  trigger,
  content,
  footer,
}: ModalProps) {
  return (
    <Dialog>
      <form>
        <DialogTrigger
          render={
            trigger?.href ? (
              <Link
                href={trigger.href}
                className={cn(buttonVariants({ variant: 'default' }))}
              >
                {trigger.text ?? 'Open Dialog'}
              </Link>
            ) : (
              <Button
                variant="default"
                render={
                  typeof trigger?.render === 'function'
                    ? trigger?.render
                    : undefined
                }
              >
                {' '}
                {trigger?.icon && <HugeiconsIcon icon={trigger.icon} />}
                {trigger?.text ?? 'Open Dialog'}
              </Button>
            )
          }
        />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title ?? 'Dialog Title'}</DialogTitle>
            <DialogDescription>
              {description ?? (
                <span>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {content ?? <div>Dialog content</div>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
