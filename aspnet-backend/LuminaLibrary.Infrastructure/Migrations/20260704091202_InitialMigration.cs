using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LuminaLibrary.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "authors",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    full_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    biography = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    nationality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_authors", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "class_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    instructor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    time = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    max_capacity = table.Column<int>(type: "int", nullable: false),
                    registered_count = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_schedules", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    tag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    long_description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    location = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    registered_count = table.Column<int>(type: "int", nullable: false),
                    max_capacity = table.Column<int>(type: "int", nullable: false),
                    image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    fee = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    host = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    deadline = table.Column<DateTime>(type: "datetime2", nullable: true),
                    rating = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    code = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    expiry_date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_tokens", x => x.email);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "books",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    isbn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    published_year = table.Column<int>(type: "int", nullable: true),
                    publisher = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    cover_image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    total_copies = table.Column<int>(type: "int", nullable: false),
                    available_copies = table.Column<int>(type: "int", nullable: false),
                    category_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    rating = table.Column<double>(type: "float", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    row_version = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_books", x => x.id);
                    table.ForeignKey(
                        name: "FK_books_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "event_reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    avatar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    time = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    likes = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_reviews", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_reviews_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "event_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    time = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_schedules", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_schedules_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "event_speakers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_speakers", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_speakers_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    full_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    password_hash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    phone_number = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    role_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    is_locked = table.Column<bool>(type: "bit", nullable: false),
                    membership_tier = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                    table.ForeignKey(
                        name: "FK_users_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "book_authors",
                columns: table => new
                {
                    book_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    author_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_book_authors", x => new { x.book_id, x.author_id });
                    table.ForeignKey(
                        name: "FK_book_authors_authors_author_id",
                        column: x => x.author_id,
                        principalTable: "authors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_book_authors_books_book_id",
                        column: x => x.book_id,
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "borrow_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    book_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    approved_by_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    returned_to_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    borrow_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    due_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    return_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    fine_amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    is_fine_paid = table.Column<bool>(type: "bit", nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_borrow_records", x => x.id);
                    table.ForeignKey(
                        name: "FK_borrow_records_books_book_id",
                        column: x => x.book_id,
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_borrow_records_users_approved_by_user_id",
                        column: x => x.approved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_borrow_records_users_returned_to_user_id",
                        column: x => x.returned_to_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_borrow_records_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "class_registrations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    class_schedule_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    registration_date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_registrations", x => x.id);
                    table.ForeignKey(
                        name: "FK_class_registrations_class_schedules_class_schedule_id",
                        column: x => x.class_schedule_id,
                        principalTable: "class_schedules",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_registrations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "event_registrations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    registration_date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_registrations", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_registrations_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_registrations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "librarian_consultations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    librarian_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    time = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ticket_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_librarian_consultations", x => x.id);
                    table.ForeignKey(
                        name: "FK_librarian_consultations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "membership_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    tier_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    payment_method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_membership_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_membership_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    token = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_revoked = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reservations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    book_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    reservation_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    queue_position = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reservations", x => x.id);
                    table.ForeignKey(
                        name: "FK_reservations_books_book_id",
                        column: x => x.book_id,
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reservations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "space_reservations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    space_type = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    time = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ticket_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_space_reservations", x => x.id);
                    table.ForeignKey(
                        name: "FK_space_reservations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "authors",
                columns: new[] { "id", "biography", "created_at", "date_of_birth", "full_name", "nationality" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), "Nhà văn hiện thực xuất sắc của văn học Việt Nam hiện đại", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Nam Cao", null },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), "Nữ nhà văn người Anh, tác giả bộ truyện Harry Potter nổi tiếng toàn cầu", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "J.K. Rowling", null },
                    { new Guid("a0000000-0000-0000-0000-000000000003"), "Nhà báo, nhà văn người Anh nổi tiếng với tiểu thuyết Trại Súc Vật và 1984", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "George Orwell", null },
                    { new Guid("a0000000-0000-0000-0000-000000000004"), "Nhà văn, nhà thuyết trình người Mỹ, tác giả cuốn Đắc Nhân Tâm", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Dale Carnegie", null },
                    { new Guid("a0000000-0000-0000-0000-000000000005"), "Nhà văn Việt Nam nổi tiếng với truyện Dế Mèn Phiêu Lưu Ký", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Tô Hoài", null },
                    { new Guid("a0000000-0000-0000-0000-000000000006"), "Nhà vật lý lý thuyết, vũ trụ học nổi tiếng người Anh", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Stephen Hawking", null },
                    { new Guid("a0000000-0000-0000-0000-000000000007"), "Nhà đầu tư, doanh nhân người Mỹ, nổi tiếng với bộ sách Cha Giàu Cha Nghèo", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Robert Kiyosaki", null },
                    { new Guid("a0000000-0000-0000-0000-000000000008"), "Tác giả người Mỹ, một trong những người sáng lập ra thể loại thành công học", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Napoleon Hill", null }
                });

            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "id", "created_at", "description", "name" },
                values: new object[,]
                {
                    { new Guid("c0000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Các tác phẩm văn học nổi tiếng trong nước qua các thời kỳ", "Văn học Việt Nam" },
                    { new Guid("c0000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tiểu thuyết, truyện ngắn nước ngoài dịch sang tiếng Việt", "Văn học Nước ngoài" },
                    { new Guid("c0000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sách nghiên cứu khoa học, công nghệ thông tin và toán học", "Khoa học & Công nghệ" },
                    { new Guid("c0000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Phát triển bản thân, kỹ năng mềm, tâm lý học ứng dụng", "Kỹ năng sống" },
                    { new Guid("c0000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Kiến thức tài chính, quản trị kinh doanh, khởi nghiệp", "Kinh tế & Đầu tư" }
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "name" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), "Admin" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), "Librarian" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), "Member" }
                });

            migrationBuilder.InsertData(
                table: "books",
                columns: new[] { "id", "available_copies", "category_id", "cover_image_url", "created_at", "description", "isbn", "published_year", "publisher", "rating", "title", "total_copies", "updated_at" },
                values: new object[,]
                {
                    { new Guid("b0000000-0000-0000-0000-000000000001"), 5, new Guid("c0000000-0000-0000-0000-000000000001"), "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tác phẩm hiện thực phê phán kinh điển mô tả số phận bi thảm của người nông dân nghèo trước Cách mạng.", "9786046903251", 1941, "NXB Văn Học", 4.7999999999999998, "Chí Phèo", 5, null },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), 2, new Guid("c0000000-0000-0000-0000-000000000002"), "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tập đầu tiên trong bộ truyện giả tưởng đình đám về cậu bé phù thủy Harry Potter.", "9786045625442", 1997, "NXB Trẻ", 4.9000000000000004, "Harry Potter và Hòn Đá Phù Thủy", 3, null },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), 2, new Guid("c0000000-0000-0000-0000-000000000002"), "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tiểu thuyết phản địa đàng nổi tiếng mô tả một xã hội độc tài kiểm soát tư duy con người.", "9786045654329", 1949, "NXB Hội Nhà Văn", 4.7000000000000002, "Một Chín Tám Tư (1984)", 2, null },
                    { new Guid("b0000000-0000-0000-0000-000000000004"), 9, new Guid("c0000000-0000-0000-0000-000000000004"), "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cuốn sách nghệ thuật ứng xử nổi tiếng nhất mọi thời đại, giúp xây dựng mối quan hệ tốt đẹp.", "9786045883259", 1936, "NXB Tổng Hợp TP.HCM", 4.9000000000000004, "Đắc Nhân Tâm", 10, null },
                    { new Guid("b0000000-0000-0000-0000-000000000005"), 4, new Guid("c0000000-0000-0000-0000-000000000001"), "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Truyện viết cho thiếu nhi vô cùng xuất sắc về hành trình trưởng thành của chú Dế Mèn.", "9786042125345", 1941, "NXB Kim Đồng", 4.5999999999999996, "Dế Mèn Phiêu Lưu Ký", 4, null },
                    { new Guid("b0000000-0000-0000-0000-000000000006"), 4, new Guid("c0000000-0000-0000-0000-000000000002"), "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tác phẩm trào phúng, mượn câu chuyện nông trại để châm biếm các vấn đề chính trị xã hội.", "9786049021235", 1945, "NXB Nhã Nam", 4.5, "Trại Súc Vật", 5, null },
                    { new Guid("b0000000-0000-0000-0000-000000000007"), 2, new Guid("c0000000-0000-0000-0000-000000000003"), "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cuốn sách khoa học đại chúng bán chạy giải thích các khái niệm phức tạp của vật lý thiên văn.", "9786042188241", 1988, "NXB Trẻ", 4.7999999999999998, "Lược Sử Thời Gian", 3, null },
                    { new Guid("b0000000-0000-0000-0000-000000000008"), 5, new Guid("c0000000-0000-0000-0000-000000000005"), "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cuốn sách dạy con về quản lý tài chính cá nhân và tư duy đầu tư làm giàu.", "9786043128912", 1997, "NXB Trẻ", 4.7000000000000002, "Cha Giàu Cha Nghèo", 6, null },
                    { new Guid("b0000000-0000-0000-0000-000000000009"), 4, new Guid("c0000000-0000-0000-0000-000000000005"), "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cẩm nang hướng dẫn cách phát triển tư duy làm giàu và gặt hái thành công cá nhân.", "9786045892534", 1937, "NXB Tổng Hợp TP.HCM", 4.9000000000000004, "Nghĩ Giàu và Làm Giàu", 4, null },
                    { new Guid("b0000000-0000-0000-0000-000000000010"), 1, new Guid("c0000000-0000-0000-0000-000000000001"), "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Truyện ngắn xuất sắc khắc họa cuộc sống khốn cùng và vẻ đẹp tâm hồn của người nông dân Việt Nam.", "9786049512391", 1943, "NXB Văn Học", 4.7999999999999998, "Lão Hạc", 2, null },
                    { new Guid("b0000000-0000-0000-0000-000000000011"), 3, new Guid("c0000000-0000-0000-0000-000000000002"), "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tập hai trong hành trình phiêu lưu đầy kịch tính của Harry Potter tại trường Hogwarts.", "9786045625459", 1998, "NXB Trẻ", 4.9000000000000004, "Harry Potter và Phòng Chứa Bí Mật", 3, null },
                    { new Guid("b0000000-0000-0000-0000-000000000012"), 3, new Guid("c0000000-0000-0000-0000-000000000001"), "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tác phẩm hiện thực sâu sắc lên án chế độ cũ bóp nghẹt tài năng và ước mơ con người.", "9786049512344", 1943, "NXB Văn Học", 4.5999999999999996, "Đời Thừa", 3, null },
                    { new Guid("b0000000-0000-0000-0000-000000000013"), 5, new Guid("c0000000-0000-0000-0000-000000000005"), "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Câu chuyện thần kỳ về sự trỗi dậy mạnh mẽ của nền kinh tế và công nghệ Israel.", "9786045688220", 2009, "NXB Thế Giới", 4.7000000000000002, "Quốc Gia Khởi Nghiệp", 5, null },
                    { new Guid("b0000000-0000-0000-0000-000000000014"), 8, new Guid("c0000000-0000-0000-0000-000000000004"), "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Những câu chuyện ngắn truyền cảm hứng và nghị lực sống phi thường cho người đọc.", "9786045889312", 2002, "NXB Tổng Hợp TP.HCM", 4.7999999999999998, "Hạt Giống Tâm Hồn", 8, null },
                    { new Guid("b0000000-0000-0000-0000-000000000015"), 2, new Guid("c0000000-0000-0000-0000-000000000003"), "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=600", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cuốn sách mở ra góc nhìn sâu sắc và sinh động hơn về bức tranh vũ trụ rộng lớn.", "9786042188258", 2001, "NXB Trẻ", 4.7999999999999998, "Vũ Trụ Trong Vỏ Hạt Dẻ", 2, null }
                });

            migrationBuilder.InsertData(
                table: "book_authors",
                columns: new[] { "author_id", "book_id" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), new Guid("b0000000-0000-0000-0000-000000000001") },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), new Guid("b0000000-0000-0000-0000-000000000002") },
                    { new Guid("a0000000-0000-0000-0000-000000000003"), new Guid("b0000000-0000-0000-0000-000000000003") },
                    { new Guid("a0000000-0000-0000-0000-000000000004"), new Guid("b0000000-0000-0000-0000-000000000004") },
                    { new Guid("a0000000-0000-0000-0000-000000000005"), new Guid("b0000000-0000-0000-0000-000000000005") },
                    { new Guid("a0000000-0000-0000-0000-000000000003"), new Guid("b0000000-0000-0000-0000-000000000006") },
                    { new Guid("a0000000-0000-0000-0000-000000000006"), new Guid("b0000000-0000-0000-0000-000000000007") },
                    { new Guid("a0000000-0000-0000-0000-000000000007"), new Guid("b0000000-0000-0000-0000-000000000008") },
                    { new Guid("a0000000-0000-0000-0000-000000000008"), new Guid("b0000000-0000-0000-0000-000000000009") },
                    { new Guid("a0000000-0000-0000-0000-000000000001"), new Guid("b0000000-0000-0000-0000-000000000010") },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), new Guid("b0000000-0000-0000-0000-000000000011") },
                    { new Guid("a0000000-0000-0000-0000-000000000001"), new Guid("b0000000-0000-0000-0000-000000000012") },
                    { new Guid("a0000000-0000-0000-0000-000000000007"), new Guid("b0000000-0000-0000-0000-000000000013") },
                    { new Guid("a0000000-0000-0000-0000-000000000004"), new Guid("b0000000-0000-0000-0000-000000000014") },
                    { new Guid("a0000000-0000-0000-0000-000000000006"), new Guid("b0000000-0000-0000-0000-000000000015") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_book_authors_author_id",
                table: "book_authors",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "IX_books_category_id",
                table: "books",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_borrow_records_approved_by_user_id",
                table: "borrow_records",
                column: "approved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_borrow_records_book_id",
                table: "borrow_records",
                column: "book_id");

            migrationBuilder.CreateIndex(
                name: "IX_borrow_records_returned_to_user_id",
                table: "borrow_records",
                column: "returned_to_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_borrow_records_user_id",
                table: "borrow_records",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_class_registrations_class_schedule_id_user_id",
                table: "class_registrations",
                columns: new[] { "class_schedule_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_class_registrations_user_id",
                table: "class_registrations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_registrations_event_id_user_id",
                table: "event_registrations",
                columns: new[] { "event_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_event_registrations_user_id",
                table: "event_registrations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_reviews_event_id",
                table: "event_reviews",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_schedules_event_id",
                table: "event_schedules",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_speakers_event_id",
                table: "event_speakers",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_librarian_consultations_user_id",
                table: "librarian_consultations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_membership_requests_user_id",
                table: "membership_requests",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_user_id",
                table: "refresh_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_reservations_book_id",
                table: "reservations",
                column: "book_id");

            migrationBuilder.CreateIndex(
                name: "IX_reservations_user_id",
                table: "reservations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_space_reservations_user_id",
                table: "space_reservations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_role_id",
                table: "users",
                column: "role_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "book_authors");

            migrationBuilder.DropTable(
                name: "borrow_records");

            migrationBuilder.DropTable(
                name: "class_registrations");

            migrationBuilder.DropTable(
                name: "event_registrations");

            migrationBuilder.DropTable(
                name: "event_reviews");

            migrationBuilder.DropTable(
                name: "event_schedules");

            migrationBuilder.DropTable(
                name: "event_speakers");

            migrationBuilder.DropTable(
                name: "librarian_consultations");

            migrationBuilder.DropTable(
                name: "membership_requests");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "reservations");

            migrationBuilder.DropTable(
                name: "space_reservations");

            migrationBuilder.DropTable(
                name: "authors");

            migrationBuilder.DropTable(
                name: "class_schedules");

            migrationBuilder.DropTable(
                name: "events");

            migrationBuilder.DropTable(
                name: "books");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
