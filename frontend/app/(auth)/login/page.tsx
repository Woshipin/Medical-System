"use client"; // 启用 Next.js 客户端组件模式

import React, { useState } from 'react'; // 引入 React 核心库及状态钩子
import Link from 'next/link'; // 引入 Next.js 声明式导航链接组件
import { useRouter } from 'next/navigation'; // 引入 Next.js 客户端路由导航钩子
import { 
  Leaf, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, 
  Loader2, AlertCircle, CheckCircle, X, CheckCircle2, Info 
} from 'lucide-react'; // 引入图标库中的各类图标
import { useAuth } from '@/app/contexts/AuthContext'; // 引入患者端鉴权上下文

// --- 辅助函数：解析后端返回的各种复杂错误格式并提取干净的文本 ---
const parseBackendError = (result: any): string => {
  if (!result) return "Login failed. Please check your credentials."; // 无返回结果时提供默认报错

  // 1. 如果后端返回了具体的 errors 数组或对象（例如 Identity 的多项校验失败）
  const errors = result.errors || result.Errors || result.data || result.Data; // 多重兼容性检索错误属性
  if (errors) { // 属性不为空时
    if (Array.isArray(errors)) { // 如果是数组格式
      return errors.join(" | "); // 使用管道符将多条错误连接成单行字符串
    } // 结束数组分支
    if (typeof errors === 'object') { // 如果是键值对对象格式（如 { email: [...] }）
      return Object.values(errors) // 展开获取所有的错误值集合
        .flatMap((err: any) => Array.isArray(err) ? err : [err]) // 扁平化多维数组为一维数组
        .join(" | "); // 用管道符合并
    } // 结束对象分支
  } // 结束 errors 校验

  // 2. 如果只有顶层的 message 说明
  return result.message || result.Message || "Login failed. Please check your credentials."; // 返回顶层 message，无则使用默认值
}; // 结束解析

const AlreadyLoggedInAlert = () => { // 处理患者重复登录时的自动拦截组件
  const router = useRouter(); // 声明路由导航
  React.useEffect(() => { // 加载特效钩子
    const timer = setTimeout(() => router.replace('/home'), 2000); // 延迟 2 秒重定向至前台首页
    return () => clearTimeout(timer); // 清除定时器
  }, [router]); // 绑定 router 依赖

  return ( // 渲染提示结构
    <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="relative z-50 bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-white/20 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-emerald-100">
          <Info size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Already Logged In</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          You currently have an active session. No need to log in again.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-full">
          <Loader2 size={14} className="animate-spin" /> Returning to homepage...
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() { // 导出患者登录页面组件
  const router = useRouter(); // 声明路由导航
  const { login, isAuthenticated, isInitialized } = useAuth(); // 从上下文提取患者端登录函数、登录态和初始化标志

  const [email, setEmail] = useState(''); // 初始化邮箱文本状态为空
  const [password, setPassword] = useState(''); // 初始化密码文本状态为空
  const [showPassword, setShowPassword] = useState(false); // 初始化密码是否明文显示的状态

  const [isLoading, setIsLoading] = useState(false); // 初始化按钮提交加载状态为 false
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null); // 初始化存储接口返回错误的变量
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // 初始化存储登录成功消息的变量
  const [hasSubmitted, setHasSubmitted] = useState(false); // 初始化是否尝试提交的布尔值状态

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // 正则校验邮箱合法性
  const isValidPassword = password.trim().length > 0; // 校验密码是否填写

  const handleLoginSubmit = async (e: React.FormEvent) => { // 声明表单提交事件异步处理
    e.preventDefault(); // 阻止浏览器默认页面刷新行为
    setHasSubmitted(true); // 标记表单有过至少一次提交动作

    if (!isValidEmail || !isValidPassword) return; // 本地格式校验未过则直接截断，防无效网络交互

    setIsLoading(true); // 按钮切为 Loading 动效
    setApiErrorMsg(null); // 清空历史错误
    setSuccessMsg(null); // 清空历史成功提示

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api"; // 加载配置文件中的 API 基网

    try { // 异常安全拦截
      const response = await fetch(`${BASE_URL}/auth/login`, { // 向后端提交患者登录请求
        method: 'POST', // 指定使用 POST 方法
        headers: { 'Content-Type': 'application/json' }, // 指定传输格式为 JSON
        body: JSON.stringify({ email, password }), // 序列化传送荷载
      }); // 结束 fetch 请求

      const result = await response.json(); // 解析回执的二进制内容为对象
      
      const isSuccess = result?.success === true || result?.Success === true; // 检查后端回执的业务层是否成功
      const responseData = result?.data || result?.Data; // 检查回执中的数据载荷

      if (response.ok && isSuccess) { // 请求状态正常且业务层表明完全成功时
        if (responseData) { // 如果数据载荷不为空
           const findProp = (obj: any, key: string) => { // 声明不区分属性名大小写的提取方法
             if (!obj) return undefined; // 安全防空
             const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase()); // 模糊匹配键名
             return foundKey ? obj[foundKey] : undefined; // 返回值
           }; // 结束方法

           const authToken = findProp(responseData, 'token'); // 模糊搜寻 Token
           let rawUserData = findProp(responseData, 'user'); // 模糊搜寻嵌套的用户信息
           
           if (!rawUserData) { // 如果数据扁平未包含嵌套 user 属性
               rawUserData = { // 则当前页面直接利用表单自建用户信息
                   id: findProp(responseData, 'id') || '0', // 读取顶层 ID
                   fullName: findProp(responseData, 'fullname') || 'User', // 读取姓名
                   email: email // 写入刚才用户填写的邮箱
               }; // 对象组装完毕
           } // 结束判断

           if (authToken) { // 确认提取到了合法的令牌
               const formattedUser = { // 格式化用户信息对象
                 ...rawUserData, // 结构原始属性
                 id: String(rawUserData.id || rawUserData.Id || "0") // 确保主键 ID 以标准的字符串格式在前台存储
               }; // 格式化完毕

               login(formattedUser, authToken); // 将认证成功状态写入 Auth 登录态上下文，并写入本地 LocalStorage 存储中
               setSuccessMsg("Login successful! Redirecting to dashboard..."); // 写入成功描述
               setTimeout(() => router.push('/home'), 2000); // 2 秒后平滑路由重定向至前台系统主页 `/home`
           } else { // Token 缺失的处理
               setApiErrorMsg("Token missing from server response."); // 错误说明
               setIsLoading(false); // 停止按钮 Loading
           } // 结束 Token 判断
        } else { // 数据载荷缺失
           setApiErrorMsg("Invalid response format: Missing data payload."); // 提示
           setIsLoading(false); // 停止 Loading
        } // 结束负载检测
      } else { // 重点修改：处理后端拦截的情况（比如密码不对、或者角色为管理员却从患者入口登录）
        // 【核心修改】：抓取后端返回的最原始拦截提示信息
        const errorMsg = result?.message || result?.Message || "";

        // 【核心修改】：如果属于“非患者账号”的强行登录拦截，进入特定流程
        if (errorMsg === "请前往后台系统登录") {
          setApiErrorMsg("Your account is not a patient."); // 1. 将警告文字强制重写并显示为英文版的 "Your account is not a patient."
          setIsLoading(false); // 2. 关闭按钮的旋转加载特效
          
          // 3. 开启定时器，在延迟 2.5 秒后（留出时间阅读 Alert 信息），自动平滑跳转至管理端的登录页
          setTimeout(() => {
            router.push('/admin/login'); // 强制路由跳转至管理员登录页
          }, 2500); // 设定 2500 毫秒
        } else { // 【核心修改】：其余常规失败情况（如：账号或密码错误），走标准错误提示，不执行自动跳转
          const parsedError = parseBackendError(result); // 解析常规错误
          setApiErrorMsg(parsedError); // 推送到页面提示框显示
          setIsLoading(false); // 停止按钮旋转
        }
      } // 结束接口业务判断
    } catch (err) { // 捕获未知的网络错误
      console.error("Fetch Error:", err); // 控制台记录
      setApiErrorMsg("Unable to connect to the server. Please ensure the backend is running."); // 将错误消息上屏展示
      setIsLoading(false); // 停止旋转特效
    } // 结束 try-catch 保护
  }; // 结束提交事件处理

  if (!isInitialized) { // 若上下文尚未初始化完毕，显示背景占位，防止未登录和已登录之间闪烁
    return <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500"></div>; // 渲染占位结构
  } // 结束判断

  if (isAuthenticated) { // 若已登录
    return <AlreadyLoggedInAlert />; // 直接重定向到首页
  } // 结束判断

  return ( // 渲染主界面结构
    <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && ( // 只要错误变量 apiErrorMsg 不为空，立刻在顶部浮层弹出 Alert 提示框
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-red-700">Login Failed</h4>
              {/* 【关键展示改动】：此处动态输出后端返回的实际内容，对非患者账号会自动显示 "Your account is not a patient." */}
              <p className="text-sm text-slate-600 mt-1">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
          </div>
        )}

        {successMsg && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 text-slate-800 px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-6 fade-in duration-300">
            <CheckCircle className="text-emerald-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-emerald-700">Login Successful</h4>
              <p className="text-sm text-slate-600 mt-1">{successMsg}</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/30 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse delay-700"></div>

      <Link 
        href="/home" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-teal-900 transition-all text-sm shadow-lg"
      >
        <ArrowLeft size={16} />
        <span className="font-medium hidden sm:block">Back to Home</span>
      </Link>

      <div className="relative z-10 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px] max-h-[92vh] border border-white/50">
        <div className="md:w-1/2 p-8 sm:p-10 lg:p-16 flex flex-col justify-center w-full bg-white overflow-y-auto custom-scrollbar">
          <div className="mb-8">
             <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
                <div className="p-1.5 bg-emerald-500 rounded-full text-white">
                    <Leaf size={14} fill="currentColor" />
                </div>
                <span className="text-sm font-bold text-emerald-800 tracking-tight">GreenLife Med</span>
             </div>
             <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
             <p className="text-slate-500 text-sm">Please log in to your patient portal account.</p>
          </div>

          <form className="space-y-5" onSubmit={handleLoginSubmit} noValidate>
            <div className="group flex flex-col">
               <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500">Email Address</label>
               <div className="relative flex items-center">
                  <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="example@mail.com" 
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all border ${
                        hasSubmitted && !isValidEmail 
                        ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  {isValidEmail && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
               </div>
               {hasSubmitted && !isValidEmail && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Please enter a valid email address.</span>}
            </div>

            <div className="group flex flex-col">
               <div className="flex justify-between items-center mb-1.5">
                   <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                   <Link href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Forgot password?</Link>
               </div>
               <div className="relative flex items-center">
                  <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className={`w-full pl-10 pr-10 py-3 text-sm rounded-xl outline-none transition-all border ${
                        hasSubmitted && !isValidPassword 
                        ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-emerald-600 p-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
               </div>
               {hasSubmitted && !isValidPassword && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Please enter your password.</span>}
            </div>

            <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full mt-4 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
            >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {successMsg ? "Redirecting..." : "Logging in..."}
                  </>
                ) : (
                  <>
                    Log In Now
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <p className="text-slate-500">Don't have an account? <Link href="/register" className="text-emerald-600 font-bold hover:underline">Create one now</Link></p>
          </div>
        </div>

        <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-slate-900">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80')] bg-cover bg-center transform hover:scale-105 transition-transform duration-[20s] opacity-80"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/95 via-teal-900/60 to-transparent mix-blend-multiply"></div>
           
           <div className="absolute inset-0 p-12 flex flex-col justify-end text-white z-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl mb-4 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                     </span>
                     <span className="font-semibold text-emerald-100 text-xs tracking-wide uppercase">System Operational</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Patient-Centric Technology</h3>
                  <p className="text-emerald-50 text-opacity-90 leading-relaxed text-sm">
                    Experience seamless medical management. Your data is protected by military-grade encryption protocols.
                  </p>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}