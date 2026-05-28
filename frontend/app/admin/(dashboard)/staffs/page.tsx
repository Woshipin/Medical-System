"use client"; 

import React, { useState, useEffect, useMemo, useRef } from "react"; 
import { Search, Plus, Edit, Trash2, X, AlertTriangle, Eye, User, Mail, Phone, Shield, CheckCircle2, ChevronDown, Lock, MapPin, Calendar, Upload, Camera } from "lucide-react"; 
import Pagination from "@/components/admin/Pagination"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

interface SystemStaff { 
  id: number; 
  fullName: string; 
  email: string; 
  profileImageUrl?: string;
  dateOfBirth?: string;
  phoneNumber: string | null; 
  phoneNumberAlt?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  genderId: number; 
  gender?: { id: number; name: string }; 
  role: number; 
  status: number; 
  createdAt: string; 
}

const Badge = ({ children, variant }: { children: React.ReactNode; variant: "success" | "danger" | "info" | "warning" | "secondary"; }) => {
  const colors = { 
    success: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    danger: "bg-rose-50 text-rose-700 border-rose-200", 
    info: "bg-sky-50 text-sky-700 border-sky-200", 
    warning: "bg-amber-50 text-amber-700 border-amber-200", 
    secondary: "bg-slate-50 text-slate-700 border-slate-200", 
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[variant]}`}>{children}</span>;
};

const Toast = ({ show, message, type, onClose }: { show: boolean, message: string, type: 'success' | 'error', onClose: () => void }) => { 
  if (!show) return null; 
  return ( 
    <div className="fixed inset-x-0 top-4 z-[100] flex items-center justify-center pointer-events-none p-4">
      <div className={`pointer-events-auto w-[90%] md:w-[400px] flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl shadow-xl border animate-in slide-in-from-top duration-300 ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
        <div className="flex items-center gap-2.5">
          {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
          <span className="font-semibold text-sm">{message}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default function StaffsPage() { 
  const [staffs, setStaffs] = useState<SystemStaff[]>([]); 
  const [genderOptions, setGenderOptions] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const [searchTerm, setSearchTerm] = useState(""); 
  const [roleFilter, setRoleFilter] = useState("all"); 
  const [statusFilter, setStatusFilter] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 10; 

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); 
  const [modalMode, setModalMode] = useState<"create" | "edit">("create"); 

  const [formData, setFormData] = useState<any>({}); 
  const [errors, setErrors] = useState<Record<string, string>>({}); 

  const [viewData, setViewData] = useState<SystemStaff | null>(null); 
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false); 
  const [userToDelete, setUserToDelete] = useState<number | null>(null); 
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" }); 

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => { 
    setToast({ show: true, type, message }); 
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000); 
  };

  const getAuthHeaders = () => { 
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : ""; 
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }; 
  };

  const fetchData = async () => { 
    try {
      setIsLoading(true); 
      const [usersRes, gendersRes] = await Promise.all([ 
        fetch(`${API_BASE_URL}/staff`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok) { 
        const json = await usersRes.json(); 
        setStaffs(json.data || []); 
      }
      if (gendersRes.ok) { 
        const json = await gendersRes.json(); 
        setGenderOptions((json.data || []).map((g: any) => ({ value: g.id, label: g.name }))); 
      }
    } catch { 
      showToast("error", "Failed to load database."); 
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []); 
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, statusFilter]); 

  const getRoleInfo = (roleInt: number) => { 
    switch (roleInt) {
      case 0: return { name: "Super Admin", color: "danger" }; 
      case 1: return { name: "Admin", color: "info" }; 
      default: return { name: "Unknown", color: "secondary" }; 
    }
  };

  const filteredData = useMemo(() => { 
    return staffs.filter((s) => { 
      const matchSearch = s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || s.phoneNumber?.includes(searchTerm);
      const matchRole = roleFilter === "all" || s.role.toString() === roleFilter; 
      const matchStatus = statusFilter === "all" || s.status?.toString() === statusFilter; 
      return matchSearch && matchRole && matchStatus; 
    });
  }, [staffs, searchTerm, roleFilter, statusFilter]); 

  const totalPages = Math.ceil(filteredData.length / itemsPerPage); 
  const paginatedData = useMemo(() => { 
    const startIndex = (currentPage - 1) * itemsPerPage; 
    return filteredData.slice(startIndex, startIndex + itemsPerPage); 
  }, [filteredData, currentPage, itemsPerPage]); 

  const openCreateModal = () => { 
    setModalMode("create"); setErrors({}); 
    setFormData({ 
      fullName: "", email: "", password: "", genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      profileImageUrl: "", dateOfBirth: "", phoneNumber: "", phoneNumberAlt: "",
      addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "",
      role: 1, status: 1
    });
    setIsModalOpen(true); 
  };

  const openEditModal = (s: SystemStaff) => { 
    setModalMode("edit"); setErrors({}); 
    setFormData({ 
      id: s.id, fullName: s.fullName || "", email: s.email || "", password: "", 
      genderId: s.genderId || (genderOptions.length > 0 ? genderOptions[0].value : ""), 
      profileImageUrl: s.profileImageUrl || "", dateOfBirth: s.dateOfBirth || "",
      phoneNumber: s.phoneNumber || "", phoneNumberAlt: s.phoneNumberAlt || "",
      addressLine1: s.addressLine1 || "", addressLine2: s.addressLine2 || "",
      city: s.city || "", state: s.state || "", postalCode: s.postalCode || "", country: s.country || "",
      role: s.role, status: s.status ?? 1 
    });
    setIsModalOpen(true); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
    const { name, value } = e.target; 
    setFormData((prev: any) => ({ ...prev, [name]: value })); 
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please upload a valid image file.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      showToast("error", "Image size cannot exceed 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev: any) => ({ ...prev, profileImageUrl: reader.result as string }));
      showToast("success", "Profile picture uploaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => { 
    const newErrors: Record<string, string> = {}; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

    if (!formData.fullName?.trim()) newErrors.fullName = "Required"; 
    if (!formData.email?.trim() || !emailRegex.test(formData.email)) newErrors.email = "Invalid email"; 
    if (modalMode === "create" && !formData.password) newErrors.password = "Required"; 

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      const payload: any = { ...formData, genderId: Number(formData.genderId), role: Number(formData.role), status: Number(formData.status) };
      if (modalMode === "edit" && !formData.password) delete payload.password; 

      const url = modalMode === "create" ? `${API_BASE_URL}/staff` : `${API_BASE_URL}/staff/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) }); 

      if (res.ok) { 
        setIsModalOpen(false); showToast("success", modalMode === "create" ? "Created successfully!" : "Updated successfully!"); fetchData(); 
      } else { 
        const errorData = await res.json(); 
        showToast("error", errorData.message || "Operation failed."); 
      }
    } catch { showToast("error", "Network error."); }
  };

  const confirmDelete = async () => { 
    if (!userToDelete) return; 
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${userToDelete}`, { method: "DELETE", headers: getAuthHeaders() }); 
      if (res.ok) { showToast("success", "Deleted successfully."); fetchData(); } 
      else { showToast("error", "Failed to delete."); }
    } catch { showToast("error", "Network error."); } finally { setIsDeleteAlertOpen(false); setUserToDelete(null); }
  };

  return (
    <div className="space-y-6 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-1 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-950">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Staff Directory</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage and monitor hospital SuperAdmins and Admins profiles.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
          <Plus className="w-4.5 h-4.5" /> Add Staff Member
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[40%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 font-medium" placeholder="Search by name, email or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select className="w-full sm:w-40 appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option><option value="0">Super Admin</option><option value="1">Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 sm:flex-none">
            <select className="w-full sm:w-40 appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option><option value="1">Active</option><option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profile</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Address</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">Loading database...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No matches found.</td></tr>
              ) : (
                paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3.5">
                      <img src={s.profileImageUrl || `https://ui-avatars.com/api/?name=${s.fullName}&background=f1f5f9&color=334155&bold=true`} alt={s.fullName} className="w-11 h-11 rounded-full object-cover border border-slate-200/80 shadow-sm" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{s.fullName}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.gender?.name || "Unspecified"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{s.email}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{s.phoneNumber || "No telephone"}</p>
                    </td>
                    <td className="px-6 py-4"><Badge variant={getRoleInfo(s.role).color as any}>{getRoleInfo(s.role).name}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={s.status === 1 ? "success" : "danger"}>{s.status === 1 ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => { setViewData(s); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button>
                        <button onClick={() => openEditModal(s)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4.5 h-4.5" /></button>
                        <button onClick={() => { setUserToDelete(s.id); setIsDeleteAlertOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4.5 h-4.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredData.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        )}
      </div>

      {/* CREATE & EDIT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Add New Staff Member" : "Update Staff Profile"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/20">
              
              {/* Section 1: Image Upload */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img src={formData.profileImageUrl || `https://ui-avatars.com/api/?name=${formData.fullName || 'User'}&background=f1f5f9&color=334155&bold=true`} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/10 shadow-sm" />
                  <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-800">Profile Picture</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">Click on the image to upload a photograph from your device. Only PNG or JPG format under 1MB is supported.</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>

              {/* Section 2: Account info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" /> Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name *</label>
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.fullName ? 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400' : 'bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Email *</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.email ? 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400' : 'bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Password {modalMode==='edit' && '(Optional)'}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.password ? 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400' : 'bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500'}`} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all [color-scheme:light]" />
                  </div>
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Gender</label>
                    <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none">{genderOptions.map((g)=><option key={g.value} value={g.value}>{g.label}</option>)}</select>
                    <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Section 3: Contacts */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> Contact & Residence</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Primary Phone Number</label>
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Alternative Phone</label>
                    <input name="phoneNumberAlt" value={formData.phoneNumberAlt} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Address Line 1</label>
                    <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Address Line 2</label>
                    <input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">City</label>
                    <input name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">State</label>
                    <input name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Postal Code</label>
                    <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Country</label>
                    <input name="country" value={formData.country} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Section 4: System Roles */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> System Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">System Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none"><option value={0}>Super Admin</option><option value={1}>Admin</option></select>
                    <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Work Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none"><option value="1">Active</option><option value="0">Inactive</option></select>
                    <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

            </div>
            
            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold text-slate-700 bg-white transition-all">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPLETE DETAIL MODAL (Resume Dual-Column Layout) */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Staff complete dossier</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 bg-slate-50/50 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (1/3 Narrow) - Portrait & Core details */}
                <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-4">
                  <img src={viewData.profileImageUrl || `https://ui-avatars.com/api/?name=${viewData.fullName}&background=f1f5f9&color=334155&bold=true`} alt={viewData.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{viewData.fullName}</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-1">{viewData.email}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full pt-2">
                    <Badge variant={getRoleInfo(viewData.role).color as any}>{getRoleInfo(viewData.role).name}</Badge>
                    <Badge variant={viewData.status === 1 ? "success" : "danger"}>{viewData.status === 1 ? "Active Status" : "Inactive"}</Badge>
                  </div>
                </div>

                {/* Right Column (2/3 Wide) - Structured Data Grid */}
                <div className="md:col-span-8 space-y-5">
                  {/* Sub Section A: Personal Dossier */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><User className="w-4 h-4 text-emerald-600" /> Account Profile</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Gender:</span> {viewData.gender?.name || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">DOB:</span> {viewData.dateOfBirth || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Join Date:</span> {new Date(viewData.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Sub Section B: Communications */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Phone className="w-4 h-4 text-emerald-600" /> Contact Info</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Primary Tel:</span> {viewData.phoneNumber || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Backup Tel:</span> {viewData.phoneNumberAlt || "N/A"}</p>
                    </div>
                  </div>

                  {/* Sub Section C: Address Profile */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><MapPin className="w-4 h-4 text-emerald-600" /> Correspondence Address</h4>
                    <div className="space-y-2.5">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Address 1:</span> {viewData.addressLine1 || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Address 2:</span> {viewData.addressLine2 || "N/A"}</p>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">City:</span> {viewData.city || "N/A"}</p>
                        <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Zip Code:</span> {viewData.postalCode || "N/A"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">State:</span> {viewData.state || "N/A"}</p>
                        <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Country:</span> {viewData.country || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="px-6 py-4 bg-white border-t border-slate-150 flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 bg-white transition-all">Close Dossier</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Prompt */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center border w-full max-w-sm border-slate-200">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-100">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Confirm Deletion</h3>
            <p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">This action is irreversible and will permanently delete this staff account from the medical system.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteAlertOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition-all text-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}