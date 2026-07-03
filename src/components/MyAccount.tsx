import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { User, BorrowRecord, Reservation } from "../types";
import { User as UserIcon, Calendar, Clock, CreditCard, CheckCircle, AlertCircle, Trash2, Shield, RefreshCw, BookOpen, CircleDollarSign } from "lucide-react";
import { ConfirmModal, AlertModal } from "./ConfirmModal";

interface MyAccountProps {
  user: User | null;
  onSuccessNotification: (message: string) => void;
  language: "vi" | "en";
  onOpenAuth?: (mode: "login" | "register") => void;
}

export default function MyAccount({ user, onSuccessNotification, language, onOpenAuth }: MyAccountProps) {
  const labels = {
    vi: {
      syncing: "Đang đồng bộ thống kê...",
      noBorrows: "Bạn chưa mượn cuốn sách nào từ kho lưu trữ.",
      bookTitle: "Tên sách",
      status: "Trạng thái",
      dueDate: "Hạn trả",
      fineAmount: "Tiền phạt",
      actions: "Thao tác",
      returnBook: "Trả sách",
      borrowHistory: "Lịch sử mượn",
      myReservations: "Đặt trước",
      noReservations: "Bạn không có yêu cầu đặt trước nào.",
      cancelReservation: "Hủy đặt trước",
      queuePosition: "Hàng đợi",
      expiryDate: "Hạn nhận sách",
      dashboard: "Bảng điều khiển độc giả",
      dashboardSub: "Quản lý hành trình đọc sách và các khám phá tiếp theo của bạn.",
      currentlyBorrowed: "ĐANG MƯỢN",
      outstandingFines: "TIỀN PHẠT CHƯA NỘP",
      unlimited: "Vô hạn",
      limit: "giới hạn",
      profileTitle: "Thông tin cá nhân",
      fullName: "Họ và tên",
      email: "Địa chỉ Email",
      phone: "Số điện thoại",
      role: "Vai trò",
      membershipTier: "Hạng thành viên",
      joinedDate: "Ngày tham gia",
      unpaid: "Chưa thanh toán",
      paid: "Đã thanh toán",
      awaitingReturn: "Đang chờ duyệt trả...",
      returnConfirmTitle: "Trả sách",
      returnConfirmMsg: "Xác nhận hoàn trả cuốn sách này?",
      cancelReserveTitle: "Hủy đặt trước",
      cancelReserveMsg: "Bạn có chắc chắn muốn hủy đặt trước cuốn sách này?",
      payFineTitle: "Thanh toán tiền phạt",
      payFineMsg: "Vui lòng quét mã QR bên dưới để thanh toán phạt quá hạn.",
      cancelBtn: "Hủy",
      confirmBtn: "Xác nhận",
      closeBtn: "Đóng",
      member: "Thành viên",
      admin: "Quản trị viên",
      librarian: "Thủ thư",
      guest: "Khách",
      loginRequired: "Vui lòng đăng nhập để xem thông tin tài khoản.",
      editProfile: "Chỉnh sửa thông tin",
      changePassword: "Đổi mật khẩu",
      saveChanges: "Lưu thay đổi",
      updating: "Đang cập nhật...",
      updateSuccess: "Cập nhật thông tin thành công!",
      currentPassword: "Mật khẩu hiện tại",
      newPassword: "Mật khẩu mới",
      confirmNewPassword: "Xác nhận mật khẩu mới",
      staffProfileTitle: "Hồ sơ Nhân sự",
      staffProfileSub: "Bảng điều khiển thông tin và cài đặt bảo mật cho nhân sự quản trị hệ thống.",
      systemRole: "Quyền quản trị hệ thống",
      activePrivileges: "Đặc quyền hoạt động",
      staffActive: "ĐANG HOẠT ĐỘNG",
      lastLogin: "Lần đăng nhập cuối",
      unlimitedAccess: "Quyền quản trị toàn quyền",
      guestProfileTitle: "Hồ sơ Khách",
      guestProfileSub: "Bạn đang truy cập hệ thống thư viện dưới quyền Khách.",
      guestNotice: "Quyền Khách chỉ cho phép tìm kiếm và xem danh mục. Vui lòng đăng nhập hoặc đăng ký thành viên để có thể mượn sách, đặt trước phòng học nhóm và đặt lịch hỗ trợ nghiên cứu từ thủ thư.",
      signInNow: "Đăng nhập ngay",
      registerNow: "Đăng ký ngay"
    },
    en: {
      syncing: "Synchronizing reading statistics...",
      noBorrows: "You have not borrowed any books from the archive.",
      bookTitle: "Book Title",
      status: "Status",
      dueDate: "Due Date",
      fineAmount: "Fine Amount",
      actions: "Actions",
      returnBook: "Return Book",
      borrowHistory: "Borrow History",
      myReservations: "My Reservations",
      noReservations: "You have no active book reservations.",
      cancelReservation: "Cancel Reservation",
      queuePosition: "Queue Position",
      expiryDate: "Expiry Date",
      dashboard: "Member Dashboard",
      dashboardSub: "Manage your reading journey and future discoveries.",
      currentlyBorrowed: "CURRENTLY BORROWED",
      outstandingFines: "OUTSTANDING FINES",
      unlimited: "Unlimited",
      limit: "limit",
      profileTitle: "Personal Profile",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      role: "Role",
      membershipTier: "Membership Tier",
      joinedDate: "Joined Date",
      unpaid: "Unpaid",
      paid: "Paid",
      awaitingReturn: "Awaiting return review...",
      returnConfirmTitle: "Return Book",
      returnConfirmMsg: "Confirm that you want to return this book?",
      cancelReserveTitle: "Cancel Reservation",
      cancelReserveMsg: "Are you sure you want to cancel this reservation?",
      payFineTitle: "Pay Overdue Fine",
      payFineMsg: "Please scan the QR code below to pay the overdue fine.",
      cancelBtn: "Cancel",
      confirmBtn: "Confirm",
      closeBtn: "Close",
      member: "Member",
      admin: "Admin",
      librarian: "Librarian",
      guest: "Guest",
      loginRequired: "Please sign in to view account details.",
      editProfile: "Edit Profile Info",
      changePassword: "Change Password",
      saveChanges: "Save Changes",
      updating: "Updating...",
      updateSuccess: "Profile updated successfully!",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      staffProfileTitle: "Staff Profile",
      staffProfileSub: "Security configuration and profile details for system personnel.",
      systemRole: "System Admin Privileges",
      activePrivileges: "Active Privileges",
      staffActive: "ACTIVE STAFF",
      lastLogin: "Last Logged In",
      unlimitedAccess: "Unlimited System Access",
      guestProfileTitle: "Guest Profile",
      guestProfileSub: "You are browsing the library system as a Guest.",
      guestNotice: "Guest permissions allow searching the catalog and viewing events. Please log in or register as a member to borrow books, reserve study rooms, and book research consultations.",
      signInNow: "Sign In Now",
      registerNow: "Register Now"
    }
  }[language];

  const [profile, setProfile] = useState<User | null>(user);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<"borrows" | "reservations">("borrows");
  const [loading, setLoading] = useState(true);
  const [payingFineId, setPayingFineId] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const fetchUserData = () => {
    setLoading(true);
    Promise.all([
      apiRequest<User>("/api/users/me"),
      apiRequest<BorrowRecord[]>("/api/borrow-records/my-history"),
      apiRequest<Reservation[]>("/api/reservations/my-reservations")
    ]).then(([profileRes, borrowsRes, reservationsRes]) => {
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      }
      if (borrowsRes.success && borrowsRes.data) {
        setBorrows(borrowsRes.data);
      }
      if (reservationsRes.success && reservationsRes.data) {
        setReservations(reservationsRes.data);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleReturn = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Trả sách",
      message: "Xác nhận hoàn trả cuốn sách này?",
      confirmText: "Trả sách",
      type: "info",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const res = await apiRequest(`/api/borrow-records/${id}/return`, "PUT");
        if (res.success) {
          onSuccessNotification(res.message);
          fetchUserData();
        } else {
          setAlertConfig({
            isOpen: true,
            title: "Lỗi",
            message: res.message,
            type: "error",
          });
        }
      }
    });
  };

  const handleCancelReservation = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Hủy đặt trước",
      message: "Bạn có chắc chắn muốn hủy đặt trước cuốn sách này?",
      confirmText: "Hủy đặt trước",
      type: "danger",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const res = await apiRequest(`/api/reservations/${id}/cancel`, "PUT");
        if (res.success) {
          onSuccessNotification(res.message);
          fetchUserData();
        } else {
          setAlertConfig({
            isOpen: true,
            title: "Lỗi",
            message: res.message,
            type: "error",
          });
        }
      }
    });
  };

  const handlePayFine = async (id: string) => {
    setPayingFineId(id);
    const res = await apiRequest(`/api/borrow-records/${id}/pay-fine`, "PUT");
    setPayingFineId(null);
    if (res.success) {
      onSuccessNotification(labels.updateSuccess);
      fetchUserData();
    } else {
      setAlertConfig({
        isOpen: true,
        title: "Lỗi",
        message: res.message,
        type: "error",
      });
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{labels.loginRequired}</p>
      </div>
    );
  }

  // GUEST PROFILE VIEW
  if (profile.role === "Guest") {
    return (
      <div className="space-y-8 max-w-3xl mx-auto py-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">{labels.guestProfileTitle}</h1>
            <p className="text-xs text-slate-500 mt-1">{labels.guestProfileSub}</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {labels.guestNotice}
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button 
              onClick={() => onOpenAuth && onOpenAuth("login")}
              className="px-6 py-3 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {labels.signInNow}
            </button>
            <button 
              onClick={() => onOpenAuth && onOpenAuth("register")}
              className="px-6 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {labels.registerNow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STAFF PROFILE VIEW (Admin / Librarian)
  if (profile.role === "Admin" || profile.role === "Librarian") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">{labels.staffProfileTitle}</h1>
            <p className="text-xs text-slate-500 mt-1">{labels.staffProfileSub}</p>
          </div>
          <div className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase rounded-lg tracking-wider">
            {labels.staffActive}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Info */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-3xs space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-950 text-white rounded-full flex items-center justify-center text-xl font-bold select-none shrink-0">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{profile.fullName}</h3>
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mt-1">
                  {profile.role === "Admin" ? labels.admin : labels.librarian}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{labels.fullName}</span>
                <span className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5 block">{profile.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{labels.email}</span>
                <span className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5 block">{profile.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{labels.phone}</span>
                <span className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5 block">{profile.phoneNumber || "---"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{labels.joinedDate}</span>
                <span className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5 block">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: Edit Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-3xs space-y-6">
            <h3 className="font-bold text-slate-950 dark:text-slate-100 text-lg font-serif border-b border-slate-100 dark:border-slate-800 pb-3">
              {labels.editProfile}
            </h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem("name") as HTMLInputElement).value;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
              
              const res = await apiRequest(`/api/users/${profile.id}`, "PUT", {
                fullName: name,
                email: email,
                phoneNumber: phone
              });

              if (res.success) {
                onSuccessNotification(labels.updateSuccess);
                fetchUserData();
              } else {
                alert(res.message);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{labels.fullName}</label>
                  <input 
                    name="name"
                    type="text" 
                    defaultValue={profile.fullName} 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white outline-hidden focus:border-indigo-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{labels.email}</label>
                  <input 
                    name="email"
                    type="email" 
                    defaultValue={profile.email} 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white outline-hidden focus:border-indigo-600 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{labels.phone}</label>
                  <input 
                    name="phone"
                    type="text" 
                    defaultValue={profile.phoneNumber || ""} 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white outline-hidden focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {labels.saveChanges}
              </button>
            </form>
          </div>
        </div>

        <footer className="text-center py-10 space-y-4 border-t border-slate-100 dark:border-slate-800 mt-12">
          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight font-display">Lumina Library</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Providing community access to knowledge since 1924. Your history and reservations are managed securely according to our privacy guidelines.
          </p>
        </footer>
      </div>
    );
  }

  // MEMBER DASHBOARD VIEW
  const totalUnpaidFines = borrows
    .filter(b => b.fineAmount > 0 && !b.isFinePaid)
    .reduce((sum, b) => sum + b.fineAmount, 0);

  const activeBorrowedCount = borrows.filter(b => b.status === "Borrowed" || b.status === "Overdue" || b.status === "ReturnPending").length;

  return (
    <div className="space-y-8">
      
      {/* Member Dashboard Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-gray-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">{labels.dashboard}</h1>
          <p className="text-xs text-slate-500 mt-1">{labels.dashboardSub}</p>
        </div>

        {/* Dynamic stat metrics card pair */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Stat 1: Currently Borrowed */}
          <div className="flex-1 md:flex-initial bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-xl px-5 py-3.5 flex items-center justify-between gap-5 shadow-3xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{labels.currentlyBorrowed}</span>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                {activeBorrowedCount} <span className="text-xs font-normal text-slate-400">/ 5 {labels.limit}</span>
              </div>
            </div>
            <div className="p-2 bg-slate-200/50 dark:bg-slate-800/85 rounded-lg text-slate-600 dark:text-slate-400">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* Stat 2: Outstanding Fines */}
          <div className="flex-1 md:flex-initial bg-amber-50/75 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60 rounded-xl px-5 py-3.5 flex items-center justify-between gap-5 shadow-3xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider block">{labels.outstandingFines}</span>
              <div className="text-sm font-black text-amber-700 dark:text-amber-400 font-display">
                {totalUnpaidFines > 0 ? `${totalUnpaidFines.toLocaleString()}đ` : "0.00đ"}
              </div>
            </div>
            <div className="p-2 bg-amber-100/60 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Personal Info & Edit form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-3xs space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-950 text-white rounded-full flex items-center justify-center text-base font-bold select-none shrink-0">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{profile.fullName}</h3>
              <span className="text-[10px] text-slate-400 mt-1 font-bold block">{labels.member}</span>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("name") as HTMLInputElement).value;
            const email = (form.elements.namedItem("email") as HTMLInputElement).value;
            const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
            
            const res = await apiRequest(`/api/users/${profile.id}`, "PUT", {
              fullName: name,
              email: email,
              phoneNumber: phone
            });

            if (res.success) {
              onSuccessNotification(labels.updateSuccess);
              fetchUserData();
            } else {
              alert(res.message);
            }
          }} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{labels.fullName}</label>
              <input 
                name="name"
                type="text" 
                defaultValue={profile.fullName} 
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white outline-hidden focus:border-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{labels.email}</label>
              <input 
                name="email"
                type="email" 
                defaultValue={profile.email} 
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white outline-hidden focus:border-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{labels.phone}</label>
              <input 
                name="phone"
                type="text" 
                defaultValue={profile.phoneNumber || ""} 
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white outline-hidden focus:border-indigo-600 transition-colors"
              />
            </div>
            <button 
              type="submit" 
              className="w-full px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {labels.saveChanges}
            </button>
          </form>
        </div>

        {/* Right Side: Tab Lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-6 border-b border-gray-100 dark:border-slate-800 pb-1">
            <button
              onClick={() => setActiveTab("borrows")}
              className={`pb-3 font-bold text-xs tracking-wide transition-all border-b-2 ${
                activeTab === "borrows"
                  ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {labels.borrowHistory}
            </button>
            
            <button
              onClick={() => setActiveTab("reservations")}
              className={`pb-3 font-bold text-xs tracking-wide transition-all border-b-2 ${
                activeTab === "reservations"
                  ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {labels.myReservations}
            </button>

            <button 
              onClick={fetchUserData}
              className="ml-auto pb-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>

          {/* Tab Contents */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-xs">{labels.syncing}</p>
            </div>
          ) : activeTab === "borrows" ? (
            borrows.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                {labels.noBorrows}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/30">
                        <th className="py-3.5 px-6 font-semibold">{labels.bookTitle}</th>
                        <th className="py-3.5 px-4 font-semibold">{labels.status}</th>
                        <th className="py-3.5 px-4 font-semibold">{labels.dueDate}</th>
                        <th className="py-3.5 px-4 font-semibold">{labels.fineAmount}</th>
                        <th className="py-3.5 px-6 font-semibold text-right">{labels.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {borrows.map((record) => {
                        const isOverdue = record.status === "Overdue";
                        return (
                          <tr key={record.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={record.bookDetail?.coverImageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400"} 
                                  className="w-9 h-12 object-cover rounded-md shadow-3xs border border-gray-100 dark:border-slate-800 shrink-0" 
                                  alt="" 
                                  referrerPolicy="no-referrer" 
                                />
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-slate-200 block leading-snug line-clamp-1">{record.bookDetail?.title || "Sách đã xóa"}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">ISBN: {record.bookDetail?.isbn}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                record.status === "Borrowed" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/50" :
                                record.status === "Pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/50 animate-pulse" :
                                record.status === "ReturnPending" ? "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/50 animate-pulse" :
                                record.status === "Overdue" ? "bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400 border border-red-100/60 dark:border-red-900/50 animate-pulse" :
                                "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                              }`}>
                                {record.status === "Borrowed" ? "BORROWED" :
                                 record.status === "Pending" ? "PENDING" :
                                 record.status === "ReturnPending" ? "RETURN PENDING" :
                                 record.status === "Overdue" ? "OVERDUE" : "RETURNED"}
                              </span>
                            </td>

                            <td className={`py-4 px-4 font-semibold ${isOverdue ? "text-red-550" : "text-slate-650 dark:text-slate-400"}`}>
                              {new Date(record.dueDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </td>

                            <td className="py-4 px-4 font-bold text-slate-650 dark:text-slate-400">
                              {record.fineAmount > 0 ? (
                                <span className={record.isFinePaid ? "text-emerald-600" : "text-red-550"}>
                                  {record.isFinePaid ? labels.paid : `${record.fineAmount.toLocaleString()}đ`}
                                </span>
                              ) : (
                                <span className="text-slate-350 dark:text-slate-600">&mdash;</span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-3 font-semibold text-xs text-slate-700">
                                {(record.status === "Borrowed" || record.status === "Overdue") && (
                                  <button
                                    onClick={() => handleReturn(record.id)}
                                    className="text-slate-750 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                  >
                                    {labels.returnBook}
                                  </button>
                                )}
                                {record.status === "ReturnPending" && (
                                  <span className="text-slate-400 dark:text-slate-500 italic font-semibold text-[10px]">
                                    {labels.awaitingReturn}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : reservations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {labels.noReservations}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/30">
                      <th className="py-3.5 px-6 font-semibold">{labels.bookTitle}</th>
                      <th className="py-3.5 px-4 font-semibold">{labels.expiryDate}</th>
                      <th className="py-3.5 px-4 font-semibold">{labels.queuePosition}</th>
                      <th className="py-3.5 px-4 font-semibold">{labels.status}</th>
                      <th className="py-3.5 px-6 font-semibold text-right">{labels.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-4">
                            <img 
                              src={res.bookDetail?.coverImageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400"} 
                              className="w-9 h-12 object-cover rounded-md shadow-3xs border border-gray-100 dark:border-slate-800 shrink-0" 
                              alt="" 
                              referrerPolicy="no-referrer" 
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-200 block leading-snug line-clamp-1">{res.bookDetail?.title || "Sách đã xóa"}</span>
                              <span className="text-[10px] text-slate-400 font-normal">ISBN: {res.bookDetail?.isbn}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-650 dark:text-slate-400 font-semibold">
                          {res.status === "Available" ? (
                            <span className="text-amber-600">
                              Until: {new Date(res.expiryDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic font-normal">Awaiting collection...</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {res.status === "Waiting" ? (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold text-[10px]">Queue #{res.queuePosition}</span>
                          ) : (
                            <span className="text-slate-350 dark:text-slate-600">&mdash;</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            res.status === "Waiting" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/65 dark:border-amber-900/50" :
                            res.status === "Available" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/65 dark:border-emerald-900/50" :
                            "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                          }`}>
                            {res.status === "Waiting" ? "WAITING" :
                             res.status === "Available" ? "AVAILABLE" : "FULFILLED"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right font-semibold text-xs">
                          {(res.status === "Waiting" || res.status === "Available") && (
                            <button
                              onClick={() => handleCancelReservation(res.id)}
                              className="text-red-500 hover:text-red-650 cursor-pointer"
                            >
                              {labels.cancelReservation}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Centered clean privacy/policy footer */}
      <footer className="text-center py-10 space-y-4 border-t border-gray-100 dark:border-slate-800 mt-12">
        <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight font-display">Lumina Library</div>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Providing community access to knowledge since 1924. Your history and reservations are managed securely according to our privacy guidelines.
        </p>
        <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-slate-400">
          <span className="hover:text-indigo-655 dark:hover:text-indigo-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-indigo-655 dark:hover:text-indigo-400 cursor-pointer">Terms of Service</span>
          <span className="hover:text-indigo-655 dark:hover:text-indigo-400 cursor-pointer">Help Center</span>
        </div>
      </footer>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
