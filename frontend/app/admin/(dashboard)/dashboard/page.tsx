"use client";
import React from 'react';
import { Users, Building2, Activity, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MOCK_DOCTORS, MOCK_DEPARTMENTS, MOCK_SERVICES } from '@/constants/admin/constants';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Doctors', value: MOCK_DOCTORS.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Departments', value: MOCK_DEPARTMENTS.length, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Services', value: MOCK_SERVICES.length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Revenue (Today)', value: '$12,450', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const chartData = [
    { name: 'Mon', patients: 120, revenue: 5000 },
    { name: 'Tue', patients: 145, revenue: 6200 },
    { name: 'Wed', patients: 132, revenue: 5800 },
    { name: 'Thu', patients: 156, revenue: 6500 },
    { name: 'Fri', patients: 189, revenue: 8000 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-96">
          <h3 className="text-lg font-bold mb-4">Weekly Patient Volume</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="patients" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-96">
          <h3 className="text-lg font-bold mb-4">Revenue Growth</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}