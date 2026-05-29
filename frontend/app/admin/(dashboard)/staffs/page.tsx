"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  Phone,
  Shield,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Camera,
  Calendar,
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
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

type BadgeVariant = "success" | "danger" | "info" | "warning" | "secondary";

/* ─────────────────────────────────────────────────────────
   PURE UI COMPONENTS  (defined outside the page component
   so they are stable references and accept typed props)
───────────────────────────────────────────────────────── */

/** Coloured pill badge */
const Badge: React.FC<{ children: React.ReactNode; variant: BadgeVariant }> = ({
  children,
  variant,
}) => {
  const cls: Record<BadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-rose-50   text-rose-700    border-rose-200",
    info: "bg-sky-50    text-sky-700     border-sky-200",
    warning: "bg-amber-50  text-amber-700   border-amber-200",
    secondary: "bg-slate-50  text-slate-700   border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls[variant]}`}
    >
      {children}
    </span>
  );
};

/** 居中显示的提示框 (保留原版设计，存在2秒自动消失) */
const Toast: React.FC<{
  show: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}> = ({ show, message, type, onClose }) => {
  if (!show) return null;
  return (
    // 使用 inset-0, flex, items-center, justify-center 让其在屏幕正中间
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none px-4">
      <div
        className={`pointer-events-auto w-full max-w-md flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in zoom-in-95 fade-in duration-200 ${
          type === "success"
            ? "bg-white border-emerald-200 text-emerald-800"
            : "bg-white border-rose-200 text-rose-800"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="font-semibold text-sm">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** 单个信息格 (适配新版卡片UI) */
const InfoCell: React.FC<{
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
}> = ({ label, value, wide }) => (
  <div
    className={wide ? "col-span-1 sm:col-span-2 lg:col-span-3" : "col-span-1"}
  >
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
      {label}
    </p>
    <p className="text-sm font-semibold text-slate-800 break-words leading-relaxed">
      {value || (
        <span className="text-slate-300 font-medium italic">
          未提供 / Not provided
        </span>
      )}
    </p>
  </div>
);

/** View 详情弹窗中的分层 Section 卡片 */
const ViewSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6 last:mb-0">
    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600">
        {icon}
      </span>
      <h4 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
        {children}
      </div>
    </div>
  </div>
);

/** Section wrapper for Add/Edit forms */
const FormSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">
        {title}
      </h3>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

/** Generic text input with label and optional error */
const LabelInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  rightIcon?: React.ReactNode;
}> = ({
  label,
  name,
  type = "text",
  required,
  placeholder,
  maxLength,
  value,
  error,
  onChange,
  onBlur,
  rightIcon,
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="new-password"
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all placeholder-slate-300 ${
          rightIcon ? "pr-9" : ""
        } ${
          error
            ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            : "border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        }`}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {rightIcon}
        </span>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
  </div>
);

/** Generic select with label */
const LabelSelect: React.FC<{
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}> = ({ label, name, value, onChange, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-800 outline-none appearance-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

/** Phone number input with country-code selector */
const PhoneField: React.FC<{
  label: string;
  required?: boolean;
  code: string;
  body: string;
  onCodeChange: (c: string) => void;
  onBodyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  maxLen: number;
}> = ({
  label,
  required,
  code,
  body,
  onCodeChange,
  onBodyChange,
  error,
  maxLen,
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div
      className={`flex rounded-lg border overflow-hidden transition-all ${
        error
          ? "border-rose-400 bg-rose-50 focus-within:ring-2 focus-within:ring-rose-200"
          : "border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"
      }`}
    >
      <div className="relative flex items-center shrink-0 bg-slate-50 border-r border-slate-200">
        <select
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="appearance-none bg-transparent pl-2.5 pr-6 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
        >
          <option value="+65">🇸🇬 +65</option>
          <option value="+60">🇲🇾 +60</option>
        </select>
        <ChevronDown className="absolute right-1 w-3 h-3 text-slate-400 pointer-events-none" />
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={body}
        onChange={onBodyChange}
        maxLength={maxLen}
        placeholder={code === "+65" ? "e.g. 81234567" : "e.g. 0123456789"}
        className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder-slate-300 min-w-0"
      />
    </div>
    {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────── */
export default function StaffsPage() {
  const [staffs, setStaffs] = useState<SystemStaff[]>([]);
  const [genderOptions, setGenderOptions] = useState<
    { value: number; label: string }[]
  >([]);
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
  const [showPassword, setShowPassword] = useState(false);

  const [phoneCode, setPhoneCode] = useState("+65");
  const [phoneBody, setPhoneBody] = useState("");
  const [altPhoneCode, setAltPhoneCode] = useState("+65");
  const [altPhoneBody, setAltPhoneBody] = useState("");

  const [viewData, setViewData] = useState<SystemStaff | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Utilities ── */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    // 修改为 2000 毫秒 (2秒) 后自动消失
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const getProfileImageSrc = (
    url: string | null | undefined,
    fallbackName: string,
  ) => {
    if (!url)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=e2e8f0&color=475569&bold=true&size=128`;
    if (url.startsWith("data:image/")) return url;
    if (url.startsWith("/user-image/"))
      return `${API_BASE_URL.replace("/api", "")}${url}`;
    return url;
  };

  const getRoleInfo = (r: number): { name: string; color: BadgeVariant } => {
    if (r === 0) return { name: "Super Admin", color: "danger" };
    if (r === 1) return { name: "Admin", color: "info" };
    return { name: "Unknown", color: "secondary" };
  };

  const phoneMaxLen = (code: string) => (code === "+65" ? 8 : 10);

  /* ── Data ── */
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [uRes, gRes] = await Promise.all([
        fetch(`${API_BASE_URL}/staff`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
      ]);
      if (uRes.ok) {
        const j = await uRes.json();
        setStaffs(j.data || []);
      }
      if (gRes.ok) {
        const j = await gRes.json();
        setGenderOptions(
          (j.data || []).map((g: any) => ({ value: g.id, label: g.name })),
        );
      }
    } catch {
      showToast("error", "Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  /* ── Filter & paginate ── */
  const filteredData = useMemo(
    () =>
      staffs.filter((s) => {
        const q = searchTerm.toLowerCase();
        return (
          (s.fullName?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            (s.phoneNumber ?? "").includes(q)) &&
          (roleFilter === "all" || s.role.toString() === roleFilter) &&
          (statusFilter === "all" || s.status?.toString() === statusFilter)
        );
      }),
    [staffs, searchTerm, roleFilter, statusFilter],
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [filteredData, currentPage],
  );

  /* ── Modal helpers ── */
  const resetPhone = () => {
    setPhoneCode("+65");
    setPhoneBody("");
    setAltPhoneCode("+65");
    setAltPhoneBody("");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setErrors({});
    setShowPassword(false);
    resetPhone();
    setFormData({
      fullName: "",
      email: "",
      password: "",
      genderId: genderOptions[0]?.value ?? "",
      profileImageUrl: "",
      dateOfBirth: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      role: 1,
      status: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: SystemStaff) => {
    setModalMode("edit");
    setErrors({});
    setShowPassword(false);
    setFormData({
      id: s.id,
      fullName: s.fullName || "",
      email: s.email || "",
      password: "",
      genderId: s.genderId || genderOptions[0]?.value || "",
      profileImageUrl: s.profileImageUrl || "",
      dateOfBirth: s.dateOfBirth || "",
      addressLine1: s.addressLine1 || "",
      addressLine2: s.addressLine2 || "",
      city: s.city || "",
      state: s.state || "",
      postalCode: s.postalCode || "",
      country: s.country || "",
      role: s.role,
      status: s.status ?? 1,
    });
    if (s.phoneNumber?.startsWith("+60")) {
      setPhoneCode("+60");
      setPhoneBody(s.phoneNumber.slice(3));
    } else {
      setPhoneCode("+65");
      setPhoneBody((s.phoneNumber || "").replace("+65", ""));
    }
    if (s.phoneNumberAlt?.startsWith("+60")) {
      setAltPhoneCode("+60");
      setAltPhoneBody(s.phoneNumberAlt.slice(3));
    } else {
      setAltPhoneCode("+65");
      setAltPhoneBody((s.phoneNumberAlt || "").replace("+65", ""));
    }
    setIsModalOpen(true);
  };

  /* ── Input handlers ── */
  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const finalValue =
      name === "postalCode" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setFormData((p: any) => ({ ...p, [name]: finalValue }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  // Typed wrappers so they match React.ChangeEvent<HTMLInputElement> exactly
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleInput(e);
  const handleSelectInput = (e: React.ChangeEvent<HTMLSelectElement>) =>
    handleInput(e);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneBody(
      e.target.value.replace(/\D/g, "").slice(0, phoneMaxLen(phoneCode)),
    );
    if (errors.phoneNumber) setErrors((p) => ({ ...p, phoneNumber: "" }));
  };

  const handleAltPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAltPhoneBody(
      e.target.value.replace(/\D/g, "").slice(0, phoneMaxLen(altPhoneCode)),
    );
    if (errors.phoneNumberAlt) setErrors((p) => ({ ...p, phoneNumberAlt: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please upload a valid image file (PNG or JPG).");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      showToast("error", "Image size cannot exceed 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFormData((p: any) => ({
        ...p,
        profileImageUrl: reader.result as string,
      }));
    reader.readAsDataURL(file);
  };

  /* ── Date auto-format on blur ── */
  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length === 8) {
      setFormData((p: any) => ({
        ...p,
        dateOfBirth: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
      }));
    }
  };

  /* ── Validation + save ── */
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName?.trim())
      newErrors.fullName = "Full name is required.";
    if (!formData.email?.trim()) newErrors.email = "Email address is required.";
    else if (!emailRx.test(formData.email))
      newErrors.email = "Please enter a valid email address.";
    if (modalMode === "create" && !formData.password)
      newErrors.password = "Password is required.";

    if (!phoneBody.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (phoneCode === "+65" && phoneBody.length !== 8) {
      newErrors.phoneNumber = "Singapore number must be exactly 8 digits.";
    } else if (
      phoneCode === "+60" &&
      (phoneBody.length < 9 || phoneBody.length > 10)
    ) {
      newErrors.phoneNumber = "Malaysia number must be 9–10 digits.";
    }

    if (altPhoneBody.trim()) {
      if (altPhoneCode === "+65" && altPhoneBody.length !== 8) {
        newErrors.phoneNumberAlt = "Singapore number must be exactly 8 digits.";
      } else if (
        altPhoneCode === "+60" &&
        (altPhoneBody.length < 9 || altPhoneBody.length > 10)
      ) {
        newErrors.phoneNumberAlt = "Malaysia number must be 9–10 digits.";
      }
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload: any = {
        ...formData,
        genderId: Number(formData.genderId),
        role: Number(formData.role),
        status: Number(formData.status),
        phoneNumber: phoneBody ? `${phoneCode}${phoneBody}` : null,
        phoneNumberAlt: altPhoneBody ? `${altPhoneCode}${altPhoneBody}` : null,
      };
      if (modalMode === "edit" && !formData.password) delete payload.password;

      const url =
        modalMode === "create"
          ? `${API_BASE_URL}/staff`
          : `${API_BASE_URL}/staff/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(
          "success",
          modalMode === "create"
            ? "Staff member created successfully!"
            : "Profile updated successfully!",
        );
        fetchData();
      } else {
        const err = await res.json();
        showToast(
          "error",
          err.message || "Operation failed. Please try again.",
        );
      }
    } catch {
      showToast("error", "Network error. Please check your connection.");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${userToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast("success", "Staff member deleted successfully.");
        fetchData();
      } else showToast("error", "Failed to delete. Please try again.");
    } catch {
      showToast("error", "Network error.");
    } finally {
      setIsDeleteAlertOpen(false);
      setUserToDelete(null);
    }
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen font-sans antialiased text-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Staff Directory
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage hospital Super Admins and Admins.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>

        {/* ── Search & filters ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder-slate-400"
            />
          </div>
          <div className="flex gap-3">
            {(
              [
                {
                  val: roleFilter,
                  set: setRoleFilter,
                  opts: [
                    ["all", "All Roles"],
                    ["0", "Super Admin"],
                    ["1", "Admin"],
                  ],
                },
                {
                  val: statusFilter,
                  set: setStatusFilter,
                  opts: [
                    ["all", "All Status"],
                    ["1", "Active"],
                    ["0", "Inactive"],
                  ],
                },
              ] as const
            ).map((f, i) => (
              <div key={i} className="relative flex-1 sm:flex-none">
                <select
                  value={f.val}
                  onChange={(e) =>
                    (f.set as (v: string) => void)(e.target.value)
                  }
                  className="w-full sm:w-36 appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl outline-none bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer font-medium text-slate-700"
                >
                  {f.opts.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Data table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Staff Member",
                    "Email",
                    "Phone",
                    "Role",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 5 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-slate-400 text-sm"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-slate-400 text-sm"
                    >
                      No results found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProfileImageSrc(
                              s.profileImageUrl,
                              s.fullName,
                            )}
                            alt={s.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-snug">
                              {s.fullName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {s.gender?.name || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {s.email}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {s.phoneNumber || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={getRoleInfo(s.role).color}>
                          {getRoleInfo(s.role).name}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={s.status === 1 ? "success" : "danger"}>
                          {s.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setViewData(s);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(s.id);
                              setIsDeleteAlertOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            ADD / EDIT MODAL
        ══════════════════════════════════════════════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div
              className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200 my-auto"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-white rounded-t-2xl border-b border-slate-200 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {modalMode === "create"
                      ? "Add New Staff Member"
                      : "Edit Staff Profile"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fields marked with <span className="text-rose-500">*</span>{" "}
                    are required.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Autofill traps */}
                <input
                  type="text"
                  name="_dummy_user"
                  style={{ display: "none" }}
                  readOnly
                />
                <input
                  type="password"
                  name="_dummy_pass"
                  style={{ display: "none" }}
                  readOnly
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* ── LEFT COLUMN ── */}
                  <div className="space-y-4">
                    {/* Profile photo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                      <div
                        className="relative group cursor-pointer shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <img
                          src={getProfileImageSrc(
                            formData.profileImageUrl,
                            formData.fullName || "Staff",
                          )}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/png,image/jpeg"
                          onChange={handleFileChange}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Profile Photo
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Click to upload. PNG or JPG, max 1 MB.
                        </p>
                      </div>
                    </div>

                    {/* Account & Security */}
                    <FormSection
                      icon={<User className="w-3.5 h-3.5" />}
                      title="Account & Security"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <LabelInput
                          label="Full Name"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleTextInput}
                          error={errors.fullName}
                          placeholder="e.g. John Smith"
                        />
                        <LabelInput
                          label="Email Address"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleTextInput}
                          error={errors.email}
                          placeholder="e.g. john@example.com"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Password
                          {modalMode === "create" && (
                            <span className="text-rose-500 ml-0.5">*</span>
                          )}
                          {modalMode === "edit" && (
                            <span className="ml-1 text-slate-400 font-normal">
                              (leave blank to keep current)
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleTextInput}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none transition-all ${
                              errors.password
                                ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs text-rose-600 font-medium">
                            {errors.password}
                          </p>
                        )}
                      </div>
                    </FormSection>

                    {/* Contact Numbers */}
                    <FormSection
                      icon={<Phone className="w-3.5 h-3.5" />}
                      title="Contact Numbers"
                    >
                      <PhoneField
                        label="Primary Phone"
                        required
                        code={phoneCode}
                        body={phoneBody}
                        onCodeChange={(c) => {
                          setPhoneCode(c);
                          setPhoneBody("");
                        }}
                        onBodyChange={handlePhoneChange}
                        error={errors.phoneNumber}
                        maxLen={phoneMaxLen(phoneCode)}
                      />
                      <PhoneField
                        label="Alternate Phone"
                        code={altPhoneCode}
                        body={altPhoneBody}
                        onCodeChange={(c) => {
                          setAltPhoneCode(c);
                          setAltPhoneBody("");
                        }}
                        onBodyChange={handleAltPhoneChange}
                        error={errors.phoneNumberAlt}
                        maxLen={phoneMaxLen(altPhoneCode)}
                      />
                    </FormSection>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div className="space-y-4">
                    {/* Role & Status */}
                    <FormSection
                      icon={<Shield className="w-3.5 h-3.5" />}
                      title="Role & Status"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <LabelSelect
                          label="Gender"
                          name="genderId"
                          value={formData.genderId}
                          onChange={handleSelectInput}
                        >
                          {genderOptions.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </LabelSelect>
                        <LabelSelect
                          label="Role"
                          name="role"
                          value={formData.role}
                          onChange={handleSelectInput}
                        >
                          <option value={0}>Super Admin</option>
                          <option value={1}>Admin</option>
                        </LabelSelect>
                        <LabelSelect
                          label="Status"
                          name="status"
                          value={formData.status}
                          onChange={handleSelectInput}
                        >
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </LabelSelect>
                      </div>
                    </FormSection>

                    {/* Address & Birth Info */}
                    <FormSection
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      title="Address & Birth Info"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Date of Birth — 完美强制英文版 + 格式化为 DD-M-YYYY */}
                        <div className="flex flex-col">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Date of Birth
                          </label>
                          <div className="relative flex items-center rounded-lg border border-slate-200 bg-white transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                            {/* 1. 铺满整格但完全透明的原生输入框 (负责触发日历选择，底层保持标准 DD-MM-YYYY) */}
                            <input
                              type="date"
                              name="dateOfBirth"
                              value={formData.dateOfBirth || ""}
                              onChange={handleTextInput}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 
                 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              onClick={(e) => {
                                try {
                                  (e.target as any).showPicker();
                                } catch {}
                              }}
                            />

                            {/* 2. 自定义视觉呈现层 (自动格式化为 30-5-2026) */}
                            <div className="w-full flex items-center justify-between px-3 py-2 text-sm pointer-events-none">
                              <span
                                className={
                                  formData.dateOfBirth
                                    ? "text-slate-800 font-semibold"
                                    : "text-slate-300 font-medium"
                                }
                              >
                                {formData.dateOfBirth
                                  ? (() => {
                                      const parts =
                                        formData.dateOfBirth.split("-");
                                      if (parts.length !== 3)
                                        return formData.dateOfBirth;

                                      const day = parseInt(parts[2], 10);
                                      const month = parseInt(parts[1], 10);
                                      const year = parts[0];

                                      return `${day}-${month}-${year}`; // 格式化输出为例如 "30-5-2026"
                                    })()
                                  : "DD-MM-YYYY"}
                              </span>
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                          </div>
                        </div>

                        <LabelInput
                          label="Address Line 1"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleTextInput}
                          placeholder="Street address"
                        />
                        <LabelInput
                          label="Address Line 2"
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleTextInput}
                          placeholder="Unit, floor, etc."
                        />
                        <LabelInput
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleTextInput}
                          placeholder="e.g. Johor Bahru"
                        />
                        <LabelInput
                          label="State"
                          name="state"
                          value={formData.state}
                          onChange={handleTextInput}
                          placeholder="e.g. Johor"
                        />
                        <LabelInput
                          label="Postal Code"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleTextInput}
                          placeholder="6-digit code"
                          maxLength={6}
                        />
                        <LabelInput
                          label="Country"
                          name="country"
                          value={formData.country}
                          onChange={handleTextInput}
                          placeholder="e.g. Malaysia"
                        />
                      </div>
                    </FormSection>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 bg-white rounded-b-2xl border-t border-slate-200 shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  {modalMode === "create" ? "Create Staff" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            VIEW MODAL (优化排版版)
        ══════════════════════════════════════════════════════ */}
        {isViewModalOpen && viewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div
              className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200 my-auto"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white rounded-t-2xl border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Staff Profile
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Detailed view of staff information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-6 p-5 sm:p-6">
                  {/* Left: Avatar & Detailed Info Stack */}
                  <div className="md:w-80 shrink-0 h-max bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col items-center">
                    <div className="relative mb-6">
                      <img
                        src={getProfileImageSrc(
                          viewData.profileImageUrl,
                          viewData.fullName,
                        )}
                        alt={viewData.fullName}
                        className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-sm"
                      />
                      <div
                        className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm ${viewData.status === 1 ? "bg-emerald-500" : "bg-rose-500"}`}
                      ></div>
                    </div>

                    {/* Information Stack */}
                    <div className="w-full">
                      <div className="flex justify-between items-start py-2.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          Name :
                        </span>
                        <span className="text-sm font-bold text-slate-900 text-right">
                          {viewData.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between items-start py-2.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          Email :
                        </span>
                        <span className="text-sm font-bold text-slate-900 text-right break-all max-w-[160px]">
                          {viewData.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Phone :
                        </span>
                        <span className="text-sm font-bold text-slate-900 text-right">
                          {viewData.phoneNumber || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          D.O.B :
                        </span>
                        <span className="text-sm font-bold text-slate-900 text-right">
                          {(() => {
                            if (!viewData.dateOfBirth) return "—";
                            const parts = viewData.dateOfBirth.split("-"); // 分割 [年, 月, 日]
                            if (parts.length !== 3) return viewData.dateOfBirth;

                            // parseInt 会自动去除月份和日期前多余的 "0" (例如 "05" 变成 "5")
                            const day = parseInt(parts[2], 10);
                            const month = parseInt(parts[1], 10);
                            const year = parts[0];

                            return `${day}-${month}-${year}`; // 组合成 30-5-2026
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Role :
                        </span>
                        <Badge variant={getRoleInfo(viewData.role).color}>
                          {getRoleInfo(viewData.role).name}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Status :
                        </span>
                        <Badge
                          variant={viewData.status === 1 ? "success" : "danger"}
                        >
                          {viewData.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sectioned Cards Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Additional Info Section (Since core info is on the left) */}
                    <ViewSection
                      icon={<User className="w-4 h-4" />}
                      title="Additional Information"
                    >
                      <InfoCell label="Gender" value={viewData.gender?.name} />
                      <InfoCell
                        label="Alt. Phone"
                        value={viewData.phoneNumberAlt}
                      />
                      <InfoCell
                        label="Member Since"
                        value={new Date(viewData.createdAt).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      />
                    </ViewSection>

                    {/* Address Section */}
                    <ViewSection
                      icon={<MapPin className="w-4 h-4" />}
                      title="Correspondence Address"
                    >
                      <InfoCell
                        label="Address Line 1"
                        value={viewData.addressLine1}
                        wide
                      />
                      <InfoCell
                        label="Address Line 2"
                        value={viewData.addressLine2}
                        wide
                      />
                      <InfoCell label="City" value={viewData.city} />
                      <InfoCell label="State" value={viewData.state} />
                      <InfoCell
                        label="Postal Code"
                        value={viewData.postalCode}
                      />
                      <InfoCell label="Country" value={viewData.country} />
                    </ViewSection>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl shrink-0">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all focus:ring-2 focus:ring-slate-200 outline-none"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete confirmation ── */}
        {isDeleteAlertOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Delete Staff Member?
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                This action cannot be undone. The account will be permanently
                removed from the system.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteAlertOpen(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
