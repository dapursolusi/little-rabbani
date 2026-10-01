'use client';

import { useCallback, useState } from 'react';

import { LeanKid } from '@/features/kid/types';
import {
  AiMagicIcon,
  Copy01Icon,
  SquareArrowDown01Icon,
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
  generateReports,
  saveNarrativeEdited,
} from '../actions/generate-report';
import {
  KID_APPETITE_LABELS,
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
  const [generating, setGenerating] = useState(false);
  // Per-kid state: { [kidId]: { narrative, editedNarrative } }
  const [kidReports, setKidReports] = useState<
    Record<
      string,
      {
        narrative: string;
        editedNarrative: string;
        saved: boolean;
      }
    >
  >(() => {
    // Pre-populate from existing observations (narrative_edited ?? narrative_generated)
    const initial: Record<
      string,
      { narrative: string; editedNarrative: string; saved: boolean }
    > = {};
    for (const obs of existingObservations) {
      const narrative = obs.narrativeEdited ?? obs.narrativeGenerated ?? '';
      if (narrative) {
        initial[obs.kidId] = {
          narrative,
          editedNarrative: narrative,
          saved: true,
        };
      }
    }
    return initial;
  });
  const [expandedKid, setExpandedKid] = useState<string | null>(null);
  const [dcrId, setDcrId] = useState<string | null>(() => {
    return existingObservations[0]?.dcrId ?? null;
  });

  const handleGenerate = useCallback(async () => {
    // Find the DCR ID from the first observation
    const firstObs = existingObservations[0];
    if (!firstObs) {
      toast.error('Belum ada data observasi.');
      return;
    }
    const id = firstObs.dcrId;
    setDcrId(id);
    setGenerating(true);

    const result = await generateReports(id);
    if (!result.success) {
      toast.error(result.error);
      setGenerating(false);
      return;
    }

    const reports: Record<
      string,
      { narrative: string; editedNarrative: string; saved: boolean }
    > = {};
    for (const r of result.data) {
      reports[r.kidId] = {
        narrative: r.narrative,
        editedNarrative: r.narrative,
        saved: true,
      };
    }
    setKidReports(reports);
    toast.success(
      'Laporan berhasil dibuat untuk ' + result.data.length + ' anak.'
    );
    setGenerating(false);
  }, [existingObservations]);

  const handleEditNarrative = useCallback((kidId: string, text: string) => {
    setKidReports((prev) => ({
      ...prev,
      [kidId]: { ...prev[kidId], editedNarrative: text, saved: false },
    }));
  }, []);

  const handleSaveEdit = useCallback(
    async (kidId: string) => {
      const report = kidReports[kidId];
      if (!report || !dcrId) return;

      try {
        const result = await saveNarrativeEdited(
          dcrId,
          kidId,
          report.editedNarrative
        );
        if (result.success) {
          setKidReports((prev) => ({
            ...prev,
            [kidId]: {
              ...prev[kidId],
              narrative: report.editedNarrative,
              saved: true,
            },
          }));
          toast.success('Narasi disimpan.');
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Gagal menyimpan narasi.');
      }
    },
    [kidReports, dcrId]
  );

  const handleCopy = useCallback(async (text: string, kidName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Laporan ${kidName} disalin ke clipboard.`);
    } catch {
      toast.error('Gagal menyalin. Silakan salin manual.');
    }
  }, []);

  const allFilled = unfilledKids.length === 0;
  const hasGeneratedReports = Object.keys(kidReports).length > 0;

  return (
    <div className="space-y-4">
      {/* Generate button */}
      {allFilled && !hasGeneratedReports && (
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="mx-auto w-full max-w-150"
        >
          <HugeiconsIcon icon={AiMagicIcon} className="mr-2" />
          {generating ? 'Membuat Laporan...' : 'Buat Laporan Harian Anak'}
        </Button>
      )}

      {!allFilled && (
        <EmptyState title="Observasi anak belum terisi semua!" action />
      )}

      {/* Kid list */}
      <div className="flex flex-col gap-2">
        {availableKids.map((ak) => {
          const obs = existingObservations.find((o) => o.kidId === ak.id);
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
                      </div>

                      {/* Generated narrative */}
                      {report && (
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                          <label className="text-sm font-medium">
                            Narasi Laporan
                          </label>
                          <Textarea
                            value={report.editedNarrative}
                            onChange={(e) =>
                              handleEditNarrative(ak.id, e.target.value)
                            }
                            rows={8}
                            className="w-full text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveEdit(ak.id)}
                              disabled={report.saved}
                            >
                              {report.saved ? 'Tersimpan' : 'Simpan'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(report.editedNarrative, ak.name)
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
                      )}
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
