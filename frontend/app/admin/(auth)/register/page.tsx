"use client"; // 启用 Next.js 客户端组件渲染模式

import React, { useState, useEffect, useRef } from "react"; // 引入 React 基础依赖和钩子
import {
  Mail, Lock, User, Activity, ArrowLeft, CheckCircle2,
  Eye, EyeOff, ShieldCheck, ChevronDown, AlertCircle,
  X, CheckCircle, Loader2, ArrowRight, Phone
} from "lucide-react"; // 引入系统注册所需的各类图标组件
import Link from "next/link"; // 引入声明式链接组件
import { useRouter } from "next/navigation"; // 引入路由控制钩子

// --- 辅助函数：解析注册过程中后端反馈的各种高精度错误格式并汇总回馈前端 Alert ---
const parseBackendError = (result: any, defaultMsg: string = "Registration failed."): string => {
  if (!result) return defaultMsg; // 如果无结果，直接回退默认消息

  // 1. 解析数据库或 Identity 框架返回的各种具体的多条错误（errors 数据集支持数组和对象展开）
  const errors = result.errors || result.Errors || result.data || result.Data; // 模糊提取 errors 或 data 对象
  if (errors) { // 节点不为空时
    if (Array.isArray(errors)) { // 如果是一个简单的字符串数组
      return errors.join(" | "); // 使用管道符整合输出
    } // 结束数组分支
    if (typeof errors === 'object') { // 如果是一个键值对错误集合（如数据库约束异常、重复邮箱报错）
      return Object.values(errors) // 展开所有值集合
        .flatMap((err: any) => Array.isArray(err) ? err : [err]) // 递归展开多维数组为单一维度的数组
        .join(" | "); // 扁平化整合为单行字符串
    } // 结束对象分支
  } // 结束 errors 分支

  // 2. 无 errors 说明时，获取上一级的 message 错误信息（如“注册失败，该邮箱已被注册”）
  return result.message || result.Message || defaultMsg; // 返回顶层的 message 内容，无则最终使用默认值
}; // 结束解析辅助方法

export default function AdminRegisterPage() { // 导出管理员注册主页面组件
  const router = useRouter(); // 声明路由导航
  const [showPassword, setShowPassword] = useState(false); // 声明控制密码明文密文显示的状态布尔值

  const [fullName, setFullName] = useState(""); // 注册人姓名状态，初始为空
  const [email, setEmail] = useState(""); // 注册邮箱状态，初始为空
  const [password, setPassword] = useState(""); // 注册密码状态，初始为空
  
  // Phone Number States
  const [countryCode, setCountryCode] = useState("+65"); // 注册电话国家区号，默认为新加坡 +65
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false); // 下拉框是否打开的控制状态
  const countryCodeRef = useRef<HTMLDivElement>(null); // 区号组件物理 DOM 绑定实例
  const [phoneNumber, setPhoneNumber] = useState(""); // 电话号码正文状态

  const [role, setRole] = useState(""); // 系统预设角色，初始为空
  const [isRoleOpen, setIsRoleOpen] = useState(false); // 角色下拉框展开布尔值
  const roleRef = useRef<HTMLDivElement>(null); // 角色组件物理 DOM 绑定实例

  const [isLoading, setIsLoading] = useState(false); // 声明注册按钮加载中状态
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null); // 声明保存后端返回错误的变量
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // 声明保存成功消息提示的变量
  const [hasSubmitted, setHasSubmitted] = useState(false); // 声明是否已经尝试提交的布尔值

  const roleOptions = [ // 系统角色静态配置项
    { value: "superadmin", label: "Super Admin" }, // 超级管理员项
    { value: "admin", label: "Admin" }, // 普通管理员项
    { value: "doctor", label: "Doctor" }, // 医生项
  ]; // 配置结束

  const countryCodes = [ // 系统支持的电话号码区号国家配置项
    { code: "+65", label: "SG (+65)" }, // 新加坡
    { code: "+60", label: "MYR (+60)" } // 马来西亚
  ]; // 配置结束

  useEffect(() => { // 声明辅助特效钩子，用于监听外部点击自动缩回下拉框
    function handleClickOutside(event: MouseEvent) { // 检查点击范围逻辑
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) { // 若点击区域不处于角色下拉框内
        setIsRoleOpen(false); // 强制关闭角色下拉框
      } // 结束判断
      if (countryCodeRef.current && !countryCodeRef.current.contains(event.target as Node)) { // 若点击不处于区号下拉框内
        setIsCountryCodeOpen(false); // 强制关闭区号下拉框
      } // 结束判断
    } // 结束回调逻辑
    document.addEventListener("mousedown", handleClickOutside); // 绑定鼠标按下监听器
    return () => document.removeEventListener("mousedown", handleClickOutside); // 组件注销时自动解绑
  }, []); // 仅在初次渲染时挂载

  const isValidName = fullName.trim().length > 0; // 检查真实姓名是否输入
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // 正则校验邮箱地址格式
  const isValidRole = role !== ""; // 检查是否在下拉框中选择角色
  const isValidPassword = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(password); // 严格校验密码强度（必须8位以上并带有数字及特殊符号）
  
  // 【优化项 1】：动态判断手机号长度是否合法
  const isValidPhone = countryCode === "+65" // 如果当前是新加坡
    ? phoneNumber.length === 8 // 校验必须等于 8 位数字
    : (phoneNumber.length === 9 || phoneNumber.length === 10); // 如果是马来西亚，校验必须为 9 位或 10 位数字

  const handleRegisterSubmit = async (e: React.FormEvent) => { // 异步提交表单处理动作
    e.preventDefault(); // 阻止原生刷新
    setHasSubmitted(true); // 标记当前表单有过至少一次提交动作

    if (!isValidName || !isValidEmail || !isValidRole || !isValidPassword || !isValidPhone) // 如果任意一项格式不合规
      return; // 截断不再发起网络交互

    setIsLoading(true); // 激活按钮加载特效
    setApiErrorMsg(null); // 清空历史错误
    setSuccessMsg(null); // 清空历史成功提示

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api"; // 读取配置文件 API 地址

    try { // 异常网络处理块
      const response = await fetch(`${BASE_URL}/admin/register`, { // 向后端发送注册后台人员请求
        method: "POST", // 声明使用 POST 方法提交数据
        headers: { "Content-Type": "application/json" }, // 指定传输的内容类型为 Json
        body: JSON.stringify({ // 序列化传输字段 DTO
          fullName, // 真实姓名
          email, // 工作电子邮箱
          role, // 用户系统角色
          password, // 加密密码
          phoneNumber: `${countryCode}${phoneNumber}` // 拼装国家代码和号码后的电话号码串
        }), // 序列化结束
      }); // 请求结束

      const result = await response.json(); // 提取并解析回执内容为 JSON
      const isSuccess = result?.success === true || result?.Success === true; // 检查回执包装包中的业务成功标志

      if (response.ok && isSuccess) { // 请求状态正常且注册业务校验完全成功
        setSuccessMsg("Registration successful! Redirecting to login..."); // 写入注册成功文本
        setTimeout(() => router.push("/admin/login"), 2000); // 2 秒后强制重定向至管理员登录面
      } else { // 否则说明注册逻辑在后端被拦截（例如：邮箱已被注册，密码安全性要求未达到等）
        // 【关键改动】：使用全局错误解析器获取后端返回的真实的错误明细并推送到前台展示
        const errorMessage = parseBackendError(result, "Registration failed."); // 解析获取高精度错误内容
        setApiErrorMsg(errorMessage); // 写入红色提示框状态，动态向管理员展示失败原因
        setIsLoading(false); // 结束加载中动效
      } // 结束分支
    } catch (err: any) { // 捕获网络失败、接口崩溃等错误
      setApiErrorMsg("Cannot connect to server. Please check your backend connection."); // 将错误消息上屏呈现
      setIsLoading(false); // 关闭加载动效
    } // 结束 try
  }; // 结束方法编写

  return ( // 渲染主注册页面
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden">
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && ( // 当后台拦截并给出了说明，渲染红色 Alert
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-red-700">Registration Failed</h4>
              {/* 【关键改动】：动态绑定解析提取出后的后端真实异常详情 */}
              <p className="text-xs text-slate-600 mt-0.5 break-words">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1 shrink-0"><X size={16} /></button>
          </div>
        )}
        {successMsg && (
          <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-6 fade-in duration-300">
            <CheckCircle className="text-emerald-600 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-emerald-700">Registration Successful</h4>
              <p className="text-xs text-slate-600 mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[460px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/20 max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Register</h2>
              <p className="text-slate-500 text-xs mt-1 font-medium">Create your system profile</p>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shrink-0">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleRegisterSubmit} noValidate>
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative flex items-center">
                <User className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidName ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidName
                      ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  }`}
                  placeholder="Enter your full name"
                />
                {isValidName && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
              </div>
              {hasSubmitted && !isValidName && <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Full name is required.</span>}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Work Email</label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidEmail
                      ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900 placeholder:text-red-300"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  }`}
                  placeholder="admin@medicarepro.com"
                />
                {isValidEmail && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
              </div>
              {hasSubmitted && !isValidEmail && <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Valid email is required.</span>}
            </div>

            {/* --- Phone Number Field with Country Code --- */}
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                
                {/* Country Code Dropdown */}
                <div className="relative w-[100px] sm:w-[120px] shrink-0" ref={countryCodeRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryCodeOpen(!isCountryCodeOpen)}
                    className={`w-full h-full flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                      hasSubmitted && !isValidPhone
                        ? "bg-red-50 border-red-300 text-red-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                    }`}
                  >
                    <span>{countryCode}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isCountryCodeOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isCountryCodeOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-[120px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {countryCodes.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setCountryCode(c.code);
                            setPhoneNumber(""); 
                            setIsCountryCodeOpen(false);
                          }}
                          className={`px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                            countryCode === c.code ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium"
                          }`}
                        >
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div className="relative flex-1">
                  <Phone className={`absolute left-3.5 top-3 z-10 ${hasSubmitted && !isValidPhone ? "text-red-400" : "text-slate-400"}`} size={18} />
                  <input
                    type="tel"
                    maxLength={countryCode === "+65" ? 8 : 10}
                    value={phoneNumber}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      setPhoneNumber(onlyNums);
                    }}
                    className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                      hasSubmitted && !isValidPhone
                        ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900 placeholder:text-red-300"
                        : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                    }`}
                    placeholder={countryCode === "+65" ? "8 digits" : "9-10 digits"}
                  />
                  {isValidPhone && <CheckCircle2 className="absolute right-3 top-3 text-emerald-500" size={16} />}
                </div>
              </div>
              {hasSubmitted && !isValidPhone && (
                <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">
                  {countryCode === "+65" ? "Singapore numbers must be exactly 8 digits." : "Malaysia numbers must be 9 or 10 digits."}
                </span>
              )}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">System Role</label>
              <div className="relative" ref={roleRef}>
                <ShieldCheck className={`absolute left-3.5 top-3 z-10 pointer-events-none ${hasSubmitted && !isValidRole ? "text-red-400" : "text-slate-400"}`} size={18} />
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className={`w-full flex items-center justify-between pl-10 pr-3 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidRole ? "bg-red-50 border-red-300 text-red-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                  }`}
                >
                  <span className={role ? "text-slate-900" : "text-slate-400 font-medium"}>
                    {role ? roleOptions.find((o) => o.value === role)?.label : "Select your role"}
                  </span>
                  <ChevronDown size={16} className={`${hasSubmitted && !isValidRole ? "text-red-400" : "text-slate-400"} transition-transform duration-300 ${isRoleOpen ? "rotate-180" : ""}`} />
                </button>
                {isRoleOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {roleOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => { setRole(option.value); setIsRoleOpen(false); }}
                        className={`px-4 py-3 text-sm cursor-pointer flex items-center transition-colors ${
                          role === option.value ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium"
                        }`}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
                {isValidRole && <CheckCircle2 className="absolute right-9 top-3 text-emerald-500 pointer-events-none" size={16} />}
              </div>
              {hasSubmitted && !isValidRole && <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Please select a system role.</span>}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidPassword
                      ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900 placeholder:text-red-300"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  }`}
                  placeholder="Create strong password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-emerald-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className={`mt-2 p-2.5 rounded-lg border flex items-start gap-2 ${hasSubmitted && !isValidPassword ? "bg-red-50 border-red-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                {hasSubmitted && !isValidPassword ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <p className={`text-[10px] font-semibold leading-snug ${hasSubmitted && !isValidPassword ? "text-red-600" : "text-emerald-700"}`}>
                  Min 8 chars, must include numbers & special symbols (!@#$).
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== null}
              className="w-full mt-2 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-80"
            >
              {isLoading || successMsg ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {successMsg ? "Success!" : "Processing..."}
                </span>
              ) : (
                <>Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-5">
            <Link href="/admin/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft size={14} /> Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}