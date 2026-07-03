import React, { useState, useEffect } from "react";
import { Book, User } from "../types";
import { apiRequest } from "../lib/api";
import { 
  Search, BookOpen, Globe, Cpu, Layers, Compass, FileText, Check, 
  Calendar, Users, ArrowRight, ChevronLeft, ChevronRight, Sparkles, 
  Clock, ArrowUpRight, QrCode, X, BookMarked, Bookmark, Award, HelpCircle
} from "lucide-react";
import qrCodeImage from "./qr-code.png";

interface HomeLandingProps {
  user: User | null;
  onNavigateView: (view: string, extraParams?: any) => void;
  onOpenAuth: (mode: "login" | "register") => void;
  onSuccessNotification: (message: string) => void;
  language: "vi" | "en";
}

// Exact 4 books from the screenshot "Recently Added" section with pristine details and cover arts
const FEATURED_BOOKS = [
  {
    id: "featured-1",
    title: "The Architecture of Thought",
    isbn: "978-0195147118",
    author: "Dr. Elena Vance",
    category: "Science",
    status: "AVAILABLE",
    publishedYear: 2024,
    description: "An deep-dive exploration into cognitive networks, neural architecture, and the biological foundations of human contemplation.",
    coverImageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=600"
  },
  {
    id: "featured-2",
    title: "Chronicles of the Silk Road",
    isbn: "978-1400031351",
    author: "Marcus Galloway",
    category: "History",
    status: "ON LOAN",
    publishedYear: 2023,
    description: "A sweeping historical narrative documenting the dynamic cultural, commercial, and artistic exchanges along ancient Eurasian trade networks.",
    coverImageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600"
  },
  {
    id: "featured-3",
    title: "Digital Ethics in the AI Era",
    isbn: "978-0262545303",
    author: "Sarah Jenkins",
    category: "Technology",
    status: "AVAILABLE",
    publishedYear: 2025,
    description: "A foundational text on safety boundaries, machine consciousness, algorithmic bias, and the sociological contracts governing future AI landscapes.",
    coverImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"
  },
  {
    id: "featured-4",
    title: "Luminous Verses",
    isbn: "978-0374100124",
    author: "Julian Thorne",
    category: "Poetry",
    status: "RESERVED",
    publishedYear: 2024,
    description: "A modern anthology of nature-inspired reflective verse, examining the intersection of quiet forest spaces and human emotional seasons.",
    coverImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600"
  }
];

export default function HomeLanding({ user, onNavigateView, onOpenAuth, onSuccessNotification, language }: HomeLandingProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("All Collections");
  const [dbBooks, setDbBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const labels = {
    vi: {
      heroTitle: "Cổng vào Kho tàng",
      heroTitleItalic: "Tri thức Vô hạn",
      heroSub: "Truy cập hơn 2,5 triệu tài nguyên số và tài nguyên vật lý. Từ lưu trữ cổ xưa đến nghiên cứu hiện đại, hành trình vào thế giới trí tuệ của bạn bắt đầu từ đây.",
      searchPlaceholder: "Tìm kiếm sách, bài báo, hoặc tạp chí...",
      allCollections: "Tất cả Bộ sưu tập",
      sciResearch: "Nghiên cứu Khoa học",
      histArchives: "Lưu trữ Lịch sử",
      philosophy: "Triết học",
      poetryVerse: "Thơ ca & Văn thơ",
      exploreBtn: "Khám phá",
      worldClass: "Lưu trữ Đẳng cấp",
      instantDigital: "Truy cập Số Tức thì",
      collaborative: "Không gian Hợp tác",
      recentlyAdded: "Mới cập nhật gần đây",
      recentlyAddedSub: "Khám phá các đầu sách mới nhất được thêm vào thư viện trong tuần này.",
      digitalCatalog: "Catalog Kỹ thuật số",
      digitalCatalogSub: "Truy cập toàn bộ bộ sưu tập từ bất kỳ đâu trên thế giới. Quét độ phân giải cao các tài liệu quý hiếm và mượn sách điện tử tích hợp.",
      studySpaces: "Không gian học tập",
      studySpacesSub: "Khu vực yên tĩnh, phòng học nhóm và các cabin riêng dành cho học tập chuyên sâu. Đặt chỗ trước qua cổng trực tuyến.",
      researchSupport: "Hỗ trợ Nghiên cứu",
      researchSupportSub: "Tư vấn trực tiếp 1-1 với thủ thư chuyên ngành để hỗ trợ tra cứu cơ sở dữ liệu phức tạp và xác thực tài liệu tham khảo.",
      learnMore: "Tìm hiểu thêm",
      reserveSpace: "Đặt không gian",
      meetLibrarian: "Gặp thủ thư",
      available: "SẴN CÓ",
      onLoan: "ĐANG MƯỢN",
      reserved: "ĐÃ ĐẶT",
      curatedCol: "Bộ sưu tập Chọn lọc",
      curatedColSub: "Các lộ trình nghiên cứu chọn lọc được xây dựng bởi các thủ thư hàng đầu của chúng tôi.",
      elevateTitle: "Nâng Tầm Nghiên Cứu Của Bạn",
      elevateSub: "Mở khóa lưu trữ toàn cầu, không gian cao cấp và các gói tư vấn chuyên gia.",
      activePlan: "Gói hoạt động",
      upgradeBtn: "Nâng cấp ngay",
      requestUpgrade: "Yêu cầu Nâng cấp",
      confirmUpgrade: "Xác nhận nâng cấp gói thành viên",
      processing: "Đang xử lý...",
      confirmBtn: "Xác nhận thanh toán",
      closeBtn: "Đóng",
      allColText: "Tất cả Bộ sưu tập",
      historyArchivesText: "Lưu trữ Lịch sử",
      philosophyText: "Triết học",
      poetryText: "Thơ ca & Văn thơ",
      viewCatalog: "Xem Catalog",
      exclusive: "ĐỘC QUYỀN",
      exploreArchive: "Khám phá Lưu trữ",
      wifi: "Mạng Wifi Tốc độ cao",
      privateGroup: "Phòng Học nhóm Riêng tư",
      expertConsult: "Tư vấn Chuyên gia",
      citationWork: "Hội thảo Trích dẫn",
      remoteAccess: "Truy cập từ xa 24/7",
      interlibrary: "Mượn liên thư viện"
    },
    en: {
      heroTitle: "The Gateway to",
      heroTitleItalic: "Boundless Knowledge",
      heroSub: "Access over 2.5 million digital and physical resources. From ancient archives to modern research, your journey into the intellectual world begins here.",
      searchPlaceholder: "Search books, articles, or journals...",
      allCollections: "All Collections",
      sciResearch: "Scientific Research",
      histArchives: "Historical Archives",
      philosophy: "Philosophy",
      poetryVerse: "Poetry & Verse",
      exploreBtn: "Explore",
      worldClass: "World-Class Archive",
      instantDigital: "Instant Digital Access",
      collaborative: "Collaborative Spaces",
      recentlyAdded: "Recently Added",
      recentlyAddedSub: "Explore newly cataloged titles added to our local stacks this week.",
      digitalCatalog: "Digital Catalog",
      digitalCatalogSub: "Access our entire collection from anywhere in the world. High-resolution scans of rare documents and integrated e-book lending.",
      studySpaces: "Study Spaces",
      studySpacesSub: "Quiet zones, collaborative labs, and private carrels designed for deep focus. Reserve your spot through our online portal.",
      researchSupport: "Research Support",
      researchSupportSub: "One-on-one consultations with subject librarians to help you navigate complex databases and verify sources.",
      learnMore: "Learn More",
      reserveSpace: "Reserve Space",
      meetLibrarian: "Meet a Librarian",
      available: "AVAILABLE",
      onLoan: "ON LOAN",
      reserved: "RESERVED",
      curatedCol: "Curated Collections",
      curatedColSub: "Hand-picked research paths curated by our lead archivists.",
      elevateTitle: "Elevate Your Research",
      elevateSub: "Unlock global archives, premium spaces, and expert consultation tiers.",
      activePlan: "Active Plan",
      upgradeBtn: "Upgrade Now",
      requestUpgrade: "Request Upgrade",
      confirmUpgrade: "Confirm Membership Upgrade",
      processing: "Processing...",
      confirmBtn: "Confirm Payment",
      closeBtn: "Close",
      allColText: "All Collections",
      historyArchivesText: "Historical Archives",
      philosophyText: "Philosophy",
      poetryText: "Poetry & Verse",
      viewCatalog: "View Catalog",
      exclusive: "EXCLUSIVE",
      exploreArchive: "Explore Archive",
      wifi: "High-Speed Fiber WiFi",
      privateGroup: "Private Group Rooms",
      expertConsult: "Expert Consultations",
      citationWork: "Citation Workshops",
      remoteAccess: "24/7 Remote Access",
      interlibrary: "Inter-library Loans"
    }
  }[language];

  const displayBooks = dbBooks.length > 0 
    ? dbBooks.map(b => ({
        id: b.id.toString(),
        title: b.title,
        isbn: b.isbn,
        author: b.authorsDetail?.map(a => a?.fullName).join(", ") || "Chưa rõ",
        category: b.categoryDetail?.name || "Khác",
        status: b.availableCopies > 0 ? "AVAILABLE" : "ON LOAN",
        publishedYear: b.publishedYear || (b.createdAt ? new Date(b.createdAt).getFullYear() : 2026),
        coverImageUrl: b.coverImageUrl || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=600"
      }))
    : FEATURED_BOOKS;

  // Modals for interactive "Elevate Your Research" columns
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showLibrarianModal, setShowLibrarianModal] = useState(false);
  const [showTiersModal, setShowTiersModal] = useState(false);

  // Membership & Payment States
  const membershipTier = user?.membershipTier || "Academic Member";
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<{ name: string; price: number; priceStr: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "bank" | "momo" | "zalopay">("qr");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleInitiatePayment = (name: string, price: number, priceStr: string) => {
    if (!user || user.role === "Guest") {
      onOpenAuth("login");
      setShowTiersModal(false);
      return;
    }
    setSelectedTier({ name, price, priceStr });
    setShowTiersModal(false);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setPaymentProcessing(false);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTier) return;
    setPaymentProcessing(true);
    
    const res = await apiRequest("/api/membership-requests", "POST", {
      tierName: selectedTier.name,
      price: selectedTier.price,
      paymentMethod,
    });
    
    setPaymentProcessing(false);
    if (res.success) {
      setPaymentSuccess(true);
      onSuccessNotification("Yêu cầu nâng cấp của bạn đã được gửi tới quản trị viên.");
    } else {
      alert(res.message);
    }
  };

  // Reservation Form State
  const [reserveSpaceName, setReserveSpaceName] = useState("");
  const [reserveSpaceType, setReserveSpaceType] = useState("Quiet Study Cubicle");
  const [reserveSpaceDate, setReserveSpaceDate] = useState("2026-06-30");
  const [reserveSpaceTime, setReserveSpaceTime] = useState("10:00 AM");
  const [reserveSuccessTicket, setReserveSuccessTicket] = useState<any | null>(null);

  // Consultation Form State
  const [librarianName, setLibrarianName] = useState("Dr. Alistair Thorne");
  const [consultSubject, setConsultSubject] = useState("");
  const [consultDate, setConsultDate] = useState("2026-06-30");
  const [consultTime, setConsultTime] = useState("02:00 PM");
  const [consultSuccessTicket, setConsultSuccessTicket] = useState<any | null>(null);

  // Carousel Slider State
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch real books from DB to blend or fallback
  useEffect(() => {
    setLoadingBooks(true);
    apiRequest<Book[]>("/api/books?pageSize=8&sortBy=createdAt&sortDir=desc")
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setDbBooks(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBooks(false));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateView("catalog", { search: searchText, collection: selectedCollection });
  };

  const handleCarouselPrev = () => {
    setCarouselIndex((prev) => (prev === 0 ? displayBooks.length - 1 : prev - 1));
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prev) => (prev === displayBooks.length - 1 ? 0 : prev + 1));
  };

  // Space Reservation Submit
  const handleReserveSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth("login");
      return;
    }
    const ticket = {
      id: "SPC-" + Math.floor(100000 + Math.random() * 900000),
      memberName: user.fullName,
      spaceType: reserveSpaceType,
      date: reserveSpaceDate,
      time: reserveSpaceTime,
      code: "LUM-" + Math.floor(1000 + Math.random() * 9000)
    };
    setReserveSuccessTicket(ticket);
    onSuccessNotification(`Successfully reserved study spot: ${reserveSpaceType}!`);
  };

  // Consultation Submit
  const handleConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth("login");
      return;
    }
    const ticket = {
      id: "LBR-" + Math.floor(100000 + Math.random() * 900000),
      memberName: user.fullName,
      librarian: librarianName,
      subject: consultSubject || "General Archival Inquiry",
      date: consultDate,
      time: consultTime
    };
    setConsultSuccessTicket(ticket);
    onSuccessNotification(`Successfully scheduled session with ${librarianName}!`);
  };

  return (
    <div className="space-y-16 pb-12 animate-fade-in">
      
      {/* 1. HERO SECTION - SCREENSHOT DESIGN PERFECT */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[520px] flex flex-col justify-center items-center px-6 py-16 text-center">
        
        {/* Bookshelf background image overlaid with high-fidelity dark slate blue overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2000" 
            alt="Library Archival Shelf" 
            className="w-full h-full object-cover transform scale-105 filter brightness-50"
          />
          {/* Exact color gradient mirroring Screenshot header background */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-slate-900/90 to-indigo-950/95 mix-blend-multiply"></div>
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-3xl space-y-8">
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-serif leading-tight">
              {labels.heroTitle} <br />
              <span className="text-amber-400 font-serif italic font-normal">{labels.heroTitleItalic}</span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              {labels.heroSub}
            </p>
          </div>

          {/* Elegant search box exactly like Image 1 */}
          <form 
            onSubmit={handleHeroSearch}
            className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2 border border-white/20"
          >
            {/* Search inputs */}
            <div className="flex items-center gap-3 pl-3 flex-1 w-full">
              <Search className="w-5 h-5 text-indigo-950 shrink-0" />
              <input 
                type="text"
                placeholder={labels.searchPlaceholder}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 font-semibold outline-hidden w-full py-2"
              />
            </div>

            {/* Collections selector */}
            <div className="flex items-center border-t sm:border-t-0 sm:border-l border-slate-200 py-2 sm:py-0 px-3 shrink-0 w-full sm:w-auto">
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-extrabold outline-hidden cursor-pointer w-full sm:w-auto py-1"
              >
                <option value="All Collections">{labels.allColText}</option>
                <option value="Science">{labels.sciResearch}</option>
                <option value="History">{labels.histArchives}</option>
                <option value="Philosophy">{labels.philosophyText}</option>
                <option value="Poetry">{labels.poetryText}</option>
              </select>
            </div>

            {/* Explore Button */}
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 bg-indigo-950 hover:bg-indigo-900 active:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all font-display tracking-wider shrink-0 uppercase"
            >
              {labels.exploreBtn}
            </button>
          </form>

          {/* Bullet sub-indicators precisely matching Image 1 footer of hero */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 pt-4 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>{labels.worldClass}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>{labels.instantDigital}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{labels.collaborative}</span>
            </div>
          </div>

        </div>

      </section>

      {/* 2. CURATED COLLECTIONS - SCREENSHOT EXACT LAYOUT */}
      <section id="curated-collections" className="space-y-6">
        
        {/* Heading Panel */}
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              {labels.curatedCol}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {labels.curatedColSub}
            </p>
          </div>
          <button 
            onClick={() => onNavigateView("catalog")}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 hover:text-indigo-800 transition-colors group"
          >
            {labels.viewCatalog} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Dynamic Grid exactly replicating layout from Screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Large portrait/tall block (The Renaissance Archives) - takes 1/3 layout */}
          <div 
            onClick={() => onNavigateView("catalog", { category: "History", search: "Renaissance" })}
            className="md:col-span-1 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer aspect-[4/5] md:h-full flex flex-col justify-end p-6"
          >
            {/* Background book details image overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1200" 
                alt="Ancient leather book cover details"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            </div>

            {/* Card Content */}
            <div className="relative z-10 space-y-4">
              <span className="inline-block px-2.5 py-1 bg-amber-500 text-[9px] font-black uppercase text-slate-950 rounded-md tracking-wider">
                {labels.exclusive}
              </span>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white font-serif leading-snug">
                  {language === "vi" ? "Lưu trữ thời Phục hưng" : "The Renaissance Archives"}
                </h3>
                <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {language === "vi" ? "Khám phá các bản thảo quan trọng định hình triết học, vật lý và nghệ thuật thế giới." : "Discover the pivotal manuscripts that shaped modern philosophy, physics, and world art."}
                </p>
              </div>
              <button className="px-5 py-2.5 bg-white text-slate-950 text-xs font-bold rounded-xl shadow-xs group-hover:bg-amber-400 group-hover:text-slate-950 transition-all font-display">
                {labels.exploreArchive}
              </button>
            </div>
          </div>

          {/* Right layout: Spanning 2/3, containing 1 large row and 2 split columns */}
          <div className="md:col-span-2 grid grid-rows-2 gap-6">
            
            {/* Card 2: Top Landscape Block (Contemporary Studies) */}
            <div 
              onClick={() => onNavigateView("catalog", { category: "Science" })}
              className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-end p-6"
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200" 
                  alt="Modern structural research library room"
                  className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
              </div>

              <div className="relative z-10 space-y-1">
                <h3 className="text-lg font-bold text-white font-serif leading-snug">
                  {language === "vi" ? "Nghiên cứu Đương đại" : "Contemporary Studies"}
                </h3>
                <p className="text-xs text-slate-300 font-medium max-w-md line-clamp-1">
                  {language === "vi" ? "Thông tin mới nhất về nghiên cứu khoa học toàn cầu và các tạp chí xã hội học." : "The latest in global scientific research and sociological journals."}
                </p>
              </div>
            </div>

            {/* Split row: Card 3 & Card 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Card 3: Solid Dark Blue Block (Poetry & Verse) */}
              <div 
                onClick={() => onNavigateView("catalog", { category: "Poetry" })}
                className="bg-indigo-950/95 hover:bg-indigo-900 border border-indigo-900/50 rounded-3xl p-6 flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                <div className="w-10 h-10 bg-indigo-900/50 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1 pt-8">
                  <h3 className="text-base font-bold text-white font-serif">{labels.poetryText}</h3>
                  <p className="text-xs text-indigo-200/80 font-semibold uppercase tracking-wider">{language === "vi" ? "Hơn 12.000 đầu sách" : "12,000+ Titles"}</p>
                </div>
              </div>

              {/* Card 4: Light greyish-blue Block (Local History) */}
              <div 
                onClick={() => onNavigateView("catalog", { category: "History" })}
                className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/40 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer"
              >
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-950 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="space-y-1 pt-8">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">{language === "vi" ? "Lịch sử Địa phương" : "Local History"}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{language === "vi" ? "Lưu trữ Thành phố" : "City Archives"}</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 3. ELEVATE YOUR RESEARCH - 3 COLUMN INFO GRID */}
      <section id="elevate-research" className="space-y-8 py-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl px-6 md:px-8">
        
        {/* Centered Heading */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 tracking-tight">
            {labels.elevateTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {labels.elevateSub}
          </p>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Digital Catalog */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-950 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-serif">{labels.digitalCatalog}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {labels.digitalCatalogSub}
                </p>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{labels.remoteAccess}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{labels.interlibrary}</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onNavigateView("catalog")}
              className="text-xs font-bold text-indigo-950 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 self-start cursor-pointer"
            >
              {labels.learnMore} &rarr;
            </button>
          </div>

          {/* Column 2: Study Spaces */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-950 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-serif">{labels.studySpaces}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {labels.studySpacesSub}
                </p>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{labels.wifi}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{labels.privateGroup}</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => {
                if (!user) {
                  onOpenAuth("login");
                } else {
                  setShowSpaceModal(true);
                }
              }}
              className="text-xs font-bold text-indigo-950 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 self-start cursor-pointer"
            >
              {labels.reserveSpace} &rarr;
            </button>
          </div>

          {/* Column 3: Research Support */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-950 dark:text-indigo-400">
                <Compass className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-serif">{labels.researchSupport}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {labels.researchSupportSub}
                </p>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{labels.expertConsult}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{labels.citationWork}</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => {
                if (!user) {
                  onOpenAuth("login");
                } else {
                  setShowLibrarianModal(true);
                }
              }}
              className="text-xs font-bold text-indigo-950 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 self-start cursor-pointer"
            >
              {labels.meetLibrarian} &rarr;
            </button>
          </div>

        </div>

      </section>

      {/* 4. RECENTLY ADDED SECTION - REAL CAROUSEL OF CARD ASSETS */}
      <section className="space-y-6">
        
        {/* Title area with Carousel Controls */}
        <div className="flex justify-between items-end border-b pb-4 border-slate-100">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              {labels.recentlyAdded}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {labels.recentlyAddedSub}
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2">
            <button 
              onClick={handleCarouselPrev}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full transition-all cursor-pointer"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleCarouselNext}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full transition-all cursor-pointer"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Items Grid matching image 1 cards layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayBooks.map((book, index) => {
            // Determine active items depending on carousel slide shift to animate beautifully
            const isFirstActive = (index + carouselIndex) % displayBooks.length;

            return (
              <div 
                key={book.id}
                onClick={() => onNavigateView("catalog", { search: book.title })}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100/90 shadow-2xs hover:shadow-lg transition-all duration-300 group flex flex-col h-full cursor-pointer hover:-translate-y-1"
              >
                {/* Visual Cover image aspect ratios matching image 1 perfectly */}
                <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden shrink-0">
                  <img 
                    src={book.coverImageUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Category Pill Tag exactly overlayed */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 bg-white/95 text-slate-900 border border-slate-100 font-bold text-[9px] uppercase tracking-wider rounded-lg shadow-3xs">
                      {book.category}
                    </span>
                  </div>
                </div>

                {/* Metadata details panel below card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-950 font-serif leading-snug text-[14px] group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 italic font-medium leading-none">
                      {book.author}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    {/* Exact Badge status colors of image 1 */}
                    <span className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-md ${
                      book.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" :
                      book.status === "ON LOAN" ? "bg-amber-50 text-amber-700 border border-amber-100/50" :
                      "bg-purple-50 text-purple-700 border border-purple-100/50"
                    }`}>
                      {book.status === "AVAILABLE" ? labels.available :
                       book.status === "ON LOAN" ? labels.onLoan : labels.reserved}
                    </span>

                    <span className="text-[10px] text-slate-400 font-bold">
                      {book.publishedYear}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* 5. BECOME A MEMBER OF LUMINA - SCREENSHOT HIGH QUALITY SECTION */}
      <section id="membership-section" className="relative rounded-3xl bg-slate-900 text-white overflow-hidden shadow-xl p-8 md:p-12 border border-slate-800">
        
        {/* Abstract highlights */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl"></div>
          <div className="absolute left-10 bottom-0 w-80 h-80 rounded-full bg-slate-800/20 blur-3xl"></div>
        </div>

        {/* Dynamic Inner Layout split 1/2 */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left panel: Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                Member Access
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight font-serif text-white">
                Become a Member of Lumina
              </h2>
              <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-md">
                Join a community of 50,000+ thinkers. Enjoy unlimited borrowing, reserved study zones, and invitations to exclusive literary events.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  if (user) {
                    onSuccessNotification("You are already registered!");
                  } else {
                    onOpenAuth("register");
                  }
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all font-display tracking-wider uppercase cursor-pointer"
              >
                Join Library Today
              </button>
              
              <button 
                onClick={() => setShowTiersModal(true)}
                className="px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-extrabold text-xs rounded-xl transition-all font-display tracking-wider uppercase cursor-pointer"
              >
                Membership Tiers
              </button>
            </div>
          </div>

          {/* Right panel: Physical Library Pass visualization replicating Image 1 card perfectly */}
          <div className="flex justify-center md:justify-end">
            
            {/* Card Asset styled precisely using CSS glassmorphism */}
            <div className="w-full max-w-xs aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-indigo-950/90 border border-white/15 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-white/30 transition-all duration-300">
              
              {/* Gold Chip / Metallic badge top left */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-slate-950">
                      <Award className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-[10px] font-black text-slate-200 tracking-wider font-display uppercase">Lumina Pass</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {user && user.role !== "Guest" ? (user.role === "Admin" ? "System Controller" : user.role === "Librarian" ? "Librarian Member" : membershipTier) : "Guest Visitor"}
                  </p>
                </div>
                
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>

              {/* Center RFID/Horizontal track lines */}
              <div className="space-y-2 py-4">
                <div className="h-1 bg-white/10 rounded-full w-full"></div>
                <div className="h-1 bg-white/10 rounded-full w-3/4"></div>
              </div>

              {/* Bottom detail row */}
              <div className="flex justify-between items-end border-t border-white/10 pt-3">
                <div className="text-[9px] text-slate-400 font-semibold space-y-0.5">
                  <span className="block text-slate-200 font-extrabold font-display uppercase tracking-wider">
                    {user && user.role !== "Guest" ? user.fullName : "Khách (Guest)"}
                  </span>
                  <span>ID: {user && user.role !== "Guest" ? user.id.slice(0, 8).toUpperCase() : "GUEST-VISITOR"}</span>
                </div>

                <div className="text-right">
                  <span className="text-[7.5px] text-amber-500 font-black block uppercase tracking-widest font-display">VALID UNTIL</span>
                  <span className="text-[9px] text-slate-300 font-mono font-bold block">DEC 2029</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER is mounted globally at App.tsx */}

      {/* ================= MODAL DIALOGS ================= */}
      
      {/* 1. STUDY SPACES BOOKING MODAL */}
      {showSpaceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative space-y-4">
            
            <button 
              onClick={() => { setShowSpaceModal(false); setReserveSuccessTicket(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-lg font-serif">Reserve a Study Space</h3>
              <p className="text-xs text-slate-400 font-medium">Enjoy silent study zones or book a private room for group meetings.</p>
            </div>

            {reserveSuccessTicket ? (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-4 animate-fade-in text-xs">
                <span className="inline-block p-2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                  <Check className="w-5 h-5" />
                </span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Spot Reserved Successfully!</h4>
                  <p className="text-[10px] text-slate-500">Present this digital pass at the reception counter upon arrival.</p>
                </div>
                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Pass ID:</span>
                    <span className="font-mono font-bold text-slate-800">{reserveSuccessTicket.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Member:</span>
                    <span className="font-bold text-slate-800">{reserveSuccessTicket.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Zone/Spot:</span>
                    <span className="font-bold text-indigo-700">{reserveSuccessTicket.spaceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Schedule:</span>
                    <span className="font-bold text-slate-800">{reserveSuccessTicket.date} at {reserveSuccessTicket.time}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                    <span className="text-slate-400 font-bold">Access Code:</span>
                    <span className="font-mono font-black text-amber-600">{reserveSuccessTicket.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowSpaceModal(false); setReserveSuccessTicket(null); }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReserveSpace} className="space-y-4 text-xs font-semibold">
                
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Choose Study Zone *</label>
                  <select
                    value={reserveSpaceType}
                    onChange={(e) => setReserveSpaceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden text-slate-900 font-bold"
                  >
                    <option value="Quiet Study Cubicle">Quiet Study Cubicle (Khu vực yên tĩnh)</option>
                    <option value="Collab Discussion Room A">Collab Discussion Room A (Khu thảo luận)</option>
                    <option value="Media Pod Room 3">Media Pod Room 3 (Khu trình chiếu)</option>
                    <option value="Scientific Research Desk">Scientific Research Desk (Bàn nghiên cứu)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Select Date *</label>
                    <input
                      type="date"
                      required
                      value={reserveSpaceDate}
                      onChange={(e) => setReserveSpaceDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-hidden text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Select Time Slot *</label>
                    <select
                      value={reserveSpaceTime}
                      onChange={(e) => setReserveSpaceTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-hidden text-slate-900 font-semibold"
                    >
                      <option value="08:00 AM">08:00 AM - 10:00 AM</option>
                      <option value="10:00 AM">10:00 AM - 12:00 PM</option>
                      <option value="01:00 PM">01:00 PM - 03:00 PM</option>
                      <option value="03:00 PM">03:00 PM - 05:00 PM</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs tracking-wider uppercase"
                >
                  Confirm Reservation
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 2. MEET A LIBRARIAN CONSULTATION MODAL */}
      {showLibrarianModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative space-y-4">
            
            <button 
              onClick={() => { setShowLibrarianModal(false); setConsultSuccessTicket(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-lg font-serif">Meet a Librarian</h3>
              <p className="text-xs text-slate-400 font-medium">Book a 30-minute private consulting session to search database archives or verify dissertation citation indices.</p>
            </div>

            {consultSuccessTicket ? (
              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-center space-y-4 animate-fade-in text-xs">
                <span className="inline-block p-2 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                  <Check className="w-5 h-5" />
                </span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-indigo-950 text-sm">Consultation Scheduled!</h4>
                  <p className="text-[10px] text-slate-500">A calendar invite and Zoom link have been forwarded to your email.</p>
                </div>
                <div className="bg-white border border-dashed border-indigo-100 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-indigo-400 font-bold">Meeting ID:</span>
                    <span className="font-mono font-bold text-slate-800">{consultSuccessTicket.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-400 font-bold">Consultant:</span>
                    <span className="font-bold text-indigo-900">{consultSuccessTicket.librarian}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-400 font-bold">Topic Focus:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">{consultSuccessTicket.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-400 font-bold">Schedule:</span>
                    <span className="font-bold text-slate-800">{consultSuccessTicket.date} at {consultSuccessTicket.time}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowLibrarianModal(false); setConsultSuccessTicket(null); }}
                  className="w-full py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConsultation} className="space-y-4 text-xs font-semibold">
                
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Select Research Advisor *</label>
                  <select
                    value={librarianName}
                    onChange={(e) => setLibrarianName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden text-slate-900 font-bold"
                  >
                    <option value="Dr. Alistair Thorne">Dr. Alistair Thorne (Historical Archives)</option>
                    <option value="Sarah Jenkins, MLIS">Sarah Jenkins, MLIS (AI &amp; Tech Systems)</option>
                    <option value="Dr. Elena Vance">Dr. Elena Vance (Bio-Science &amp; Cognition)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Brief Topic/Subject Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Quantum entanglement indices, ancient silk road map scrolls"
                    value={consultSubject}
                    onChange={(e) => setConsultSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-hidden text-slate-900 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Select Date *</label>
                    <input
                      type="date"
                      required
                      value={consultDate}
                      onChange={(e) => setConsultDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-hidden text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Select Slot *</label>
                    <select
                      value={consultTime}
                      onChange={(e) => setConsultTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-hidden text-slate-900 font-semibold"
                    >
                      <option value="09:00 AM">09:00 AM - 09:30 AM</option>
                      <option value="11:00 AM">11:00 AM - 11:30 AM</option>
                      <option value="02:00 PM">02:00 PM - 02:30 PM</option>
                      <option value="04:00 PM">04:00 PM - 04:30 PM</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs tracking-wider uppercase"
                >
                  Schedule Appointment
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 3. MEMBERSHIP TIERS INFO MODAL */}
      {showTiersModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative space-y-4">
            
            <button 
              onClick={() => setShowTiersModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 text-center">
              <h3 className="font-bold text-slate-900 text-lg font-serif">Lumina Membership Tiers</h3>
              <p className="text-xs text-slate-400 font-medium">Unlock exclusive benefits designed for different learning goals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              
              {/* Tier 1 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-4 bg-slate-50/50">
                <div className="space-y-2">
                  <span className="font-bold text-slate-400 block uppercase text-[9px]">Standard</span>
                  <h4 className="font-black text-slate-900 text-sm">Academic Member</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Standard community reading privileges.</p>
                  <ul className="space-y-1.5 font-bold text-slate-600 pt-2 text-[10px]">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Borrow 5 Books</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>14-day Loans</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center bg-slate-200/50 text-slate-700 py-1.5 font-black uppercase text-[10px] rounded-lg tracking-wider">
                  FREE
                </div>
              </div>

              {/* Tier 2 */}
              <div className="border border-indigo-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 bg-indigo-50/30">
                <div className="space-y-2">
                  <span className="font-bold text-indigo-500 block uppercase text-[9px]">Popular</span>
                  <h4 className="font-black text-slate-900 text-sm">Archive Scholar</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Enhanced research and workspace bookings.</p>
                  <ul className="space-y-1.5 font-bold text-slate-600 pt-2 text-[10px]">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Borrow 12 Books</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>30-day Loans</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Priority Rooms</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleInitiatePayment("Archive Scholar", 99000, "99,000đ / mo")}
                  className="w-full text-center bg-indigo-950 hover:bg-indigo-900 text-white py-1.5 font-black uppercase text-[10px] rounded-lg tracking-wider cursor-pointer font-display"
                >
                  99,000đ / mo
                </button>
              </div>

              {/* Tier 3 */}
              <div className="border border-amber-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 bg-amber-50/30">
                <div className="space-y-2">
                  <span className="font-bold text-amber-600 block uppercase text-[9px]">Premium</span>
                  <h4 className="font-black text-slate-900 text-sm">Research Fellow</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Ultimate access to manuscript archives.</p>
                  <ul className="space-y-1.5 font-bold text-slate-600 pt-2 text-[10px]">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unlimited Books</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Free Inter-library</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Private Desks</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleInitiatePayment("Research Fellow", 249000, "249,000đ / mo")}
                  className="w-full text-center bg-amber-500 hover:bg-amber-600 text-slate-950 py-1.5 font-black uppercase text-[10px] rounded-lg tracking-wider cursor-pointer font-display"
                >
                  249,000đ / mo
                </button>
              </div>

            </div>

          </div>
        </div>
      )}


      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative space-y-4">
            
            <button 
              onClick={() => {
                if (!paymentProcessing) {
                  setShowPaymentModal(false);
                  setSelectedTier(null);
                }
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentSuccess ? (
              // SUCCESS SCREEN
              <div className="p-5 text-center space-y-4 animate-fade-in text-xs">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-base font-serif">Đã gửi yêu cầu của bạn!</h4>
                  <p className="text-slate-400 font-medium font-sans">Bạn vui lòng đợi vài phút để admin xác nhận nha.</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5 font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gói hội viên đăng ký:</span>
                    <span className="text-indigo-950 font-black">{selectedTier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Họ và tên:</span>
                    <span>{user?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tiền chuyển khoản:</span>
                    <span>{selectedTier.priceStr}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="text-slate-400">Trạng thái yêu cầu:</span>
                    <span className="text-amber-500 font-bold uppercase">Pending Admin Approval</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedTier(null);
                  }}
                  className="w-full py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : paymentProcessing ? (
              // PROCESSING SCREEN
              <div className="py-12 text-center space-y-4 text-xs font-semibold">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-slate-900 font-bold">Verifying Transaction Ledger...</p>
                  <p className="text-slate-400 font-medium">Hệ thống đang quét giao dịch ngân hàng thời gian thực. Vui lòng chờ.</p>
                </div>
              </div>
            ) : (
              // PAYMENT OPTION SELECTION SCREEN
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <span className="font-bold text-indigo-500 uppercase tracking-widest text-[9px]">Upgrade Membership</span>
                  <h3 className="font-bold text-slate-900 text-lg font-serif">Thanh toán nâng cấp hội viên</h3>
                  <p className="text-slate-400 font-semibold font-sans">
                    Nâng cấp tài khoản lên <span className="font-bold text-slate-800">{selectedTier.name}</span> với mức phí <span className="font-bold text-slate-850">{selectedTier.priceStr}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Left Side: Payment Method Options */}
                  <div className="md:col-span-2 flex flex-col gap-2 font-bold text-[10px] text-slate-500">
                    <button
                      onClick={() => setPaymentMethod("qr")}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === "qr"
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-950"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                      }`}
                    >
                      📱 Chuyển khoản QR
                    </button>
                    <button
                      onClick={() => setPaymentMethod("bank")}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === "bank"
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-950"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                      }`}
                    >
                      🏦 Nhập số tài khoản
                    </button>
                    <button
                      onClick={() => setPaymentMethod("momo")}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === "momo"
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-950"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                      }`}
                    >
                      🔴 Ví điện tử MoMo
                    </button>
                    <button
                      onClick={() => setPaymentMethod("zalopay")}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === "zalopay"
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-950"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                      }`}
                    >
                      🔵 Ví ZaloPay
                    </button>
                  </div>

                  {/* Right Side: Specific Details */}
                  <div className="md:col-span-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 min-h-[220px]">
                    {paymentMethod === "qr" && (
                      <div className="space-y-2 flex flex-col items-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quét mã QR Techcombank</p>
                        <div className="bg-white p-2 rounded-xl border shadow-3xs max-w-[150px]">
                          <img src={qrCodeImage} alt="Techcombank QR Code" className="w-full object-contain rounded-lg" />
                        </div>
                        <div className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                          <p>Chủ tài khoản: <span className="font-extrabold text-slate-800">NGUYEN HONG MINH</span></p>
                          <p>Nội dung CK: <span className="font-bold text-indigo-600">LUMINA {user?.id.toUpperCase().slice(0, 6)}</span></p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "bank" && (
                      <div className="space-y-3 w-full text-left font-semibold">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">Thông tin chuyển khoản</p>
                        <div className="space-y-2 bg-white p-3 rounded-xl border text-[11px] text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ngân hàng:</span>
                            <span className="font-bold text-slate-900">Techcombank</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Số tài khoản:</span>
                            <span className="font-extrabold text-slate-900">2324 1220 04</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Chủ tài khoản:</span>
                            <span className="font-bold text-slate-900">NGUYEN HONG MINH</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Số tiền:</span>
                            <span className="font-bold text-slate-900">{selectedTier.price.toLocaleString("vi-VN")}đ</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 text-indigo-600 font-bold text-[10px]">
                            <span>Nội dung chuyển:</span>
                            <span>LUMINA {user?.id.toUpperCase().slice(0, 6)}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 text-center font-medium leading-relaxed">
                          Dịch vụ sẽ tự động kích hoạt sau khi giao dịch chuyển khoản thành công.
                        </p>
                      </div>
                    )}

                    {paymentMethod === "momo" && (
                      <div className="space-y-4 flex flex-col items-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thanh toán qua ví MoMo</p>
                        <div className="bg-white p-4 rounded-2xl border flex flex-col items-center gap-2 w-full max-w-[200px]">
                          <span className="w-10 h-10 bg-[#A50064] text-white font-black rounded-lg flex items-center justify-center text-sm shadow-sm">M</span>
                          <div className="text-[10px] text-slate-700 text-center font-semibold">
                            <p className="text-slate-400 text-[9px]">Số điện thoại MoMo:</p>
                            <p className="font-extrabold text-slate-800 text-xs">0987 654 321</p>
                            <p className="text-slate-400 text-[9px] mt-1.5">Tên người nhận:</p>
                            <p className="font-extrabold text-slate-800">NGUYEN HONG MINH</p>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Nội dung chuyển: <span className="font-bold text-indigo-600">LUMINA {user?.id.toUpperCase().slice(0, 6)}</span>
                        </p>
                      </div>
                    )}

                    {paymentMethod === "zalopay" && (
                      <div className="space-y-4 flex flex-col items-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thanh toán qua ZaloPay</p>
                        <div className="bg-white p-4 rounded-2xl border flex flex-col items-center gap-2 w-full max-w-[200px]">
                          <span className="w-10 h-10 bg-[#00e676] text-slate-950 font-black rounded-lg flex items-center justify-center text-sm shadow-sm">ZP</span>
                          <div className="text-[10px] text-slate-700 text-center font-semibold">
                            <p className="text-slate-400 text-[9px]">Số điện thoại / ID ZP:</p>
                            <p className="font-extrabold text-slate-800 text-xs">0987 654 321</p>
                            <p className="text-slate-400 text-[9px] mt-1.5">Tên người nhận:</p>
                            <p className="font-extrabold text-slate-800">NGUYEN HONG MINH</p>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Nội dung chuyển: <span className="font-bold text-indigo-600">LUMINA {user?.id.toUpperCase().slice(0, 6)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedTier(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Xác nhận đã thanh toán
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
