'use client';
import { useEffect, useState } from 'react';

import { getClassSessions } from '@/features/class-session/actions';
import { ClassSession } from '@/features/class-session/types';
import { getKids } from '@/features/kid/actions';
import { Kid } from '@/features/kid/types';
import { getTerms } from '@/features/term/actions';
import { Term } from '@/features/term/types';
import {
  Add02Icon,
  AddTeamIcon,
  Cancel02Icon,
  SaveIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Modal } from '@/components/shared/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function CheckboxInTable({
  tableData,
}: {
  tableData: { id: string; name: string }[];
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(
    new Set(tableData.map((row) => row.id))
  );
  const selectAll = selectedRows.size === tableData.length;
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(tableData.map((row) => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">
            <Checkbox
              id="select-all-checkbox"
              name="select-all-checkbox"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((row) => (
          <TableRow
            key={row.id}
            data-state={selectedRows.has(row.id) ? 'selected' : undefined}
          >
            <TableCell>
              <Checkbox
                id={`row-${row.id}-checkbox`}
                name={`row-${row.id}-checkbox`}
                checked={selectedRows.has(row.id)}
                onCheckedChange={(checked) =>
                  handleSelectRow(row.id, checked === true)
                }
              />
            </TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function KidRegistryListPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [selectedClassSession, setSelectedClassSession] =
    useState<ClassSession | null>(classSessions[0]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [enrolledKids, setEnrolledKids] = useState<Kid[]>([]);
  const [isAddKidModalOpen, setIsAddKidModalOpen] = useState(false);

  const isCurrentBatch = (selectedTerm: Term) => {
    const today = new Date();
    return (
      today >= new Date(selectedTerm.startDate) &&
      today <= new Date(selectedTerm.endDate)
    );
  };

  const currentTerm = terms.find((t) => isCurrentBatch(t));

  useEffect(() => {
    const fetchTerms = async () => {
      const results = await getTerms();
      if (results.success) {
        setTerms(results.data);
      }
    };

    const fetchClassSessions = async () => {
      const results = await getClassSessions();
      if (results.success) {
        setClassSessions(results.data);
      }
    };

    const fetchKids = async () => {
      const results = await getKids();
      if (results.success) {
        setKids(results.data);
      }
    };

    fetchTerms();
    fetchClassSessions();
    fetchKids();
  }, []);

  const handleSelection = <T extends { id: string }>(
    list: T[],
    updater: (item: T | null) => void
  ) => {
    return (value: string | null) => {
      if (!value) {
        updater(null);
        return;
      }
      const target = list.find((item) => item.id === value);
      if (target) updater(target);
    };
  };

  return (
    <div className="self-center w-3/4 flex flex-col gap-3">
      <Label>Pilih Batch</Label>
      <Select
        value={selectedTerm?.id}
        onValueChange={handleSelection(terms, setSelectedTerm)}
        defaultValue={currentTerm?.id}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pilih Batch">
            {selectedTerm?.name}
            {selectedTerm?.id === currentTerm?.id && (
              <Badge>Batch saat ini</Badge>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {terms.map((term) => (
            <SelectItem key={term.id} value={term.id}>
              {term.name}
              {isCurrentBatch(term) && <Badge>Batch saat ini</Badge>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator />
      <Label>Pilih Sesi Kelas</Label>
      <Select
        value={selectedClassSession?.id}
        onValueChange={handleSelection(classSessions, setSelectedClassSession)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pilih Sesi Kelas">
            {selectedClassSession?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {classSessions.map((cs) => (
            <SelectItem key={cs.id} value={cs.id}>
              {cs.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Tanggal Lahir</TableHead>
            <TableHead>Jenis Kelamin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              <Modal
                title="Tambah Murid ke Batch"
                description=""
                trigger={{
                  icon: AddTeamIcon,
                  text: 'Tambah Murid ke Batch',
                }}
                content={
                  <CheckboxInTable
                    tableData={kids.map((kid) => {
                      return {
                        id: kid.id,
                        name: kid.name,
                      };
                    })}
                  />
                }
                open={isAddKidModalOpen}
                onOpenChange={setIsAddKidModalOpen}
                footer={
                  <Button
                    className="flex justify-center items-center gap-3"
                    onClick={() => {
                      setEnrolledKids((prev) => prev.concat(kids));
                      setIsAddKidModalOpen(false);
                    }}
                  >
                    <HugeiconsIcon icon={Add02Icon} />
                    Tambah ke List
                  </Button>
                }
              />
            </TableCell>
          </TableRow>
          {enrolledKids.map((kid) => (
            <TableRow key={kid.id}>
              <TableCell>{kid.name}</TableCell>
              <TableCell>{kid.dob}</TableCell>
              <TableCell>{kid.gender}</TableCell>
              <TableCell>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="waiting">Waiting List</SelectItem>
                    <SelectItem value="enrolled">Terdaftar</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell colSpan={3} className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEnrolledKids(
                      enrolledKids.filter((k) => k.id !== kid.id)
                    );
                  }}
                >
                  <HugeiconsIcon
                    icon={Cancel02Icon}
                    aria-label="cancel"
                    color="red"
                  />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-center">
              <Button className="flex justify-center items-center gap-3">
                <HugeiconsIcon icon={SaveIcon} />
                Simpan
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
