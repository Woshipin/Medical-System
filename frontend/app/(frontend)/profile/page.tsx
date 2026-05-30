"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  User as UserIcon, Mail, Camera, Check, 
  MapPin, Heart, Calendar, ShieldCheck, Loader2, Eye, EyeOff
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

// Custom Visual Date Picker (Forces DD-MM-YYYY visually with high contrast)
const VisualDatePicker: React.FC<{
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ name, value, onChange }) => (
  <div className="relative flex items-center rounded-2xl border-2 border-slate-100 bg-white transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
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
    <div className="w-full flex items-center justify-between px-4 py-3.5 text-sm pointer-events-none">
      <span className={value ? "text-slate-800 font-bold" : "text-slate-300 font-semibold"}>
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

// Default form factory
const makeDefaultForm = () => ({
  userId: 0,
  fullName: '',
  email: '',
  password: '',
  profileImageUrl: '',
  genderId: 1,
  dateOfBirth: '',
  phoneCode: '+65',
  phoneBody: '',
  altPhoneCode: '+65',
  altPhoneBody: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  status: 1,
  role: 3,

  // Medical Profile
  icNumber: '',
  bloodType: '',
  allergies: '',
  chronicDiseases: '',
  medicalNotes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
});

export default function PatientProfilePage() {
  const { user, isInitialized } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedRef = useRef(false);

  // States
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'medical'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState(makeDefaultForm);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // fetchCompleteProfile
  const fetchCompleteProfile = useCallback(async (userId: number) => {
    setIsLoadingDetails(true);
    try {
      const res = await window.fetch(`${API_BASE_URL}/Patient/${userId}`, { method: "GET" });
      if (res.ok) {
        const json = await res.json();
        const apiData = json.data || json;
        const pPhone = parsePhone(apiData.phoneNumber);
        const aPhone = parsePhone(apiData.phoneNumberAlt);

        setFormData({
          userId: apiData.id,
          fullName: apiData.fullName || '',
          email: apiData.email || '',
          password: '',
          profileImageUrl: apiData.profileImageUrl || '',
          genderId: apiData.genderId ?? 1,
          dateOfBirth: apiData.dateOfBirth || '',
          phoneCode: pPhone.code,
          phoneBody: pPhone.body,
          altPhoneCode: aPhone.code,
          altPhoneBody: aPhone.body,
          addressLine1: apiData.addressLine1 || '',
          addressLine2: apiData.addressLine2 || '',
          city: apiData.city || '',
          state: apiData.state || '',
          postalCode: apiData.postalCode || '',
          country: apiData.country || '',
          status: apiData.status ?? 1,
          role: apiData.role ?? 3,

          // Medical Profile
          icNumber: apiData.patientProfile?.icNumber || '',
          bloodType: apiData.patientProfile?.bloodType || '',
          allergies: apiData.patientProfile?.allergies || '',
          chronicDiseases: apiData.patientProfile?.chronicDiseases || '',
          medicalNotes: apiData.patientProfile?.medicalNotes || '',
          emergencyContactName: apiData.patientProfile?.emergencyContactName || '',
          emergencyContactPhone: apiData.patientProfile?.emergencyContactPhone || '',
          emergencyContactRelation: apiData.patientProfile?.emergencyContactRelation || '',
        });
      }
    } catch (err) {
      setErrorMsg("Failed to sync patient data from backend server.");
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const uId = typeof user.id === 'string' ? parseInt(user.id, 10) : (Number(user.id) || 0);
    fetchCompleteProfile(uId);
  }, [isInitialized, user, fetchCompleteProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "postalCode") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 6) }));
      return;
    }
    if (name === "phoneBody" || name === "altPhoneBody" || name === "emergencyContactPhone") {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const fd = formDataRef.current;

    try {
      const fullPhone = fd.phoneBody ? `${fd.phoneCode}${fd.phoneBody}` : null;
      const fullAltPhone = fd.altPhoneBody ? `${fd.altPhoneCode}${fd.altPhoneBody}` : null;

      const payload = {
        fullName: fd.fullName,
        email: fd.email,
        password: fd.password || null,
        profileImageUrl: fd.profileImageUrl || null,
        genderId: Number(fd.genderId),
        dateOfBirth: fd.dateOfBirth || null,
        phoneNumber: fullPhone,
        phoneNumberAlt: fullAltPhone,
        addressLine1: fd.addressLine1 || null,
        addressLine2: fd.addressLine2 || null,
        city: fd.city || null,
        state: fd.state || null,
        postalCode: fd.postalCode || null,
        country: fd.country || null,
        status: fd.status,

        // Medical
        icNumber: fd.icNumber || null,
        bloodType: fd.bloodType || null,
        allergies: fd.allergies || null,
        chronicDiseases: fd.chronicDiseases || null,
        medicalNotes: fd.medicalNotes || null,
        emergencyContactName: fd.emergencyContactName || null,
        emergencyContactPhone: fd.emergencyContactPhone || null,
        emergencyContactRelation: fd.emergencyContactRelation || null
      };

      const response = await window.fetch(`${API_BASE_URL}/Patient/${fd.userId}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccessMsg('Profile information updated successfully.');
        setFormData(prev => ({ ...prev, password: '' }));
        await fetchCompleteProfile(fd.userId);
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

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-28 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header Title & Status Alerts */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Profile</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Manage and update your personal health credentials</p>
          </div>
          
          <div className="w-full md:w-80 shrink-0">
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-sm font-bold shadow-md shadow-emerald-500/5 animate-in fade-in slide-in-from-right-4">
                <Check size={18} className="text-emerald-600 shrink-0" />
                <span className="truncate">{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2.5 text-sm font-bold shadow-md shadow-rose-500/5 animate-in fade-in slide-in-from-right-4">
                <span className="font-extrabold text-rose-600 shrink-0">Error:</span>
                <span className="text-xs leading-snug break-all font-semibold">{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Read-Only Avatar Card */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[2.2rem] p-7 flex flex-col items-center shadow-xl shadow-slate-100/70 relative overflow-hidden shrink-0">
            {/* Elegant Soft Emerald Top Banner */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-500/5 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center mt-6 w-full">
              <div 
                className="relative group cursor-pointer shrink-0 mb-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <img 
                  src={getProfileImageSrc(formData.profileImageUrl, formData.fullName)} 
                  alt="Profile" 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-[4px] border-white shadow-lg bg-white"
                />
                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <h2 className="text-xl font-extrabold text-slate-800 text-center leading-tight truncate w-full px-2">
                {formData.fullName || 'Loading...'}
              </h2>
              
              <div className="mt-3">
                <span className="text-[10px] px-4 py-1.5 font-extrabold rounded-xl uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                  Patient
                </span>
              </div>
            </div>

            <div className="w-full border-t border-slate-100 my-5"></div>

            <div className="w-full space-y-3 text-sm text-slate-600">
              <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50/80 rounded-2xl">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status</span>
                <span className={`font-extrabold border px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${formData.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                  {formData.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex justify-between items-center px-4 py-1.5">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">User ID</span>
                <span className="font-extrabold text-slate-800">#{formData.userId}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Editable Forms with SOLID Tabs */}
          <div className="lg:col-span-9 bg-white border border-slate-100 rounded-[2.2rem] flex flex-col shadow-xl shadow-slate-100/70">
            
            {/* High-Contrast Tabs Selector Bar */}
            <div className="bg-slate-50 border-b border-slate-100 flex p-2 gap-1.5 overflow-x-auto custom-scrollbar rounded-t-[2.2rem]">
              {[
                { id: 'basic', icon: UserIcon, label: 'Basic Info' },
                { id: 'location', icon: MapPin, label: 'Personal & Location' },
                { id: 'medical', icon: Heart, label: 'Medical & Contact' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center whitespace-nowrap gap-2.5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                    }`}
                  >
                    <tab.icon size={14} className={isActive ? "text-white" : "text-slate-500"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Area with Deep Slate Text and High-Contrast Inputs */}
            <form onSubmit={handleSave} className="p-6 md:p-8 flex flex-col">
              <div className="hidden" aria-hidden="true">
                <input type="text" name="fake-username" />
                <input type="password" name="fake-password" />
              </div>

              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                  <span className="text-slate-500 font-bold text-sm">Loading secure profile...</span>
                </div>
              ) : (
                <div className="min-h-[300px]">
                  
                  {/* === TAB 1: BASIC INFO === */}
                  {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                          <UserIcon size={18} className="text-emerald-600"/> Identity Credentials
                        </h3>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Full Name</label>
                        <input name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Update Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Leave blank to keep unchanged"
                            value={formData.password}
                            onChange={handleInputChange}
                            autoComplete="new-password"
                            className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 pr-11 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Gender</label>
                        <select name="genderId" value={formData.genderId} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm cursor-pointer">
                          <option value={1}>Male</option>
                          <option value={2}>Female</option>
                          <option value={3}>Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Date of Birth</label>
                        <VisualDatePicker name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Primary Phone</label>
                        <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 bg-white shadow-sm">
                          <select name="phoneCode" value={formData.phoneCode} onChange={handleInputChange} className="bg-transparent pl-3 pr-2 text-sm font-bold text-slate-800 outline-none cursor-pointer border-r-2 border-slate-100">
                            <option value="+65">🇸🇬 +65</option>
                            <option value="+60">🇲🇾 +60</option>
                          </select>
                          <input name="phoneBody" value={formData.phoneBody} onChange={handleInputChange} placeholder={formData.phoneCode === "+65" ? "81234567" : "012345678"} maxLength={formData.phoneCode === "+65" ? 8 : 10} className="w-full bg-transparent px-4 py-3.5 text-sm font-bold text-slate-800 outline-none" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Alt Phone</label>
                        <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 bg-white shadow-sm">
                          <select name="altPhoneCode" value={formData.altPhoneCode} onChange={handleInputChange} className="bg-transparent pl-3 pr-2 text-sm font-bold text-slate-800 outline-none cursor-pointer border-r-2 border-slate-100">
                            <option value="+65">🇸🇬 +65</option>
                            <option value="+60">🇲🇾 +60</option>
                          </select>
                          <input name="altPhoneBody" value={formData.altPhoneBody} onChange={handleInputChange} placeholder={formData.altPhoneCode === "+65" ? "81234567" : "012345678"} maxLength={formData.altPhoneCode === "+65" ? 8 : 10} className="w-full bg-transparent px-4 py-3.5 text-sm font-bold text-slate-800 outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === TAB 2: PERSONAL & LOCATION === */}
                  {activeTab === 'location' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in duration-200">
                      <div className="lg:col-span-4">
                        <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                          <MapPin size={18} className="text-emerald-600"/> Address & Contact Info
                        </h3>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Address Line 1</label>
                        <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Address Line 2</label>
                        <input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">City</label>
                        <input name="city" value={formData.city} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">State</label>
                        <input name="state" value={formData.state} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Postal Code</label>
                        <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="6-digit code" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Country</label>
                        <input name="country" value={formData.country} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>
                    </div>
                  )}

                  {/* === TAB 3: MEDICAL & EMERGENCY === */}
                  {activeTab === 'medical' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-extrabold text-emerald-700 border-b border-emerald-100 pb-2.5 flex items-center gap-2">
                          <ShieldCheck size={18}/> Medical Profile & Emergency Contact
                        </h3>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">IC / Identity Card Number</label>
                        <input name="icNumber" value={formData.icNumber} onChange={handleInputChange} placeholder="e.g. S1234567A" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Blood Type</label>
                        <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm cursor-pointer">
                          <option value="">Select Blood Type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Allergies</label>
                        <input name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="e.g. Penicillin, Peanuts (or None)" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Chronic Diseases</label>
                        <input name="chronicDiseases" value={formData.chronicDiseases} onChange={handleInputChange} placeholder="e.g. Asthma, Diabetes (or None)" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Medical Notes</label>
                        <textarea name="medicalNotes" rows={3} value={formData.medicalNotes} onChange={handleInputChange} placeholder="Additional medical history, surgeries, or notes..." className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm resize-none leading-relaxed" />
                      </div>

                      <div className="md:col-span-2 border-t border-slate-100 my-1 pt-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3">Emergency Contact Person</h4>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Contact Name</label>
                        <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} placeholder="Full name of contact person" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Contact Relation</label>
                        <input name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleInputChange} placeholder="e.g. Spouse, Parent, Sibling" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Contact Phone Number</label>
                        <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} placeholder="e.g. 91234567" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white shadow-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="shrink-0 flex justify-end pt-4 mt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving || isLoadingDetails}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Profile Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}