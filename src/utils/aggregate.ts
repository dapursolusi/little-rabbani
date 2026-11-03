import {
  KID_APPETITE,
  KID_ATTENDANCE,
  KID_MOOD,
} from '@/features/daily-class-report/constants';
import { DcrObservationData } from '@/features/daily-class-report/types';

function countBy<T extends string>({
  observations,
  keys,
  getValue,
}: {
  observations: DcrObservationData[];
  keys: readonly T[];
  getValue: (observation: DcrObservationData) => T | null | undefined;
}): Record<T, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<
    T,
    number
  >;

  for (const observation of observations) {
    const value = getValue(observation);

    if (value != null && Object.hasOwn(counts, value)) {
      counts[value]++;
    }
  }

  return counts;
}

export function observationAggregator({
  observations,
}: {
  observations: DcrObservationData[];
}) {
  return {
    attendance: countBy({
      observations,
      keys: Object.values(KID_ATTENDANCE),
      getValue: (obs) => obs.attendance,
    }),
    mood: countBy({
      observations,
      keys: Object.values(KID_MOOD),
      getValue: (obs) => obs.mood,
    }),
    appetite: countBy({
      observations,
      keys: Object.values(KID_APPETITE),
      getValue: (obs) => obs.appetite,
    }),
  };
}
