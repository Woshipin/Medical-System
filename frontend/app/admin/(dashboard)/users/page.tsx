"use client"; // 澹版槑璇ョ粍浠朵负 Next.js 瀹㈡埛绔粍浠?
import React, { useState, useEffect, useMemo } from "react"; // 寮曞叆 React 鏍稿績 hooks
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
} from "lucide-react"; // 寮曞叆 Lucide 鍥炬爣搴撲腑鐨勭郴缁熷浘鏍?
import Pagination from "@/components/admin/Pagination"; // 寮曞叆灏佽鐨勫垎椤电粍浠?

// ==========================================
// Environment Variables
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // 璇诲彇閰嶇疆鏂囦欢鐨?API 鎺ュ彛鍩哄噯璺緞

interface SystemUser { // 瀹氫箟绯荤粺鐢ㄦ埛瀹炰綋鐨勬暟鎹粨鏋勬帴鍙ｏ紙闇€涓庡悗绔繑鍥炵殑鏁版嵁涓€鑷达級
  id: number | string; // 鐢ㄦ埛涓婚敭 ID
  fullName: string; // 瀵瑰簲鍚庣 fullName 瀛楁
  email: string; // 鐢靛瓙閭
  phoneNumber: string | null; // 鐢佃瘽鍙风爜锛屽彲涓虹┖
  genderId: number; // 瀵瑰簲鍚庣 genderId 瀛楁
  gender?: { id: number; name: string }; // 鍏宠仈鐨勫閿€у埆瀵硅薄
  role: number; // 瑙掕壊鏁村瀷鍊?
  status: number; // 銆愪慨澶嶃€戯細status 浠?boolean 鍙樻洿涓?number锛? = 鍋滅敤, 1 = 鍚敤锛?
  createdAt: string; // 瀵瑰簲鍚庣 createdAt 瀛楁
}

interface DropdownOption { // 瀹氫箟閫氱敤涓嬫媺妗嗗彲閫夐」鐨勬帴鍙?
  value: number | string | boolean; // 鍙€夐」鐨勫疄闄呭€?
  label: string; // 涓嬫媺妗嗕腑娓叉煋鐨勬枃瀛楁爣绛?
}

// -----------------
// UI Helper Component (Badge)
// -----------------
const Badge = ({ // 澹版槑灏忓窘绔犻€氱敤缁勪欢
  children, // 鍐呴儴宓屽鐨勫瓙鑺傜偣
  variant, // 寰界珷鐨勯厤鑹蹭富棰樺彉浣?
}: {
  children: React.ReactNode;
  variant: "success" | "danger" | "info" | "warning" | "secondary";
}) => {
  const colors = { // 鍚勯厤鑹蹭富棰樺搴旂殑 Tailwind 鏍峰紡绫?
    success: "bg-emerald-100 text-emerald-800 border-emerald-200", // 缁胯壊涓婚
    danger: "bg-red-100 text-red-800 border-red-200", // 绾㈣壊涓婚
    info: "bg-blue-100 text-blue-800 border-blue-200", // 钃濊壊涓婚
    warning: "bg-amber-100 text-amber-800 border-amber-200", // 榛勮壊涓婚
    secondary: "bg-slate-100 text-slate-800 border-slate-200", // 鐏拌壊涓婚
  };
  return ( // 娓叉煋寰界珷鏍峰紡鏍囩
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[variant]}`}>
      {children}
    </span>
  );
};

// -----------------
// Toast Notification Component
// -----------------
const Toast = ({ show, message, type, onClose }: { show: boolean, message: string, type: 'success' | 'error', onClose: () => void }) => { // 澹版槑鍏ㄥ眬寮辨彁绀哄脊绐楃粍浠?
  if (!show) return null; // 濡傛灉涓嶅浜庢樉绀虹姸鎬佸垯涓嶆覆鏌撲换浣?DOM
  return ( // 娓叉煋鎻愮ず妗?
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

export default function UsersPage() { // 瀵煎嚭鐢ㄦ埛绠＄悊涓婚〉闈㈢粍浠?
  // Data states
  const [users, setUsers] = useState<SystemUser[]>([]); // 鍒濆鍖栫郴缁熺敤鎴峰垪琛ㄦ暟鎹?
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]); // 鍒濆鍖栨€у埆涓嬫媺閫夐」鏁版嵁
  const [isLoading, setIsLoading] = useState(true); // 澹版槑鍔犺浇绛夊緟鐘舵€侊紝榛樿涓哄惎鐢?

  // Filter states
  const [searchTerm, setSearchTerm] = useState(""); // 鎼滅储鏍忔枃鏈緭鍏ョ姸鎬?
  const [roleFilter, setRoleFilter] = useState("all"); // 瑙掕壊杩囨护涓嬫媺鐘舵€?
  const [statusFilter, setStatusFilter] = useState("all"); // 婵€娲荤姸鎬佽繃婊ょ姸鎬?
  const [genderFilter, setGenderFilter] = useState("all"); // 鎬у埆杩囨护涓嬫媺鐘舵€?

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // 鍒濆鍖栧綋鍓嶅垎椤电爜涓?1
  const itemsPerPage = 10; // 鍗曢〉鍛堢幇鐨勬暟鎹闄愬埗

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false); // 鎺у埗鏂板/淇敼琛ㄥ崟寮圭獥灞曞紑鐘舵€?
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // 鎺у埗璇︽儏鏌ョ湅寮圭獥灞曞紑鐘舵€?
  const [modalMode, setModalMode] = useState<"create" | "edit">("create"); // 鏍囪琛ㄥ崟寮圭獥澶勪簬鏂板(create)杩樻槸缂栬緫(edit)鐘舵€?

  // Form and validation states
  const [formData, setFormData] = useState<any>({}); // 瀛樻斁琛ㄥ崟杈撳叆瀹炰綋鏁版嵁
  const [phoneCode, setPhoneCode] = useState("+65"); // 瀛樺偍鐢佃瘽鍙风爜鍥藉鍖哄彿浠ｇ爜锛岄粯璁ゆ柊鍔犲潯 +65
  const [phoneBody, setPhoneBody] = useState(""); // 瀛樺偍鐢佃瘽鍙风爜绾鏂囨暟瀛?
  const [errors, setErrors] = useState<Record<string, string>>({}); // 瀛樻斁琛ㄥ崟鏍￠獙澶辫触鐨勯敊璇瓧鍏?
  const [showPassword, setShowPassword] = useState(false); // 鎺у埗瀵嗙爜妗嗘槸鍚︽槑鏂囧彲瑙佺殑甯冨皵鍊?

  // Delete and notification states
  const [viewData, setViewData] = useState<SystemUser | null>(null); // 淇濆瓨鏌ョ湅璇︽儏妯℃€佹褰撳墠鍔犺浇鐨勫崟鏉″疄浣撴暟鎹?
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false); // 鍒犻櫎纭绾㈣壊寮圭獥鐘舵€?
  const [userToDelete, setUserToDelete] = useState<number | string | null>(null); // 瀛樺偍褰撳墠绛夊緟琚垹闄ょ殑鐢ㄦ埛鐨?ID
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: "success" }); // 鍏ㄥ眬 Toast 鎻愮ず鐘舵€?

  const showToast = (type: 'success' | 'error', message: string) => { // 澹版槑瑙﹀彂寮辨彁绀烘柟娉?
    setToast({ show: true, type, message }); // 寮€鍚脊绐楀苟濉厖鍐呭
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000); // 4绉掑悗鑷姩閿€姣佹彁绀?
  };

  const getAuthHeaders = () => { // 鑾峰彇褰撳墠鎼哄甫 Token 鐨勭粺涓€ HTTP 鎶ュご鏂规硶
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""; // 瀹夊叏鑾峰彇 LocalStorage 涓殑 Token
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }; // 缁勮 Headers
  };

  const fetchData = async () => { // 寮傛鑾峰彇鍚庡彴鎵€鏈夊熀纭€鏁版嵁鐨勬柟娉?
    try {
      setIsLoading(true); // 鎵撳紑鍔犺浇绛夊緟涓挋灞?
      const [usersRes, gendersRes] = await Promise.all([ // 鍚堝苟鍚屾椂鍚戝悗绔媺鍙栫敤鎴峰垪琛ㄥ拰鎬у埆瀛楀吀鏁版嵁
        fetch(`${API_BASE_URL}/user`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/genders`, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok) { // 鐢ㄦ埛鍒楄〃鑾峰彇鎴愬姛
        const json = await usersRes.json(); // 瑙ｆ瀽鏁版嵁
        setUsers(json.data || []); // 娉ㄥ叆鐢ㄦ埛鐘舵€?
      }
      if (gendersRes.ok) { // 鎬у埆瀛楀吀鎷夊彇鎴愬姛
        const json = await gendersRes.json(); // 瑙ｆ瀽鏁版嵁
        setGenderOptions((json.data || []).map((g: any) => ({ value: g.id, label: g.name }))); // 鏄犲皠杞负涓嬫媺妗嗘墍闇€ DTO 鏍煎紡骞舵敞鍏ョ姸鎬?
      }
    } catch (error) { // 鎹曡幏璇锋眰寮傚父
      console.error("Error fetching data:", error); // 鎺у埗鍙拌褰?
      showToast("error", "Failed to load user database."); // 瑙﹀彂閿欒鎻愮ず
    } finally {
      setIsLoading(false); // 鍏抽棴鍔犺浇钂欏眰
    }
  };

  useEffect(() => { // 棣栨鍔犺浇鎵ц鍒濆鍖栨媺鍙?
    fetchData(); // 鍛煎彨鎷夊彇
  }, []); // 渚濊禆椤逛负绌?

  // Reset to page 1 when filters change
  useEffect(() => { // 鐩戝惉浠绘剰杩囨护鍣ㄩ」鍙戠敓鍙樺姩
    setCurrentPage(1); // 鍙杩囨护鍣ㄦ敼鍙橈紝寮哄埗閲嶇疆鍒嗛〉鍥炵 1 椤?
  }, [searchTerm, roleFilter, statusFilter, genderFilter]); // 鐩戝惉杩囨护鍣ㄤ緷璧?

  const getRoleInfo = (roleInt: number) => { // 瑙ｆ瀽鏁板瓧瑙掕壊瀵瑰簲鐨勫墠绔窘绔犳牱寮忓悕绉板拰閰嶈壊鐨勮緟鍔╁嚱鏁?
    switch (roleInt) {
      case 0: return { name: "Super Admin", color: "danger" }; // 绾㈣壊瓒呯骇绠＄悊鍛?
      case 1: return { name: "Admin", color: "info" }; // 钃濊壊鏅€氱鐞嗗憳
      case 3: return { name: "Patient", color: "success" }; // 缁胯壊鎮ｈ€?
      default: return { name: "Unknown", color: "secondary" }; // 鐏拌壊鏈煡
    }
  };

  const filteredUsers = useMemo(() => { // 绾墠绔鎴风妫€绱㈢殑楂樻€ц兘杩囨护璁＄畻灞炴€?
    return users.filter((user) => { // 瀵瑰唴瀛樹腑鐨勫叏閮ㄦ暟鎹鎵ц閬嶅巻杩囨护
      const matchSearch = // 鎼滅储妗嗗尮閰嶏細濮撳悕銆侀偖绠辨垨鐢佃瘽
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm);
      const matchRole = roleFilter === "all" || user.role.toString() === roleFilter; // 瑙掕壊涓嬫媺杩囨护
      
      // 銆愪慨澶嶃€戯細閰嶅悎鏁村瀷鍙樺姩锛岃繘琛屽瓧绗︿覆鏍煎紡杞崲鍒ゅ畾 (0 鎴?1)
      const matchStatus = statusFilter === "all" || user.status?.toString() === statusFilter; 
      const matchGender = genderFilter === "all" || user.genderId?.toString() === genderFilter; // 鎬у埆涓嬫媺杩囨护
      return matchSearch && matchRole && matchStatus && matchGender; // 杩斿洖澶嶅悎浜ら泦缁撴灉
    });
  }, [users, searchTerm, roleFilter, statusFilter, genderFilter]); // 鐩戝惉渚濊禆椤硅绠?

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage); // 渚濇嵁杩囨护鍚庣殑鏁版嵁闆嗗ぇ灏忚绠楁€婚〉鏁?
  const paginatedUsers = useMemo(() => { // 鎴彇鍗曢〉灞曠幇鏁版嵁闆嗙殑璁＄畻灞炴€?
    const startIndex = (currentPage - 1) * itemsPerPage; // 璁＄畻鍋忕Щ璧峰閲?
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage); // 鎴彇鎸囧畾琛屾暟
  }, [filteredUsers, currentPage, itemsPerPage]); // 鐩戝惉渚濊禆椤?

  // ---------------
  // Modal Handlers
  // ---------------
  const openCreateModal = () => { // 寮€鍚柊澧炲脊绐楃殑鏂规硶
    setModalMode("create"); // 璁剧疆妯″紡涓?create锛堝垱寤猴級
    setErrors({}); // 娓呯┖閿欒娈嬬暀
    setShowPassword(false); // 瀵嗙爜妗嗗己鍒跺鍘熶负闅愯棌
    setFormData({ // 鍒濆鍖栧～鍏呰〃鍗曞睘鎬э紙灞炴€у悕涓庡悗绔?UserCreateDto 涓€鑷达級
      fullName: "", 
      email: "", 
      password: "", 
      genderId: genderOptions.length > 0 ? genderOptions[0].value : "", 
      role: 3, 
      status: 1, // 銆愪慨澶嶃€戯細甯冨皵鐘舵€侀粯璁ゅ€兼敼涓烘暣鍨嬬姸鎬佸€?1 (鍚敤)
    });
    setPhoneCode("+65"); // 榛樿鏂板姞鍧″尯鍙?
    setPhoneBody(""); // 鐢佃瘽涓虹┖
    setIsModalOpen(true); // 灞曞紑寮圭獥
  };

  const openEditModal = (user: SystemUser) => { // 寮€鍚紪杈戜慨鏀瑰脊绐楃殑鏂规硶
    setModalMode("edit"); // 璁剧疆妯″紡涓?edit锛堜慨鏀癸級
    setErrors({}); // 娓呯┖鏍￠獙瀛楀吀
    setShowPassword(false); // 闅愯棌瀵嗙爜
    setFormData({ // 娣卞害濉厖閫変腑鏁版嵁琛岀殑宸叉湁鏁版嵁锛屽苟鏄犲皠涓?DTO 鎺ユ敹鐨勫瓧娈?
      id: user.id, 
      fullName: user.fullName || "", 
      email: user.email || "", 
      password: "", 
      genderId: user.genderId || (genderOptions.length > 0 ? genderOptions[0].value : ""), 
      role: user.role, 
      status: user.status ?? 1, // 銆愪慨澶嶃€戯細缂栬緫杞藉叆鐘舵€佷慨鏀逛负鏀寔鏁村瀷 (1 鎴?0)
    });

    if (user.phoneNumber?.startsWith("+60")) { // 鎷嗗垎鍖哄彿鍜岀數璇濇鏂囷細濡傛灉鏄┈鏉ヨタ浜?
      setPhoneCode("+60"); // 璁剧疆鍖哄彿涓?+60
      setPhoneBody(user.phoneNumber.replace("+60", "")); // 鏇挎崲鍓ョ鍑虹數璇濆彿鐮佹鏂?
    } else { // 鍚﹀垯榛樿鎸夌収鏂板姞鍧?
      setPhoneCode("+65"); // 璁剧疆鍖哄彿 +65
      setPhoneBody((user.phoneNumber || "").replace("+65", "")); // 鍓ョ姝ｆ枃
    }
    setIsModalOpen(true); // 灞曞紑寮圭獥
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { // 缁熶竴澶勭悊琛ㄥ崟鎺т欢鍊兼敼鍙樼殑閫氱敤浜嬩欢鏂规硶
    const { name, value } = e.target; // 瑙ｆ瀯鑾峰彇鍏冪礌鍚嶇О鍜屽€?
    setFormData((prev: any) => ({ ...prev, [name]: value })); // 娣卞害鍚屾鏇存柊鏁版嵁鐘舵€?
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); // 濡傛灉璇ュ瓧娈靛師鍏堝瓨鐣欐牎楠岄敊璇紝鎶归櫎閿欒鎻愮ず
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => { // 涓撻棬闄愬埗鐢佃瘽鏂囨湰妗嗗彧鑳藉啓鍏ユ暟瀛楃殑杈撳叆鐩戞帶浜嬩欢
    setPhoneBody(e.target.value.replace(/\D/g, "")); // 姝ｅ垯寮哄埗鎴柇骞剁Щ绉婚櫎杩欓潪鏁板瓧瀛楃
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" })); // 鎶归櫎鐢佃瘽楠岃瘉閿欒
  };

  const handleSave = async () => { // 琛ㄥ崟鎻愪氦淇濆瓨锛堝垱寤哄拰淇敼锛夌殑鏍稿績涓氬姟澶勭悊寮傛鏂规硶
    const newErrors: Record<string, string> = {}; // 澹版槑灞€閮ㄤ复鏃堕敊璇瘝鍏?
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 閭鏍煎紡姝ｅ垯
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/; // 瀵嗙爜寮哄害姝ｅ垯锛堟渶灏?浣嶏紝鍖呭惈瀛楁瘝鍜屾暟瀛楋級

    if (!formData.fullName || !formData.fullName.trim()) newErrors.fullName = "Please enter full name."; // 鏍￠獙濮撳悕闈炵┖
    if (!formData.email || !formData.email.trim() || !emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address."; // 鏍￠獙閭闈炵┖鍙婃牸寮?
    
    if (modalMode === "create" && !formData.password) { // 鏍￠獙鏂板鏃跺瘑鐮侀潪绌?
      newErrors.password = "Password is required for new users.";
    } else if (formData.password && !passwordRegex.test(formData.password)) { // 鏍￠獙杈撳叆鐨勫瘑鐮佸悎娉曞己搴?
      newErrors.password = "Min 6 characters, including letters & numbers.";
    }

    if (phoneCode === "+65" && phoneBody && phoneBody.length !== 8) { // 鏂板姞鍧″彿鐮侀檺鍒跺繀椤荤瓑浜?8 浣嶆暟瀛?
      newErrors.phone = "Singapore numbers must be exactly 8 digits.";
    } else if (phoneCode === "+60" && phoneBody && (phoneBody.length < 9 || phoneBody.length > 10)) { // 椹潵瑗夸簹闄愬埗 9 鍒?10 浣嶆暟瀛?
      newErrors.phone = "Malaysia numbers must be 9 or 10 digits.";
    } else if (!phoneBody) { // 鐢佃瘽鍙风爜姝ｆ枃涓虹┖鏍￠獙
      newErrors.phone = "Please enter phone number.";
    }

    if (Object.keys(newErrors).length > 0) { // 濡傛灉涓存椂瀛楀吀涓惈鏈夋姤閿欎俊鎭紝璇存槑鏈€氳繃鍓嶇鍩烘湰鏍￠獙
      setErrors(newErrors); // 瑙﹀彂椤甸潰鎶ラ敊鏄剧ず骞剁孩妗嗛珮浜?
      return; // 闃绘柇鏁版嵁鎻愪氦
    }

    try {
      // 娣卞害鏍煎紡鍖栨彁鍙?status 鏁村瀷鍊硷細1 浠ｈ〃鍚敤锛? 浠ｈ〃鍋滅敤
      const targetStatusValue = (formData.status === "1" || formData.status === 1 || formData.status === "true" || formData.status === true) ? 1 : 0;

      const payload: any = { // 缁勮鍙戦€佺粰鍚庡彴鐨勬暟鎹綋杞借嵎 DTO
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: `${phoneCode}${phoneBody}`, // 鎷艰鍥藉浠ｇ爜鐨勭數璇濆彿鐮佹鏂?
        genderId: Number(formData.genderId), // 纭繚鎬у埆 ID 涓烘鏁?
        role: Number(formData.role), // 纭繚瑙掕壊涓烘暟瀛楁灇涓惧瀷
        status: targetStatusValue, // 銆愪慨澶嶃€戯細浼犲叆绗﹀悎鍚庣 DTO 瑕佹眰鐨勬暣鍨嬬姸鎬佸€硷紙0 鎴?1锛夛紝閬垮厤 JSON 瑙ｆ瀽澶辫触鎶?400 閿欒
      };

      if (modalMode === "edit" && !formData.password) { // 缂栬緫淇敼妯″紡涓嬶紝濡傛灉娌℃湁杈撳叆瀵嗙爜锛屽墺绂昏瀛楁锛屼笉瑕嗙洊鏁版嵁搴撳瘑鐮?
        delete payload.password; // 鐗╃悊鍒犻櫎
      }

      // 鍔ㄦ€佺‘瀹?API URL 鍜?HTTP method锛氬垱寤烘ā寮忚蛋 POST锛岀紪杈戞ā寮忚蛋 PUT骞跺甫 ID
      const url = modalMode === "create" ? `${API_BASE_URL}/user` : `${API_BASE_URL}/user/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) }); // 鍙戣捣 fetch 璋冪敤

      if (res.ok) { // 涓氬姟鎵ц鎴愬姛
        setIsModalOpen(false); // 鍏抽棴琛ㄥ崟寮圭獥
        showToast("success", modalMode === "create" ? "User created successfully!" : "User updated successfully!"); // 瑙﹀彂鎴愬姛 Toast 
        fetchData(); // 閲嶆柊鎷夊彇鍚庡彴鏈€鏂板垪琛ㄥ苟鏇存柊琛ㄦ牸灞曠ず
      } else { // 涓氬姟琚悗鍙版嫤鎴牎楠屽け璐ワ紙濡傦細閭鍗犵敤锛?
        const errorData = await res.json(); // 瑙ｆ瀽鍚庣杩斿洖閿欒淇℃伅 JSON 鍖?
        const fieldErrors = errorData.errors || errorData.validationErrors; // 鑾峰彇鍚庣杩斿洖鐨勫垎绫诲瓧娈靛叿浣撲笉鍚堣璇存槑鎻忚堪
        
        if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) { // 濡傛灉瀛樺湪鍚庣瀛楁鎶ラ敊缁撴瀯
          const backendMappedErrors: Record<string, string> = {}; // 鏂板缓涓存椂鍚庣閿欒鏄犲皠璇嶅吀
          Object.keys(fieldErrors).forEach((key) => { // 閬嶅巻涓嶅悎瑙勫垎绫?
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1); // 淇濊瘉瀛楁椹煎嘲杞寲濂戝悎鍓嶇 key
            backendMappedErrors[camelKey] = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key]; // 鏄犲皠杞崲骞惰祴鍏?
          });
          setErrors(backendMappedErrors); // 鍔ㄦ€侀〉闈㈡帶浠惰竟妗嗙垎绾㈠苟杩涜璀﹀憡鏂囧瓧鎸囧悜
          showToast("error", errorData.message || "Please fix the highlighted errors."); // 灞曠ず寮辨彁绀?
        } else {
          showToast("error", errorData.message || "Failed to save user data."); // 灞曠ず寮辨彁绀?
        }
      }
    } catch (err) { // 鎹曡幏缃戠粶閿欒
      console.error(err); // 璁板綍鏃ュ織
      showToast("error", "A network error occurred. Please try again."); // 瑙﹀彂缃戠粶璀﹀憡鎻愮ず
    }
  };

  const confirmDelete = async () => { // 纭寮傛褰诲簳鍒犻櫎鐢ㄦ埛鐨勬柟娉?
    if (!userToDelete) return; // 闃茬┖
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userToDelete}`, { method: "DELETE", headers: getAuthHeaders() }); // 鍙戦€?HTTP DELETE 鎺ュ彛璋冪敤
      if (res.ok) { // 鍒犻櫎鎴愬姛
        showToast("success", "User deleted successfully."); // 灞曠ず鎴愬姛鎻愮ず
        fetchData(); // 鍒锋柊琛ㄦ牸鏁版嵁
      } else { // 寮傚父
        let errorMessage = "Failed to delete user.";
        try {
          const errorData = await res.json(); // 鎻愬彇鎶ラ敊
          errorMessage = errorData.message || errorMessage; // 鍐欏叆
        } catch (parseError) {
          console.error("Non-JSON error returned");
        }
        showToast("error", errorMessage); // 灞曠ず寮傚父鎻愮ず
      }
    } catch (err) {
      console.error(err);
      showToast("error", "A network error occurred while deleting.");
    } finally {
      setIsDeleteAlertOpen(false); // 鍏抽棴纭寮圭獥
      setUserToDelete(null); // 娓呯┖涓存椂缂撳瓨
    }
  };

  return (
    // ==========================================
    // 銆愬竷灞€璁捐銆?
    // 灏嗗師鏈夌殑 max-w-[1400px] 涓?lg:px-8 鏀逛负妗岄潰绔?xl鍙婁互涓?鑷€傚簲浼稿睍鍏ㄥ锛歺l:max-w-full xl:px-4 2xl:px-6
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
            {/* 銆愪慨澶嶃€戯細灏嗘縺娲荤姸鎬佽繃婊ゅ櫒鏄犲皠鍖归厤涓烘暣鍨嬫暟鎹€夐」锛? 鍜?1锛?*/}
            <select className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-white transition cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
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
                      {/* 銆愪慨澶嶃€戯細琛ㄦ牸椤规覆鏌撲慨鏀逛负鏁村瀷鐘舵€?(user.status === 1) 鍒嗘祦 */}
                      <td className="px-5 py-3"><Badge variant={user.status === 1 ? "success" : "danger"}>{user.status === 1 ? "Active" : "Inactive"}</Badge></td>
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
      {/* Create / Edit Modal                       */}
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
                    <input type="text" name="fullName" value={formData.fullName || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.fullName ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="John Doe" />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[11px] mt-1.5">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'}`}><Mail className="w-4 h-4" /></div>
                    <input type="email" name="email" value={formData.email || ""} onChange={handleInputChange} className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.email ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="user@example.com" />
                  </div>
                  {errors.email && <p className="text-red-500 text-[11px] mt-1.5">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password {modalMode === "edit" && <span className="text-slate-400 font-medium ml-1 lowercase">(Leave blank to keep)</span>}</label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'}`}><Lock className="w-4 h-4" /></div>
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password || ""} onChange={handleInputChange} className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors border ${errors.password ? "bg-red-50 border-red-300 text-red-500 placeholder-red-300 focus:ring-2 focus:ring-red-200" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"}`} placeholder="Min 6 chars, letters & numbers" />
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
                    <select name="genderId" value={formData.genderId || ""} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                      {genderOptions.map((g) => (<option key={g.value as string} value={g.value as string}>{g.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">System Role</label>
                    <div className="relative">
                      <select name="role" value={formData.role ?? 3} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
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
                      {/* 銆愪慨澶嶃€戯細鐘舵€佷笅鎷夌紪杈戞鐨勫€硷紝鏀寔鏁板瓧瀛楃琛ㄧず锛?1"涓哄惎鐢紝"0"涓哄仠鐢級 */}
                      <select name="status" value={formData.status !== undefined ? formData.status.toString() : "1"} onChange={handleInputChange} className="appearance-none w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
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
                  // 銆愪慨澶嶃€戯細鏌ョ湅妯℃€佹涓殑鐘舵€侊紝淇敼涓洪€氳繃 (viewData.status === 1) 鏂瑰紡鍒ゆ柇骞舵覆鏌撳窘绔?
                  { label: "Status", value: viewData.status === 1 ? "Active" : "Inactive", icon: CheckCircle2, isBadge: true, variant: viewData.status === 1 ? "success" : "danger" },
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
