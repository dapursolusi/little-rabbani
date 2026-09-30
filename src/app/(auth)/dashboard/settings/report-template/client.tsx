'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { saveTemplate } from '@/features/daily-class-report/actions/report-template';
import { toast } from 'sonner';

import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ReportTemplateClient({
  initialContent,
}: {
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveTemplate({ content });
    if (result.success) {
      toast.success('Template berhasil disimpan');
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pengaturan', href: '/dashboard/settings' },
          { label: 'Template Laporan' },
        ]}
      />
      <h1 className="text-2xl font-semibold mt-4 mb-2">
        Template Laporan Harian
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Gunakan <code>{'{{placeholder}}'}</code> untuk data dinamis. Tersedia:{' '}
        <code>{'{{nickName}}'}</code>, <code>{'{{fullName}}'}</code>,{' '}
        <code>{'{{subThemeName}}'}</code>, <code>{'{{description}}'}</code>,{' '}
        <code>{'{{mood}}'}</code>, <code>{'{{appetite}}'}</code>,{' '}
        <code>{'{{attendance}}'}</code>, <code>{'{{notes}}'}</code>.<br />
        Gunakan <code>{'{{#if notes}}...{{/if}}'}</code> untuk bagian opsional.
      </p>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={16}
        className="w-full font-mono text-sm"
        placeholder="Tulis template laporan..."
      />
      <Button onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? 'Menyimpan...' : 'Simpan Template'}
      </Button>
    </div>
  );
}
