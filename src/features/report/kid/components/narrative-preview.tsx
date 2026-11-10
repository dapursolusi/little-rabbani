/**
 * Readable renderer for the persisted narrative: blank-line separated
 * paragraphs, `Heading:` lines, and `- ` bullets. Manual edits that do not
 * follow the shape still render as plain paragraphs.
 */
export function NarrativePreview({ narrative }: { narrative: string }) {
  const lines = narrative.split('\n');

  if (!narrative.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada narasi laporan untuk bulan ini.
      </p>
    );
  }

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      continue;
    }

    flushBullets();
    if (!line) continue;

    if (line.endsWith(':')) {
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="mt-4 font-semibold">
          {line}
        </h3>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed">
        {line}
      </p>
    );
  }
  flushBullets();

  return <div className="space-y-3 text-sm sm:text-base">{blocks}</div>;
}
