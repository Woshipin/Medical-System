"use client"; // 启用 Next.js 客户端组件模式

import React, { useState } from 'react'; // 引入 React 核心库及状态钩子
import { Mail, Lock, Activity, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, X, CheckCircle2, Info, Loader2 } from 'lucide-react'; // 引入图标库中的各种状态图标
import Link from 'next/link'; // 引入 Next.js 声明式导航链接组件
import { useRouter } from 'next/navigation'; // 引入 Next.js 客户端路由导航钩子
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'; // 引入管理员鉴权上下文钩子

// --- 辅助函数：解析后端返回的各种复杂错误，并将最真实的提示文本回馈给 UI ---
const parseBackendError = (result: any, defaultMsg: string = "Invalid admin credentials."): string => {
  if (!result) return defaultMsg; // 如果后端没有返回任何有效结果，直接返回默认备用消息

  // 1. 检测 errors 数组或对象属性（主要用于整合 Identity 系统可能返回的多个并发拦截信息）
  const errors = result.errors || result.Errors || result.data || result.Data; // 尝试多重命名匹配抓取 errors 属性
  if (errors) { // 如果找到了错误数据集
    if (Array.isArray(errors)) { // 如果错误数据集是一个纯文本数组
      return errors.join(" | "); // 使用管道符将多条错误连接成单行字符串
    } // 结束数组判断
    if (typeof errors === 'object') { // 如果错误数据集是键值对对象（如验证器字典）
      return Object.values(errors) // 提取出字典内所有的值
        .flatMap((err: any) => Array.isArray(err) ? err : [err]) // 将多维数组和单个字符串铺平成一维数组
        .join(" | "); // 最终连接成单行错误提示
    } // 结束对象判断
  } // 结束 errors 处理

  // 2. 无 errors 节点时，直接获取顶层携带的 message 消息说明（如：“账号或密码错误”、“无权访问后台系统...”）
  return result.message || result.Message || defaultMsg; // 回退读取 message 属性，最终无内容则返回预设的默认备用消息
}; // 结束解析辅助方法

// --- 独立组件：处理管理员重复登录时的强制重定向拦截提示 ---
const AlreadyLoggedInAlert = () => {
  const router = useRouter(); // 初始化路由操作类
  React.useEffect(() => { // 声明页面加载特效钩子
    const timer = setTimeout(() => router.replace('/admin/dashboard'), 2000); // 延迟 2 秒后强制跳转至管理员主控制台
    return () => clearTimeout(timer); // 自动清除未执行的定时器
  }, [router]); // 依赖项为 router 实例

  return ( // 渲染提示界面
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden">
      <div className="relative z-50 bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-white/20 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-emerald-100">
          <Info size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Already Logged In</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          You currently have an active session. No need to login again.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-full">
          <Loader2 size={14} className="animate-spin" /> Returning to dashboard...
        </div>
      </div>
    </div>
  );
};

export default function AdminLoginPage() { // 导出管理员登录主页面组件
  const { login, isAuthenticated, isInitialized } = useAdminAuth(); // 从上下文提取管理员专属的登录、登录态和初始化状态
  const router = useRouter(); // 声明路由导航

  const [email, setEmail] = useState(''); // 声明登录邮箱状态，默认为空
  const [password, setPassword] = useState(''); // 声明登录密码状态，默认为空
  const [showPassword, setShowPassword] = useState(false); // 声明是否明文显示密码的布尔值
  const [isLoading, setIsLoading] = useState(false); // 声明登录按钮提交加载中的状态
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null); // 声明存储后端返回原始错误信息的变量
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // 声明存储登录成功的文本消息变量
  const [hasSubmitted, setHasSubmitted] = useState(false); // 声明表单是否点击过提交的状态变量

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // 正则表达式检测输入的邮箱格式是否合规
  const isValidPassword = password.trim().length > 0; // 检测密码是否输入（去除两端空格后不为空）

  const handleLoginSubmit = async (e: React.FormEvent) => { // 声明表单提交异步处理事件
    e.preventDefault(); // 阻止浏览器原生的提交刷新行为
    setHasSubmitted(true); // 标记表单已完成了一次提交动作
    if (!isValidEmail || !isValidPassword) return; // 如果前台本地校验未通过，直接截断不再发起 API 呼叫

    setIsLoading(true); // 开启按钮加载旋转动效
    setApiErrorMsg(null); // 清空历史残留的错误消息
    setSuccessMsg(null); // 清空历史残留的成功消息

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api"; // 读取系统环境变量中的基础 API 地址

    try { // 开启网络异常保护捕获块
      const response = await fetch(`${BASE_URL}/admin/login`, { // 向后台发送管理员登录请求
        method: 'POST', // 指定提交方法为 POST
        headers: { 'Content-Type': 'application/json' }, // 申明提交的内容为 Json 对象格式
        body: JSON.stringify({ email, password }), // 序列化传输账号与密码
      }); // 结束请求
      
      let result; // 声明接收服务端反序列化后对象的变量
      const contentType = response.headers.get("content-type"); // 抓取请求回执中的 Content-Type 属性值
      
      // 如果 C# 还没重启，返回 404 HTML，直接抛出明显错误提示
      if (response.status === 404) { // 判断如果是 404 未找到异常
         throw new Error("API endpoint not found (404). You MUST stop and restart your C# backend server after adding the new login code."); // 抛出错误指引开发者重启后端
      } // 结束 404 判断

      if (contentType && contentType.toLowerCase().includes("application/json")) { // 确认服务端正常返回了 Json 格式的内容
        result = await response.json(); // 将二进制返回体解析为前端可用对象
      } else { // 否则说明服务端底层发生了未知非 Json 崩溃
        throw new Error(`Server returned non-JSON error (Status: ${response.status}).`); // 抛出格式不匹配异常
      } // 结束回执格式校验

      const isSuccess = result?.success === true || result?.Success === true; // 动态提取后端包装类的 success 字段是否表示成功
      const responseData = result?.data || result?.Data; // 动态提取后端数据负载中的 data 对象内容

      if (response.ok && isSuccess) { // 当网络状态成功且业务数据层也表明完全成功
         if (responseData) { // 如果回执的数据负载不为空
           const findProp = (obj: any, key: string) => { // 定义不区分键名大小写的属性搜寻辅助工具
             if (!obj) return undefined; // 如果对象为空直接返回 undefined
             const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase()); // 模糊匹配全小写键名
             return foundKey ? obj[foundKey] : undefined; // 如果寻获到则返回对应的属性值
           }; // 结束方法定义

           const authToken = findProp(responseData, 'token'); // 模糊搜寻 Token 属性值
           let rawUserData = findProp(responseData, 'user'); // 模糊搜寻嵌套的 user 对象信息
           
           if (!rawUserData) { // 如果后台返回的数据载体较扁平，未包含嵌套的 user 字段
               rawUserData = { // 则当前页面直接利用表单和顶层数据自建临时用户信息
                   id: findProp(responseData, 'id') || '0', // 读取顶层 ID
                   fullName: findProp(responseData, 'fullname') || 'Administrator', // 读取姓名
                   email: email, // 写入刚才用户填入的邮箱
                   role: findProp(responseData, 'role') || 'admin' // 读取角色
               }; // 临时对象拼装结束
           } // 结束判断

           if (authToken) { // 如果确认已经提取到了合法的 JWT Token
               const formattedUser = { // 格式化临时用户信息
                 ...rawUserData, // 结构原始数据
                 id: String(rawUserData.id || rawUserData.Id || "0") // 保证主键 ID 在前台以统一的 String 类型存储
               }; // 格式化结束

               login(formattedUser, authToken); // 调用管理员 Auth 上下文的 login 方法持久化记录状态和令牌
               setSuccessMsg("Welcome back! Accessing dashboard..."); // 在页面渲染登录成功提示
               setTimeout(() => router.push('/admin/dashboard'), 2000); // 2 秒后将管理员强制引导至管理端核心仪表盘
           } else { // 否则说明 Token 不存在
               setApiErrorMsg("Token missing from server response."); // 将错误消息记录并呈现
               setIsLoading(false); // 停止旋转加载效果
           } // 结束 Token 判断
         } else { // 负载数据缺失
            setApiErrorMsg("Invalid response format: Missing data payload."); // 呈现错误提示
            setIsLoading(false); // 关闭加载
         } // 结束负载校验
      } else { // 处理后端拦截的情况
        // 【关键改动】：使用全局错误解析器获取后台返回的各种真实的具体拦截原因
        const errorMsg = parseBackendError(result, "Invalid admin credentials."); // 动态提取底层细节（如：“请使用患者通道登录” 或 “账号或密码错误”）
        setApiErrorMsg(errorMsg); // 将解析后的错误信息推送到页面 alert
        setIsLoading(false); // 关闭加载
      } // 结束响应状态分支
    } catch (err: any) { // 捕获网络、404、或非 JSON 的错误
      setApiErrorMsg(err.message || "Cannot connect to server. Please check your connection."); // 将错误日志推送到界面展示
      setIsLoading(false); // 关闭按钮加载效果
    } // 结束 try
  }; // 结束提交事件编写

  if (!isInitialized) return <div className="h-screen w-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700"></div>; // 如果上下文未完成初始化加载，显示基础占位图防止闪烁

  if (isAuthenticated) { // 如果已经处于登录状态
    return <AlreadyLoggedInAlert />; // 直接渲染强制重定向跳转提示
  } // 结束登录态判断

  return ( // 渲染主界面结构
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden">
      
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && ( // 当后台接口返回了错误内容，渲染顶部的红色 Alert 弹窗
          <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-red-700">Login Failed</h4>
              {/* 【关键改动】：动态展示从后端解析到的详细拦截文字（如：“无权访问后台系统，请使用患者通道登录”） */}
              <p className="text-xs text-slate-600 mt-0.5 break-words">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1 shrink-0"><X size={16} /></button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-2.5 rounded-2xl shadow-xl mb-3">
            <Activity className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center">MedicarePro</h1>
          <p className="text-emerald-50 text-xs mt-1 opacity-90">Admin Management System</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/20 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-slate-800">Login Dashboard</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Please enter your credentials</p>
          </div>

          <form className="space-y-4" onSubmit={handleLoginSubmit} noValidate>
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidEmail 
                    ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="admin@medicarepro.com"
                />
              </div>
              {hasSubmitted && !isValidEmail && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">Valid email is required.</p>
              )}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidPassword 
                    ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {hasSubmitted && !isValidPassword && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">Password is required.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-80"
            >
              {isLoading || successMsg ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Processing...
                  </span>
              ) : (
                  <>Sign In to Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-xs font-medium">
              New administrator?{' '}
              <Link href="/admin/register" className="font-extrabold text-emerald-600 hover:underline transition-all">
                Create Account
              </Link>
            </p>
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