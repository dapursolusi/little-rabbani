import { ReactNode, useState } from 'react';

import { LeanKid } from '@/features/kid/types';
import { ActionResult } from '@/types';
import { DatabaseIcon } from '@hugeicons/core-free-icons';

import { EmptyState } from '@/components/shared/empty-state';
import { Modal } from '@/components/shared/modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '../constants';
import { type DCRObservation } from '../types';
import { DCRObservationForm } from './form';

export function KidObservationModal({
  kid,
  observation,
  isEditMode,
  triggerRender,
}: {
  kid: LeanKid;
  observation?: DCRObservation;
  isEditMode?: boolean;
  triggerRender?: ReactNode;
}) {
  return (
    <Modal
      key={kid.id}
      title={`Observasi: ${kid.name}`}
      description="Berikan observasi untuk hari ini terhadap anak lalu klik simpan."
      trigger={{
        text: kid.name,
        render: triggerRender,
      }}
      content={
        <div className="flex flex-col gap-2">
          <DCRObservationForm
            kid={kid}
            observation={observation}
            isEditMode={isEditMode}
          />
        </div>
      }
    />
  );
}

export default function DCRKidObservation({
  availableKids,
  existingObservationsResults,
}: {
  availableKids: LeanKid[];
  existingObservationsResults: ActionResult<DCRObservation[]>;
}) {
  const existingObservations = existingObservationsResults.data ?? [];

  const unfilledKids = availableKids.filter(
    (kid) => !existingObservations.some((obs) => obs.kidId === kid.id)
  );
  const [observation, setObservation] = useState<DCRObservation | null>(null);

  return (
    <Accordion
      multiple
      defaultValue={['unfilled']}
      className="border rounded-md py-1 px-2"
    >
      {unfilledKids.length > 0 && (
        <AccordionItem value="unfilled" className="border-b last:border-0">
          <AccordionTrigger>
            Belum Diisi ({unfilledKids.length})
          </AccordionTrigger>

          <AccordionContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 my-2">
            {unfilledKids.map((kid) => (
              <KidObservationModal key={kid.id} kid={kid} />
            ))}
          </AccordionContent>
        </AccordionItem>
      )}

      {existingObservationsResults.success ? (
        Object.entries(KID_ATTENDANCE_LABELS).map(([attendance, label]) => {
          const observations = existingObservations.filter(
            (observation) => observation.attendance === attendance
          );

          if (observations.length === 0) return null;

          return (
            <AccordionItem
              key={attendance}
              value={attendance}
              className="border-b last:border-0"
            >
              <AccordionTrigger>
                {label} ({observations.length})
              </AccordionTrigger>

              <AccordionContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 my-2">
                {observations.map((observation) =>
                  observation.attendance === 'present' ? (
                    <KidObservationModal
                      key={observation.id}
                      kid={observation.kid}
                      observation={observation}
                      isEditMode
                      triggerRender={
                        <Item
                          variant="outline"
                          className="bg-primary/30"
                          key={observation.id}
                        >
                          <ItemContent>
                            <ItemTitle>{observation.kid.nickName}</ItemTitle>

                            <Separator />

                            <ItemDescription className="flex flex-col gap-2">
                              <div className="flex items-center justify-evenly gap-2 w-full">
                                <div className="flex flex-col items-center gap-2">
                                  <Badge className="text-[10px]">Mood:</Badge>
                                  <span>
                                    {observation.mood
                                      ? KID_MOOD_LABELS[observation.mood]
                                      : '-'}
                                  </span>
                                </div>

                                <Separator orientation="vertical" />

                                <div className="flex flex-col items-center gap-2">
                                  <Badge className="text-[10px]">Makan:</Badge>
                                  <span>
                                    {observation.appetite
                                      ? KID_APPETITE_LABELS[
                                          observation.appetite
                                        ]
                                      : '-'}
                                  </span>
                                </div>
                              </div>

                              <Separator />

                              <div className="flex items-center gap-2">
                                <Badge>Catatan:</Badge>
                                <Separator orientation="vertical" />
                                <span>{observation.notes || '-'}</span>
                              </div>
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      }
                    />
                  ) : (
                    <KidObservationModal
                      key={observation.id}
                      kid={observation.kid}
                      observation={observation as DCRObservation}
                      isEditMode
                    />
                  )
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })
      ) : (
        <EmptyState icon={DatabaseIcon} title="Belum ada observasi" />
      )}
    </Accordion>
  );
}
