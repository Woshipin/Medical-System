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
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Building2,
  MapPin,
  Activity,
  AlertCircle
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

// ==========================================
// Environment Variables & Constants
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

export interface Department {
  id?: number;
  name: string;
  location: string;
  status: number; // 0 = Inactive, 1 = Active
}

/* ─────────────────────────────────────────────────────────
   EXTRACTORS & HELPERS
───────────────────────────────────────────────────────── */
const getBackendMessage = (result: any): string | null => {
  if (!result) return null;
  const msg = result.message ?? result.Message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return null;
};

// Converts keys to fully lowercase to match simple React element binding (e.g. errors.name)
const getFieldErrors = (result: any): Record<string, string> => {
  const map: Record<string, string> = {};
  const errors = result?.errors ?? result?.Errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return map;
  for (const [key, val] of Object.entries(errors)) {
    map[key.toLowerCase().replace(/\s/g, '')] =
      Array.isArray(val) ? String((val as any[])[0]) : String(val);
  }
  return map;
};

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
// Toast Notification Component (Aligned with Sidebar)
// -----------------
const Toast: React.FC<{
  show: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}> = ({ show, message, type, onClose }) => {
  if (!show) return null;
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-xl px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto font-sans border-l-4 ${
      type === "success" ? "border-emerald-500" : "border-red-500"
    }`}>
      {type === "success" ? (
        <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={17} />
      ) : (
        <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={17} />
      )}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-xs font-bold ${type === "success" ? "text-emerald-700" : "text-red-700"}`}>
          {type === "success" ? "Operation Successful" : "Notification"}
        </p>
        <p className="text-xs text-slate-600 mt-0.5 break-words">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 shrink-0 self-center"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default function DepartmentsPage() {
  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [viewData, setViewData] = useState<Department | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    return { 
        "Content-Type": "application/json", 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    };
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/Department`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        throw new Error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("error", "Failed to load department database.");
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
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchSearch =
        dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "all" || dept.status?.toString() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartments, currentPage, itemsPerPage]);

  // ---------------
  // Modal Handlers
  // ---------------
  const openCreateModal = () => {
    setModalMode("create");
    setErrors({});
    setFormData({ name: "", location: "", status: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setModalMode("edit");
    setErrors({});
    setFormData({ id: dept.id, name: dept.name, location: dept.location, status: dept.status ?? 1 }); 
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    const errKey = name.toLowerCase();
    if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: "" })); 
  };

  // Create / Update Save Handler
  const handleSave = async () => {
    setErrors({});
    setToast((t) => ({ ...t, show: false }));

    try {
      const targetStatusValue = (formData.status === "1" || formData.status === 1 || formData.status === "true" || formData.status === true) ? 1 : 0;

      const payload: Department = {
        name: formData.name,
        location: formData.location,
        status: targetStatusValue,
      };

      if (formData.id) {
        payload.id = formData.id;
      }

      const url = modalMode === "create" ? `${API_BASE_URL}/Department` : `${API_BASE_URL}/Department/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
      const result = await res.json();
      
      // Assume creation responses containing 'success: true' wrapper or standard entity payload if ok
      const isSuccess = res.ok && (result?.success === true || result?.id !== undefined);

      if (isSuccess) {
        setIsModalOpen(false);
        showToast("success", getBackendMessage(result) || (modalMode === "create" ? "Department created successfully!" : "Department updated successfully!"));
        fetchData();
      } else {
        const fields = getFieldErrors(result);
        if (Object.keys(fields).length > 0) {
          setErrors(fields);
        }
        showToast("error", getBackendMessage(result) || "Operation failed. Please correct the fields below.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred. Please try again.");
    }
  };

  // Delete Handler
  const confirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/Department/${deptToDelete}`, { method: "DELETE", headers: getHeaders() });
      
      // Deal with NO CONTENT response or Custom JSON structure
      let result = null;
      if (res.headers.get("content-type")?.includes("application/json")) {
        result = await res.json();
      }

      if (res.ok) {
        showToast("error", getBackendMessage(result) || "Department deleted successfully.");
        fetchData();
      } else {
        showToast("error", getBackendMessage(result) || "Failed to delete department.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred while deleting.");
    } finally {
      setIsDeleteAlertOpen(false);
      setDeptToDelete(null);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Departments Management</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage hospital departments and their locations.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
          <Plus className="w-4.5 h-4.5" /> Add Department
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-[25%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 font-semibold"
            placeholder="Search by department name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="hidden sm:flex items-center text-sm font-semibold text-slate-800"><Filter className="w-4 h-4 mr-1.5" /> Filters:</div>

          <div className="relative flex-1 sm:flex-none">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading department database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department Name</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location / Floor</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDepartments.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">No departments found.</td></tr>
                ) : (
                  paginatedDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">{dept.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{dept.location}</td>
                      <td className="px-5 py-4">
                        <Badge variant={dept.status === 1 ? "success" : "danger"}>
                          {dept.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => { setViewData(dept); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button>
                          <button onClick={() => openEditModal(dept)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4.5 h-4.5" /></button>
                          <button onClick={() => { setDeptToDelete(dept.id!); setIsDeleteAlertOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4.5 h-4.5" /></button>
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
        {!isLoading && filteredDepartments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDepartments.length}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Create Department" : "Edit Department"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50/20">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department Name *</label>
                <div className="relative">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-slate-400'}`}><Building2 className="w-4.5 h-4.5" /></div>
                  <input type="text" name="name" value={formData.name || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl outline-none transition-all border ${errors.name ? "bg-rose-50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`} placeholder="e.g. Cardiology" />
                </div>
                {errors.name && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location / Floor *</label>
                <div className="relative">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.location ? 'text-red-400' : 'text-slate-400'}`}><MapPin className="w-4.5 h-4.5" /></div>
                  <input type="text" name="location" value={formData.location || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl outline-none transition-all border ${errors.location ? "bg-rose-50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`} placeholder="e.g. Block A, Floor 3" />
                </div>
                {errors.location && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Operational Status *</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Activity className="w-4.5 h-4.5" /></div>
                  <select name="status" value={formData.status !== undefined ? formData.status.toString() : "1"} onChange={handleInputChange} className={`appearance-none w-full pl-10 pr-3 py-2.5 text-sm font-bold border rounded-xl outline-none cursor-pointer transition-all ${errors.status ? "bg-rose-50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}>
                    <option value="1">Active (Operating)</option>
                    <option value="0">Inactive (Closed)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.status && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.status}</p>}
              </div>
            </div>

            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 font-bold transition-all">Cancel</button>
              <button onClick={handleSave} className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-md transition-all">Save Department</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* View Modal                                */}
      {/* ========================================= */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-950">Department Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Department Name", value: viewData.name, icon: Building2 },
                  { label: "Location", value: viewData.location, icon: MapPin },
                  { label: "Status", value: viewData.status === 1 ? "Active" : "Inactive", icon: Activity, isBadge: true, variant: viewData.status === 1 ? "success" : "danger" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3.5 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><item.icon className="w-4.5 h-4.5 text-slate-500" /></div>
                    <div className="overflow-hidden w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                      {item.isBadge ? <div className="mt-1"><Badge variant={item.variant as any}>{item.value}</Badge></div> : <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-150 flex justify-end shrink-0 items-center">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 bg-white transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Delete Confirmation                       */}
      {/* ========================================= */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center border w-full max-w-sm border-slate-200">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-100"><AlertTriangle className="w-7 h-7 text-rose-500" /></div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Delete Department</h3>
            <p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">Are you sure you want to delete this department? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setIsDeleteAlertOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition-all text-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}