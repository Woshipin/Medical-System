import { Doctor, Service, Department, DoctorPosition, DoctorLevel, SystemUser } from '@/types/admin/types';

// 使用固定时间，防止 Hydration 错误
const dateNow = "2024-02-09T10:00:00.000Z";

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dep-1', name: 'Cardiology', head: 'Dr. Sarah Smith', location: 'Wing A, Floor 2', createdAt: dateNow },
  { id: 'dep-2', name: 'Neurology', head: 'Dr. James Doe', location: 'Wing B, Floor 3', createdAt: dateNow },
  { id: 'dep-3', name: 'Pediatrics', head: 'Dr. Emily Blunt', location: 'Wing C, Floor 1', createdAt: dateNow },
  { id: 'dep-4', name: 'Orthopedics', head: 'Dr. Mark Hunt', location: 'Wing A, Floor 1', createdAt: dateNow },
];

export const MOCK_POSITIONS: DoctorPosition[] = [
  { id: 'pos-1', title: 'Senior Consultant', code: 'SC', createdAt: dateNow },
  { id: 'pos-2', title: 'Resident', code: 'RES', createdAt: dateNow },
  { id: 'pos-3', title: 'Intern', code: 'INT', createdAt: dateNow },
  { id: 'pos-4', title: 'Specialist', code: 'SPC', createdAt: dateNow },
];

export const MOCK_LEVELS: DoctorLevel[] = [
  { id: 'lvl-1', level: 'Junior', experienceRequired: '0-2 Years', createdAt: dateNow },
  { id: 'lvl-2', level: 'Mid-Level', experienceRequired: '3-5 Years', createdAt: dateNow },
  { id: 'lvl-3', level: 'Senior', experienceRequired: '5+ Years', createdAt: dateNow },
  { id: 'lvl-4', level: 'Expert', experienceRequired: '10+ Years', createdAt: dateNow },
];

export const MOCK_SERVICES: Service[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `svc-${i}`,
  name: `Medical Service ${i + 1}`,
  code: `SVC-${100 + i}`,
  price: 50 + (i * 10), // 固定增长，不随机
  description: 'Standard medical procedure description.',
  active: i % 10 !== 0, // 固定逻辑，不随机
  createdAt: dateNow,
}));

export const MOCK_DOCTORS: Doctor[] = Array.from({ length: 35 }).map((_, i) => ({
  id: `doc-${i}`,
  name: `Dr. User ${i + 1}`,
  email: `doctor${i}@medicare.com`,
  position: MOCK_POSITIONS[i % MOCK_POSITIONS.length].title,
  department: MOCK_DEPARTMENTS[i % MOCK_DEPARTMENTS.length].name,
  level: MOCK_LEVELS[i % MOCK_LEVELS.length].level,
  status: i % 4 === 0 ? 'On Leave' : 'Active', // 固定逻辑，不随机
  createdAt: dateNow,
}));

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'doctors', label: 'Doctors', icon: 'Stethoscope' },
  { id: 'services', label: 'Services', icon: 'Activity' },
  { id: 'departments', label: 'Departments', icon: 'Building2' },
  { id: 'positions', label: 'Doctor Positions', icon: 'Briefcase' },
  { id: 'levels', label: 'Doctor Levels', icon: 'Award' },
];

export const MOCK_USERS: SystemUser[] = [
  { id: 'u-1', name: 'Super Admin', email: 'super@medicare.com', role: 'Super Admin', status: 'Active', createdAt: "2024-02-09T10:00:00.000Z" },
  { id: 'u-2', name: 'John Admin', email: 'john@medicare.com', role: 'Admin', status: 'Active', createdAt: "2024-02-09T10:00:00.000Z" },
  { id: 'u-3', name: 'Sarah Editor', email: 'sarah@medicare.com', role: 'Editor', status: 'Inactive', createdAt: "2024-02-09T10:00:00.000Z" },
];