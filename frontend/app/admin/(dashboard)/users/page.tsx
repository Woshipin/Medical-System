"use client"; // 声明该组件为 Next.js 客户端组件
import React, { useState, useEffect, useMemo } from "react"; // 引入 React 核心 hooks
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
} from "lucide-react"; // 引入 Lucide 图标库中的系统图标
import Pagination from "@/components/admin/Pagination"; // 引入封装的分页组件

// ==========================================
// Environment Variables
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // 读取配置文件的 API 接口基准路径

interface SystemUser { // 定义系统用户实体的数据结构接口
  id: number | string; // 用户主键 ID
  fullName: string; // 用户姓名
  email: string; // 电子邮箱
  phoneNumber: string | null; // 电话号码，可为空
  genderId: number; // 性别 ID
  gender?: { id: number; name: string }; // 关联的外键性别对象
  role: number; // 角色整型值
  isActive: boolean; // 是否处于激活状态
  createdAt: string; // 创建时间
}

interface DropdownOption { // 定义通用下拉框可选项的接口
  value: number | string | boolean; // 可选项的实际值
  label: string; // 下拉框中渲染的文字标签
}

// -----------------
// UI Helper Component (Badge)
// -----------------
const Badge = ({ // 声明小徽章通用组件
  children, // 内部嵌套的子节点
  variant, // 徽章的配色主题变体
}: {
  children: React.ReactNode;
  variant: "success" | "danger" | "info" | "warning" | "secondary";
}) => {
  const colors = { // 各配色主题对应的 Tailwind 样式类
    success: "bg-emerald-100 text-emerald-800 border-emerald-200", // 绿色主题
    danger: "bg-red-100 text-red-800 border-red-200", // 红色主题
    info: "bg-blue-100 text-blue-800 border-blue-200", // 蓝色主题
    warning: "bg-amber-100 text-amber-800 border-amber-200", // 黄色主题
    secondary: "bg-slate-100 text-slate-800 border-slate-200", // 灰色主题
  };
  return ( // 渲染徽章样式标签
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[variant]}`}>
      {children}
    </span>
  );
};

// -----------------
// Toast Notification Component
// -----------------
const Toast = ({ show, message, type, onClose }: { show: boolean, message: string, type: 'success' | 'error', onClose: () => void }) => { // 声明全局弱提示弹窗组件
  if (!show) return null; // 如果不处于显示状态则不渲染任何 DOM
  return ( // 渲染提示框
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

export default function UsersPage() { // 导出用户管理主页面组件
  // Data states
  const [users, setUsers] = useState<SystemUser[]>([]); // 初始化系统用户列表数据
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]); // 初始化性别下拉选项数据
  const [isLoading, setIsLoading] = useState(true); // 声明加载等待状态，默认为启用

  // Filter states
  const [searchTerm, setSearchTerm] = useState(""); // 搜索栏文本输入状态
  const [roleFilter, setRoleFilter] = useState("all"); // 角色过滤下拉状态
  const [statusFilter, setStatusFilter] = useState("all"); // 激活状态过滤状态
  const [genderFilter, setGenderFilter] = useState("all"); // 性别过滤下拉状态

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // 初始化当前分页码为 1
  const itemsPerPage = 10; // 单页呈现的数据行限制

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制新增/修改表单弹窗展开状态
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // 控制详情查看弹窗展开状态
  const [modalMode, setModalMode] = useState<"create" | "edit">("create"); // 标记表单弹窗处于新增(create)还是编辑(edit)状态

  // Form and validation states
  const [formData, setFormData] = useState<any>({}); // 存放表单输入实体数据
  const [phoneCode, setPhoneCode] = useState("+65"); // 存储电话号码国家区号代码，默认新加坡 +65
  const [phoneBody, setPhoneBody] = useState(""); // 存储电话号码纯正文数字
  const [errors, setErrors] = useState<Record<string, string>>({}); // 存放表单校验失败的错误字典
  const [showPassword, setShowPassword] = useState(false); // 控制密码框是否明文可见的布尔值

  // Delete and notification states
  const [viewData, setViewData] = useState<SystemUser | null>(null); // 保存查看详情模态框当前加载的单条实体数据
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false); // 删除确认红色弹窗状态
  const [userToDelete, setUserToDelete] = useState<number | string | null>(null); // 存储当前等待被删除的用户的 ID
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" }); // 全局 Toast 提示状态

  const showToast = (type: 'success' | 'error', message: string) => { // 声明触发弱提示方法
    setToast({ show: true, type, message }); // 开启弹窗并填充内容
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000); // 4秒后自动销毁提示
  };

  const getAuthHeaders = () => { // 获取当前携带 Token 的统一 HTTP 报头方法
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""; // 安全获取 LocalStorage 中的 Token
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }; // 组装 Headers
  };

  const fetchData = async () => { // 异步获取后台所有基础数据的方法
    try {
      setIsLoading(true); // 打开加载等待中蒙层
      const [usersRes, gendersRes] = await Promise.all([ // 合并同时向后端拉取用户列表和性别字典数据
        fetch(`${API_BASE_URL}/user`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok) { // 用户列表获取成功
        const json = await usersRes.json(); // 解析数据
        setUsers(json.data || []); // 注入用户状态
      }
      if (gendersRes.ok) { // 性别字典拉取成功
        const json = await gendersRes.json(); // 解析数据
        setGenderOptions((json.data || []).map((g: any) => ({ value: g.id, label: g.name }))); // 映射转为下拉框所需 DTO 格式并注入状态
      }
    } catch (error) { // 捕获请求异常
      console.error("Error fetching data:", error); // 控制台记录
      showToast("error", "Failed to load user database."); // 触发错误提示
    } finally {
      setIsLoading(false); // 关闭加载蒙层
    }
  };

  useEffect(() => { // 首次加载执行初始化拉取
    fetchData(); // 呼叫拉取
  }, []); // 依赖项为空

  // Reset to page 1 when filters change
  useEffect(() => { // 监听任意过滤器项发生变动
    setCurrentPage(1); // 只要过滤器改变，强制重置分页回第 1 页
  }, [searchTerm, roleFilter, statusFilter, genderFilter]); // 监听过滤器依赖

  const getRoleInfo = (roleInt: number) => { // 解析数字角色对应的前端徽章样式名称和配色的辅助函数
    switch (roleInt) {
      case 0: return { name: "Super Admin", color: "danger" }; // 红色超级管理员
      case 1: return { name: "Admin", color: "info" }; // 蓝色普通管理员
      case 3: return { name: "Patient", color: "success" }; // 绿色患者
      default: return { name: "Unknown", color: "secondary" }; // 灰色未知
    }
  };

  const filteredUsers = useMemo(() => { // 纯前端客户端检索的核心高性能过滤计算属性
    return users.filter((user) => { // 对内存中的全部数据行执行遍历过滤
      const matchSearch = // 搜索框匹配：姓名、邮箱或电话
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm);
      const matchRole = roleFilter === "all" || user.role.toString() === roleFilter; // 角色下拉过滤
      const matchStatus = statusFilter === "all" || user.isActive.toString() === statusFilter; // 状态下拉过滤
      const matchGender = genderFilter === "all" || user.genderId.toString() === genderFilter; // 性别下拉过滤
      return matchSearch && matchRole && matchStatus && matchGender; // 返回复合交集结果
    });
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter]); // 监听依赖项计算

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage); // 依据过滤后的数据集大小计算总页数
  const paginatedUsers = useMemo(() => { // 截取单页展现数据集的计算属性
    const startIndex = (currentPage - 1) * itemsPerPage; // 计算偏移起始量
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage); // 截取指定行数
  }, [filteredUsers, currentPage, itemsPerPage]); // 监听依赖项

  // ---------------
  // Modal Handlers
  // ---------------
  const openCreateModal = () => { // 开启新增弹窗的方法
    setModalMode("create"); // 设置模式为 create（创建）
    setErrors({}); // 清空错误残留
    setShowPassword(false); // 密码框强制复原为隐藏
    setFormData({ // 初始化填充表单属性
      fullName: "", email: "", password: "", genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      role: 3, isActive: true,
    });
    setPhoneCode("+65"); // 默认新加坡区号
    setPhoneBody(""); // 电话为空
    setIsModalOpen(true); // 展开弹窗
  };

  const openEditModal = (user: SystemUser) => { // 开启编辑修改弹窗的方法
    setModalMode("edit"); // 设置模式为 edit（修改）
    setErrors({}); // 清空校验字典
    setShowPassword(false); // 隐藏密码
    setFormData({ // 深度填充选中数据行的已有数据
      id: user.id, fullName: user.fullName, email: user.email, password: "", 
      genderId: user.genderId, role: user.role, isActive: user.isActive,
    });

    if (user.phoneNumber?.startsWith("+60")) { // 拆分区号和电话正文：如果是马来西亚
      setPhoneCode("+60"); // 设置区号为 +60
      setPhoneBody(user.phoneNumber.replace("+60", "")); // 替换剥离出电话号码正文
    } else { // 否则默认按照新加坡
      setPhoneCode("+65"); // 设置区号 +65
      setPhoneBody((user.phoneNumber || "").replace("+65", "")); // 剥离正文
    }
    setIsModalOpen(true); // 展开弹窗
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { // 统一处理表单控件值改变的通用事件方法
    const { name, value } = e.target; // 解构获取元素名称和值
    setFormData((prev: any) => ({ ...prev, [name]: value })); // 深度同步更新数据状态
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); // 如果该字段原先存留校验错误，抹除错误提示
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => { // 专门限制电话文本框只能写入数字的输入监控事件
    setPhoneBody(e.target.value.replace(/\D/g, "")); // 正则强制截断并移除非数字字符
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" })); // 抹除电话验证错误
  };

  const handleSave = async () => { // 表单提交保存（创建和修改）的核心业务处理异步方法
    const newErrors: Record<string, string> = {}; // 声明局部临时错误词典
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 邮箱格式正则
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/; // 密码强度正则（最少6位，包含字母和数字）

    if (!formData.fullName.trim()) newErrors.fullName = "Please enter full name."; // 校验姓名非空
    if (!formData.email.trim() || !emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address."; // 校验邮箱非空及格式
    
    if (modalMode === "create" && !formData.password) { // 校验新增时密码非空
      newErrors.password = "Password is required for new users.";
    } else if (formData.password && !passwordRegex.test(formData.password)) { // 校验输入的密码合法强度
      newErrors.password = "Min 6 characters, including letters & numbers.";
    }

    if (phoneCode === "+65" && phoneBody && phoneBody.length !== 8) { // 新加坡号码限制必须等于 8 位数字
      newErrors.phone = "Singapore numbers must be exactly 8 digits.";
    } else if (phoneCode === "+60" && phoneBody && (phoneBody.length < 9 || phoneBody.length > 10)) { // 马来西亚限制 9 到 10 位数字
      newErrors.phone = "Malaysia numbers must be 9 or 10 digits.";
    } else if (!phoneBody) { // 电话号码正文为空校验
      newErrors.phone = "Please enter phone number.";
    }

    if (Object.keys(newErrors).length > 0) { // 如果临时字典中含有报错信息，说明未通过前端基本校验
      setErrors(newErrors); // 触发页面报错显示并红框高亮
      return; // 阻断数据提交
    }

    try {
      const payload: any = { // 组装发送给后台的数据体载荷 DTO
        ...formData, // 复制表单实体
        phoneNumber: `${phoneCode}${phoneBody}`, // 拼装国家代码的电话号码正文
        genderId: Number(formData.genderId), // 确保性别 ID 为正数
        role: Number(formData.role), // 确保角色为数字枚举型
        isActive: formData.isActive === "true" || formData.isActive === true, // 确保激活状态转换为标准布尔型
      };

      if (modalMode === "edit" && !formData.password) { // 编辑修改模式下，如果没有输入密码，剥离该字段，不覆盖数据库密码
        delete payload.password; // 物理删除
      }

      // 动态确定 API URL 和 HTTP method：创建模式走 POST，编辑模式走 PUT并带 ID
      const url = modalMode === "create" ? `${API_BASE_URL}/user` : `${API_BASE_URL}/user/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) }); // 发起 fetch 调用

      if (res.ok) { // 业务执行成功
        setIsModalOpen(false); // 关闭表单弹窗
        showToast("success", modalMode === "create" ? "User created successfully!" : "User updated successfully!"); // 触发成功 Toast 
        fetchData(); // 重新拉取后台最新列表并更新表格展示
      } else { // 业务被后台拦截校验失败（如：邮箱占用）
        const errorData = await res.json(); // 解析后端返回错误信息 JSON 包
        const fieldErrors = errorData.errors || errorData.validationErrors; // 获取后端返回的分类字段具体不合规说明描述
        
        if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) { // 如果存在后端字段报错结构
          const backendMappedErrors: Record<string, string> = {}; // 新建临时后端错误映射词典
          Object.keys(fieldErrors).forEach((key) => { // 遍历不合规分类
            backendMappedErrors[key] = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key]; // 映射转换并赋入
          });
          setErrors(backendMappedErrors); // 动态页面控件边框爆红并进行警告文字指向
          showToast("error", errorData.message || "Please fix the highlighted errors."); // 展示弱提示
        } else {
          showToast("error", errorData.message || "Failed to save user data."); // 展示弱提示
        }
      }
    } catch (err) { // 捕获网络错误
      console.error(err); // 记录日志
      showToast("error", "A network error occurred. Please try again."); // 触发网络警告提示
    }
  };

  const confirmDelete = async () => { // 确认异步彻底删除用户的方法
    if (!userToDelete) return; // 防空
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userToDelete}`, { method: "DELETE", headers: getAuthHeaders() }); // 发送 HTTP DELETE 接口调用
      if (res.ok) { // 删除成功
        showToast("success", "User deleted successfully."); // 展示成功提示
        fetchData(); // 刷新表格数据
      } else { // 异常
        let errorMessage = "Failed to delete user.";
        try {
          const errorData = await res.json(); // 提取报错
          errorMessage = errorData.message || errorMessage; // 写入
        } catch (parseError) {
          console.error("Non-JSON error returned");
        }
        showToast("error", errorMessage); // 展示异常提示
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred while deleting.");
    } finally {
      setIsDeleteAlertOpen(false); // 关闭确认弹窗
      setUserToDelete(null); // 清空临时缓存
    }
  };

  return (
    // ==========================================
    // 【布局核心修改部分】:
    // 将原有的 max-w-[1400px] 与 lg:px-8 改为桌面端(xl及以上)自适应伸展全宽：xl:max-w-full xl:px-4 2xl:px-6
    // 这样，在平板、iPad、手机端布局依旧能保持原来的 max-w-1400 宽不发生变形，而桌面端将会无限拓宽，消除左右两边的巨大白底留空。
    // ==========================================
    <div className="space-y-5 max-w-[1400px] xl:max-w-full xl:px-4 2xl:px-1 mx-auto pb-10 px-4 sm:px-6 lg:px-8 relative">
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
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
                {paginatedUsers.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-600 font-medium text-sm">No users found.</td></tr>
                ) : (
                  paginatedUsers.map((user) => (
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
        
        {/* Pagination Controls */}
        {!isLoading && filteredUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
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
                    <input type="text" value={phoneBody} onChange={handlePhoneBodyChange} maxLength={phoneCode === "+65" ? 8 : 10} className={`flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none ${errors.phone ? 'text-red-500 placeholder-red-300' : 'text-slate-900 placeholder:text-slate-400'}`} placeholder={phoneCode === "+65" ? "8 digits" : "9-10 digits"} />
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