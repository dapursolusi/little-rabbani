'use client';

import { useCallback, useState } from 'react';

import { LeanKid } from '@/features/kid/types';
import {
  DailyReportTemplateRenderData,
  renderDailyReportTemplate,
} from '@/utils/template';
import {
  BadgeCheckIcon,
  Copy01Icon,
  SquareArrowDown01Icon,
  Tick04Icon,
  TickDouble03Icon,
} from '@hugeicons/core-free-icons';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { dailyKidReportAction } from '../actions';
import {
  KID_APPETITE_LABELS,
  KID_MOOD_LABELS,
  REPORT_STATUS_BADGE,
  REPORT_STATUS_LABELS,
} from '../constants';
import {
  DailyClassReportItem,
  DailyKidReport,
  DailyKidReportItem,
} from '../types';

interface DailyReportProps {
  existingDCR: DailyClassReportItem;
  unfilledKids: LeanKid[];
  availableKids: LeanKid[];
  defaultReportTemplate: string;
  onSaveNarrativeSuccess: ({
    dcrObservationId,
    dailyKidReport,
  }: {
    dcrObservationId: string;
    dailyKidReport: DailyKidReportItem | null;
  }) => void;
  onMarkSentReportSuccess: ({
    dcrObservationId,
    dailyKidReport,
  }: {
    dcrObservationId: string;
    dailyKidReport: DailyKidReportItem | null;
  }) => void;
}

export default function DailyReport({
  existingDCR,
  unfilledKids,
  availableKids,
  defaultReportTemplate,
  onSaveNarrativeSuccess,
  onMarkSentReportSuccess,
}: DailyReportProps) {
  // Per-kid state: { [kidId]: { narrative, editedNarrative } }
  const kidReports: Record<
    string,
    {
      defaultNarrative: string;
      existingNarrative: string | null;
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

    kidReports[obs.kidId] = {
      defaultNarrative,
      existingNarrative: obs.kidReport?.narrative ?? null,
    };
  }

  const [expandedKid, setExpandedKid] = useState<string | null>(null);

  const [editedNarratives, setEditedNarratives] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};

    for (const [kidId, report] of Object.entries(kidReports)) {
      initial[kidId] = report.existingNarrative ?? report.defaultNarrative;
    }

    return initial;
  });

  const handleEditNarrative = ({
    kidId,
    text,
  }: {
    kidId: string;
    text: string;
  }) => {
    setEditedNarratives((prev) => ({
      ...prev,
      [kidId]: text,
    }));
  };

  const handleSaveNarrative = async ({
    dcrObservationId,
    narrative,
  }: Pick<DailyKidReport, 'dcrObservationId' | 'narrative'>) => {
    try {
      const result = await dailyKidReportAction.saveReportNarrative({
        dcrObservationId,
        narrative,
        reportStatus: 'edited',
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onSaveNarrativeSuccess({
        dcrObservationId,
        dailyKidReport: result.data,
      });

      toast.success(result.message);
    } catch {
      toast.error('Terjadi kesalahan. Coba beberapa saat lagi.');
    }
  };

  const handleCopy = useCallback(async (text: string, kidName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Laporan ${kidName} disalin ke clipboard.`);
    } catch {
      toast.error('Gagal menyalin. Silakan salin manual.');
    }
  }, []);

  const handleMarkSentReport = async ({
    dcrObservationId,
  }: {
    dcrObservationId: string;
  }) => {
    try {
      const result = await dailyKidReportAction.markReportAsSent({
        dcrObservationId,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      onMarkSentReportSuccess({
        dcrObservationId,
        dailyKidReport: result.data,
      });

      toast.success(result.message);
    } catch {
      toast.error('Gagal merubah status laporan menjadi terkirim.');
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
          const editedKidNarrative = editedNarratives[ak.id];
          const isReportSent = obs?.kidReport?.reportStatus === 'sent';
          const baseline =
            report?.existingNarrative ?? report?.defaultNarrative ?? '';
          const hasChanges = editedKidNarrative !== baseline;
          const hasExistingReport = !!report?.existingNarrative;
          const getReportStatusKey = () => {
            if (isReportSent) return 'sent';
            if (hasChanges) return 'draft'; // If user edited either existing or template, it's a draft
            if (hasExistingReport) return 'edited'; // Has DB data, but no new edits right now
            return 'template'; // No DB data, unmodified template
          };
          const statusKey = getReportStatusKey();

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
                      <Badge className={REPORT_STATUS_BADGE[statusKey]}>
                        {REPORT_STATUS_LABELS[statusKey]}
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
                            value={editedKidNarrative}
                            onChange={(e) =>
                              handleEditNarrative({
                                kidId: ak.id,
                                text: e.target.value,
                              })
                            }
                            disabled={isReportSent}
                            rows={8}
                            className="w-full text-sm"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!hasChanges}
                                onClick={() => {
                                  handleSaveNarrative({
                                    dcrObservationId: obs.id,
                                    narrative: editedKidNarrative,
                                  });
                                }}
                              >
                                Simpan
                              </Button>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    isReportSent ? (
                                      <Badge>
                                        {' '}
                                        <HugeiconsIcon
                                          icon={TickDouble03Icon}
                                          size={36}
                                          data-icon="inline-start"
                                        />
                                        Terkirim
                                      </Badge>
                                    ) : (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={isReportSent}
                                        onClick={() => {
                                          handleMarkSentReport({
                                            dcrObservationId: obs.id,
                                          });
                                        }}
                                      >
                                        <HugeiconsIcon
                                          icon={
                                            isReportSent
                                              ? Tick04Icon
                                              : BadgeCheckIcon
                                          }
                                          data-icon="inline-start"
                                        />
                                        {'Tandai Terkirim'}
                                      </Button>
                                    )
                                  }
                                />
                                {isReportSent && obs.kidReport?.sentAt && (
                                  <TooltipContent>{`Terkirim: ${new Intl.DateTimeFormat(
                                    'id-ID',
                                    {
                                      timeZone: 'Asia/Jakarta',
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    }
                                  ).format(
                                    obs.kidReport?.sentAt
                                  )}`}</TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(editedKidNarrative, ak.name)
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
