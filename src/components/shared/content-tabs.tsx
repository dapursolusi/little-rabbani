import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContentTabsProps {
  tabs: {
    triggerValue: string;
    triggerLabel: string;
    icon?: IconSvgElement;
    children: React.ReactNode;
  }[];
}

export default function ContentTabs({ tabs }: ContentTabsProps) {
  return (
    <Tabs defaultValue={tabs[0].triggerValue}>
      <TabsList>
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
          <TabsContent key={triggerValue} value={triggerValue}>
            {children}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
