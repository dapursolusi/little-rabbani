import { LeanKid } from '@/features/kid/types';
import { AiMagicIcon, SquareArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Item, ItemContent, ItemTitle } from '@/components/ui/item';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
  REPORT_STATUS_BADGE,
  REPORT_STATUS_LABELS,
} from '../constants';
import { DCRObservation } from '../types';

export default function DailyReport({
  existingObservations,
  unfilledKids,
  availableKids,
}: {
  existingObservations: DCRObservation[];
  unfilledKids: LeanKid[];
  availableKids: LeanKid[];
}) {
  return (
    <div className="text-center">
      {/* Kids  */}
      {unfilledKids.length > 0 ? (
        <EmptyState title="Observasi anak belum terisi semua!" action />
      ) : (
        <Button className="mx-auto w-full max-w-150">
          <HugeiconsIcon icon={AiMagicIcon} className="mr-2" />
          Buat Laporan Harian Anak{' '}
        </Button>
      )}
      <div className="flex flex-col gap-2">
        {availableKids.map((ak) => {
          const obs = existingObservations.find((o) => o.kidId === ak.id);
          const isPresent = obs?.attendance === 'present';
          return (
            isPresent && (
              <Item variant="outline" key={ak.id}>
                <ItemContent>
                  <Collapsible className="group">
                    <CollapsibleTrigger className="flex items-center justify-between w-full [&[data-panel-open]_.chevron]:-rotate-180">
                      <ItemTitle>{ak.name}</ItemTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            REPORT_STATUS_BADGE[obs ? 'ready' : 'empty']
                          }
                        >
                          {obs
                            ? REPORT_STATUS_LABELS.ready
                            : REPORT_STATUS_LABELS.empty}
                        </Badge>
                        <HugeiconsIcon
                          icon={SquareArrowDown01Icon}
                          className="chevron transition-transform"
                        />
                      </div>
                    </CollapsibleTrigger>
                    {obs && (
                      <CollapsibleContent className="grid grid-cols-2 gap-2 py-2">
                        {obs.mood && obs.appetite && (
                          <>
                            <Card>
                              <CardHeader>
                                <CardTitle>Mood:</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {KID_MOOD_LABELS[obs.mood]}
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle>Makan:</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {KID_APPETITE_LABELS[obs.appetite]}
                              </CardContent>
                            </Card>
                            <Card className="col-span-2 sm:col-span-3">
                              <CardHeader>
                                <CardTitle>📝 Catatan:</CardTitle>
                              </CardHeader>
                              <CardContent> {obs.notes ?? '—'}</CardContent>
                            </Card>
                          </>
                        )}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </ItemContent>
              </Item>
            )
          );
        })}
      </div>
    </div>
  );
}
