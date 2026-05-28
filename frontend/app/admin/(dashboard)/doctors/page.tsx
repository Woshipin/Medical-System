"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Plus, Edit, Trash2, X, AlertTriangle, Eye, User,
  Mail, Phone, Shield, CheckCircle2, ChevronDown, Stethoscope, Briefcase, Calendar, MapPin, Award, Lock, EyeOff, FileText, AlignLeft, Info
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

// ==========================================
// 环境变量与接口定义
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

interface SystemDoctor {
  id: number;
  userId: number;
  licenseNumber: string;
  // 【核心修复】：属性名已修正为驼峰，完美对接后端 JSON 输出
  specialtyId: number; 
  titleId: number; 
  departmentId: number; 
  officeLocationId: number | null; 
  dateOfBirth: string;
  yearsOfExperience: number;
  qualifications: string | null; 
  biography: string | null; 
  address: string | null; 
  postalCode: string | null; 
  officePhone: string | null; 
  dateJoin: string; 
  dateLeft: string | null; 
  status: number; 
  remark: string | null; 
  resumePdf: string | null; 
  user: {
    id: number;
    full_name: string; 
    email: string;
    phoneNumber: string | null;
    gender_id: number; // 后端嵌套输出保留了下划线
    role: number;
    status: number; 
    gender?: { id: number; name: string };
  };
}

interface DropdownOption { value: number; label: string; }

// -----------------
// UI 辅助组件
// -----------------
const Badge = ({ children, variant }: { children: React.ReactNode; variant: "success" | "danger" | "info" | "warning" | "secondary"; }) => {
  const colors = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    secondary: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[variant]}`}>{children}</span>;
};

// Toast 提示组件
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

export default function DoctorsPage() {
  // 数据列表状态
  const [doctors, setDoctors] = useState<SystemDoctor[]>([]);
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]);
  
  // 下拉选项集状态
  const [departmentOptions, setDepartmentOptions] = useState<DropdownOption[]>([]); 
  const [specialtyOptions, setSpecialtyOptions] = useState<DropdownOption[]>([]); 
  const [titleOptions, setTitleOptions] = useState<DropdownOption[]>([]); 
  const [officeLocationOptions, setOfficeLocationOptions] = useState<DropdownOption[]>([]); 

  const [isLoading, setIsLoading] = useState(true);

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [officeLocationFilter, setOfficeLocationFilter] = useState("all");

  // Pagination 状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal 状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 表单及验证状态
  const [formData, setFormData] = useState<any>({});
  const [phoneCode, setPhoneCode] = useState("+65");
  const [phoneBody, setPhoneBody] = useState("");
  const [pdfFileName, setPdfFileName] = useState<string>(""); 
  const [viewData, setViewData] = useState<SystemDoctor | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // 通知与删除状态
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" });
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<number | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000); 
  };

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  };

  // 并发加载数据
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [doctorsRes, gendersRes, deptsRes, specialtiesRes, titlesRes, locationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/doctors`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Department`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Specialty`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Title`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/OfficeLocation`, { headers: getAuthHeaders() }),
      ]);

      if (doctorsRes.ok) {
        const json = await doctorsRes.json();
        setDoctors(json.data || []);
      }
      if (gendersRes.ok) {
        const json = await gendersRes.json();
        setGenderOptions((json.data || []).map((g: any) => ({ value: g.id, label: g.name })));
      }
      if (deptsRes.ok) {
        const deptsJson = await deptsRes.json();
        setDepartmentOptions(deptsJson.filter((d: any) => d.status === 1).map((d: any) => ({ value: d.id, label: d.name })));
      }
      if (specialtiesRes.ok) {
        const specialtiesJson = await specialtiesRes.json();
        setSpecialtyOptions((specialtiesJson.data || []).filter((s: any) => s.status === 1).map((s: any) => ({ value: s.id, label: s.name })));
      }
      if (titlesRes.ok) {
        const titlesJson = await titlesRes.json();
        setTitleOptions((titlesJson.data || []).filter((t: any) => t.status === 1).map((t: any) => ({ value: t.id, label: t.name })));
      }
      if (locationsRes.ok) {
        const locationsJson = await locationsRes.json();
        setOfficeLocationOptions((locationsJson.data || []).filter((l: any) => l.status === 1).map((l: any) => ({ value: l.id, label: l.name })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("error", "Failed to load doctor database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter, specialtyFilter, titleFilter, officeLocationFilter]);

  // ID 解构翻译
  const getDepartmentLabel = (id: number) => departmentOptions.find(d => d.value === id)?.label || "N/A";
  const getSpecialtyLabel = (id: number) => specialtyOptions.find(s => s.value === id)?.label || "N/A";
  const getTitleLabel = (id: number) => titleOptions.find(t => t.value === id)?.label || "N/A";
  const getOfficeLocationLabel = (id: number | null) => {
    if (!id) return "-";
    return officeLocationOptions.find(l => l.value === id)?.label || "N/A";
  };
  const getGenderLabel = (id: number) => genderOptions.find(g => g.value === id)?.label || "N/A";

  const getDoctorStatusLabel = (statusCode: number) => {
    switch (statusCode) {
      case 0: return { label: "Active / Working", variant: "success" };
      case 1: return { label: "Suspended", variant: "danger" };
      case 2: return { label: "On Leave", variant: "warning" };
      case 3: return { label: "Terminated", variant: "secondary" };
      default: return { label: "Unknown", variant: "secondary" };
    }
  };

  // 联动过滤
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        doc.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSpecialtyLabel(doc.specialtyId)?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDept = departmentFilter === "all" || doc.departmentId.toString() === departmentFilter;
      const matchStatus = statusFilter === "all" || doc.user.status.toString() === statusFilter;
      const matchSpecialty = specialtyFilter === "all" || doc.specialtyId.toString() === specialtyFilter;
      const matchTitle = titleFilter === "all" || doc.titleId.toString() === titleFilter;
      const matchLocation = officeLocationFilter === "all" || doc.officeLocationId?.toString() === officeLocationFilter;
      
      return matchSearch && matchDept && matchStatus && matchSpecialty && matchTitle && matchLocation;
    });
  }, [doctors, searchTerm, departmentFilter, statusFilter, specialtyFilter, titleFilter, officeLocationFilter, specialtyOptions, departmentOptions, titleOptions, officeLocationOptions]);

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDoctors, currentPage, itemsPerPage]);

  // ---------------
  // Modal 处理
  // ---------------
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentStep(1);
    setErrors({});
    setShowPassword(false);
    setPdfFileName("");
    setFormData({
      fullName: "", email: "", password: "", genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      role: 2, userStatus: 1, 
      licenseNumber: "", 
      specialtyId: specialtyOptions.length > 0 ? specialtyOptions[0].value : "", 
      titleId: titleOptions.length > 0 ? titleOptions[0].value : "", 
      departmentId: departmentOptions.length > 0 ? departmentOptions[0].value : "", 
      dateOfBirth: "", 
      officeLocationId: officeLocationOptions.length > 0 ? officeLocationOptions[0].value : "", 
      yearsOfExperience: 0,
      address: "", postalCode: "", officePhone: "", 
      dateJoin: "", dateLeft: "", doctorStatus: 0, 
      qualifications: "", biography: "", remark: "", resumePdf: null 
    });
    setPhoneCode("+65");
    setPhoneBody("");
    setIsModalOpen(true);
  };

  const openEditModal = (doc: SystemDoctor) => {
    setModalMode("edit");
    setCurrentStep(1);
    setErrors({});
    setShowPassword(false);
    setPdfFileName(doc.resumePdf ? "Uploaded_Resume.pdf" : "");
    
    // 【核心修复】：为所有 string 类型数据提供 `|| ""` 兜底，彻底解决 Uncontrolled Input 报错！
    setFormData({
      id: doc.id,
      userId: doc.userId,
      fullName: doc.user.full_name || "", 
      email: doc.user.email || "",
      password: "", 
      genderId: doc.user.gender_id || "", // 后端传回时为 gender_id
      role: doc.user.role,
      userStatus: doc.user.status ?? 1, 
      licenseNumber: doc.licenseNumber || "",
      specialtyId: doc.specialtyId || "", // 对应后端驼峰
      titleId: doc.titleId || "",
      departmentId: doc.departmentId || "",
      dateOfBirth: doc.dateOfBirth || "",
      officeLocationId: doc.officeLocationId || "",
      yearsOfExperience: doc.yearsOfExperience || 0,
      address: doc.address || "",
      postalCode: doc.postalCode || "", 
      officePhone: doc.officePhone || "", 
      dateJoin: doc.dateJoin || "",
      dateLeft: doc.dateLeft || "",
      doctorStatus: doc.status ?? 0,
      qualifications: doc.qualifications || "", 
      biography: doc.biography || "", 
      remark: doc.remark || "",
      resumePdf: doc.resumePdf || null
    });

    if (doc.user.phoneNumber?.startsWith("+60")) {
      setPhoneCode("+60");
      setPhoneBody(doc.user.phoneNumber.replace("+60", ""));
    } else {
      setPhoneCode("+65");
      setPhoneBody((doc.user.phoneNumber || "").replace("+65", ""));
    }
    setIsModalOpen(true);
  };

  const handlePdfUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrors(prev => ({ ...prev, resumePdf: "Only PDF format files are allowed." }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) { 
        setErrors(prev => ({ ...prev, resumePdf: "File size cannot exceed 2MB." }));
        return;
      }
      setPdfFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = (reader.result as string).split(",")[1];
        setFormData((prev: any) => ({ ...prev, resumePdf: base64Str }));
        if (errors.resumePdf) setErrors(prev => ({ ...prev, resumePdf: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "postalCode") {
      const numericVal = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev: any) => ({ ...prev, [name]: numericVal }));
    } else if (name === "officePhone") {
      const limitLen = phoneCode === "+65" ? 8 : 10;
      const numericVal = value.replace(/\D/g, "").slice(0, limitLen);
      setFormData((prev: any) => ({ ...prev, [name]: numericVal }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); 
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneBody(e.target.value.replace(/\D/g, ""));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
  };

  // 验证第一步
  const handleNextStep = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

    // 【核心修复】：加上 ?. 安全链，即便 undefined 也不会崩溃
    if (!formData.fullName?.trim()) newErrors.fullName = "Please enter your full name.";
    if (!formData.email?.trim() || !emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address.";
    
    if (modalMode === "create" && !formData.password) {
      newErrors.password = "Password must be at least 6 characters, including letters and numbers.";
    } else if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password = "Password must be at least 6 characters, including letters and numbers.";
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

    setCurrentStep(2);
  };

  // 验证第二步并保存
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    
    // 【核心修复】：加上 ?. 安全链，完全杜绝 null.trim() 的页面崩溃
    if (!formData.licenseNumber?.trim()) newErrors.licenseNumber = "License number is required.";
    if (!formData.departmentId) newErrors.departmentId = "Department choice is required.";
    if (!formData.specialtyId) newErrors.specialtyId = "Specialty choice is required.";
    if (!formData.titleId) newErrors.titleId = "Professional title choice is required.";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required.";
    if (!formData.dateJoin) newErrors.dateJoin = "Date join is required.";

    if (formData.officePhone) {
      if (phoneCode === "+65" && formData.officePhone.length !== 8) {
        newErrors.officePhone = "Singapore office phone must be exactly 8 digits.";
      } else if (phoneCode === "+60" && (formData.officePhone.length < 9 || formData.officePhone.length > 10)) {
        newErrors.officePhone = "Malaysia office phone must be 9 or 10 digits.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload = {
        ...formData,
        phone: `${phoneCode}${phoneBody}`,
        genderId: Number(formData.genderId),
        departmentId: Number(formData.departmentId),
        specialtyId: Number(formData.specialtyId),
        titleId: Number(formData.titleId),
        officeLocationId: formData.officeLocationId ? Number(formData.officeLocationId) : null,
        yearsOfExperience: Number(formData.yearsOfExperience),
        userStatus: Number(formData.userStatus), 
        doctorStatus: Number(formData.doctorStatus), 
        dateLeft: formData.dateLeft || null,
        address: formData.address || null,
        postalCode: formData.postalCode || null,
        officePhone: formData.officePhone || null,
        qualifications: formData.qualifications || null,
        biography: formData.biography || null,
        remark: formData.remark || null,
        resumePdf: formData.resumePdf || null
      };

      if (modalMode === "edit" && !formData.password) delete payload.password;

      const url = modalMode === "create" ? `${API_BASE_URL}/doctors` : `${API_BASE_URL}/doctors/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        setIsModalOpen(false);
        showToast("success", modalMode === "create" ? "Doctor created successfully!" : "Doctor profile updated successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        const fieldErrors = errorData.errors || errorData.validationErrors;
        
        if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
          const backendMappedErrors: Record<string, string> = {};
          let hasStep1Error = false;

          Object.keys(fieldErrors).forEach((key) => {
            const errorMsg = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key];
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            backendMappedErrors[camelKey] = errorMsg;

            if (['fullName', 'email', 'password', 'phone', 'genderId', 'role', 'userStatus'].includes(camelKey)) {
              hasStep1Error = true;
            }
          });

          setErrors(backendMappedErrors);

          if (hasStep1Error) {
            setCurrentStep(1); 
            showToast("error", "Error found in User Account Info. Please fix highlighted fields.");
          } else {
            showToast("error", errorData.message || "Please fix the highlighted errors below.");
          }
        } else {
          showToast("error", errorData.message || "Failed to save details. Please check your inputs.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorToDelete}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      
      if (res.ok) {
        showToast("success", "Doctor deleted successfully.");
        fetchData();
      } else {
        let errorMessage = "Failed to delete doctor.";
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
      setDoctorToDelete(null);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Management</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Manage hospital doctors and their professional profiles.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add New Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-[25%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            id="doctorSearchQueryNoAutofill"
            name="doctorSearchQueryNoAutofill"
            autoComplete="off"
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-colors"
            placeholder="Search by name, email or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full xl:w-auto">
          
          <div className="relative">
            <select
              className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departmentOptions.map(dep => <option key={dep.value} value={dep.value}>{dep.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="all">All Specialties</option>
              {specialtyOptions.map(spec => <option key={spec.value} value={spec.value}>{spec.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)}
            >
              <option value="all">All Titles</option>
              {titleOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={officeLocationFilter} onChange={(e) => setOfficeLocationFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {officeLocationOptions.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-10 text-center text-slate-600 font-medium text-sm">Loading doctor database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Email</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Phone Number</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Office Number</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Department</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Title</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">Specialty</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase">OfficeLocation</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDoctors.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-600 font-medium text-sm">No doctors found.</td></tr>
                ) : (
                  paginatedDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-semibold text-slate-900">{doc.user.full_name}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{doc.user.email}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{doc.user.phoneNumber || "-"}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{doc.officePhone || "-"}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{getDepartmentLabel(doc.departmentId)}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{getTitleLabel(doc.titleId)}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{getSpecialtyLabel(doc.specialtyId)}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{getOfficeLocationLabel(doc.officeLocationId)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setViewData(doc); setIsViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(doc)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { setDoctorToDelete(doc.id); setIsDeleteAlertOpen(true); }} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        {!isLoading && filteredDoctors.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDoctors.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ========================================= */}
      {/* Create / Edit Modal (2-Step Wizard)         */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form 
            onSubmit={(e) => e.preventDefault()} 
            autoComplete="new-password"
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
          >
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Register New Doctor" : "Edit Doctor Profile"}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Step {currentStep} of 2: {currentStep === 1 ? 'User Account Info' : 'Professional Details'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-full transition-colors bg-slate-50 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              {/* --- STEP 1: User Information --- */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  {/* Left Column */}
                  <div className="space-y-5">
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <div className="relative">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.fullName ? 'text-red-400' : 'text-slate-400'}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} 
                          autoComplete="new-password"
                          className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${
                            errors.fullName 
                              ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" 
                              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                          }`} 
                          placeholder="John Doe" 
                        />
                      </div>
                      {errors.fullName && <p className="text-red-500 text-[11px] mt-1.5">{errors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'}`}>
                          <Mail className="w-4 h-4" />
                        </div>
                        <input 
                          type="email" name="email" value={formData.email} onChange={handleInputChange} 
                          autoComplete="new-password"
                          className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${
                            errors.email 
                              ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" 
                              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                          }`} 
                          placeholder="you@example.com" 
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-[11px] mt-1.5">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                      <div className="relative">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'}`}>
                          <Lock className="w-4 h-4" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} 
                          autoComplete="new-password"
                          className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors border ${
                            errors.password 
                              ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" 
                              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                          }`} 
                          placeholder="Min 6 chars, letters & numbers" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400 hover:text-red-600' : 'text-slate-400 hover:text-slate-600'} transition-colors`}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-[11px] mt-1.5">{errors.password}</p>}
                      {modalMode === "edit" && !errors.password && <p className="text-slate-400 text-[11px] mt-1.5">Leave blank to keep current password.</p>}
                    </div>

                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    
                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <div className={`flex border rounded-lg overflow-hidden transition-colors ${
                        errors.phone ? "bg-red-50 border-red-300 focus-within:ring-2 focus-within:ring-red-200" : "bg-white border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500"
                      }`}>
                        <div className={`flex items-center pl-3 pr-1 ${errors.phone ? 'text-red-400' : 'text-slate-400'}`}>
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="relative flex items-center">
                          <select 
                            value={phoneCode} onChange={(e) => { setPhoneCode(e.target.value); setPhoneBody(""); if(errors.phone) setErrors(p=>({...p, phone: ""})); }} 
                            className={`appearance-none bg-transparent pl-1 pr-6 py-2.5 text-sm font-bold outline-none cursor-pointer ${errors.phone ? 'text-red-500' : 'text-slate-700'}`}
                          >
                            <option value="+65">+65</option>
                            <option value="+60">+60</option>
                          </select>
                          <ChevronDown className={`absolute right-1 w-3 h-3 pointer-events-none ${errors.phone ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                        <div className={`w-px my-2 ${errors.phone ? 'bg-red-200' : 'bg-slate-200'}`}></div>
                        <input 
                          type="text" value={phoneBody} onChange={handlePhoneBodyChange} maxLength={phoneCode === "+65" ? 8 : 10} 
                          className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none ${errors.phone ? 'text-red-500 placeholder-red-300' : 'text-slate-900 placeholder-slate-400'}`} 
                          placeholder={phoneCode === "+65" ? "8123 4567" : "12 345 6789"} 
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-[11px] mt-1.5">{errors.phone}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                      <div className="relative">
                        <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                          {genderOptions.map((g) => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Role & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">System Role</label>
                        <div className="relative">
                          <select disabled className="appearance-none w-full px-3 py-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg font-medium outline-none cursor-not-allowed">
                            <option>Doctor</option>
                          </select>
                          <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Status</label>
                        <div className="relative">
                          <select name="userStatus" value={formData.userStatus} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* --- STEP 2: Doctor Information --- */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">License Number</label>
                      <input 
                        type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} 
                        className={`w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.licenseNumber ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} 
                        placeholder="e.g. DOC-12345" 
                      />
                      {errors.licenseNumber && <p className="text-red-500 text-[11px] mt-1.5">{errors.licenseNumber}</p>}
                    </div>

                    {/* Department Dropdown */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                      <div className="relative">
                        <select 
                          name="departmentId" 
                          value={formData.departmentId} 
                          onChange={handleInputChange} 
                          className={`appearance-none w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border cursor-pointer ${errors.departmentId ? "bg-red-50 border-red-300 text-red-500 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`}
                        >
                          <option value="" disabled>Select Department</option>
                          {departmentOptions.map(dep => (
                            <option key={dep.value} value={dep.value}>{dep.label}</option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${errors.departmentId ? 'text-red-400' : 'text-slate-400'}`} />
                      </div>
                      {errors.departmentId && <p className="text-red-500 text-[11px] mt-1.5">{errors.departmentId}</p>}
                    </div>

                    {/* Specialty Dropdown */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specialty</label>
                      <div className="relative">
                        <select 
                          name="specialtyId" 
                          value={formData.specialtyId} 
                          onChange={handleInputChange} 
                          className={`appearance-none w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border cursor-pointer ${errors.specialtyId ? "bg-red-50 border-red-300 text-red-500 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`}
                        >
                          <option value="" disabled>Select Specialty</option>
                          {specialtyOptions.map(spec => (
                            <option key={spec.value} value={spec.value}>{spec.label}</option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${errors.specialtyId ? 'text-red-400' : 'text-slate-400'}`} />
                      </div>
                      {errors.specialtyId && <p className="text-red-500 text-[11px] mt-1.5">{errors.specialtyId}</p>}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                      <input 
                        type="text" name="address" value={formData.address} onChange={handleInputChange} 
                        className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="e.g. 123 Clinic Road" 
                      />
                    </div>

                    {/* Qualifications */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qualifications</label>
                      <textarea 
                        name="qualifications" value={formData.qualifications} onChange={handleInputChange} rows={2}
                        className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
                        placeholder="e.g. PhD in Cardiology, FACC Board Certified" 
                      />
                    </div>

                    {/* PDF 简历上传 */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Resume (PDF)</label>
                      <div className="relative">
                        <input 
                          type="file" id="resumePdfUploadField" accept=".pdf" onChange={handlePdfUploadChange} 
                          className="hidden" 
                        />
                        <label 
                          htmlFor="resumePdfUploadField" 
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border cursor-pointer transition-colors ${
                            errors.resumePdf ? "bg-red-50 border-red-300 text-red-500" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate pr-4">{pdfFileName || "Upload PDF resume (Max 2MB)"}</span>
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        </label>
                      </div>
                      {errors.resumePdf && <p className="text-red-500 text-[11px] mt-1.5">{errors.resumePdf}</p>}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Professional Title Dropdown */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Professional Title</label>
                      <div className="relative">
                        <select 
                          name="titleId" 
                          value={formData.titleId} 
                          onChange={handleInputChange} 
                          className={`appearance-none w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border cursor-pointer ${errors.titleId ? "bg-red-50 border-red-300 text-red-500 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`}
                        >
                          <option value="" disabled>Select Title</option>
                          {titleOptions.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${errors.titleId ? 'text-red-400' : 'text-slate-400'}`} />
                      </div>
                      {errors.titleId && <p className="text-red-500 text-[11px] mt-1.5">{errors.titleId}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                      <input 
                        type="date" name="dateOfBirth" lang="en-US" value={formData.dateOfBirth} onChange={handleInputChange} 
                        className={`w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border [color-scheme:light] ${errors.dateOfBirth ? "bg-red-50 border-red-300 text-red-500 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`} 
                      />
                      {errors.dateOfBirth && <p className="text-red-500 text-[11px] mt-1.5">{errors.dateOfBirth}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Years of Exp.</label>
                        <input type="number" min="0" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleInputChange} className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 10" />
                      </div>
                      
                      {/* Office Location Dropdown */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Office Location</label>
                        <div className="relative">
                          <select 
                            name="officeLocationId" 
                            value={formData.officeLocationId} 
                            onChange={handleInputChange} 
                            className="appearance-none w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="">Select Office</option>
                            {officeLocationOptions.map(loc => (
                              <option key={loc.value} value={loc.value}>{loc.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Postal Code */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                        <input 
                          type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} maxLength={6}
                          className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                          placeholder="Max 6 digits" 
                        />
                      </div>
                      
                      {/* Office Phone */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Office Phone</label>
                        <input 
                          type="text" name="officePhone" value={formData.officePhone} onChange={handleInputChange} 
                          maxLength={phoneCode === "+65" ? 8 : 10}
                          className={`w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${
                            errors.officePhone 
                              ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" 
                              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                          }`} 
                          placeholder={phoneCode === "+65" ? "e.g. 62345678" : "e.g. 362345678"} 
                        />
                        {errors.officePhone && <p className="text-red-500 text-[11px] mt-1.5">{errors.officePhone}</p>}
                      </div>
                    </div>

                    {/* Biography */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Biography</label>
                      <textarea 
                        name="biography" value={formData.biography} onChange={handleInputChange} rows={2}
                        className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
                        placeholder="e.g. Over 15 years experience in general cardiology treatment..." 
                      />
                    </div>
                  </div>

                  {/* Additional fields row */}
                  <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-5 mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date Join</label>
                      <input 
                        type="date" name="dateJoin" value={formData.dateJoin} onChange={handleInputChange} 
                        className={`w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors border [color-scheme:light] ${errors.dateJoin ? "bg-red-50 border-red-300 text-red-500 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"}`} 
                      />
                      {errors.dateJoin && <p className="text-red-500 text-[11px] mt-1.5">{errors.dateJoin}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date Left <span className="text-slate-400 font-medium ml-1 lowercase">(Optional)</span></label>
                      <input 
                        type="date" name="dateLeft" value={formData.dateLeft || ""} onChange={handleInputChange} 
                        className="w-full px-3 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none [color-scheme:light]" 
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Doctor Work Status</label>
                      <div className="relative">
                        <select name="doctorStatus" value={formData.doctorStatus} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                          <option value={0}>Active / Working</option>
                          <option value={1}>Suspended</option>
                          <option value={2}>On Leave</option>
                          <option value={3}>Terminated</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remark <span className="text-slate-400 font-medium ml-1 lowercase">(Optional)</span></label>
                      <input 
                        type="text" name="remark" value={formData.remark || ""} onChange={handleInputChange} 
                        className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="Internal staff remarks..." 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
              <div className="w-full sm:w-auto">
                {currentStep === 2 && (
                  <button type="button" onClick={() => setCurrentStep(1)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold transition">Back to User Info</button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold transition">Cancel</button>
                {currentStep === 1 ? (
                  <button type="button" onClick={handleNextStep} className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-sm transition">Continue Next</button>
                ) : (
                  <button type="button" onClick={handleSave} className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold shadow-sm transition">Save Doctor</button>
                )}
              </div>
            </div>

          </form>
        </div>
      )}

      {/* ========================================= */}
      {/* View Modal (2 Sections Layout)              */}
      {/* ========================================= */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Doctor Full Profile</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Content area with Scrollbar */}
            <div className="p-6 bg-slate-50 overflow-y-auto custom-scrollbar">
              
              {/* Section 1: User Account Details */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /> Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Full Name", value: viewData.user.full_name, icon: User },
                    { label: "Email Address", value: viewData.user.email, icon: Mail },
                    { label: "Phone Number", value: viewData.user.phoneNumber || "N/A", icon: Phone },
                    { label: "Gender", value: getGenderLabel(viewData.user.gender_id), icon: CheckCircle2 }, 
                    { label: "System Role", value: "Doctor", icon: Shield, isBadge: true, variant: "info" },
                    { label: "Account Status", value: viewData.user.status === 1 ? "Active" : "Inactive", icon: CheckCircle2, isBadge: true, variant: viewData.user.status === 1 ? "success" : "danger" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><item.icon className="w-4 h-4 text-slate-500" /></div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                        {item.isBadge ? <div className="mt-1"><Badge variant={item.variant as any}>{item.value}</Badge></div> : <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Professional Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-slate-500" /> Professional Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "License Number", value: viewData.licenseNumber, icon: Award },
                    { label: "Department", value: getDepartmentLabel(viewData.departmentId), icon: Briefcase },
                    { label: "Specialty", value: getSpecialtyLabel(viewData.specialtyId), icon: Stethoscope },
                    { label: "Professional Title", value: getTitleLabel(viewData.titleId), icon: Award },
                    { label: "Years of Exp.", value: `${viewData.yearsOfExperience} Years`, icon: Award },
                    { label: "Office Location", value: getOfficeLocationLabel(viewData.officeLocationId), icon: MapPin },
                    { label: "Date of Birth", value: viewData.dateOfBirth, icon: Calendar },
                    { label: "Date Join", value: viewData.dateJoin, icon: Calendar },
                    { label: "Date Left", value: viewData.dateLeft || "Still Employed", icon: Calendar },
                    { label: "Work Status", value: getDoctorStatusLabel(viewData.status).label, icon: CheckCircle2, isBadge: true, variant: getDoctorStatusLabel(viewData.status).variant },
                    { label: "Office Phone", value: viewData.officePhone || "N/A", icon: Phone },
                    { label: "Postal Code", value: viewData.postalCode || "N/A", icon: MapPin },
                    { label: "Qualifications", value: viewData.qualifications || "N/A", icon: FileText },
                    { label: "Biography", value: viewData.biography || "N/A", icon: AlignLeft },
                    { label: "Address", value: viewData.address || "N/A", icon: MapPin },
                    { label: "Remark", value: viewData.remark || "N/A", icon: Info },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100"><item.icon className="w-4 h-4 text-slate-500" /></div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                        {item.isBadge ? <div className="mt-1"><Badge variant={item.variant as any}>{item.value}</Badge></div> : <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>}
                      </div>
                    </div>
                  ))}
                  
                  {/* 查看简历专属附件块 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Resume (PDF)</p>
                      {viewData.resumePdf ? (
                        <a 
                          href={`data:application/pdf;base64,${viewData.resumePdf}`} 
                          download={`${viewData.user.full_name}_Resume.pdf`}
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline truncate inline-block"
                        >
                          Download Document
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-slate-900 truncate">Not Uploaded</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Delete Confirmation                         */}
      {/* ========================================= */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h3>
            <p className="text-slate-600 text-sm font-medium mb-6">Are you sure you want to delete this doctor? This action cannot be undone and will remove the user account as well.</p>
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