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
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Camera,
  Calendar,
  Stethoscope,
  Briefcase,
  Award,
  AlertCircle,
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface SystemDoctor {
  id: number;
  userId: number;
  licenseNumber: string | null;
  specialtyId: number | null;
  positionId: number | null;
  departmentId: number | null;
  officeLocationId: number | null;
  yearsOfExperience: number | null;
  qualifications: string | null;
  biography: string | null;
  address: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  officePhone: string | null;
  dateJoin: string | null;
  dateLeft: string | null;
  remark: string | null;
  status: number | null; 
  dateOfBirth: string | null;
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
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    dateOfBirth?: string;
  };
}

interface DropdownOption {
  value: number;
  label: string;
}

type BadgeVariant = "success" | "danger" | "info" | "warning" | "secondary";

/* ─────────────────────────────────────────────────────────
   EXTRACTORS & HELPERS
───────────────────────────────────────────────────────── */
const getBackendMessage = (result: any): string | null => {
  if (!result) return null;
  const msg = result.message ?? result.Message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return null;
};

// Converts everything to lowercase to guarantee exact matches with JSX variable names
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

/* ─────────────────────────────────────────────────────────
   PURE UI COMPONENTS
───────────────────────────────────────────────────────── */

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
    <div className="text-sm font-semibold text-slate-900 break-words leading-relaxed">
      {value || (
        <span className="text-slate-300 font-medium italic">
          未提供 / Not provided
        </span>
      )}
    </div>
  </div>
);

const VisualDatePicker: React.FC<{
  label: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}> = ({ label, name, required, value, onChange, error }) => (
  <div className="flex flex-col">
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div
      className={`relative flex items-center rounded-lg border transition-all ${
        error
          ? "border-rose-400 bg-rose-50 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200"
          : "border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"
      }`}
    >
      <input
        type="date"
        name={name}
        value={value || ""}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 
                   [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        onClick={(e) => {
          try {
            (e.target as any).showPicker();
          } catch {}
        }}
      />

      <div className="w-full flex items-center justify-between px-3 py-2 text-sm pointer-events-none">
        <span
          className={
            value ? `${error ? "text-rose-900" : "text-slate-900"} font-semibold` : "text-slate-300 font-medium"
          }
        >
          {value
            ? (() => {
                const parts = value.split("-");
                if (parts.length !== 3) return value;
                return `${parseInt(parts[2], 10)}-${parseInt(parts[1], 10)}-${parts[0]}`;
              })()
            : "DD-MM-YYYY"}
        </span>
        <Calendar className={`w-4 h-4 shrink-0 ${error ? "text-rose-400" : "text-slate-400"}`} />
      </div>
    </div>
    {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────── */
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
  const [altPhoneCode, setAltPhoneCode] = useState("+65");
  const [altPhoneBody, setAltPhoneBody] = useState("");

  const [viewData, setViewData] = useState<SystemDoctor | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
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
    if (url.startsWith("/user-image/")) {
      const origin = API_BASE_URL.replace("/api", "");
      return `${origin}${url}`;
    }
    return url;
  };

  const formatEngDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const year = parts[0];
    return `${day}-${month}-${year}`;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [
        doctorsRes,
        gendersRes,
        deptsRes,
        specialtiesRes,
        locationsRes,
        positionsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/doctors`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Department`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Specialty`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/OfficeLocation`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/Position`, { headers: getAuthHeaders() }),
      ]);

      if (doctorsRes.ok) {
        const json = await doctorsRes.json();
        setDoctors(json.data || []);
      }
      if (gendersRes.ok) {
        const json = await gendersRes.json();
        setGenderOptions(
          (json.data || []).map((g: any) => ({ value: g.id, label: g.name })),
        );
      }
      if (deptsRes.ok) {
        const deptsJson = await deptsRes.json();
        setDepartmentOptions(
          deptsJson
            .filter((d: any) => d.status === 1)
            .map((d: any) => ({ value: d.id, label: d.name })),
        );
      }
      if (specialtiesRes.ok) {
        const specialtiesJson = await specialtiesRes.json();
        setSpecialtyOptions(
          (specialtiesJson.data || [])
            .filter((s: any) => s.status === 1)
            .map((s: any) => ({ value: s.id, label: s.name })),
        );
      }
      if (positionsRes.ok) {
        const positionsJson = await positionsRes.json();
        setTitleOptions(
          (positionsJson.data || [])
            .filter((t: any) => t.status === 1)
            .map((t: any) => ({ value: t.id, label: t.name })),
        );
      }
      if (locationsRes.ok) {
        const locationsJson = await locationsRes.json();
        setOfficeLocationOptions(
          (locationsJson.data || [])
            .filter((l: any) => l.status === 1)
            .map((l: any) => ({ value: l.id, label: l.name })),
        );
      }
    } catch {
      showToast("error", "Failed to load doctor database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    departmentFilter,
    statusFilter,
    specialtyFilter,
    titleFilter,
    officeLocationFilter,
  ]);

  const getDepartmentLabel = (id: number | null) =>
    id ? departmentOptions.find((d) => d.value === id)?.label || "N/A" : "N/A";
  const getSpecialtyLabel = (id: number | null) =>
    id ? specialtyOptions.find((s) => s.value === id)?.label || "N/A" : "N/A";
  const getTitleLabel = (id: number | null) =>
    id ? titleOptions.find((t) => t.value === id)?.label || "N/A" : "N/A";
  const getOfficeLocationLabel = (id: number | null) =>
    id
      ? officeLocationOptions.find((l) => l.value === id)?.label || "N/A"
      : "N/A";
  const getGenderLabel = (id: number | null) =>
    id ? genderOptions.find((g) => g.value === id)?.label || "N/A" : "N/A";

  const getDoctorStatusLabel = (statusCode: number | null) => {
    switch (statusCode) {
      case 0:
        return { label: "Active / Working", variant: "success" };
      case 1:
        return { label: "Suspended", variant: "danger" };
      case 2:
        return { label: "On Leave", variant: "warning" };
      case 3:
        return { label: "Terminated", variant: "secondary" };
      default:
        return { label: "Active / Working", variant: "success" };
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // 核心防御点：阻截掉因为手工删除导致的 user 被悬空的孤立数据
      if (!doc.user) return false; 

      const matchSearch =
        doc.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSpecialtyLabel(doc.specialtyId)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchDept =
        departmentFilter === "all" ||
        doc.departmentId?.toString() === departmentFilter;
      const matchStatus =
        statusFilter === "all" || doc.user.status.toString() === statusFilter;
      const matchSpecialty =
        specialtyFilter === "all" ||
        doc.specialtyId?.toString() === specialtyFilter;
      const matchTitle =
        titleFilter === "all" || doc.positionId?.toString() === titleFilter;
      const matchLocation =
        officeLocationFilter === "all" ||
        doc.officeLocationId?.toString() === officeLocationFilter;

      return (
        matchSearch &&
        matchDept &&
        matchStatus &&
        matchSpecialty &&
        matchTitle &&
        matchLocation
      );
    });
  }, [
    doctors,
    searchTerm,
    departmentFilter,
    statusFilter,
    specialtyFilter,
    titleFilter,
    officeLocationFilter,
    specialtyOptions,
    departmentOptions,
    titleOptions,
    officeLocationOptions,
  ]);

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
      fullName: "",
      email: "",
      password: "",
      genderId: genderOptions[0]?.value ?? "",
      profileImageUrl: "",
      phoneNumberAlt: "",
      userStatus: 1, 
      address: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      licenseNumber: "",
      specialtyId: specialtyOptions[0]?.value ?? "",
      positionId: titleOptions[0]?.value ?? "",
      departmentId: departmentOptions[0]?.value ?? "",
      dateOfBirth: "",
      officeLocationId: "",
      yearsOfExperience: 0,
      officePhone: "",
      dateJoin: "",
      dateLeft: "",
      doctorStatus: 0, 
      qualifications: "",
      biography: "",
      remark: "",
    });
    setPhoneCode("+65");
    setPhoneBody("");
    setAltPhoneCode("+65");
    setAltPhoneBody("");
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
      address: doc.user.addressLine1 || "",
      addressLine2: doc.user.addressLine2 || "",
      city: doc.user.city || "",
      state: doc.user.state || "",
      postalCode: doc.user.postalCode || "",
      country: doc.user.country || "",
      licenseNumber: doc.licenseNumber || "",
      specialtyId: doc.specialtyId || "",
      positionId: doc.positionId || "",
      departmentId: doc.departmentId || "",
      dateOfBirth: doc.user.dateOfBirth || "",
      officeLocationId: doc.officeLocationId || "",
      yearsOfExperience: doc.yearsOfExperience || 0,
      officePhone: doc.officePhone || "",
      dateJoin: doc.dateJoin || "",
      dateLeft: doc.dateLeft || "",
      doctorStatus: doc.status ?? 0,
      qualifications: doc.qualifications || "",
      biography: doc.biography || "",
      remark: doc.remark || "",
    });

    if (doc.user.phoneNumber?.startsWith("+60")) {
      setPhoneCode("+60");
      setPhoneBody(doc.user.phoneNumber.replace("+60", ""));
    } else {
      setPhoneCode("+65");
      setPhoneBody((doc.user.phoneNumber || "").replace("+65", ""));
    }

    if (doc.user.phoneNumberAlt?.startsWith("+60")) {
      setAltPhoneCode("+60");
      setAltPhoneBody(doc.user.phoneNumberAlt.replace("+60", ""));
    } else {
      setAltPhoneCode("+65");
      setAltPhoneBody((doc.user.phoneNumberAlt || "").replace("+65", ""));
    }

    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "postalCode") {
      const numericVal = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev: any) => ({ ...prev, [name]: numericVal }));
      if (errors.postalcode) setErrors((prev) => ({ ...prev, postalcode: "" }));
      return;
    }
    if (name === "officePhone") {
      const numericVal = value.replace(/\D/g, "");
      setFormData((prev: any) => ({ ...prev, [name]: numericVal }));
      if (errors.officephone) setErrors((prev) => ({ ...prev, officephone: "" }));
      return;
    }
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    const errorKey = name.toLowerCase();
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: "" }));
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneBody(e.target.value.replace(/\D/g, ""));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleAltPhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAltPhoneBody(e.target.value.replace(/\D/g, ""));
    if (errors.phonenumberalt) setErrors((prev) => ({ ...prev, phonenumberalt: "" }));
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
      setFormData((prev: any) => ({
        ...prev,
        profileImageUrl: reader.result as string,
      }));
      showToast("success", "Avatar uploaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName?.trim())
      newErrors.fullname = "Please enter full name.";
    if (!formData.email?.trim() || !emailRegex.test(formData.email))
      newErrors.email = "Please enter a valid email address.";

    if (modalMode === "create" && !formData.password) {
      newErrors.password = "Password is required.";
    }

    if (!phoneBody) {
      newErrors.phone = "Please enter phone number.";
    } else if (phoneCode === "+65" && phoneBody.length !== 8) {
      newErrors.phone = "Singapore number must be exactly 8 digits.";
    } else if (
      phoneCode === "+60" &&
      (phoneBody.length < 9 || phoneBody.length > 10)
    ) {
      newErrors.phone = "Malaysia number must be 9–10 digits.";
    }

    if (altPhoneBody) {
      if (altPhoneCode === "+65" && altPhoneBody.length !== 8) {
        newErrors.phonenumberalt = "Singapore alternate number must be exactly 8 digits.";
      } else if (
        altPhoneCode === "+60" &&
        (altPhoneBody.length < 9 || altPhoneBody.length > 10)
      ) {
        newErrors.phonenumberalt = "Malaysia alternate number must be 9–10 digits.";
      }
    }

    if (formData.postalCode && !/^\d{5,6}$/.test(formData.postalCode)) {
      newErrors.postalcode = "Postal code must be exactly 5 or 6 digits.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setCurrentStep(2);
  };

  const handleSave = async () => {
    setErrors({});
    setToast((t) => ({ ...t, show: false }));

    try {
      const payload = {
        ...formData,
        phone: `${phoneCode}${phoneBody}`,
        phoneNumberAlt: altPhoneBody ? `${altPhoneCode}${altPhoneBody}` : null,
        genderId: Number(formData.genderId),
        departmentId: formData.departmentId
          ? Number(formData.departmentId)
          : null,
        specialtyId: formData.specialtyId ? Number(formData.specialtyId) : null,
        positionId: formData.positionId ? Number(formData.positionId) : null,
        officeLocationId: formData.officeLocationId
          ? Number(formData.officeLocationId)
          : null,
        yearsOfExperience: formData.yearsOfExperience
          ? Number(formData.yearsOfExperience)
          : null,
        userStatus: Number(formData.userStatus),
        doctorStatus:
          formData.doctorStatus !== undefined
            ? Number(formData.doctorStatus)
            : null,
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
        remark: formData.remark || null,
      };

      if (modalMode === "edit" && !formData.password) delete payload.password;

      const url =
        modalMode === "create"
          ? `${API_BASE_URL}/doctors`
          : `${API_BASE_URL}/doctors/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      const isSuccess = result?.success === true || result?.Success === true;

      if (res.ok && isSuccess) {
        setIsModalOpen(false);
        showToast(
          "success",
          modalMode === "create"
            ? "Doctor successfully created!"
            : "Doctor updated successfully!",
        );
        fetchData();
      } else {
        const fields = getFieldErrors(result);
        if (Object.keys(fields).length > 0) {
          setErrors(fields);
          
          const hasStep1Errors = Object.keys(fields).some(key =>
            ["fullname", "email", "password", "phone", "genderid", "phonenumberalt", "postalcode"].includes(key)
          );

          if (hasStep1Errors) {
            setCurrentStep(1);
            showToast(
              "error",
              "Verification failed. Please check the highlights on Step 1.",
            );
          } else {
            showToast(
              "error",
              "Verification failed. Please check the highlights on Step 2.",
            );
          }
        } else {
          showToast("error", getBackendMessage(result) || "Failed to save details.");
        }
      }
    } catch {
      showToast("error", "A network error occurred.");
    }
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const isSuccess = result?.success === true || result?.Success === true;

      if (res.ok && isSuccess) {
        showToast("error", getBackendMessage(result) || "Doctor deleted successfully.");
        fetchData();
      } else {
        showToast("error", getBackendMessage(result) || "Delete failed.");
      }
    } catch {
      showToast("error", "Network error occurred.");
    } finally {
      setIsDeleteAlertOpen(false);
      setDoctorToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-6 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative font-sans antialiased text-slate-900">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Doctor Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Manage hospital doctors and their professional profiles.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4.5 h-4.5" /> Add New Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-[25%]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 font-semibold"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full xl:w-auto">
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((dep) => (
                <option key={dep.value} value={dep.value}>
                  {dep.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="all">All Specialties</option>
              {specialtyOptions.map((spec) => (
                <option key={spec.value} value={spec.value}>
                  {spec.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            >
              <option value="all">All Titles</option>
              {titleOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              value={officeLocationFilter}
              onChange={(e) => setOfficeLocationFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {officeLocationOptions.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
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
          <div className="p-12 text-center text-slate-400 font-medium">
            Loading doctor database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Office Number
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Office Location
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDoctors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-12 text-center text-slate-400 font-medium"
                    >
                      No doctors found.
                    </td>
                  </tr>
                ) : (
                  paginatedDoctors.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {doc.user?.fullName || "Orphaned Account"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-semibold">
                        {doc.user?.email || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                        {doc.user?.phoneNumber || "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                        {doc.officePhone || "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                        {getDepartmentLabel(doc.departmentId)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                        {getSpecialtyLabel(doc.specialtyId)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                        {getOfficeLocationLabel(doc.officeLocationId)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setViewData(doc);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(doc)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDoctorToDelete(doc.id);
                              setIsDeleteAlertOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
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
                <h2 className="text-lg font-bold text-slate-900">
                  {modalMode === "create"
                    ? "Register New Doctor"
                    : "Edit Doctor Profile"}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Step {currentStep} of 2:{" "}
                  {currentStep === 1
                    ? "User Account Details"
                    : "Professional Profile"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/20 space-y-6">
              
              <div className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <input type="text" name="fake-autofill-username" autoComplete="username" tabIndex={-1} />
                <input type="password" name="fake-autofill-password" autoComplete="current-password" tabIndex={-1} />
              </div>

              {currentStep === 1 ? (
                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img
                        src={getProfileImageSrc(
                          formData.profileImageUrl,
                          formData.fullName || "Doctor",
                        )}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/10 shadow-sm"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm font-bold text-slate-850">
                        Avatar Image
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">
                        Click on the image to upload. Supported formats: JPG,
                        PNG. Limit: 1MB.
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" /> Account Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Full Name *
                        </label>
                        <input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          autoComplete="new-password"
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 bg-white ${
                            errors.fullname
                              ? "bg-rose-50 border-rose-300 text-rose-900"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                        {errors.fullname && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.fullname}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Email Address *
                        </label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          autoComplete="new-password"
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 bg-white ${
                            errors.email
                              ? "bg-rose-50 border-rose-300 text-rose-900"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                        {errors.email && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            autoComplete="new-password"
                            className={`w-full border rounded-xl p-2.5 pr-10 text-sm font-semibold outline-none transition-all text-slate-900 bg-white ${
                              errors.password
                                ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400"
                                : "border-slate-300 focus:border-emerald-500"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Gender
                        </label>
                        <select
                          name="genderId"
                          value={formData.genderId}
                          onChange={handleInputChange}
                          className={`w-full border bg-white rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900 ${
                            errors.genderid ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300"
                          }`}
                        >
                          {genderOptions.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.genderid && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.genderid}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Phone Number *
                        </label>
                        <div className={`flex border rounded-xl overflow-hidden transition-all bg-white ${
                          errors.phone
                            ? "border-rose-400 bg-rose-50 focus-within:ring-2 focus-within:ring-rose-200"
                            : "border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"
                        }`}>
                          <select
                            value={phoneCode}
                            onChange={(e) => setPhoneCode(e.target.value)}
                            className="bg-transparent pl-3 pr-2 text-sm font-bold text-slate-900 outline-none cursor-pointer border-r border-slate-200"
                          >
                            <option value="+65">🇸🇬 +65</option>
                            <option value="+60">🇲🇾 +60</option>
                          </select>
                          <input
                            name="phone"
                            value={phoneBody}
                            onChange={handlePhoneBodyChange}
                            maxLength={phoneCode === "+65" ? 8 : 10}
                            placeholder={phoneCode === "+65" ? "81234567" : "012345678"}
                            className="w-full bg-transparent p-2.5 text-sm font-semibold outline-none text-slate-900"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Alt Phone
                        </label>
                        <div className={`flex border rounded-xl overflow-hidden transition-all bg-white ${
                          errors.phonenumberalt
                            ? "border-rose-400 bg-rose-50 focus-within:ring-2 focus-within:ring-rose-200"
                            : "border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"
                        }`}>
                          <select
                            value={altPhoneCode}
                            onChange={(e) => setAltPhoneCode(e.target.value)}
                            className="bg-transparent pl-3 pr-2 text-sm font-bold text-slate-900 outline-none cursor-pointer border-r border-slate-200"
                          >
                            <option value="+65">🇸🇬 +65</option>
                            <option value="+60">🇲🇾 +60</option>
                          </select>
                          <input
                            name="phoneNumberAlt"
                            value={altPhoneBody}
                            onChange={handleAltPhoneBodyChange}
                            maxLength={altPhoneCode === "+65" ? 8 : 10}
                            placeholder={altPhoneCode === "+65" ? "81234567" : "012345678"}
                            className="w-full bg-transparent p-2.5 text-sm font-semibold outline-none text-slate-900"
                          />
                        </div>
                        {errors.phonenumberalt && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.phonenumberalt}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Account Status
                        </label>
                        <select
                          name="userStatus"
                          value={formData.userStatus}
                          onChange={handleInputChange}
                          className="w-full border border-slate-300 bg-white rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900"
                        >
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" /> Correspondence Address
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Address Line 1
                        </label>
                        <input
                          name="address"
                          value={formData.address || ""}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.address ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Address Line 2
                        </label>
                        <input
                          name="addressLine2"
                          value={formData.addressLine2 || ""}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.addressline2 ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          City
                        </label>
                        <input
                          name="city"
                          value={formData.city || ""}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.city ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          State
                        </label>
                        <input
                          name="state"
                          value={formData.state || ""}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.state ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Postal Code
                        </label>
                        <input
                          name="postalCode"
                          value={formData.postalCode || ""}
                          onChange={handleInputChange}
                          placeholder="6-digit code"
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.postalcode ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                        {errors.postalcode && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.postalcode}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Country
                        </label>
                        <input
                          name="country"
                          value={formData.country || ""}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.country ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" /> Hospital Association
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          License Number *
                        </label>
                        <input
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          autoComplete="new-password"
                          placeholder="e.g. M12345B"
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 bg-white ${
                            errors.licensenumber
                              ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                        {errors.licensenumber && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.licensenumber}
                          </p>
                        )}
                      </div>

                      <VisualDatePicker
                        label="Date of Birth *"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        error={errors.dateofbirth}
                      />

                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Department *
                        </label>
                        <select
                          name="departmentId"
                          value={formData.departmentId}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900 bg-white ${
                            errors.departmentid
                              ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        >
                          <option value="">Select Dept</option>
                          {departmentOptions.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.departmentid && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.departmentid}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Specialty *
                        </label>
                        <select
                          name="specialtyId"
                          value={formData.specialtyId}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900 bg-white ${
                            errors.specialtyid
                              ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        >
                          <option value="">Select Specialty</option>
                          {specialtyOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.specialtyid && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.specialtyid}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Professional Title *
                        </label>
                        <select
                          name="positionId"
                          value={formData.positionId}
                          onChange={handleInputChange}
                          className={`w-full border rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900 bg-white ${
                            errors.positionid
                              ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        >
                          <option value="">Select Title</option>
                          {titleOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.positionid && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.positionid}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Office Location
                        </label>
                        <select
                          name="officeLocationId"
                          value={formData.officeLocationId || ""}
                          onChange={handleInputChange}
                          className={`w-full border bg-white rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900 ${
                            errors.officelocationid ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300"
                          }`}
                        >
                          <option value="">Select Room</option>
                          {officeLocationOptions.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        {errors.officelocationid && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.officelocationid}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="yearsOfExperience"
                          value={formData.yearsOfExperience || 0}
                          onChange={handleInputChange}
                          className={`w-full border bg-white rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 ${
                            errors.yearsofexperience ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                        {errors.yearsofexperience && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.yearsofexperience}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Office Phone *
                        </label>
                        <input
                          name="officePhone"
                          value={formData.officePhone || ""}
                          onChange={handleInputChange}
                          placeholder="e.g. 62354412"
                          className={`w-full border rounded-xl p-2.5 text-sm font-semibold outline-none transition-all text-slate-900 bg-white ${
                            errors.officephone
                              ? "bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-400"
                              : "border-slate-300 focus:border-emerald-500"
                          }`}
                        />
                        {errors.officephone && (
                          <p className="text-rose-600 text-xs mt-1 font-semibold">
                            {errors.officephone}
                          </p>
                        )}
                      </div>

                      <VisualDatePicker
                        label="Date Join *"
                        name="dateJoin"
                        value={formData.dateJoin}
                        onChange={handleInputChange}
                        error={errors.datejoin}
                      />

                      <VisualDatePicker
                        label="Date Left"
                        name="dateLeft"
                        value={formData.dateLeft}
                        onChange={handleInputChange}
                        error={errors.dateleft}
                      />

                      <div className="relative">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">
                          Doctor Work Status
                        </label>
                        <select
                          name="doctorStatus"
                          value={formData.doctorStatus || 0}
                          onChange={handleInputChange}
                          className="w-full border border-slate-300 bg-white rounded-xl p-2.5 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-900"
                        >
                          <option value={0}>Active / Working</option>
                          <option value={1}>Suspended</option>
                          <option value={2}>On Leave</option>
                          <option value={3}>Terminated</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                      Academic Biography
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">
                        Qualifications
                      </label>
                      <textarea
                        name="qualifications"
                        value={formData.qualifications || ""}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full border bg-white rounded-xl p-2.5 text-sm font-semibold outline-none resize-none text-slate-900 focus:border-emerald-500 ${
                          errors.qualifications ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300"
                        }`}
                        placeholder="Medical qualifications..."
                      />
                      {errors.qualifications && (
                        <p className="text-rose-600 text-xs mt-1 font-semibold">
                          {errors.qualifications}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">
                        Biography
                      </label>
                      <textarea
                        name="biography"
                        value={formData.biography || ""}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full border bg-white rounded-xl p-2.5 text-sm font-semibold outline-none resize-none text-slate-900 focus:border-emerald-500 ${
                          errors.biography ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300"
                        }`}
                        placeholder="Short doctor biography..."
                      />
                      {errors.biography && (
                        <p className="text-rose-600 text-xs mt-1 font-semibold">
                          {errors.biography}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">
                        Remark
                      </label>
                      <textarea
                        name="remark"
                        value={formData.remark || ""}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all placeholder-slate-300 resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
                          errors.remark ? "bg-rose-50 border-rose-300 text-rose-900" : "border-slate-300"
                        }`}
                        placeholder="Enter any internal remarks or notes..."
                      />
                      {errors.remark && (
                        <p className="text-rose-600 text-xs mt-1 font-semibold">
                          {errors.remark}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex justify-between shrink-0">
              <div>
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      setCurrentStep(1);
                    }}
                    className="px-5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white hover:bg-slate-100 font-semibold text-slate-700"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white hover:bg-slate-100 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold"
                  >
                    Save Doctor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPLETE DETAIL MODAL */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-950">
                Doctor Profile Card
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50/50 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (1/3 Narrow) */}
                <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center">
                  <div className="relative mb-6">
                    <img
                      src={getProfileImageSrc(
                        viewData.user.profileImageUrl,
                        viewData.user.fullName,
                      )}
                      alt={viewData.user.fullName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-md"
                    />
                    <div
                      className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                        viewData.user.status === 1
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    ></div>
                  </div>

                  <div className="w-full space-y-2.5">
                    <div className="flex justify-between items-start py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Full Name :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {viewData.user.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Email :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right break-all max-w-[160px]">
                        {viewData.user.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Phone :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {viewData.user.phoneNumber || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Phone Alt :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {viewData.user.phoneNumberAlt || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Gender :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {getGenderLabel(viewData.user.genderId)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Role :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {viewData.user.role === 2 ? "Doctor" : "Other"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Account Status :
                      </span>
                      <Badge variant={viewData.user.status === 1 ? "success" : "danger"}>
                        {viewData.user.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Work Status :
                      </span>
                      <Badge variant={getDoctorStatusLabel(viewData.status).variant as any}>
                        {getDoctorStatusLabel(viewData.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        D.O.B :
                      </span>
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {formatEngDate(viewData.user.dateOfBirth)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column (2/3 Wide) */}
                <div className="md:col-span-8 space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <h4 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
                        Professional Details
                      </h4>
                    </div>
                    
                    <div className="p-5 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        <InfoCell label="Office Phone" value={viewData.officePhone} />
                        <InfoCell label="License Number" value={viewData.licenseNumber} />
                        <InfoCell label="Specialty" value={getSpecialtyLabel(viewData.specialtyId)} />
                        <InfoCell label="Professional Title" value={getTitleLabel(viewData.positionId)} />
                        <InfoCell label="Department" value={getDepartmentLabel(viewData.departmentId)} />
                        <InfoCell label="Office Location" value={getOfficeLocationLabel(viewData.officeLocationId)} />
                        <InfoCell label="Years of Experience" value={viewData.yearsOfExperience !== null ? `${viewData.yearsOfExperience} Years` : null} />
                        <InfoCell label="Date Join" value={formatEngDate(viewData.dateJoin)} />
                        <InfoCell label="Date Left" value={formatEngDate(viewData.dateLeft)} />
                      </div>

                      <div className="border-t border-slate-100 pt-5">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Correspondence Address
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                          <InfoCell label="Address Line 1" value={viewData.user.addressLine1} />
                          <InfoCell label="Address Line 2" value={viewData.user.addressLine2} />
                          <InfoCell label="City" value={viewData.user.city} />
                          <InfoCell label="State" value={viewData.user.state} />
                          <InfoCell label="Postal Code" value={viewData.user.postalCode} />
                          <InfoCell label="Country" value={viewData.user.country} />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5 space-y-5">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Qualifications
                          </p>
                          <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                            {viewData.qualifications || "—"}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Biography
                          </p>
                          <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                            {viewData.biography || "—"}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Remark
                          </p>
                          <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                            {viewData.remark || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-150 flex justify-end shrink-0 items-center">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 bg-white transition-all"
              >
                Close Profile
              </button>
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
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">
              Delete Doctor
            </h3>
            <p className="text-slate-500 text-xs font-semibold mb-5 leading-relaxed">
              Are you sure you want to permanently delete this doctor profile
              and their associated system account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteAlertOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition-all text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}