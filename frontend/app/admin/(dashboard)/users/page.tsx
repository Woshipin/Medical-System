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
  EyeOff,
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  ChevronDown,
  Lock,
} from "lucide-react";

// ==========================================
// Environment Variables
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface SystemUser {
  id: number | string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  genderId: number;
  gender?: { id: number; name: string };
  role: number;
  isActive: boolean;
  createdAt: string;
}

interface DropdownOption {
  value: number | string | boolean;
  label: string;
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

export default function UsersPage() {
  // Data states
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Form and validation states
  const [formData, setFormData] = useState<any>({});
  const [phoneCode, setPhoneCode] = useState("+65");
  const [phoneBody, setPhoneBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Delete and notification states
  const [viewData, setViewData] = useState<SystemUser | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | string | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, gendersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok) {
        const json = await usersRes.json();
        setUsers(json.data || []);
      }
      if (gendersRes.ok) {
        const json = await gendersRes.json();
        setGenderOptions((json.data || []).map((g: any) => ({ value: g.id, label: g.name })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("error", "Failed to load user database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRoleInfo = (roleInt: number) => {
    switch (roleInt) {
      case 0: return { name: "Super Admin", color: "danger" };
      case 1: return { name: "Admin", color: "info" };
      case 3: return { name: "Patient", color: "success" };
      default: return { name: "Unknown", color: "secondary" };
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm);
      const matchRole = roleFilter === "all" || user.role.toString() === roleFilter;
      const matchStatus = statusFilter === "all" || user.isActive.toString() === statusFilter;
      const matchGender = genderFilter === "all" || user.genderId.toString() === genderFilter;
      return matchSearch && matchRole && matchStatus && matchGender;
    });
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter]);

  // ---------------
  // Modal Handlers
  // ---------------
  const openCreateModal = () => {
    setModalMode("create");
    setErrors({});
    setShowPassword(false);
    setFormData({
      fullName: "", email: "", password: "", genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      role: 3, isActive: true,
    });
    setPhoneCode("+65");
    setPhoneBody("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    setModalMode("edit");
    setErrors({});
    setShowPassword(false);
    setFormData({
      id: user.id, fullName: user.fullName, email: user.email, password: "", 
      genderId: user.genderId, role: user.role, isActive: user.isActive,
    });

    if (user.phoneNumber?.startsWith("+60")) {
      setPhoneCode("+60");
      setPhoneBody(user.phoneNumber.replace("+60", ""));
    } else {
      setPhoneCode("+65");
      setPhoneBody((user.phoneNumber || "").replace("+65", ""));
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); // Clear error on typing
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneBody(e.target.value.replace(/\D/g, ""));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
  };

  const handleSave = async () => {
    // 1. Frontend validation
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

    if (!formData.fullName.trim()) newErrors.fullName = "Please enter full name.";
    if (!formData.email.trim() || !emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address.";
    
    if (modalMode === "create" && !formData.password) {
      newErrors.password = "Password is required for new users.";
    } else if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password = "Min 6 characters, including letters & numbers.";
    }

    if (phoneCode === "+65" && phoneBody && phoneBody.length !== 8) {
      newErrors.phone = "Singapore numbers must be exactly 8 digits.";
    } else if (phoneCode === "+60" && phoneBody && (phoneBody.length < 9 || phoneBody.length > 10)) {
      newErrors.phone = "Malaysia numbers must be 9 or 10 digits.";
    } else if (!phoneBody) {
      newErrors.phone = "Please enter phone number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload: any = {
        ...formData,
        phoneNumber: `${phoneCode}${phoneBody}`,
        genderId: Number(formData.genderId),
        role: Number(formData.role),
        isActive: formData.isActive === "true" || formData.isActive === true,
      };

      if (modalMode === "edit" && !formData.password) {
        delete payload.password;
      }

      const url = modalMode === "create" ? `${API_BASE_URL}/user` : `${API_BASE_URL}/user/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        setIsModalOpen(false);
        showToast("success", modalMode === "create" ? "User created successfully!" : "User updated successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        const fieldErrors = errorData.errors || errorData.validationErrors;
        
        if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
          const backendMappedErrors: Record<string, string> = {};
          Object.keys(fieldErrors).forEach((key) => {
            backendMappedErrors[key] = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
          });
          setErrors(backendMappedErrors);
          showToast("error", errorData.message || "Please fix the highlighted errors.");
        } else {
          showToast("error", errorData.message || "Failed to save user data.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userToDelete}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        showToast("success", "User deleted successfully.");
        fetchData();
      } else {
        let errorMessage = "Failed to delete user.";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Non-JSON error returned");
        }
        showToast("error", errorMessage);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred while deleting.");
    } finally {
      setIsDeleteAlertOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Manage and maintain your system users effectively.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[40%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-colors"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="hidden sm:flex items-center text-sm font-semibold text-slate-800"><Filter className="w-4 h-4 mr-1.5" /> Filters:</div>

          <div className="relative flex-1 sm:flex-none">
            <select className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="0">Super Admin</option>
              <option value="1">Admin</option>
              <option value="3">Patient</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex-1 sm:flex-none">
            <select className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex-1 sm:flex-none">
            <select className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="all">All Genders</option>
              {genderOptions.map((g) => (<option key={g.value as string} value={g.value as string}>{g.label}</option>))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-600 font-medium text-sm">Loading user database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Gender</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-600 font-medium text-sm">No users found.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900 text-sm">{user.fullName}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.email}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.phoneNumber || "-"}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.gender?.name || "Unknown"}</td>
                      <td className="px-5 py-3"><Badge variant={getRoleInfo(user.role).color as any}>{getRoleInfo(user.role).name}</Badge></td>
                      <td className="px-5 py-3"><Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setViewData(user); setIsViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { setUserToDelete(user.id); setIsDeleteAlertOpen(true); }} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* Create / Edit Modal (with validation highlighting) */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Create New User" : "Edit User Data"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Left Column */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.fullName ? 'text-red-400' : 'text-slate-400'}`}><User className="w-4 h-4" /></div>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.fullName ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="John Doe" />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[11px] mt-1.5">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'}`}><Mail className="w-4 h-4" /></div>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.email ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="user@example.com" />
                  </div>
                  {errors.email && <p className="text-red-500 text-[11px] mt-1.5">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password {modalMode === "edit" && <span className="text-slate-400 font-medium ml-1 lowercase">(Leave blank to keep)</span>}</label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'}`}><Lock className="w-4 h-4" /></div>
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.password ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="Min 6 chars, letters & numbers" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400 hover:text-red-600' : 'text-slate-400 hover:text-slate-600'} transition-colors`}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[11px] mt-1.5">{errors.password}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className={`flex border rounded-lg overflow-hidden transition-colors ${errors.phone ? "bg-red-50 border-red-300 focus-within:ring-2 focus-within:ring-red-200" : "bg-white border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500"}`}>
                    <div className={`flex items-center pl-3 pr-1 ${errors.phone ? 'text-red-400' : 'text-slate-400'}`}><Phone className="w-4 h-4" /></div>
                    <div className="relative flex items-center shrink-0">
                      <select value={phoneCode} onChange={(e) => { setPhoneCode(e.target.value); setPhoneBody(""); if(errors.phone) setErrors(p=>({...p, phone: ""})); }} className={`appearance-none bg-transparent pl-1 pr-6 py-2.5 text-sm font-bold outline-none cursor-pointer ${errors.phone ? 'text-red-500' : 'text-slate-700'}`}>
                        <option value="+65">+65 (SG)</option>
                        <option value="+60">+60 (MY)</option>
                      </select>
                      <ChevronDown className={`absolute right-1 w-3 h-3 pointer-events-none ${errors.phone ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>
                    <div className={`w-px my-2 ${errors.phone ? 'bg-red-200' : 'bg-slate-200'}`}></div>
                    <input type="text" value={phoneBody} onChange={handlePhoneBodyChange} maxLength={phoneCode === "+65" ? 8 : 10} className={`flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none ${errors.phone ? 'text-red-500 placeholder-red-300' : 'text-slate-900 placeholder-slate-400'}`} placeholder={phoneCode === "+65" ? "8 digits" : "9-10 digits"} />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[11px] mt-1.5">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <div className="relative">
                    <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                      {genderOptions.map((g) => (<option key={g.value as string} value={g.value as string}>{g.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">System Role</label>
                    <div className="relative">
                      <select name="role" value={formData.role} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                        <option value={0}>Super Admin</option>
                        <option value={1}>Admin</option>
                        <option value={3}>Patient</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <div className="relative">
                      <select name="isActive" value={formData.isActive} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold transition">Cancel</button>
              <button onClick={handleSave} className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold shadow-sm transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* View Modal                                */}
      {/* ========================================= */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">User Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: viewData.fullName, icon: User },
                  { label: "Email Address", value: viewData.email, icon: Mail },
                  { label: "Phone Number", value: viewData.phoneNumber || "N/A", icon: Phone },
                  { label: "Gender", value: viewData.gender?.name || "N/A", icon: CheckCircle2 },
                  { label: "System Role", value: getRoleInfo(viewData.role).name, icon: Shield, isBadge: true, variant: getRoleInfo(viewData.role).color },
                  { label: "Status", value: viewData.isActive ? "Active" : "Inactive", icon: CheckCircle2, isBadge: true, variant: viewData.isActive ? "success" : "danger" },
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h3>
            <p className="text-slate-600 text-sm font-medium mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
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