import { useState } from 'react';

import { ENROLLMENT_STATUS_LABELS } from '@/db/schema';
import { Kid } from '@/features/kid/types';
import {
  Add02Icon,
  AddTeamIcon,
  Cancel02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

function CheckboxInTable({
  tableData,
  selectedRows,
  onSelectedRowsChange,
}: {
  tableData: { id: string; name: string }[];
  selectedRows: Set<string>;
  onSelectedRowsChange: (selectedRows: Set<string>) => void;
}) {
  const selectAll = selectedRows.size === tableData.length;
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedRowsChange(new Set(tableData.map((row) => row.id)));
    } else {
      onSelectedRowsChange(new Set());
    }
  };
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectedRowsChange(newSelected);
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

export default function SelectEnrolledKidsTable({
  kids,
  value,
  onChange,
}: {
  kids: Kid[];
  value: Kid[];
  onChange: (value: Kid[]) => void;
}) {
  const [isAddKidModalOpen, setIsAddKidModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  return (
    <>
      <Separator />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Tanggal Lahir</TableHead>
            <TableHead>Jenis Kelamin</TableHead>
            <TableHead>Status Registrasi</TableHead>
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
                    selectedRows={selectedRows}
                    onSelectedRowsChange={setSelectedRows}
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
                      const toAdd = kids.filter(
                        (k) =>
                          selectedRows.has(k.id) &&
                          !value.some((v) => v.id === k.id)
                      );
                      onChange(value.concat(toAdd));
                      setSelectedRows(new Set());
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
          {value?.map((kid) => (
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
                    {Object.entries(ENROLLMENT_STATUS_LABELS).map(
                      ([status, label]) => (
                        <SelectItem key={status} value={status}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell colSpan={3} className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onChange(value.filter((k) => k.id !== kid.id));
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
          {/* <TableRow>
            <TableCell colSpan={3} className="text-center">
              <Button className="flex justify-center items-center gap-3">
                <HugeiconsIcon icon={SaveIcon} />
                Simpan
              </Button>
            </TableCell>
          </TableRow> */}
        </TableBody>
      </Table>
    </>
  );
}
