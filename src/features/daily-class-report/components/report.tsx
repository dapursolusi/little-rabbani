'use client';

import { useCallback, useState } from 'react';

import { LeanKid } from '@/features/kid/types';
import {
  DailyReportTemplateRenderData,
  renderDailyReportTemplate,
} from '@/utils/template';
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

import { dailyKidReportAction } from '../actions';
import {
  KID_APPETITE_LABELS,
  KID_MOOD_LABELS,
  REPORT_STATUS,
  REPORT_STATUS_BADGE,
  REPORT_STATUS_LABELS,
  ReportStatus,
} from '../constants';
import { DailyClassReport, DailyKidReport } from '../types';

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
        defaultNarrative: string;
        existingNarrative: string | null;
        editedNarrative: string;
      }
    >
  >(() => {
    const initial: Record<
      string,
      {
        defaultNarrative: string;
        existingNarrative: string | null;
        editedNarrative: string;
      }
    > = {};
    for (const obs of existingDCR?.observations ?? []) {
      const defaultNarrative = renderDailyReportTemplate({
        template: defaultReportTemplate,
        dcrData: {
          dcr: existingDCR,
          observation: obs,
        } satisfies DailyReportTemplateRenderData,
      });
      const existingNarrative = obs.kidReport?.narrative?.trim() ?? null;

      initial[obs.kidId] = {
        defaultNarrative,
        existingNarrative,
        editedNarrative: existingNarrative ?? defaultNarrative,
      };
    }
    return initial;
  });
  const [expandedKid, setExpandedKid] = useState<string | null>(null);

  const handleEditNarrative = ({
    kidId,
    text,
  }: {
    kidId: string;
    text: string;
  }) => {
    setKidReports((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        editedNarrative: text,
      },
    }));
  };

  const handleCopy = useCallback(async (text: string, kidName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Laporan ${kidName} disalin ke clipboard.`);
    } catch {
      toast.error('Gagal menyalin. Silakan salin manual.');
    }
  }, []);

  const handleSaveNarrative = async ({
    dcrObservationId,
    narrative,
  }: Pick<DailyKidReport, 'dcrObservationId' | 'narrative'>) => {
    try {
      const result = await dailyKidReportAction.saveReportNarration({
        dcrObservationId,
        narrative,
        reportStatus: 'edited',
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    } catch {
      toast.error('Terjadi kesalahan. Coba beberapa saat lagi.');
    }
  };

  const allFilled = unfilledKids.length === 0;

  return (
    <div className="space-y-4">
      {!allFilled && <EmptyState title="Observasi anak belum terisi semua!" />}

      {/* Kid list */}
      <div className="flex flex-col gap-2">
        {availableKids.map((ak) => {
          const obs = existingDCR?.observations?.find((o) => o.kidId === ak.id);
          const isPresent = obs?.attendance === 'present';
          const report = kidReports[ak.id];
          const baseline =
            report?.existingNarrative ?? report?.defaultNarrative ?? '';
          const hasChanges = report
            ? report.editedNarrative !== baseline
            : false;
          const hasExistingReport = !!report?.existingNarrative;

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
                          hasChanges
                            ? REPORT_STATUS_BADGE.draft
                            : hasExistingReport
                              ? REPORT_STATUS_BADGE.edited
                              : REPORT_STATUS_BADGE.template
                        }
                      >
                        {hasChanges
                          ? REPORT_STATUS_LABELS.draft
                          : hasExistingReport
                            ? REPORT_STATUS_LABELS.edited
                            : REPORT_STATUS_LABELS.template}
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
                      <div className="grid grid-cols-4 gap-2">
                        {obs.mood && obs.appetite && (
                          <>
                            <Card className="col-span-2 sm:col-span-1">
                              <CardHeader>
                                <CardTitle>Mood:</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {KID_MOOD_LABELS[obs.mood]}
                              </CardContent>
                            </Card>
                            <Card className="col-span-2 sm:col-span-1">
                              <CardHeader>
                                <CardTitle>Makan:</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {KID_APPETITE_LABELS[obs.appetite]}
                              </CardContent>
                            </Card>
                          </>
                        )}
                        <Card className="col-span-full sm:col-span-2">
                          <CardHeader>
                            <CardTitle>📝 Catatan:</CardTitle>
                          </CardHeader>
                          <CardContent>{obs.notes ?? '—'}</CardContent>
                        </Card>
                        {/* Generated narrative */}

                        <div className="space-y-2 col-span-full border rounded-lg p-3 bg-muted/30">
                          <label className="text-sm font-medium">
                            Narasi Laporan
                          </label>
                          <Textarea
                            value={
                              report?.editedNarrative ??
                              report?.existingNarrative ??
                              ''
                            }
                            onChange={(e) =>
                              handleEditNarrative({
                                kidId: ak.id,
                                text: e.target.value,
                              })
                            }
                            rows={8}
                            className="w-full text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasChanges}
                              onClick={() => {
                                handleSaveNarrative({
                                  dcrObservationId: obs.id,
                                  narrative: report?.editedNarrative ?? '',
                                });
                              }}
                            >
                              Simpan
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(
                                  report.editedNarrative ??
                                    report.existingNarrative,
                                  ak.name
                                )
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
