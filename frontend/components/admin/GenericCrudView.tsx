"use client";
import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input, Modal, Select, AlertModal, ConfirmModal } from './UI';
import { DataTable } from './DataTable';

export function GenericCrudView({ title, data, onAdd, onUpdate, onDelete, fields, columns }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  const [alert, setAlert] = useState<any>({ show: false, type: 'info', message: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const filteredData = useMemo(() => 
    data.filter((item: any) => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())))
  , [data, searchTerm]);

  const itemsPerPage = 8;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenModal = (item?: any, viewOnly = false) => {
    setIsViewMode(viewOnly);
    setEditingItem(item || null);
    setFormData(item ? { ...item } : {});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return setIsModalOpen(false);
    try {
      if (editingItem) onUpdate(formData);
      else onAdd(formData);
      setAlert({ show: true, type: 'success', message: `${title} record updated!` });
      setIsModalOpen(false);
    } catch {
      setAlert({ show: true, type: 'error', message: 'Something went wrong' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 font-bold mt-1">Manage and maintain your medical data.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text" placeholder="Search database..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-12 pr-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none w-full sm:w-72 bg-white text-slate-900 font-black"
            />
          </div>
          <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-1.5" /> Add New</Button>
        </div>
      </div>

      <AlertModal alert={alert} onClose={() => setAlert({ ...alert, show: false })} />
      <ConfirmModal 
        isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => { onDelete(itemToDelete.id); setIsDeleteModalOpen(false); setAlert({show:true, type:'success', message:'Record Deleted!'}) }}
        title="Confirm Deletion" message="This record will be permanently removed."
      />

      <DataTable
        data={paginatedData} columns={columns} currentPage={currentPage}
        totalItems={filteredData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage}
        onEdit={(i: any) => handleOpenModal(i, false)}
        onDelete={(i: any) => { setItemToDelete(i); setIsDeleteModalOpen(true); }}
        onView={(i: any) => handleOpenModal(i, true)}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isViewMode ? `View Details` : editingItem ? `Edit Record` : `Add New Entry`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((f: any) => (
            <div key={f.key}>
              {f.type === 'select' ? (
                <Select label={f.label} options={f.options} value={formData[f.key] || ''} onChange={(e: any) => setFormData({ ...formData, [f.key]: e.target.value })} disabled={isViewMode} />
              ) : (
                <Input label={f.label} type={f.type} value={formData[f.key] || ''} onChange={(e: any) => setFormData({ ...formData, [f.key]: e.target.value })} disabled={isViewMode} />
              )}
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{isViewMode ? 'Close Window' : 'Cancel'}</Button>
            {!isViewMode && <Button type="submit">Save Changes</Button>}
          </div>
        </form>
      </Modal>
    </div>
  );
}