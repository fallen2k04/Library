import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { User } from "../types";
import { ShieldAlert, Trash2, Lock, Unlock, Search, Filter, RefreshCw, UserCheck } from "lucide-react";
import { ConfirmModal, AlertModal } from "./ConfirmModal";

interface AdminUsersProps {
  onSuccessNotification: (message: string) => void;
  language?: "vi" | "en";
}

export default function AdminUsers({ onSuccessNotification, language = "vi" }: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const labels = {
    vi: {
      titleAccount: "Tên tài khoản",
      titlePhone: "Số điện thoại",
      titleRole: "Vai trò chính",
      titleRegDate: "Ngày đăng ký",
      titleStatus: "Trạng thái khóa",
      titleAction: "Thao tác quản trị",
      searchPlaceholder: "Tìm tên, email, sđt...",
      searchButton: "Tìm",
      allRoles: "Tất cả vai trò",
      allStatuses: "Tất cả trạng thái",
      statusActive: "Hoạt Động",
      statusLocked: "Bị Khóa",
      loading: "Đang nạp danh sách tài khoản...",
      noUsers: "Không tìm thấy tài khoản người dùng nào."
    },
    en: {
      titleAccount: "Account Name",
      titlePhone: "Phone Number",
      titleRole: "Primary Role",
      titleRegDate: "Reg Date",
      titleStatus: "Status",
      titleAction: "Operations",
      searchPlaceholder: "Search name, email, phone...",
      searchButton: "Search",
      allRoles: "All Roles",
      allStatuses: "All Statuses",
      statusActive: "Active",
      statusLocked: "Locked",
      loading: "Loading user accounts...",
      noUsers: "No user accounts found."
    }
  }[language];

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

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isLockedFilter, setIsLockedFilter] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: "1",
      pageSize: "100",
      search,
      role: roleFilter,
      isLocked: isLockedFilter,
    });

    apiRequest<User[]>(`/api/users?${query.toString()}`)
      .then(res => {
        if (res.success && res.data) {
          setUsers(res.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, isLockedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleChangeRole = (id: string, newRole: "Admin" | "Librarian" | "Member") => {
    setModalConfig({
      isOpen: true,
      title: "Thay đổi vai trò",
      message: `Xác nhận thay đổi vai trò tài khoản này thành [${newRole}]?`,
      confirmText: "Thay đổi",
      type: "info",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const res = await apiRequest(`/api/users/${id}/role`, "PUT", { role: newRole });
        if (res.success) {
          onSuccessNotification(res.message);
          fetchUsers();
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

  const handleLockToggle = (id: string, isLocked: boolean) => {
    const action = isLocked ? "unlock" : "lock";
    setModalConfig({
      isOpen: true,
      title: isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản",
      message: `Xác nhận ${isLocked ? "mở khóa" : "khóa"} tài khoản này?`,
      confirmText: isLocked ? "Mở khóa" : "Khóa",
      type: isLocked ? "info" : "danger",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const res = await apiRequest(`/api/users/${id}/${action}`, "PUT");
        if (res.success) {
          onSuccessNotification(res.message);
          fetchUsers();
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

  const handleDeleteUser = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Xóa tài khoản",
      message: "Hành động xóa tài khoản không thể hoàn tác. Bạn có chắc chắn muốn xóa?",
      confirmText: "Xóa",
      type: "danger",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const res = await apiRequest(`/api/users/${id}`, "DELETE");
        if (res.success) {
          onSuccessNotification(res.message);
          fetchUsers();
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

  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={labels.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-hidden outline-indigo-600 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs"
          >
            {labels.searchButton}
          </button>
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-2.5 py-1.5"
          >
            <option value="">{labels.allRoles}</option>
            <option value="Admin">Admin</option>
            <option value="Librarian">Librarian (Thủ thư)</option>
            <option value="Member">Member (Thành viên)</option>
          </select>

          <select
            value={isLockedFilter}
            onChange={e => setIsLockedFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-2.5 py-1.5"
          >
            <option value="">{labels.allStatuses}</option>
            <option value="false">{labels.statusActive}</option>
            <option value="true">{labels.statusLocked}</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Users table list */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-xs">{labels.loading}</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-12">{labels.noUsers}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th style={{ textAlign: "center" }} className="px-4 py-3.5 font-semibold">{labels.titleAccount}</th>
                  <th style={{ textAlign: "center" }} className="px-4 py-3.5 font-semibold">{labels.titlePhone}</th>
                  <th style={{ textAlign: "center" }} className="px-4 py-3.5 font-semibold">{labels.titleRole}</th>
                  <th style={{ textAlign: "center" }} className="px-4 py-3.5 font-semibold">{labels.titleRegDate}</th>
                  <th style={{ textAlign: "center" }} className="px-4 py-3.5 font-semibold">{labels.titleStatus}</th>
                  <th style={{ textAlign: "center" }} className="px-4 py-3.5 font-semibold">{labels.titleAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* User info */}
                    <td className="py-4 px-4 text-center">
                      <div className="font-semibold text-gray-950">{u.fullName}</div>
                      <div className="text-[10px] text-gray-400">{u.email}</div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4 text-center text-gray-600 font-medium">{u.phoneNumber || "-"}</td>

                    {/* Role Badge + Switch Selector */}
                    <td className="py-4 px-4 text-center">
                      <select
                        value={u.role}
                        onChange={e => handleChangeRole(u.id, e.target.value as any)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg px-2 py-1 outline-hidden mx-auto inline-block"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Librarian">Librarian</option>
                        <option value="Member">Member</option>
                      </select>
                    </td>

                    {/* Reg Date */}
                    <td className="py-4 px-4 text-center text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                    </td>

                    {/* Lock State */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isLocked 
                          ? "bg-red-50 text-red-600 border border-red-100" 
                          : "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {u.isLocked ? labels.statusLocked : labels.statusActive}
                      </span>
                    </td>

                    {/* Admin Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        {/* Lock / Unlock Toggle button */}
                        <button
                          onClick={() => handleLockToggle(u.id, u.isLocked)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            u.isLocked 
                              ? "text-green-600 bg-green-50 border-green-100 hover:bg-green-100" 
                              : "text-red-600 bg-red-50 border-red-100 hover:bg-red-100"
                          }`}
                          title={u.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        >
                          {u.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>

                        {/* Delete account */}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-100 rounded-lg transition-colors"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
