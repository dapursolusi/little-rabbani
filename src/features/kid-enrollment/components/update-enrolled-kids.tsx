import { useState } from 'react';

import { LeanKid } from '@/features/kid/types';
import {
  Add02Icon,
  AddTeamIcon,
  Cancel02Icon,
  DatabaseSyncIcon,
  SaveIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function CheckboxInTable({
  kids,
  selectedRows,
  onSelectedRowsChange,
}: {
  kids: LeanKid[];
  selectedRows: Set<string>;
  onSelectedRowsChange: (selectedRows: Set<string>) => void;
}) {
  const selectAll = selectedRows.size === kids.length;
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedRowsChange(new Set(kids.map((kid) => kid.id)));
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
        {kids.map((kid) => (
          <TableRow
            key={kid.id}
            data-state={selectedRows.has(kid.id) ? 'selected' : undefined}
          >
            <TableCell>
              <Checkbox
                id={`row-${kid.id}-checkbox`}
                name={`row-${kid.id}-checkbox`}
                checked={selectedRows.has(kid.id)}
                onCheckedChange={(checked) =>
                  handleSelectRow(kid.id, checked === true)
                }
              />
            </TableCell>
            <TableCell className="font-medium">{kid.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function UpdateEnrolledKids({
  isUpdateMode,
  onUpdateToggle,
  kids,
  onAdd,
  selectedClassSessionId,
  hasChanges,
}: {
  isUpdateMode: boolean;
  onUpdateToggle: () => void;
  kids: LeanKid[];
  onAdd?: (selectedKids: Set<string>) => void;
  selectedClassSessionId: string;
  hasChanges: boolean;
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAddKidModalOpen, setIsAddKidModalOpen] = useState(false);

  const noSessionSelected = selectedClassSessionId === 'all';

  return (
    <div className="flex items-center justify-end gap-2">
      {isUpdateMode && (
        <div className="flex items-center justify-end gap-2">
          {noSessionSelected ? (
            <Button disabled variant="default">
              <HugeiconsIcon icon={AddTeamIcon} />
              Tambah Murid ke Batch
            </Button>
          ) : (
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
                  kids={kids.map((kid) => {
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
                  onClick={() => onAdd?.(selectedRows)}
                >
                  <HugeiconsIcon icon={Add02Icon} />
                  Tambah ke List
                </Button>
              }
            />
          )}
          {hasChanges && (
            <Button>
              <HugeiconsIcon icon={SaveIcon} className="mr-1" />
              Simpan Perubahan
            </Button>
          )}
        </div>
      )}
      <Button onClick={onUpdateToggle} hidden={isUpdateMode}>
        <HugeiconsIcon icon={DatabaseSyncIcon} className="mr-1" />
        Update Registrasi Murid
      </Button>
      <Button
        onClick={onUpdateToggle}
        variant="destructive"
        hidden={!isUpdateMode}
      >
        <HugeiconsIcon icon={Cancel02Icon} className="mr-1" />
        Batal
      </Button>
    </div>
  );
}
