import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ContentTabsProps {
  tabs: {
    triggerValue: string;
    triggerLabel: string;
    icon?: IconSvgElement;
    children: React.ReactNode;
    maxWidthPx?: string;
  }[];
  fullWidth?: boolean;
}

export default function ContentTabs({ tabs, fullWidth }: ContentTabsProps) {
  return (
    <Tabs defaultValue={tabs[0].triggerValue} className="w-full">
      <TabsList className={`${fullWidth ? 'w-full' : ''}`}>
        {tabs.map((tab) => {
          const { triggerValue, triggerLabel, icon } = tab;
          return (
            <TabsTrigger key={triggerValue} value={triggerValue}>
              {icon && (
                <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
              )}
              {triggerLabel}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {tabs.map((tab) => {
        const { triggerValue, children } = tab;
        return (
          <TabsContent
            key={triggerValue}
            value={triggerValue}
            className={`w-full ${tab.maxWidthPx ? 'mx-auto' : ''}`}
            style={{ maxWidth: tab.maxWidthPx }}
          >
            {children}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
