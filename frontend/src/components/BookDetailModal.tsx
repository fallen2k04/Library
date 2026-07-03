import React, { useState } from "react";
import { Book, User } from "../types";
import { apiRequest } from "../lib/api";
import { X, BookOpen, Calendar, ShieldCheck, Tag, Info, AlertTriangle, Clock } from "lucide-react";

interface BookDetailModalProps {
  bookId: string | null;
  user: User | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onOpenAuth?: (mode: "login" | "register") => void;
}

export default function BookDetailModal({ bookId, user, onClose, onSuccess, onOpenAuth }: BookDetailModalProps) {
  const [book, setBook] = React.useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const membershipTier = user?.membershipTier || "Academic Member";
  
  // Ràng buộc thời hạn mượn và số lượng sách theo hạng thành viên
  const maxLoanDays = membershipTier === "Research Fellow" 
    ? 365 
    : (membershipTier === "Archive Scholar" ? 30 : 14);
    
  const maxBooksLimit = membershipTier === "Research Fellow" 
    ? "Không giới hạn" 
    : (membershipTier === "Archive Scholar" ? "12" : "5");

  // Mặc định hạn trả là hôm nay + thời hạn tối đa
  const [customDueDate, setCustomDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (membershipTier === "Academic Member" ? 14 : 30));
    return d.toISOString().split("T")[0];
  });

  // Cập nhật lại hạn trả khi thông tin user được tải xong
  React.useEffect(() => {
    if (user) {
      const d = new Date();
      d.setDate(d.getDate() + (user.membershipTier === "Academic Member" ? 14 : 30));
      setCustomDueDate(d.toISOString().split("T")[0]);
    }
  }, [user]);

  React.useEffect(() => {
    if (!bookId) return;

    setLoading(true);
    setError(null);
    apiRequest<Book>(`/api/books/${bookId}`)
      .then((res) => {
        if (res.success && res.data) {
          setBook(res.data);
        } else {
          setError(res.message);
        }
      })
      .catch(() => setError("Không thể tải thông tin sách."))
      .finally(() => setLoading(false));
  }, [bookId]);

  const handleBorrow = async () => {
    if (!book) return;
    setActionLoading(true);
    setError(null);

    const res = await apiRequest("/api/borrow-records", "POST", { 
      bookId: book.id,
      dueDate: customDueDate
    });
    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
    setActionLoading(false);
  };

  const handleReserve = async () => {
    if (!book) return;
    setActionLoading(true);
    setError(null);

    const res = await apiRequest("/api/reservations", "POST", { bookId: book.id });
    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
    setActionLoading(false);
  };

  if (!bookId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-lg">Chi Tiết Sách</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Đang tải thông tin sách...</p>
            </div>
          ) : error && !book ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : book ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Cover Column */}
              <div className="md:col-span-1 space-y-4">
                <div className="aspect-3/4 rounded-xl overflow-hidden bg-gray-100 shadow-md border border-gray-200">
                  <img 
                    src={book.coverImageUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Trạng thái:</span>
                    {book.availableCopies > 0 ? (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 font-medium rounded-md border border-green-100">Khả dụng</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-medium rounded-md border border-amber-100">Hết sách</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Còn lại:</span>
                    <span className="font-semibold text-gray-900">{book.availableCopies} / {book.totalCopies} bản</span>
                  </div>
                </div>
              </div>

              {/* Text Info Column */}
              <div className="md:col-span-2 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-snug">{book.title}</h2>
                  <p className="text-sm text-indigo-600 font-medium mt-1">
                    Tác giả: {book.authorsDetail && book.authorsDetail.length > 0 
                      ? book.authorsDetail.map(a => a.fullName).join(", ") 
                      : "Chưa rõ"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-lg">
                    <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">Thể loại: <strong className="text-gray-900 font-medium">{book.categoryDetail?.name || "Khác"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>ISBN: <strong className="text-gray-900 font-medium">{book.isbn}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Năm xuất bản: <strong className="text-gray-900 font-medium">{book.publishedYear || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-lg">
                    <Info className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">NXB: <strong className="text-gray-900 font-medium">{book.publisher || "N/A"}</strong></span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả nội dung</h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                    {book.description || "Chưa có bản mô tả tóm tắt nội dung của sách này."}
                  </p>
                </div>

                {book.authorsDetail && book.authorsDetail[0]?.biography && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Về tác giả</h4>
                    <p className="text-xs text-gray-500 italic bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      {book.authorsDetail[0].biography}
                    </p>
                  </div>
                )}

                {user && user.role === "Member" && book.availableCopies > 0 && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/80 space-y-2.5">
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Thời gian mượn & dự kiến trả
                    </h4>
                    <div className="text-xs text-indigo-900 space-y-2.5">
                      <p>
                        👑 Hạng tài khoản: <strong className="text-indigo-950">{membershipTier}</strong> (Tối đa {maxBooksLimit} cuốn, hạn mượn {membershipTier === "Research Fellow" ? "Vô hạn" : `${maxLoanDays} ngày`})
                      </p>
                      <p>
                        📅 Ngày mượn: <strong className="text-indigo-950">{new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</strong> (Hôm nay)
                      </p>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700">Chọn ngày dự kiến trả sách:</label>
                        <input
                          type="date"
                          value={customDueDate}
                          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                          max={membershipTier === "Research Fellow" ? undefined : new Date(Date.now() + maxLoanDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                          onChange={(e) => setCustomDueDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (err) {}
                          }}
                          className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium w-full max-w-xs cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                        />
                      </div>
                      
                      <p className="text-red-600 font-medium leading-relaxed">
                        ⚠️ Cảnh báo: Sách cần trả đúng hạn trước ngày bạn đã chọn. Nếu trả quá hạn, hệ thống sẽ tự động phạt tiền <strong>5.000 VNĐ/ngày</strong> và khóa chức năng mượn sách.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
          
          {book && (
            <>
              {!user ? (
                <button
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth("login");
                    onClose();
                  }}
                  className="px-5 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Đăng nhập để mượn sách
                </button>
              ) : user.role === "Member" ? (
                book.availableCopies > 0 ? (
                  <button
                    onClick={handleBorrow}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Mượn sách
                  </button>
                ) : (
                  <button
                    onClick={handleReserve}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <Clock className="w-4 h-4" />
                    Đặt trước
                  </button>
                )
              ) : (
                <div className="text-xs text-gray-500 font-medium self-center mr-2">
                  * Tài khoản thủ thư / admin không cần tự tạo phiếu mượn cá nhân.
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
