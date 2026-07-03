import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { Book, Category, Author } from "../types";
import { Plus, Edit, Trash2, Library, User as AuthorIcon, Bookmark, Search, Save, AlertCircle } from "lucide-react";
import { ConfirmModal, AlertModal } from "./ConfirmModal";

interface AdminBooksProps {
  onSuccessNotification: (message: string) => void;
  language?: "vi" | "en";
}

export default function AdminBooks({ onSuccessNotification, language = "vi" }: AdminBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Subsections inside "Manage Books": "books", "categories", "authors"
  const [activeSubTab, setActiveSubTab] = useState<"books" | "categories" | "authors">("books");
  const [loading, setLoading] = useState(true);

  // Forms states
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<Partial<Author> | null>(null);

  // Form error
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Author Form states
  const [showQuickAuthorForm, setShowQuickAuthorForm] = useState(false);
  const [quickAuthorName, setQuickAuthorName] = useState("");
  const [quickAuthorNationality, setQuickAuthorNationality] = useState("");

  // Custom Confirmation Dialog States
  const [confirmAction, setConfirmAction] = useState<{
    type: "book" | "category" | "author" | "";
    id: string;
  }>({ type: "", id: "" });

  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "warning" | "danger">("warning");
  const [modalConfirmText, setModalConfirmText] = useState("Đồng ý");

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

  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      apiRequest<Book[]>("/api/books?pageSize=100"), // large size for admin view
      apiRequest<Category[]>("/api/categories"),
      apiRequest<Author[]>("/api/authors")
    ]).then(([booksRes, catsRes, authorsRes]) => {
      if (booksRes.success && booksRes.data) setBooks(booksRes.data);
      if (catsRes.success && catsRes.data) setCategories(catsRes.data);
      if (authorsRes.success && authorsRes.data) setAuthors(authorsRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ---------------- BOOK CRUD ----------------
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingBook?.title || !editingBook?.isbn || !editingBook?.categoryId || !editingBook?.authors || editingBook.authors.length === 0) {
      setFormError("Vui lòng điền đầy đủ thông tin: Tiêu đề, ISBN, danh mục và tác giả.");
      return;
    }

    const isEdit = !!editingBook.id;
    const endpoint = isEdit ? `/api/books/${editingBook.id}` : "/api/books";
    const method = isEdit ? "PUT" : "POST";

    const res = await apiRequest(endpoint, method, editingBook);
    if (res.success) {
      onSuccessNotification(res.message);
      setEditingBook(null);
      fetchAllData();
    } else {
      setFormError(res.message);
    }
  };

  const handleDeleteBook = (id: string) => {
    setConfirmAction({ type: "book", id });
    setModalTitle("Xóa sách");
    setModalMessage("Xác nhận xóa cuốn sách này khỏi hệ thống?");
    setModalConfirmText("Xóa");
    setModalType("danger");
  };

  // ---------------- CATEGORY CRUD ----------------
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingCat?.name) {
      setFormError("Tên danh mục là bắt buộc.");
      return;
    }

    const isEdit = !!editingCat.id;
    const endpoint = isEdit ? `/api/categories/${editingCat.id}` : "/api/categories";
    const method = isEdit ? "PUT" : "POST";

    const res = await apiRequest(endpoint, method, editingCat);
    if (res.success) {
      onSuccessNotification(res.message);
      setEditingCat(null);
      fetchAllData();
    } else {
      setFormError(res.message);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmAction({ type: "category", id });
    setModalTitle("Xóa danh mục");
    setModalMessage("Xác nhận xóa danh mục này? Các sách thuộc danh mục phải được dọn dẹp trước.");
    setModalConfirmText("Xóa");
    setModalType("danger");
  };

  // ---------------- AUTHOR CRUD ----------------
  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingAuthor?.fullName) {
      setFormError("Họ tên tác giả là bắt buộc.");
      return;
    }

    const isEdit = !!editingAuthor.id;
    const endpoint = isEdit ? `/api/authors/${editingAuthor.id}` : "/api/authors";
    const method = isEdit ? "PUT" : "POST";

    const res = await apiRequest(endpoint, method, editingAuthor);
    if (res.success) {
      onSuccessNotification(res.message);
      setEditingAuthor(null);
      fetchAllData();
    } else {
      setFormError(res.message);
    }
  };

  const handleQuickAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAuthorName.trim()) return;

    const res = await apiRequest<Author>("/api/authors", "POST", {
      fullName: quickAuthorName.trim(),
      nationality: quickAuthorNationality.trim()
    });

    if (res.success && res.data) {
      onSuccessNotification("Đã thêm tác giả nhanh thành công!");
      
      const newAuthor = res.data;
      setAuthors(prev => [...prev, newAuthor].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      
      if (editingBook) {
        const currentAuthors = editingBook.authors || [];
        setEditingBook({
          ...editingBook,
          authors: [...currentAuthors, newAuthor.id]
        });
      }

      setQuickAuthorName("");
      setQuickAuthorNationality("");
      setShowQuickAuthorForm(false);
    } else {
      setFormError(res.message);
    }
  };

  const handleDeleteAuthor = (id: string) => {
    setConfirmAction({ type: "author", id });
    setModalTitle("Xóa tác giả");
    setModalMessage("Xác nhận xóa tác giả này khỏi danh sách?");
    setModalConfirmText("Xóa");
    setModalType("danger");
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmAction;
    setConfirmAction({ type: "", id: "" }); // close modal

    if (type === "book") {
      const res = await apiRequest(`/api/books/${id}`, "DELETE");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchAllData();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    } else if (type === "category") {
      const res = await apiRequest(`/api/categories/${id}`, "DELETE");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchAllData();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    } else if (type === "author") {
      const res = await apiRequest(`/api/authors/${id}`, "DELETE");
      if (res.success) {
        onSuccessNotification(res.message);
        fetchAllData();
      } else {
        setAlertConfig({ isOpen: true, title: "Lỗi", message: res.message, type: "error" });
      }
    }
  };

  const labels = {
    vi: {
      manageBooks: "Quản lý Sách",
      categories: "Thể Loại",
      authors: "Tác Giả",
      addNewBook: "Thêm sách mới",
      addNewCat: "Thêm thể loại",
      addNewAuthor: "Thêm tác giả",
      thBookName: "Tên sách / ISBN",
      thAuthor: "Tác giả",
      thCategory: "Thể loại",
      thCopies: "Tổng/Sẵn có",
      thActions: "Thao tác",
      thCatName: "Tên thể loại",
      thCatDesc: "Mô tả tóm tắt",
      thAuthName: "Họ và tên",
      thAuthNation: "Quốc tịch",
      thAuthBio: "Tiểu sử",
    },
    en: {
      manageBooks: "Manage Books",
      categories: "Categories",
      authors: "Authors",
      addNewBook: "Add New Book",
      addNewCat: "Add Category",
      addNewAuthor: "Add Author",
      thBookName: "Book Title / ISBN",
      thAuthor: "Author",
      thCategory: "Category",
      thCopies: "Total/Available",
      thActions: "Operations",
      thCatName: "Category Name",
      thCatDesc: "Brief Description",
      thAuthName: "Full Name",
      thAuthNation: "Nationality",
      thAuthBio: "Biography",
    }
  }[language];

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-3xs">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => { 
              setActiveSubTab("books"); 
              setEditingBook(null); 
              setEditingCat(null);
              setEditingAuthor(null);
              setFormError(null); 
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeSubTab === "books" 
                ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs" 
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <Library className="w-4 h-4" />
            {labels.manageBooks} ({books.length})
          </button>
          
          <button
            onClick={() => { 
              setActiveSubTab("categories"); 
              setEditingBook(null); 
              setEditingCat(null);
              setEditingAuthor(null);
              setFormError(null); 
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeSubTab === "categories" 
                ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs" 
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {labels.categories} ({categories.length})
          </button>
          
          <button
            onClick={() => { 
              setActiveSubTab("authors"); 
              setEditingBook(null); 
              setEditingCat(null);
              setEditingAuthor(null);
              setFormError(null); 
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeSubTab === "authors" 
                ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs" 
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <AuthorIcon className="w-4 h-4" />
            {labels.authors} ({authors.length})
          </button>
        </div>

        {/* Action Button: Add new */}
        <div>
          {activeSubTab === "books" && !editingBook && (
            <button
              onClick={() => setEditingBook({ title: "", isbn: "", categoryId: "", totalCopies: 1, availableCopies: 1, authors: [], coverImageUrl: "" })}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {labels.addNewBook}
            </button>
          )}

          {activeSubTab === "categories" && !editingCat && (
            <button
              onClick={() => setEditingCat({ name: "", description: "" })}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {labels.addNewCat}
            </button>
          )}

          {activeSubTab === "authors" && !editingAuthor && (
            <button
              onClick={() => setEditingAuthor({ fullName: "", biography: "", nationality: "", dateOfBirth: "" })}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {labels.addNewAuthor}
            </button>
          )}
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* EDITING / CREATING FORM (When active) */}
        {(editingBook || editingCat || editingAuthor) && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">
              {editingBook ? (editingBook.id ? "Cập Nhật Sách" : "Thêm Sách Mới") :
               editingCat ? (editingCat.id ? "Sửa Thể Loại" : "Tạo Thể Loại Mới") :
               (editingAuthor?.id ? "Sửa Tác Giả" : "Thêm Tác Giả Mới")}
            </h3>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* A: BOOK FORM */}
            {editingBook && (
              <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Tiêu đề sách *</label>
                  <input
                    type="text"
                    required
                    value={editingBook.title || ""}
                    onChange={e => setEditingBook({ ...editingBook, title: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                    placeholder="Ví dụ: Dế Mèn Phiêu Lưu Ký"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Mã ISBN *</label>
                    <input
                      type="text"
                      required
                      value={editingBook.isbn || ""}
                      onChange={e => setEditingBook({ ...editingBook, isbn: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                      placeholder="978604..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Số lượng bản in *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingBook.totalCopies || 1}
                      onChange={e => setEditingBook({ ...editingBook, totalCopies: parseInt(e.target.value) || 1 })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-1">Thể loại *</label>
                  <select
                    required
                    value={editingBook.categoryId || ""}
                    onChange={e => setEditingBook({ ...editingBook, categoryId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                  >
                    <option value="">-- Chọn thể loại --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-gray-500 font-medium">Tác giả *</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickAuthorForm(!showQuickAuthorForm)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm tác giả nhanh
                    </button>
                  </div>

                  {showQuickAuthorForm && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-3 space-y-2">
                      <p className="font-bold text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">Thêm Tác Giả Nhanh</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Họ tên tác giả *"
                          value={quickAuthorName}
                          onChange={e => setQuickAuthorName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px] focus:outline-hidden text-gray-900 dark:text-slate-100 font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Quốc tịch (tùy chọn)"
                          value={quickAuthorNationality}
                          onChange={e => setQuickAuthorNationality(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px] focus:outline-hidden text-gray-900 dark:text-slate-100 font-semibold"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => { setShowQuickAuthorForm(false); setQuickAuthorName(""); setQuickAuthorNationality(""); }}
                          className="px-2.5 py-1 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 dark:text-slate-300 dark:hover:bg-slate-800 font-bold cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddAuthor}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold cursor-pointer"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}

                  <select
                    multiple
                    required
                    value={editingBook.authors || []}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions).map(opt => (opt as HTMLOptionElement).value);
                      setEditingBook({ ...editingBook, authors: selected });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium h-24"
                  >
                    {authors.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Giữ Ctrl (hoặc Cmd) để chọn nhiều tác giả.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Nhà xuất bản</label>
                    <input
                      type="text"
                      value={editingBook.publisher || ""}
                      onChange={e => setEditingBook({ ...editingBook, publisher: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                      placeholder="NXB Trẻ..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Năm xuất bản</label>
                    <input
                      type="number"
                      value={editingBook.publishedYear || ""}
                      onChange={e => setEditingBook({ ...editingBook, publishedYear: parseInt(e.target.value) || undefined })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-1">URL ảnh bìa sách</label>
                  <input
                    type="url"
                    value={editingBook.coverImageUrl || ""}
                    onChange={e => setEditingBook({ ...editingBook, coverImageUrl: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-1">Mô tả tóm tắt</label>
                  <textarea
                    value={editingBook.description || ""}
                    onChange={e => setEditingBook({ ...editingBook, description: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium h-20"
                    placeholder="Nội dung tóm tắt..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Lưu sách
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* B: CATEGORY FORM */}
            {editingCat && (
              <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Tên thể loại *</label>
                  <input
                    type="text"
                    required
                    value={editingCat.name || ""}
                    onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-1">Mô tả thể loại</label>
                  <textarea
                    value={editingCat.description || ""}
                    onChange={e => setEditingCat({ ...editingCat, description: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium h-24"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Lưu danh mục
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* C: AUTHOR FORM */}
            {editingAuthor && (
              <form onSubmit={handleSaveAuthor} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Họ và tên tác giả *</label>
                  <input
                    type="text"
                    required
                    value={editingAuthor.fullName || ""}
                    onChange={e => setEditingAuthor({ ...editingAuthor, fullName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Quốc tịch</label>
                    <input
                      type="text"
                      value={editingAuthor.nationality || ""}
                      onChange={e => setEditingAuthor({ ...editingAuthor, nationality: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={editingAuthor.dateOfBirth || ""}
                      onChange={e => setEditingAuthor({ ...editingAuthor, dateOfBirth: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 font-medium mb-1">Tiểu sử tác giả</label>
                  <textarea
                    value={editingAuthor.biography || ""}
                    onChange={e => setEditingAuthor({ ...editingAuthor, biography: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-hidden focus:bg-white focus:border-indigo-500 text-gray-900 font-medium h-24"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Lưu tác giả
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAuthor(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* WORKSPACE DATA TABLES */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs overflow-hidden ${
          (editingBook || editingCat || editingAuthor) ? "lg:col-span-2" : "lg:col-span-3"
        }`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-xs">Đang nạp dữ liệu quản lý...</p>
            </div>
          ) : activeSubTab === "books" ? (
            
            // 1. BOOKS LIST
            books.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-12">Thư viện chưa có bất cứ cuốn sách nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thBookName}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thAuthor}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thCategory}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thCopies}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {books.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-slate-100">
                          <div className="flex items-center justify-center gap-2">
                            {b.coverImageUrl && (
                              <img src={b.coverImageUrl} className="w-6 h-8 object-cover rounded-sm border dark:border-slate-700 shrink-0" alt="" referrerPolicy="no-referrer" />
                            )}
                            <div className="text-left">
                              <span className="line-clamp-1">{b.title}</span>
                              <span className="text-[10px] text-gray-400 font-normal">ISBN: {b.isbn}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-300 truncate max-w-[120px]">
                          {b.authorsDetail?.map(a => a?.fullName).join(", ") || "Chưa rõ"}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-350">
                          {b.categoryDetail?.name || "Khác"}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-gray-800 dark:text-slate-200">
                          {b.availableCopies} / {b.totalCopies}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => setEditingBook(b)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Sửa sách"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(b.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa sách"
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
            )

          ) : activeSubTab === "categories" ? (
            
            // 2. CATEGORIES LIST
            categories.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-12">Chưa thiết lập thể loại nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thCatName}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thCatDesc}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {categories.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-slate-100">{c.name}</td>
                        <td className="py-3 px-4 text-center text-gray-500 dark:text-slate-400 max-w-sm truncate">{c.description || <span className="italic text-gray-300 dark:text-slate-600">Không có</span>}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => setEditingCat(c)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Sửa danh mục"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              title="Xóa danh mục"
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
            )

          ) : (
            
            // 3. AUTHORS LIST
            authors.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-12">Chưa thiết lập danh sách tác giả.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thAuthName}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thAuthNation}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thAuthBio}</th>
                      <th style={{ textAlign: "center" }} className="py-3 px-4 font-semibold">{labels.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {authors.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-slate-100">{a.fullName}</td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-350">{a.nationality || "-"}</td>
                        <td className="py-3 px-4 text-center text-gray-500 dark:text-slate-400 max-w-xs truncate">{a.biography || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => setEditingAuthor(a)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Sửa tác giả"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAuthor(a.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              title="Xóa tác giả"
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
            )

          )}
        </div>

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
