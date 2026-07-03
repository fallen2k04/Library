import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BookOpen, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Search, 
  Share2, 
  Play, 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Clock, 
  Coins, 
  Building, 
  ChevronDown,
  ChevronRight,
  Sparkles,
  Heart
} from "lucide-react";
import { User } from "../types";

interface EventReview {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  hasLiked?: boolean;
}

interface EventSchedule {
  time: string;
  title: string;
  description: string;
}

interface EventSpeaker {
  name: string;
  title: string;
  image: string;
}

interface Event {
  id: string;
  title: string;
  tag: "Workshop" | "Talkshow" | "Competition" | "Course" | "Book Festival" | "Community";
  status: "Còn chỗ" | "Đã đóng";
  description: string;
  longDescription: string;
  goals: string[];
  date: string;
  location: string;
  registeredCount: number;
  maxCapacity: number;
  isRegistered: boolean;
  image: string;
  speakers: EventSpeaker[];
  schedule: EventSchedule[];
  fee: string;
  host: string;
  deadline: string;
  imagesGallery: string[];
  reviews: EventReview[];
  rating: number;
}

interface EventsViewProps {
  user: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onSuccessNotification: (message: string) => void;
  language: "vi" | "en";
}

const PRE_SEEDED_EVENTS: Event[] = [
  {
    id: "evt-1",
    title: "Ngày hội đọc sách 2026",
    tag: "Book Festival",
    status: "Còn chỗ",
    description: "Chào mừng bạn đến với Ngày hội đọc sách 2026, sự kiện thường niên lớn nhất tại Thư viện Lumina dành cho cộng đồng yêu tri thức. Trong bối cảnh kỷ nguyên số bùng nổ, chúng tôi tin rằng việc đọc sách không chỉ là tiếp nhận thông tin mà còn là hành trình kết nối tâm hồn và tư duy.",
    longDescription: "Mục tiêu của sự kiện năm nay tập trung vào việc khơi dậy niềm đam mê đọc sách trong giới trẻ, giới thiệu những tác phẩm kinh điển được số hóa và tạo không gian giao lưu trực tiếp giữa tác giả và độc giả. Chúng tôi kỳ vọng sự kiện sẽ mang tới trải nghiệm trọn vẹn cả về thị giác lẫn tư duy cho từng thành viên tham gia.",
    goals: [
      "Thúc đẩy văn hóa đọc bền vững trong cộng đồng học thuật.",
      "Tiếp cận các công nghệ hỗ trợ đọc sách hiện đại nhất.",
      "Xây dựng mạng lưới kết nối giữa các mọt sách và chuyên gia."
    ],
    date: "15/07/2026",
    location: "Hội trường trung tâm Lumina",
    registeredCount: 150,
    maxCapacity: 300,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200",
    fee: "Miễn phí",
    host: "Lumina Academic Team",
    deadline: "10/07/2026",
    imagesGallery: [
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=400",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400"
    ],
    rating: 4.8,
    schedule: [
      { time: "09:00", title: "Khai mạc Ngày hội", description: "Phát biểu từ Giám đốc Thư viện Lumina và giới thiệu chương trình học thuật." },
      { time: "09:30", title: "Diễn giả chia sẻ: Tương lai tri thức", description: "Buổi tọa đàm về cách công nghệ thay đổi thói quen đọc sách và lưu trữ tài liệu." },
      { time: "10:30", title: "Giao lưu & Thảo luận nhóm", description: "Hoạt động bóc tách nội dung các đầu sách nổi bật trong bộ sưu tập di sản." },
      { time: "11:00", title: "Ký tặng sách & Kết thúc", description: "Cơ hội sở hữu chữ ký của các tác giả nổi tiếng tại sự kiện và nhận quà lưu niệm." }
    ],
    speakers: [
      { name: "TS. Đặng Minh Anh", title: "Giám đốc Học thuật", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400" },
      { name: "Tác giả Lê Văn Bình", title: "Nhà văn, Nhà báo", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400" }
    ],
    reviews: [
      { id: "rev-1", user: "Nguyễn Hoàng Long", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100", text: "Tôi rất hào hứng với chủ đề năm nay. Việc được giao lưu trực tiếp với Tác giả Lê Văn Bình là điều tôi mong đợi nhất!", time: "2 ngày trước", likes: 12 }
    ]
  },
  {
    id: "evt-2",
    title: "Workshop: Đọc sách hiệu quả",
    tag: "Workshop",
    status: "Còn chỗ",
    description: "Học các phương pháp ghi nhớ và tóm tắt sách chuyên nghiệp cùng chuyên gia hàng đầu trong ngành thư viện học, giúp bạn hấp thu 100% tinh hoa từ mỗi trang sách.",
    longDescription: "Bạn thường đọc sách và quên ngay sau một tuần? Hãy tham gia Workshop thực chiến để làm chủ các công cụ ghi nhận, tổng hợp thông tin, và xây dựng một thư viện ghi nhớ thứ hai cho riêng mình.",
    goals: [
      "Làm chủ phương pháp SQ3R để đọc hiểu sâu nhanh chóng.",
      "Kỹ thuật ghi chép Cornell và vẽ sơ đồ tư duy thực chiến.",
      "Thiết lập thói quen duy trì 30 phút đọc sách chất lượng mỗi ngày."
    ],
    date: "20/07/2026",
    location: "Phòng hội thảo A",
    registeredCount: 65,
    maxCapacity: 100,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600",
    fee: "Miễn phí",
    host: "Lumina Training Department",
    deadline: "18/07/2026",
    imagesGallery: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=400"
    ],
    rating: 4.6,
    schedule: [
      { time: "14:00", title: "Khai mạc & Trắc nghiệm phong cách đọc", description: "Đánh giá thói quen đọc hiện tại của bạn và các điểm nghẽn." },
      { time: "14:30", title: "Luyện đọc hiểu & Ghi chép tối ưu", description: "Thực hành phương pháp SQ3R trực tiếp trên tài liệu mẫu." },
      { time: "16:00", title: "Hỏi đáp & Tổng kết", description: "Giải đáp thắc mắc và nhận cẩm nang đọc sách hiệu quả." }
    ],
    speakers: [
      { name: "Sarah Jenkins", title: "Trưởng phòng Collections", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400" }
    ],
    reviews: []
  },
  {
    id: "evt-3",
    title: "Giao lưu Tác giả Trẻ",
    tag: "Talkshow",
    status: "Còn chỗ",
    description: "Buổi trò chuyện thân mật về hành trình sáng tạo và những khó khăn khi mới bước chân vào nghề viết cùng các cây bút trẻ triển vọng hàng đầu.",
    longDescription: "Một buổi đàm thoại cởi mở, bộc bạch những niềm vui, nỗi buồn đằng sau từng trang sách của thế hệ tác giả mới. Đặc biệt hữu ích cho những ai đang nung nấu ý định viết cuốn sách đầu tay.",
    goals: [
      "Khám phá nguồn cảm hứng sáng tác từ thực tế cuộc sống.",
      "Học cách vượt qua hội chứng sợ trang giấy trắng (Writer's Block).",
      "Quy trình từng bước để tự xuất bản hoặc cộng tác với các nhà xuất bản lớn."
    ],
    date: "25/07/2026",
    location: "Sảnh chính Lumina",
    registeredCount: 120,
    maxCapacity: 150,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600",
    fee: "Miễn phí",
    host: "Lumina Club",
    deadline: "22/07/2026",
    imagesGallery: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400"
    ],
    rating: 4.9,
    schedule: [
      { time: "19:00", title: "Giao lưu với các nhà văn trẻ", description: "Chia sẻ chân thực về nghề viết và hành trình vượt qua định kiến." },
      { time: "20:00", title: "Hỏi đáp & Bàn tròn thảo luận", description: "Khán giả đối thoại trực tiếp, đặt câu hỏi về các tác phẩm." },
      { time: "21:00", title: "Ký tặng sách & Chụp hình lưu niệm", description: "Ký sách và giao lưu riêng tại sảnh." }
    ],
    speakers: [
      { name: "Julian Chen", title: "Đại diện Member Services & Tác giả", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400" }
    ],
    reviews: []
  },
  {
    id: "evt-4",
    title: "Khóa học: Phân loại DDC",
    tag: "Course",
    status: "Đã đóng",
    description: "Khóa học cơ bản về hệ thống phân loại thập phân Dewey dành cho nhân viên thư viện mới và các học giả nghiên cứu hệ thống sắp xếp tri thức.",
    longDescription: "Dewey Decimal Classification (DDC) là nền tảng của hàng triệu thư viện trên toàn cầu. Khóa học học thuật ngắn hạn này cung cấp kiến thức thực hành từ các chuyên gia biên mục lâu năm.",
    goals: [
      "Hiểu rõ cấu trúc hệ thống 10 lớp chính của DDC.",
      "Nắm vững các quy tắc gán số phân loại chuẩn xác cho mọi chủ đề.",
      "Thực hành phân loại sách và sắp đặt giá sách thực tế trong thư viện."
    ],
    date: "10/07/2026",
    location: "Phòng Lab 1",
    registeredCount: 30,
    maxCapacity: 30,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600",
    fee: "Miễn phí",
    host: "Lumina Archives",
    deadline: "05/07/2026",
    imagesGallery: [
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400"
    ],
    rating: 4.7,
    schedule: [
      { time: "08:30", title: "Lý thuyết phân loại Dewey", description: "Khái quát lịch sử ra đời, mục tiêu và nguyên lý cốt lõi." },
      { time: "10:00", title: "Thực hành gán mã sách chi tiết", description: "Hướng dẫn thực hiện gán mã trên phần mềm biên mục Lumina." },
      { time: "11:30", title: "Kiểm tra cuối khóa & Trao chứng nhận", description: "Đánh giá mức độ nắm bắt bài học." }
    ],
    speakers: [
      { name: "Marcus Holloway", title: "Director of Archives", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400" }
    ],
    reviews: []
  },
  {
    id: "evt-5",
    title: "Workshop AI & Tương lai sách",
    tag: "Workshop",
    status: "Còn chỗ",
    description: "Tìm hiểu tầm ảnh hưởng của Trí tuệ Nhân tạo đối với ngành xuất bản, sáng tác và thói quen đọc sách của thế hệ số trong tương lai gần.",
    longDescription: "AI đang thay đổi cách thức sáng tác, biên dịch và thụ hưởng tri thức. Cùng các chuyên gia công nghệ mổ xẻ cơ hội và thách thức mà AI mang lại cho độc giả và tác giả.",
    goals: [
      "Tiếp cận các công cụ dịch thuật và tóm tắt sách AI tiên tiến nhất.",
      "Hiểu về luật bản quyền trong thời đại nội dung do AI tạo ra (Generative AI).",
      "Khám phá các mô hình xuất bản tự động hóa cho các tác giả độc lập."
    ],
    date: "20/07/2026",
    location: "Phòng hội thảo B",
    registeredCount: 45,
    maxCapacity: 80,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600",
    fee: "Miễn phí",
    host: "Lumina Innovation Hub",
    deadline: "19/07/2026",
    imagesGallery: [],
    rating: 4.5,
    schedule: [
      { time: "15:30", title: "AI thay đổi cách viết và đọc như thế nào?", description: "Báo cáo xu hướng xuất bản và demo các trợ lý đọc sách thông minh." }
    ],
    speakers: [
      { name: "TS. Đặng Minh Anh", title: "Giám đốc Học thuật", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400" }
    ],
    reviews: []
  },
  {
    id: "evt-6",
    title: "Book Fair: Trao đổi tri thức",
    tag: "Book Festival",
    status: "Còn chỗ",
    description: "Sự kiện trao đổi sách cũ lấy sách mới, quyên góp sách cho trẻ em vùng cao và tham gia chuỗi trò chơi đố vui nhận quà tri thức cực kỳ hấp dẫn.",
    longDescription: "Ngày hội trao đổi sách là nơi gắn kết cộng đồng, tái tuần hoàn sách cũ và thực hiện các chương trình thiện nguyện mang con chữ tới những vùng quê xa xôi.",
    goals: [
      "Lan tỏa thông điệp bảo vệ môi trường và tái sử dụng tài nguyên tri thức.",
      "Quyên góp thành công 1,000 cuốn sách giáo khoa và truyện tranh cho học sinh nghèo.",
      "Kết bạn, chia sẻ các đầu sách tâm đắc cùng hàng nghìn mọt sách khác."
    ],
    date: "05/08/2026",
    location: "Sân vườn Thư viện Lumina",
    registeredCount: 85,
    maxCapacity: 500,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=600",
    fee: "Miễn phí",
    host: "Lumina Volunteer Team",
    deadline: "01/08/2026",
    imagesGallery: [],
    rating: 4.4,
    schedule: [
      { time: "08:00", title: "Mở gian hàng trao đổi", description: "Bắt đầu tiếp nhận sách quyên góp và phát phiếu quy đổi điểm thưởng." },
      { time: "10:00", title: "Minigame Đố vui trúng thưởng", description: "Trò chơi tương tác nhóm về văn học cổ điển và hiện đại." }
    ],
    speakers: [],
    reviews: []
  }
];

export default function EventsView({ user, onOpenAuth, onSuccessNotification, language }: EventsViewProps) {
  const translateEvent = (evt: Event, lang: "vi" | "en") => {
    if (lang === "vi") {
      return evt;
    }
    
    const translations: Record<string, Partial<Event>> = {
      "evt-1": {
        title: "Book Festival 2026",
        status: "Available",
        tag: "Festival",
        description: "Welcome to Book Festival 2026, the largest annual event at Lumina Library for the knowledge-loving community. In the digital age, we believe reading connects minds.",
        longDescription: "This year's event focuses on inspiring reading passion in young people, showcasing classic digitized works, and offering direct interaction between authors and readers.",
        location: "Lumina Central Hall",
        fee: "Free",
        goals: [
          "Promote a sustainable reading culture in the academic community.",
          "Access the latest modern reading assistance technologies.",
          "Build a networking community of book lovers and experts."
        ]
      },
      "evt-2": {
        title: "Workshop: Effective Reading",
        status: "Available",
        tag: "Workshop",
        description: "Learn professional memorization and book summarizing methods with top library science experts to absorb 100% of every book page.",
        longDescription: "Do you read and forget everything after a week? Join our hands-on workshop to master information synthesis tools and build your second memory.",
        location: "Conference Room A",
        fee: "Free",
        goals: [
          "Master the SQ3R method for deep comprehension reading.",
          "Hands-on Cornell note-taking and mind mapping techniques.",
          "Establish a habit of 30 minutes of quality reading daily."
        ]
      },
      "evt-3": {
        title: "Young Authors Meetup",
        status: "Available",
        tag: "Talkshow",
        description: "An intimate conversation about the creative journey and challenges when entering the writing career with promising young writers.",
        longDescription: "An open dialogue sharing joys and sorrows behind the pages of a new generation of authors. Highly useful for anyone planning to write their first book.",
        location: "Lumina Main Lobby",
        fee: "Free",
        goals: [
          "Discover writing inspirations from real life.",
          "Learn how to overcome Writer's Block.",
          "Step-by-step process to self-publish or cooperate with publishers."
        ]
      },
      "evt-4": {
        title: "Course: DDC Classification",
        status: "Closed",
        tag: "Course",
        description: "Basic course on the Dewey Decimal Classification system for new library staff and scholars researching knowledge organization.",
        longDescription: "DDC is the foundation of millions of libraries worldwide. This short academic course provides hands-on practice from seasoned catalogers.",
        location: "Lab Room 1",
        fee: "Free",
        goals: [
          "Understand the 10 main class structures of DDC.",
          "Master rules for assigning precise classification numbers.",
          "Practice book classification and shelf arrangement."
        ]
      },
      "evt-5": {
        title: "Workshop: AI & Book Future",
        status: "Available",
        tag: "Workshop",
        description: "Explore the impact of Artificial Intelligence on publishing, writing, and reading habits of the digital generation in the near future.",
        longDescription: "AI is changing how we create, translate, and consume knowledge. Discuss opportunities and challenges AI brings to authors and readers.",
        location: "Conference Room B",
        fee: "Free",
        goals: [
          "Access advanced AI translation and summarization tools.",
          "Understand copyright law in the era of Generative AI content.",
          "Explore automated publishing models for independent authors."
        ]
      },
      "evt-6": {
        title: "Book Fair: Exchange Knowledge",
        status: "Available",
        tag: "Festival",
        description: "The periodic book swap festival of Lumina Library. Bring your old books to exchange for new ones and participate in interactive minigames.",
        longDescription: "A lively green weekend activity to help books find new owners. Join the swap to reduce waste and foster community connection.",
        location: "Outdoor Yard",
        fee: "Free",
        goals: [
          "Encourage recycling and circulating books in community.",
          "Exchange up to 10 books per member.",
          "Receive custom limited-edition Lumina bookmarks."
        ]
      }
    };
    
    const translated = translations[evt.id];
    if (translated) {
      return { ...evt, ...translated };
    }
    return evt;
  };

  const labels = {
    vi: {
      featuredEvent: "SỰ KIỆN NỔI BẬT",
      viewDetails: "Xem Chi Tiết Sự Kiện",
      registerNow: "Đăng ký ngay",
      registered: "Bạn đã đăng ký ✓",
      all: "Tất cả",
      searchPlaceholder: "Tìm tên, địa điểm, từ khóa...",
      monthAll: "Tháng (Tất cả)",
      monthJuly: "Tháng 7",
      monthAugust: "Tháng 8",
      yearAll: "Năm (Tất cả)",
      statusAll: "Trạng thái",
      statusAvailable: "Còn chỗ",
      statusClosed: "Đã đóng",
      free: "Miễn phí",
      registerSuccess: "Đăng ký thành công!",
      unregisterSuccess: "Hủy đăng ký thành công!",
      capacity: "Sức chứa",
      dateLabel: "Ngày",
      locLabel: "Địa điểm",
      hostLabel: "Người tổ chức",
      deadlineLabel: "Hạn đăng ký",
      aboutEvent: "Giới thiệu sự kiện",
      eventGoals: "Mục tiêu sự kiện",
      eventSchedule: "Lịch trình chương trình",
      eventSpeakers: "Diễn giả khách mời",
      reviews: "Đánh giá & Thảo luận",
      writeComment: "Viết bình luận của bạn...",
      submitComment: "Gửi bình luận",
      backToList: "Quay lại danh sách",
      noEvents: "Không tìm thấy sự kiện nào phù hợp.",
      registeredUsers: "độc giả đã đăng ký",
      noEventsTitle: "Không Tìm Thấy Sự Kiện",
      noEventsSub: "Rất tiếc, không tìm thấy sự kiện nào thỏa mãn bộ lọc của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái.",
      resetFilters: "Đặt lại bộ lọc"
    },
    en: {
      featuredEvent: "FEATURED EVENT",
      viewDetails: "View Event Details",
      registerNow: "Register Now",
      registered: "You are registered ✓",
      all: "All",
      searchPlaceholder: "Search title, location, keywords...",
      monthAll: "Month (All)",
      monthJuly: "July",
      monthAugust: "August",
      yearAll: "Year (All)",
      statusAll: "Status",
      statusAvailable: "Available",
      statusClosed: "Closed",
      free: "Free",
      registerSuccess: "Successfully registered!",
      unregisterSuccess: "Successfully unregistered!",
      capacity: "Capacity",
      dateLabel: "Date",
      locLabel: "Location",
      hostLabel: "Host",
      deadlineLabel: "Deadline",
      aboutEvent: "About Event",
      eventGoals: "Event Goals",
      eventSchedule: "Event Schedule",
      eventSpeakers: "Guest Speakers",
      reviews: "Reviews & Discussion",
      writeComment: "Write a comment...",
      submitComment: "Post Comment",
      backToList: "Back to List",
      noEvents: "No matching events found.",
      registeredUsers: "members registered",
      noEventsTitle: "No Events Found",
      noEventsSub: "Sorry, we couldn't find any events matching your filters. Try changing your search query or filters.",
      resetFilters: "Reset Filters"
    }
  }[language];

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem("lumina_events_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return PRE_SEEDED_EVENTS;
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Comment / Review states
  const [newCommentText, setNewCommentText] = useState("");

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("lumina_events_data", JSON.stringify(events));
  }, [events]);

  const handleRegisterEvent = (eventId: string) => {
    if (!user) {
      onOpenAuth("login");
      return;
    }

    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const isCurrentlyReg = evt.isRegistered;
        const newRegCount = isCurrentlyReg ? evt.registeredCount - 1 : evt.registeredCount + 1;
        
        onSuccessNotification(
          isCurrentlyReg 
            ? `Đã hủy đăng ký tham gia sự kiện "${evt.title}"` 
            : `Đăng ký tham gia thành công sự kiện "${evt.title}"! Hãy kiểm tra lịch trình của bạn.`
        );

        return {
          ...evt,
          isRegistered: !isCurrentlyReg,
          registeredCount: newRegCount
        };
      }
      return evt;
    }));
  };

  const handlePostReview = (eventId: string) => {
    if (!user) {
      onOpenAuth("login");
      return;
    }

    if (!newCommentText.trim()) return;

    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const newReview: EventReview = {
          id: `rev-${Date.now()}`,
          user: user.fullName,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100", // Generic nice avatar
          text: newCommentText,
          time: "Vừa xong",
          likes: 0
        };
        onSuccessNotification("Đăng tải bình luận thành công!");
        return {
          ...evt,
          reviews: [newReview, ...evt.reviews]
        };
      }
      return evt;
    }));

    setNewCommentText("");
  };

  const handleLikeReview = (eventId: string, reviewId: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        return {
          ...evt,
          reviews: evt.reviews.map(rev => {
            if (rev.id === reviewId) {
              const liked = !rev.hasLiked;
              return {
                ...rev,
                hasLiked: liked,
                likes: liked ? rev.likes + 1 : rev.likes - 1
              };
            }
            return rev;
          })
        };
      }
      return evt;
    }));
  };

  const translatedEvents = events.map(evt => translateEvent(evt, language));
  const selectedEvent = translatedEvents.find(e => e.id === selectedEventId);

  // Filter criteria
  const categories = language === "vi"
    ? ["All", "Workshop", "Talkshow", "Competition", "Course", "Book Festival", "Community"]
    : ["All", "Workshop", "Talkshow", "Competition", "Course", "Festival", "Community"];

  const filteredEvents = translatedEvents.filter(evt => {
    // Tag match
    if (activeCategory !== "All" && evt.tag !== activeCategory) return false;
    
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = evt.title.toLowerCase().includes(q);
      const inDesc = evt.description.toLowerCase().includes(q);
      const inLoc = evt.location.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inLoc) return false;
    }

    // Month filter based on "date" format DD/MM/YYYY
    if (selectedMonth !== "all") {
      const parts = evt.date.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10).toString();
        if (m !== selectedMonth) return false;
      }
    }

    // Year filter
    if (selectedYear !== "all") {
      const parts = evt.date.split("/");
      if (parts.length === 3) {
        const y = parts[2];
        if (y !== selectedYear) return false;
      }
    }

    // Status filter
    if (selectedStatus !== "all") {
      if (selectedStatus === "available" && evt.status !== labels.statusAvailable) return false;
      if (selectedStatus === "closed" && evt.status !== labels.statusClosed) return false;
    }

    return true;
  });

  const featuredEvent = translatedEvents.find(e => e.id === "evt-1") || translatedEvents[0];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans" id="events-view-container">
      {!selectedEvent ? (
        // ==========================================
        // LISTING VIEW (Screenshot 1)
        // ==========================================
        <div>
          {/* 1. FEATURED EVENT HERO BANNER */}
          {featuredEvent && (
            <div className="relative bg-slate-900 text-white min-h-[460px] flex items-center overflow-hidden">
              {/* Immersive Library background image with darken overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={featuredEvent.image} 
                  alt="Featured Event" 
                  className="w-full h-full object-cover opacity-60 scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
              </div>

              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fcc04e] text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> SỰ KIỆN NỔI BẬT
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-serif tracking-tight max-w-3xl leading-tight">
                  {featuredEvent.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm font-semibold text-slate-200">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-[#fcc04e]" />
                    {featuredEvent.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4.5 h-4.5 text-[#fcc04e]" />
                    {featuredEvent.location}
                  </span>
                </div>

                <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed line-clamp-3">
                  {featuredEvent.description}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button 
                    onClick={() => setSelectedEventId(featuredEvent.id)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm tracking-wide"
                  >
                    Xem Chi Tiết Sự Kiện
                  </button>
                  <button 
                    onClick={() => handleRegisterEvent(featuredEvent.id)}
                    className={`w-full sm:w-auto px-8 py-3.5 font-bold rounded-xl transition-all cursor-pointer text-sm border tracking-wide ${
                      featuredEvent.isRegistered 
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30" 
                        : "border-white/30 hover:bg-white/10 text-white"
                    }`}
                  >
                    {featuredEvent.isRegistered ? "Bạn đã đăng ký ✓" : "Đăng ký ngay"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. FILTER & SEARCH CONTROL BAR */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Main Tabs and Select controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
              
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-indigo-950 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat === "All" ? "Tất cả" : cat}
                  </button>
                ))}
              </div>

              {/* Select Dropdowns and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search query input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên, địa điểm, từ khóa..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl text-xs outline-hidden transition-all text-slate-800 font-medium"
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-hidden focus:border-indigo-600 focus:bg-white cursor-pointer"
                  >
                    <option value="all">Tháng (Tất cả)</option>
                    <option value="7">Tháng 7</option>
                    <option value="8">Tháng 8</option>
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-hidden focus:border-indigo-600 focus:bg-white cursor-pointer"
                  >
                    <option value="all">Năm (Tất cả)</option>
                    <option value="2026">2026</option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-hidden focus:border-indigo-600 focus:bg-white cursor-pointer"
                  >
                    <option value="all">Trạng thái</option>
                    <option value="available">Còn chỗ</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
              </div>

            </div>

            {/* 3. EVENT CARDS GRID */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 font-serif text-lg">Không Tìm Thấy Sự Kiện</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Rất tiếc, không tìm thấy sự kiện nào thỏa mãn bộ lọc của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                    setSelectedMonth("all");
                    setSelectedYear("2026");
                    setSelectedStatus("all");
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((evt) => (
                  <div 
                    key={evt.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-3xs hover:shadow-xs transition-all flex flex-col group h-full"
                  >
                    {/* Event Banner Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
                      <img 
                        src={evt.image} 
                        alt={evt.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Top tags on image */}
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                          {evt.tag}
                        </span>
                        
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-md tracking-wider ${
                          evt.status === "Còn chỗ" 
                            ? "bg-indigo-900/90 text-indigo-100" 
                            : "bg-red-900/90 text-red-100"
                        }`}>
                          {evt.status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-[#112244] font-serif text-lg leading-snug group-hover:text-indigo-950 transition-colors">
                          {evt.title}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                          {evt.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 space-y-2.5 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-950/75" />
                          {evt.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-950/75" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-950">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>
                            {evt.status === "Đã đóng" ? "Đã kết thúc" : `Đã có: ${evt.registeredCount} người đăng ký`}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <button 
                          onClick={() => setSelectedEventId(evt.id)}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center ${
                            evt.status === "Đã đóng" 
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-500"
                              : "bg-indigo-950 hover:bg-indigo-900 text-white"
                          }`}
                        >
                          {evt.status === "Đã đóng" ? "Xem lại tư liệu" : "Xem chi tiết"}
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Load More Button */}
            {filteredEvents.length > 0 && (
              <div className="flex justify-center pt-8">
                <button className="px-6 py-2.5 border-2 border-indigo-950 text-indigo-950 font-bold rounded-xl text-xs hover:bg-indigo-50 transition-colors cursor-pointer">
                  Tải Thêm Sự Kiện
                </button>
              </div>
            )}

          </div>

        </div>
      ) : (
        // ==========================================
        // SINGLE EVENT DETAIL VIEW (Screenshot 2)
        // ==========================================
        <div className="animate-fade-in">
          {/* Header Banner - Large responsive display block */}
          <div className="relative bg-slate-900 text-white min-h-[360px] flex items-center overflow-hidden border-b border-slate-800">
            {/* Banner background */}
            <div className="absolute inset-0 z-0">
              <img 
                src={selectedEvent.image} 
                alt={selectedEvent.title} 
                className="w-full h-full object-cover opacity-35 scale-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-900/30" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-4">
              
              {/* Back to Events listing */}
              <button
                onClick={() => {
                  setSelectedEventId(null);
                  window.scrollTo({ top: 0 });
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800/90 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-slate-700/50"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách sự kiện
              </button>

              <div className="pt-4 space-y-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fcc04e] text-slate-950 text-[10px] font-black rounded-md uppercase tracking-wider">
                  SỰ KIỆN NỔI BẬT
                </span>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-serif tracking-tight leading-tight">
                  {selectedEvent.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm font-semibold text-slate-300">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {selectedEvent.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedEvent.location}
                  </span>
                </div>

                {/* Event Primary CTA */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {selectedEvent.status === "Đã đóng" ? (
                    <button 
                      disabled
                      className="px-6 py-2.5 bg-slate-800 text-slate-400 font-bold rounded-lg text-xs border border-slate-700 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Sự kiện đã kết thúc
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRegisterEvent(selectedEvent.id)}
                      className={`px-6 py-2.5 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                        selectedEvent.isRegistered
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-white hover:bg-slate-100 text-indigo-950"
                      }`}
                    >
                      {selectedEvent.isRegistered ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Bạn đã đăng ký ✓
                        </>
                      ) : "Đăng ký tham gia ngay"}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      onSuccessNotification("Đã sao chép liên kết sự kiện vào khay nhớ tạm!");
                    }}
                    className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer border border-slate-700/50 flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ sự kiện
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Quick facts banner (Screenshot 2 styling) */}
          <div className="bg-white border-b border-slate-100 shadow-3xs py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Thời gian còn lại</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-950 font-mono block">15 NGÀY 08 GIỜ</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Người đăng ký</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-950 block">{selectedEvent.registeredCount} / {selectedEvent.maxCapacity}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Diễn giả</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-950 block">{selectedEvent.speakers.length} Diễn giả</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Đầu sách</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-950 block">20 Đầu sách trưng bày</span>
                </div>

              </div>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* LEFT COLUMN: Main info blocks */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Block 1: Mô tả & Mục tiêu */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-3xs space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-[#112244] font-serif border-b border-slate-100 pb-3">
                      Mô tả & Mục tiêu sự kiện
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {selectedEvent.description}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {selectedEvent.longDescription}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Mục tiêu đạt được:</h3>
                    <ul className="space-y-2.5">
                      {selectedEvent.goals.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-600">
                          <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Block 2: Lịch trình sự kiện (Timeline) */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-3xs space-y-6">
                  <h2 className="text-xl font-extrabold text-[#112244] font-serif border-b border-slate-100 pb-3">
                    Lịch trình sự kiện
                  </h2>

                  <div className="relative border-l-2 border-indigo-950/20 pl-6 space-y-8 py-2">
                    {selectedEvent.schedule.map((sch, idx) => (
                      <div key={idx} className="relative space-y-1.5">
                        {/* Circle node on timeline */}
                        <div className="absolute left-[-29px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-950 border-4 border-white shadow-xs" />
                        
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base font-serif">
                            {sch.title}
                          </h4>
                          <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] font-bold text-indigo-950 rounded-sm">
                            {sch.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{sch.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Block 3: Diễn giả nổi bật */}
                {selectedEvent.speakers.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-3xs space-y-6">
                    <h2 className="text-xl font-extrabold text-[#112244] font-serif border-b border-slate-100 pb-3">
                      Diễn giả nổi bật
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedEvent.speakers.map((spk, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <img 
                            src={spk.image} 
                            alt={spk.name} 
                            className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-slate-900 font-serif">{spk.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{spk.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Block 4: Community Comments / Reviews */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-3xs space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xl font-extrabold text-[#112244] font-serif">
                      Nhận xét từ cộng đồng
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-amber-500 flex items-center gap-0.5 font-bold">
                        <Star className="w-4 h-4 fill-amber-500" />
                        {selectedEvent.rating}
                      </span>
                      <span>({selectedEvent.reviews.length} bình luận)</span>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <textarea
                        rows={3}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Chia sẻ suy nghĩ của bạn về sự kiện..."
                        className="w-full p-3 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl text-xs outline-hidden text-slate-800 font-medium transition-all"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handlePostReview(selectedEvent.id)}
                          className="px-5 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Gửi bình luận
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-6 pt-4 border-t border-slate-50">
                    {selectedEvent.reviews.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-4 italic">
                        Chưa có nhận xét nào. Hãy trở thành người đầu tiên viết bình luận!
                      </p>
                    ) : (
                      selectedEvent.reviews.map((rev) => (
                        <div key={rev.id} className="flex gap-4 group">
                          <img 
                            src={rev.avatar} 
                            alt={rev.user} 
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100 bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-slate-900">{rev.user}</h5>
                              <span className="text-[10px] text-slate-400 font-semibold">{rev.time}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{rev.text}</p>
                            
                            <div className="flex items-center gap-3 pt-1">
                              <button 
                                onClick={() => handleLikeReview(selectedEvent.id, rev.id)}
                                className={`flex items-center gap-1.5 text-[10px] font-extrabold transition-colors cursor-pointer ${
                                  rev.hasLiked ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${rev.hasLiked ? "fill-indigo-600" : ""}`} />
                                {rev.likes} Thích
                              </button>
                              <button className="text-slate-400 hover:text-indigo-600 text-[10px] font-extrabold transition-colors">
                                Trả lời
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

              </div>

              {/* RIGHT COLUMN: Action panels */}
              <div className="space-y-6">
                
                {/* Panel 1: Detailed Info Ticket Card */}
                <div className="bg-indigo-950 text-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-6 space-y-5">
                    <h3 className="font-serif font-bold text-lg border-b border-white/10 pb-3">
                      Thông tin chi tiết
                    </h3>

                    <div className="space-y-4 text-xs font-semibold text-slate-300">
                      
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#fcc04e]" /> Ban tổ chức
                        </span>
                        <span className="text-white text-right font-bold">{selectedEvent.host}</span>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#fcc04e]" /> Sức chứa tối đa
                        </span>
                        <span className="text-white font-bold">{selectedEvent.maxCapacity} người</span>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#fcc04e]" /> Hạn đăng ký
                        </span>
                        <span className="text-white font-bold">{selectedEvent.deadline}</span>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-[#fcc04e]" /> Phí tham dự
                        </span>
                        <span className="text-[#fcc04e] font-black text-sm">{selectedEvent.fee}</span>
                      </div>

                    </div>
                  </div>

                  <div className="p-4 bg-indigo-900/40 border-t border-white/5">
                    <button 
                      onClick={() => handleRegisterEvent(selectedEvent.id)}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
                        selectedEvent.isRegistered
                          ? "bg-emerald-500 text-white"
                          : "bg-[#fcc04e] hover:bg-[#eab03e] text-slate-950"
                      }`}
                    >
                      {selectedEvent.isRegistered ? "Bạn đã đăng ký tham gia ✓" : "Đăng ký nhận vé tham dự"}
                    </button>
                  </div>
                </div>

                {/* Panel 2: Materials & Gallery Grid */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                  <h3 className="font-serif font-extrabold text-[#112244] border-b border-slate-100 pb-2 text-base">
                    Tài liệu & Video
                  </h3>

                  {/* Big Video placeholder */}
                  <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
                    <img 
                      src={selectedEvent.image} 
                      alt="Video cover" 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/95 text-indigo-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="w-5 h-5 fill-indigo-950 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Gallery items list */}
                  {selectedEvent.imagesGallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedEvent.imagesGallery.map((imgUrl, index) => (
                        <div key={index} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-50">
                          <img 
                            src={imgUrl} 
                            alt="" 
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel 3: Related Events list */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                  <h3 className="font-serif font-extrabold text-[#112244] border-b border-slate-100 pb-2 text-base">
                    Sự kiện liên quan
                  </h3>

                  <div className="space-y-4">
                    {events.filter(e => e.id !== selectedEvent.id).slice(0, 3).map((rel) => (
                      <div 
                        key={rel.id} 
                        onClick={() => {
                          setSelectedEventId(rel.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="group flex gap-3 cursor-pointer"
                      >
                        <img 
                          src={rel.image} 
                          alt="" 
                          className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">
                            {rel.tag}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 font-serif truncate group-hover:text-indigo-900 transition-colors">
                            {rel.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {rel.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
