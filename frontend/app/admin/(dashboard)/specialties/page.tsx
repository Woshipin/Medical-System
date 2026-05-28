"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ChevronDown,
  Activity
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

// ==========================================
// Environment Variables & Constants
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

export interface Specialty {
  id?: number;
  name: string;
  status: number; // 0 = 停用, 1 = 启用
}

// -----------------
// UI Helper Component (Badge)
// -----------------
const Badge = ({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "success" | "danger" | "info" | "warning" | "secondary";
}) => {
  const colors = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    secondary: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[variant]}`}>
      {children}
    </span>
  );
};

// -----------------
// Toast Notification Component
// -----------------
const Toast = ({ show, message, type, onClose }: { show: boolean, message: string, type: 'success' | 'error', onClose: () => void }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
      <div className={`pointer-events-auto w-[90%] md:w-[50%] flex items-center justify-between gap-3 px-6 py-4 rounded-xl shadow-2xl border animate-in zoom-in-95 fade-in duration-300 ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        <div className="flex items-center gap-3">
          {type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />}
          <span className="font-semibold text-base flex-1 leading-snug">{message}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 p-1"><X className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default function SpecialtiesPage() {
  // Data states
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Form and validation states
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete and notification states
  const [viewData, setViewData] = useState<Specialty | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return { 
        "Content-Type": "application/json", 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    };
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/Specialty`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setSpecialties(json.data || []);
      } else {
        throw new Error("Failed to fetch specialties");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("error", "Failed to load medical specialties.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filtering Logic
  const filteredSpecialties = useMemo(() => {
    return specialties.filter((s) => {
      const matchSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status?.toString() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [specialties, searchTerm, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSpecialties.length / itemsPerPage);
  const paginatedSpecialties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSpecialties.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSpecialties, currentPage, itemsPerPage]);

  // ---------------
  // Modal Handlers
  // ---------------
  const openCreateModal = () => {
    setModalMode("create");
    setErrors({});
    setFormData({ name: "", status: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (spec: Specialty) => {
    setModalMode("edit");
    setErrors({});
    setFormData({ id: spec.id, name: spec.name, status: spec.status ?? 1 });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Create / Update Save Handler
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "Please enter medical specialty name.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const targetStatusValue = (formData.status === "1" || formData.status === 1 || formData.status === "true" || formData.status === true) ? 1 : 0;

      const payload: Specialty = {
        name: formData.name,
        status: targetStatusValue,
      };

      if (formData.id) {
        payload.id = formData.id;
      }

      const url = modalMode === "create" ? `${API_BASE_URL}/Specialty` : `${API_BASE_URL}/Specialty/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        setIsModalOpen(false);
        showToast("success", modalMode === "create" ? "Specialty created successfully!" : "Specialty updated successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        showToast("error", errorData.message || "Failed to save specialty data.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred. Please try again.");
    }
  };

  // Delete Handler
  const confirmDelete = async () => {
    if (!specialtyToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/Specialty/${specialtyToDelete}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        showToast("success", "Specialty deleted successfully.");
        fetchData();
      } else {
        const errorData = await res.json();
        showToast("error", errorData.message || "Failed to delete specialty.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred while deleting.");
    } finally {
      setIsDeleteAlertOpen(false);
      setSpecialtyToDelete(null);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Specialties</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Manage clinical departments and doctor professional specialties.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Specialty
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[50%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-colors"
            placeholder="Search by specialty name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="hidden sm:flex items-center text-sm font-semibold text-slate-800"><Filter className="w-4 h-4 mr-1.5" /> Filters:</div>

          <div className="relative flex-1 sm:flex-none">
            <select className="w-full sm:w-48 appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-10 text-center text-slate-600 font-medium text-sm">Loading specialties...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Medical Specialty</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSpecialties.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-600 font-medium text-sm">No specialties found.</td></tr>
                ) : (
                  paginatedSpecialties.map((spec) => (
                    <tr key={spec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900 text-sm">{spec.name}</td>
                      <td className="px-5 py-3">
                        <Badge variant={spec.status === 1 ? "success" : "danger"}>
                          {spec.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setViewData(spec); setIsViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(spec)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { setSpecialtyToDelete(spec.id!); setIsDeleteAlertOpen(true); }} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && filteredSpecialties.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSpecialties.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ========================================= */}
      {/* Create / Edit Modal                       */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Create Specialty" : "Edit Specialty"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specialty Name</label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-slate-400'}`}><Activity className="w-4 h-4" /></div>
                  <input type="text" name="name" value={formData.name || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.name ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="e.g. Cardiology" />
                </div>
                {errors.name && <p className="text-red-500 text-[11px] mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Operational Status</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Activity className="w-4 h-4" /></div>
                  <select name="status" value={formData.status !== undefined ? formData.status.toString() : "1"} onChange={handleInputChange} className="appearance-none w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                    <option value="1">Active (Operating)</option>
                    <option value="0">Inactive (Closed)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold transition">Cancel</button>
              <button onClick={handleSave} className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold shadow-sm transition">Save Specialty</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* View Modal                                */}
      {/* ========================================= */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Specialty Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Specialty Name", value: viewData.name, icon: Activity },
                  { label: "Status", value: viewData.status === 1 ? "Active" : "Inactive", icon: Activity, isBadge: true, variant: viewData.status === 1 ? "success" : "danger" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><item.icon className="w-4 h-4 text-slate-500" /></div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                      {item.isBadge ? <div className="mt-1"><Badge variant={item.variant as any}>{item.value}</Badge></div> : <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Delete Confirmation                       */}
      {/* ========================================= */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Specialty</h3>
            <p className="text-slate-600 text-sm font-medium mb-6">Are you sure you want to delete this specialty? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setIsDeleteAlertOpen(false)} className="flex-1 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-semibold transition">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold shadow-sm transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}