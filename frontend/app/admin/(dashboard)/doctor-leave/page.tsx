"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Plus, Edit, Trash2, X, AlertTriangle, Eye, CheckCircle, ChevronDown,
  User, Calendar, Clock, FileText, Activity, AlertCircle, Info
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";
// 引入管理员登录状态上下文
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

export interface DoctorUser { id: number; fullName: string; status: number; }
export interface Doctor { id: number; status: number; user?: DoctorUser; }
export interface DoctorLeave {
  id?: number; doctorId: number; doctor?: Doctor; leaveType: number; startDate: string;
  endDate: string; startTime?: string | null; endTime?: string | null; isFullDay: boolean;
  status: number; reason?: string; approvedBy?: number | null; approverName?: string;
}

const LeaveTypeMap: Record<number, string> = { 0: "Annual", 1: "Medical", 2: "Emergency", 3: "Personal", 4: "Training", 5: "Other" };
const LeaveStatusMap: Record<number, { label: string, variant: "warning" | "success" | "danger" }> = {
  0: { label: "Pending", variant: "warning" }, 1: { label: "Approved", variant: "success" }, 2: { label: "Rejected", variant: "danger" }
};

const getBackendMessage = (result: any): string | null => {
  if (!result) return null; const msg = result.message ?? result.Message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim(); return null;
};

const formatDateToDDMMYYYY = (dateString?: string) => {
  if (!dateString) return "";
  try { const parts = dateString.split("T")[0].split("-"); if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; return dateString; } 
  catch { return dateString; }
};

const formatTimeDisplay = (timeStr?: string | null) => {
  if (!timeStr) return "—";
  const parts = timeStr.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};

const formatTimeInput = (timeStr?: string | null) => { if (!timeStr) return ""; return timeStr.substring(0, 5); };
const extractArray = (resData: any) => Array.isArray(resData) ? resData : (resData?.data || []);

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

const VisualDatePicker: React.FC<{ label: string; name: string; required?: boolean; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; }> = ({ label, name, required, value, onChange, error }) => (
  <div className="flex flex-col">
    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
    <div className={`relative flex items-center rounded-xl border transition-all ${error ? "border-rose-400 bg-rose-50 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200" : "border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"}`}>
      <input type="date" name={name} value={value || ""} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 cursor-pointer" onClick={(e) => { try { (e.target as any).showPicker(); } catch {} }} />
      <div className="w-full flex items-center justify-between px-3 py-2.5 text-sm pointer-events-none">
        <span className={value ? `${error ? "text-rose-900" : "text-slate-900"} font-semibold` : "text-slate-400 font-medium"}>
          {value ? (() => { const parts = value.split("-"); if (parts.length !== 3) return value; return `${parts[2]}-${parts[1]}-${parts[0]}`; })() : "DD-MM-YYYY"}
        </span>
        <Calendar className={`w-4 h-4 shrink-0 ${error ? "text-rose-400" : "text-slate-400"}`} />
      </div>
    </div>
    {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
  </div>
);

export default function DoctorLeavePage() {
  const { user: currentUser } = useAdminAuth(); // 引入并调用 useAdminAuth

  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 搜索和多维过滤状态
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [fullDayFilter, setFullDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewData, setViewData] = useState<DoctorLeave | null>(null);
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
      const [leavesRes, docsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/DoctorLeave`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/doctors`, { headers: getHeaders() }).catch(() => null)
      ]);
      if (leavesRes.ok) setLeaves(await leavesRes.json());
      if (docsRes && docsRes.ok) {
        const docJson = await docsRes.json();
        const allDocs: Doctor[] = extractArray(docJson);
        const activeDocs = allDocs.filter(d => d.status === 0 && d.user?.status === 1);
        setDoctors(activeDocs);
      }
    } catch { showToast("error", "Failed to load data."); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, doctorFilter, statusFilter, leaveTypeFilter, fullDayFilter]);

  // ==========================================
  // 高级过滤器逻辑（支持搜索姓名、过滤姓名、请假类型、是否全天、审核状态）
  // ==========================================
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const docName = (leave.doctor?.user?.fullName || "").toLowerCase();
      
      const matchSearch = docName.includes(searchTerm.toLowerCase()) || (leave.reason?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchDoctor = doctorFilter === "all" || leave.doctorId.toString() === doctorFilter;
      const matchLeaveType = leaveTypeFilter === "all" || leave.leaveType.toString() === leaveTypeFilter;
      const matchFullDay = fullDayFilter === "all" || (leave.isFullDay ? "1" : "0") === fullDayFilter;
      const matchStatus = statusFilter === "all" || leave.status.toString() === statusFilter;

      return matchSearch && matchDoctor && matchLeaveType && matchFullDay && matchStatus;
    });
  }, [leaves, searchTerm, doctorFilter, leaveTypeFilter, fullDayFilter, statusFilter]);

  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedData = useMemo(() => filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredLeaves, currentPage]);

  const openCreateModal = () => {
    setModalMode("create"); setErrors({});
    setFormData({ doctorId: "", leaveType: 0, startDate: "", endDate: "", isFullDay: false, startTime: "08:00", endTime: "17:00", status: 0, reason: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (leave: DoctorLeave) => {
    setModalMode("edit"); setErrors({});
    setFormData({ id: leave.id, doctorId: leave.doctorId, leaveType: leave.leaveType, startDate: leave.startDate.split('T')[0], endDate: leave.endDate.split('T')[0], isFullDay: leave.isFullDay, startTime: formatTimeInput(leave.startTime), endTime: formatTimeInput(leave.endTime), status: leave.status, reason: leave.reason || "" }); 
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === "checkbox") finalValue = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => {
      const newData = { ...prev, [name]: finalValue };
      if (name === "isFullDay") { if (finalValue) { newData.startTime = ""; newData.endTime = ""; } else { newData.startTime = "08:00"; newData.endTime = "17:00"; } }
      return newData;
    });
    if (errors[name.toLowerCase()]) setErrors(prev => ({ ...prev, [name.toLowerCase()]: "" })); 
  };

  const handleSave = async () => {
    setErrors({}); setToast((t) => ({ ...t, show: false }));

    // ==========================================
    // FRONTEND VALIDATION (INC. DATES)
    // ==========================================
    const validationErrors: Record<string, string> = {};
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        validationErrors.enddate = "End date cannot be earlier than Start date.";
        setErrors(validationErrors);
        // 精准拦截：立刻弹出 Alert 警告消息
        showToast("error", "End date cannot be earlier than Start date.");
        return;
      }
    }
    if (!formData.isFullDay) {
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        validationErrors.endtime = "End time must be strictly after Start time.";
        setErrors(validationErrors);
        showToast("error", "End time must be strictly after Start time.");
        return;
      }
    }

    try {
      // 已修正：直接并且只从 currentUser.id 中提取值，彻底消除 userId 导致的类型查找错误
      const currentAdminId = currentUser?.id || null;
      const approvedByValue = parseInt(formData.status) !== 0 ? (currentAdminId ? Number(currentAdminId) : null) : null;

      const payload = { 
        doctorId: parseInt(formData.doctorId), 
        leaveType: parseInt(formData.leaveType), 
        startDate: formData.startDate, 
        endDate: formData.endDate, 
        isFullDay: formData.isFullDay, 
        startTime: formData.isFullDay ? null : (formData.startTime || null), 
        endTime: formData.isFullDay ? null : (formData.endTime || null), 
        status: parseInt(formData.status), 
        reason: formData.reason,
        approvedBy: approvedByValue // 写入当前登录账户的实际 ID
      };

      const url = modalMode === "create" ? `${API_BASE_URL}/DoctorLeave` : `${API_BASE_URL}/DoctorLeave/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
      const result = await res.json().catch(() => null);
      if (res.ok) { setIsModalOpen(false); showToast("success", getBackendMessage(result) || `Leave ${modalMode === "create" ? "created" : "updated"} successfully!`); fetchData(); } 
      else {
        const fields = result?.errors || result?.Errors || {}; const lowerErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) { lowerErrors[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v); }
        if (Object.keys(lowerErrors).length > 0) setErrors(lowerErrors); showToast("error", getBackendMessage(result) || "Operation failed. Check form errors.");
      }
    } catch { showToast("error", "Network error occurred."); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/DoctorLeave/${itemToDelete}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) { showToast("success", "Leave record deleted successfully."); fetchData(); } else { showToast("error", "Failed to delete record."); }
    } catch { showToast("error", "Network error occurred."); } finally { setIsDeleteAlertOpen(false); setItemToDelete(null); }
  };

  const getDoctorName = (doc?: Doctor) => doc?.user?.fullName || "Unknown Doctor";

  return (
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Doctor Leaves Management</h1><p className="text-slate-500 mt-1 text-sm font-medium">Manage and track doctor time-offs and leaves.</p></div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"><Plus className="w-4.5 h-4.5" /> Add Leave Record</button>
      </div>
      
      {/* 搜索栏与多功能复合过滤器 */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col xl:flex-row gap-4 items-center justify-between">
        {/* Name/Reason Search */}
        <div className="relative w-full xl:w-[20%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="search" placeholder="Search doctor or reason..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-semibold" />
        </div>

        {/* 4 组精确匹配 Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full xl:w-auto">
          {/* 1. Doctor Name Filter */}
          <div className="relative">
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">doctor name filter</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{getDoctorName(d)}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* 2. Leave Type Filter */}
          <div className="relative">
            <select value={leaveTypeFilter} onChange={(e) => setLeaveTypeFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">leave_type filter</option>
              {Object.entries(LeaveTypeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* 3. Is Full Day Filter */}
          <div className="relative">
            <select value={fullDayFilter} onChange={(e) => setFullDayFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">is_full_day filter</option>
              <option value="1">Full Day</option>
              <option value="0">Partial Day</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* 4. Status Filter */}
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer">
              <option value="all">status filter</option>
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? ( <div className="p-12 text-center text-slate-400 font-medium">Loading data...</div> ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  {/* 精确对齐 Model 英文命名规范 */}
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">doctor name</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">leave_type</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">start_date</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">end_date</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">start_time</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">end_time</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">is_full_day</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">status</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">approved_by</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? ( <tr><td colSpan={10} className="p-12 text-center text-slate-400 font-medium">No records found.</td></tr> ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs"><User size={14}/></div>{getDoctorName(item.doctor)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">{LeaveTypeMap[item.leaveType]}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{formatDateToDDMMYYYY(item.startDate)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{formatDateToDDMMYYYY(item.endDate)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{formatTimeDisplay(item.startTime)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{formatTimeDisplay(item.endTime)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{item.isFullDay ? "Yes" : "No"}</td>
                      <td className="px-5 py-4"><Badge variant={LeaveStatusMap[item.status]?.variant}>{LeaveStatusMap[item.status]?.label}</Badge></td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-bold">{item.approverName || "—"}</td>
                      <td className="px-5 py-4 text-right"><div className="flex justify-end gap-1.5"><button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button><button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4.5 h-4.5" /></button><button onClick={() => { setItemToDelete(item.id!); setIsDeleteAlertOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4.5 h-4.5" /></button></div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filteredLeaves.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredLeaves.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Create Leave Record" : "Edit Leave Record"}</h2><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5 bg-slate-50/20 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Doctor *</label>
                  <div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4.5 h-4.5" /></div><select name="doctorId" value={formData.doctorId || ""} onChange={handleInputChange} className={`appearance-none w-full pl-10 pr-3 py-2.5 text-sm font-semibold border rounded-xl outline-none cursor-pointer transition-all ${errors.doctorid ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`}><option value="" disabled>Select Doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>{getDoctorName(d)}</option>)}</select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /></div>
                  {errors.doctorid && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.doctorid}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Leave Type *</label>
                  <div className="relative"><select name="leaveType" value={formData.leaveType} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm font-semibold border bg-white border-slate-300 text-slate-900 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500">{Object.entries(LeaveTypeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status *</label>
                  <div className="relative"><select name="status" value={formData.status} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm font-semibold border bg-white border-slate-300 text-slate-900 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"><option value="0">Pending</option><option value="1">Approved</option><option value="2">Rejected</option></select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /></div>
                </div>
                <VisualDatePicker label="Start Date *" name="startDate" value={formData.startDate} onChange={handleInputChange} error={errors.startdate} />
                <VisualDatePicker label="End Date *" name="endDate" value={formData.endDate} onChange={handleInputChange} error={errors.enddate} />
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Time {formData.isFullDay && "(Disabled)"}</label>
                  <div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Clock className="w-4.5 h-4.5" /></div><input type="time" name="startTime" disabled={formData.isFullDay} value={formData.startTime || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl border bg-white border-slate-300 outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${errors.starttime ? "border-rose-400 bg-rose-50" : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"}`} /></div>
                  {errors.starttime && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.starttime}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">End Time {formData.isFullDay && "(Disabled)"}</label>
                  <div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Clock className="w-4.5 h-4.5" /></div><input type="time" name="endTime" disabled={formData.isFullDay} value={formData.endTime || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm font-semibold rounded-xl border bg-white border-slate-300 outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${errors.endtime ? "border-rose-400 bg-rose-50" : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"}`} /></div>
                  {errors.endtime && <p className="text-rose-600 text-xs mt-1.5 font-semibold">{errors.endtime}</p>}
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <input type="checkbox" name="isFullDay" id="isFullDay" checked={formData.isFullDay} onChange={handleInputChange} className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-600 cursor-pointer" /><label htmlFor="isFullDay" className="text-sm font-bold text-slate-700 cursor-pointer">This is a Full-Day leave</label>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason (Optional)</label>
                  <textarea name="reason" value={formData.reason || ""} onChange={handleInputChange} rows={3} className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl border bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none placeholder-slate-400" placeholder="State reason for leave..."></textarea>
                </div>
              </div>
            </div>
            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 font-bold transition-all">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-md transition-all">Save Record</button>
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 bg-white shrink-0"><h2 className="text-lg font-bold text-slate-950">Leave Details</h2><button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button></div>
            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 gap-4">
                {[ { label: "Doctor", value: getDoctorName(viewData.doctor), icon: User }, { label: "Leave Type", value: LeaveTypeMap[viewData.leaveType], icon: Info }, { label: "Dates", value: `${formatDateToDDMMYYYY(viewData.startDate)} to ${formatDateToDDMMYYYY(viewData.endDate)}`, icon: Calendar }, { label: "Duration", value: viewData.isFullDay ? "Full Day" : `${formatTimeInput(viewData.startTime)} - ${formatTimeInput(viewData.endTime)}`, icon: Clock }, { label: "Status", value: LeaveStatusMap[viewData.status]?.label, icon: Activity, isBadge: true, variant: LeaveStatusMap[viewData.status]?.variant }, { label: "Reason", value: viewData.reason || "No reason provided", icon: FileText } ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3.5"><div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><item.icon className="w-4.5 h-4.5 text-slate-500" /></div><div className="overflow-hidden w-full"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>{item.isBadge ? <div className="mt-1"><Badge variant={item.variant as any}>{item.value}</Badge></div> : <p className="text-sm font-bold text-slate-900 break-words whitespace-pre-wrap">{item.value}</p>}</div></div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t border-slate-150 flex justify-end"><button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 bg-white">Close</button></div>
          </div>
        </div>
      )}

      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center border w-full max-w-sm border-slate-200"><div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-100"><AlertTriangle className="w-7 h-7 text-rose-500" /></div><h3 className="font-extrabold text-slate-900 text-lg mb-1">Delete Record</h3><p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">Are you sure you want to delete this leave record? This action cannot be undone.</p><div className="flex gap-3"><button onClick={() => setIsDeleteAlertOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 text-sm">Cancel</button><button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md text-sm">Yes, Delete</button></div></div>
        </div>
      )}
    </div>
  );
}