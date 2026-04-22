"use client";
import React, { useState } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { MOCK_SERVICES } from '@/constants/admin/constants';
import { Badge } from '@/components/admin/UI';
import { Service } from '@/types/admin/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);

  const columns = [
    { 
      header: 'Service Detail', 
      accessor: (item: Service) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900">{item.name}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.code}</span>
        </div>
      ) 
    },
    { 
      header: 'Price', 
      accessor: (item: Service) => <span className="text-emerald-600 font-black">${Number(item.price).toLocaleString()}</span>
    },
    { 
      header: 'Status', 
      accessor: (item: Service) => (
        <Badge variant={item.active ? 'success' : 'danger'}>{item.active ? 'Active' : 'Inactive'}</Badge>
      ) 
    },
  ];

  const fields = [
    { key: 'name', label: 'Service Name', type: 'text' },
    { key: 'code', label: 'Service Code', type: 'text' },
    { key: 'price', label: 'Price ($)', type: 'number' },
    { key: 'active', label: 'Status', type: 'select', options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' }
    ]}
  ];

  return (
    <GenericCrudView
      title="Medical Services" data={services} columns={columns} fields={fields}
      onAdd={(n: any) => setServices([{ ...n, id: `svc-${Date.now()}`, active: n.active === 'true' }, ...services])}
      onUpdate={(u: any) => setServices(services.map(s => s.id === u.id ? { ...u, active: String(u.active) === 'true' } : s))}
      onDelete={(id: string) => setServices(services.filter(s => s.id !== id))}
    />
  );
}