'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import Papa from 'papaparse';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  importActivitiesCsv,
  importGuardiansCsv,
  importKidsCsv,
  importTeachersCsv,
  importWaitingListCsv,
} from '@/lib/actions/csv-import';
import type {
  CsvImportResult,
  CsvImportRowError,
} from '@/lib/actions/csv-import';

interface ICsvImportResultDisplay {
  success: boolean;
  importedCount: number;
  errors: CsvImportRowError[];
  warnings: CsvImportRowError[];
  message: string;
}

const IMPORT_TYPES = [
  {
    id: 'kids',
    title: 'Import Murid',
    description:
      'Kolom: name, dob, guardian_name, guardian_phone, guardian_email',
    sampleFilename: 'contoh-murid.csv',
    sampleContent: `name,dob,guardian_name,guardian_phone,guardian_email
Ani Putri,2020-01-15,Siti Rahma,08123456789,siti@email.com
Budi Prasetyo,2019-05-20,Agus Prasetyo,08123456790,agus@email.com`,
    importFn: importKidsCsv,
  },
  {
    id: 'guardians',
    title: 'Import Wali Murid',
    description:
      'Kolom: name, phone, email, second_contact_name, second_contact_phone',
    sampleFilename: 'contoh-wali.csv',
    sampleContent: `name,phone,email,second_contact_name,second_contact_phone
Siti Rahma,08123456789,siti@email.com,Budi Rahma,08123456791
Agus Prasetyo,08123456790,agus@email.com,,`,
    importFn: importGuardiansCsv,
  },
  {
    id: 'teachers',
    title: 'Import Guru',
    description: 'Kolom: name, email (akan dibuat akun dengan role teacher)',
    sampleFilename: 'contoh-guru.csv',
    sampleContent: `name,email
Bambang Sutrisno,bambang@littlerabbani.com
Dewi Sartika,dewi@littlerabbani.com`,
    importFn: importTeachersCsv,
  },
  {
    id: 'waiting-list',
    title: 'Import Waiting List',
    description:
      'Kolom: name, dob, guardian_name, guardian_phone (status=waiting)',
    sampleFilename: 'contoh-waiting.csv',
    sampleContent: `name,dob,guardian_name,guardian_phone
Citra Ayu,2021-03-10,Dewi Ayu,08123456792
Dimas Adi,2020-11-25,Adi Saputra,08123456793`,
    importFn: importWaitingListCsv,
  },
  {
    id: 'activities',
    title: 'Import Katalog Aktivitas',
    description:
      'Kolom: name, category (seni, olahraga, musik, bahasa, matematika, sains, agama, bermain, outing, lainnya)',
    sampleFilename: 'contoh-aktivitas.csv',
    sampleContent: `name,category
Mewarnai,seni
Futsal,olahraga
Menyanyi,musik`,
    importFn: importActivitiesCsv,
  },
];

function downloadSample(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<string>('kids');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ICsvImportResultDisplay | null>(null);

  const currentImport = IMPORT_TYPES.find((t) => t.id === selectedType)!;

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!selectedFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const text = await selectedFile.text();

      // Handle empty files
      if (!text.trim()) {
        setResult({
          success: false,
          importedCount: 0,
          errors: [],
          warnings: [],
          message: 'File CSV kosong',
        });
        toast.error('File CSV kosong');
        setIsImporting(false);
        return;
      }

      const parseResult = Papa.parse<Record<string, string>>(text as string, {
        header: true,
        skipEmptyLines: true,
      });

      const rows = parseResult.data;

      // Handle malformed CSV (no data rows)
      if (rows.length === 0) {
        setResult({
          success: false,
          importedCount: 0,
          errors: [],
          warnings: [],
          message: 'File CSV kosong atau tidak memiliki data',
        });
        toast.error('File CSV kosong atau tidak memiliki data');
        setIsImporting(false);
        return;
      }

      // Handle malformed CSV (inconsistent columns)
      if (parseResult.errors && parseResult.errors.length > 0) {
        const parseError = parseResult.errors[0];
        setResult({
          success: false,
          importedCount: 0,
          errors: [
            {
              line: parseError.row !== undefined ? parseError.row + 2 : 1,
              message: parseError.message || 'Format CSV tidak valid',
            },
          ],
          warnings: [],
          message: `Format CSV tidak valid: ${parseError.message}`,
        });
        toast.error(`Format CSV tidak valid: ${parseError.message}`);
        setIsImporting(false);
        return;
      }

      // Call the import server action
      const importResult: CsvImportResult = await currentImport.importFn(rows);
      setResult(importResult);

      if (importResult.success) {
        toast.success(importResult.message);
        router.refresh();
      } else {
        toast.error(importResult.message);
      }

      setIsImporting(false);
    } catch {
      toast.error('Gagal membaca file');
      setIsImporting(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Tipe Import */}
      <Card>
        <CardHeader>
          <CardTitle>Tipe Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {IMPORT_TYPES.map((type) => (
              <Button
                key={type.id}
                type="button"
                variant={selectedType === type.id ? 'default' : 'outline'}
                className="h-auto flex-col items-start p-3 text-left"
                onClick={() => {
                  setSelectedType(type.id);
                  handleReset();
                }}
              >
                <div className="font-medium text-zinc-900">{type.title}</div>
                <div className="mt-1 text-xs text-zinc-500 line-clamp-2">
                  {type.description}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail & Upload */}
      <Card>
        <CardHeader>
          <CardTitle>{currentImport.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium">Format CSV</p>
            <p className="mt-1">{currentImport.description}</p>
            <p className="mt-1 text-xs text-blue-500">
              Baris pertama harus berisi nama kolom (header).
            </p>
          </div>

          {/* Sample download */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              downloadSample(
                currentImport.sampleFilename,
                currentImport.sampleContent
              )
            }
          >
            Download Contoh CSV
          </Button>

          {/* File Picker */}
          <div className="space-y-2">
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-zinc-700"
            >
              Pilih File CSV
            </label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            {selectedFile && (
              <p className="text-sm text-zinc-500">
                File: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? 'Mengimpor...' : 'Import CSV'}
            </Button>
            {result && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Import Lagi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hasil */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle
              className={result.success ? 'text-green-700' : 'text-destructive'}
            >
              {result.success ? '✅ Import Berhasil' : '❌ Import Gagal'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p
              className={result.success ? 'text-green-600' : 'text-destructive'}
            >
              {result.message}
            </p>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-amber-700">
                  Peringatan ({result.warnings.length})
                </h4>
                <div className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-700"
                    >
                      <span className="font-medium">Baris {w.line}:</span>{' '}
                      {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-destructive">
                  Error ({result.errors.length})
                </h4>
                <div className="space-y-1">
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-sm text-destructive"
                    >
                      <span className="font-medium">Baris {e.line}:</span>{' '}
                      {e.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.success && result.importedCount > 0 && (
              <Badge variant="default" className="mt-2">
                {result.importedCount} data berhasil diimpor
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
