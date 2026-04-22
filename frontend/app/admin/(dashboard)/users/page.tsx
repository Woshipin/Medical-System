"use client";
import React, { useState } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { Badge } from '@/components/admin/UI';
import { SystemUser } from '@/types/admin/types';
import { MOCK_USERS } from '@/constants/admin/constants';

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);

  // 定义表格列 - 已经将 Name 和 Email 拆分为独立列
  const columns = [
    { 
      header: 'Full Name', 
      accessor: (item: SystemUser) => (
        <span className="font-black text-slate-900">{item.name}</span>
      ) 
    },
    { 
      header: 'Email Address', 
      accessor: (item: SystemUser) => (
        <span className="text-sm font-bold text-slate-500">{item.email}</span>
      ) 
    },
    { 
      header: 'Role', 
      accessor: (item: SystemUser) => {
        const roleColors: any = {
          'Super Admin': 'danger', // 红色代表最高权限
          'Admin': 'info',        // 蓝色代表普通管理
          'Doctor': 'warning'     // 黄色代表医生
        };
        return <Badge variant={roleColors[item.role]}>{item.role}</Badge>;
      }
    },
    { 
      header: 'Status', 
      accessor: (item: SystemUser) => (
        <Badge variant={item.status === 'Active' ? 'success' : 'danger'}>
          {item.status}
        </Badge>
      ) 
    },
  ];

  // 定义表单字段 (Modal 弹窗中的输入项)
  const fields = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'email', label: 'Email Address', type: 'email' },
    { 
      key: 'role', 
      label: 'System Role', 
      type: 'select', 
      options: [
        { value: 'Super Admin', label: 'Super Admin' },
        { value: 'Admin', label: 'Admin' },
        { value: 'Doctor', label: 'Doctor' }
      ]
    },
    { 
      key: 'status', 
      label: 'Account Status', 
      type: 'select', 
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    }
  ];

  return (
    <GenericCrudView
      title="System Administrators"
      data={users}
      columns={columns}
      fields={fields}
      onAdd={(n: any) => setUsers([{ ...n, id: `user-${Date.now()}` }, ...users])}
      onUpdate={(u: any) => setUsers(users.map(user => user.id === u.id ? u : user))}
      onDelete={(id: string) => setUsers(users.filter(user => user.id !== id))}
    />
  );
}