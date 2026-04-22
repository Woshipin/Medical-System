"use client";
import React, { useState } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { MOCK_POSITIONS } from '@/constants/admin/constants';
import { DoctorPosition } from '@/types/admin/types';

export default function PositionsPage() {
  const [positions, setPositions] = useState<DoctorPosition[]>(MOCK_POSITIONS);

  const columns = [
    { header: 'Title', accessor: (item: DoctorPosition) => <span className="font-black text-slate-900">{item.title}</span> },
    { header: 'Code', accessor: (item: DoctorPosition) => <span className="font-mono text-blue-600 font-bold">{item.code}</span> },
  ];

  const fields = [
    { key: 'title', label: 'Position Title', type: 'text' },
    { key: 'code', label: 'Position Short Code', type: 'text' },
  ];

  return (
    <GenericCrudView
      title="Doctor Positions" data={positions} columns={columns} fields={fields}
      onAdd={(n: any) => setPositions([{ ...n, id: `pos-${Date.now()}` }, ...positions])}
      onUpdate={(u: any) => setPositions(positions.map(p => p.id === u.id ? u : p))}
      onDelete={(id: string) => setPositions(positions.filter(p => p.id !== id))}
    />
  );
}