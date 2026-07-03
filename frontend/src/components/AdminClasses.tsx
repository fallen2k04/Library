import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { ClassSchedule, ClassRegistration } from "../types";
import { Calendar, Clock, Users, Plus, RefreshCw, ClipboardList, Info } from "lucide-react";

interface AdminClassesProps {
  onSuccessNotification: (message: string) => void;
  language?: "vi" | "en";
}

export default function AdminClasses({ onSuccessNotification, language = "vi" }: AdminClassesProps) {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"list" | "regs" | "consults">("list");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00 AM - 11:00 AM");
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchClassesAndRegs = async () => {
    setLoading(true);
    const [classesRes, regsRes, consultsRes] = await Promise.all([
      apiRequest<ClassSchedule[]>("/api/classes"),
      apiRequest<any[]>("/api/classes/registrations"),
      apiRequest<any[]>("/api/consultations")
    ]);
    if (classesRes.success && classesRes.data) {
      setClasses(classesRes.data);
    }
    if (regsRes.success && regsRes.data) {
      setRegistrations(regsRes.data);
    }
    if (consultsRes.success && consultsRes.data) {
      setConsultations(consultsRes.data);
    }
    setLoading(false);
  };

  const handleApproveConsultation = async (id: string) => {
    const res = await apiRequest(`/api/consultations/${id}/approve`, "PUT");
    if (res.success) {
      onSuccessNotification(language === "vi" ? "Đã duyệt lịch hẹn thành công!" : "Appointment approved successfully!");
      fetchClassesAndRegs();
    } else {
      onSuccessNotification(res.message);
    }
  };

  const handleRejectConsultation = async (id: string) => {
    const res = await apiRequest(`/api/consultations/${id}/reject`, "PUT");
    if (res.success) {
      onSuccessNotification(language === "vi" ? "Đã từ chối lịch hẹn!" : "Appointment rejected!");
      fetchClassesAndRegs();
    } else {
      onSuccessNotification(res.message);
    }
  };

  useEffect(() => {
    fetchClassesAndRegs();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const selectedDate = new Date(date);
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    if (selectedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate()) || selectedDate > oneMonthLater) {
      setErrorMsg(language === "vi" 
        ? "Ngày lên lịch lớp học phải nằm trong vòng 1 tháng từ hôm nay."
        : "Class date must be scheduled within 1 month from today."
      );
      setSubmitting(false);
      return;
    }

    const res = await apiRequest("/api/classes", "POST", {
      title,
      instructor,
      date: selectedDate.toISOString(),
      time,
      maxCapacity,
      description
    });

    setSubmitting(false);
    if (res.success) {
      onSuccessNotification(language === "vi" ? "Lên lịch lớp học thành công!" : "Class scheduled successfully!");
      setTitle("");
      setInstructor("");
      setDate("");
      setDescription("");
      setShowAddForm(false);
      fetchClassesAndRegs();
    } else {
      setErrorMsg(res.message || "Tạo lớp học thất bại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            {language === "vi" ? "Quản Lý Lớp Học" : "Class Schedule Manager"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi" ? "Lên lịch và theo dõi danh sách đăng ký các lớp kỹ năng của thủ thư." : "Schedule and monitor registration lists for library skills classes."}
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={fetchClassesAndRegs}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-950 dark:bg-indigo-500 hover:bg-indigo-900 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Plus className="w-4 h-4" />
            {language === "vi" ? "Lên Lịch Mới" : "Schedule New"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateClass} className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 max-w-xl animate-fade-in">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-serif">
            {language === "vi" ? "Lên lịch lớp học mới (Chọn ngày trong vòng 1 tháng)" : "Schedule New Class (Must be within 1 month)"}
          </h3>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="text-slate-500">{language === "vi" ? "Tên lớp học *" : "Class Title *"}</label>
              <input 
                type="text" 
                required 
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-hidden text-slate-900 dark:text-slate-100 font-bold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Kỹ năng tra cứu cơ sở dữ liệu Scopus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">{language === "vi" ? "Thủ thư phụ trách *" : "Instructor *"}</label>
              <input 
                type="text" 
                required 
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-hidden text-slate-900 dark:text-slate-100 font-bold"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="E.g., Dr. Alistair Thorne"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">{language === "vi" ? "Ngày học (Trong vòng 1 tháng) *" : "Date (Within 1 Month) *"}</label>
              <input 
                type="date" 
                required 
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-hidden text-slate-900 dark:text-slate-100 font-bold cursor-pointer"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                onFocus={(e) => e.currentTarget.showPicker()}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">{language === "vi" ? "Khung giờ học *" : "Time Slot *"}</label>
              <select 
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-hidden text-slate-900 dark:text-slate-100 font-bold"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">{language === "vi" ? "Giới hạn số học viên *" : "Max Capacity *"}</label>
              <input 
                type="number" 
                required 
                min={5}
                max={100}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-hidden text-slate-900 dark:text-slate-100 font-bold"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="space-y-1 text-xs font-semibold">
            <label className="text-slate-500">{language === "vi" ? "Mô tả chi tiết" : "Description"}</label>
            <textarea 
              rows={3}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-hidden text-slate-900 dark:text-slate-100 font-semibold"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung tóm tắt của lớp học..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
            >
              {language === "vi" ? "Hủy" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-950 dark:bg-indigo-500 hover:bg-indigo-900 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {submitting ? (language === "vi" ? "Đang lưu..." : "Saving...") : (language === "vi" ? "Lưu lại" : "Create")}
            </button>
          </div>
        </form>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveSubTab("list")}
          className={`pb-3 font-bold text-xs tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === "list"
              ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {language === "vi" ? "Danh sách lớp học" : "Class Schedules"}
        </button>

        <button
          onClick={() => setActiveSubTab("regs")}
          className={`pb-3 font-bold text-xs tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === "regs"
              ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {language === "vi" ? "Danh sách đăng ký học" : "Student Registrations"}
        </button>

        <button
          onClick={() => setActiveSubTab("consults")}
          className={`pb-3 font-bold text-xs tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === "consults"
              ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Clock className="w-4 h-4" />
          {language === "vi" ? "Duyệt lịch hẹn thủ thư" : "Librarian Consultations"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
          Loading data...
        </div>
      ) : activeSubTab === "list" ? (
        classes.length === 0 ? (
          <div className="text-center py-12 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs bg-white dark:bg-slate-900">
            {language === "vi" ? "Chưa có lớp học nào được tạo." : "No scheduled classes found."}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-3.5 px-6 font-semibold">{language === "vi" ? "Tên lớp học" : "Class Title"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Thủ thư giảng dạy" : "Instructor"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Ngày học" : "Date"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Khung giờ" : "Time"}</th>
                    <th className="py-3.5 px-6 font-semibold text-right">{language === "vi" ? "Sĩ số (Học viên)" : "Students"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-200">
                        <div>
                          <div className="leading-snug">{c.title}</div>
                          {c.description && <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-sm truncate">{c.description}</div>}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{c.instructor}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">{new Date(c.date).toLocaleDateString("vi-VN")}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">{c.time}</td>
                      <td className="py-4 px-6 text-right font-bold text-indigo-650 dark:text-indigo-400">
                        {c.registeredCount} / {c.maxCapacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeSubTab === "regs" ? (
        registrations.length === 0 ? (
          <div className="text-center py-12 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs bg-white dark:bg-slate-900">
            {language === "vi" ? "Chưa có độc giả nào đăng ký học." : "No class registration records found."}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-3.5 px-6 font-semibold">{language === "vi" ? "Lớp đăng ký" : "Class Title"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Học viên" : "Student"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Email liên lạc" : "Email"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Lịch học lớp" : "Class Schedule"}</th>
                    <th className="py-3.5 px-6 font-semibold text-right">{language === "vi" ? "Ngày đăng ký" : "Reg Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {registrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-200">{r.classTitle}</td>
                      <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{r.userFullName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">{r.userEmail}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">
                        {r.classDate ? new Date(r.classDate).toLocaleDateString("vi-VN") : "N/A"} ({r.classTime})
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-500">
                        {new Date(r.registrationDate).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        consultations.length === 0 ? (
          <div className="text-center py-12 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs bg-white dark:bg-slate-900">
            {language === "vi" ? "Chưa có lịch hẹn tư vấn nào." : "No consultations found."}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-3.5 px-6 font-semibold">{language === "vi" ? "Độc giả" : "Student"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Email" : "Email"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Thủ thư" : "Librarian"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Chủ đề" : "Topic"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Thời gian" : "Schedule"}</th>
                    <th className="py-3.5 px-4 font-semibold">{language === "vi" ? "Trạng thái" : "Status"}</th>
                    <th className="py-3.5 px-6 font-semibold text-right">{language === "vi" ? "Thao tác" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {consultations.map((con) => (
                    <tr key={con.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-200">{con.userFullName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">{con.userEmail}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">{con.librarianName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400 max-w-[150px] truncate" title={con.subject}>{con.subject}</td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-400">
                        {new Date(con.date).toLocaleDateString("vi-VN")} ({con.time})
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          con.status === "Approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100" :
                          con.status === "Rejected" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100" :
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/60"
                        }`}>
                          {con.status === "Approved" ? (language === "vi" ? "ĐÃ DUYỆT" : "APPROVED") :
                           con.status === "Rejected" ? (language === "vi" ? "TỪ CHỐI" : "REJECTED") :
                           (language === "vi" ? "ĐANG CHỜ" : "PENDING")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold space-x-2">
                        {con.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleApproveConsultation(con.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              {language === "vi" ? "Duyệt" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectConsultation(con.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              {language === "vi" ? "Từ chối" : "Reject"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
