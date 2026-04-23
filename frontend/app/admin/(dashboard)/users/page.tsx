"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { GenericCrudView } from '@/components/admin/GenericCrudView';
import { Badge } from '@/components/admin/UI';
// 如果有 UI 组件库可以使用，没有的话原生的 select 也可以
import { Search, Filter } from 'lucide-react'; 

// 根据后端模型定义 TypeScript 接口
interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  genderId: number;
  gender?: { name: string };
  role: number; // 0=SuperAdmin, 1=Admin, 2=Doctor, 3=Patient
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // 获取 Token 的辅助方法 (根据你实际的认证机制修改，例如 localStorage 或 cookies)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // 替换为你获取token的方式
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. 获取所有用户数据 (Read)
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user', { headers: getAuthHeaders() });
      if (response.ok) {
        const json = await response.json();
        // 假设后端的 ApiResponse<T> 结构为 { success: true, data: [...] }
        setUsers(json.data || []); 
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 辅助函数：角色映射
  const getRoleInfo = (roleInt: number) => {
    switch (roleInt) {
      case 0: return { name: 'Super Admin', color: 'danger' };
      case 1: return { name: 'Admin', color: 'info' };
      case 2: return { name: 'Doctor', color: 'warning' };
      case 3: return { name: 'Patient', color: 'success' };
      default: return { name: 'Unknown', color: 'secondary' };
    }
  };

  // 2. 数据过滤逻辑 (多维度组合查询)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm);
      
      const matchRole = roleFilter === 'all' || user.role.toString() === roleFilter;
      const matchStatus = statusFilter === 'all' || user.isActive.toString() === statusFilter;
      const matchGender = genderFilter === 'all' || user.genderId.toString() === genderFilter;

      return matchSearch && matchRole && matchStatus && matchGender;
    });
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter]);

  // 3. 表格列定义
  const columns = [
    { 
      header: 'Full Name', 
      accessor: (item: SystemUser) => <span className="font-bold text-slate-900">{item.fullName}</span> 
    },
    { 
      header: 'Email', 
      accessor: (item: SystemUser) => <span className="text-sm text-slate-500">{item.email}</span> 
    },
    { 
      header: 'Phone Number', 
      accessor: (item: SystemUser) => <span className="text-sm text-slate-600">{item.phoneNumber || 'N/A'}</span> 
    },
    { 
      header: 'Gender', 
      accessor: (item: SystemUser) => (
        <span className="text-sm">
          {item.gender?.name || (item.genderId === 1 ? 'Male' : item.genderId === 2 ? 'Female' : 'Unknown')}
        </span>
      ) 
    },
    { 
      header: 'Role', 
      accessor: (item: SystemUser) => {
        const roleInfo = getRoleInfo(item.role);
        return <Badge variant={roleInfo.color as any}>{roleInfo.name}</Badge>;
      }
    },
    { 
      header: 'Status', 
      accessor: (item: SystemUser) => (
        <Badge variant={item.isActive ? 'success' : 'danger'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ) 
    },
  ];

  // 4. 表单字段定义 (Modal 弹窗)
  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    // 注意：如果是新增，后端需要 Password
    { key: 'password', label: 'Password (For Create)', type: 'password' }, 
    { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
    { 
      key: 'genderId', 
      label: 'Gender', 
      type: 'select', 
      options: [
        { value: 1, label: 'Male' },
        { value: 2, label: 'Female' }
      ]
    },
    { 
      key: 'role', 
      label: 'System Role', 
      type: 'select', 
      options: [
        { value: 0, label: 'Super Admin' },
        { value: 1, label: 'Admin' },
        { value: 2, label: 'Doctor' },
        { value: 3, label: 'Patient' }
      ]
    },
    { 
      key: 'isActive', 
      label: 'Account Status', 
      type: 'select', 
      options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' }
      ]
    }
  ];

  // 5. CRUD 处理函数
  const handleAdd = async (formData: any) => {
    try {
      // 匹配后端的 UserManagementDto
      const payload = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        genderId: Number(formData.genderId),
        role: Number(formData.role),
        phoneNumber: formData.phoneNumber // 提示：如果后端保存电话，需更新后端DTO
      };

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) fetchUsers(); // 刷新数据
      else alert('Failed to create user');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      // 匹配后端的 UserUpdateDto
      const payload = {
        fullName: formData.fullName,
        isActive: formData.isActive === 'true' || formData.isActive === true,
        genderId: Number(formData.genderId),
        phoneNumber: formData.phoneNumber
      };

      const res = await fetch(`/api/user/${formData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) fetchUsers();
      else alert('Failed to update user');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/user/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (res.ok) fetchUsers();
      else alert('Failed to delete user');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 优化的筛选栏设计 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              placeholder="Search by Name, Email or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center text-sm text-slate-500">
              <Filter className="w-4 h-4 mr-1" /> Filters:
            </div>
            
            {/* Role Filter */}
            <select
              className="border border-slate-300 rounded-lg text-sm py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="0">Super Admin</option>
              <option value="1">Admin</option>
              <option value="2">Doctor</option>
              <option value="3">Patient</option>
            </select>

            {/* Status Filter */}
            <select
              className="border border-slate-300 rounded-lg text-sm py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Gender Filter */}
            <select
              className="border border-slate-300 rounded-lg text-sm py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="all">All Genders</option>
              <option value="1">Male</option>
              <option value="2">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* CRUD 表格视图 */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Loading users...</div>
      ) : (
        <GenericCrudView
          title="All Users"
          data={filteredUsers}
          columns={columns}
          fields={fields}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}