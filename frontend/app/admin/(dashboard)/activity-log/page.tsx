"use client"; // 声明该组件为 Next.js 客户端组件

import React, { useState, useEffect, useMemo } from "react"; // 引入 React 核心库及常用 hooks
import {
  Search,
  Filter,
  X,
  Eye,
  User,
  Shield,
  ChevronDown,
  Clock,
  FileText,
  CheckCircle2, 
  AlertTriangle, 
} from "lucide-react"; // 引入图标
import Pagination from "@/components/admin/Pagination"; // 引入系统分页组件

// ==========================================
// Environment Variables
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 定义后端的 API 接口基准路径

interface ActivityLog { // 【修复】：操作日志接口定义必须完全契合后端最新小写蛇形 (snake_case) 结构
  id: number; 
  user_id: number | null; 
  full_name: string; 
  role: string; 
  action: string; 
  description: string; 
  created_at: string; // 修复前为 createdAt，导致解析出 undefined
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
    danger: "bg-red-100 text-red-800 border-red-200", 
    info: "bg-blue-100 text-blue-800 border-blue-200", 
    warning: "bg-amber-100 text-amber-800 border-amber-200", 
    success: "bg-emerald-100 text-emerald-800 border-emerald-200", 
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

export default function ActivityLogsPage() { 
  const [logs, setLogs] = useState<ActivityLog[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const [searchTerm, setSearchTerm] = useState(""); 
  const [roleFilter, setRoleFilter] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 10; 

  const [isViewModalOpen, setIsViewModalOpen] = useState(false); 
  const [viewData, setViewData] = useState<ActivityLog | null>(null); 
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" }); 

  const showToast = (type: 'success' | 'error', message: string) => { 
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const fetchLogs = async () => { 
    try {
      setIsLoading(true); 
      // 【修改】：使用全局拦截器接管验证，无需再手动获取 token
      const res = await fetch(`${API_BASE_URL}/ActivityLogs`); 
      if (res.ok) { 
        const json = await res.json(); 
        setLogs(json.data || []); 
      } else {
        showToast("error", "Failed to retrieve system logs."); 
      }
    } catch (error) { 
      console.error("Error fetching logs:", error);
      showToast("error", "Unable to connect to the log database.");
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => { 
    fetchLogs(); 
  }, []);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm, roleFilter]);

  const getRoleBadgeVariant = (roleName: string) => { 
    if (!roleName) return "secondary";
    const lowerRole = roleName.toLowerCase(); 
    if (lowerRole.includes("super")) return "danger"; 
    if (lowerRole.includes("admin")) return "info"; 
    if (lowerRole.includes("doctor")) return "warning"; 
    if (lowerRole.includes("patient")) return "success"; 
    return "secondary"; 
  };

  const getActionBadgeVariant = (action: string) => {
    if (!action) return "secondary";
    const lowerAction = action.toLowerCase();
    if (lowerAction === "created" || lowerAction === "register") return "success"; 
    if (lowerAction === "updated" || lowerAction === "login") return "info"; 
    if (lowerAction === "deleted") return "danger"; 
    return "secondary"; 
  };

  // 【修复】：更健壮的日期解析逻辑，避免由于字符串不规范出现 NaN
  const formatTimestamp = (isoString: string | undefined) => { 
    if (!isoString) return { date: "N/A", time: "N/A" };
    try {
      const dateObj = new Date(isoString); 
      if (isNaN(dateObj.getTime())) return { date: "Invalid Date", time: "" };

      const yyyy = dateObj.getFullYear(); 
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0'); 
      const dd = String(dateObj.getDate()).padStart(2, '0'); 
      const hh = String(dateObj.getHours()).padStart(2, '0'); 
      const min = String(dateObj.getMinutes()).padStart(2, '0'); 
      const ss = String(dateObj.getSeconds()).padStart(2, '0'); 
      return {
        date: `${yyyy}-${mm}-${dd}`, 
        time: `${hh}:${min}:${ss}` 
      };
    } catch (e) {
      return { date: "Error", time: "" }; 
    }
  };

  // ==========================================
  // 【核心解析引擎：从上到下渲染各卡片 Section 链】
  // ==========================================
  const renderDescriptionDetails = (descriptionText: string | undefined) => {
    if (!descriptionText) return null;

    if (!descriptionText.includes("\n")) { 
      return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-slate-400" /> Action Description
          </div>
          <div className="text-sm text-slate-700 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100 break-words max-h-[150px] overflow-y-auto custom-scrollbar">
            {descriptionText}
          </div>
        </div>
      );
    } 

    const lines = descriptionText.split("\n"); 
    const title = lines[0]; 
    const details = lines.slice(1); 

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2.5">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
          {title}
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {details.map((line, idx) => {
            const cleanedLine = line.replace(/^•\s*/, ""); 
            
            if (cleanedLine.includes("->")) { 
              const [label, value] = cleanedLine.split("->"); 
              return (
                <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label?.trim()}</span>
                  <span className="text-sm font-bold text-slate-800">{value?.trim()}</span>
                </div>
              );
            } 
            
            if (cleanedLine.includes("➔")) { 
              const [label, valDiff] = cleanedLine.split("➔"); 
              return (
                <div key={idx} className="flex flex-col gap-2 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label?.trim()}</span>
                  <div className="text-xs font-bold text-slate-700 leading-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-words">
                    {valDiff?.trim()}
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl text-xs font-bold text-slate-700 shadow-sm leading-relaxed">
                {cleanedLine}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredLogs = useMemo(() => { 
    return logs.filter((log) => {
      const matchSearch = 
        log.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || // 修复为 full_name
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = roleFilter === "all" || (log.role && log.role.toLowerCase() === roleFilter.toLowerCase()); 
      return matchSearch && matchRole; 
    });
  }, [logs, searchTerm, roleFilter]); 

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage); 
  const paginatedLogs = useMemo(() => { 
    const startIndex = (currentPage - 1) * itemsPerPage; 
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage); 
  }, [filteredLogs, currentPage, itemsPerPage]); 

  return (
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-1 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Activity Logs</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Monitor, audit, and track all system user operations and actions in real-time.</p>
        </div>
        <button onClick={fetchLogs} className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> Refresh Logs
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[40%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-colors"
            placeholder="Search logs by name, action or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="hidden sm:flex items-center text-sm font-semibold text-slate-800"><Filter className="w-4 h-4 mr-1.5" /> Filters:</div>

          <div className="relative flex-1 sm:flex-none">
            <select className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
              <option value="visitor">Visitor</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-10 text-center text-slate-600 font-medium text-sm">Loading activity logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-[10%]">Log ID</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-[22%]">Operator Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-[15%]">System Role</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-[12%]">Action</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-[33%]">Action Description</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-[10%]">Date & Time</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right w-[5%]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-600 font-medium text-sm">No activity logs found.</td></tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const formattedObj = formatTimestamp(log.created_at); // 【修复】：传递正确的 created_at 属性
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-600 font-bold"># {log.id}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900">{log.full_name || "N/A"}</span> 
                            {log.user_id && <span className="text-[10px] text-slate-400 font-bold">(ID: {log.user_id})</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={getRoleBadgeVariant(log.role)}>{log.role}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-700 truncate max-w-[280px]" title={log.description}>
                          {log.description}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-700 leading-snug">
                          <p className="font-semibold text-slate-800">{formattedObj.date}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{formattedObj.time}</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => { setViewData(log); setIsViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View details"><Eye className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && filteredLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ========================================= */}
      {/* View Log Details Modal                    */}
      {/* ========================================= */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Activity Log Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 bg-slate-50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><User className="w-4 h-4 text-slate-500" /></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Operator Name</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {viewData.full_name || "N/A"} {viewData.user_id && `(ID: ${viewData.user_id})`}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><Shield className="w-4 h-4 text-slate-500" /></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">System Role</p>
                    <div className="mt-1"><Badge variant={getRoleBadgeVariant(viewData.role)}>{viewData.role}</Badge></div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><FileText className="w-4 h-4 text-slate-500" /></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Action</p>
                    <div className="mt-1"><Badge variant={getActionBadgeVariant(viewData.action)}>{viewData.action}</Badge></div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><Clock className="w-4 h-4 text-slate-500" /></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Logged At</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {formatTimestamp(viewData.created_at).date} {formatTimestamp(viewData.created_at).time}
                    </p>
                  </div>
                </div>
              </div>

              {renderDescriptionDetails(viewData.description)}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}