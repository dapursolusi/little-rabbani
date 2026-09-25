import { LeanKid } from '@/features/kid/types';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';
import { Modal } from '@/components/shared/modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { observationAction } from '../actions';
import { dcrObservationFormFields } from '../fields';
import { dcrObservationSchema } from '../validation';

export default function DCRObservation({ kids }: { kids: LeanKid[] }) {
  return (
    <Accordion
      multiple
      defaultValue={['unfilled']}
      className="border rounded-md py-1 px-2"
    >
      <AccordionItem value="unfilled" className="border-b last:border-0">
        <AccordionTrigger>Belum Diisi</AccordionTrigger>
        <AccordionContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 my-2">
          {kids.map((kid) => (
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
    </Accordion>
  );
}
