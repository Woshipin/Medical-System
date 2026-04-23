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
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

// ==========================================
// 读取环境变量
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
// UI 辅助组件 (Badge)
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
    <span
      className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[variant]}`}
    >
      {children}
    </span>
  );
};

export default function UsersPage() {
  // 数据状态
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  // Modal 状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // 表单状态
  const [formData, setFormData] = useState<any>({});
  const [phoneCode, setPhoneCode] = useState("+65");
  const [phoneBody, setPhoneBody] = useState("");

  const [viewData, setViewData] = useState<SystemUser | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | string | null>(
    null,
  );

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
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
        setGenderOptions(
          (json.data || []).map((g: any) => ({ value: g.id, label: g.name })),
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRoleInfo = (roleInt: number) => {
    switch (roleInt) {
      case 0:
        return { name: "Super Admin", color: "danger" };
      case 1:
        return { name: "Admin", color: "info" };
      case 3:
        return { name: "Patient", color: "success" };
      default:
        return { name: "Unknown", color: "secondary" };
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm);
      const matchRole =
        roleFilter === "all" || user.role.toString() === roleFilter;
      const matchStatus =
        statusFilter === "all" || user.isActive.toString() === statusFilter;
      const matchGender =
        genderFilter === "all" || user.genderId.toString() === genderFilter;
      return matchSearch && matchRole && matchStatus && matchGender;
    });
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter]);

  // ---------------
  // Modal 处理
  // ---------------
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      fullName: "",
      email: "",
      password: "",
      genderId: genderOptions.length > 0 ? genderOptions[0].value : "",
      role: 3,
      isActive: true,
    });
    setPhoneCode("+65");
    setPhoneBody("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    setModalMode("edit");
    setFormData({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: "", // 编辑时默认空，不填则不改
      genderId: user.genderId,
      role: user.role,
      isActive: user.isActive,
    });

    // 解析电话号码
    if (user.phoneNumber?.startsWith("+60")) {
      setPhoneCode("+60");
      setPhoneBody(user.phoneNumber.replace("+60", ""));
    } else {
      setPhoneCode("+65");
      setPhoneBody((user.phoneNumber || "").replace("+65", ""));
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // 电话号码纯数字输入处理
  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 移除非数字字符
    const onlyNums = e.target.value.replace(/\D/g, "");
    setPhoneBody(onlyNums);
  };

  const handleSave = async () => {
    // 逻辑校验：确保提交时长度正确
    if (phoneCode === "+65" && phoneBody.length !== 8) {
      alert("Singapore phone number must be exactly 8 digits.");
      return;
    }
    if (
      phoneCode === "+60" &&
      (phoneBody.length < 9 || phoneBody.length > 10)
    ) {
      alert("Malaysia phone number must be 9 or 10 digits.");
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

      const url =
        modalMode === "create"
          ? `${API_BASE_URL}/user`
          : `${API_BASE_URL}/user/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Action failed: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteAlertOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">
            Manage and maintain your system users effectively.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* 搜索与过滤 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[40%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-colors"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center text-sm font-semibold text-slate-800">
            <Filter className="w-4 h-4 mr-1.5" /> Filters:
          </div>

          <div className="relative">
            <select
              className="appearance-none pr-8 pl-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="0">Super Admin</option>
              <option value="1">Admin</option>
              <option value="3">Patient</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="appearance-none pr-8 pl-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="appearance-none pr-8 pl-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="all">All Genders</option>
              {genderOptions.map((g) => (
                <option key={g.value as string} value={g.value as string}>
                  {g.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-600 font-medium text-sm">
            Loading user database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-600 font-medium text-sm"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-900 text-sm">
                        {user.fullName}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        {user.email}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        {user.phoneNumber || "-"}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        {user.gender?.name || "Unknown"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={getRoleInfo(user.role).color as any}>
                          {getRoleInfo(user.role).name}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setViewData(user);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user.id);
                              setIsDeleteAlertOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        )}
      </div>

      {/* ========================================= */}
      {/* Create / Edit Modal (精简比例、修复逻辑)    */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "Create New User" : "Edit User Data"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder-slate-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={modalMode === "edit"}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 disabled:text-slate-500 text-slate-900 placeholder-slate-500"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Password{" "}
                    {modalMode === "edit" && (
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        (Leave blank to keep)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder-slate-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Phone Number
                  </label>
                  {/* 使用 flex-row 确保水平排列，gap-2 保持间距 */}
                  <div className="flex flex-row items-center gap-2">
                    {/* 1. 下拉框容器：
       - 使用 w-[105px]：这个宽度刚好容纳 "+65 (SG)" 和图标，不会太宽占地方。
       - shrink-0：防止在空间不足时被强行压缩。
    */}
                    <div className="relative w-[105px] sm:w-[115px] shrink-0">
                      <select
                        value={phoneCode}
                        onChange={(e) => {
                          setPhoneCode(e.target.value);
                          setPhoneBody("");
                        }}
                        className="appearance-none w-full pl-2.5 pr-8 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="+65">+65 (SG)</option>
                        <option value="+60">+60 (MY)</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>

                    {/* 2. 输入框：
       - flex-1：占据剩余的所有空间。
       - min-w-0：这是 Flex 布局中防止溢出的关键，它允许输入框在窄屏下缩小而不撑破容器。
    */}
                    <input
                      type="text"
                      value={phoneBody}
                      onChange={handlePhoneBodyChange}
                      maxLength={phoneCode === "+65" ? 8 : 10}
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder-slate-500 font-medium"
                      placeholder={
                        phoneCode === "+65" ? "8 digits" : "9-10 digits"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      name="genderId"
                      value={formData.genderId}
                      onChange={handleInputChange}
                      className="appearance-none w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {genderOptions.map((g) => (
                        <option
                          key={g.value as string}
                          value={g.value as string}
                        >
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    System Role
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="appearance-none w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value={0}>Super Admin</option>
                      <option value={1}>Admin</option>
                      <option value={3}>Patient</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="isActive"
                      value={formData.isActive}
                      onChange={handleInputChange}
                      className="appearance-none w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* View Modal (重新设计，更加干净轻量)         */}
      {/* ========================================= */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">User Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 替换 isViewModalOpen 中的主体内容 */}
            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: viewData.fullName, icon: User },
                  { label: "Email Address", value: viewData.email, icon: Mail },
                  {
                    label: "Phone Number",
                    value: viewData.phoneNumber || "N/A",
                    icon: Phone,
                  },
                  {
                    label: "Gender",
                    value: viewData.gender?.name || "N/A",
                    icon: CheckCircle2,
                  },
                  {
                    label: "System Role",
                    value: getRoleInfo(viewData.role).name,
                    icon: Shield,
                    isBadge: true,
                    variant: getRoleInfo(viewData.role).color,
                  },
                  {
                    label: "Status",
                    value: viewData.isActive ? "Active" : "Inactive",
                    icon: CheckCircle2,
                    isBadge: true,
                    variant: viewData.isActive ? "success" : "danger",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <item.icon className="w-4.5 h-4.5 text-slate-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      {item.isBadge ? (
                        <div className="mt-1">
                          <Badge variant={item.variant as any}>
                            {item.value}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-900 break-all">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Delete Confirmation (等比例缩小)            */}
      {/* ========================================= */}
      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-slate-600 text-sm font-medium mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteAlertOpen(false)}
                className="flex-1 py-2 text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold shadow-sm transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
