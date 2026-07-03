import React, { useState, useEffect } from "react";
import { User } from "./types";
import { getStoredAuth, setStoredAuth, apiRequest } from "./lib/api";
import BooksList from "./components/BooksList";
import HomeLanding from "./components/HomeLanding";
import AboutUs from "./components/AboutUs";
import EventsView from "./components/EventsView";
import MyAccount from "./components/MyAccount";
import AdminBooks from "./components/AdminBooks";
import AdminBorrowRecords from "./components/AdminBorrowRecords";
import AdminUsers from "./components/AdminUsers";
import AdminReports from "./components/AdminReports";
import { 
  Library, User as UserIcon, LogIn, LogOut, ShieldAlert, BookOpen, 
  Settings, ClipboardList, BarChart2, Shield, Eye, EyeOff, UserPlus, Info, CheckCircle,
  LayoutDashboard, ListCollapse, Users, History, BookmarkCheck, FileBarChart2, Award,
  Sun, Moon
} from "lucide-react";
import AdminMembershipRequests from "./components/AdminMembershipRequests";
import { ConfirmModal } from "./components/ConfirmModal";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("lms_theme") as "light" | "dark") || "light";
  });

  const [language, setLanguage] = useState<"vi" | "en">(() => {
    return (localStorage.getItem("lms_lang") as "vi" | "en") || "vi";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("lms_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lms_lang", language);
  }, [language]);

  const [auth, setAuth] = useState(() => {
    const stored = getStoredAuth();
    if (!stored.user) {
      return {
        token: null,
        user: {
          id: "guest",
          fullName: "Khách (Guest)",
          email: "",
          role: "Guest",
          isLocked: false,
          createdAt: new Date().toISOString()
        } as User
      };
    }
    return stored;
  });
  const [currentView, setCurrentView] = useState<string>("home");
  const [viewParams, setViewParams] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const openAuthModal = (mode: "login" | "register" | "forgot" | "reset") => {
    setAuthMode(mode);
    setEmail("");
    setPassword("");
    setFullName("");
    setPhoneNumber("");
    setResetCode("");
    setNewPassword("");
    setAuthError(null);
    setShowAuthModal(true);
  };

  const navigateView = (view: string, params: any = null) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // General Notification Banners
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Hook to handle expired tokens
  useEffect(() => {
    const handleAuthExpired = () => {
      setAuth({
        token: null,
        user: {
          id: "guest",
          fullName: "Khách (Guest)",
          email: "",
          role: "Guest",
          isLocked: false,
          createdAt: new Date().toISOString()
        } as User
      });
      setStoredAuth(null, null, null);
      setCurrentView("home");
      showNotification("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
    };

    window.addEventListener("auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth_expired", handleAuthExpired);
    };
  }, []);

  // Refresh user profile on mount to get updated data (like membershipTier)
  useEffect(() => {
    if (auth.token && auth.user?.id !== "guest") {
      apiRequest<User>("/api/users/me")
        .then(res => {
          if (res.success && res.data) {
            setAuth(prev => {
              const updated = { ...prev, user: res.data };
              setStoredAuth(prev.token, res.data);
              return updated;
            });
          }
        });
    }
  }, [auth.token]);

  // Default to Dashboard (admin_reports) for Admin/Librarian upon login
  useEffect(() => {
    if (auth.user && (auth.user.role === "Admin" || auth.user.role === "Librarian")) {
      setCurrentView("admin_reports");
    } else {
      setCurrentView("home");
    }
  }, [auth.user?.id]);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    if (!loginEmail || !loginPassword) {
      setAuthError("Vui lòng điền đầy đủ email và mật khẩu.");
      setAuthLoading(false);
      return;
    }

    const res = await apiRequest<{ accessToken: string; token: string; refreshToken: string; user: User }>("/api/auth/login", "POST", {
      email: loginEmail,
      password: loginPassword,
    });

    if (res.success && res.data) {
      const { accessToken, token, refreshToken, user } = res.data;
      const actualToken = token || accessToken;
      setAuth({ token: actualToken, user });
      setStoredAuth(actualToken, user, refreshToken);
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
      showNotification("Đăng nhập tài khoản thành công!", "success");
    } else {
      if (res.errors && res.errors.length > 0) {
        setAuthError(res.errors.join(". "));
      } else {
        setAuthError(res.message);
      }
    }
    setAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (!email || !password || !fullName) {
      setAuthError("Họ tên, email và mật khẩu là các trường bắt buộc.");
      setAuthLoading(false);
      return;
    }

    const res = await apiRequest<{ accessToken: string; token: string; refreshToken: string; user: User }>("/api/auth/register", "POST", {
      email,
      password,
      fullName,
      phoneNumber: phoneNumber || undefined,
    });

    if (res.success && res.data) {
      const { accessToken, token, refreshToken, user } = res.data;
      const actualToken = token || accessToken;
      setAuth({ token: actualToken, user });
      setStoredAuth(actualToken, user, refreshToken);
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
      showNotification("Đăng ký tài khoản thành công!", "success");
    } else {
      if (res.errors && res.errors.length > 0) {
        setAuthError(res.errors.join(". "));
      } else {
        setAuthError(res.message);
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    setShowLogoutConfirm(false);
    const storedRefreshToken = localStorage.getItem("lms_refresh_token");
    await apiRequest("/api/auth/logout", "POST", { refreshToken: storedRefreshToken });
    setAuth({
      token: null,
      user: {
        id: "guest",
        fullName: "Khách (Guest)",
        email: "",
        role: "Guest",
        isLocked: false,
        createdAt: new Date().toISOString()
      } as User
    });
    setStoredAuth(null, null, null);
    setCurrentView("home");
    showNotification("Đã đăng xuất tài khoản thành công.", "success");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const res = await apiRequest("/api/auth/forgot-password", "POST", { email });
    if (res.success) {
      showNotification(res.message, "success");
      setAuthMode("reset");
    } else {
      setAuthError(res.message);
    }
    setAuthLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const res = await apiRequest("/api/auth/reset-password", "POST", {
      email,
      token: resetCode,
      newPassword: newPassword
    });

    if (res.success) {
      showNotification(res.message, "success");
      setAuthMode("login");
      setPassword("");
      setResetCode("");
      setNewPassword("");
    } else {
      setAuthError(res.message);
    }
    setAuthLoading(false);
  };

  const loginDemoUser = (role: "Admin" | "Librarian" | "Member") => {
    let demoEmail = "member@library.com";
    if (role === "Admin") demoEmail = "admin@library.com";
    if (role === "Librarian") demoEmail = "librarian@library.com";

    handleLogin(undefined, demoEmail, "Member123");
  };

  const renderView = () => {
    switch (currentView) {
      case "home":
        return (
          <HomeLanding 
            user={auth.user} 
            onNavigateView={navigateView} 
            onOpenAuth={openAuthModal} 
            onSuccessNotification={(msg) => showNotification(msg, "success")} 
            language={language}
          />
        );

      case "catalog":
        return (
          <BooksList 
            user={auth.user} 
            onSuccessNotification={(msg) => showNotification(msg, "success")} 
            initialSearch={viewParams?.search}
            initialCategory={viewParams?.category || viewParams?.collection}
            onOpenAuth={openAuthModal}
            language={language}
          />
        );

      case "about":
        return (
          <AboutUs 
            onNavigateView={navigateView} 
            onOpenAuth={openAuthModal} 
            language={language}
          />
        );

      case "events":
        return (
          <EventsView
            user={auth.user}
            onOpenAuth={openAuthModal}
            onSuccessNotification={(msg) => showNotification(msg, "success")}
            language={language}
          />
        );
      
      case "my_account":
        return <MyAccount user={auth.user} onSuccessNotification={(msg) => showNotification(msg, "success")} language={language} onOpenAuth={openAuthModal} />;

      case "admin_books":
        if (!auth.user || (auth.user.role !== "Admin" && auth.user.role !== "Librarian")) {
          return <ForbiddenScreen />;
        }
        return <AdminBooks onSuccessNotification={(msg) => showNotification(msg, "success")} language={language} />;

      case "admin_borrows":
        if (!auth.user || (auth.user.role !== "Admin" && auth.user.role !== "Librarian")) {
          return <ForbiddenScreen />;
        }
        return <AdminBorrowRecords onSuccessNotification={(msg) => showNotification(msg, "success")} language={language} />;

      case "admin_users":
        if (!auth.user || auth.user.role !== "Admin") {
          return <ForbiddenScreen />;
        }
        return <AdminUsers onSuccessNotification={(msg) => showNotification(msg, "success")} language={language} />;

      case "admin_membership_requests":
        if (!auth.user || auth.user.role !== "Admin") {
          return <ForbiddenScreen />;
        }
        return <AdminMembershipRequests onSuccessNotification={(msg) => showNotification(msg, "success")} language={language} />;

      case "admin_reports":
        if (!auth.user || (auth.user.role !== "Admin" && auth.user.role !== "Librarian")) {
          return <ForbiddenScreen />;
        }
        return <AdminReports language={language} />;

      default:
        return (
          <HomeLanding 
            user={auth.user} 
            onNavigateView={navigateView} 
            onOpenAuth={openAuthModal} 
            onSuccessNotification={(msg) => showNotification(msg, "success")} 
            language={language}
          />
        );
    }
  };

  // Determine if we should display the left-sidebar admin dashboard shell
  const isAdminOrLibrarian = auth.user && (auth.user.role === "Admin" || auth.user.role === "Librarian");

  if (isAdminOrLibrarian) {
    const labels = {
      vi: {
        dashboard: "Dashboard",
        publicCatalog: "Catalog Công Cộng",
        manageCatalog: "Quản lý sách & Catalog",
        borrowRecords: "Lịch sử mượn trả",
        userManagement: "Quản lý thành viên",
        membershipUpgrades: "Yêu cầu nâng cấp gói",
        myHistory: "Hồ sơ cá nhân",
        settings: "Cài đặt hệ thống",
        systemAdmin: "Library Admin",
        logout: "Đăng xuất",
        themeDark: "Chế độ tối",
        themeLight: "Chế độ sáng",
        languageText: "English (UK)"
      },
      en: {
        dashboard: "System Overview",
        publicCatalog: "Public Catalog",
        manageCatalog: "Manage Catalog",
        borrowRecords: "Borrow Records",
        userManagement: "User Management",
        membershipUpgrades: "Membership Upgrades",
        myHistory: "Profile",
        settings: "Settings",
        systemAdmin: "Library Admin",
        logout: "Log Out",
        themeDark: "Dark Theme",
        themeLight: "Light Theme",
        languageText: "Tiếng Việt (VN)"
      }
    }[language];

    // RENDER BEAUTIFUL LEFT SIDEBAR SHELL FOR ADMINS - WITH DARK MODE & LANGUAGE SWITCH
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-row transition-colors duration-200">
        
        {/* Dynamic Global Top Banner Notification */}
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-50">
            <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in ${
              notification.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300" 
                : "bg-red-50 border-red-100 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300"
            }`}>
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <p className="text-xs font-semibold leading-relaxed">{notification.message}</p>
            </div>
          </div>
        )}

        {/* LEFT SIDEBAR NAVIGATION PANEL */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 flex flex-col justify-between shrink-0 sticky top-0 h-screen hidden md:flex transition-colors">
          
          <div className="p-6 space-y-7">
            {/* Logo/Branding */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateView("home")}>
              <div className="bg-indigo-950 p-2.5 rounded-xl text-white shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight block leading-none">Lumina Library</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mt-1">{labels.systemAdmin}</span>
              </div>
            </div>

            {/* Nav Menu Items exactly as Screenshot 2 */}
            <nav className="space-y-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              
              <button
                onClick={() => setCurrentView("admin_reports")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentView === "admin_reports"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{labels.dashboard}</span>
              </button>

              <button
                onClick={() => navigateView("catalog")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentView === "catalog"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{labels.publicCatalog}</span>
              </button>

              <button
                onClick={() => setCurrentView("admin_books")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentView === "admin_books"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ListCollapse className="w-4 h-4" />
                <span>{labels.manageCatalog}</span>
              </button>

              <button
                onClick={() => setCurrentView("admin_borrows")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentView === "admin_borrows"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{labels.borrowRecords}</span>
              </button>

              {auth.user?.role === "Admin" && (
                <button
                  onClick={() => setCurrentView("admin_users")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    currentView === "admin_users"
                      ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{labels.userManagement}</span>
                </button>
              )}

              {auth.user?.role === "Admin" && (
                <button
                  onClick={() => setCurrentView("admin_membership_requests")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    currentView === "admin_membership_requests"
                      ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>{labels.membershipUpgrades}</span>
                </button>
              )}

              <button
                onClick={() => setCurrentView("my_account")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentView === "my_account"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-950 dark:text-slate-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>{labels.myHistory}</span>
              </button>

            </nav>
          </div>

          {/* Bottom items: Settings and User profile badge */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            <button 
              onClick={() => showNotification(language === "vi" ? "Tính năng cài đặt đang được cấu hình..." : "Settings dashboard is loading...", "success")}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>{labels.settings}</span>
            </button>

            <button 
              onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{language === "vi" ? `Giao diện: ${theme === "light" ? "Sáng" : "Tối"}` : `Theme: ${theme === "light" ? "Light" : "Dark"}`}</span>
            </button>

            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(prev => prev === "vi" ? "en" : "vi")}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <span className="text-xs w-4 h-4 flex items-center justify-center select-none leading-none">{language === "vi" ? "🇬🇧" : "🇻🇳"}</span>
              <span>{labels.languageText}</span>
            </button>

            {/* Profile badge */}
            <div 
              className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 transition-colors"
              onClick={() => setCurrentView("my_account")}
            >
              <div className="w-9 h-9 bg-indigo-950 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none">
                {auth.user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 block truncate leading-none">{auth.user?.fullName}</span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block mt-1.5 truncate">
                  {auth.user?.role === "Admin" ? "SYSTEM CONTROLLER" : "LIBRARIAN"}
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="text-slate-400 hover:text-red-500"
                title={labels.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </aside>

        {/* RIGHT PANEL CONTENT SCROLL CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
          
          {/* Mobile Top Header */}
          <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-3xs">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateView("home")}>
              <div className="bg-indigo-950 p-2 rounded-xl text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight">Lumina Library</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            {renderView()}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <nav className="md:hidden bg-white border-t border-slate-150 flex justify-around py-3 text-[10px] font-black text-slate-400 sticky bottom-0 z-30 shadow-md">
            <button onClick={() => setCurrentView("admin_reports")} className={currentView === "admin_reports" ? "text-indigo-950 font-bold" : ""}>Reports</button>
            <button onClick={() => setCurrentView("admin_books")} className={currentView === "admin_books" ? "text-indigo-950 font-bold" : ""}>Catalog</button>
            <button onClick={() => setCurrentView("admin_borrows")} className={currentView === "admin_borrows" ? "text-indigo-950 font-bold" : ""}>Borrows</button>
            {auth.user?.role === "Admin" && (
              <button onClick={() => setCurrentView("admin_users")} className={currentView === "admin_users" ? "text-indigo-950 font-bold" : ""}>Users</button>
            )}
            <button onClick={() => setCurrentView("my_account")} className={currentView === "my_account" ? "text-indigo-950 font-bold" : ""}>History</button>
          </nav>
        </div>

        {/* Logout Confirmation Modal for Admin/Librarian */}
        <ConfirmModal
          isOpen={showLogoutConfirm}
          title={language === "vi" ? "Xác nhận đăng xuất" : "Confirm Logout"}
          message={language === "vi" ? "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?" : "Are you sure you want to log out of your account?"}
          confirmText={language === "vi" ? "Đăng xuất" : "Log Out"}
          cancelText={language === "vi" ? "Hủy" : "Cancel"}
          type="warning"
          onConfirm={performLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />

      </div>
    );
  }

  // STANDARD PUBLIC / MEMBER VIEW SHELL
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      
      {/* Dynamic Global Top Banner Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-50">
          <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in ${
            notification.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300" 
              : "bg-red-50 border-red-100 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo brand */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateView("home")}>
              <div className="bg-indigo-950 p-2.5 rounded-xl text-white shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base text-gray-950 dark:text-slate-100 tracking-tight block leading-none">Lumina Library</span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block mt-1">Providing community access to knowledge</span>
              </div>
            </div>

            {/* Menu options mapped by permission */}
            <nav className="hidden md:flex space-x-1 text-xs font-bold text-slate-500 h-16 items-center">
              <button
                onClick={() => navigateView("catalog")}
                className={`relative px-3.5 h-full flex items-center transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
                  currentView === "catalog" ? "text-indigo-950 dark:text-indigo-400 font-extrabold" : ""
                }`}
              >
                Catalog
                {currentView === "catalog" && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[3px] bg-indigo-950 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => navigateView("events")}
                className={`relative px-3.5 h-full flex items-center transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
                  currentView === "events" ? "text-indigo-950 dark:text-indigo-400 font-extrabold" : ""
                }`}
              >
                Events
                {currentView === "events" && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[3px] bg-indigo-950 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => navigateView("about")}
                className={`relative px-3.5 h-full flex items-center transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
                  currentView === "about" ? "text-indigo-950 dark:text-indigo-400 font-extrabold" : ""
                }`}
              >
                About Us
                {currentView === "about" && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[3px] bg-indigo-950 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => {
                  navigateView("home");
                  setTimeout(() => {
                    document.getElementById("curated-collections")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                }}
                className={`relative px-3.5 h-full flex items-center transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
                  currentView === "home" ? "text-indigo-950 dark:text-indigo-400 font-extrabold" : ""
                }`}
              >
                Collections
              </button>

              <button
                onClick={() => {
                  navigateView("home");
                  setTimeout(() => {
                    document.getElementById("elevate-research")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                }}
                className="relative px-3.5 h-full flex items-center transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Services
              </button>

              {auth.user && auth.user.role !== "Guest" && (
                <button
                  onClick={() => navigateView("my_account")}
                  className={`relative px-3.5 h-full flex items-center transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
                    currentView === "my_account" ? "text-indigo-950 dark:text-indigo-400 font-extrabold" : ""
                  }`}
                >
                  {language === "vi" ? "Hồ sơ cá nhân" : "Profile"}
                  {currentView === "my_account" && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-[3px] bg-indigo-950 dark:bg-indigo-400 rounded-t-full" />
                  )}
                </button>
              )}
            </nav>

            {/* Profile trigger / Login status controls */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(prev => prev === "vi" ? "en" : "vi")}
                className="px-2.5 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold text-gray-500 hover:text-indigo-600 dark:text-slate-400 transition-colors cursor-pointer mr-1 flex items-center gap-1"
                title={language === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
              >
                <span>{language === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}</span>
              </button>

              <button
                onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
                className="p-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-500 hover:text-indigo-600 dark:text-slate-400 transition-colors cursor-pointer mr-1"
                title="Chuyển chế độ sáng/tối"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {auth.user && auth.user.role !== "Guest" ? (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full bg-indigo-950 text-white flex items-center justify-center text-xs font-black select-none cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                    onClick={() => setCurrentView("my_account")}
                  >
                    {auth.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div 
                    onClick={() => setCurrentView("my_account")}
                    className="hidden sm:flex flex-col text-right cursor-pointer"
                  >
                    <span className="font-bold text-xs text-gray-950 dark:text-slate-100 leading-none">{auth.user.fullName}</span>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-1 font-bold tracking-wider uppercase">
                      {auth.user.role === "Admin" ? "Quản trị viên" : auth.user.role === "Librarian" ? "Thủ thư" : "Thành viên"}
                    </span>
                  </div>
                  
                  {/* Logout Icon */}
                  <button
                    onClick={handleLogout}
                    className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-2 select-none">
                    <div className="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <UserIcon className="w-4 h-4" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-slate-400 border border-white rounded-full" title="Role: Guest (Khách)"></span>
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-200 leading-none">Khách (Guest)</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold tracking-wider uppercase">Chưa đăng nhập</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer font-display"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile quick action menu tabs */}
        <div className="md:hidden border-t border-gray-50 bg-gray-50 flex justify-around py-2.5 text-[10px] font-black text-slate-400">
          <button onClick={() => navigateView("home")} className={currentView === "home" ? "text-indigo-950 font-bold" : ""}>Home</button>
          <button onClick={() => navigateView("catalog")} className={currentView === "catalog" ? "text-indigo-950 font-bold" : ""}>Catalog</button>
          <button onClick={() => navigateView("events")} className={currentView === "events" ? "text-indigo-950 font-bold" : ""}>Events</button>
          <button onClick={() => navigateView("about")} className={currentView === "about" ? "text-indigo-950 font-bold" : ""}>About</button>
          {auth.user && auth.user.role !== "Guest" && (
            <button onClick={() => navigateView("my_account")} className={currentView === "my_account" ? "text-indigo-950 font-bold" : ""}>My History</button>
          )}
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        


        {/* Dynamic Inner View */}
        {renderView()}

      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <p>&copy; 2026 Lumina Library Management System. Crafted with React, Tailwind & ASP.NET Core.</p>
      </footer>

      {/* Auth Register/Login Modal Popup */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-50 flex flex-col relative space-y-4">
            
            {/* Close Button */}
            <button 
              onClick={() => { setShowAuthModal(false); setAuthError(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <XIcon />
            </button>

            {/* Form Title & Subtext */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base font-display">
                {authMode === "login" ? "Sign In" : 
                 authMode === "register" ? "Register Member" : 
                 authMode === "forgot" ? "Quên Mật Khẩu" : "Đặt Lại Mật Khẩu"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {authMode === "login" ? "Access your reading logs and reservation dashboard" : 
                 authMode === "register" ? "Join our local community library and unlock 45,000+ volumes" : 
                 authMode === "forgot" ? "Chúng tôi sẽ gửi mã xác thực đặt lại mật khẩu đến email của bạn" : 
                 "Nhập mã xác thực gồm 6 chữ số và mật khẩu mới của bạn"}
              </p>
            </div>

            {/* Error notifications inside form */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* The actual Form */}
            {authMode === "login" ? (
              
              // 1. LOGIN
              <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5 text-xs" autoComplete="off">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold"
                    placeholder="member@library.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Security Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-3 pr-9 py-2 outline-hidden text-gray-900 font-semibold"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => { setAuthMode("forgot"); setAuthError(null); }}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer font-display"
                >
                  {authLoading ? "Authenticating..." : "Sign In"}
                </button>

                <div className="text-center pt-1">
                  <span className="text-gray-400 font-medium">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("register"); setAuthError(null); }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Register
                  </button>
                </div>
              </form>

            ) : authMode === "register" ? (

              // 2. REGISTER
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold"
                    placeholder="0901234567"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-3 pr-9 py-2 outline-hidden text-gray-900 font-semibold"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display"
                >
                  <UserPlus className="w-4 h-4" />
                  {authLoading ? "Registering member..." : "Create Account"}
                </button>

                <div className="text-center pt-1">
                  <span className="text-gray-400 font-medium">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </div>
              </form>

            ) : authMode === "forgot" ? (

              // 3. FORGOT PASSWORD
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Nhập Email tài khoản *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold"
                    placeholder="member@library.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer font-display"
                >
                  {authLoading ? "Đang gửi..." : "Gửi yêu cầu đặt lại"}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>

            ) : (

              // 4. RESET PASSWORD
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Mã xác thực (6 số) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold text-center tracking-widest text-sm"
                    placeholder="123456"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 outline-hidden text-gray-900 font-semibold"
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer font-display"
                >
                  {authLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Hủy bỏ và quay lại
                  </button>
                </div>
              </form>

            )}

          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

    </div>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ForbiddenScreen() {
  return (
    <div className="bg-white p-8 rounded-2xl border text-center space-y-3">
      <ShieldAlert className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
      <h3 className="font-bold text-gray-900 font-display">403 Forbidden - Access Denied</h3>
      <p className="text-gray-500 text-xs">Your current role credentials do not possess authorized clearance to read this record view.</p>
    </div>
  );
}
