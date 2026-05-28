"use client"; 

import React, { useState, useEffect, useMemo, useRef } from "react"; 
import { Search, Plus, Edit, Trash2, X, AlertTriangle, Eye, User, Mail, Phone, HeartPulse, CheckCircle2, ChevronDown, MapPin, Calendar, Activity, Camera } from "lucide-react"; 
import Pagination from "@/components/admin/Pagination"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

interface PatientProfile {
  icNumber?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

interface SystemPatient { 
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
  patientProfile?: PatientProfile;
  role: number; 
  status: number; 
  createdAt: string; 
}

const Badge = ({ children, variant }: { children: React.ReactNode; variant: "success" | "danger" | "info" | "warning" | "secondary"; }) => {
  const colors = { success: "bg-emerald-50 text-emerald-700 border-emerald-200", danger: "bg-rose-50 text-rose-700 border-rose-200", info: "bg-sky-50 text-sky-700 border-sky-200", warning: "bg-amber-50 text-amber-700 border-amber-200", secondary: "bg-slate-50 text-slate-700 border-slate-200" };
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

export default function PatientsPage() { 
  const [patients, setPatients] = useState<SystemPatient[]>([]); 
  const [genderOptions, setGenderOptions] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const [searchTerm, setSearchTerm] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 10; 

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); 
  const [modalMode, setModalMode] = useState<"create" | "edit">("create"); 

  const [formData, setFormData] = useState<any>({}); 
  const [errors, setErrors] = useState<Record<string, string>>({}); 

  const [viewData, setViewData] = useState<SystemPatient | null>(null); 
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false); 
  const [userToDelete, setUserToDelete] = useState<number | null>(null); 
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" }); 

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => { setToast({ show: true, type, message }); setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000); };
  const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("adminToken") : ""}` });

  const fetchData = async () => { 
    try {
      setIsLoading(true); 
      const [pRes, gRes] = await Promise.all([ fetch(`${API_BASE_URL}/patient`, { headers: getAuthHeaders() }), fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }) ]);
      if (pRes.ok) { const json = await pRes.json(); setPatients(json.data || []); }
      if (gRes.ok) { const json = await gRes.json(); setGenderOptions((json.data || []).map((g: any) => ({ value: g.id, label: g.name }))); }
    } catch { showToast("error", "Failed to load database."); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []); 
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]); 

  const filteredData = useMemo(() => patients.filter(p => (p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || p.patientProfile?.icNumber?.includes(searchTerm)) && (statusFilter === "all" || p.status?.toString() === statusFilter)), [patients, searchTerm, statusFilter]); 
  const totalPages = Math.ceil(filteredData.length / itemsPerPage); 
  const paginatedData = useMemo(() => filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredData, currentPage, itemsPerPage]); 

  const openCreateModal = () => { 
    setModalMode("create"); setErrors({}); 
    setFormData({ 
      fullName: "", email: "", password: "", genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      profileImageUrl: "", dateOfBirth: "", phoneNumber: "", phoneNumberAlt: "",
      addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "", status: 1,
      icNumber: "", bloodType: "", allergies: "", chronicDiseases: "", medicalNotes: "",
      emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: ""
    });
    setIsModalOpen(true); 
  };

  const openEditModal = (p: SystemPatient) => { 
    setModalMode("edit"); setErrors({}); 
    setFormData({ 
      id: p.id, fullName: p.fullName || "", email: p.email || "", password: "", genderId: p.genderId, 
      profileImageUrl: p.profileImageUrl || "", dateOfBirth: p.dateOfBirth || "",
      phoneNumber: p.phoneNumber || "", phoneNumberAlt: p.phoneNumberAlt || "",
      addressLine1: p.addressLine1 || "", addressLine2: p.addressLine2 || "", city: p.city || "", state: p.state || "", postalCode: p.postalCode || "", country: p.country || "", status: p.status ?? 1,
      icNumber: p.patientProfile?.icNumber || "", bloodType: p.patientProfile?.bloodType || "", allergies: p.patientProfile?.allergies || "", chronicDiseases: p.patientProfile?.chronicDiseases || "", medicalNotes: p.patientProfile?.medicalNotes || "",
      emergencyContactName: p.patientProfile?.emergencyContactName || "", emergencyContactPhone: p.patientProfile?.emergencyContactPhone || "", emergencyContactRelation: p.patientProfile?.emergencyContactRelation || ""
    });
    setIsModalOpen(true); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value })); };

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
      showToast("success", "Avatar updated.");
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
      const payload: any = { ...formData, genderId: Number(formData.genderId), status: Number(formData.status) };
      if (modalMode === "edit" && !formData.password) delete payload.password; 

      const res = await fetch(modalMode === "create" ? `${API_BASE_URL}/patient` : `${API_BASE_URL}/patient/${formData.id}`, { method: modalMode === "create" ? "POST" : "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload) }); 
      if (res.ok) { setIsModalOpen(false); showToast("success", "Saved successfully!"); fetchData(); } else { showToast("error", "Operation failed."); }
    } catch { showToast("error", "Network error."); }
  };

  const confirmDelete = async () => { 
    try {
      const res = await fetch(`${API_BASE_URL}/patient/${userToDelete}`, { method: "DELETE", headers: getAuthHeaders() }); 
      if (res.ok) { showToast("success", "Deleted successfully."); fetchData(); } else { showToast("error", "Failed."); }
    } catch { showToast("error", "Network error."); } finally { setIsDeleteAlertOpen(false); setUserToDelete(null); }
  };

  return (
    <div className="space-y-6 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-1 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-950">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Patient Directory</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage and view patient medical profiles and system accounts.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
          <Plus className="w-4.5 h-4.5" /> Add Patient
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[40%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 font-medium" placeholder="Search by name, email or IC..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select className="appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option><option value="1">Active</option><option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profile</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blood Type</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">Loading Database...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No patients found.</td></tr>
              ) : (
                paginatedData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 flex items-center gap-3.5">
                      <img src={p.profileImageUrl || `https://ui-avatars.com/api/?name=${p.fullName}&background=f1f5f9&color=334155&bold=true`} alt="img" className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{p.fullName}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{p.gender?.name || "Unspecified"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{p.email}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{p.phoneNumber || "No phone"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info">{p.patientProfile?.bloodType || "N/A"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={p.status === 1 ? "success" : "danger"}>{p.status === 1 ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => { setViewData(p); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button>
                        <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4.5 h-4.5" /></button>
                        <button onClick={() => { setUserToDelete(p.id); setIsDeleteAlertOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4.5 h-4.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Create Patient" : "Edit Patient Data"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/20">
              
              {/* Profile Image Drag-Click Upload */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img src={formData.profileImageUrl || `https://ui-avatars.com/api/?name=${formData.fullName || 'Patient'}&background=f1f5f9&color=334155&bold=true`} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/10 shadow-sm" />
                  <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-800">Patient Photograph</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">Click the avatar to upload. Image files must be JPG or PNG, under 1MB.</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>

              {/* Sub Section A: Personal Identity */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" /> Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Full Name *</label><input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Email *</label><input name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Password {modalMode==='edit' && '(Optional)'}</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">IC Number</label><input name="icNumber" value={formData.icNumber} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all [color-scheme:light]" /></div>
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Gender</label>
                    <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none">{genderOptions.map((g)=><option key={g.value} value={g.value}>{g.label}</option>)}</select>
                    <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Sub Section B: Addresses */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /> Correspondence Residence</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-500 mb-1.5 block">Phone Number</label><input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-500 mb-1.5 block">Alt Phone</label><input name="phoneNumberAlt" value={formData.phoneNumberAlt} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-500 mb-1.5 block">Address Line 1</label><input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-500 mb-1.5 block">Address Line 2</label><input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">City</label><input name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">State</label><input name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Postal Code</label><input name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Country</label><input name="country" value={formData.country} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                </div>
              </div>

              {/* Sub Section C: Clinical Dossier */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Clinical Pathology</h3>
                <div className="space-y-4">
                  <div className="relative max-w-xs">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Blood Type</label>
                    <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none">
                      <option value="">Unknown</option><option value="A+">A+</option><option value="O+">O+</option><option value="B+">B+</option><option value="AB+">AB+</option><option value="A-">A-</option><option value="O-">O-</option><option value="B-">B-</option><option value="AB-">AB-</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Allergies</label><textarea name="allergies" value={formData.allergies} onChange={handleInputChange} rows={2} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-medium outline-none resize-none" placeholder="Allergy details..." /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Chronic Diseases</label><textarea name="chronicDiseases" value={formData.chronicDiseases} onChange={handleInputChange} rows={2} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-medium outline-none resize-none" placeholder="Chronic diseases..." /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Medical Notes</label><textarea name="medicalNotes" value={formData.medicalNotes} onChange={handleInputChange} rows={2} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-medium outline-none resize-none" placeholder="Doctor's notes..." /></div>
                </div>
              </div>

              {/* Sub Section D: Emergency Support */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> Emergency Guard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Contact Name</label><input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Contact Phone</label><input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                  <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Relation</label><input name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                </div>
              </div>

            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
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
              <h2 className="text-lg font-bold text-slate-900">Patient Complete Profile</h2>
              <button onClick={() => setIsViewModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 bg-slate-50/50 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (1/3 Narrow) - Portrait & Core details */}
                <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-4">
                  <img src={viewData.profileImageUrl || `https://ui-avatars.com/api/?name=${viewData.fullName}&background=f1f5f9&color=334155&bold=true`} alt={viewData.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{viewData.fullName}</h3>
                    <p className="text-slate-500 text-xs font-semibold mt-1">IC: {viewData.patientProfile?.icNumber || "N/A"}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full pt-2">
                    <Badge variant="success">Patient</Badge>
                    <Badge variant={viewData.status === 1 ? "success" : "danger"}>{viewData.status === 1 ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>

                {/* Right Column (2/3 Wide) - Structured Data Grid */}
                <div className="md:col-span-8 space-y-5">
                  {/* Sub Section A: Personal Identity */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><User className="w-4 h-4 text-emerald-600" /> Identity Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Gender:</span> {viewData.gender?.name || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">DOB:</span> {viewData.dateOfBirth || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Primary Tel:</span> {viewData.phoneNumber || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Alt Tel:</span> {viewData.phoneNumberAlt || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Correspondence:</span> {[viewData.addressLine1, viewData.addressLine2, viewData.city, viewData.state, viewData.postalCode, viewData.country].filter(Boolean).join(", ") || "N/A"}</p>
                    </div>
                  </div>

                  {/* Sub Section B: Medical Pathology */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Activity className="w-4 h-4 text-red-500" /> Clinical Pathology</h4>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Blood Type:</span> <Badge variant="danger">{viewData.patientProfile?.bloodType || "N/A"}</Badge></p>
                      <div>
                        <span className="text-slate-400 font-bold text-xs block mb-1">Allergies:</span>
                        <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed">{viewData.patientProfile?.allergies || "None reported"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold text-xs block mb-1">Chronic Diseases:</span>
                        <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed">{viewData.patientProfile?.chronicDiseases || "None reported"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold text-xs block mb-1">Medical Notes:</span>
                        <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar">{viewData.patientProfile?.medicalNotes || "None"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sub Section C: Emergency Contact */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Phone className="w-4 h-4 text-amber-600" /> Emergency Guard</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-4">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold block mb-0.5">Contact Name:</span> <span className="font-bold text-slate-950">{viewData.patientProfile?.emergencyContactName || "N/A"}</span></p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold block mb-0.5">Contact Phone:</span> <span className="font-bold text-slate-950">{viewData.patientProfile?.emergencyContactPhone || "N/A"}</span></p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold block mb-0.5">Relationship:</span> <span className="font-bold text-slate-950">{viewData.patientProfile?.emergencyContactRelation || "N/A"}</span></p>
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
      
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center border w-full max-w-sm border-slate-200">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-100">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Confirm Deletion</h3>
            <p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">This action is irreversible and will permanently delete this patient record and clinical history from the system.</p>
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