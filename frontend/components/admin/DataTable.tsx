"use client";
import React from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './UI';

export function DataTable<T extends { id: string }>({ data, columns, currentPage, totalItems, itemsPerPage, onPageChange, onEdit, onDelete, onView }: any) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                {columns.map((col: any, i: number) => (
                  <th key={i} className="px-6 py-4 font-black text-slate-700 uppercase text-[11px] tracking-widest">{col.header}</th>
                ))}
                <th className="px-6 py-4 font-black text-slate-700 uppercase text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item: T) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col: any, i: number) => (
                    <td key={i} className="px-6 py-4 text-sm font-bold text-slate-800">
                      {/* 这里优先使用函数渲染，其次是 key 访问 */}
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor as keyof T] as any) || '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onView(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Eye size={18} /></button>
                      <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18} /></button>
                      <button onClick={() => onDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 补全的分页逻辑 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-bold text-slate-500">
            Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of {totalItems}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={16}/></Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => onPageChange(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'}`}>{i+1}</button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={16}/></Button>
          </div>
        </div>
      )}
    </div>
  );
}