import { LeanKid } from '@/features/kid/types';
import { ActionResult } from '@/types';
import { DatabaseIcon } from '@hugeicons/core-free-icons';

import { EmptyState } from '@/components/shared/empty-state';
import FormFieldGenerator from '@/components/shared/form/form-field-generator';
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

import { observationAction } from '../actions';
import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '../constants';
import { dcrObservationFormFields } from '../fields';
import { type DCRObservation } from '../types';
import { dcrObservationSchema } from '../validation';

export default function DCRKidObservation({
  availableKids,
  existingObservationsResults,
}: {
  availableKids: LeanKid[];
  existingObservationsResults: ActionResult<DCRObservation[]>;
}) {
  const existingObservations = existingObservationsResults.data;
  const unfilledKids = availableKids.filter(
    (kid) => !existingObservations?.some((obs) => obs.kidId === kid.id)
  );
  const unfilledKidsLength = unfilledKids.length;

  return (
    <Accordion
      multiple
      defaultValue={['unfilled']}
      className="border rounded-md py-1 px-2"
    >
      {unfilledKidsLength > 0 && (
        <AccordionItem value="unfilled" className="border-b last:border-0">
          <AccordionTrigger>
            Belum Diisi ({unfilledKidsLength})
          </AccordionTrigger>
          <AccordionContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 my-2">
            {unfilledKids.map((kid) => (
              <Modal
                key={kid.id}
                title={`Observasi: ${kid.name}`}
                description="Berikan observasi untuk hari ini terhadap anak lalu klik simpan."
                trigger={{
                  text: kid.name,
                }}
                content={
                  <div className="flex flex-col gap-2">
                    <FormFieldGenerator
                      schema={dcrObservationSchema}
                      formFields={dcrObservationFormFields}
                      initialData={{
                        dcrId: crypto.randomUUID(),
                        kidId: kid.id,
                        attendance: undefined,
                        mood: undefined,
                        appetite: undefined,
                        notes: '',
                      }}
                      onSubmit={async (data) => {
                        if (typeof window !== 'undefined') {
                          const classSessionId = new URLSearchParams(
                            window.location.search
                          ).get('classSessionId');

                          return await observationAction.createKidObservation({
                            input: data,
                            classSessionId: classSessionId ?? '',
                          });
                        }
                      }}
                      meta={{ label: 'Observasi Anak' }}
                    />
                  </div>
                }
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      )}
      {existingObservationsResults.success ? (
        Object.entries(KID_ATTENDANCE_LABELS).map(
          ([attendance, label]) =>
            existingObservations &&
            existingObservations?.filter((o) => o.attendance === attendance)
              .length > 0 && (
              <AccordionItem
                key={attendance}
                value={attendance}
                className="border-b last:border-0"
              >
                <AccordionTrigger>
                  {label} (
                  {
                    existingObservations?.filter(
                      (o) => o.attendance === attendance
                    ).length
                  }
                  )
                </AccordionTrigger>
                <AccordionContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 my-2">
                  {existingObservations &&
                    existingObservations
                      .filter((o) => o.attendance === attendance)
                      .map((o) => (
                        <Item variant="outline" key={o.id}>
                          <ItemContent>
                            <ItemTitle>
                              <div className="flex items-center gap-2">
                                {o.kid.name}
                              </div>
                            </ItemTitle>
                            <Separator />
                            <ItemDescription className="flex flex-col gap-2">
                              <div className="flex items-center justify-evenly gap-2 w-full">
                                <div className="flex flex-col items-center gap-2">
                                  <Badge className="text-[10px]">Mood:</Badge>{' '}
                                  <span>
                                    {o.mood ? KID_MOOD_LABELS[o.mood] : '-'}
                                  </span>
                                </div>

                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center gap-2">
                                  <Badge className="text-[10px]">Makan:</Badge>{' '}
                                  <span>
                                    {o.appetite
                                      ? KID_APPETITE_LABELS[o.appetite]
                                      : '-'}
                                  </span>
                                </div>
                              </div>
                              <Separator />
                              <div className="flex items-center gap-2">
                                <Badge>Catatan:</Badge>
                                <Separator orientation="vertical" />
                                <span>{o.notes || '-'}</span>
                              </div>
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      ))}
                </AccordionContent>
              </AccordionItem>
            )
        )
      ) : (
        <EmptyState icon={DatabaseIcon} title="Belum ada observasi" />
      )}
    </Accordion>
  );
}
