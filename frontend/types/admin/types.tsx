export type Role = 'superadmin' | 'admin' | 'doctor';

export interface BaseEntity {
  id: string;
  createdAt: string;
}

export interface Doctor extends BaseEntity {
  name: string;
  email: string;
  position: string;
  department: string;
  level: string;
  status: 'Active' | 'On Leave';
}

export interface Service extends BaseEntity {
  name: string;
  code: string;
  price: number;
  description: string;
  active: boolean;
}

export interface Department extends BaseEntity {
  name: string;
  head: string;
  location: string;
}

export interface DoctorPosition extends BaseEntity {
  title: string;
  code: string;
}

export interface DoctorLevel extends BaseEntity {
  level: string;
  experienceRequired: string;
}

// UI Types
export type ViewName = 'dashboard' | 'doctors' | 'services' | 'departments' | 'positions' | 'levels';

export interface AlertState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Editor';
  status: 'Active' | 'Inactive';
  createdAt: string;
}