"use client";
import React, { useState } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { MOCK_DEPARTMENTS } from '@/constants/admin/constants';
import { Department } from '@/types/admin/types';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);

  const columns = [
    { 
      header: 'Department Name', 
      accessor: (item: Department) => <span className="font-black text-slate-900">{item.name}</span>
    },
    { header: 'Head of Dept', accessor: 'head' as keyof Department },
    { header: 'Location', accessor: 'location' as keyof Department },
  ];

  const fields = [
    { key: 'name', label: 'Department Name', type: 'text' },
    { key: 'head', label: 'Head Physician', type: 'text' },
    { key: 'location', label: 'Location / Floor', type: 'text' },
  ];

  return (
    <GenericCrudView
      title="Departments" data={departments} columns={columns} fields={fields}
      onAdd={(n: any) => setDepartments([{ ...n, id: `dep-${Date.now()}` }, ...departments])}
      onUpdate={(u: any) => setDepartments(departments.map(d => d.id === u.id ? u : d))}
      onDelete={(id: string) => setDepartments(departments.filter(d => d.id !== id))}
    />
  );
}