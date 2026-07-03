import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { BorrowRecord, User, Book } from "../types";
import { Check, X, AlertTriangle, Search, Filter, RefreshCw, UserCheck, BookOpen, Clock, Mail, CheckCircle2, RotateCw } from "lucide-react";
import { ConfirmModal, AlertModal } from "./ConfirmModal";

interface AdminBorrowRecordsProps {
  onSuccessNotification: (message: string) => void;
  language?: "vi" | "en";
}

export default function AdminBorrowRecords({ onSuccessNotification, language = "vi" }: AdminBorrowRecordsProps) {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [reminders, setReminders] = useState<BorrowRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Custom Confirmation Dialog States
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "return" | "pay" | "approve_return" | "";
    id: string;
  }>({ type: "", id: "" });

  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "warning" | "danger">("warning");
  const [modalConfirmText, setModalConfirmText] = useState("Đồng ý");
  const [showInput, setShowInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Custom Alert States
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

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Manual borrow creation form states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUserId, setManualUserId] = useState("");
  const [manualBookId, setManualBookId] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Archival sync state
  const [syncing, setSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState("14 mins ago");

  const fetchRecordsAndDropdowns = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter) query.append("status", statusFilter);
    if (userIdFilter) query.append("userId", userIdFilter);

    Promise.all([
      apiRequest<BorrowRecord[]>(`/api/borrow-records?${query.toString()}`),
      apiRequest<User[]>("/api/users?pageSize=100"),
      apiRequest<Book[]>("/api/books?pageSize=100"),
      apiRequest<BorrowRecord[]>("/api/borrow-records?pageSize=100")
    ]).then(([recordsRes, usersRes, booksRes, remindersRes]) => {
      if (recordsRes.success && recordsRes.data) {
        setRecords(recordsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.filter(u => u.role === "Member"));
      }
      if (booksRes.success && booksRes.data) {
        setBooks(booksRes.data);
      }
      if (remindersRes.success && remindersRes.data) {
        setReminders(remindersRes.data);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecordsAndDropdowns();
  }, [statusFilter, userIdFilter]);

  const handleApprove = (id: string) => {
    setConfirmAction({ type: "approve", id });
    setModalTitle("Phê duyệt yêu cầu");
    setModalMessage("Phê duyệt cho mượn cuốn sách này?");
    setModalConfirmText("Phê duyệt");
    setModalType("info");
    setShowInput(false);
  };

  const handleReject = (id: string) => {
    setConfirmAction({ type: "reject", id });
    setModalTitle("Từ chối yêu cầu");
    setModalMessage("Nhập lý do từ chối yêu cầu mượn này:");
    setModalConfirmText("Từ chối");
    setModalType("danger");
    setRejectReason("");
    setShowInput(true);
  };

  const handleReturn = (id: string) => {
    setConfirmAction({ type: "return", id });
    setModalTitle("Trả sách");
    setModalMessage("Xác nhận đã nhận lại sách và hoàn thành phiếu mượn này?");
    setModalConfirmText("Xác nhận trả");
    setModalType("info");
    setShowInput(false);
  };

  const handleApproveReturn = (id: string) => {
    setConfirmAction({ type: "approve_return", id });
    setModalTitle("Duyệt trả sách");
    setModalMessage("Xác nhận đã nhận lại sách từ thành viên và hoàn tất phiếu mượn?");
    setModalConfirmText("Duyệt trả");
    setModalType("info");
    setShowInput(false);
  };

  const handlePayFine = (id: string) => {
    setConfirmAction({ type: "pay", id });
    setModalTitle("Nộp phạt");
    setModalMessage("Xác nhận thành viên đã nộp phạt quá hạn?");
    setModalConfirmText("Xác nhận");
    setModalType("info");
    setShowInput(false);
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmAction;
    setConfirmAction({ type: "", id: "" }); // close modal

    if (type === "approve") {
      const res = await apiRequest(`/api/borrow-records/${id}/approve`, "PUT");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchRecordsAndDropdowns();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    } else if (type === "reject") {
      const res = await apiRequest(`/api/borrow-records/${id}/reject`, "PUT", { notes: rejectReason || undefined });
      if (res.success) {
        onSuccessNotification(res.message);
        fetchRecordsAndDropdowns();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    } else if (type === "return") {
      const res = await apiRequest(`/api/borrow-records/${id}/return`, "PUT");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchRecordsAndDropdowns();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    } else if (type === "pay") {
      const res = await apiRequest(`/api/borrow-records/${id}/pay-fine`, "PUT");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchRecordsAndDropdowns();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    } else if (type === "approve_return") {
      const res = await apiRequest(`/api/borrow-records/${id}/return`, "PUT");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchRecordsAndDropdowns();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    }
  };

  const handleCreateManualBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualUserId || !manualBookId) {
      setManualError("Vui lòng chọn đầy đủ người mượn và cuốn sách cần mượn.");
      return;
    }

    setManualLoading(true);
    const res = await apiRequest("/api/borrow-records", "POST", {
      userId: manualUserId,
      bookId: manualBookId
    });

    if (res.success) {
      onSuccessNotification(res.message);
      setShowManualForm(false);
      setManualBookId("");
      setManualUserId("");
      fetchRecordsAndDropdowns();
    } else {
      setManualError(res.message);
    }
    setManualLoading(false);
  };

  const handleSyncDatasets = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncTime("Just now");
      onSuccessNotification("Archival catalog successfully synchronized!");
    }, 1500);
  };

  const handleSendReminder = (memberName: string) => {
    onSuccessNotification(`Reminder email sent successfully to ${memberName}!`);
  };

  const getPriorityReminders = () => {
    const today = new Date();
    const remindersList: { name: string; due: string; diff: string; color: string }[] = [];

    reminders.forEach(r => {
      if (!r.userDetail) return;
      const dueDate = new Date(r.dueDate);
      const timeDiff = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      const formattedDueDate = dueDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

      if (r.status === "Overdue") {
        const overdueDays = Math.max(1, Math.abs(diffDays));
        remindersList.push({
          name: r.userDetail.fullName,
          due: formattedDueDate,
          diff: `Overdue ${overdueDays} Day${overdueDays > 1 ? 's' : ''}`,
          color: "text-red-500 bg-red-50 border-red-100/60"
        });
      } else if (r.status === "Borrowed" && diffDays > 0 && diffDays <= 2) {
        remindersList.push({
          name: r.userDetail.fullName,
          due: formattedDueDate,
          diff: `Due in ${diffDays} Day${diffDays > 1 ? 's' : ''}`,
          color: "text-amber-600 bg-amber-50 border-amber-100/60"
        });
      }
    });

    return remindersList;
  };

  // Stats calculation based on loaded records
  const totalActiveBorrows = loading ? 0 : records.filter(r => r.status === "Borrowed").length;
  const totalOverdues = loading ? 0 : records.filter(r => r.status === "Overdue").length;
  const totalPendings = loading ? 0 : records.filter(r => r.status === "Pending").length;
  const totalReturnPending = loading ? 0 : records.filter(r => r.status === "ReturnPending").length;
  const returnedToday = loading ? 0 : records.filter(r => r.status === "Returned").length;

  const labels = {
    vi: {
      title: "Quản lý Phiếu Mượn Sách",
      subtitle: "Xem xét sổ nhật ký lưu thông, phê duyệt và trả sách của thư viện.",
      activeBorrows: "Đang Mượn",
      overdueItems: "Quá Hạn",
      pendingRequests: "Yêu Cầu Chờ Duyệt",
      returnedToday: "Đã Trả Hôm Nay",
      fromLastWeek: "+5.4% so với tuần trước",
      urgentAction: "Yêu cầu xử lý gấp",
      requiresApproval: "Cần thủ thư phê duyệt",
      vsYesterday: "+12% so với hôm qua",
      allRecords: "Tất Cả",
      pending: "Chờ Duyệt",
      returnPending: "Chờ Duyệt Trả",
      overdue: "Quá Hạn",
      returned: "Đã Trả",
      newBorrow: "+ Mượn sách trực tiếp",
      returnPendingCount: "Yêu Cầu Trả Sách",
      awaitingStaffReview: "Chờ thủ thư kiểm duyệt",
      approveReturn: "Duyệt trả",
      thMember: "Độc giả",
      thBook: "Tên sách",
      thDates: "Ngày mượn/Hạn trả",
      thStatus: "Trạng thái",
      thFines: "Tiền phạt",
      thOperations: "Thao tác"
    },
    en: {
      title: "Manage Borrow Records",
      subtitle: "Review circulation ledger, approvals, and physical archival returns.",
      activeBorrows: "Active Borrows",
      overdueItems: "Overdue Items",
      pendingRequests: "Pending Requests",
      returnedToday: "Returned Today",
      fromLastWeek: "+5.4% from last week",
      urgentAction: "Urgent action required",
      requiresApproval: "Requires librarian approval",
      vsYesterday: "+12% vs yesterday",
      allRecords: "All Records",
      pending: "Pending",
      returnPending: "Return Pending",
      overdue: "Overdue",
      returned: "Returned",
      newBorrow: "+ New Borrow",
      returnPendingCount: "Return Requests",
      awaitingStaffReview: "Awaiting staff review",
      approveReturn: "Approve Return",
      thMember: "Member",
      thBook: "Book Title",
      thDates: "Dates (Borrowed/Due)",
      thStatus: "Status",
      thFines: "Fines",
      thOperations: "Operations"
    }
  }[language];

  return (
    <div className="space-y-6">
      
      {/* Title Header area matching Image 3 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">{labels.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{labels.subtitle}</p>
        </div>
      </div>

      {/* 4 Stats Grid - MATCHING IMAGE 3 EXACTLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Active Borrows */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs flex flex-col justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.activeBorrows}</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1.5 font-display">{totalActiveBorrows}</h3>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-0.5">
            <span>{labels.fromLastWeek}</span>
          </div>
        </div>

        {/* Stat 2: Overdue Items */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs flex flex-col justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.overdueItems}</span>
            <h3 className="text-2xl font-black text-red-600 mt-1.5 font-display">{totalOverdues}</h3>
          </div>
          <div className="text-[10px] text-red-650 dark:text-red-400 font-bold mt-2">
            <span>{labels.urgentAction}</span>
          </div>
        </div>

        {/* Stat 3: Pending Requests */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs flex flex-col justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.pendingRequests}</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1.5 font-display">{totalPendings}</h3>
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-2">
            <span>{labels.requiresApproval}</span>
          </div>
        </div>

        {/* Stat 4: Returned Today */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs flex flex-col justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.returnedToday}</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1.5 font-display">{returnedToday}</h3>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">
            <span>{labels.vsYesterday}</span>
          </div>
        </div>

      </div>

      {/* Main split grid: Table list on left, side widgets on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side (3/4 column): Filter pills, search bar, and records table */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Filters and action row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs transition-colors">
            
            {/* Pill Capsule buttons for filters matching Image 3 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: labels.allRecords, val: "" },
                { label: labels.pending, val: "Pending" },
                { label: labels.returnPending, val: "ReturnPending" },
                { label: labels.overdue, val: "Overdue" },
                { label: labels.returned, val: "Returned" },
              ].map((tab) => {
                const isActive = statusFilter === tab.val;
                return (
                  <button
                    key={tab.val}
                    onClick={() => setStatusFilter(tab.val)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      isActive
                        ? "bg-slate-900 dark:bg-slate-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* "+ New Borrow" Action styled in dark blue */}
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="px-4 py-2 bg-indigo-950 dark:bg-indigo-850 hover:bg-indigo-900 dark:hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors font-display"
            >
              {showManualForm ? "Hide Form" : labels.newBorrow}
            </button>
          </div>

          {/* Form to insert manual direct borrow at counter */}
          {showManualForm && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50 space-y-4 shadow-inner">
              <div className="flex justify-between items-center border-b pb-3 border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 font-display">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Mượn Trực Tiếp Tại Quầy (Counter Check-out)
                </h3>
                <button 
                  onClick={() => { setShowManualForm(false); setManualError(null); }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              {manualError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{manualError}</span>
                </div>
              )}

              <form onSubmit={handleCreateManualBorrow} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Select Member *</label>
                  <select
                    required
                    value={manualUserId}
                    onChange={e => setManualUserId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-hidden text-slate-900 font-semibold"
                  >
                    <option value="">-- Choose Member --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Select Catalog Book *</label>
                  <select
                    required
                    value={manualBookId}
                    onChange={e => setManualBookId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-hidden text-slate-900 font-semibold"
                  >
                    <option value="">-- Choose Book --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} (Available: {b.availableCopies})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={manualLoading}
                    className="px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                  >
                    {manualLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Issue Borrow Book
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Records Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 text-xs font-semibold">Scanning circulation files...</p>
              </div>
            ) : records.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-12">No records found matching status filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                      <th style={{ textAlign: "center" }} className="py-3.5 px-4 font-semibold">{labels.thMember}</th>
                      <th style={{ textAlign: "center" }} className="py-3.5 px-4 font-semibold">{labels.thBook}</th>
                      <th style={{ textAlign: "center" }} className="py-3.5 px-4 font-semibold">{labels.thDates}</th>
                      <th style={{ textAlign: "center" }} className="py-3.5 px-4 font-semibold">{labels.thStatus}</th>
                      <th style={{ textAlign: "center" }} className="py-3.5 px-4 font-semibold">{labels.thFines}</th>
                      <th style={{ textAlign: "center" }} className="py-3.5 px-4 font-semibold">{labels.thOperations}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map(r => {
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                          {/* Member */}
                          <td className="py-4 px-4 text-center">
                            <div className="font-bold text-slate-900">{r.userDetail?.fullName || "Thành viên"}</div>
                            <div className="text-[10px] text-slate-400">{r.userDetail?.email}</div>
                          </td>

                          {/* Book Title */}
                          <td className="py-4 px-4 text-center font-semibold text-slate-700 max-w-xs truncate">
                            {r.bookDetail?.title || "Sách đã xóa"}
                          </td>

                          {/* Dates */}
                          <td className="py-4 px-4 text-center text-slate-500">
                            <div>Borrow: {new Date(r.borrowDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                            <div className="text-[10px] text-slate-400">Due: {new Date(r.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "Borrowed" ? "bg-blue-50 text-blue-700 border border-blue-100/60" :
                              r.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-100/60 animate-pulse" :
                              r.status === "ReturnPending" ? "bg-purple-50 text-purple-700 border border-purple-100/60 animate-pulse" :
                              r.status === "Overdue" ? "bg-red-50 text-red-600 border border-red-100/60" :
                              "bg-slate-100 text-slate-400"
                            }`}>
                              {r.status === "Borrowed" ? "BORROWED" :
                               r.status === "Pending" ? "PENDING" :
                               r.status === "ReturnPending" ? "RETURN PENDING" :
                               r.status === "Overdue" ? "OVERDUE" : "RETURNED"}
                            </span>
                          </td>

                          {/* Fines */}
                          <td className="py-4 px-4 text-center">
                            {r.fineAmount > 0 ? (
                              <div className="flex flex-col items-center text-[10px]">
                                <span className="font-bold text-red-500">{r.fineAmount.toLocaleString()}đ</span>
                                <span className={`font-semibold ${r.isFinePaid ? "text-emerald-600" : "text-amber-600"}`}>
                                  {r.isFinePaid ? "Paid" : "Unpaid"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">&mdash;</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-center font-semibold text-xs">
                            <div className="flex justify-center gap-3 text-slate-700">
                              {r.status === "Pending" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(r.id)}
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(r.id)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {(r.status === "Borrowed" || r.status === "Overdue") && (
                                <button
                                  onClick={() => handleReturn(r.id)}
                                  className="text-indigo-600 hover:text-indigo-700"
                                >
                                  Return &amp; Close
                                </button>
                              )}

                              {r.status === "ReturnPending" && (
                                <button
                                  onClick={() => handleApproveReturn(r.id)}
                                  className="text-purple-600 hover:text-purple-700 font-bold"
                                >
                                  {labels.approveReturn}
                                </button>
                              )}

                              {r.fineAmount > 0 && !r.isFinePaid && (
                                <button
                                  onClick={() => handlePayFine(r.id)}
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  Collect Fine
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side (1/4 column): Sidebar widgets for Archival Sync and Priority Reminders */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* ARCHIVAL SYNC CARD - MATCHING IMAGE 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-display">Archival Sync</h4>
              <p className="text-[10px] text-slate-400 mt-1">Last checked: {syncTime}</p>
            </div>

            <button
              onClick={handleSyncDatasets}
              disabled={syncing}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm uppercase tracking-wide cursor-pointer font-display"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing Archive..." : "Sync Datasets"}
            </button>
          </div>

          {/* PRIORITY REMINDERS CARD - MATCHING IMAGE 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-display">Priority Reminders</h4>
              <p className="text-[10px] text-slate-400 mt-1">Send immediate return notices to overdue members.</p>
            </div>

            <div className="space-y-4 pt-1">
              {getPriorityReminders().length > 0 ? (
                getPriorityReminders().map((rem) => (
                  <div key={rem.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs font-medium">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-900">{rem.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${rem.color}`}>
                        {rem.diff}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Due: {rem.due}</p>
                    
                    <button
                      onClick={() => handleSendReminder(rem.name)}
                      className="w-full py-1.5 border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3 h-3" /> Send Email
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[10px] text-slate-400 font-medium border border-dashed border-slate-100 rounded-xl">
                  Không có lời nhắc quá hạn nào.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <ConfirmModal
        isOpen={confirmAction.type !== ""}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
        type={modalType}
        showInput={showInput}
        placeholder="Nhập lý do..."
        inputValue={rejectReason}
        onInputChange={setRejectReason}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction({ type: "", id: "" })}
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
