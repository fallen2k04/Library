import React, { useState, useEffect } from "react";
import { Book, Category, Author, User } from "../types";
import { apiRequest } from "../lib/api";
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, BookOpen, User as UserIcon, Bookmark, RefreshCw, X } from "lucide-react";
import BookDetailModal from "./BookDetailModal";

interface BooksListProps {
  user: User | null;
  onSuccessNotification: (message: string) => void;
  initialSearch?: string;
  initialCategory?: string;
  onOpenAuth?: (mode: "login" | "register") => void;
}

export default function BooksList({ user, onSuccessNotification, initialSearch, initialCategory, onOpenAuth }: BooksListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sync initialSearch if it updates
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Client-side visual filters matching Screen 1 exactly
  const [availability, setAvailability] = useState<"all" | "available">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("bookmarked_books");
    return saved ? JSON.parse(saved) : [];
  });

  // Detail Modal State
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Fetch initial filters and map category name to ID
  useEffect(() => {
    apiRequest<Category[]>("/api/categories")
      .then(res => {
        if (res.success && res.data) {
          setCategories(res.data);
          if (initialCategory) {
            const matched = res.data.find(c => 
              c.name.toLowerCase() === initialCategory.toLowerCase() || 
              c.name.toLowerCase().includes(initialCategory.toLowerCase())
            );
            if (matched) {
              setSelectedCategory(matched.id);
            }
          }
        }
      });
    apiRequest<Author[]>("/api/authors")
      .then(res => res.success && res.data && setAuthors(res.data));
  }, [initialCategory]);


  // Fetch books when dependencies change
  const fetchBooks = (searchOverride?: string) => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      pageSize: "8",
      search: searchOverride !== undefined ? searchOverride : search,
      categoryId: selectedCategory,
      authorId: selectedAuthor,
      sortBy,
      sortDir,
    });

    apiRequest<Book[]>(`/api/books?${query.toString()}`)
      .then(res => {
        if (res.success && res.data) {
          setBooks(res.data);
          if (res.pagination) {
            setTotalPages(res.pagination.totalPages);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  // Debounced search: auto-fetch when user types after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBooks();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedCategory, selectedAuthor, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleToggleBookmark = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (bookmarkedIds.includes(bookId)) {
      updated = bookmarkedIds.filter(id => id !== bookId);
    } else {
      updated = [...bookmarkedIds, bookId];
    }
    setBookmarkedIds(updated);
    localStorage.setItem("bookmarked_books", JSON.stringify(updated));
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedAuthor("");
    setAvailability("all");
    setSelectedYear("all");
    setSortBy("createdAt");
    setSortDir("desc");
    setPage(1);
  };

  // Filter books client-side for availability and year if selected
  const filteredBooks = books.filter(book => {
    if (availability === "available" && book.availableCopies <= 0) {
      return false;
    }
    if (selectedYear !== "all") {
      if (!book.publishedYear || book.publishedYear.toString() !== selectedYear) {
        return false;
      }
    }
    return true;
  });

  // Extract unique published years from books for filter dropdown
  const uniqueYears: number[] = Array.from(
    new Set<number>(books.map(b => b.publishedYear).filter((y): y is number => typeof y === "number"))
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb Navigation matching Screen 1 */}
      <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 px-1">
        <span className="hover:text-indigo-600 cursor-pointer" onClick={handleResetFilters}>Home</span>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-semibold font-display">Catalog</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* LEFT FILTER SIDEBAR - MATCHING SCREEN 1 PERFECTLY */}
        <aside className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
          
          {/* CATEGORIES SECTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-display">
              Categories (Thể loại)
            </h4>
            <div className="space-y-2.5">
              {categories.length === 0 ? (
                <div className="text-xs text-gray-400 italic">Loading categories...</div>
              ) : (
                categories.map((cat) => {
                  const isChecked = selectedCategory === cat.id;
                  return (
                    <label 
                      key={cat.id} 
                      className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer font-medium select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedCategory(isChecked ? "" : cat.id);
                          setPage(1);
                        }}
                        className="w-4 h-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* AVAILABILITY SECTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-display">
              Availability (Sẵn có)
            </h4>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer font-medium select-none">
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "available"}
                  onChange={() => setAvailability("available")}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span>Available Now</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer font-medium select-none">
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "all"}
                  onChange={() => setAvailability("all")}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span>All Books</span>
              </label>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* RELEASE YEAR SECTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-display">
              Release Year (Năm xuất bản)
            </h4>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl p-2.5 outline-hidden hover:bg-gray-100/50 transition-colors"
            >
              <option value="all">All time</option>
              {uniqueYears.map(year => (
                <option key={year} value={year?.toString()}>{year}</option>
              ))}
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* AUTHORS FILTER */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-display">
              Authors (Tác giả)
            </h4>
            <select
              value={selectedAuthor}
              onChange={(e) => { setSelectedAuthor(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl p-2.5 outline-hidden hover:bg-gray-100/50 transition-colors"
            >
              <option value="">Tất cả tác giả</option>
              {authors.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </select>
          </div>

          {/* RESET BUTTON */}
          <button
            onClick={handleResetFilters}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs uppercase tracking-wider font-display"
          >
            Reset All Filters
          </button>

        </aside>

        {/* RIGHT CATALOG GRID SECTION - MATCHING SCREEN 1 PERFECTLY */}
        <section className="md:col-span-3 space-y-6">
          
          {/* Header area with titles */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pb-2">
            <div>
              <h1 className="text-3xl font-bold font-display text-gray-900 tracking-tight">Library Catalog</h1>
              <p className="text-xs text-gray-500 mt-1">Explore over 45,000 titles in our intellectual archive.</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 self-start sm:self-auto">
              <span>Showing <strong>{filteredBooks.length}</strong> results</span>
              
              {/* Sort selector dropdown */}
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split("-");
                  setSortBy(by);
                  setSortDir(dir);
                  setPage(1);
                }}
                className="bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg px-2 py-1 outline-hidden"
              >
                <option value="createdAt-desc">Most Recent</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="publishedYear-desc">Published Year (New-Old)</option>
              </select>
            </div>
          </div>

          {/* Large Search Bar exactly like Screen 1 */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-2xs flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4.5 top-3.5" />
              <input 
                type="text"
                placeholder="Search by Title, Author, or ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm pl-12 pr-4 py-3 outline-hidden text-gray-900 placeholder:text-gray-400 font-medium"
              />
            </div>
            <button 
              type="submit"
              className="px-6 py-3 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm font-display tracking-wide shrink-0"
            >
              Search Archive
            </button>
          </form>

          {/* Dynamic Grid Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-3xl border border-gray-100">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-xs font-semibold">Scanning intellectual archive...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-3xs text-center p-6 space-y-4">
              <BookOpen className="w-12 h-12 text-gray-300" />
              <div>
                <h3 className="font-bold text-gray-800 text-base">No titles matched your query</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Try resetting filters or checking spelling to find catalog items.</p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-xl text-gray-600 transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const authorNames = book.authorsDetail?.map(a => a?.fullName).join(", ") || "Dr. Alistair Thorne";
                const isAvailable = book.availableCopies > 0;
                const isBookmarked = bookmarkedIds.includes(book.id);

                return (
                  <div 
                    key={book.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-2xs hover:shadow-md transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    onClick={() => setSelectedBookId(book.id)}
                  >
                    {/* Book Cover Image aspect-ratio matches Screen 1 */}
                    <div className="relative aspect-[3/4] bg-slate-900 overflow-hidden shrink-0">
                      <img 
                        src={book.coverImageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1200"} 
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Availability status badge */}
                      <div className="absolute top-3.5 left-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          isAvailable 
                            ? "bg-emerald-500/95 text-white" 
                            : "bg-amber-500/95 text-white"
                        }`}>
                          {isAvailable ? "AVAILABLE" : "RESERVED"}
                        </span>
                      </div>
                    </div>

                    {/* Book Card Bottom metadata exactly matches Screen 1 */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-950 font-display group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm leading-snug">
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 italic font-medium truncate">
                          {authorNames}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 pt-3">
                          <span className="font-mono">ISBN: {book.isbn}</span>
                          <button
                            onClick={(e) => handleToggleBookmark(book.id, e)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                            title="Bookmark"
                          >
                            <Bookmark className={`w-4.5 h-4.5 ${isBookmarked ? "fill-indigo-600 text-indigo-600" : ""}`} />
                          </button>
                        </div>

                        {/* Custom styled primary actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user || user.role === "Guest") {
                              if (onOpenAuth) onOpenAuth("login");
                            } else {
                              setSelectedBookId(book.id);
                            }
                          }}
                          className={`w-full py-2.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                            isAvailable
                              ? "bg-indigo-950 hover:bg-indigo-900 text-white font-display"
                              : "border border-gray-200 hover:bg-slate-50 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {isAvailable ? "Borrow Book" : "Join Waitlist"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls formatted like Screen 1 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                &larr; Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isActive = pNum === page;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-indigo-950 text-white font-display"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          )}

        </section>

      </div>

      {/* Floating feedback/widget button like Screen 1 yellow bubble */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={handleResetFilters}
          className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
          title="Refresh Catalog / Reset Filters"
        >
          <RefreshCw className="w-5 h-5 animate-spin-slow" />
        </button>
      </div>

      {/* View Detail Modal */}
      {selectedBookId && (
        <BookDetailModal 
          bookId={selectedBookId}
          user={user}
          onClose={() => setSelectedBookId(null)}
          onSuccess={(msg) => {
            onSuccessNotification(msg);
            fetchBooks();
          }}
          onOpenAuth={onOpenAuth}
        />
      )}

    </div>
  );
}
