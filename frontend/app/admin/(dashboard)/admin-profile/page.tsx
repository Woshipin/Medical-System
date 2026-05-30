"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminAuth, ADMIN_ROLE_NAMES } from '@/app/contexts/AdminAuthContext';
import { 
  User as UserIcon, Mail, Camera, Check, 
  MapPin, Award, Calendar, Globe, ShieldCheck, Loader2, Eye, EyeOff
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

// Helper for image parsing
const getProfileImageSrc = (url: string | null | undefined, fallbackName: string) => {
  if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'User')}&background=e2e8f0&color=475569&bold=true&size=128`;
  if (url.startsWith("data:image/")) return url;
  if (url.startsWith("/user-image/")) {
    const origin = API_BASE_URL.replace("/api", "");
    return `${origin}${url}`;
  }
  return url;
};

// Phone parser helper
const parsePhone = (phone: string | null) => {
  if (!phone) return { code: '+65', body: '' };
  if (phone.startsWith('+60')) return { code: '+60', body: phone.replace('+60', '') };
  return { code: '+65', body: phone.replace('+65', '') };
};

// Date formatter for Display (DD-MM-YYYY)
const formatEngDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parts[2].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[0];
  return `${day}-${month}-${year}`;
};

// Custom Visual Date Picker (Forces DD-MM-YYYY visually)
const VisualDatePicker: React.FC<{
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ name, value, onChange }) => (
  <div className="relative flex items-center rounded-xl border border-slate-300 bg-white transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
    <input
      type="date"
      name={name}
      value={value || ""}
      onChange={onChange}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 
                 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      onClick={(e) => {
        try { (e.target as any).showPicker(); } catch {}
      }}
    />
    <div className="w-full flex items-center justify-between px-3 py-2.5 text-sm pointer-events-none">
      <span className={value ? "text-slate-900 font-semibold" : "text-slate-300 font-medium"}>
        {value ? (() => {
          const parts = value.split("-");
          if (parts.length !== 3) return value;
          return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
        })() : "DD-MM-YYYY"}
      </span>
      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
    </div>
  </div>
);

// ─── Default form state factory (avoids stale-closure resets) ───────────────
const makeDefaultForm = () => ({
  userId: 0,
  doctorId: null as number | null,
  roleValue: 1,
  userStatus: 1,
  doctorStatus: 0,
  dateJoin: '',
  dateLeft: '',
  licenseNumber: '',
  specialtyId: null as number | null,
  positionId: null as number | null,
  departmentId: null as number | null,
  officeLocationId: null as number | null,
  yearsOfExperience: null as number | null,
  profileImageUrl: '',
  fullName: '',
  email: '',
  password: '',
  phoneCode: '+65',
  phoneBody: '',
  altPhoneCode: '+65',
  altPhoneBody: '',
  genderId: 1,
  dateOfBirth: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  officePhone: '',
  qualifications: '',
  biography: '',
  remark: ''
});

export default function AdminProfilePage() {
  const { user, isInitialized } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Use a ref to track whether initial fetch already ran, so the useEffect
  //    never fires a second time and overwrites what the user typed. ──────────
  const hasFetchedRef = useRef(false);

  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'professional'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState(makeDefaultForm);

  // ── KEY FIX: Keep a ref that always mirrors the latest formData.
  //    This avoids the fragile "functional-updater snapshot" hack and ensures
  //    handleSave always reads the most up-to-date values. ────────────────────
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const parseRoleValue = (roleStrOrNum: any): number => {
    if (typeof roleStrOrNum === 'number') return roleStrOrNum;
    const str = String(roleStrOrNum).toLowerCase();
    if (str.includes('super')) return 0;
    if (str.includes('admin')) return 1;
    if (str.includes('doctor')) return 2;
    return 1;
  };

  const getRoleDisplayName = (roleVal: number) => {
    if (roleVal === 0) return 'SUPER ADMIN';
    if (roleVal === 1) return 'ADMIN';
    if (roleVal === 2) return 'DOCTOR';
    return 'STAFF';
  };

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  };

  // ── fetchCompleteProfile: fetches the latest profile data from the API
  //    and updates the form state. ────────────────────────────────────────────
  const fetchCompleteProfile = useCallback(async (userId: number, roleVal: number) => {
    setIsLoadingDetails(true);
    try {
      if (roleVal === 2) {
        const res = await window.fetch(`${API_BASE_URL}/Doctors`, { headers: getAuthHeaders() });
        if (res.ok) {
          const json = await res.json();
          const allDoctors = json.data || [];
          const myDoc = allDoctors.find((d: any) => d.userId === userId);

          if (myDoc) {
            const pPhone = parsePhone(myDoc.user?.phoneNumber);
            const aPhone = parsePhone(myDoc.phoneNumberAlt || myDoc.user?.phoneNumberAlt);

            // ── Replace entire formData atomically so there is no window where
            //    a partially-updated state could be read by handleSave. ────────
            setFormData({
              userId,
              doctorId: myDoc.id,
              roleValue: 2,
              userStatus: myDoc.user?.status ?? 1,
              doctorStatus: myDoc.status ?? 0,
              dateJoin: myDoc.dateJoin || '',
              dateLeft: myDoc.dateLeft || '',
              licenseNumber: myDoc.licenseNumber || '',
              specialtyId: myDoc.specialtyId ?? null,
              positionId: myDoc.positionId ?? null,
              departmentId: myDoc.departmentId ?? null,
              officeLocationId: myDoc.officeLocationId ?? null,
              yearsOfExperience: myDoc.yearsOfExperience ?? null,
              profileImageUrl: myDoc.user?.profileImageUrl || myDoc.profileImageUrl || '',
              fullName: myDoc.user?.fullName || '',
              email: myDoc.user?.email || '',
              password: '',
              phoneCode: pPhone.code,
              phoneBody: pPhone.body,
              altPhoneCode: aPhone.code,
              altPhoneBody: aPhone.body,
              genderId: myDoc.user?.genderId ?? myDoc.genderId ?? 1,
              dateOfBirth: myDoc.dateOfBirth || '',
              addressLine1: myDoc.address || '',
              addressLine2: myDoc.addressLine2 || '',
              city: myDoc.city || '',
              state: myDoc.state || '',
              postalCode: myDoc.postalCode || '',
              country: myDoc.country || '',
              officePhone: myDoc.officePhone || '',
              qualifications: myDoc.qualifications || '',
              biography: myDoc.biography || '',
              remark: myDoc.remark || ''
            });
          } else {
            // Doctor record not found – keep userId + role, blank everything else
            setFormData(prev => ({ ...makeDefaultForm(), userId, roleValue: 2, doctorId: null }));
          }
        }
      } else {
        const res = await window.fetch(`${API_BASE_URL}/Staff/${userId}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const json = await res.json();
          const apiData = json.data || json;
          const pPhone = parsePhone(apiData.phoneNumber);
          const aPhone = parsePhone(apiData.phoneNumberAlt);

          setFormData({
            ...makeDefaultForm(),
            userId,
            doctorId: null,
            roleValue: roleVal,
            userStatus: apiData.status ?? 1,
            profileImageUrl: apiData.profileImageUrl || '',
            fullName: apiData.fullName || '',
            email: apiData.email || '',
            password: '',
            phoneCode: pPhone.code,
            phoneBody: pPhone.body,
            altPhoneCode: aPhone.code,
            altPhoneBody: aPhone.body,
            genderId: apiData.genderId ?? 1,
            dateOfBirth: apiData.dateOfBirth || '',
            addressLine1: apiData.addressLine1 || '',
            addressLine2: apiData.addressLine2 || '',
            city: apiData.city || '',
            state: apiData.state || '',
            postalCode: apiData.postalCode || '',
            country: apiData.country || '',
          });
        }
      }
    } catch (err) {
      setErrorMsg("Failed to sync data from backend server.");
    } finally {
      setIsLoadingDetails(false);
    }
  }, []); // no deps — reads from params, not stale closures

  // ── One-time mount effect: runs only when user/isInitialized is first ready.
  //    hasFetchedRef prevents re-running on subsequent context re-renders,
  //    which was the root cause of typed values being overwritten. ───────────
  useEffect(() => {
    if (!isInitialized || !user) return;
    if (hasFetchedRef.current) return; // ← KEY FIX: never re-init from context
    hasFetchedRef.current = true;

    const uId = typeof user.id === 'string' ? parseInt(user.id, 10) : (Number(user.id) || 0);
    const roleVal = parseRoleValue(user.roleValue !== undefined ? user.roleValue : user.role);

    fetchCompleteProfile(uId, roleVal);
  }, [isInitialized, user, fetchCompleteProfile]);

  // ── Input handler ──────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "postalCode") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 6) }));
      return;
    }
    if (name === "officePhone" || name === "phoneBody" || name === "altPhoneBody") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, "") }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setErrorMsg("Image size cannot exceed 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, profileImageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ── Save handler: reads from formDataRef.current to guarantee the latest
  //    state, completely avoiding any stale-closure or batching timing issues. ─
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // ── KEY FIX: Read the latest form data directly from the ref.
    //    This is synchronous and always up-to-date, unlike the previous
    //    "functional-updater snapshot" hack that depended on React's
    //    batching timing and could read stale values. ─────────────────────────
    const fd = formDataRef.current;

    try {
      const isDoctor = fd.roleValue === 2;
      const targetId = isDoctor ? (fd.doctorId || fd.userId) : fd.userId;

      const endpoint = isDoctor
        ? `${API_BASE_URL}/Doctors/${targetId}`
        : `${API_BASE_URL}/Staff/${targetId}`;

      const fullPhone = fd.phoneBody ? `${fd.phoneCode}${fd.phoneBody}` : null;
      const fullAltPhone = fd.altPhoneBody ? `${fd.altPhoneCode}${fd.altPhoneBody}` : null;

      const basePayload = {
        fullName: fd.fullName,
        email: fd.email,
        password: fd.password || null,
        profileImageUrl: fd.profileImageUrl || null,
        genderId: Number(fd.genderId),
        dateOfBirth: fd.dateOfBirth || null,
        city: fd.city || null,
        state: fd.state || null,
        postalCode: fd.postalCode || null,
        country: fd.country || null,
      };

      const payload = isDoctor ? {
        ...basePayload,
        phone: fullPhone,
        phoneNumberAlt: fullAltPhone,
        address: fd.addressLine1 || null,
        addressLine2: fd.addressLine2 || null,
        officePhone: fd.officePhone || null,
        qualifications: fd.qualifications || null,
        biography: fd.biography || null,
        remark: fd.remark || null,
        userStatus: fd.userStatus,
        doctorStatus: fd.doctorStatus,
        licenseNumber: fd.licenseNumber || null,
        specialtyId: fd.specialtyId,
        positionId: fd.positionId,
        departmentId: fd.departmentId,
        officeLocationId: fd.officeLocationId,
        yearsOfExperience: fd.yearsOfExperience,
        dateJoin: fd.dateJoin || null,
        dateLeft: fd.dateLeft || null
      } : {
        ...basePayload,
        phoneNumber: fullPhone,
        phoneNumberAlt: fullAltPhone,
        addressLine1: fd.addressLine1 || null,
        addressLine2: fd.addressLine2 || null,
        role: fd.roleValue,
        status: fd.userStatus
      };

      const response = await window.fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccessMsg('Profile information updated successfully.');
        // ── After successful save, clear password field only, then re-fetch
        //    fresh data from server to confirm what was persisted. ─────────
        setFormData(prev => ({ ...prev, password: '' }));
        await fetchCompleteProfile(fd.userId, fd.roleValue);
      } else {
        const errorJson = await response.json();
        let friendlyError = errorJson.message || 'Update failed.';
        if (errorJson.errors) {
          const detailMsgs = Object.values(errorJson.errors)
            .flatMap((messages: any) => messages)
            .join(' ');
          if (detailMsgs) {
            friendlyError = `${friendlyError} (${detailMsgs})`;
          }
        }
        setErrorMsg(friendlyError);
      }
    } catch (err) {
      setErrorMsg('Network error. Check backend connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDoctorStatusLabel = (statusCode: number) => {
    switch (statusCode) {
      case 0: return { label: "Active", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case 1: return { label: "Suspended", color: "text-rose-600 bg-rose-50 border-rose-200" };
      case 2: return { label: "On Leave", color: "text-amber-600 bg-amber-50 border-amber-200" };
      case 3: return { label: "Terminated", color: "text-slate-600 bg-slate-50 border-slate-200" };
      default: return { label: "Active", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    }
  };

  if (!isInitialized) return null;

  return (
    <div className="p-2 lg:p-6 max-w-[1400px] mx-auto h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50/50">
      
      {/* Header & Alerts */}
      <div className="shrink-0 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Account Profile</h1>
        </div>
        
        <div className="w-full sm:w-72 shrink-0">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-right-4">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span className="truncate">{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-right-4">
              <span className="font-bold shrink-0">Error:</span>
              <span className="text-xs font-semibold leading-snug break-all">{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Read-Only Info & Avatar */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 lg:p-6 flex flex-col shadow-sm relative overflow-hidden shrink-0">
          
          <div className="absolute top-0 left-0 right-0 h-16 lg:h-28 bg-slate-50 border-b border-slate-100 z-0"></div>
          
          <div className="relative z-10 flex flex-row lg:flex-col items-center gap-4 lg:gap-0 mt-2 lg:mt-6">
            
            <div 
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <img 
                src={getProfileImageSrc(formData.profileImageUrl, formData.fullName)} 
                alt="Profile" 
                className="w-20 h-20 lg:w-28 lg:h-28 rounded-full object-cover border-[3px] lg:border-4 border-white shadow-md bg-white"
              />
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="flex flex-col items-start lg:items-center flex-1 min-w-0">
              <h2 className="text-base lg:text-lg font-extrabold text-slate-800 lg:mt-5 text-left lg:text-center leading-tight truncate w-full">
                {formData.fullName || 'Loading...'}
              </h2>
              <div className="mt-1.5 lg:mt-2.5">
                <span className={`text-[10px] lg:text-[11px] px-3 lg:px-3.5 py-1 font-black rounded-md uppercase tracking-widest ${
                  formData.roleValue === 2 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                  formData.roleValue === 0 ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {getRoleDisplayName(formData.roleValue)}
                </span>
              </div>
            </div>

          </div>

          <div className="w-full border-t border-slate-100 my-2 lg:my-4"></div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-2.5 text-sm text-slate-600">
            <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] lg:text-xs">Status</span>
              <span className={`font-bold border px-2 lg:px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${formData.userStatus === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {formData.userStatus === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>

            {formData.roleValue === 2 && (
              <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] lg:text-xs">Work Status</span>
                <span className={`font-bold border px-2 lg:px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getDoctorStatusLabel(formData.doctorStatus).color}`}>
                  {getDoctorStatusLabel(formData.doctorStatus).label}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center px-3 py-1.5 lg:py-2">
              <span className="text-slate-400 font-semibold text-[10px] lg:text-xs uppercase tracking-wider">User ID</span>
              <span className="font-bold text-slate-700">#{formData.userId}</span>
            </div>

            {formData.roleValue === 2 && (
              <>
                <div className="flex justify-between items-center px-3 py-1.5 lg:py-2">
                  <span className="text-slate-400 font-semibold text-[10px] lg:text-xs uppercase tracking-wider">Date Join</span>
                  <span className="font-bold text-slate-700">{formatEngDate(formData.dateJoin)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-1.5 lg:py-2">
                  <span className="text-slate-400 font-semibold text-[10px] lg:text-xs uppercase tracking-wider">Date Left</span>
                  <span className="font-bold text-slate-700">{formatEngDate(formData.dateLeft)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Editable Forms */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm min-h-0">
          
          <div className="bg-slate-50/80 border-b border-slate-200 flex px-2 pt-2 gap-1 shrink-0 overflow-x-auto custom-scrollbar">
            {[
              { id: 'basic', icon: UserIcon, label: 'Basic Info' },
              { id: 'location', icon: MapPin, label: 'Personal & Location' },
              ...(formData.roleValue === 2 ? [{ id: 'professional', icon: Award, label: 'Professional' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap gap-1.5 lg:gap-2 px-4 py-2.5 lg:px-6 lg:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-600 border-t border-x border-slate-200 shadow-[0_2px_0_0_white]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-t border-x border-transparent'
                }`}
              >
                <tab.icon size={14} className="lg:w-4 lg:h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 p-4 lg:p-6">
            <div className="hidden" aria-hidden="true">
              <input type="text" name="fake-username" />
              <input type="password" name="fake-password" />
            </div>

            {isLoadingDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-slate-500 text-sm flex items-center gap-2 font-semibold">
                  <Loader2 className="animate-spin text-emerald-500" size={20}/> Syncing your data...
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-3">
                
                {/* === TAB 1: BASIC INFO === */}
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 lg:gap-x-8 gap-y-4 lg:gap-y-6 animate-in fade-in">
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <UserIcon size={18} className="text-emerald-600"/> Identity Credentials
                      </h3>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Full Name</label>
                      <input name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Update Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Leave blank to keep unchanged"
                          value={formData.password}
                          onChange={handleInputChange}
                          autoComplete="new-password"
                          className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Gender</label>
                      <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white cursor-pointer">
                        <option value={1}>Male</option>
                        <option value={2}>Female</option>
                        <option value={3}>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Primary Phone</label>
                      <div className="flex border border-slate-300 rounded-xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 bg-white">
                        <select name="phoneCode" value={formData.phoneCode} onChange={handleInputChange} className="bg-transparent pl-3 pr-2 text-sm font-semibold text-slate-900 outline-none cursor-pointer border-r border-slate-200">
                          <option value="+65">🇸🇬 +65</option>
                          <option value="+60">🇲🇾 +60</option>
                        </select>
                        <input name="phoneBody" value={formData.phoneBody} onChange={handleInputChange} placeholder={formData.phoneCode === "+65" ? "81234567" : "012345678"} maxLength={formData.phoneCode === "+65" ? 8 : 10} className="w-full bg-transparent p-2.5 text-sm font-semibold text-slate-900 outline-none placeholder-slate-300" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Alt Phone</label>
                      <div className="flex border border-slate-300 rounded-xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 bg-white">
                        <select name="altPhoneCode" value={formData.altPhoneCode} onChange={handleInputChange} className="bg-transparent pl-3 pr-2 text-sm font-semibold text-slate-900 outline-none cursor-pointer border-r border-slate-200">
                          <option value="+65">🇸🇬 +65</option>
                          <option value="+60">🇲🇾 +60</option>
                        </select>
                        <input name="altPhoneBody" value={formData.altPhoneBody} onChange={handleInputChange} placeholder={formData.altPhoneCode === "+65" ? "81234567" : "012345678"} maxLength={formData.altPhoneCode === "+65" ? 8 : 10} className="w-full bg-transparent p-2.5 text-sm font-semibold text-slate-900 outline-none placeholder-slate-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* === TAB 2: LOCATION & PERSONAL === */}
                {activeTab === 'location' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 lg:gap-x-8 gap-y-4 lg:gap-y-6 animate-in fade-in">
                    <div className="md:col-span-4">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <MapPin size={18} className="text-emerald-600"/> Personal & Correspondence
                      </h3>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Date of Birth</label>
                      <VisualDatePicker name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
                    </div>

                    <div className="md:col-span-4 border-t border-dashed border-slate-100 mt-1 lg:mt-2 pt-2 lg:pt-4"></div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Address Line 1</label>
                      <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Address Line 2</label>
                      <input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>

                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">City</label>
                      <input name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">State</label>
                      <input name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>

                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Postal Code</label>
                      <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="6-digit code" className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Country</label>
                      <input name="country" value={formData.country} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" />
                    </div>
                  </div>
                )}

                {/* === TAB 3: PROFESSIONAL (Doctor Only) === */}
                {activeTab === 'professional' && formData.roleValue === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 lg:gap-x-8 gap-y-4 lg:gap-y-6 animate-in fade-in">
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-bold text-emerald-700 border-b border-emerald-100 pb-2 flex items-center gap-2">
                        <ShieldCheck size={18}/> Professional Profile Settings
                      </h3>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Office Direct Phone</label>
                      <input 
                        name="officePhone" 
                        value={formData.officePhone} 
                        onChange={handleInputChange} 
                        placeholder="e.g. 62354412" 
                        maxLength={10} 
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300 max-w-md" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Qualifications</label>
                      <input 
                        name="qualifications" 
                        value={formData.qualifications} 
                        onChange={handleInputChange} 
                        placeholder="Medical qualifications..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder-slate-300" 
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Short Biography</label>
                      <textarea 
                        name="biography" 
                        rows={3} 
                        value={formData.biography} 
                        onChange={handleInputChange} 
                        placeholder="Short doctor biography..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white resize-none leading-relaxed placeholder-slate-300" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2 block">Internal Remark</label>
                      <textarea 
                        name="remark" 
                        rows={3} 
                        value={formData.remark} 
                        onChange={handleInputChange} 
                        placeholder="Enter internal remarks or notes..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white resize-none leading-relaxed placeholder-slate-300" 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="shrink-0 flex justify-end pt-3 mt-3 lg:pt-4 border-t border-slate-100 lg:mt-4">
              <button
                type="submit"
                disabled={isSaving || isLoadingDetails}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Profile Changes'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}