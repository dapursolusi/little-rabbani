'use client';

import { useCallback, useState } from 'react';

import { LeanKid } from '@/features/kid/types';
import { renderDailyReportTemplate } from '@/utils/template';
import { Copy01Icon, SquareArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';

import {
  KID_APPETITE_LABELS,
  KID_MOOD_LABELS,
  REPORT_STATUS_BADGE,
  REPORT_STATUS_LABELS,
} from '../constants';
import { DailyClassReport } from '../types';

export default function DailyReport({
  existingDCR,
  unfilledKids,
  availableKids,
  defaultReportTemplate,
}: {
  existingDCR: DailyClassReport;
  unfilledKids: LeanKid[];
  availableKids: LeanKid[];
  defaultReportTemplate: string;
}) {
  // Per-kid state: { [kidId]: { narrative, editedNarrative } }
  const [kidReports, setKidReports] = useState<
    Record<
      string,
      {
        narrative: string;
        saved: boolean;
      }
    >
  >(() => {
    const initial: Record<string, { narrative: string; saved: boolean }> = {};
    for (const obs of existingDCR.observations) {
      const defaultTemplateNarrative = renderDailyReportTemplate({
        template: defaultReportTemplate,
        input: { dcr: existingDCR, observation: obs },
      });
      const narrative = obs.kidReport?.narrative ?? defaultTemplateNarrative;
      if (narrative) {
        initial[obs.kidId] = {
          narrative,
          saved: true,
        };
      }
    }
    return initial;
  });
  const [expandedKid, setExpandedKid] = useState<string | null>(null);

  const handleEditNarrative = useCallback((kidId: string, text: string) => {
    setKidReports((prev) => ({
      ...prev,
      [kidId]: { ...prev[kidId], narrative: text, saved: false },
    }));
  }, []);

  const handleCopy = useCallback(async (text: string, kidName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Laporan ${kidName} disalin ke clipboard.`);
    } catch {
      toast.error('Gagal menyalin. Silakan salin manual.');
    }
  }, []);

  const allFilled = unfilledKids.length === 0;

  return (
    <div className="space-y-4">
      {!allFilled && <EmptyState title="Observasi anak belum terisi semua!" />}

      {/* Kid list */}
      <div className="flex flex-col gap-2">
        {availableKids.map((ak) => {
          const obs = existingDCR.observations.find((o) => o.kidId === ak.id);
          const isPresent = obs?.attendance === 'present';
          const report = kidReports[ak.id];

          if (!isPresent) return null;

          return (
            <Item variant="outline" key={ak.id}>
              <ItemContent>
                <Collapsible
                  className="group"
                  open={expandedKid === ak.id}
                  onOpenChange={(open) => setExpandedKid(open ? ak.id : null)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full [&[data-panel-open]_.chevron]:-rotate-180">
                    <ItemTitle>{ak.name}</ItemTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          report
                            ? REPORT_STATUS_BADGE.draft
                            : REPORT_STATUS_BADGE.ready
                        }
                      >
                        {report
                          ? REPORT_STATUS_LABELS.draft
                          : REPORT_STATUS_LABELS.ready}
                      </Badge>
                      <HugeiconsIcon
                        icon={SquareArrowDown01Icon}
                        className="chevron transition-transform"
                      />
                    </div>
                  </CollapsibleTrigger>

                  {obs && (
                    <CollapsibleContent className="space-y-3 py-2">
                      {/* Observation data */}
                      <div className="grid grid-cols-2 gap-2">
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
                          </>
                        )}
                        <Card className="col-span-2">
                          <CardHeader>
                            <CardTitle>📝 Catatan:</CardTitle>
                          </CardHeader>
                          <CardContent>{obs.notes ?? '—'}</CardContent>
                        </Card>
                        {/* Generated narrative */}

                        <div className="space-y-2 col-span-2 border rounded-lg p-3 bg-muted/30">
                          <label className="text-sm font-medium">
                            Narasi Laporan
                          </label>
                          <Textarea
                            value={report?.narrative ?? ''}
                            onChange={(e) =>
                              handleEditNarrative(ak.id, e.target.value)
                            }
                            rows={8}
                            className="w-full text-sm"
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>
                              {report?.saved ? 'Tersimpan' : 'Simpan'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(report.narrative, ak.name)
                              }
                            >
                              <HugeiconsIcon
                                icon={Copy01Icon}
                                data-icon="inline-start"
                              />
                              Salin
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </ItemContent>
            </Item>
          );
        })}
      </div>
    </div>
  );
}
