# Lumina Library Management System 📚

Hệ thống quản lý thư viện hiện đại tích hợp phân hệ đọc giả và quản trị viên, được thiết kế đẹp mắt với giao diện Premium và kiến trúc Client-Server mạnh mẽ.

---

## 🚀 Công Nghệ Sử Dụng (Technology Stack)

### 💻 Frontend
* **Core**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) (Bộ build siêu nhanh)
* **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/) (Đảm bảo an toàn kiểu dữ liệu)
* **Styling & Icons**: [TailwindCSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/)
* **Hiệu ứng chuyển động**: [Motion](https://motion.dev/) (Tạo các micro-interactions mượt mà)

### ⚙️ Backend
* **Framework**: [ASP.NET Core Web API](https://learn.microsoft.com/en-us/aspnet/core/) (.NET 8.0 / 9.0)
* **Database ORM**: [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) (EF Core)
* **Bảo mật & Xác thực**:
  * **JWT (JSON Web Tokens) Bearer Authentication** để bảo vệ API Endpoints.
  * **BCrypt.Net** để mã hóa mật khẩu người dùng.
* **Tài liệu API**: **Swagger / OpenAPI** tích hợp sẵn giúp chạy thử API trực tiếp.

### 🗄️ Database
* **Hệ quản trị CSDL**: [MySQL](https://www.mysql.com/)

---

## 📋 Yêu Cầu Hệ Thống (System Requirements)

Để cài đặt và chạy dự án, máy tính của bạn cần cài đặt sẵn:
1. **Node.js** (Phiên bản khuyến nghị: v18 trở lên)
2. **.NET SDK** (Phiên bản khuyến nghị: v8.0 hoặc v9.0)
3. **MySQL Server** đang chạy trên máy (Mặc định cấu hình sử dụng cổng `3307`, bạn có thể thay đổi trong cấu hình).

---

## 🛠️ Hướng Dẫn Cài Đặt Chi Tiết Theo Từng Bước

### Bước 1: Chuẩn bị Cơ Sở Dữ Liệu MySQL
1. Hãy đảm bảo dịch vụ MySQL đang chạy.
2. Cấu hình chuỗi kết nối Database nằm tại tệp tin [`aspnet-backend/appsettings.json`](file:///d:/library-management-system/aspnet-backend/appsettings.json):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=127.0.0.1;Port=3307;Database=lumina_library_aspnet;User=root;Password="
   }
   ```
   * *Lưu ý: Thay đổi `Port`, `User`, `Password` cho phù hợp với MySQL của bạn.*
   * **Hệ thống tự tạo DB**: Bạn **không cần tạo bảng thủ công**, EF Core sẽ tự động khởi tạo cơ sở dữ liệu (`EnsureCreated()`) và nạp sẵn dữ liệu mẫu (Thể loại sách, sách, tài khoản) ngay lần đầu khởi chạy Backend.

---

### Bước 2: Khởi Chạy Backend API (ASP.NET Core)
1. Mở Terminal (PowerShell/CMD) và di chuyển vào thư mục backend:
   ```bash
   cd aspnet-backend
   ```
2. Thực hiện chạy dự án:
   ```bash
   dotnet run
   ```
3. Sau khi chạy thành công, API sẽ hoạt động tại:
   * **Địa chỉ gốc**: [http://localhost:5000](http://localhost:5000)
   * **Tài liệu kiểm thử API (Swagger UI)**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

---

### Bước 3: Khởi Chạy Frontend (React + Vite)
1. Mở một cửa sổ Terminal mới tại thư mục gốc của dự án (`d:\library-management-system`).
2. Cài đặt các gói thư viện JavaScript phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Development Server):
   ```bash
   npm run dev
   ```
4. Truy cập giao diện chính của hệ thống tại địa chỉ:
   * **Local App**: [http://localhost:5173/](http://localhost:5173/)

---

## 🔑 Tài Khoản Quản Trị Viên Mặc Định (Default Admin)

Hệ thống tự động tạo sẵn một tài khoản Admin cấp cao nhất khi khởi động Backend lần đầu:
* **Email**: `minh2k004@gmail.com`
* **Mật khẩu**: `Minh@23122004`
* **Vai trò**: `Admin`

---

## 🗂️ Sơ Đồ Cấu Trúc Dự Án Chính

```text
├── aspnet-backend/                     # Dự án Backend (ASP.NET Core Web API)
│   ├── Controllers/                    # Các API Endpoints xử lý request
│   ├── LuminaLibrary.Domain/           # Các thực thể nghiệp vụ (Entities)
│   ├── LuminaLibrary.Infrastructure/   # DbContext kết nối CSDL và Seed dữ liệu mẫu
│   ├── LuminaLibrary.Application/      # DTOs cấu trúc dữ liệu truyền tải
│   ├── Program.cs                      # Cấu hình dịch vụ (Middleware, DI, JWT, CORS)
│   └── appsettings.json                # Cấu hình cổng kết nối, cổng DB, JWT key
│
├── src/                                # Giao diện Frontend (React)
│   ├── components/                     # Các Component giao diện độc giả & quản trị
│   ├── lib/                            # Tệp hỗ trợ gọi API (`api.ts`)
│   ├── types.ts                        # Khai báo kiểu TypeScript
│   ├── App.tsx                         # Router chính quản lý trạng thái tài khoản
│   └── main.tsx                        # Khởi tạo React App
│
├── package.json                        # Cấu hình dependency và script chạy frontend
└── README.md                           # Tài liệu hướng dẫn sử dụng này
```
