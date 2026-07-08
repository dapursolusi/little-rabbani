import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type {
  IQuarterlySections,
  IQuarterlyStats,
} from '@/lib/actions/quarterly-report';

// ─────────────── Styles ───────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  kidName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.6,
    paddingHorizontal: 4,
  },
  statsContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: 1,
    borderColor: '#e2e8f0',
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 10,
    color: '#334155',
  },
  statsLabel: {
    fontWeight: 'bold',
  },
  statsValue: {},
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  emptySection: {
    fontStyle: 'italic',
    color: '#999',
    fontSize: 10,
  },
});

// ─────────────── Types ───────────────

interface IQuarterlyPDFProps {
  kidName: string;
  termName: string;
  termPeriod: string;
  sections: IQuarterlySections;
  stats: IQuarterlyStats | null;
  previousTermName?: string;
}

// ─────────────── Helpers ───────────────

function translateAppetite(value: string): string {
  const map: Record<string, string> = {
    good: 'Baik',
    moderate: 'Cukup',
    poor: 'Kurang',
  };
  return map[value] ?? value;
}

function getMoodLabel(mood: number): string {
  const labels: Record<number, string> = {
    1: 'Sangat Tidak Baik',
    2: 'Kurang Baik',
    3: 'Biasa Saja',
    4: 'Baik',
    5: 'Sangat Baik',
  };
  return labels[mood] ?? `Level ${mood}/5`;
}

// ─────────────── Document Component ───────────────

export function QuarterlyReportDocument({
  kidName,
  termName,
  termPeriod,
  sections,
  stats,
  previousTermName,
}: IQuarterlyPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Triwulanan</Text>
          <Text style={styles.kidName}>{kidName}</Text>
          <Text style={styles.subtitle}>{termName}</Text>
          <Text style={styles.subtitle}>Periode: {termPeriod}</Text>
          {previousTermName && (
            <Text style={styles.subtitle}>
              Perbandingan dengan: {previousTermName}
            </Text>
          )}
        </View>

        {/* Stats Summary */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Ringkasan Statistik</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Kehadiran:</Text>
              <Text style={styles.statsValue}>
                {stats.attendancePercent}% ({stats.daysPresent} dari{' '}
                {stats.totalSchoolDays} hari)
              </Text>
            </View>

            {Object.keys(stats.moodDistribution).length > 0 && (
              <View>
                <Text style={styles.statsLabel}>Suasana Hati:</Text>
                {Object.entries(stats.moodDistribution)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([level, count]) => (
                    <View style={styles.statsRow} key={level}>
                      <Text style={{ ...styles.statsLabel, paddingLeft: 8 }}>
                        • {getMoodLabel(Number(level))}:
                      </Text>
                      <Text style={styles.statsValue}>{count}x</Text>
                    </View>
                  ))}
              </View>
            )}

            {Object.keys(stats.appetiteDistribution).length > 0 && (
              <View>
                <Text style={styles.statsLabel}>Nafsu Makan:</Text>
                {Object.entries(stats.appetiteDistribution).map(
                  ([appetite, count]) => (
                    <View style={styles.statsRow} key={appetite}>
                      <Text style={{ ...styles.statsLabel, paddingLeft: 8 }}>
                        • {translateAppetite(appetite)}:
                      </Text>
                      <Text style={styles.statsValue}>{count}x</Text>
                    </View>
                  )
                )}
              </View>
            )}

            {Object.keys(stats.activityParticipation).length > 0 && (
              <View>
                <Text style={styles.statsLabel}>
                  Partisipasi Aktivitas Teratas:
                </Text>
                {Object.entries(stats.activityParticipation)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([activity, count]) => (
                    <View style={styles.statsRow} key={activity}>
                      <Text style={{ ...styles.statsLabel, paddingLeft: 8 }}>
                        • {activity}:
                      </Text>
                      <Text style={styles.statsValue}>{count}x</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Section 1: Perubahan (Changes) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Perubahan</Text>
          {sections.changes ? (
            <Text style={styles.sectionContent}>{sections.changes}</Text>
          ) : (
            <Text style={styles.emptySection}>
              Bagian ini tidak dapat dihasilkan secara otomatis. Silakan edit
              secara manual.
            </Text>
          )}
        </View>

        {/* Section 2: Peningkatan (Improvements) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Peningkatan</Text>
          {sections.improvements ? (
            <Text style={styles.sectionContent}>{sections.improvements}</Text>
          ) : (
            <Text style={styles.emptySection}>
              Bagian ini tidak dapat dihasilkan secara otomatis. Silakan edit
              secara manual.
            </Text>
          )}
        </View>

        {/* Section 3: Rekomendasi (Recommendations) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Rekomendasi</Text>
          {sections.recommendations ? (
            <Text style={styles.sectionContent}>
              {sections.recommendations}
            </Text>
          ) : (
            <Text style={styles.emptySection}>
              Bagian ini tidak dapat dihasilkan secara otomatis. Silakan edit
              secara manual.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Laporan Triwulanan — Little Rabbani Preschool — Dihasilkan pada{' '}
            {new Date().toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
