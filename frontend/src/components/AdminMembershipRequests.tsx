import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { MembershipRequest } from "../types";
import { ShieldCheck, XCircle, Search, RefreshCw, Clock, CreditCard, Award } from "lucide-react";
import { ConfirmModal, AlertModal } from "./ConfirmModal";

interface AdminMembershipRequestsProps {
  onSuccessNotification: (message: string) => void;
  language?: "vi" | "en";
}

export default function AdminMembershipRequests({ onSuccessNotification, language = "vi" }: AdminMembershipRequestsProps) {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const labels = {
    vi: {
      panelTitle: "Quản Lý Nâng Cấp Hội Viên",
      panelSub: "Phê duyệt hoặc từ chối các yêu cầu giao dịch nâng cấp gói hội viên của độc giả.",
      searchPlaceholder: "Tìm tên, email, gói...",
      loading: "Đang tải danh sách yêu cầu...",
      noRequests: "Không tìm thấy yêu cầu nâng cấp nào.",
      thReader: "Độc giả",
      thTier: "Gói đăng ký",
      thPrice: "Số tiền",
      thMethod: "Hình thức",
      thDate: "Ngày yêu cầu",
      thStatus: "Trạng thái",
      thAction: "Phê duyệt",
      statusApproved: "Đã duyệt",
      statusRejected: "Từ chối",
      statusPending: "Chờ duyệt"
    },
    en: {
      panelTitle: "Membership Upgrade Management",
      panelSub: "Approve or reject reader transaction requests for tier upgrades.",
      searchPlaceholder: "Search name, email, tier...",
      loading: "Loading upgrade requests...",
      noRequests: "No upgrade requests found.",
      thReader: "Reader",
      thTier: "Tier Package",
      thPrice: "Amount",
      thMethod: "Payment Method",
      thDate: "Request Date",
      thStatus: "Status",
      thAction: "Approval",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      statusPending: "Pending"
    }
  }[language];

  // Custom Confirm modal states
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "";
    id: string;
  }>({ type: "", id: "" });

  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "warning" | "danger">("warning");
  const [modalConfirmText, setModalConfirmText] = useState("Đồng ý");

  // Custom Alert states
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

  const fetchRequests = () => {
    setLoading(true);
    apiRequest<MembershipRequest[]>("/api/membership-requests")
      .then(res => {
        if (res.success && res.data) {
          setRequests(res.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveClick = (id: string) => {
    setConfirmAction({ type: "approve", id });
    setModalTitle("Phê duyệt nâng cấp");
    setModalMessage("Xác nhận người dùng đã thanh toán thành công và kích hoạt gói hội viên này?");
    setModalConfirmText("Phê duyệt");
    setModalType("info");
  };

  const handleRejectClick = (id: string) => {
    setConfirmAction({ type: "reject", id });
    setModalTitle("Từ chối yêu cầu");
    setModalMessage("Xác nhận từ chối yêu cầu nâng cấp gói hội viên này?");
    setModalConfirmText("Từ chối");
    setModalType("danger");
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmAction;
    setConfirmAction({ type: "", id: "" });

    const status = type === "approve" ? "Approved" : "Rejected";
    const res = await apiRequest(`/api/membership-requests/${id}/status`, "PUT", { status });
    
    if (res.success) {
      onSuccessNotification(res.message);
      fetchRequests();
    } else {
      setAlertConfig({
        isOpen: true,
        title: "Lỗi",
        message: res.message,
        type: "error",
      });
    }
  };

  const filteredRequests = requests.filter(r => {
    const term = search.toLowerCase();
    return (
      r.userDetail?.fullName.toLowerCase().includes(term) ||
      r.userDetail?.email.toLowerCase().includes(term) ||
      r.tierName.toLowerCase().includes(term) ||
      r.paymentMethod.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            {labels.panelTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{labels.panelSub}</p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={labels.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-56 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-hidden font-medium"
            />
          </div>

          <button
            onClick={fetchRequests}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-indigo-600 transition-all cursor-pointer shrink-0"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
        {loading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-xs font-semibold">{labels.loading}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
            <Clock className="w-10 h-10 text-gray-300" />
            <p className="text-gray-500 text-xs font-semibold">{labels.noRequests}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thReader}</th>
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thTier}</th>
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thPrice}</th>
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thMethod}</th>
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thDate}</th>
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thStatus}</th>
                  <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/20 transition-colors">
                    {/* Reader details */}
                    <td className="py-4 px-4 text-center">
                      <div className="font-semibold text-gray-900">{r.userDetail?.fullName || "Thành viên"}</div>
                      <div className="text-[10px] text-gray-400">{r.userDetail?.email}</div>
                    </td>

                    {/* Tier details */}
                    <td className="py-4 px-4 text-center font-bold text-indigo-950">
                      {r.tierName}
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {r.price.toLocaleString("vi-VN")} đ
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[9px] font-bold">
                        <CreditCard className="w-3 h-3" />
                        {r.paymentMethod === "qr" ? "Chuyển khoản QR" :
                         r.paymentMethod === "bank" ? "Số tài khoản" :
                         r.paymentMethod === "momo" ? "Ví Momo" : "Ví ZaloPay"}
                      </span>
                    </td>

                    {/* Request date */}
                    <td className="py-4 px-4 text-center text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "numeric",
                        year: "numeric"
                      })}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        r.status === "Approved" ? "bg-green-50 text-green-700 border-green-100" :
                        r.status === "Rejected" ? "bg-red-50 text-red-700 border-red-100" :
                        "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                      }`}>
                        {r.status === "Approved" ? labels.statusApproved :
                         r.status === "Rejected" ? labels.statusRejected : labels.statusPending}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 text-center font-semibold text-xs">
                      {r.status === "Pending" ? (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleApproveClick(r.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 cursor-pointer"
                            title="Xác nhận đã thanh toán"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectClick(r.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                            title="Từ chối yêu cầu"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300 select-none">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmAction.type !== ""}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
        type={modalType}
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
