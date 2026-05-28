"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Plus, Edit, Trash2, X, AlertTriangle, Eye, User,
  Mail, Phone, Shield, CheckCircle2, ChevronDown, Stethoscope, Briefcase, Calendar, MapPin, Award, Lock, EyeOff, FileText, AlignLeft, Info, Camera
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

interface SystemDoctor {
  id: number;
  userId: number;
  licenseNumber: string | null;
  specialtyId: number | null; 
  positionId: number | null; 
  departmentId: number | null; 
  officeLocationId: number | null; 
  dateOfBirth: string | null;
  yearsOfExperience: number | null;
  qualifications: string | null; 
  biography: string | null; 
  address: string | null; 
  postalCode: string | null; 
  officePhone: string | null; 
  dateJoin: string | null; 
  dateLeft: string | null; 
  remark: string | null; 
  status: number | null; 
  user: {
    id: number;
    fullName: string; 
    email: string;
    phoneNumber: string | null;
    phoneNumberAlt: string | null;
    profileImageUrl: string | null;
    genderId: number | null; 
    role: number;
    status: number; 
    gender?: { id: number; name: string };
  };
}

interface DropdownOption { value: number; label: string; }

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
          {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
          <span className="font-semibold text-sm leading-snug">{message}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 p-1"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<SystemDoctor[]>([]);
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]);
  
  const [departmentOptions, setDepartmentOptions] = useState<DropdownOption[]>([]); 
  const [specialtyOptions, setSpecialtyOptions] = useState<DropdownOption[]>([]); 
  const [titleOptions, setTitleOptions] = useState<DropdownOption[]>([]); 
  const [officeLocationOptions, setOfficeLocationOptions] = useState<DropdownOption[]>([]); 

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [officeLocationFilter, setOfficeLocationFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState<any>({});
  const [phoneCode, setPhoneCode] = useState("+65");
  const [phoneBody, setPhoneBody] = useState("");
  const [viewData, setViewData] = useState<SystemDoctor | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" });
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000); 
  };

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  };

  // 新增：自动拼接解析本地保存图片的绝对 URL，确保前端不裂图
  const getProfileImageSrc = (url: string | null | undefined, fallbackName: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${fallbackName}&background=f1f5f9&color=334155&bold=true`;
    if (url.startsWith("data:image/")) return url; // 本地 Base64 实时预览
    if (url.startsWith("/user-image/")) {
      const origin = API_BASE_URL.replace("/api", ""); // 将 http://localhost:5062/api 剪切为主域名 origin
      return `${origin}${url}`;
    }
    return url;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [doctorsRes, gendersRes, deptsRes, specialtiesRes, locationsRes, positionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/doctors`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Department`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Specialty`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/OfficeLocation`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Position`, { headers: getAuthHeaders() })
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
      if (positionsRes.ok) {
        const positionsJson = await positionsRes.json();
        setTitleOptions((positionsJson.data || []).filter((t: any) => t.status === 1).map((t: any) => ({ value: t.id, label: t.name })));
      }
      if (locationsRes.ok) {
        const locationsJson = await locationsRes.json();
        setOfficeLocationOptions((locationsJson.data || []).filter((l: any) => l.status === 1).map((l: any) => ({ value: l.id, label: l.name })));
      }
    } catch {
      showToast("error", "Failed to load doctor database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, departmentFilter, statusFilter, specialtyFilter, titleFilter, officeLocationFilter]);

  const getDepartmentLabel = (id: number | null) => id ? departmentOptions.find(d => d.value === id)?.label || "N/A" : "N/A";
  const getSpecialtyLabel = (id: number | null) => id ? specialtyOptions.find(s => s.value === id)?.label || "N/A" : "N/A";
  const getTitleLabel = (id: number | null) => id ? titleOptions.find(t => t.value === id)?.label || "N/A" : "N/A";
  const getOfficeLocationLabel = (id: number | null) => id ? officeLocationOptions.find(l => l.value === id)?.label || "N/A" : "N/A";
  const getGenderLabel = (id: number | null) => id ? genderOptions.find(g => g.value === id)?.label || "N/A" : "N/A";

  const getDoctorStatusLabel = (statusCode: number | null) => {
    switch (statusCode) {
      case 0: return { label: "Active / Working", variant: "success" };
      case 1: return { label: "Suspended", variant: "danger" };
      case 2: return { label: "On Leave", variant: "warning" };
      case 3: return { label: "Terminated", variant: "secondary" };
      default: return { label: "Active", variant: "success" };
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        doc.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSpecialtyLabel(doc.specialtyId)?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDept = departmentFilter === "all" || doc.departmentId?.toString() === departmentFilter;
      const matchStatus = statusFilter === "all" || doc.user.status.toString() === statusFilter;
      const matchSpecialty = specialtyFilter === "all" || doc.specialtyId?.toString() === specialtyFilter;
      const matchTitle = titleFilter === "all" || doc.positionId?.toString() === titleFilter;
      const matchLocation = officeLocationFilter === "all" || doc.officeLocationId?.toString() === officeLocationFilter;
      
      return matchSearch && matchDept && matchStatus && matchSpecialty && matchTitle && matchLocation;
    });
  }, [doctors, searchTerm, departmentFilter, statusFilter, specialtyFilter, titleFilter, officeLocationFilter, specialtyOptions, departmentOptions, titleOptions, officeLocationOptions]);

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDoctors, currentPage, itemsPerPage]);

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentStep(1);
    setErrors({});
    setShowPassword(false);
    setFormData({
      fullName: "", email: "", password: "", genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      profileImageUrl: "", phoneNumberAlt: "", userStatus: 1, 
      address: "", addressLine2: "", city: "", state: "", postalCode: "", country: "",
      licenseNumber: "", 
      specialtyId: specialtyOptions.length > 0 ? specialtyOptions[0].value : "", 
      positionId: titleOptions.length > 0 ? titleOptions[0].value : "", 
      departmentId: departmentOptions.length > 0 ? departmentOptions[0].value : "", 
      dateOfBirth: "", 
      officeLocationId: "", 
      yearsOfExperience: 0,
      officePhone: "", 
      dateJoin: "", dateLeft: "", doctorStatus: 0, 
      qualifications: "", biography: "", remark: ""
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
    
    setFormData({
      id: doc.id,
      userId: doc.userId,
      fullName: doc.user.fullName || "", 
      email: doc.user.email || "",
      password: "", 
      genderId: doc.user.genderId || "",
      profileImageUrl: doc.user.profileImageUrl || "",
      phoneNumberAlt: doc.user.phoneNumberAlt || "",
      userStatus: doc.user.status ?? 1, 
      address: doc.address || "",
      addressLine2: doc.user.profileImageUrl || "", 
      city: "", 
      state: "", 
      postalCode: doc.postalCode || "", 
      country: "",
      licenseNumber: doc.licenseNumber || "",
      specialtyId: doc.specialtyId || "", 
      positionId: doc.positionId || "",
      departmentId: doc.departmentId || "",
      dateOfBirth: doc.dateOfBirth || "",
      officeLocationId: doc.officeLocationId || "",
      yearsOfExperience: doc.yearsOfExperience || 0,
      officePhone: doc.officePhone || "", 
      dateJoin: doc.dateJoin || "",
      dateLeft: doc.dateLeft || "",
      doctorStatus: doc.status ?? 0,
      qualifications: doc.qualifications || "", 
      biography: doc.biography || "", 
      remark: doc.remark || ""
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); 
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneBody(e.target.value.replace(/\D/g, ""));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
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
      showToast("success", "Avatar uploaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

    if (!formData.fullName?.trim()) newErrors.fullName = "Please enter full name.";
    if (!formData.email?.trim() || !emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address.";
    
    if (modalMode === "create" && !formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password = "Password must be at least 6 characters, including letters and numbers.";
    }

    if (!phoneBody) {
      newErrors.phone = "Please enter phone number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setCurrentStep(2);
  };

  const handleSave = async () => {
    // 增加：前台对必填项的二次安全过滤和拦截，提供红框高亮定位
    const newErrors: Record<string, string> = {};
    if (!formData.licenseNumber?.trim()) newErrors.licenseNumber = "License number is required.";
    if (!formData.departmentId) newErrors.departmentId = "Department choice is required.";
    if (!formData.specialtyId) newErrors.specialtyId = "Specialty choice is required.";
    if (!formData.positionId) newErrors.positionId = "Professional title choice is required.";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required.";
    if (!formData.dateJoin) newErrors.dateJoin = "Date join is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("error", "Please fix the highlighted required fields on Step 2.");
      return;
    }

    try {
      const payload = {
        ...formData,
        phone: `${phoneCode}${phoneBody}`,
        genderId: Number(formData.genderId),
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
        specialtyId: formData.specialtyId ? Number(formData.specialtyId) : null,
        positionId: formData.positionId ? Number(formData.positionId) : null,
        officeLocationId: formData.officeLocationId ? Number(formData.officeLocationId) : null,
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : null,
        userStatus: Number(formData.userStatus), 
        doctorStatus: formData.doctorStatus !== undefined ? Number(formData.doctorStatus) : null, 
        dateOfBirth: formData.dateOfBirth || null,
        dateJoin: formData.dateJoin || null,
        dateLeft: formData.dateLeft || null,
        address: formData.address || null,
        addressLine2: formData.addressLine2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postalCode: formData.postalCode || null,
        country: formData.country || null,
        officePhone: formData.officePhone || null,
        qualifications: formData.qualifications || null,
        biography: formData.biography || null,
        remark: formData.remark || null
      };

      if (modalMode === "edit" && !formData.password) delete payload.password;

      const url = modalMode === "create" ? `${API_BASE_URL}/doctors` : `${API_BASE_URL}/doctors/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        setIsModalOpen(false);
        showToast("success", modalMode === "create" ? "Doctor successfully created!" : "Doctor updated successfully!");
        fetchData();
      } else {
        const errJson = await res.json();
        const fieldErrors = errJson.errors || errJson.validationErrors;
        
        // 核心优化点：提取后端 API 具体的 Validation Errors 并完美平铺在 input 的红框下
        if (fieldErrors && typeof fieldErrors === "object") {
          const backendMappedErrors: Record<string, string> = {};
          let returnToStep1 = false;

          Object.keys(fieldErrors).forEach((key) => {
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            const messages = fieldErrors[key];
            backendMappedErrors[camelKey] = Array.isArray(messages) ? messages[0] : messages;
            
            // 如果报错位于第一步的基本信息里，自动跳回第一步
            if (["fullName", "email", "password", "phone", "genderId"].includes(camelKey)) {
              returnToStep1 = true;
            }
          });

          setErrors(backendMappedErrors);
          if (returnToStep1) {
            setCurrentStep(1);
            showToast("error", "Verification failed. Please check the highlights on Step 1.");
          } else {
            showToast("error", "Verification failed. Please check the highlights on Step 2.");
          }
        } else {
          showToast("error", errJson.message || "Failed to save details.");
        }
      }
    } catch {
      showToast("error", "A network error occurred.");
    }
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorToDelete}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        showToast("success", "Doctor deleted successfully.");
        fetchData();
      } else {
        showToast("error", "Delete failed.");
      }
    } catch {
      showToast("error", "Network error.");
    } finally {
      setIsDeleteAlertOpen(false);
      setDoctorToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-950">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Doctor Management</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage hospital doctors and their professional profiles.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
          <Plus className="w-4.5 h-4.5" /> Add New Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-[25%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 font-medium"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full xl:w-auto">
          <div className="relative">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {departmentOptions.map(dep => <option key={dep.value} value={dep.value}>{dep.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
              <option value="all">All Specialties</option>
              {specialtyOptions.map(spec => <option key={spec.value} value={spec.value}>{spec.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)}>
              <option value="all">All Titles</option>
              {titleOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={officeLocationFilter} onChange={(e) => setOfficeLocationFilter(e.target.value)}>
              <option value="all">All Locations</option>
              {officeLocationOptions.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading doctor database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Office Number</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Specialty</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">OfficeLocation</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDoctors.length === 0 ? (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-400 font-medium">No doctors found.</td></tr>
                ) : (
                  paginatedDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">{doc.user.fullName}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{doc.user.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{doc.user.phoneNumber || "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{doc.officePhone || "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{getDepartmentLabel(doc.departmentId)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{getTitleLabel(doc.positionId)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{getSpecialtyLabel(doc.specialtyId)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{getOfficeLocationLabel(doc.officeLocationId)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => { setViewData(doc); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></button>
                          <button onClick={() => openEditModal(doc)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-4.5 h-4.5" /></button>
                          <button onClick={() => { setDoctorToDelete(doc.id); setIsDeleteAlertOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4.5 h-4.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

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

      {/* Wizard Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{modalMode === "create" ? "Register New Doctor" : "Edit Doctor Profile"}</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Step {currentStep} of 2: {currentStep === 1 ? 'User Account Details' : 'Professional Profile'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/20 space-y-6">
              {currentStep === 1 ? (
                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={getProfileImageSrc(formData.profileImageUrl, formData.fullName || 'Doctor')} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/10 shadow-sm" />
                      <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm font-bold text-slate-800">Avatar Image</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">Click on the image to upload. Supported formats: JPG, PNG. Limit: 1MB.</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" /> Account Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name *</label>
                        <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.fullName ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.fullName && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.fullName}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Email Address *</label>
                        <input name="email" value={formData.email} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.email ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.email && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Password *</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.password ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.password && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.password}</p>}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Gender</label>
                        <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none">{genderOptions.map((g)=><option key={g.value} value={g.value}>{g.label}</option>)}</select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Phone Number *</label>
                        <input name="phone" value={phoneBody} onChange={handlePhoneBodyChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.phone ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.phone && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.phone}</p>}
                      </div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Alt Phone</label><input name="phoneNumberAlt" value={formData.phoneNumberAlt || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Account Status</label>
                        <select name="userStatus" value={formData.userStatus} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none"><option value="1">Active</option><option value="0">Inactive</option></select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /> Correspondence Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Address Line 1</label><input name="address" value={formData.address || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Address Line 2</label><input name="addressLine2" value={formData.addressLine2 || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">City</label><input name="city" value={formData.city || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">State</label><input name="state" value={formData.state || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Postal Code</label><input name="postalCode" value={formData.postalCode || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Country</label><input name="country" value={formData.country || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600" /> Hospital Association</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">License Number *</label>
                        <input name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all ${errors.licenseNumber ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.licenseNumber && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.licenseNumber}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Date of Birth *</label>
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all [color-scheme:light] ${errors.dateOfBirth ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.dateOfBirth && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.dateOfBirth}</p>}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Department *</label>
                        <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none ${errors.departmentId ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`}><option value="">Select Dept</option>{departmentOptions.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.departmentId && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.departmentId}</p>}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Specialty *</label>
                        <select name="specialtyId" value={formData.specialtyId} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none ${errors.specialtyId ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`}><option value="">Select Specialty</option>{specialtyOptions.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.specialtyId && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.specialtyId}</p>}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Professional Title *</label>
                        <select name="positionId" value={formData.positionId} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none ${errors.positionId ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`}><option value="">Select Title</option>{titleOptions.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.positionId && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.positionId}</p>}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Office Location</label>
                        <select name="officeLocationId" value={formData.officeLocationId || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none"><option value="">Select Room</option>{officeLocationOptions.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Years of Experience</label><input type="number" name="yearsOfExperience" value={formData.yearsOfExperience || 0} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Office Phone</label><input name="officePhone" value={formData.officePhone || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Date Join *</label>
                        <input type="date" name="dateJoin" value={formData.dateJoin} onChange={handleInputChange} className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all [color-scheme:light] ${errors.dateJoin ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400" : "bg-slate-50/50 border-slate-250 focus:bg-white focus:border-emerald-500"}`} />
                        {errors.dateJoin && <p className="text-rose-600 text-xs mt-1 font-semibold">{errors.dateJoin}</p>}
                      </div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Date Left</label><input type="date" name="dateLeft" value={formData.dateLeft || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all [color-scheme:light]" /></div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Doctor Work Status</label>
                        <select name="doctorStatus" value={formData.doctorStatus || 0} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none"><option value={0}>Active / Working</option><option value={1}>Suspended</option><option value={2}>On Leave</option><option value={3}>Terminated</option></select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1.5">Remark</label><input name="remark" value={formData.remark || ""} onChange={handleInputChange} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-semibold outline-none transition-all" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Academic Biography</h3>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Qualifications</label><textarea name="qualifications" value={formData.qualifications || ""} onChange={handleInputChange} rows={2} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-medium outline-none resize-none" placeholder="Medical qualifications..." /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Biography</label><textarea name="biography" value={formData.biography || ""} onChange={handleInputChange} rows={2} className="w-full border border-slate-250 bg-slate-50/50 focus:bg-white focus:border-emerald-500 rounded-xl p-2.5 text-sm font-medium outline-none resize-none" placeholder="Short doctor biography..." /></div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex justify-between shrink-0">
              <div>
                {currentStep === 2 && (
                  <button type="button" onClick={() => setCurrentStep(1)} className="px-5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white hover:bg-slate-100 font-semibold text-slate-700">Back</button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white hover:bg-slate-100 font-semibold text-slate-700">Cancel</button>
                {currentStep === 1 ? (
                  <button type="button" onClick={handleNextStep} className="px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">Next Step</button>
                ) : (
                  <button type="button" onClick={handleSave} className="px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold">Save Doctor</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPLETE DETAIL MODAL (Resume Dual-Column Layout) */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Doctor Profile Card</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 bg-slate-50/50 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (1/3 Narrow) - Portrait & Core details */}
                <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-4">
                  <img src={getProfileImageSrc(viewData.user.profileImageUrl, viewData.user.fullName)} alt={viewData.user.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{viewData.user.fullName}</h3>
                    <p className="text-slate-500 text-xs font-semibold mt-1">License: {viewData.licenseNumber || "N/A"}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full pt-2">
                    <Badge variant="info">Doctor</Badge>
                    <Badge variant={viewData.user.status === 1 ? "success" : "danger"}>{viewData.user.status === 1 ? "Active Status" : "Inactive"}</Badge>
                  </div>
                </div>

                {/* Right Column (2/3 Wide) - Structured Data Grid */}
                <div className="md:col-span-8 space-y-5">
                  {/* Sub Section A: Personal details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><User className="w-4 h-4 text-emerald-600" /> Personal Account</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Gender:</span> {getGenderLabel(viewData.user.genderId)}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Email:</span> {viewData.user.email}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Birth Date:</span> {viewData.dateOfBirth || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Contact Tel:</span> {viewData.user.phoneNumber || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Backup Tel:</span> {viewData.user.phoneNumberAlt || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Address:</span> {[viewData.address, viewData.postalCode].filter(Boolean).join(", ") || "N/A"}</p>
                    </div>
                  </div>

                  {/* Sub Section B: Hospital position */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Stethoscope className="w-4 h-4 text-emerald-600" /> Hospital Position</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Department:</span> {getDepartmentLabel(viewData.departmentId)}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Title:</span> {getTitleLabel(viewData.positionId)}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Specialty:</span> {getSpecialtyLabel(viewData.specialtyId)}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Room No:</span> {getOfficeLocationLabel(viewData.officeLocationId)}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Office Phone:</span> {viewData.officePhone || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Join Date:</span> {viewData.dateJoin || "N/A"}</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Experience:</span> {viewData.yearsOfExperience ?? 0} Years</p>
                      <p className="text-sm font-semibold text-slate-900"><span className="text-slate-400 font-bold w-24 inline-block">Work Status:</span> <Badge variant={getDoctorStatusLabel(viewData.status).variant as any}>{getDoctorStatusLabel(viewData.status).label}</Badge></p>
                    </div>
                  </div>

                  {/* Sub Section C: Academic Biography */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Award className="w-4 h-4 text-emerald-600" /> Academic & Experience Biography</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-bold text-xs block mb-1">Qualifications:</span>
                        <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed">{viewData.qualifications || "None listed."}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold text-xs block mb-1">Biography:</span>
                        <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed">{viewData.biography || "None listed."}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold text-xs block mb-1">Internal Remark:</span>
                        <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed">{viewData.remark || "None."}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-150 flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 bg-white transition-all">Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center border w-full max-w-sm border-slate-200">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-100">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Delete Doctor</h3>
            <p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">Are you sure you want to permanently delete this doctor profile and their associated system account?</p>
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