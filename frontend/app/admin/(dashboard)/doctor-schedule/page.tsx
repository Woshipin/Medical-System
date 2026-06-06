"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Plus, Edit, Trash2, X, AlertTriangle, Eye, CheckCircle, ChevronDown,
  User, CalendarDays, Clock, Timer, Activity, AlertCircle
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

// ================= Interfaces =================
export interface DoctorUser { id: number; fullName: string; status: number; }
export interface Doctor { id: number; status: number; user?: DoctorUser; }
export interface DoctorSchedule { id?: number; doctorId: number; doctor?: Doctor; dayOfWeek: number; startTime: string; endTime: string; slotDuration: number; isActive: boolean; }

const DayOfWeekMap: Record<number, string> = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };

// --- 提取 API 数组的辅助方法 ---
const extractArray = (resData: any) => Array.isArray(resData) ? resData : (resData?.data || []);

// --- 强制清洗微秒的辅助方法 (展示用) ---
const formatTimeDisplay = (timeStr?: string | null) => {
  if (!timeStr) return "—";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`; // 截取为完美的 HH:mm 格式，消除秒及微秒
  }
  return timeStr;
};

// --- 安全提取并绑定时间至 type="time" 输入控件用 ---
const formatTimeInput = (timeStr?: string | null) => {
  if (!timeStr) return "";
  return timeStr.substring(0, 5); 
};

const getBackendMessage = (result: any): string | null => {
  if (!result) return null; const msg = result.message ?? result.Message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim(); return null;
};
const getFieldErrors = (result: any): Record<string, string> => {
  const map: Record<string, string> = {}; const errors = result?.errors ?? result?.Errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return map;
  for (const [key, val] of Object.entries(errors)) { map[key.toLowerCase().replace(/\s/g, '')] = Array.isArray(val) ? String((val as any[])[0]) : String(val); }
  return map;
};

const Badge = ({ children, variant }: { children: React.ReactNode; variant: "success" | "danger" | "info" | "warning" | "secondary" }) => {
  const colors = { success: "bg-emerald-100 text-emerald-800 border-emerald-200", danger: "bg-red-100 text-red-800 border-red-200", info: "bg-blue-100 text-blue-800 border-blue-200", warning: "bg-amber-100 text-amber-800 border-amber-200", secondary: "bg-slate-100 text-slate-800 border-slate-200" };
  return <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[variant]}`}>{children}</span>;
};

const Toast: React.FC<{ show: boolean; message: string; type: "success" | "error"; onClose: () => void; }> = ({ show, message, type, onClose }) => {
  if (!show) return null;
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-xl px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto font-sans border-l-4 ${type === "success" ? "border-emerald-500" : "border-red-500"}`}>
      {type === "success" ? <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={17} /> : <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={17} />}
      <div className="flex-1 min-w-0 text-left"><p className={`text-xs font-bold ${type === "success" ? "text-emerald-700" : "text-red-700"}`}>{type === "success" ? "Success" : "Error"}</p><p className="text-xs text-slate-600 mt-0.5 break-words">{message}</p></div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 self-center"><X size={15} /></button>
    </div>
  );
};

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 搜索和多维过滤
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewData, setViewData] = useState<DoctorSchedule | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message }); setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [scheduleRes, docsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/DoctorSchedule`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/doctors`, { headers: getHeaders() }).catch(() => null)
      ]);
      if (scheduleRes.ok) setSchedules(await scheduleRes.json());
      if (docsRes && docsRes.ok) {
        const docJson = await docsRes.json();
        const allDocs: Doctor[] = extractArray(docJson);
        const activeDocs = allDocs.filter(d => d.status === 0 && d.user?.status === 1);
        setDoctors(activeDocs);
      }
    } catch { showToast("error", "Failed to load records."); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, dayFilter, doctorFilter, statusFilter]);

  // ==========================================
  // 高级筛选项：过滤条件（Search：医生姓名，Filter：医生姓名、星期、活跃状态）
  // ==========================================
  const filteredData = useMemo(() => {
    return schedules.filter((sch) => {
      const docName = (sch.doctor?.user?.fullName || "").toLowerCase();
      
      const matchSearch = docName.includes(searchTerm.toLowerCase());
      const matchDay = dayFilter === "all" || sch.dayOfWeek.toString() === dayFilter;
      const matchDoctor = doctorFilter === "all" || sch.doctorId.toString() === doctorFilter;
      const matchStatus = statusFilter === "all" || (sch.isActive ? "1" : "0") === statusFilter;

      return matchSearch && matchDay && matchDoctor && matchStatus;
    });
  }, [schedules, searchTerm, dayFilter, doctorFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredData, currentPage]);

  const openCreateModal = () => {
    setModalMode("create"); setErrors({});
    setFormData({ doctorId: "", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 30, isActive: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (sch: DoctorSchedule) => {
    setModalMode("edit"); setErrors({});
    setFormData({ id: sch.id, doctorId: sch.doctorId, dayOfWeek: sch.dayOfWeek, startTime: formatTimeInput(sch.startTime), endTime: formatTimeInput(sch.endTime), slotDuration: sch.slotDuration, isActive: sch.isActive ? 1 : 0 }); 
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name.toLowerCase()]) setErrors(prev => ({ ...prev, [name.toLowerCase()]: "" })); 
  };

  const handleSave = async () => {
    setErrors({}); setToast((t) => ({ ...t, show: false }));

    const validationErrors: Record<string, string> = {};
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      validationErrors.endtime = "End time must be strictly after Start time.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("error", "Validation failed. Please check the highlighted fields.");
      return;
    }

    try {
      const payload = { doctorId: parseInt(formData.doctorId), dayOfWeek: parseInt(formData.dayOfWeek), startTime: formData.startTime, endTime: formData.endTime, slotDuration: parseInt(formData.slotDuration), isActive: formData.isActive.toString() === "1" };
      const url = modalMode === "create" ? `${API_BASE_URL}/DoctorSchedule` : `${API_BASE_URL}/DoctorSchedule/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
      const result = await res.json().catch(() => null);
      if (res.ok) { setIsModalOpen(false); showToast("success", getBackendMessage(result) || `Schedule ${modalMode === "create" ? "created" : "updated"} successfully!`); fetchData(); } 
      else {
        const fields = getFieldErrors(result);
        if (Object.keys(fields).length > 0) setErrors(fields);
        showToast("error", getBackendMessage(result) || "Operation failed. Check the form validation.");
      }
    } catch { showToast("error", "Network error occurred."); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/DoctorSchedule/${itemToDelete}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) { showToast("success", "Schedule deleted successfully."); fetchData(); } else { showToast("error", "Failed to delete record."); }
    } catch { showToast("error", "Network error occurred."); } finally { setIsDeleteAlertOpen(false); setItemToDelete(null); }
  };

  const getDoctorName = (doc?: Doctor) => doc?.user?.fullName || "Unknown Doctor";

  return (
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Doctor Schedules</h1><p className="text-slate-500 mt-1 text-sm font-medium">Manage weekly schedules and appointment slots.</p></div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"><Plus className="w-4.5 h-4.5" /> Add Schedule</button>
      </div>
      
      {/* Search & Composite Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col xl:flex-row gap-4 items-center justify-between">
        {/* Name Search */}
        <div className="relative w-full xl:w-[25%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="search" placeholder="Search by doctor name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-semibold" />
        </div>
        
        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
          {/* Doctor Filter */}
          <div className="relative">
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">doctor name filter</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{getDoctorName(d)}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Day of Week Filter */}
          <div className="relative">
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">dayofweek filter</option>
              {Object.entries(DayOfWeekMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* IsActive Status Filter */}
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">is_active filter</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? ( <div className="p-12 text-center text-slate-400 font-medium">Loading data...</div> ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  {/* 精确匹配英文命名规范 */}
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">doctor name</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">dayofweek</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">start_time</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">end_time</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">is_active</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? ( <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No schedules found.</td></tr> ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs"><User size={14}/></div>
                        {getDoctorName(item.doctor)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{DayOfWeekMap[item.dayOfWeek]}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">{formatTimeDisplay(item.startTime)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">{formatTimeDisplay(item.endTime)}</p>
                      </td>
                      <td className="px-5 py-4"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-5 py-4 text-right"><div className="flex justify-end gap-1.5"><button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button><button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4.5 h-4.5" /></button><button onClick={() => { setItemToDelete(item.id!); setIsDeleteAlertOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4.5 h-4.5" /></button></div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filteredData.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150"><h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Create Schedule" : "Edit Schedule"}</h2><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-5 bg-slate-50/20">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Doctor *</label>
                <div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4.5 h-4.5" /></div><select name="doctorId" value={formData.doctorId || ""} onChange={handleInputChange} className={`appearance-none w-full pl-10 pr-3 py-2.5 text-sm font-semibold border rounded-xl outline-none cursor-pointer transition-all ${errors.doctorid ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`}><option value="" disabled>Select Doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>{getDoctorName(d)}</option>)}</select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /></div>
                {errors.doctorid && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.doctorid}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Day of the Week *</label>
                <div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><CalendarDays className="w-4.5 h-4.5" /></div><select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleInputChange} className="appearance-none w-full pl-10 pr-3 py-2.5 text-sm font-semibold border bg-white border-slate-300 text-slate-900 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500">{Object.entries(DayOfWeekMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Time *</label><div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Clock className="w-4.5 h-4.5" /></div><input type="time" name="startTime" value={formData.startTime || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl border bg-white border-slate-300 outline-none cursor-pointer ${errors.starttime ? "border-rose-400 bg-rose-50" : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"}`} /></div>{errors.starttime && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.starttime}</p>}</div>
                <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">End Time *</label><div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Clock className="w-4.5 h-4.5" /></div><input type="time" name="endTime" value={formData.endTime || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl border bg-white border-slate-300 outline-none cursor-pointer ${errors.endtime ? "border-rose-400 bg-rose-50" : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"}`} /></div>{errors.endtime && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.endtime}</p>}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Slot Duration (Mins) *</label><div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Timer className="w-4.5 h-4.5" /></div><input type="number" name="slotDuration" value={formData.slotDuration || 30} onChange={handleInputChange} min="5" step="5" className="w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl border bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" /></div></div>
                <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Status *</label><div className="relative"><select name="isActive" value={formData.isActive} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm font-semibold border bg-white border-slate-300 text-slate-900 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"><option value="1">Active</option><option value="0">Inactive</option></select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /></div></div>
              </div>
            </div>
            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 shrink-0"><button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 font-bold transition-all">Cancel</button><button onClick={handleSave} className="px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-md transition-all">Save Schedule</button></div>
          </div>
        </div>
      )}

      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 bg-white shrink-0"><h2 className="text-lg font-bold text-slate-950">Schedule Details</h2><button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button></div>
            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 gap-4">
                {[ { label: "Doctor", value: getDoctorName(viewData.doctor), icon: User }, { label: "Day of Week", value: DayOfWeekMap[viewData.dayOfWeek], icon: CalendarDays }, { label: "Shift Timing", value: `${formatTimeDisplay(viewData.startTime)} - ${formatTimeDisplay(viewData.endTime)}`, icon: Clock }, { label: "Slot Duration", value: `${viewData.slotDuration} mins`, icon: Timer }, { label: "Status", value: viewData.isActive ? "Active" : "Inactive", icon: Activity, isBadge: true, variant: viewData.isActive ? "success" : "danger" } ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3.5"><div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><item.icon className="w-4.5 h-4.5 text-slate-500" /></div><div className="overflow-hidden w-full"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>{item.isBadge ? <div className="mt-1"><Badge variant={item.variant as any}>{item.value}</Badge></div> : <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>}</div></div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t border-slate-150 flex justify-end"><button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 bg-white">Close</button></div>
          </div>
        </div>
      )}

      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center border w-full max-w-sm border-slate-200"><div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-100"><AlertTriangle className="w-7 h-7 text-rose-500" /></div><h3 className="font-extrabold text-slate-900 text-lg mb-1">Delete Schedule</h3><p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">Are you sure you want to delete this schedule? This action cannot be undone.</p><div className="flex gap-3"><button onClick={() => setIsDeleteAlertOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 text-sm">Cancel</button><button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md text-sm">Yes, Delete</button></div></div>
        </div>
      )}
    </div>
  );
}