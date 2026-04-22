"use client";
import React, { useState } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { MOCK_DOCTORS } from '@/constants/admin/constants';
import { Badge } from '@/components/admin/UI';
import { Doctor } from '@/types/admin/types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);

  const columns = [
    { 
      header: 'Doctor Name', 
      accessor: (item: Doctor) => (
        <div className="flex flex-col"><span className="font-black text-slate-900">{item.name}</span><span className="text-[10px] text-slate-400 font-bold uppercase">{item.email}</span></div>
      ) 
    },
    // 注意这里 accessor: 'department' 必须匹配新增时的 key
    { header: 'Department', accessor: 'department' as keyof Doctor },
    { header: 'Position', accessor: 'position' as keyof Doctor },
    { 
      header: 'Status', 
      accessor: (item: Doctor) => (
        <Badge variant={item.status === 'Active' ? 'success' : 'warning'}>{item.status}</Badge>
      ) 
    },
  ];

  const fields = [
    { key: 'name', label: 'Doctor Full Name', type: 'text' },
    { key: 'email', label: 'Email Address', type: 'text' },
    // 这里的 key 必须是 'department'
    { key: 'department', label: 'Department', type: 'select', options: [
      { value: 'Cardiology', label: 'Cardiology' },
      { value: 'Neurology', label: 'Neurology' },
      { value: 'Pediatrics', label: 'Pediatrics' },
      { value: 'Orthopedics', label: 'Orthopedics' }
    ]},
    { key: 'position', label: 'Position', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'Active', label: 'Active' },
      { value: 'On Leave', label: 'On Leave' }
    ]}
  ];

  return (
    <GenericCrudView
      title="Doctors" data={doctors} columns={columns} fields={fields}
      onAdd={(n: any) => setDoctors([{ ...n, id: `doc-${Date.now()}` }, ...doctors])}
      onUpdate={(u: any) => setDoctors(doctors.map(d => d.id === u.id ? u : d))}
      onDelete={(id: string) => setDoctors(doctors.filter(d => d.id !== id))}
    />
  );
}