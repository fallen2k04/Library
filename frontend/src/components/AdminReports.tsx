import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../lib/api";
import { BarChart, Users, BookOpen, AlertTriangle, Coins, TrendingUp, Trophy, Calendar, FileText, ArrowUpRight, RefreshCw } from "lucide-react";

interface SummaryData {
  totalTitles: number;
  totalBooks: number;
  totalBorrowed: number;
  totalOverdue: number;
  collectedFines: number;
  pendingFines: number;
  newBooksThisWeek: number;
  totalMembers: number;
}

interface TopBook {
  book: { id: string; title: string; isbn: string; coverImageUrl?: string };
  borrowCount: number;
}

interface TopMember {
  user: { id: string; fullName: string; email: string; phoneNumber?: string };
  borrowCount: number;
}

interface ActivityItem {
  id: string;
  userInitial: string;
  userName: string;
  bookTitle: string;
  type: string;
  time: string;
  status: string;
  statusColor: string;
  bgColor: string;
}

interface TrendMonth {
  month: string;
  monthNumber: number;
  books: number;
  journals: number;
}

interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
}

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  "Văn học Việt Nam": "Vietnamese Literature",
  "Văn học Nước ngoài": "Foreign Literature",
  "Khoa học & Công nghệ": "Science & Technology",
  "Kỹ năng sống": "Life Skills",
  "Kinh tế & Đầu tư": "Economics & Investment",
};

export function translateCategory(name: string, lang: "vi" | "en"): string {
  if (lang === "vi") return name;
  return CATEGORY_TRANSLATIONS[name] ?? name;
}

interface AdminReportsProps {
  language?: "vi" | "en";
}

export default function AdminReports({ language = "vi" }: AdminReportsProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trends, setTrends] = useState<TrendMonth[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [localActivities, setLocalActivities] = useState<ActivityItem[] | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [sumRes, booksRes, actRes, trendRes, catRes] = await Promise.all([
        apiRequest<SummaryData>("/api/reports/summary"),
        apiRequest<TopBook[]>("/api/reports/top-borrowed-books?top=5"),
        apiRequest<ActivityItem[]>("/api/reports/recent-activity?limit=15"),
        apiRequest<TrendMonth[]>("/api/reports/borrowing-trends"),
        apiRequest<CategoryStat[]>("/api/reports/top-categories?top=6"),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (booksRes.success && booksRes.data) setTopBooks(booksRes.data);
      if (actRes.success && actRes.data) {
        setActivities(actRes.data);
        setLocalActivities(null); // reset any manual clear
      }
      if (trendRes.success && trendRes.data) setTrends(trendRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const displayedActivities = localActivities !== null ? localActivities : activities;
  const maxTrend = Math.max(...trends.map(t => t.books + t.journals), 1);

  const labels = {
    vi: {
      title: "Báo Cáo Hệ Thống",
      subtitle: "Dữ liệu thống kê thực — cập nhật trực tiếp từ cơ sở dữ liệu.",
      loadingText: "Đang tổng hợp báo cáo thống kê từ cơ sở dữ liệu...",
      refresh: "Làm mới",
      exportReport: "Xuất báo cáo",
      totalBooks: "Tổng Số Sách",
      activeBorrowers: "Độc Giả Đang Mượn",
      overdueRecords: "Phiếu Phạt Quá Hạn",
      pendingFines: "Tiền Phạt Chưa Thu",
      weekNew: "tuần này",
      titles: "đầu sách",
      totalMembers: "Tổng thành viên",
      noInfractions: "Không có vi phạm",
      requiresAction: "Yêu cầu xử lý",
      collected: "Đã thu",
      pendingPayment: "Chờ thanh toán",
      borrowingTrends: "Xu hướng mượn sách",
      borrowCount: "lượt mượn",
      emptyTrends: "Chưa có dữ liệu mượn sách trong năm",
      topCategories: "Thể loại mượn nhiều nhất",
      catDistributionReal: "Phân bổ thực từ lịch sử mượn sách",
      catDistributionBooks: "Phân bổ theo số đầu sách",
      emptyCats: "Chưa có dữ liệu thể loại.",
      refreshStats: "Làm mới thống kê",
      recentActivity: "Nhật ký hoạt động hệ thống",
      recentActivityDesc: "Hoạt động thực tế gần đây",
      clearView: "Ẩn hiển thị",
      noActivities: "Chưa có hoạt động nào trong hệ thống.",
      topBorrowedBooks: "Sách mượn nhiều nhất",
      noTopBooks: "Chưa có lịch sử mượn sách thực tế.",
      hideLogsTitle: "Ẩn nhật ký hoạt động",
      hideLogsDesc: "Chỉ ẩn khỏi màn hình này. Dữ liệu thực vẫn được lưu trong cơ sở dữ liệu và sẽ hiển thị lại sau khi làm mới.",
      cancel: "Hủy",
      hideLogsConfirm: "Ẩn khỏi màn hình"
    },
    en: {
      title: "System Overview",
      subtitle: "Real circulation data — queried directly from database.",
      loadingText: "Compiling statistical reports from database...",
      refresh: "Refresh Data",
      exportReport: "Export Report",
      totalBooks: "Total Book Stock",
      activeBorrowers: "Active Borrowers",
      overdueRecords: "Overdue Records",
      pendingFines: "Unpaid Fines",
      weekNew: "this week",
      titles: "titles",
      totalMembers: "Total members",
      noInfractions: "No overdue items",
      requiresAction: "Action required",
      collected: "Collected",
      pendingPayment: "Pending payment",
      borrowingTrends: "Borrowing Trends",
      borrowCount: "borrows",
      emptyTrends: "No borrow transactions recorded in",
      topCategories: "Top Categories",
      catDistributionReal: "Distribution based on loan history",
      catDistributionBooks: "Distribution based on titles count",
      emptyCats: "No category statistics available.",
      refreshStats: "Refresh Stats",
      recentActivity: "Recent Activity Feed",
      recentActivityDesc: "Real-time updates from library database",
      clearView: "Clear View",
      noActivities: "No recent activities recorded.",
      topBorrowedBooks: "Top Borrowed Books",
      noTopBooks: "No loan records available.",
      hideLogsTitle: "Hide Activity Logs",
      hideLogsDesc: "This will only clear the current feed. The underlying records remain saved in the database.",
      cancel: "Cancel",
      hideLogsConfirm: "Clear Feed"
    }
  }[language];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 dark:text-slate-500 text-sm">{labels.loadingText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">{labels.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : labels.refresh}
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-indigo-950 dark:bg-indigo-850 hover:bg-indigo-900 dark:hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all font-display"
          >
            <FileText className="w-3.5 h-3.5" /> {labels.exportReport}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Books */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.totalBooks}</span>
              <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1.5 font-display">
                {(summary?.totalBooks ?? 0).toLocaleString()}
              </h3>
            </div>
            <div className="text-slate-400 dark:text-slate-500"><BookOpen className="w-5 h-5" /></div>
          </div>
          <div className="mt-3.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-450 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{summary?.newBooksThisWeek ?? 0} {labels.weekNew} · {summary?.totalTitles ?? 0} {labels.titles}</span>
          </div>
        </div>

        {/* Active Borrowers */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.activeBorrowers}</span>
              <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1.5 font-display">
                {(summary?.totalBorrowed ?? 0).toLocaleString()}
              </h3>
            </div>
            <div className="text-slate-400 dark:text-slate-500"><Users className="w-5 h-5" /></div>
          </div>
          <div className="mt-3.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-450 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>{labels.totalMembers}: {(summary?.totalMembers ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Overdue Records */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.overdueRecords}</span>
              <h3 className={`text-2xl font-black mt-1.5 font-display ${(summary?.totalOverdue ?? 0) > 0 ? "text-red-650 dark:text-red-400" : "text-slate-950 dark:text-slate-100"}`}>
                {(summary?.totalOverdue ?? 0).toLocaleString()}
              </h3>
            </div>
            <div className={`${(summary?.totalOverdue ?? 0) > 0 ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className={`mt-3.5 text-[10px] font-bold ${(summary?.totalOverdue ?? 0) > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
            {(summary?.totalOverdue ?? 0) > 0 ? labels.requiresAction : labels.noInfractions}
          </div>
        </div>

        {/* Pending Fines */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{labels.pendingFines}</span>
              <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1.5 font-display">
                {((summary?.pendingFines ?? 0) / 1000).toFixed(0)}K đ
              </h3>
            </div>
            <div className="text-slate-400 dark:text-slate-500"><Coins className="w-5 h-5" /></div>
          </div>
          <div className="mt-3.5 text-[10px] font-bold text-amber-605 dark:text-amber-400">
            {labels.collected}: {((summary?.collectedFines ?? 0) / 1000).toFixed(0)}K đ · {labels.pendingPayment}
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Borrowing Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-display">{labels.borrowingTrends} ({new Date().getFullYear()})</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-450">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-950 dark:bg-indigo-500 rounded-full"></span><span>{labels.borrowCount}</span>
              </div>
            </div>
          </div>

          {trends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              {labels.emptyTrends} {new Date().getFullYear()}.
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2 pt-4 px-2">
              {trends.map((t) => (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full max-w-[32px] h-full flex flex-col justify-end gap-0.5 relative group">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow whitespace-nowrap z-10">
                      {t.books} {labels.borrowCount}
                    </div>
                    {/* Bar */}
                    <div
                      className="bg-indigo-950 dark:bg-indigo-650 hover:bg-indigo-800 dark:hover:bg-indigo-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${(t.books / maxTrend) * 100}%`, minHeight: t.books > 0 ? "4px" : "0" }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-display">{t.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-display">{labels.topCategories}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {categories.length > 0 ? labels.catDistributionReal : labels.catDistributionBooks}
              </p>
            </div>

            <div className="space-y-3.5 pt-3">
              {categories.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-4">{labels.emptyCats}</p>
              ) : (
                categories.map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{translateCategory(cat.name, language)}</span>
                      <span className="text-slate-900 dark:text-slate-250 shrink-0">{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-950 dark:bg-indigo-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => fetchAll(true)}
            className="w-full py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-850 text-indigo-900 dark:text-indigo-400 hover:text-indigo-950 dark:hover:text-indigo-300 text-[10px] font-black text-center uppercase tracking-wider rounded-xl transition-colors font-display mt-4 border border-slate-205 dark:border-slate-800"
          >
            {labels.refreshStats}
          </button>
        </div>

      </div>

      {/* Recent Activity Feed — Real DB */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-display">{labels.recentActivity}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{labels.recentActivityDesc}</p>
          </div>
          {displayedActivities.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-350 tracking-wide uppercase"
            >
              {labels.clearView}
            </button>
          )}
        </div>

        <div className="space-y-1 text-xs font-medium">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <TrendingUp className="w-8 h-8 text-slate-350 dark:text-slate-700 mx-auto" />
              <p className="text-slate-400 dark:text-slate-500 text-xs">{labels.noActivities}</p>
            </div>
          ) : (
            displayedActivities.map((act, index) => (
              <React.Fragment key={act.id}>
                {index > 0 && <hr className="border-slate-50 dark:border-slate-800/80" />}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[11px] ${act.bgColor} text-slate-900 dark:text-slate-50`}>
                      {act.userInitial}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block sm:inline">{act.userName}</span>
                      <span className="text-slate-500 dark:text-slate-400 sm:ml-3 italic">{act.bookTitle}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500">{act.type}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">{act.time}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border font-display ${act.statusColor}`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Top Borrowed Books */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-display">{labels.topBorrowedBooks}</h3>
        </div>

        {topBooks.length === 0 ? (
          <p className="text-gray-400 dark:text-slate-500 text-xs text-center py-6">{labels.noTopBooks}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topBooks.map((item, index) => (
              <div key={item.book.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors">
                <span className={`font-black text-sm shrink-0 ${index === 0 ? "text-amber-500" : index === 1 ? "text-slate-500" : index === 2 ? "text-orange-400" : "text-slate-300 dark:text-slate-600"}`}>
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate leading-snug text-[11px]">{item.book.title}</h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">ISBN: {item.book.isbn} · {item.borrowCount} {labels.borrowCount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirm Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-red-650 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base font-display">{labels.hideLogsTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {labels.hideLogsDesc}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                {labels.cancel}
              </button>
              <button
                onClick={() => { setLocalActivities([]); setShowClearConfirm(false); }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {labels.hideLogsConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
