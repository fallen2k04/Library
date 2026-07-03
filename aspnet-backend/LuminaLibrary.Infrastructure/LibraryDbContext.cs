using System;
using Microsoft.EntityFrameworkCore;
using LuminaLibrary.Domain;

namespace LuminaLibrary.Infrastructure
{
    public class LibraryDbContext : DbContext
    {
        public LibraryDbContext(DbContextOptions<LibraryDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Book> Books { get; set; }
        public DbSet<Author> Authors { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<BookAuthor> BookAuthors { get; set; }
        public DbSet<BorrowRecord> BorrowRecords { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<MembershipRequest> MembershipRequests { get; set; }
        public DbSet<LibraryEvent> Events { get; set; }
        public DbSet<EventSpeaker> EventSpeakers { get; set; }
        public DbSet<EventSchedule> EventSchedules { get; set; }
        public DbSet<EventReview> EventReviews { get; set; }
        public DbSet<EventRegistration> EventRegistrations { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<LibrarianConsultation> LibrarianConsultations { get; set; }
        public DbSet<SpaceReservation> SpaceReservations { get; set; }
        public DbSet<ClassSchedule> ClassSchedules { get; set; }
        public DbSet<ClassRegistration> ClassRegistrations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Relationships
            modelBuilder.Entity<BookAuthor>()
                .HasKey(ba => new { ba.BookId, ba.AuthorId });

            modelBuilder.Entity<BookAuthor>()
                .HasOne(ba => ba.Book)
                .WithMany(b => b.BookAuthors)
                .HasForeignKey(ba => ba.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BookAuthor>()
                .HasOne(ba => ba.Author)
                .WithMany()
                .HasForeignKey(ba => ba.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Book>()
                .HasOne(b => b.Category)
                .WithMany()
                .HasForeignKey(b => b.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BorrowRecord>()
                .HasOne(br => br.Book)
                .WithMany()
                .HasForeignKey(br => br.BookId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BorrowRecord>()
                .HasOne(br => br.User)
                .WithMany()
                .HasForeignKey(br => br.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BorrowRecord>()
                .HasOne(br => br.ApprovedByUser)
                .WithMany()
                .HasForeignKey(br => br.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BorrowRecord>()
                .HasOne(br => br.ReturnedToUser)
                .WithMany()
                .HasForeignKey(br => br.ReturnedToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.Book)
                .WithMany()
                .HasForeignKey(r => r.BookId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EventRegistration>()
                .HasIndex(er => new { er.EventId, er.UserId })
                .IsUnique();

            modelBuilder.Entity<LibrarianConsultation>()
                .HasOne(lc => lc.User)
                .WithMany()
                .HasForeignKey(lc => lc.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SpaceReservation>()
                .HasOne(sr => sr.User)
                .WithMany()
                .HasForeignKey(sr => sr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClassRegistration>()
                .HasOne(cr => cr.ClassSchedule)
                .WithMany()
                .HasForeignKey(cr => cr.ClassScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClassRegistration>()
                .HasOne(cr => cr.User)
                .WithMany()
                .HasForeignKey(cr => cr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClassRegistration>()
                .HasIndex(cr => new { cr.ClassScheduleId, cr.UserId })
                .IsUnique();

            // Seed Initial Data
            var roleAdminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var roleLibrarianId = Guid.Parse("00000000-0000-0000-0000-000000000002");
            var roleMemberId = Guid.Parse("00000000-0000-0000-0000-000000000003");

            modelBuilder.Entity<Role>().HasData(
                new Role { Id = roleAdminId, Name = "Admin" },
                new Role { Id = roleLibrarianId, Name = "Librarian" },
                new Role { Id = roleMemberId, Name = "Member" }
            );

            // Seeded users removed to start with a clean user database as requested


            var cat1 = Guid.Parse("c0000000-0000-0000-0000-000000000001");
            var cat2 = Guid.Parse("c0000000-0000-0000-0000-000000000002");
            var cat3 = Guid.Parse("c0000000-0000-0000-0000-000000000003");
            var cat4 = Guid.Parse("c0000000-0000-0000-0000-000000000004");
            var cat5 = Guid.Parse("c0000000-0000-0000-0000-000000000005");

            modelBuilder.Entity<Category>().HasData(
                new Category { Id = cat1, Name = "Văn học Việt Nam", Description = "Các tác phẩm văn học nổi tiếng trong nước qua các thời kỳ", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = cat2, Name = "Văn học Nước ngoài", Description = "Tiểu thuyết, truyện ngắn nước ngoài dịch sang tiếng Việt", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = cat3, Name = "Khoa học & Công nghệ", Description = "Sách nghiên cứu khoa học, công nghệ thông tin và toán học", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = cat4, Name = "Kỹ năng sống", Description = "Phát triển bản thân, kỹ năng mềm, tâm lý học ứng dụng", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = cat5, Name = "Kinh tế & Đầu tư", Description = "Kiến thức tài chính, quản trị kinh doanh, khởi nghiệp", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );

            var auth1 = Guid.Parse("a0000000-0000-0000-0000-000000000001");
            var auth2 = Guid.Parse("a0000000-0000-0000-0000-000000000002");
            var auth3 = Guid.Parse("a0000000-0000-0000-0000-000000000003");
            var auth4 = Guid.Parse("a0000000-0000-0000-0000-000000000004");
            var auth5 = Guid.Parse("a0000000-0000-0000-0000-000000000005");
            var auth6 = Guid.Parse("a0000000-0000-0000-0000-000000000006");
            var auth7 = Guid.Parse("a0000000-0000-0000-0000-000000000007");
            var auth8 = Guid.Parse("a0000000-0000-0000-0000-000000000008");

            modelBuilder.Entity<Author>().HasData(
                new Author { Id = auth1, FullName = "Nam Cao", Biography = "Nhà văn hiện thực xuất sắc của văn học Việt Nam hiện đại", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth2, FullName = "J.K. Rowling", Biography = "Nữ nhà văn người Anh, tác giả bộ truyện Harry Potter nổi tiếng toàn cầu", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth3, FullName = "George Orwell", Biography = "Nhà báo, nhà văn người Anh nổi tiếng với tiểu thuyết Trại Súc Vật và 1984", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth4, FullName = "Dale Carnegie", Biography = "Nhà văn, nhà thuyết trình người Mỹ, tác giả cuốn Đắc Nhân Tâm", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth5, FullName = "Tô Hoài", Biography = "Nhà văn Việt Nam nổi tiếng với truyện Dế Mèn Phiêu Lưu Ký", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth6, FullName = "Stephen Hawking", Biography = "Nhà vật lý lý thuyết, vũ trụ học nổi tiếng người Anh", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth7, FullName = "Robert Kiyosaki", Biography = "Nhà đầu tư, doanh nhân người Mỹ, nổi tiếng với bộ sách Cha Giàu Cha Nghèo", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Author { Id = auth8, FullName = "Napoleon Hill", Biography = "Tác giả người Mỹ, một trong những người sáng lập ra thể loại thành công học", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );

            var book1 = Guid.Parse("b0000000-0000-0000-0000-000000000001");
            var book2 = Guid.Parse("b0000000-0000-0000-0000-000000000002");
            var book3 = Guid.Parse("b0000000-0000-0000-0000-000000000003");
            var book4 = Guid.Parse("b0000000-0000-0000-0000-000000000004");
            var book5 = Guid.Parse("b0000000-0000-0000-0000-000000000005");
            var book6 = Guid.Parse("b0000000-0000-0000-0000-000000000006");
            var book7 = Guid.Parse("b0000000-0000-0000-0000-000000000007");
            var book8 = Guid.Parse("b0000000-0000-0000-0000-000000000008");
            var book9 = Guid.Parse("b0000000-0000-0000-0000-000000000009");
            var book10 = Guid.Parse("b0000000-0000-0000-0000-000000000010");
            var book11 = Guid.Parse("b0000000-0000-0000-0000-000000000011");
            var book12 = Guid.Parse("b0000000-0000-0000-0000-000000000012");
            var book13 = Guid.Parse("b0000000-0000-0000-0000-000000000013");
            var book14 = Guid.Parse("b0000000-0000-0000-0000-000000000014");
            var book15 = Guid.Parse("b0000000-0000-0000-0000-000000000015");

            modelBuilder.Entity<Book>().HasData(
                new Book
                {
                    Id = book1,
                    Title = "Chí Phèo",
                    CategoryId = cat1,
                    ISBN = "9786046903251",
                    TotalCopies = 5,
                    AvailableCopies = 5,
                    PublishedYear = 1941,
                    Publisher = "NXB Văn Học",
                    Description = "Tác phẩm hiện thực phê phán kinh điển mô tả số phận bi thảm của người nông dân nghèo trước Cách mạng.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.8,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book2,
                    Title = "Harry Potter và Hòn Đá Phù Thủy",
                    CategoryId = cat2,
                    ISBN = "9786045625442",
                    TotalCopies = 3,
                    AvailableCopies = 2,
                    PublishedYear = 1997,
                    Publisher = "NXB Trẻ",
                    Description = "Tập đầu tiên trong bộ truyện giả tưởng đình đám về cậu bé phù thủy Harry Potter.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.9,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book3,
                    Title = "Một Chín Tám Tư (1984)",
                    CategoryId = cat2,
                    ISBN = "9786045654329",
                    TotalCopies = 2,
                    AvailableCopies = 2,
                    PublishedYear = 1949,
                    Publisher = "NXB Hội Nhà Văn",
                    Description = "Tiểu thuyết phản địa đàng nổi tiếng mô tả một xã hội độc tài kiểm soát tư duy con người.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.7,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book4,
                    Title = "Đắc Nhân Tâm",
                    CategoryId = cat4,
                    ISBN = "9786045883259",
                    TotalCopies = 10,
                    AvailableCopies = 9,
                    PublishedYear = 1936,
                    Publisher = "NXB Tổng Hợp TP.HCM",
                    Description = "Cuốn sách nghệ thuật ứng xử nổi tiếng nhất mọi thời đại, giúp xây dựng mối quan hệ tốt đẹp.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.9,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book5,
                    Title = "Dế Mèn Phiêu Lưu Ký",
                    CategoryId = cat1,
                    ISBN = "9786042125345",
                    TotalCopies = 4,
                    AvailableCopies = 4,
                    PublishedYear = 1941,
                    Publisher = "NXB Kim Đồng",
                    Description = "Truyện viết cho thiếu nhi vô cùng xuất sắc về hành trình trưởng thành của chú Dế Mèn.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.6,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book6,
                    Title = "Trại Súc Vật",
                    CategoryId = cat2,
                    ISBN = "9786049021235",
                    TotalCopies = 5,
                    AvailableCopies = 4,
                    PublishedYear = 1945,
                    Publisher = "NXB Nhã Nam",
                    Description = "Tác phẩm trào phúng, mượn câu chuyện nông trại để châm biếm các vấn đề chính trị xã hội.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.5,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book7,
                    Title = "Lược Sử Thời Gian",
                    CategoryId = cat3,
                    ISBN = "9786042188241",
                    TotalCopies = 3,
                    AvailableCopies = 2,
                    PublishedYear = 1988,
                    Publisher = "NXB Trẻ",
                    Description = "Cuốn sách khoa học đại chúng bán chạy giải thích các khái niệm phức tạp của vật lý thiên văn.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.8,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book8,
                    Title = "Cha Giàu Cha Nghèo",
                    CategoryId = cat5,
                    ISBN = "9786043128912",
                    TotalCopies = 6,
                    AvailableCopies = 5,
                    PublishedYear = 1997,
                    Publisher = "NXB Trẻ",
                    Description = "Cuốn sách dạy con về quản lý tài chính cá nhân và tư duy đầu tư làm giàu.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.7,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book9,
                    Title = "Nghĩ Giàu và Làm Giàu",
                    CategoryId = cat5,
                    ISBN = "9786045892534",
                    TotalCopies = 4,
                    AvailableCopies = 4,
                    PublishedYear = 1937,
                    Publisher = "NXB Tổng Hợp TP.HCM",
                    Description = "Cẩm nang hướng dẫn cách phát triển tư duy làm giàu và gặt hái thành công cá nhân.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.9,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book10,
                    Title = "Lão Hạc",
                    CategoryId = cat1,
                    ISBN = "9786049512391",
                    TotalCopies = 2,
                    AvailableCopies = 1,
                    PublishedYear = 1943,
                    Publisher = "NXB Văn Học",
                    Description = "Truyện ngắn xuất sắc khắc họa cuộc sống khốn cùng và vẻ đẹp tâm hồn của người nông dân Việt Nam.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.8,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book11,
                    Title = "Harry Potter và Phòng Chứa Bí Mật",
                    CategoryId = cat2,
                    ISBN = "9786045625459",
                    TotalCopies = 3,
                    AvailableCopies = 3,
                    PublishedYear = 1998,
                    Publisher = "NXB Trẻ",
                    Description = "Tập hai trong hành trình phiêu lưu đầy kịch tính của Harry Potter tại trường Hogwarts.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.9,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book12,
                    Title = "Đời Thừa",
                    CategoryId = cat1,
                    ISBN = "9786049512344",
                    TotalCopies = 3,
                    AvailableCopies = 3,
                    PublishedYear = 1943,
                    Publisher = "NXB Văn Học",
                    Description = "Tác phẩm hiện thực sâu sắc lên án chế độ cũ bóp nghẹt tài năng và ước mơ con người.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.6,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book13,
                    Title = "Quốc Gia Khởi Nghiệp",
                    CategoryId = cat5,
                    ISBN = "9786045688220",
                    TotalCopies = 5,
                    AvailableCopies = 5,
                    PublishedYear = 2009,
                    Publisher = "NXB Thế Giới",
                    Description = "Câu chuyện thần kỳ về sự trỗi dậy mạnh mẽ của nền kinh tế và công nghệ Israel.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.7,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book14,
                    Title = "Hạt Giống Tâm Hồn",
                    CategoryId = cat4,
                    ISBN = "9786045889312",
                    TotalCopies = 8,
                    AvailableCopies = 8,
                    PublishedYear = 2002,
                    Publisher = "NXB Tổng Hợp TP.HCM",
                    Description = "Những câu chuyện ngắn truyền cảm hứng và nghị lực sống phi thường cho người đọc.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.8,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Book
                {
                    Id = book15,
                    Title = "Vũ Trụ Trong Vỏ Hạt Dẻ",
                    CategoryId = cat3,
                    ISBN = "9786042188258",
                    TotalCopies = 2,
                    AvailableCopies = 2,
                    PublishedYear = 2001,
                    Publisher = "NXB Trẻ",
                    Description = "Cuốn sách mở ra góc nhìn sâu sắc và sinh động hơn về bức tranh vũ trụ rộng lớn.",
                    CoverImageUrl = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=600",
                    Rating = 4.8,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<BookAuthor>().HasData(
                new BookAuthor { BookId = book1, AuthorId = auth1 },
                new BookAuthor { BookId = book2, AuthorId = auth2 },
                new BookAuthor { BookId = book3, AuthorId = auth3 },
                new BookAuthor { BookId = book4, AuthorId = auth4 },
                new BookAuthor { BookId = book5, AuthorId = auth5 },
                new BookAuthor { BookId = book6, AuthorId = auth3 },
                new BookAuthor { BookId = book7, AuthorId = auth6 },
                new BookAuthor { BookId = book8, AuthorId = auth7 },
                new BookAuthor { BookId = book9, AuthorId = auth8 },
                new BookAuthor { BookId = book10, AuthorId = auth1 },
                new BookAuthor { BookId = book11, AuthorId = auth2 },
                new BookAuthor { BookId = book12, AuthorId = auth1 },
                new BookAuthor { BookId = book13, AuthorId = auth7 },
                new BookAuthor { BookId = book14, AuthorId = auth4 },
                new BookAuthor { BookId = book15, AuthorId = auth6 }
            );
            // Seed data for BorrowRecords removed to start with a clean database as requested

            // Convert entity names and property names to snake_case mapping for PostgreSQL
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                entity.SetTableName(ToSnakeCase(entity.GetTableName() ?? ""));
                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(ToSnakeCase(property.Name));
                }
            }
        }

        private static string ToSnakeCase(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            var result = System.Text.RegularExpressions.Regex.Replace(input, "([a-z0-9])([A-Z])", "$1_$2").ToLower();
            return result;
        }
    }
}
