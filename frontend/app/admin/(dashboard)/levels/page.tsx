"use client";
import React, { useState } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { MOCK_LEVELS } from '@/constants/admin/constants';
import { Badge } from '@/components/admin/UI';
import { DoctorLevel } from '@/types/admin/types';

export default function LevelsPage() {
  const [levels, setLevels] = useState<DoctorLevel[]>(MOCK_LEVELS);

  const columns = [
    { 
      header: 'Level Name', 
      accessor: (item: DoctorLevel) => (
        <Badge variant="info">{item.level}</Badge>
      ) 
    },
    { header: 'Experience Required', accessor: 'experienceRequired' as keyof DoctorLevel },
  ];

  const fields = [
    { key: 'level', label: 'Level Name', type: 'text' },
    { key: 'experienceRequired', label: 'Experience Range', type: 'text' },
  ];

  return (
    <GenericCrudView
      title="Doctor Levels" data={levels} columns={columns} fields={fields}
      onAdd={(n: any) => setLevels([{ ...n, id: `lvl-${Date.now()}` }, ...levels])}
      onUpdate={(u: any) => setLevels(levels.map(l => l.id === u.id ? u : l))}
      onDelete={(id: string) => setLevels(levels.filter(l => l.id !== id))}
    />
  );
}